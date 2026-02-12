import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Moon, Sunrise, Sun, Sunset, Sparkles, Star, Wind, MessageCircle, X, Download,
    ChevronRight, Heart, Share2, Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { getDailyVerse } from '@/data/dailyVerses';
import { getAppDate, getDailyPrayersKey, getTodayString } from '@/lib/testDate';
import { safeGetStorage, safeSetStorage } from '@/utils/storageHelper';
import { useHaptics } from '@/hooks/useMobile';
import { usePrayers } from '@/hooks/usePrayers';
import {
    WeeklyStreakWidget, VerseOfDayCard, DailyDeedCard, EsmaUlHusnaWidget,
    PrayerCountdownWidget, AllEsmaModal,
    ReligiousCalendarWidget, QuickAction, LoadingPlaceholder, TasbihIcon
} from '@/components/HomeComponents';
import { Button } from '@/components/ui/button';
import { shareProgress, shareInvite, shareVerse } from '@/lib/share';
import PrayerTimeOverlay from '@/components/PrayerTimeOverlay';
import { triggerReviewPrompt } from '@/components/ReviewPrompt';
import { usePrayerFocus } from '@/hooks/usePrayerFocus';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';

// Static Constants moved outside to prevent re-creation
// FRIDAY_CONTENT is now dynamic - moved inside component to use t()

const ESMA_UL_HUSNA = [
    { name: 'Er-Rahman', meaning: 'Herkesi ve herşeyi kuşatan sınırsız merhamet sahibi.', meaning_en: 'The Most Merciful, whose boundless mercy encompasses all.', meaning_de: 'Der Allerbarmer, der allen Geschöpfen in dieser Welt barmherzig ist.', ebced: 298, virtue: 'Dünya ve ahiret mutluluğu, rızık bolluğu için okunur.', virtue_en: 'For worldly and eternal happiness, abundance of sustenance.', virtue_de: 'Für Glückseligkeit im Diesseits und Jenseits, Fülle der Versorgung.', calligraphy: 'الرَّحْمَنُ' },
    { name: 'Er-Rahim', meaning: 'Kendisine inananlara özel merhameti olan.', meaning_en: 'The Especially Merciful to believers.', meaning_de: 'Der besonders Barmherzige zu den Gläubigen im Jenseits.', ebced: 258, virtue: 'Maddi ve manevi rızık, hidayet ve şefkat için okunur.', virtue_en: 'For material and spiritual sustenance, guidance and compassion.', virtue_de: 'Für materielle und geistliche Versorgung, Rechtleitung und Mitgefühl.', calligraphy: 'الرَّحِيمُ' },
    { name: 'El-Melik', meaning: 'Bütün kainatın mutlak sahibi ve hükümdarı.', meaning_en: 'The absolute Sovereign and Owner of all creation.', meaning_de: 'Der absolute Herrscher und Eigentümer der gesamten Schöpfung.', ebced: 90, virtue: 'Maddi ve manevi güç, itibar ve söz sahibi olmak için okunur.', virtue_en: 'For material and spiritual power, prestige and authority.', virtue_de: 'Für materielle und geistliche Kraft, Ansehen und Autorität.', calligraphy: 'الْمَلِكُ' },
    { name: 'El-Kuddüs', meaning: 'Bütün eksikliklerden münezzeh, mukaddes.', meaning_en: 'The Most Holy, free from all imperfections.', meaning_de: 'Der Allheilige, frei von jeglicher Unvollkommenheit.', ebced: 170, virtue: 'Manevi temizlik, kalbin nurlanması ve korkulardan emin olmak için.', virtue_en: 'For spiritual purification, enlightenment of the heart and safety from fears.', virtue_de: 'Für geistliche Reinigung und Erleuchtung des Herzens.', calligraphy: 'الْقُدُّوسُ' },
    { name: 'Es-Selam', meaning: 'Esenlik veren, selamete çıkaran.', meaning_en: 'The Source of Peace, who delivers to safety.', meaning_de: 'Die Quelle des Friedens, der Seine Diener in Sicherheit bringt.', ebced: 131, virtue: 'Huzur, barış ve selamete ermek, hastalıklardan şifa bulmak için.', virtue_en: 'For peace, tranquility, safety and healing from illnesses.', virtue_de: 'Für Frieden, Ruhe und Erreichen der Sicherheit.', calligraphy: 'السَّلَامُ' },
];

const SHARE_THEMES = [
    { id: 'emerald', name: 'Koyu Zümrüt', class: 'bg-gradient-to-br from-[#044d29] to-[#065f33] text-white' },
    { id: 'golden', name: 'Altın Işık', class: 'bg-gradient-to-br from-[#d97706] to-[#b45309] text-white' },
    { id: 'gray', name: 'Gece', class: 'bg-gradient-to-br from-[#374151] to-[#1f2937] text-white' },
    { id: 'blue', name: 'Okyanus', class: 'bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] text-white' },
    { id: 'friday', name: 'Cuma Özel', class: 'bg-gradient-to-br from-islamic-green to-[#065f33] text-white border-2 border-islamic-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]' },
];

const RELIGIOUS_DAYS = [
    { name: 'Miraç Kandili', name_en: 'Night of Ascension', date: '2026-01-15' },
    { name: 'Berat Kandili', name_en: 'Night of Forgiveness', date: '2026-02-02' },
    { name: 'Ramazan Başlangıcı', name_en: 'Start of Ramadan', date: '2026-02-19' },
    { name: 'Kadir Gecesi', name_en: 'Night of Power', date: '2026-03-16' },
    { name: 'Ramazan Bayramı', name_en: 'Eid al-Fitr', date: '2026-03-20' }, // 1. Gün
    { name: 'Kurban Bayramı', name_en: 'Eid al-Adha', date: '2026-05-27' }, // 1. Gün
    { name: 'Hicri Yılbaşı', name_en: 'Islamic New Year', date: '2026-06-16' },
    { name: 'Aşure Günü', name_en: 'Day of Ashura', date: '2026-06-25' },
    { name: 'Mevlid Kandili', name_en: 'Birth of the Prophet', date: '2026-08-24' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function Home() {
    const { t, i18n } = useTranslation('home');
    const navigate = useNavigate();
    const { selection, success, heavy } = useHaptics();
    const { prayerTimes, loadingPrayers, nextPrayerInfo, city, country } = usePrayers();

    // Get today's verse using global test date system
    const DAILY_VERSE = getDailyVerse(i18n.language);

    // Dynamic FRIDAY_CONTENT using translations
    const FRIDAY_CONTENT = useMemo(() => ({
        text: t('friday.text'),
        source: t('friday.source')
    }), [t]);

    const [completedPrayers, setCompletedPrayers] = useState([]);
    const [tubaData, setTubaData] = useState({
        currentStreak: 0,
        totalWateredDays: 0,
        lastWateredDate: null
    });

    const [showShareModal, setShowShareModal] = useState(false);
    const [activeTheme, setActiveTheme] = useState(SHARE_THEMES[0]);
    const [deedRevealed, setDeedRevealed] = useState(false);
    const [currentDeed, setCurrentDeed] = useState("");
    const [selectedEsma, setSelectedEsma] = useState(null);
    const [showAllEsma, setShowAllEsma] = useState(false);
    const [esmaCounts, setEsmaCounts] = useState(() => safeGetStorage('esma_counts', {})); // Stores count for each Esma: { "Allah": 5, "Rahman": 10 }
    const [sharing, setSharing] = useState(false);
    const [debugOverlay, setDebugOverlay] = useState(false); // Debug: Force show overlay

    // Prayer Focus Detection (Blur Mode)
    const { activePrayer, shouldShowOverlay, snooze, clearSnooze } = usePrayerFocus(
        prayerTimes,
        completedPrayers
    );

    // iOS ATT izleme izni — onboarding sonrası anasayfaya ilk gelişte 1 kez sor
    useEffect(() => {
        if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return;
        if (localStorage.getItem('att_requested')) return;

        const timer = setTimeout(async () => {
            try {
                await AdMob.requestTrackingAuthorization();
            } catch (e) {
                console.warn('ATT request failed:', e);
            }
            localStorage.setItem('att_requested', 'true');
        }, 2000);

        return () => clearTimeout(timer);
    }, []);


    const isFriday = getAppDate().getDay() === 5;



    // Track current date key for midnight transition detection
    const [currentDateKey, setCurrentDateKey] = useState(getTodayString());

    // Initial Data Load & Event Listener
    useEffect(() => {
        const loadPrayers = () => {
            const key = getDailyPrayersKey();
            const stored = safeGetStorage(key, []);
            // Migration: convert old name-based data to id-based
            const NAME_TO_ID = {
                'Fajr': 'fajr', 'Dhuhr': 'dhuhr', 'Asr': 'asr', 'Maghrib': 'maghrib', 'Isha': 'isha',
                'İmsak': 'fajr', 'Öğle': 'dhuhr', 'İkindi': 'asr', 'Akşam': 'maghrib', 'Yatsı': 'isha',
            };
            const validIds = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
            const needsMigration = stored.some(p => !validIds.includes(p));
            if (needsMigration) {
                const migrated = [...new Set(stored.map(p => NAME_TO_ID[p] || p).filter(p => validIds.includes(p)))];
                localStorage.setItem(key, JSON.stringify(migrated));
                setCompletedPrayers(migrated);
            } else {
                setCompletedPrayers(stored);
            }
        };

        loadPrayers();

        const handleStatusChange = () => loadPrayers();
        window.addEventListener('prayerStatusChanged', handleStatusChange);
        return () => window.removeEventListener('prayerStatusChanged', handleStatusChange);
    }, [currentDateKey]);

    // Debug: Listen for debug overlay trigger
    useEffect(() => {
        const handleDebugOverlay = () => setDebugOverlay(true);
        window.addEventListener('debugShowPrayerOverlay', handleDebugOverlay);
        return () => window.removeEventListener('debugShowPrayerOverlay', handleDebugOverlay);
    }, []);

    // Midnight Transition Detection (Check every minute)
    useEffect(() => {
        const checkDayChange = () => {
            const newDateKey = getTodayString();
            if (newDateKey !== currentDateKey) {
                // Day has changed! Reset prayers and deed status for new day.
                setCurrentDateKey(newDateKey);
                setCompletedPrayers([]);
                setDeedRevealed(false);
            }
        };

        const interval = setInterval(checkDayChange, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [currentDateKey]);

    useEffect(() => {

        // Initialize Tuba Ağacı Data
        const storedTuba = localStorage.getItem('tubaAgaci_data');
        let initialTuba = { currentStreak: 0, totalWateredDays: 0, lastWateredDate: null };

        if (storedTuba && storedTuba !== 'undefined' && storedTuba !== 'null') {
            try {
                initialTuba = JSON.parse(storedTuba);
            } catch (e) {
                localStorage.removeItem('tubaAgaci_data');
            }
        } else {
            // Migration from legacy userStreak if exists
            const legacyStreak = localStorage.getItem('userStreak');
            if (legacyStreak && legacyStreak !== 'undefined') {
                try {
                    initialTuba.currentStreak = parseInt(legacyStreak, 10) || 0;
                    initialTuba.totalWateredDays = initialTuba.currentStreak;
                    initialTuba.lastWateredDate = localStorage.getItem('tubaAgaci_lastWatered') || null;
                } catch (e) {
                    // Fail silently in production
                }
            }
        }

        // Streak Reset Logic
        if (initialTuba.lastWateredDate) {
            const today = getAppDate();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;

            // Calculate Yesterday
            const y = new Date(today);
            y.setDate(y.getDate() - 1);
            const yYear = y.getFullYear();
            const yMonth = String(y.getMonth() + 1).padStart(2, '0');
            const yDay = String(y.getDate()).padStart(2, '0');
            const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

            // Reset if last watered date is NEITHER today NOR yesterday
            if (initialTuba.lastWateredDate !== todayStr && initialTuba.lastWateredDate !== yesterdayStr) {
                initialTuba.currentStreak = 0;
            }
        }

        setTubaData(initialTuba);
        localStorage.setItem('tubaAgaci_data', JSON.stringify(initialTuba));

        const appToday = getAppDate();
        const startOfYear = new Date(appToday.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((appToday - startOfYear) / (1000 * 60 * 60 * 24));
        const deedItems = t('deed.items', { returnObjects: true });
        setCurrentDeed(Array.isArray(deedItems) ? deedItems[dayOfYear % deedItems.length] : '');

        if (isFriday) {
            setActiveTheme(SHARE_THEMES.find(t => t.id === 'friday'));
        }

        // Persistent Deed Reveal Logic
        const deedKey = `deedRevealed_${getTodayString()}`;
        setDeedRevealed(localStorage.getItem(deedKey) === 'true');
    }, [isFriday, currentDateKey]);



    const togglePrayer = useCallback((prayerId) => {
        selection();
        const key = getDailyPrayersKey();
        const stored = safeGetStorage(key, []);
        const next = stored.includes(prayerId) ? stored.filter(p => p !== prayerId) : [...stored, prayerId];
        localStorage.setItem(key, JSON.stringify(next));
        setCompletedPrayers(next);
        window.dispatchEvent(new Event('prayerStatusChanged'));
        if (next.length === 5) success();
        if (next.length >= 3) triggerReviewPrompt('prayers');
    }, [selection, success]);

    const revealDeed = useCallback(() => {
        selection();
        setDeedRevealed(true);
        const deedKey = `deedRevealed_${getTodayString()}`;
        localStorage.setItem(deedKey, 'true');
    }, [selection]);

    const openEsma = useCallback((esma) => {
        selection();
        setSelectedEsma(esma);
        // Don't reset count - persist it
        // setEsmaCount(0); 
    }, [selection]);

    // Prayer Blur Mode Handlers
    const handlePrayNow = useCallback((prayerId) => {
        // Read latest data directly from storage to prevent stale state overwrites
        const key = getDailyPrayersKey();
        const stored = safeGetStorage(key, []);

        if (stored.includes(prayerId)) return;

        const next = [...stored, prayerId];
        setCompletedPrayers(next);

        localStorage.setItem(key, JSON.stringify(next));

        // Notify other components (e.g., Tracking page) about the change
        window.dispatchEvent(new Event('prayerStatusChanged'));

        if (next.length === 5) success(); // All prayers completed!

        // Clear snooze for this prayer
        clearSnooze(prayerId);
    }, [success, clearSnooze]);

    const handleSnooze = useCallback((prayerName) => {

        snooze(prayerName);
    }, [snooze]);

    const handleOverlayDismiss = useCallback(() => {
        // User dismissed without action - snooze for 10 minutes
        if (activePrayer) {
            snooze(activePrayer.id);
        }
    }, [activePrayer, snooze]);

    // Optimized Handlers
    const handleShare = useCallback(() => {
        selection();
        setShowShareModal(true);
        triggerReviewPrompt('share');
    }, [selection]);

    const handleShowAllEsma = useCallback(() => {
        selection();
        setShowAllEsma(true);
    }, [selection]);

    const handleNavigate = useCallback((path) => {
        selection();
        navigate(path);
    }, [selection, navigate]);



    return (
        <motion.div
            className="space-y-6 p-5 pb-20 overflow-x-hidden dark:bg-[#032e18]"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Top Bar Removed as per user request */}



            <WeeklyStreakWidget tubaData={tubaData} setTubaData={setTubaData} />

            <VerseOfDayCard
                isFriday={isFriday}
                verse={DAILY_VERSE}
                fridayContent={FRIDAY_CONTENT}
                onShare={handleShare}
            />

            <DailyDeedCard
                revealed={deedRevealed}
                deed={currentDeed}
                onReveal={revealDeed}
            />

            <EsmaUlHusnaWidget
                esmaList={ESMA_UL_HUSNA}
                onSelect={openEsma}
                onShowAll={handleShowAllEsma}
            />



            <PrayerCountdownWidget loading={loadingPrayers} city={city} nextPrayerInfo={nextPrayerInfo} prayerTimes={prayerTimes} />



            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
                <QuickAction
                    onClick={() => handleNavigate('/dhikr')}
                    icon={TasbihIcon} label={t('quick_actions.dhikr.label')} subtitle={t('quick_actions.dhikr.subtitle')}
                    color="bg-white dark:bg-white/5 border dark:border-white/10 text-islamic-green dark:text-islamic-gold glass-panel"
                    to={null}
                />

                <QuickAction
                    onClick={() => handleNavigate('/uyku')}
                    icon={Moon} label={t('quick_actions.sleep.label')} subtitle={t('quick_actions.sleep.subtitle')}
                    color="bg-white dark:bg-white/5 border dark:border-white/10 text-islamic-green dark:text-islamic-gold glass-panel"
                    to={null}
                />
                <QuickAction
                    onClick={() => handleNavigate('/qibla')}
                    icon={Sunrise} label={t('quick_actions.qibla.label')} subtitle={t('quick_actions.qibla.subtitle')}
                    color="bg-white dark:bg-white/5 border dark:border-white/10 text-islamic-green dark:text-islamic-gold glass-panel"
                    to={null}
                />
            </motion.div>


            <motion.div variants={itemVariants} className="px-1 cursor-pointer group" onClick={() => handleNavigate('/oruc-takibi')}>
                <div className="glass-panel rounded-[2.5rem] p-6 flex items-center justify-between transition-all active:scale-95 group-hover:bg-white/60 dark:group-hover:bg-white/10">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-islamic-green/10 dark:bg-islamic-gold/10 rounded-2xl text-islamic-green dark:text-islamic-gold">
                            <Moon size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-islamic-gold uppercase text-xs tracking-widest font-serif">{t('quickAction.fasting')}</h4>
                            <p className="text-[10px] text-gray-500 dark:text-emerald-100/40 font-medium opacity-80">{t('quickAction.fastingSub')}</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-islamic-gold group-hover:translate-x-1 transition-transform" />
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="px-1 cursor-pointer group" onClick={() => handleNavigate('/dua')}>
                <div className="glass-panel rounded-[2.5rem] p-6 flex items-center justify-between transition-all active:scale-95 group-hover:bg-islamic-gold/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-islamic-gold/5 to-transparent opacity-50" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-4 bg-islamic-gold/10 rounded-2xl text-islamic-gold">
                            <MessageCircle size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-islamic-gold uppercase text-xs tracking-widest font-serif">{t('widgets.dua.title')}</h4>
                            <p className="text-[10px] text-gray-500 dark:text-emerald-100/40 font-medium opacity-80">{t('widgets.dua.subtitle')}</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-islamic-gold group-hover:translate-x-1 transition-transform relative z-10" />
                </div>
            </motion.div>

            <ReligiousCalendarWidget days={RELIGIOUS_DAYS} />

            {/* Prayer Time Blur Mode Overlay */}
            <PrayerTimeOverlay
                isOpen={shouldShowOverlay || debugOverlay}
                prayer={activePrayer || { name: 'Öğle', time: '12:30', icon: null }}
                onPray={(name) => { handlePrayNow(name); setDebugOverlay(false); }}
                onSnooze={(name) => { handleSnooze(name); setDebugOverlay(false); }}
                onDismiss={() => { handleOverlayDismiss(); setDebugOverlay(false); }}
            />

            {/* Share Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-[#032e18] w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border dark:border-white/10"
                        >
                            <div className="p-4 flex justify-between items-center border-b dark:border-white/10">
                                <h4 className="font-serif font-bold text-islamic-green dark:text-islamic-gold">
                                    {isFriday ? t('friday.share_title') : t('verse_share_title')}
                                </h4>
                                <button
                                    onClick={() => { selection(); setShowShareModal(false); }}
                                    aria-label="Kapat"
                                    className="touch-target hover:bg-gray-100 dark:hover:bg-white/5 rounded-full dark:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6">
                                <div id="verse-share-card" className={cn("aspect-square rounded-[2rem] p-8 flex flex-col justify-center items-center text-center transition-all duration-500 mb-6 relative shadow-inner", activeTheme.class)}>
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-20"><Heart className="w-12 h-12" /></div>
                                    <p className="font-serif text-xl leading-relaxed italic mb-4">"{isFriday ? FRIDAY_CONTENT.text : DAILY_VERSE.text}"</p>
                                    <p className="text-xs font-bold tracking-widest uppercase opacity-70">- {isFriday ? FRIDAY_CONTENT.source : DAILY_VERSE.source}</p>
                                    {isFriday && <div className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] border-t border-white/20 pt-4">{t('friday.message')}</div>}
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">{t('theme_select')}</p>
                                    <div className="flex justify-center gap-4">
                                        {SHARE_THEMES.map(theme => (
                                            <button key={theme.id} onClick={() => { selection(); setActiveTheme(theme); }}
                                                aria-label={`Tema: ${theme.name}`}
                                                className={cn("touch-target w-12 h-12 rounded-full border-2 transition-all active:scale-95",
                                                    activeTheme.id === theme.id ? "border-islamic-gold scale-110 shadow-lg" : "border-transparent",
                                                    theme.id === 'emerald' ? "bg-islamic-green" :
                                                        theme.id === 'golden' ? "bg-amber-500" :
                                                            theme.id === 'gray' ? "bg-gray-500" :
                                                                theme.id === 'blue' ? "bg-blue-600" :
                                                                    theme.id === 'friday' ? "bg-[#134951]" : "bg-gray-200"
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <Button
                                    className="w-full mt-8 bg-islamic-green dark:bg-islamic-gold hover:opacity-90 text-white dark:text-[#032e18] h-14 rounded-2xl gap-2 font-bold transition-all active:scale-95 shadow-lg disabled:opacity-50"
                                    onClick={async () => {
                                        if (sharing) return;
                                        heavy();
                                        setSharing(true);
                                        const success = await shareVerse(
                                            'verse-share-card',
                                            isFriday ? FRIDAY_CONTENT.text : DAILY_VERSE.text,
                                            isFriday ? FRIDAY_CONTENT.source : DAILY_VERSE.source,
                                            isFriday
                                        );
                                        setSharing(false);
                                        if (success) selection();
                                    }}
                                    disabled={sharing}
                                >
                                    {sharing ? (
                                        <div className="w-5 h-5 border-2 border-white dark:border-[#032e18] border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Share2 className="w-5 h-5" />
                                    )}
                                    {sharing ? t('sharing') : t('share_image')}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showAllEsma && (
                    <AllEsmaModal
                        isOpen={showAllEsma}
                        onClose={() => { selection(); setShowAllEsma(false); }}
                        onSelect={(esma) => {
                            setShowAllEsma(false);
                            openEsma(esma);
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedEsma && (
                    <EsmaDetailModal
                        esma={selectedEsma}
                        count={esmaCounts[selectedEsma.name] || 0}
                        setCount={(val) => {
                            setEsmaCounts(prev => {
                                const nextCount = typeof val === 'function' ? val(prev[selectedEsma.name] || 0) : val;
                                const next = {
                                    ...prev,
                                    [selectedEsma.name]: nextCount
                                };
                                safeSetStorage('esma_counts', next);
                                return next;
                            });
                        }}
                        onClose={() => { selection(); setSelectedEsma(null); }}
                    />
                )}
            </AnimatePresence>
        </motion.div >
    );
}
// --- Esma Detail Modal (Redesigned: Divine Elegance) ---
// --- Web Audio API for instant sound ---
const ESMA_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
let esmaAudioContext = null;
let esmaAudioBuffer = null;

async function initEsmaAudio() {
    if (esmaAudioContext) return;
    try {
        esmaAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        const response = await fetch(ESMA_SOUND_URL);
        const arrayBuffer = await response.arrayBuffer();
        esmaAudioBuffer = await esmaAudioContext.decodeAudioData(arrayBuffer);
    } catch (e) {
        console.log('[EsmaAudio] Init failed:', e);
    }
}

function playEsmaSound() {
    if (!esmaAudioContext || !esmaAudioBuffer) {
        initEsmaAudio();
        return;
    }
    if (esmaAudioContext.state === 'suspended') {
        esmaAudioContext.resume();
    }
    const source = esmaAudioContext.createBufferSource();
    source.buffer = esmaAudioBuffer;
    source.connect(esmaAudioContext.destination);
    source.start(0);
}

// Initialize audio on module load
if (typeof window !== 'undefined') {
    initEsmaAudio();
}

function EsmaDetailModal({ esma, count, setCount, onClose }) {
    const { selection, heavy, medium, targetReached } = useHaptics();
    const { t, i18n } = useTranslation('home');

    // Sound and Haptics settings
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [hapticsMode, setHapticsMode] = useState('all'); // 'all', 'target', 'off'
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');

    if (!esma) return null;

    // Show setting feedback briefly
    const showFeedback = (msg) => {
        setFeedbackMessage(msg);
        setTimeout(() => setFeedbackMessage(''), 2000);
    };

    // Calculate progress (Target: standard 100 or ebced value if reasonable)
    const target = esma.ebced && !isNaN(esma.ebced) ? parseInt(esma.ebced) : 100;
    const progress = Math.min((count % target) / target, 1);
    const cycle = Math.floor(count / target);

    // Circular Progress Calculation
    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - progress * circumference;

    const handleIncrement = () => {
        const newCount = count + 1;
        setCount(newCount);

        // Sound feedback
        if (soundEnabled) {
            playEsmaSound();
        }

        // Haptic feedback using Capacitor Haptics (works on iOS)
        const isTargetReached = newCount % target === 0;
        if (hapticsMode === 'all') {
            if (isTargetReached) {
                targetReached(); // Enhanced double-pulse on target
            } else {
                medium(); // Heavy impact on each tap (as requested "stronger")
            }
        } else if (hapticsMode === 'target' && isTargetReached) {
            targetReached(); // Enhanced double-pulse only on target
        }
    };

    const handleReset = () => {
        if (count === 0) return;
        setShowResetConfirm(true);
    };

    const confirmReset = () => {
        selection();
        setCount(0);
        setShowResetConfirm(false);
    };

    const toggleSound = () => {
        selection();
        const newState = !soundEnabled;
        setSoundEnabled(newState);
        showFeedback(newState ? 'Ses: Açık' : 'Ses: Kapalı');
    };

    const cycleHapticsMode = () => {
        selection();
        let nextMode = 'all';
        let msg = 'Titreşim: Her Tıklamada';

        if (hapticsMode === 'all') {
            nextMode = 'target';
            msg = 'Titreşim: Sadece Hedefte';
        } else if (hapticsMode === 'target') {
            nextMode = 'off';
            msg = 'Titreşim: Kapalı';
        }

        setHapticsMode(nextMode);
        showFeedback(msg);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                    if (info.offset.y > 100 || info.velocity.y > 500) onClose();
                }}
                className="w-full rounded-t-[3rem] overflow-hidden shadow-2xl p-8 pb-12 max-w-lg cursor-grab active:cursor-grabbing relative border-t border-white/10"
                style={{
                    background: 'radial-gradient(circle at top, #064e3b 0%, #022c22 40%, #000000 100%)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Ambient Background Glow */}
                <div className="absolute top-[-15%] right-[-15%] w-48 h-48 bg-islamic-gold/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-56 h-56 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />

                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 relative z-10" />

                <div className="relative z-10 text-center space-y-5">
                    <div className="space-y-2">
                        <motion.h1
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-islamic-gold via-amber-300 to-islamic-gold drop-shadow-[0_0_25px_rgba(212,175,55,0.4)] pb-1"
                        >
                            {esma.calligraphy}
                        </motion.h1>
                        <h2 className="text-2xl font-bold text-white tracking-widest uppercase font-serif">
                            {esma.name}
                        </h2>
                        <p className="text-white/50 text-sm font-light italic tracking-wide max-w-xs mx-auto">
                            "{esma[`meaning_${i18n.language}`] || esma.meaning_en || esma.meaning}"
                        </p>
                    </div>

                    {/* Ebced Badge */}
                    <div className="flex justify-center">
                        <div className="flex items-center gap-3 bg-islamic-gold/5 px-8 py-2.5 rounded-full border border-islamic-gold/30">
                            <span className="text-islamic-gold font-bold text-xs uppercase tracking-[0.2em]">{t('esma.ebced')} {esma.ebced}</span>
                        </div>
                    </div>

                    {/* Counter Ring with Countdown Inside */}
                    <div className="relative w-72 h-72 flex items-center justify-center mx-auto">
                        {/* SVG Progress Ring */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                            <motion.circle
                                cx="100" cy="100" r="85"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeLinecap="round"
                                className="text-islamic-gold drop-shadow-[0_0_12px_rgba(212,175,55,0.5)]"
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                            />
                        </svg>

                        {/* Main Counter Button */}
                        <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={handleIncrement}
                            className="relative w-52 h-52 rounded-full flex flex-col items-center justify-center group z-20 border border-white/10"
                            style={{
                                background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.08), rgba(0,0,0,0.3))',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 0 60px rgba(0,0,0,0.4), inset 0 1px 10px rgba(255,255,255,0.1)',
                            }}
                        >
                            {/* Glass highlight */}
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/5 rounded-t-full pointer-events-none" />

                            {/* Countdown (remaining) */}
                            <motion.span
                                key={target - (count % target)}
                                initial={{ scale: 1.3, opacity: 0.5 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`text-7xl font-mono font-bold tracking-tighter drop-shadow-2xl ${(count % target) === 0 && count > 0 ? 'text-emerald-400' : 'text-white'
                                    }`}
                            >
                                {(count % target) === 0 && count > 0 ? '✓' : target - (count % target)}
                            </motion.span>

                            {/* Label */}
                            <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1 font-bold">
                                {(count % target) === 0 && count > 0 ? t('esma.cycle', { count: cycle }) : t('esma.remaining')}
                            </span>

                            {/* Cycle indicator */}
                            {cycle > 0 && !((count % target) === 0 && count > 0) && (
                                <span className="text-[9px] text-islamic-gold/50 uppercase tracking-widest mt-1">{t('esma.cycle', { count: cycle })}</span>
                            )}

                            {/* Tap ripple */}
                            <div className="absolute inset-0 rounded-full overflow-hidden">
                                <span className="absolute inset-0 bg-white/10 opacity-0 group-active:opacity-100 transition-opacity duration-300" />
                            </div>
                        </motion.button>
                    </div>

                    {/* Sound & Haptics Controls */}
                    <div className="flex justify-center relative">
                        {/* Feedback Toast Overlay (matches screenshot design) */}
                        <AnimatePresence>
                            {feedbackMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: -45, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute left-1/2 -translate-x-1/2 w-max px-6 py-2 bg-islamic-gold rounded-full shadow-2xl z-[60] pointer-events-none"
                                >
                                    <span className="text-black text-sm font-bold">{feedbackMessage}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="inline-flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full p-1.5 border border-white/10">
                            {/* Sound Toggle */}
                            <button
                                onClick={toggleSound}
                                className={cn(
                                    "p-2.5 rounded-full transition-all",
                                    soundEnabled
                                        ? "bg-islamic-gold/20 text-islamic-gold"
                                        : "text-white/30 hover:text-white/50"
                                )}
                                title={soundEnabled ? "Ses Açık" : "Ses Kapalı"}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {soundEnabled ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M6 8h2l4-4v16l-4-4H6a2 2 0 01-2-2v-4a2 2 0 012-2z" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                    )}
                                </svg>
                            </button>

                            {/* Haptics Toggle */}
                            <button
                                onClick={cycleHapticsMode}
                                className={cn(
                                    "p-2.5 rounded-full transition-all relative",
                                    hapticsMode !== 'off'
                                        ? "bg-islamic-gold/20 text-islamic-gold"
                                        : "text-white/30 hover:text-white/50"
                                )}
                                title={hapticsMode === 'all' ? "Her Tıklamada" : hapticsMode === 'target' ? "Hedefe Ulaşınca" : "Titreşim Kapalı"}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                {hapticsMode === 'target' && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-islamic-gold rounded-full flex items-center justify-center">
                                        <span className="text-[6px] text-black font-bold">T</span>
                                    </span>
                                )}
                            </button>

                            {/* Reset */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleReset();
                                }}
                                className="p-2.5 rounded-full text-white/30 hover:text-white/50 transition-all"
                                title="Sıfırla"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Reset Confirmation Dialog - Refined: Less intrusive */}
                    <AnimatePresence>
                        {showResetConfirm && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-32 left-8 right-8 bg-[#0a2e1f]/95 backdrop-blur-md border border-islamic-gold/20 rounded-2xl p-6 text-center z-50 shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="space-y-4">
                                    <p className="text-white text-sm font-medium">Sayacı sıfırlamak istediğinizden emin misiniz?</p>
                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={() => setShowResetConfirm(false)}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors text-xs font-bold uppercase tracking-wider"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            onClick={confirmReset}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/80 text-white hover:bg-red-500 transition-colors text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-500/20"
                                        >
                                            Sıfırla
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 shadow-lg relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                        <div className="flex items-center justify-center gap-2 mb-2 text-islamic-gold/80">
                            <Sparkles size={14} />
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em]">{t('esma.virtue_title')}</span>
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed font-light font-serif">
                            {esma[`virtue_${i18n.language}`] || esma.virtue_en || esma.virtue}
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        className="text-white/30 hover:text-white hover:bg-white/5 w-full font-light tracking-widest text-xs uppercase"
                        onClick={onClose}
                    >
                        {t('close')}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

