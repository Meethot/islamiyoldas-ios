import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Wind, Heart, Sparkles, Clock, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';
import { useTranslation } from 'react-i18next';

const cardVariants = {
    enter: { opacity: 0, y: 50, scale: 0.95 },
    center: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};
const DURATIONS = [
    { labelKey: 'dur1min', value: 60 },
    { labelKey: 'dur3min', value: 180 },
    { labelKey: 'dur5min', value: 300 }
];

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function Tefekkur() {
    const navigate = useNavigate();
    const { selection } = useHaptics();
    const { t } = useTranslation('tefekkur');
    const [phase, setPhase] = useState('inhale'); // inhale, hold, exhale
    const [timer, setTimer] = useState(0); // This was unused
    const [duration, setDuration] = useState(60); // Default 1 min
    const [timeLeft, setTimeLeft] = useState(60);
    const [active, setActive] = useState(false);
    const [completed, setCompleted] = useState(false);

    // Breath Cycle: 4-4-4-4 Box Breathing or 4-7-8
    // Let's do a simple calming rhythm: Inhale 4s, Hold 4s, Exhale 6s
    useEffect(() => {
        if (!active) return;

        // Session Timer
        const sessionTimer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(sessionTimer);
                    setActive(false);
                    setCompleted(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(sessionTimer);
    }, [active]);

    // Simple text guidance
    const getPhaseText = () => {
        switch (phase) {
            case 'inhale': return 'Nefes Al';
            case 'hold': return 'Tut';
            case 'exhale': return 'Ver';
            default: return 'Hazır';
        }
    };

    const handleBack = () => {
        selection();
        navigate(-1);
    };

    return (
        <div className="h-[100dvh] bg-gradient-to-b from-[#F6F0E1] via-[#EFE8D6] to-[#EAE1CB] dark:from-[#022c22] dark:via-[#064e3b] dark:to-[#000000] relative overflow-hidden flex flex-col">
            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 dark:bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-4 py-4 border-b border-stone-900/5 dark:border-white/5">
                <button onClick={handleBack} className="p-2 rounded-full hover:bg-stone-900/5 dark:hover:bg-white/5 transition-colors text-stone-600 dark:text-white/70">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-serif font-bold text-islamic-green dark:text-islamic-gold tracking-wide">
                        {t('headerTitle')}
                    </h1>
                    <p className="text-xs text-stone-400 dark:text-white/40 mt-1">{t('headerSub')}</p>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </header>

            {/* Content */}
            <main className="flex-1 flex flex-col items-center justify-start relative z-10 pt-2 p-6">

                {/* Breathing Circle - Extracted from Murakabe */}
                <motion.div
                    className="relative w-56 h-56 flex items-center justify-center mb-2"
                    animate={active ? {
                        scale: [1, 1.2, 1.2, 0.9, 1],
                    } : {}}
                    transition={active ? {
                        duration: 13, // 4 in, 4 hold, 5 out
                        repeat: Infinity,
                        times: [0, 0.3, 0.6, 1], // Keyframes
                        ease: "easeInOut"
                    } : {}}
                >
                    {/* Glow Rings */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-600/20 dark:from-emerald-400/20 dark:to-teal-600/20 rounded-full blur-3xl animate-pulse" />
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-amber-300/10 to-orange-500/10 dark:from-emerald-300/10 dark:to-teal-500/10 rounded-full blur-2xl"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Main Circle */}
                    <motion.div
                        className="relative w-40 h-40 rounded-full bg-gradient-to-br from-amber-500/20 via-orange-600/20 to-amber-800/20 dark:from-emerald-500/20 dark:via-teal-600/20 dark:to-emerald-800/20 backdrop-blur-sm border border-amber-900/10 dark:border-white/10 shadow-[0_0_50px_rgba(217,119,6,0.2)] dark:shadow-[0_0_50px_rgba(16,185,129,0.2)] flex items-center justify-center"
                        animate={active ? {
                            boxShadow: [
                                '0 0 50px rgba(217,119,6,0.2)',
                                '0 0 100px rgba(217,119,6,0.45)',
                                '0 0 100px rgba(217,119,6,0.45)',
                                '0 0 50px rgba(217,119,6,0.2)'
                            ]
                        } : {}}
                        transition={active ? {
                            duration: 13,
                            repeat: Infinity,
                            times: [0, 0.3, 0.6, 1]
                        } : {}}
                    >
                        {active ? (
                            <motion.span
                                key="phase-text"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-2xl font-serif text-amber-950 dark:text-white font-medium tracking-widest"
                            >
                                <BreathText t={t} />
                            </motion.span>
                        ) : (
                            <Wind className="w-16 h-16 text-amber-700/50 dark:text-emerald-200/50" />
                        )}
                    </motion.div>
                </motion.div>

                {/* Controls / Info */}
                <div className="text-center space-y-4 max-w-xs mx-auto w-full">
                    <AnimatePresence mode="wait">
                        {!active && !completed ? (
                            <motion.div
                                key="start"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <p className="text-lg text-stone-700 dark:text-white/80 font-serif leading-relaxed">
                                    {t('verse1')}
                                    <span className="block text-sm text-islamic-green dark:text-islamic-gold mt-2 font-sans opacity-80">{t('verse1Source')}</span>
                                </p>

                                {/* Duration Selector */}
                                <div className="grid grid-cols-3 gap-3">
                                    {DURATIONS.map((dur) => (
                                        <button
                                            key={dur.value}
                                            onClick={() => { selection(); setDuration(dur.value); setTimeLeft(dur.value); }}
                                            className={cn(
                                                "py-3 rounded-xl text-sm font-bold transition-all border",
                                                duration === dur.value
                                                    ? "bg-islamic-green text-white border-islamic-green dark:bg-islamic-gold dark:text-[#022c22] dark:border-islamic-gold shadow-lg scale-105"
                                                    : "bg-[#FFFDF6] dark:bg-white/5 text-stone-500 dark:text-white/60 border-[#E2D9C4] dark:border-white/10 hover:bg-stone-50 dark:hover:bg-white/10"
                                            )}
                                        >
                                            {t(dur.labelKey)}
                                        </button>
                                    ))}
                                </div>

                                <Button
                                    onClick={() => { selection(); setActive(true); setCompleted(false); }}
                                    className="w-full h-14 rounded-2xl bg-amber-600 hover:bg-amber-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-lg flex items-center justify-center gap-2 text-lg font-bold transition-all hover:scale-105 active:scale-95"
                                >
                                    <Play className="w-5 h-5 fill-current" /> {t('start')}
                                </Button>
                            </motion.div>
                        ) : completed ? (
                            <motion.div
                                key="completed"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-sm mx-auto"
                            >
                                <div className="relative overflow-hidden p-8 rounded-[2rem] bg-white/70 dark:bg-gradient-to-br dark:from-emerald-900/40 dark:to-teal-900/40 backdrop-blur-xl border border-[#E2D9C4]/80 dark:border-white/10 shadow-2xl">
                                    {/* Decorative Elements */}
                                    <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/3 -translate-y-1/3">
                                        <div className="w-32 h-32 rounded-full bg-islamic-gold blur-3xl" />
                                    </div>

                                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                        <div className="w-16 h-16 rounded-full bg-amber-500/20 dark:bg-emerald-500/20 flex items-center justify-center mb-2 animate-bounce-slow">
                                            <Sparkles className="w-8 h-8 text-islamic-green dark:text-islamic-gold" />
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-white tracking-wide">
                                                {t('mashallah')}
                                            </h3>
                                            <p className="text-stone-500 dark:text-white/60 text-sm font-medium">
                                                {t('completedMsg')}
                                            </p>
                                        </div>

                                        {/* Verse Card */}
                                        <div className="w-full p-6 rounded-2xl bg-amber-950/5 dark:bg-black/20 border border-amber-950/10 dark:border-white/5 space-y-3">
                                            <p className="text-xl font-serif text-islamic-green dark:text-islamic-gold leading-relaxed">
                                                {t('verse2')}
                                            </p>
                                            <p className="text-xs text-stone-400 dark:text-white/40 uppercase tracking-widest font-sans">
                                                {t('verse2Source')}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3 w-full pt-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => { selection(); navigate('/'); }}
                                                className="flex-1 h-12 rounded-xl border-[#E2D9C4] bg-[#FFFDF6] hover:bg-stone-50 text-stone-600 hover:text-stone-800 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/80 dark:hover:text-white"
                                            >
                                                {t('home')}
                                            </Button>
                                            <Button
                                                onClick={() => { selection(); setCompleted(false); setActive(false); setTimeLeft(duration); }}
                                                className="flex-1 h-12 rounded-xl bg-amber-600 hover:bg-amber-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-lg"
                                            >
                                                <RotateCcw className="w-4 h-4 mr-2" /> {t('repeat')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="active"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <Clock className="w-5 h-5 text-islamic-green dark:text-islamic-gold" />
                                    <span className="text-5xl font-sans font-medium text-stone-900 dark:text-white tabular-nums tracking-tight">
                                        {formatTime(timeLeft)}
                                    </span>
                                </div>
                                <p className="text-stone-500 dark:text-white/60 text-sm animate-pulse">
                                    {t('breatheHint')}
                                </p>
                                <Button
                                    onClick={() => { selection(); setActive(false); setTimeLeft(duration); }}
                                    className="w-full bg-stone-900/10 hover:bg-stone-900/15 text-stone-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white/90 font-medium"
                                >
                                    {t('end')}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </main>
        </div>
    );
}

// Separate component to handle text timing precisely if needed, 
// for now using a simple cycler in main component is better but let's just make it visual.
function BreathText({ t }) {
    const [text, setText] = useState(t('inhale'));

    useEffect(() => {
        const runCycle = async () => {
            // Total 14s cycle: 4s Inhale, 4s Hold, 6s Exhale
            while (true) {
                setText(t('inhale'));
                await new Promise(r => setTimeout(r, 4000));
                setText(t('hold'));
                await new Promise(r => setTimeout(r, 4000));
                setText(t('exhale'));
                await new Promise(r => setTimeout(r, 5000));
            }
        };
        runCycle();
    }, [t]);

    return <>{text}</>;
}
