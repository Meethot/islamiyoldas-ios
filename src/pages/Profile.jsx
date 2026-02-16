import React, { useState, useEffect } from 'react';
import { getAppDate, getDailyPrayersKey, getTodayString } from '@/lib/testDate';
import { Button } from '@/components/ui/button';
import {
    User, Settings, Shield, Bell, HelpCircle, RefreshCw,
    ChevronRight, LogOut, Heart, Crown, Check, Moon, Sun, Download, Trash2, X,
    BookOpen, Box, Landmark, Camera, Pen, Share2, UserPlus, Globe, Bug, Ticket, Gift
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { shareProgress, shareInvite } from '@/lib/share';
import { useUser } from '@/context/UserContext';
import { useTranslation } from 'react-i18next';
import { handleLanguageChange } from '@/i18n';
import { useTheme } from '@/context/ThemeContext';
import AvatarIcon from '@/components/AvatarIcon';
import ShareCard, { SHARE_THEMES } from '@/components/ShareCard';

export default function Profile() {
    const { isDarkMode, toggleTheme } = useTheme();
    const { t, i18n } = useTranslation('profile');
    const navigate = useNavigate();
    const { selection, success, heavy } = useHaptics();
    const { userData, updateAvatar } = useUser();

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
    const [isPremium, setIsPremium] = useState(false);
    const [streak, setStreak] = useState('0');
    const [notifications, setNotifications] = useState(true);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

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

    // Promo Code State
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const VALID_CODES = ['MOBI2025', 'TEKNOFIST', 'MEKKE', 'MEDINE', 'RAMAZAN', 'ALLAHKABULETSIN', 'KABE'];

    const handlePromoSubmit = () => {
        const code = promoCode.trim().toUpperCase();
        if (VALID_CODES.includes(code)) {
            success();
            setIsPremium(true);
            localStorage.setItem('isPremium', 'true');
            setShowPromoModal(false);
            setPromoCode('');
            alert(t('promo.success'));
            window.confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        } else {
            heavy();
            alert(t('promo.invalid'));
        }
    };

    // Load Data
    useEffect(() => {
        setStreak(localStorage.getItem('userStreak') || '7');
        setIsPremium(localStorage.getItem('isPremium') === 'true');
        setNotifications(localStorage.getItem('notifications') !== 'false');
        // Migration: kaaba -> tuba
        let currentAvatar = localStorage.getItem('userAvatar') || 'male';
        if (currentAvatar === 'kaaba') {
            currentAvatar = 'tuba';
            localStorage.setItem('userAvatar', 'tuba');
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

    const togglePremium = () => {
        heavy();
        const newState = !isPremium;
        setIsPremium(newState);
        localStorage.setItem('isPremium', newState.toString());
    };

    const handleAvatarSelect = (id) => {
        selection();
        setSelectedAvatar(id);
        // Save to localStorage for cross-component sync
        localStorage.setItem('userAvatar', id);

        // Update global avatar via UserContext (store ID now)
        updateAvatar(id);

        // Notify other components (like AppLayout header)
        window.dispatchEvent(new Event('avatarChanged'));

        setShowAvatarModal(false);
    };

    const toggleNotifications = () => {
        selection();
        const newState = !notifications;
        setNotifications(newState);
        localStorage.setItem('notifications', newState.toString());
    };



    const deleteAccount = () => {
        heavy();
        if (confirm(t('delete_account.confirm'))) {
            localStorage.clear();
            window.location.reload();
        }
    };

    const calculateQada = () => {
        if (!calcData.birthDate || !calcData.startDate) return alert('Please fill in the dates');
        // Simple mock calc for UX demo
        success();
        alert('Hesaplama simülasyonu tamamlandı.');
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

    return (
        <motion.div
            className="space-y-6 px-5 pt-2 pb-24 overflow-x-hidden"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Header Area */}
            <motion.div variants={itemVariants} className="relative pt-2 px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-serif font-bold text-islamic-green dark:text-islamic-gold">{t('title')}</h1>
                </div>

                {/* Profile Card */}
                <div className={cn(
                    "relative overflow-hidden rounded-[2.5rem] p-6 transition-all duration-500",
                    isPremium
                        ? "bg-gradient-to-br from-[#064e3b] to-[#022c22] border-2 border-islamic-gold shadow-[0_0_30px_rgba(212,175,55,0.15)]"
                        : "bg-gradient-to-b from-white to-stone-50 dark:bg-white/5 dark:from-transparent dark:to-transparent border border-stone-200/80 dark:border-white/10 shadow-lg shadow-stone-200/50 dark:shadow-none"
                )}>
                    {isPremium && (
                        <div className="absolute top-0 right-0 p-4">
                            <div className="bg-islamic-gold text-[#022c22] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-lg animate-pulse">
                                <Crown size={12} className="fill-current" /> Premium
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col items-center relative z-10">
                        <div className="relative mb-4 group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
                            <div className={cn(
                                "w-28 h-28 rounded-full flex items-center justify-center p-1 transition-all duration-500",
                                isPremium ? "bg-gradient-to-tr from-islamic-gold via-amber-200 to-islamic-gold animate-spin-slow" : "bg-gradient-to-br from-stone-100 to-stone-200 dark:bg-white/10"
                            )}>
                                <div className="w-full h-full rounded-full bg-white dark:bg-[#032e18] flex items-center justify-center border-4 border-transparent overflow-hidden">
                                    <AvatarIcon id={selectedAvatar} size={48} className={isPremium ? "text-islamic-gold" : "text-gray-300"} />
                                </div>
                            </div>

                            {/* Camera/Edit Badge */}
                            <div className="absolute 0 bottom-1 right-1 bg-islamic-green text-white p-2 rounded-full border-4 border-white dark:border-[#032e18] shadow-lg">
                                <Camera size={14} className="fill-current" />
                            </div>
                        </div>

                        <h2 className={cn("text-2xl font-serif font-bold mb-1", isPremium ? "text-white" : "text-gray-900 dark:text-white")}>
                            {t('user.default_name')}
                        </h2>
                        <p className={cn("text-sm font-medium", isPremium ? "text-islamic-gold/80" : "text-stone-500 dark:text-gray-400")}>
                            {t('user.streak_desc', {
                                count: (() => {
                                    const start = new Date(userData.installDate || new Date());
                                    const now = getAppDate(); // Use simulated date
                                    const diff = now - start;
                                    const todayStr = getTodayString();
                                    const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
                                    return days;
                                })()
                            })}
                        </p>
                    </div>

                    {/* Premium Ambient Background */}
                    {isPremium && (
                        <>
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
                            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-islamic-gold/20 rounded-full blur-3xl" />
                        </>
                    )}
                </div>
            </motion.div>

            {/* Premium CTA (Only for Free Users) */}
            {!isPremium && (
                <motion.div variants={itemVariants} className="px-4">
                    <div
                        onClick={togglePremium}
                        className="bg-gradient-to-r from-islamic-gold to-amber-500 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden cursor-pointer group"
                    >
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold font-serif mb-1">{t('premium.banner_title')}</h3>
                                <p className="text-xs text-white/90 font-medium">{t('premium.banner_desc')}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
                                <Crown className="w-6 h-6 text-white fill-current" />
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </motion.div>
            )}

            {/* Settings Navigation (Drill-Down Pattern) */}
            <motion.div variants={itemVariants} className="px-4 space-y-4">
                <h3 className="text-[10px] font-bold text-stone-500 dark:text-gray-400 uppercase tracking-widest px-2">{t('personal_settings')}</h3>
                <div className="bg-white dark:bg-white/5 rounded-[2rem] shadow-md shadow-stone-200/60 dark:shadow-none border border-stone-200/80 dark:border-white/5 overflow-hidden divide-y divide-stone-100 dark:divide-white/5">

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


                    {/* Share Progress */}
                    <div
                        className="p-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={async () => {
                            selection();
                            heavy();
                            await shareProgress('share-card', shareData.streak);
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 text-amber-700 dark:bg-islamic-gold/20 dark:text-islamic-gold rounded-2xl group-hover:scale-110 transition-transform">
                                <Share2 size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-stone-800 dark:text-white">{t('share.title')}</p>
                                <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">{t('share.subtitle')}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-stone-400 dark:text-gray-300 group-hover:translate-x-1 transition-transform" />
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

                    {/* Promo Code */}
                    <div
                        className="p-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={() => setShowPromoModal(true)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100/80 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-2xl group-hover:scale-110 transition-transform">
                                <Ticket size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-stone-800 dark:text-white">{t('promo.title')}</p>
                                <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">{t('promo.subtitle')}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-stone-400 dark:text-gray-300 group-hover:translate-x-1 transition-transform" />
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

                    {/* Privacy Modal Trigger */}
                    <div className="p-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => setShowPrivacyModal(true)}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
                                <Shield size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-stone-800 dark:text-white">{t('privacy.title')}</p>
                                <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">{t('privacy.subtitle')}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-stone-400 dark:text-gray-300 group-hover:translate-x-1 transition-transform" />
                    </div>

                </div>
            </motion.div>

            {/* Danger Zone */}
            <motion.div variants={itemVariants} className="px-4 space-y-4 pb-10">
                <Button
                    variant="ghost"
                    onClick={deleteAccount}
                    className="w-full justify-between h-14 bg-red-50 dark:bg-red-900/10 rounded-[2rem] border border-red-100 dark:border-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 px-6"
                >
                    <span className="flex items-center gap-3 font-bold text-sm"><Trash2 size={18} /> {t('delete_account.title')}</span>
                    <LogOut size={18} />
                </Button>
            </motion.div>


            {/* Privacy Modal */}
            <AnimatePresence>
                {showPrivacyModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowPrivacyModal(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-[#032e18] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold font-serif text-islamic-green dark:text-islamic-gold">{t('privacy.modal_title')}</h3>
                                <Button size="icon" variant="ghost" onClick={() => setShowPrivacyModal(false)}><X className="w-5 h-5" /></Button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center gap-4">
                                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full text-green-600"><Check size={16} /></div>
                                    <div className="text-xs text-gray-600 dark:text-gray-300 leading-tight" dangerouslySetInnerHTML={{ __html: t('privacy.data_info') }} />
                                </div>

                                <Button className="w-full h-12 bg-white border-2 border-gray-200 dark:bg-transparent dark:border-white/10 dark:text-white hover:bg-gray-50 rounded-xl justify-between px-4 text-gray-700">
                                    <span className="flex items-center gap-2"><Download size={18} /> {t('privacy.download')}</span>
                                    <span className="text-[10px] bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-gray-500">JSON</span>
                                </Button>

                                <Button className="w-full h-12 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-xl justify-start px-4 gap-2">
                                    <Trash2 size={18} /> {t('privacy.delete_all')}
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

            {/* Promo Code Modal */}
            <AnimatePresence>
                {showPromoModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowPromoModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-[#032e18] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border dark:border-white/10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold font-serif text-islamic-green dark:text-islamic-gold flex items-center gap-2">
                                    <Gift className="w-6 h-6" /> {t('promo.title')}
                                </h3>
                                <Button size="icon" variant="ghost" onClick={() => setShowPromoModal(false)}><X className="w-5 h-5" /></Button>
                            </div>

                            <div className="space-y-4">
                                {/* <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                                    Youtuber veya Influencer'lardan aldığınız kodu aşağıya girerek Premium özellikleri ücretsiz açabilirsiniz.
                                </p> */}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t('promo.label')}</label>
                                    <input
                                        type="text"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                        placeholder="MOBI2025"
                                        className="w-full p-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-xl text-lg font-bold text-center tracking-widest uppercase focus:outline-none focus:border-islamic-gold transition-colors"
                                    />
                                </div>

                                <Button
                                    onClick={handlePromoSubmit}
                                    disabled={!promoCode.trim()}
                                    className="w-full h-12 bg-islamic-gold hover:bg-islamic-gold/90 text-[#032e18] font-bold text-base rounded-xl shadow-lg shadow-islamic-gold/20 active:scale-95 transition-all"
                                >
                                    {t('promo.submit')}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="text-center pb-8 opacity-30">
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">{t('app_name')}</p>
                <p className="text-[9px]">{t('version')}</p>
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
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tema Seç</h3>
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
        </motion.div >
    );
}


