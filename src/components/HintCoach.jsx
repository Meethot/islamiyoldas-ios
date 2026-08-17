import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
 * @param {func}   onClose   (markSeen: boolean) => void
 */
const AUTO_DISMISS_MS = 11000;
const MAX_TRIES = 45;          // ~0.75 sn — sekme geçiş animasyonu 0.3 sn
const GAP = 12;
const EDGE = 12;
// Alt şeritte alt menü ve (premium olmayanlarda) native AdMob banner'ı var.
// Banner WebView'ın ÜSTÜNDE yüzen native bir view — z-index onu örtemez,
// o yüzden balon bu bandın dışında tutulur. (banner margin 75 + yükseklik ~50)
const BOTTOM_SAFE = 132;

export default function HintCoach({ targetId, titleKey, bodyKey, ns = 'tracking', onClose }) {
    const { t } = useTranslation(ns);
    const [rect, setRect] = useState(null);
    const [bubbleH, setBubbleH] = useState(150);
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
            // Hedef TAMAMEN görünmez ise bir kez ortaya getir — ve sadece kısa hedefler için.
            // (Kısmen görünene dokunma: gereksiz kaydırma rahatsız eder. Ekrandan uzun bir
            //  konteyneri ortalamak ise listenin ortasına atlar.)
            if (!scrolled && r.height < vh * 0.6 && (r.bottom < EDGE || r.top > vh - EDGE)) {
                scrolled = true;
                el.scrollIntoView({ block: 'center', behavior: 'auto' });
                requestAnimationFrame(locate);
                return;
            }

            setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        };

        requestAnimationFrame(locate);
        return () => { cancelled = true; };
    }, [targetId, close]);

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
                const r = el.getBoundingClientRect();
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
    }, [located, targetId, close]);

    // Balonun GERÇEK yüksekliği (dile/metin uzunluğuna göre değişir) — konumu buna göre
    // sıkıştırıyoruz ki balon ekranın üstünden taşıp başlığı kesmesin.
    useLayoutEffect(() => {
        const el = bubbleRef.current;
        if (!el) return;
        const apply = () => {
            const h = el.offsetHeight;
            setBubbleH(prev => (h && Math.abs(h - prev) > 2 ? h : prev));
        };
        apply();
        const ro = new ResizeObserver(apply);
        ro.observe(el);
        return () => ro.disconnect();
    }, [located]);

    // Bir süre sonra kendiliğinden kapan (kaydırma zamanlayıcıyı sıfırlamaz — bkz. `located`)
    useEffect(() => {
        if (!located) return;
        const timer = setTimeout(() => close(true), AUTO_DISMISS_MS);
        return () => clearTimeout(timer);
    }, [located, close]);

    // Balon dışına dokunulunca kapan (dokunuş engellenmez, alttaki elemana da gider).
    // Sekmeyi açan dokunuşun kendisini yakalamamak için kısa gecikme.
    useEffect(() => {
        if (!located) return;
        let armed = false;
        const arm = setTimeout(() => { armed = true; }, 400);
        const onDown = (e) => {
            if (!armed) return;
            if (bubbleRef.current?.contains(e.target)) return;
            close(true);
        };
        document.addEventListener('pointerdown', onDown, true);
        return () => {
            clearTimeout(arm);
            document.removeEventListener('pointerdown', onDown, true);
        };
    }, [located, close]);

    if (!rect) return null;

    const vh = window.innerHeight;
    const PAD = 6;
    const ring = {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
    };

    // Balon: altta yer varsa altta, yoksa üstte; her iki durumda görünür alana sıkıştırılır
    const bottomLimit = vh - BOTTOM_SAFE;
    const belowTop = ring.top + ring.height + GAP;
    const fitsBelow = belowTop + bubbleH <= bottomLimit;
    const bubbleTop = fitsBelow
        ? belowTop
        : Math.max(EDGE, Math.min(ring.top - GAP - bubbleH, bottomLimit - bubbleH));

    return createPortal(
        <div className="fixed inset-0 z-[200] pointer-events-none">
            {/* Yanıp sönen halka — dokunuşu geçirir */}
            <motion.div
                animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.02, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute rounded-[1.25rem] pointer-events-none ring-[3px] ring-islamic-gold"
                style={{
                    top: ring.top,
                    left: ring.left,
                    width: ring.width,
                    height: ring.height,
                    boxShadow: '0 0 0 5px rgba(212,175,55,0.18), 0 0 22px rgba(212,175,55,0.35)',
                }}
            />

            {/* İpucu balonu */}
            <motion.div
                ref={bubbleRef}
                initial={{ opacity: 0, y: fitsBelow ? 10 : -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{ top: bubbleTop }}
                className="absolute left-4 right-4 mx-auto max-w-sm pointer-events-auto rounded-3xl bg-[#FFFDF6] dark:bg-[#0b3d22] border border-[#E2D9C4] dark:border-islamic-gold/25 shadow-xl px-4 py-3.5"
            >
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[13.5px] font-bold text-stone-900 dark:text-white leading-snug">
                        {t(titleKey)}
                    </h3>
                    <button
                        type="button"
                        onClick={() => close(true)}
                        aria-label={t('tour.gotIt')}
                        className="shrink-0 -mt-0.5 -mr-1 p-1 rounded-full text-stone-400 dark:text-white/40 active:bg-black/5 dark:active:bg-white/10"
                    >
                        <X size={15} />
                    </button>
                </div>

                <p className="mt-1 text-[12.5px] leading-relaxed text-stone-600 dark:text-white/70">
                    {t(bodyKey)}
                </p>

                <div className="flex justify-end mt-2.5">
                    <button
                        type="button"
                        onClick={() => close(true)}
                        className="rounded-full px-4 h-8 text-[12px] font-bold bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] active:scale-95 transition-transform"
                    >
                        {t('tour.gotIt')}
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
