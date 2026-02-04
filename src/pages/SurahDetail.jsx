import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BookOpen, ArrowLeft, Bookmark, BookmarkCheck, Share2, RefreshCw, WifiOff,
    Loader2, ChevronDown, ChevronRight, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { fetchSurahContent, fetchChapterInfo } from '@/services/quranApi';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { safeGetStorage, safeSetStorage } from '@/utils/storageHelper';
import ShareCard, { SHARE_THEMES } from '@/components/ShareCard';
import { shareHiddenElement } from '@/lib/share';

import { useTranslation } from 'react-i18next';

const BOOKMARKS_KEY = 'quran_bookmarks';

// Memoized individual verse to prevent list re-renders
const VerseItem = React.memo(({ verse, index, isBookmarked, toggleBookmark, handleShareClick, t }) => {
    return (
        <motion.div
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

    // Share State
    const [shareModalData, setShareModalData] = useState(null);
    const [activeTheme, setActiveTheme] = useState(SHARE_THEMES.emerald);
    const [sharing, setSharing] = useState(false);

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
            surah: surahInfo?.name || `Sure ${surahId}`,
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
                `"${shareModalData.translation}"\n\n${surahInfo?.name || 'Kuran-ı Kerim'} ${shareModalData.verseNumber}. Ayet - İslami Yoldaş 🤲`,
                'Ayet Paylaş'
            );
            setShareModalData(null);
        } catch (e) {
            console.error(e);
        } finally {
            setSharing(false);
        }
    };

    // Scroll to top when surah changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [surahId]);

    const loadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const isBookmarked = (verseKey) => bookmarks.some(b => b.verseKey === verseKey);

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
                    <p className="text-gray-500 dark:text-gray-400">Ayetler yükleniyor...</p>
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
                                {t('quran.connection_error', 'Bağlantı Hatası')}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400">
                                {error.message || 'Bir hata oluştu'}
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={() => navigate('/quran')}
                                variant="outline"
                                className="border-gray-200 dark:border-white/10"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {t('quran.back', 'Geri')}
                            </Button>
                            <Button
                                onClick={retry}
                                className="bg-islamic-green hover:bg-islamic-green/90"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {t('quran.retry', 'Tekrar Dene')}
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
            <div className="bg-islamic-green dark:bg-[#032e18] p-5 sticky top-0 z-40 border-b border-white/10">
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
                                    {surahInfo?.ayahCount} Ayet • {surahInfo?.revelation}
                                </p>
                            </div>
                        </div>
                    </div>
                    <p className="text-2xl font-arabic text-islamic-gold">
                        {surahInfo?.nameArabic}
                    </p>
                </div>
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
                            index={index}
                            isBookmarked={isBookmarked(verse.verseKey)}
                            toggleBookmark={toggleBookmark}
                            handleShareClick={handleShareClick}
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
                                    {t('quran.loading', 'Yükleniyor...')}
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
                                    Ayet Paylaş
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
                                        Hazırlanıyor...
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-5 h-5 mr-2" />
                                        Paylaş
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden Share Card */}
            {shareModalData && (
                <ShareCard
                    theme={activeTheme.id}
                    data={shareModalData}
                />
            )}
        </div>
    );
}
