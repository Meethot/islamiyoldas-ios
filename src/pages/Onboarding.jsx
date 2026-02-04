import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { useTranslation } from 'react-i18next';
import {
    Moon, Book, Heart, Target, User, Users, Calendar,
    Sparkles, Star, ChevronRight, Check, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 5-Step personalized questions
const steps = [
    {
        id: 'gender',
        title: 'Hoş Geldiniz',
        subtitle: 'Size özel bir deneyim hazırlayalım',
        description: 'Cinsiyetinizi seçin',
        icon: Users,
        options: [
            { label: 'Erkek', value: 'male', emoji: '🧔' },
            { label: 'Kadın', value: 'female', emoji: '🧕' },
        ]
    },
    {
        id: 'age',
        title: 'Yaş Grubunuz',
        subtitle: 'İçerikleri size göre uyarlayalım',
        description: 'Yaş aralığınızı seçin',
        icon: Calendar,
        options: [
            { label: '13 - 17 yaş', value: '13-17', emoji: '🌱' },
            { label: '18 - 30 yaş', value: '18-30', emoji: '🌿' },
            { label: '31 - 45 yaş', value: '31-45', emoji: '🌳' },
            { label: '46+ yaş', value: '46+', emoji: '🌲' },
        ]
    },
    {
        id: 'prayer-status',
        title: 'Namaz Durumunuz',
        subtitle: 'Manevi yolculuğunuzu anlayalım',
        description: 'Şu anki durumunuzu seçin',
        icon: Moon,
        options: [
            { label: 'Evet, 5 vakit kılıyorum', value: 'full', emoji: '🕌' },
            { label: 'Ara sıra kılıyorum', value: 'sometimes', emoji: '🌙' },
            { label: 'Henüz başlamadım', value: 'none', emoji: '✨' },
        ]
    },
    {
        id: 'quran-status',
        title: 'Kuran Bilginiz',
        subtitle: 'Öğrenme yolculuğunuzu belirleyelim',
        description: 'Kuran okuma seviyeniz',
        icon: Book,
        options: [
            { label: 'Akıcı okuyorum', value: 'fluent', emoji: '📖' },
            { label: 'Yavaş okuyorum', value: 'slow', emoji: '📚' },
            { label: 'Harfleri biliyorum', value: 'letters', emoji: '🔤' },
            { label: 'Öğrenmek istiyorum', value: 'none', emoji: '🎯' },
        ]
    },
    {
        id: 'goal',
        title: 'Ana Hedefiniz',
        subtitle: 'Size en çok nasıl yardımcı olabiliriz?',
        description: 'Önceliğinizi seçin',
        icon: Target,
        options: [
            { label: 'Namazlarımı düzene sokmak', value: 'prayer', emoji: '🕋' },
            { label: 'Kuran öğrenmek', value: 'quran', emoji: '📖' },
            { label: 'Maneviyatımı güçlendirmek', value: 'spirituality', emoji: '💚' },
        ]
    }
];

// Floating particles component
const FloatingParticles = () => {
    const particles = useMemo(() =>
        Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            size: Math.random() * 4 + 2,
            x: Math.random() * 100,
            y: Math.random() * 100,
            duration: Math.random() * 20 + 15,
            delay: Math.random() * 5,
        })), []
    );

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-islamic-gold/20"
                    style={{
                        width: p.size,
                        height: p.size,
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0.2, 0.6, 0.2],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
};

// Progress indicator
const ProgressIndicator = ({ current, total }) => (
    <div className="flex items-center justify-center gap-2 mb-8">
        {Array.from({ length: total }).map((_, i) => (
            <motion.div
                key={i}
                className={cn(
                    "h-2 rounded-full transition-all duration-500",
                    i === current
                        ? "w-8 bg-islamic-gold"
                        : i < current
                            ? "w-2 bg-islamic-gold/60"
                            : "w-2 bg-white/20"
                )}
                initial={false}
                animate={{
                    scale: i === current ? [1, 1.1, 1] : 1,
                }}
                transition={{
                    duration: 1.5,
                    repeat: i === current ? Infinity : 0,
                }}
            />
        ))}
    </div>
);

// Option card component
const OptionCard = ({ option, isSelected, onClick, index }) => {
    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: index * 0.1,
                type: "spring",
                stiffness: 100,
                damping: 15
            }}
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300",
                "active:scale-[0.97] min-h-[72px]",
                isSelected
                    ? "bg-islamic-gold/20 border-islamic-gold shadow-lg shadow-islamic-gold/20"
                    : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
            )}
        >
            <span className="text-3xl">{option.emoji}</span>
            <span className={cn(
                "text-lg font-semibold flex-1 text-left",
                isSelected ? "text-islamic-gold" : "text-white"
            )}>
                {option.label}
            </span>
            <motion.div
                initial={false}
                animate={{
                    scale: isSelected ? 1 : 0,
                    opacity: isSelected ? 1 : 0,
                }}
                className="w-6 h-6 rounded-full bg-islamic-gold flex items-center justify-center"
            >
                <Check className="w-4 h-4 text-[#021a0f]" strokeWidth={3} />
            </motion.div>
        </motion.button>
    );
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

    // Handle language change immediately
    const handleSelect = useCallback((value) => {
        selection();
        setSelectedValue(value);

        if (steps[currentStep].id === 'language') {
            i18n.changeLanguage(value);
        }

        // Auto-advance after brief delay
        setTimeout(() => {
            setAnswers(prev => {
                const nextAnswers = { ...prev, [steps[currentStep].id]: value };

                if (currentStep < steps.length - 1) {
                    setCurrentStep(currentStep + 1);
                    setSelectedValue(null);
                } else {
                    success();
                    impactHeavy?.();
                    localStorage.setItem('onboardingComplete', 'true');
                    localStorage.setItem('userProfile', JSON.stringify(nextAnswers));
                    window.location.href = '/';
                }
                return nextAnswers;
            });
        }, 400);
    }, [currentStep, selection, success, impactHeavy]);

    return (
        <div className="min-h-screen bg-[#021a0f] flex flex-col relative overflow-hidden">
            {/* Background effects */}
            <FloatingParticles />

            {/* Gradient orbs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-islamic-green/20 rounded-full blur-[120px] -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-islamic-gold/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />

            {/* Content */}
            <div className="flex-1 flex flex-col relative z-10 px-6 py-12 safe-area-inset">
                {/* Progress */}
                <ProgressIndicator current={currentStep} total={steps.length} />

                {/* Step content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 50, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -50, scale: 0.95 }}
                        transition={{
                            type: "spring",
                            stiffness: 100,
                            damping: 20,
                            duration: 0.5
                        }}
                        className="flex-1 flex flex-col"
                    >
                        {/* Header */}
                        <div className="text-center mb-10">
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 15,
                                    delay: 0.1
                                }}
                                className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-islamic-gold/20 to-islamic-green/20 mb-6 border border-islamic-gold/30"
                            >
                                <StepIcon className="w-10 h-10 text-islamic-gold" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h1 className="text-3xl font-serif font-bold text-white mb-2">
                                    {stepData.title}
                                </h1>
                                <p className="text-islamic-gold/80 text-sm font-medium mb-1">
                                    {stepData.subtitle}
                                </p>
                                <p className="text-white/50 text-sm">
                                    {stepData.description}
                                </p>
                            </motion.div>
                        </div>

                        {/* Options */}
                        <div className="space-y-4 flex-1">
                            {stepData.options.map((option, index) => (
                                <OptionCard
                                    key={option.value}
                                    option={option}
                                    isSelected={selectedValue === option.value || answers[stepData.id] === option.value}
                                    onClick={() => handleSelect(option.value)}
                                    index={index}
                                />
                            ))}
                        </div>

                        {/* Step indicator */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-center mt-8"
                        >
                            <span className="text-white/30 text-sm font-medium">
                                {t('progress', { current: currentStep + 1, total: steps.length })}
                            </span>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom decorative element */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-islamic-gold/5 to-transparent pointer-events-none" />
        </div>
    );
}
