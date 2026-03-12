import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Server, Sparkles, Lock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CONSENT_KEY = 'ai_mentor_consent';

export function hasAiConsent() {
    return localStorage.getItem(CONSENT_KEY) === 'granted';
}

export function revokeAiConsent() {
    localStorage.removeItem(CONSENT_KEY);
}

// ─── Crescent Moon Hero (matches Paywall style) ───────────
function CrescentHero() {
    return (
        <div className="relative w-[90px] h-[90px] mx-auto">
            {/* Ambient glow layers */}
            <div className="absolute inset-[-35%] pointer-events-none" style={{
                background: 'radial-gradient(circle at 50% 45%, rgba(212,175,55,0.1) 0%, transparent 60%)',
                animation: 'aic-breathe 5s ease-in-out infinite',
            }} />
            <div className="absolute inset-[-10%] pointer-events-none" style={{
                background: 'radial-gradient(circle at 50% 48%, rgba(255,215,0,0.08) 0%, transparent 50%)',
                animation: 'aic-breathe 3.5s ease-in-out infinite 1s',
            }} />

            <svg viewBox="0 0 120 120" className="w-full h-full" fill="none">
                <defs>
                    <linearGradient id="aic-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFE066" stopOpacity="0.95" />
                        <stop offset="40%" stopColor="#FFD700" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.7" />
                    </linearGradient>
                    <radialGradient id="aic-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FFD700" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                    </radialGradient>
                    <filter id="aic-blur">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                    </filter>
                </defs>

                {/* Subtle rotating dots */}
                <g style={{ transformOrigin: '60px 60px', animation: 'aic-rotate 40s linear infinite' }}>
                    {[...Array(8)].map((_, i) => {
                        const angle = (i * 45) * Math.PI / 180;
                        const x = 60 + 50 * Math.cos(angle);
                        const y = 60 + 50 * Math.sin(angle);
                        return <circle key={i} cx={x} cy={y} r={i % 2 === 0 ? 1 : 0.6} fill="#D4AF37" opacity={0.08 + (i % 3) * 0.04} />;
                    })}
                </g>

                {/* Inner glow */}
                <circle cx="60" cy="56" r="30" fill="url(#aic-glow)" style={{ animation: 'aic-breathe 4s ease-in-out infinite 0.5s' }} />

                {/* Moon glow */}
                <g filter="url(#aic-blur)" opacity="0.3">
                    <circle cx="60" cy="55" r="22" fill="#FFD700" />
                </g>

                {/* Crescent moon */}
                <circle cx="60" cy="55" r="22" fill="url(#aic-gold)" opacity="0.9" />
                <circle cx="68" cy="50" r="17" fill="#072a1a" />
                <circle cx="69" cy="49" r="16" fill="#041c11" opacity="0.5" />

                {/* Stars */}
                {[
                    [88, 38, 1.1], [32, 35, 0.8], [85, 72, 0.7],
                    [38, 70, 0.9], [75, 28, 0.6],
                ].map(([cx, cy, r], i) => (
                    <circle key={i} cx={cx} cy={cy} r={r}
                        fill={i % 2 === 0 ? '#FFD700' : '#D4AF37'}
                        opacity={0.1 + (i % 4) * 0.05}
                        style={{ animation: `aic-breathe ${3 + i * 0.8}s ease-in-out infinite ${i * 0.5}s` }}
                    />
                ))}

                {/* Sparkle near moon */}
                <g style={{ animation: 'aic-breathe 2.5s ease-in-out infinite' }}>
                    <line x1="42" y1="42" x2="46" y2="42" stroke="#FFD700" strokeWidth="0.8" opacity="0.5" />
                    <line x1="44" y1="40" x2="44" y2="44" stroke="#FFD700" strokeWidth="0.8" opacity="0.5" />
                </g>
            </svg>
        </div>
    );
}

// ─── CSS ──────────────────────────────────────────────────
const css = `
@keyframes aic-breathe {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.7; }
}
@keyframes aic-rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
@keyframes aic-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
`;

// ─── Info Row ─────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, delay }) {
    return (
        <motion.div
            className="flex items-start gap-3 py-2.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.35, ease: 'easeOut' }}
        >
            <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(255,215,0,0.06) 100%)',
                    boxShadow: '0 0 12px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,215,0,0.12)',
                }}
            >
                <Icon size={14} className="text-[#D4AF37]" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-white/75 leading-tight">{label}</p>
                <p className="text-[12px] text-white/40 leading-snug mt-0.5">{value}</p>
            </div>
        </motion.div>
    );
}

// ─── Main Modal ───────────────────────────────────────────
export default function AiConsentModal({ onAccept, onDecline }) {
    const { t } = useTranslation('misc');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleAccept = () => {
        localStorage.setItem(CONSENT_KEY, 'granted');
        onAccept?.();
    };

    return (
        <>
            <style>{css}</style>
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-end justify-center"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Backdrop — instant opacity to hide background */}
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={onDecline}
                        />

                        {/* Bottom Sheet */}
                        <motion.div
                            className="relative w-full max-w-lg z-10 max-h-[85vh] flex flex-col"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={{ top: 0, bottom: 0.6 }}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 80 || info.velocity.y > 300) {
                                    onDecline?.();
                                }
                            }}
                            style={{ touchAction: 'none' }}
                        >
                            <div
                                className="relative overflow-hidden rounded-t-[24px] flex flex-col max-h-[85vh]"
                                style={{
                                    background: 'linear-gradient(175deg, #0d3d24 0%, #072a1a 30%, #041c11 65%, #021209 100%)',
                                }}
                            >
                                {/* Islamic pattern overlay */}
                                <div
                                    className="absolute inset-0 pointer-events-none opacity-[0.012] z-0"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4AF37' stroke-width='0.4'%3E%3Cpath d='M30 0L38 12L50 8L42 20L54 24L42 28L50 40L38 36L30 48L22 36L10 40L18 28L6 24L18 20L10 8L22 12Z'/%3E%3Ccircle cx='30' cy='24' r='6'/%3E%3C/g%3E%3C/svg%3E")`,
                                        backgroundSize: '60px 60px',
                                    }}
                                />

                                {/* Handle bar */}
                                <div className="flex justify-center pt-3 pb-0 flex-shrink-0 relative z-10">
                                    <div className="w-9 h-1 rounded-full bg-white/8" />
                                </div>

                                {/* Close button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDecline?.(); }}
                                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/40 hover:text-white/60 active:bg-white/20 transition-colors z-20"
                                >
                                    <X size={16} />
                                </button>

                                {/* Scrollable Content */}
                                <div className="relative z-10 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] overflow-y-auto flex-1">

                                    {/* Hero */}
                                    <motion.div
                                        className="text-center mb-3 pt-2"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15, duration: 0.45 }}
                                    >
                                        <CrescentHero />

                                        <h2 className="text-[#D4AF37] font-serif text-[22px] font-bold leading-tight mt-1.5">
                                            {t('aiConsent.title')}
                                        </h2>
                                        <p className="text-white/40 text-[13px] leading-relaxed mt-2 max-w-[280px] mx-auto">
                                            {t('aiConsent.subtitle')}
                                        </p>
                                    </motion.div>

                                    {/* Third-party badge */}
                                    <motion.div
                                        className="flex items-center justify-center gap-2 mb-3"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.25 }}
                                    >
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D4AF37]/5 border border-[#D4AF37]/10">
                                            <ShieldCheck size={12} className="text-[#D4AF37]/60" />
                                            <span className="text-[#D4AF37]/50 text-[10px] font-medium tracking-wide uppercase">
                                                {t('aiConsent.third_party_badge')}
                                            </span>
                                        </div>
                                    </motion.div>

                                    {/* Info card */}
                                    <motion.div
                                        className="bg-white/[0.02] border border-[#D4AF37]/8 rounded-2xl px-3.5 py-1 mb-3.5"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <InfoRow
                                            icon={ShieldCheck}
                                            label={t('aiConsent.data_sent_label')}
                                            value={t('aiConsent.data_sent_value')}
                                            delay={0.35}
                                        />
                                        <div className="border-t border-white/[0.03]" />
                                        <InfoRow
                                            icon={Server}
                                            label={t('aiConsent.provider_label')}
                                            value={t('aiConsent.provider_value')}
                                            delay={0.42}
                                        />
                                        <div className="border-t border-white/[0.03]" />
                                        <InfoRow
                                            icon={Sparkles}
                                            label={t('aiConsent.purpose_label')}
                                            value={t('aiConsent.purpose_value')}
                                            delay={0.49}
                                        />
                                        <div className="border-t border-white/[0.03]" />
                                        <InfoRow
                                            icon={Lock}
                                            label={t('aiConsent.storage_label')}
                                            value={t('aiConsent.storage_value')}
                                            delay={0.56}
                                        />
                                    </motion.div>

                                    {/* Accept button — golden */}
                                    <motion.button
                                        onClick={handleAccept}
                                        className="relative w-full py-3.5 rounded-2xl font-bold text-[15px] text-[#021a0f] overflow-hidden active:scale-[0.97] transition-transform"
                                        style={{
                                            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #FFD700 100%)',
                                            boxShadow: '0 4px 20px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
                                        }}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <div
                                            className="absolute inset-0 pointer-events-none"
                                            style={{
                                                background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.25) 55%, transparent 65%)',
                                                backgroundSize: '200% 100%',
                                                animation: 'aic-shimmer 3s ease-in-out infinite',
                                            }}
                                        />
                                        <span className="relative z-10 text-[16px]">{t('aiConsent.accept')}</span>
                                    </motion.button>

                                    {/* Decline */}
                                    <motion.button
                                        onClick={onDecline}
                                        className="w-full mt-2 py-2 text-white/30 text-[13px] font-medium hover:text-white/45 transition-colors text-center"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.7 }}
                                    >
                                        {t('aiConsent.decline')}
                                    </motion.button>

                                    {/* Privacy link */}
                                    <motion.p
                                        className="text-center text-white/20 text-[11px] mt-0.5 mb-1"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.75 }}
                                    >
                                        {t('aiConsent.privacy_note')}{' '}
                                        <button
                                            onClick={() => window.open('https://www.islamiyoldas.com/privacy', '_blank')}
                                            className="underline underline-offset-2 text-[#D4AF37]/30 hover:text-[#D4AF37]/50 transition-colors"
                                        >
                                            {t('aiConsent.privacy_link')}
                                        </button>
                                    </motion.p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
