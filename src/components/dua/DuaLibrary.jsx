import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, X, ChevronRight, ChevronLeft, Heart, BookHeart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import { isPremium } from '@/services/creditService';
import { storageService } from '@/services/storageService';
import { analytics } from '@/services/analyticsService';
import { duaKey, duaMeta, DUA_GROUP_ORDER, DUA_GROUP_LABEL_KEY } from '@/data/duaTags';
import DuaRow from './DuaRow';
import DuaSheet from './DuaSheet';
import HintCoach from '@/components/HintCoach';
import { readSeenHints, markHintSeen } from '@/lib/hints';

const FAV_KEY = 'dua_favorites';
const MIN_QUERY = 2;
const MAX_RELATED = 4;
const SEARCH_EVENT_DELAY = 600;

// Tek seferlik ipuçları (HintCoach). Raf ekranında üç adım, dua tabakası ilk kez
// açıldığında bir adım daha. Hedef DOM'da yoksa ipucu sessizce iptal olur ve
// "görüldü" yazılmaz. Ortak kayıt + test bayrağı: src/lib/hints.js
const SHELF_HINTS = [
    { id: 'learn:duaSearch', target: 'dua-search', titleKey: 'tour.search.title', bodyKey: 'tour.search.body', icon: Search },
    { id: 'learn:duaShelf', target: 'dua-shelf', titleKey: 'tour.shelf.title', bodyKey: 'tour.shelf.body', icon: BookHeart },
    { id: 'learn:duaSeeAll', target: 'dua-seeall', titleKey: 'tour.seeAll.title', bodyKey: 'tour.seeAll.body', icon: ChevronRight },
];

const SHEET_HINTS = [
    { id: 'learn:duaFavorite', target: 'dua-favorite', titleKey: 'tour.favorite.title', bodyKey: 'tour.favorite.body', icon: Heart },
];

const nextHint = (chain, seen, after = -1) => chain.findIndex((h, i) => i > after && !seen[h.id]);

/**
 * Aksan/büyük-küçük/apostrof duyarsız arama normalizasyonu.
 * Quran.jsx'teki kalıbın aynısı — "FATIHA" → fatiha, "A'râf" → araf.
 */
const normalizeSearch = (s) => (s || '')
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .replace(/['’ʼ-]/g, '');

function readFavorites() {
    try {
        const raw = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
        return Array.isArray(raw) ? raw.filter(x => typeof x === 'string') : [];
    } catch {
        return [];
    }
}

/**
 * Bölüm başlığı ikon kutusu DEĞİL, tipografi + altın tel.
 *
 * Kullanıcı kararı (2026-08-18): hazır ikon setinden gelen güneş/kalkan/ay
 * simgeleri her uygulamada aynı görünüyor. Yerine dua kartındaki altın ayraç
 * çizgisinin aynısı kullanılır — bölüm başlığı kartların diliyle konuşur.
 */
const GoldRule = ({ className }) => (
    <span
        aria-hidden="true"
        className={cn(
            'h-px flex-1 bg-gradient-to-r from-[#B45309]/35 to-transparent rtl:bg-gradient-to-l dark:from-islamic-gold/35',
            className
        )}
    />
);

/**
 * Öğren > Dualar — "raf".
 *
 * 70 dua niyete göre 7 bölümde durur. Her bölüm kendi yatay rafında: bölüm
 * adları dikey kaydırma boyunca ekranda kalır, dualar yana kayar. "Tümü" o
 * bölümün dikey listesini açar (route DEĞİL — aşağıdaki nota bak).
 * "Adım 1/70", "ileri" ve "geri" kavramları burada yoktur; sıralı sihirbaz
 * abdest/namaz gibi gerçekten prosedürel rehberlerde kalır.
 */
export default function DuaLibrary({ duas, isRtl }) {
    const { t, i18n } = useTranslation('learn');
    const navigate = useNavigate();
    const { light, selection } = useHaptics();
    const inputRef = useRef(null);
    const searchTimerRef = useRef(null);
    const shelfScrollRef = useRef(0);

    const [query, setQuery] = useState('');
    const [groupId, setGroupId] = useState(null);
    const [openKey, setOpenKey] = useState(null);
    const [favorites, setFavorites] = useState(readFavorites);
    const [hasPremium, setHasPremium] = useState(() => isPremium());

    // Satın alma sonrası ekran kilitli kalmasın (mevcut Learn bunu dinlemiyordu)
    useEffect(() => {
        const sync = () => setHasPremium(isPremium());
        window.addEventListener('premiumStatusChanged', sync);
        return () => window.removeEventListener('premiumStatusChanged', sync);
    }, []);

    useEffect(() => () => clearTimeout(searchTimerRef.current), []);

    /**
     * Dua başına türetilen her şey tek seferde hesaplanır. Arama, gruplama ve
     * favori çözümlemesi hep bu diziyi okur — aksi hâlde her tuş vuruşunda
     * 70 duanın Arapça normalizasyonu baştan çalışırdı.
     */
    const items = useMemo(() => {
        const lang = i18n.language?.split('-')[0] || 'tr';
        return (duas || []).map(dua => {
            const key = duaKey(dua.arabic);
            const meta = duaMeta(dua.arabic);
            const groupLabel = t(DUA_GROUP_LABEL_KEY[meta.group] || 'groupOther');
            const aliases = [
                ...(meta.aliases?.[lang] || []),
                ...(lang === 'tr' ? [] : (meta.aliases?.tr || [])),
                ...(meta.aliases?.en || []),
            ];
            return {
                dua,
                key,
                group: meta.group,
                free: !!meta.free,
                blob: normalizeSearch([
                    dua.title, dua.instruction, dua.transcription, dua.meaning, groupLabel, ...aliases,
                ].filter(Boolean).join(' ')),
            };
        });
    }, [duas, i18n.language, t]);

    // Yeni dua eklenip etiketlenmeyi unutursa sessizce "Diğer"e düşmesin
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        const untagged = items.filter(i => i.group === 'other');
        if (untagged.length) console.warn('[dualar] gruplanmamış:', untagged.map(i => i.dua.title));
    }, [items]);

    const byKey = useMemo(() => new Map(items.map(i => [i.key, i])), [items]);
    const favSet = useMemo(() => new Set(favorites), [favorites]);

    const lockedCount = useMemo(() => items.filter(i => !i.free).length, [items]);

    const trimmed = query.trim();
    const searching = trimmed.length >= MIN_QUERY;
    const searchingRef = useRef(searching);
    useEffect(() => { searchingRef.current = searching; }, [searching]);

    const results = useMemo(() => {
        if (!searching) return null;
        const q = normalizeSearch(trimmed);
        return items.filter(i => i.blob.includes(q));
    }, [searching, trimmed, items]);

    /** Arama sonucunda da bölüm başlıkları korunur — düz 70'lik yığına dönmesin. */
    const sections = useMemo(() => {
        const pool = results ?? items;
        const out = [];
        if (!searching) {
            const favs = items.filter(i => favSet.has(i.key));
            if (favs.length) out.push({ id: 'fav', labelKey: 'duaFavorites', items: favs });
        }
        for (const group of DUA_GROUP_ORDER) {
            const list = pool.filter(i => i.group === group);
            if (list.length) {
                out.push({ id: group, labelKey: DUA_GROUP_LABEL_KEY[group], items: list });
            }
        }
        return out;
    }, [results, items, searching, favSet]);

    // Analytics: her tuş vuruşu değil, kullanıcı yazmayı bırakınca
    useEffect(() => {
        if (!searching || !results) return;
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            analytics.duaSearched(trimmed.length, results.length);
        }, SEARCH_EVENT_DELAY);
    }, [searching, trimmed, results]);

    const openItem = byKey.get(openKey) || null;

    // ── Tek seferlik ipuçları ─────────────────────────────────────────────
    // Raf ekranı ve dua tabakası ayrı zincirler; sıra KİMLİKLE tutulur, çünkü
    // tabaka açılıp kapanınca zincir değişiyor (index taşınırsa yanlış ipucu çıkar).
    const [seenHints, setSeenHints] = useState(readSeenHints);
    const [hintId, setHintId] = useState(null);
    const hintTimerRef = useRef(null);
    const hintChain = openKey ? SHEET_HINTS : SHELF_HINTS;
    // Arama yazılırken raflar dikey listeye dönüyor; ipucu hedefleri kayar
    const hintsReady = items.length > 0 && !searching && !groupId;

    // Ekranda duran ipucunun kimliği — bağlam değişince "görüldü" yazmak için
    const shownHintRef = useRef(null);
    useEffect(() => { shownHintRef.current = hintId; }, [hintId]);

    useEffect(() => {
        // Eski ipucu ayrıca sıfırlanmaz: kimlik yeni zincirde bulunamayınca
        // `queuedHint` zaten null döner (bkz. aşağıdaki türetme).
        const chain = openKey ? SHEET_HINTS : SHELF_HINTS;
        const idle = !hintsReady && !openKey;
        const first = idle ? -1 : nextHint(chain, readSeenHints());
        // Tabaka yay animasyonu / raf render'ı otursun
        const timer = first === -1 ? null : setTimeout(() => setHintId(chain[first].id), openKey ? 700 : 800);
        return () => {
            if (timer) clearTimeout(timer);
            clearTimeout(hintTimerRef.current);
            // Balon kullanıcı kapatmadan düştü. "Görüldü" yazılmazsa bağlam geri
            // gelince aynı ipucu baştan çıkar (kullanıcı raporu 2026-08-18).
            const shown = shownHintRef.current;
            if (shown && chain.some(h => h.id === shown)) {
                setSeenHints(markHintSeen(shown));
                shownHintRef.current = null;
                setHintId(null);
            }
        };
    }, [openKey, hintsReady]);

    const closeHint = useCallback((markSeen = true) => {
        const index = hintId ? hintChain.findIndex(h => h.id === hintId) : -1;
        if (index < 0) return;
        // markHintSeen TEST modunda hiçbir şey yazmaz (bkz. lib/hints.js)
        const nextSeen = markSeen ? markHintSeen(hintChain[index].id) : seenHints;
        setSeenHints(nextSeen);
        setHintId(null);
        const nextIdx = nextHint(hintChain, nextSeen, index);
        if (nextIdx >= 0) {
            clearTimeout(hintTimerRef.current);
            // Kısa geçiş: uzun boşluk "tur bitti" hissi veriyordu
            hintTimerRef.current = setTimeout(() => setHintId(hintChain[nextIdx].id), 180);
        }
    }, [hintChain, hintId, seenHints]);

    // Raf ipuçları yalnız raf görünürken; arama yazılınca ya da bölüm sayfası
    // açılınca hedefler (yatay raf, "Tümü") DOM'dan kalkıyor.
    const queuedHint = hintId ? hintChain.find(h => h.id === hintId) : null;
    const activeHint = queuedHint && (openKey ? true : hintsReady) ? queuedHint : null;

    /** Açık bölüm sayfası. Favoriler boşalırsa bölüm kaybolur — rafa dönülür. */
    const activeSection = useMemo(
        () => (groupId && !searching ? sections.find(s => s.id === groupId) || null : null),
        [groupId, searching, sections]
    );

    const related = useMemo(() => {
        if (!openItem) return [];
        return items
            .filter(i => i.group === openItem.group && i.key !== openItem.key)
            .slice(0, MAX_RELATED)
            .map(i => i.dua);
    }, [openItem, items]);

    // Kilitli tabaka açıldığında bir kez — teaser→CTA dönüşümü ancak bununla ölçülür
    useEffect(() => {
        if (openItem && !openItem.free && !hasPremium) analytics.duaPaywallViewed(openItem.key);
    }, [openItem, hasPremium]);

    const open = useCallback((dua, source) => {
        light();
        const key = duaKey(dua.arabic);
        const meta = duaMeta(dua.arabic);
        setOpenKey(key);
        analytics.duaOpened(key, meta.group, !meta.free && !isPremium(), source);
    }, [light]);

    /**
     * Kaynak etiketi bölüme ve arama durumuna bağlı; `DuaRow` memo'lu olduğu için
     * bu fonksiyon SABİT kalmalı — kartta inline arrow kullanılırsa her tuş
     * vuruşunda 70 kart birden yeniden çizilir.
     */
    const openFromSection = useCallback((dua, sectionId) => {
        open(dua, sectionId === 'fav' ? 'fav' : searchingRef.current ? 'search' : 'shelf');
    }, [open]);

    const openFromGroupPage = useCallback((dua) => open(dua, 'group'), [open]);

    const close = useCallback(() => setOpenKey(null), []);

    const openGroup = useCallback((section) => {
        selection();
        // Geri dönünce rafların bırakıldığı yere dönülür (başa atmaz)
        const el = document.getElementById('main-scroll-container');
        shelfScrollRef.current = el?.scrollTop || 0;
        setGroupId(section.id);
        analytics.duaGroupOpened(section.id);
        el?.scrollTo({ top: 0 });
    }, [selection]);

    const closeGroup = useCallback(() => {
        light();
        setGroupId(null);
        const y = shelfScrollRef.current;
        // Çift rAF: liste yeniden çizilip yüksekliğini alana kadar bekle
        requestAnimationFrame(() => requestAnimationFrame(() => {
            document.getElementById('main-scroll-container')?.scrollTo({ top: y });
        }));
    }, [light]);

    // Donanım geri tuşu: tabaka açıkken onu DuaSheet yakalar, sonra bölüm sayfası
    useHardwareBack(!!activeSection && !openKey, closeGroup);

    const onQueryChange = useCallback((e) => {
        setQuery(e.target.value);
        setGroupId(null);
    }, []);

    const toggleFavorite = useCallback((dua) => {
        const key = duaKey(dua.arabic);
        setFavorites(prev => {
            const on = !prev.includes(key);
            const next = on ? [...prev, key] : prev.filter(k => k !== key);
            storageService.setItem(FAV_KEY, JSON.stringify(next));
            analytics.duaFavorited(key, on);
            return next;
        });
    }, []);

    const goPremium = useCallback(() => {
        if (openItem) analytics.duaPaywallTapped(openItem.key);
        navigate('/premium');
    }, [openItem, navigate]);

    return (
        <div className="px-5">
            {/* Tek sticky öğe. backdrop-blur YOK: uzun listede kaydırma boyunca
                sürekli repaint yapar (aynı sebeple paywall banner'ından bir kez
                sökülmüştü). */}
            <div className="sticky top-0 z-30 -mx-5 border-b border-[#E2D9C4]/60 bg-[#F6F0E1] px-5 pt-2 pb-3 dark:border-white/[0.06] dark:bg-[#032e18]">
                <div data-tour="dua-search" className="flex h-11 items-center gap-2.5 rounded-2xl bg-[#F0E8D5] px-3.5 dark:bg-white/[0.06]">
                    <Search className="h-4 w-4 shrink-0 text-black/45 dark:text-emerald-100/45" />
                    <input
                        ref={inputRef}
                        type="search"
                        inputMode="search"
                        enterKeyHint="search"
                        value={query}
                        onChange={onQueryChange}
                        onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.blur(); }}
                        placeholder={t('duaSearchPlaceholder')}
                        aria-label={t('duaSearchPlaceholder')}
                        // WebKit'in kendi temizle süsü gizlenir — yoksa bizimkiyle iki ✕ yan yana çıkıyor
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
            </div>

            {searching && (
                <p className="px-1.5 pt-5 text-[0.75rem] font-medium text-black/55 dark:text-emerald-100/55">
                    {t('duaResultCount', { n: results.length })}
                </p>
            )}

            {searching && results.length === 0 && (
                <div className="px-2 pt-12 text-center">
                    <p className="font-display text-[0.9375rem] font-semibold text-stone-700 dark:text-emerald-100/80">
                        {t('duaEmptyTitle', { query: trimmed })}
                    </p>
                    <p className="mt-1.5 text-[0.8125rem] text-black/55 dark:text-emerald-100/55">
                        {t('duaEmptyHint')}
                    </p>
                </div>
            )}

            {/* Bölüm sayfası — "Tümü"nün açtığı dikey liste. Route DEĞİL:
                `useSmartPaywall` her route değişiminde sayaç artırıyor. */}
            {activeSection && (
                <section className="pt-5">
                    <div className="flex items-center gap-2 pb-1">
                        <button
                            type="button"
                            onClick={closeGroup}
                            aria-label={t('duaBack')}
                            className="-ms-2.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-600 active:bg-black/[0.05] dark:text-emerald-100/70 dark:active:bg-white/10"
                        >
                            <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
                        </button>
                        <div className="min-w-0">
                            <h2 className="truncate font-display text-[1.0625rem] font-bold text-stone-800 dark:text-emerald-50">
                                {t(activeSection.labelKey)}
                            </h2>
                            <p className="text-[0.6875rem] font-medium tabular-nums text-black/45 dark:text-emerald-100/45">
                                {t('duaSectionCount', { n: activeSection.items.length })}
                            </p>
                        </div>
                        <GoldRule className="ms-1" />
                    </div>

                    <div role="list" className="space-y-2.5 pt-4">
                        {activeSection.items.map(item => (
                            <div role="listitem" key={item.key}>
                                <DuaRow
                                    dua={item.dua}
                                    locked={!item.free && !hasPremium}
                                    favorite={favSet.has(item.key)}
                                    onOpen={openFromGroupPage}
                                />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Aramada dikey liste, normalde yatay raf. */}
            {!activeSection && sections.map((section, sectionIndex) => (
                <section key={section.id} className="pt-6">
                    {/* Başlık gri bir etiket değil, kendi ağırlığı olan bir nesne:
                        renkli ikon kutusu + net başlık + "Tümü". */}
                    <div className="flex items-center gap-2.5 pb-3">
                        <h2 className={cn(
                            'min-w-0 shrink truncate font-display text-[0.9375rem] font-bold tracking-[0.01em] text-stone-800 dark:text-emerald-50',
                            isRtl && 'tracking-normal'
                        )}>
                            {t(section.labelKey)}
                        </h2>
                        <span
                            className="shrink-0 font-display text-[0.6875rem] font-bold tabular-nums text-[#B45309]/75 dark:text-islamic-gold/75"
                            aria-label={t('duaSectionCount', { n: section.items.length })}
                        >
                            {section.items.length}
                        </span>
                        <GoldRule />
                        {!searching && (
                            <button
                                type="button"
                                data-tour={sectionIndex === 0 ? 'dua-seeall' : undefined}
                                onClick={() => openGroup(section)}
                                className="-me-1 flex min-h-[2rem] shrink-0 items-center gap-0.5 rounded-full px-2 font-display text-[0.75rem] font-bold text-[#B45309] active:bg-[#B45309]/10 dark:text-islamic-gold dark:active:bg-islamic-gold/10"
                            >
                                {t('duaSeeAll')}
                                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                            </button>
                        )}
                    </div>

                    {searching ? (
                        <div role="list" className="space-y-2.5">
                            {section.items.map(item => (
                                <div role="listitem" key={`${section.id}-${item.key}`}>
                                    <DuaRow
                                        dua={item.dua}
                                        locked={!item.free && !hasPremium}
                                        favorite={favSet.has(item.key)}
                                        sectionId={section.id}
                                        onOpen={openFromSection}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* data-hscroll: iOS kenardan geri kaydırması bu kabın
                           içinde devre dışı — yoksa rafı sağa kaydırmak
                           uygulamayı ana sayfaya atıyordu. */
                        <div
                            data-hscroll
                            role="list"
                            className="-mx-5 flex snap-x snap-mandatory items-stretch gap-2.5 overflow-x-auto overscroll-x-contain scrollbar-hide px-5 pb-1"
                        >
                            {section.items.map((item, itemIndex) => (
                                <div
                                    role="listitem"
                                    key={`${section.id}-${item.key}`}
                                    data-tour={sectionIndex === 0 && itemIndex === 0 ? 'dua-shelf' : undefined}
                                    className="w-[13.75rem] shrink-0 snap-start"
                                >
                                    <DuaRow
                                        dua={item.dua}
                                        compact
                                        locked={!item.free && !hasPremium}
                                        favorite={favSet.has(item.key)}
                                        sectionId={section.id}
                                        onOpen={openFromSection}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            ))}

            <DuaSheet
                dua={openItem?.dua || null}
                locked={!!openItem && !openItem.free && !hasPremium}
                lockedCount={lockedCount}
                favorite={!!openItem && favSet.has(openItem.key)}
                related={related}
                isRtl={isRtl}
                onClose={close}
                onToggleFavorite={toggleFavorite}
                onOpenRelated={(d) => open(d, 'related')}
                onGoPremium={goPremium}
            />

            {/* Tek seferlik ipuçları — karartmaz, engellemez (portal ile tabakanın üstünde) */}
            {activeHint && (
                <HintCoach
                    key={activeHint.id}
                    targetId={activeHint.target}
                    titleKey={activeHint.titleKey}
                    bodyKey={activeHint.bodyKey}
                    icon={activeHint.icon}
                    ns="learn"
                    step={hintChain.indexOf(activeHint)}
                    total={hintChain.length}
                    onClose={closeHint}
                />
            )}
        </div>
    );
}
