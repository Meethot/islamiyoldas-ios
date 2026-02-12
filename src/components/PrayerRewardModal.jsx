import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';
import { KaabaIcon } from '@/components/icons/KaabaIcon';
import { useTranslation } from 'react-i18next';

/**
 * PrayerRewardModal
 * 
 * Displays a serene, spiritually uplifting modal after user completes a prayer.
 * Shows random hadith/dua with peaceful animations and glassmorphism design.
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal closes
 * @param {object} content - { hadith: {...}, dua: {...} } from PRAYER_CONTENT
 * @param {string} prayerName - Name of completed prayer (e.g., "Fajr")
 */
export default function PrayerRewardModal({ isOpen, onClose, content, prayerName }) {
    const { light } = useHaptics();
    const { t, i18n } = useTranslation('home');
    const lang = i18n.language;

    // Body Scroll Lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleClose = () => {
        light(); // Gentle haptic feedback (was success/heavy)
        onClose();
    };

    if (!content) return null;

    const { hadith, dua } = content;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        onClick={handleClose}
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} // Gentle cubic-bezier
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
                    >
                        <div
                            className="glass-panel max-w-md w-full rounded-3xl overflow-hidden shadow-2xl pointer-events-auto border-2 border-white/20 dark:border-islamic-gold/30"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header with gentle glow */}
                            <div className="relative bg-gradient-to-br from-islamic-green/10 to-islamic-gold/10 dark:from-islamic-green/5 dark:to-islamic-gold/5 p-8 text-center">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.15),transparent_70%)]" />

                                {/* Close button - subtle */}
                                <button
                                    onClick={handleClose}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20 flex items-center justify-center transition-colors backdrop-blur-sm z-10"
                                    aria-label={t('prayerReward.close')}
                                >
                                    <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                </button>

                                {/* Prayer completion icon */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, duration: 0.6, type: 'spring', bounce: 0.3 }}
                                    className="w-20 h-20 mx-auto mb-4 bg-islamic-gold/20 dark:bg-islamic-gold/10 rounded-full flex items-center justify-center relative overflow-hidden shrink-0 z-10"
                                >
                                    <KaabaIcon className="w-10 h-10 text-islamic-gold drop-shadow-sm" strokeWidth={1.5} />
                                </motion.div>

                                {/* Main title */}
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, duration: 0.6 }}
                                    className="text-2xl font-serif font-bold text-islamic-green dark:text-islamic-gold mb-2"
                                >
                                    {t('prayerReward.mayAllahAccept')}
                                </motion.h2>



                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.6 }}
                                    className="text-sm text-gray-600 dark:text-gray-300 font-medium"
                                >
                                    {t('prayerReward.thankYou', { prayerName })}
                                </motion.p>
                            </div>

                            {/* Content - Hadith */}
                            {hadith && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6, duration: 0.7 }}
                                    className="p-6 space-y-4"
                                >
                                    <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-5 border border-white/30 dark:border-white/10">
                                        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200 italic text-center font-serif">
                                            "{hadith[`text_${lang}`] || hadith.textEn || hadith.text}"
                                        </p>
                                        <div className="mt-3 flex items-center justify-center gap-2">
                                            <div className="h-px flex-1 bg-gray-300 dark:bg-white/10 max-w-[60px]" />
                                            <p className="text-xs text-islamic-green dark:text-islamic-gold font-bold uppercase tracking-wide">
                                                {hadith[`source_${lang}`] || hadith.sourceEn || hadith.source}
                                            </p>
                                            <div className="h-px flex-1 bg-gray-300 dark:bg-white/10 max-w-[60px]" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Content - Dua (if available) */}
                            {dua && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8, duration: 0.7 }}
                                    className="px-6 pb-6 space-y-3"
                                >
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-2">
                                            {t('prayerReward.recommendedDua')}
                                        </p>
                                        {dua.arabic && (
                                            <p className="text-2xl font-arabic text-islamic-green dark:text-islamic-gold mb-2 leading-loose">
                                                {dua.arabic}
                                            </p>
                                        )}
                                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                                            {dua[lang] || dua.english || dua.turkish}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Footer - Amin button */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1, duration: 0.6 }}
                                className="p-6 pt-2"
                            >
                                <Button
                                    onClick={handleClose}
                                    className="w-full bg-gradient-to-r from-islamic-green to-islamic-green/90 dark:from-islamic-gold dark:to-islamic-gold/90 text-white dark:text-[#032e18] hover:shadow-lg transition-all duration-300 rounded-2xl h-12 font-bold text-base"
                                >
                                    {t('prayerReward.amin')}
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
