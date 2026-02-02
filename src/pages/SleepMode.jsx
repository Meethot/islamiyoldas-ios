import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Volume2, VolumeX, Play, Pause, Heart, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getAppDate } from '@/lib/testDate';

export default function SleepMode() {
    const navigate = useNavigate();
    const [isPlaying, setIsPlaying] = useState(false);
    const [ambientOn, setAmbientOn] = useState(false);

    const getTodayKey = () => `sleep_forgiven_${getAppDate().toISOString().split('T')[0]}`;

    const [forgiven, setForgiven] = useState(() => {
        return localStorage.getItem(getTodayKey()) === 'true';
    });

    // Audio Sources
    const mulkAudio = React.useMemo(() => new Audio('https://www.tvquran.com/uploads/multimedia/mishary/067.mp3'), []);
    const rainAudio = React.useMemo(() => {
        // Using a reliable rain sound source
        const audio = new Audio('https://cdn.freesound.org/previews/521/521544_3248244-lq.mp3');
        audio.loop = true;
        audio.volume = 0.5; // Set to 50% volume for ambient sound
        return audio;
    }, []);

    useEffect(() => {
        if (ambientOn) {
            rainAudio.play().catch(() => { });
        } else {
            rainAudio.pause();
        }
    }, [ambientOn]);

    const toggleMulk = () => {
        if (isPlaying) {
            mulkAudio.pause();
        } else {
            mulkAudio.play().catch(() => { });
        }
        setIsPlaying(!isPlaying);
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
        };
    }, []);

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
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-islamic-gold/10 rounded-2xl text-islamic-gold">
                                <Play size={24} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold">Mülk Suresi</p>
                                <p className="text-[10px] text-gray-400">Kabir azabından koruyucu</p>
                            </div>
                        </div>
                        <Button
                            onClick={toggleMulk}
                            className="w-12 h-12 rounded-full bg-islamic-gold text-[#02150a] flex items-center justify-center"
                        >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </Button>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-400/10 rounded-2xl text-blue-400">
                                <Volume2 size={24} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold">Yağmur Sesi</p>
                                <p className="text-[10px] text-gray-400">Dinlendirici ambiyans</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => setAmbientOn(!ambientOn)}
                            className={cn("w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-colors", ambientOn ? "bg-white/20" : "bg-transparent")}
                        >
                            {ambientOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </Button>
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
