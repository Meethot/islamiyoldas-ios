import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Moon, Sunrise, Sun, Sunset, Sparkles, Star, Wind, MessageCircle, X, Download,
    ChevronRight, Heart, Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { GOOD_DEEDS } from '@/data/spiritualData';
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
import { usePrayerFocus } from '@/hooks/usePrayerFocus';
import { useTranslation } from 'react-i18next';

// Static Constants moved outside to prevent re-creation
const FRIDAY_CONTENT = {
    text: "Güneşin üzerine doğduğu en hayırlı gün Cuma günüdür.",
    source: "Hadis-i Şerif (Müslim)"
};

const ESMA_UL_HUSNA = [
    { name: 'Er-Rahman', meaning: 'Herkesi ve herşeyi kuşatan sınırsız merhamet sahibi.', ebced: 298, virtue: 'Dünya ve ahiret mutluluğu, rızık bolluğu için okunur.', calligraphy: 'الرَّحْمَنُ' },
    { name: 'Er-Rahim', meaning: 'Kendisine inananlara özel merhameti olan.', ebced: 258, virtue: 'Maddi ve manevi rızık, hidayet ve şefkat için okunur.', calligraphy: 'الرَّحِيمُ' },
    { name: 'El-Melik', meaning: 'Bütün kainatın mutlak sahibi ve hükümdarı.', ebced: 90, virtue: 'Maddi ve manevi güç, itibar ve söz sahibi olmak için okunur.', calligraphy: 'الْمَلِكُ' },
    { name: 'El-Kuddüs', meaning: 'Bütün eksikliklerden münezzeh, mukaddes.', ebced: 170, virtue: 'Manevi temizlik, kalbin nurlanması ve korkulardan emin olmak için.', calligraphy: 'الْقُدُّوسُ' },
    { name: 'Es-Selam', meaning: 'Esenlik veren, selamete çıkaran.', ebced: 131, virtue: 'Huzur, barış ve selamete ermek, hastalıklardan şifa bulmak için.', calligraphy: 'السَّلَامُ' },
];

const SHARE_THEMES = [
    { id: 'emerald', name: 'Koyu Zümrüt', class: 'bg-gradient-to-br from-[#044d29] to-[#065f33] text-white' },
    { id: 'golden', name: 'Altın Işık', class: 'bg-gradient-to-br from-[#d97706] to-[#b45309] text-white' },
    { id: 'gray', name: 'Gece', class: 'bg-gradient-to-br from-[#374151] to-[#1f2937] text-white' },
    { id: 'blue', name: 'Okyanus', class: 'bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] text-white' },
    { id: 'friday', name: 'Cuma Özel', class: 'bg-gradient-to-br from-islamic-green to-[#065f33] text-white border-2 border-islamic-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]' },
];

const RELIGIOUS_DAYS = [
    { name: 'Miraç Kandili', date: '2026-01-15' },
    { name: 'Berat Kandili', date: '2026-02-02' },
    { name: 'Ramazan Başlangıcı', date: '2026-02-19' },
    { name: 'Kadir Gecesi', date: '2026-03-16' },
    { name: 'Ramazan Bayramı', date: '2026-03-20' }, // 1. Gün
    { name: 'Kurban Bayramı', date: '2026-05-27' }, // 1. Gün
    { name: 'Hicri Yılbaşı', date: '2026-06-16' },
    { name: 'Aşure Günü', date: '2026-06-25' },
    { name: 'Mevlid Kandili', date: '2026-08-24' },
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
    const { t } = useTranslation('home');
    const navigate = useNavigate();
    const { selection, success, heavy } = useHaptics();
    const { prayerTimes, loadingPrayers, nextPrayerInfo, city, country } = usePrayers();

    // Get today's verse using global test date system
    const DAILY_VERSE = getDailyVerse();

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

    // Prayer Focus Detection (Blur Mode)
    const { activePrayer, shouldShowOverlay, snooze, clearSnooze } = usePrayerFocus(
        prayerTimes,
        completedPrayers
    );


    const isFriday = getAppDate().getDay() === 5;



    // Track current date key for midnight transition detection
    const [currentDateKey, setCurrentDateKey] = useState(getTodayString());

    // Initial Data Load & Event Listener
    useEffect(() => {
        const loadPrayers = () => {
            const key = getDailyPrayersKey();
            setCompletedPrayers(safeGetStorage(key, []));
        };

        loadPrayers();

        const handleStatusChange = () => loadPrayers();
        window.addEventListener('prayerStatusChanged', handleStatusChange);
        return () => window.removeEventListener('prayerStatusChanged', handleStatusChange);
    }, [currentDateKey]);

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
        setCurrentDeed(GOOD_DEEDS[dayOfYear % GOOD_DEEDS.length]);

        if (isFriday) {
            setActiveTheme(SHARE_THEMES.find(t => t.id === 'friday'));
        }

        // Persistent Deed Reveal Logic
        const deedKey = `deedRevealed_${getTodayString()}`;
        setDeedRevealed(localStorage.getItem(deedKey) === 'true');
    }, [isFriday, currentDateKey]);



    const togglePrayer = useCallback((name) => {
        selection();
        const key = getDailyPrayersKey();
        const stored = safeGetStorage(key, []);
        const next = stored.includes(name) ? stored.filter(p => p !== name) : [...stored, name];
        localStorage.setItem(key, JSON.stringify(next));
        setCompletedPrayers(next);
        window.dispatchEvent(new Event('prayerStatusChanged'));
        if (next.length === 5) success();
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
    const handlePrayNow = useCallback((prayerName) => {
        // Read latest data directly from storage to prevent stale state overwrites
        const key = getDailyPrayersKey();
        const stored = safeGetStorage(key, []);

        if (stored.includes(prayerName)) return;

        const next = [...stored, prayerName];
        setCompletedPrayers(next);

        localStorage.setItem(key, JSON.stringify(next));

        // Notify other components (e.g., Tracking page) about the change
        window.dispatchEvent(new Event('prayerStatusChanged'));

        if (next.length === 5) success(); // All prayers completed!

        // Clear snooze for this prayer
        clearSnooze(prayerName);
    }, [success, clearSnooze]);

    const handleSnooze = useCallback((prayerName) => {

        snooze(prayerName);
    }, [snooze]);

    const handleOverlayDismiss = useCallback(() => {
        // User dismissed without action - snooze for 10 minutes
        if (activePrayer) {
            snooze(activePrayer.name);
        }
    }, [activePrayer, snooze]);

    // Optimized Handlers
    const handleShare = useCallback(() => {
        selection();
        setShowShareModal(true);
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


            <motion.div variants={itemVariants} className="px-1 cursor-pointer group" onClick={() => handleNavigate('/tefekkur')}>
                <div className="glass-panel rounded-[2.5rem] p-6 flex items-center justify-between transition-all active:scale-95 group-hover:bg-white/60 dark:group-hover:bg-white/10">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-islamic-green/10 dark:bg-islamic-gold/10 rounded-2xl text-islamic-green dark:text-islamic-gold">
                            <Wind size={24} className="animate-pulse" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-islamic-gold uppercase text-xs tracking-widest font-serif">{t('widgets.breath.title')}</h4>
                            <p className="text-[10px] text-gray-500 dark:text-emerald-100/40 font-medium opacity-80">{t('widgets.breath.subtitle')}</p>
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
                isOpen={shouldShowOverlay}
                prayer={activePrayer}
                onPray={handlePrayNow}
                onSnooze={handleSnooze}
                onDismiss={handleOverlayDismiss}
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
                                    {isFriday && <div className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] border-t border-white/20 pt-4">Hayırlı Cumalar</div>}
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
    const { t } = useTranslation('home');

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
    const radius = 60;
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
                <div
                    className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />

                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8 relative z-10" />

                <div className="relative z-10 text-center space-y-8">
                    <div className="space-y-3">
                        <motion.h1
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-6xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-islamic-gold via-amber-300 to-islamic-gold drop-shadow-[0_0_25px_rgba(212,175,55,0.4)] pb-2"
                        >
                            {esma.calligraphy}
                        </motion.h1>
                        <h2 className="text-3xl font-bold text-white tracking-widest uppercase font-serif">
                            {esma.name}
                        </h2>
                        <p className="text-white/60 text-sm font-light italic tracking-wide max-w-xs mx-auto">
                            "{esma.meaning}"
                        </p>
                    </div>

                    <div className="flex justify-center gap-3">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Ebced</span>
                            <span className="text-lg font-bold text-islamic-gold">{esma.ebced}</span>
                        </div>
                    </div>

                    <div className="relative h-64 flex items-center justify-center my-6">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <svg className="w-64 h-64 -rotate-90">
                                <circle
                                    cx="128" cy="128" r={radius}
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                    className="text-white/5"
                                />
                                <motion.circle
                                    cx="128" cy="128" r={radius}
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                    className="text-islamic-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                                    strokeDasharray={circumference}
                                    strokeLinecap="round"
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset }}
                                    transition={{ duration: 0.5 }}
                                />
                            </svg>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={handleIncrement}
                            className="relative w-48 h-48 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] group z-20"
                            style={{
                                background: 'radial-gradient(circle at 30% 30%, #2f855a, #064e3b, #000000)',
                                boxShadow: 'inset 0 2px 15px rgba(255,255,255,0.2), 0 10px 20px rgba(0,0,0,0.4)',
                            }}
                        >
                            <div className="absolute inset-0 rounded-full opacity-30 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />

                            <div className="flex flex-col items-center justify-center h-full">
                                <motion.span
                                    key={count}
                                    initial={{ scale: 1.2, opacity: 0.5 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-6xl font-mono font-bold text-white drop-shadow-md tracking-tighter"
                                >
                                    {count}
                                </motion.span>
                                {cycle > 0 && <span className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{t('esma.cycle', { count: cycle })}</span>}
                            </div>

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
                            {esma.virtue}
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

