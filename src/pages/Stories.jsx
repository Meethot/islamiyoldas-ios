import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, BookOpen, Clock, ChevronRight, X, Headphones, Volume2, Sparkles, Heart, VolumeX, SkipBack, SkipForward, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

import { STORIES } from '@/data/spiritualData';

const CATEGORIES = [
    { id: 'prophets', label: 'Peygamberler', icon: BookOpen },
    { id: 'companions', label: 'Sahabeler', icon: Heart },
    { id: 'moral', label: 'Kıssalar', icon: Sparkles },
];

export default function Stories() {
    const [activeCategory, setActiveCategory] = useState('prophets');
    const [selectedStory, setSelectedStory] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isMuted, setIsMuted] = useState(false);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [isSpeeding, setIsSpeeding] = useState(false);
    const audioRef = React.useRef(null);

    React.useEffect(() => {
        if (selectedStory && audioRef.current) {
            audioRef.current.src = selectedStory.audioUrl || '';
            audioRef.current.load();
            audioRef.current.volume = volume;
            setIsPlaying(false);
            setCurrentTime(0);
            setIsSpeeding(false); // Reset speed on new story
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current.playbackRate = 1.0;
            }
        };
    }, [selectedStory]);

    const togglePlay = () => {
        if (!audioRef.current || !selectedStory.audioUrl) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Audio play failed", e));
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
            audioRef.current.muted = newVolume === 0;
        }
        setIsMuted(newVolume === 0);
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        if (audioRef.current) {
            const newMuted = !isMuted;
            audioRef.current.muted = newMuted;
            setIsMuted(newMuted);
            if (!newMuted && volume === 0) {
                setVolume(0.5);
                audioRef.current.volume = 0.5;
            }
        }
    };

    const handleNext = () => {
        const currentStories = STORIES[activeCategory] || [];
        const currentIndex = currentStories.findIndex(s => s.id === selectedStory.id);
        if (currentIndex !== -1 && currentIndex < currentStories.length - 1) {
            setSelectedStory(currentStories[currentIndex + 1]);
        }
    };

    const handlePrev = () => {
        const currentStories = STORIES[activeCategory] || [];
        const currentIndex = currentStories.findIndex(s => s.id === selectedStory.id);
        if (currentIndex > 0) {
            setSelectedStory(currentStories[currentIndex - 1]);
        }
    };

    const toggleSpeed = () => {
        if (audioRef.current) {
            const newSpeed = !isSpeeding;
            audioRef.current.playbackRate = newSpeed ? 2.0 : 1.0;
            setIsSpeeding(newSpeed);
        }
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-4 p-5 pb-24 dark:bg-[#032e18]">
            <header className="mb-6 px-1">
                <h2 className="text-2xl font-serif font-bold text-islamic-green dark:text-islamic-gold">Sesli Şifa</h2>
                <p className="text-sm text-gray-500 dark:text-emerald-100/40 italic">Maneviyatınızı dinlendirecek, ruhunuzu iyileştirecek hikayeler...</p>
            </header>

            {/* Category Selection */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all text-sm font-medium whitespace-nowrap shadow-sm",
                            activeCategory === cat.id
                                ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] border-islamic-green scale-105"
                                : "bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/5"
                        )}
                    >
                        <cat.icon size={16} className={activeCategory === cat.id ? "text-islamic-gold dark:text-[#032e18]" : "text-islamic-green dark:text-islamic-gold"} />
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Story Grid */}
            <div className="grid gap-5">
                {(STORIES[activeCategory] || []).map((story) => (
                    <Card
                        key={story.id}
                        className="group overflow-hidden border-none shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] rounded-[2rem] bg-white dark:bg-white/5 cursor-pointer hover:shadow-xl transition-all duration-300"
                        onClick={() => setSelectedStory(story)}
                    >
                        <div className="flex">
                            <div className="flex-1 p-6 pr-2">
                                <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white group-hover:text-islamic-green dark:group-hover:text-islamic-gold transition-colors mb-2">
                                    {story.title}
                                </h3>
                                <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed italic mb-4">
                                    {story.content.substring(0, 80)}...
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-gray-300">
                                        <Clock className="w-3 h-3" /> {story.duration}
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-islamic-green dark:text-islamic-gold">
                                        <BookOpen className="w-3 h-3" /> Oku
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-islamic-green dark:text-islamic-gold">
                                        <Headphones className="w-3 h-3" /> Dinle
                                    </div>
                                </div>
                            </div>
                            <div className="w-20 bg-islamic-green/5 dark:bg-islamic-gold/10 flex items-center justify-center group-hover:bg-islamic-gold/10 dark:group-hover:bg-islamic-gold/20 transition-colors">
                                <Button
                                    className="w-12 h-12 rounded-full bg-islamic-green dark:bg-islamic-gold hover:opacity-90 text-white dark:text-[#032e18] shadow-lg transition-transform group-hover:scale-110"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedStory(story);
                                    }}
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Deep Reading/Listening View (Mobile Simulation) */}
            <AnimatePresence>
                {selectedStory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
                        onClick={() => setSelectedStory(null)}
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-[420px] h-full max-h-[90vh] bg-white dark:bg-[#032e18] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col border border-white/5 ring-4 ring-black/20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 flex items-center justify-between border-b dark:border-white/10 bg-cream-bg/40 dark:bg-black/20 shrink-0">
                                <Button variant="ghost" size="icon" onClick={() => setSelectedStory(null)} className="rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                                    <X className="w-6 h-6 text-islamic-green dark:text-islamic-gold" />
                                </Button>
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Şuan Dinleniyor</span>
                                </div>
                                <div className="w-10"></div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-5 py-6">
                                {/* Audio Player Card */}
                                <div className={cn(
                                    "bg-gradient-to-br from-islamic-green to-[#033a1f] rounded-[2rem] p-6 mb-8 shadow-xl relative overflow-hidden group/card ring-1 ring-white/10 transition-transform duration-200",
                                    isSpeeding && "scale-[1.02] ring-islamic-gold/50"
                                )}>
                                    {/* 2x Speed Button - Floating Top Right */}
                                    <div className="absolute top-4 right-4 z-20">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "h-7 px-3 rounded-full font-bold text-[10px] transition-all border border-white/10 active:scale-95 select-none backdrop-blur-md",
                                                isSpeeding
                                                    ? "bg-islamic-gold text-[#032e18] shadow-[0_0_15px_rgba(255,215,0,0.5)]"
                                                    : "bg-black/20 text-white/60 hover:text-white hover:bg-black/40"
                                            )}
                                            onClick={toggleSpeed}
                                        >
                                            {isSpeeding ? "Normal Hız" : "2x Hızlandır"}
                                        </Button>
                                    </div>

                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-5 backdrop-blur-md shadow-inner border border-white/5">
                                            <Headphones className="w-8 h-8 text-islamic-gold" />
                                        </div>
                                        <h1 className="text-xl font-serif font-bold text-white mb-6 text-center leading-tight">{selectedStory.title}</h1>

                                        {/* Hidden Audio Element */}
                                        <audio
                                            ref={audioRef}
                                            onTimeUpdate={handleTimeUpdate}
                                            onLoadedMetadata={handleLoadedMetadata}
                                            onEnded={handleEnded}
                                        />

                                        {/* Interactive Progress Bar */}
                                        <div className="w-full flex items-center gap-3 mb-6">
                                            <span className="text-[10px] font-mono text-white/60 w-8 text-right tabular-nums">
                                                {formatTime(currentTime)}
                                            </span>

                                            <div className="relative flex-1 h-6 flex items-center group/seek">
                                                {/* Visual Track */}
                                                <div className="absolute inset-x-0 h-1.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                                                    <div
                                                        className="h-full bg-islamic-gold transition-all duration-100 ease-out"
                                                        style={{ width: `${(currentTime / duration) * 100}%` }}
                                                    />
                                                </div>

                                                {/* Thumb */}
                                                <div
                                                    className="absolute w-4 h-4 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.3)] opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none ring-2 ring-islamic-gold scale-100 group-active/seek:scale-110"
                                                    style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translateX(-50%)' }}
                                                />

                                                {/* Range Input */}
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={duration || 0}
                                                    value={currentTime}
                                                    onChange={handleSeek}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                            </div>

                                            <span className="text-[10px] font-mono text-white/60 w-8 tabular-nums">
                                                {formatTime(duration)}
                                            </span>
                                        </div>

                                        {/* Playback Controls */}
                                        <div className="flex items-center justify-center gap-6 w-full relative mb-4">

                                            {/* Prev Button */}
                                            <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/10 rounded-full" onClick={handlePrev}>
                                                <SkipBack className="w-6 h-6 fill-current" />
                                            </Button>

                                            {/* Play/Pause Button */}
                                            <Button
                                                onClick={togglePlay}
                                                className="w-16 h-16 rounded-full bg-islamic-gold hover:bg-[#d6a549] hover:scale-105 active:scale-95 transition-all text-[#032e18] shadow-[0_8px_20px_-6px_rgba(0,0,0,0.4)] flex items-center justify-center p-0 ring-4 ring-black/10"
                                            >
                                                {isPlaying ? (
                                                    <div className="flex gap-1 h-5">
                                                        <div className="w-1.5 bg-[#032e18] rounded-full animate-[music-bar_0.6s_ease-in-out_infinite]" />
                                                        <div className="w-1.5 bg-[#032e18] rounded-full animate-[music-bar_0.8s_ease-in-out_infinite_0.1s]" />
                                                    </div>
                                                ) : (
                                                    <Play className="w-7 h-7 fill-current ml-1" />
                                                )}
                                            </Button>

                                            {/* Next Button */}
                                            <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/10 rounded-full" onClick={handleNext}>
                                                <SkipForward className="w-6 h-6 fill-current" />
                                            </Button>
                                        </div>

                                        {/* Volume Control Row (Full Width) */}
                                        <div className="flex items-center justify-center w-full px-2">

                                            {/* Enhanced Volume Control */}
                                            <div className="flex-1 bg-black/20 backdrop-blur-md rounded-full p-1.5 flex items-center gap-3 border border-white/5 transition-all hover:bg-black/30">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={toggleMute}
                                                    className="w-7 h-7 text-white/80 hover:text-white hover:bg-white/10 rounded-full shrink-0 ml-1"
                                                >
                                                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                                </Button>

                                                <div className="relative flex-1 h-6 flex items-center cursor-pointer group/volume">
                                                    {/* Track Background */}
                                                    <div className="absolute inset-x-0 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        {/* Active Fill */}
                                                        <div
                                                            className="h-full bg-gradient-to-r from-islamic-gold/80 to-islamic-gold rounded-full"
                                                            style={{ width: `${volume * 100}%` }}
                                                        />
                                                    </div>

                                                    {/* Enhanced Thumb */}
                                                    <div
                                                        className="absolute w-4 h-4 bg-white rounded-full shadow-lg border-2 border-islamic-gold cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                                                        style={{ left: `${volume * 100}%`, transform: 'translateX(-50%)' }}
                                                    />

                                                    {/* Real Input */}
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="1"
                                                        step="0.01"
                                                        value={volume}
                                                        onChange={handleVolumeChange}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                    {/* Decoration */}
                                    <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] rotate-12 pointer-events-none">
                                        <Volume2 size={240} />
                                    </div>
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-[#033a1f]/80 to-transparent pointer-events-none" />
                                </div>

                                {/* Article Text */}
                                <div className="space-y-6">
                                    <article className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 leading-relaxed text-lg font-serif px-1 pb-10">
                                        <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-islamic-green dark:first-letter:text-islamic-gold first-letter:mr-2 first-letter:float-left whitespace-pre-wrap">
                                            {selectedStory.content}
                                        </p>
                                    </article>
                                </div>

                                <div className="h-10" />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
