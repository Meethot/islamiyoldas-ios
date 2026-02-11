import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, Flame, Moon, ChevronDown, Sparkles, X, AlertTriangle, Clock, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';
import { getAppDate, getTodayString } from '@/lib/testDate';

const RAMAZAN_START = new Date(2026, 1, 19);
const RAMAZAN_DAYS = 30;

const ST = { PENDING: 'pending', FASTED: 'fasted', MISSED: 'missed', EXCUSED: 'excused' };
const META = {
    [ST.FASTED]: { label: 'Tutuldu', emoji: '✓', color: '#34d399' },
    [ST.MISSED]: { label: 'Kaçırıldı', emoji: '✕', color: '#f87171' },
    [ST.EXCUSED]: { label: 'Mazeretli', emoji: '!', color: '#fbbf24' },
    [ST.PENDING]: { label: 'Bekliyor', emoji: '○', color: 'rgba(255,255,255,0.2)' },
};
const CYCLE = [ST.FASTED, ST.MISSED, ST.EXCUSED, ST.PENDING];

const MILESTONES = [
    { d: 1, i: '🌱', t: 'İlk Adım' }, { d: 3, i: '🌿', t: 'Azim' },
    { d: 7, i: '🌳', t: 'Bir Hafta' }, { d: 10, i: '⭐', t: 'Yıldız' },
    { d: 15, i: '💎', t: 'Yarı Yol' }, { d: 20, i: '🔥', t: 'Alevli' },
    { d: 25, i: '👑', t: 'Neredeyse!' }, { d: 30, i: '🏆', t: 'Tamamlandı!' },
];

const HADITH = [
    { text: "Oruç bir kalkandır.", src: "Buhârî" },
    { text: "Her şeyin bir zekatı vardır, bedenin zekatı da oruçtur.", src: "İbn Mâce" },
    { text: "Oruç tutun, sıhhat bulun.", src: "Taberânî" },
    { text: "Oruçlu kimsenin ağız kokusu, Allah katında misk kokusundan daha güzeldir.", src: "Buhârî" },
    { text: "Kim Ramazan orucunu iman ederek ve sevabını bekleyerek tutarsa, geçmiş günahları bağışlanır.", src: "Buhârî, Müslim" },
    { text: "Oruç sabrın yarısıdır.", src: "Tirmizî" },
    { text: "Cennette Reyyan adlı bir kapı vardır. Oradan ancak oruç tutanlar girecektir.", src: "Buhârî, Müslim" },
];

const load = () => { try { const r = localStorage.getItem('fasting_v3'); return r ? JSON.parse(r) : null; } catch { return null; } };
const save = d => localStorage.setItem('fasting_v3', JSON.stringify(d));
const getInit = () => load() || { days: {}, teravih: {} };

/* ─── Islamic pattern overlay ─── */
const IslamicPattern = () => (
    <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px'
        }}
    />
);

/* ─── Ambient atmosphere – lighter emerald glow ─── */
const Atmosphere = () => (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-700/20 rounded-full blur-[140px]"
        />
        <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.15, 0.08] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute bottom-10 -right-16 w-[400px] h-[400px] bg-amber-700/10 rounded-full blur-[120px]"
        />
        <motion.div
            animate={{ opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            className="absolute top-1/2 -left-16 w-[350px] h-[350px] bg-emerald-600/10 rounded-full blur-[100px]"
        />
    </div>
);

/* ─── Grand Circular Progress ─── */
const GrandProgress = ({ fasted, total, todayFasted, onToggle, currentDay, streak }) => {
    const pct = total > 0 ? fasted / total : 0;
    const c = 130, r = 100;
    const circ = 2 * Math.PI * r, dash = pct * circ;

    /* 30 tick marks around the outside */
    const ticks = [];
    for (let i = 0; i < 30; i++) {
        const isFifth = (i + 1) % 5 === 0;
        const filled = i < fasted;
        const angle = (i / 30) * 360;
        ticks.push(
            <line
                key={i}
                x1={c} y1={isFifth ? 12 : 16}
                x2={c} y2={isFifth ? 24 : 22}
                stroke={filled ? 'rgba(212,175,55,0.7)' : 'rgba(255,255,255,0.06)'}
                strokeWidth={isFifth ? 2 : 1}
                strokeLinecap="round"
                transform={`rotate(${angle} ${c} ${c})`}
            />
        );
    }

    return (
        <div className="relative flex flex-col items-center">
            <div className="relative" style={{ width: 260, height: 260 }}>
                {/* Warm ambient glow — intensifies with progress */}
                {pct > 0 && (
                    <div
                        className="absolute inset-6 rounded-full transition-opacity duration-1000"
                        style={{
                            opacity: 0.35 + pct * 0.45,
                            background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, rgba(184,134,11,0.04) 55%, transparent 75%)',
                        }}
                    />
                )}

                <svg width="260" height="260" viewBox="0 0 260 260">
                    <defs>
                        <linearGradient id="arcGold" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#b8860b" />
                            <stop offset="40%" stopColor="#e8c547" />
                            <stop offset="70%" stopColor="#f5e08a" />
                            <stop offset="100%" stopColor="#D4AF37" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3.5" result="b" />
                            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>

                    {/* Outer decorative ring */}
                    <circle cx={c} cy={c} r={r + 15} fill="none"
                        stroke="rgba(255,255,255,0.035)" strokeWidth="0.5" />

                    {/* Ticks */}
                    {ticks}

                    {/* Track */}
                    <circle cx={c} cy={c} r={r} fill="none"
                        stroke="rgba(255,255,255,0.04)" strokeWidth="8" strokeLinecap="round" />

                    {/* Soft glow behind arc */}
                    {pct > 0 && (
                        <circle cx={c} cy={c} r={r} fill="none"
                            stroke="rgba(212,175,55,0.12)" strokeWidth="18"
                            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - dash}
                            transform={`rotate(-90 ${c} ${c})`}
                            style={{ filter: 'blur(6px)' }}
                            className="transition-all duration-700 ease-out"
                        />
                    )}

                    {/* Main progress arc */}
                    <circle cx={c} cy={c} r={r} fill="none"
                        stroke="url(#arcGold)" strokeWidth="8"
                        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - dash}
                        transform={`rotate(-90 ${c} ${c})`} filter="url(#glow)"
                        className="transition-all duration-700 ease-out"
                    />

                    {/* Highlight on top of arc for shine */}
                    {pct > 0 && (
                        <circle cx={c} cy={c} r={r} fill="none"
                            stroke="rgba(255,248,220,0.3)" strokeWidth="2"
                            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - dash}
                            transform={`rotate(-90 ${c} ${c})`}
                            className="transition-all duration-700 ease-out"
                        />
                    )}
                </svg>

                {/* Center content */}
                <button
                    onClick={onToggle}
                    className="absolute inset-0 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer"
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={todayFasted ? 'done' : 'pending'}
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="flex flex-col items-center"
                        >
                            {todayFasted ? (
                                <div
                                    className="w-14 h-14 rounded-full flex items-center justify-center mb-2"
                                    style={{
                                        background: 'rgba(52,211,153,0.12)',
                                        boxShadow: '0 0 20px rgba(52,211,153,0.15), 0 0 0 1px rgba(52,211,153,0.2)',
                                    }}
                                >
                                    <Check className="w-7 h-7 text-emerald-300" strokeWidth={2.5} />
                                </div>
                            ) : (
                                <div
                                    className="w-14 h-14 rounded-full flex items-center justify-center mb-2"
                                    style={{
                                        background: 'rgba(212,175,55,0.08)',
                                        boxShadow: '0 0 20px rgba(212,175,55,0.1), 0 0 0 1px rgba(212,175,55,0.15)',
                                    }}
                                >
                                    <Moon className="w-6 h-6 text-islamic-gold/80" />
                                </div>
                            )}
                            <span className="text-[42px] font-black text-white tabular-nums leading-none">{fasted}</span>
                            <span className="text-[10px] text-white/20 font-semibold mt-1 uppercase tracking-[0.2em]">
                                {fasted === 0 ? 'başla' : `/ ${total} gün`}
                            </span>
                        </motion.div>
                    </AnimatePresence>
                </button>
            </div>

            <div className="flex items-center gap-3 mt-4">
                {currentDay && (
                    <div className="px-3.5 py-1.5 rounded-full bg-islamic-gold/12 border border-islamic-gold/20">
                        <span className="text-[11px] font-bold text-islamic-gold">{currentDay}. Gün</span>
                    </div>
                )}
                {streak > 0 && (
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-500/12 border border-orange-400/20">
                        <Flame size={13} className="text-orange-400" />
                        <span className="text-[11px] font-bold text-orange-400">{streak} Seri</span>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─── Ultra Premium Bottom Sheet ─── */
const StatusSheet = ({ dayNum, current, onPick, onClose }) => (
    <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-md"
        onClick={onClose}
    >
        <motion.div
            initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => { if (info.offset.y > 100 || info.velocity.y > 500) onClose(); }}
            className="w-full max-w-md rounded-t-[2.5rem] overflow-hidden border-t border-white/10"
            style={{ background: 'linear-gradient(180deg, #0d4a30 0%, #032e18 100%)' }}
            onClick={e => e.stopPropagation()}
        >
            {/* Handle */}
            <div className="pt-4 pb-2 flex justify-center">
                <div className="w-10 h-1 rounded-full bg-white/25" />
            </div>

            {/* Header */}
            <div className="px-6 pb-5 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="h-px w-8 bg-gradient-to-r from-transparent to-islamic-gold/30" />
                    <Moon size={14} className="text-islamic-gold/60" />
                    <div className="h-px w-8 bg-gradient-to-l from-transparent to-islamic-gold/30" />
                </div>
                <h3 className="text-lg font-serif font-bold text-white tracking-wide">
                    Ramazan'ın {dayNum}. Günü
                </h3>
                <p className="text-[11px] text-white/30 mt-1 font-medium">Durumu güncelle</p>
            </div>

            {/* 2×2 Premium Buttons */}
            <div className="grid grid-cols-2 gap-3.5 px-5 pb-32">

                {/* ── Tutuldu ── */}
                <button
                    onClick={() => onPick(ST.FASTED)}
                    className={cn(
                        "relative overflow-hidden rounded-[1.4rem] p-4 pt-5 flex flex-col items-center gap-3 cursor-pointer",
                        "transition-all duration-200 active:scale-95",
                        current === ST.FASTED
                            ? "ring-2 ring-islamic-gold/60 ring-offset-2 ring-offset-[#0d4a30]"
                            : ""
                    )}
                    style={{
                        background: 'linear-gradient(145deg, rgba(16,185,129,0.22) 0%, rgba(5,150,105,0.12) 50%, rgba(4,120,87,0.08) 100%)',
                        boxShadow: current === ST.FASTED
                            ? '0 0 25px rgba(52,211,153,0.25), inset 0 1px 0 rgba(255,255,255,0.08)'
                            : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.2)',
                        border: '1px solid rgba(52,211,153,0.15)',
                    }}
                >
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(52,211,153,0.5) 0%, transparent 60%)' }} />
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center relative z-10"
                        style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            boxShadow: '0 4px 15px rgba(16,185,129,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                        }}
                    >
                        <Check size={26} className="text-white" strokeWidth={3} />
                    </div>
                    <span className={cn("text-[13px] font-bold relative z-10", current === ST.FASTED ? "text-emerald-300" : "text-white/70")}>Tutuldu</span>
                </button>

                {/* ── Kaçırıldı ── */}
                <button
                    onClick={() => onPick(ST.MISSED)}
                    className={cn(
                        "relative overflow-hidden rounded-[1.4rem] p-4 pt-5 flex flex-col items-center gap-3 cursor-pointer",
                        "transition-all duration-200 active:scale-95",
                        current === ST.MISSED
                            ? "ring-2 ring-islamic-gold/60 ring-offset-2 ring-offset-[#0d4a30]"
                            : ""
                    )}
                    style={{
                        background: 'linear-gradient(145deg, rgba(239,68,68,0.18) 0%, rgba(220,38,38,0.10) 50%, rgba(185,28,28,0.06) 100%)',
                        boxShadow: current === ST.MISSED
                            ? '0 0 25px rgba(248,113,113,0.2), inset 0 1px 0 rgba(255,255,255,0.08)'
                            : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.2)',
                        border: '1px solid rgba(248,113,113,0.12)',
                    }}
                >
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(248,113,113,0.5) 0%, transparent 60%)' }} />
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center relative z-10"
                        style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            boxShadow: '0 4px 15px rgba(239,68,68,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                        }}
                    >
                        <X size={26} className="text-white" strokeWidth={3} />
                    </div>
                    <span className={cn("text-[13px] font-bold relative z-10", current === ST.MISSED ? "text-red-300" : "text-white/70")}>Kaçırıldı</span>
                </button>

                {/* ── Mazeretli ── */}
                <button
                    onClick={() => onPick(ST.EXCUSED)}
                    className={cn(
                        "relative overflow-hidden rounded-[1.4rem] p-4 pt-5 flex flex-col items-center gap-3 cursor-pointer",
                        "transition-all duration-200 active:scale-95",
                        current === ST.EXCUSED
                            ? "ring-2 ring-islamic-gold/60 ring-offset-2 ring-offset-[#0d4a30]"
                            : ""
                    )}
                    style={{
                        background: 'linear-gradient(145deg, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.10) 50%, rgba(180,83,9,0.06) 100%)',
                        boxShadow: current === ST.EXCUSED
                            ? '0 0 25px rgba(251,191,36,0.2), inset 0 1px 0 rgba(255,255,255,0.08)'
                            : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.2)',
                        border: '1px solid rgba(251,191,36,0.12)',
                    }}
                >
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(251,191,36,0.5) 0%, transparent 60%)' }} />
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center relative z-10"
                        style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            boxShadow: '0 4px 15px rgba(245,158,11,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                        }}
                    >
                        <AlertTriangle size={24} className="text-white" strokeWidth={2.5} />
                    </div>
                    <span className={cn("text-[13px] font-bold relative z-10", current === ST.EXCUSED ? "text-amber-300" : "text-white/70")}>Mazeretli</span>
                </button>

                {/* ── Bekliyor ── */}
                <button
                    onClick={() => onPick(ST.PENDING)}
                    className={cn(
                        "relative overflow-hidden rounded-[1.4rem] p-4 pt-5 flex flex-col items-center gap-3 cursor-pointer",
                        "transition-all duration-200 active:scale-95",
                        current === ST.PENDING
                            ? "ring-2 ring-islamic-gold/60 ring-offset-2 ring-offset-[#0d4a30]"
                            : ""
                    )}
                    style={{
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.01) 100%)',
                        boxShadow: current === ST.PENDING
                            ? '0 0 25px rgba(212,175,55,0.15), inset 0 1px 0 rgba(255,255,255,0.08)'
                            : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.3) 0%, transparent 60%)' }} />
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center relative z-10"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.15)',
                        }}
                    >
                        <Clock size={24} className="text-white/50" strokeWidth={2.5} />
                    </div>
                    <span className={cn("text-[13px] font-bold relative z-10", current === ST.PENDING ? "text-islamic-gold" : "text-white/40")}>Bekliyor</span>
                </button>
            </div>
        </motion.div>
    </motion.div>
);


// ══════════════════════════════════════════════
export default function FastingTracker() {
    const navigate = useNavigate();
    const { light, selection } = useHaptics();
    const [data, setData] = useState(getInit);
    const [pickerDay, setPickerDay] = useState(null);
    const [showTeravih, setShowTeravih] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showTeravihReset, setShowTeravihReset] = useState(false);

    const resetRamazanData = useCallback(() => {
        setData(prev => {
            const nd = { ...prev, days: {} };
            save(nd);
            return nd;
        });
        setShowResetConfirm(false);
        selection();
    }, [selection]);

    const resetTeravihData = useCallback(() => {
        setData(prev => {
            const nd = { ...prev, teravih: {} };
            save(nd);
            return nd;
        });
        setShowTeravihReset(false);
        selection();
    }, [selection]);
    const now = getAppDate();
    const today = getTodayString();

    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayIdx = Math.floor((todayLocal - RAMAZAN_START) / 86400000);
    const isRamazan = dayIdx >= 0 && dayIdx < RAMAZAN_DAYS;
    const currentDay = isRamazan ? dayIdx + 1 : null;
    const hadith = HADITH[now.getDate() % HADITH.length];

    const grid = useMemo(() => Array.from({ length: RAMAZAN_DAYS }, (_, i) => {
        const d = new Date(RAMAZAN_START);
        d.setDate(d.getDate() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return { num: i + 1, key, past: d < todayLocal, today: key === today, state: data.days[key] || ST.PENDING };
    }), [data.days, today, todayLocal]);

    const stats = useMemo(() => {
        let f = 0, m = 0, e = 0;
        grid.forEach(d => { if (d.state === ST.FASTED) f++; else if (d.state === ST.MISSED) m++; else if (d.state === ST.EXCUSED) e++; });
        return { fasted: f, missed: m, excused: e, remaining: RAMAZAN_DAYS - f - m - e };
    }, [grid]);

    const streak = useMemo(() => {
        let c = 0;
        for (let i = grid.length - 1; i >= 0; i--) {
            if (!grid[i].past && !grid[i].today) continue;
            if (grid[i].state === ST.FASTED) c++; else break;
        }
        return c;
    }, [grid]);

    const todayState = grid.find(d => d.today)?.state || ST.PENDING;
    const todayFasted = todayState === ST.FASTED;

    const teravihDone = useMemo(() => Object.values(data.teravih).filter(Boolean).length, [data.teravih]);

    const milestone = useMemo(() => {
        let m = null;
        for (const ms of MILESTONES) { if (stats.fasted >= ms.d) m = ms; }
        return m;
    }, [stats.fasted]);

    const nextMs = useMemo(() => MILESTONES.find(m => m.d > stats.fasted) || MILESTONES[MILESTONES.length - 1], [stats.fasted]);

    const pickState = useCallback((state) => {
        if (!pickerDay) return;
        light();
        setData(prev => {
            const g = grid.find(d => d.num === pickerDay);
            if (!g) return prev;
            const newDays = { ...prev.days };
            state === ST.PENDING ? delete newDays[g.key] : (newDays[g.key] = state);
            const nd = { ...prev, days: newDays };
            save(nd);
            return nd;
        });
        setPickerDay(null);
    }, [pickerDay, light, grid]);

    const toggleToday = useCallback(() => {
        const g = grid.find(d => d.today);
        if (!g) return;
        const next = todayFasted ? ST.PENDING : ST.FASTED;
        light();
        setData(prev => {
            const newDays = { ...prev.days };
            next === ST.PENDING ? delete newDays[g.key] : (newDays[g.key] = next);
            const nd = { ...prev, days: newDays };
            save(nd);
            return nd;
        });
    }, [grid, todayFasted, light]);

    const toggleTeravih = useCallback((num) => {
        light();
        setData(prev => {
            const t = { ...prev.teravih, [num]: !prev.teravih[num] };
            const nd = { ...prev, teravih: t };
            save(nd);
            return nd;
        });
    }, [light]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#021a0f] via-[#032e18] to-[#021a0f] text-white relative overflow-hidden pb-28">
            <Atmosphere />
            <IslamicPattern />

            {/* Header */}
            <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#032e18]/85 border-b border-emerald-600/10">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                        <button onClick={() => { light(); navigate(-1); }} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 border border-white/10 active:scale-90 transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="bg-islamic-gold/10 p-2 rounded-xl border border-islamic-gold/15">
                            <Moon className="w-5 h-5 text-islamic-gold" />
                        </div>
                        <h1 className="text-lg font-serif font-bold text-islamic-gold tracking-wide">Oruç Takibi</h1>
                    </div>
                    {milestone && (
                        <div className="flex items-center gap-1.5 bg-islamic-gold/10 px-3 py-1.5 rounded-full border border-islamic-gold/20">
                            <span className="text-sm">{milestone.i}</span>
                            <span className="text-[10px] font-bold text-islamic-gold">{milestone.t}</span>
                        </div>
                    )}
                </div>
            </header>

            <main className="relative z-10 max-w-md mx-auto">

                {/* ═══  HERO: Grand Progress Ring  ═══ */}
                <motion.section
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="flex justify-center pt-8 pb-4 px-5"
                >
                    <GrandProgress
                        fasted={stats.fasted}
                        total={RAMAZAN_DAYS}
                        todayFasted={todayFasted}
                        onToggle={toggleToday}
                        currentDay={currentDay}
                        streak={streak}
                    />
                </motion.section>

                {/* ═══  Hadis (Spiritual anchor)  ═══ */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="px-8 py-5 text-center"
                >
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="h-px w-10 bg-gradient-to-r from-transparent to-islamic-gold/30" />
                        <Sparkles size={12} className="text-islamic-gold/50" />
                        <div className="h-px w-10 bg-gradient-to-l from-transparent to-islamic-gold/30" />
                    </div>
                    <p className="text-islamic-gold/90 font-serif text-base italic leading-relaxed">
                        "{hadith.text}"
                    </p>
                    <p className="text-[10px] text-white/25 mt-2.5 font-semibold tracking-wider uppercase">
                        — {hadith.src}
                    </p>
                </motion.section>

                {/* ═══  Next Milestone Progress  ═══ */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mx-5 p-5 rounded-[1.8rem] bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl shadow-xl shadow-black/10"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em]">Sonraki Hedef</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-base">{nextMs.i}</span>
                            <span className="text-xs font-bold text-islamic-gold">{nextMs.t}</span>
                        </div>
                    </div>
                    <div className="relative h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{ background: 'linear-gradient(90deg, #b8860b, #f0d060, #D4AF37)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((stats.fasted / nextMs.d) * 100, 100)}%` }}
                            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                        />
                    </div>
                    <div className="flex justify-between mt-1.5">
                        <span className="text-[9px] text-white/15 tabular-nums font-medium">{stats.fasted} gün</span>
                        <span className="text-[9px] text-white/15 tabular-nums font-medium">{nextMs.d} gün</span>
                    </div>

                    {/* Milestone ribbon */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.05]">
                        {MILESTONES.map(m => {
                            const done = stats.fasted >= m.d;
                            return (
                                <div key={m.d} className="flex flex-col items-center gap-0.5">
                                    <span className={cn("text-base transition-all", done ? "" : "grayscale opacity-25")}>{m.i}</span>
                                    <span className={cn("text-[7px] font-bold tabular-nums", done ? "text-islamic-gold" : "text-white/10")}>{m.d}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.section>

                {/* ═══  Stats Row  ═══ */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="grid grid-cols-4 gap-2.5 mx-5 mt-5"
                >
                    {[
                        { n: stats.fasted, l: 'Tutuldu', c: 'text-emerald-400', bg: 'bg-emerald-500/10', bc: 'border-emerald-500/10' },
                        { n: stats.missed, l: 'Kaçırıldı', c: 'text-red-400', bg: 'bg-red-500/8', bc: 'border-red-500/10' },
                        { n: stats.excused, l: 'Mazeretli', c: 'text-amber-400', bg: 'bg-amber-500/8', bc: 'border-amber-500/10' },
                        { n: stats.remaining, l: 'Kalan', c: 'text-white/30', bg: 'bg-white/[0.03]', bc: 'border-white/[0.05]' },
                    ].map(s => (
                        <div key={s.l} className={cn("py-3.5 rounded-2xl text-center border", s.bg, s.bc)}>
                            <div className={cn("text-2xl font-black leading-none tabular-nums", s.c)}>{s.n}</div>
                            <div className="text-[8px] text-white/20 font-bold uppercase tracking-[0.12em] mt-1.5">{s.l}</div>
                        </div>
                    ))}
                </motion.section>

                {/* ═══  30 Day Calendar  ═══ */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mx-5 mt-6"
                >
                    {/* Calendar Card */}
                    <div className="rounded-[1.6rem] border border-white/[0.06] p-[1px] overflow-hidden"
                        style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
                        <div className="rounded-[1.5rem] p-4"
                            style={{
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.05) 100%)',
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.1)',
                            }}>

                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-4 px-1">
                                <div>
                                    <h3 className="text-base font-bold text-white/85">Ramazan Takvimi</h3>
                                    <p className="text-[11px] text-white/25 mt-0.5 font-medium">Şubat – Mart 2026</p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-islamic-gold/10 border border-islamic-gold/15">
                                        <Moon size={13} className="text-islamic-gold/70" />
                                        <span className="text-xs font-bold text-islamic-gold/80 tabular-nums">{stats.fasted}/{RAMAZAN_DAYS}</span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); light(); setShowResetConfirm(true); }}
                                        className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-red-500/15 border border-white/[0.06] hover:border-red-400/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                                        title="Sıfırla"
                                    >
                                        <RotateCcw size={16} className="text-white/30" />
                                    </button>
                                </div>
                            </div>

                            {/* Day Name Headers */}
                            <div className="grid grid-cols-7 gap-1 mb-1 px-0.5">
                                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                                    <div key={d} className="flex items-center justify-center h-7">
                                        <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider">{d}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1.5 px-0.5">
                                {/* Empty cells for weekday offset */}
                                {(() => {
                                    const startDow = RAMAZAN_START.getDay();
                                    const offset = startDow === 0 ? 6 : startDow - 1;
                                    return Array.from({ length: offset }, (_, i) => (
                                        <div key={`e-${i}`} className="aspect-square" />
                                    ));
                                })()}

                                {grid.map(d => {
                                    const active = d.state !== ST.PENDING;
                                    const isFasted = d.state === ST.FASTED;
                                    const isMissed = d.state === ST.MISSED;
                                    const isExcused = d.state === ST.EXCUSED;

                                    return (
                                        <button
                                            key={d.num}
                                            onClick={() => { light(); setPickerDay(d.num); }}
                                            className={cn(
                                                "aspect-square rounded-xl flex items-center justify-center transition-all active:scale-90 cursor-pointer",
                                                d.today && !active && "ring-2 ring-islamic-gold/50 ring-offset-1 ring-offset-transparent",
                                                !active && d.past && "bg-white/[0.04]",
                                            )}
                                            style={active ? {
                                                backgroundColor: isFasted ? '#10b981'
                                                    : isMissed ? '#ef4444'
                                                        : isExcused ? '#d97706'
                                                            : undefined,
                                                boxShadow: `0 2px 8px ${isFasted ? 'rgba(16,185,129,0.35)' : isMissed ? 'rgba(239,68,68,0.35)' : isExcused ? 'rgba(217,119,6,0.35)' : 'none'}`,
                                            } : undefined}
                                        >
                                            <span className={cn(
                                                "text-[13px] font-semibold tabular-nums",
                                                active ? "text-white" : d.past ? "text-white/40" : "text-white/15"
                                            )}>
                                                {d.num}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center justify-center gap-5 mt-3.5 pt-3 border-t border-white/[0.04]">
                                {[
                                    { c: '#34d399', l: 'Tutuldu' },
                                    { c: '#f87171', l: 'Kaçırıldı' },
                                    { c: '#fbbf24', l: 'Mazeretli' },
                                ].map(x => (
                                    <span key={x.l} className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: x.c, boxShadow: `0 0 4px ${x.c}40` }} />
                                        <span className="text-[11px] text-white/30 font-medium">{x.l}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Reset Confirmation Modal */}
                <AnimatePresence>
                    {showResetConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center px-8"
                            onClick={() => setShowResetConfirm(false)}
                        >
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full max-w-sm rounded-3xl overflow-hidden"
                                style={{
                                    background: 'linear-gradient(180deg, #1a2f1f 0%, #0d1f12 100%)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                                }}
                            >
                                <div className="p-6 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-400/20 flex items-center justify-center mx-auto mb-4"
                                        style={{ boxShadow: '0 0 30px rgba(239,68,68,0.15)' }}>
                                        <AlertTriangle size={28} className="text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Oruç Verilerini Sıfırla</h3>
                                    <p className="text-[13px] text-white/40 leading-relaxed mb-6">
                                        Tüm oruç kayıtlarınız silinecek. Teravih kayıtları korunur. Bu işlem geri alınamaz.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowResetConfirm(false)}
                                            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            onClick={resetRamazanData}
                                            className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-400 text-sm font-bold hover:bg-red-500/30 transition-all active:scale-95 cursor-pointer"
                                            style={{ boxShadow: '0 0 20px rgba(239,68,68,0.1)' }}
                                        >
                                            Sıfırla
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══  Teravih (Accordion)  ═══ */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="mx-5 mt-5"
                >
                    <button
                        onClick={() => { light(); setShowTeravih(!showTeravih); }}
                        className="w-full flex items-center justify-between py-3.5 px-1"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                                <Sparkles size={14} className="text-emerald-400" />
                            </div>
                            <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.25em]">Teravih Namazı</h3>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/15">
                                <Sparkles size={13} className="text-emerald-400/70" />
                                <span className="text-xs font-bold text-emerald-400/80 tabular-nums">{teravihDone}/{RAMAZAN_DAYS}</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); light(); setShowTeravihReset(true); }}
                                className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-red-500/15 border border-white/[0.06] hover:border-red-400/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                                title="Teravih Sıfırla"
                            >
                                <RotateCcw size={16} className="text-white/30" />
                            </button>
                            <ChevronDown size={14} className={cn("text-white/15 transition-transform duration-300", showTeravih && "rotate-180")} />
                        </div>
                    </button>
                    <AnimatePresence>
                        {showTeravih && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="rounded-[1.6rem] border border-white/[0.06] p-[1px] overflow-hidden mb-2"
                                    style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
                                    <div className="rounded-[1.5rem] p-4"
                                        style={{
                                            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.05) 100%)',
                                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.1)',
                                        }}>

                                        {/* Day Headers */}
                                        <div className="grid grid-cols-7 gap-1 mb-1 px-0.5">
                                            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                                                <div key={d} className="flex items-center justify-center h-7">
                                                    <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider">{d}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Teravih Grid - 7 columns with weekday alignment */}
                                        <div className="grid grid-cols-7 gap-1 px-0.5">
                                            {(() => {
                                                const startDow = RAMAZAN_START.getDay();
                                                const offset = startDow === 0 ? 6 : startDow - 1;
                                                return Array.from({ length: offset }, (_, i) => (
                                                    <div key={`te-${i}`} className="aspect-square" />
                                                ));
                                            })()}

                                            {Array.from({ length: RAMAZAN_DAYS }, (_, i) => {
                                                const n = i + 1;
                                                const done = !!data.teravih[n];
                                                const dayDate = new Date(RAMAZAN_START);
                                                dayDate.setDate(dayDate.getDate() + i);
                                                const isPast = dayDate < new Date(new Date().setHours(0, 0, 0, 0));
                                                const isToday = dayDate.toDateString() === new Date().toDateString();
                                                return (
                                                    <button
                                                        key={n}
                                                        onClick={() => toggleTeravih(n)}
                                                        className={cn(
                                                            "relative aspect-square rounded-xl flex items-center justify-center transition-all active:scale-90",
                                                            isToday && "ring-2 ring-emerald-400/50 ring-offset-1 ring-offset-transparent",
                                                            !done && (isPast ? "bg-white/[0.03]" : "bg-transparent")
                                                        )}
                                                        style={done ? {
                                                            backgroundColor: '#10b981',
                                                            boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                                                        } : undefined}
                                                    >
                                                        {done ? (
                                                            <Check size={14} className="text-white" strokeWidth={3} />
                                                        ) : (
                                                            <span className={cn(
                                                                "text-[13px] font-semibold tabular-nums",
                                                                isPast ? "text-white/40" : "text-white/15"
                                                            )}>{n}</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Legend */}
                                        <div className="flex items-center justify-center gap-5 mt-3.5 pt-3 border-t border-white/[0.04]">
                                            {[
                                                { c: '#34d399', l: 'Kılındı' },
                                                { c: 'rgba(255,255,255,0.15)', l: 'Kılınmadı' },
                                            ].map(x => (
                                                <span key={x.l} className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: x.c, boxShadow: x.c.startsWith('#') ? `0 0 4px ${x.c}40` : undefined }} />
                                                    <span className="text-[11px] text-white/30 font-medium">{x.l}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.section>

                {/* Teravih Reset Confirmation Modal */}
                <AnimatePresence>
                    {showTeravihReset && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center px-8"
                            onClick={() => setShowTeravihReset(false)}
                        >
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full max-w-sm rounded-3xl overflow-hidden"
                                style={{
                                    background: 'linear-gradient(180deg, #1a2f1f 0%, #0d1f12 100%)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                                }}
                            >
                                <div className="p-6 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center mx-auto mb-4"
                                        style={{ boxShadow: '0 0 30px rgba(52,211,153,0.15)' }}>
                                        <Sparkles size={28} className="text-emerald-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Teravih Verilerini Sıfırla</h3>
                                    <p className="text-[13px] text-white/40 leading-relaxed mb-6">
                                        Tüm teravih namazı kayıtlarınız silinecek. Oruç kayıtları korunur. Bu işlem geri alınamaz.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowTeravihReset(false)}
                                            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            onClick={resetTeravihData}
                                            className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-400 text-sm font-bold hover:bg-red-500/30 transition-all active:scale-95 cursor-pointer"
                                            style={{ boxShadow: '0 0 20px rgba(239,68,68,0.1)' }}
                                        >
                                            Sıfırla
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>

            {/* Bottom Sheet */}
            <AnimatePresence>
                {pickerDay && (
                    <StatusSheet
                        dayNum={pickerDay}
                        current={grid.find(d => d.num === pickerDay)?.state || ST.PENDING}
                        onPick={pickState}
                        onClose={() => setPickerDay(null)}
                    />
                )}
            </AnimatePresence>
        </div >
    );
}
