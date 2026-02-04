import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Volume2, VolumeX, Play, Pause, Heart, ChevronLeft, CloudRain, Repeat, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getAppDate } from '@/lib/testDate';

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
    const [isPlaying, setIsPlaying] = useState(false);
    const [ambientOn, setAmbientOn] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isAudioLoading, setIsAudioLoading] = useState(true);
    const [isAmbientLoading, setIsAmbientLoading] = useState(false);
    const [ambientError, setAmbientError] = useState(null);
    const [isMulkLooping, setIsMulkLooping] = useState(false);

    // Audio State
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [ambientVolume, setAmbientVolume] = useState(0.4);

    const getTodayKey = () => `sleep_forgiven_${getAppDate().toISOString().split('T')[0]}`;

    const [forgiven, setForgiven] = useState(() => {
        return localStorage.getItem(getTodayKey()) === 'true';
    });

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

                // Listen for metadata to get duration
                mulkAudio.addEventListener('loadedmetadata', () => {
                    setDuration(mulkAudio.duration);
                    setIsAudioLoading(false);
                });

                // Periodic time update
                mulkAudio.addEventListener('timeupdate', () => {
                    setCurrentTime(mulkAudio.currentTime);
                });

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

    const toggleRain = () => {
        if (ambientOn) {
            rainAudio.pause();
            setAmbientOn(false);
            updateBackgroundMode(isPlaying, false);
        } else {
            setIsAmbientLoading(true);
            setAmbientError(null);

            // Ensure source is set to RainyMood (stable, high quality, long)
            if (!rainAudio.src || !rainAudio.src.includes('rainymood')) {
                rainAudio.src = 'https://media.rainymood.com/0.mp3';
            }

            rainAudio.play()
                .then(() => {
                    setIsAmbientLoading(false);
                    setAmbientOn(true);
                    updateBackgroundMode(isPlaying, true);
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
            mulkAudio.pause();
        } else {
            mulkAudio.play().catch(() => { });
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
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

    return (
        <div className="min-h-screen bg-[#02150a] text-white p-5 flex flex-col relative overflow-hidden">
            {/* Stars background mock */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    />
                ))}
            </div>

            <header className="flex justify-between items-center z-10 mb-12">
                <Button variant="ghost" onClick={() => navigate(-1)} className="text-white/40 hover:text-white">
                    <ChevronLeft size={24} />
                    Geri
                </Button>
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                    <Moon size={16} className="text-islamic-gold" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-islamic-gold">Uyku Modu</span>
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center z-10 gap-16">
                <div className="text-center space-y-4">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-b from-islamic-gold/20 to-transparent border border-islamic-gold/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
                        <Moon size={48} className="text-islamic-gold" />
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-islamic-gold">Huzurlu Uykular</h2>
                    <p className="text-gray-400 max-w-[250px] mx-auto text-sm leading-relaxed">
                        Zihnini sakinleştir, kalbini ferahlat ve O'na (cc) sığınarak uyu.
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
                                    <p className="text-sm font-bold">Mülk Suresi</p>
                                    <p className="text-[10px] text-gray-400">Kabir azabından koruyucu</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => setIsMulkLooping(!isMulkLooping)}
                                    className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center transition-all border shadow-lg active:scale-95",
                                        isMulkLooping
                                            ? "bg-islamic-gold text-[#02150a] border-islamic-gold shadow-islamic-gold/20"
                                            : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
                                    )}
                                    title="Döngü (Sürekli Çal)"
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

                        {/* Volume Control */}
                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl">
                            <Volume2 size={14} className="text-gray-400" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gray-400"
                            />
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-400/10 rounded-2xl text-blue-400">
                                    <CloudRain size={24} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold">Yağmur Sesi</p>
                                    <p className="text-[10px] text-gray-400">Dinlendirici ambiyans</p>
                                    {ambientError && <p className="text-[8px] text-red-400 mt-1">Hata: {ambientError}</p>}
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

                        {/* Volume Control for Rain */}
                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl">
                            <Volume2 size={14} className="text-gray-400" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={ambientVolume}
                                onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                                className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gray-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Forgiveness Action */}
                <div className="w-full">
                    {forgiven ? (
                        <div className="bg-emerald-900/40 border border-emerald-500/30 p-6 rounded-3xl text-center animate-in zoom-in duration-500">
                            <Heart className="w-8 h-8 text-emerald-400 mx-auto mb-2 fill-emerald-400/20" />
                            <p className="text-sm font-bold text-emerald-100">Kalbin hafifledi. Allah rahatlık versin.</p>
                        </div>
                    ) : (
                        <Button
                            onClick={handleForgive}
                            className="w-full h-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl font-bold gap-3"
                        >
                            <Heart size={20} className="text-pink-400" />
                            Hakkımı Helal Ediyorum
                        </Button>
                    )}
                </div>
            </div>

            <div className="h-24"></div>
        </div>
    );
}
