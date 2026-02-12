import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BookOpen, Search, Play, Pause, SkipBack, SkipForward,
    ChevronDown, ChevronUp, Bookmark, BookmarkCheck, Share2, X, Loader2, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { fetchChapters, fetchSurahAudio } from '@/services/quranApi';
import { safeGetStorage, safeSetStorage } from '@/utils/storageHelper';
import { getSurahSummary } from '@/data/surahSummaries';
import { App } from '@capacitor/app';
import { useTranslation } from 'react-i18next';

// Background Mode Helper (Cordova Plugin)
const BackgroundMode = {
    enable: (surahName) => {
        if (window.cordova?.plugins?.backgroundMode) {
            window.cordova.plugins.backgroundMode.enable();
            window.cordova.plugins.backgroundMode.setDefaults({
                title: t('bgTitle'),
                text: t('listeningTo', { name: surahName }),
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

const BOOKMARKS_KEY = 'quran_bookmarks';

export default function Quran() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('quran');
    const { selection, success } = useHaptics();
    const currentLang = i18n.language?.split('-')[0] || 'tr';

    // State
    const [surahs, setSurahs] = useState([]);
    const [isLoadingSurahs, setIsLoadingSurahs] = useState(true);
    const [surahError, setSurahError] = useState(null);
    const [selectedSurah, setSelectedSurah] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentAyah, setCurrentAyah] = useState(1);
    const [showSurahList, setShowSurahList] = useState(true);
    const [activeTab, setActiveTab] = useState('surahs'); // 'surahs' | 'bookmarks'
    const [bookmarks, setBookmarks] = useState(() => safeGetStorage(BOOKMARKS_KEY, []));

    // Audio Playback State
    const [audio] = useState(() => new Audio());
    const [currentlyPlaying, setCurrentlyPlaying] = useState(null); // surah object
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1.0);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [isAudioLoading, setIsAudioLoading] = useState(false);

    // Remove bookmark
    const removeBookmark = (verseKey) => {
        selection();
        setBookmarks(prev => {
            const updated = prev.filter(b => b.verseKey !== verseKey);
            safeSetStorage(BOOKMARKS_KEY, updated);
            return updated;
        });
    };

    // Auto-Resume Audio on App Foreground
    // This fixes "ses gitti" when switching apps
    useEffect(() => {
        const handleResume = async () => {
            if (currentlyPlaying && isPlaying && audio.paused) {
                console.log("App resumed, forcing audio play...");
                try {
                    await audio.play();
                    setIsAudioPlaying(true);
                } catch (e) {
                    console.warn("Resume failed", e);
                }
            }
        };

        const listener = App.addListener('appStateChange', state => {
            if (state.isActive) handleResume();
        });

        return () => {
            listener.then(f => f.remove());
        };
    }, [currentlyPlaying, isPlaying, audio]);

    // Fetch all 114 surahs on mount
    useEffect(() => {
        const loadSurahs = async () => {
            try {
                setIsLoadingSurahs(true);
                setSurahError(null);
                const chapters = await fetchChapters(currentLang);
                // Map to UI format
                setSurahs(chapters.map(ch => ({
                    id: ch.id,
                    name: currentLang === 'tr' ? (ch.translatedName || ch.name) : ch.name,
                    nameSimple: ch.name,
                    arabic: ch.nameArabic,
                    ayahCount: ch.ayahCount,
                    revelationPlace: ch.revelationPlace
                })));
            } catch (err) {
                console.error('Failed to fetch surahs:', err);
                setSurahError(t('surahLoadError'));
            } finally {
                setIsLoadingSurahs(false);
            }
        };
        loadSurahs();
    }, [currentLang]);

    const filteredSurahs = surahs.filter(surah =>
        surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surah.nameSimple.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surah.arabic.includes(searchQuery) ||
        String(surah.id) === searchQuery.trim()
    );

    const handleSurahSelect = (surah) => {
        selection();
        navigate(`/quran/${surah.id}`);
    };


    const toggleMute = () => {
        selection();
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        audio.muted = newMuted;
        if (!newMuted && volume === 0) {
            setVolume(0.5);
            audio.volume = 0.5;
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        audio.volume = newVolume;
        if (newVolume === 0) {
            setIsMuted(true);
            audio.muted = true;
        } else if (isMuted) {
            setIsMuted(false);
            audio.muted = false;
        }
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Audio Logic
    const handlePlaySurah = async (e, surah) => {
        e.stopPropagation(); // Don't navigate to detail
        selection();

        if (currentlyPlaying?.id === surah.id) {
            if (isAudioPlaying) {
                audio.pause();
                setIsAudioPlaying(false);
                BackgroundMode.disable();
            } else {
                // Resuming same surah
                audio.play();
                setIsAudioPlaying(true);
                BackgroundMode.enable(surah.name);
            }
            return;
        }

        // New Surah
        try {
            setIsAudioLoading(true);
            const audioUrl = await fetchSurahAudio(surah.id);

            // Only reload if URL is different to avoid resetting
            if (audio.src !== audioUrl) {
                audio.pause();
                audio.src = audioUrl;
                audio.load();
                audio.volume = volume;
                audio.muted = isMuted;
            } else {
                // Seeked or stopped but same URL
                audio.volume = volume;
                audio.muted = isMuted;
            }

            setCurrentlyPlaying(surah);

            const onCanPlay = () => {
                audio.play();
                setIsAudioPlaying(true);
                setIsAudioLoading(false);
                setDuration(audio.duration);
                BackgroundMode.enable(surah.name);
                audio.removeEventListener('canplay', onCanPlay);
            };

            if (audio.readyState >= 3) {
                onCanPlay();
            } else {
                audio.addEventListener('canplay', onCanPlay);
            }
            audio.addEventListener('loadedmetadata', () => {
                setDuration(audio.duration);
            });

            audio.ontimeupdate = () => {
                setCurrentTime(audio.currentTime);
                setAudioProgress((audio.currentTime / audio.duration) * 100);
            };

            audio.onended = () => {
                setIsAudioPlaying(false);
                setCurrentlyPlaying(null);
                setAudioProgress(0);
                setCurrentTime(0);
                BackgroundMode.disable();
            };

        } catch (error) {
            console.error('Audio play error:', error);
            setIsAudioLoading(false);
        }
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        if (duration > 0) {
            audio.currentTime = time;
            setCurrentTime(time);
            setAudioProgress((time / duration) * 100);
        }
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            audio.pause();
            audio.src = '';
            BackgroundMode.disable();
        };
    }, [audio]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-[#032e18] dark:to-[#021a0f] pb-24">
            {/* Header */}
            <div className="bg-islamic-green dark:bg-[#032e18] p-5 sticky top-0 z-40 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-serif font-bold text-white">
                                {selectedSurah ? selectedSurah.name : t('pageTitle')}
                            </h1>
                            {selectedSurah && (
                                <p className="text-xs text-white/70 font-medium">
                                    {selectedSurah.ayahCount} {t('ayahCount', { count: selectedSurah.ayahCount }).split(' ').slice(1).join(' ')} • {t(`revelation.${selectedSurah.revelationPlace}`)}
                                </p>
                            )}
                        </div>
                    </div>
                    {selectedSurah && (
                        <Button
                            onClick={() => {
                                selection();
                                setSelectedSurah(null);
                                setShowSurahList(true);
                            }}
                            variant="ghost"
                            className="text-white hover:bg-white/10"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    )}
                </div>

                {/* Search Bar */}
                {showSurahList && activeTab === 'surahs' && (
                    <div className="relative mb-3">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-[#0d2a18] border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-islamic-gold"
                        />
                    </div>
                )}

                {/* Tab Switcher */}
                {showSurahList && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => { selection(); setActiveTab('surahs'); }}
                            className={cn(
                                "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                                activeTab === 'surahs'
                                    ? "bg-islamic-gold text-white"
                                    : "bg-white/10 text-white/60 hover:bg-white/15"
                            )}
                        >
                            <BookOpen className="w-4 h-4 inline-block mr-2" />
                            {t('tabSurahs')}
                        </button>
                        <button
                            onClick={() => { selection(); setActiveTab('bookmarks'); }}
                            className={cn(
                                "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all relative",
                                activeTab === 'bookmarks'
                                    ? "bg-islamic-gold text-white"
                                    : "bg-white/10 text-white/60 hover:bg-white/15"
                            )}
                        >
                            <Bookmark className="w-4 h-4 inline-block mr-2" />
                            {t('tabBookmarks')}
                            {bookmarks.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {bookmarks.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Surah List */}
            <AnimatePresence>
                {showSurahList && activeTab === 'surahs' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-5 space-y-2"
                    >
                        {/* Loading State */}
                        {isLoadingSurahs && (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-10 h-10 text-islamic-gold animate-spin" />
                                <p className="text-sm text-gray-400">{t('loadingQuran')}</p>
                            </div>
                        )}

                        {/* Error State */}
                        {surahError && !isLoadingSurahs && (
                            <div className="text-center py-12 space-y-4">
                                <p className="text-red-400">{surahError}</p>
                                <Button
                                    onClick={() => window.location.reload()}
                                    variant="outline"
                                    className="border-islamic-gold text-islamic-gold"
                                >
                                    {t('retry')}
                                </Button>
                            </div>
                        )}

                        {/* Surah Cards */}
                        {!isLoadingSurahs && !surahError && filteredSurahs.map((surah, index) => {
                            const summaryData = getSurahSummary(surah.id, currentLang);
                            return (
                                <motion.div
                                    key={surah.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                                >
                                    <div
                                        onClick={() => handleSurahSelect(surah)}
                                        className="group relative overflow-hidden rounded-[2.5rem] bg-islamic-green/[0.03] dark:bg-islamic-gold/5 border border-islamic-green/10 dark:border-islamic-gold/10 hover:border-islamic-gold/30 transition-all cursor-pointer hover:shadow-xl active:scale-[0.98]"
                                    >
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-islamic-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-islamic-gold/10 transition-colors duration-500" />

                                        <div className="p-6 flex items-start gap-5 relative z-10">
                                            {/* Number Box - Reverted to static for mobile UX */}
                                            <div className="w-12 h-12 rounded-2xl bg-islamic-green/10 dark:bg-islamic-gold/10 flex items-center justify-center text-islamic-green dark:text-islamic-gold font-bold text-lg shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                {surah.id}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif tracking-tight">
                                                        {surah.name}
                                                    </h3>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-arabic text-2xl text-islamic-gold group-hover:scale-110 transition-transform duration-300">
                                                            {surah.arabic}
                                                        </span>
                                                        {/* Play Button - Always visible on mobile */}
                                                        <button
                                                            onClick={(e) => handlePlaySurah(e, surah)}
                                                            className={cn(
                                                                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                                                currentlyPlaying?.id === surah.id
                                                                    ? "bg-islamic-gold text-[#032e18] shadow-lg shadow-islamic-gold/20 scale-110"
                                                                    : "bg-islamic-green/10 dark:bg-islamic-gold/10 text-islamic-green dark:text-islamic-gold hover:bg-islamic-gold/20"
                                                            )}
                                                        >
                                                            {currentlyPlaying?.id === surah.id ? (
                                                                isAudioLoading ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : isAudioPlaying ? (
                                                                    <Pause className="w-5 h-5 fill-current" />
                                                                ) : (
                                                                    <Play className="w-5 h-5 fill-current ml-0.5" />
                                                                )
                                                            ) : (
                                                                <Play className="w-5 h-5 fill-current ml-0.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="text-[10px] uppercase tracking-[0.15em] font-extrabold text-islamic-green/60 dark:text-islamic-gold/60">
                                                        {t(`revelation.${surah.revelationPlace}`)}
                                                    </span>
                                                    <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                                                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                                        {t('ayahCount', { count: surah.ayahCount })}
                                                    </span>
                                                </div>

                                                {/* Summary Text (Premium Italicized) */}
                                                {summaryData && (
                                                    <div className="relative mt-2">
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-islamic-gold/40 to-transparent rounded-full" />
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed italic pl-4">
                                                            "{summaryData.summary}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {!isLoadingSurahs && !surahError && filteredSurahs.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-400">{t('noResults')}</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bookmarks List */}
            <AnimatePresence>
                {showSurahList && activeTab === 'bookmarks' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-5 space-y-3"
                    >
                        {bookmarks.length === 0 ? (
                            <div className="text-center py-16 space-y-4">
                                <div className="w-20 h-20 mx-auto rounded-full bg-islamic-gold/10 flex items-center justify-center">
                                    <Bookmark className="w-10 h-10 text-islamic-gold/50" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">{t('noBookmarks')}</h3>
                                    <p className="text-sm text-gray-400">
                                        {t('noBookmarksHint')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            bookmarks.map((bookmark, index) => (
                                <motion.div
                                    key={bookmark.verseKey}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(index * 0.05, 0.3) }}
                                >
                                    <div className="relative mb-6">
                                        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-white/5 overflow-hidden p-6 relative dark:text-white">
                                            <div className="space-y-6">
                                                {/* Header: Number & Actions */}
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-14 h-14 bg-islamic-green dark:bg-islamic-gold rounded-2xl flex items-center justify-center text-white dark:text-[#032e18] font-bold text-lg shadow-lg shrink-0">
                                                            {bookmark.verseNumber}
                                                        </div>
                                                        <div>
                                                            <button
                                                                onClick={() => {
                                                                    selection();
                                                                    navigate(`/quran/${bookmark.surahId}`);
                                                                }}
                                                                className="text-lg font-bold text-islamic-green dark:text-islamic-gold hover:underline font-serif"
                                                            >
                                                                {bookmark.surahName}
                                                            </button>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                                {t('ayat', { number: bookmark.verseNumber })}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeBookmark(bookmark.verseKey)}
                                                        className="rounded-xl text-red-400 hover:text-red-500 hover:bg-red-500/10 w-10 h-10 transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </div>

                                                {/* Content Box: Arabic, Transcription, Translation */}
                                                <div className="bg-islamic-green/[0.03] dark:bg-islamic-gold/5 border border-islamic-green/10 dark:border-islamic-gold/10 rounded-3xl p-6 text-center space-y-6 shadow-inner">
                                                    {/* Arabic */}
                                                    <p className="font-arabic text-3xl leading-[2.2] text-islamic-gold break-words">
                                                        {bookmark.arabic}
                                                    </p>

                                                    <div className="space-y-4">
                                                        {/* Separator */}
                                                        <div className="w-16 h-1 bg-islamic-gold/20 rounded-full mx-auto" />

                                                        {/* Translation (Meal) */}
                                                        <div className="text-gray-800 dark:text-emerald-50 font-medium text-lg leading-relaxed font-sans">
                                                            <span dangerouslySetInnerHTML={{ __html: bookmark.translation }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Ayah Display */}
            {selectedSurah && !showSurahList && (
                <div className="p-4 space-y-6">
                    {/* Bismillah */}
                    {selectedSurah.id !== 1 && selectedSurah.id !== 9 && (
                        <div className="text-center py-8">
                            <p className="text-3xl font-arabic text-islamic-gold">
                                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                            </p>
                        </div>
                    )}

                    {/* Ayahs */}
                    {PLACEHOLDER_AYAHS.map((ayah) => (
                        <Card key={ayah.number} className="glass-panel border-none">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="w-10 h-10 rounded-full bg-islamic-gold/10 flex items-center justify-center">
                                        <span className="text-islamic-gold font-bold text-sm">{ayah.number}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => selection()}>
                                            <Bookmark className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => selection()}>
                                            <Share2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <p className="text-2xl leading-loose text-right font-arabic text-islamic-gold">
                                    {ayah.arabic}
                                </p>

                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-white/10 pt-4">
                                    {ayah.translation}
                                </p>
                            </CardContent>
                        </Card>
                    ))}

                    {/* API Integration Note */}
                    <Card className="glass-panel border-2 border-dashed border-islamic-gold/30">
                        <CardContent className="p-6 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                💡 Ayet içeriği API'den yüklenecek
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Audio Player (Fixed Bottom) */}
            {selectedSurah && (
                <div className="fixed bottom-20 left-0 right-0 p-4 bg-white dark:bg-[#032e18] border-t border-gray-100 dark:border-white/10 backdrop-blur-xl z-40">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    {t('audioNote')}
                                </p>
                                <div className="h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-islamic-gold w-1/3" />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentAyah(Math.max(1, currentAyah - 1))}
                                    disabled={currentAyah === 1}
                                >
                                    <SkipBack className="w-4 h-4" />
                                </Button>

                                <Button
                                    onClick={togglePlay}
                                    className={cn(
                                        "w-12 h-12 rounded-full",
                                        isPlaying
                                            ? "bg-islamic-gold text-white"
                                            : "bg-islamic-green text-white"
                                    )}
                                >
                                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentAyah(Math.min(selectedSurah.ayahCount, currentAyah + 1))}
                                    disabled={currentAyah === selectedSurah.ayahCount}
                                >
                                    <SkipForward className="w-4 h-4" />
                                </Button>

                                <Button variant="ghost" size="sm" onClick={toggleMute}>
                                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Mini Player */}
            <AnimatePresence>
                {currentlyPlaying && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-32 left-4 right-4 z-50 max-w-sm mx-auto"
                    >
                        <div className="bg-[#032e18]/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-3 pl-3 pr-5 flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t-white/20">
                            {/* Play/Pause Button */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => handlePlaySurah(e, currentlyPlaying)}
                                className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-islamic-gold rounded-full shadow-[0_8px_25px_rgba(212,175,55,0.4)] text-[#032e18] transition-all"
                            >
                                {isAudioLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : isAudioPlaying ? (
                                    <Pause size={28} fill="currentColor" />
                                ) : (
                                    <Play size={28} fill="currentColor" className="ml-1" />
                                )}
                            </motion.button>

                            {/* Info & Progress */}
                            <div className="flex-1 min-w-0 py-1">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="truncate mr-2">
                                        <p className="text-[9px] text-islamic-gold font-black uppercase tracking-[0.2em] mb-1 opacity-80">{t('nowPlaying')}</p>
                                        <h4 className="text-sm font-bold text-white truncate leading-none">
                                            {t('surahName', { name: currentlyPlaying.name })}
                                        </h4>
                                    </div>
                                    <div className="text-[10px] font-bold text-white/40 tabular-nums shrink-0">
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-1.5 bg-white/10 rounded-full relative group">
                                    <motion.div
                                        className="h-full bg-islamic-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.8)] relative z-10"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${audioProgress}%` }}
                                        transition={{ duration: 0.1 }}
                                    />
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 0}
                                        value={currentTime}
                                        onChange={handleSeek}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        selection();
                                        audio.pause();
                                        setCurrentlyPlaying(null);
                                        setIsAudioPlaying(false);
                                        BackgroundMode.disable();
                                    }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all border border-white/5"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
