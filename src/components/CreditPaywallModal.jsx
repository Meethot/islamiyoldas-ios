import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, Heart, Play, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePopup } from '@/hooks/usePopup';

const RING_RADIUS = 65;
const RING_STROKE = 8;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function CreditPaywallModal({
    isOpen,
    onClose,
    credits = 0,
    cost = 50,
    adReward = 5,
    onGoPremium,
    onEarnAmin,
    onWatchAd,
}) {
    const { t } = useTranslation('dua');
    const { isActive, requestShow, dismiss } = usePopup('credit_paywall');

    React.useEffect(() => {
        if (isOpen) {
            requestShow();
        } else {
            dismiss();
        }
    }, [isOpen, requestShow, dismiss]);

    const progress = useMemo(() => Math.min(1, credits / cost), [credits, cost]);
    const dashOffset = RING_CIRCUMFERENCE - progress * RING_CIRCUMFERENCE;
    const remaining = Math.max(0, cost - credits);
    const isReady = credits >= cost;

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    className="fixed inset-0 z-[200] flex items-end justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal Sheet */}
                    <motion.div
                        className="relative w-full max-w-lg rounded-t-[2.5rem] overflow-hidden touch-none bg-[linear-gradient(160deg,#8a4a0f_0%,#4a2708_35%,#2a1605_65%,#100903_100%)] dark:bg-[linear-gradient(160deg,#0d4a2e_0%,#072a1a_35%,#041c11_65%,#020f09_100%)]"
                        style={{
                            maxHeight: '92vh',
                        }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.6 }}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100 || info.velocity.y > 300) {
                                onClose();
                            }
                        }}
                    >
                        {/* Mesh Gradient Overlay */}
                        <div
                            className="absolute inset-0 pointer-events-none opacity-60"
                            style={{
                                background: 'radial-gradient(ellipse at 20% 0%, rgba(212,175,55,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(217,119,6,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.03) 0%, transparent 70%)',
                            }}
                        />

                        {/* Geometric Islamic Pattern */}
                        <div
                            className="absolute inset-0 pointer-events-none opacity-[0.025]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4AF37' stroke-width='0.5'%3E%3Cpath d='M40 0L50 15L65 10L55 25L70 30L55 35L65 50L50 45L40 60L30 45L15 50L25 35L10 30L25 25L15 10L30 15Z'/%3E%3Ccircle cx='40' cy='30' r='8'/%3E%3C/g%3E%3C/svg%3E")`,
                                backgroundSize: '80px 80px',
                            }}
                        />

                        {/* Noise Texture */}
                        <div
                            className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                            }}
                        />

                        {/* Ambient Glow Orbs — Enhanced */}
                        <div className="absolute top-[-15%] right-[-10%] w-64 h-64 rounded-full blur-[100px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.12), transparent 70%)' }} />
                        <div className="absolute bottom-[-10%] left-[-15%] w-72 h-72 rounded-full blur-[120px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(217,119,6,0.15), transparent 70%)' }} />
                        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-40 h-40 rounded-full blur-[80px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.06), transparent 70%)' }} />

                        {/* Top edge gold line accent */}
                        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent pointer-events-none" />

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/30 hover:text-white/60 hover:bg-white/10 transition-all active:scale-90"
                        >
                            <X size={16} />
                        </button>

                        {/* Scrollable Content */}
                        <div className="relative z-10 overflow-y-auto px-6 pt-4 pb-8" style={{ maxHeight: '92vh' }}>
                            {/* Drag Handle */}
                            <div className="w-10 h-1.5 bg-white/15 rounded-full mx-auto mb-6" />

                            {/* Hero Section */}
                            <motion.div
                                className="text-center mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15, duration: 0.5 }}
                            >
                                {/* Crown Icon Box */}
                                <motion.div
                                    className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center border border-[#D4AF37]/25"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
                                        boxShadow: '0 0 30px rgba(212,175,55,0.12)',
                                    }}
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.3 }}
                                >
                                    <Crown size={28} className="text-[#D4AF37]" />
                                </motion.div>

                                <h2 className="text-[#D4AF37] font-serif text-2xl font-bold tracking-tight mb-1">
                                    {t('paywallTitle2')}
                                </h2>
                                <p className="text-white/40 text-sm font-medium">
                                    {t('paywallSubtitle')}
                                </p>
                            </motion.div>

                            {/* Credit Progress Ring */}
                            <motion.div
                                className="flex flex-col items-center mb-6"
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.25, duration: 0.5 }}
                            >
                                <div className="relative w-40 h-40 flex items-center justify-center">
                                    {/* SVG Ring */}
                                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
                                        {/* Background Ring */}
                                        <circle
                                            cx="80" cy="80" r={RING_RADIUS}
                                            stroke="currentColor"
                                            strokeWidth={RING_STROKE}
                                            fill="transparent"
                                            className="text-white/5"
                                        />
                                        {/* Progress Ring */}
                                        <motion.circle
                                            cx="80" cy="80" r={RING_RADIUS}
                                            stroke="url(#goldGradient)"
                                            strokeWidth={RING_STROKE}
                                            fill="transparent"
                                            strokeDasharray={RING_CIRCUMFERENCE}
                                            strokeLinecap="round"
                                            initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                                            animate={{ strokeDashoffset: dashOffset }}
                                            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                                            style={{
                                                filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.4))',
                                            }}
                                        />
                                        {/* Gradient Definition */}
                                        <defs>
                                            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#D4AF37" />
                                                <stop offset="100%" stopColor="#F5D67B" />
                                            </linearGradient>
                                        </defs>
                                    </svg>

                                    {/* Center Content */}
                                    <div className="flex flex-col items-center">
                                        <motion.span
                                            className="text-4xl font-mono font-bold text-white tracking-tighter"
                                            key={credits}
                                            initial={{ scale: 1.2, opacity: 0.6 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {credits}
                                        </motion.span>
                                        <span className="text-white/25 text-xs font-bold mt-0.5">/ {cost}</span>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className={`mt-3 px-4 py-1.5 rounded-full text-xs font-bold ${isReady
                                    ? 'bg-amber-500/15 dark:bg-emerald-500/15 text-amber-400 dark:text-emerald-400 border border-amber-500/25 dark:border-emerald-500/25'
                                    : 'bg-white/5 text-white/50 border border-white/10'
                                    }`}>
                                    {isReady ? t('paywallReady') : t('paywallRemaining', { count: remaining })}
                                </div>
                            </motion.div>

                            {/* Premium CTA Hero */}
                            <motion.button
                                onClick={onGoPremium}
                                className="relative w-full rounded-2xl p-4 flex items-center justify-between overflow-hidden mb-5 active:scale-[0.97] transition-transform"
                                style={{
                                    background: 'linear-gradient(135deg, #D4AF37 0%, #C49B2C 50%, #D4AF37 100%)',
                                    boxShadow: '0 4px 24px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
                                }}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35, duration: 0.45 }}
                            >
                                {/* Shimmer Effect */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.25) 55%, transparent 60%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'paywall-shimmer 3s ease-in-out infinite',
                                    }}
                                />
                                <div className="flex items-center gap-3 z-10">
                                    <div className="w-10 h-10 rounded-xl bg-[#021a0f]/20 flex items-center justify-center">
                                        <Sparkles size={20} className="text-[#021a0f]" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[#021a0f] font-bold text-base leading-tight">
                                            {t('paywallPremiumBtn')}
                                        </p>
                                        <p className="text-[#021a0f]/60 text-xs font-medium">
                                            {t('paywallPremiumDesc')}
                                        </p>
                                    </div>
                                </div>
                                <Crown size={22} className="text-[#021a0f]/40 z-10" />
                            </motion.button>

                            {/* Separator */}
                            <motion.div
                                className="flex items-center gap-3 mb-5"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.45 }}
                            >
                                <div className="flex-1 h-px bg-white/8" />
                                <span className="text-[10px] text-white/25 font-bold uppercase tracking-[0.2em]">
                                    {t('paywallOr')}
                                </span>
                                <div className="flex-1 h-px bg-white/8" />
                            </motion.div>

                            {/* Earn Options Grid */}
                            <motion.div
                                className="grid grid-cols-2 gap-3 mb-2"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.4 }}
                            >
                                {/* Amin Card */}
                                <button
                                    onClick={onEarnAmin}
                                    className="relative bg-white/[0.04] backdrop-blur-sm border border-amber-500/15 dark:border-emerald-500/15 rounded-2xl p-4 text-left transition-all active:scale-[0.96] hover:bg-white/[0.07] hover:border-amber-500/30 dark:hover:border-emerald-500/30 group"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-emerald-500/10 flex items-center justify-center border border-amber-500/20 dark:border-emerald-500/20">
                                            <Heart size={16} className="text-amber-400 dark:text-emerald-400" />
                                        </div>
                                        <span className="text-[11px] font-bold bg-amber-500/15 dark:bg-emerald-500/15 text-amber-400 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-amber-500/20 dark:border-emerald-500/20">
                                            +1
                                        </span>
                                    </div>
                                    <p className="text-white/90 text-sm font-bold leading-tight mb-0.5">
                                        {t('paywallEarnAminTitle')}
                                    </p>
                                    <p className="text-white/30 text-[11px] font-medium">
                                        {t('paywallEarnAminDesc')}
                                    </p>
                                </button>

                                {/* Watch Ad Card */}
                                <button
                                    onClick={onWatchAd}
                                    className="relative bg-white/[0.04] backdrop-blur-sm border border-[#D4AF37]/15 rounded-2xl p-4 text-left transition-all active:scale-[0.96] hover:bg-white/[0.07] hover:border-[#D4AF37]/30 group"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
                                            <Play size={16} className="text-[#D4AF37]" fill="currentColor" />
                                        </div>
                                        <span className="text-[11px] font-bold bg-[#D4AF37]/15 text-[#D4AF37] px-2.5 py-1 rounded-full border border-[#D4AF37]/20">
                                            +{adReward}
                                        </span>
                                    </div>
                                    <p className="text-white/90 text-sm font-bold leading-tight mb-0.5">
                                        {t('paywallWatchAdTitle')}
                                    </p>
                                    <p className="text-white/30 text-[11px] font-medium">
                                        {t('paywallWatchAdDesc')}
                                    </p>
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Shimmer Keyframes */}
                    <style>{`
                        @keyframes paywall-shimmer {
                            0% { background-position: 200% 0; }
                            100% { background-position: -200% 0; }
                        }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
