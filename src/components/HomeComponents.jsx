import React, { memo, useMemo, useState, useRef, useEffect, Fragment, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { usePrayerTimes } from '@/context/PrayerTimesContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    CheckCircle2, ChevronRight, ChevronDown, Share2, Star, Sparkles, Check,
    Loader2, Moon, Sun, Sunrise, Sunset, Wind, MessageCircle, X, Download, Heart,
    Sprout, Leaf, TreeDeciduous, CalendarDays, Droplet, Trees, Flower2, Search,
    SortAsc, SortDesc, Flame, Trophy, Bell, Trash2, HelpCircle
} from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ALL_ESMA } from '@/data/esmaData';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { getAppDate, getTodayString } from '@/lib/testDate';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { playAminSound } from '@/services/WidgetDataService';
import { isPremium } from '@/services/creditService';
import { useNavigate } from 'react-router-dom';
import PrayerRewardModal from './PrayerRewardModal';
import { PRAYER_CONTENT } from '@/data/hadithData';
import { analytics } from '@/services/analyticsService';

// Force Refresh
// --- Animation Variants ---
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

// --- Weekly Celebration Confetti ---
const WeeklyConfetti = ({ active }) => {
    if (!active) return null;

    const colors = ['#D4AF37', '#10B981', '#FBBF24', '#FFFFFF', '#6EE7B7'];
    const particles = Array.from({ length: 50 });

    return (
        <div className="fixed inset-0 pointer-events-none z-[10000] overflow-hidden">
            {particles.map((_, i) => (
                <motion.div
                    key={i}
                    initial={{
                        top: '-10%',
                        left: `${Math.random() * 100}%`,
                        scale: Math.random() * 0.5 + 0.5,
                        rotate: 0,
                        opacity: 1
                    }}
                    animate={{
                        top: '110%',
                        left: `${(Math.random() - 0.5) * 40 + (i / particles.length) * 100}%`,
                        rotate: Math.random() * 720,
                        opacity: [1, 1, 0]
                    }}
                    transition={{
                        duration: Math.random() * 2 + 2,
                        ease: "easeOut",
                        repeat: Infinity,
                        delay: Math.random() * 2
                    }}
                    style={{
                        position: 'absolute',
                        width: Math.random() * 10 + 5,
                        height: Math.random() * 10 + 5,
                        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        boxShadow: '0 0 10px rgba(212,175,55,0.3)'
                    }}
                />
            ))}
        </div>
    );
};

// --- Tuba Ağacı (Spiritual Growth Widget) with 7-Day Timeline ---
export const WeeklyStreakWidget = memo(({ tubaData, setTubaData }) => {
    const [isWatering, setIsWatering] = useState(false);
    const [particleFlying, setParticleFlying] = useState(false);
    const [treeImpact, setTreeImpact] = useState(false);
    const [alreadyWateredMessage, setAlreadyWateredMessage] = useState(false);
    const [showWeeklyCelebration, setShowWeeklyCelebration] = useState(false);
    const { selection, success, impactMedium } = useHaptics();
    const { t } = useTranslation('home');
    const navigate = useNavigate();
    const [showPremiumLock, setShowPremiumLock] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);

    // Sound effect — preloaded for zero latency
    const clickSoundRef = useRef(null);
    useEffect(() => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.preload = 'auto';
        audio.volume = 0.6;
        audio.load();
        clickSoundRef.current = audio;
    }, []);

    // Destructure Tuba Data
    const { currentStreak, totalWateredDays, lastWateredDate } = tubaData;

    // Check if task is completed for today
    const tomorrowStr = getTodayString(); // Using standardized date string
    const isCompletedToday = lastWateredDate === tomorrowStr;

    const streak = currentStreak; // Support for existing logic
    const growthProgress = totalWateredDays;

    // Refs for position calculation
    const timelineNodeRefs = useRef([]);
    const treeIconRef = useRef(null);
    const particleStartPos = useRef({ x: 0, y: 0 });
    const particleEndPos = useRef({ x: 0, y: 0 });

    // 7-Day Timeline State (recalculates with test date changes)
    // Mapping: 0=Pazartesi, 1=Salı, ..., 6=Pazar
    const currentDayIndex = (getAppDate().getDay() + 6) % 7;


    // Helper function to get week number
    const getWeekNumber = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7)); // Set to Thursday of current week
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getFullYear()}-W${weekNo}`;
    };

    const [completedDays, setCompletedDays] = useState(() => {
        const stored = localStorage.getItem('tubaAgaci_completedDays');
        const lastWeekId = localStorage.getItem('tubaAgaci_weekId');
        const today = getAppDate();
        const currentWeekId = getWeekNumber(today);

        // Reset if new week (different week number)
        if (lastWeekId !== currentWeekId) {
            const initial = Array(7).fill(false);
            localStorage.setItem('tubaAgaci_weekId', currentWeekId);
            localStorage.setItem('tubaAgaci_completedDays', JSON.stringify(initial));
            return initial;
        }

        if (stored && stored !== 'undefined' && stored !== 'null') {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.warn('[HomeComponents] Corrupted completedDays, resetting...', e);
                localStorage.removeItem('tubaAgaci_completedDays');
            }
        }
        return Array(7).fill(false);
    });

    // Determine Organic Growth Stage
    let StageIcon = Sprout;
    let stageLabel = t('tuba.stages.seed');
    let stageMeaning = t('tuba.stages.seedMeaning');
    let growthColor = "text-emerald-400";
    let progress = 0;
    let nextMilestone = 3;

    if (growthProgress < 3) {
        StageIcon = Sprout;
        stageLabel = t('tuba.stages.seed');
        stageMeaning = t('tuba.stages.seedMeaning');
        growthColor = "text-emerald-500 dark:text-emerald-300";
        nextMilestone = 3;
        progress = (growthProgress / 3) * 100;
    } else if (growthProgress >= 3 && growthProgress < 7) {
        StageIcon = Leaf;
        stageLabel = t('tuba.stages.sapling');
        stageMeaning = t('tuba.stages.saplingMeaning');
        growthColor = "text-emerald-600 dark:text-emerald-300";
        nextMilestone = 7;
        progress = ((growthProgress - 3) / (7 - 3)) * 100;
    } else if (growthProgress >= 7 && growthProgress < 21) {
        StageIcon = TreeDeciduous;
        stageLabel = t('tuba.stages.youngTree');
        stageMeaning = t('tuba.stages.youngTreeMeaning');
        growthColor = "text-islamic-green dark:text-emerald-200";
        nextMilestone = 21;
        progress = ((growthProgress - 7) / (21 - 7)) * 100;
    } else if (growthProgress >= 21 && growthProgress < 40) {
        StageIcon = Trees;
        stageLabel = t('tuba.stages.matureTree');
        stageMeaning = t('tuba.stages.matureTreeMeaning');
        growthColor = "text-teal-600 dark:text-teal-300";
        nextMilestone = 40;
        progress = ((growthProgress - 21) / (40 - 21)) * 100;
    } else if (growthProgress >= 40) {
        StageIcon = Flower2;
        stageLabel = t('tuba.stages.tuba');
        stageMeaning = t('tuba.stages.tubaMeaning');
        growthColor = "text-islamic-gold dark:text-islamic-gold";
        nextMilestone = 100;
        progress = Math.min(((growthProgress - 40) / (100 - 40)) * 100, 100);
    }

    // Calculate particle path positions
    const calculatePositions = () => {
        const nodeEl = timelineNodeRefs.current[currentDayIndex];
        const treeEl = treeIconRef.current;

        if (nodeEl && treeEl) {
            const nodeRect = nodeEl.getBoundingClientRect();
            const treeRect = treeEl.getBoundingClientRect();

            particleStartPos.current = {
                x: nodeRect.left + nodeRect.width / 2,
                y: nodeRect.top + nodeRect.height / 2
            };

            particleEndPos.current = {
                x: treeRect.left + treeRect.width / 2,
                y: treeRect.top + treeRect.height / 2
            };
        }
    };

    const triggerParticleFlow = () => {
        // Mark current day as completed
        const newCompletedDays = [...completedDays];
        newCompletedDays[currentDayIndex] = true;
        setCompletedDays(newCompletedDays);
        localStorage.setItem('tubaAgaci_completedDays', JSON.stringify(newCompletedDays));

        // Calculate positions and start particle animation
        calculatePositions();
        setParticleFlying(true);
    };

    // Auto-sync completedDays if lastWateredDate matches today (for initial load)
    useEffect(() => {
        if (isCompletedToday && !completedDays[currentDayIndex]) {
            const newCompletedDays = [...completedDays];
            newCompletedDays[currentDayIndex] = true;
            setCompletedDays(newCompletedDays);
            localStorage.setItem('tubaAgaci_completedDays', JSON.stringify(newCompletedDays));
        }
    }, [isCompletedToday, currentDayIndex]); // Intentionally omitting completedDays to avoid loops

    const handleWatering = () => {
        const todayStr = getTodayString();

        if (isCompletedToday) {
            setAlreadyWateredMessage(true);
            if (Capacitor.isNativePlatform()) Haptics.notification({ type: 'WARNING' }).catch(() => { });
            setTimeout(() => setAlreadyWateredMessage(false), 3000);
            return;
        }

        if (totalWateredDays >= 3 && !isPremium()) {
            navigate('/premium');
            return;
        }

        // Streak logic
        let newStreak = currentStreak;
        const d = getAppDate();
        d.setDate(d.getDate() - 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const yesterdayStr = `${year}-${month}-${day}`;

        if (lastWateredDate === yesterdayStr) {
            newStreak += 1;
        } else if (lastWateredDate === todayStr) {
            newStreak = currentStreak;
        } else {
            newStreak = 1;
        }

        const newData = {
            currentStreak: newStreak,
            totalWateredDays: totalWateredDays + 1,
            lastWateredDate: todayStr
        };

        if (newStreak > currentStreak) {
            analytics.dailyStreakAchieved(newStreak);
        }
        analytics.habitGoalCompleted('tuba_watered');

        // ── INSTANT haptic: Heavy impact on press for satisfying "thump" ──
        if (Capacitor.isNativePlatform()) {
            Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });
            // Second softer pulse 80ms later for "double-tap" premium feel
            setTimeout(() => Haptics.impact({ style: ImpactStyle.Light }).catch(() => { }), 80);
        } else if ('vibrate' in navigator) {
            navigator.vibrate([30, 60, 20]);
        }

        // Sound — instant
        if (clickSoundRef.current) {
            clickSoundRef.current.currentTime = 0;
            clickSoundRef.current.play().catch(() => { });
        }

        // Start water animation immediately
        setIsWatering(true);

        // Particle flow starts fast (100ms) instead of 300ms
        setTimeout(() => {
            triggerParticleFlow();
            setTubaData(newData);
            localStorage.setItem('tubaAgaci_data', JSON.stringify(newData));

            // Tree impact haptic after water drop reaches tree (~600ms)
            setTimeout(() => {
                handleParticleComplete();
            }, 500);

            // Weekly celebration check
            const currentCheckedCount = completedDays.filter(d => d).length;
            const isCompletingLastDay = !completedDays[currentDayIndex];

            if (currentCheckedCount === 6 && isCompletingLastDay) {
                setTimeout(() => {
                    setShowWeeklyCelebration(true);
                    success();
                    setTimeout(() => setShowWeeklyCelebration(false), 8000);
                }, 1000);
            }
        }, 100);

        // Water drop ends faster
        setTimeout(() => setIsWatering(false), 900);
    };

    const handleParticleComplete = () => {
        setParticleFlying(false);
        setTreeImpact(true);

        // Triple-pulse haptic on tree impact — satisfying "bloom" feedback
        if (Capacitor.isNativePlatform()) {
            Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });
            setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }).catch(() => { }), 60);
            setTimeout(() => Haptics.impact({ style: ImpactStyle.Light }).catch(() => { }), 130);
        }

        setTimeout(() => setTreeImpact(false), 600);
    };

    return (
        <>
            <motion.div variants={itemVariants}>
                <Card id="tuba-tree-widget" className="glass-panel border-none text-black dark:text-white overflow-hidden relative">
                    {/* Ambient Glow */}
                    <div className={cn(
                        "absolute top-0 right-0 w-40 h-40 rounded-full -mr-20 -mt-20 transition-all duration-[2000ms] blur-xl",
                        growthProgress >= 7 ? "bg-islamic-gold/10" : "bg-islamic-green/5"
                    )} />

                    <CardContent className="p-4 sm:p-5 md:p-6 relative z-10">
                        {/* 7-Day Timeline */}
                        <div className="mb-4 sm:mb-6">
                            <div className="flex items-center justify-center gap-1.5 mb-2">
                                {t('tuba.days', { returnObjects: true }).map((day, idx) => (
                                    <Fragment key={idx}>
                                        {/* Day Node */}
                                        <div
                                            ref={el => timelineNodeRefs.current[idx] = el}
                                            className={cn(
                                                "relative w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 text-[9px] font-bold",
                                                completedDays[idx] && "bg-gradient-to-br from-islamic-gold via-islamic-green to-islamic-gold shadow-lg",
                                                !completedDays[idx] && "border-2 border-gray-300 dark:border-white/20 text-gray-400 dark:text-white/30",
                                                idx === currentDayIndex && !completedDays[idx] && "animate-pulse border-islamic-gold ring-2 ring-islamic-gold/30"
                                            )}
                                        >
                                            {completedDays[idx] ? (
                                                <Check size={12} className="text-white" strokeWidth={3} />
                                            ) : (
                                                <span className="opacity-60">{day}</span>
                                            )}
                                        </div>

                                        {/* Connecting Line */}
                                        {idx < 6 && (
                                            <div className="w-3 h-0.5 bg-gray-200 dark:bg-white/10 relative rounded-full overflow-hidden">
                                                {completedDays[idx] && (
                                                    <motion.div
                                                        className="absolute inset-0 bg-gradient-to-r from-islamic-gold to-islamic-green"
                                                        initial={{ scaleX: 0 }}
                                                        animate={{ scaleX: 1 }}
                                                        transition={{ duration: 0.5 }}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </Fragment>
                                ))}
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <p className="text-center text-[10px] text-gray-400 dark:text-emerald-100/40 font-medium">
                                    {t('tuba.daysCompleted', { count: completedDays.filter(d => d).length })}
                                </p>
                                {/* Streak Badge */}
                                {currentStreak > 0 && (
                                    <div className="flex items-center gap-1 bg-islamic-gold/10 px-2 py-0.5 rounded-full border border-islamic-gold/20 shadow-sm">
                                        <span className="text-[9px] font-bold text-islamic-gold whitespace-nowrap">{t('tuba.streakBadge', { count: currentStreak })}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex items-center justify-between">
                            <div className="flex-1 relative z-20">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold font-serif text-gray-400 dark:text-emerald-100/40 uppercase tracking-widest">
                                        {stageLabel}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className={cn("text-2xl font-bold font-serif transition-colors duration-[1500ms] drop-shadow-sm", growthColor)}>
                                        {t('tuba.title')}
                                    </h3>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            selection();
                                            setShowInfoModal(true);
                                        }}
                                        className="p-1 rounded-full bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 active:scale-95 transition-all text-stone-500 dark:text-emerald-100/50"
                                    >
                                        <HelpCircle size={16} />
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-400 dark:text-emerald-100/50 font-medium italic mb-3">
                                    {stageMeaning}
                                </p>

                                {/* Progress Bar */}
                                <div className="max-w-[140px]">
                                    <div className="h-1.5 w-full bg-gray-100 dark:bg-emerald-900/30 rounded-full overflow-hidden shadow-inner">
                                        <motion.div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000",
                                                growthProgress >= 7
                                                    ? "bg-islamic-gold dark:bg-gradient-to-r dark:from-amber-400 dark:to-yellow-300 dark:shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                                                    : "bg-islamic-green dark:bg-gradient-to-r dark:from-amber-400 dark:to-yellow-300 dark:shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                                            )}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.max(progress, 5)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1.5 opacity-60">
                                        <span className="text-[9px] font-bold">{t('tuba.total', { count: growthProgress })}</span>
                                        <span className="text-[9px]">{t('tuba.goal', { count: nextMilestone })}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tree Icon with Impact Animation */}
                            <div className="relative z-10 flex flex-col items-center">
                                <AnimatePresence>
                                    {growthProgress >= 40 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="absolute inset-0 bg-islamic-gold/20 blur-2xl rounded-full animate-pulse pointer-events-none"
                                        />
                                    )}
                                </AnimatePresence>

                                <motion.div
                                    ref={treeIconRef}
                                    animate={treeImpact ? {
                                        scale: [1, 1.2, 0.9, 1.1, 1],
                                        filter: ["brightness(1)", "brightness(1.8)", "brightness(1)"],
                                        rotate: [0, -10, 10, -5, 0]
                                    } : {}}
                                    transition={{ duration: 0.6, ease: "backOut" }}
                                    className={cn(
                                        "w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-lg transition-all duration-1000 border-2 relative overflow-hidden",
                                        growthProgress >= 40
                                            ? "border-islamic-gold bg-gradient-to-br from-islamic-gold/20 to-amber-500/10 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                                            : "border-islamic-green/30 bg-white/10 backdrop-blur-md"
                                    )}
                                >
                                    {/* Shimmer Effect for high stages */}
                                    {growthProgress >= 40 && (
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                                            animate={{ left: ['-150%', '150%'] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        />
                                    )}

                                    <StageIcon
                                        className={cn(
                                            "w-10 h-10 transition-all duration-1000 relative z-10",
                                            growthColor,
                                            growthProgress >= 40 ? "drop-shadow-[0_0_12px_rgba(212,175,55,0.6)] animate-pulse" : ""
                                        )}
                                    />
                                </motion.div>

                            </div>
                        </div>

                        {/* Watering Button (İbrik) */}
                        {/* Watering Button (İbrik) */}
                        <motion.button
                            onClick={handleWatering}
                            disabled={isCompletedToday || isWatering}
                            whileTap={!isCompletedToday ? { scale: 0.95 } : {}}
                            className={cn(
                                "w-full mt-4 sm:mt-6 h-12 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all shadow-md flex items-center justify-center gap-2",
                                isCompletedToday
                                    ? "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-default border border-gray-200 dark:border-white/5 shadow-none"
                                    : "bg-gradient-to-r from-islamic-green to-emerald-600 dark:from-islamic-gold dark:to-amber-600 text-white dark:text-[#032e18] hover:shadow-lg active:shadow-sm"
                            )}
                        >
                            {isCompletedToday ? (
                                <>
                                    <CheckCircle2 size={18} />
                                    {t('tuba.btnDone')}
                                </>
                            ) : totalWateredDays >= 3 && !isPremium() ? (
                                <>
                                    <span className="text-base">👑</span>
                                    {t('tuba.btnWater')}
                                </>
                            ) : (
                                <>
                                    <Droplet size={18} className={cn(isWatering && "animate-bounce")} />
                                    {isWatering ? t('tuba.btnWatering') : t('tuba.btnWater')}
                                </>
                            )}
                        </motion.button>
                    </CardContent>

                    {/* Water Drop Animation — single beautiful drop with shimmer */}
                    <AnimatePresence>
                        {isWatering && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, scale: 0.3 }}
                                animate={{ opacity: [0, 1, 1, 0.6, 0], y: [-20, 5, 25, 45, 60], scale: [0.3, 1.1, 1, 0.9, 0.5] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute top-14 right-14 pointer-events-none"
                            >
                                {/* Main water drop */}
                                <Droplet className="w-6 h-6 text-blue-400 fill-blue-300/80 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                                {/* Shimmer ring */}
                                <motion.div
                                    className="absolute inset-0 rounded-full"
                                    style={{ border: '1.5px solid rgba(96,165,250,0.5)' }}
                                    animate={{ scale: [0.8, 1.8, 2.5], opacity: [0.8, 0.3, 0] }}
                                    transition={{ duration: 0.7, ease: 'easeOut' }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </motion.div>

            {/* Already Watered Toast Message - Outside card for proper z-index */}
            <AnimatePresence>
                {alreadyWateredMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-28 left-0 right-0 flex justify-center z-[10000] pointer-events-none px-6"
                    >
                        <div className="bg-white/40 dark:bg-islamic-gold/10 backdrop-blur-2xl text-[#032e18] dark:text-islamic-gold px-6 py-4 rounded-[2rem] font-bold text-sm shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(212,175,55,0.2)] border border-white/40 dark:border-islamic-gold/20 flex items-center gap-3">
                            <span className="text-xl">💧</span>
                            <span className="tracking-tight">{t('tuba.toastAlready')}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Weekly Completion Celebration */}
            <WeeklyConfetti active={showWeeklyCelebration} />
            <AnimatePresence>
                {showWeeklyCelebration && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none p-6"
                    >
                        <motion.div
                            className="bg-white/90 dark:bg-[#032e18]/90 backdrop-blur-xl p-8 rounded-[3rem] shadow-[0_20px_60px_rgba(212,175,55,0.4)] border-2 border-islamic-gold text-center relative overflow-hidden"
                            initial={{ y: 50 }}
                            animate={{ y: 0 }}
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-islamic-gold/10 to-transparent"
                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            />

                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-6xl mb-4"
                            >
                                🌟
                            </motion.div>

                            <h2 className="text-3xl font-bold font-serif text-islamic-green dark:text-islamic-gold mb-2">
                                {t('tuba.celebTitle')}
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-emerald-100/70 font-medium italic">
                                <span dangerouslySetInnerHTML={{ __html: t('tuba.celebMsg') }} />
                            </p>

                            <motion.div
                                className="mt-6 flex justify-center gap-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                    <Star key={i} className="w-5 h-5 text-islamic-gold fill-islamic-gold" />
                                ))}
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Info Modal */}
            <AnimatePresence>
                {showInfoModal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowInfoModal(false)}
                    >
                        <motion.div
                            className="bg-white dark:bg-[#062414] rounded-[2rem] p-6 w-full max-w-sm border border-stone-200 dark:border-white/10 shadow-2xl relative overflow-hidden"
                            initial={{ scale: 0.95, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-islamic-green/10 dark:bg-islamic-gold/10 rounded-full blur-3xl pointer-events-none" />
                            
                            <div className="flex items-center gap-3 mb-4 relative z-10">
                                <div className="p-3 bg-islamic-green/10 dark:bg-islamic-gold/20 rounded-2xl text-islamic-green dark:text-islamic-gold">
                                    <TreeDeciduous size={24} />
                                </div>
                                <h3 className="text-xl font-bold font-serif text-stone-800 dark:text-white">
                                    {t('tuba.modalTitle', 'Tuba Ağacı (Cennet Ağacı)')}
                                </h3>
                            </div>
                            
                            <div className="space-y-3 relative z-10 mb-6">
                                <p className="text-sm font-medium text-stone-600 dark:text-emerald-100/80 leading-relaxed italic border-l-2 border-islamic-gold/50 pl-3">
                                    {t('tuba.quote', '"Kökleri Arş\'ta, dalları kalplere uzanan kutlu cennet ağacıdır."')}
                                </p>
                                <p className="text-sm font-medium text-stone-600 dark:text-emerald-100/70">
                                    {t('tuba.desc', 'Tuba ağacı kökleri gökte, dalları yeryüzünde olan muazzam güzellikteki cennet ağacıdır.')}
                                </p>
                                <ul className="text-sm text-stone-600 dark:text-emerald-100/70 font-medium space-y-2 mt-4 bg-stone-50 dark:bg-white/5 p-3 rounded-xl border border-stone-100 dark:border-white/5">
                                    <li className="flex items-start gap-2">
                                        <Droplet size={16} className="text-islamic-green dark:text-islamic-gold mt-0.5 shrink-0" />
                                        <span>{t('tuba.water', 'Her gün uygulamaya girerek fidanını büyüt ve onu koca bir ağaca dönüştür.')}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Trophy size={16} className="text-islamic-green dark:text-islamic-gold mt-0.5 shrink-0" />
                                        <span>{t('tuba.modalStreak', '7 günlük istikrarın sonunda güzel bir mertebeye ulaş.')}</span>
                                    </li>
                                </ul>
                            </div>
                            
                            <Button 
                                onClick={() => {
                                    selection();
                                    setShowInfoModal(false);
                                }} 
                                className="w-full h-12 rounded-2xl bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#021a0f] font-bold active:scale-95 transition-all relative z-10 shadow-lg shadow-islamic-green/20 dark:shadow-islamic-gold/20 hover:bg-islamic-green/90"
                            >
                                {t('tuba.understood', 'Anladım')}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
});

// --- Verse of the Day Widget (Premium Theme) ---
export const VerseOfDayCard = memo(({ isFriday, verse, fridayContent, onShare }) => {
    const { t } = useTranslation('home');
    const currentVerse = isFriday ? { text: fridayContent.text, source: fridayContent.source } : verse;

    // Islamic arch SVG decoration
    const MihrabDecoration = () => (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
            <defs>
                <pattern id="islamicPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    <circle cx="20" cy="20" r="3" fill="none" stroke="currentColor" strokeWidth="0.3" />
                </pattern>
            </defs>
            <rect width="400" height="500" fill="url(#islamicPattern)" />
            {/* Mihrab Arch */}
            <path d="M80 480 L80 200 Q80 80 200 80 Q320 80 320 200 L320 480" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
            <path d="M100 480 L100 210 Q100 100 200 100 Q300 100 300 210 L300 480" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
        </svg>
    );

    return (
        <motion.div variants={itemVariants}>
            <Card className={cn(
                "border-none shadow-xl relative overflow-hidden transition-all duration-700 rounded-[2.5rem]",
                isFriday
                    ? "bg-gradient-to-br from-stone-50 via-amber-50/50 to-stone-50 dark:from-[#062e19] dark:via-[#0a4528] dark:to-[#062e19] text-stone-800 dark:text-white shadow-[0_8px_40px_rgba(212,175,55,0.1)] dark:shadow-[0_8px_40px_rgba(212,175,55,0.15)] border border-islamic-gold/15 dark:border-islamic-gold/20"
                    : "bg-gradient-to-br from-stone-50 via-emerald-50/40 to-stone-50 dark:from-[#062e19] dark:via-[#0a4528] dark:to-[#062e19] text-stone-800 dark:text-white shadow-[0_8px_40px_rgba(4,77,41,0.08)] dark:shadow-[0_8px_40px_rgba(4,77,41,0.3)] border border-stone-200/60 dark:border-transparent"
            )}>
                {/* Background Decorations */}
                <MihrabDecoration />
                
                {/* Ambient glow orbs */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-islamic-gold/5 dark:bg-islamic-gold/8 rounded-full blur-3xl" />
                <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-islamic-green/5 dark:bg-islamic-green/10 rounded-full blur-3xl" />

                {/* Friday special shimmer */}
                {isFriday && (
                    <>
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-islamic-gold/5 to-transparent"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        />
                        <div className="absolute top-4 right-4 z-20">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            >
                                <Star className="w-6 h-6 text-islamic-gold/30 fill-islamic-gold/10" />
                            </motion.div>
                        </div>
                    </>
                )}

                {/* Header */}
                <div className="relative z-10 px-6 pt-5 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Ornamental icon */}
                        <div className="w-10 h-10 rounded-2xl bg-islamic-green/10 dark:bg-islamic-gold/10 border border-islamic-green/20 dark:border-islamic-gold/20 flex items-center justify-center backdrop-blur-sm">
                            {isFriday ? (
                                <Sparkles className="w-5 h-5 text-islamic-green dark:text-islamic-gold" />
                            ) : (
                                <svg className="w-5 h-5 text-islamic-green dark:text-islamic-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                                </svg>
                            )}
                        </div>
                        <h3 className="text-islamic-green dark:text-islamic-gold text-[10px] tracking-[0.2em] uppercase font-bold">
                            {isFriday ? t('verse.fridayTitle') : t('verse.dailyTitle')}
                        </h3>
                    </div>
                    <button
                        onClick={onShare}
                        aria-label={t('verse_share_title')}
                        className="w-10 h-10 flex items-center justify-center bg-islamic-green/5 hover:bg-islamic-green/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-2xl transition-all active:scale-95 border border-islamic-green/10 dark:border-white/5"
                    >
                        <Share2 className="w-4 h-4 text-islamic-green dark:text-islamic-gold" />
                    </button>
                </div>

                {/* Verse Content */}
                <div className="relative z-10 px-6 pb-5">
                    {/* Decorative top ornament */}
                    <div className="flex justify-center mb-4 opacity-30 dark:opacity-20">
                        <svg width="60" height="12" viewBox="0 0 60 12" fill="none">
                            <path d="M0 6 L10 2 L20 6 L30 0 L40 6 L50 2 L60 6" stroke="currentColor" strokeWidth="0.8" className="text-islamic-green dark:text-[#D4AF37]" />
                            <circle cx="30" cy="6" r="2" fill="currentColor" opacity="0.5" className="text-islamic-green dark:text-[#D4AF37]" />
                        </svg>
                    </div>

                    <p className="font-serif text-[17px] sm:text-lg leading-[1.8] text-stone-700 dark:text-white/90 text-center" style={{ textWrap: 'balance' }}>
                        "{currentVerse.text}"
                    </p>

                    {/* Divider */}
                    <div className="flex items-center justify-center gap-3 mt-5 mb-2">
                        <div className="h-px w-8 bg-islamic-green/20 dark:bg-islamic-gold/20" />
                        <div className="w-1.5 h-1.5 rounded-full bg-islamic-green/30 dark:bg-islamic-gold/30" />
                        <div className="h-px w-8 bg-islamic-green/20 dark:bg-islamic-gold/20" />
                    </div>

                    <p className="text-center text-[10px] font-bold text-islamic-green/50 dark:text-islamic-gold/60 uppercase tracking-[0.15em]">
                        — {currentVerse.source}
                    </p>
                </div>

                {/* Friday CTA */}
                {isFriday && (
                    <div className="relative z-10 px-6 pb-5">
                        <Button
                            className="w-full bg-islamic-green dark:bg-islamic-gold hover:bg-islamic-green/90 dark:hover:bg-islamic-gold/90 text-white dark:text-[#0d2a2e] font-bold rounded-2xl h-14 shadow-lg shadow-islamic-green/20 dark:shadow-islamic-gold/20 gap-2 active:scale-95 transition-transform"
                            onClick={onShare}
                        >
                            <Sparkles className="w-5 h-5" /> {t('verse.shareBtn')}
                        </Button>
                    </div>
                )}
            </Card>
        </motion.div>
    );
});

// --- Daily Deed Card ---
export const DailyDeedCard = memo(({ revealed, deed, onReveal }) => {
    const { t } = useTranslation('home');
    return (
        <motion.div variants={itemVariants}>
            <Card
                className="group relative overflow-hidden rounded-[2.5rem] border-none backdrop-blur-xl bg-white/80 dark:bg-gradient-to-br dark:from-[#032e18] dark:via-[#044d29] dark:to-[#032e18] shadow-xl dark:shadow-[0_20px_60px_rgba(4,77,41,0.4)] transition-all duration-500"
                onClick={onReveal}
            >
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-islamic-gold to-transparent opacity-50" />
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-700 shadow-inner",
                            revealed ? "bg-islamic-gold text-white rotate-[360deg] shadow-[0_0_20px_rgba(212,175,55,0.4)]" : "bg-islamic-green/5 text-islamic-green dark:bg-islamic-gold/10 dark:text-islamic-gold"
                        )}>
                            <Heart className={cn("w-7 h-7", revealed ? "fill-current" : "")} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xs font-bold font-serif text-gray-400 dark:text-emerald-100/60 uppercase tracking-widest mb-1">{t('deed.title')}</h4>
                            {revealed ? (
                                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight animate-in slide-in-from-left duration-500">
                                    {deed}
                                </p>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-gray-300 dark:text-gray-600 blur-[2px] select-none">{t('deed.blurText')}</p>
                                    <span className="text-[10px] bg-islamic-gold/20 text-islamic-gold px-2 py-0.5 rounded-full font-bold animate-pulse">{t('deed.reveal')}</span>
                                </div>
                            )}
                        </div>
                        <ChevronRight className={cn("text-gray-200 dark:text-gray-700 transition-transform", revealed && "rotate-90")} />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
});

// --- Esma-ül Hüsna Widget ---
export const EsmaUlHusnaWidget = memo(({ esmaList, onSelect, onShowAll }) => {
    const { t, i18n } = useTranslation('home');
    const lang = (i18n.language || 'en').split('-')[0];
    return (
        <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex justify-between items-end px-1">
                <h3 className="text-sm font-bold font-serif text-gray-400 dark:text-emerald-100/60 uppercase tracking-widest">{t('esma.title')}</h3>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onShowAll}
                        className="text-[10px] font-bold text-islamic-gold uppercase tracking-tighter hover:opacity-80 transition-opacity"
                    >
                        {t('esma.showAll')}
                    </button>
                    <span className="text-[10px] font-bold text-islamic-gold/60 uppercase tracking-tighter">{t('esma.swipe')} <span className="animate-pulse">→</span></span>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-6 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-4 px-4 text-black dark:text-white">
                {esmaList.map((esma) => (
                    <motion.div
                        key={esma.name}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onSelect(esma)}
                        className="min-w-[200px] snap-center glass-panel p-5 sm:p-6 rounded-[2.5rem] transition-all cursor-pointer relative overflow-hidden group bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:border-islamic-gold/30 shadow-sm"
                    >
                        {/* Decorative Gradient Glow */}
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-islamic-green/5 dark:bg-islamic-gold/10 blur-3xl rounded-full" />

                        <p className="text-islamic-green dark:text-islamic-gold font-serif font-bold text-3xl mb-3 drop-shadow-sm group-hover:scale-110 transition-transform origin-left">
                            {esma.calligraphy}
                        </p>
                        <h4 className="text-sm font-black uppercase tracking-tight text-gray-800 dark:text-white">
                            {esma.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-emerald-100/40 font-medium line-clamp-2 mt-2 leading-relaxed opacity-90">
                            {esma[`meaning_${lang}`] || esma.meaning}
                        </p>

                        {/* Subtle Badge or Indicator */}
                        <div className="mt-4 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-islamic-gold/40" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('esma.seeDetails')}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
});

// --- All Esma Modal (Alphabetical & Searchable) ---
export const AllEsmaModal = memo(({ isOpen, onClose, onSelect }) => {
    const { t, i18n } = useTranslation('home');
    const lang = (i18n.language || 'en').split('-')[0];
    const [search, setSearch] = useState('');
    const [isAscending, setIsAscending] = useState(true);
    const { selection } = useHaptics();

    const filteredEsma = useMemo(() => {
        let list = [...ALL_ESMA];
        if (search) {
            list = list.filter(e =>
                e.name.toLowerCase().includes(search.toLowerCase()) ||
                (e[`meaning_${lang}`] || e.meaning).toLowerCase().includes(search.toLowerCase())
            );
        }
        return list.sort((a, b) => {
            return isAscending
                ? a.name.localeCompare(b.name, lang)
                : b.name.localeCompare(a.name, lang);
        });
    }, [search, isAscending, lang]);

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

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col pt-12"
        >
            <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
                <h2 className="text-xl font-serif font-bold text-islamic-gold">{t('esma.modalTitle')}</h2>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="w-6 h-6 text-white" />
                </button>
            </div>

            <div className="p-4 space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('esma.searchPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-islamic-gold/50 transition-all"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={() => { selection(); setIsAscending(!isAscending); }}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-islamic-gold bg-islamic-gold/10 px-3 py-1.5 rounded-full border border-islamic-gold/20"
                    >
                        {isAscending ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
                        {isAscending ? t('esma.sortAsc') : t('esma.sortDesc')}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-12 space-y-3 custom-scrollbar">
                {filteredEsma.map((esma) => (
                    <motion.div
                        key={esma.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => { selection(); onSelect(esma); }}
                        className="glass-panel p-5 rounded-3xl border border-white/5 hover:border-islamic-gold/30 transition-all flex items-center justify-between group cursor-pointer active:scale-98"
                    >
                        <div className="flex-1">
                            <h4 className="text-sm font-black uppercase tracking-tight text-white group-hover:text-islamic-gold transition-colors">
                                {esma.name}
                            </h4>
                            <p className="text-xs text-gray-400 font-medium leading-relaxed mt-1 line-clamp-1">
                                {esma[`meaning_${lang}`] || esma.meaning}
                            </p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <span className="text-2xl font-serif text-islamic-gold mb-1 group-hover:scale-110 transition-transform">
                                {esma.calligraphy}
                            </span>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('esma.ebced')}: {esma.ebced}</span>
                        </div>
                    </motion.div>
                ))}

                {filteredEsma.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 font-medium italic">{t('esma.noResults')}</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
});

// --- Mood Selector ---
export const MoodSelector = memo(({ selectedMood, moodVerse, onSelect }) => {
    const moods = [
        { id: 'sad', label: 'Hüzünlü', icon: '😔' },
        { id: 'anxious', label: 'Endişeli', icon: '😟' },
        { id: 'grateful', label: 'Şükür Dolu', icon: '😊' },
    ];

    return (
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl">
            <h3 className="text-lg font-serif font-bold text-islamic-green dark:text-islamic-gold mb-5 text-center text-black">
                Bugün nasıl hissediyorsun?
            </h3>
            <div className="grid grid-cols-3 gap-3">
                {moods.map(mood => (
                    <button
                        key={mood.id}
                        onClick={() => onSelect(mood)}
                        className={cn(
                            "flex flex-col items-center p-4 rounded-2xl transition-all active:scale-95 min-h-[90px] justify-center backdrop-blur-sm",
                            selectedMood?.id === mood.id
                                ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] scale-105 shadow-[0_0_20px_rgba(4,77,41,0.2)] border border-transparent"
                                : "bg-white/40 dark:bg-white/5 text-gray-600 dark:text-emerald-100/60 hover:bg-white/60 dark:hover:bg-white/10 shadow-sm border border-white/20 dark:border-white/5"
                        )}
                    >
                        <span className="text-3xl mb-2 filter drop-shadow-sm">{mood.icon}</span>
                        <span className="text-[10px] font-bold uppercase tracking-tight">{mood.label}</span>
                    </button>
                ))}
            </div>

            {selectedMood && moodVerse && (
                <div className="mt-6 p-6 bg-white/50 dark:bg-black/20 rounded-3xl border border-islamic-gold/20 shadow-inner animate-in fade-in slide-in-from-top-4 duration-500 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-islamic-gold text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                        Sana Özel Mektup
                    </div>
                    <p className="text-gray-700 dark:text-emerald-100/90 font-serif leading-relaxed text-[15px] italic text-center text-shadow-sm">
                        "{moodVerse.text}"
                    </p>
                    <div className="flex items-center justify-between mt-6 opacity-70">
                        <div className="h-px flex-1 bg-gray-300 dark:bg-white/10" />
                        <p className="text-[11px] text-islamic-green dark:text-islamic-gold font-bold px-3 whitespace-nowrap">
                            - {moodVerse.source}
                        </p>
                        <div className="h-px flex-1 bg-gray-300 dark:bg-white/10" />
                    </div>
                </div>
            )}
        </motion.div>
    );
});

// --- Affirmation Carousel (Unchanged but included for context if needed, just referencing) ---
// Keeping AffirmationCarousel as is, it's already using min-h-[128px].

export const AffirmationCarousel = memo(({ affirmations, currentIndex }) => {
    if (!affirmations || affirmations.length === 0) return null;
    const current = affirmations[currentIndex];

    return (
        <motion.div variants={itemVariants} className="px-1">
            <div className={cn(
                "relative h-32 rounded-[2rem] bg-gradient-to-br p-6 overflow-hidden shadow-lg transition-all duration-1000",
                current.bg
            )}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl" />
                <div className="relative z-10 h-full flex flex-col justify-center">
                    <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Huzur Veren Olumlama
                    </p>
                    <p className="text-white text-lg font-serif font-bold italic leading-tight text-shadow-sm">
                        "{current.text}"
                    </p>
                </div>
            </div>
        </motion.div>
    );
});


// --- Prayer Countdown ---
export const PrayerCountdownWidget = memo(({ loading, city, nextPrayerInfo, prayerTimes }) => {
    const [showReminderOptions, setShowReminderOptions] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedPrayerId, setSelectedPrayerId] = useState(null); // null = auto (next prayer)
    const [customCountdown, setCustomCountdown] = useState(null);
    const [alarmSet, setAlarmSet] = useState(false);
    const [alarmTime, setAlarmTime] = useState(null);
    const [selectedMinutes, setSelectedMinutes] = useState(null);
    const [alarmId, setAlarmId] = useState(null);
    const [selectedPrayerForReminder, setSelectedPrayerForReminder] = useState(null); // Which prayer's reminder modal is open
    const [prayerReminders, setPrayerReminders] = useState({}); // { 'sabah': { mins: 15, id: 123, time: '06:20' }, ... }
    const { selection } = useHaptics();
    const { settings } = usePrayerTimes();
    const navigate = useNavigate();
    const { t } = useTranslation('home');

    // Include all 6 times (including Sunrise)
    const mainPrayers = useMemo(() => {
        if (!prayerTimes) return [];
        return prayerTimes;
    }, [prayerTimes]);

    // Get currently displayed prayer info (selected or auto-next)
    const displayedPrayer = useMemo(() => {
        if (selectedPrayerId && mainPrayers.length > 0) {
            const found = mainPrayers.find(p => p.id === selectedPrayerId);
            if (found) return found;
        }
        // Default: auto (next prayer from system). Use prayerTimes to include Sunrise (Güneş)
        if (nextPrayerInfo && prayerTimes && prayerTimes.length > 0) {
            return prayerTimes.find(p => p.name === nextPrayerInfo.name) || prayerTimes[0];
        }
        return null;
    }, [selectedPrayerId, mainPrayers, nextPrayerInfo, prayerTimes]);

    // Calculate countdown for selected prayer
    useEffect(() => {
        if (!displayedPrayer || !selectedPrayerId) {
            setCustomCountdown(null);
            return;
        }

        const calculateCountdown = () => {
            const now = new Date();
            const timeStr = displayedPrayer.time;

            // Parse time (handle both 24h and 12h formats)
            let hours, minutes;
            if (timeStr.includes('AM') || timeStr.includes('PM')) {
                const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (match) {
                    hours = parseInt(match[1]);
                    minutes = parseInt(match[2]);
                    if (match[3].toUpperCase() === 'PM' && hours !== 12) hours += 12;
                    if (match[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
                }
            } else {
                const [h, m] = timeStr.split(':').map(Number);
                hours = h;
                minutes = m;
            }

            if (isNaN(hours) || isNaN(minutes)) return null;

            const prayerDate = new Date();
            prayerDate.setHours(hours, minutes, 0, 0);

            // If prayer time has passed today, show for tomorrow
            if (prayerDate <= now) {
                prayerDate.setDate(prayerDate.getDate() + 1);
            }

            const diff = prayerDate - now;
            const pad = (n) => n.toString().padStart(2, '0');

            return `${pad(Math.floor(diff / 3600000))}:${pad(Math.floor((diff / 60000) % 60))}:${pad(Math.floor((diff / 1000) % 60))}`;
        };

        const timer = setInterval(() => {
            setCustomCountdown(calculateCountdown());
        }, 1000);

        setCustomCountdown(calculateCountdown());

        return () => clearInterval(timer);
    }, [displayedPrayer, selectedPrayerId]);

    // Check if alarm is already set for this prayer instance
    useEffect(() => {
        if (!nextPrayerInfo || !nextPrayerInfo.name) return;

        const prayerDate = nextPrayerInfo.date || getTodayString();
        const key = `reminder_${nextPrayerInfo.name}_${prayerDate}`;
        const savedTime = localStorage.getItem(key);
        const savedMins = localStorage.getItem(key + '_mins');
        const savedId = localStorage.getItem(key + '_id');

        if (savedTime) {
            setAlarmSet(true);
            setAlarmTime(savedTime);
            setSelectedMinutes(savedMins !== null ? parseInt(savedMins) : null);
            setAlarmId(savedId);
        } else {
            setAlarmSet(false);
            setAlarmTime(null);
            setSelectedMinutes(null);
            setAlarmId(null);
        }
    }, [nextPrayerInfo?.name, nextPrayerInfo?.date]);

    // Load all prayer reminders from localStorage
    useEffect(() => {
        if (!mainPrayers || mainPrayers.length === 0) return;

        const reminders = {};
        const prayerDate = getTodayString();

        mainPrayers.forEach(prayer => {
            const prayerKey = prayer.name.toLowerCase();

            // Check all possible minute values (15, 30, 45)
            [15, 30, 45].forEach(mins => {
                const key = `prayer_reminder_${prayer.name}_${prayerDate}_${mins}`;
                const savedMins = localStorage.getItem(key + '_mins');
                const savedId = localStorage.getItem(key + '_id');
                const savedTime = localStorage.getItem(key);

                if (savedMins && savedId) {
                    // Only keep the most recent one (last set)
                    reminders[prayerKey] = {
                        mins: parseInt(savedMins),
                        id: parseInt(savedId),
                        time: savedTime
                    };
                }
            });
        });

        setPrayerReminders(reminders);
    }, [mainPrayers]);

    const handleSetReminder = async (minutesBefore) => {
        setShowReminderOptions(false);
        try {
            const perm = await LocalNotifications.checkPermissions();
            if (perm.display !== 'granted') {
                const req = await LocalNotifications.requestPermissions();
                if (req.display !== 'granted') return;
            }

            if (!displayedPrayer) return;

            const timeStr = displayedPrayer.time;
            let hours, mins;
            if (timeStr.includes('AM') || timeStr.includes('PM')) {
                const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (match) {
                    hours = parseInt(match[1]);
                    mins = parseInt(match[2]);
                    if (match[3].toUpperCase() === 'PM' && hours !== 12) hours += 12;
                    if (match[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
                }
            } else {
                [hours, mins] = timeStr.split(':').map(Number);
            }

            let targetDate = new Date();
            targetDate.setHours(hours, mins, 0, 0);

            const now = new Date();
            if (targetDate <= now) {
                targetDate.setDate(targetDate.getDate() + 1);
            }

            const triggerDate = new Date(targetDate.getTime() - (minutesBefore * 60000));

            if (triggerDate <= now && minutesBefore !== 0) {
                alert(t('alarm_too_close'));
                return;
            }

            const id = Math.floor(Math.random() * 2147483647);

            // Cancel auto-scheduled notification for this prayer to prevent duplicates
            // Auto-scheduler IDs: day * 6 + prayerIndex + 1 (day 0 = today)
            const prayerIds = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
            const prayerIdx = prayerIds.indexOf(displayedPrayer.id);
            if (prayerIdx !== -1) {
                const autoId = 0 * 6 + prayerIdx + 1; // day=0 (today)
                try {
                    await LocalNotifications.cancel({ notifications: [{ id: autoId }] });
                } catch { /* ignore */ }
            }

            const reminderTitle = { tr: 'Vakit Yaklaşıyor!', en: 'Prayer Time Approaching!', de: 'Gebetszeit naht!', ru: 'Время намаза приближается!', ar: 'اقترب وقت الصلاة!', az: 'Namaz vaxtı yaxınlaşır!' };
            const reminderBody = {
                tr: `${displayedPrayer.name} vaktine ${minutesBefore === 0 ? 'girdi' : `${minutesBefore} dakika kaldı`}.`,
                en: `${minutesBefore === 0 ? `${displayedPrayer.name} time has arrived.` : `${minutesBefore} minutes until ${displayedPrayer.name}.`}`,
                de: `${minutesBefore === 0 ? `${displayedPrayer.name} Zeit ist da.` : `Noch ${minutesBefore} Minuten bis ${displayedPrayer.name}.`}`,
                ru: `${minutesBefore === 0 ? `Время ${displayedPrayer.name} наступило.` : `До ${displayedPrayer.name} осталось ${minutesBefore} минут.`}`,
                ar: `${minutesBefore === 0 ? `حان وقت ${displayedPrayer.name}.` : `باقي ${minutesBefore} دقيقة على ${displayedPrayer.name}.`}`,
                az: `${minutesBefore === 0 ? `${displayedPrayer.name} vaxtı gəldi.` : `${displayedPrayer.name} vaxtına ${minutesBefore} dəqiqə qaldı.`}`
            };
            const currentLang = i18n.language || 'en';
            await LocalNotifications.schedule({
                notifications: [{
                    title: reminderTitle[currentLang] || reminderTitle.tr,
                    body: reminderBody[currentLang] || reminderBody.tr,
                    id: id,
                    schedule: { at: triggerDate, allowWhileIdle: true },
                    sound: settings.vibrateOnly ? null : (Capacitor.getPlatform() === 'android' ? 'beep' : 'beep.caf'),
                    channelId: 'ezan_vakti',
                    interruptionLevel: 'timeSensitive'
                }]
            });
            const prayerDate = getTodayString();
            const key = `main_reminder_${displayedPrayer.name}_${prayerDate}`; // UNIQUE PREFIX for main system
            const timeStrFormatted = triggerDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

            localStorage.setItem(key, timeStrFormatted);
            localStorage.setItem(key + '_mins', minutesBefore.toString());
            localStorage.setItem(key + '_id', id.toString());

            setAlarmSet(true);
            setAlarmTime(timeStrFormatted);
            setSelectedMinutes(minutesBefore);
            setAlarmId(id);

            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        } catch (error) {
            console.error('Reminder error:', error);
        }
    };

    const handleRemoveReminder = async () => {
        try {
            if (alarmId) {
                await LocalNotifications.cancel({ notifications: [{ id: parseInt(alarmId) }] });
            }
            const prayerDate = getTodayString();
            const key = `main_reminder_${displayedPrayer?.name}_${prayerDate}`; // UNIQUE PREFIX for main system
            localStorage.removeItem(key);
            localStorage.removeItem(key + '_mins');
            localStorage.removeItem(key + '_id');

            setAlarmSet(false);
            setAlarmTime(null);
            setSelectedMinutes(null);
            setAlarmId(null);
            setShowReminderOptions(false);

            if (navigator.vibrate) navigator.vibrate([50]);
        } catch (error) {
            console.error('Remove reminder error:', error);
        }
    };

    // New: Set reminder for specific prayer
    const handleSetPrayerReminder = async (prayer, minutesBefore) => {
        setSelectedPrayerForReminder(null); // Close modal
        try {
            const perm = await LocalNotifications.checkPermissions();
            if (perm.display !== 'granted') {
                const req = await LocalNotifications.requestPermissions();
                if (req.display !== 'granted') return;
            }

            const timeStr = prayer.time;
            let hours, mins;
            if (timeStr.includes('AM') || timeStr.includes('PM')) {
                const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (match) {
                    hours = parseInt(match[1]);
                    mins = parseInt(match[2]);
                    if (match[3].toUpperCase() === 'PM' && hours !== 12) hours += 12;
                    if (match[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
                }
            } else {
                [hours, mins] = timeStr.split(':').map(Number);
            }

            let targetDate = new Date();
            targetDate.setHours(hours, mins, 0, 0);

            const now = new Date();
            if (targetDate <= now) {
                targetDate.setDate(targetDate.getDate() + 1);
            }

            const triggerDate = new Date(targetDate.getTime() - (minutesBefore * 60000));

            if (triggerDate <= now && minutesBefore !== 0) {
                alert(t('alarm_too_close'));
                return;
            }

            const id = Math.floor(Math.random() * 2147483647);

            // Cancel auto-scheduled notification for this prayer to prevent duplicates
            // Auto-scheduler IDs: day * 6 + prayerIndex + 1 (day 0 = today)
            const prayerIds = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
            const prayerIdx = prayerIds.indexOf(prayer.id);
            if (prayerIdx !== -1) {
                const autoId = 0 * 6 + prayerIdx + 1;
                try {
                    await LocalNotifications.cancel({ notifications: [{ id: autoId }] });
                } catch { /* ignore */ }
            }

            const rTitle = { tr: 'Vakit Yaklaşıyor!', en: 'Prayer Time Approaching!', de: 'Gebetszeit naht!', ru: 'Время намаза приближается!', ar: 'اقترب وقت الصلاة!', az: 'Namaz vaxtı yaxınlaşır!' };
            const rBody = {
                tr: `${prayer.name} vaktine ${minutesBefore === 0 ? 'girdi' : `${minutesBefore} dakika kaldı`}.`,
                en: `${minutesBefore === 0 ? `${prayer.name} time has arrived.` : `${minutesBefore} minutes until ${prayer.name}.`}`,
                de: `${minutesBefore === 0 ? `${prayer.name} Zeit ist da.` : `Noch ${minutesBefore} Minuten bis ${prayer.name}.`}`,
                ru: `${minutesBefore === 0 ? `Время ${prayer.name} наступило.` : `До ${prayer.name} осталось ${minutesBefore} минут.`}`,
                ar: `${minutesBefore === 0 ? `حان وقت ${prayer.name}.` : `باقي ${minutesBefore} دقيقة على ${prayer.name}.`}`,
                az: `${minutesBefore === 0 ? `${prayer.name} vaxtı gəldi.` : `${prayer.name} vaxtına ${minutesBefore} dəqiqə qaldı.`}`
            };
            const cLang = i18n.language || 'en';
            await LocalNotifications.schedule({
                notifications: [{
                    title: rTitle[cLang] || rTitle.tr,
                    body: rBody[cLang] || rBody.tr,
                    id: id,
                    schedule: { at: triggerDate, allowWhileIdle: true },
                    sound: settings.vibrateOnly ? null : (Capacitor.getPlatform() === 'android' ? 'beep' : 'beep.caf'),
                    channelId: 'ezan_vakti',
                    interruptionLevel: 'timeSensitive'
                }]
            });

            const prayerDate = getTodayString();
            const prayerKey = prayer.name.toLowerCase();

            // IMPORTANT: Clear ALL old reminder keys for this prayer first
            const existingReminder = prayerReminders[prayerKey];
            if (existingReminder?.id) {
                try {
                    await LocalNotifications.cancel({ notifications: [{ id: existingReminder.id }] });
                } catch (e) {
                }
            }

            // Clear all possible old localStorage keys for this prayer
            [15, 30, 45].forEach(mins => {
                const oldKey = `prayer_reminder_${prayer.name}_${prayerDate}_${mins}`;
                localStorage.removeItem(oldKey);
                localStorage.removeItem(oldKey + '_mins');
                localStorage.removeItem(oldKey + '_id');
            });

            // Now set the new reminder
            const key = `prayer_reminder_${prayer.name}_${prayerDate}_${minutesBefore}`;
            const timeStrFormatted = triggerDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

            localStorage.setItem(key, timeStrFormatted);
            localStorage.setItem(key + '_mins', minutesBefore.toString());
            localStorage.setItem(key + '_id', id.toString());

            // Update state
            setPrayerReminders(prev => ({
                ...prev,
                [prayerKey]: { mins: minutesBefore, id, time: timeStrFormatted }
            }));

            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        } catch (error) {
            console.error('Prayer reminder error:', error);
        }
    };

    // Remove prayer reminder
    const handleRemovePrayerReminder = async (prayer) => {
        try {
            const prayerKey = prayer.name.toLowerCase();
            const reminder = prayerReminders[prayerKey];

            if (reminder?.id) {
                await LocalNotifications.cancel({ notifications: [{ id: reminder.id }] });
            }

            const prayerDate = getTodayString();

            // Remove all possible reminders for this prayer (15, 30, 45 min)
            [15, 30, 45].forEach(mins => {
                const key = `prayer_reminder_${prayer.name}_${prayerDate}_${mins}`;
                localStorage.removeItem(key);
                localStorage.removeItem(key + '_mins');
                localStorage.removeItem(key + '_id');
            });

            setPrayerReminders(prev => {
                const updated = { ...prev };
                delete updated[prayerKey];
                return updated;
            });

            if (navigator.vibrate) navigator.vibrate(50);
        } catch (error) {
            console.error('Remove prayer reminder error:', error);
        }
    };

    // Check if a prayer time has passed today
    const isPastPrayer = (prayerTime) => {
        if (!prayerTime) return false;
        const now = new Date();
        let h, m;
        if (prayerTime.includes('AM') || prayerTime.includes('PM')) {
            const match = prayerTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (match) {
                h = parseInt(match[1]);
                m = parseInt(match[2]);
                if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
                if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
            }
        } else {
            [h, m] = prayerTime.split(':').map(Number);
        }
        if (isNaN(h) || isNaN(m)) return false;
        const prayerDate = new Date();
        prayerDate.setHours(h, m, 0, 0);
        return now > prayerDate;
    };

    const handleCardClick = () => {
        selection();
        setIsExpanded(!isExpanded);
    };

    // Stable callback - prevents recreations (React optimization)
    const handlePrayerSelect = useCallback((prayer) => {
        selection();
        setSelectedPrayerId(prayer.id);
    }, [selection]); // Only recreated if selection changes

    // Determine what to show
    const displayName = displayedPrayer?.name || nextPrayerInfo?.name || '-';
    const displayTime = displayedPrayer?.time || '--:--';
    const displayCountdown = selectedPrayerId ? customCountdown : nextPrayerInfo?.timeLeft || '--:--:--';
    const isAutoMode = !selectedPrayerId;
    const DisplayIcon = displayedPrayer?.icon || Moon;

    return (
        <>
            <motion.div variants={itemVariants}>
                <Card
                    className="glass-panel border-none rounded-[2.5rem] text-black dark:text-white overflow-hidden relative cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={handleCardClick}
                >
                    <CardContent className="p-0">
                        {/* Main Countdown Row - Clean Design */}
                        <div className="flex items-center gap-2 min-[370px]:gap-3 sm:gap-4 p-3 sm:p-4">
                            {/* Left: Icon */}
                            <div className="flex-shrink-0">
                                {loading ? (
                                    <div className="w-11 h-11 min-[370px]:w-14 min-[370px]:h-14 rounded-full shimmer" />
                                ) : (
                                    <div className="relative">
                                        <div className={cn(
                                            "w-11 h-11 min-[370px]:w-14 min-[370px]:h-14 rounded-full border-[3px] flex items-center justify-center shadow-lg",
                                            isAutoMode
                                                ? "border-islamic-gold border-t-transparent animate-spin-slow bg-islamic-gold/5"
                                                : "border-islamic-gold bg-islamic-gold/10"
                                        )}>
                                            <DisplayIcon className={cn(
                                                "w-6 h-6",
                                                isAutoMode
                                                    ? "text-islamic-green dark:text-islamic-gold"
                                                    : "text-islamic-gold"
                                            )} />
                                        </div>
                                        {alarmSet && (
                                            <div className="absolute -top-0.5 -right-0.5 bg-islamic-gold text-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#fdfaf5] dark:border-[#032e18] shadow-md">
                                                <Bell size={10} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Center: Prayer Info */}
                            <div className="flex-1 min-w-0 pr-1 sm:pr-2">
                                {loading ? (
                                    <div className="space-y-2">
                                        <div className="h-3 w-16 rounded shimmer" />
                                        <div className="h-7 w-24 rounded shimmer" />
                                    </div>
                                ) : (
                                    <>
                                        {/* Title Row */}
                                        <div className="flex items-center gap-1.5 min-[370px]:gap-2 mb-0.5">
                                            <span className="text-[10px] min-[370px]:text-[11px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                                                {isAutoMode ? t('prayerCard.upcoming') : t('prayerCard.tracking')}
                                            </span>
                                            {!isAutoMode && (
                                                <span className="bg-islamic-gold text-black text-[8px] min-[370px]:text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                    ✎
                                                </span>
                                            )}
                                        </div>
                                        {/* Prayer Name & Time */}
                                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                            <h2 className="text-[17px] min-[370px]:text-[20px] sm:text-[22px] font-bold text-islamic-green dark:text-islamic-gold font-serif leading-tight truncate">
                                                {displayName}
                                            </h2>
                                            <span className="text-xs min-[370px]:text-sm text-gray-500 dark:text-gray-400 font-mono flex-shrink-0">
                                                {displayTime}
                                            </span>
                                        </div>
                                        {/* City - Subtle */}
                                        <p className="text-[9px] min-[370px]:text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium truncate">
                                            {city}
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Right: Countdown & Bell - Same Row */}
                            {!loading && (
                                <div className="flex items-center gap-1 min-[370px]:gap-1.5 sm:gap-2 flex-shrink-0">
                                    {/* Alarm Button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-8 w-8 min-[370px]:h-9 min-[370px]:w-9 sm:h-10 sm:w-10 rounded-full flex-shrink-0",
                                            alarmSet
                                                ? "text-islamic-gold bg-islamic-gold/10"
                                                : "text-gray-400 hover:text-islamic-gold hover:bg-islamic-gold/5"
                                        )}
                                        onClick={(e) => { e.stopPropagation(); if (!isPremium()) { navigate('/premium'); return; } setShowReminderOptions(true); }}
                                    >
                                        <Bell size={18} fill={alarmSet ? "currentColor" : "none"} className="scale-90 min-[370px]:scale-100" />
                                    </Button>
                                    {/* Countdown Timer */}
                                    <div className="text-[14.5px] min-[370px]:text-[18px] sm:text-[22px] tabular-nums font-bold tracking-tight text-islamic-green dark:text-islamic-gold bg-black/5 dark:bg-white/5 py-1.5 rounded-xl flex-shrink-0 w-[82px] min-[370px]:w-[96px] sm:w-[115px] text-center">
                                        {displayCountdown || '--:--:--'}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Expand Indicator */}
                        <div className="flex justify-center py-1.5 bg-islamic-green/5 dark:bg-black/20 border-t border-white/5">
                            <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                                className="text-islamic-gold/50"
                            >
                                <ChevronDown size={18} />
                            </motion.div>
                        </div>

                        {/* Expandable Panel - All 5 Prayers (Selectable) */}
                        <AnimatePresence>
                            {isExpanded && !loading && mainPrayers.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                    style={{ overflow: 'hidden' }}
                                >
                                    <div className="p-4 pt-2 space-y-2 bg-gradient-to-b from-islamic-green/5 dark:from-black/10 to-transparent">
                                        {/* Auto Mode Button */}
                                        {selectedPrayerId && (
                                            <motion.button
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                onClick={(e) => { e.stopPropagation(); setSelectedPrayerId(null); }}
                                                className="w-full text-center py-2 text-xs font-bold text-islamic-gold bg-islamic-gold/10 rounded-xl border border-islamic-gold/20 hover:bg-islamic-gold/20 transition-all mb-2"
                                            >
                                                {t('prayerCard.backToAuto')}
                                            </motion.button>
                                        )}

                                        {mainPrayers.map((prayer, index) => {
                                            const isSelected = selectedPrayerId === prayer.id;
                                            const isNext = !selectedPrayerId && nextPrayerInfo?.name === prayer.name;
                                            const isPast = isPastPrayer(prayer.time) && !isNext && !isSelected;
                                            const IconComponent = prayer.icon;
                                            const prayerKey = prayer.name.toLowerCase();
                                            const hasReminder = !!prayerReminders[prayerKey];

                                            return (
                                                <button
                                                    key={prayer.id}
                                                    onClick={(e) => { e.stopPropagation(); handlePrayerSelect(prayer); }}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-3 rounded-2xl",
                                                        isSelected
                                                            ? "bg-islamic-gold/20 border-2 border-islamic-gold shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                                                            : isNext
                                                                ? "bg-islamic-gold/10 border border-islamic-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                                                                : isPast
                                                                    ? "opacity-40"
                                                                    : "bg-white/5 dark:bg-white/5 border border-transparent"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                                            isSelected
                                                                ? "bg-islamic-gold text-black"
                                                                : isNext
                                                                    ? "bg-islamic-gold text-black"
                                                                    : isPast
                                                                        ? "bg-gray-500/20 text-gray-400"
                                                                        : "bg-islamic-green/10 dark:bg-white/10 text-islamic-green dark:text-islamic-gold"
                                                        )}>
                                                            <IconComponent size={18} />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className={cn(
                                                                "font-bold text-sm",
                                                                isSelected || isNext
                                                                    ? "text-islamic-gold"
                                                                    : isPast
                                                                        ? "text-gray-400"
                                                                        : "text-gray-800 dark:text-white"
                                                            )}>
                                                                {prayer.name}
                                                            </p>
                                                            <p className={cn(
                                                                "text-[10px] font-medium",
                                                                isSelected
                                                                    ? "text-islamic-gold/80"
                                                                    : isNext
                                                                        ? "text-islamic-gold/70"
                                                                        : "text-gray-400"
                                                            )}>
                                                                {isSelected ? t('prayerCard.selected') : isNext ? t('prayerCard.nextPrayer') : isPast ? t('prayerCard.passed') : t('prayerCard.tapToSelect')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {/* Bell icon for reminder */}
                                                        {!isPast && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!isPremium()) { navigate('/premium'); return; }
                                                                    setSelectedPrayerForReminder(prayer);
                                                                }}
                                                                className={cn(
                                                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                                                    "transition-colors duration-150",
                                                                    hasReminder
                                                                        ? "bg-islamic-gold/20 text-islamic-gold"
                                                                        : "bg-white/5 text-gray-400 hover:text-islamic-gold hover:bg-white/10"
                                                                )}
                                                            >
                                                                <Bell size={16} fill={hasReminder ? "currentColor" : "none"} className="transition-none" />
                                                            </button>
                                                        )}
                                                        <div className={cn(
                                                            "text-lg font-mono font-bold tabular-nums",
                                                            isSelected || isNext
                                                                ? "text-islamic-gold"
                                                                : isPast
                                                                    ? "text-gray-400 line-through"
                                                                    : "text-gray-700 dark:text-white/80"
                                                        )}>
                                                            {prayer.time}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Reminder Options Modal - Full Screen Portal */}
            <AnimatePresence>
                {showReminderOptions && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowReminderOptions(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="w-full max-w-sm bg-[#fdfaf5] dark:bg-[#044d29] rounded-[2rem] shadow-2xl overflow-hidden border border-white/10 pointer-events-auto">
                                <div className="p-6 pb-2 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20">
                                    <div>
                                        <h3 className="text-lg font-bold font-serif text-gray-800 dark:text-white">{t('reminder.title')}</h3>
                                        {alarmSet ? (
                                            <p className="text-[10px] text-islamic-gold font-bold mt-1">
                                                {t('reminder.currentlySelected', { time: selectedMinutes === 0 ? t('reminder.onTime') : t('reminder.minutesBefore', { count: selectedMinutes }) })}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-500 dark:text-emerald-100/60 font-medium">
                                                {t('reminder.forPrayer', { prayer: nextPrayerInfo?.name })}
                                            </p>
                                        )}
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-black/5 dark:bg-white/10" onClick={() => setShowReminderOptions(false)}>
                                        <X size={16} />
                                    </Button>
                                </div>
                                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                                    {[
                                        { label: t('reminder.minutesBefore', { count: 15 }), val: 15, icon: Bell },
                                        { label: t('reminder.minutesBefore', { count: 30 }), val: 30, icon: Bell },
                                        { label: t('reminder.minutesBefore', { count: 45 }), val: 45, icon: Bell },
                                    ].map((opt) => {
                                        const isSelected = alarmSet && selectedMinutes === opt.val;
                                        return (
                                            <button
                                                key={opt.val}
                                                onClick={() => handleSetReminder(opt.val)}
                                                className={cn(
                                                    "w-full text-left px-4 py-3.5 text-sm font-bold rounded-2xl transition-all flex items-center justify-between group active:scale-98 border",
                                                    isSelected
                                                        ? "bg-islamic-gold/10 border-islamic-gold text-islamic-green dark:text-islamic-gold"
                                                        : "hover:bg-islamic-gold/10 dark:hover:bg-white/5 text-gray-700 dark:text-white border-transparent hover:border-islamic-gold/30"
                                                )}
                                            >
                                                <span className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                                        isSelected
                                                            ? "bg-islamic-gold text-white"
                                                            : "bg-islamic-green/10 dark:bg-emerald-500/10 text-islamic-green dark:text-emerald-400 group-hover:bg-islamic-gold group-hover:text-white"
                                                    )}>
                                                        {isSelected ? <Check size={14} /> : <opt.icon size={14} />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span>{opt.label}</span>
                                                        {isSelected && <span className="text-[10px] opacity-70">{t('reminder.alreadySelected')}</span>}
                                                    </div>
                                                </span>
                                                <ChevronRight size={16} className={cn(isSelected ? "text-islamic-gold" : "text-gray-300 group-hover:text-islamic-gold")} />
                                            </button>
                                        );
                                    })}

                                    {alarmSet && (
                                        <button
                                            onClick={handleRemoveReminder}
                                            className="w-full mt-4 flex items-center justify-center gap-2 py-3 text-red-500 dark:text-fuchsia-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors border border-red-100 dark:border-red-900/20"
                                        >
                                            <Trash2 size={14} />
                                            {t('reminder.resetReminder')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Prayer-Specific Reminder Modal */}
            <AnimatePresence>
                {selectedPrayerForReminder && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="fixed inset-0 z-[100] bg-black/60"
                            onClick={() => setSelectedPrayerForReminder(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="w-full max-w-sm bg-[#fdfaf5] dark:bg-[#044d29] rounded-[2rem] shadow-2xl overflow-hidden border border-white/10 pointer-events-auto">
                                <div className="p-6 pb-2 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20">
                                    <div>
                                        <h3 className="text-lg font-bold font-serif text-gray-800 dark:text-white">{t('reminder.title')}</h3>
                                        <p className="text-xs text-gray-500 dark:text-emerald-100/60 font-medium">
                                            {t('reminder.forPrayer', { prayer: selectedPrayerForReminder.name })}
                                        </p>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-black/5 dark:bg-white/10" onClick={() => setSelectedPrayerForReminder(null)}>
                                        <X size={16} />
                                    </Button>
                                </div>
                                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                                    {[
                                        { label: t('reminder.minutesBefore', { count: 15 }), val: 15, icon: Bell },
                                        { label: t('reminder.minutesBefore', { count: 30 }), val: 30, icon: Bell },
                                        { label: t('reminder.minutesBefore', { count: 45 }), val: 45, icon: Bell },
                                    ].map((opt) => {
                                        const currentReminder = prayerReminders[selectedPrayerForReminder.name.toLowerCase()];
                                        const isSelected = currentReminder?.mins === opt.val;
                                        return (
                                            <button
                                                key={opt.val}
                                                onClick={() => handleSetPrayerReminder(selectedPrayerForReminder, opt.val)}
                                                className={cn(
                                                    "w-full text-left px-4 py-3.5 text-sm font-bold rounded-2xl flex items-center justify-between group border",
                                                    "transition-colors duration-150",
                                                    isSelected
                                                        ? "bg-islamic-gold/10 border-islamic-gold text-islamic-green dark:text-islamic-gold"
                                                        : "hover:bg-islamic-gold/10 dark:hover:bg-white/5 text-gray-700 dark:text-white border-transparent hover:border-islamic-gold/30"
                                                )}
                                            >
                                                <span className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150",
                                                        isSelected
                                                            ? "bg-islamic-gold text-white"
                                                            : "bg-islamic-green/10 dark:bg-emerald-500/10 text-islamic-green dark:text-emerald-400 group-hover:bg-islamic-gold group-hover:text-white"
                                                    )}>
                                                        {isSelected ? <Check size={14} /> : <opt.icon size={14} />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span>{opt.label}</span>
                                                        {isSelected && <span className="text-[10px] opacity-70">{t('reminder.alreadySelected')}</span>}
                                                    </div>
                                                </span>
                                                <ChevronRight size={16} className="opacity-50" />
                                            </button>
                                        );
                                    })}

                                    {/* Remove reminder button */}
                                    {prayerReminders[selectedPrayerForReminder.name.toLowerCase()] && (
                                        <button
                                            onClick={() => {
                                                handleRemovePrayerReminder(selectedPrayerForReminder);
                                                setSelectedPrayerForReminder(null);
                                            }}
                                            className="w-full text-left px-4 py-3.5 text-sm font-bold rounded-2xl transition-all flex items-center justify-between group active:scale-98 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 mt-4"
                                        >
                                            <span className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                                                    <Trash2 size={14} />
                                                </div>
                                                <span>{t('reminder.removeReminder')}</span>
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
});

// --- Religious Calendar Widget ---
// --- Religious Calendar Widget (Vertical Timeline) ---
// --- Religious Calendar Widget (Compact & Modal) ---
export const ReligiousCalendarWidget = memo(({ days }) => {
    const [showModal, setShowModal] = useState(false);
    const { selection, heavy } = useHaptics();
    const { t, i18n } = useTranslation('home');
    const lang = (i18n.language || 'en').split('-')[0];

    // Normalize today to local midnight
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Data Parsing and Filtering
    const upcoming = days
        .map(d => {
            const dateObj = new Date(d.date);
            // Construct the event's local midnight date using UTC components
            const eventMidnight = new Date(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());
            const dayDiff = Math.round((eventMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

            return { ...d, dateObj, eventMidnight, dayDiff };
        })
        .filter(d => d.dayDiff >= 0) // Strictly hide past events
        .sort((a, b) => a.dayDiff - b.dayDiff);

    const nextEvent = upcoming[0];
    if (!nextEvent) return null;

    const diff = nextEvent.dayDiff;

    const months = t('calendar.months', { returnObjects: true });
    const formatDate = (date) => {
        return `${date.getUTCDate()} ${months[date.getUTCMonth()]}`;
    };

    // diff <= 0 means event is today or started yesterday evening (Islamic days begin at Maghrib)
    const diffLabel = diff <= 0 ? (lang === 'tr' ? 'Bugün gerçekleşiyor' : t('calendar.today'))
        : diff === 1 ? (lang === 'tr' ? 'Yarın' : t('calendar.tomorrow'))
            : (lang === 'tr' ? `${diff} Gün Kaldı` : t('calendar.daysLeft', { count: diff }));

    // Body Scroll Lock
    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showModal]);

    return (
        <>
            <motion.div variants={itemVariants} className="space-y-2">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-bold font-serif text-gray-400 dark:text-emerald-100/60 uppercase tracking-widest">
                        {t('calendar.title')}
                    </h3>
                </div>

                {/* COMPACT WIDGET */}
                <Card
                    className="glass-panel border-none p-5 relative overflow-hidden group active:scale-[0.98] transition-all duration-300 cursor-pointer"
                    onClick={() => { selection(); setShowModal(true); analytics.takvimViewed(); }}
                >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-islamic-gold to-transparent" />

                    <div className="flex justify-between items-center relative z-10">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-islamic-gold uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-islamic-gold animate-pulse" />
                                {t('calendar.next')}
                            </span>
                            <h4 className="text-xl font-serif font-bold text-gray-800 dark:text-white leading-tight">
                                {nextEvent[`name_${lang}`] || nextEvent.name}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-emerald-100/50 font-medium">
                                {formatDate(nextEvent.dateObj)} • <span className="text-islamic-green dark:text-islamic-gold">{diffLabel}</span>
                            </p>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="bg-islamic-green/10 dark:bg-islamic-gold/10 text-islamic-green dark:text-islamic-gold hover:bg-islamic-green/20 dark:hover:bg-islamic-gold/20 rounded-xl h-10 px-4 font-bold text-xs uppercase tracking-wide transition-colors pointer-events-none"
                        >
                            {t('calendar.showAll')}
                        </Button>
                    </div>
                </Card>
            </motion.div>

            {/* FULL SCREEN MODAL */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-[#F9F8F3] dark:bg-[#021a0f] w-full max-w-md h-[80vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start bg-gradient-to-b from-[#F9F8F3] dark:from-[#021a0f] to-transparent pointer-events-none">
                                <div className="pointer-events-auto">
                                    <h2 className="text-2xl font-serif font-bold text-islamic-green dark:text-islamic-gold drop-shadow-sm">
                                        {t('calendar.modalTitle')}
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-emerald-100/40 font-bold uppercase tracking-widest mt-1">
                                        {t('calendar.modalSubtitle')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { heavy(); setShowModal(false); }}
                                    className="pointer-events-auto bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full p-2 transition-colors active:scale-95"
                                >
                                    <X className="w-6 h-6 text-gray-800 dark:text-white" />
                                </button>
                            </div>

                            {/* Scrollable Timeline */}
                            <div className="flex-1 overflow-y-auto pt-28 pb-10 px-8 custom-scrollbar relative">
                                {/* Timeline Line */}
                                <div className="absolute left-[47px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-white/5" />

                                <div className="space-y-10">
                                    {upcoming.map((day, i) => {
                                        const dayDiff = day.dayDiff;

                                        // Badge label based on user request
                                        let badgeText = '';
                                        if (dayDiff <= 0) {
                                            badgeText = lang === 'tr' ? 'BUGÜN GERÇEKLEŞİYOR' : t('calendar.today').toUpperCase();
                                        } else if (dayDiff === 1) {
                                            badgeText = lang === 'tr' ? 'YARIN' : t('calendar.tomorrow').toUpperCase();
                                        } else {
                                            badgeText = lang === 'tr' ? `${dayDiff} GÜN KALDI` : t('calendar.daysLeft', { count: dayDiff }).toUpperCase();
                                        }

                                        const isFirst = i === 0;
                                        return (
                                            <motion.div
                                                key={day.name}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="relative pl-10 group"
                                            >
                                                {/* Dot */}
                                                <div className={cn(
                                                    "absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 transition-all duration-300 z-10",
                                                    isFirst
                                                        ? "bg-islamic-gold border-islamic-gold shadow-[0_0_15px_rgba(212,175,55,0.6)] scale-125"
                                                        : "bg-[#F9F8F3] dark:bg-[#021a0f] border-gray-300 dark:border-white/20 group-hover:border-islamic-gold/50"
                                                )}>
                                                    {isFirst && <div className="absolute inset-0 bg-islamic-gold blur-sm animate-pulse" />}
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-baseline">
                                                        <h4 className={cn(
                                                            "text-lg font-serif font-bold transition-colors",
                                                            isFirst ? "text-islamic-green dark:text-islamic-gold" : "text-gray-700 dark:text-gray-300"
                                                        )}>
                                                            {day[`name_${lang}`] || day.name}
                                                        </h4>
                                                        {(isFirst || dayDiff <= 30) && (
                                                            <span className={cn(
                                                                "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-2 shrink-0",
                                                                dayDiff <= 0 ? "bg-islamic-green text-white dark:bg-islamic-gold dark:text-black"
                                                                    : "bg-islamic-gold/10 text-islamic-gold"
                                                            )}>
                                                                {badgeText}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-sm font-medium text-gray-500 dark:text-emerald-100/50">
                                                        {new Date(day.dateObj.getUTCFullYear(), day.dateObj.getUTCMonth(), day.dateObj.getUTCDate()).toLocaleDateString(lang, { day: 'numeric', month: 'long' })}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}

                                    {/* End of List Decoration */}
                                    <div className="pt-8 text-center opacity-30">
                                        <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-white rounded-full mx-auto" />
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Fade */}
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F9F8F3] dark:from-[#021a0f] to-transparent pointer-events-none" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
});

// --- Prayer Celebration Components ---
const PrayerConfetti = () => {
    const [particles] = useState(() => Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        angle: (i / 20) * (Math.PI * 2),
        velocity: 0.5 + Math.random() * 1.5,
        size: 4 + Math.random() * 6,
        color: i % 2 === 0 ? "#D4AF37" : "#10b981",
        delay: Math.random() * 0.2
    })));

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ x: "50%", y: "50%", scale: 0, opacity: 1 }}
                    animate={{
                        x: [
                            "50%",
                            `${50 + Math.cos(p.angle) * 100 * p.velocity}%`,
                            `${50 + Math.cos(p.angle) * 150 * p.velocity}%`
                        ],
                        y: [
                            "50%",
                            `${50 + Math.sin(p.angle) * 100 * p.velocity}%`,
                            `${50 + Math.sin(p.angle) * 200 * p.velocity}%`
                        ],
                        scale: [0, 1.2, 0.5, 0],
                        opacity: [1, 1, 0.8, 0],
                        rotate: [0, 180, 360]
                    }}
                    transition={{
                        duration: 1.5 + Math.random(),
                        ease: "easeOut",
                        delay: p.delay
                    }}
                    className="absolute rounded-sm"
                    style={{
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        boxShadow: `0 0 10px ${p.color}80`
                    }}
                />
            ))}
        </div>
    );
};


const ProgressRing = memo(({ progress, isAllDone }) => {
    // Dynamic gold intensity: muted at low progress → vibrant at high
    const intensity = Math.min(progress / 100, 1);
    const strokeColor = `rgba(${Math.round(160 + intensity * 52)}, ${Math.round(140 + intensity * 35)}, ${Math.round(30 + intensity * 25)}, ${(0.35 + intensity * 0.65).toFixed(2)})`;

    return (
        <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 50 50">
                <circle
                    cx="25" cy="25" r="20"
                    fill="none"
                    stroke="rgba(212, 175, 55, 0.08)"
                    strokeWidth="4"
                />
                <motion.circle
                    cx="25" cy="25" r="20"
                    fill="none"
                    stroke={isAllDone ? undefined : strokeColor}
                    className={cn(
                        "transition-colors duration-500",
                        isAllDone && "stroke-islamic-gold"
                    )}
                    strokeWidth="4"
                    strokeDasharray="125.6"
                    initial={{ strokeDashoffset: 125.6 }}
                    animate={{
                        strokeDashoffset: 125.6 - (125.6 * progress) / 100,
                        strokeWidth: isAllDone ? 0 : 4
                    }}
                    transition={{ duration: 1, ease: "circOut" }}
                    strokeLinecap="round"
                />
            </svg>

            <AnimatePresence mode="wait">
                {isAllDone ? (
                    <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-islamic-gold rounded-full shadow-lg shadow-islamic-gold/40"
                    >
                        <Check className="w-7 h-7 text-[#032e18]" strokeWidth={4} />
                    </motion.div>
                ) : (
                    <motion.span
                        key="text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute text-[10px] font-bold text-islamic-gold"
                    >
                        {Math.round(progress)}%
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    );
});

// --- Prayer Streak Badge ---
export const PrayerStreakBadge = memo(({ currentStreak, longestStreak, message }) => {
    const { t } = useTranslation('home');
    const hasStreak = currentStreak > 0;
    const isOnFire = currentStreak >= 7;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
        >
            <div className={cn(
                "relative flex items-center justify-between p-4 rounded-2xl transition-all duration-500",
                hasStreak
                    ? "bg-gradient-to-r from-amber-500/10 via-islamic-gold/15 to-amber-500/10 border border-islamic-gold/20"
                    : "bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10"
            )}>
                {/* Glow effect for high streaks */}
                {isOnFire && (
                    <motion.div
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-islamic-gold/30 to-amber-400/20 rounded-2xl blur-sm"
                    />
                )}

                {/* Left: Streak Counter */}
                <div className="flex items-center gap-3 relative z-10">
                    <motion.div
                        animate={hasStreak ? {
                            scale: [1, 1.1, 1],
                            rotate: isOnFire ? [0, -5, 5, 0] : 0
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            hasStreak
                                ? "bg-gradient-to-br from-amber-400 to-islamic-gold shadow-lg shadow-islamic-gold/30"
                                : "bg-gray-200 dark:bg-white/10"
                        )}
                    >
                        <Flame className={cn(
                            "w-6 h-6",
                            hasStreak ? "text-white" : "text-gray-400"
                        )} />
                    </motion.div>

                    <div>
                        <div className="flex items-baseline gap-1.5">
                            <motion.span
                                key={currentStreak}
                                initial={{ scale: 1.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={cn(
                                    "text-2xl font-black",
                                    hasStreak ? "text-islamic-gold" : "text-gray-400"
                                )}
                            >
                                {currentStreak}
                            </motion.span>
                            <span className={cn(
                                "text-sm font-bold",
                                hasStreak ? "text-amber-600 dark:text-amber-300" : "text-gray-400"
                            )}>
                                {t('streak.dayStreak')}
                            </span>
                        </div>
                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            {t('streak.highest', { count: longestStreak })}
                        </p>
                    </div>
                </div>

                {/* Right: Motivational Message */}
                <div className="text-right relative z-10">
                    <span className="text-lg">{message?.emoji || '🌱'}</span>
                    <p className={cn(
                        "text-[10px] font-bold uppercase tracking-wide mt-1",
                        hasStreak ? "text-islamic-gold" : "text-gray-400"
                    )}>
                        {message?.text || t('streak.start')}
                    </p>
                </div>
            </div>
        </motion.div>
    );
});

// --- Daily Prayer Checklist ---
// --- Refined Daily Prayer Checklist ---
export const DailyPrayerChecklist = memo(({ prayerTimes, completedPrayers, loading, onToggle, streakData }) => {
    const { selection, success, vibrate } = useHaptics();
    const { settings } = usePrayerTimes();

    // Prayer Reward Modal State
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [rewardContent, setRewardContent] = useState(null);
    const [completedPrayerName, setCompletedPrayerName] = useState('');

    const { t } = useTranslation('home');

    // Calculate Progress
    const total = 5; // Fajr, Dhuhr, Asr, Maghrib, Isha
    const rawCurrent = completedPrayers.length;
    const current = Math.min(rawCurrent, total);
    const progress = Math.min((rawCurrent / total) * 100, 100);
    const isAllDone = rawCurrent >= total;

    // Filter out sun/imsak for the checklist
    const prayers = useMemo(() =>
        prayerTimes?.filter(p => p.id !== 'sunrise') || [],
        [prayerTimes]);

    const handleToggle = (prayerId) => {
        // Haptic feedback logic
        const wasCompleted = completedPrayers.includes(prayerId);

        if (wasCompleted) {
            // Unchecking - just light feedback
            selection();
        } else {
            // Check if this is the final (5th) prayer
            if (current === 4) {
                // Special Haptic for final completion: Double tap + Long buzz
                vibrate([50, 30, 50, 30, 100]);
            } else {
                success();
            }

            // Get spiritual reward content (uses ID for dua occasion matching)
            const content = PRAYER_CONTENT.getRewardContent(prayerId);
            setRewardContent(content);
            // Resolve prayer ID to localized display name for the modal
            const displayName = prayers.find(p => p.id === prayerId)?.name || prayerId;
            setCompletedPrayerName(displayName);

            // Show modal after brief delay for better UX - ONLY IF ENABLED
            const isRewardsEnabled = settings?.spiritualRewards ?? true;
            if (isRewardsEnabled) {
                setTimeout(() => {
                    setShowRewardModal(true);
                }, 300);
            }
        }

        onToggle(prayerId);
    };

    return (
        <motion.div variants={itemVariants} className="pb-10">
            {/* Streak Badge */}
            {streakData && (
                <PrayerStreakBadge
                    currentStreak={streakData.currentStreak}
                    longestStreak={streakData.longestStreak}
                    message={streakData.message}
                />
            )}

            {/* Header with Progress */}
            <AnimatePresence mode="wait">
                {isAllDone ? (
                    <motion.div
                        key="completed-header"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="relative flex flex-col items-center justify-center py-8 px-4 mb-6"
                    >
                        {/* Nur (Light) Ray Effect */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-gradient-radial from-amber-500/10 via-transparent to-transparent rounded-3xl"
                        />

                        {/* Ornate Star Badge */}
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 0.8, ease: "backOut" }}
                            className="relative mb-4 z-10"
                        >
                            {/* Breathing glow */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.15, 1],
                                    opacity: [0.6, 0.9, 0.6]
                                }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 bg-gradient-to-br from-amber-300 to-yellow-600 rounded-full blur-lg"
                            />

                            {/* Star Badge Container */}
                            <div className="relative w-20 h-20 bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.5)]">
                                <Check className="w-10 h-10 text-white drop-shadow-md" strokeWidth={3.5} />
                            </div>
                        </motion.div>

                        {/* Calligraphic Typography */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="text-center relative z-10"
                        >
                            {/* Main Heading with Gradient */}
                            <motion.h2
                                animate={{
                                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                                }}
                                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                className="text-3xl font-serif font-bold tracking-wider mb-2 bg-gradient-to-r from-amber-200 via-yellow-300 via-amber-400 to-amber-200 bg-clip-text text-transparent drop-shadow-sm"
                                style={{ backgroundSize: "200% 100%" }}
                            >
                                {t('dailyWorship.allDoneTitle')}
                            </motion.h2>

                            {/* Subtitle */}
                            <p className="text-base font-serif italic text-amber-300/90 dark:text-amber-200/70 tracking-wide">
                                {t('dailyWorship.allDoneSub')}
                            </p>
                        </motion.div>

                        {/* Decorative Divider */}
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                            className="mt-6 w-32 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="progress-header"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-between items-center px-4 mb-6"
                    >
                        <motion.div layout>
                            <h3 className="text-[10px] font-bold font-serif text-gray-400 dark:text-emerald-100/40 uppercase tracking-[0.2em] mb-1">
                                {t('dailyWorship.title')}
                            </h3>
                            <h2 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
                                {t('dailyWorship.completed', { current, total })}
                            </h2>
                        </motion.div>
                        <ProgressRing progress={progress} isAllDone={isAllDone} />
                    </motion.div>
                )}
            </AnimatePresence>

            <Card className={cn(
                "border-none shadow-xl bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden text-black dark:text-white relative transition-all duration-1000",
                isAllDone && "ring-2 ring-islamic-gold/50 shadow-[0_20px_50px_rgba(212,175,55,0.15)] dark:shadow-[0_20px_50px_rgba(212,175,55,0.08)]"
            )}>
                {/* Celebration Assets */}
                <AnimatePresence>
                    {isAllDone && (
                        <>
                            <PrayerConfetti />
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: [0.3, 0.6, 0.3],
                                    scale: [1, 1.05, 1]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute inset-0 bg-gradient-to-br from-islamic-gold/10 via-transparent to-islamic-green/10 z-0 pointer-events-none"
                            />
                        </>
                    )}
                </AnimatePresence>

                {loading ? (
                    <LoadingPlaceholder />
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-white/5 relative z-10">
                        {prayers.map((prayer) => {
                            const isDone = completedPrayers.includes(prayer.id);
                            return (
                                <motion.div
                                    key={prayer.id}
                                    initial={false}
                                    animate={{ backgroundColor: isDone ? "rgba(212, 175, 55, 0.05)" : "transparent" }}
                                    onClick={() => handleToggle(prayer.id)}
                                    className="flex items-center justify-between p-5 cursor-pointer group active:scale-[0.99] transition-transform"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                            isDone
                                                ? "bg-islamic-green text-white shadow-lg shadow-islamic-green/30 dark:bg-islamic-gold dark:text-[#032e18] dark:shadow-islamic-gold/20 scale-110"
                                                : "bg-gray-100 dark:bg-white/10 text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-white/20"
                                        )}>
                                            <prayer.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className={cn(
                                                "font-bold text-lg transition-colors duration-300",
                                                isDone ? "text-islamic-green dark:text-islamic-gold" : "text-gray-700 dark:text-white"
                                            )}>
                                                {prayer.name}
                                            </p>
                                            <p className="text-xs text-gray-400 font-medium tracking-wide">
                                                {prayer.time}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Animated Checkbox */}
                                    <div className={cn(
                                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                                        isDone
                                            ? "border-islamic-green bg-islamic-green dark:border-islamic-gold dark:bg-islamic-gold scale-110 rotate-0"
                                            : "border-gray-300 dark:border-white/20 rotate-[-15deg] group-hover:border-islamic-gold/50"
                                    )}>
                                        <AnimatePresence>
                                            {isDone && (
                                                <motion.div
                                                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                                >
                                                    <CheckCircle2 className="w-5 h-5 text-white dark:text-[#032e18]" strokeWidth={3} />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Prayer Reward Modal */}
            <PrayerRewardModal
                isOpen={showRewardModal}
                onClose={() => setShowRewardModal(false)}
                content={rewardContent}
                prayerName={completedPrayerName}
            />
        </motion.div>
    );
});

// --- Quick Action Item ---
export const TasbihIcon = memo(({ className, size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Connector Ring (Subtle) */}
        <circle cx="12" cy="10" r="7" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2" />

        {/* Beads with 3D-effect Highlights */}
        {[...Array(12)].map((_, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            const cx = 12 + 7 * Math.cos(angle - Math.PI / 2);
            const cy = 10 + 7 * Math.sin(angle - Math.PI / 2);
            return (
                <g key={i}>
                    {/* Main Bead */}
                    <circle cx={cx} cy={cy} r="2" fill="currentColor" />
                    {/* Glossy Highlight */}
                    <circle cx={cx - 0.6} cy={cy - 0.6} r="0.6" fill="white" fillOpacity="0.4" />
                </g>
            );
        })}

        {/* Imame (The main joiner piece) */}
        <path
            d="M12 16.5 C13.5 16.5 14 18 14 19 C14 20 13 21 12 21 C11 21 10 20 10 19 C10 18 10.5 16.5 12 16.5 Z"
            fill="currentColor"
        />
        <circle cx="12" cy="18.5" r="0.8" fill="white" fillOpacity="0.3" />

        {/* Tassel (Püskül) */}
        <path
            d="M12 21 L10 24 L14 24 Z"
            fill="currentColor"
            fillOpacity="0.9"
        />
        {/* Tassel Strands */}
        <line x1="11" y1="23.5" x2="11" y2="24" stroke="black" strokeWidth="0.3" strokeOpacity="0.2" />
        <line x1="12" y1="23.5" x2="12" y2="24" stroke="black" strokeWidth="0.3" strokeOpacity="0.2" />
        <line x1="13" y1="23.5" x2="13" y2="24" stroke="black" strokeWidth="0.3" strokeOpacity="0.2" />
    </svg>
));

export const QuickAction = memo(({ to, icon: Icon, label, color, subtitle, onClick }) => {
    const Component = to ? motion.a : motion.button;

    return (
        <Component
            href={to}
            onClick={onClick}
            variants={itemVariants}
            whileTap={{ scale: 0.95 }}
            className={cn(
                "flex flex-col items-start p-4 rounded-[2rem] gap-2 transition-all border-none shadow-sm min-h-[110px] w-full text-left relative overflow-hidden group hover:shadow-md",
                color
            )}
        >
            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform duration-500">
                <Icon className="w-6 h-6" />
            </div>
            <div className="mt-auto z-10">
                <p className="text-sm font-bold leading-tight font-serif tracking-wide">{label}</p>
                <p className="text-xs opacity-80 font-bold tracking-widest uppercase mt-1">{subtitle}</p>
            </div>

            {/* Shine Effect */}
            <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-[-150%] group-hover:animate-shine pointer-events-none" />
        </Component>
    );
});

// --- Simple Loading Placeholder (Replaced with Skeleton) ---
export const LoadingPlaceholder = () => (
    <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5 last:border-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl shimmer" />
                    <div className="space-y-2">
                        <div className="w-24 h-4 rounded shimmer" />
                        <div className="w-12 h-3 rounded shimmer" />
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full shimmer" />
            </div>
        ))}
    </div>
);

// --- Fasting Tracker Widget ---
const FASTING_REWARDS = [
    { min: 1, emoji: '🌱', text: 'İlk adım atıldı!' },
    { min: 3, emoji: '🌿', text: 'Harika gidiyorsun!' },
    { min: 7, emoji: '🌳', text: 'Bir hafta tamamlandı!' },
    { min: 15, emoji: '⭐', text: 'Yarı yol, müthiş!' },
    { min: 30, emoji: '🏆', text: 'Tam bir ay, masaAllah!' },
];

const RAMAZAN_START = new Date(2026, 1, 19); // Feb 19, 2026 local
const RAMAZAN_END = new Date(2026, 2, 20);   // Mar 20, 2026 local (Bayram 1. gün)

const getFastingData = () => {
    try {
        const raw = localStorage.getItem('fasting_data');
        if (raw) return JSON.parse(raw);
    } catch { }
    return { days: [], streak: 0, longestStreak: 0 };
};

const saveFastingData = (data) => {
    localStorage.setItem('fasting_data', JSON.stringify(data));
};

export const FastingTrackerWidget = memo(() => {
    const { selection, success } = useHaptics();
    const { t } = useTranslation('home');
    const [data, setData] = useState(getFastingData);
    const today = getTodayString();

    const isFastedToday = data.days.includes(today);

    // Ramazan bilgisi
    const now = getAppDate();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isRamazan = todayLocal >= RAMAZAN_START && todayLocal < RAMAZAN_END;
    const ramazanDay = isRamazan
        ? Math.floor((todayLocal - RAMAZAN_START) / (1000 * 60 * 60 * 24)) + 1
        : null;

    // Streak hesapla
    const calculateStreak = useCallback((days) => {
        if (days.length === 0) return 0;
        const sorted = [...days].sort().reverse();
        let streak = 0;
        const check = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        for (let i = 0; i < sorted.length; i++) {
            const [y, m, d] = sorted[i].split('-').map(Number);
            const dayDate = new Date(y, m - 1, d);
            const diffDays = Math.round((check - dayDate) / (1000 * 60 * 60 * 24));

            if (diffDays === i) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }, [now]);

    const handleToggle = useCallback(() => {
        setData(prev => {
            let newDays;
            if (prev.days.includes(today)) {
                // Geri al
                selection();
                newDays = prev.days.filter(d => d !== today);
            } else {
                // İşaretle
                success();
                newDays = [...prev.days, today];
            }
            const streak = calculateStreak(newDays);
            const longestStreak = Math.max(prev.longestStreak, streak);
            const newData = { days: newDays, streak, longestStreak };
            saveFastingData(newData);
            return newData;
        });
    }, [today, selection, success, calculateStreak]);

    // Streak'e göre ödül mesajı
    const reward = useMemo(() => {
        const rewards = t('fasting.rewards', { returnObjects: true });
        const streak = calculateStreak(data.days);
        const rewardsList = FASTING_REWARDS.map((r, i) => ({ ...r, text: rewards[i] || r.text }));
        let best = rewardsList[0];
        for (const r of rewardsList) {
            if (streak >= r.min) best = r;
        }
        return streak > 0 ? best : null;
    }, [data.days, calculateStreak, t]);

    const currentStreak = calculateStreak(data.days);

    return (
        <motion.div variants={itemVariants} className="space-y-2">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-bold font-serif text-gray-400 dark:text-emerald-100/60 uppercase tracking-widest">
                    {t('fasting.title')}
                </h3>
                {currentStreak > 0 && (
                    <span className="text-[10px] font-bold text-islamic-gold flex items-center gap-1">
                        <Flame size={12} /> {t('fasting.longest', { count: data.longestStreak })}
                    </span>
                )}
            </div>

            <Card className="glass-panel border-none overflow-hidden relative">
                {/* İşaretlendiğinde altın glow */}
                {isFastedToday && (
                    <div className="absolute inset-0 bg-gradient-to-br from-islamic-gold/10 via-transparent to-islamic-gold/5 pointer-events-none" />
                )}

                <CardContent className="p-5 relative z-10">
                    <div className="flex items-center justify-between">
                        {/* Sol: Bilgi */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300",
                                isFastedToday
                                    ? "bg-islamic-gold shadow-lg shadow-islamic-gold/30"
                                    : "bg-islamic-green/10 dark:bg-white/5"
                            )}>
                                {isFastedToday ? (
                                    <Check className="w-7 h-7 text-[#021a0f]" strokeWidth={3} />
                                ) : (
                                    <span className="text-2xl">🌙</span>
                                )}
                            </div>

                            <div className="min-w-0">
                                {isRamazan && ramazanDay && (
                                    <span className="text-[10px] font-bold text-islamic-gold uppercase tracking-wider">
                                        {t('fasting.ramazanDay', { day: ramazanDay })}
                                    </span>
                                )}
                                <h4 className={cn(
                                    "font-bold text-base transition-colors duration-200",
                                    isFastedToday
                                        ? "text-islamic-gold"
                                        : "text-gray-800 dark:text-white"
                                )}>
                                    {isFastedToday ? t('fasting.fasted') : t('fasting.fastToday')}
                                </h4>
                                <p className="text-[11px] text-gray-500 dark:text-emerald-100/40 font-medium">
                                    {isFastedToday
                                        ? (reward ? `${reward.emoji} ${reward.text}` : t('fasting.accepted'))
                                        : t('fasting.markIt')
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Sağ: Toggle + Seri */}
                        <div className="flex items-center gap-3 shrink-0">
                            {currentStreak > 0 && (
                                <div className="text-center">
                                    <div className="text-lg font-black text-islamic-gold leading-none">{currentStreak}</div>
                                    <div className="text-[9px] font-bold text-gray-400 uppercase">{t('fasting.daySeries')}</div>
                                </div>
                            )}

                            <button
                                onClick={handleToggle}
                                className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90",
                                    isFastedToday
                                        ? "bg-islamic-gold/20 text-islamic-gold border-2 border-islamic-gold/40"
                                        : "bg-islamic-green/10 dark:bg-white/10 text-islamic-green dark:text-islamic-gold border-2 border-transparent hover:border-islamic-gold/30"
                                )}
                            >
                                {isFastedToday ? (
                                    <Check size={22} strokeWidth={3} />
                                ) : (
                                    <Moon size={22} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Son 7 gün mini takvim */}
                    {currentStreak > 0 && (
                        <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-white/5 justify-center">
                            {Array.from({ length: 7 }).map((_, i) => {
                                const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                d.setDate(d.getDate() - (6 - i));
                                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                const done = data.days.includes(key);
                                const isToday = key === today;
                                const dayNames = t('fasting.dayNames', { returnObjects: true });
                                return (
                                    <div key={key} className="flex flex-col items-center gap-1">
                                        <span className="text-[9px] font-medium text-gray-400">{dayNames[d.getDay()]}</span>
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all",
                                            done
                                                ? "bg-islamic-gold text-[#021a0f]"
                                                : isToday
                                                    ? "bg-white/10 text-white border border-islamic-gold/30"
                                                    : "bg-white/5 text-gray-500"
                                        )}>
                                            {d.getDate()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
});

