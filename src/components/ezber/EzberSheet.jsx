import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls, useReducedMotion } from 'framer-motion';
import { X, ChevronDown, RotateCcw, BookOpen, Play, ListChecks, Eye, Link2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import { analytics } from '@/services/analyticsService';
import DomeCelebration from '@/components/ezber/DomeCelebration';
import HoldButton from '@/components/ezber/HoldButton';
import { fetchAyahAudioWithSegments } from '@/services/quranApi';
import HintCoach from '@/components/HintCoach';
import { readSeenHints, markHintSeen } from '@/lib/hints';
import {
    sureKey, buildLines, audioPlanFor, splitArabicWords, markLineDone, closeSession, readProgress, todayStr,
} from '@/lib/ezber';

/**
 * Ezber sesi premium kotasından MUAF (`quranTrial`).
 *
 * Kota Kur'an sekmesinde uygulanıyor; Öğren'deki ezber klipleri 5-15 saniyelik
 * öğretim parçaları. Ücretli yapılmak istenirse: burayı `false` yap, `playLine`
 * içindeki gate açılır (tek satır) — akış zaten sessiz çalışabiliyor.
 */
const AUDIO_IS_FREE = true;

/**
 * Bir oturumda kaç YENİ satır çalışılır.
 *
 * Kullanıcı kararı (2026-08-18): kısa sure tek oturumda bitmeli — "3 satırı
 * ezberleyince bitmesin, bütün İhlâs'ı ezberlettir". Sınır bu yüzden 3'ten
 * kaldırıldı; 8'de duruyor çünkü Cüz Amme eklenince listede 31 satırlık Fecr
 * de var (tek oturumda insanlık dışı). 8 = eski listenin EN UZUN suresi
 * (Fâtiha ve Ayetel Kürsi 8 satır) → mevcut surelerin hiçbirinde davranış
 * değişmez, uzun sureler oturumlara bölünür ve kaldığı yerden devam eder.
 */
const LINES_PER_SESSION = 8;

const STEP = { LISTEN: 0, TOGETHER: 1, CURTAIN: 2, ANSWER: 3, CHAIN: 4 };
const STEP_KEYS = ['ezberStepListen', 'ezberStepTogether', 'ezberStepYou', 'ezberStepAnswer'];

/**
 * Tek seferlik ipuçları (HintCoach). Ezber akışının her aşaması AYRI zincir:
 * giriş / talim / perde / zincir. Aşama değişince hedefler DOM'dan kalktığı için
 * sıra indeksle değil KİMLİKLE tutulur — yoksa aşama geçişinde yanlış balon çıkar.
 * Hedef bulunamazsa ipucu sessizce iptal olur ve "görüldü" yazılmaz.
 * Ortak kayıt + test bayrağı: src/lib/hints.js
 */
const HINTS = {
    intro: [
        { id: 'learn:ezberRead', target: 'ezber-read', titleKey: 'tour.ezberRead.title', bodyKey: 'tour.ezberRead.body', icon: BookOpen },
        { id: 'learn:ezberStart', target: 'ezber-start', titleKey: 'tour.ezberStart.title', bodyKey: 'tour.ezberStart.body', icon: Play },
    ],
    drill: [
        { id: 'learn:ezberSteps', target: 'ezber-steps', titleKey: 'tour.ezberSteps.title', bodyKey: 'tour.ezberSteps.body', icon: ListChecks },
    ],
    curtain: [
        { id: 'learn:ezberPeek', target: 'ezber-peek', titleKey: 'tour.ezberPeek.title', bodyKey: 'tour.ezberPeek.body', icon: Eye },
    ],
    chain: [
        { id: 'learn:ezberChain', target: 'ezber-chain', titleKey: 'tour.ezberChain.title', bodyKey: 'tour.ezberChain.body', icon: Link2 },
    ],
};
const NO_HINTS = [];
const nextHint = (chain, seen, after = -1) => chain.findIndex((h, i) => i > after && !seen[h.id]);

/** Birbirine benzeyen satırlar — zincirde uyarı çıkar. */
const SIMILAR = [
    { match: 'ياايهاالكافرون', key: 'ezberSimilarKafirun' },
    { match: 'بربالفلق', key: 'ezberSimilarFalaq' },
    { match: 'بربالناس', key: 'ezberSimilarNas' },
    { match: 'عالمالغيبوالشهاده', key: 'ezberSimilarHashr' },   // Haşr 22 ile 23 aynı başlar
    { match: 'انالمسلمينوالمسلمات', key: 'ezberSimilarAhzab' },  // Ahzâb 35: on çift aynı kalıpta
];
const lettersOnly = (s) => String(s || '').normalize('NFC')
    .replace(/[ً-ْٰٓ-ٕـ]/g, '').replace(/[^ء-ي]/g, '')
    .replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');

/**
 * Kopya — perdeyi tümden kaldırmaz, ADIM ADIM açar.
 *
 * Açılmamış birimler harflerle değil ÇUBUKLA temsil edilir: kaç kelime kaldığı
 * ve uzunlukları görünür (hatırlatan ritim), harfler görünmez. "Hepsini göster"
 * yerine kullanıcı ihtiyacı kadar dokunur; bir kelime yetiyorsa gerisi kapalı kalır.
 *
 * Talimde birim KELİME, zincirde SATIR: zincirde 30 satır × kelime dokunması
 * saçma olurdu, orada eksik olan zaten hangi satırın geldiğidir.
 */
const PeekText = ({ units, shown, block, className }) => (
    <div className={cn(
        'mt-6 flex min-h-[5.5rem] items-center',
        block ? 'flex-col justify-center gap-2' : 'flex-wrap justify-center gap-x-2 gap-y-3',
        className,
    )}>
        {units.map((u, i) => (i < shown ? (
            <motion.span
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={block ? 'block text-center' : undefined}
            >
                {u}
            </motion.span>
        ) : (
            <span
                key={i}
                aria-hidden="true"
                className={cn('rounded-full bg-current opacity-[0.16]', block ? 'h-[0.6rem] w-full' : 'inline-block align-middle')}
                style={block ? undefined : { width: `${Math.min(9, Math.max(0.9, u.length * 0.46))}em`, height: '0.34em' }}
            />
        )))}
    </div>
);

/** Uzun satırda punto küçülür; hareke üst üste binmesin diye satır aralığı geniş kalır. */
function arabicClass(text) {
    const n = (text || '').length;
    if (n <= 40) return 'text-[1.6rem] leading-[2.2]';
    if (n <= 90) return 'text-[1.35rem] leading-[2.3]';
    return 'text-[1.15rem] leading-[2.4]';
}
function latinClass(text) {
    const n = (text || '').length;
    if (n <= 34) return 'text-[1.5rem]';
    if (n <= 70) return 'text-[1.25rem]';
    return 'text-[1.0625rem]';
}

/**
 * Kelime-senkron takip — Kur'an sekmesindeki karaoke ile aynı sync stratejisi.
 *
 * `audio.currentTime` akıyorsa birebir izlenir; iOS WKWebView'da donduğunda
 * duvar saatiyle köprülenir ve currentTime kıpırdayınca hemen ona snap edilir.
 *
 * `direct`: kelime sayısı = segment sayısı (Arapça) → 1:1 eşleme, kayma yok.
 * Okunuş satırında sayı tutmaz (uygulamanın kendi okunuşu kelimeleri birleştirir:
 * "Bismillâhirrahmânirrahîm" tek parça) → segment içi kesirli ilerleme kullanılır.
 */
const KaraokeText = ({ audioRef, segments, words, direct, readClass, currentClass, dimClass }) => {
    const [idx, setIdx] = useState(-1);

    useEffect(() => {
        const audio = audioRef?.current;
        if (!audio || !segments?.length || !words.length) return;
        let raf;
        let anchorTime = audio.currentTime || 0;
        let anchorAt = performance.now();

        const compute = (t) => {
            const ms = t * 1000;
            let cur = -1;
            for (let i = 0; i < segments.length; i++) {
                if (ms >= segments[i][2]) cur = i; else break;
            }
            let next;
            if (direct) {
                next = cur;
            } else {
                let within = 0;
                if (cur >= 0) {
                    const a = segments[cur][2], b = segments[cur][3];
                    within = b > a ? Math.min(1, (ms - a) / (b - a)) : 0;
                }
                next = Math.floor(((cur + within) / segments.length) * words.length);
            }
            setIdx(Math.min(words.length - 1, next));
        };

        const tick = () => {
            const now = performance.now();
            const real = audio.currentTime || 0;
            if (real > anchorTime + 0.02 || real < anchorTime - 0.25) { anchorTime = real; anchorAt = now; }
            compute(audio.paused ? anchorTime : anchorTime + (now - anchorAt) / 1000);
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [audioRef, segments, words.length, direct]);

    return words.map((w, i) => (
        <span key={i} className={cn('transition-colors duration-150', i < idx ? readClass : i === idx ? currentClass : dimClass)}>
            {w}{i < words.length - 1 ? ' ' : ''}
        </span>
    ));
};

/** Levha — dış kalın altın çerçeve, ince iç çerçeve, dört köşede elmas. */
const CORNERS = ['-top-1 -start-1', '-top-1 -end-1', '-bottom-1 -start-1', '-bottom-1 -end-1'];
const Levha = ({ children, className }) => (
    <div className={cn('rounded-md border border-[#B45309]/50 p-[0.5625rem] dark:border-islamic-gold/55', className)}>
        <div className="relative rounded-[0.1875rem] border border-[#B45309]/30 bg-black/[0.03] px-4 py-6 dark:border-islamic-gold/30 dark:bg-black/20">
            {CORNERS.map(pos => (
                <span
                    key={pos}
                    aria-hidden="true"
                    className={cn('absolute h-[0.4375rem] w-[0.4375rem] rotate-45 border border-[#B45309]/70 dark:border-islamic-gold/70', pos)}
                />
            ))}
            {children}
        </div>
    </div>
);

/**
 * Ezber tabakası — "Perde".
 *
 * Döngü: DUY → BERABER → SEN SÖYLE (perde iner) → DOĞRUSU → ZİNCİR.
 * Perde ya tamamen kapalıdır ya tamamen açık: kısmi gizleme ("eksik kelimeyi
 * tamamla") ezber değil bulmaca üretir ve kullanıcı tarafından reddedildi.
 *
 * Route DEĞİL, portal: `useSmartPaywall` her route değişiminde sayaç artırıyor.
 */
export default function EzberSheet({ sure, progress, mask = [], slotIndex = -1, onClose, onProgress }) {
    const { t, i18n } = useTranslation('learn');
    const { light, success, selection } = useHaptics();
    const dragControls = useDragControls();
    const reduceMotion = useReducedMotion();
    const bodyRef = useRef(null);

    const open = !!sure;
    const key = useMemo(() => sureKey(sure?.arabic), [sure?.arabic]);
    const lines = useMemo(() => buildLines(sure), [sure]);

    const entry = key ? progress[key] : null;
    const doneCount = Math.min(entry?.done || 0, lines.length);
    const isReview = lines.length > 0 && doneCount >= lines.length;
    /** Kaldığı satır — son satırı AŞMAZ. Sure bitmişken doneCount satır sayısına
     *  eşit oluyor; ham kullanılınca başlık "6/5. satır" yazıyordu. */
    const startIndex = Math.min(doneCount, Math.max(0, lines.length - 1));

    const [phase, setPhase] = useState('intro');       // intro | drill | chain | done
    const [lineIndex, setLineIndex] = useState(startIndex);
    const [step, setStep] = useState(STEP.LISTEN);
    const [learned, setLearned] = useState(0);         // bu oturumda geçilen satır
    const [peek, setPeek] = useState(0);               // kopyada açılan birim sayısı
    const [revealed, setRevealed] = useState(false);   // zincirde "Söyledim" sonrası
    const [audioState, setAudioState] = useState('idle'); // idle | loading | playing | error
    const [readOpen, setReadOpen] = useState(false);   // giriş ekranındaki "metnin tamamı"
    const [activeSegs, setActiveSegs] = useState(null); // çalan satırın kelime zamanlamaları
    const [starPlaced, setStarPlaced] = useState(false); // kubbeye yıldız kondu mu

    // Sure değişince baştan. Effect değil — React'in "prop değişince state ayarla" kalıbı.
    const [seenKey, setSeenKey] = useState(key);
    if (key !== seenKey) {
        setSeenKey(key);
        setPhase('intro');
        setLineIndex(startIndex);
        setStep(STEP.LISTEN);
        setLearned(0);
        setRevealed(false);
        setAudioState('idle');
        setReadOpen(false);
        setActiveSegs(null);
        setStarPlaced(false);
    }

    // ── Tek seferlik ipuçları ────────────────────────────────────────────
    // Bağlam = akışın o anki aşaması. 'curtain' talimin alt durumu: perde inince
    // "Takıldım" düğmesi beliriyor, ipucu da ancak o an anlam taşıyor.
    //
    // Döngü ipucu YALNIZ ilk iki adımda: "SEN SÖYLE'de metin gizlenir" cümlesi
    // DOĞRUSU adımında geç kalmış olurdu (kullanıcı zaten yaşamış oluyor).
    const hintCtx = !open ? null
        : phase === 'intro' ? 'intro'
            : phase === 'chain' ? 'chain'
                : phase === 'drill'
                    ? (step === STEP.CURTAIN && !revealed ? 'curtain'
                        : (step === STEP.LISTEN || step === STEP.TOGETHER) ? 'drill' : null)
                    : null;   // bitiş ekranında ipucu yok

    const [seenHints, setSeenHints] = useState(readSeenHints);
    const [hintId, setHintId] = useState(null);
    const hintTimerRef = useRef(null);
    const shownHintRef = useRef(null);
    const hintChain = hintCtx ? HINTS[hintCtx] : NO_HINTS;

    // Ekranda duran ipucunun kimliği — aşama değişince onu "görüldü" yazmak için.
    useEffect(() => { shownHintRef.current = hintId; }, [hintId]);

    useEffect(() => {
        if (!hintCtx) return undefined;
        const chain = HINTS[hintCtx];
        const first = nextHint(chain, readSeenHints());
        if (first === -1) return undefined;
        // Tabaka yayı / aşama geçişi otursun
        const timer = setTimeout(() => setHintId(chain[first].id), hintCtx === 'intro' ? 700 : 450);
        return () => {
            clearTimeout(timer);
            clearTimeout(hintTimerRef.current);   // zincirdeki bekleyen sıradaki
            // Aşama değişti: balon kullanıcı kapatmadan düşüyor. Görüldü yazılmazsa
            // bağlam geri geldiğinde (perde → DOĞRUSU) aynı ipucu yeniden çıkardı.
            const shown = shownHintRef.current;
            if (shown && chain.some(h => h.id === shown)) {
                setSeenHints(markHintSeen(shown));
                shownHintRef.current = null;
                setHintId(null);
            }
        };
    }, [hintCtx]);

    useEffect(() => () => clearTimeout(hintTimerRef.current), []);

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
            // Kısa geçiş: uzun boşluk "tur bitti" hissi veriyor
            hintTimerRef.current = setTimeout(() => setHintId(hintChain[nextIdx].id), 180);
        }
    }, [hintChain, hintId, seenHints]);

    // Aşama değişince eski kimlik yeni zincirde bulunmaz — balon kendiliğinden düşer.
    const activeHint = hintId ? hintChain.find(h => h.id === hintId) : null;

    useHardwareBack(open, onClose);

    /* --------------------------------------------------------------- ses */

    const audioRef = useRef(null);
    const planCache = useRef(new Map());
    const stopAtRef = useRef(null);
    const playTokenRef = useRef(0);
    const stopRafRef = useRef(null);
    const endCbRef = useRef(null);
    const watchdogRef = useRef(null);

    /**
     * Ses bekçisi. "Devam" butonu klip biterken kilitli duruyor; ses takılırsa
     * (yavaş ağ, CDN hıçkırığı, WebView kodek sorunu) kullanıcı adımda mahsur
     * kalırdı — tek çıkışı tabakayı kapatmaktı. Bekçi süre dolunca akışı serbest
     * bırakır: sessiz devam etmek, kilitli kalmaktan iyidir.
     */
    const clearWatchdog = useCallback(() => {
        if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
    }, []);

    useEffect(() => {
        if (!open) return;
        const el = new Audio();
        el.preload = 'auto';
        audioRef.current = el;
        /**
         * Kesme noktası KARE KARE denetlenir.
         *
         * Eskiden yalnız `timeupdate` dinleniyordu; o olay ~250 ms'de bir
         * tetikleniyor ve satır o kadar geç duruyordu — sonraki kelimenin
         * başı duyuluyordu (Ahzâb 35'in 1. satırı sonunda fazladan "vel").
         * rAF ile hata ~16 ms'e iner. `timeupdate` yedek olarak kalır:
         * sekme arka plana düşerse rAF durur, olay durmaz.
         */
        const cut = () => {
            const stopAt = stopAtRef.current;
            if (stopAt != null && el.currentTime >= stopAt) {
                el.pause();
                stopAtRef.current = null;
                stopRafRef.current = null;
                endCbRef.current?.();
                return true;
            }
            return false;
        };
        const frame = () => {
            if (cut()) return;
            stopRafRef.current = requestAnimationFrame(frame);
        };
        const onPlaying = () => {
            if (stopRafRef.current) cancelAnimationFrame(stopRafRef.current);
            if (stopAtRef.current == null) return;   // tam ayet klibi: 'ended' yeter
            stopRafRef.current = requestAnimationFrame(frame);
        };
        const onPause = () => {
            if (stopRafRef.current) cancelAnimationFrame(stopRafRef.current);
            stopRafRef.current = null;
        };
        const onTime = () => { cut(); };
        const onEnded = () => { stopAtRef.current = null; onPause(); endCbRef.current?.(); };
        el.addEventListener('playing', onPlaying);
        el.addEventListener('pause', onPause);
        el.addEventListener('timeupdate', onTime);
        el.addEventListener('ended', onEnded);
        return () => {
            clearWatchdog();
            onPause();
            el.removeEventListener('playing', onPlaying);
            el.removeEventListener('pause', onPause);
            el.removeEventListener('timeupdate', onTime);
            el.removeEventListener('ended', onEnded);
            el.pause();
            el.src = '';
            audioRef.current = null;
        };
    }, [open, clearWatchdog]);

    /** Alttaki liste kaymasın; `/premium`'a gidilse bile kilit çözülür. */
    useEffect(() => {
        if (!open) return;
        const el = document.getElementById('main-scroll-container');
        if (!el) return;
        const saved = el.scrollTop;
        el.style.overflow = 'hidden';
        return () => {
            el.style.overflow = '';
            requestAnimationFrame(() => { el.scrollTop = saved; });
        };
    }, [open]);

    const loadPlan = useCallback(async (index) => {
        const plan = audioPlanFor(sure?.arabic, index);
        if (!plan) return null;
        let file = planCache.current.get(plan.verseKey);
        if (!file) {
            file = await fetchAyahAudioWithSegments(plan.verseKey);
            if (!file) return null;
            planCache.current.set(plan.verseKey, file);
        }
        // Ayetel Kürsi tek ayet: satır kelime aralığından kesilir
        if (plan.wordFrom != null && file.segments?.length) {
            const from = file.segments[plan.wordFrom];
            const to = file.segments[Math.min(plan.wordTo, file.segments.length) - 1];
            if (from && to) {
                return {
                    url: file.url,
                    start: from[2] / 1000,
                    end: to[3] / 1000,
                    segments: file.segments.slice(plan.wordFrom, plan.wordTo),
                };
            }
            return null;
        }
        return { url: file.url, start: 0, end: null, segments: file.segments || [] };
    }, [sure?.arabic]);

    /**
     * Sesi durdurur ve UÇUŞTAKİ yüklemeyi de geçersiz kılar.
     *
     * Jeton olmasaydı: kullanıcı "yükleniyor" anında Durdur'a bassa, istek
     * sonradan dönüp sesi yine de başlatırdı.
     */
    const stopAudio = useCallback(() => {
        playTokenRef.current += 1;
        clearWatchdog();
        endCbRef.current = null;
        stopAtRef.current = null;
        setActiveSegs(null);
        setAudioState('idle');
        audioRef.current?.pause();
    }, [clearWatchdog]);

    const playLine = useCallback(async (index, onEnd) => {
        if (!AUDIO_IS_FREE) { onEnd?.(); return; }
        const el = audioRef.current;
        if (!el) return;
        const token = ++playTokenRef.current;
        setAudioState('loading');

        // Akışı EN FAZLA bir kez bırakır. Bekçi ile normal bitiş yarışabilir;
        // iki kez çağrılırsa satır atlanırdı.
        let released = false;
        const finish = () => {
            if (released) return;
            released = true;
            clearWatchdog();
            endCbRef.current = null;
            stopAtRef.current = null;
            setAudioState('idle');
            setActiveSegs(null);
            onEnd?.();
        };
        // Bekçi İSTEK BEKLENMEDEN kurulur: kopuk/çok yavaş bağlantıda `fetch`
        // dakikalarca asılı kalabiliyor ve "Devam" butonu o süre boyunca kapalı
        // kalıyordu (kullanıcı ekranda kilitleniyordu).
        endCbRef.current = finish;
        clearWatchdog();
        watchdogRef.current = setTimeout(finish, 9000);

        const plan = await loadPlan(index);
        if (released || token !== playTokenRef.current) return;   // bekçi bıraktı ya da kullanıcı durdurdu
        if (!plan || !audioRef.current) { setAudioState('error'); finish(); return; }
        stopAtRef.current = plan.end;
        try {
            if (el.src !== plan.url) {
                el.src = plan.url;
                // iOS/WKWebView: metadata gelmeden `currentTime` ATANMAZ (sessizce
                // yok sayılır). Kelime aralığından kesilen satırlarda bu, satırın
                // kendi yerinden değil AYETİN BAŞINDAN çalması demekti — oturuma
                // ayetin ortasındaki bir satırdan devam edildiğinde ortaya çıkıyor.
                if ((plan.start || 0) > 0 && el.readyState < 1) {
                    await new Promise(resolve => {
                        const done = () => { el.removeEventListener('loadedmetadata', done); clearTimeout(t); resolve(); };
                        const t = setTimeout(done, 4000);
                        el.addEventListener('loadedmetadata', done);
                    });
                    if (released || token !== playTokenRef.current) return;
                }
            }
            el.currentTime = plan.start || 0;
            await el.play();
            // play() beklenirken durdurulmuş ya da bekçi bırakmış olabilir
            if (released || token !== playTokenRef.current) { el.pause(); return; }
            // Arama yine de düşmüş olabilir (bazı WebView sürümleri sessizce yutuyor)
            if ((plan.start || 0) > 0 && Math.abs(el.currentTime - plan.start) > 0.5) {
                el.currentTime = plan.start;
            }
            setActiveSegs(plan.segments?.length ? plan.segments : null);
            setAudioState('playing');
            // Çalmaya başladı: bekçiyi klip süresi + 4 sn'ye uzat
            const dur = plan.end != null ? plan.end - (plan.start || 0) : 0;
            clearWatchdog();
            watchdogRef.current = setTimeout(finish, (dur > 0 ? dur * 1000 : 20000) + 4000);
        } catch {
            setAudioState('error');
            setActiveSegs(null);
            finish();
        }
    }, [loadPlan, clearWatchdog]);

    /** Zincir: 0..upto satırlarını sırayla çalar. */
    const playChain = useCallback(async (upto, onEnd) => {
        let i = 0;
        const next = () => {
            if (i > upto) { onEnd?.(); return; }
            const at = i++;
            playLine(at, next);
        };
        next();
    }, [playLine]);

    /* ------------------------------------------------------------- akış */

    const startSession = useCallback(() => {
        light();
        analytics.ezberStarted(key, isReview ? 'review' : 'learn');
        if (isReview) {
            setPhase('chain');
            setRevealed(false);
            return;
        }
        setPhase('drill');
        setStep(STEP.LISTEN);
        setLineIndex(startIndex);
        setRevealed(false);
        playLine(startIndex);
    }, [light, key, isReview, startIndex, playLine]);

    const goStep = useCallback((next) => {
        selection();
        setStep(next);
        setRevealed(false);
        if (next === STEP.TOGETHER || next === STEP.ANSWER) playLine(lineIndex);
        if (next === STEP.CURTAIN) stopAudio();
    }, [selection, lineIndex, playLine, stopAudio]);

    const finishSession = useCallback(() => {
        stopAudio();
        success();
        const next = closeSession(readProgress(), key, { today: todayStr() });
        onProgress(next);
        analytics.ezberSessionDone(key, learned);
        setPhase('done');
    }, [stopAudio, success, key, learned, onProgress]);

    /**
     * TEST KISAYOLU — yalnız `npm run dev` derlemesinde görünür (`import.meta.env.DEV`).
     * Bütün satırları tamamlanmış sayıp bitiş ekranına atlar; kubbe/basılı-tut
     * akışını her seferinde sureyi baştan ezberlemeden denemek için.
     * Prod derlemede buton hiç render edilmez.
     */
    const skipToEnd = useCallback(() => {
        stopAudio();
        let next = readProgress();
        for (let i = 0; i < lines.length; i++) next = markLineDone(next, key, i, lines.length);
        onProgress(next);
        setLearned(l => Math.max(l, 1));
        setStarPlaced(false);
        setTimeout(finishSession, 0);
    }, [stopAudio, key, lines.length, onProgress, finishSession]);

    const acceptLine = useCallback(() => {
        success();
        stopAudio();
        analytics.ezberLineDone(key, lineIndex);
        onProgress(markLineDone(readProgress(), key, lineIndex, lines.length));
        const nextLearned = learned + 1;
        setLearned(nextLearned);
        // Yeni satır tek başına bırakılmaz: her satırdan sonra baştan bağlanır
        if (lineIndex > 0) {
            setPhase('chain');
            setRevealed(false);
            return;
        }
        if (lineIndex + 1 >= lines.length || nextLearned >= LINES_PER_SESSION) {
            finishSession();
            return;
        }
        setLineIndex(lineIndex + 1);
        setStep(STEP.LISTEN);
        playLine(lineIndex + 1);
    }, [success, stopAudio, key, lineIndex, lines.length, learned, onProgress, playLine, finishSession]);

    const afterChain = useCallback(() => {
        stopAudio();
        if (isReview) { finishSession(); return; }
        const nextIndex = lineIndex + 1;
        if (nextIndex >= lines.length || learned >= LINES_PER_SESSION) { finishSession(); return; }
        setLineIndex(nextIndex);
        setPhase('drill');
        setStep(STEP.LISTEN);
        setRevealed(false);
        playLine(nextIndex);
    }, [stopAudio, isReview, lineIndex, lines.length, learned, finishSession, playLine]);

    const oneMore = useCallback(() => {
        selection();
        setStarPlaced(false);
        setPhase('drill');
        setStep(STEP.LISTEN);
        setLearned(0);
        setLineIndex(Math.min(readProgress()[key]?.done || 0, Math.max(0, lines.length - 1)));
        playLine(Math.min(readProgress()[key]?.done || 0, Math.max(0, lines.length - 1)));
    }, [selection, key, lines.length, playLine]);

    /** Kopya: bir birim daha açar. İlk dokunuş "takıldı" sayılır (eski metrik korunur). */
    const peekMore = useCallback(() => {
        light();
        if (peek === 0) analytics.ezberStumbled(key, lineIndex);
        setPeek(p => p + 1);
    }, [light, peek, key, lineIndex]);

    // Yeni satıra/adıma geçince kopya sıfırlanır — önceki satırın açılmışlığı taşınmaz
    useEffect(() => { setPeek(0); }, [lineIndex, step, phase]);

    /* ------------------------------------------------------------ görsel */

    const line = lines[lineIndex] || lines[0] || { ar: '', lat: '' };
    const chainAr = lines.slice(0, isReview ? lines.length : lineIndex + 1).map(l => l.ar).join(' ');
    const chainLat = lines.slice(0, isReview ? lines.length : lineIndex + 1).map(l => l.lat).filter(Boolean).join(' ');
    const similar = useMemo(() => {
        const letters = lettersOnly(sure?.arabic);
        return SIMILAR.find(s => letters.includes(s.match)) || null;
    }, [sure?.arabic]);

    const curtainOn = (phase === 'drill' && step === STEP.CURTAIN && !revealed)
        || (phase === 'chain' && !revealed);

    /** Kopyanın açacağı birimler: talimde kelime, zincirde satır. */
    const peekUnits = useMemo(() => {
        if (phase === 'chain') {
            const upto = isReview ? lines.length - 1 : lineIndex;
            return lines.slice(0, upto + 1).map(l => l.lat).filter(Boolean);
        }
        return (line.lat || '').split(/\s+/).filter(Boolean);
    }, [phase, isReview, lines, lineIndex, line.lat]);
    const canPeek = curtainOn && peek < peekUnits.length;
    const playing = audioState === 'playing' || audioState === 'loading';

    /** Kaç sure ezberde — bitiş ekranındaki ilerleme çubuğu. */
    const memorizedCount = useMemo(
        () => Object.values(progress || {}).filter(v => v?.lines > 0 && v.done >= v.lines).length,
        [progress]
    );

    /** "2026-08-19" → "19 Ağustos" (cihaz diline göre). */
    const formatDue = useCallback((iso) => {
        const d = new Date(`${iso}T00:00:00`);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' });
    }, [i18n.language]);

    /* Kelime takibi — tek satır çalarken (drill). Zincirde satırlar birleştiği için
       segmentler tek satıra ait kalır, orada takip yapılmaz. */
    const arWords = useMemo(() => splitArabicWords(line.ar), [line.ar]);
    const latWords = useMemo(() => (line.lat || '').trim().split(/\s+/).filter(Boolean), [line.lat]);
    const follow = phase === 'drill' && audioState === 'playing' && !!activeSegs?.length;

    const spring = reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 34 };
    const fade = reduceMotion ? { duration: 0 } : { duration: 0.16, ease: 'easeOut' };

    const closeAll = useCallback(() => { stopAudio(); onClose(); }, [stopAudio, onClose]);

    const primaryBtn = 'flex h-14 w-full items-center justify-center rounded-2xl bg-islamic-green font-display text-[0.9375rem] font-bold text-white transition-all active:scale-[0.99] disabled:opacity-45 dark:bg-islamic-gold dark:text-[#032e18]';
    const ghostBtn = 'flex h-12 flex-1 items-center justify-center rounded-2xl bg-[#F0E8D5] font-display text-[0.875rem] font-bold text-stone-700 active:bg-[#E9DFC8] dark:bg-white/[0.06] dark:text-emerald-50 dark:active:bg-white/10';
    const peekBtn = 'mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#B45309]/40 font-display text-[0.8125rem] font-bold text-[#B45309] active:bg-[#B45309]/[0.06] dark:border-islamic-gold/40 dark:text-islamic-gold dark:active:bg-islamic-gold/10';
    const replayBtn = 'mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#B45309]/30 font-display text-[0.8125rem] font-bold text-[#B45309] active:bg-[#B45309]/[0.06] dark:border-islamic-gold/30 dark:text-islamic-gold dark:active:bg-islamic-gold/10';

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div className="fixed inset-0 z-[100]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>
                    <div className="absolute inset-0 bg-black/50" onClick={closeAll} />

                    <motion.div
                        data-sheet
                        className="absolute inset-x-0 bottom-0 mx-auto flex h-[92vh] w-full max-w-[30rem] flex-col rounded-t-[2rem] bg-[#F6F0E1] shadow-[0_-8px_40px_-10px_rgba(0,0,0,0.35)] dark:bg-[#032e18]"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%', transition: reduceMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeIn' } }}
                        transition={spring}
                        drag="y"
                        dragListener={false}
                        dragControls={dragControls}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.4 }}
                        onDragEnd={(_e, info) => { if (info.offset.y > 120 || info.velocity.y > 600) closeAll(); }}
                    >
                        <div className="shrink-0 cursor-grab touch-none pt-3 pb-1" onPointerDown={(e) => dragControls.start(e)}>
                            <div className="mx-auto h-1 w-10 rounded-full bg-[#E2D9C4] dark:bg-white/15" />
                        </div>

                        <div className="flex shrink-0 items-center gap-3 px-5 pb-2">
                            {/* Bitiş ekranında sure adı zaten büyük yazıyor — başlıkta
                                tekrar etmez. Diğer adımlarda tam kontrastta durur. */}
                            <p className="min-w-0 flex-1 truncate font-display text-[0.9375rem] font-semibold text-stone-800 dark:text-emerald-50">
                                {phase === 'done'
                                    ? ''
                                    : phase === 'drill'
                                        ? t('ezberLineOf', { title: sure.title, n: lineIndex + 1, total: lines.length })
                                        : sure.title}
                            </p>
                            {import.meta.env.DEV && (
                                <button
                                    type="button"
                                    onClick={skipToEnd}
                                    aria-label="sona atla (test)"
                                    className="shrink-0 rounded-full border border-dashed border-[#B45309]/50 px-3 py-1 font-display text-[0.6875rem] font-bold text-[#B45309] dark:border-islamic-gold/50 dark:text-islamic-gold"
                                >
                                    sona atla
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={closeAll}
                                aria-label={t('ezberClose')}
                                className="-me-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone-500 active:bg-black/[0.05] dark:text-emerald-100/70 dark:active:bg-white/10"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Adım şeridi — bilgi, dokunulamaz */}
                        {phase === 'drill' && (
                            <div data-tour="ezber-steps" className="flex shrink-0 gap-1.5 px-5 pb-4">
                                {STEP_KEYS.map((k, i) => (
                                    <span
                                        key={k}
                                        className={cn(
                                            'flex-1 rounded-full py-1.5 text-center font-display text-[0.625rem] font-bold uppercase tracking-[0.1em] transition-colors',
                                            i < step && 'bg-[#B45309]/15 text-[#B45309] dark:bg-islamic-gold/15 dark:text-islamic-gold',
                                            i === step && 'bg-islamic-green text-white dark:bg-islamic-gold dark:text-[#032e18]',
                                            i > step && 'bg-black/[0.05] text-black/35 dark:bg-white/5 dark:text-emerald-100/35'
                                        )}
                                    >
                                        {t(k)}
                                    </span>
                                ))}
                            </div>
                        )}
                        {phase === 'chain' && (
                            <p className="shrink-0 px-5 pb-2 font-display text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#B45309] dark:text-islamic-gold">
                                {t('ezberStepChain', { n: isReview ? lines.length : lineIndex + 1 })}
                            </p>
                        )}

                        {/* GÖREV — ekranın en net cümlesi. Eskiden alt barda soluk gri
                            bir satırdı, kullanıcı "arka planda kalmış" dedi. */}
                        {(phase === 'drill' || phase === 'chain') && (
                            <p data-tour={phase === 'chain' ? 'ezber-chain' : undefined} className="shrink-0 px-5 pb-4 text-center font-display text-[1.0625rem] font-bold leading-snug text-stone-900 dark:text-emerald-50">
                                {phase === 'chain'
                                    ? t('ezberHintChain')
                                    : t(['ezberHintListen', 'ezberHintTogether', 'ezberHintYou', 'ezberHintAnswer'][step])}
                            </p>
                        )}

                        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
                            {phase === 'intro' && (
                                <>
                                    {sure.instruction && (
                                        <p className="text-[0.9375rem] leading-relaxed text-stone-600 dark:text-emerald-100/65">
                                            {sure.instruction}
                                        </p>
                                    )}
                                    <Levha className="mt-5">
                                        <p dir="rtl" lang="ar" className={cn('text-center font-arabic text-[#92400E] dark:text-islamic-gold', arabicClass(lines[1]?.ar || ''))}>
                                            {(lines[1] || lines[0])?.ar}
                                        </p>
                                    </Levha>
                                    <p className="mt-5 text-[0.9375rem] leading-relaxed text-stone-700 dark:text-white/80">
                                        {isReview
                                            ? t('ezberIntroReview', { n: lines.length })
                                            : t('ezberIntroLearn', { n: Math.min(LINES_PER_SESSION, lines.length - doneCount), total: lines.length })}
                                    </p>

                                    {/* Metnin tamamı — Sureler artık okuma sihirbazı değil, ama
                                        ezberden önce okunuş/meal/ipuçlarına bakmak isteyen kalıyor. */}
                                    {(sure.transcription || sure.meaning || sure.tips?.length > 0) && (
                                        <div className="mt-5">
                                            <button
                                                type="button"
                                                onClick={() => { light(); setReadOpen(o => !o); }}
                                                aria-expanded={readOpen}
                                                data-tour="ezber-read"
                                                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#B45309]/25 px-4 py-3 text-start font-display text-[0.875rem] font-semibold text-stone-700 active:opacity-80 dark:border-islamic-gold/25 dark:text-emerald-50"
                                            >
                                                {t('ezberRead')}
                                                <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', readOpen && 'rotate-180')} />
                                            </button>

                                            {readOpen && (
                                                <div className="space-y-4 px-1 pt-4">
                                                    {sure.transcription && (
                                                        <div>
                                                            <p className="mb-1.5 font-display text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#B45309] dark:text-islamic-gold">{t('translitLabel')}</p>
                                                            <p className="text-[0.9375rem] leading-relaxed text-stone-700 dark:text-white/80">{sure.transcription}</p>
                                                        </div>
                                                    )}
                                                    {sure.meaning && (
                                                        <div>
                                                            <p className="mb-1.5 font-display text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#B45309] dark:text-islamic-gold">{t('meaningLabel')}</p>
                                                            <p className="text-[0.9375rem] leading-relaxed text-stone-600 dark:text-emerald-100/65">{sure.meaning}</p>
                                                        </div>
                                                    )}
                                                    {sure.tips?.length > 0 && (
                                                        <div>
                                                            <p className="mb-1.5 font-display text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#B45309] dark:text-islamic-gold">{t('tipsTitle')}</p>
                                                            <ul className="space-y-2">
                                                                {sure.tips.map((tip, i) => (
                                                                    <li key={i} className="flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-stone-600 dark:text-emerald-100/55">
                                                                        <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-[#B45309] dark:bg-islamic-gold" />
                                                                        <span>{tip}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {(phase === 'drill' || phase === 'chain') && (
                                <>
                                    <Levha>
                                        <p dir="rtl" lang="ar" className={cn('text-center font-arabic text-[#92400E] dark:text-islamic-gold',
                                            arabicClass(phase === 'chain' ? chainAr : line.ar))}>
                                            {follow ? (
                                                <KaraokeText
                                                    audioRef={audioRef}
                                                    segments={activeSegs}
                                                    words={arWords}
                                                    direct={arWords.length === activeSegs.length}
                                                    readClass="text-[#92400E] dark:text-islamic-gold"
                                                    currentClass="text-[#7C2D12] dark:text-amber-200"
                                                    dimClass="text-[#92400E]/30 dark:text-islamic-gold/30"
                                                />
                                            ) : (phase === 'chain' ? chainAr : line.ar)}
                                        </p>
                                    </Levha>

                                    {curtainOn ? (
                                        peekUnits.length ? (
                                            <PeekText
                                                units={peekUnits}
                                                shown={peek}
                                                block={phase === 'chain'}
                                                className={cn('font-display font-semibold text-stone-900 dark:text-white',
                                                    phase === 'chain' ? 'text-[1.0625rem] leading-snug' : latinClass(line.lat))}
                                            />
                                        ) : (
                                            <div className="mt-6 flex h-[5.5rem] items-center justify-center rounded-xl border border-dashed border-[#B45309]/30 dark:border-islamic-gold/25">
                                                <span className="text-[0.875rem] text-stone-500 dark:text-emerald-100/40">{t('ezberCurtain')}</span>
                                            </div>
                                        )
                                    ) : (
                                        (phase === 'chain' ? chainLat : line.lat) ? (
                                            <p className={cn('mt-6 text-center font-display font-semibold leading-snug text-stone-900 dark:text-white',
                                                latinClass(phase === 'chain' ? chainLat : line.lat))}>
                                                {follow && latWords.length ? (
                                                    <KaraokeText
                                                        audioRef={audioRef}
                                                        segments={activeSegs}
                                                        words={latWords}
                                                        direct={latWords.length === activeSegs.length}
                                                        readClass="text-stone-900 dark:text-white"
                                                        currentClass="text-[#B45309] dark:text-islamic-gold"
                                                        dimClass="text-stone-400 dark:text-white/35"
                                                    />
                                                ) : (phase === 'chain' ? chainLat : line.lat)}
                                            </p>
                                        ) : null
                                    )}

                                    {phase === 'chain' && similar && (
                                        <div className="mt-5 rounded-2xl border border-[#B45309]/25 p-4 dark:border-islamic-gold/25">
                                            <p className="text-[0.8125rem] leading-relaxed text-stone-700 dark:text-emerald-100/70">
                                                {t(similar.key)}
                                            </p>
                                        </div>
                                    )}

                                    {audioState === 'error' && (
                                        <p className="mt-5 text-center text-[0.8125rem] text-stone-500 dark:text-emerald-100/50">
                                            {t('ezberNoAudio')}
                                        </p>
                                    )}
                                </>
                            )}

                            {phase === 'done' && (
                                <DomeCelebration
                                    title={sure.title}
                                    lineCount={Math.min(progress[key]?.done || 0, lines.length)}
                                    mask={mask}
                                    slotIndex={slotIndex}
                                    dueLabel={progress[key]?.due ? formatDue(progress[key].due) : null}
                                    isNew={learned > 0}
                                    placed={starPlaced || learned === 0}
                                    headline={learned > 0 ? t('ezberDoneCelebrate') : t('ezberDoneReview')}
                                />
                            )}
                        </div>

                        {/* Alt bar — tek büyük buton, ekrandaki tek glow ses çalarken burada */}
                        <div className="shrink-0 border-t border-[#E2D9C4]/70 bg-[#F6F0E1] px-5 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] dark:border-white/[0.06] dark:bg-[#032e18]">
                            {phase === 'intro' && (
                                <>
                                    <button type="button" data-tour="ezber-start" onClick={startSession} className={primaryBtn}>
                                        {isReview ? t('ezberStartReview') : t('ezberStart')}
                                    </button>
                                    <p className="mt-3 text-center text-[0.8125rem] text-stone-500 dark:text-emerald-100/45">
                                        {t('ezberIntroHint')}
                                    </p>
                                </>
                            )}

                            {phase === 'drill' && (
                                <>
                                    {step === STEP.ANSWER ? (
                                        <div className="flex gap-2.5">
                                            <button type="button" onClick={() => goStep(STEP.TOGETHER)} className={ghostBtn}>
                                                {t('ezberAgain')}
                                            </button>
                                            <button type="button" onClick={acceptLine} className={cn(ghostBtn, 'bg-islamic-green text-white dark:bg-islamic-gold dark:text-[#032e18]')}>
                                                {t('ezberGood')}
                                            </button>
                                        </div>
                                    ) : (
                                        // Çalarken buton KAPANMAZ, "Durdur"a döner: uzun ayetlerde
                                        // (Beyyine, Âmenerrasûlü) klip 25 sn sürebiliyor ve kapalı
                                        // buton kullanıcıyı bekletiyordu.
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (playing && step !== STEP.CURTAIN) { stopAudio(); return; }
                                                goStep(step === STEP.CURTAIN ? STEP.ANSWER : step + 1);
                                            }}
                                            className={cn(primaryBtn, playing && step !== STEP.CURTAIN && 'shadow-[0_6px_24px_-8px_#B45309] dark:shadow-[0_6px_24px_-8px_#D4AF37]')}
                                        >
                                            {step === STEP.CURTAIN
                                                ? t('ezberSaid')
                                                : (playing ? t('ezberStop') : t('ezberContinue'))}
                                        </button>
                                    )}
                                    {step === STEP.CURTAIN && canPeek && (
                                        <button type="button" data-tour="ezber-peek" onClick={peekMore} className={peekBtn}>
                                            <Eye className="h-4 w-4" />
                                            {t('ezberPeek')}
                                            <span className="tabular-nums opacity-55">{peek}/{peekUnits.length}</span>
                                        </button>
                                    )}
                                    {/* Tek dinleyişte oturmayabilir — aynı klibi baştan çalar. */}
                                    {(step === STEP.LISTEN || step === STEP.TOGETHER) && (
                                        <button
                                            type="button"
                                            onClick={() => { light(); playLine(lineIndex); }}
                                            className={replayBtn}
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                            {t('ezberReplay')}
                                        </button>
                                    )}
                                </>
                            )}

                            {phase === 'chain' && (
                                <>
                                    {revealed ? (
                                        <button
                                            type="button"
                                            onClick={() => (playing ? stopAudio() : afterChain())}
                                            className={primaryBtn}
                                        >
                                            {playing ? t('ezberStop') : t('ezberContinue')}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => { success(); setRevealed(true); playChain(isReview ? lines.length - 1 : lineIndex); }}
                                            className={primaryBtn}
                                        >
                                            {t('ezberSaid')}
                                        </button>
                                    )}
                                    {canPeek && (
                                        <button type="button" onClick={peekMore} className={peekBtn}>
                                            <Eye className="h-4 w-4" />
                                            {t('ezberPeek')}
                                            <span className="tabular-nums opacity-55">{peek}/{peekUnits.length}</span>
                                        </button>
                                    )}
                                    {revealed && (
                                        <button
                                            type="button"
                                            onClick={() => { light(); playChain(isReview ? lines.length - 1 : lineIndex); }}
                                            className={replayBtn}
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                            {t('ezberReplay')}
                                        </button>
                                    )}
                                </>
                            )}

                            {phase === 'done' && (
                                learned > 0 && !starPlaced ? (
                                    <>
                                        <HoldButton
                                            label={t('ezberHoldCta')}
                                            onComplete={() => { setStarPlaced(true); analytics.ezberStarPlaced(key, memorizedCount); }}
                                        />
                                        <p className="mt-3 text-center text-[0.8125rem] text-stone-500 dark:text-emerald-100/45">
                                            {t('ezberHoldHint')}
                                        </p>
                                    </>
                                ) : (
                                    <div className="flex gap-2.5">
                                        {!isReview && (progress[key]?.done || 0) < lines.length && (
                                            <button type="button" onClick={oneMore} className={ghostBtn}>
                                                {t('ezberOneMore')}
                                            </button>
                                        )}
                                        <button type="button" onClick={closeAll} className={cn(ghostBtn, 'bg-islamic-green text-white dark:bg-islamic-gold dark:text-[#032e18]')}>
                                            {t('ezberFinish')}
                                        </button>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Tek seferlik ipuçları — karartmaz, engellemez; kendi portalıyla
                            tabakanın (z-100) üstünde durur. */}
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
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
