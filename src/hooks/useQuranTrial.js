import { useState, useEffect, useRef } from 'react';
import { trialRemainingMs, isTrialEligible, TRIAL_EVENT, TRIAL_ENDED_EVENT } from '@/lib/quranTrial';

/**
 * Dinleme denemesinin canlı durumu.
 *
 * Geri sayım gerçek saate göre işler — uygulama arka plana alınıp dönse de kalan süre
 * doğru kalır (askıya alınan zamanlayıcı sayacı şişirmez).
 *
 * Yarım saniyelik tazeleme YALNIZ deneme sürerken çalışır; boştayken tek bir zamanlayıcı
 * bile kurulmaz, uzun listeler gereksiz yere yeniden çizilmez.
 *
 * @param {func} onEnd Süre dolduğunda çağrılır. Sinyal merkezden gelir
 *               (lib/quranTrial.js), böylece hangi ekranda olunursa olunsun ses durur.
 */
export function useQuranTrial({ onEnd } = {}) {
    const [remaining, setRemaining] = useState(() => trialRemainingMs());
    const [eligible, setEligible] = useState(() => isTrialEligible());
    const onEndRef = useRef(onEnd);

    useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);

    const active = remaining > 0;

    useEffect(() => {
        const refresh = () => {
            const left = trialRemainingMs();
            setRemaining(prev => (prev === left ? prev : left));
            setEligible(isTrialEligible());
        };
        const handleEnded = () => {
            refresh();
            onEndRef.current?.();
        };

        // Sayaç yalnız deneme sürerken atar
        const id = active ? setInterval(refresh, 500) : null;
        document.addEventListener('visibilitychange', refresh);
        window.addEventListener(TRIAL_EVENT, refresh);
        window.addEventListener(TRIAL_ENDED_EVENT, handleEnded);
        refresh();

        return () => {
            if (id) clearInterval(id);
            document.removeEventListener('visibilitychange', refresh);
            window.removeEventListener(TRIAL_EVENT, refresh);
            window.removeEventListener(TRIAL_ENDED_EVENT, handleEnded);
        };
    }, [active]);

    const secs = Math.max(0, Math.ceil(remaining / 1000));

    return {
        active,
        remaining,
        eligible,
        label: `0:${String(secs).padStart(2, '0')}`,
    };
}
