import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * Tek elemanlık ipucu (coachmark).
 *
 * Bahsedilen elemanın etrafında yanıp sönen altın halka + yanında kısa balon.
 * Karartma YOK, engelleme YOK: arka plan tamamen tıklanabilir kalır — kullanıcı
 * ipucunu okurken uygulamayı kullanmaya devam edebilir.
 *
 * Kırılganlığa karşı:
 *  • Hedef DOM'da yoksa ipucu sessizce iptal olur (onClose(false) → "görüldü" yazılmaz).
 *  • Ölçüm kaydırma / boyut / yön değişiminde yenilenir, halka hedefi takip eder.
 *  • Balon yüksekliği GERÇEKTEN ölçülür ve görünür alana sıkıştırılır (üstten taşmaz).
 *  • Kaydırma yalnız hedef kısaysa yapılır; uzun konteyner ortalanmaz (liste ortasına atlamayı önler).
 *
 * @param {string} targetId  Hedefteki `data-tour` değeri
 * @param {number} step     Zincirdeki sıra (0 tabanlı) — adım noktaları için
 * @param {number} total    Zincirdeki toplam ipucu; 1 ise nokta çizilmez
 * @param {func}   onClose   (markSeen: boolean) => void
 */
// Kendiliğinden kapanma. Kapanınca zincir DURMAZ; sayfa sıradaki ipucunu açar
// (bkz. sayfalardaki closeHint). Okuma payı için 14 sn'den 18 sn'ye çıkarıldı.
const AUTO_DISMISS_MS = 18000;
const MAX_TRIES = 45;          // ~0.75 sn — sekme geçiş animasyonu 0.3 sn
const GAP = 12;
const EDGE = 12;
// Alt şeritte alt menü ve (premium olmayanlarda) native AdMob banner'ı var.
// Banner WebView'ın ÜSTÜNDE yüzen native bir view — z-index onu örtemez,
// o yüzden balon bu bandın dışında tutulur. (banner margin 75 + yükseklik ~50)
const BOTTOM_SAFE = 132;
const CARET_INSET = 26;
const PAD = 6;                 // halkanın hedefi sardığı pay
const EST_BUBBLE_H = 170;      // yer açma kararı için tahmin (balon henüz ölçülmedi)
const SCROLL_TOP_PAD = 20;     // yer açarken hedefin kaydırma alanının üstüne bırakılan pay
const MIN_BUBBLE_H = 120;      // balonun okunabilir kaldığı alt sınır

/**
 * iPhone çentiği / Dynamic Island ve alttaki home çubuğu payı. Cihaza göre değişir
 * (13 mini'de 50/34, 17 Pro Max'te 62/34, eski cihazlarda 0), bu yüzden sabit sayı
 * yerine CSS'ten okunur. Bir kez hesaplanıp saklanır.
 */
let safeAreaCache = null;
function safeArea() {
    if (safeAreaCache) return safeAreaCache;
    const probe = document.createElement('div');
    probe.style.cssText =
        'position:fixed;visibility:hidden;pointer-events:none;left:0;' +
        'top:env(safe-area-inset-top,0px);bottom:env(safe-area-inset-bottom,0px)';
    document.body.appendChild(probe);
    const cs = window.getComputedStyle(probe);
    safeAreaCache = {
        top: parseFloat(cs.top) || 0,
        bottom: parseFloat(cs.bottom) || 0,
    };
    probe.remove();
    return safeAreaCache;
}

/**
 * Hedefi taşıyan gerçek kaydırma alanını bulur. Uygulamada sayfa `window` değil,
 * AppLayout'taki `<main overflow-y-auto>` üzerinden kayar.
 */
function scrollableParent(el) {
    let p = el.parentElement;
    while (p && p !== document.body) {
        const s = window.getComputedStyle(p);
        if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight - p.clientHeight > 1) return p;
        p = p.parentElement;
    }
    return document.scrollingElement || document.documentElement;
}

/**
 * Balonun üstüne çıkamayacağı sınırı hesaplar: kaydırma alanının üst kenarı
 * (uygulama header'ının altı) ve varsa sayfanın KENDİ sabit başlığının altı.
 * Sure detayında ikinci bir sticky başlık var; onsuz balon üzerine biniyordu.
 */
function measureContentTop(scrollEl, topAnchor) {
    const isPage = scrollEl === document.scrollingElement || scrollEl === document.documentElement;
    let top = isPage ? 0 : scrollEl.getBoundingClientRect().top;
    if (topAnchor) {
        const anchor = document.querySelector(topAnchor);
        if (anchor) top = Math.max(top, anchor.getBoundingClientRect().bottom);
    }
    return top;
}

export default function HintCoach({ targetId, titleKey, bodyKey, icon: Icon, ns = 'tracking', topAnchor, step = 0, total = 1, values, onClose }) {
    const { t } = useTranslation(ns);
    const [rect, setRect] = useState(null);
    const [bubbleH, setBubbleH] = useState(150);
    const [bubbleBox, setBubbleBox] = useState(null);
    // Kaydırma alanının üst kenarı = uygulama header'ının altı. Balon bunun üstüne
    // çıkamaz; yoksa kaydırırken başlık çubuğunun üzerine biner.
    const [contentTop, setContentTop] = useState(0);
    const bubbleRef = useRef(null);
    const closedRef = useRef(false);
    const located = rect !== null;

    const close = useCallback((markSeen = true) => {
        if (closedRef.current) return;
        closedRef.current = true;
        onClose?.(markSeen);
    }, [onClose]);

    // Hedefi bul ve ölç
    useEffect(() => {
        let cancelled = false;
        let tries = 0;
        let scrolled = false;

        const locate = () => {
            if (cancelled) return;
            const el = document.querySelector(`[data-tour="${targetId}"]`);
            if (!el) {
                if (tries++ < MAX_TRIES) requestAnimationFrame(locate);
                else close(false);          // hedef yok: ipucu iptal, bir dahakine tekrar denenir
                return;
            }

            const r = el.getBoundingClientRect();
            const vh = window.innerHeight;
            const sa = safeArea();
            const sc = scrollableParent(el);
            const scTop = measureContentTop(sc, topAnchor);
            const topEdge = Math.max(EDGE + sa.top, scTop + EDGE);
            const bottomLimit = vh - BOTTOM_SAFE - sa.bottom;
            // Balon HER ZAMAN hedefin altında dursun. Altta yer yoksa (ya da hedef hiç
            // görünmüyorsa) hedefi bir kez yukarı çekip yer açarız — ORTALAMAK yetmiyor,
            // küçük ekranlarda hedefin altında balona alan kalmıyor. Yalnız kısa hedefler
            // kaydırılır: ekrandan uzun bir konteyneri taşımak listenin ortasına atlar.
            const offscreen = r.bottom < topEdge || r.top > bottomLimit;
            const noRoomBelow = r.bottom + PAD + GAP + EST_BUBBLE_H > bottomLimit;
            if (!scrolled && r.height < vh * 0.6 && (offscreen || noRoomBelow)) {
                scrolled = true;
                sc.scrollTop += r.top - Math.max(topEdge, scTop + SCROLL_TOP_PAD);
                requestAnimationFrame(locate);
                return;
            }

            setContentTop(scTop);
            setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        };

        requestAnimationFrame(locate);
        return () => { cancelled = true; };
    }, [targetId, topAnchor, close]);

    // Kaydırma / boyut / yön değişiminde halka hedefi takip etsin.
    // DİKKAT: deps'te `rect` DEĞİL `located` var — rect her ölçümde yeni bir nesne, onu
    // bağımlılık yapmak kaydırma sırasında bu effect'i (ve aşağıdaki zamanlayıcıları)
    // her karede yeniden kurar. rAF throttle + değişmediyse setState atlama, jank'ı önler.
    useEffect(() => {
        if (!located) return;
        let ticking = false;
        let cancelled = false;
        const remeasure = () => {
            if (ticking || cancelled) return;
            ticking = true;
            requestAnimationFrame(() => {
                ticking = false;
                // Sekme değişip bileşen sökülürken bekleyen kare, YANLIŞ sekmeyi
                // "görüldü" işaretlemesin.
                if (cancelled) return;
                const el = document.querySelector(`[data-tour="${targetId}"]`);
                // Hedef ekrandan kalktıysa (ör. sure listesinden sureye girildi) halka
                // boşlukta donup kalmasın — ipucu kapanır.
                if (!el) { close(true); return; }
                setContentTop(measureContentTop(scrollableParent(el), topAnchor));
                const r = el.getBoundingClientRect();
                // Kaydırma ipucuyu KAPATMAZ — kullanıcı okurken sayfayı gezebilmeli.
                // Balon başlık çubuğu ile reklam bandı arasına sıkışır, halka hedefle kayar.
                setRect(prev => (
                    prev && prev.top === r.top && prev.left === r.left
                        && prev.width === r.width && prev.height === r.height
                        ? prev
                        : { top: r.top, left: r.left, width: r.width, height: r.height }
                ));
            });
        };
        window.addEventListener('resize', remeasure);
        window.addEventListener('orientationchange', remeasure);
        window.addEventListener('scroll', remeasure, true);
        // Olaysız yer değiştirmeler için (kart açılması, liste yerine detay gelmesi,
        // AnimatePresence geçişleri) seyrek yoklama — hedef gittiyse ipucunu kapatır.
        const poll = setInterval(remeasure, 400);
        return () => {
            cancelled = true;
            clearInterval(poll);
            window.removeEventListener('resize', remeasure);
            window.removeEventListener('orientationchange', remeasure);
            window.removeEventListener('scroll', remeasure, true);
        };
    }, [located, targetId, topAnchor, close]);

    // Balonun GERÇEK ölçüsü (dile/metin uzunluğuna göre değişir). Yükseklik konumu
    // sıkıştırmak için, sol kenar + genişlik ise oku halkanın merkezine hizalamak için.
    useLayoutEffect(() => {
        const el = bubbleRef.current;
        if (!el) return;
        const apply = () => {
            const h = el.offsetHeight;
            setBubbleH(prev => (h && Math.abs(h - prev) > 2 ? h : prev));
            const r = el.getBoundingClientRect();
            setBubbleBox(prev => (
                prev && Math.abs(prev.left - r.left) < 1 && Math.abs(prev.width - r.width) < 1
                    ? prev
                    : { left: r.left, width: r.width }
            ));
        };
        apply();
        const ro = new ResizeObserver(apply);
        ro.observe(el);
        return () => ro.disconnect();
    }, [located]);

    // Bir süre sonra kendiliğinden kapan ve SIRADAKİNE geç (kapanış zinciri bitirmez).
    // `close` deps'te DEĞİL: sayfa yeniden render olunca (sayaç, ses, widget senkronu)
    // referansı değişip süreyi baştan başlatıyordu — ipucu beklenenden geç kayboluyordu.
    const closeRef = useRef(close);
    closeRef.current = close;
    useEffect(() => {
        if (!located) return;
        const timer = setTimeout(() => closeRef.current(true), AUTO_DISMISS_MS);
        return () => clearTimeout(timer);
    }, [located]);

    // Balon dışına DOKUNULUNCA kapan (dokunuş engellenmez, alttaki elemana da gider).
    // `pointerdown` DEĞİL `click`: parmağı basıp kaydırmak tıklama sayılmaz, böylece
    // sayfayı gezerken ipucu kaybolmaz. Sekmeyi açan dokunuşu yakalamamak için gecikme.
    useEffect(() => {
        if (!located) return;
        let armed = false;
        const arm = setTimeout(() => { armed = true; }, 400);
        const onTap = (e) => {
            if (!armed) return;
            if (bubbleRef.current?.contains(e.target)) return;
            close(true);
        };
        document.addEventListener('click', onTap, true);
        return () => {
            clearTimeout(arm);
            document.removeEventListener('click', onTap, true);
        };
    }, [located, close]);

    if (!rect) return null;

    const vh = window.innerHeight;
    const ring = {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
    };

    // Balon: hedefin altında (varsayılan). Yer açılamadıysa üstte. Her iki durumda da
    // çentik/home çubuğu payları hesaba katılır ve balon O TARAFTAKİ boşluğa sığacak
    // şekilde sınırlanır — böylece uzun bir çeviri bile halkanın üstüne binemez;
    // taşan metin balonun içinde kayar.
    const sa = safeArea();
    const topEdge = Math.max(EDGE + sa.top, contentTop + EDGE);
    const bottomLimit = vh - BOTTOM_SAFE - sa.bottom;
    const belowTop = ring.top + ring.height + GAP;
    const roomBelow = bottomLimit - belowTop;
    const roomAbove = ring.top - GAP - topEdge;
    const fitsBelow = bubbleH <= roomBelow;
    const maxBubbleH = Math.max(MIN_BUBBLE_H, fitsBelow ? roomBelow : roomAbove);
    // Üstte konumlanırken iki sınır birden: halkanın üstünde kal VE alt banda girme
    // (hedefin kendisi bandın içinde kalmış olabilir — o zaman halka değil bant belirler).
    const effBubbleH = Math.min(bubbleH, maxBubbleH);
    const bubbleTop = fitsBelow
        // Alttayken de üst sınır şart: hedef kayarsa balon başlık çubuğuna tırmanmasın
        ? Math.max(topEdge, Math.min(belowTop, bottomLimit - effBubbleH))
        : Math.max(topEdge, Math.min(ring.top - GAP - effBubbleH, bottomLimit - effBubbleH));

    // Balonu halkaya bağlayan ok — halkanın yatay merkezine hizalanır, balonun
    // köşelerine yapışmaması için kenarlardan CARET_INSET kadar içeride tutulur.
    // Kullanıcı kaydırıp halkayı uzaklaştırdıysa balon sınırına yapışır; o anda ok
    // yanlış yeri gösterir, gizlenir.
    const attached = fitsBelow
        ? Math.abs(bubbleTop - belowTop) < 1
        : Math.abs(bubbleTop + effBubbleH - (ring.top - GAP)) < 1;
    const ringCenterX = ring.left + ring.width / 2;
    const caretLeft = bubbleBox && attached
        ? Math.max(CARET_INSET, Math.min(ringCenterX - bubbleBox.left, bubbleBox.width - CARET_INSET))
        : null;

    return createPortal(
        <div className="fixed inset-0 z-[200] pointer-events-none">
            {/* Nefes alan glow — halkanın altında yumuşak hale */}
            <motion.div
                animate={{ opacity: [0.25, 0.6, 0.25], scale: [0.98, 1.06, 0.98] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute rounded-[1.6rem] pointer-events-none bg-amber-500/25 dark:bg-islamic-gold/25 blur-xl"
                style={{ top: ring.top, left: ring.left, width: ring.width, height: ring.height }}
            />

            {/* Yanıp sönen halka — dokunuşu geçirir */}
            <motion.div
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute rounded-[1.25rem] pointer-events-none ring-2 ring-amber-500 dark:ring-islamic-gold"
                style={{
                    top: ring.top,
                    left: ring.left,
                    width: ring.width,
                    height: ring.height,
                    boxShadow: '0 0 0 4px rgba(212,175,55,0.14), 0 0 18px rgba(212,175,55,0.3)',
                }}
            />

            {/* İpucu balonu */}
            <motion.div
                ref={bubbleRef}
                initial={{ opacity: 0, y: fitsBelow ? 14 : -14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                style={{ top: bubbleTop, maxHeight: maxBubbleH }}
                className={cn(
                    'absolute left-4 right-4 mx-auto max-w-sm pointer-events-auto',
                    'rounded-[1.75rem] overflow-hidden',
                    'bg-gradient-to-b from-[#FFFDF6] to-[#F7F0DF] dark:from-[#0d4527] dark:to-[#062c18]',
                    'border border-[#E7DCC2] dark:border-islamic-gold/20',
                    'shadow-[0_20px_48px_-16px_rgba(146,64,14,0.32),0_2px_8px_-2px_rgba(0,0,0,0.08)]',
                    'dark:shadow-[0_24px_56px_-18px_rgba(0,0,0,0.75),0_0_28px_-8px_rgba(212,175,55,0.28)]'
                )}
            >
                {/* Üst kenarda altın ışık şeridi — kartın "aydınlandığı" hissi */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 dark:via-islamic-gold/70 to-transparent" />
                {/* Sağ üstte tek kısıtlı hale */}
                <div className="absolute -top-10 -right-8 w-32 h-32 rounded-full bg-amber-400/10 dark:bg-islamic-gold/10 blur-2xl pointer-events-none" />

                {/* Aşırı dar/kısa ekranda uzun çeviri taşarsa balon değil, içerik kayar */}
                <div className="relative px-4 pt-4 pb-3 overflow-y-auto overscroll-contain" style={{ maxHeight: maxBubbleH }}>
                    <div className="flex items-start gap-3">
                        {Icon && (
                            <motion.div
                                initial={{ scale: 0.4, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 420, damping: 22 }}
                                className="shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-700 dark:from-[#E8C766] dark:to-[#C9A227] shadow-[0_6px_14px_-6px_rgba(180,83,9,0.7)] dark:shadow-[0_6px_16px_-6px_rgba(212,175,55,0.6)]"
                            >
                                <Icon size={17} className="text-white dark:text-[#032e18]" strokeWidth={2.4} />
                            </motion.div>
                        )}

                        <div className="min-w-0 flex-1">
                            <h3 className="text-[15px] font-bold tracking-tight text-stone-900 dark:text-amber-50 leading-snug">
                                {t(titleKey, values)}
                            </h3>
                            {/* values: metindeki {{cost}} gibi yerleri dolduran değerler (ör. kredi tutarları) */}
                            <p className="mt-1 text-[12.5px] leading-relaxed text-stone-600 dark:text-amber-50/65">
                                {t(bodyKey, values)}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => close(true)}
                            aria-label={t('tour.gotIt')}
                            className="shrink-0 -mt-1 -mr-1 w-7 h-7 rounded-full flex items-center justify-center text-stone-400 dark:text-amber-50/35 active:bg-black/5 dark:active:bg-white/10 transition-colors"
                        >
                            <X size={15} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-3">
                        {/* Adım noktaları: zincirde birden fazla ipucu varsa kaç tane
                            kaldığı görünür. Tek ipuçlu sekmelerde hiç çizilmez. */}
                        {total > 1 ? (
                            <div className="flex items-center gap-1.5 pl-1">
                                {Array.from({ length: total }, (_, i) => (
                                    <span
                                        key={i}
                                        className={cn(
                                            'h-1.5 rounded-full transition-all duration-300',
                                            i === step
                                                ? 'w-5 bg-amber-600 dark:bg-islamic-gold'
                                                : i < step
                                                    ? 'w-1.5 bg-amber-600/45 dark:bg-islamic-gold/45'
                                                    : 'w-1.5 bg-stone-300 dark:bg-white/20'
                                        )}
                                    />
                                ))}
                            </div>
                        ) : <span />}

                        <button
                            type="button"
                            onClick={() => close(true)}
                            className="rounded-full px-5 h-9 text-[12.5px] font-bold tracking-tight text-white dark:text-[#032e18] bg-gradient-to-b from-amber-600 to-amber-700 dark:from-[#E8C766] dark:to-[#CFA83A] shadow-[0_8px_18px_-8px_rgba(180,83,9,0.85)] dark:shadow-[0_8px_20px_-8px_rgba(212,175,55,0.65)] active:scale-95 transition-transform"
                        >
                            {step < total - 1 ? t('tour.next') : t('tour.gotIt')}
                        </button>
                    </div>
                </div>

                {/* Kendiliğinden kapanma sayacı — dipteki ince altın çizgi */}
                <motion.div
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
                    className="absolute bottom-0 left-0 right-0 h-[2px] origin-left bg-gradient-to-r from-amber-500/70 dark:from-islamic-gold/70 to-transparent"
                />
            </motion.div>

            {/* Balonu halkaya bağlayan ok */}
            {caretLeft !== null && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.08 }}
                    className={cn(
                        'absolute w-3 h-3 rotate-45 pointer-events-none',
                        fitsBelow
                            ? 'bg-[#FFFDF6] dark:bg-[#0d4527] border-t border-l border-[#E7DCC2] dark:border-islamic-gold/20'
                            : 'bg-[#F7F0DF] dark:bg-[#062c18] border-b border-r border-[#E7DCC2] dark:border-islamic-gold/20'
                    )}
                    style={{
                        left: bubbleBox.left + caretLeft - 6,
                        top: fitsBelow ? bubbleTop - 6 : bubbleTop + bubbleH - 6,
                    }}
                />
            )}
        </div>,
        document.body
    );
}
