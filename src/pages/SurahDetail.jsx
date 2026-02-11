import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BookOpen, ArrowLeft, Bookmark, BookmarkCheck, Share2, RefreshCw, WifiOff,
    Loader2, ChevronDown, ChevronRight, X, Play, Pause, Volume2, VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { fetchSurahContent, fetchChapterInfo, fetchSurahAudio, fetchAyahAudio } from '@/services/quranApi';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { safeGetStorage, safeSetStorage } from '@/utils/storageHelper';
import ShareCard, { SHARE_THEMES } from '@/components/ShareCard';
import { shareHiddenElement } from '@/lib/share';

import { useTranslation } from 'react-i18next';

// Background Mode Helper (Cordova Plugin)
const BackgroundMode = {
    enable: (title, text) => {
        if (window.cordova?.plugins?.backgroundMode) {
            window.cordova.plugins.backgroundMode.enable();
            window.cordova.plugins.backgroundMode.setDefaults({
                title: 'İslami Yoldaş',
                text: text,
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

// Memoized individual verse to prevent list re-renders
const VerseItem = React.memo(({ verse, index, isBookmarked, toggleBookmark, handleShareClick, handlePlayAyah, playingAyahKey, t, verseRef }) => {
    const isPlaying = playingAyahKey === verse.verseKey;

    return (
        <motion.div
            ref={verseRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.5) }}
        >
            <div className="relative mb-6">
                <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-white/5 overflow-hidden p-6 relative dark:text-white">
                    <div className="space-y-6">
                        {/* Header: Number & Actions */}
                        <div className="flex items-start justify-between">
                            <div className="w-14 h-14 bg-islamic-green dark:bg-islamic-gold rounded-2xl flex items-center justify-center text-white dark:text-[#032e18] font-bold text-lg shadow-lg shrink-0">
                                {verse.verseNumber}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleBookmark(verse)}
                                    className={cn(
                                        "rounded-xl transition-all w-10 h-10 hover:bg-islamic-gold/10",
                                        isBookmarked
                                            ? "text-islamic-gold bg-islamic-gold/10"
                                            : "text-gray-400 hover:text-islamic-gold"
                                    )}
                                >
                                    {isBookmarked
                                        ? <BookmarkCheck className="w-5 h-5 fill-current" />
                                        : <Bookmark className="w-5 h-5" />
                                    }
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePlayAyah(verse)}
                                    className={cn(
                                        "rounded-xl transition-all w-10 h-10 hover:bg-islamic-gold/10",
                                        isPlaying ? "text-islamic-gold bg-islamic-gold/10" : "text-gray-400 hover:text-islamic-gold"
                                    )}
                                >
                                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleShareClick(verse)}
                                    className="rounded-xl text-gray-400 hover:text-islamic-gold hover:bg-islamic-gold/10 w-10 h-10"
                                >
                                    <Share2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Content Box: Arabic, Transcription, Translation */}
                        <div className="bg-islamic-green/[0.03] dark:bg-islamic-gold/5 border border-islamic-green/10 dark:border-islamic-gold/10 rounded-3xl p-6 text-center space-y-6 shadow-inner">
                            {/* Arabic */}
                            <p className="font-arabic text-3xl leading-[2.2] text-islamic-gold break-words">
                                {verse.arabic}
                            </p>

                            {/* Divider/Spacer if needed, or just space-y */}

                            <div className="space-y-4">
                                {/* Transcription (Okunuş) */}
                                {verse.transliteration && (
                                    <p className="text-gray-500 dark:text-emerald-100/60 italic text-base font-serif leading-relaxed px-2">
                                        {verse.transliteration}
                                    </p>
                                )}

                                {/* Separator */}
                                <div className="w-16 h-1 bg-islamic-gold/20 rounded-full mx-auto" />

                                {/* Translation (Meal) */}
                                <div className="text-gray-800 dark:text-emerald-50 font-medium text-lg leading-relaxed font-sans">
                                    <span dangerouslySetInnerHTML={{ __html: verse.translation }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
}, (prev, next) => {
    return (
        prev.verse.id === next.verse.id &&
        prev.isBookmarked === next.isBookmarked &&
        prev.playingAyahKey === next.playingAyahKey &&
        prev.index === next.index
    );
});

export default function SurahDetail() {
    const { surahId } = useParams();
    const navigate = useNavigate();
    const { selection, success } = useHaptics();
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language?.split('-')[0] || 'tr';

    // State
    const [bookmarks, setBookmarks] = useState(() => safeGetStorage(BOOKMARKS_KEY, []));

    // Jump to Verse State
    const verseRefs = React.useRef({});
    const [jumpTarget, setJumpTarget] = useState('');
    const [pendingJumpVerse, setPendingJumpVerse] = useState(null);

    // Share State
    const [shareModalData, setShareModalData] = useState(null);
    const [activeTheme, setActiveTheme] = useState(SHARE_THEMES.emerald);
    const [sharing, setSharing] = useState(false);

    // Audio State
    const [audio] = useState(() => new Audio());
    const [isSurahPlaying, setIsSurahPlaying] = useState(false);
    const [isSurahLoading, setIsSurahLoading] = useState(false);
    const [playingAyahKey, setPlayingAyahKey] = useState(null);
    const [audioProgress, setAudioProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    const handleJumpToVerse = (e) => {
        e.preventDefault();
        const verseNumber = parseInt(jumpTarget);
        if (!verseNumber) return;

        // Try to find element by verse number or index
        const element = verseRefs.current[verseNumber] || verseRefs.current[`idx-${verseNumber}`];

        if (element) {
            selection();
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Don't clear immediately so user can see what they typed if they want to adjust
            setJumpTarget('');
            console.log(`Jumped to verse ${verseNumber}`);
        } else {
            console.log(`Verse ${verseNumber} not currently loaded. Checks started...`);
            // Store pending jump target
            setPendingJumpVerse(verseNumber);

            // If we have more pages, this will trigger the effect to fetch
            if (hasNextPage) {
                // Show a toast or small loading indicator could be nice here, but logical flow first
            } else if (surahInfo && verseNumber <= surahInfo.ayahCount) {
                // Valid verse but maybe just not rendered yet? (Edge case)
            } else {
                console.warn('Verse likely out of range');
            }
        }
    };

    // TanStack Query: Surah Info
    const { data: surahInfo, isLoading: infoLoading, error: infoError } = useQuery({
        queryKey: ['surahInfo', surahId, currentLang],
        queryFn: () => fetchChapterInfo(surahId, currentLang),
    });

    // TanStack Query: Infinite Verses
    const {
        data: verseData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: versesLoading,
        error: versesError,
        refetch: retry
    } = useInfiniteQuery({
        queryKey: ['verses', surahId, currentLang],
        queryFn: ({ pageParam = 1 }) => fetchSurahContent(surahId, pageParam, currentLang),
        getNextPageParam: (lastPage) => lastPage.pagination.next_page,
        initialPageParam: 1,
    });

    const verses = verseData ? verseData.pages.flatMap(page => page.verses) : [];
    const pagination = verseData?.pages[verseData.pages.length - 1]?.pagination;

    // Toggle bookmark
    const toggleBookmark = useCallback((verse) => {
        selection();
        setBookmarks(prev => {
            const exists = prev.some(b => b.verseKey === verse.verseKey);
            let updated;
            if (exists) {
                updated = prev.filter(b => b.verseKey !== verse.verseKey);
            } else {
                updated = [...prev, {
                    verseKey: verse.verseKey,
                    verseNumber: verse.verseNumber,
                    surahId: parseInt(surahId),
                    surahName: surahInfo?.name || '',
                    arabic: verse.arabic,
                    translation: verse.translation,
                    savedAt: Date.now()
                }];
                success?.();
            }
            safeSetStorage(BOOKMARKS_KEY, updated);
            return updated;
        });
    }, [surahId, surahInfo, selection, success]);

    const handleShareClick = useCallback((verse) => {
        selection();
        setShareModalData({
            type: 'verse',
            arabic: verse.arabic,
            translation: verse.translation,
            surah: surahInfo?.name || `Surah ${surahId}`,
            verseNumber: verse.verseNumber
        });
        setActiveTheme(SHARE_THEMES.emerald);
    }, [surahId, surahInfo, selection]);

    const handleShare = async () => {
        if (sharing) return;
        setSharing(true);
        try {
            await shareHiddenElement(
                'share-card',
                `"${shareModalData.translation}"\n\n${surahInfo?.name || t('quran:pageTitle')} ${shareModalData.verseNumber}. ${t('quran:ayat', { number: '' }).trim()} - ${t('quran:bgTitle')} 🤲`,
                t('quran:shareVerse')
            );
            setShareModalData(null);
        } catch (e) {
            console.error(e);
        } finally {
            setSharing(false);
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

    // Audio Logic
    const toggleSurahAudio = async () => {
        selection();
        if (playingAyahKey) {
            audio.pause();
            setPlayingAyahKey(null);
        }

        if (isSurahPlaying) {
            audio.pause();
            setIsSurahPlaying(false);
            BackgroundMode.disable();
        } else {
            // Check if we are resuming the SAME surah
            // We use a simplified check: if audio.src is set and we've already loaded duration/metadata
            // and we are just paused.
            const isSameAudio = audio.src && (audio.src.includes(`chapter_recitations/${surahId}.mp3`) || audio.src.includes(`/${surahId}.mp3`));

            if (isSameAudio && audio.currentTime > 0) {
                audio.play();
                setIsSurahPlaying(true);
                BackgroundMode.enable(surahInfo?.name, t('quran:listeningTo', { name: surahInfo?.name }));
            } else {
                try {
                    setIsSurahLoading(true);
                    const url = await fetchSurahAudio(surahId);

                    // Only reload if URL is different to avoid resetting
                    if (audio.src !== url) {
                        audio.src = url;
                        audio.load();
                        audio.volume = volume;
                        audio.muted = isMuted;
                    } else {
                        // If URL is same but we seeked or stopped, just ensure volume/mute
                        audio.volume = volume;
                        audio.muted = isMuted;
                    }

                    const onCanPlay = () => {
                        audio.play();
                        setIsSurahPlaying(true);
                        setIsSurahLoading(false);
                        setDuration(audio.duration);
                        BackgroundMode.enable(surahInfo?.name, t('quran:listeningTo', { name: surahInfo?.name }));
                        audio.removeEventListener('canplay', onCanPlay);
                    };

                    if (audio.readyState >= 3) { // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
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
                        setIsSurahPlaying(false);
                        setAudioProgress(0);
                        setCurrentTime(0);
                        BackgroundMode.disable();
                    };
                } catch (e) {
                    console.error(e);
                    setIsSurahLoading(false);
                }
            }
        }
    };

    const handlePlayAyah = async (verse) => {
        selection();
        if (isSurahPlaying) {
            audio.pause();
            setIsSurahPlaying(false);
            BackgroundMode.disable();
        }

        if (playingAyahKey === verse.verseKey) {
            audio.pause();
            setPlayingAyahKey(null);
            return;
        }

        try {
            setPlayingAyahKey(verse.verseKey);
            const url = await fetchAyahAudio(verse.verseKey);
            if (!url) throw new Error('No audio URL');

            audio.src = url;
            audio.load();
            audio.volume = volume;
            audio.muted = isMuted;
            audio.play();

            audio.onended = () => {
                setPlayingAyahKey(null);
            };
        } catch (e) {
            console.error(e);
            setPlayingAyahKey(null);
        }
    };

    // Scroll to top when surah changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return () => {
            audio.pause();
            audio.src = '';
            BackgroundMode.disable();
        };
    }, [surahId, audio]);

    const loadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const isBookmarked = (verseKey) => bookmarks.some(b => b.verseKey === verseKey);

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

    // Auto-Pagination Effect for Jump to Verse
    useEffect(() => {
        if (!pendingJumpVerse) return;

        const verseNumber = pendingJumpVerse;
        const element = verseRefs.current[verseNumber] || verseRefs.current[`idx-${verseNumber}`];

        if (element) {
            // Found it! Scroll and clear pending
            console.log(`Found pending verse ${verseNumber}, scrolling...`);
            selection();
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setPendingJumpVerse(null);
            setJumpTarget('');
        } else {
            // Not found yet
            if (isFetchingNextPage) {
                // Already loading, just wait
                return;
            }

            if (hasNextPage) {
                console.log(`Fetching next page for verse ${verseNumber}...`);
                fetchNextPage();
            } else {
                // No more pages and still not found
                console.warn(`Verse ${verseNumber} could not be found even after loading all pages.`);
                setPendingJumpVerse(null);
                // Optionally trigger an alert here via a toast system if available
            }
        }
    }, [pendingJumpVerse, verses.length, hasNextPage, isFetchingNextPage, fetchNextPage, selection]);

    // Initial Loading State
    if (infoLoading || (versesLoading && !verseData)) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-[#032e18] dark:to-[#021a0f] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <Loader2 className="w-12 h-12 text-islamic-gold mx-auto" />
                    </motion.div>
                    <p className="text-gray-500 dark:text-gray-400">{t('quran:versesLoading')}</p>
                </div>
            </div>
        );
    }

    // Error State
    const error = infoError || versesError;
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-[#032e18] dark:to-[#021a0f] flex items-center justify-center p-6">
                <Card className="w-full max-w-md glass-panel border-none">
                    <CardContent className="p-8 text-center space-y-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                            <WifiOff className="w-10 h-10 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {t('quran.connection_error', 'Connection Error')}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400">
                                {error.message || 'An error occurred'}
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={() => navigate('/quran')}
                                variant="outline"
                                className="border-gray-200 dark:border-white/10"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {t('quran.back', 'Back')}
                            </Button>
                            <Button
                                onClick={retry}
                                className="bg-islamic-green hover:bg-islamic-green/90"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {t('quran.retry', 'Retry')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-[#032e18] dark:to-[#021a0f] pb-24">
            {/* Header */}
            <div className="bg-islamic-green dark:bg-[#032e18] p-5 sticky top-0 z-40 border-b border-white/10 shadow-lg">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => {
                            selection();
                            navigate('/quran');
                        }}
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/10"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-serif font-bold text-white">
                                    {surahInfo?.name}
                                </h1>
                                <p className="text-xs text-white/70 font-medium">
                                    {surahInfo?.ayahCount} {t('quran:ayahCount', { count: surahInfo?.ayahCount || 0 }).split(' ').slice(1).join(' ')} • {t(`quran:revelation.${surahInfo?.revelationPlace}`)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audio and Title Row */}
                <div className="flex items-center justify-between mt-4">
                    <Button
                        onClick={toggleSurahAudio}
                        disabled={isSurahLoading}
                        className="bg-islamic-gold text-[#032e18] hover:bg-islamic-gold/90 h-10 px-4 rounded-xl shadow-lg shadow-islamic-gold/20 flex items-center gap-2 font-bold"
                    >
                        {isSurahLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isSurahPlaying ? (
                            <><Pause size={18} fill="currentColor" /> {t('quran:stop')}</>
                        ) : (
                            <><Play size={18} fill="currentColor" className="ml-0.5" /> {t('quran:listen')}</>
                        )}
                    </Button>
                    <p className="text-2xl font-arabic text-islamic-gold">
                        {surahInfo?.nameArabic}
                    </p>
                </div>

                {/* Jump to Verse Input */}
                {/* Jump to Verse Input */}
                <form onSubmit={handleJumpToVerse} className="mt-4 flex items-center gap-3">
                    <div className="relative flex-1">
                        <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder={t('quran:verseNumber')}
                            value={jumpTarget}
                            onChange={(e) => setJumpTarget(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJumpToVerse(e)}
                            className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-3 pl-5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-islamic-gold/50 backdrop-blur-sm transition-all text-lg font-medium [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>
                    <Button
                        type="button"
                        onClick={handleJumpToVerse}
                        disabled={!jumpTarget}
                        className="bg-islamic-gold text-[#032e18] hover:bg-islamic-gold/90 border-none rounded-2xl w-12 h-12 flex items-center justify-center shadow-lg shadow-islamic-gold/10 active:scale-95 transition-all"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </Button>
                </form>
            </div>

            {/* Verses */}
            <div className="p-4 space-y-4">
                {/* Bismillah - Show for all except Fatiha (1) and Tawbah (9) */}
                {surahInfo?.id !== 1 && surahInfo?.id !== 9 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-8"
                    >
                        <p className="text-3xl font-arabic text-islamic-green dark:text-islamic-gold leading-loose">
                            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {t('quran.bismillah_translation')}
                        </p>
                    </motion.div>
                )}

                {/* Verse Cards */}
                <AnimatePresence>
                    {verses.map((verse, index) => (
                        <VerseItem
                            key={verse.id}
                            verse={verse}
                            verseRef={(el) => {
                                if (el) {
                                    verseRefs.current[verse.verseNumber] = el;
                                    verseRefs.current[`idx-${index + 1}`] = el;
                                }
                            }}
                            index={index}
                            isBookmarked={isBookmarked(verse.verseKey)}
                            toggleBookmark={toggleBookmark}
                            handleShareClick={handleShareClick}
                            handlePlayAyah={handlePlayAyah}
                            playingAyahKey={playingAyahKey}
                            t={t}
                        />
                    ))}
                </AnimatePresence>

                {/* Load More Button */}
                {hasNextPage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-4"
                    >
                        <Button
                            onClick={loadMore}
                            disabled={isFetchingNextPage}
                            className="w-full bg-islamic-gold/10 text-islamic-gold hover:bg-islamic-gold/20 border border-islamic-gold/20"
                        >
                            {isFetchingNextPage ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('quran.loading', 'Loading...')}
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-4 h-4 mr-2" />
                                    {t('quran.load_more')}
                                </>
                            )}
                        </Button>
                    </motion.div>
                )}

                {/* End of Surah */}
                {!hasNextPage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8"
                    >
                        <p className="text-2xl font-arabic text-islamic-gold">
                            صَدَقَ اللَّهُ الْعَظِيمُ
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {t('quran.sadaqallah')}
                        </p>
                    </motion.div>
                )}

                {/* Next Surah Button */}
                {!pagination?.next_page && verses.length > 0 && parseInt(surahId) < 114 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6"
                    >
                        <button
                            onClick={() => {
                                selection();
                                navigate(`/quran/${parseInt(surahId) + 1}`);
                            }}
                            className="w-full py-4 bg-emerald-900/50 text-islamic-gold rounded-xl border border-emerald-800 flex justify-center items-center gap-2 font-semibold active:scale-95 transition-all hover:bg-emerald-900/70"
                        >
                            {t('quran.next_surah')}
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}
            </div>

            {/* SHARE MODAL */}
            <AnimatePresence>
                {shareModalData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setShareModalData(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#F9F8F3] dark:bg-[#021a0f] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-serif text-xl font-bold text-islamic-green dark:text-islamic-gold">
                                    {t('quran:shareVerse')}
                                </h3>
                                <button
                                    onClick={() => setShareModalData(null)}
                                    className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-800 dark:text-white" />
                                </button>
                            </div>

                            {/* Theme Grid */}
                            <div className="grid grid-cols-5 gap-3 mb-8">
                                {Object.values(SHARE_THEMES).map(theme => (
                                    <button
                                        key={theme.id}
                                        onClick={() => {
                                            selection();
                                            setActiveTheme(theme);
                                        }}
                                        className={cn(
                                            "aspect-square rounded-full transition-all duration-300 relative border-2 border-transparent",
                                            theme.preview,
                                            activeTheme.id === theme.id ? "scale-110 ring-2 ring-offset-2 ring-islamic-gold ring-offset-[#021a0f]" : "opacity-70 hover:opacity-100"
                                        )}
                                        aria-label={theme.name}
                                    >
                                        {activeTheme.id === theme.id && (
                                            <motion.div
                                                layoutId="activeTheme"
                                                className="absolute inset-0 border-2 border-white/50 rounded-full"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Action Button */}
                            <Button
                                onClick={handleShare}
                                disabled={sharing}
                                className="w-full bg-islamic-gold hover:bg-islamic-gold/90 text-white font-bold h-14 rounded-2xl text-lg shadow-lg shadow-islamic-gold/20"
                            >
                                {sharing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        {t('quran:preparing')}
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-5 h-5 mr-2" />
                                        {t('quran:share')}
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden Share Card */}
            {
                shareModalData && (
                    <ShareCard
                        theme={activeTheme.id}
                        data={shareModalData}
                    />
                )
            }

            {/* Mini Player for Surah Playback */}
            <AnimatePresence>
                {isSurahPlaying && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-24 left-4 right-4 z-50 px-2 max-w-sm mx-auto"
                    >
                        <div className="bg-[#032e18]/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-3 pl-3 pr-5 flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t-white/20">
                            {/* Play/Pause Button */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleSurahAudio}
                                className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-islamic-gold rounded-full shadow-[0_8px_25px_rgba(212,175,55,0.4)] text-[#032e18] transition-all"
                            >
                                {isSurahLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : isSurahPlaying ? (
                                    <Pause size={28} fill="currentColor" />
                                ) : (
                                    <Play size={28} fill="currentColor" className="ml-1" />
                                )}
                            </motion.button>

                            {/* Info & Progress */}
                            <div className="flex-1 min-w-0 py-1">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="truncate mr-2">
                                        <p className="text-[9px] text-islamic-gold font-black uppercase tracking-[0.2em] mb-1 opacity-80">{t('quran:nowPlaying')}</p>
                                        <h4 className="text-sm font-bold text-white truncate leading-none">
                                            {t('quran:surahName', { name: surahInfo?.name })}
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
                                        setIsSurahPlaying(false);
                                        BackgroundMode.disable();
                                    }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all border border-white/5"
                                >
                                    <X size={18} />
                                </button>
                                <div className="relative flex items-center justify-center">
                                    <AnimatePresence>
                                        {showVolumeSlider && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, height: 140, scale: 1 }}
                                                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                                                className="absolute bottom-full mb-0 left-0 w-10 bg-[#032e18]/95 backdrop-blur-xl border border-islamic-gold/20 rounded-t-full shadow-2xl z-50 flex flex-col items-center justify-end overflow-hidden origin-bottom pb-1"
                                            >
                                                <div className="relative w-full h-full group flex flex-col items-center">
                                                    {/* Background Track */}
                                                    <div className="absolute inset-x-3 bottom-0 top-3 bg-white/10 rounded-full" />

                                                    {/* Active Volume Level (Gold Fill) */}
                                                    <div
                                                        className="absolute bottom-0 inset-x-3 bg-islamic-gold transition-all duration-75 ease-out rounded-b-full rounded-t-sm"
                                                        style={{ height: `${volume * 100}%`, maxHeight: 'calc(100% - 12px)' }}
                                                    />

                                                    {/* Invisible Input for Touch Interaction */}
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="1"
                                                        step="0.01"
                                                        value={volume}
                                                        onChange={handleVolumeChange}
                                                        onTouchEnd={() => setShowVolumeSlider(false)}
                                                        onMouseUp={() => setShowVolumeSlider(false)}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 touch-none"
                                                        style={{ appearance: 'slider-vertical' }}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowVolumeSlider(!showVolumeSlider);
                                        }}
                                        className={cn(
                                            "w-10 h-10 flex items-center justify-center rounded-full transition-all border border-white/5 relative z-50",
                                            isMuted ? "bg-red-500/20 text-red-400" : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white"
                                        )}
                                    >
                                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
