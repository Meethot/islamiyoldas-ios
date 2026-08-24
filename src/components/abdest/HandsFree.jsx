import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import { wuduMeta, stepImage } from '@/data/wuduSteps';
import { analytics } from '@/services/analyticsService';

/** Adım süreleri. Tekrarlı adımlar (3 kere yıkama) daha uzun sürer. */
const STEP_MS = 9000;
const REPEAT_STEP_MS = 15000;
const TICK_MS = 100;

const RING = 2 * Math.PI * 26;

/**
 * Hız çarpanı. Sabit 9 saniye kullanıcının GERÇEK hızını varsayıyordu: yavaş
 * yıkayan geride kalıyor ve elleri ıslakken yakalayamıyordu (ekrana dokunmak
 * bu modun tüm varlık sebebine aykırı). Seçim hatırlanır.
 */
const SPEEDS = { slow: 1.6, normal: 1, fast: 0.7 };
const SPEED_KEY = 'abdest_handsfree_speed';
const readSpeed = () => {
    try {
        const v = localStorage.getItem(SPEED_KEY);
        return v && SPEEDS[v] ? v : 'normal';
    } catch { return 'normal'; }
};

const durationOf = (step) => (step?.repeat ? REPEAT_STEP_MS : STEP_MS);

/** Adım görseli. `key={index}` ile her adımda yeniden kurulur; hata durumu
 *  effect'le sıfırlanmak zorunda kalmaz. */
function StepImage({ src }) {
    const [ok, setOk] = useState(true);
    const [loaded, setLoaded] = useState(false);
    if (!src || !ok) return null;
    return (
        <img
            src={src}
            alt=""
            aria-hidden="true"
            onLoad={() => setLoaded(true)}
            onError={() => setOk(false)}
            // Yüklenmeden yer ayrılmaz: dosya yoksa kart zıplamaz.
            className={cn('aspect-square w-full object-cover', !loaded && 'hidden')}
        />
    );
}

/**
 * Modun içi. Yalnız açıkken mount edilir; böylece "baştan başla" bir
 * sıfırlama effect'i değil, `useState` başlatıcısı olur.
 */
function HandsFreeBody({ steps, onClose }) {
    const { t } = useTranslation('learn');
    const { light, success } = useHaptics();

    const [index, setIndex] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    // Sayaç değerinin ref kopyası: adım sınırı state updater'ının İÇİNDE
    // kontrol edilirse StrictMode updater'ı iki kez çalıştırıp adımı çift
    // atlatıyor. Yan etki updater dışında, ref üzerinden yapılır.
    const elapsedRef = useRef(0);
    const [paused, setPaused] = useState(false);
    const [done, setDone] = useState(false);

    const total = steps?.length || 0;
    const step = steps?.[index] || null;
    const [speed, setSpeed] = useState(readSpeed);
    const duration = Math.round(durationOf(step) * (SPEEDS[speed] || 1));

    /**
     * Ekran uykusunu engelle. Tarayıcı sekme gizlenince kilidi kendiliğinden
     * bırakır; geri dönüldüğünde yeniden alınır.
     */
    useEffect(() => {
        let lock = null;
        let released = false;
        const acquire = async () => {
            try {
                const got = await navigator.wakeLock?.request('screen');
                // İstek beklerken bileşen söküldüyse kilidi hemen bırak;
                // yoksa ekran sayfa kapanana kadar açık kalırdı.
                if (released) { try { got?.release(); } catch { /* yok say */ } return; }
                lock = got;
            } catch {
                // izin yok / desteklenmiyor: mod yine çalışır
            }
        };
        acquire();
        const onVisible = () => { if (document.visibilityState === 'visible' && !released) acquire(); };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            released = true;
            document.removeEventListener('visibilitychange', onVisible);
            try { lock?.release(); } catch { /* zaten bırakılmış */ }
        };
    }, []);

    const reset = useCallback(() => { elapsedRef.current = 0; setElapsed(0); }, []);

    const goNext = useCallback(() => {
        reset();
        setIndex(prev => {
            if (prev < total - 1) return prev + 1;
            return prev;
        });
        if (index >= total - 1) {
            success();
            setDone(true);
            analytics.abdestHandsFreeDone(total);
        } else light();
    }, [index, light, reset, success, total]);

    const goPrev = useCallback(() => {
        light();
        reset();
        setIndex(prev => Math.max(0, prev - 1));
    }, [light, reset]);

    /**
     * Sayaç. `goNext` bir REF üzerinden okunur: `useHaptics` her render'da yeni
     * fonksiyon kimliği döndürdüğü için (light/success `useCallback` değil)
     * goNext de her render'da değişiyor. Doğrudan bağımlılık verilseydi interval
     * her render'da sökülüp yeniden kurulur, bekleyen tik iptal olurdu — üst
     * bileşen sık render ederse geri sayım hiç ilerlemezdi.
     */
    const goNextRef = useRef(goNext);
    useEffect(() => { goNextRef.current = goNext; });

    useEffect(() => {
        if (paused || done || !total) return undefined;
        const timer = setInterval(() => {
            const next = elapsedRef.current + TICK_MS;
            if (next >= duration) { goNextRef.current(); return; }
            elapsedRef.current = next;
            setElapsed(next);
        }, TICK_MS);
        return () => clearInterval(timer);
    }, [paused, done, total, duration]);

    // Kapanış duası adımı akışta var mı? Kısa modda süzülüp düşüyor.
    const hasClosingDua = useMemo(
        () => (steps || []).some(st => st?.id === 'wudu-bitis-dua'),
        [steps]
    );

    const meta = useMemo(() => (step ? wuduMeta(step) : null), [step]);
    const image = stepImage(meta);
    const progress = Math.min(1, elapsed / duration);
    const secondsLeft = Math.max(0, Math.ceil((duration - elapsed) / 1000));
    // Tekrar sayısı yerelleştirilmiş metinden okunur ("3x tekrar", "3 مرات").
    // Sabit 3 yazmak sessiz bir varsayım olurdu.
    const repeatCount = useMemo(() => {
        const n = parseInt(String(step?.repeat || '').match(/\d+/)?.[0] || '', 10);
        return Number.isFinite(n) && n > 1 && n <= 9 ? n : (step?.repeat ? 3 : 1);
    }, [step]);
    const repeatDone = Math.min(repeatCount, Math.floor(progress * repeatCount) + (progress > 0 ? 1 : 0));

    return (
        <>
        <div className="flex shrink-0 items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
            <span className="py-3 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-black/40 dark:text-emerald-100/40">
                {done ? '' : t('handsFreeStepOf', { i: index + 1, n: total })}
            </span>
            <button
                type="button"
                onClick={onClose}
                aria-label={t('duaClose')}
                className="-me-2 flex h-11 w-11 items-center justify-center rounded-full text-stone-500 active:bg-black/[0.05] dark:text-emerald-100/70 dark:active:bg-white/10"
            >
                <X className="h-5 w-5" />
            </button>
        </div>

        {done ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
                <h2 className="font-display text-[2rem] font-extrabold leading-tight tracking-tight text-islamic-green dark:text-islamic-gold">
                    {t('handsFreeDone')}
                </h2>
                <p className="max-w-[18rem] text-[0.9375rem] leading-relaxed text-stone-600 dark:text-emerald-100/60">
                    {/* Kısa modda kapanış duası adımı listede YOK; metin onu
                        okumayı hatırlatınca kullanıcı hiç görmediği bir şeye
                        yönlendiriliyordu. */}
                    {t(hasClosingDua ? 'handsFreeDoneSub' : 'handsFreeDoneSubNoDua')}
                </p>
                <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 w-full max-w-[16rem] rounded-2xl bg-islamic-green py-4 font-display text-[0.9375rem] font-bold text-white active:opacity-90 dark:bg-islamic-gold dark:text-[#032e18]"
                >
                    {t('ezberFinish')}
                </button>
            </div>
        ) : (
            /* Kaydırılabilir: talimat metni eklendi ve görseller geldiğinde
               kart uzayacak. Fıkhî talimat KIRPILAMAZ (rule: line-clamp yok),
               o yüzden taşma kırpmayla değil kaydırmayla çözülüyor —
               `--app-font-scale` 1.3'te de aynı yol geçerli. */
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-5 py-2">
                <div className="w-full max-w-[22rem] overflow-hidden rounded-[1.75rem] bg-[#FFFDF6] shadow-[0_10px_40px_-18px_rgba(0,0,0,0.3)] dark:bg-white/5">
                    <StepImage key={index} src={image} />
                    <div className="px-5 py-5 text-center">
                        <h2 className="font-display text-[1.6rem] font-extrabold leading-tight tracking-tight text-balance text-stone-900 dark:text-white">
                            {step?.title}
                        </h2>

                        {/* Modun asıl içeriği. Telefon tezgâhta ve kol boyu
                            uzakta olduğu için normal kart puntosundan büyük;
                            fıkhî talimat KIRPILMAZ (yüz yıkamanın sınırını
                            tarif eden cümle tam bu metnin içinde). */}
                        {step?.instruction && (
                            <p className="mx-auto mt-3 max-w-[19rem] text-[1.0625rem] leading-[1.5] text-stone-700 dark:text-emerald-100/75">
                                {step.instruction}
                            </p>
                        )}

                        {repeatCount > 1 && (
                            <>
                                <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
                                    {Array.from({ length: repeatCount }).map((_, i) => (
                                        <span
                                            key={i}
                                            className={cn(
                                                'h-2.5 w-2.5 rounded-full transition-colors',
                                                i < repeatDone
                                                    ? 'bg-[#B45309] dark:bg-islamic-gold'
                                                    : 'bg-[#F0E8D5] dark:bg-white/15'
                                            )}
                                        />
                                    ))}
                                </div>
                                <p className="mt-2 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-black/35 dark:text-emerald-100/35">
                                    {t('handsFreeRepeat', { n: repeatCount })}
                                </p>
                            </>
                        )}

                        <div className="mt-4 flex justify-center">
                            <svg viewBox="0 0 60 60" className="h-[3.75rem] w-[3.75rem] -rotate-90">
                                <circle cx="30" cy="30" r="26" fill="none" strokeWidth="4"
                                    className="stroke-[#F0E8D5] dark:stroke-white/10" />
                                <circle cx="30" cy="30" r="26" fill="none" strokeWidth="4" strokeLinecap="round"
                                    className="stroke-[#B45309] dark:stroke-islamic-gold"
                                    strokeDasharray={RING}
                                    strokeDashoffset={RING * (1 - progress)} />
                                <text x="30" y="30" textAnchor="middle" dominantBaseline="central"
                                    className="rotate-90 fill-[#B45309] font-display text-[1.1rem] font-black tabular-nums dark:fill-islamic-gold"
                                    style={{ transformOrigin: '30px 30px' }}>
                                    {secondsLeft}
                                </text>
                            </svg>
                        </div>
                    </div>
                </div>

                <p className="max-w-[20rem] text-center text-[0.75rem] leading-relaxed text-black/40 dark:text-emerald-100/35">
                    {t('handsFreeHint')}
                </p>
            </div>
        )}

        {!done && (
            <div className="shrink-0 px-5 pb-2">
                <div className="mx-auto grid max-w-[22rem] grid-cols-3 gap-1 rounded-full bg-[#F0E8D5] p-1 dark:bg-white/[0.06]">
                    {['slow', 'normal', 'fast'].map(sp => (
                        <button
                            key={sp}
                            type="button"
                            aria-pressed={speed === sp}
                            onClick={() => {
                                light();
                                setSpeed(sp);
                                try { localStorage.setItem(SPEED_KEY, sp); } catch { /* özel mod */ }
                            }}
                            className={cn(
                                'rounded-full py-2 text-[0.8125rem] font-bold transition-colors',
                                speed === sp
                                    ? 'bg-[#FFFDF6] text-[#B45309] shadow-sm dark:bg-white/10 dark:text-islamic-gold'
                                    : 'text-stone-600 dark:text-emerald-100/55'
                            )}
                        >
                            {t(sp === 'slow' ? 'handsFreeSlow' : sp === 'fast' ? 'handsFreeFast' : 'handsFreeNormal')}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {!done && (
            <div className="flex shrink-0 items-stretch gap-2 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
                <button
                    type="button"
                    onClick={goPrev}
                    disabled={index === 0}
                    aria-label={t('navBack')}
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#EDE5D1] bg-[#FFFDF6] text-stone-500 disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                    <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
                </button>
                <button
                    type="button"
                    onClick={() => { light(); setPaused(p => !p); }}
                    className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#B45309]/35 font-display text-[0.9375rem] font-bold text-[#B45309] active:bg-[#B45309]/[0.06] dark:border-islamic-gold/35 dark:text-islamic-gold"
                >
                    {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {t(paused ? 'handsFreeResume' : 'handsFreePause')}
                </button>
                <button
                    type="button"
                    onClick={goNext}
                    aria-label={t('navNext')}
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#EDE5D1] bg-[#FFFDF6] text-stone-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                    <ChevronRight className="h-5 w-5 rtl:rotate-180" />
                </button>
            </div>
        )}
        </>
    );
}

/**
 * "Eller ıslakken beraber al".
 *
 * Teşhisteki asıl gerçeğin cevabı: abdest alırken eller ıslaktır, kimse
 * musluk başında telefon kaydırmaz. Telefon tezgâha konur; büyük görsel,
 * büyük başlık, adımlar kendi ilerler, her geçişte titreşim.
 *
 * Ses YOK: uygulamada TTS yok ve altı dilde insan sesi kaydı bu işin
 * bütçesini ikiye katlardı. Titreşim + büyük görsel aynı işi görüyor.
 *
 * Ekranın uyumaması için `navigator.wakeLock` kullanılır — native plugin
 * GEREKMEZ. Desteklemeyen eski sürümlerde mod yine çalışır, yalnız ekran
 * kararabilir; dokunmak yeter.
 */
export default function HandsFree({ open, steps, onClose }) {
    const { t } = useTranslation('learn');
    const reduceMotion = useReducedMotion();
    useHardwareBack(open, onClose);
    const fade = reduceMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' };

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    data-sheet
                    role="dialog"
                    aria-modal="true"
                    aria-label={t('handsFreeCta')}
                    className="fixed inset-0 z-[110] flex flex-col bg-[#F6F0E1] dark:bg-[#032e18]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={fade}
                >
                    <HandsFreeBody steps={steps} onClose={onClose} />
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
