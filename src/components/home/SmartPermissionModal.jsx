import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function SmartPermissionModal({
    cardType, // 'location' | 'notification' | null
    onSilentDismiss, 
    onSuccess, 
    onManualRedirect,
    refreshLocationFn
}) {
    const { t } = useTranslation('home');
    const navigate = useNavigate();
    
    // 1-second grace period — prevents accidental dismiss when modal appears mid-tap
    const [interactable, setInteractable] = useState(false);
    
    useEffect(() => {
        if (!cardType) { setInteractable(false); return; }
        setInteractable(false);
        const timer = setTimeout(() => setInteractable(true), 1000);
        return () => clearTimeout(timer);
    }, [cardType]);

    const handleLocationAction = async (accept) => {
        if (accept) {
            onSuccess();
            await refreshLocationFn();
        } else {
            onManualRedirect('location');
            navigate('/settings/location');
        }
    };

    const handleNotificationAction = async (accept) => {
        if (accept) {
            onSuccess();
            const { requestNotificationPermission } = await import('@/services/pushService');
            await requestNotificationPermission();
        } else {
            onManualRedirect('notification');
            navigate('/settings/notifications');
        }
    };

    return (
        <AnimatePresence mode="wait">
            {cardType && (
                <motion.div
                    key={`permission-backdrop-${cardType}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60"
                    onClick={() => interactable && onSilentDismiss()}
                >
                    <motion.div
                        key={`permission-modal-${cardType}`}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.6 }}
                        onDragEnd={(_, info) => {
                            if (interactable && (info.offset.y > 80 || info.velocity.y > 300)) {
                                onSilentDismiss();
                            }
                        }}
                        className="relative w-full max-w-md rounded-t-[2.5rem] p-8 pb-10 overflow-hidden"
                        style={{
                            background: 'linear-gradient(165deg, #123824 0%, #092114 100%)',
                            borderTop: '1px solid rgba(212,175,55,0.18)',
                            boxShadow: '0 -25px 50px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.08) inset',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Premium Dotted Mesh Background */}
                        <div className="absolute inset-0 pointer-events-none opacity-40" style={{
                            backgroundImage: 'radial-gradient(rgba(212, 175, 55, 0.15) 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)'
                        }} />

                        {/* Top gold glow */}
                        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
                            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 60%)' }} />

                        {/* Content Container */}
                        <div className="relative z-10">
                            {/* Drag indicator — always visible */}
                            <div className="w-12 h-1.5 rounded-full bg-white/25 mx-auto mb-6" />

                            {cardType === 'location' ? (
                                <>
                                    <div className="w-16 h-16 rounded-[1.25rem] bg-islamic-green/30 flex items-center justify-center mx-auto mb-5 border border-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                                        <MapPin className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                    </div>
                                    <h3 className="text-xl font-serif font-bold text-center text-white mb-2">
                                        {t('permission.location_title', '🕌 Namaz Vakitlerini Ayarlayalım')}
                                    </h3>
                                    <p className="text-sm text-center text-emerald-100/50 mb-5 leading-relaxed max-w-[280px] mx-auto">
                                        {t('permission.location_desc', 'Bulunduğun şehre göre doğru namaz vakitlerini ve kıble yönünü gösterebilmemiz için konumuna ihtiyacımız var.')}
                                    </p>

                                    <div className="flex flex-wrap items-center justify-center gap-3 mb-7 px-2">
                                        {[t('permission.badge_prayer', '🕌 Namaz Vakti'), t('permission.badge_qibla', '🧭 Kıble Yönü')].map((badge) => (
                                            <span key={badge} className="px-3.5 py-1.5 rounded-full bg-[#123824] border border-emerald-500/20 text-xs text-emerald-100/80 font-bold whitespace-nowrap shadow-sm">
                                                {badge}
                                            </span>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleLocationAction(true)}
                                        className="w-full h-14 rounded-2xl bg-islamic-gold text-[#1a0f00] font-bold text-base active:scale-[0.97] transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <MapPin className="w-5 h-5" />
                                        {t('permission.location_accept', 'Konumumu Kullan')}
                                    </button>
                                    <button
                                        onClick={() => handleLocationAction(false)}
                                        className="w-full mt-3 h-12 rounded-xl text-white/30 hover:text-white/50 font-medium text-sm active:scale-95 transition-all"
                                    >
                                        {t('permission.location_manual', 'Manuel Olarak Ayarla')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-[1.25rem] bg-islamic-gold/15 flex items-center justify-center mx-auto mb-5 border border-islamic-gold/30 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                                        <Bell className="w-8 h-8 text-islamic-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                                    </div>
                                    <h3 className="text-xl font-serif font-bold text-center text-white mb-2">
                                        {t('permission.notification_title', '🔔 Namaz Vakitlerini Kaçırma')}
                                    </h3>
                                    <p className="text-sm text-center text-emerald-100/50 mb-5 leading-relaxed max-w-[280px] mx-auto">
                                        {t('permission.notification_desc', 'Ezan vakitlerinde seni bilgilendirelim, günlük hatırlatmalarla ibadetlerini takip et.')}
                                    </p>

                                    <div className="flex flex-wrap items-center justify-center gap-3 mb-7 px-2">
                                        {[t('permission.badge_adhan', '🔔 Ezan Vakti'), t('permission.badge_dhikr', '📿 Günlük Zikir'), t('permission.badge_reminder', '🌙 Hatırlatma')].map((badge) => (
                                            <span key={badge} className="px-3.5 py-1.5 rounded-full bg-[#123824] border border-islamic-gold/20 text-xs text-amber-100/80 font-bold whitespace-nowrap shadow-sm">
                                                {badge}
                                            </span>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleNotificationAction(true)}
                                        className="w-full h-14 rounded-2xl bg-islamic-gold text-[#1a0f00] font-bold text-base active:scale-[0.97] transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <Bell className="w-5 h-5" />
                                        {t('permission.notification_accept', 'Bildirimleri Aç')}
                                    </button>
                                    <button
                                        onClick={() => handleNotificationAction(false)}
                                        className="w-full mt-3 h-12 rounded-xl text-white/30 hover:text-white/50 font-medium text-sm active:scale-95 transition-all"
                                    >
                                        {t('permission.notification_manual', 'Ayarlardan Aç')}
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
