import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BookOpen, ArrowLeft, Bookmark, BookmarkCheck, Share2, RefreshCw, WifiOff,
    Loader2, ChevronDown, ChevronRight, CornerDownLeft, X, Play, Pause, Volume2, VolumeX, Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { fetchSurahContent, fetchChapterInfo, fetchSurahAudio, fetchAyahAudio, fetchChapterAudioFiles } from '@/services/quranApi';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { safeGetStorage, safeSetStorage } from '@/utils/storageHelper';
import ShareCard, { SHARE_THEMES } from '@/components/ShareCard';
import { shareHiddenElement } from '@/lib/share';
import { isPremium } from '@/services/creditService';
import { analytics } from '@/services/analyticsService';

import { useTranslation } from 'react-i18next';
import { Capacitor, registerPlugin } from '@capacitor/core';

const NowPlaying = Capacitor.isNativePlatform() ? registerPlugin('NowPlaying') : null;

// Background Mode Helper (Cordova Plugin)
const BackgroundMode = {
    enable: (title, text) => {
        if (Capacitor.getPlatform() === 'ios') return; // iOS WKWebView handles background audio automatically; this plugin breaks lock screen metadata.
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
        if (Capacitor.getPlatform() === 'ios') return;
        if (window.cordova?.plugins?.backgroundMode) {
            window.cordova.plugins.backgroundMode.disable();
        }
    }
};

const BOOKMARKS_KEY = 'quran_bookmarks';

const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toArabicNumber = (num) => {
    return String(num).split('').map(digit => arabicNumerals[digit]).join('');
};

// Memoized individual verse to prevent list re-renders
const VerseItem = React.memo(({ verse, index, isBookmarked, toggleBookmark, handleShareClick, handlePlayAyah, playingAyahKey, t, verseRef, hasPremium }) => {
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
                                <button
                                    type="button"
                                    onClick={() => toggleBookmark(verse)}
                                    className={cn(
                                        "rounded-xl transition-colors w-10 h-10 flex items-center justify-center active:scale-95",
                                        isBookmarked
                                            ? "text-islamic-gold bg-islamic-gold/10"
                                            : "text-gray-400 active:text-islamic-gold active:bg-islamic-gold/10"
                                    )}
                                >
                                    {isBookmarked
                                        ? <BookmarkCheck className="w-5 h-5 fill-current" />
                                        : <Bookmark className="w-5 h-5" />
                                    }
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePlayAyah(verse)}
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                        isPlaying 
                                            ? "bg-islamic-gold text-[#032e18] shadow-lg shadow-islamic-gold/40"
                                            : hasPremium 
                                                ? "bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-white/70 hover:bg-stone-200 dark:hover:bg-white/20"
                                                : "premium-play-btn bg-gradient-to-br from-[#D4AF37] via-[#E8C94A] to-[#C9982A] text-[#3D2E0A] shadow-[0_2px_12px_rgba(212,175,55,0.35)]"
                                    )}
                                >
                                    {isPlaying 
                                        ? <Pause className="w-5 h-5 fill-current" /> 
                                        : hasPremium 
                                            ? <Play className="w-5 h-5 fill-current ml-0.5" />
                                            : <Crown className="w-5 h-5 fill-current" />
                                    }
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleShareClick(verse)}
                                    className="rounded-xl text-gray-400 active:text-islamic-gold active:bg-islamic-gold/10 transition-colors w-10 h-10 flex items-center justify-center active:scale-95"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
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
    const location = useLocation();
    const { selection, success } = useHaptics();
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language?.split('-')[0] || 'en';
    const autoPlayKey = useRef(null);

    // State
    const [bookmarks, setBookmarks] = useState(() => safeGetStorage(BOOKMARKS_KEY, []));

    // Reading Mode State
    const [viewMode, setViewMode] = useState(() => safeGetStorage('quran_default_view_mode', 'reading'));
    const [readingSubMode, setReadingSubMode] = useState(() => safeGetStorage('quran_default_sub_mode', 'tr'));
    const [zoomLevel, setZoomLevel] = useState(() => safeGetStorage('quran_reading_zoom', 1));

    useEffect(() => {
        safeSetStorage('quran_reading_zoom', zoomLevel);
    }, [zoomLevel]);

    useEffect(() => {
        safeSetStorage('quran_default_view_mode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        safeSetStorage('quran_default_sub_mode', readingSubMode);
    }, [readingSubMode]);

    // Jump to Verse State
    const verseRefs = React.useRef({});
    const [jumpTarget, setJumpTarget] = useState('');
    const [pendingJumpVerse, setPendingJumpVerse] = useState(null);

    const hasPremium = isPremium();

    // Share State
    const [shareModalData, setShareModalData] = useState(null);
    const [activeTheme, setActiveTheme] = useState(SHARE_THEMES.emerald);
    const [sharing, setSharing] = useState(false);

    // Audio State
    const [audio] = useState(() => new Audio());

    useEffect(() => {
        document.body.appendChild(audio);
        return () => {
            if (document.body.contains(audio)) {
                document.body.removeChild(audio);
            }
        };
    }, [audio]);

    useEffect(() => {
        if (!NowPlaying) return;
        let playListener;
        let pauseListener;

        const setupListeners = async () => {
            playListener = await NowPlaying.addListener('remotePlay', () => {
                audio.play().catch(() => {});
                navigator.mediaSession.playbackState = 'playing';
                setIsSurahPlaying(true);
                NowPlaying.setNowPlaying({ isPlaying: true, currentTime: audio.currentTime });
            });
            pauseListener = await NowPlaying.addListener('remotePause', () => {
                audio.pause();
                navigator.mediaSession.playbackState = 'paused';
                setIsSurahPlaying(false);
                NowPlaying.setNowPlaying({ isPlaying: false, currentTime: audio.currentTime });
            });
        };

        setupListeners();

        return () => {
            if (playListener) playListener.remove();
            if (pauseListener) pauseListener.remove();
        };
    }, [audio]);
    const [isSurahPlaying, setIsSurahPlaying] = useState(false);
    const [isSurahLoading, setIsSurahLoading] = useState(false);
    const [playingAyahKey, setPlayingAyahKey] = useState(null);
    const [audioPlaylist, setAudioPlaylist] = useState([]); // Array of {verseKey, url}
    const [playlistIndex, setPlaylistIndex] = useState(-1);
    const [audioProgress, setAudioProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    const [isPlayerVisible, setIsPlayerVisible] = useState(true);
    const playerTimeoutRef = useRef(null);

    const showPlayerTemporarily = useCallback(() => {
        setIsPlayerVisible(true);
        if (playerTimeoutRef.current) clearTimeout(playerTimeoutRef.current);
        playerTimeoutRef.current = setTimeout(() => {
            setIsPlayerVisible(false);
        }, 5000);
    }, []);

    useEffect(() => {
        if (isSurahPlaying) {
            showPlayerTemporarily();
        } else {
            setIsPlayerVisible(true);
            if (playerTimeoutRef.current) clearTimeout(playerTimeoutRef.current);
        }
        return () => {
            if (playerTimeoutRef.current) clearTimeout(playerTimeoutRef.current);
        };
    }, [isSurahPlaying, showPlayerTemporarily]);

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
        } else {
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

    const toggleZoom = () => {
        selection();
        setZoomLevel(prev => prev >= 4 ? 1 : prev + 1);
    };

    const getArabicZoomClass = () => {
        switch (zoomLevel) {
            case 2: return 'text-4xl leading-[2.5]';
            case 3: return 'text-5xl leading-[2.2]';
            case 4: return 'text-[50px] leading-[2.1]';
            default: return 'text-3xl leading-[3]'; // level 1
        }
    };

    const getLatinZoomClass = () => {
        switch (zoomLevel) {
            case 2: return 'text-xl leading-relaxed';
            case 3: return 'text-2xl leading-relaxed';
            case 4: return 'text-3xl leading-relaxed';
            default: return 'text-lg leading-relaxed'; // level 1
        }
    };

    // Auto-Scroll to Playing Ayah (for Reading Mode)
    useEffect(() => {
        if (playingAyahKey && viewMode === 'reading') {
            const verseElement = verseRefs.current[playingAyahKey];
            if (verseElement) {
                // adding a small timeout helps avoiding scroll jumps if DOM is mid-paint
                setTimeout(() => {
                    verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
            }
        }
    }, [playingAyahKey, viewMode]);

    // TanStack Query: Surah Info
    const { data: surahInfo, isLoading: infoLoading, error: infoError } = useQuery({
        queryKey: ['surahInfo', surahId, currentLang],
        queryFn: () => fetchChapterInfo(surahId, currentLang),
    });

    useEffect(() => {
        if (surahInfo?.name) {
            analytics.quranOpened(surahInfo.name, 'all');
        }
    }, [surahInfo?.name]);


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
        if (!isPremium()) { navigate('/premium'); return; }
        setBookmarks(prev => {
            const exists = prev.some(b => b.verseKey === verse.verseKey);
            let updated;
            if (exists) {
                updated = prev.filter(b => b.verseKey !== verse.verseKey);
            } else {
                analytics.quranBookmarkAdded(surahInfo?.name || String(surahId), verse.verseNumber);
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
            analytics.contentShared('quran_verse', 'system_share');
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

    // Media Session Helper
    const updateMediaSession = (title, album, isPlaying = true) => {
        if (NowPlaying) {
            NowPlaying.setNowPlaying({
                title: title,
                artist: 'İslami Yoldaş',
                album: album || 'Kuran-ı Kerim',
                duration: audio.duration || 0,
                currentTime: audio.currentTime || 0,
                isPlaying: isPlaying
            }).catch(() => {});
            
            // Listeners are added in useEffect
        }
        
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title,
                artist: 'İslami Yoldaş',
                album: album || 'Kuran-ı Kerim',
                artwork: [
                    { src: window.location.origin + '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
                    { src: window.location.origin + '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
                ]
            });
            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
            navigator.mediaSession.setActionHandler('play', () => {
                audio.play().catch(() => {});
                if (NowPlaying) NowPlaying.setNowPlaying({ isPlaying: true, currentTime: audio.currentTime });
                navigator.mediaSession.playbackState = 'playing';
                setIsSurahPlaying(true);
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                audio.pause();
                if (NowPlaying) NowPlaying.setNowPlaying({ isPlaying: false, currentTime: audio.currentTime });
                navigator.mediaSession.playbackState = 'paused';
                setIsSurahPlaying(false);
            });
        }
    };

    // Audio Logic
    const toggleSurahAudio = async () => {
        selection();
        if (!hasPremium) { navigate('/premium'); return; }

        if (isSurahPlaying) {
            audio.pause();
            setIsSurahPlaying(false);
            return;
        }

        // If we have a playlist and were paused, just resume
        if (audioPlaylist.length > 0 && playlistIndex >= 0 && audio.src) {
            audio.play();
            setIsSurahPlaying(true);
            updateMediaSession(`${surahInfo?.name} Suresi`);
            BackgroundMode.enable(surahInfo?.name, t('quran:listeningTo', { name: surahInfo?.name }));
            return;
        }

        // Start fresh playlist playback
        try {
            setIsSurahLoading(true);
            const files = await fetchChapterAudioFiles(surahId);
            if (!files || files.length === 0) throw new Error("Could not load audio files");

            setAudioPlaylist(files);
            analytics.quranAudioPlayed(surahInfo?.name || String(surahId), 'chapter'); // RE-ADDED ANALYTICS
            playFromPlaylist(0, files);
        } catch (e) {
            console.error(e);
            setIsSurahLoading(false);
        }
    };

    // Auto-play when navigated with autoPlay state
    useEffect(() => {
        const ts = location.state?._ts;
        if (location.state?.autoPlay && ts && ts !== autoPlayKey.current && surahInfo && verses.length > 0) {
            autoPlayKey.current = ts;
            // Clear the state so back/forward doesn't re-trigger
            window.history.replaceState({}, '');
            const timer = setTimeout(() => {
                toggleSurahAudio();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [location.state, surahInfo, verses.length]);

    const playFromPlaylist = (index, playlist = audioPlaylist) => {
        if (!playlist || index >= playlist.length) {
            setIsSurahPlaying(false);
            setPlayingAyahKey(null);
            setPlaylistIndex(-1);
            if (NowPlaying) NowPlaying.clearNowPlaying().catch(() => {});
            BackgroundMode.disable();
            return;
        }

        const track = playlist[index];
        setPlaylistIndex(index);
        setPlayingAyahKey(track.verseKey);
        setIsSurahPlaying(true);
        setIsSurahLoading(false);

        audio.src = track.url;
        audio.load();
        audio.volume = volume;
        audio.muted = isMuted;

        audio.onloadedmetadata = () => {
            setDuration(audio.duration);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => console.error("Playback error", err));
        }

        updateMediaSession(`${surahInfo?.name} Suresi`);
        BackgroundMode.enable(surahInfo?.name, `${surahInfo?.name} - ${index + 1}/${playlist.length}`);

        audio.onended = () => {
            playFromPlaylist(index + 1, playlist);
        };

        // Progress tracking
        audio.ontimeupdate = () => {
            setCurrentTime(audio.currentTime);
            setAudioProgress((audio.currentTime / (audio.duration || 1)) * 100);
        };
    };

    const handlePlayAyah = async (verse) => {
        selection();
        if (!hasPremium) { navigate('/premium'); return; }

        // Stop current playlist if running
        if (isSurahPlaying) {
            audio.pause();
            setIsSurahPlaying(false);
            setAudioPlaylist([]);
            setPlaylistIndex(-1);
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
            updateMediaSession(`${surahInfo?.name} Suresi - Ayet ${verse.verseNumber}`);
            analytics.quranAudioPlayed(surahInfo?.name || String(surahId), 'verse_recitation');

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
    }, [surahId]);

    // Clean up audio object
    useEffect(() => {
        return () => {
            audio.pause();
            audio.src = '';
            BackgroundMode.disable();
            // CLEANUP EVENTS
            audio.onended = null;
            audio.ontimeupdate = null;
            audio.onloadedmetadata = null;
        };
    }, [audio]);

    const loadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            analytics.quranPageScrolled(surahId);
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
                fetchNextPage();
            } else {
                // No more pages and still not found
                console.warn(`Verse ${verseNumber} could not be found even after loading all pages.`);
                setPendingJumpVerse(null);
                // Optionally trigger an alert here via a toast system if available
            }
        }
    }, [pendingJumpVerse, verses.length, hasNextPage, isFetchingNextPage, fetchNextPage, selection]);

    // Reading completed tracking
    useEffect(() => {
        if (!hasNextPage && verses.length > 0) {
            analytics.quranReadingCompleted(surahId);
        }
    }, [hasNextPage, verses.length, surahId]);

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
                                onClick={() => { selection(); navigate(-1); }}
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
        <div 
            className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-[#032e18] dark:to-[#021a0f] pb-24"
            onClick={() => {
                if (isSurahPlaying) showPlayerTemporarily();
            }}
        >
            <>
                <div className="bg-islamic-green dark:bg-[#032e18] px-4 py-2 sticky top-0 z-40 border-b border-white/10 shadow-lg">
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => {
                                selection();
                                navigate(-1);
                            }}
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10 w-8 h-8 shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base font-serif font-bold text-white truncate leading-tight">
                                {currentLang === 'tr' ? (surahInfo?.translatedName || surahInfo?.name) : surahInfo?.name}
                            </h1>
                            <div className="flex gap-2 text-[10px] text-white/60 font-medium items-center">
                                <p>{surahInfo?.ayahCount} {t('quran:ayahCount', { count: surahInfo?.ayahCount || 0 }).split(' ').slice(1).join(' ')}</p>
                                <span>•</span>
                                <p>{t(`quran:revelation.${surahInfo?.revelationPlace}`)}</p>
        
                            </div>
                        </div>
                        <p className="text-lg font-arabic text-islamic-gold shrink-0">
                            {surahInfo?.nameArabic}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                onClick={toggleZoom}
                                variant="ghost"
                                className="bg-white/10 hover:bg-white/20 text-white h-10 w-10 p-0 rounded-xl border border-white/10 flex items-center justify-center shadow-sm"
                            >
                                <span className="font-serif text-base">A<span className="text-xs ml-[1px]">a</span></span>
                            </Button>
                            <Button
                                onClick={toggleSurahAudio}
                                disabled={isSurahLoading}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all",
                                    hasPremium 
                                        ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] hover:opacity-90"
                                        : "premium-play-btn bg-gradient-to-r from-[#D4AF37] via-[#E8C94A] to-[#C9982A] text-[#3D2E0A] shadow-[0_2px_16px_rgba(212,175,55,0.4)]"
                                )}
                            >
                                {isSurahLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isSurahPlaying ? (
                                    <><Pause size={18} fill="currentColor" /> {t('quran:stop')}</>
                                ) : !hasPremium ? (
                                    <>
                                        <Crown size={16} className="fill-current opacity-80" />
                                        <span className="font-bold">{t('quran:listen')}</span>
                                    </>
                                ) : (
                                    <><Play size={18} fill="currentColor" className="ml-0.5" /> {t('quran:listen')}</>
                                )}
                            </Button>
                        </div>
                    </div>
                    
                    <div className="mt-2 border-t border-white/5 pt-2">
                        <div className="bg-black/5 dark:bg-white/5 p-1 rounded-xl flex gap-1 overflow-hidden relative">
                            {['tr', 'ar', 'translit'].map(mode => (
                                <button
                                    key={`submode-${mode}`}
                                    onClick={() => { selection(); setReadingSubMode(mode); }}
                                    className={cn(
                                        "flex-1 py-2 text-[12px] font-bold rounded-lg transition-all duration-300 relative z-10 capitalize",
                                        readingSubMode === mode ? "text-white" : "text-white/60 hover:text-white/80"
                                    )}
                                >
                                    {readingSubMode === mode && (
                                        <motion.div
                                            layoutId="readingSubModeBg"
                                            className="absolute inset-0 bg-white/20 rounded-lg -z-10"
                                        />
                                    )}
                                    {mode === 'tr' ? 'Meâl' : mode === 'ar' ? 'Arapça' : 'Okunuş'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </>

            <div className="p-4 space-y-4">
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

                <AnimatePresence mode="wait">
                    {viewMode === 'verses' ? (
                        <motion.div
                            key="verses-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-4"
                        >
                            {verses.map((verse, index) => (
                                <VerseItem
                                    key={verse.verseKey}
                                    verse={verse}
                                    index={index}
                                    isBookmarked={isBookmarked(verse.verseKey)}
                                    toggleBookmark={toggleBookmark}
                                    handleShareClick={handleShareClick}
                                    handlePlayAyah={handlePlayAyah}
                                    playingAyahKey={playingAyahKey}
                                    t={t}
                                    verseRef={(el) => {
                                        if (el) {
                                            verseRefs.current[verse.verseNumber] = el;
                                            verseRefs.current[verse.verseKey] = el;
                                            verseRefs.current[`idx-${verse.verseNumber}`] = el;
                                        }
                                    }}
                                    hasPremium={hasPremium}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="reading-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                        >
                            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-white/5 overflow-hidden p-8 dark:text-white">
                                {readingSubMode === 'ar' && (
                                    <div className="text-right font-arabic" dir="rtl">
                                        {verses.map((verse) => (
                                            <span
                                                key={verse.id}
                                                id={`verse-${verse.verseKey}`}
                                                ref={(el) => { if (el) verseRefs.current[verse.verseKey] = el; }}
                                                className={cn(
                                                    "inline transition-all duration-700",
                                                    getArabicZoomClass(),
                                                    playingAyahKey === verse.verseKey
                                                        ? "text-islamic-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                                                        : "text-islamic-green dark:text-islamic-gold"
                                                )}
                                            >
                                                {verse.arabic} <span className={cn(
                                                    "text-islamic-gold/70 inline-flex items-center justify-center mr-1 ml-2 relative top-1",
                                                    zoomLevel >= 3 ? "text-4xl" : "text-2xl"
                                                )}>۝<span className={cn(
                                                    "absolute font-sans font-bold text-islamic-green dark:text-white/80",
                                                    zoomLevel >= 3 ? "text-sm" : "text-[11px]"
                                                )}>{toArabicNumber(verse.verseNumber)}</span></span>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {readingSubMode === 'tr' && (
                                    <div className="text-left space-y-2">
                                        {verses.map((verse) => (
                                            <span
                                                key={verse.id}
                                                id={`verse-${verse.verseKey}`}
                                                ref={(el) => { if (el) verseRefs.current[verse.verseKey] = el; }}
                                                className={cn(
                                                    "font-sans transition-all duration-700 inline rounded-md py-0.5",
                                                    getLatinZoomClass(),
                                                    playingAyahKey === verse.verseKey
                                                        ? "bg-islamic-gold/20 dark:bg-islamic-gold/30 text-gray-900 dark:text-white font-semibold"
                                                        : "text-gray-800 dark:text-emerald-50"
                                                )}
                                            >
                                                <span className="text-[10px] font-bold bg-islamic-green/10 text-islamic-green dark:bg-islamic-gold/10 dark:text-islamic-gold px-1.5 py-0.5 rounded-md mx-1 relative -top-0.5">
                                                    {verse.verseNumber}
                                                </span>
                                                <span dangerouslySetInnerHTML={{ __html: verse.translation }} />
                                                {" "}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {readingSubMode === 'translit' && (
                                    <div className="text-left space-y-2">
                                        {verses.map((verse) => (
                                            <span
                                                key={verse.id}
                                                id={`verse-${verse.verseKey}`}
                                                ref={(el) => { if (el) verseRefs.current[verse.verseKey] = el; }}
                                                className={cn(
                                                    "font-sans transition-all duration-700 inline rounded-md py-0.5",
                                                    getLatinZoomClass(),
                                                    playingAyahKey === verse.verseKey
                                                        ? "bg-islamic-gold/20 dark:bg-islamic-gold/30 text-gray-900 dark:text-white font-semibold"
                                                        : "text-gray-800 dark:text-emerald-50"
                                                )}
                                            >
                                                <span className="text-[10px] font-bold bg-islamic-green/10 text-islamic-green dark:bg-islamic-gold/10 dark:text-islamic-gold px-1.5 py-0.5 rounded-md mx-1 relative -top-0.5">
                                                    {verse.verseNumber}
                                                </span>
                                                {verse.transliteration}
                                                {" "}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

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

                            <div className="grid grid-cols-5 gap-3 mb-8">
                                {Object.values(SHARE_THEMES).map((theme, index) => {
                                    const isFree = index === 0;
                                    const isLocked = !isFree && !isPremium();
                                    return (
                                        <button
                                            key={theme.id}
                                            onClick={() => {
                                                selection();
                                                if (isLocked) {
                                                    navigate('/premium');
                                                    return;
                                                }
                                                setActiveTheme(theme);
                                            }}
                                            className={cn(
                                                "aspect-square rounded-full transition-all duration-300 relative border-2 border-transparent",
                                                theme.preview,
                                                activeTheme.id === theme.id ? "scale-110 ring-2 ring-offset-2 ring-islamic-gold ring-offset-[#021a0f]" : isLocked ? "opacity-40" : "opacity-70 hover:opacity-100"
                                            )}
                                            aria-label={theme.name}
                                        >
                                            {activeTheme.id === theme.id && (
                                                <motion.div
                                                    layoutId="activeTheme"
                                                    className="absolute inset-0 border-2 border-white/50 rounded-full"
                                                />
                                            )}
                                            {isLocked && (
                                                <div className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-gradient-to-br from-islamic-gold to-amber-600 flex items-center justify-center shadow-md shadow-islamic-gold/30">
                                                    <Crown size={9} className="text-white" fill="white" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

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

            {shareModalData && (
                <ShareCard
                    theme={activeTheme.id}
                    data={shareModalData}
                />
            )}


        </div>
    );
}
