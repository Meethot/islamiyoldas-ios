import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'review_prompt_v2';
const APP_STORE_ID = '6759666173';
const COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 saat
const PASSIVE_TIMEOUT = 30 * 60 * 1000; // 30 dakika

const getReviewData = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { reviewed: false, lastDismissedAt: 0, appOpens: 0 };
        return JSON.parse(raw);
    } catch {
        return { reviewed: false, lastDismissedAt: 0, appOpens: 0 };
    }
};

const saveReviewData = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const isCooldownActive = () => {
    const data = getReviewData();
    if (data.reviewed) return true;
    if (!data.lastDismissedAt) return false;
    return Date.now() - data.lastDismissedAt < COOLDOWN_MS;
};

// Global trigger — bileşenler bunu çağırır
export function triggerReviewPrompt(reason) {
    if (isCooldownActive()) return;
    window.dispatchEvent(new CustomEvent('reviewTrigger', { detail: { reason } }));
}

export default function ReviewPrompt() {
    const location = useLocation();
    const [show, setShow] = useState(false);
    const passiveTimerRef = useRef(null);
    const pendingRef = useRef(false);
    const { t } = useTranslation('common');

    useEffect(() => {
        // App açılış sayacı
        const data = getReviewData();
        if (data.reviewed) return;

        data.appOpens = (data.appOpens || 0) + 1;
        saveReviewData(data);

        // 🔹 Tetikleyici 4: 5. app açılış (onboarding tamamlanmışsa)
        const onboardingDone = localStorage.getItem('onboardingComplete') === 'true';
        if (data.appOpens >= 5 && !isCooldownActive() && onboardingDone) {
            setTimeout(() => {
                if (!isCooldownActive()) setShow(true);
            }, 5000);
        }

        // reviewTrigger event listener
        const handleTrigger = (e) => {
            if (isCooldownActive()) return;
            // Onboarding tamamlanmamışsa review gösterme
            if (localStorage.getItem('onboardingComplete') !== 'true') return;
            if (window.location.hash.includes('/dhikr')) {
                pendingRef.current = true;
                return;
            }
            setShow(true);
        };

        window.addEventListener('reviewTrigger', handleTrigger);

        // 🔹 Tetikleyici 7: 30 dk passive fallback
        const startPassiveTimer = () => {
            if (passiveTimerRef.current) clearTimeout(passiveTimerRef.current);
            passiveTimerRef.current = setTimeout(() => {
                if (!isCooldownActive()) {
                    setShow(true);
                }
            }, PASSIVE_TIMEOUT);
        };

        startPassiveTimer();

        return () => {
            window.removeEventListener('reviewTrigger', handleTrigger);
            if (passiveTimerRef.current) clearTimeout(passiveTimerRef.current);
        };
    }, []);

    // Zikirmatik'te popup gösterme ama pending varsa sayfadan çıkınca göster
    const isOnDhikr = location.pathname === '/dhikr';

    useEffect(() => {
        if (!isOnDhikr && pendingRef.current) {
            pendingRef.current = false;
            if (!isCooldownActive()) setShow(true);
        }
    }, [isOnDhikr]);

    const handleRate = () => {
        saveReviewData({ ...getReviewData(), reviewed: true });
        setShow(false);

        if (Capacitor.isNativePlatform()) {
            const platform = Capacitor.getPlatform();
            if (platform === 'ios') {
                window.open(`https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`, '_blank');
            } else if (platform === 'android') {
                window.open(`market://details?id=com.islamiyoldas.app`, '_blank');
            }
        }
    };

    const handleDismiss = () => {
        setShow(false);
        const data = getReviewData();
        data.lastDismissedAt = Date.now();
        saveReviewData(data);
    };

    return (
        <AnimatePresence>
            {show && !isOnDhikr && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center px-6"
                    onClick={handleDismiss}
                >
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.85, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 350 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-sm rounded-[2rem] overflow-hidden"
                        style={{
                            background: 'linear-gradient(180deg, #1a3a25 0%, #0d2518 50%, #091a10 100%)',
                            border: '1px solid rgba(212,175,55,0.15)',
                            boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
                        }}
                    >
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>

                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-20"
                            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.5) 0%, transparent 70%)' }} />

                        <div className="relative p-7 pt-8 text-center">
                            <div className="flex items-center justify-center gap-1 mb-5">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0, rotate: -30 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.3 + i * 0.1, type: 'spring', damping: 12 }}
                                    >
                                        <Star
                                            size={28}
                                            className="text-islamic-gold"
                                            fill="currentColor"
                                            style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.4))' }}
                                        />
                                    </motion.div>
                                ))}
                            </div>

                            <h2 className="text-xl font-serif font-bold text-white mb-2 tracking-wide">
                                {t('review.title', 'Do you enjoy Islamic Companion?')}
                            </h2>

                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/15 mb-4">
                                <Heart size={12} className="text-emerald-400" fill="currentColor" />
                                <span className="text-[11px] font-bold text-emerald-400/90">{t('review.adFree', '100% Ad-Free Experience')}</span>
                            </div>

                            <p className="text-[13px] text-white/45 leading-relaxed mb-6">
                                {t('review.description', 'We developed a completely ad-free app to give you the best experience. Your review is very valuable to support us! 🤲')}
                            </p>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleRate}
                                className="w-full py-3.5 rounded-2xl font-bold text-[15px] mb-3 cursor-pointer transition-all"
                                style={{
                                    background: 'linear-gradient(135deg, #b8860b 0%, #D4AF37 50%, #e8c547 100%)',
                                    boxShadow: '0 4px 20px rgba(212,175,55,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                                    color: '#1a1a0a',
                                }}
                            >
                                ⭐ {t('review.rateButton', 'Rate Us')}
                            </motion.button>

                            <button
                                onClick={handleDismiss}
                                className="w-full py-3 rounded-2xl text-white/30 text-[13px] font-medium hover:text-white/50 transition-colors cursor-pointer"
                            >
                                {t('review.later', 'Remind Me Later')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
