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
import { turkifyTransliteration } from '@/utils/textFormatter';
import { safeGetStorage, safeSetStorage } from '@/utils/storageHelper';
import ShareCard, { SHARE_THEMES } from '@/components/ShareCard';
import { shareHiddenElement } from '@/lib/share';

import { useTranslation } from 'react-i18next';

const BOOKMARKS_KEY = 'quran_bookmarks';

export default function SurahDetail() {
    const { surahId } = useParams();
    const navigate = useNavigate();
    const { selection, success } = useHaptics();
    const { t, i18n } = useTranslation();

    // State
    const [surahInfo, setSurahInfo] = useState(null);
    const [verses, setVerses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);
    const [bookmarks, setBookmarks] = useState(() => safeGetStorage(BOOKMARKS_KEY, []));

    // Share State
    const [shareModalData, setShareModalData] = useState(null);
    const [activeTheme, setActiveTheme] = useState(SHARE_THEMES.emerald);
    const [sharing, setSharing] = useState(false);

    const handleShareClick = (verse) => {
        selection();
        setShareModalData({
            type: 'verse',
            arabic: verse.arabic,
            translation: verse.translation,
            surah: surahInfo?.name || `Sure ${surahId}`,
            verseNumber: verse.verseNumber
        });
        setActiveTheme(SHARE_THEMES.emerald);
    };

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

    // Check if a verse is bookmarked
    const isBookmarked = (verseKey) => bookmarks.some(b => b.verseKey === verseKey);

    // Toggle bookmark
    const toggleBookmark = (verse) => {
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
    };

    // Fetch surah data
    const loadSurah = useCallback(async (page = 1, append = false) => {
        try {
            if (page === 1) {
                setLoading(true);
                setError(null);
            } else {
                setLoadingMore(true);
            }

            const currentLang = i18n.language?.split('-')[0] || 'tr';

            // Fetch chapter info and verses in parallel
            const [info, content] = await Promise.all([
                page === 1 ? fetchChapterInfo(surahId, currentLang) : Promise.resolve(surahInfo),
                fetchSurahContent(surahId, page, currentLang)
            ]);

            if (page === 1) {
                setSurahInfo(info);
                setVerses(content.verses);
            } else {
                setVerses(prev => [...prev, ...content.verses]);
            }
            setPagination(content.pagination);
            success?.();
        } catch (err) {
            console.error('Quran API Error:', err);
            setError(err.message || 'Bir hata oluştu');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [surahId, surahInfo, success]);

    useEffect(() => {
        loadSurah(1);
    }, [surahId]);

    // Scroll to top when surah changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [surahId]);

    const loadMore = () => {
        if (pagination?.next_page && !loadingMore) {
            loadSurah(pagination.next_page, true);
        }
    };

    const retry = () => {
        loadSurah(1);
    };

    // Loading State
    if (loading) {
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
                                {error}
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
                        <motion.div
                            key={verse.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.05, 0.5) }}
                        >
                            <Card className="glass-panel border-none overflow-hidden">
                                <CardContent className="p-5 space-y-4">
                                    {/* Verse Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="w-10 h-10 rounded-full bg-islamic-gold/10 flex items-center justify-center">
                                            <span className="text-islamic-gold font-bold text-sm">
                                                {verse.verseNumber}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleBookmark(verse)}
                                                className={cn(
                                                    "transition-colors",
                                                    isBookmarked(verse.verseKey)
                                                        ? "text-islamic-gold"
                                                        : "text-gray-400 hover:text-islamic-gold"
                                                )}
                                            >
                                                {isBookmarked(verse.verseKey)
                                                    ? <BookmarkCheck className="w-4 h-4 fill-current" />
                                                    : <Bookmark className="w-4 h-4" />
                                                }
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleShareClick(verse)}
                                                className="text-gray-400 hover:text-islamic-gold"
                                            >
                                                <Share2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Arabic Text */}
                                    <p className="text-2xl leading-[2.5] text-right font-arabic text-islamic-gold">
                                        {verse.arabic}
                                    </p>

                                    {/* Translation (Meal) */}
                                    <div className="border-t border-gray-100 dark:border-white/10 pt-4">
                                        <p
                                            className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: verse.translation }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Load More Button */}
                {pagination?.next_page && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-4"
                    >
                        <Button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="w-full bg-islamic-gold/10 text-islamic-gold hover:bg-islamic-gold/20 border border-islamic-gold/20"
                        >
                            {loadingMore ? (
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
                {!pagination?.next_page && verses.length > 0 && (
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
