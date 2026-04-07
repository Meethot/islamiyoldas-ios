import { useRef, useCallback } from 'react';

/**
 * Smart Paywall Hook — Akıllı Paywall Gösterim Sistemi
 * 
 * Mantık:
 * - Kullanıcı anasayfadan 3 farklı yere gidip geri döndüğünde paywall açılır
 * - Paywall anasayfaya dönüşte tetiklenir (giderken değil)
 * - Oturum başına maksimum 3 kez
 * - Günlük maksimum 8 kez
 */

const SESSION_MAX = 3;
const DAILY_MAX = 8;
const NAV_TRIGGER_EVERY = 3;

// Bu sayfalara gidiş navigasyon sayacına DAHİL EDİLMEZ
const EXCLUDED_PATHS = ['/premium', '/onboarding', '/profile', '/ai-mentor'];

export function useSmartPaywall(isPremium) {
    const sessionShows = useRef(0);
    const outboundCount = useRef(0);
    const pendingPaywall = useRef(false);
    const lastPath = useRef('/');

    const checkNavigation = useCallback((newPath) => {
        // Premium kullanıcılara asla gösterme
        if (isPremium) return false;

        const prevPath = lastPath.current;
        lastPath.current = newPath;

        // Premium sayfasına gidiyorsa veya gidiyorduysa sayma
        if (EXCLUDED_PATHS.includes(newPath) || EXCLUDED_PATHS.includes(prevPath)) return false;

        // Anasayfadan ÇIKIŞ: sub-page'e gidiyor → sayacı artır
        if (prevPath === '/' && newPath !== '/') {
            outboundCount.current += 1;

            // 3'ün katına ulaştıysa, geri dönüşte paywall gösterilecek
            if (outboundCount.current % NAV_TRIGGER_EVERY === 0) {
                pendingPaywall.current = true;
            }
            return false; // Çıkarken değil, dönüşte göster
        }

        // Anasayfaya DÖNÜŞ: bekleyen paywall varsa göster
        if (newPath === '/' && pendingPaywall.current) {
            pendingPaywall.current = false;

            // Oturum limiti kontrolü
            if (sessionShows.current >= SESSION_MAX) return false;

            // Günlük limit kontrolü
            const today = new Date().toISOString().slice(0, 10);
            const dailyKey = `smart_pw_${today}`;
            const dailyCount = parseInt(localStorage.getItem(dailyKey) || '0', 10);
            if (dailyCount >= DAILY_MAX) return false;

            // ✅ Tüm kontroller geçti — Paywall göster!
            sessionShows.current += 1;
            localStorage.setItem(dailyKey, String(dailyCount + 1));
            return true;
        }

        return false;
    }, [isPremium]);

    return { checkNavigation };
}
