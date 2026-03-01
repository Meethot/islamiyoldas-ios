import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Star, BookOpen, Users, Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useMobile';
import { setPremium } from '@/services/creditService';

// ─── Gold Dust Particles (Canvas) ────────────────────────
function GoldParticles() {
    const canvasRef = useRef(null);
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

        const COUNT = 18;
        const particles = Array.from({ length: COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.5,
            speedX: (Math.random() - 0.5) * 0.2,
            speedY: -Math.random() * 0.25 - 0.05,
            opacity: Math.random() * 0.4 + 0.1,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.01 + 0.003,
        }));

        let frame = 0;
        const animate = () => {
            frame++;
            if (frame % 2 !== 0) { rafRef.current = requestAnimationFrame(animate); return; }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                p.pulse += p.pulseSpeed;
                const alpha = p.opacity * (0.4 + 0.6 * Math.sin(p.pulse));
                if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
                if (p.x < -10) p.x = canvas.width + 10;
                if (p.x > canvas.width + 10) p.x = -10;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(212, 175, 55, ${alpha})`;
                ctx.fill();
            });
            rafRef.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" style={{ opacity: 0.7 }} />;
}

// ─── Premium Hero Visual (Enhanced Crescent + Geometric Arcs) ─────
function PremiumHeroVisual() {
    return (
        <div className="relative w-[140px] h-[140px] mx-auto">
            {/* Layer 1: Deep ambient glow — outermost, softest */}
            <div className="absolute inset-[-40%] pointer-events-none" style={{
                background: 'radial-gradient(circle at 50% 45%, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.02) 40%, transparent 65%)',
                animation: 'pw-breathe 6s ease-in-out infinite 0.5s',
            }} />
            {/* Layer 2: Mid glow — warm golden aura */}
            <div className="absolute inset-[-15%] pointer-events-none" style={{
                background: 'radial-gradient(circle at 50% 48%, rgba(255,215,0,0.12) 0%, rgba(212,175,55,0.04) 45%, transparent 70%)',
                animation: 'pw-breathe 4.5s ease-in-out infinite',
            }} />
            {/* Layer 3: Tight core glow — concentrated light source */}
            <div className="absolute inset-[10%] pointer-events-none rounded-full" style={{
                background: 'radial-gradient(circle at 50% 45%, rgba(255,223,0,0.2) 0%, rgba(212,175,55,0.06) 50%, transparent 75%)',
                animation: 'pw-breathe 3.5s ease-in-out infinite 1.2s',
            }} />

            {/* SVG: Geometric arcs + Crescent + Star */}
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
                <defs>
                    {/* Enhanced gold gradient with warmer tones */}
                    <linearGradient id="hg-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFE066" stopOpacity="0.95" />
                        <stop offset="35%" stopColor="#FFD700" stopOpacity="0.9" />
                        <stop offset="70%" stopColor="#D4AF37" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#B8860B" stopOpacity="0.6" />
                    </linearGradient>
                    <linearGradient id="hg-fade" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.03" />
                    </linearGradient>
                    <radialGradient id="hg-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FFD700" stopOpacity="0.35" />
                        <stop offset="60%" stopColor="#D4AF37" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                    </radialGradient>
                    {/* Star radiance gradient */}
                    <radialGradient id="hg-star-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FFE066" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
                    </radialGradient>
                    <filter id="hg-blur">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
                    </filter>
                    <filter id="hg-blur-strong">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
                    </filter>
                </defs>

                {/* Outer rotating geometric ring — 16 dots for richer pattern */}
                <g style={{ transformOrigin: '100px 100px', animation: 'pw-hero-rotate 50s linear infinite' }}>
                    {[...Array(16)].map((_, i) => {
                        const angle = (i * 22.5) * Math.PI / 180;
                        const x = 100 + 88 * Math.cos(angle);
                        const y = 100 + 88 * Math.sin(angle);
                        const size = i % 2 === 0 ? 1.8 : 1;
                        return <circle key={i} cx={x} cy={y} r={size} fill="#D4AF37" opacity={0.1 + (i % 4) * 0.06} />;
                    })}
                </g>

                {/* Counter-rotating inner ring — 8 dots for depth */}
                <g style={{ transformOrigin: '100px 100px', animation: 'pw-hero-rotate 35s linear infinite reverse' }}>
                    {[...Array(8)].map((_, i) => {
                        const angle = (i * 45 + 22.5) * Math.PI / 180;
                        const x = 100 + 72 * Math.cos(angle);
                        const y = 100 + 72 * Math.sin(angle);
                        return <circle key={i} cx={x} cy={y} r="0.8" fill="#FFD700" opacity={0.08 + (i % 3) * 0.05} />;
                    })}
                </g>

                {/* Concentric decorative arcs — varied dash patterns */}
                <circle cx="100" cy="100" r="82" stroke="url(#hg-fade)" strokeWidth="0.5" opacity="0.25" />
                <circle cx="100" cy="100" r="68" stroke="url(#hg-fade)" strokeWidth="0.4" opacity="0.18" strokeDasharray="10 5 3 5" />
                <circle cx="100" cy="100" r="52" stroke="url(#hg-fade)" strokeWidth="0.3" opacity="0.12" strokeDasharray="2 8" />

                {/* Luminous inner halo — behind the moon */}
                <circle cx="100" cy="92" r="38" fill="url(#hg-glow)" style={{ animation: 'pw-breathe 4s ease-in-out infinite 0.8s' }} />

                {/* Inner glow disc */}
                <circle cx="100" cy="100" r="44" fill="url(#hg-glow)" opacity="0.7" />

                {/* Moon deep shadow layer */}
                <g filter="url(#hg-blur-strong)" opacity="0.25">
                    <circle cx="102" cy="95" r="30" fill="#D4AF37" />
                </g>

                {/* Central crescent moon — rich golden fill */}
                <g filter="url(#hg-blur)" opacity="0.35">
                    <circle cx="100" cy="92" r="28" fill="#FFD700" />
                </g>
                <circle cx="100" cy="92" r="28" fill="url(#hg-gold)" opacity="0.9" />
                {/* Moon cutout — creates crescent shape */}
                <circle cx="110" cy="86" r="22" fill="#072a1a" />
                <circle cx="111" cy="85" r="21" fill="#041c11" opacity="0.6" />
                {/* Subtle inner edge highlight */}
                <circle cx="109" cy="87" r="22.5" stroke="rgba(212,175,55,0.08)" strokeWidth="0.5" fill="none" />


                {/* Living starfield — 8 scattered stars with staggered breathing */}
                {[
                    [142, 68, 1.2], [52, 62, 0.9], [135, 122, 1.0],
                    [62, 118, 0.8], [152, 92, 0.7], [48, 88, 1.1],
                    [120, 50, 0.6], [78, 140, 0.7],
                ].map(([cx, cy, r], i) => (
                    <circle key={i} cx={cx} cy={cy} r={r}
                        fill={i % 2 === 0 ? '#FFD700' : '#D4AF37'}
                        opacity={0.1 + (i % 5) * 0.05}
                        style={{ animation: `pw-breathe ${3 + i * 0.7}s ease-in-out infinite ${i * 0.6}s` }}
                    />
                ))}

                {/* Bottom reflection pool — wider, more luminous */}
                <line x1="40" y1="155" x2="160" y2="155" stroke="url(#hg-fade)" strokeWidth="0.5" opacity="0.18" />
                <ellipse cx="100" cy="160" rx="48" ry="5" fill="url(#hg-glow)" opacity="0.12" />
                <ellipse cx="100" cy="160" rx="24" ry="2.5" fill="url(#hg-glow)" opacity="0.08" />
            </svg>
        </div>
    );
}

// ─── CSS Animations ──────────────────────────────────────
const css = `
@keyframes pw-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
@keyframes pw-breathe {
    0%, 100% { opacity: 0.35; }
    50% { opacity: 0.6; }
}
@keyframes pw-badge {
    0%, 100% { box-shadow: 0 0 10px rgba(212,175,55,0.25); }
    50% { box-shadow: 0 0 20px rgba(212,175,55,0.5); }
}
@keyframes pw-card-glow {
    0%, 100% { box-shadow: 0 0 12px rgba(212,175,55,0.08), inset 0 0 8px rgba(212,175,55,0.02); }
    50% { box-shadow: 0 0 24px rgba(212,175,55,0.2), inset 0 0 12px rgba(212,175,55,0.06); }
}
@keyframes pw-card-sweep {
    0% { transform: translateX(-100%) skewX(-15deg); }
    100% { transform: translateX(200%) skewX(-15deg); }
}
@keyframes pw-hero-rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
.pw-scroll::-webkit-scrollbar { display: none; }
.pw-scroll { scrollbar-width: none; -ms-overflow-style: none; }
`;

// ─── Testimonial data ────────────────────────────────────
const REVIEWS = {
    tr: [
        { text: "Namazlarımı hiç kaçırmıyorum artık, ezan bildirimleri çok isabetli. Allah razı olsun 🤲", author: "Fatma Y." },
        { text: "AI Mentor özelliği muhteşem, sorularıma anında cevap alıyorum. Çok faydalı bir uygulama.", author: "Ahmet K." },
        { text: "Kıble yönü çok hassas çalışıyor, seyahatlerde vazgeçilmezim oldu. Kesinlikle tavsiye ederim!", author: "Zeynep A." },
        { text: "Uyku modu harika, Mülk suresi dinleyerek uykuya dalıyorum. Huzur veriyor.", author: "Elif D." },
        { text: "Zikirmatik ile günlük hedeflerimi belirleyip takip ediyorum. Çok motive edici, ibadet rutinime ayrı bir disiplin kattı.", author: "Mehmet S." },
    ],
    en: [
        { text: "I never miss a prayer anymore, the adhan notifications are spot on. May Allah reward you 🤲", author: "Fatma Y." },
        { text: "The AI Mentor feature is amazing, I get instant answers to my questions. Very useful app.", author: "Ahmet K." },
        { text: "Qibla direction works precisely, it became essential during my travels. Highly recommend!", author: "Zeynep A." },
        { text: "Sleep mode is wonderful, I fall asleep listening to Surah Al-Mulk. So peaceful.", author: "Elif D." },
        { text: "The dhikr counter changed my daily routine. Setting goals keeps me motivated.", author: "Mehmet S." },
    ],
    de: [
        { text: "Ich verpasse kein Gebet mehr, die Gebetsruf-Benachrichtigungen sind genau. Möge Allah euch belohnen 🤲", author: "Fatma Y." },
        { text: "Die AI Mentor Funktion ist großartig, ich bekomme sofort Antworten. Sehr nützliche App.", author: "Ahmet K." },
        { text: "Die Qibla-Richtung funktioniert präzise, unverzichtbar auf Reisen. Sehr empfehlenswert!", author: "Zeynep A." },
        { text: "Der Schlafmodus ist wunderbar, ich schlafe mit Sure Al-Mulk ein. So friedlich.", author: "Elif D." },
        { text: "Der Dhikr-Zähler hat meine tägliche Routine verändert. Ziele setzen motiviert mich.", author: "Mehmet S." },
    ],
    az: [
        { text: "Artıq heç bir namazı qaçırmıram, azan bildirişləri çox dəqiqdir. Allah razı olsun 🤲", author: "Fatma Y." },
        { text: "AI Mentor xüsusiyyəti möhtəşəmdir, suallarıma dərhal cavab alıram. Çox faydalı tətbiq.", author: "Ahmet K." },
        { text: "Qiblə istiqaməti çox dəqiq işləyir, səyahətlərdə olmadan olmaz oldu. Mütləq tövsiyə edirəm!", author: "Zeynep A." },
        { text: "Yuxu rejimi heyranedicidir, Mülk surəsi dinləyərək yuxuya dalıram. Çox rahatdır.", author: "Elif D." },
        { text: "Zikr sayğacı gündəlik rutinimi dəyişdi. Hədəf qoymaq motivasiyamı artırdı.", author: "Mehmet S." },
    ],
    ru: [
        { text: "Я больше не пропускаю ни одной молитвы, уведомления азана очень точные. Да вознаградит вас Аллах 🤲", author: "Fatma Y." },
        { text: "Функция AI Mentor потрясающая, я мгновенно получаю ответы на свои вопросы.", author: "Ahmet K." },
        { text: "Направление киблы работает точно, стало незаменимым в поездках. Настоятельно рекомендую!", author: "Zeynep A." },
        { text: "Режим сна замечательный, засыпаю под суру Аль-Мульк. Так спокойно.", author: "Elif D." },
        { text: "Счётчик зикра изменил мой распорядок дня. Постановка целей мотивирует.", author: "Mehmet S." },
    ],
    ar: [
        { text: "لم أعد أفوت أي صلاة، إشعارات الأذان دقيقة جداً. جزاكم الله خيراً 🤲", author: "فاطمة ي." },
        { text: "ميزة المرشد الذكي رائعة، أحصل على إجابات فورية لأسئلتي. تطبيق مفيد جداً.", author: "أحمد ك." },
        { text: "اتجاه القبلة دقيق للغاية، أصبح لا غنى عنه في سفري. أنصح به بشدة!", author: "زينب أ." },
        { text: "وضع النوم رائع، أنام على صوت سورة الملك. هادئ جداً.", author: "إليف د." },
        { text: "عداد الأذكار غيّر روتيني اليومي. تحديد الأهداف يحفزني.", author: "محمد س." },
    ],
};

// ─── Main Component ──────────────────────────────────────
export default function PremiumPaywall() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('common');
    const { selection, success } = useHaptics();
    const [selectedPlan, setSelectedPlan] = useState('yearly');
    const [reviewIdx, setReviewIdx] = useState(0);
    const [swipeDir, setSwipeDir] = useState(1);
    const [showExitPopup, setShowExitPopup] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const socialCount = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        let hash = 0;
        for (let i = 0; i < today.length; i++) hash = ((hash << 5) - hash) + today.charCodeAt(i);
        return 2000 + Math.abs(hash % 1200);
    }, []);

    const lang = i18n.language?.split('-')[0] || 'en';
    const reviews = REVIEWS[lang] || REVIEWS.en;

    useEffect(() => {
        let autoTimer;
        const startAutoSwipe = () => {
            autoTimer = setInterval(() => {
                setSwipeDir(1);
                setReviewIdx(prev => (prev + 1) % reviews.length);
            }, 5000);
        };
        startAutoSwipe();
        return () => clearInterval(autoTimer);
    }, [reviews.length]);

    const handleClose = useCallback(() => {
        if (!showExitPopup) return setShowExitPopup(true);
        navigate('/');
    }, [navigate, showExitPopup]);

    const handleSubscribe = useCallback(() => {
        success();
        setPremium(true);
        setShowSuccess(true);
    }, [success]);

    const review = reviews[reviewIdx];

    return (
        <>
            <style>{css}</style>
            <GoldParticles />

            <div
                className="absolute inset-0 z-50 flex flex-col"
                style={{ background: 'linear-gradient(170deg, #0d4a2e 0%, #072a1a 20%, #041c11 50%, #010d07 100%)' }}
            >
                {/* Islamic pattern overlay */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.015] z-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4AF37' stroke-width='0.5'%3E%3Cpath d='M40 0L50 15L65 10L55 25L70 30L55 35L65 50L50 45L40 60L30 45L15 50L25 35L10 30L25 25L15 10L30 15Z'/%3E%3Ccircle cx='40' cy='30' r='8'/%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: '80px 80px',
                    }}
                />

                {/* Ambient glows */}
                <div className="fixed top-[-8%] right-[-5%] w-64 h-64 rounded-full blur-[100px] pointer-events-none z-0"
                    style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.1), transparent 70%)', animation: 'pw-breathe 6s ease-in-out infinite' }}
                />
                <div className="fixed bottom-[-8%] left-[-8%] w-72 h-72 rounded-full blur-[120px] pointer-events-none z-0"
                    style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%)', animation: 'pw-breathe 8s ease-in-out infinite 2s' }}
                />

                {/* Close button */}
                <motion.button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-[60] w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/25 hover:text-white/50 transition-all active:scale-90"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{ top: 'calc(0.75rem + env(safe-area-inset-top))' }}
                >
                    <X size={16} />
                </motion.button>

                {/* ═══ CONTENT ═══ */}
                <div className="relative z-10 flex-1 flex flex-col overflow-y-auto pw-scroll px-5 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(0.75rem+env(safe-area-inset-bottom))] max-w-lg mx-auto w-full">

                    {/* ── Hero: Visual + Badge + Title ── */}
                    <motion.div
                        className="text-center mb-2 flex-shrink-0"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="relative">
                            <div className="absolute inset-0 pointer-events-none"
                                style={{ background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.12) 0%, transparent 60%)', animation: 'pw-breathe 4s ease-in-out infinite' }}
                            />
                            <PremiumHeroVisual />
                        </div>

                        {/* Premium badge — centered */}
                        <motion.div
                            className="flex justify-center mt-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, duration: 0.5 }}
                        >
                            <div className="relative inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#D4AF37]/30 overflow-hidden"
                                style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 100%)' }}
                            >
                                <div className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: 'linear-gradient(105deg, transparent 35%, rgba(212,175,55,0.12) 45%, rgba(212,175,55,0.2) 50%, rgba(212,175,55,0.12) 55%, transparent 65%)',
                                        animation: 'pw-card-sweep 3.5s ease-in-out infinite',
                                    }}
                                />
                                <Crown size={16} className="text-[#D4AF37]" />
                                <span className="text-[#D4AF37] text-sm font-black tracking-[0.15em] uppercase"
                                    style={{ textShadow: '0 0 12px rgba(212,175,55,0.3)' }}
                                >Premium</span>
                            </div>
                        </motion.div>

                        {/* Rating line */}
                        <div className="flex items-center justify-center gap-1.5 mt-2">
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={10} className="text-[#D4AF37] fill-[#D4AF37]" />
                                ))}
                            </div>
                            <span className="text-white/40 text-[12px] font-medium">4.9 {t('premium.stars')} • 1,000+ {t('premium.reviews')}</span>
                        </div>

                        <h1 className="text-[#D4AF37] font-serif text-[22px] font-bold leading-tight tracking-tight mt-2">
                            {t('premium.headline')}
                        </h1>
                        <p className="text-white/35 text-[12px] leading-relaxed mt-1 max-w-[280px] mx-auto">
                            {t('premium.subheadline')}
                        </p>
                    </motion.div>

                    {/* ── Features ── */}
                    <motion.div
                        className="flex flex-col gap-0.5 mb-2 flex-shrink-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        {[
                            { emoji: '🤖', title: t('premium.feat_ai_title'), desc: t('premium.feat_ai_desc') },
                            { emoji: '🎧', title: t('premium.feat_audio_title'), desc: t('premium.feat_audio_desc') },
                            { emoji: '📿', title: t('premium.feat_worship_title'), desc: t('premium.feat_worship_desc') },
                            { emoji: '🤝', title: t('premium.feat_community_title'), desc: t('premium.feat_community_desc') },
                        ].map((f, i) => (
                            <motion.div
                                key={i}
                                className="flex items-start gap-2.5 px-3 py-1 rounded-lg"
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 + i * 0.07 }}
                            >
                                <span className="text-sm flex-shrink-0 mt-px">{f.emoji}</span>
                                <div className="min-w-0">
                                    <p className="text-[14px] font-bold text-white/85 leading-tight">{f.title}</p>
                                    <p className="text-[12px] text-white/40 leading-snug mt-0.5">{f.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* ── Reviews (swipeable) ── */}
                    <motion.div
                        className="bg-white/[0.025] border border-white/[0.04] rounded-2xl p-3 mb-2 flex-shrink-0 overflow-hidden"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <svg width="12" height="18" viewBox="0 0 14 20" fill="none" className="flex-shrink-0 opacity-50">
                                    <path d="M12 2C10 4 8 6 7 10C6 6 4 4 2 2" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" fill="none" />
                                    <path d="M12 6C10 8 8 9 7 12C6 9 4 8 2 6" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" fill="none" />
                                    <path d="M12 10C10 12 8 13 7 15C6 13 4 12 2 10" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" fill="none" />
                                </svg>
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={12} className="text-[#D4AF37] fill-[#D4AF37]" />
                                    ))}
                                </div>
                                <svg width="12" height="18" viewBox="0 0 14 20" fill="none" className="flex-shrink-0 opacity-50 scale-x-[-1]">
                                    <path d="M12 2C10 4 8 6 7 10C6 6 4 4 2 2" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" fill="none" />
                                    <path d="M12 6C10 8 8 9 7 12C6 9 4 8 2 6" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" fill="none" />
                                    <path d="M12 10C10 12 8 13 7 15C6 13 4 12 2 10" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" fill="none" />
                                </svg>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[#D4AF37] text-sm font-bold">4.9</span>
                                <span className="text-white/25 text-[11px]">• 1,000+ {t('premium.reviews')}</span>
                            </div>
                        </div>

                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={reviewIdx}
                                initial={{ opacity: 0, x: swipeDir * 60 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: swipeDir * -60 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.15}
                                onDragEnd={(_, info) => {
                                    if (info.offset.x < -40) {
                                        setSwipeDir(1);
                                        setReviewIdx(p => (p + 1) % reviews.length);
                                    } else if (info.offset.x > 40) {
                                        setSwipeDir(-1);
                                        setReviewIdx(p => (p - 1 + reviews.length) % reviews.length);
                                    }
                                }}
                                style={{ touchAction: 'pan-y' }}
                            >
                                <p className="text-white/50 text-[13px] italic leading-snug mb-1">
                                    "{review.text}"
                                </p>
                                <p className="text-[#D4AF37]/50 text-[12px] font-medium">— {review.author}</p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Dots */}
                        <div className="flex justify-center gap-1.5 mt-1.5">
                            {reviews.map((_, i) => (
                                <div
                                    key={i}
                                    onClick={() => { setSwipeDir(i > reviewIdx ? 1 : -1); setReviewIdx(i); }}
                                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === reviewIdx ? 'bg-[#D4AF37] w-4' : 'bg-white/15 w-1.5'}`}
                                />
                            ))}
                        </div>
                    </motion.div>

                    {/* ── Flex spacer ── */}
                    <div className="flex-1 min-h-0" />
                    {/* ── Pricing Cards ── */}
                    <motion.div
                        className="flex gap-2.5 mb-2 flex-shrink-0"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        {/* Monthly */}
                        <button
                            onClick={() => { selection(); setSelectedPlan('monthly'); }}
                            className={`flex-1 relative text-left p-3 rounded-xl border-2 transition-all overflow-hidden ${selectedPlan === 'monthly' ? 'border-white/25 bg-white/[0.05]' : 'border-white/[0.06] bg-white/[0.015]'}`}
                            style={selectedPlan === 'monthly' ? { animation: 'pw-card-glow 2.5s ease-in-out infinite' } : {}}
                        >
                            {/* Shimmer sweep */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 48%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.06) 52%, transparent 60%)',
                                    animation: 'pw-card-sweep 3s ease-in-out infinite',
                                }}
                            />
                            <p className="text-white/70 font-bold text-[13px]">{t('premium.plan_monthly')}</p>
                            <p className="text-white/35 text-[10px] mt-0.5">{t('premium.plan_monthly_desc')}</p>
                            <p className="text-white/70 font-bold text-base mt-1">₺124,99</p>
                            <p className="text-white/25 text-[10px]">/ {t('premium.month')}</p>
                            <div className="mt-1.5 pt-1.5 border-t border-white/[0.06]">
                                <p className="text-white/30 text-[12px] text-center">{t('premium.daily_monthly')}</p>
                            </div>
                        </button>

                        {/* Yearly — HERO */}
                        <button
                            onClick={() => { selection(); setSelectedPlan('yearly'); }}
                            className={`flex-1 relative text-left p-3 rounded-xl border-2 transition-all overflow-hidden ${selectedPlan === 'yearly' ? 'border-[#D4AF37]/50 bg-[#D4AF37]/[0.06]' : 'border-[#D4AF37]/15 bg-[#D4AF37]/[0.02]'}`}
                            style={{ animation: 'pw-card-glow 2.5s ease-in-out infinite' }}
                        >
                            {/* Gold shimmer sweep */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: 'linear-gradient(105deg, transparent 35%, rgba(212,175,55,0.08) 45%, rgba(212,175,55,0.15) 50%, rgba(212,175,55,0.08) 55%, transparent 65%)',
                                    animation: 'pw-card-sweep 2.5s ease-in-out infinite',
                                }}
                            />
                            {/* Badge — prominent */}
                            <div
                                className="absolute -top-0 right-0 left-0 mx-auto w-fit px-3 py-1 rounded-b-lg text-[9px] font-black uppercase tracking-wider text-[#021a0f]"
                                style={{ background: 'linear-gradient(135deg, #FFD700, #D4AF37)', animation: 'pw-badge 2s ease-in-out infinite', boxShadow: '0 2px 12px rgba(212,175,55,0.3)' }}
                            >
                                🌟 {t('premium.badge_best_value')}
                            </div>
                            <p className="text-[#D4AF37] font-bold text-[13px] mt-2">{t('premium.plan_yearly')}</p>
                            <p className="text-white/35 text-[10px] mt-0.5">{t('premium.plan_yearly_per_month')}</p>
                            <p className="text-[#D4AF37] font-bold text-base mt-1">₺979,99</p>
                            <p className="text-[#D4AF37]/40 text-[10px]">/ {t('premium.year')}</p>
                            <div className="mt-1.5 pt-1.5 border-t border-[#D4AF37]/10">
                                <p className="text-[#D4AF37]/60 text-[12px] font-semibold text-center">{t('premium.daily_yearly')}</p>
                            </div>
                        </button>
                    </motion.div>


                    {/* Trial badge — only for yearly */}
                    {selectedPlan === 'yearly' && (
                        <motion.div
                            className="flex items-center justify-center gap-1.5 mb-2 flex-shrink-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="w-4 h-4 rounded-md bg-[#D4AF37]/12 flex items-center justify-center">
                                <BookOpen size={10} className="text-[#D4AF37]" />
                            </div>
                            <span className="text-[#D4AF37]/60 text-[11px] font-bold">{t('premium.trial_included')}</span>
                        </motion.div>
                    )}

                    {/* ── CTA Button ── */}
                    <motion.div
                        className="flex-shrink-0"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.75 }}
                    >
                        <motion.button
                            onClick={handleSubscribe}
                            className="relative w-full py-4 rounded-2xl font-bold text-[16px] text-[#021a0f] overflow-hidden active:scale-[0.97] transition-transform"
                            style={{
                                background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #FFD700 100%)',
                                boxShadow: '0 6px 30px rgba(212,175,55,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
                            }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.3) 55%, transparent 65%)',
                                    backgroundSize: '200% 100%',
                                    animation: 'pw-shimmer 3s ease-in-out infinite',
                                }}
                            />
                            <span className="relative z-10 block">
                                {selectedPlan === 'yearly' ? t('premium.cta_trial') : t('premium.cta_subscribe')}
                            </span>
                        </motion.button>

                        <p className="text-center text-white/40 text-[12px] mt-2 leading-relaxed">
                            🔔 {selectedPlan === 'yearly' ? t('premium.disclaimer_yearly') : t('premium.disclaimer_monthly')}
                        </p>

                    </motion.div>

                    {/* ── Footer ── */}
                    <motion.div
                        className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-white/[0.03] flex-shrink-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                    >
                        <button className="text-white/35 text-[11px] hover:text-white/50 transition-colors">{t('premium.restore')}</button>
                        <span className="text-white/15">•</span>
                        <button onClick={() => navigate('/settings/legal')} className="text-white/35 text-[11px] hover:text-white/50 transition-colors">{t('premium.terms')}</button>
                        <span className="text-white/15">•</span>
                        <button onClick={() => navigate('/legal/privacy')} className="text-white/35 text-[11px] hover:text-white/50 transition-colors">{t('premium.privacy')}</button>
                    </motion.div>
                </div >
            </div >

            {/* ═══ EXIT INTENT POPUP (Enhanced) ═══ */}
            <AnimatePresence>
                {showExitPopup && (
                    <motion.div
                        className="absolute inset-0 z-[70] flex items-center justify-center px-5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                        {/* Backdrop */}
                        <motion.div
                            className="absolute inset-0 bg-black/85 backdrop-blur-lg"
                            onClick={() => setShowExitPopup(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        />

                        {/* Ambient glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
                            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)' }} />

                        {/* Card */}
                        <motion.div
                            className="relative w-full max-w-[360px] rounded-3xl overflow-hidden"
                            style={{
                                background: 'linear-gradient(175deg, #0f3d28 0%, #082b1c 35%, #041c11 75%, #010d07 100%)',
                                boxShadow: '0 0 0 1px rgba(212,175,55,0.08), 0 25px 60px rgba(0,0,0,0.5), 0 0 80px rgba(212,175,55,0.06)',
                            }}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                        >
                            {/* Islamic pattern overlay on card */}
                            <div className="absolute inset-0 pointer-events-none opacity-[0.015]"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4AF37' stroke-width='0.4'%3E%3Cpath d='M30 0L37 11L48 8L42 19L53 23L42 27L48 38L37 35L30 46L23 35L12 38L18 27L7 23L18 19L12 8L23 11Z'/%3E%3C/g%3E%3C/svg%3E")` }} />

                            {/* Top accent */}
                            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 5%, #D4AF37 50%, transparent 95%)' }} />

                            <div className="px-6 pb-6 pt-5">

                                {/* Moon visual — matching success screen style */}
                                <motion.div className="w-24 h-24 mx-auto mb-4 relative"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 80, damping: 16 }}>
                                    <svg viewBox="0 0 120 120" className="w-full h-full">
                                        <defs>
                                            <radialGradient id="ex-glow" cx="50%" cy="50%" r="50%">
                                                <stop offset="0%" stopColor="#FFD700" stopOpacity="0.25" />
                                                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                                            </radialGradient>
                                            <linearGradient id="ex-moon" x1="20%" y1="10%" x2="80%" y2="90%">
                                                <stop offset="0%" stopColor="#FFE066" />
                                                <stop offset="40%" stopColor="#FFD700" />
                                                <stop offset="100%" stopColor="#B8960C" />
                                            </linearGradient>
                                        </defs>
                                        <motion.circle cx="60" cy="60" r="55" fill="url(#ex-glow)"
                                            initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0.4] }}
                                            transition={{ duration: 2, delay: 0.3 }} />
                                        <circle cx="60" cy="60" r="34" fill="url(#ex-moon)" opacity="0.9" />
                                        <circle cx="60" cy="60" r="34" fill="url(#sc-inner)" />
                                        <circle cx="72" cy="52" r="26" fill="#082b1c" />
                                        <circle cx="50" cy="50" r="3" fill="rgba(255,255,255,0.06)" />
                                        <circle cx="56" cy="64" r="2" fill="rgba(255,255,255,0.04)" />
                                    </svg>

                                    {/* Rotating dots */}
                                    <motion.div className="absolute inset-[-10px]"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.6, rotate: 360 }}
                                        transition={{ opacity: { duration: 0.8, delay: 0.5 }, rotate: { duration: 25, repeat: Infinity, ease: 'linear' } }}>
                                        {Array.from({ length: 8 }, (_, i) => (
                                            <div key={i} className="absolute rounded-full" style={{
                                                width: i % 2 === 0 ? 2.5 : 1.5, height: i % 2 === 0 ? 2.5 : 1.5,
                                                background: '#D4AF37',
                                                top: `${50 + 48 * Math.sin(i * 45 * Math.PI / 180)}%`,
                                                left: `${50 + 48 * Math.cos(i * 45 * Math.PI / 180)}%`,
                                                transform: 'translate(-50%, -50%)',
                                                opacity: i % 2 === 0 ? 0.5 : 0.25,
                                            }} />
                                        ))}
                                    </motion.div>

                                    {/* Sparkles */}
                                    {[30, 130, 230, 330].map((deg, i) => (
                                        <motion.div key={deg} className="absolute w-1 h-1 rounded-full bg-[#FFD700]"
                                            style={{ top: `${50 + 50 * Math.sin(deg * Math.PI / 180)}%`, left: `${50 + 50 * Math.cos(deg * Math.PI / 180)}%` }}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: [0, 0.8, 0.2], scale: [0, 1.2, 0.6] }}
                                            transition={{ duration: 2.5, delay: 0.8 + i * 0.2, repeat: Infinity, repeatType: 'reverse' }} />
                                    ))}
                                </motion.div>

                                {/* Heading */}
                                <motion.h2
                                    className="text-center text-[#FFD700] text-[22px] font-bold mb-1.5 leading-tight"
                                    style={{ fontFamily: 'Georgia, serif' }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                >
                                    {t('premium.exit_title')}
                                </motion.h2>

                                <motion.p
                                    className="text-center text-white/40 text-[13px] mb-5"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.25 }}
                                >
                                    {t('premium.exit_message')}
                                </motion.p>

                                {/* Loss aversion items — enhanced with accent bars */}
                                <div className="space-y-2 mb-5">
                                    {[
                                        { key: 'exit_loss_1', icon: '🤲', color: '#EF4444' },
                                        { key: 'exit_loss_2', icon: '📖', color: '#F59E0B' },
                                        { key: 'exit_loss_3', icon: '📿', color: '#EF4444' },
                                    ].map((item, i) => (
                                        <motion.div
                                            key={item.key}
                                            className="flex items-center gap-3 px-4 py-3 rounded-2xl relative overflow-hidden"
                                            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(239,68,68,0.08)' }}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + i * 0.12 }}
                                        >
                                            <motion.div className="absolute left-0 top-[15%] bottom-[15%] w-[3px] rounded-r-full"
                                                style={{ background: item.color }}
                                                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                                                transition={{ duration: 0.4, delay: 0.5 + i * 0.12 }} />
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ background: 'rgba(239,68,68,0.08)' }}>
                                                <span className="text-[15px]">{item.icon}</span>
                                            </div>
                                            <span className="text-white/60 text-[13px] leading-snug flex-1">{t(`premium.${item.key}`)}</span>
                                            <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                                <X size={11} className="text-red-400/70" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Progress bar */}
                                <motion.div className="mb-5 px-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-white/30 text-[11px]">{lang === 'tr' ? 'Manevi yolculuğun' : 'Your spiritual journey'}</span>
                                        <span className="text-[#D4AF37]/60 text-[11px] font-bold">15%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                        <motion.div className="h-full rounded-full"
                                            style={{ background: 'linear-gradient(90deg, #D4AF37, #FFD700)' }}
                                            initial={{ width: 0 }} animate={{ width: '15%' }}
                                            transition={{ delay: 0.75, duration: 1, ease: 'easeOut' }} />
                                    </div>
                                    <p className="text-white/20 text-[10px] mt-1 text-center">
                                        {lang === 'tr' ? 'Premium ile %100\'e ulaş' : 'Reach 100% with Premium'}
                                    </p>
                                </motion.div>

                                {/* Social proof */}
                                <motion.div className="flex items-center justify-center gap-2 mb-4"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}>
                                    <div className="relative">
                                        <Users size={13} className="text-emerald-400/60" />
                                        <motion.div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400"
                                            animate={{ opacity: [0.4, 1, 0.4] }}
                                            transition={{ duration: 2, repeat: Infinity }} />
                                    </div>
                                    <span className="text-white/40 text-[12px]">
                                        {t('premium.social_proof', { count: socialCount.toLocaleString() })}
                                    </span>
                                </motion.div>

                                {/* CTA */}
                                <motion.button
                                    onClick={() => setShowExitPopup(false)}
                                    className="relative w-full py-[18px] rounded-2xl font-bold text-[16px] text-[#021a0f] overflow-hidden mb-3"
                                    style={{
                                        background: 'linear-gradient(135deg, #FFE066 0%, #FFD700 30%, #D4AF37 70%, #FFD700 100%)',
                                        boxShadow: '0 8px 35px rgba(212,175,55,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                                    }}
                                    whileTap={{ scale: 0.97 }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.9 }}
                                >
                                    <div className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.35) 42%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.35) 58%, transparent 70%)',
                                            backgroundSize: '200% 100%',
                                            animation: 'pw-shimmer 2.5s ease-in-out infinite',
                                        }} />
                                    <span className="relative z-10">{t('premium.exit_cta')}</span>
                                </motion.button>

                                {/* Dismiss */}
                                <motion.button
                                    onClick={() => navigate('/')}
                                    className="w-full text-center text-white/30 text-[12px] hover:text-white/45 transition-colors py-2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.0 }}
                                >
                                    {t('premium.exit_dismiss')}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Purchase Success Screen (Enhanced) ── */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        className="absolute inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        style={{ background: 'linear-gradient(170deg, #0d4a2e 0%, #072a1a 15%, #041c11 45%, #010d07 100%)' }}
                    >
                        {/* Islamic pattern overlay */}
                        <div
                            className="absolute inset-0 pointer-events-none opacity-[0.012] z-0"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4AF37' stroke-width='0.5'%3E%3Cpath d='M40 0L50 15L65 10L55 25L70 30L55 35L65 50L50 45L40 60L30 45L15 50L25 35L10 30L25 25L15 10L30 15Z'/%3E%3Ccircle cx='40' cy='30' r='8'/%3E%3C/g%3E%3C/svg%3E")`,
                            }}
                        />

                        {/* Layer 1: Deep ambient glow */}
                        <motion.div
                            className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[360px] h-[360px] rounded-full pointer-events-none"
                            initial={{ opacity: 0, scale: 0.3 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.8, delay: 0.2 }}
                            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, rgba(212,175,55,0.02) 40%, transparent 70%)' }}
                        />

                        {/* Layer 2: Mid golden aura */}
                        <motion.div
                            className="absolute top-[16%] left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: [0, 0.8, 0.5] }}
                            transition={{ duration: 2.5, delay: 0.5 }}
                            style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.1) 0%, rgba(212,175,55,0.03) 50%, transparent 75%)' }}
                        />

                        {/* Moon Visual */}
                        <motion.div
                            className="relative w-36 h-36 mb-4"
                            initial={{ opacity: 0, scale: 0.4, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 60, damping: 16, delay: 0.15 }}
                        >
                            <svg viewBox="0 0 160 160" className="w-full h-full">
                                <defs>
                                    <radialGradient id="sc-glow" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stopColor="#FFD700" stopOpacity="0.35" />
                                        <stop offset="60%" stopColor="#D4AF37" stopOpacity="0.08" />
                                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                                    </radialGradient>
                                    <linearGradient id="sc-moon" x1="20%" y1="10%" x2="80%" y2="90%">
                                        <stop offset="0%" stopColor="#FFE066" />
                                        <stop offset="35%" stopColor="#FFD700" />
                                        <stop offset="70%" stopColor="#D4AF37" />
                                        <stop offset="100%" stopColor="#B8960C" />
                                    </linearGradient>
                                    <radialGradient id="sc-inner" cx="40%" cy="35%" r="50%">
                                        <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                    </radialGradient>
                                </defs>
                                <motion.circle cx="80" cy="80" r="75" fill="url(#sc-glow)" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.7, 0.5] }} transition={{ duration: 2.5, delay: 0.6 }} />
                                <motion.circle cx="80" cy="80" r="48" fill="url(#sc-moon)" initial={{ opacity: 0.2 }} animate={{ opacity: 1 }} transition={{ duration: 1.8, delay: 0.3 }} />
                                <circle cx="80" cy="80" r="48" fill="url(#sc-inner)" />
                                <motion.circle cx="100" cy="72" r="40" fill="#041c11" initial={{ opacity: 1 }} animate={{ opacity: 0, cx: 140 }} transition={{ duration: 2.2, delay: 0.4, ease: 'easeInOut' }} />
                                <circle cx="68" cy="68" r="5" fill="rgba(255,255,255,0.06)" />
                                <circle cx="90" cy="88" r="3.5" fill="rgba(255,255,255,0.04)" />
                                <circle cx="74" cy="85" r="2.5" fill="rgba(255,255,255,0.05)" />
                            </svg>

                            {/* Rotating dot ring */}
                            <motion.div
                                className="absolute inset-[-16px]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1, rotate: 360 }}
                                transition={{ opacity: { duration: 1, delay: 1 }, rotate: { duration: 30, repeat: Infinity, ease: 'linear' } }}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <div key={i} className="absolute rounded-full" style={{
                                        width: i % 3 === 0 ? 3 : 1.5, height: i % 3 === 0 ? 3 : 1.5,
                                        background: i % 3 === 0 ? '#FFD700' : 'rgba(212,175,55,0.4)',
                                        top: `${50 + 50 * Math.sin(i * 30 * Math.PI / 180)}%`,
                                        left: `${50 + 50 * Math.cos(i * 30 * Math.PI / 180)}%`,
                                        transform: 'translate(-50%, -50%)',
                                    }} />
                                ))}
                            </motion.div>

                            {/* Sparkle particles */}
                            {[0, 55, 120, 195, 260, 330].map((deg, i) => (
                                <motion.div key={deg} className="absolute w-1 h-1 rounded-full bg-[#FFD700]"
                                    style={{ top: `${50 + 52 * Math.sin(deg * Math.PI / 180)}%`, left: `${50 + 52 * Math.cos(deg * Math.PI / 180)}%` }}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: [0, 0.9, 0.2], scale: [0, 1.3, 0.7] }}
                                    transition={{ duration: 2.5, delay: 1.2 + i * 0.15, repeat: Infinity, repeatType: 'reverse' }}
                                />
                            ))}
                        </motion.div>

                        {/* SVG Checkmark */}
                        <motion.div className="mb-3" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 1.3 }}>
                            <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center">
                                <motion.svg viewBox="0 0 24 24" className="w-5 h-5">
                                    <motion.path d="M5 12l5 5 9-9" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 1.5, ease: 'easeOut' }} />
                                </motion.svg>
                            </div>
                        </motion.div>

                        {/* Premium Badge */}
                        <motion.div className="flex items-center gap-1.5 mb-3 px-4 py-1.5 rounded-full border border-[#D4AF37]/20"
                            style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.02) 100%)' }}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.6 }}>
                            <Crown size={12} className="text-[#FFD700]" />
                            <span className="text-[#D4AF37] text-[10px] font-bold tracking-[0.15em] uppercase">Premium Üye</span>
                        </motion.div>

                        {/* Title */}
                        <motion.h1 className="text-[#FFD700] text-[28px] font-bold text-center leading-tight px-6"
                            style={{ fontFamily: 'Georgia, serif' }}
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.7 }}>
                            {t('premium.success_title')}
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p className="text-white/45 text-[14px] text-center mt-2 mb-7 px-8"
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 2.0 }}>
                            {t('premium.success_subtitle')}
                        </motion.p>

                        {/* Unlocked Features */}
                        <div className="w-full max-w-[320px] space-y-2.5 px-5 mb-8">
                            {[
                                { icon: '🤲', key: 'success_feat_1', color: '#D4AF37' },
                                { icon: '📖', key: 'success_feat_2', color: '#10B981' },
                                { icon: '📿', key: 'success_feat_3', color: '#60A5FA' },
                                { icon: '👑', key: 'success_feat_4', color: '#F59E0B' },
                            ].map((feat, i) => (
                                <motion.div key={feat.key}
                                    className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 relative overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
                                    initial={{ opacity: 0, x: -25 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 2.2 + i * 0.18 }}>
                                    <motion.div className="absolute left-0 top-[15%] bottom-[15%] w-[3px] rounded-r-full"
                                        style={{ background: feat.color }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                                        transition={{ duration: 0.4, delay: 2.5 + i * 0.18 }} />
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: `${feat.color}12` }}>
                                        <span className="text-[18px]">{feat.icon}</span>
                                    </div>
                                    <span className="text-white/75 text-[14px] font-medium flex-1 leading-snug">
                                        {t(`premium.${feat.key}`)}
                                    </span>
                                    <motion.div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ background: `${feat.color}20` }}
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 350, damping: 14, delay: 2.6 + i * 0.18 }}>
                                        <Check size={13} className="text-emerald-400" />
                                    </motion.div>
                                </motion.div>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <motion.button onClick={() => navigate('/')}
                            className="w-[300px] py-4 rounded-2xl font-bold text-[17px] text-[#021a0f] relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, #FFE066 0%, #FFD700 30%, #D4AF37 70%, #FFD700 100%)', boxShadow: '0 8px 40px rgba(212,175,55,0.4), inset 0 1px 0 rgba(255,255,255,0.3)' }}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 100, damping: 18, delay: 3.0 }} whileTap={{ scale: 0.96 }}>
                            <div className="absolute inset-0 pointer-events-none"
                                style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.35) 42%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.35) 58%, transparent 70%)', backgroundSize: '200% 100%', animation: 'pw-shimmer 2.5s ease-in-out infinite' }} />
                            <span className="relative z-10">{t('premium.success_cta')} →</span>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
