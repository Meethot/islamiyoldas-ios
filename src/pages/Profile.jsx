import React, { useState, useEffect } from 'react';
import { getAppDate, getDailyPrayersKey, getTodayString } from '@/lib/testDate';
import { Button } from '@/components/ui/button';
import {
    User, Settings, Bell, HelpCircle, RefreshCw,
    ChevronRight, LogOut, Heart, Crown, Check, Moon, MoonStar, Sun, Trash2, X, Flame, CalendarDays,
    BookOpen, Box, Landmark, Camera, Pen, Share2, UserPlus, Globe, Bug, Ticket, Gift, Sparkles, Type, Clock, Activity, Star
} from 'lucide-react';
import { triggerReviewPrompt } from '@/components/ReviewPrompt';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { shareProgress, shareInvite } from '@/lib/share';
import { useUser } from '@/context/UserContext';
import { useTranslation } from 'react-i18next';
import { handleLanguageChange } from '@/i18n';
import { useTheme } from '@/context/ThemeContext';
import { useFontSize } from '@/context/FontSizeContext';
import AvatarIcon from '@/components/AvatarIcon';
import ShareCard, { SHARE_THEMES } from '@/components/ShareCard';
import { isPremium as checkIsPremium, setPremium } from '@/services/creditService';
import { CapgoInAppReview as InAppReview } from '@capgo/capacitor-in-app-review';
import { storageService } from '@/services/storageService';
import { usePrayerTimes } from '@/context/PrayerTimesContext';
import { MosqueIcon } from '@/components/icons/PrayerIcons';

// Rub el Hizb (۞) deseni — iç içe iki kareden oluşan sekiz köşeli yıldız dokusu
function GirihPattern({ className }) {
    const patternId = 'girih-' + React.useId().replace(/:/g, '');
    return (
        <svg aria-hidden="true" className={cn("absolute inset-0 w-full h-full pointer-events-none", className)}>
            <defs>
                <pattern id={patternId} width="56" height="56" patternUnits="userSpaceOnUse">
                    <g fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="17" y="17" width="22" height="22" />
                        <rect x="17" y="17" width="22" height="22" transform="rotate(45 28 28)" />
                    </g>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
    );
}

export default function Profile() {
    const { isDarkMode, toggleTheme } = useTheme();
    const { fontSize, updateFontSize, FONT_SIZES } = useFontSize();
    const { t, i18n } = useTranslation('profile');
    const navigate = useNavigate();
    const { selection, success, heavy } = useHaptics();
    const { userData, updateAvatar, updateName, isPremium } = useUser();
    const { settings: prayerSettings, updateSettings } = usePrayerTimes();
    const { t: tSettings } = useTranslation('settings');
    const [customMinuteInput, setCustomMinuteInput] = useState('');
    const [customMinuteError, setCustomMinuteError] = useState(false);
    // 🔧 TEST: header'daki Premium/Son Teklif butonunu premium'a da göster (yayın öncesi kaldırılacak)
    const [debugShowPaywall, setDebugShowPaywall] = useState(() => localStorage.getItem('debug_show_paywall') === 'true');
    const toggleDebugPaywall = () => {
        const next = !(localStorage.getItem('debug_show_paywall') === 'true');
        localStorage.setItem('debug_show_paywall', next.toString());
        setDebugShowPaywall(next);
        window.dispatchEvent(new Event('debugPaywallChanged'));
    };

    const handleCustomMinuteSubmit = () => {
        const val = parseInt(customMinuteInput, 10);
        if (val >= 1 && val <= 120) {
            selection();
            updateSettings({ preReminderMinutes: val });
            setCustomMinuteInput('');
            setCustomMinuteError(false);
        }
    };

    // Constants
    const AVATAR_PRESETS = [
        { id: 'male', label: t('avatar.male') },
        { id: 'female', label: t('avatar.female') },
        { id: 'beads', label: t('avatar.beads') },
        { id: 'tuba', label: t('avatar.tuba') },
        { id: 'quran', label: t('avatar.quran') },
        { id: 'moon', label: t('avatar.moon') }
    ];

    // Better mapping for the "Pro Max" feel:
    // Actually, let's use Lucide icons that represent them best as requested.
    // Since I can't import new icons easily without knowing what's available in the file (I see imports at top), 
    // I will use what's available or standard ones.
    // The prompt suggested "Mosque", "Kaaba". 
    // I'll stick to the imports I verify below or generic ones.
    // Imports available: User, Settings, Shield, Bell, HelpCircle, RefreshCw, ChevronRight, LogOut, Heart, Crown, Check, Moon, Sun, Download, Trash2, X
    // I will use:
    // Male -> User
    // Female -> Heart (Soft)
    // Mosque -> Crown (Spiritual)
    // Kaaba -> Shield (Protection/Strength)
    // Quran -> Settings (Abstract book? No, let's use Shield or Heart. Wait "BookOpen" is imported in AppLayout but maybe not here. Let's check imports.)
    // I need to update imports if I use BookOpen or Landmark.
    // For now I will use existing imports to be safe or add imports.
    // I will ADD imports to be safe.

    // State
    const [selectedAvatar, setSelectedAvatar] = useState('male');
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [streak, setStreak] = useState('0');
    const [notifications, setNotifications] = useState(true);
    const [showFontSizeModal, setShowFontSizeModal] = useState(false);

    // Name Editing State
    const [showNameModal, setShowNameModal] = useState(false);
    const [tempName, setTempName] = useState('');

    // Share Card Data
    const [shareData, setShareData] = useState({
        completedCount: 0,
        totalPrayers: 5,
        streak: 0,
        prayers: [
            { name: 'Sabah', completed: false },
            { name: 'Öğle', completed: false },
            { name: 'İkindi', completed: false },
            { name: 'Akşam', completed: false },
            { name: 'Yatsı', completed: false }
        ]
    });

    // Share Theme Selection
    const [shareTheme, setShareTheme] = useState('emerald');
    const [showShareModal, setShowShareModal] = useState(false);



    // Calculator State
    const [showCalculator, setShowCalculator] = useState(false);

    const [calcData, setCalcData] = useState({ birthDate: '', startDate: '', gender: 'Erkek' });


    // Rate Us State
    const [hasRated, setHasRated] = useState(false);

    // Load Data
    useEffect(() => {
        try {
            const raw = localStorage.getItem('review_prompt_v4');
            if (raw && JSON.parse(raw).reviewed) {
                setHasRated(true);
            }
        } catch (e) {}
        
        setStreak(localStorage.getItem('userStreak') || '7');
        setNotifications(localStorage.getItem('notifications') !== 'false');
        // Migration: kaaba -> tuba
        let currentAvatar = localStorage.getItem('userAvatar') || 'male';
        if (currentAvatar === 'kaaba') {
            currentAvatar = 'tuba';
            storageService.setItem('userAvatar', 'tuba');
        }
        setSelectedAvatar(currentAvatar);

        // Sync with UserContext if avatar is not set
        if (!userData.avatar || userData.avatar === '🕌' || userData.avatar.length > 2) {
            const savedAvatarId = localStorage.getItem('userAvatar') || 'male';
            updateAvatar(savedAvatarId);
        }
    }, []);

    // Load real-time prayer and streak data for ShareCard
    useEffect(() => {
        const loadShareData = () => {
            try {
                // 1. Load Completed Prayers (Source of Truth)
                const prayerKey = getDailyPrayersKey();
                const storedPrayers = localStorage.getItem(prayerKey);
                let completedPrayers = [];
                if (storedPrayers && storedPrayers !== 'undefined' && storedPrayers !== 'null') {
                    try {
                        completedPrayers = JSON.parse(storedPrayers) || [];
                    } catch { completedPrayers = []; }
                }

                // 2. Load Streak (Source of Truth: Home.jsx / Tuba Agaci)
                const storedTuba = localStorage.getItem('tubaAgaci_data');
                let streak = 0;
                if (storedTuba && storedTuba !== 'undefined' && storedTuba !== 'null') {
                    try {
                        streak = JSON.parse(storedTuba).currentStreak || 0;
                    } catch { streak = 0; }
                } else {
                    // Fallback to minimal streak if tuba data missing
                    streak = parseInt(localStorage.getItem('userStreak') || '0', 10) || 0;
                }

                setShareData({
                    completedPrayers, // Pass raw array ['Fajr', 'Dhuhr']
                    streak,
                    totalPrayers: 5
                });
            } catch (e) {
                console.error("Error loading share data:", e);
            }
        };

        // Initial Load
        loadShareData();

        // Listen for updates from Home.jsx
        const handleUpdate = () => loadShareData();
        window.addEventListener('prayerStatusChanged', handleUpdate);
        // Also listen for storage events (if changed in another tab)
        window.addEventListener('storage', handleUpdate);

        return () => {
            window.removeEventListener('prayerStatusChanged', handleUpdate);
            window.removeEventListener('storage', handleUpdate);
        };
    }, []);

    const handleAvatarSelect = (id) => {
        selection();
        setSelectedAvatar(id);
        // Save to storage for cross-component sync
        storageService.setItem('userAvatar', id);

        // Update global avatar via UserContext (store ID now)
        updateAvatar(id);

        // Notify other components (like AppLayout header)
        window.dispatchEvent(new Event('avatarChanged'));

        setShowAvatarModal(false);
    };

    const handleNameSave = () => {
        const trimmed = tempName.trim();
        if (trimmed.length > 0 && trimmed.length <= 25) {
            success();
            // Update context
            updateName(trimmed);
            setShowNameModal(false);
        } else {
            heavy();
            alert(t('invalid_name') || 'Lütfen 1-25 karakter arası bir isim girin.');
        }
    };

    const toggleNotifications = () => {
        selection();
        const newState = !notifications;
        setNotifications(newState);
        storageService.setItem('notifications', newState.toString());
    };



    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

    const deleteAccount = async () => {
        heavy();
        if (confirm(t('delete_account.confirm'))) {
            // ÖNCE başarı ekranını göster
            setShowDeleteSuccess(true);
            // SONRA arkaplanda temizlik yap (1 saniye sonra — ekran göründükten sonra)
            setTimeout(async () => {
                setPremium(false);
                // RevenueCat'ten çıkış yap — premium durumu sıfırla
                try {
                    const { Purchases } = await import('@revenuecat/purchases-capacitor');
                    await Purchases.logOut();
                } catch (e) {
                    // Hata olursa sessizce devam et
                }
                await storageService.clearAll();
            }, 1000);
        }
    };

    const calculateQada = () => {
        if (!calcData.birthDate || !calcData.startDate) return alert(t('fill_dates'));
        // Simple mock calc for UX demo
        success();
        alert(t('calc_complete'));
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const handleReportBug = () => {
        selection();
        const email = "support@islamiyoldas.com";
        const subject = encodeURIComponent(t('report_bug.email_subject'));
        const body = encodeURIComponent(t('report_bug.email_body'));
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    // Kimlik kartı istatistikleri
    const journeyDays = (() => {
        const start = new Date(userData.installDate || new Date());
        const now = getAppDate(); // simüle edilmiş tarih desteği
        return Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
    })();
    const todayPrayerCount = shareData.completedPrayers?.length || 0;

    return (
        <motion.div
            className="space-y-6 px-5 pt-2 pb-24 overflow-x-hidden"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Header Area */}
            <motion.div variants={itemVariants} className="relative pt-2 px-4">

                {/* Profile Card — altın CTA ile aynı iskelet: üst satır + ayraç + 3'lü alt satır */}
                <div className={cn(
                    "relative overflow-hidden rounded-[2rem] border transition-colors duration-500 shadow-md shadow-stone-200/60 dark:shadow-none",
                    isPremium
                        ? "bg-white dark:bg-white/5 border-islamic-gold/40"
                        : "bg-white dark:bg-white/5 border-stone-200/80 dark:border-white/5"
                )}>
                    <div className={cn(
                        "hidden dark:block absolute -top-14 -left-14 w-48 h-48 rounded-full blur-3xl pointer-events-none",
                        isPremium ? "bg-islamic-gold/15" : "bg-emerald-300/10"
                    )} />

                    <div className="relative z-10 flex items-center gap-4 p-5 pb-4">
                        {/* Squircle avatar */}
                        <button
                            type="button"
                            className="relative flex-shrink-0 active:scale-95 transition-transform"
                            onClick={() => setShowAvatarModal(true)}
                        >
                            <div className={cn(
                                "w-16 h-16 rounded-[1.35rem] p-[2.5px]",
                                isPremium
                                    ? "bg-[conic-gradient(from_210deg,#8a6c1c,#F2D678,#C9A227,#F7E7A0,#8a6c1c)] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                                    : "bg-gradient-to-b from-stone-200 to-stone-100 dark:from-white/40 dark:via-emerald-200/25 dark:to-white/10"
                            )}>
                                <div className="w-full h-full rounded-[1.15rem] flex items-center justify-center overflow-hidden bg-[#032e18]">
                                    <AvatarIcon id={selectedAvatar} size={30} className={isPremium ? "text-islamic-gold" : "text-emerald-100/90"} />
                                </div>
                            </div>
                            <div className={cn(
                                "absolute -bottom-1 -right-1 p-1.5 rounded-full shadow border-2 border-white dark:border-[#0b241a] text-[#022c22]",
                                isPremium ? "bg-islamic-gold" : "bg-gradient-to-b from-[#F2D678] to-[#C9A227]"
                            )}>
                                <Camera size={10} className="fill-current" />
                            </div>
                        </button>

                        {/* İsim + yolculuk günü */}
                        <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                                selection();
                                setTempName(userData.name === 'Kullanıcı' ? '' : userData.name);
                                setShowNameModal(true);
                            }}
                        >
                            <div className="flex items-center gap-1.5">
                                <h2 className="text-lg font-extrabold tracking-tight truncate text-stone-900 dark:text-white">
                                    {userData.name === 'Kullanıcı' ? t('user.default_name') : userData.name}
                                </h2>
                                {isPremium && <Crown size={14} className="flex-shrink-0 text-islamic-gold fill-current" />}
                            </div>
                            <p className={cn(
                                "flex items-center gap-1 text-xs font-medium mt-0.5",
                                isPremium ? "text-islamic-gold/90" : "text-stone-500 dark:text-emerald-100/70"
                            )}>
                                <Moon size={10} className="fill-current text-islamic-gold/90" />
                                {t('user.streak_desc', { count: journeyDays })}
                            </p>
                        </div>

                        {/* İsim düzenleme çipi — CTA'daki chevron'un ikizi */}
                        <button
                            type="button"
                            onClick={() => {
                                selection();
                                setTempName(userData.name === 'Kullanıcı' ? '' : userData.name);
                                setShowNameModal(true);
                            }}
                            className={cn(
                                "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-95",
                                isPremium
                                    ? "bg-islamic-gold/15 text-islamic-gold ring-1 ring-inset ring-islamic-gold/30"
                                    : "bg-stone-100 text-stone-500 ring-1 ring-inset ring-stone-200/80 dark:bg-white/10 dark:text-emerald-100 dark:ring-white/15"
                            )}
                        >
                            <Pen size={14} />
                        </button>
                    </div>

                    <div className={cn(
                        "relative z-10 mx-5 h-px bg-gradient-to-r from-transparent to-transparent",
                        isPremium ? "via-islamic-gold/30" : "via-stone-200 dark:via-white/15"
                    )} />

                    {/* İstatistikler — CTA'daki özellik satırının ikizi */}
                    <div className="relative z-10 grid grid-cols-3 divide-x divide-stone-200/70 dark:divide-white/10 py-3.5">
                        {[
                            { icon: CalendarDays, value: journeyDays, label: t('user.stat_days') },
                            { icon: Flame, value: shareData.streak || 0, label: t('user.stat_streak') },
                            { icon: MosqueIcon, value: `${todayPrayerCount}/5`, label: t('user.stat_prayers') },
                        ].map(({ icon: StatIcon, value, label }) => (
                            <div key={label} className="flex flex-col items-center gap-0.5 px-2">
                                <p className="flex items-center gap-1.5 text-base font-extrabold text-stone-900 dark:text-white leading-none">
                                    <StatIcon size={14} className="text-islamic-gold" strokeWidth={2.25} />
                                    {value}
                                </p>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-emerald-100/60">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Premium CTA (Only for Free Users) */}
            {!isPremium && (
                <motion.div variants={itemVariants} className="px-4 pb-2">
                    <motion.div
                        onClick={() => { heavy(); navigate('/premium'); }}
                        whileTap={{ scale: 0.97 }}
                        className="relative overflow-hidden rounded-[2rem] cursor-pointer border border-[#b08d1e]/50 ring-1 ring-inset ring-white/40 shadow-[0_16px_40px_-12px_rgba(212,175,55,0.55)]"
                        style={{ background: 'linear-gradient(150deg, #FFE066 0%, #F5C842 45%, #D4AF37 100%)' }}
                    >
                        <GirihPattern className="text-[#064e3b] opacity-[0.05]" />
                        <div className="absolute -top-12 -right-8 w-40 h-40 bg-white/35 rounded-full blur-3xl pointer-events-none" />

                        {/* İnce parıltı süpürmesi — yavaş, düşük opaklık */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: 'linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.35) 50%, transparent 58%)',
                                backgroundSize: '250% 100%',
                            }}
                            animate={{ backgroundPosition: ['250% 0%', '-150% 0%'] }}
                            transition={{ repeat: Infinity, duration: 4.5, ease: 'linear', repeatDelay: 3 }}
                        />

                        <div className="relative z-10 flex items-center gap-4 p-5 pb-4">
                            {/* Zümrüt hilal mühür */}
                            <div className="relative flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-b from-[#0a5433] to-[#032e18] ring-1 ring-inset ring-white/20 shadow-[0_6px_16px_rgba(3,46,24,0.35)]">
                                <MoonStar className="w-7 h-7 text-islamic-gold" strokeWidth={1.75} />
                                <motion.div
                                    className="absolute inset-0 rounded-full ring-1 ring-[#064e3b]/40"
                                    animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                                    transition={{ repeat: Infinity, duration: 2.8, ease: 'easeOut' }}
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#064e3b]/70 mb-0.5">{t('app_name')}</p>
                                <h3 className="text-lg font-serif font-bold text-[#053a22] leading-tight">{t('premium.banner_title')}</h3>
                                <p className="text-xs text-[#064e3b]/80 font-medium leading-snug mt-1">{t('premium.banner_desc')}</p>
                            </div>

                            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-b from-[#0a5433] to-[#032e18] text-islamic-gold flex items-center justify-center shadow-[0_4px_14px_rgba(3,46,24,0.4)]">
                                <ChevronRight size={18} strokeWidth={2.5} />
                            </div>
                        </div>

                        <div className="relative z-10 mx-5 h-px bg-gradient-to-r from-transparent via-[#064e3b]/25 to-transparent" />

                        <div className="relative z-10 px-5 py-3.5 flex items-center justify-center gap-x-4 gap-y-1 flex-wrap">
                            {['feat_quran', 'feat_no_ads', 'feat_widgets'].map(key => (
                                <span key={key} className="flex items-center gap-1.5 text-[11px] font-bold text-[#064e3b]/85">
                                    <span className="w-1 h-1 rotate-45 bg-[#064e3b]/70" aria-hidden="true" />
                                    {t(`premium.${key}`)}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Settings Navigation (Drill-Down Pattern) */}
            <motion.div variants={itemVariants} className="px-4 space-y-4">
                <h3 className="text-[10px] font-bold text-stone-500 dark:text-gray-400 uppercase tracking-widest px-2">{t('personal_settings')}</h3>
                <div className="bg-white dark:bg-white/5 rounded-[2rem] shadow-md shadow-stone-200/60 dark:shadow-none border border-stone-200/80 dark:border-white/5 overflow-hidden divide-y divide-stone-100 dark:divide-white/5">

                    {/* Location - Navigate to sub-page */}
                    <div
                        className="p-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={() => { selection(); navigate('/settings/location'); }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100/80 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
                                <Box size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-stone-800 dark:text-white">{t('location.title')}</p>
                                <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">{t('location.subtitle')}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-stone-400 dark:text-gray-300 group-hover:translate-x-1 transition-transform" />
                    </div>

                    {/* Notifications - Navigate to sub-page */}
                    <div
                        className="p-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={() => { selection(); navigate('/settings/notifications'); }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 text-emerald-700 dark:bg-islamic-green/20 dark:text-islamic-gold rounded-2xl group-hover:scale-110 transition-transform">
                                <Bell size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-stone-800 dark:text-white">{t('notifications.title')}</p>
                                <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">{t('notifications.subtitle')}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-stone-400 dark:text-gray-300 group-hover:translate-x-1 transition-transform" />
                    </div>

                    {/* Pre-Prayer Reminder — Inline */}
                    <div className="overflow-hidden">
                        <div
                            className="p-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                            onClick={() => {
                                selection();
                                updateSettings({ preReminderEnabled: !prayerSettings.preReminderEnabled });
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "p-3 rounded-2xl group-hover:scale-110 transition-all",
                                    prayerSettings.preReminderEnabled
                                        ? "bg-islamic-green/10 text-islamic-green dark:bg-islamic-gold/20 dark:text-islamic-gold"
                                        : "bg-stone-100 text-stone-400 dark:bg-white/5 dark:text-gray-500"
                                )}>
                                    <Clock size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-stone-800 dark:text-white">{tSettings('preReminder')}</p>
                                    <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">
                                        {prayerSettings.preReminderEnabled
                                            ? tSettings('preReminderActive', { count: prayerSettings.preReminderMinutes || 30 })
                                            : tSettings('preReminderSubtitle')
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className={cn(
                                "w-12 h-6 rounded-full p-1 transition-colors relative",
                                prayerSettings.preReminderEnabled ? "bg-islamic-green dark:bg-islamic-gold" : "bg-stone-300 dark:bg-white/10"
                            )}>
                                <div className={cn(
                                    "w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
                                    prayerSettings.preReminderEnabled ? "translate-x-6" : "translate-x-0"
                                )} />
                            </div>
                        </div>

                        {/* Chips — visible only when enabled */}
                        {prayerSettings.preReminderEnabled && (
                            <div className="px-5 pb-4 pt-1 space-y-2">
                                <div className="flex gap-2">
                                    {[15, 30, 45, 60].map(min => (
                                        <button
                                            key={min}
                                            onClick={() => { selection(); updateSettings({ preReminderMinutes: min }); }}
                                            className={cn(
                                                "flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95",
                                                (prayerSettings.preReminderMinutes || 30) === min
                                                    ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#021a0f] shadow-md"
                                                    : "bg-stone-100 dark:bg-white/[0.06] text-stone-500 dark:text-gray-400"
                                            )}
                                        >
                                            {min} {tSettings('preReminderMin')}
                                        </button>
                                    ))}
                                </div>
                                {/* Custom input row */}
                                <div className="space-y-1">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={3}
                                            value={customMinuteInput}
                                            onChange={e => {
                                                const raw = e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 3);
                                                setCustomMinuteInput(raw);
                                                setCustomMinuteError(parseInt(raw, 10) > 120);
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleCustomMinuteSubmit();
                                            }}
                                            placeholder={tSettings('preReminderCustomPlaceholder')}
                                            className={cn(
                                                "flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-white/[0.06] text-stone-900 dark:text-white outline-none transition-colors placeholder:text-stone-400",
                                                customMinuteError
                                                    ? "border border-red-500 dark:border-red-400"
                                                    : "border border-stone-200/60 dark:border-white/10 focus:border-islamic-green dark:focus:border-islamic-gold"
                                            )}
                                        />
                                        <button
                                            onClick={handleCustomMinuteSubmit}
                                            disabled={!customMinuteInput || customMinuteError || parseInt(customMinuteInput, 10) < 1}
                                            className="px-4 py-2 rounded-xl text-sm font-bold bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#021a0f] disabled:opacity-30 active:scale-95 transition-all"
                                        >
                                            ✓
                                        </button>
                                    </div>
                                    {customMinuteError && (
                                        <p className="text-[10px] font-bold text-red-500 dark:text-red-400 px-1">
                                            {tSettings('preReminderMaxError')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Appearance - Direct Toggle (no sub-page needed) */}
                    <div
                        className="p-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={() => { selection(); toggleTheme(); }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100/80 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform">
                                {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-stone-800 dark:text-white">{t('appearance.title')}</p>
                                <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">{isDarkMode ? t('appearance.dark_active') : t('appearance.light_active')}</p>
                            </div>
                        </div>
                        {/* Sliding Toggle Switch */}
                        <div className={cn(
                            "w-12 h-6 rounded-full p-1 transition-colors relative",
                            isDarkMode ? "bg-islamic-green dark:bg-islamic-gold" : "bg-stone-300 dark:bg-white/10"
                        )}>
                            <div className={cn(
                                "w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
                                isDarkMode ? "translate-x-6" : "translate-x-0"
                            )} />
                        </div>
                    </div>

                    {/* Invite Friend */}
                    <div
                        className="p-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={async () => {
                            selection();
                            const success = await shareInvite('user-' + Date.now());
                            if (success) heavy();
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 text-emerald-700 dark:bg-islamic-green/20 dark:text-islamic-gold rounded-2xl group-hover:scale-110 transition-transform">
                                <UserPlus size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-stone-800 dark:text-white">{t('invite.title')}</p>
                                <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">{t('invite.subtitle')}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-stone-400 dark:text-gray-300 group-hover:translate-x-1 transition-transform" />
                    </div>

                </div>
            </motion.div>

            {/* General Settings (New Section) */}
            <motion.div variants={itemVariants} className="px-4 space-y-4">
                <h3 className="text-[10px] font-bold text-stone-500 dark:text-gray-400 uppercase tracking-widest px-2">{t('general_settings')}</h3>
                <div className="bg-white dark:bg-white/5 rounded-[2rem] shadow-md shadow-stone-200/60 dark:shadow-none border border-stone-200/80 dark:border-white/5 overflow-hidden divide-y divide-stone-100 dark:divide-white/5">

                    {/* Language Selector */}
                    <div
                        className="p-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={() => navigate('/settings/language')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-100/80 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
                                <Globe size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-stone-800 dark:text-white">{t('language.title')}</p>
                                <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">{t('language.subtitle')}</p>
                            </div>
                        </div>

                    </div>

                    {/* Font Size Adjustment */}
                    <div
                        className="p-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={() => { selection(); setShowFontSizeModal(true); }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-gray-400 rounded-2xl group-hover:scale-110 transition-transform">
                                <Type size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-stone-800 dark:text-white">{t('font_size.title', 'Yazı Boyutu')}</p>
                                <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">
                                    {t(`font_size.${fontSize}`)}
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-stone-400 dark:text-gray-300 group-hover:translate-x-1 transition-transform" />
                    </div>

                    {/* Haptics Toggle */}
                    <div
                        className="p-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={() => { selection(); updateSettings({ hapticsEnabled: !prayerSettings.hapticsEnabled }); }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-rose-100/80 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-2xl group-hover:scale-110 transition-transform">
                                <Activity size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-stone-800 dark:text-white">{t('haptics.title', 'Titreşim')}</p>
                                <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">{t('haptics.subtitle', 'Uygulama içi dokunma hissi')}</p>
                            </div>
                        </div>
                        <div className={cn(
                            "w-12 h-6 rounded-full p-1 transition-colors relative",
                            prayerSettings.hapticsEnabled ? "bg-islamic-green dark:bg-islamic-gold" : "bg-stone-300 dark:bg-white/10"
                        )}>
                            <div className={cn(
                                "w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
                                prayerSettings.hapticsEnabled ? "translate-x-6" : "translate-x-0"
                            )} />
                        </div>
                    </div>

                    {/* Bizi Puanla */}
                    <div
                        className={`p-5 flex items-center justify-between transition-colors ${hasRated ? 'opacity-70' : 'hover:bg-stone-50 dark:hover:bg-white/5 cursor-pointer group'}`}
                        onClick={() => {
                            selection();
                            if (hasRated) {
                                success();
                                return;
                            }
                            // Kendi özel yeşil popup'ımızı açıyoruz, böylece 1-4 yıldız arası filtreleme yapabileceğiz
                            triggerReviewPrompt('profile', true);
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100/80 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform">
                                <Star size={20} fill="currentColor" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-stone-800 dark:text-white">
                                    {hasRated ? t('rate_us.already_rated_title', 'Teşekkür Ederiz') : t('rate_us.title', 'Bizi Puanlayın')}
                                </p>
                                <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">
                                    {hasRated ? t('rate_us.already_rated', 'Desteğiniz için teşekkür ederiz') : t('rate_us.subtitle', 'Uygulamaya destek olun')}
                                </p>
                            </div>
                        </div>
                        {!hasRated && <ChevronRight className="w-5 h-5 text-stone-400 dark:text-gray-300 group-hover:translate-x-1 transition-transform" />}
                    </div>

                    {/* Report Bug */}
                    <div
                        className="p-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={handleReportBug}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100/80 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl group-hover:scale-110 transition-transform">
                                <Bug size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-stone-800 dark:text-white">{t('report_bug.title')}</p>
                                <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">{t('report_bug.subtitle')}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-stone-400 dark:text-gray-300 group-hover:translate-x-1 transition-transform" />
                    </div>

                    {/* Legal & About - Navigate to sub-page */}
                    <div
                        className="p-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={() => { selection(); navigate('/settings/legal'); }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-stone-200/80 dark:bg-white/5 text-stone-600 dark:text-gray-400 rounded-2xl group-hover:scale-110 transition-transform">
                                <HelpCircle size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-stone-800 dark:text-white">{t('legal.title')}</p>
                                <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">{t('legal.subtitle')}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-stone-400 dark:text-gray-300 group-hover:translate-x-1 transition-transform" />
                    </div>


                </div>
            </motion.div>

            {/* Danger Zone */}
            <motion.div variants={itemVariants} className="px-4 space-y-4 pb-4">
                <Button
                    variant="ghost"
                    onClick={deleteAccount}
                    className="w-full justify-between h-14 bg-red-50 dark:bg-red-900/10 rounded-[2rem] border border-red-100 dark:border-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 px-6"
                >
                    <span className="flex items-center gap-3 font-bold text-sm"><Trash2 size={18} /> {t('delete_account.title')}</span>
                    <LogOut size={18} />
                </Button>
            </motion.div>


            {/* Font Size Modal */}
            <AnimatePresence>
                {showFontSizeModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowFontSizeModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-[#032e18] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border dark:border-white/10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-islamic-gold/10 rounded-xl">
                                        <Type className="w-6 h-6 text-islamic-gold" />
                                    </div>
                                    <h3 className="text-xl font-bold font-serif text-islamic-green dark:text-islamic-gold">
                                        {t('font_size.modal_title', 'Yazı Boyutu')}
                                    </h3>
                                </div>
                                <Button size="icon" variant="ghost" onClick={() => setShowFontSizeModal(false)}><X className="w-5 h-5" /></Button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-xs text-stone-500 dark:text-gray-400 text-center mb-4 px-4">
                                    {t('font_size.desc', 'Uygulama genelindeki yazı boyutunu tercihinize göre ölçeklendirebilirsiniz.')}
                                </p>
                                
                                <div className="grid grid-cols-1 gap-2">
                                    {Object.values(FONT_SIZES).map((size) => (
                                        <button
                                            key={size.id}
                                            onClick={() => {
                                                if (size.id === fontSize) return;
                                                success();
                                                updateFontSize(size.id);
                                            }}
                                            className={cn(
                                                "w-full p-4 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] border-2",
                                                fontSize === size.id
                                                    ? "bg-islamic-green/10 border-islamic-green dark:bg-islamic-gold/10 dark:border-islamic-gold"
                                                    : "bg-gray-50 dark:bg-white/5 border-transparent hover:bg-gray-100 dark:hover:bg-white/10"
                                            )}
                                        >
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className={cn(
                                                    "font-bold font-serif",
                                                    fontSize === size.id ? "text-islamic-green dark:text-islamic-gold" : "text-stone-700 dark:text-white"
                                                )} style={{ fontSize: `${size.scale}rem` }}>
                                                    {t(`font_size.${size.id}`)}
                                                </span>
                                                <span className="text-[10px] text-stone-400 dark:text-gray-500 uppercase tracking-widest font-bold">
                                                    {(size.scale * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            {fontSize === size.id && (
                                                <div className="w-6 h-6 rounded-full bg-islamic-green dark:bg-islamic-gold flex items-center justify-center">
                                                    <Check size={14} className="text-white dark:text-[#032e18]" strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                
                                <Button
                                    onClick={() => setShowFontSizeModal(false)}
                                    className="w-full h-12 mt-4 bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] rounded-2xl font-bold shadow-lg shadow-islamic-green/10"
                                >
                                    {t('common.done', 'Tamam')}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Avatar Selection Modal */}
            <AnimatePresence>
                {showAvatarModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowAvatarModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-[#032e18] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border dark:border-white/10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold font-serif text-islamic-green dark:text-islamic-gold">{t('avatar_modal_title')}</h3>
                                <Button size="icon" variant="ghost" onClick={() => setShowAvatarModal(false)}><X className="w-5 h-5" /></Button>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {AVATAR_PRESETS.map((avatar) => (
                                    <button
                                        key={avatar.id}
                                        onClick={() => handleAvatarSelect(avatar.id)}
                                        className={cn(
                                            "aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 border-2",
                                            selectedAvatar === avatar.id
                                                ? "bg-islamic-green/10 border-islamic-green dark:bg-islamic-gold/10 dark:border-islamic-gold"
                                                : "bg-gray-50 dark:bg-white/5 border-transparent hover:bg-gray-100 dark:hover:bg-white/10"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-full", isPremium ? "text-islamic-gold" : "text-gray-600 dark:text-gray-300")}>
                                            <AvatarIcon id={avatar.id} size={28} />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{avatar.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Editable Name Modal */}
            <AnimatePresence>
                {showNameModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowNameModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-[#032e18] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border dark:border-white/10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold font-serif text-islamic-green dark:text-islamic-gold flex items-center gap-2">
                                    <User className="w-5 h-5" /> İsmini Düzenle
                                </h3>
                                <Button size="icon" variant="ghost" onClick={() => setShowNameModal(false)}><X className="w-5 h-5" /></Button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2 relative">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Kullanıcı Adı</label>
                                    <input
                                        type="text"
                                        value={tempName}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Only allow letters (including Turkish characters) and spaces
                                            if (/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]*$/.test(val)) {
                                                setTempName(val);
                                            }
                                        }}
                                        placeholder="Kullanıcı"
                                        maxLength={25}
                                        className="w-full p-4 pl-12 bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-xl text-lg font-bold text-gray-900 dark:text-white focus:outline-none focus:border-islamic-green dark:focus:border-islamic-gold transition-colors"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && tempName.trim() && (() => {
                                            success();
                                            updateName(tempName.trim());
                                            setShowNameModal(false);
                                        })()}
                                    />
                                    <Pen className="w-5 h-5 absolute left-4 bottom-4 text-gray-400" />
                                </div>


                                <p className="text-[10px] text-gray-400 text-center">İsim uzunluğu 1-25 karakter arasında olmalı ve sadece harf içermelidir.</p>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => setShowNameModal(false)}
                                        className="flex-1 h-12 bg-gray-100 text-stone-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 rounded-xl font-medium transition-colors"
                                    >
                                        İptal
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (tempName.trim()) {
                                                success();
                                                updateName(tempName.trim());
                                                setShowNameModal(false);
                                            } else {
                                                heavy();
                                            }
                                        }}
                                        disabled={!tempName.trim()}
                                        className="flex-1 h-12 bg-islamic-green hover:bg-islamic-green/90 dark:bg-islamic-gold dark:text-[#032e18] dark:hover:bg-islamic-gold/90 text-white font-bold text-base rounded-xl transition-all shadow-md active:scale-95"
                                    >
                                        Kaydet
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Developer Test Buttons (Temporary for testing) */}
            <div className="flex flex-col gap-2 mx-6 mt-4 opacity-50 mb-4">
                <Button 
                    onClick={() => navigate('/premium')}
                    className="w-full bg-blue-500/20 text-blue-500 py-2 rounded-xl text-xs font-bold"
                >
                    🔧 Test: Paywall'ı Aç
                </Button>
                <Button
                    onClick={() => navigate('/premium?offer=force')}
                    className="w-full bg-red-500/20 text-red-500 py-2 rounded-xl text-xs font-bold"
                >
                    🔥 Test: İndirim Popup Aç (zorla)
                </Button>
                <Button
                    onClick={async () => {
                        await storageService.removeItem('islamiyoldas_discount_offer_end');
                        await storageService.removeItem('islamiyoldas_discount_cooldown_end');
                        window.location.reload();
                    }}
                    className="w-full bg-yellow-500/20 text-yellow-500 py-2 rounded-xl text-xs font-bold"
                >
                    ⏱ Test: Sayaç Cooldown Sıfırla
                </Button>
                <Button
                    onClick={toggleDebugPaywall}
                    className={`w-full py-2 rounded-xl text-xs font-bold ${debugShowPaywall ? 'bg-green-500/25 text-green-500' : 'bg-white/10 text-stone-400'}`}
                >
                    👁 Header Premium butonu: {debugShowPaywall ? 'AÇIK (premium\'da da görünür)' : 'KAPALI'}
                </Button>
            </div>

            <div className="flex flex-col items-center pb-0 opacity-50 mt-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-800 dark:text-white">
                    İSLAMİ YOLDAŞ
                </p>
                <p className="text-[8px] text-stone-500 dark:text-gray-500 font-medium tracking-widest mt-1">
                    © {new Date().getFullYear()} TÜM HAKLARI SAKLIDIR
                </p>
            </div>

            {/* Hidden ShareCard for Screenshot Capture */}
            <ShareCard
                completedPrayers={shareData.completedPrayers}
                streak={shareData.streak}
                theme={shareTheme}
            />

            {/* Share Theme Picker Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
                        onClick={() => setShowShareModal(false)}
                    >
                        <motion.div
                            initial={{ y: 300 }}
                            animate={{ y: 0 }}
                            exit={{ y: 300 }}
                            transition={{ type: 'spring', damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-safe"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('theme_select_title')}</h3>
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800"
                                >
                                    <X size={18} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Theme Grid */}
                            <div className="grid grid-cols-5 gap-3 mb-6">
                                {Object.values(SHARE_THEMES).map((theme, index) => {
                                    const isFree = index === 0;
                                    const isLocked = !isFree && !isPremium;
                                    return (
                                        <button
                                            key={theme.id}
                                            onClick={() => {
                                                selection();
                                                if (isLocked) {
                                                    navigate('/premium');
                                                    return;
                                                }
                                                setShareTheme(theme.id);
                                            }}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all relative",
                                                shareTheme === theme.id
                                                    ? "border-islamic-green dark:border-islamic-gold scale-105"
                                                    : "border-transparent"
                                            )}
                                        >
                                            <div className="relative">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl shadow-lg transition-opacity",
                                                    theme.preview,
                                                    isLocked && "opacity-50"
                                                )} />
                                                {isLocked && (
                                                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-islamic-gold to-amber-600 flex items-center justify-center shadow-md shadow-islamic-gold/30">
                                                        <Crown size={10} className="text-white" fill="white" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-medium",
                                                isLocked ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"
                                            )}>
                                                {theme.name}
                                            </span>
                                            {shareTheme === theme.id && (
                                                <Check size={14} className="text-islamic-green dark:text-islamic-gold" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Share Button */}
                            <Button
                                onClick={async () => {
                                    heavy();
                                    setShowShareModal(false);
                                    const success = await shareProgress('share-card', shareData.streak);
                                    if (success) success();
                                }}
                                className="w-full py-6 bg-islamic-green hover:bg-islamic-green/90 text-white font-bold rounded-2xl"
                            >
                                <Share2 size={20} className="mr-2" />
                                Paylaş
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Hesap Silme Başarı Ekranı */}
            <AnimatePresence>
                {showDeleteSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#032e18] p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: 'spring', damping: 20 }}
                            className="text-center max-w-sm"
                        >
                            {/* Checkmark Circle */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: 'spring', damping: 15 }}
                                className="w-24 h-24 mx-auto mb-8 rounded-full bg-red-500/20 flex items-center justify-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5, type: 'spring', damping: 12 }}
                                    className="w-16 h-16 rounded-full bg-red-500/30 flex items-center justify-center"
                                >
                                    <Check className="w-8 h-8 text-red-400" />
                                </motion.div>
                            </motion.div>

                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-2xl font-serif font-bold text-white mb-3"
                            >
                                {t('delete_account.success_title', 'Hesabınız Silindi')}
                            </motion.h2>

                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="text-white/60 text-sm leading-relaxed mb-10"
                            >
                                {t('delete_account.success_desc', 'Hesabınız ve tüm verileriniz başarıyla silindi. Uygulamadan güvenle çıkabilirsiniz.')}
                            </motion.p>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.5, 1, 0.5] }}
                                transition={{ delay: 1.2, repeat: Infinity, duration: 2 }}
                                className="text-white/30 text-xs"
                            >
                                {t('delete_account.success_hint', 'Uygulamayı kapatabilirsiniz')}
                            </motion.p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div >
    );
}


