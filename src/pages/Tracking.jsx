import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, CheckCircle2, Plus, Minus, TrendingUp, Sparkles, Settings, BookOpen, Calendar, Eye, X, Calculator, Scale, Heart, AlertCircle, Edit2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { usePrayers } from '@/hooks/usePrayers';
import { usePrayerStreak } from '@/hooks/usePrayerStreak';
import { DailyPrayerChecklist } from '@/components/HomeComponents';
import Quran from './Quran';
import MurakabeTab from '@/components/MurakabeTab';
import { getDailyPrayersKey, getAppDate } from '@/lib/testDate';
import { safeGetStorage } from '@/utils/storageHelper';

const PRAYER_TYPES = [
    { key: 'sabah', label: 'Sabah' },
    { key: 'ogle', label: 'Öğle' },
    { key: 'ikindi', label: 'İkindi' },
    { key: 'aksam', label: 'Akşam' },
    { key: 'yatsi', label: 'Yatsı' },
    { key: 'vitir', label: 'Vitir' },
];

const TABS = [
    { id: 'namaz', label: 'Namaz', icon: Calendar },
    { id: 'kuran', label: 'Kur\'an', icon: BookOpen },
    { id: 'kaza', label: 'Kaza', icon: Target },
    { id: 'murakabe', label: 'Murakabe', icon: Eye },
];

export default function Tracking() {
    const { selection, impactMedium } = useHaptics();
    const { prayerTimes, loadingPrayers } = usePrayers();
    const { currentStreak, longestStreak, recordDayComplete, getStreakMessage } = usePrayerStreak();

    // Tab State
    const [activeTab, setActiveTab] = useState('namaz');

    // Prayer Checklist State
    const [completedPrayers, setCompletedPrayers] = useState([]);

    // Kaza State
    const [qadaCounts, setQadaCounts] = useState({
        sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0, vitir: 0
    });
    const [goal, setGoal] = useState(100);
    const [showCelebration, setShowCelebration] = useState(false);

    // Mizan (Balance) State
    const [balance, setBalance] = useState(0); // -10 (Left/Nefis) to +10 (Right/Ruh)
    // We will track raw counts to calculate ratio, but visualization depends on ratio
    const [nefisCount, setNefisCount] = useState(0);
    const [ruhCount, setRuhCount] = useState(0);

    // Goal Modal State
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [goalTab, setGoalTab] = useState('manual');
    const [manualGoal, setManualGoal] = useState(100);
    const [birthDate, setBirthDate] = useState('');
    const [pubertyAge, setPubertyAge] = useState(15);

    // Edit Modal State
    const [editingPrayer, setEditingPrayer] = useState(null); // { key: 'sabah', label: 'Sabah', value: 120 }
    const [editValue, setEditValue] = useState('');

    // Load initial data
    useEffect(() => {
        const prayerKey = getDailyPrayersKey();
        setCompletedPrayers(safeGetStorage(prayerKey, []));

        const savedQada = localStorage.getItem('qadaCounts');
        if (savedQada) setQadaCounts(JSON.parse(savedQada));

        const savedGoal = localStorage.getItem('qadaGoal');
        if (savedGoal) setGoal(parseInt(savedGoal, 10));

        // Load Mizan data for today
        const todayKey = getAppDate().toDateString();
        const savedMizan = safeGetStorage('mizan_data', {});
        if (savedMizan.date === todayKey) {
            setNefisCount(savedMizan.nefis || 0);
            setRuhCount(savedMizan.ruh || 0);
        }
    }, []);

    // Listen for prayer status changes from other components (e.g., Home popup)
    useEffect(() => {
        const handlePrayerStatusChange = () => {
            const prayerKey = getDailyPrayersKey();
            setCompletedPrayers(safeGetStorage(prayerKey, []));
        };

        window.addEventListener('prayerStatusChanged', handlePrayerStatusChange);
        return () => window.removeEventListener('prayerStatusChanged', handlePrayerStatusChange);
    }, []);

    // Save Mizan data
    useEffect(() => {
        const todayKey = getAppDate().toDateString();
        localStorage.setItem('mizan_data', JSON.stringify({
            date: todayKey,
            nefis: nefisCount,
            ruh: ruhCount
        }));
    }, [nefisCount, ruhCount]);

    // Calculate Balance Angle (-45deg to 45deg)
    const calculateRotation = () => {
        const total = nefisCount + ruhCount;
        if (total === 0) return 0;

        // Simple physics: heavier side goes DOWN
        // If Ruh > Nefis -> Scale rotates LEFT (Ruh side goes down? No usually right is good)
        // Let's standard: Left = Nefis (Bad), Right = Ruh (Good)
        // Heavier side goes down. 
        // If Nefis is heavier (Nefis > Ruh) -> Left goes down -> Rotation should be negative?

        // Let's visual:
        // Left Pan (Nefis) -- Center -- Right Pan (Ruh)
        // If Nefis heavier, Left Pan goes down (Counter-Clockwise / Negative rotation)
        // If Ruh heavier, Right Pan goes down (Clockwise / Positive rotation)

        const diff = ruhCount - nefisCount;
        // Max rotation at diff = 10
        const rotation = Math.max(-20, Math.min(20, diff * 2));
        return rotation;
    };

    const handleWeigh = (side) => {
        impactMedium();
        if (side === 'nefis') {
            setNefisCount(prev => prev + 1);
        } else {
            setRuhCount(prev => prev + 1);
        }
    };

    const resetMizan = () => {
        setNefisCount(0);
        setRuhCount(0);
    };

    // Prayer Toggle Handler
    const togglePrayer = useCallback((name) => {
        selection();
        const prayerKey = getDailyPrayersKey();

        setCompletedPrayers(prev => {
            const next = prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name];
            localStorage.setItem(prayerKey, JSON.stringify(next));

            // Check if all 5 prayers are completed (streak trigger)
            if (next.length === 5 && !prev.includes(name)) {
                recordDayComplete();
            }

            return next;
        });
    }, [selection, recordDayComplete]);

    // Kaza Counter Handlers
    const totalPaid = Object.values(qadaCounts).reduce((a, b) => a + b, 0);
    const progress = Math.min((totalPaid / goal) * 100, 100);

    const updateCount = (key, delta) => {
        const newCounts = { ...qadaCounts, [key]: Math.max(0, qadaCounts[key] + delta) };
        const newTotal = Object.values(newCounts).reduce((a, b) => a + b, 0);
        const newProgress = Math.min((newTotal / goal) * 100, 100);

        setQadaCounts(newCounts);
        localStorage.setItem('qadaCounts', JSON.stringify(newCounts));

        if (delta > 0) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 2000);
        }

        // Trigger confetti if we just hit 100%
        if (newProgress === 100 && progress < 100) {
            triggerCelebration();
        }
    };

    const triggerCelebration = () => {
        const end = Date.now() + 3000;
        const colors = ['#D4AF37', '#10B981', '#ffffff'];

        (function frame() {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors,
                zIndex: 9999 // High z-index to show over modals
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors,
                zIndex: 9999
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    };

    // Goal Calculation Logic
    const calculateMissedPrayers = () => {
        if (!birthDate) return 0;

        try {
            const responsibilityDate = new Date(birthDate);
            if (isNaN(responsibilityDate.getTime())) return 0;

            responsibilityDate.setFullYear(responsibilityDate.getFullYear() + pubertyAge);

            const today = new Date();
            const diffTime = today - responsibilityDate;
            if (diffTime < 0) return 0;

            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        } catch (e) {
            console.error('Date calculation error:', e);
            return 0;
        }
    };

    const handleSaveGoal = () => {
        let newGoal;
        if (goalTab === 'manual') {
            newGoal = parseInt(manualGoal, 10) || 100;
        } else {
            newGoal = calculateMissedPrayers();
        }
        setGoal(newGoal);
        localStorage.setItem('qadaGoal', newGoal.toString());
        setShowGoalModal(false);
        selection();
    };

    const openEditModal = (prayer) => {
        selection();
        setEditingPrayer(prayer);
        setEditValue(qadaCounts[prayer.key].toString());
    };

    const handleEditSave = () => {
        if (!editingPrayer) return;
        const newValue = parseInt(editValue, 10);
        if (isNaN(newValue) || newValue < 0) return;

        const newCounts = { ...qadaCounts, [editingPrayer.key]: newValue };
        setQadaCounts(newCounts);
        localStorage.setItem('qadaCounts', JSON.stringify(newCounts));

        // Recalculate progress/confetti logic if needed (optional)
        const newTotal = Object.values(newCounts).reduce((a, b) => a + b, 0);
        const newProgress = Math.min((newTotal / goal) * 100, 100);
        if (newProgress === 100 && progress < 100) triggerCelebration();

        setEditingPrayer(null);
        selection();
    };

    // Circular Progress Component for Kaza
    const CircularProgress = ({ value }) => {
        const radius = 70; // Increased size slightly
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (value / 100) * circumference;

        return (
            <div className="relative flex items-center justify-center w-48 h-48">
                {/* Glow Filter Definition */}
                <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                    <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#D4AF37" />
                            <stop offset="50%" stopColor="#FCD34D" />
                            <stop offset="100%" stopColor="#D4AF37" />
                        </linearGradient>
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                </svg>

                <svg className="w-full h-full -rotate-90 drop-shadow-xl">
                    {/* Background Circle */}
                    <circle
                        cx="96" cy="96" r={radius}
                        fill="transparent"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="12"
                    />

                    {/* Progress Circle with Gradient & Glow */}
                    <circle
                        cx="96" cy="96" r={radius}
                        fill="transparent"
                        stroke="url(#progressGradient)"
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        filter="url(#glow)"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                {/* Inner Content */}
                <div className="absolute flex flex-col items-center justify-center">
                    <div className="relative">
                        <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-islamic-gold drop-shadow-sm">
                            {value.toFixed(0)}%
                        </span>
                    </div>
                    <span className="text-[10px] text-emerald-100/80 uppercase tracking-[0.2em] font-bold mt-1 shadow-black/20 text-shadow-sm">
                        İlerleme
                    </span>

                    {/* Tiny decorative dots */}
                    {value >= 100 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-6 text-islamic-gold"
                        >
                            <Sparkles size={20} className="animate-pulse" />
                        </motion.div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 p-5 pb-24">


            {/* Tab Navigation */}
            <div className="glass-panel rounded-3xl p-2 grid grid-cols-4 gap-1">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <motion.button
                            key={tab.id}
                            onClick={() => {
                                selection();
                                setActiveTab(tab.id);
                            }}
                            className={cn(
                                "relative px-3 py-3 overflow-hidden rounded-2xl font-bold text-xs uppercase tracking-wider transition-all",
                                isActive
                                    ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] shadow-lg"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                            )}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Icon className={cn("w-5 h-5 mx-auto mb-1", isActive && "drop-shadow-md")} />
                            <span className="text-[10px]">{tab.label}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'namaz' && (
                    <motion.div
                        key="namaz"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <DailyPrayerChecklist
                            prayerTimes={prayerTimes}
                            completedPrayers={completedPrayers}
                            loading={loadingPrayers}
                            onToggle={togglePrayer}
                            streakData={{
                                currentStreak,
                                longestStreak,
                                message: getStreakMessage()
                            }}
                        />
                    </motion.div>
                )}

                {activeTab === 'kuran' && (
                    <motion.div
                        key="kuran"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Quran />
                    </motion.div>
                )}

                {activeTab === 'kaza' && (
                    <motion.div
                        key="kaza"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Kaza Content (Same as before) */}
                        <Card className="border-none shadow-2xl bg-gradient-to-br from-islamic-green to-[#033a1f] dark:from-[#064e3b] dark:to-[#022c22] text-white p-8 rounded-[2.5rem] overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Target size={180} />
                            </div>

                            <div className="relative z-10 flex flex-col items-center">
                                <CircularProgress value={progress} />
                                <div className="mt-6 text-center">
                                    <h3 className="text-lg font-serif font-bold italic mb-2 text-center text-balance text-emerald-100/90">
                                        "Rabbim! Beni ve soyumdan gelecekleri namazı dosdoğru kılanlardan eyle."
                                        <span className="block text-xs font-sans font-normal not-italic text-emerald-100/50 mt-1 opacity-70">(İbrahim Suresi, 40. Ayet)</span>
                                    </h3>
                                    <p className="text-emerald-100/60 text-sm">Hedef: {goal} Namaz | Ödenen: {totalPaid}</p>
                                </div>
                                <div className="w-full h-px bg-white/10 my-6" />
                                <div className="flex justify-center w-full">
                                    <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-center gap-2 min-w-[200px] shadow-lg shadow-black/10 border border-white/5">
                                        <p className="text-sm text-emerald-100/60 uppercase font-bold tracking-wider">Kalan:</p>
                                        <p className="text-2xl font-black text-islamic-gold">{Math.max(0, goal - totalPaid)}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    className="mt-6 text-white/50 hover:text-white hover:bg-white/5 text-xs transition-colors"
                                    onClick={() => {
                                        selection();
                                        setManualGoal(goal);
                                        setShowGoalModal(true);
                                    }}
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Hedef Güncelle
                                </Button>
                            </div>
                        </Card>

                        <div className="space-y-4">
                            <h2 className="text-lg font-serif font-bold text-islamic-green dark:text-islamic-gold flex items-center gap-2 px-1">
                                <Target className="w-5 h-5" />
                                Kaza Namazlarım
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                {PRAYER_TYPES.map((prayer) => (
                                    <div key={prayer.key} className="glass-panel p-4 rounded-3xl flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[11px] font-bold text-gray-400 dark:text-emerald-100/40 uppercase tracking-widest">{prayer.label}</span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(prayer)}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-islamic-gold"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <span
                                                    className="text-xl font-black text-islamic-green dark:text-islamic-gold cursor-pointer"
                                                    onClick={() => openEditModal(prayer)}
                                                >
                                                    {qadaCounts[prayer.key]}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => updateCount(prayer.key, -1)}
                                                className="flex-1 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-gray-300 active:bg-red-50 dark:active:bg-red-500/20 active:text-red-500 transition-colors"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <button
                                                onClick={() => updateCount(prayer.key, 1)}
                                                className="flex-1 h-10 rounded-xl bg-islamic-green/10 dark:bg-islamic-gold/10 flex items-center justify-center text-islamic-green dark:text-islamic-gold active:bg-islamic-green dark:active:bg-islamic-gold active:text-white dark:active:text-[#032e18] transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Murakabe - Card Stack Concept */}
                {activeTab === 'murakabe' && (
                    <motion.div
                        key="murakabe"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="-mx-5 -mt-6"
                    >
                        <MurakabeTab />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kaza Edit Modal */}
            <AnimatePresence>
                {editingPrayer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setEditingPrayer(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-[#032e18] w-[90%] max-w-sm rounded-[2rem] shadow-2xl border dark:border-white/10 overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold font-serif text-islamic-green dark:text-islamic-gold flex items-center gap-2">
                                        <Edit2 className="w-5 h-5" />
                                        {editingPrayer.label} Düzenle
                                    </h3>
                                    <button
                                        onClick={() => setEditingPrayer(null)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                            Kaza Borç Sayısı
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editValue}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                setEditValue(val);
                                            }}
                                            className="w-full p-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-xl text-2xl font-black text-center text-islamic-green dark:text-islamic-gold focus:outline-none focus:border-islamic-gold"
                                            autoFocus
                                        />
                                    </div>

                                    <Button
                                        onClick={handleEditSave}
                                        className="w-full h-12 bg-islamic-gold hover:bg-islamic-gold/90 text-[#032e18] font-bold text-base rounded-xl shadow-lg shadow-islamic-gold/20 active:scale-95 transition-all"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Kaydet
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kaza Goal Setting Modal (Same as before) */}
            <AnimatePresence>
                {showGoalModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowGoalModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-[#032e18] w-[90%] max-w-md max-h-[85vh] overflow-y-auto rounded-[2rem] shadow-2xl border dark:border-white/10"
                        >
                            {/* Header */}
                            <div className="p-6 pb-4 flex justify-between items-center border-b dark:border-white/10 sticky top-0 bg-white/80 dark:bg-[#032e18]/80 backdrop-blur-sm z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-islamic-gold/10 rounded-xl">
                                        <Calculator className="w-5 h-5 text-islamic-gold" />
                                    </div>
                                    <h3 className="text-xl font-bold font-serif text-islamic-green dark:text-islamic-gold">Kaza Hedefi</h3>
                                </div>
                                <button
                                    onClick={() => setShowGoalModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="px-6 pt-4 flex gap-2">
                                <button
                                    onClick={() => setGoalTab('manual')}
                                    className={cn(
                                        "flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95",
                                        goalTab === 'manual'
                                            ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] shadow-md"
                                            : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                                    )}
                                >
                                    Manuel Giriş
                                </button>
                                <button
                                    onClick={() => setGoalTab('auto')}
                                    className={cn(
                                        "flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95",
                                        goalTab === 'auto'
                                            ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] shadow-md"
                                            : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                                    )}
                                >
                                    Otomatik Hesapla
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="p-6">
                                <AnimatePresence mode="wait">
                                    {goalTab === 'manual' ? (
                                        <motion.div
                                            key="manual"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-4"
                                        >
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                    Hedef (Gün)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={manualGoal}
                                                    onKeyDown={(e) => {
                                                        if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                                                    }}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                                        setManualGoal(val);
                                                    }}
                                                    className="w-full p-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-xl text-lg font-bold text-islamic-green dark:text-islamic-gold focus:outline-none focus:border-islamic-gold"
                                                    placeholder="100"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                                Toplam kaza namaz hedefinizi gün olarak girin.
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="auto"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            {/* Birth Date Input */}
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                    Doğum Tarihi
                                                </label>
                                                <input
                                                    type="date"
                                                    max={new Date().toISOString().split('T')[0]}
                                                    min="1900-01-01"
                                                    value={birthDate}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        // Prevent years with more than 4 digits
                                                        if (val) {
                                                            const year = val.split('-')[0];
                                                            if (year.length > 4) return;
                                                        }
                                                        setBirthDate(val);
                                                    }}
                                                    className="w-full p-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-xl text-base dark:text-white focus:outline-none focus:border-islamic-gold min-h-[50px]"
                                                />
                                            </div>

                                            {/* Puberty Age Slider */}
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
                                                    Büluğ Çağı: <span className="text-islamic-gold text-lg ml-1">{pubertyAge} yaş</span>
                                                </label>
                                                <input
                                                    type="range"
                                                    min="10"
                                                    max="18"
                                                    value={pubertyAge}
                                                    onChange={(e) => setPubertyAge(parseInt(e.target.value, 10))}
                                                    className="w-full h-3 bg-gray-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-islamic-gold"
                                                />
                                                <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium px-1">
                                                    <span>10</span>
                                                    <span>14 (Ort)</span>
                                                    <span>18</span>
                                                </div>
                                            </div>

                                            {/* Calculation Summary */}
                                            {birthDate && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-islamic-green/5 dark:bg-islamic-gold/5 border-2 border-islamic-green/20 dark:border-islamic-gold/20 rounded-2xl p-5 space-y-3"
                                                >
                                                    {/* Same Summary UI */}
                                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                        Hesaplama Özeti
                                                    </p>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-600 dark:text-gray-400">Sorumluluk Başlangıcı:</span>
                                                            <span className="font-bold text-islamic-green dark:text-islamic-gold">
                                                                {(() => {
                                                                    if (!birthDate) return '-';
                                                                    const d = new Date(birthDate);
                                                                    if (isNaN(d.getTime())) return '-';
                                                                    d.setFullYear(d.getFullYear() + pubertyAge);
                                                                    return d.toLocaleDateString('tr-TR');
                                                                })()}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-600 dark:text-gray-400">Geçen Süre:</span>
                                                            <span className="font-bold text-islamic-green dark:text-islamic-gold">
                                                                {(() => {
                                                                    const days = calculateMissedPrayers();
                                                                    if (days === 0) return '0 gün';
                                                                    const years = Math.floor(days / 365);
                                                                    const remainingDays = days % 365;
                                                                    return `${years} yıl, ${remainingDays} gün`;
                                                                })()}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center pt-3 border-t border-islamic-green/20 dark:border-islamic-gold/20 mt-1">
                                                            <span className="font-bold text-gray-700 dark:text-gray-300">Tahmini Borç:</span>
                                                            <span className="font-black text-xl text-islamic-gold">
                                                                {calculateMissedPrayers().toLocaleString('tr-TR')} gün
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {!birthDate && (
                                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-center border border-dashed border-gray-200 dark:border-white/10">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                                        👆 Doğum tarihinizi seçin, borcunuzu otomatik hesaplayalım.
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Save Button */}
                                <div className="mt-8">
                                    <Button
                                        onClick={handleSaveGoal}
                                        disabled={goalTab === 'auto' && !birthDate}
                                        className="w-full h-14 bg-islamic-gold hover:bg-islamic-gold/90 text-[#032e18] font-bold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-islamic-gold/20 transition-all active:scale-95"
                                    >
                                        {goalTab === 'manual' ? 'Hedefi Kaydet' : 'Borcu Kaydet'}
                                    </Button>
                                    {goalTab === 'auto' && birthDate && (
                                        <p className="text-[10px] text-center text-gray-400 mt-3">
                                            Hesaplama yaklaşık değerdir. Küsüratlar yuvarlanmıştır.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
