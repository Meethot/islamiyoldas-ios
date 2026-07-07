import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Info, Moon, Share2, MessageSquare, Loader2, Disc3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { usePrayerTimes } from '../../context/PrayerTimesContext';
import { useTranslation } from 'react-i18next';
import { isPremium } from '@/services/creditService';

function SettingsToggle({ icon: Icon, label, subtitle, active, onToggle }) {
    return (
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b last:border-0 dark:border-white/5"
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "p-3 rounded-2xl transition-colors",
                    active ? "bg-islamic-green/10 text-islamic-green dark:bg-islamic-gold/20 dark:text-islamic-gold" : "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500"
                )}>
                    <Icon size={20} />
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{subtitle}</p>
                </div>
            </div>
            <div className={cn(
                "w-12 h-6 rounded-full p-1 transition-colors relative",
                active ? "bg-islamic-green dark:bg-islamic-gold" : "bg-gray-200 dark:bg-white/10"
            )}>
                <div className={cn(
                    "w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
                    active ? "translate-x-6" : "translate-x-0"
                )} />
            </div>
        </button>
    );
}

export default function NotificationSettings() {
    const navigate = useNavigate();
    const { t } = useTranslation('settings');
    const { selection } = useHaptics();
    const { settings: prayerSettings, updateSettings } = usePrayerTimes();

    const premiumGate = (callback) => {
        if (!isPremium()) {
            selection();
            navigate('/premium');
            return;
        }
        callback();
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#021a0f] text-gray-900 dark:text-white pb-24">
            <div className="px-5 pt-4 flex items-center gap-3">
                <button
                    onClick={() => { selection(); navigate(-1); }}
                    aria-label={t('common:common.back')}
                    className="flex-shrink-0 w-9 h-9 rounded-full bg-white dark:bg-white/5 border border-stone-200/80 dark:border-white/10 shadow-sm dark:shadow-none flex items-center justify-center text-islamic-green dark:text-islamic-gold hover:bg-stone-50 dark:hover:bg-white/10 transition-colors active:scale-95"
                >
                    <ChevronLeft size={18} />
                </button>
                <h1 className="text-xl font-bold font-serif text-islamic-green dark:text-islamic-gold">{t('notifications')}</h1>
            </div>

            <motion.div
                className="p-5 space-y-6"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Core Notifications */}
                <motion.section variants={itemVariants} className="space-y-3">
                    <div className="bg-white dark:bg-white/5 rounded-[2rem] shadow-sm border dark:border-white/5 overflow-hidden">
                        <SettingsToggle
                            icon={Bell}
                            label={t('adhanTime')}
                            subtitle={t('adhanTimeSubtitle')}
                            active={prayerSettings.adhanEnabled}
                            onToggle={() => {
                                selection();
                                updateSettings({ adhanEnabled: !prayerSettings.adhanEnabled });
                            }}
                        />
                        {prayerSettings.adhanEnabled && (
                            <SettingsToggle
                                icon={Loader2}
                                label={t('vibrateOnly')}
                                subtitle={t('vibrateOnlySubtitle')}
                                active={prayerSettings.vibrateOnly}
                                onToggle={() => {
                                    selection();
                                    updateSettings({ vibrateOnly: !prayerSettings.vibrateOnly });
                                }}
                            />
                        )}
                        <SettingsToggle
                            icon={Info}
                            label={t('dailyVerse')}
                            subtitle={t('dailyVerseSubtitle')}
                            active={prayerSettings.verseEnabled}
                            onToggle={() => {
                                selection();
                                updateSettings({ verseEnabled: !prayerSettings.verseEnabled });
                            }}
                        />
                    </div>
                </motion.section>

                {/* Prayer Motivation */}
                <motion.section variants={itemVariants} className="space-y-3">
                    <h3 className="px-2 text-xs font-bold text-gray-400 dark:text-emerald-100/40 uppercase tracking-widest">{t('prayerMotivation')}</h3>
                    <div className="bg-white dark:bg-white/5 rounded-[2rem] shadow-sm border dark:border-white/5 overflow-hidden">
                        <SettingsToggle
                            icon={Moon}
                            label={t('prayerMode')}
                            subtitle={t('prayerModeSubtitle')}
                            active={prayerSettings.prayerFocusMode}
                            onToggle={() => {
                                selection();
                                updateSettings({ prayerFocusMode: !prayerSettings.prayerFocusMode });
                            }}
                        />
                        <SettingsToggle
                            icon={Share2}
                            label={t('spiritualRewards')}
                            subtitle={t('spiritualRewardsSubtitle')}
                            active={prayerSettings.spiritualRewards}
                            onToggle={() => {
                                selection();
                                updateSettings({ spiritualRewards: !prayerSettings.spiritualRewards });
                            }}
                        />
                        <SettingsToggle
                            icon={MessageSquare}
                            label={t('fridayMessage')}
                            subtitle={t('fridayMessageSubtitle')}
                            active={prayerSettings.fridayMessage}
                            onToggle={() => {
                                selection();
                                updateSettings({ fridayMessage: !prayerSettings.fridayMessage });
                            }}
                        />
                        <SettingsToggle
                            icon={Disc3}
                            label={t('dhikrReminder')}
                            subtitle={t('dhikrReminderSubtitle')}
                            active={prayerSettings.dhikrReminder}
                            onToggle={() => {
                                selection();
                                updateSettings({ dhikrReminder: !prayerSettings.dhikrReminder });
                            }}
                        />
                    </div>
                </motion.section>
            </motion.div>
        </div>
    );
}
