import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, BookOpen, X, Headphones, Sparkles, Heart, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import StoryCard from '@/components/StoryCard';
import { useStoryImage } from '@/lib/storyImages';
import { useTranslation } from 'react-i18next';
import { isPremium } from '@/services/creditService';
import { analytics } from '@/services/analyticsService';

import { STORIES } from '@/data/spiritualData';
import { STORIES_DE } from '@/data/spiritualDataDE';
import { STORIES_RU } from '@/data/spiritualDataRU';
import { STORIES_AR } from '@/data/spiritualDataAR';

const STORIES_MAP = { de: STORIES_DE, ru: STORIES_RU, ar: STORIES_AR };

const CATEGORY_IDS = [
    { id: 'prophets', icon: BookOpen },
    { id: 'companions', icon: Heart },
    { id: 'moral', icon: Sparkles },
];

export default function Stories() {
    const { t, i18n } = useTranslation('stories');
    const navigate = useNavigate();
    const lang = (i18n.language || 'en').split('-')[0];
    const activeStories = { ...STORIES, ...(STORIES_MAP[lang] || {}) };
    const [activeCategory, setActiveCategory] = useState('prophets');
    const [selectedStory, setSelectedStory] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isSpeeding, setIsSpeeding] = useState(false);
    const audioRef = React.useRef(null);
    const dragControls = useDragControls();
    const selectedImage = useStoryImage(selectedStory);

    React.useEffect(() => {
        const audio = audioRef.current;
        if (selectedStory && audio) {
            audio.src = selectedStory.audioUrl || '';
            audio.load();
            audio.volume = 1.0;
            setIsPlaying(false);
            setCurrentTime(0);
            setIsSpeeding(false); // Reset speed on new story
        }
        return () => {
            if (audio) {
                audio.pause();
                audio.src = '';
                audio.playbackRate = 1.0;
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
        if (selectedStory) {
            analytics.storyCompleted(selectedStory.title, 100);
            // Hikaye bittiğinde reklam göster (Premium değilse ve süre dolduysa otomatik gösterilir)
            import('@/services/adService').then(({ showInterstitialAd }) => showInterstitialAd()).catch(() => {});
        }
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleNext = () => {
        const currentStories = activeStories[activeCategory] || [];
        const currentIndex = currentStories.findIndex(s => s.id === selectedStory.id);
        if (currentIndex !== -1 && currentIndex < currentStories.length - 1) {
            setSelectedStory(currentStories[currentIndex + 1]);
        }
    };

    const handlePrev = () => {
        const currentStories = activeStories[activeCategory] || [];
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


            {/* Category Selection */}
            <div className="glass-panel rounded-3xl p-2 grid grid-cols-3 gap-1">
                {CATEGORY_IDS.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;
                    return (
                        <motion.button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "relative px-3 py-3 overflow-hidden rounded-2xl font-bold text-xs uppercase tracking-wider transition-all",
                                isActive
                                    ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] shadow-lg"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-[#F0E8D5] dark:hover:bg-white/5"
                            )}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Icon className={cn("w-5 h-5 mx-auto mb-1", isActive && "drop-shadow-md")} />
                            <span className="text-[10px]">{t(`categories.${cat.id}`)}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Story Grid */}
            <div className="grid gap-3">
                {(activeStories[activeCategory] || []).map((story, index) => {
                    const isFree = index === 0;
                    const isLocked = !isFree && !isPremium();
                    return (
                        <div key={story.id} className="relative">
                            <div>
                                <StoryCard
                                    story={story}
                                    category={activeCategory}
                                    locked={isLocked}
                                    onClick={() => {
                                        if (isLocked) { navigate('/premium'); return; }
                                        setSelectedStory(story);
                                        analytics.storyStarted(story.title, story.duration || 0);
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
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
                            drag="y"
                            dragControls={dragControls}
                            dragListener={false}
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={{ top: 0, bottom: 0.2 }}
                            onDragEnd={(event, info) => {
                                if (info.offset.y > 100 || info.velocity.y > 500) {
                                    setSelectedStory(null);
                                }
                            }}
                            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-[420px] h-full max-h-[90vh] bg-[#FFFDF6] dark:bg-[#032e18] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col border border-white/5 ring-4 ring-black/20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div
                                className="p-4 flex items-center justify-between border-b dark:border-white/10 bg-cream-bg/40 dark:bg-black/20 shrink-0 cursor-grab active:cursor-grabbing touch-none"
                                onPointerDown={(e) => dragControls.start(e)}
                            >
                                <Button variant="ghost" size="icon" onClick={() => setSelectedStory(null)} className="rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                                    <X className="w-6 h-6 text-islamic-green dark:text-islamic-gold" />
                                </Button>
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('nowListening')}</span>
                                </div>
                                <div className="w-10 flex justify-center">
                                    {/* Optional Handle Indicator */}
                                    <div className="w-8 h-1 bg-gray-300 dark:bg-white/20 rounded-full md:hidden opacity-50" />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-5 py-6 no-scrollbar">
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
                                            {isSpeeding ? t('normalSpeed') : t('speedUp')}
                                        </Button>
                                    </div>

                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-44 h-44 max-w-[70vw] bg-white/10 rounded-[1.75rem] flex items-center justify-center mb-6 overflow-hidden backdrop-blur-md shadow-2xl shadow-black/40 border border-white/10">
                                            {selectedImage ? (
                                                <img src={selectedImage} alt={selectedStory.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <Headphones className="w-12 h-12 text-islamic-gold" />
                                            )}
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
                                                    className="absolute w-4 h-4 bg-[#FFFDF6] rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.3)] opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none ring-2 ring-islamic-gold scale-100 group-active/seek:scale-110"
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
