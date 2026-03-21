import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { showInterstitialAd, ADS_ENABLED } from '@/services/adService';
import { isPremium } from '@/services/creditService';

// Reklam gösterilecek sayfalar (ana kanallar)
const AD_ALLOWED_ROUTES = ['/', '/learn', '/stories', '/tracking', '/profile'];

// Reklam aralıkları (saniye): 30s → 60s → 120s → 120s → ...
const AD_INTERVALS = [30, 60, 120];

function getNextInterval(index) {
    if (index < AD_INTERVALS.length) return AD_INTERVALS[index];
    return AD_INTERVALS[AD_INTERVALS.length - 1]; // Son değeri tekrarla (120s)
}

export default function InterstitialAdManager() {
    // 🔴 Tam ekran geçiş reklamları kullanıcının talebi üzerine KULLANILMIYOR
    // Sadece 'Amin' kumbarasındaki Ödüllü Reklamlar aktif.
    return null;
    const location = useLocation();
    const elapsedRef = useRef(0);
    const nextAdTimeRef = useRef(AD_INTERVALS[0]); // İlk reklam 30s
    const intervalIndexRef = useRef(0);
    const isShowingAdRef = useRef(false);

    const isAllowedRoute = useCallback((pathname) => {
        return AD_ALLOWED_ROUTES.includes(pathname);
    }, []);

    const tryShowAd = useCallback(async () => {
        if (isPremium()) return;
        if (isShowingAdRef.current) return;
        if (!isAllowedRoute(location.pathname)) return;
        if (elapsedRef.current < nextAdTimeRef.current) return;

        isShowingAdRef.current = true;
        try {
            await showInterstitialAd();
        } catch {
            // Sessizce devam et
        } finally {
            isShowingAdRef.current = false;
            intervalIndexRef.current += 1;
            nextAdTimeRef.current = elapsedRef.current + getNextInterval(intervalIndexRef.current);
        }
    }, [location.pathname, isAllowedRoute]);

    // Global sayaç — her saniye artar, hangi sayfada olursa olsun
    useEffect(() => {
        if (isPremium()) return;

        const timer = setInterval(() => {
            elapsedRef.current += 1;
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Sayfa değiştiğinde veya süre dolduğunda reklam kontrolü
    useEffect(() => {
        if (isPremium()) return;

        // Sayfa değişikliğinde anında kontrol
        tryShowAd();

        // Ayrıca her 2 saniyede kontrol (aynı sayfada kalırken threshold geçilirse)
        const checker = setInterval(() => {
            tryShowAd();
        }, 2000);

        return () => clearInterval(checker);
    }, [location.pathname, tryShowAd]);

    return null; // UI render etmez, sadece mantık
}
