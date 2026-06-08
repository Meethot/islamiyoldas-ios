import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Server, Sparkles, Lock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CONSENT_KEY = 'ai_mentor_consent';

export function hasAiConsent() {
    return localStorage.getItem(CONSENT_KEY) === 'granted';
}

export function revokeAiConsent() {
    localStorage.removeItem(CONSENT_KEY);
}

// Minimalist, modern Apple-style Hero Icon with ambient glow
function MinimalHeroIcon() {
    return (
        <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            {/* Soft gold ambient glow */}
            <div className="absolute inset-[-20%] pointer-events-none rounded-full" style={{
                background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)',
            }} />
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-islamic-gold/20 to-islamic-gold/5 border border-islamic-gold/30 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-islamic-gold" />
            </div>
        </div>
    );
}

// Flat, elegant list row aligned with iOS guidelines
function MinimalInfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3.5 py-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-stone-100 dark:bg-white/5 border border-stone-200/50 dark:border-white/5 mt-0.5">
                <Icon size={13} className="text-islamic-gold dark:text-islamic-gold/80" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-[13.5px] font-semibold text-stone-800 dark:text-white/90 leading-normal">{label}</h4>
                <p className="text-[12px] text-stone-500 dark:text-white/50 leading-relaxed mt-0.5">{value}</p>
            </div>
        </div>
    );
}

export default function AiConsentModal({ onAccept, onDecline }) {
    const { t } = useTranslation('misc');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleAccept = () => {
        localStorage.setItem(CONSENT_KEY, 'granted');
        onAccept?.();
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onDecline}
                    />

                    {/* iOS style Bottom Sheet */}
                    <motion.div
                        className="relative w-full max-w-md z-10 flex flex-col overflow-hidden rounded-t-[28px] bg-white dark:bg-[#031d10] border-t border-stone-200/40 dark:border-white/10 shadow-2xl max-h-[90vh] pb-[calc(1.2rem+env(safe-area-inset-bottom))]"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.5 }}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 80 || info.velocity.y > 350) {
                                onDecline?.();
                            }
                        }}
                    >
                        {/* Drag Indicator */}
                        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                            <div className="w-9 h-1 rounded-full bg-stone-300 dark:bg-white/10" />
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onDecline}
                            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 dark:bg-white/5 text-stone-400 dark:text-white/40 hover:text-stone-600 dark:hover:text-white active:scale-95 transition-all"
                        >
                            <X size={15} />
                        </button>

                        {/* Scrollable Content */}
                        <div className="px-6 overflow-y-auto scrollbar-none flex-1">
                            {/* Header */}
                            <div className="text-center mt-2 mb-4">
                                <MinimalHeroIcon />
                                <h2 className="text-[20px] font-bold text-stone-900 dark:text-white tracking-tight leading-tight">
                                    {t('aiConsent.title')}
                                </h2>
                                <p className="text-[13px] text-stone-500 dark:text-white/50 leading-relaxed mt-2 px-2">
                                    {t('aiConsent.subtitle')}
                                </p>
                            </div>

                            {/* Flat Info List */}
                            <div className="divide-y divide-stone-100 dark:divide-white/5 border-t border-b border-stone-100 dark:border-white/5 py-1 mb-6">
                                <MinimalInfoRow
                                    icon={ShieldCheck}
                                    label={t('aiConsent.data_sent_label')}
                                    value={t('aiConsent.data_sent_value')}
                                />
                                <MinimalInfoRow
                                    icon={Server}
                                    label={t('aiConsent.provider_label')}
                                    value={t('aiConsent.provider_value')}
                                />
                                <MinimalInfoRow
                                    icon={Sparkles}
                                    label={t('aiConsent.purpose_label')}
                                    value={t('aiConsent.purpose_value')}
                                />
                                <MinimalInfoRow
                                    icon={Lock}
                                    label={t('aiConsent.storage_label')}
                                    value={t('aiConsent.storage_value')}
                                />
                            </div>

                            {/* Actions Stack */}
                            <div className="flex flex-col gap-2.5">
                                {/* Accept Button */}
                                <motion.button
                                    onClick={handleAccept}
                                    className="w-full py-3.5 rounded-xl font-semibold text-[15px] text-[#032e18] bg-gradient-to-r from-islamic-gold to-amber-500 hover:from-islamic-gold/90 hover:to-amber-500/90 shadow-md active:scale-[0.98] transition-transform text-center"
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {t('aiConsent.accept')}
                                </motion.button>

                                {/* Decline Link */}
                                <button
                                    onClick={onDecline}
                                    className="w-full py-2.5 text-[13px] font-medium text-stone-400 dark:text-white/30 hover:text-stone-600 dark:hover:text-white/50 transition-colors text-center"
                                >
                                    {t('aiConsent.decline')}
                                </button>
                            </div>

                            {/* Privacy Link */}
                            <p className="text-center text-[11px] text-stone-400/60 dark:text-white/20 mt-3 mb-2">
                                {t('aiConsent.privacy_note')}{' '}
                                <button
                                    onClick={() => window.open('https://www.islamiyoldas.com/privacy', '_blank')}
                                    className="underline underline-offset-2 text-islamic-gold/70 dark:text-islamic-gold/40 hover:text-islamic-gold transition-colors font-medium"
                                >
                                    {t('aiConsent.privacy_link')}
                                </button>
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
