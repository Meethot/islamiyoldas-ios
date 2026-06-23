import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'review_prompt_v2';
const APP_STORE_ID = '6759666173';
const COOLDOWN_MS_DEFAULT = 12 * 60 * 60 * 1000; // 12 saat (1. ve 2. gösterimden sonra)
const COOLDOWN_MS_LAST = 24 * 60 * 60 * 1000; // 24 saat (son gösterimden sonra)
const MAX_DISMISS_COUNT = 3; // Maksimum 3 kere göster, sonra bir daha çıkma

const getReviewData = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { reviewed: false, lastDismissedAt: 0, appOpens: 0, dismissCount: 0 };
        return JSON.parse(raw);
    } catch {
        return { reviewed: false, lastDismissedAt: 0, appOpens: 0, dismissCount: 0 };
    }
};

const saveReviewData = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const IS_TESTING = false; // 🔴 TEST İÇİN TRUE. YAYINA ÇIKMADAN ÖNCE FALSE YAPACAĞIZ!

const isCooldownActive = () => {
    if (IS_TESTING) return false;
    const data = getReviewData();
    if (data.reviewed) return true;
    const dismissCount = data.dismissCount || 0;
    if (dismissCount >= MAX_DISMISS_COUNT) return true; // 3 kere gösterdik, artık çıkma
    if (!data.lastDismissedAt) return false;
    const cooldown = dismissCount >= 2 ? COOLDOWN_MS_LAST : COOLDOWN_MS_DEFAULT;
    return Date.now() - data.lastDismissedAt < cooldown;
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

    const [totalSeconds, setTotalSeconds] = useState(() => parseInt(localStorage.getItem('total_app_time_seconds') || '0', 10));
    const isOnHome = location.pathname === '/';

    useEffect(() => {
        const data = getReviewData();
        if (!IS_TESTING && data.reviewed) return;

        // Sayacı güncelle ancak mount/unmount koruması için sadece bir kez
        if (!window.appOpenedLogged) {
            data.appOpens = (data.appOpens || 0) + 1;
            saveReviewData(data);
            window.appOpenedLogged = true;
        }

        const handleTrigger = (e) => {
            if (isCooldownActive()) return;
            // Anasayfa dışında isek beklemeye alıyoruz
            const hash = window.location.hash;
            if (hash && hash !== '#/' && hash !== '#') {
                pendingRef.current = true;
                return;
            }
            setShow(true);
        };

        window.addEventListener('reviewTrigger', handleTrigger);

        // Toplam geçirilen süreyi sayan interval (10 saniyede bir günceller)
        const timeInterval = setInterval(() => {
            setTotalSeconds(prev => {
                const next = prev + 10;
                localStorage.setItem('total_app_time_seconds', next.toString());
                return next;
            });
        }, 10000);

        return () => {
            window.removeEventListener('reviewTrigger', handleTrigger);
            clearInterval(timeInterval);
        };
    }, []);

    // Ana sayfa kontrolü ve otomatik popup görünme koşulları
    useEffect(() => {
        const data = getReviewData();
        
        // Şartlar sağlanmıyorsa erken dön
        if (show || (!IS_TESTING && data.reviewed) || isCooldownActive() || !isOnHome) return;

        // Daha önce beklemeye alınmış bir istek varsa anasayfada (kısa gecikmeli) göster
        if (pendingRef.current) {
            pendingRef.current = false;
            const timer = setTimeout(() => setShow(true), 1500);
            return () => clearTimeout(timer);
        }

        // KURAL: En az 2 kere açılmışsa VE total süre 2 dakikayı (120 saniye) geçmişse
        if (IS_TESTING || (data.appOpens >= 2 && totalSeconds >= 120)) {
            const autoTimer = setTimeout(() => {
                if (location.pathname === '/') {
                    setShow(true);
                }
            }, 3000);
            return () => clearTimeout(autoTimer);
        }
    }, [location.pathname, totalSeconds, show]);

    const handleRate = async () => {
        saveReviewData({ ...getReviewData(), reviewed: true });
        setShow(false);

        if (Capacitor.isNativePlatform()) {
            try {
                const { InAppReview } = await import('@capgo/capacitor-in-app-review');
                await InAppReview.requestReview();
            } catch (err) {
                console.warn('[ReviewPrompt] Native in-app review failed, falling back to store link:', err);
                const platform = Capacitor.getPlatform();
                if (platform === 'ios') {
                    window.open(`https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`, '_blank');
                } else if (platform === 'android') {
                    window.open(`market://details?id=com.islamiyoldas.app`, '_blank');
                }
            }
        }
    };

    const handleDismiss = () => {
        setShow(false);
        const data = getReviewData();
        data.lastDismissedAt = Date.now();
        data.dismissCount = (data.dismissCount || 0) + 1;
        saveReviewData(data);
    };

    return (
        <AnimatePresence>
            {show && isOnHome && (
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

                        {/* Üst dekoratif ışık efekti */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full opacity-15"
                            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.6) 0%, transparent 70%)' }} />

                        <div className="relative p-7 pt-8 text-center">
                            {/* Hilal + cami ikonu yerine büyük emoji */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', damping: 12 }}
                                className="text-5xl mb-4"
                            >
                                🕌
                            </motion.div>

                            {/* Başlık */}
                            <h2 className="text-xl font-serif font-bold text-white mb-3 tracking-wide leading-snug">
                                {t('review.title', 'Do you enjoy Islamic Companion?')}
                            </h2>

                            {/* Sosyal kanıt */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.03) 100%)',
                                    border: '1px solid rgba(212,175,55,0.12)',
                                }}
                            >
                                <span className="text-sm">🤲</span>
                                <span className="text-[11px] font-semibold" style={{ color: 'rgba(212,175,55,0.85)' }}>
                                    {t('review.socialProof', '10,000+ members in our family')}
                                </span>
                            </motion.div>

                            {/* Ana açıklama metni */}
                            <p className="text-[13px] text-white/50 leading-relaxed mb-2">
                                {t('review.description', 'We built this app with love for the Ummah. Your 5-star review helps more Muslims discover this app. 🤲')}
                            </p>

                            {/* Küçük hadis/ayet referansı */}
                            <p className="text-[11px] italic mb-6" style={{ color: 'rgba(212,175,55,0.5)' }}>
                                {t('review.hadith', '"Whoever guides someone to goodness will have a similar reward." (Muslim)')}
                            </p>

                            {/* Yıldız animasyonu — buton üstünde */}
                            <div className="flex items-center justify-center gap-1 mb-4">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0, rotate: -30 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.5 + i * 0.08, type: 'spring', damping: 12 }}
                                    >
                                        <Star
                                            size={26}
                                            className="text-islamic-gold"
                                            fill="currentColor"
                                            style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.4))' }}
                                        />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Ana CTA butonu */}
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
                                ⭐ {t('review.rateButton', 'Rate Us 5 Stars')}
                            </motion.button>

                            <button
                                onClick={handleDismiss}
                                className="w-full py-3 rounded-2xl text-white/25 text-[13px] font-medium hover:text-white/40 transition-colors cursor-pointer"
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
