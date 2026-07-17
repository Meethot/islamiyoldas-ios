import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BookOpen, Search, Play, Pause, SkipBack, SkipForward,
    ChevronDown, ChevronUp, Bookmark, BookmarkCheck, Share2, X, Loader2, Trash2, ChevronLeft, Volume2, Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { fetchChapters, fetchSurahAudio } from '@/services/quranApi';
import { safeGetStorage, safeSetStorage } from '@/utils/storageHelper';
import { getSurahSummary } from '@/data/surahSummaries';
import { App } from '@capacitor/app';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { isPremium } from '@/services/creditService';
import { analytics } from '@/services/analyticsService';
import { useTranslation } from 'react-i18next';

const NowPlaying = Capacitor.isNativePlatform() ? registerPlugin('NowPlaying') : null;

// Background Mode Helper (Cordova Plugin)
const BackgroundMode = {
    enable: (title, text) => {
        if (Capacitor.getPlatform() === 'ios') return; // iOS WKWebView handles background audio automatically; this plugin breaks lock screen metadata.
        if (window.cordova?.plugins?.backgroundMode) {
            window.cordova.plugins.backgroundMode.enable();
            window.cordova.plugins.backgroundMode.setDefaults({
                title: title || 'İslami Yoldaş - Kuran',
                text: text || '',
                icon: 'ic_launcher',
                color: '044D29', // islamic-green
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
const SURAH_BOOKMARKS_KEY = 'quran_surah_bookmarks';
const PLACEHOLDER_SURAHS = Array.from({ length: 114 }, (_, i) => ({ id: i + 1 }));
const PLACEHOLDER_AYAHS = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }));

// Case- and diacritics-insensitive search: "FATIHA"/"fatiha" matches "Fâtiha", "IHLAS" matches "İhlâs".
// NFD strip folds â/î/û/ş/ç/ö/ü/ğ to base letters; ı→i covers the Turkish dotless-i/I pair.
const normalizeSearch = (s) => (s || '')
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0131/g, 'i')
    .replace(/['\u2019\u02BC-]/g, '');

export default function Quran({ isTrackingTab = false }) {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('quran');
    const { selection, success } = useHaptics();
    const currentLang = i18n.language?.split('-')[0] || 'en';

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
    const [surahBookmarks, setSurahBookmarks] = useState(() => safeGetStorage(SURAH_BOOKMARKS_KEY, []));

    // Audio Playback State
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
                setIsAudioPlaying(true);
                NowPlaying.setNowPlaying({ isPlaying: true, currentTime: audio.currentTime });
            });
            pauseListener = await NowPlaying.addListener('remotePause', () => {
                audio.pause();
                navigator.mediaSession.playbackState = 'paused';
                setIsAudioPlaying(false);
                NowPlaying.setNowPlaying({ isPlaying: false, currentTime: audio.currentTime });
            });
        };

        setupListeners();

        return () => {
            if (playListener) playListener.remove();
            if (pauseListener) pauseListener.remove();
        };
    }, [audio]);
    const [currentlyPlaying, setCurrentlyPlaying] = useState(null); // surah object
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1.0);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [isAudioLoading, setIsAudioLoading] = useState(false);

    // Remove verse bookmark
    const removeBookmark = (verseKey) => {
        selection();
        setBookmarks(prev => {
            const updated = prev.filter(b => b.verseKey !== verseKey);
            safeSetStorage(BOOKMARKS_KEY, updated);
            return updated;
        });
    };

    // Toggle surah bookmark
    const toggleSurahBookmark = (e, surah) => {
        e.stopPropagation();
        selection();
        setSurahBookmarks(prev => {
            const isBookmarked = prev.some(b => b.id === surah.id);
            const updated = isBookmarked
                ? prev.filter(b => b.id !== surah.id)
                : [...prev, { id: surah.id, name: surah.name, nameSimple: surah.nameSimple, arabic: surah.arabic, ayahCount: surah.ayahCount, revelationPlace: surah.revelationPlace, savedAt: Date.now() }];
            safeSetStorage(SURAH_BOOKMARKS_KEY, updated);
            if (!isBookmarked) success();
            return updated;
        });
    };

    const isSurahBookmarked = (surahId) => surahBookmarks.some(b => b.id === surahId);

    // Auto-Resume Audio on App Foreground
    // This fixes "ses gitti" when switching apps
    useEffect(() => {
        const handleResume = async () => {
            if (currentlyPlaying && isPlaying && audio.paused) {
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

    const searchNorm = normalizeSearch(searchQuery);

    const filteredSurahs = surahs.filter(surah =>
        normalizeSearch(surah.name).includes(searchNorm) ||
        normalizeSearch(surah.nameSimple).includes(searchNorm) ||
        surah.arabic.includes(searchQuery) ||
        String(surah.id) === searchQuery.trim()
    );

    const filteredSurahBookmarks = surahBookmarks.filter(surah =>
        !searchQuery ||
        normalizeSearch(surah.name).includes(searchNorm) ||
        normalizeSearch(surah.nameSimple).includes(searchNorm) ||
        surah.arabic?.includes(searchQuery) ||
        String(surah.id) === searchQuery.trim()
    );

    const filteredVerseBookmarks = bookmarks.filter(b =>
        !searchQuery ||
        normalizeSearch(b.surahName).includes(searchNorm) ||
        normalizeSearch(b.translation).includes(searchNorm) ||
        (b.arabic || '').includes(searchQuery) ||
        String(b.verseNumber) === searchQuery.trim()
    );


    useEffect(() => {
        if (!searchQuery) return;
        const timer = setTimeout(() => {
            analytics.searchPerformed(searchQuery, filteredSurahs.length);
            if (filteredSurahs.length === 0) {
                analytics.searchNoResults(searchQuery);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [searchQuery, filteredSurahs.length]);

    const handleSurahSelect = (surah) => {
        selection();
        if (searchQuery) analytics.searchResultClicked();
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
    const updateMediaSession = (title, album, audioRef, surah, isPlaying = true) => {
        if (NowPlaying) {
            NowPlaying.setNowPlaying({
                title: title,
                artist: 'İslami Yoldaş',
                album: album || 'Kuran-ı Kerim',
                duration: audio.duration || 0,
                currentTime: audio.currentTime || 0,
                isPlaying: isPlaying
            }).catch(() => {});
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
                setIsAudioPlaying(true);
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                audio.pause();
                if (NowPlaying) NowPlaying.setNowPlaying({ isPlaying: false, currentTime: audio.currentTime });
                navigator.mediaSession.playbackState = 'paused';
                setIsAudioPlaying(false);
            });
        }
    };

    const handlePlaySurah = async (e, surah) => {
        e.stopPropagation();
        selection();
        if (!isPremium()) { navigate('/premium'); return; }

        if (currentlyPlaying?.id === surah.id) {
            if (isAudioPlaying) {
                audio.pause();
                setIsAudioPlaying(false);
            } else {
                audio.play();
                setIsAudioPlaying(true);
                updateMediaSession(`${surah.name} Suresi`, 'Kuran-ı Kerim', audio, surah);
                BackgroundMode.enable('İslami Yoldaş', `${surah.name} Suresi`);
            }
            return;
        }

        // New Surah
        try {
            setIsAudioLoading(true);
            const audioUrl = await fetchSurahAudio(surah.id);

            if (audio.src !== audioUrl) {
                audio.pause();
                audio.src = audioUrl;
                audio.load();
                audio.volume = volume;
                audio.muted = isMuted;
            } else {
                audio.volume = volume;
                audio.muted = isMuted;
            }

            setCurrentlyPlaying(surah);

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => console.error("Playback error", err));
            }
            setIsAudioPlaying(true);
            setIsAudioLoading(false);
            
            updateMediaSession(`${surah.name} Suresi`, 'Kuran-ı Kerim', audio, surah);
            BackgroundMode.enable('İslami Yoldaş', `${surah.name} Suresi`);
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

    const togglePlay = (e) => {
        if (e) e.stopPropagation();
        if (currentlyPlaying) {
            if (isAudioPlaying) {
                audio.pause();
                setIsAudioPlaying(false);
                if (NowPlaying) NowPlaying.setNowPlaying({ isPlaying: false, currentTime: audio.currentTime });
            } else {
                audio.play();
                setIsAudioPlaying(true);
                if (NowPlaying) NowPlaying.setNowPlaying({ isPlaying: true, currentTime: audio.currentTime });
            }
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
        <div className={cn(!isTrackingTab && "min-h-screen bg-gradient-to-b from-background to-muted dark:from-[#032e18] dark:to-[#021a0f] pb-24")}>
            {/* Header — embedded (tracking tab): controls sit directly on page bg; standalone: sticky panel */}
            <div className={cn(!isTrackingTab && "bg-[#FFFDF6] dark:bg-gradient-to-br dark:from-[#032e18] dark:via-[#032e18] dark:to-[#021a0f] p-5 sticky top-0 z-40 border-b border-[#E2D9C4] dark:border-white/10 shadow-sm dark:shadow-lg dark:shadow-black/20")}>
                {!(isTrackingTab && !selectedSurah) && (
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            {!isTrackingTab && (
                                <button
                                    onClick={() => navigate(-1)}
                                    className="p-2 -ml-2 rounded-xl hover:bg-[#F0E8D5] dark:hover:bg-white/10 active:bg-[#E9DFC8] dark:active:bg-white/20 transition-colors"
                                >
                                    <ChevronLeft className="w-6 h-6 text-stone-700 dark:text-white" />
                                </button>
                            )}
                            <div className="p-3 bg-islamic-green/10 dark:bg-white/10 rounded-2xl backdrop-blur-sm">
                                <BookOpen className="w-6 h-6 text-islamic-green dark:text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-serif font-bold text-stone-800 dark:text-white">
                                    {selectedSurah ? selectedSurah.name : t('pageTitle')}
                                </h1>
                                {selectedSurah && (
                                    <>
                                        <p className="text-xs text-stone-500 dark:text-white/70 font-medium">
                                            {selectedSurah.ayahCount} {t('ayahCount', { count: selectedSurah.ayahCount }).split(' ').slice(1).join(' ')}
                                        </p>
                                        <p className="text-xs text-stone-500 dark:text-white/70 font-medium">
                                            {t(`revelation.${selectedSurah.revelationPlace}`)}
                                        </p>
                                    </>
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
                                className="text-stone-600 dark:text-white hover:bg-[#F0E8D5] dark:hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        )}
                    </div>
                )}

                {/* Search Bar */}
                {showSurahList && (
                    <div className="relative mb-3">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 dark:text-white/50" />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-11 py-3 bg-[#F0E8D5] dark:bg-[#0d2a18] border border-[#E2D9C4] dark:border-white/20 rounded-2xl text-stone-800 dark:text-white placeholder-stone-400 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-islamic-green dark:focus:ring-islamic-gold"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { selection(); setSearchQuery(''); }}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-300/70 dark:bg-white/20 flex items-center justify-center active:scale-90 transition-transform"
                            >
                                <X className="w-3.5 h-3.5 text-stone-600 dark:text-white/80" />
                            </button>
                        )}
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
                                    ? "bg-amber-600 dark:bg-islamic-gold text-white"
                                    : "bg-[#F0E8D5] dark:bg-white/10 text-stone-500 dark:text-white/60 hover:bg-[#E9DFC8] dark:hover:bg-white/15"
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
                                    ? "bg-amber-600 dark:bg-islamic-gold text-white"
                                    : "bg-[#F0E8D5] dark:bg-white/10 text-stone-500 dark:text-white/60 hover:bg-[#E9DFC8] dark:hover:bg-white/15"
                            )}
                        >
                            <Bookmark className="w-4 h-4 inline-block mr-2" />
                            {t('tabBookmarks')}
                            {(bookmarks.length + surahBookmarks.length) > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-600 dark:bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {bookmarks.length + surahBookmarks.length}
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
                        className={cn("space-y-2", isTrackingTab ? "pt-5" : "p-5")}
                    >
                        {/* Premium Promo Banner */}
                        {!isPremium() && (
                            <div className="mb-5 relative overflow-visible">
                                <div className="relative overflow-hidden rounded-[1.75rem]">
                                {/* Background layers */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#92400e] via-[#a8500f] to-[#78350f] dark:from-[#0a3d22] dark:via-[#0d4a2a] dark:to-[#063018]" />
                                <div className="absolute inset-0 bg-gradient-to-r from-islamic-gold/[0.06] via-transparent to-islamic-gold/[0.03]" />
                                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-islamic-gold/[0.08] blur-2xl" />
                                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-amber-400/[0.08] dark:bg-emerald-500/[0.06] blur-2xl" />
                                
                                {/* Content */}
                                <div className="relative z-10 p-4 flex items-center gap-4">
                                    {/* Icon */}
                                    <div className="relative w-14 h-14 shrink-0">
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-full border border-white/10">
                                            <Volume2 className="w-6 h-6 text-islamic-gold" />
                                        </div>
                                    </div>
                                    
                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-white leading-tight mb-0.5">
                                            {t('premiumBannerTitle')}
                                        </p>
                                        <p className="text-[11px] text-amber-100/70 dark:text-emerald-200/60 leading-tight">
                                            {t('premiumBannerSubtitle')}
                                        </p>
                                    </div>
                                    
                                    {/* Premium button */}
                                    <div className="shrink-0 text-right">
                                        <button
                                            onClick={() => { selection(); navigate('/premium'); }}
                                            className="px-4 py-2 rounded-xl bg-islamic-gold text-[#032e18] text-xs font-bold shadow-lg shadow-islamic-gold/20 active:scale-95 transition-transform"
                                        >
                                            <Crown className="w-3.5 h-3.5 inline mr-1" />
                                            Premium
                                        </button>
                                    </div>
                                </div>
                                </div>
                            </div>
                        )}
                        

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
                                        className="group relative overflow-hidden rounded-[2.5rem] bg-islamic-green/[0.03] dark:bg-[#0c2a16] border border-islamic-green/10 dark:border-islamic-gold/10 hover:border-islamic-gold/30 transition-all cursor-pointer hover:shadow-xl active:scale-[0.98]"
                                    >
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-islamic-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-islamic-gold/10 transition-colors duration-500" />

                                        <div className="p-6 flex items-start gap-5 relative z-10">
                                            {/* Number Box - Reverted to static for mobile UX */}
                                            <div className="w-12 h-12 rounded-2xl bg-amber-600/10 dark:bg-islamic-gold/10 flex items-center justify-center text-amber-700 dark:text-white font-bold text-lg shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                {surah.id}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif tracking-tight truncate min-w-0 mr-2">
                                                        {surah.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="font-arabic text-2xl text-islamic-gold group-hover:scale-110 transition-transform duration-300">
                                                            {surah.arabic}
                                                        </span>
                                                        {/* Bookmark Button */}
                                                        <button
                                                            onClick={(e) => toggleSurahBookmark(e, surah)}
                                                            className={cn(
                                                                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300",
                                                                isSurahBookmarked(surah.id)
                                                                    ? "bg-islamic-gold/20 text-islamic-gold"
                                                                    : "bg-islamic-green/10 dark:bg-islamic-gold/10 text-islamic-green/50 dark:text-islamic-gold/50 hover:text-islamic-gold"
                                                            )}
                                                        >
                                                            {isSurahBookmarked(surah.id) ? (
                                                                <BookmarkCheck className="w-4 h-4" />
                                                            ) : (
                                                                <Bookmark className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        {/* Play Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                selection();
                                                                if (!isPremium()) {
                                                                    navigate('/premium');
                                                                    return;
                                                                }
                                                                navigate(`/quran/${surah.id}`, { state: { autoPlay: true, _ts: Date.now() } });
                                                            }}
                                                            className={cn(
                                                                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300",
                                                                isPremium()
                                                                    ? "bg-islamic-green/10 dark:bg-islamic-gold/10 text-islamic-green dark:text-islamic-gold hover:bg-islamic-gold/20"
                                                                    : "premium-play-btn bg-gradient-to-br from-[#D4AF37] via-[#E8C94A] to-[#C9982A] text-[#3D2E0A] shadow-[0_2px_12px_rgba(212,175,55,0.35)]"
                                                            )}
                                                        >
                                                            {isPremium() 
                                                                ? <Play className="w-4 h-4 fill-current ml-0.5" />
                                                                : <Crown className="w-4 h-4 fill-current" />
                                                            }
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="text-[10px] uppercase tracking-[0.15em] font-extrabold text-amber-700/70 dark:text-islamic-gold/60">
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
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed italic pl-4 line-clamp-3">
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
                        className={cn("space-y-3", isTrackingTab ? "pt-5" : "p-5")}
                    >
                        {bookmarks.length === 0 && surahBookmarks.length === 0 ? (
                            <div className="text-center py-16 space-y-4">
                                <div className="w-20 h-20 mx-auto rounded-full bg-islamic-gold/10 flex items-center justify-center">
                                    <Bookmark className="w-10 h-10 text-islamic-gold/50" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground dark:text-white mb-1">{t('noBookmarks')}</h3>
                                    <p className="text-sm text-gray-400">
                                        {t('noBookmarksHint')}
                                    </p>
                                </div>
                            </div>
                        ) : filteredSurahBookmarks.length === 0 && filteredVerseBookmarks.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-400">{t('noResults')}</p>
                            </div>
                        ) : (
                            <>
                                {/* Saved Surahs */}
                                {filteredSurahBookmarks.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-bold text-amber-700/70 dark:text-islamic-gold/60 uppercase tracking-widest mb-3 px-1">
                                            <BookOpen className="w-4 h-4 inline-block mr-2" />
                                            {t('savedSurahs', { defaultValue: 'Kaydedilen Sureler' })}
                                        </h3>
                                        <div className="space-y-2">
                                            {filteredSurahBookmarks.map((surah, index) => {
                                                const summaryData = getSurahSummary(surah.id, currentLang);
                                                return (
                                                    <motion.div
                                                        key={`surah-${surah.id}`}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: Math.min(index * 0.05, 0.3) }}
                                                    >
                                                        <div
                                                            onClick={() => { selection(); navigate(`/quran/${surah.id}`); }}
                                                            className="group relative overflow-hidden rounded-[2.5rem] bg-islamic-green/[0.03] dark:bg-[#0c2a16] border border-islamic-green/10 dark:border-islamic-gold/10 hover:border-islamic-gold/30 transition-all cursor-pointer hover:shadow-xl active:scale-[0.98]"
                                                        >
                                                            <div className="p-5 flex items-center gap-4 relative z-10">
                                                                <div className="w-12 h-12 rounded-2xl bg-amber-600/10 dark:bg-islamic-gold/10 flex items-center justify-center text-amber-700 dark:text-white font-bold text-lg shadow-sm shrink-0">
                                                                    {surah.id}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between">
                                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white font-serif">{surah.name}</h3>
                                                                        <span className="font-arabic text-xl text-islamic-gold">{surah.arabic}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[10px] uppercase tracking-[0.15em] font-extrabold text-amber-700/70 dark:text-islamic-gold/60">
                                                                            {t(`revelation.${surah.revelationPlace}`)}
                                                                        </span>
                                                                        <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                                                                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                                                            {t('ayahCount', { count: surah.ayahCount })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); toggleSurahBookmark(e, surah); }}
                                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Saved Verses */}
                                {filteredVerseBookmarks.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-amber-700/70 dark:text-islamic-gold/60 uppercase tracking-widest mb-3 px-1">
                                            <Bookmark className="w-4 h-4 inline-block mr-2" />
                                            {t('savedVerses', { defaultValue: 'Kaydedilen Ayetler' })}
                                        </h3>
                                        {filteredVerseBookmarks.map((bookmark, index) => (
                                            <motion.div
                                                key={bookmark.verseKey}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                                            >
                                                <div className="relative mb-6">
                                                    <Card className="border-none shadow-xl rounded-[2.5rem] bg-[#FFFDF6] dark:bg-white/5 overflow-hidden p-6 relative dark:text-white">
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
                                        ))}
                                    </div>
                                )}
                            </>
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

                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-[#EDE5D1] dark:border-white/10 pt-4">
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
                <div className="fixed bottom-20 left-0 right-0 p-4 bg-[#FFFDF6] dark:bg-[#032e18] border-t border-[#EDE5D1] dark:border-white/10 backdrop-blur-xl z-40">
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

        </div>
    );
}
