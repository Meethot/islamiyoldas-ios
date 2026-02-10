import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { useTranslation } from 'react-i18next';
import {
    Moon, Book, Heart, Target, User, Users, Calendar,
    Sparkles, Star, ChevronRight, Check, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Progress bar — pure CSS transitions
const ProgressBar = ({ current, total }) => (
    <div className="flex items-center justify-center gap-2.5 mb-10">
        {Array.from({ length: total }).map((_, i) => (
            <div
                key={i}
                className={cn(
                    "h-1.5 rounded-full transition-all duration-500 ease-out",
                    i === current
                        ? "w-10 bg-islamic-gold"
                        : i < current
                            ? "w-6 bg-islamic-gold/50"
                            : "w-6 bg-white/10"
                )}
            />
        ))}
    </div>
);

// Slide direction context
const slideVariants = {
    enter: { opacity: 0, x: 60 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
};

export default function Onboarding() {
    const { t, i18n } = useTranslation('onboarding');
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [selectedValue, setSelectedValue] = useState(null);
    const { selection, success, impactHeavy } = useHaptics();

    const steps = useMemo(() => [
        {
            id: 'gender',
            title: t('welcome.title'),
            subtitle: t('welcome.subtitle'),
            description: t('steps.gender.title'),
            icon: Users,
            options: [
                { label: t('steps.gender.male'), value: 'male', emoji: '🧔' },
                { label: t('steps.gender.female'), value: 'female', emoji: '🧕' },
            ]
        },
        {
            id: 'age',
            title: t('steps.age.title'),
            subtitle: t('steps.age.subtitle'),
            description: t('steps.age.title'),
            icon: Calendar,
            options: [
                { label: t('steps.age.range1'), value: '13-17', emoji: '🌱' },
                { label: t('steps.age.range2'), value: '18-30', emoji: '🌿' },
                { label: t('steps.age.range3'), value: '31-45', emoji: '🌳' },
                { label: t('steps.age.range4'), value: '46+', emoji: '🌲' },
            ]
        },
        {
            id: 'prayer-status',
            title: t('steps.prayerStatus.title'),
            subtitle: t('steps.prayerStatus.subtitle'),
            description: t('steps.prayerStatus.title'),
            icon: Moon,
            options: [
                { label: t('steps.prayerStatus.regular'), value: 'full', emoji: '🕌' },
                { label: t('steps.prayerStatus.occasional'), value: 'sometimes', emoji: '🌙' },
                { label: t('steps.prayerStatus.irregular'), value: 'none', emoji: '✨' },
            ]
        },
        {
            id: 'quran-status',
            title: t('steps.quranLevel.title'),
            subtitle: t('steps.quranLevel.subtitle'),
            description: t('steps.quranLevel.title'),
            icon: Book,
            options: [
                { label: t('steps.quranLevel.advanced'), value: 'fluent', emoji: '📖' },
                { label: t('steps.quranLevel.reading'), value: 'slow', emoji: '📚' },
                { label: t('steps.quranLevel.learning'), value: 'letters', emoji: '🔤' },
                { label: t('steps.quranLevel.none'), value: 'none', emoji: '🎯' },
            ]
        },
        {
            id: 'goal',
            title: t('steps.goal.title'),
            subtitle: t('steps.goal.subtitle'),
            description: t('steps.goal.title'),
            icon: Target,
            options: [
                { label: t('steps.goal.prayer'), value: 'prayer', emoji: '🕋' },
                { label: t('steps.goal.quran'), value: 'quran', emoji: '📖' },
                { label: t('steps.goal.spirituality'), value: 'spirituality', emoji: '💚' },
                { label: t('steps.goal.knowledge'), value: 'knowledge', emoji: '📚' },
            ]
        }
    ], [t]);

    const stepData = steps[currentStep];
    const StepIcon = stepData.icon;

    const handleSelect = useCallback((value) => {
        selection(); // haptic tick
        setSelectedValue(value);

        if (steps[currentStep].id === 'language') {
            i18n.changeLanguage(value);
        }

        setTimeout(() => {
            setAnswers(prev => {
                const nextAnswers = { ...prev, [steps[currentStep].id]: value };

                if (currentStep < steps.length - 1) {
                    setCurrentStep(currentStep + 1);
                    setSelectedValue(null);
                } else {
                    success();
                    localStorage.setItem('onboardingComplete', 'true');
                    localStorage.setItem('userProfile', JSON.stringify(nextAnswers));
                    window.location.href = '/';
                }
                return nextAnswers;
            });
        }, 500);
    }, [currentStep, selection, success, impactHeavy]);

    return (
        <div className="min-h-screen bg-[#021a0f] flex flex-col relative overflow-hidden">
            {/* Static ambient glow */}
            <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[150px] opacity-25 bg-islamic-green/30" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[350px] h-[350px] rounded-full blur-[120px] opacity-15 bg-islamic-gold/20" />

            <div className="flex-1 flex flex-col relative z-10 px-6 pt-20 pb-12 safe-area-inset">
                <ProgressBar current={currentStep} total={steps.length} />

                {/* Smooth slide transition between steps */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        className="flex-1 flex flex-col"
                    >
                        {/* Header */}
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-islamic-gold/15 to-islamic-green/10 mb-6 border border-islamic-gold/20">
                                <StepIcon className="w-10 h-10 text-islamic-gold" />
                            </div>
                            <h1 className="text-3xl font-serif font-bold text-white mb-2">
                                {stepData.title}
                            </h1>
                            <p className="text-islamic-gold/70 text-sm font-medium mb-1">
                                {stepData.subtitle}
                            </p>
                            <p className="text-white/40 text-sm">
                                {stepData.description}
                            </p>
                        </div>

                        {/* Options — all appear instantly, no stagger */}
                        <div className="space-y-3.5 flex-1">
                            {stepData.options.map((option) => {
                                const isSelected = selectedValue === option.value || answers[stepData.id] === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => handleSelect(option.value)}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-5 rounded-2xl border transition-all duration-200",
                                            "active:scale-[0.98] min-h-[68px]",
                                            isSelected
                                                ? "bg-islamic-gold/15 border-islamic-gold/60 shadow-lg shadow-islamic-gold/10"
                                                : "bg-white/[0.04] border-white/[0.08]"
                                        )}
                                    >
                                        <span className="text-2xl">{option.emoji}</span>
                                        <span className={cn(
                                            "text-[16px] font-semibold flex-1 text-left transition-colors duration-200",
                                            isSelected ? "text-islamic-gold" : "text-white/90"
                                        )}>
                                            {option.label}
                                        </span>
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
                                            isSelected ? "bg-islamic-gold scale-100" : "bg-transparent scale-0"
                                        )}>
                                            <Check className="w-4 h-4 text-[#021a0f]" strokeWidth={3} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Step counter */}
                        <div className="text-center mt-8">
                            <span className="text-white/20 text-sm font-medium">
                                {t('progress', { current: currentStep + 1, total: steps.length })}
                            </span>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-islamic-gold/[0.03] to-transparent pointer-events-none" />
        </div>
    );
}
