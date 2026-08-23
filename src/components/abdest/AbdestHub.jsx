import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';
import { analytics } from '@/services/analyticsService';
import { MihrabArch } from '@/components/dua/DuaRow';
import { BREAKERS, scoreMatch, byRelevance } from '@/data/wuduBreakers';
import { VERDICT_DOT } from '@/lib/verdictStyle';
import { ABDEST_TOPICS, MESH_SECTIONS } from '@/data/abdestTopics';

const MIN_QUERY = 2;
const SEARCH_EVENT_DELAY = 600;
const MAX_HITS = 12;


/** Arapça şerit tek satırda kalır; taşan kısım kesilmez, söner (DuaRow kalıbı). */
const FADE = {
    WebkitMaskImage: 'linear-gradient(to left, #000 62%, transparent 100%)',
    maskImage: 'linear-gradient(to left, #000 62%, transparent 100%)',
};

/** Tek konu kartı — dua kartıyla aynı mihrap dili. */
function TopicCard({ topic, badge, onOpen }) {
    const { t } = useTranslation('learn');
    return (
        <button
            type="button"
            onClick={() => onOpen(topic)}
            className="relative w-full overflow-hidden rounded-2xl border border-[#B45309]/25 bg-[linear-gradient(160deg,#FFFDF6_0%,#F4EBD8_100%)] p-4 text-start transition-transform duration-100 active:scale-[0.985] dark:border-islamic-gold/30 dark:bg-[linear-gradient(160deg,#073b21_0%,#04240f_100%)]"
        >
            <MihrabArch className="pointer-events-none absolute -top-3 -end-2 h-[6rem] w-[4.75rem] text-[#92400E]/25 opacity-45 dark:text-islamic-gold/35" />

            <span
                dir="rtl"
                lang="ar"
                style={FADE}
                className="block overflow-hidden whitespace-nowrap ps-14 font-arabic text-[1.1875rem] leading-[2] text-[#92400E] dark:text-islamic-gold"
            >
                {topic.arabic}
            </span>

            <span className="my-[0.7rem] block h-px bg-gradient-to-r from-[#92400E]/35 to-transparent rtl:bg-gradient-to-l dark:from-islamic-gold/45" />

            <span className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                    <span className="block font-display text-[0.9375rem] font-semibold leading-snug text-stone-800 dark:text-white">
                        {t(topic.titleKey)}
                    </span>
                    <span className="mt-1 block text-[0.78125rem] leading-snug line-clamp-1 text-black/45 dark:text-emerald-100/45">
                        {t(topic.subKey)}
                    </span>
                </span>

                {/* Kalan süre rozeti karta gömülü — ayrı satır olsaydı mest
                    giymeyen çoğunluk için kalıcı krom olurdu. */}
                {badge && (
                    <span className="shrink-0 rounded-full border border-[#B45309]/25 bg-[#B45309]/10 px-2 py-0.5 text-[0.6875rem] font-bold tabular-nums text-[#B45309] dark:border-islamic-gold/30 dark:bg-islamic-gold/15 dark:text-islamic-gold">
                        {badge}
                    </span>
                )}
            </span>
        </button>
    );
}

/**
 * Öğren > Abdest — "Abdest ve Temizlik" merkezi.
 *
 * Sihirbaz burada değil: konu kartına dokununca Learn.jsx mevcut sihirbazı
 * o konunun verisiyle açar. Böylece gusül ve teyemmüm sıfır yeni bileşenle
 * gelir. Tabakalar (Bozar mı? / Mesh) route DEĞİL — `useSmartPaywall` her
 * route değişiminde sayaç artırıyor, konu gezen kullanıcı paywall yerdi.
 *
 * @param {object} guides   dil çözülmüş rehber sözlüğü (abdest/gusul/teyemmum)
 * @param {string|null} meshBadge  mest süresi işliyorsa kalan süre metni
 * @param {(topic, stepIndex?) => void} onOpen
 */
export default function AbdestHub({ guides, meshBadge = null, onOpen }) {
    const { t } = useTranslation('learn');
    const { light } = useHaptics();
    const inputRef = useRef(null);
    const searchTimerRef = useRef(null);
    const [query, setQuery] = useState('');

    /**
     * Verisi olmayan rehber konusu hiç gösterilmez.
     * Aksi hâlde kart açılır, sihirbaz "0 / 0" boş kart çizerdi. Faz faz
     * yayınlarken ve bir dil dosyasında konu eksik kalırsa koruma budur.
     */
    const topics = useMemo(
        () => ABDEST_TOPICS.filter(tp => tp.kind !== 'guide' || (guides?.[tp.id]?.steps?.length || 0) > 0),
        [guides]
    );

    useEffect(() => () => clearTimeout(searchTimerRef.current), []);

    /**
     * Arama indeksi bölümün TAMAMINI kapsar: konu adları, rehber adımları ve
     * "Bozar mı?" maddeleri. Merkez arama kutusu bölümün indeksidir — bozanlar
     * dışarıda kalsaydı "kan" yazan kullanıcı hiç sonuç görmezdi.
     */
    const index = useMemo(() => {
        const out = [];
        const breakerTopic = topics.find(tp => tp.id === 'breakers');
        for (const topic of topics) {
            out.push({
                topic,
                stepIndex: -1,
                breakerId: null,
                sectionId: null,
                label: t(topic.titleKey),
                aliases: [],
                body: t(topic.subKey),
                sub: t(topic.subKey),
            });
            // Mesh'in fıkıh bölümleri bölümün en yoğun metni: "alçı", "bandaj",
            // "seferi", "24 saat", "topuk" gibi soruların cevabı yalnız burada
            // yazıyor. İndekse alınmadan önce bu sorgular hiç sonuç vermiyordu.
            if (topic.id === 'mesh') {
                for (const sec of MESH_SECTIONS) {
                    out.push({
                        topic,
                        stepIndex: -1,
                        breakerId: null,
                        sectionId: sec,
                        label: t(`mesh.sections.${sec}.title`),
                        aliases: [],
                        body: [t(`mesh.sections.${sec}.body`), t(`mesh.sections.${sec}.safii`, { defaultValue: '' })].join(' '),
                        sub: t(topic.titleKey),
                    });
                }
            }
            if (topic.kind !== 'guide') continue;
            const steps = guides?.[topic.id]?.steps || [];
            steps.forEach((step, i) => {
                out.push({
                    topic,
                    stepIndex: i,
                    breakerId: null,
                    sectionId: null,
                    label: step.title,
                    aliases: [],
                    body: [step.instruction, (step.tips || []).join(' ')].filter(Boolean).join(' '),
                    sub: t(topic.titleKey),
                });
            });
        }
        if (breakerTopic) {
            for (const b of BREAKERS) {
                out.push({
                    topic: breakerTopic,
                    stepIndex: -1,
                    breakerId: b.id,
                    sectionId: null,
                    hukum: b.hukum,
                    label: t(`breakers.${b.id}.title`),
                    aliases: b.aliases?.tr || [],
                    body: t(`breakers.${b.id}.body`),
                    sub: t(`verdict.${b.hukum}`),
                });
            }
        }
        return out;
    }, [guides, topics, t]);

    const trimmed = query.trim();
    const searching = trimmed.length >= MIN_QUERY;

    /** Puana göre sıralanır: başlık ve takma ad eşleşmesi gövdeyi yener. */
    const hits = useMemo(() => {
        if (!searching) return null;
        return index
            .map(i => ({ i, title: i.label, score: scoreMatch({ title: i.label, aliases: i.aliases, body: i.body }, trimmed) }))
            .filter(x => x.score > 0)
            .sort(byRelevance)
            .slice(0, MAX_HITS)
            .map(x => x.i);
    }, [searching, trimmed, index]);

    // Analytics: her tuş vuruşu değil, kullanıcı yazmayı bırakınca
    useEffect(() => {
        if (!searching || !hits) return;
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            analytics.abdestSearched(trimmed.length, hits.length);
        }, SEARCH_EVENT_DELAY);
    }, [searching, trimmed, hits]);

    const openTopic = useCallback((topic, stepIndex = -1, breakerId = null, sectionId = null) => {
        light();
        analytics.abdestTopicOpened(topic.id, stepIndex >= 0 || breakerId || sectionId ? 'search' : 'hub');
        if (breakerId) {
            const hit = BREAKERS.find(b => b.id === breakerId);
            if (hit) analytics.breakerOpened(hit.id, hit.hukum);
        }
        onOpen(topic, stepIndex, breakerId, sectionId);
    }, [light, onOpen]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex h-11 items-center gap-2.5 rounded-2xl bg-[#F0E8D5] px-3.5 dark:bg-white/[0.06]">
                <Search className="h-4 w-4 shrink-0 text-black/45 dark:text-emerald-100/45" />
                <input
                    ref={inputRef}
                    type="search"
                    inputMode="search"
                    enterKeyHint="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.blur(); }}
                    placeholder={t('abdestSearchPlaceholder')}
                    aria-label={t('abdestSearchPlaceholder')}
                    className="min-w-0 flex-1 truncate bg-transparent text-[0.9375rem] text-stone-800 outline-none placeholder:text-black/45 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none dark:text-emerald-50 dark:placeholder:text-emerald-100/45"
                />
                {query.length > 0 && (
                    <button
                        type="button"
                        onClick={() => { setQuery(''); inputRef.current?.blur(); }}
                        aria-label={t('duaSearchClear')}
                        className="-me-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/45 active:bg-black/[0.06] dark:text-emerald-100/50 dark:active:bg-white/10"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {searching ? (
                hits.length === 0 ? (
                    <div className="px-2 pt-10 text-center">
                        <p className="font-display text-[0.9375rem] font-semibold text-stone-700 dark:text-emerald-100/80">
                            {t('duaEmptyTitle', { query: trimmed })}
                        </p>
                        <p className="mt-1.5 text-[0.8125rem] text-black/55 dark:text-emerald-100/55">
                            {t('duaEmptyHint')}
                        </p>
                    </div>
                ) : (
                    <div role="list" className="overflow-hidden rounded-2xl border border-[#E2D9C4] bg-[#FFFDF6] dark:border-white/[0.08] dark:bg-white/5">
                        {hits.map((hit) => (
                            /* role="listitem" butonun KENDİSİNE konmaz — buton rolünü
                               ezer ve ekran okuyucu tıklanabilir olduğunu söylemez.
                               DuaLibrary'deki kalıp: saran div taşır. */
                            <div
                                role="listitem"
                                key={`${hit.topic.id}-${hit.stepIndex}-${hit.breakerId || ''}-${hit.sectionId || ''}`}
                                className="border-t border-[#F0E8D5] first:border-t-0 dark:border-white/[0.06]"
                            >
                            <button
                                type="button"
                                onClick={() => openTopic(hit.topic, hit.stepIndex, hit.breakerId, hit.sectionId)}
                                className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors active:bg-black/[0.04] dark:active:bg-white/10"
                            >
                                {/* Hüküm noktası "Bozar mı?" tabakasındakiyle aynı dil.
                                    Renk tek taşıyıcı değil: hükmün adı alt satırda yazılı. */}
                                {hit.hukum && (
                                    <span aria-hidden="true" className={cn('h-2 w-2 shrink-0 rounded-full', VERDICT_DOT[hit.hukum])} />
                                )}
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-display text-[0.875rem] font-semibold text-stone-800 dark:text-emerald-50">
                                        {hit.label}
                                    </span>
                                    <span className="block truncate text-[0.75rem] text-black/45 dark:text-emerald-100/45">
                                        {hit.sub}
                                    </span>
                                </span>
                            </button>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div className="flex flex-col gap-2.5">
                    {topics.map(topic => (
                        <TopicCard
                            key={topic.id}
                            topic={topic}
                            badge={topic.id === 'mesh' ? meshBadge : null}
                            onOpen={openTopic}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
