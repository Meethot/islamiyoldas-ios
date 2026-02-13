import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { useTranslation } from 'react-i18next';
import { handleLanguageChange } from '@/i18n';

const LANGUAGES = [
    { code: 'tr', label: 'Türkçe', native: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'de', label: 'Deutsch', native: 'Deutsch', flag: '🇩🇪', beta: true },
    { code: 'ar', label: 'العربية', native: 'Arabic', flag: '🇸🇦', beta: true },
    { code: 'ru', label: 'Русский', native: 'Russian', flag: '🇷🇺', beta: true },
];

export default function LanguageSettings() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('profile');
    const { selection } = useHaptics();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 }
    };

    const handleSelect = (lang) => {
        selection();
        if (lang.code === i18n.language) return;
        handleLanguageChange(lang.code);
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#021a0f] text-gray-900 dark:text-white pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-[#044d29]/40 backdrop-blur-md sticky top-0 z-40 p-4 flex items-center gap-4 border-b dark:border-white/5">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-xl font-bold font-serif text-islamic-green dark:text-islamic-gold">{t('modal.select_lang')}</h1>
            </div>

            <motion.div
                className="p-5 space-y-6"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Language List */}
                <motion.section variants={itemVariants} className="space-y-3">
                    <h3 className="px-2 text-[10px] font-bold text-gray-400 dark:text-emerald-100/40 uppercase tracking-widest">
                        {t('modal.select_lang')}
                    </h3>
                    <div className="bg-white dark:bg-white/5 rounded-[2rem] shadow-sm border dark:border-white/5 overflow-hidden">
                        {LANGUAGES.map((lang, idx) => (
                            <button
                                key={lang.code}
                                onClick={() => handleSelect(lang)}
                                className={cn(
                                    "w-full flex items-center justify-between p-5 transition-colors",
                                    idx < LANGUAGES.length - 1 && "border-b dark:border-white/5",
                                    i18n.language === lang.code
                                        ? "bg-islamic-gold/5 dark:bg-islamic-gold/10"
                                        : "hover:bg-slate-50 dark:hover:bg-white/5"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-3xl">{lang.flag}</span>
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                            <p className={cn(
                                                "text-sm font-bold",
                                                i18n.language === lang.code
                                                    ? "text-islamic-gold"
                                                    : "text-gray-900 dark:text-white"
                                            )}>
                                                {lang.label}
                                            </p>
                                            {lang.beta && (
                                                <span className="text-[9px] font-bold uppercase tracking-wider bg-islamic-gold/15 text-islamic-gold px-2 py-0.5 rounded-full border border-islamic-gold/30">
                                                    Beta
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{lang.native}</p>
                                    </div>
                                </div>
                                {i18n.language === lang.code && (
                                    <div className="bg-islamic-gold text-[#021a0f] p-1.5 rounded-full">
                                        <Check size={16} strokeWidth={3} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </motion.section>

                {/* Note */}
                <motion.section variants={itemVariants}>
                    <p className="text-center text-xs text-gray-400 px-4">
                        {t('modal.lang_note')}
                    </p>
                </motion.section>
            </motion.div>
        </div>
    );
}
