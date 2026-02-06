import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Volume2, VolumeX, Smartphone, Settings, Heart, Star, Sparkles, Edit3, X, Check, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useHaptics } from '../hooks/useMobile';

const DHIKR_PRESETS = [
    { id: 'subhanallah', name: 'Sübhanallah', arabic: 'سُبْحَانَ اللَّهِ', meaning: 'Allah noksan sıfatlardan uzaktır', defaultTarget: 33 },
    { id: 'elhamdulillah', name: 'Elhamdülillah', arabic: 'الْحَمْدُ لِلَّهِ', meaning: 'Hamd (şükür) Allah\'adır', defaultTarget: 33 },
    { id: 'allahuekber', name: 'Allahü Ekber', arabic: 'اللَّهُ أَكْبَرُ', meaning: 'Allah en büyüktür', defaultTarget: 33 },
    { id: 'last', name: 'Lâ ilâhe illallah', arabic: 'لَا إِلٰهَ إِلَّا اللّٰه', meaning: 'Allah\'tan başka ilah yoktur', defaultTarget: 100 },
    { id: 'istigfar', name: 'Estağfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', meaning: 'Allah\'tan bağışlanma dilerim', defaultTarget: 100 },
    { id: 'salavat', name: 'Salavat', arabic: 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ', meaning: 'Allah\'ım, Efendimiz Muhammed\'e rahmet et', defaultTarget: 100 },
];

export default function Dhikr() {
    const [count, setCount] = useState(0);
    const [totalCount, setTotalCount] = useState(() => parseInt(localStorage.getItem('totalDhikrOverall') || '0', 10));
    const [activePreset, setActivePreset] = useState(DHIKR_PRESETS[2]); // Allahü Ekber
    const [target, setTarget] = useState(33);
    const [hapticsMode, setHapticsMode] = useState('all'); // 'all', 'target', 'off'
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isRipple, setIsRipple] = useState(false);
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [tempTarget, setTempTarget] = useState('33');
    const [celebrating, setCelebrating] = useState(false);
    const [hapticMessage, setHapticMessage] = useState('');
    const [showTotalResetConfirm, setShowTotalResetConfirm] = useState(false);

    const haptics = useHaptics();

    // Web Audio API Context and Buffer
    const audioContextRef = useRef(null);
    const audioBufferRef = useRef(null);

    useEffect(() => {
        // Initialize Audio Context on user interaction to comply with autoplay policies
        const initAudio = async () => {
            try {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                }

                if (!audioBufferRef.current) {
                    const response = await fetch('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
                    audioBufferRef.current = audioBuffer;
                }
            } catch (error) {
                console.error("Audio init error:", error);
            }
        };

        // Trigger loading immediately
        initAudio();

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const playClickSound = () => {
        if (!soundEnabled || !audioContextRef.current || !audioBufferRef.current) return;

        // Resume context if suspended (browser autoplay policy)
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        // Create a new buffer source for every click -> Zero Latency, Perfect Concurrency
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(audioContextRef.current.destination);
        source.start(0);
    };

    useEffect(() => {
        if (hapticMessage) {
            const timer = setTimeout(() => setHapticMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [hapticMessage]);

    useEffect(() => {
        const savedCount = localStorage.getItem(`dhikr_count_${activePreset.id}`) || '0';
        const savedTarget = localStorage.getItem(`dhikr_target_${activePreset.id}`) || activePreset.defaultTarget.toString();

        setCount(parseInt(savedCount, 10));
        setTarget(parseInt(savedTarget, 10));
        setTempTarget(savedTarget);
    }, [activePreset]);

    const increment = () => {
        const newCount = count + 1;
        const newTotal = totalCount + 1;
        const isTargetReached = newCount > 0 && newCount % target === 0;

        setCount(newCount);
        setTotalCount(newTotal);

        localStorage.setItem(`dhikr_count_${activePreset.id}`, newCount.toString());
        localStorage.setItem('totalDhikrOverall', newTotal.toString());

        // Haptic feedback
        if (hapticsMode !== 'off') {
            if (isTargetReached) {
                haptics.targetReached();
            } else if (hapticsMode === 'all') {
                haptics.medium();
            }
        }

        // Sound feedback using Web Audio API
        playClickSound();

        // Animation trigger
        setIsRipple(true);
        setTimeout(() => setIsRipple(false), 300);

        // Feedback on target reach
        if (isTargetReached) {
            setCelebrating(true);
            setTimeout(() => setCelebrating(false), 2000);
        }
    };

    const handleSaveTarget = () => {
        const val = parseInt(tempTarget, 10);
        if (!isNaN(val) && val > 0) {
            setTarget(val);
            localStorage.setItem(`dhikr_target_${activePreset.id}`, val.toString());
            setShowTargetModal(false);
        }
    };

    const reset = () => {
        if (confirm(`Zikirmatik sayacını sıfırlamak istediğinize emin misiniz?`)) {
            setCount(0);
            localStorage.setItem(`dhikr_count_${activePreset.id}`, '0');
        }
    };

    const resetTotal = () => {
        setTotalCount(0);
        localStorage.setItem('totalDhikrOverall', '0');
        setShowTotalResetConfirm(false);
    };

    const progress = (count % target) / target * 100;
    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col min-h-screen bg-[#021a0f] text-white px-5 pb-5 pt-0 relative overflow-hidden font-sans">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-islamic-gold/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-5%] left-[-5%] w-72 h-72 bg-islamic-green/20 rounded-full blur-[120px]" />

            <header className="flex justify-between items-center z-10 mb-4 sticky top-0 bg-[#021a0f]/80 backdrop-blur-sm -mx-6 px-6 py-1 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="bg-islamic-gold/10 p-2 rounded-xl">
                        <Sparkles className="w-5 h-5 text-islamic-gold animate-pulse" />
                    </div>
                    <h2 className="text-xl font-serif font-bold tracking-tight">Zikirmatik</h2>
                </div>
                <div className="flex items-center gap-1 bg-black/20 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={cn("w-10 h-10 rounded-xl transition-all flex items-center justify-center", soundEnabled ? "text-islamic-gold bg-white/5" : "text-white/20")}
                    >
                        {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                    <button
                        onClick={() => {
                            const modes = ['all', 'target', 'off'];
                            const labels = {
                                all: 'Titreşim: Her Tıklamada',
                                target: 'Titreşim: Sadece Hedefte',
                                off: 'Titreşim: Kapalı'
                            };
                            const currentIndex = modes.indexOf(hapticsMode);
                            const nextMode = modes[(currentIndex + 1) % modes.length];
                            setHapticsMode(nextMode);
                            setHapticMessage(labels[nextMode]);
                        }}
                        className={cn(
                            "w-10 h-10 rounded-xl transition-all relative flex items-center justify-center",
                            hapticsMode !== 'off' ? "text-islamic-gold bg-white/5" : "text-white/20"
                        )}
                        title={hapticsMode === 'all' ? 'Tüm Titreşimler Açık' : hapticsMode === 'target' ? 'Sadece Hedefte Titreşim' : 'Titreşim Kapalı'}
                    >
                        <Smartphone size={18} />
                        {hapticsMode === 'target' && (
                            <div className="absolute top-1 right-1 w-2 h-2 bg-islamic-gold rounded-full border border-black animate-pulse" />
                        )}
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <button onClick={reset} className="w-10 h-10 rounded-xl text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center">
                        <RotateCcw size={18} />
                    </button>
                </div>
            </header>

            {/* Main Interaction Area - Aesthetic spacing from top */}
            <div className="flex-1 flex flex-col justify-start items-center z-10 relative mt-8">
                {/* Visual Feedback Text - Balanced margin */}
                <div className="text-center mb-6 animate-in fade-in zoom-in duration-700">
                    <p className="text-islamic-gold font-serif text-4xl mb-2 opacity-95 drop-shadow-lg">{activePreset.arabic}</p>
                    <p className="text-white/40 text-xs italic mb-4 font-normal tracking-wide">{activePreset.meaning}</p>

                    {/* Interactive Target Indicator */}
                    <button
                        onClick={() => setShowTargetModal(true)}
                        className="group flex items-center gap-3 bg-islamic-gold/5 hover:bg-islamic-gold/10 px-10 py-3.5 rounded-full border border-islamic-gold/40 transition-all mx-auto shadow-[0_0_20px_rgba(212,175,55,0.15)] active:scale-95"
                    >
                        <span className="text-islamic-gold font-bold text-xs uppercase tracking-[0.25em]"> Hedef: {target}</span>
                        <div className="bg-islamic-gold/20 p-1.5 rounded-full">
                            <Edit3 size={14} className="text-islamic-gold opacity-80" />
                        </div>
                    </button>
                </div>

                {/* The Button & Progress */}
                <div className="relative w-80 h-80 flex items-center justify-center">
                    {/* SVG Progress Ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                        {/* Background Ring */}
                        <circle
                            cx="100"
                            cy="100"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="10"
                            fill="transparent"
                            className="text-white/5"
                        />
                        {/* Progress Ring */}
                        <circle
                            cx="100"
                            cy="100"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="10"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className={cn(
                                "transition-all duration-300 ease-out",
                                celebrating ? "text-emerald-400 stroke-[14px]" : "text-islamic-gold"
                            )}
                        />
                    </svg>

                    {/* Ripple Effect Background */}
                    <div className={cn(
                        "absolute inset-0 bg-islamic-gold/10 rounded-full transition-all duration-700 scale-0",
                        isRipple && "scale-100 opacity-0"
                    )} />

                    {/* Target Reached Celebration Sparkles */}
                    {celebrating && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <Sparkles className="text-islamic-gold w-full h-full animate-ping opacity-20" />
                        </div>
                    )}

                    {/* Main Button */}
                    <button
                        onClick={increment}
                        className={cn(
                            "w-60 h-60 rounded-full bg-gradient-to-br from-white/10 to-black/30 border border-white/20 flex flex-col items-center justify-center relative shadow-[0_0_80px_rgba(0,0,0,0.5)] active:scale-95 transition-all duration-75 backdrop-blur-lg group",
                            celebrating && "border-emerald-500/50 shadow-emerald-500/20"
                        )}
                    >
                        <div className="absolute inset-x-0 top-0 h-1/2 bg-white/5 rounded-t-full pointer-events-none" />

                        <span className={cn(
                            "text-7xl font-mono font-bold tracking-tighter transition-all duration-300 drop-shadow-2xl",
                            celebrating ? "text-emerald-400 scale-110" : "text-white group-hover:text-islamic-gold"
                        )}>
                            {count % target === 0 && count > 0 ? target : count % target}
                        </span>

                        <div className="flex flex-col items-center mt-2 opacity-40">
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">TUR</span>
                            <span className="text-xl font-mono font-bold">{Math.floor(count / target) + 1}</span>
                        </div>
                    </button>

                    {/* Decorative Stars */}
                    <Star size={16} className="absolute top-8 right-8 text-islamic-gold/20 animate-pulse" />
                    <Star size={12} className="absolute bottom-10 left-12 text-islamic-gold/10 animate-pulse delay-700" />
                    <Heart size={14} className="absolute top-12 left-10 text-islamic-gold/10 animate-pulse delay-500" />
                </div>

                {/* Cumulative Counter Card - Balanced distance */}
                <div className="mt-10 group relative">
                    <div className="bg-white/5 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white/10 flex items-center justify-between gap-5 transition-all hover:bg-white/10 hover:border-islamic-gold/30 hover:scale-105 shadow-xl">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-islamic-gold/10 rounded-2xl border border-islamic-gold/20">
                                <Star size={20} className="text-islamic-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.25em] leading-none mb-1">Toplam Zikir</p>
                                <p className="text-2xl font-mono font-bold text-islamic-gold tracking-tight">{totalCount.toLocaleString('tr-TR')}</p>
                            </div>
                        </div>

                        {/* Reset Total Button */}
                        <button
                            onClick={() => setShowTotalResetConfirm(true)}
                            className="p-2.5 bg-islamic-gold/5 hover:bg-islamic-gold/10 text-white/20 hover:text-islamic-gold rounded-xl transition-all active:scale-90 border border-transparent hover:border-islamic-gold/30"
                            title="Tüm Zikirleri Sıfırla"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>

                    {/* Total Reset Confirmation Dialog */}
                    {showTotalResetConfirm && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center animate-in fade-in zoom-in duration-200">
                            <div className="absolute inset-0 bg-[#021a0f]/95 rounded-3xl backdrop-blur-md" />
                            <div className="relative text-center px-4">
                                <p className="text-[11px] text-white/80 font-bold uppercase tracking-wider mb-3">Tüm zikirleri sıfırla?</p>
                                <div className="flex gap-2 justify-center">
                                    <button
                                        onClick={() => setShowTotalResetConfirm(false)}
                                        className="px-4 py-1.5 rounded-lg bg-white/10 text-white/60 text-[10px] font-bold uppercase transition-all"
                                    >
                                        İPTAL
                                    </button>
                                    <button
                                        onClick={resetTotal}
                                        className="px-4 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-bold uppercase transition-all shadow-lg shadow-red-500/20"
                                    >
                                        SIFIRLA
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Quote / Inspiration */}
            <footer className="mt-auto text-center pb-6 z-10 px-10">
                <div className="relative inline-block px-12">
                    <div className="absolute top-0 left-0 w-8 h-[1px] bg-gradient-to-r from-transparent to-islamic-gold/40" />
                    <div className="absolute top-0 right-0 w-8 h-[1px] bg-gradient-to-l from-transparent to-islamic-gold/40" />
                    <p className="text-islamic-gold/70 italic font-serif text-sm pt-4 leading-relaxed">
                        "Ey iman edenler! Allah’ı çokça zikredin ve O’nu sabah akşam tespih edin."
                    </p>
                    <p className="text-[9px] text-white/20 mt-3 font-bold uppercase tracking-[0.2em] font-sans">AHZAB SURESİ, 41-42</p>
                </div>
            </footer>

            {/* Haptic Mode Feedback Message */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                <div className={cn(
                    "bg-islamic-gold/90 text-[#021a0f] px-6 py-2 rounded-full font-bold text-xs shadow-2xl transition-all duration-500 transform translate-y-4 opacity-0 border border-white/20",
                    hapticMessage && "translate-y-0 opacity-100"
                )}>
                    {hapticMessage}
                </div>
            </div>

            {showTargetModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowTargetModal(false)} />
                    <div className="bg-[#032e18] border border-white/10 rounded-[3rem] p-8 w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in slide-in-from-bottom-5 duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <button onClick={() => setShowTargetModal(false)} className="text-white/40 hover:text-white p-2">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-islamic-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-islamic-gold/20">
                                <Settings className="text-islamic-gold w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-islamic-gold mb-2">Hedef Belirle</h3>
                            <p className="text-white/40 text-sm">{activePreset.name} için kişisel hedefinizi girin.</p>
                        </div>

                        <div className="relative mb-8">
                            <input
                                type="number"
                                value={tempTarget}
                                onChange={(e) => setTempTarget(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-5 px-6 text-4xl font-mono font-bold text-center text-islamic-gold focus:outline-none focus:border-islamic-gold/50 transition-all placeholder:opacity-20"
                                placeholder="33"
                                autoFocus
                            />
                            <div className="mt-3 flex gap-2 justify-center">
                                {[33, 99, 100, 313, 1000].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setTempTarget(v.toString())}
                                        className="text-[12px] font-bold bg-white/5 hover:bg-islamic-gold/20 hover:text-islamic-gold px-3 py-1 rounded-lg border border-white/5 transition-all"
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleSaveTarget}
                            className="w-full h-16 rounded-2xl bg-islamic-gold hover:bg-amber-600 text-[#021a0f] text-lg font-bold shadow-lg shadow-islamic-gold/20 flex items-center justify-center gap-3"
                        >
                            <Check size={20} strokeWidth={3} />
                            HEDEFİ KAYDET
                        </button>
                    </div>
                </div>
            )
            }

            {/* Style for hiding scrollbar */}
            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}