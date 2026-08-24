import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Play, Pause, Heart, ChevronLeft, CloudRain, Repeat, BookOpen, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getAppDate } from '@/lib/testDate';
import { triggerReviewPrompt } from '@/components/ReviewPrompt';
import { useTranslation } from 'react-i18next';
import { isPremium } from '@/services/creditService';
import { AnimatePresence, motion } from 'framer-motion';
import { analytics } from '@/services/analyticsService';
import HintCoach from '@/components/HintCoach';
import { readSeenHints, markHintSeen } from '@/lib/hints';

// Tek seferlik ipuçları (HintCoach). Hedefler `data-tour` ile işaretli; hedef DOM'da
// yoksa ipucu sessizce iptal olur. Ortak kayıt + test bayrağı: src/lib/hints.js
const SLEEP_HINTS = [
    { id: 'sleep:controls', target: 'sleep-controls', titleKey: 'tour.controls.title', bodyKey: 'tour.controls.body', icon: Repeat },
    { id: 'sleep:rain', target: 'sleep-rain', titleKey: 'tour.rain.title', bodyKey: 'tour.rain.body', icon: CloudRain },
    { id: 'sleep:forgive', target: 'sleep-forgive', titleKey: 'tour.forgive.title', bodyKey: 'tour.forgive.body', icon: Heart },
];

const nextHint = (seen, after = -1) => SLEEP_HINTS.findIndex((h, i) => i > after && !seen[h.id]);

// Background Mode Helper (Cordova Plugin)
const BackgroundMode = {
    enable: () => {
        if (window.cordova?.plugins?.backgroundMode) {
            window.cordova.plugins.backgroundMode.enable();
            window.cordova.plugins.backgroundMode.setDefaults({
                title: 'İslami Yoldaş',
                text: 'Uyku modu aktif - Kuran dinleniyor',
                icon: 'ic_launcher',
                color: 'D4AF37',
                resume: true,
                hidden: false,
                bigText: false
            });
        }
    },
    disable: () => {
        if (window.cordova?.plugins?.backgroundMode) {
            window.cordova.plugins.backgroundMode.disable();
        }
    }
};

export default function SleepMode() {
    const navigate = useNavigate();
    const { t } = useTranslation('sleep');
    const [isPlaying, setIsPlaying] = useState(false);
    const [ambientOn, setAmbientOn] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isAudioLoading, setIsAudioLoading] = useState(true);
    const [isAmbientLoading, setIsAmbientLoading] = useState(false);
    const [ambientError, setAmbientError] = useState(null);
    const [isMulkLooping, setIsMulkLooping] = useState(false);
    const [showPremiumGate, setShowPremiumGate] = useState(false);

    // One-time free use tracking
    const [sleepUseCount, setSleepUseCount] = useState(() => {
        const stored = localStorage.getItem('sleep_mode_use_count');
        if (stored !== null) return parseInt(stored, 10);
        // Fallback for existing boolean flag
        if (localStorage.getItem('sleep_mode_used') === 'true') return 1;
        return 0;
    });

    // Audio State
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1.0);
    const [ambientVolume, setAmbientVolume] = useState(1.0);

    const getTodayKey = () => `sleep_forgiven_${getAppDate().toISOString().split('T')[0]}`;

    const [forgiven, setForgiven] = useState(() => {
        return localStorage.getItem(getTodayKey()) === 'true';
    });

    // ── Tek seferlik ipuçları ─────────────────────────────────────────────
    // İlk girişte sırayla üç ipucu. Ekran karartılmaz, hiçbir şey engellenmez.
    const [seenHints, setSeenHints] = useState(readSeenHints);
    const [hintIndex, setHintIndex] = useState(-1);
    const hintTimerRef = React.useRef(null);

    // Ekranda duran ipucunun kimliği — sayfadan çıkarken "görüldü" yazmak için
    const shownHintRef = React.useRef(null);
    useEffect(() => { shownHintRef.current = hintIndex >= 0 ? SLEEP_HINTS[hintIndex].id : null; }, [hintIndex]);

    useEffect(() => {
        const first = nextHint(readSeenHints());
        // Sayfa geçiş animasyonu bitsin, kartlar yerleşsin
        const timer = first === -1 ? null : setTimeout(() => setHintIndex(first), 800);
        return () => {
            if (timer) clearTimeout(timer);
            // Kullanıcı balon açıkken çıktı: yazılmazsa her girişte aynı ipucu çıkardı.
            const shown = shownHintRef.current;
            if (shown) { markHintSeen(shown); shownHintRef.current = null; }
        };
    }, []);

    useEffect(() => () => clearTimeout(hintTimerRef.current), []);

    const closeHint = useCallback((markSeen = true) => {
        if (hintIndex < 0) return;
        // markHintSeen TEST modunda hiçbir şey yazmaz (bkz. lib/hints.js)
        const nextSeen = markSeen && SLEEP_HINTS[hintIndex] ? markHintSeen(SLEEP_HINTS[hintIndex].id) : seenHints;
        setSeenHints(nextSeen);
        setHintIndex(-1);
        const nextIdx = nextHint(nextSeen, hintIndex);
        if (nextIdx >= 0) {
            clearTimeout(hintTimerRef.current);
            // Kısa geçiş: uzun boşluk "tur bitti" hissi veriyordu
            hintTimerRef.current = setTimeout(() => setHintIndex(nextIdx), 180);
        }
    }, [hintIndex, seenHints]);

    const activeHint = hintIndex >= 0 ? SLEEP_HINTS[hintIndex] : null;

    // 30s sayfada kalma tetikleyicisi
    useEffect(() => {
        const t = setTimeout(() => triggerReviewPrompt('sleep_deep'), 20000);
        return () => clearTimeout(t);
    }, []);

    // Persistent Audio Objects
    const mulkAudio = React.useMemo(() => new Audio(), []);
    const rainAudio = React.useMemo(() => {
        const audio = new Audio();
        // A direct, known working URL from a GitHub repo (meditation-app)
        audio.src = 'https://media.rainymood.com/0.mp3';
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = ambientVolume;
        return audio;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync loop state for Mulk
    useEffect(() => {
        mulkAudio.loop = isMulkLooping;
    }, [isMulkLooping, mulkAudio]);

    // Sync ambient volume
    useEffect(() => {
        rainAudio.volume = ambientVolume;
    }, [ambientVolume, rainAudio]);

    // Fetch Mulk Audio from API
    useEffect(() => {
        const handleMetadata = () => {
            setDuration(mulkAudio.duration);
            setIsAudioLoading(false);
        };
        const handleTimeUpdate = () => {
            setCurrentTime(mulkAudio.currentTime);
        };

        const fetchMulkAudio = async () => {
            try {
                // Recitation ID 7 is Mishary Rashid Alafasy
                const response = await fetch('https://api.quran.com/api/v4/chapter_recitations/7/67');
                const data = await response.json();
                const url = data.audio_file.audio_url;
                setAudioUrl(url);
                mulkAudio.src = url;
                mulkAudio.load();
                mulkAudio.volume = volume;

                mulkAudio.addEventListener('loadedmetadata', handleMetadata);
                mulkAudio.addEventListener('timeupdate', handleTimeUpdate);

            } catch (error) {
                console.error('Mulk audio fetch error:', error);
                const fallback = 'https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/67.mp3';
                setAudioUrl(fallback);
                mulkAudio.src = fallback;
                mulkAudio.load();
                mulkAudio.volume = volume;
                setIsAudioLoading(false);
            }
        };

        fetchMulkAudio();

        return () => {
            mulkAudio.removeEventListener('loadedmetadata', handleMetadata);
            mulkAudio.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [mulkAudio]); // Volume handled separately to avoid re-fetching

    // Sync volume changes
    useEffect(() => {
        mulkAudio.volume = volume;
    }, [volume, mulkAudio]);

    // Handle Mulk Playback Ended
    useEffect(() => {
        const handleEnded = () => {
            if (!isMulkLooping) {
                setIsPlaying(false);
                const durationMin = Math.round((mulkAudio.duration || 0) / 60);
                analytics.sleepModeCompleted(durationMin);
            }
        };
        mulkAudio.addEventListener('ended', handleEnded);
        return () => mulkAudio.removeEventListener('ended', handleEnded);
    }, [mulkAudio, isMulkLooping]);

    // Background Mode Management
    const updateBackgroundMode = useCallback((playing, ambient) => {
        if (playing || ambient) {
            BackgroundMode.enable();
        } else {
            BackgroundMode.disable();
        }
    }, []);

    const checkPremiumGate = () => {
        if (sleepUseCount >= 2 && !isPremium()) {
            setShowPremiumGate(true);
            return true;
        }
        return false;
    };

    const markSleepUsed = () => {
        if (!isPremium()) {
            setSleepUseCount(prev => {
                const next = prev + 1;
                localStorage.setItem('sleep_mode_use_count', next.toString());
                return next;
            });
        }
    };

    const toggleRain = () => {
        if (ambientOn) {
            // Always allow pause
            rainAudio.pause();
            setAmbientOn(false);
            updateBackgroundMode(isPlaying, false);
        } else {
            // Gate only play
            if (checkPremiumGate()) return;

            setIsAmbientLoading(true);
            setAmbientError(null);

            if (!rainAudio.src || !rainAudio.src.includes('rainymood')) {
                rainAudio.src = 'https://media.rainymood.com/0.mp3';
            }

            rainAudio.play()
                .then(() => {
                    setIsAmbientLoading(false);
                    setAmbientOn(true);
                    updateBackgroundMode(isPlaying, true);
                    markSleepUsed();
                    import('@/services/adService').then(({ showInterstitialAd }) => showInterstitialAd()).catch(() => {});
                })
                .catch((e) => {
                    setAmbientError("Ses yüklenemedi. Lütfen internetinizi kontrol edin.");
                    setIsAmbientLoading(false);
                });
        }
    };

    // Keep background mode in sync with playback states
    useEffect(() => {
        updateBackgroundMode(isPlaying, ambientOn);
    }, [isPlaying, ambientOn, updateBackgroundMode]);

    const toggleMulk = () => {
        if (isAudioLoading) return;

        if (isPlaying) {
            // Always allow pause
            mulkAudio.pause();
            setIsPlaying(false);
        } else {
            // Gate only play
            if (checkPremiumGate()) return;
            mulkAudio.play().catch(() => { });
            setIsPlaying(true);
            markSleepUsed();
            const durationMin = Math.round((mulkAudio.duration || 0) / 60);
            analytics.sleepModeStarted('mulk_surah', durationMin);
            import('@/services/adService').then(({ showInterstitialAd }) => showInterstitialAd()).catch(() => {});
        }
    };

    const handleSeek = (e) => {
        if (checkPremiumGate()) return;
        const time = parseFloat(e.target.value);
        mulkAudio.currentTime = time;
        setCurrentTime(time);
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleForgive = () => {
        setForgiven(true);
        localStorage.setItem(getTodayKey(), 'true');
    };

    // Stop all audio on unmount
    useEffect(() => {
        return () => {
            mulkAudio.pause();
            rainAudio.pause();
            BackgroundMode.disable();
        };
    }, [mulkAudio, rainAudio]);

    const starsBackground = useMemo(() => (
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            {Array.from({ length: 50 }, (_, i) => (
                <div
                    key={i}
                    className="absolute w-0.5 h-0.5 bg-[#FFFDF6] rounded-full animate-pulse"
                    style={{
                        top: `${(i * 37 + 13) % 100}%`,
                        left: `${(i * 53 + 7) % 100}%`,
                        animationDelay: `${(i * 0.1) % 5}s`
                    }}
                />
            ))}
        </div>
    ), []);

    return (
        <div className="min-h-screen bg-[#02150a] text-white p-5 flex flex-col relative overflow-hidden">
            {starsBackground}

            <header className="flex justify-between items-center z-10 mb-12">
                <Button variant="ghost" onClick={() => navigate(-1)} className="text-white/40 hover:text-white">
                    <ChevronLeft size={24} />
                    {t('back')}
                </Button>
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                    <Moon size={16} className="text-islamic-gold" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-islamic-gold">{t('sleepMode')}</span>
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center z-10 gap-16">
                <div className="text-center space-y-4">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-b from-islamic-gold/20 to-transparent border border-islamic-gold/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
                        <Moon size={48} className="text-islamic-gold" />
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-islamic-gold">{t('title')}</h2>
                    <p className="text-gray-400 max-w-[250px] mx-auto text-sm leading-relaxed">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Audio Controls */}
                <div className="w-full space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-islamic-gold/10 rounded-2xl text-islamic-gold">
                                    <BookOpen size={24} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold">{t('mulkSurah')}</p>
                                    <p className="text-[10px] text-gray-400">{t('mulkDesc')}</p>
                                </div>
                            </div>
                            <div data-tour="sleep-controls" className="flex items-center gap-2">
                                <Button
                                    onClick={() => { if (checkPremiumGate()) return; setIsMulkLooping(!isMulkLooping); }}
                                    className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center transition-all border shadow-lg active:scale-95",
                                        isMulkLooping
                                            ? "bg-islamic-gold text-[#02150a] border-islamic-gold shadow-islamic-gold/20"
                                            : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
                                    )}
                                    title={t('loopTitle')}
                                >
                                    <Repeat size={20} />
                                </Button>
                                <Button
                                    onClick={toggleMulk}
                                    disabled={isAudioLoading}
                                    className="w-12 h-12 rounded-full bg-islamic-gold text-[#02150a] flex items-center justify-center disabled:opacity-50 shadow-lg shadow-islamic-gold/20"
                                >
                                    {isAudioLoading ? (
                                        <div className="w-5 h-5 border-2 border-[#02150a] border-t-transparent rounded-full animate-spin" />
                                    ) : isPlaying ? (
                                        <Pause size={20} />
                                    ) : (
                                        <Play size={20} />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={handleSeek}
                                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-islamic-gold"
                            />
                            <div className="flex justify-between text-[10px] font-mono text-gray-400">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                    </div>

                    <div data-tour="sleep-rain" className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-400/10 rounded-2xl text-blue-400">
                                    <CloudRain size={24} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold">{t('rainSound')}</p>
                                    <p className="text-[10px] text-gray-400">{t('rainDesc')}</p>
                                    {ambientError && <p className="text-[8px] text-red-400 mt-1">{t('error')} {ambientError}</p>}
                                </div>
                            </div>
                            <Button
                                onClick={toggleRain}
                                className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95",
                                    ambientOn ? "bg-blue-400 text-[#02150a] shadow-blue-400/20" : "bg-white/10 text-white border border-white/10"
                                )}
                            >
                                {isAmbientLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : ambientOn ? (
                                    <Pause size={20} />
                                ) : (
                                    <Play size={20} />
                                )}
                            </Button>
                        </div>

                    </div>
                </div>

                {/* Forgiveness Action */}
                <div className="w-full">
                    {forgiven ? (
                        <div className="bg-emerald-900/40 border border-emerald-500/30 p-6 rounded-3xl text-center animate-in zoom-in duration-500">
                            <Heart className="w-8 h-8 text-emerald-400 mx-auto mb-2 fill-emerald-400/20" />
                            <p className="text-sm font-bold text-emerald-100">{t('forgivenMsg')}</p>
                        </div>
                    ) : (
                        <Button
                            data-tour="sleep-forgive"
                            onClick={handleForgive}
                            className="w-full h-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl font-bold gap-3"
                        >
                            <Heart size={20} className="text-pink-400" />
                            {t('forgiveBtn')}
                        </Button>
                    )}
                </div>
            </div>

            <div className="h-24"></div>

            {/* Premium Gate Overlay */}
            <AnimatePresence>
                {showPremiumGate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[9999]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <motion.div
                            initial={{ scale: 0.85, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.85, y: 30 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="px-8 text-center"
                        >
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-b from-islamic-gold/20 to-transparent border border-islamic-gold/30 flex items-center justify-center">
                                    <Moon size={36} className="text-islamic-gold" />
                                </div>
                            </div>

                            <h3 className="text-xl font-serif font-bold text-white mb-2 leading-tight">
                                {t('premiumGate.title', { defaultValue: 'Ücretsiz Deneme Kullanıldı' })}
                            </h3>

                            <p className="text-[13px] text-white/45 leading-relaxed mb-8">
                                {t('premiumGate.desc', { defaultValue: 'Uyku modunu 1 kez ücretsiz denediniz. Sınırsız erişim için Premium\'a yükseltin.' })}
                            </p>

                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => { setShowPremiumGate(false); navigate('/premium'); }}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-islamic-gold via-amber-400 to-islamic-gold text-[#0a2e1f] font-bold text-sm tracking-wide shadow-lg shadow-islamic-gold/20 flex items-center justify-center gap-2"
                            >
                                <Sparkles size={16} />
                                {t('premiumGate.cta', { defaultValue: 'Sınırsız Uyku Modu — Premium' })}
                            </motion.button>

                            <button
                                onClick={() => setShowPremiumGate(false)}
                                className="w-full mt-4 py-2 text-white/25 text-xs font-medium hover:text-white/40 transition-colors"
                            >
                                {t('premiumGate.dismiss', { defaultValue: 'Kapat' })}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tek seferlik ipuçları — karartmaz, engellemez */}
            {activeHint && (
                <HintCoach
                    key={activeHint.id}
                    targetId={activeHint.target}
                    titleKey={activeHint.titleKey}
                    bodyKey={activeHint.bodyKey}
                    icon={activeHint.icon}
                    ns="sleep"
                    step={SLEEP_HINTS.indexOf(activeHint)}
                    total={SLEEP_HINTS.length}
                    onClose={closeHint}
                />
            )}
        </div>
    );
}
