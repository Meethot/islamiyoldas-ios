import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Crown, Star, Shield, Zap, BookOpen, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useMobile';

// ─── Gold Dust Particle System ───────────────────────────
function GoldParticles() {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const rafRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Create particles
        const COUNT = 45;
        particlesRef.current = Array.from({ length: COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2.5 + 0.5,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: -Math.random() * 0.4 - 0.1,
            opacity: Math.random() * 0.6 + 0.1,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.02 + 0.005,
        }));

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particlesRef.current.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                p.pulse += p.pulseSpeed;
                const currentOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));

                // Wrap around
                if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
                if (p.x < -10) p.x = canvas.width + 10;
                if (p.x > canvas.width + 10) p.x = -10;

                // Draw particle with glow
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(212, 175, 55, ${currentOpacity})`;
                ctx.shadowBlur = p.size * 4;
                ctx.shadowColor = 'rgba(212, 175, 55, 0.3)';
                ctx.fill();
                ctx.shadowBlur = 0;
            });
            rafRef.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity: 0.8 }}
        />
    );
}

// ─── Mosque Silhouette SVG ───────────────────────────────
function MosqueSilhouette() {
    return (
        <svg viewBox="0 0 400 200" className="w-full max-w-[280px] mx-auto" fill="none">
            {/* Main dome */}
            <ellipse cx="200" cy="100" rx="60" ry="55" fill="url(#mosqueGrad)" opacity="0.9" />
            {/* Left small dome */}
            <ellipse cx="120" cy="115" rx="30" ry="28" fill="url(#mosqueGrad)" opacity="0.7" />
            {/* Right small dome */}
            <ellipse cx="280" cy="115" rx="30" ry="28" fill="url(#mosqueGrad)" opacity="0.7" />
            {/* Central minaret */}
            <rect x="195" y="45" width="10" height="60" rx="3" fill="url(#mosqueGrad)" opacity="0.85" />
            {/* Crescent */}
            <circle cx="200" cy="40" r="6" fill="#D4AF37" opacity="0.9" />
            <circle cx="202" cy="39" r="5" fill="#0d4a2e" />
            {/* Left minaret */}
            <rect x="85" y="75" width="8" height="55" rx="2" fill="url(#mosqueGrad)" opacity="0.6" />
            <circle cx="89" cy="72" r="4" fill="#D4AF37" opacity="0.6" />
            <circle cx="90.5" cy="71.5" r="3" fill="#0d4a2e" />
            {/* Right minaret */}
            <rect x="307" y="75" width="8" height="55" rx="2" fill="url(#mosqueGrad)" opacity="0.6" />
            <circle cx="311" cy="72" r="4" fill="#D4AF37" opacity="0.6" />
            <circle cx="312.5" cy="71.5" r="3" fill="#0d4a2e" />
            {/* Base */}
            <rect x="70" y="130" width="260" height="40" rx="4" fill="url(#mosqueGrad)" opacity="0.5" />
            {/* Windows */}
            <rect x="175" y="110" width="12" height="20" rx="6" fill="#D4AF37" opacity="0.15" />
            <rect x="195" y="110" width="12" height="20" rx="6" fill="#D4AF37" opacity="0.15" />
            <rect x="215" y="110" width="12" height="20" rx="6" fill="#D4AF37" opacity="0.15" />
            {/* Gradient defs */}
            <defs>
                <linearGradient id="mosqueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.08" />
                </linearGradient>
            </defs>
        </svg>
    );
}

// ─── Shimmer Keyframes (injected via style tag) ──────────
const shimmerCSS = `
@keyframes premium-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
@keyframes premium-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.85; }
}
@keyframes premium-breathe {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.08); }
}
@keyframes premium-badge-pulse {
    0%, 100% { box-shadow: 0 0 12px rgba(212,175,55,0.3); }
    50% { box-shadow: 0 0 24px rgba(212,175,55,0.6); }
}
`;

// ─── Stagger animation variants ──────────────────────────
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
};

// ─── Main Component ──────────────────────────────────────
export default function PremiumPaywall() {
    const navigate = useNavigate();
    const { t } = useTranslation('common');
    const { selection, success } = useHaptics();
    const [selectedPlan, setSelectedPlan] = useState('yearly');

    const handleClose = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    const handleSubscribe = useCallback(() => {
        success();
        // TODO: Integrate with real IAP
        localStorage.setItem('isPremium', 'true');
        navigate('/');
    }, [success, navigate]);

    const benefits = [
        { icon: Shield, labelKey: 'premium.benefit_adfree', highlight: true },
        { icon: BookOpen, labelKey: 'premium.benefit_quran' },
        { icon: Zap, labelKey: 'premium.benefit_khatam' },
        { icon: BarChart3, labelKey: 'premium.benefit_analytics' },
    ];

    return (
        <>
            <style>{shimmerCSS}</style>
            <GoldParticles />

            <motion.div
                className="fixed inset-0 z-50 overflow-y-auto"
                style={{
                    background: 'linear-gradient(170deg, #0d4a2e 0%, #072a1a 25%, #041c11 55%, #010d07 100%)',
                }}
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Islamic geometric pattern overlay */}
                <div
                    className="fixed inset-0 pointer-events-none opacity-[0.02] z-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4AF37' stroke-width='0.5'%3E%3Cpath d='M40 0L50 15L65 10L55 25L70 30L55 35L65 50L50 45L40 60L30 45L15 50L25 35L10 30L25 25L15 10L30 15Z'/%3E%3Ccircle cx='40' cy='30' r='8'/%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: '80px 80px',
                    }}
                />

                {/* Ambient glows */}
                <div className="fixed top-[-10%] right-[-5%] w-72 h-72 rounded-full blur-[120px] pointer-events-none z-0"
                    style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.12), transparent 70%)', animation: 'premium-breathe 6s ease-in-out infinite' }}
                />
                <div className="fixed bottom-[-10%] left-[-10%] w-80 h-80 rounded-full blur-[140px] pointer-events-none z-0"
                    style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.10), transparent 70%)', animation: 'premium-breathe 8s ease-in-out infinite 2s' }}
                />

                {/* Close Button */}
                <motion.button
                    onClick={handleClose}
                    className="fixed top-5 right-5 z-[60] w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/30 hover:text-white/60 hover:bg-white/10 transition-all active:scale-90"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <X size={18} />
                </motion.button>

                {/* Content */}
                <div className="relative z-10 px-6 pt-14 pb-12 max-w-lg mx-auto">

                    {/* ═══ HERO ═══ */}
                    <motion.div className="text-center mb-8" variants={itemVariants}>
                        {/* Breathing glow behind mosque */}
                        <div className="relative">
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.15) 0%, transparent 60%)',
                                    animation: 'premium-breathe 4s ease-in-out infinite',
                                }}
                            />
                            <MosqueSilhouette />
                        </div>

                        <motion.div
                            className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 mb-4"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', delay: 0.4 }}
                        >
                            <Crown size={14} className="text-[#D4AF37]" />
                            <span className="text-[#D4AF37] text-xs font-bold tracking-wider uppercase">Premium</span>
                        </motion.div>

                        <h1 className="text-[#D4AF37] font-serif text-[26px] font-bold leading-tight tracking-tight mb-2">
                            {t('premium.headline')}
                        </h1>
                        <p className="text-white/40 text-sm leading-relaxed max-w-xs mx-auto">
                            {t('premium.subheadline')}
                        </p>
                    </motion.div>

                    {/* ═══ SOCIAL PROOF ═══ */}
                    <motion.div
                        className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 mb-8 text-center"
                        variants={itemVariants}
                    >
                        <div className="flex justify-center gap-1 mb-3">
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0, rotate: -30 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', delay: 0.5 + i * 0.08 }}
                                >
                                    <Star size={18} className="text-[#D4AF37] fill-[#D4AF37]" />
                                </motion.div>
                            ))}
                        </div>
                        <p className="text-white/50 text-sm italic leading-relaxed">
                            "{t('premium.testimonial_quote')}"
                        </p>
                        <p className="text-[#D4AF37]/60 text-xs font-medium mt-2">
                            — {t('premium.testimonial_author')}
                        </p>
                    </motion.div>

                    {/* ═══ BENEFITS ═══ */}
                    <motion.div className="space-y-3 mb-8" variants={itemVariants}>
                        {benefits.map((b, i) => (
                            <motion.div
                                key={i}
                                className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${b.highlight
                                        ? 'bg-[#D4AF37]/8 border border-[#D4AF37]/15'
                                        : 'bg-white/[0.02]'
                                    }`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + i * 0.1 }}
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${b.highlight
                                        ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/25'
                                        : 'bg-white/5 border border-white/10'
                                    }`}>
                                    <b.icon size={16} className={b.highlight ? 'text-[#D4AF37]' : 'text-emerald-400'} />
                                </div>
                                <span className={`text-sm font-semibold ${b.highlight ? 'text-[#D4AF37]' : 'text-white/80'}`}>
                                    {t(b.labelKey)}
                                </span>
                                {b.highlight && (
                                    <Check size={16} className="text-[#D4AF37] ml-auto" />
                                )}
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* ═══ PRICING CARDS ═══ */}
                    <motion.div className="space-y-3 mb-8" variants={itemVariants}>

                        {/* Monthly — Flat, understated */}
                        <button
                            onClick={() => { selection(); setSelectedPlan('monthly'); }}
                            className={`w-full text-left p-5 rounded-xl border-2 transition-all ${selectedPlan === 'monthly'
                                    ? 'border-white/20 bg-white/[0.04]'
                                    : 'border-white/5 bg-white/[0.02]'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/80 font-bold text-base">{t('premium.plan_monthly')}</p>
                                    <p className="text-white/30 text-xs mt-0.5">{t('premium.plan_monthly_desc')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white/70 font-bold text-lg">149.99 ₺</p>
                                    <p className="text-white/25 text-[11px]">/ {t('premium.month')}</p>
                                </div>
                            </div>
                        </button>

                        {/* Yearly — THE HERO CARD */}
                        <button
                            onClick={() => { selection(); setSelectedPlan('yearly'); }}
                            className={`relative w-full text-left p-5 rounded-xl border-2 transition-all overflow-hidden ${selectedPlan === 'yearly'
                                    ? 'border-[#D4AF37]/60 bg-[#D4AF37]/[0.06]'
                                    : 'border-[#D4AF37]/20 bg-[#D4AF37]/[0.03]'
                                }`}
                            style={{
                                boxShadow: selectedPlan === 'yearly'
                                    ? '0 0 30px rgba(212,175,55,0.12), inset 0 1px 0 rgba(212,175,55,0.1)'
                                    : 'none'
                            }}
                        >
                            {/* Pulsing badge */}
                            <div
                                className="absolute -top-0 right-4 px-3 py-1 rounded-b-lg text-[10px] font-black uppercase tracking-wider text-[#021a0f]"
                                style={{
                                    background: 'linear-gradient(135deg, #FFD700, #D4AF37)',
                                    animation: 'premium-badge-pulse 2s ease-in-out infinite',
                                }}
                            >
                                {t('premium.badge_best_value')}
                            </div>

                            <div className="flex items-center justify-between mt-3">
                                <div>
                                    <p className="text-[#D4AF37] font-bold text-base">{t('premium.plan_yearly')}</p>
                                    <p className="text-white/40 text-xs mt-0.5">
                                        {t('premium.plan_yearly_per_month')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[#D4AF37] font-bold text-lg">999.99 ₺</p>
                                    <p className="text-[#D4AF37]/50 text-[11px]">/ {t('premium.year')}</p>
                                </div>
                            </div>

                            {/* Trial info */}
                            <div className="mt-3 pt-3 border-t border-[#D4AF37]/10 flex items-center gap-2">
                                <div className="w-5 h-5 rounded-md bg-[#D4AF37]/15 flex items-center justify-center">
                                    <Check size={12} className="text-[#D4AF37]" />
                                </div>
                                <span className="text-[#D4AF37]/70 text-xs font-bold">
                                    {t('premium.trial_included')}
                                </span>
                            </div>
                        </button>
                    </motion.div>

                    {/* ═══ CTA BUTTON ═══ */}
                    <motion.div variants={itemVariants}>
                        <motion.button
                            onClick={handleSubscribe}
                            className="relative w-full py-4 rounded-2xl font-bold text-[15px] text-[#021a0f] overflow-hidden active:scale-[0.97] transition-transform"
                            style={{
                                background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #FFD700 100%)',
                                boxShadow: '0 6px 32px rgba(212,175,55,0.3), inset 0 1px 0 rgba(255,255,255,0.25)',
                            }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {/* Shimmer effect */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.35) 55%, transparent 65%)',
                                    backgroundSize: '200% 100%',
                                    animation: 'premium-shimmer 3s ease-in-out infinite',
                                }}
                            />
                            <span className="relative z-10 block">
                                {selectedPlan === 'yearly'
                                    ? t('premium.cta_trial')
                                    : t('premium.cta_subscribe')
                                }
                            </span>
                        </motion.button>

                        {/* Disclaimer */}
                        <p className="text-center text-white/25 text-[11px] mt-3 leading-relaxed">
                            {selectedPlan === 'yearly'
                                ? t('premium.disclaimer_yearly')
                                : t('premium.disclaimer_monthly')
                            }
                        </p>
                    </motion.div>

                    {/* ═══ FOOTER ═══ */}
                    <motion.div
                        className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-white/5"
                        variants={itemVariants}
                    >
                        <button className="text-white/20 text-[11px] hover:text-white/40 transition-colors">
                            {t('premium.restore')}
                        </button>
                        <span className="text-white/10">•</span>
                        <button
                            onClick={() => navigate('/settings/legal')}
                            className="text-white/20 text-[11px] hover:text-white/40 transition-colors"
                        >
                            {t('premium.terms')}
                        </button>
                        <span className="text-white/10">•</span>
                        <button
                            onClick={() => navigate('/legal/privacy')}
                            className="text-white/20 text-[11px] hover:text-white/40 transition-colors"
                        >
                            {t('premium.privacy')}
                        </button>
                    </motion.div>
                </div>
            </motion.div>
        </>
    );
}
