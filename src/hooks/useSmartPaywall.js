import { useRef, useCallback } from 'react';

/**
 * Smart Paywall Hook — Akıllı Paywall Gösterim Sistemi
 * 
 * Mantık:
 * - Kullanıcı tab'lar arası veya anasayfadan sub-page'lere her gittiğinde sayaç artar
 * - Her 3. navigasyondan sonra anasayfaya dönüşte paywall açılır
 * - Oturum başına maksimum 3 kez
 * - Günlük maksimum 8 kez
 * 
 * Dahil olan sayfalar:
 * - Anasayfa kartları: /dhikr, /qibla, /sleep, /fasting, /dua-brotherhood, /dua-kosesi vs.
 * - Tab navigasyonu: /stories, /tracking, /learn, /profile
 */

const SESSION_MAX = 3;
const DAILY_MAX = 8;
const NAV_TRIGGER_EVERY = 4;

// Bu sayfalara gidiş navigasyon sayacına DAHİL EDİLMEZ
const EXCLUDED_PATHS = ['/premium', '/onboarding', '/ai-mentor'];

// Ana tab path'leri (anasayfa dahil)
const TAB_PATHS = ['/', '/learn', '/stories', '/tracking', '/profile'];

export function useSmartPaywall(isPremium) {
    const sessionShows = useRef(0);
    const navCount = useRef(0);
    const pendingPaywall = useRef(false);
    const lastPath = useRef('/');

    const checkNavigation = useCallback((newPath) => {
        // Premium kullanıcılara asla gösterme
        if (isPremium) return false;

        const prevPath = lastPath.current;
        lastPath.current = newPath;

        // Aynı sayfaya gidiyorsa sayma
        if (newPath === prevPath) return false;

        // Hariç tutulan sayfalara gidiyorsa veya onlardan geliyorsa sayma
        if (EXCLUDED_PATHS.includes(newPath) || EXCLUDED_PATHS.includes(prevPath)) return false;

        // Herhangi bir sayfa değişikliği → sayacı artır
        // (Tab'lar arası, anasayfadan alt sayfaya, alt sayfadan anasayfaya hepsi dahil)
        const isNavigatingToHome = newPath === '/';
        const isComingFromHome = prevPath === '/';

        // Anasayfaya dönüş DEĞİLSE → sadece sayacı artır
        if (!isNavigatingToHome) {
            navCount.current += 1;

            // 3'ün katına ulaştıysa, anasayfaya dönüşte paywall gösterilecek
            if (navCount.current % NAV_TRIGGER_EVERY === 0) {
                pendingPaywall.current = true;
            }
            return false;
        }

        // Anasayfaya DÖNÜŞ: bekleyen paywall varsa göster
        if (isNavigatingToHome && pendingPaywall.current) {
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
