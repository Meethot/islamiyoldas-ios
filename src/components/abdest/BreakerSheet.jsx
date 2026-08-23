import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls, useReducedMotion } from 'framer-motion';
import { ChevronLeft, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import { analytics } from '@/services/analyticsService';
import { BREAKERS, POPULAR, VERDICT, VERDICT_ORDER, scoreMatch, byRelevance } from '@/data/wuduBreakers';
import { VERDICT_DOT, VERDICT_PILL, VERDICT_BAND } from '@/lib/verdictStyle';

const MIN_QUERY = 2;
const SEARCH_EVENT_DELAY = 600;

const ICON_BTN = 'flex h-10 w-10 items-center justify-center rounded-full text-stone-500 transition-colors active:bg-black/[0.05] dark:text-emerald-100/70 dark:active:bg-white/10';

/**
 * Üç durumun görsel dili.
 *
 * Gündüz temasında yeşil YOK (uygulama geneli kural), o yüzden "bozmaz"
 * yeşille değil koyu nötr zeminle anlatılır — kehribar "bozar"a ayrılmıştır.
 * Renk tek başına taşıyıcı değil: her kartta hükmün adı yazılı durur.
 */
const VERDICT_STYLE = {
    [VERDICT.BREAKS]: 'bg-[#B45309] text-white dark:bg-islamic-gold dark:text-[#032e18]',
    [VERDICT.KEEPS]: 'bg-[#2A2620] text-[#F4EEDF] dark:bg-white/[0.09] dark:text-emerald-50',
    [VERDICT.DEPENDS]: 'border-2 border-dashed border-[#B45309]/55 bg-[#FFFDF6] text-stone-900 dark:border-islamic-gold/55 dark:bg-white/5 dark:text-emerald-50',
};

const CHIP = 'rounded-full border border-[#E2D9C4] bg-[#FFFDF6] px-3 py-1.5 text-[0.75rem] font-semibold text-stone-600 active:bg-black/[0.04] dark:border-white/[0.08] dark:bg-white/5 dark:text-emerald-100/70';

/** Bölüm başlığı: hükmün rengi + sağda sayısı. */
function Band({ hukum, count }) {
    const { t } = useTranslation('learn');
    return (
        <p className={cn('mb-2 flex items-center px-1 text-[0.625rem] font-extrabold uppercase tracking-[0.16em]', VERDICT_BAND[hukum])}>
            <span>{t(`verdict.${hukum}`)}</span>
            <span className="ms-auto font-bold tabular-nums tracking-normal opacity-70">{count}</span>
        </p>
    );
}

/** Büyük cevap kartı. */
function Verdict({ item }) {
    const { t } = useTranslation('learn');
    const safii = t(`breakers.${item.id}.safii`, { defaultValue: '' });
    return (
        <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16 }}
            className={cn('rounded-2xl p-4', VERDICT_STYLE[item.hukum])}
        >
            <p className="font-display text-[1.25rem] font-extrabold leading-tight tracking-tight">
                {t(`verdict.${item.hukum}`)}
            </p>
            <p className="mt-1.5 text-[0.875rem] font-semibold leading-snug opacity-95">
                {t(`breakers.${item.id}.title`)}
            </p>
            <p className="mt-2 text-[0.8125rem] leading-relaxed opacity-90">
                {t(`breakers.${item.id}.body`)}
            </p>
            {safii && (
                <p className={cn(
                    'mt-3 border-t pt-2.5 text-[0.75rem] leading-relaxed',
                    item.hukum === VERDICT.DEPENDS
                        ? 'border-[#B45309]/25 font-semibold text-[#92400E] dark:border-islamic-gold/25 dark:text-islamic-gold'
                        : 'border-white/25 opacity-85'
                )}>
                    {safii}
                </p>
            )}
        </motion.div>
    );
}

/**
 * Kompakt sonuç satırı — solda hüküm noktası, sağda hüküm pili.
 *
 * `pill`: hüküm YAZILI olarak da gösterilsin mi. Arama sonuçları karışık
 * geldiği için orada şart. Gruplu listede üstteki bant zaten hükmü söylüyor;
 * aynı kelimeyi 20 satır tekrar etmek hem gürültü, hem Almanca gibi uzun
 * dillerde başlığı kırpıyor. Pili gizlenince hüküm ekran okuyucuya
 * `sr-only` ile verilir — renk asla tek taşıyıcı olmaz.
 */
function Row({ item, active = false, onSelect, pill = true }) {
    const { t } = useTranslation('learn');
    return (
        <button
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
                'flex w-full items-center gap-2.5 border-t border-[#F0E8D5] px-4 py-3 text-start first:border-t-0 transition-colors active:bg-black/[0.04] dark:border-white/[0.06] dark:active:bg-white/10',
                active && 'bg-[#B45309]/[0.06] dark:bg-islamic-gold/[0.08]'
            )}
        >
            <span aria-hidden="true" className={cn('h-2 w-2 shrink-0 rounded-full', VERDICT_DOT[item.hukum])} />
            <span className="min-w-0 flex-1 truncate font-display text-[0.875rem] font-semibold text-stone-800 dark:text-emerald-50">
                {t(`breakers.${item.id}.title`)}
            </span>
            {pill ? (
                <span className={cn(
                    'shrink-0 whitespace-nowrap rounded-full px-2 py-[0.1875rem] text-[0.625rem] font-extrabold uppercase tracking-[0.06em]',
                    VERDICT_PILL[item.hukum]
                )}>
                    {t(`verdict.${item.hukum}`)}
                </span>
            ) : (
                <span className="sr-only">{t(`verdict.${item.hukum}`)}</span>
            )}
        </button>
    );
}

/**
 * "Bozar mı?" — bölümün kalbi.
 *
 * Liste değil ALET: kullanıcı yazar, cevabı görür. Üç durum vardır çünkü
 * uyku, kusma ve kanamanın hepsi şarta bağlıdır; "bozar/bozmaz" ikilisi
 * yalan söylerdi.
 *
 * Route DEĞİL, tabaka: `useSmartPaywall` her route değişiminde sayaç artırıyor.
 */
function BreakerBody({ initialId }) {
    const { t, i18n } = useTranslation('learn');
    const { light } = useHaptics();
    const inputRef = useRef(null);
    const searchTimerRef = useRef(null);
    const [query, setQuery] = useState('');
    // Merkez aramasından gelindiyse cevap kartı o maddeyle açılır.
    const [pickedId, setPickedId] = useState(initialId || null);

    useEffect(() => () => clearTimeout(searchTimerRef.current), []);

    /** Arama gövdesi tek seferde kurulur (her tuşta 41 maddeyi normalize etme). */
    const items = useMemo(() => {
        const lang = i18n.language?.split('-')[0] || 'tr';
        return BREAKERS.map(b => {
            // Takma adlar altı dilde de var. Türkçe olanlar diğer dillere de
            // eklenir: zararsız fazladan eşleşme sağlar (Türkçe bilen kullanıcı
            // uygulamayı başka dilde kullanıyor olabilir).
            const aliases = [
                ...(b.aliases?.[lang] || []),
                ...(lang === 'tr' ? [] : (b.aliases?.tr || [])),
            ];
            return {
                ...b,
                title: t(`breakers.${b.id}.title`),
                body: t(`breakers.${b.id}.body`),
                aliasList: aliases,
            };
        });
    }, [i18n.language, t]);

    const byId = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);

    const trimmed = query.trim();
    const searching = trimmed.length >= MIN_QUERY;

    /**
     * Sonuçlar PUANA göre sıralanır: başlık ve takma ad eşleşmesi gövde
     * eşleşmesini yener. Sırasız hâlde "kan" araması ilk sırada alakasız bir
     * maddeyi büyük cevap kartına oturtuyordu.
     */
    const results = useMemo(() => {
        if (!searching) return null;
        return items
            .map(i => ({ item: i, title: i.title, score: scoreMatch({ title: i.title, aliases: i.aliasList, body: i.body }, trimmed) }))
            .filter(x => x.score > 0)
            .sort(byRelevance)
            .map(x => x.item);
    }, [searching, trimmed, items]);

    useEffect(() => {
        if (!searching || !results) return;
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            analytics.breakerSearched(trimmed.length, results.length);
        }, SEARCH_EVENT_DELAY);
    }, [searching, trimmed, results]);

    // Seçim aramaya bağlı: yeni sorguda ilk sonuca döner, kullanıcı
    // listeden başkasını seçerse o kalır.
    const picked = (pickedId && byId.get(pickedId)) || null;
    const shown = picked && (!results || results.includes(picked))
        ? picked
        : (results && results[0]) || null;

    const onQueryChange = useCallback((e) => {
        setQuery(e.target.value);
        setPickedId(null);
    }, []);

    const select = useCallback((item) => {
        light();
        setPickedId(item.id);
        analytics.breakerOpened(item.id, item.hukum);
    }, [light]);

    const pickChip = useCallback((item) => {
        light();
        setQuery(t(`breakers.${item.id}.title`));
        setPickedId(item.id);
        analytics.breakerOpened(item.id, item.hukum);
    }, [light, t]);

    const groups = useMemo(
        () => VERDICT_ORDER.map(v => ({ hukum: v, list: items.filter(i => i.hukum === v) })).filter(g => g.list.length),
        [items]
    );

    return (
        <>
            <div className="flex h-11 items-center gap-2.5 rounded-2xl bg-[#F0E8D5] px-3.5 dark:bg-white/[0.06]">
                <Search className="h-4 w-4 shrink-0 text-black/45 dark:text-emerald-100/45" />
                <input
                    ref={inputRef}
                    type="search"
                    inputMode="search"
                    enterKeyHint="search"
                    value={query}
                    onChange={onQueryChange}
                    onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.blur(); }}
                    placeholder={t('breakerSearchPlaceholder')}
                    aria-label={t('breakerSearchPlaceholder')}
                    className="min-w-0 flex-1 truncate bg-transparent text-[0.9375rem] text-stone-800 outline-none placeholder:text-black/45 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none dark:text-emerald-50 dark:placeholder:text-emerald-100/45"
                />
                {query.length > 0 && (
                    <button
                        type="button"
                        onClick={() => { setQuery(''); setPickedId(null); inputRef.current?.blur(); }}
                        aria-label={t('duaSearchClear')}
                        className="-me-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/45 active:bg-black/[0.06] dark:text-emerald-100/50 dark:active:bg-white/10"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {shown && <Verdict key={shown.id} item={shown} />}
            </AnimatePresence>

            {searching && results.length === 0 && (
                <div className="px-2 pt-8 text-center">
                    <p className="font-display text-[0.9375rem] font-semibold text-stone-700 dark:text-emerald-100/80">
                        {t('breakerEmptyTitle', { query: trimmed })}
                    </p>
                    <p className="mt-1.5 text-[0.8125rem] text-black/55 dark:text-emerald-100/55">
                        {t('breakerEmptyHint')}
                    </p>
                </div>
            )}

            {searching && results.length > 1 && (
                <div className="overflow-hidden rounded-2xl border border-[#E2D9C4] bg-[#FFFDF6] dark:border-white/[0.08] dark:bg-white/5">
                    {results.filter(r => r.id !== shown?.id).map(item => (
                        <Row key={item.id} item={item} onSelect={select} />
                    ))}
                </div>
            )}

            {!searching && (
                <>
                    <div>
                        <p className="mb-2 px-1 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-black/40 dark:text-emerald-100/40">
                            {t('breakerPopular')}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {POPULAR.map(id => byId.get(id)).filter(Boolean).map(item => (
                                <button key={item.id} type="button" onClick={() => pickChip(item)} className={CHIP}>
                                    {t(`breakers.${item.id}.title`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {groups.map(group => (
                        <div key={group.hukum}>
                            <Band hukum={group.hukum} count={group.list.length} />
                            <div className="overflow-hidden rounded-2xl border border-[#E2D9C4] bg-[#FFFDF6] dark:border-white/[0.08] dark:bg-white/5">
                                {group.list.map(item => (
                                    <Row key={item.id} item={item} active={shown?.id === item.id} onSelect={select} pill={false} />
                                ))}
                            </div>
                        </div>
                    ))}
                </>
            )}

            <p className="px-1 pt-2 text-[0.6875rem] leading-relaxed text-black/40 dark:text-emerald-100/35">
                {t('breakerDisclaimer')}
            </p>
        </>
    );
}

export default function BreakerSheet({ open, initialId = null, isRtl, onClose }) {
    const { t } = useTranslation('learn');
    const dragControls = useDragControls();
    const reduceMotion = useReducedMotion();

    useHardwareBack(open, onClose);

    useEffect(() => {
        if (!open) return undefined;
        const el = document.getElementById('main-scroll-container');
        if (!el) return undefined;
        const saved = el.scrollTop;
        el.style.overflow = 'hidden';
        return () => {
            el.style.overflow = '';
            requestAnimationFrame(() => { el.scrollTop = saved; });
        };
    }, [open]);

    const spring = reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 34 };
    const fade = reduceMotion ? { duration: 0 } : { duration: 0.16, ease: 'easeOut' };

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div className="fixed inset-0 z-[100]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>
                    <div className="absolute inset-0 bg-black/50" onClick={onClose} />

                    <motion.div
                        data-sheet
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('topicBreakers')}
                        className="absolute inset-x-0 bottom-0 flex h-[92vh] flex-col rounded-t-[2rem] bg-[#F6F0E1] shadow-[0_-8px_40px_-10px_rgba(0,0,0,0.35)] dark:bg-[#032e18]"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%', transition: reduceMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeIn' } }}
                        transition={spring}
                        drag="y"
                        dragListener={false}
                        dragControls={dragControls}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.4 }}
                        onDragEnd={(_e, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose(); }}
                    >
                        <div className="shrink-0 cursor-grab touch-none pt-3 pb-1" onPointerDown={(e) => dragControls.start(e)}>
                            <div className="mx-auto h-1 w-10 rounded-full bg-[#E2D9C4] dark:bg-white/15" />
                        </div>

                        <div className="flex shrink-0 items-center gap-1 px-3 pb-1">
                            <button type="button" onClick={onClose} aria-label={t('duaClose')} className={ICON_BTN}>
                                <ChevronLeft className={cn('h-5 w-5', isRtl && 'rotate-180')} />
                            </button>
                            <span className="truncate font-display text-[1.0625rem] font-bold text-stone-800 dark:text-emerald-50">
                                {t('topicBreakers')}
                            </span>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 pb-10 pt-2">
                            <BreakerBody initialId={initialId} />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
