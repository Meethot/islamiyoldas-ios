import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, Scale, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';
import { QUESTION_POOL } from '@/data/murakabeQuestions';
import { getMurakabeKey } from '@/lib/testDate';

// Animation Variants
const cardVariants = {
    enter: {
        opacity: 0,
        y: 50,
        scale: 0.95
    },
    center: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1]
        }
    },
    exit: (direction) => ({
        opacity: 0,
        x: direction > 0 ? 200 : -200,
        scale: 0.9,
        transition: {
            duration: 0.3
        }
    })
};

export default function Murakabe() {
    const navigate = useNavigate();
    const { selection, success, heavy } = useHaptics();

    // Randomly selected questions for the day (7 items)
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [direction, setDirection] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [savedScore, setSavedScore] = useState(null);

    // Initial Shuffle on Mount & Check Storage
    useEffect(() => {
        // 1. Check Storage
        const todayKey = getMurakabeKey();

        const stored = localStorage.getItem(todayKey);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                if (data.completed) {
                    setIsCompleted(true);
                    setSavedScore(data.score);
                }
            } catch (e) {
                console.error("Storage parse error", e);
            }
        }

        // 2. Shuffle array using Fisher-Yates
        const shuffled = [...QUESTION_POOL];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // Select first 7
        setQuestions(shuffled.slice(0, 7));
    }, []);

    // Safety: only access current question if not completed and index is valid
    const currentQuestion = !isCompleted && questions.length > 0 && currentIndex < questions.length
        ? questions[currentIndex]
        : null;

    // Only calculate progress if questions are loaded
    const progress = questions.length > 0
        ? ((currentIndex) / questions.length) * 100
        : 0;

    const handleAnswer = useCallback((answer) => {
        // Block clicks if animating, completed, or no question
        if (isAnimating || isCompleted || !currentQuestion) return;

        setIsAnimating(true);
        heavy();

        // Store answer
        const newAnswers = { ...answers, [currentQuestion.id]: answer };
        setAnswers(newAnswers);

        // Determine direction for exit animation
        setDirection(answer ? 1 : -1);

        // Move to next question or complete
        if (currentIndex < questions.length - 1) {
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
                setIsAnimating(false);
            }, 350);
        } else {
            // Save to storage
            const todayKey = getMurakabeKey();

            const finalScore = Object.entries(newAnswers).filter(([id, ans]) => {
                const q = questions.find(q => q.id === parseInt(id));
                // Safety check
                if (!q) return false;
                return (q.type === 'positive' && ans === true) || (q.type === 'negative' && ans === false);
            }).length;

            localStorage.setItem(todayKey, JSON.stringify({ completed: true, score: finalScore }));

            setTimeout(() => {
                setIsCompleted(true);
                setIsAnimating(false);
                success();
            }, 400);
        }
    }, [currentIndex, currentQuestion, heavy, success, isAnimating, isCompleted, questions, answers]);

    const handleBack = useCallback(() => {
        if (isAnimating) return;
        selection();
        navigate(-1);
    }, [navigate, selection, isAnimating]);

    const handleFinish = useCallback(() => {
        if (isAnimating) return;
        success();
        navigate('/');
    }, [navigate, success, isAnimating]);

    // Calculate summary stats
    const positiveCount = savedScore !== null
        ? savedScore
        : Object.entries(answers).filter(([id, ans]) => {
            const q = questions.find(q => q.id === parseInt(id));
            if (!q) return false;
            // For positive questions, "yes" is good. For negative, "no" is good.
            return (q.type === 'positive' && ans === true) || (q.type === 'negative' && ans === false);
        }).length;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#022c22] via-[#064e3b] to-[#000000] relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

            {/* Islamic Pattern Overlay */}
            <div
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '80px 80px'
                }}
            />

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-4 py-6 border-b border-white/5">
                <button
                    onClick={handleBack}
                    className="p-2 rounded-full hover:bg-white/5 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-white/70" />
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-serif font-bold text-islamic-gold tracking-wide">
                        Günün Muhasebesi
                    </h1>
                    {!isCompleted && questions.length > 0 && (
                        <p className="text-xs text-white/40 mt-1">
                            {currentIndex + 1} / {questions.length}
                        </p>
                    )}
                </div>
                <div className="w-10" /> {/* Spacer */}
            </header>

            {/* Progress Bar */}
            {!isCompleted && (
                <div className="relative z-10 h-1 bg-white/5 mx-6 mt-4 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-islamic-gold/80 to-islamic-gold"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                </div>
            )}

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-10 min-h-[70vh]">
                <AnimatePresence mode="wait" custom={direction}>
                    {!isCompleted && currentQuestion ? (
                        <motion.div
                            key={currentQuestion.id}
                            custom={direction}
                            variants={cardVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="w-full max-w-md"
                        >
                            {/* The Card */}
                            <div className="bg-emerald-900/40 backdrop-blur-xl border border-emerald-700/50 rounded-[2rem] p-8 shadow-2xl shadow-black/30">
                                {/* Icon */}
                                <div className="flex justify-center mb-8">
                                    <div className="p-5 bg-islamic-gold/10 rounded-full border border-islamic-gold/20">
                                        <currentQuestion.icon
                                            className="w-12 h-12 text-islamic-gold"
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                </div>

                                {/* Question */}
                                <h2 className="text-2xl font-serif text-amber-100 text-center leading-relaxed min-h-[100px] flex items-center justify-center">
                                    {currentQuestion.text}
                                </h2>

                                {/* Decorative Line */}
                                <div className="h-px w-16 mx-auto mt-8 bg-gradient-to-r from-transparent via-islamic-gold/50 to-transparent" />
                            </div>

                            {/* Answer Buttons */}
                            <div className="flex gap-4 mt-8">
                                <Button
                                    onClick={() => handleAnswer(false)}
                                    className={cn(
                                        "flex-1 h-16 rounded-2xl font-semibold text-lg transition-all active:scale-95",
                                        "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                                    )}
                                >
                                    <X className="w-5 h-5 mr-2" />
                                    Hayır
                                </Button>
                                <Button
                                    onClick={() => handleAnswer(true)}
                                    className={cn(
                                        "flex-1 h-16 rounded-2xl font-semibold text-lg transition-all active:scale-95",
                                        "bg-islamic-gold text-emerald-950 hover:bg-islamic-gold/90 shadow-lg shadow-islamic-gold/20"
                                    )}
                                >
                                    <Check className="w-5 h-5 mr-2" />
                                    Evet
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        /* Premium Completion Screen - "Seal of Light" */
                        <motion.div
                            key="completion"
                            initial="hidden"
                            animate="visible"
                            className="w-full max-w-md text-center py-8"
                        >
                            {/* Breathing Light Circle */}
                            <motion.div
                                className="flex justify-center mb-10"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                            >
                                <div className="relative">
                                    {/* Outer Glow Rings */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-yellow-600/30 rounded-full blur-3xl"
                                        animate={{
                                            scale: [1, 1.3, 1],
                                            opacity: [0.5, 0.8, 0.5]
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        style={{ width: '220px', height: '220px', margin: '-35px' }}
                                    />
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-br from-amber-300/20 to-yellow-500/20 rounded-full blur-2xl"
                                        animate={{
                                            scale: [1.1, 1.4, 1.1],
                                            opacity: [0.3, 0.6, 0.3]
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: 0.5
                                        }}
                                        style={{ width: '200px', height: '200px', margin: '-25px' }}
                                    />

                                    {/* Main Breathing Circle */}
                                    <motion.div
                                        className="relative w-36 h-36 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 shadow-2xl shadow-amber-500/50 flex items-center justify-center"
                                        animate={{
                                            scale: [1, 1.08, 1],
                                            boxShadow: [
                                                '0 0 40px rgba(251, 191, 36, 0.5)',
                                                '0 0 80px rgba(251, 191, 36, 0.7)',
                                                '0 0 40px rgba(251, 191, 36, 0.5)'
                                            ]
                                        }}
                                        transition={{
                                            duration: 2.5,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    >
                                        {/* Inner Icon */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.5, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                                        >
                                            <Check className="w-16 h-16 text-white drop-shadow-lg" strokeWidth={2.5} />
                                        </motion.div>
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Title - Staggered */}
                            <motion.h2
                                className="text-5xl font-serif text-islamic-gold mb-4 tracking-wide"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.6 }}
                            >
                                Elhamdülillah
                            </motion.h2>

                            {/* Spiritual Message - Staggered */}
                            <motion.p
                                className="text-xl text-emerald-100/80 font-light mb-12 leading-relaxed px-4 text-center"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.9, duration: 0.6 }}
                            >
                                Bugün kalbini yokladın, ruhun ferah olsun.
                            </motion.p>

                            {/* Summary Stats - Staggered */}
                            <motion.div
                                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2, duration: 0.6 }}
                            >
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Scale className="w-5 h-5 text-islamic-gold" />
                                    <span className="text-sm text-white/50 uppercase tracking-widest">Özet</span>
                                </div>
                                <p className="text-5xl font-bold text-islamic-gold">
                                    {positiveCount}/{questions.length}
                                </p>
                                <p className="text-sm text-white/40 mt-1">
                                    olumlu cevap
                                </p>
                            </motion.div>

                            {/* Finish Button - Staggered */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5, duration: 0.6 }}
                            >
                                <Button
                                    onClick={handleFinish}
                                    className="w-full h-16 rounded-2xl font-semibold text-lg bg-black/30 border border-white/20 text-white hover:bg-black/50 backdrop-blur-md transition-all active:scale-95"
                                >
                                    Ana Sayfaya Dön
                                </Button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        </div >
    );
}
