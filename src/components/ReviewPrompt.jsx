import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Heart, MessageSquare } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import { CapgoInAppReview as InAppReview } from '@capgo/capacitor-in-app-review';
import { usePopup } from '@/hooks/usePopup';

const STORAGE_KEY = 'review_prompt_v4'; // Tüm eski kullanıcılarda yeniden çıkması için v4 yapıldı
const APP_STORE_ID = '6759666173';
// Reddedildikçe artan bekleme süresi: 1. kapatma → 24 saat, 2. kapatma → 3 gün, 3. ve sonrası → 7 gün (puanlayana kadar 7'şer gün devam)
const COOLDOWN_LADDER_MS = [
    24 * 60 * 60 * 1000,
    3 * 24 * 60 * 60 * 1000,
    7 * 24 * 60 * 60 * 1000,
];
const getCooldownMs = (dismissCount) =>
    COOLDOWN_LADDER_MS[Math.min(Math.max(dismissCount, 1), COOLDOWN_LADDER_MS.length) - 1];

const getReviewData = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            // Eski kullanıcıları tespit et (önceden uygulamada vakit geçirmişse)
            const hasOldData = localStorage.getItem('total_app_time_seconds');
            const initialAppOpens = hasOldData ? 2 : 0; // Eski kullanıcılara direkt görünsün diye 2'den başlat
            return { reviewed: false, lastDismissedAt: 0, appOpens: initialAppOpens, dismissCount: 0 };
        }
        return JSON.parse(raw);
    } catch {
        return { reviewed: false, lastDismissedAt: 0, appOpens: 0, dismissCount: 0 };
    }
};

const saveReviewData = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const IS_TESTING = false; // 🔴 YAYIN İÇİN FALSE. TEST ETMEK İSTERSEN TRUE YAP.

const isCooldownActive = () => {
    if (IS_TESTING) return false;
    const data = getReviewData();
    if (data.reviewed) return true;
    if (!data.lastDismissedAt) return false;
    return Date.now() - data.lastDismissedAt < getCooldownMs(data.dismissCount || 1);
};

// Global trigger — bileşenler bunu çağırır
export function triggerReviewPrompt(reason, force = false) {
    if (!force && isCooldownActive()) return;
    window.dispatchEvent(new CustomEvent('reviewTrigger', { detail: { reason, force } }));
}

export default function ReviewPrompt() {
    const location = useLocation();
    const { isActive: show, requestShow, dismiss } = usePopup('review_prompt');
    const [step, setStep] = useState('ask'); // 'ask', 'feedback'
    const [hoveredStar, setHoveredStar] = useState(0);
    const [selectedStar, setSelectedStar] = useState(0);
    const pendingRef = useRef(false);
    const { t } = useTranslation('common');

    const [totalSeconds, setTotalSeconds] = useState(() => parseInt(localStorage.getItem('total_app_time_seconds') || '0', 10));
    const isOnHome = location.pathname === '/';

    // Uygulama içi gezinti sayısını takip ediyoruz
    const [navCountSession, setNavCountSession] = useState(0);
    const lastPathRef = useRef(location.pathname);

    useEffect(() => {
        if (location.pathname !== lastPathRef.current) {
            setNavCountSession(prev => prev + 1);
            lastPathRef.current = location.pathname;
        }
    }, [location.pathname]);

    useEffect(() => {
        const data = getReviewData();

        // Sayacı güncelle ancak mount/unmount koruması için sadece bir kez
        if (!window.appOpenedLogged && (!data.reviewed || IS_TESTING)) {
            data.appOpens = (data.appOpens || 0) + 1;
            saveReviewData(data);
            window.appOpenedLogged = true;
        }

        const handleTrigger = (e) => {
            const { force } = e.detail || {};
            if (!force && isCooldownActive()) return;
            // Force değilse, sadece anasayfa veya profildeysek hemen göster, diğer sayfalarda beklemeye al
            if (!force) {
                const hash = window.location.hash;
                const isAllowedHash = hash === '#/' || hash === '#' || hash === '' || hash.startsWith('#/profile');
                if (!isAllowedHash) {
                    pendingRef.current = true;
                    return;
                }
            }
            requestShow();
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

        // Force bypass durumu hariç standart şartlar
        if (show || (!IS_TESTING && data.reviewed) || isCooldownActive()) return;

        // Sadece anasayfa veya profil sayfasındayken göster (paywall ile çakışmayı önlemek için)
        const isAllowedPage = isOnHome || location.pathname === '/profile';
        if (!isAllowedPage) return;

        // 1. Durum: Daha önce beklemeye alınmış bir istek varsa (örn: Zikir bitirdi, Anasayfaya döndü)
        if (pendingRef.current) {
            pendingRef.current = false;
            const timer = setTimeout(() => requestShow(), 1500);
            return () => clearTimeout(timer);
        }

        // 2. Durum: Kullanıcı 3 kez sayfa değiştirip ana sayfaya/ayarlara döndüyse (Paywall'dan önce)
        if (!IS_TESTING && navCountSession >= 3) {
            const timer = setTimeout(() => requestShow(), 1500);
            return () => clearTimeout(timer);
        }



    }, [location.pathname, show, navCountSession, totalSeconds, isOnHome, requestShow]);

    // Eğer popup aktif olduysa ama kullanıcı başka bir sayfaya geçtiyse (global render olduğu için unmount olmaz),
    // kuyruğu tıkamaması için otomatik dismiss yapıyoruz.
    useEffect(() => {
        if (show) {
            const isAllowedPage = isOnHome || location.pathname === '/profile';
            if (!isAllowedPage) {
                dismiss();
            }
        }
    }, [show, isOnHome, location.pathname, dismiss]);

    const handleRate = async () => {
        if (!IS_TESTING) saveReviewData({ ...getReviewData(), reviewed: true });

        let nativeReviewShown = false;
        if (Capacitor.isNativePlatform()) {
            try {
                await InAppReview.requestReview();
                nativeReviewShown = true;
            } catch (err) {
                console.warn('[ReviewPrompt] Native in-app review failed:', err?.message || err);
            }
        }

        // Native review başarısız olduysa veya web ortamındaysak → Mağaza sayfasını aç
        if (!nativeReviewShown) {
            try {
                const platform = Capacitor.getPlatform();
                if (platform === 'android') {
                    window.location.href = 'market://details?id=com.islamiyoldas.app';
                } else if (platform === 'ios') {
                    window.location.href = `itms-apps://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`;
                } else {
                    window.open(`https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`, '_blank');
                }
            } catch (err) {
                console.warn('[ReviewPrompt] Store link failed:', err);
            }
        }

        // Hemen popup'ı kapat ve state'i sıfırla
        dismiss();
        setTimeout(() => {
            setStep('ask');
            setSelectedStar(0);
            setHoveredStar(0);
        }, 500);
    };



    const handleDismiss = () => {
        dismiss();
        setTimeout(() => {
            setStep('ask');
            setSelectedStar(0);
            setHoveredStar(0);
        }, 500); // Reset after animation
        const data = getReviewData();
        data.lastDismissedAt = Date.now();
        data.dismissCount = (data.dismissCount || 0) + 1;
        saveReviewData(data);
    };

    return (
        <AnimatePresence>
            {show && (isOnHome || location.pathname === '/profile') && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center px-5"
                    onClick={handleDismiss}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    <motion.div
                        initial={{ scale: 0.96, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 12 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-[340px] rounded-3xl overflow-hidden bg-[#FFFDF6] dark:bg-[linear-gradient(165deg,#123824_0%,#092114_100%)] border border-[#E2D9C4] dark:border-[#D4AF37]/[0.18] shadow-[0_25px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_50px_rgba(0,0,0,0.6),0_0_0_0.5px_rgba(255,255,255,0.08)_inset]"
                    >
                        {/* Arka plan süslemesi (Premium Dotted Mesh) */}
                        <div className="absolute inset-0 pointer-events-none opacity-60 hidden dark:block" style={{
                            backgroundImage: 'radial-gradient(rgba(212, 175, 55, 0.15) 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)'
                        }} />

                        {/* Üst altın ışık (Kalbin arkasından vuran parlama) */}
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none hidden dark:block"
                            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 60%)' }} />

                        {/* STEP: ASK — Yıldız seçtirme */}
                        {step === 'ask' && (
                            <motion.div
                                key="ask"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.25 }}
                                className="flex flex-col items-center px-7 pt-10 pb-7 relative z-10"
                            >
                                {/* Minimal heart icon with heartbeat animation */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.15, 1],
                                        filter: ['drop-shadow(0 0 0px rgba(212,175,55,0))', 'drop-shadow(0 0 15px rgba(212,175,55,0.45))', 'drop-shadow(0 0 0px rgba(212,175,55,0))']
                                    }}
                                    transition={{
                                        duration: 2.5,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="mb-6"
                                >
                                    <Heart size={44} className="text-islamic-gold" fill="currentColor" strokeWidth={1} />
                                </motion.div>

                                <h2 className="text-[21px] font-semibold text-stone-900 dark:text-white mb-2 text-center leading-snug">
                                    {t('review.askTitle', 'Bize Destek Olmak İster Misin?')}
                                </h2>
                                <p className="text-[14px] text-stone-500 dark:text-white/60 leading-relaxed mb-6 text-center px-1">
                                    {t('review.askDescription', 'İslami Yoldaş\'ı ümmet için büyük bir sevgi ve emekle geliştiriyoruz. Bize 5 yıldız vererek bu yolda elimizden tutar mısın?')}
                                </p>

                                {/* Hadis kutusu - 2. ekrandan taşındı */}
                                <div className="w-full rounded-xl p-3 mb-6 bg-islamic-green/5 border border-islamic-green/10 dark:bg-[#D4AF37]/[0.06] dark:border-[#D4AF37]/10">
                                    <p className="text-[13px] italic text-islamic-green/80 dark:text-islamic-gold/70 text-center leading-relaxed">
                                        {t('review.hadith', '"Kim bir hayra vesile olursa, o hayrı yapanın ecri gibi ecir alır." (Müslim)')}
                                    </p>
                                </div>

                                {/* Yıldızlar — temiz, büyük, dokunması kolay */}
                                <div className="flex items-center justify-center gap-2.5 w-full mb-7" onMouseLeave={() => setHoveredStar(0)}>
                                    {[1, 2, 3, 4, 5].map(star => {
                                        const isActive = (hoveredStar || selectedStar) >= star;
                                        return (
                                            <motion.button
                                                key={star}
                                                whileTap={{ scale: 0.85 }}
                                                onMouseEnter={() => setHoveredStar(star)}
                                                onClick={() => {
                                                    setSelectedStar(star);
                                                    setTimeout(() => {
                                                        if (star >= 4) {
                                                            handleRate();
                                                        } else {
                                                            setStep('feedback');
                                                        }
                                                    }, 350);
                                                }}
                                                className="p-1.5 cursor-pointer touch-manipulation"
                                            >
                                                <motion.div
                                                    animate={{ scale: isActive ? 1.08 : 1 }}
                                                    transition={{ type: 'spring', damping: 15, stiffness: 400 }}
                                                >
                                                    <Star
                                                        size={36}
                                                        className={isActive ? "transition-all duration-200" : "transition-all duration-200 text-stone-300 dark:text-white/15"}
                                                        fill={isActive ? '#D4AF37' : 'transparent'}
                                                        stroke={isActive ? '#D4AF37' : 'currentColor'}
                                                        strokeWidth={isActive ? 0 : 1.5}
                                                        style={{
                                                            filter: isActive ? 'drop-shadow(0 2px 8px rgba(212,175,55,0.35))' : 'none'
                                                        }}
                                                    />
                                                </motion.div>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Alt ayırıcı çizgi */}
                                <div className="w-12 h-px bg-[#E9DFC8] dark:bg-white/10 mb-4" />

                                <button
                                    onClick={handleDismiss}
                                    className="text-stone-400 hover:text-stone-600 dark:text-white/30 dark:hover:text-white/50 text-[14px] transition-colors"
                                >
                                    {t('review.askLater', 'Daha Sonra Hatırlat')}
                                </button>
                            </motion.div>
                        )}



                        {/* STEP: THANK YOU — Mağaza yönlendirmesi veya native kapama */}
                        {step === 'thankYou' && (
                            <motion.div
                                key="thankYou"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col items-center px-7 pt-10 pb-7 relative z-10"
                            >
                                <div className="mb-5">
                                    <Heart size={44} className="text-islamic-gold" strokeWidth={1.5} fill="#D4AF37" />
                                </div>

                                <h2 className="text-[21px] font-semibold text-stone-900 dark:text-white mb-2 text-center leading-snug">
                                    {t('review.thankYouTitle', 'Allah Razı Olsun! 🤍')}
                                </h2>
                                <p className="text-[14px] text-stone-600 dark:text-white/70 leading-relaxed mb-6 text-center">
                                    {t('review.thankYouDescription', 'Desteğiniz bizim için çok kıymetli. Uygulamamızı geliştirirken bizi motive ettiğiniz için teşekkür ederiz.')}
                                </p>
                            </motion.div>
                        )}

                        {/* STEP: FEEDBACK — Üzüntü ve anlayış */}
                        {step === 'feedback' && (
                            <motion.div
                                key="feedback"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col items-center px-7 pt-10 pb-7 relative z-10"
                            >
                                <div className="mb-5">
                                    <Heart size={44} className="text-stone-300 dark:text-white/30" strokeWidth={1.5} />
                                </div>

                                <h2 className="text-[21px] font-semibold text-stone-900 dark:text-white mb-2 text-center leading-snug">
                                    {t('review.feedbackTitle', 'Geri bildiriminiz için teşekkürler')}
                                </h2>
                                <p className="text-[14px] text-stone-500 dark:text-white/50 leading-relaxed mb-8 text-center">
                                    {t('review.feedbackDescription', 'Beklentilerinizi karşılayamadığımız için üzgünüz. Uygulamamızı sizin için daha iyi hale getirmek amacıyla çalışmaya devam edeceğiz.')}
                                </p>

                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleDismiss}
                                    className="w-full py-3.5 rounded-xl font-medium text-[15px] cursor-pointer bg-[#F0E8D5] text-stone-700 dark:bg-white/[0.07] dark:text-white/80"
                                >
                                    {t('review.closeUnderstand', 'Tamam')}
                                </motion.button>
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
