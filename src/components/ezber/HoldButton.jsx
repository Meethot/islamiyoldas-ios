import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';

/**
 * Basılı tut butonu.
 *
 * Dolum tamamlandığı an iş biter ve buton KENDİ KENDİNE bırakır (kullanıcı
 * kararı 2026-08-18: "dolunca kendi kendine basılıyı bıraksın"). Parmağın
 * kalkmasını beklemek, ödülü hak edilmiş andan sonraya erteliyordu.
 *
 * Erken bırakma iptaldir: ilerleme sıfırlanır, onComplete çağrılmaz.
 */
export default function HoldButton({
    label,
    ariaLabel,
    duration = 1050,
    onComplete,
    className,
}) {
    const [progress, setProgress] = useState(0);
    const progressRef = useRef(0);
    const rafRef = useRef(null);
    const startRef = useRef(0);
    const doneRef = useRef(false);
    const tickRef = useRef(0);
    const { light, success } = useHaptics();

    const stop = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
    }, []);

    useEffect(() => stop, [stop]);

    const finish = useCallback(() => {
        if (doneRef.current) return;
        doneRef.current = true;
        stop();
        progressRef.current = 1;
        setProgress(1);
        success();
        onComplete?.();
    }, [stop, success, onComplete]);

    /** Erken bırakma: çubuk sıfıra zıplamaz, geri çekilir — iptal de bir geri bildirimdir. */
    const cancel = useCallback(() => {
        if (doneRef.current) return;
        stop();
        tickRef.current = 0;
        const from = progressRef.current;
        if (from <= 0) return;
        const t0 = performance.now();
        const back = () => {
            const k = Math.min(1, (performance.now() - t0) / 180);
            progressRef.current = from * (1 - k);
            setProgress(progressRef.current);
            if (k < 1) rafRef.current = requestAnimationFrame(back);
        };
        rafRef.current = requestAnimationFrame(back);
    }, [stop]);

    const start = useCallback((e) => {
        if (doneRef.current) return;
        // Sadece birincil dokunuş/tık; sağ tık ve çoklu parmak yok sayılır
        if (e?.button != null && e.button !== 0) return;
        e?.currentTarget?.setPointerCapture?.(e.pointerId);
        startRef.current = performance.now();
        tickRef.current = 0;
        const tick = () => {
            const p = Math.min(1, (performance.now() - startRef.current) / duration);
            progressRef.current = p;
            setProgress(p);
            // Dolum boyunca üç hafif tık — ilerlemenin parmakta da hissedilmesi
            const step = Math.floor(p * 4);
            if (step > tickRef.current && step < 4) { tickRef.current = step; light(); }
            if (p >= 1) { finish(); return; }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
    }, [duration, finish, light]);

    const held = progress > 0 && progress < 1;

    return (
        <button
            type="button"
            onPointerDown={start}
            onPointerUp={cancel}
            onPointerCancel={cancel}
            onPointerLeave={cancel}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finish(); } }}
            aria-label={ariaLabel || label}
            className={cn(
                'relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl',
                'bg-black/[0.06] font-display text-[0.9375rem] font-bold text-stone-800 transition-transform',
                'active:scale-[0.99] dark:bg-white/[0.07] dark:text-white',
                className
            )}
        >
            <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#B45309] to-[#D97706] dark:from-[#B98C2A] dark:via-islamic-gold dark:to-[#EBCE72]"
                style={{ width: `${progress * 100}%` }}
            />
            <span className={cn('relative flex items-center gap-2.5 transition-colors', held && 'text-white dark:text-[#032e18]')}>
                <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-current" />
                {label}
            </span>
        </button>
    );
}
