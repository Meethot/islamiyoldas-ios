import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

/**
 * PrayerTimeOverlay — Premium centered popup for prayer time reminder.
 * Tap backdrop to dismiss. Not forced — user can close freely.
 */
export default function PrayerTimeOverlay({ isOpen, prayer, onPray, onSnooze, onDismiss }) {
    const { success, heavy } = useHaptics();
    const { t } = useTranslation('home');

    if (!prayer) return null;

    const handlePray = () => {
        success();
        onPray(prayer.id || prayer.name);
    };

    const handleSnooze = () => {
        heavy();
        onSnooze(prayer.id || prayer.name);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop — tap anywhere to dismiss */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[9999]"
                        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
                        onClick={onDismiss}
                    />

                    {/* Centered popup card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center px-6 pointer-events-none"
                    >
                        <div
                            className="relative max-w-sm w-full rounded-3xl overflow-hidden pointer-events-auto"
                            style={{
                                background: 'linear-gradient(165deg, #1a3a24 0%, #0d2818 40%, #0a1f14 100%)',
                                border: '1px solid rgba(212,175,55,0.2)',
                                boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(212,175,55,0.08)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Top decorative gold line */}
                            <div
                                className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-24 rounded-full"
                                style={{
                                    background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)',
                                }}
                            />

                            {/* Close (X) button */}
                            <motion.button
                                onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                                whileTap={{ scale: 0.85 }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full"
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                <X size={16} style={{ color: 'rgba(255,255,255,0.45)' }} />
                            </motion.button>

                            {/* Radial glow behind icon */}
                            <div
                                className="absolute left-1/2 -translate-x-1/2"
                                style={{
                                    top: '20px',
                                    width: '200px',
                                    height: '200px',
                                    background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)',
                                    borderRadius: '50%',
                                }}
                            />

                            <div className="relative px-6 pt-8 pb-6 text-center space-y-5">
                                {/* Mosque SVG icon */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.15, duration: 0.6, type: 'spring', bounce: 0.3 }}
                                    className="relative mx-auto"
                                    style={{ width: '80px', height: '80px' }}
                                >
                                    {/* Rotating outer ring */}
                                    <motion.div
                                        className="absolute inset-[-6px] rounded-full"
                                        style={{ border: '1.5px solid rgba(212,175,55,0.25)' }}
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                                    />

                                    {/* Icon container */}
                                    <div
                                        className="w-full h-full rounded-full relative flex items-center justify-center"
                                        style={{
                                            background: 'rgba(212,175,55,0.08)',
                                            border: '1px solid rgba(212,175,55,0.2)',
                                            transform: 'translateZ(0)', /* Force hardware acceleration layer early */
                                        }}
                                    >
                                        <span className="text-[2.5rem] leading-none inline-block">🕌</span>
                                    </div>
                                </motion.div>

                                {/* Divider */}
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.3, duration: 0.6 }}
                                    className="mx-auto"
                                    style={{
                                        width: '40px',
                                        height: '1px',
                                        background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)',
                                    }}
                                />

                                {/* Prayer info */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25, duration: 0.5 }}
                                    className="space-y-1.5"
                                >
                                    <p
                                        className="text-[10px] font-semibold uppercase tracking-[0.25em]"
                                        style={{ color: 'rgba(212,175,55,0.6)' }}
                                    >
                                        {t('prayerOverlay.prayerTime')}
                                    </p>
                                    <h1
                                        className="text-4xl font-bold"
                                        style={{
                                            fontFamily: "'Georgia', serif",
                                            background: 'linear-gradient(180deg, #FFFFFF 20%, rgba(212,175,55,0.8) 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        {prayer.name}
                                    </h1>
                                    <p
                                        className="text-xl font-light tracking-wider"
                                        style={{ color: 'rgba(255,255,255,0.5)' }}
                                    >
                                        {prayer.time}
                                    </p>
                                </motion.div>

                                {/* Motivational text */}
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4, duration: 0.6 }}
                                    className="text-sm italic leading-relaxed"
                                    style={{
                                        fontFamily: "'Georgia', serif",
                                        color: 'rgba(255,255,255,0.45)',
                                    }}
                                >
                                    {t('prayerOverlay.motivational')}
                                </motion.p>

                                {/* Action buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5, duration: 0.5 }}
                                    className="flex flex-col gap-2.5 pt-2"
                                >
                                    {/* Primary — Kılıyorum */}
                                    <motion.button
                                        onClick={handlePray}
                                        whileTap={{ scale: 0.97 }}
                                        className="relative w-full overflow-hidden rounded-2xl py-3.5 text-base font-bold tracking-wide"
                                        style={{
                                            background: 'linear-gradient(135deg, #1a6b3c 0%, #0d4a28 100%)',
                                            color: '#ffffff',
                                            boxShadow: '0 6px 24px rgba(26,107,60,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
                                            border: '1px solid rgba(212,175,55,0.2)',
                                        }}
                                    >
                                        {/* Shimmer */}
                                        <motion.div
                                            className="absolute inset-0"
                                            style={{
                                                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)',
                                            }}
                                            animate={{ x: ['-100%', '200%'] }}
                                            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                                        />
                                        <span className="relative z-10">{t('prayerOverlay.praying')}</span>
                                    </motion.button>

                                    {/* Secondary — 10 dk Sonra Hatırlat */}
                                    <motion.button
                                        onClick={handleSnooze}
                                        whileTap={{ scale: 0.97 }}
                                        className="w-full rounded-2xl py-3 text-sm font-medium"
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'rgba(255,255,255,0.55)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                        }}
                                    >
                                        {t('prayerOverlay.remindLater')}
                                    </motion.button>
                                </motion.div>
                            </div>

                            {/* Bottom decorative gold line */}
                            <div
                                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] w-16 rounded-full"
                                style={{
                                    background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)',
                                }}
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
