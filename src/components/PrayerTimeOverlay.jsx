import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';
import { useTranslation } from 'react-i18next';

/**
 * PrayerTimeOverlay
 * 
 * Full-screen blur overlay that appears during prayer time.
 * Gently interrupts user to encourage prayer completion.
 * 
 * @param {boolean} isOpen - Controls overlay visibility
 * @param {object} prayer - Current prayer { id, name, time, icon }
 * @param {function} onPray - Callback when "I'm praying" is clicked (receives prayer.id)
 * @param {function} onSnooze - Callback when "Remind later" is clicked (receives prayer.id)
 * @param {function} onDismiss - Callback when overlay is dismissed
 */
export default function PrayerTimeOverlay({ isOpen, prayer, onPray, onSnooze, onDismiss }) {
    const { success, heavy } = useHaptics();
    const { t } = useTranslation('home');

    if (!prayer) return null;

    const PrayerIcon = prayer.icon;

    const handlePray = () => {
        success();
        onPray(prayer.id || prayer.name);
    };

    const handleSnooze = () => {
        heavy();
        onSnooze(prayer.id || prayer.name);
    };

    const handleDismiss = () => {
        onDismiss();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Full-screen Backdrop with Heavy Blur */}
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                        className="fixed inset-0 bg-black/50 z-[9999]"
                        style={{ backdropFilter: 'blur(16px)' }}
                    >
                        {/* Close button (subtle, top-right) */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors backdrop-blur-sm z-10"
                            aria-label={t('prayerOverlay.close')}
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>

                        {/* Central Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                            className="flex items-center justify-center h-full p-6"
                        >
                            <div className="max-w-md w-full space-y-8 text-center">
                                {/* Mosque Icon with Glow */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.4, duration: 0.8, type: 'spring', bounce: 0.3 }}
                                    className="relative mx-auto w-32 h-32"
                                >
                                    {/* Glow effect */}
                                    <div className="absolute inset-0 bg-islamic-gold/30 rounded-full blur-3xl animate-pulse" />

                                    {/* Icon container */}
                                    <div className="relative w-full h-full bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/30 shadow-2xl">
                                        <span className="text-7xl">🕌</span>
                                    </div>
                                </motion.div>

                                {/* Prayer Name */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6, duration: 0.7 }}
                                    className="space-y-3"
                                >
                                    <p className="text-sm font-bold text-white/70 uppercase tracking-widest">
                                        {t('prayerOverlay.prayerTime')}
                                    </p>
                                    <h1 className="text-5xl font-serif font-bold text-white drop-shadow-2xl">
                                        {prayer.name}
                                    </h1>
                                    <p className="text-lg text-white/80 font-medium">
                                        {prayer.time}
                                    </p>
                                </motion.div>

                                {/* Motivational Message */}
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8, duration: 0.7 }}
                                    className="text-white/90 italic font-serif text-lg leading-relaxed px-6"
                                >
                                    {t('prayerOverlay.motivational')}
                                </motion.p>

                                {/* Action Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1, duration: 0.7 }}
                                    className="flex flex-col gap-4 pt-6"
                                >
                                    {/* Primary: I'm praying */}
                                    <Button
                                        onClick={handlePray}
                                        className="w-full h-16 text-xl font-bold bg-gradient-to-r from-islamic-green to-islamic-green/90 hover:from-islamic-green/90 hover:to-islamic-green text-white shadow-2xl shadow-islamic-green/50 hover:shadow-islamic-green/70 transition-all duration-300 rounded-2xl"
                                    >
                                        {t('prayerOverlay.praying')}
                                    </Button>

                                    {/* Secondary: Snooze */}
                                    <Button
                                        onClick={handleSnooze}
                                        variant="outline"
                                        className="w-full h-14 text-lg font-semibold bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 backdrop-blur-md transition-all duration-300 rounded-2xl"
                                    >
                                        {t('prayerOverlay.remindLater')}
                                    </Button>
                                </motion.div>


                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
