import { useState, useEffect } from 'react';
import { storageService } from '@/services/storageService';
import { startOfferLiveActivity, endOfferLiveActivity } from '@/services/liveActivityService';
import i18n from '@/i18n';

const DISCOUNT_OFFER_KEY = 'islamiyoldas_discount_offer_end';
const DISCOUNT_COOLDOWN_KEY = 'islamiyoldas_discount_cooldown_end';
const OFFER_DURATION_MS = 5 * 60 * 1000; // 5 minutes
export const OFFER_DURATION_SECONDS = OFFER_DURATION_MS / 1000; // Fitil/progress göstergeleri için
const COOLDOWN_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours

export function useDiscountOffer() {
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [isActive, setIsActive] = useState(false);
    
    useEffect(() => {
        const evaluateState = () => {
            const now = Date.now();
            const offerEndStr = storageService.getItem(DISCOUNT_OFFER_KEY);
            const offerEnd = parseInt(offerEndStr || '0', 10);
            
            if (offerEnd > now) {
                setIsActive(true);
                const remaining = Math.max(0, Math.floor((offerEnd - now) / 1000));
                setTimeLeft(remaining);
            } else {
                setIsActive(false);
                setTimeLeft(0);
                
                // If offer just ended, we need to ensure cooldown is set if it wasn't already
                if (offerEnd > 0 && offerEnd < now) {
                    const cooldownEndStr = storageService.getItem(DISCOUNT_COOLDOWN_KEY);
                    const cooldownEnd = parseInt(cooldownEndStr || '0', 10);
                    // If no cooldown is set, or the offer was from a previous session and we never set cooldown
                    if (cooldownEnd === 0 || isNaN(cooldownEnd)) {
                        storageService.setItem(DISCOUNT_COOLDOWN_KEY, (now + COOLDOWN_DURATION_MS).toString());
                        // Süre doldu → kilit ekranı/Dynamic Island sayacını kapat (iOS)
                        endOfferLiveActivity();
                    }
                }
            }
        };

        // Initial evaluation
        evaluateState();

        // Polling interval for cross-tab or cross-component sync
        const interval = setInterval(evaluateState, 1000);
        
        return () => clearInterval(interval);
    }, []);

    const startOffer = (force = false) => {
        const now = Date.now();
        const cooldownEnd = parseInt(storageService.getItem(DISCOUNT_COOLDOWN_KEY) || '0', 10);
        const offerEnd = parseInt(storageService.getItem(DISCOUNT_OFFER_KEY) || '0', 10);
        
        // Cannot start if in cooldown (unless forced)
        if (!force && cooldownEnd > now) return false;
        
        // If already active, NEVER restart (force only overrides cooldown, not an active offer)
        if (offerEnd > now) return true; 
        
        // Start fresh offer
        const newOfferEnd = now + OFFER_DURATION_MS;
        storageService.setItem(DISCOUNT_OFFER_KEY, newOfferEnd.toString());

        // Reset cooldown (it will be set when offer ends)
        storageService.setItem(DISCOUNT_COOLDOWN_KEY, '0');

        // iOS: kilit ekranı + Dynamic Island'da geri sayım başlat (uygulama kapalıyken de akar)
        startOfferLiveActivity(newOfferEnd, {
            title: i18n.t('premium.last_offer', { ns: 'common', defaultValue: 'Son Teklif' }),
            message: i18n.t('premium.discount_title', { ns: 'common', defaultValue: '' }),
        });

        setIsActive(true);
        setTimeLeft(OFFER_DURATION_MS / 1000);
        return true;
    };
    
    const canShowOffer = () => {
        const now = Date.now();
        const cooldownEnd = parseInt(storageService.getItem(DISCOUNT_COOLDOWN_KEY) || '0', 10);
        const offerEnd = parseInt(storageService.getItem(DISCOUNT_OFFER_KEY) || '0', 10);
        
        // We can show it if cooldown has passed, OR if the offer is already active!
        return now >= cooldownEnd || now < offerEnd;
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return '00:00';
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return {
        isActive,
        timeLeft,
        formattedTime: formatTime(timeLeft),
        startOffer,
        canShowOffer
    };
}
