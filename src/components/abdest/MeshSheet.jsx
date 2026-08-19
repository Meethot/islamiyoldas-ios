import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronDown, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import { analytics } from '@/services/analyticsService';
import { readMest, startMest, setTraveler, mestStatus, formatClock, MEST_KEY } from '@/lib/mestMesh';
import { rescheduleMestReminders, cancelMestReminders } from '@/lib/mestNotify';
import { MESH_SECTIONS } from '@/data/abdestTopics';


const ICON_BTN = 'flex h-10 w-10 items-center justify-center rounded-full text-stone-500 transition-colors active:bg-black/[0.05] dark:text-emerald-100/70 dark:active:bg-white/10';

/**
 * Katlanır fıkıh bölümü.
 *
 * `highlight`: merkez aramasından bu bölüme gelindi. Kapalı açılsaydı
 * kullanıcı aradığı cevabı görmez, dokuz başlıktan hangisi olduğunu
 * tahmin etmek zorunda kalırdı.
 */
function Section({ id, highlight = false }) {
    const { t } = useTranslation('learn');
    const [open, setOpen] = useState(highlight);
    const ref = useRef(null);
    const safii = t(`mesh.sections.${id}.safii`, { defaultValue: '' });

    useEffect(() => {
        if (!highlight) return undefined;
        // Tabakanın açılış animasyonu bitmeden kaydırmak yanlış konuma götürür.
        const timer = setTimeout(() => {
            ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }, 320);
        return () => clearTimeout(timer);
    }, [highlight]);

    return (
        <div ref={ref} className="scroll-mt-2 border-t border-[#E2D9C4] py-1 first:border-t-0 dark:border-white/[0.08]">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
                className="flex w-full items-center gap-2 py-3 text-start"
            >
                <span className="min-w-0 flex-1 font-display text-[0.9375rem] font-semibold text-stone-800 dark:text-emerald-50">
                    {t(`mesh.sections.${id}.title`)}
                </span>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-black/40 transition-transform dark:text-emerald-100/40', open && 'rotate-180')} />
            </button>
            {open && (
                <div className="pb-4">
                    <p className="whitespace-pre-line text-[0.875rem] leading-relaxed text-stone-700 dark:text-emerald-100/70">
                        {t(`mesh.sections.${id}.body`)}
                    </p>
                    {safii && (
                        <p className="mt-3 border-s-2 border-[#B45309]/35 ps-3 text-[0.8125rem] leading-relaxed text-[#92400E] dark:border-islamic-gold/35 dark:text-islamic-gold/85">
                            {safii}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Tabakanın içi. Yalnız açıkken mount edilir; böylece hem sayaç kapalıyken
 * boşuna dönmez hem de ilk durum `useState` başlatıcısıyla okunur (effect
 * içinde setState yok).
 */
function MeshBody({ onStateChange, initialSection }) {
    const { t } = useTranslation('learn');
    const { light, success, heavy } = useHaptics();

    const [state, setState] = useState(readMest);
    const [now, setNow] = useState(() => Date.now());

    const status = mestStatus(state, now);

    // Saniyelik tik yalnız işleyen bir sayaç varken gerekir. Sayaç
    // başlamadıysa ya da süre dolduysa ekranda değişen bir şey yok;
    // tabaka açık kaldığı sürece boşuna render tetiklerdi.
    const ticking = !!state && state.startedAt > 0 && !status.expired;
    useEffect(() => {
        if (!ticking) return undefined;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [ticking]);

    const persist = useCallback((next) => {
        setState(next);
        try {
            if (next) localStorage.setItem(MEST_KEY, JSON.stringify(next));
            else localStorage.removeItem(MEST_KEY);
        } catch { /* depolama dolu / özel mod */ }
        onStateChange?.(next);

        const texts = {
            warnTitle: t('mesh.notifWarnTitle'),
            warnBody: t('mesh.notifWarnBody'),
            endTitle: t('mesh.notifEndTitle'),
            endBody: t('mesh.notifEndBody'),
        };
        if (next) rescheduleMestReminders(next, texts);
        else cancelMestReminders();
    }, [onStateChange, t]);

    const start = useCallback(() => {
        success();
        const next = startMest(state?.traveler ?? false);
        analytics.mestStarted(!!next.traveler);
        persist(next);
    }, [persist, state, success]);

    const reset = useCallback(() => {
        heavy();
        persist(null);
    }, [heavy, persist]);

    const toggleTraveler = useCallback((traveler) => {
        light();
        // Sayaç henüz başlamadıysa tercih yalnız bellekte tutulur; depoya
        // yazılmaz ve bildirim kurulmaz. `startedAt: 0` kaydı `readMest`
        // tarafından zaten reddediliyor — yazmak çöp bırakmak olurdu.
        if (!state || state.startedAt <= 0) {
            setState({ startedAt: 0, traveler, switchedAt: null });
            return;
        }
        persist(setTraveler(state, traveler));
    }, [light, persist, state]);

    // Süre dolduğu an bir kez ölçülür — sayacın işe yarayıp yaramadığı ancak
    // bununla görülür (kaç kişi süreyi sonuna kadar kullanıyor).
    // startedAt=0 → yalnız Mukim/Misafir tercihi tutuluyor, sayaç başlamadı.
    // Bu durumda mestStatus "süre doldu" der (elapsed = şimdiki zaman) ve
    // ölçüm sahte tetiklenirdi.
    const running = !!state && state.startedAt > 0;

    const expiredSentRef = useRef(false);
    useEffect(() => {
        if (running && status.expired && status.limitMs > 0 && !expiredSentRef.current) {
            expiredSentRef.current = true;
            analytics.mestExpired(!!state.traveler);
        }
        if (!status.expired) expiredSentRef.current = false;
    }, [running, status.expired, status.limitMs, state]);

    const traveler = !!state?.traveler;
    const pct = status.limitMs > 0 ? Math.min(100, (status.elapsedMs / status.limitMs) * 100) : 100;

    return (
        <>
            {running ? (
                <div className="rounded-3xl bg-[#FFFDF6] p-5 text-center shadow-[0_8px_26px_-18px_rgba(0,0,0,0.42)] dark:bg-white/5">
                    <p className="font-display text-[2.25rem] font-extrabold leading-none tabular-nums tracking-tight text-[#B45309] dark:text-islamic-gold">
                        {formatClock(status.remainingMs)}
                    </p>
                    <p className="mt-2 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-black/40 dark:text-emerald-100/40">
                        {t(traveler ? 'mesh.travelerLabel' : 'mesh.residentLabel')}
                    </p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#F0E8D5] dark:bg-white/10">
                        <div className="h-full rounded-full bg-[#B45309] dark:bg-islamic-gold" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-3 text-[0.8125rem] leading-relaxed text-stone-600 dark:text-emerald-100/60">
                        {status.expired ? t('mesh.expiredBody') : t('mesh.runningBody')}
                    </p>
                </div>
            ) : (
                <>
                    <div className="flex items-start gap-2.5 rounded-2xl border border-[#B45309]/25 bg-[#B45309]/[0.07] p-3.5 dark:border-islamic-gold/25 dark:bg-islamic-gold/[0.08]">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B45309] dark:text-islamic-gold" />
                        <p className="text-[0.8125rem] leading-relaxed text-[#7c4a10] dark:text-islamic-gold/90">
                            {t('mesh.beforeStart')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={start}
                        className="mt-3 w-full rounded-2xl bg-islamic-green py-4 font-display text-[0.9375rem] font-bold text-white active:opacity-90 dark:bg-islamic-gold dark:text-[#032e18]"
                    >
                        {t('mesh.startCta')}
                    </button>
                </>
            )}

            <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-[#F0E8D5] p-1 dark:bg-white/[0.06]">
                {[false, true].map(v => (
                    <button
                        key={String(v)}
                        type="button"
                        onClick={() => toggleTraveler(v)}
                        aria-pressed={traveler === v}
                        className={cn(
                            'rounded-full py-2 text-[0.8125rem] font-bold transition-colors',
                            traveler === v
                                ? 'bg-[#FFFDF6] text-[#B45309] shadow-sm dark:bg-white/10 dark:text-islamic-gold'
                                : 'text-gray-600 dark:text-emerald-100/55'
                        )}
                    >
                        {t(v ? 'mesh.travelerLabel' : 'mesh.residentLabel')}
                    </button>
                ))}
            </div>

            {running && (
                <button
                    type="button"
                    onClick={reset}
                    className="mt-1 w-full rounded-xl py-3 text-[0.8125rem] font-bold text-black/45 active:bg-black/[0.04] dark:text-emerald-100/45 dark:active:bg-white/10"
                >
                    {t('mesh.reset')}
                </button>
            )}
            {running && (
                <p className="px-1 pb-1 text-center text-[0.75rem] leading-relaxed text-black/40 dark:text-emerald-100/40">
                    {t('mesh.resetHint')}
                </p>
            )}

            <div className="mt-5 rounded-3xl bg-[#FFFDF6] px-4 dark:bg-white/5">
                {MESH_SECTIONS.map(id => <Section key={id} id={id} highlight={id === initialSection} />)}
            </div>

            {/* Bu ekran da hüküm veriyor; uyarı "Bozar mı?"da vardı, burada yoktu. */}
            <p className="px-1 pt-3 text-[0.6875rem] leading-relaxed text-black/40 dark:text-emerald-100/35">
                {t('breakerDisclaimer')}
            </p>
        </>
    );
}

/**
 * Mest ve sargı üzerine mesh — bilgi + süre sayacı.
 *
 * Sargının süresi YOKTUR (Diyanet: "belirli bir süresi yoktur"); sayaç yalnız
 * mest içindir, sargı bölümü metin olarak durur.
 *
 * Route DEĞİL, tabaka: `useSmartPaywall` her route değişiminde sayaç artırıyor.
 */
export default function MeshSheet({ open, isRtl, onClose, onStateChange, initialSection = null }) {
    const { t } = useTranslation('learn');
    const dragControls = useDragControls();
    const reduceMotion = useReducedMotion();

    useHardwareBack(open, onClose);

    // Alttaki liste kaymasın (DuaSheet kalıbı)
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
                        aria-label={t('topicMesh')}
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
                                {t('topicMesh')}
                            </span>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-10 pt-2">
                            <MeshBody onStateChange={onStateChange} initialSection={initialSection} />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
