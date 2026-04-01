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
                        className="w-full max-w-md bg-[#032e18] rounded-t-[2.5rem] p-8 pb-10 shadow-2xl border-t border-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drag indicator — always visible */}
                        <div className="w-12 h-1.5 rounded-full bg-white/25 mx-auto mb-6" />

                        {cardType === 'location' ? (
                            <>
                                <div className="w-16 h-16 rounded-[1.25rem] bg-islamic-green/30 flex items-center justify-center mx-auto mb-5">
                                    <MapPin className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-serif font-bold text-center text-white mb-2">
                                    {t('permission.location_title', '🕌 Namaz Vakitlerini Ayarlayalım')}
                                </h3>
                                <p className="text-sm text-center text-emerald-100/50 mb-5 leading-relaxed max-w-[280px] mx-auto">
                                    {t('permission.location_desc', 'Bulunduğun şehre göre doğru namaz vakitlerini ve kıble yönünü gösterebilmemiz için konumuna ihtiyacımız var.')}
                                </p>

                                <div className="flex flex-wrap items-center justify-center gap-3 mb-7 px-2">
                                    {[t('permission.badge_prayer', '🕌 Namaz Vakti'), t('permission.badge_qibla', '🧭 Kıble Yönü')].map((badge) => (
                                        <span key={badge} className="px-3.5 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-xs text-emerald-100/80 font-bold whitespace-nowrap shadow-sm">
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
                                    className="w-full mt-3 h-12 rounded-xl text-white/30 font-medium text-sm active:scale-95 transition-all"
                                >
                                    {t('permission.location_manual', 'Manuel Olarak Ayarla')}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-[1.25rem] bg-islamic-gold/15 flex items-center justify-center mx-auto mb-5">
                                    <Bell className="w-8 h-8 text-islamic-gold" />
                                </div>
                                <h3 className="text-xl font-serif font-bold text-center text-white mb-2">
                                    {t('permission.notification_title', '🔔 Namaz Vakitlerini Kaçırma')}
                                </h3>
                                <p className="text-sm text-center text-emerald-100/50 mb-5 leading-relaxed max-w-[280px] mx-auto">
                                    {t('permission.notification_desc', 'Ezan vakitlerinde seni bilgilendirelim, günlük hatırlatmalarla ibadetlerini takip et.')}
                                </p>

                                <div className="flex flex-wrap items-center justify-center gap-3 mb-7 px-2">
                                    {[t('permission.badge_adhan', '🔔 Ezan Vakti'), t('permission.badge_dhikr', '📿 Günlük Zikir'), t('permission.badge_reminder', '🌙 Hatırlatma')].map((badge) => (
                                        <span key={badge} className="px-3.5 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-xs text-amber-100/80 font-bold whitespace-nowrap shadow-sm">
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
                                    className="w-full mt-3 h-12 rounded-xl text-white/30 font-medium text-sm active:scale-95 transition-all"
                                >
                                    {t('permission.notification_manual', 'Ayarlardan Aç')}
                                </button>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
