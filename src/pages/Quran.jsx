import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BookOpen, Search, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
    ChevronDown, ChevronUp, Bookmark, BookmarkCheck, Share2, X, Loader2, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { fetchChapters } from '@/services/quranApi';
import { safeGetStorage, safeSetStorage } from '@/utils/storageHelper';
import { getSurahSummary } from '@/data/surahSummaries';

const BOOKMARKS_KEY = 'quran_bookmarks';

export default function Quran() {
    const navigate = useNavigate();
    const { selection, success } = useHaptics();

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

    // Remove bookmark
    const removeBookmark = (verseKey) => {
        selection();
        setBookmarks(prev => {
            const updated = prev.filter(b => b.verseKey !== verseKey);
            safeSetStorage(BOOKMARKS_KEY, updated);
            return updated;
        });
    };

    // Fetch all 114 surahs on mount
    useEffect(() => {
        const loadSurahs = async () => {
            try {
                setIsLoadingSurahs(true);
                setSurahError(null);
                const chapters = await fetchChapters('tr');
                // Map to UI format
                setSurahs(chapters.map(ch => ({
                    id: ch.id,
                    name: ch.nameTurkish || ch.name,
                    arabic: ch.nameArabic,
                    ayahCount: ch.ayahCount,
                    revelation: ch.revelation
                })));
            } catch (err) {
                console.error('Failed to fetch surahs:', err);
                setSurahError('Sureler yüklenemedi. İnternet bağlantınızı kontrol edin.');
            } finally {
                setIsLoadingSurahs(false);
            }
        };
        loadSurahs();
    }, []);

    const filteredSurahs = surahs.filter(surah =>
        surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surah.arabic.includes(searchQuery)
    );

    const handleSurahSelect = (surah) => {
        selection();
        navigate(`/quran/${surah.id}`);
    };


    const togglePlay = () => {
        selection();
        setIsPlaying(!isPlaying);
        // TODO: Implement audio playback with API URL
    };

    const toggleMute = () => {
        selection();
        setIsMuted(!isMuted);
    };

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
                                {selectedSurah ? selectedSurah.name : 'Kur\'an-ı Kerim'}
                            </h1>
                            {selectedSurah && (
                                <p className="text-xs text-white/70 font-medium">
                                    {selectedSurah.ayahCount} Ayet • {selectedSurah.revelation}
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
                            placeholder="Sure ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-islamic-gold backdrop-blur-sm"
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
                            Sureler
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
                            Kaydettiklerim
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
                                <p className="text-sm text-gray-400">Kur'an yükleniyor...</p>
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
                                    Tekrar Dene
                                </Button>
                            </div>
                        )}

                        {/* Surah Cards */}
                        {!isLoadingSurahs && !surahError && filteredSurahs.map((surah, index) => {
                            const summaryData = getSurahSummary(surah.id);
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
                                            {/* Number Box - Reverted to Rounded Square */}
                                            <div className="w-12 h-12 rounded-2xl bg-islamic-green/10 dark:bg-islamic-gold/10 flex items-center justify-center text-islamic-green dark:text-islamic-gold font-bold text-lg shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                {surah.id}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif tracking-tight">
                                                        {surah.name}
                                                    </h3>
                                                    <span className="font-arabic text-2xl text-islamic-gold group-hover:scale-110 transition-transform duration-300">
                                                        {surah.arabic}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="text-[10px] uppercase tracking-[0.15em] font-extrabold text-islamic-green/60 dark:text-islamic-gold/60">
                                                        {surah.revelation}
                                                    </span>
                                                    <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                                                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                                        {surah.ayahCount} Ayet
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
                                <p className="text-gray-400">Sure bulunamadı</p>
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
                                    <h3 className="text-lg font-bold text-white mb-1">Henüz kayıt yok</h3>
                                    <p className="text-sm text-gray-400">
                                        Ayetleri okurken kaydet butonuna basarak buraya ekleyebilirsiniz.
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
                                    <Card className="glass-panel border-none overflow-hidden">
                                        <CardContent className="p-4 space-y-3">
                                            {/* Header */}
                                            <div className="flex items-center justify-between">
                                                <button
                                                    onClick={() => {
                                                        selection();
                                                        navigate(`/quran/${bookmark.surahId}`);
                                                    }}
                                                    className="flex items-center gap-2 text-islamic-gold hover:underline"
                                                >
                                                    <BookmarkCheck className="w-4 h-4" />
                                                    <span className="text-sm font-medium">
                                                        {bookmark.surahName} • Ayet {bookmark.verseNumber}
                                                    </span>
                                                </button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeBookmark(bookmark.verseKey)}
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            {/* Arabic */}
                                            <p className="text-xl leading-loose text-right font-arabic text-islamic-gold">
                                                {bookmark.arabic}
                                            </p>

                                            {/* Translation */}
                                            <p
                                                className="text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-3"
                                                dangerouslySetInnerHTML={{ __html: bookmark.translation }}
                                            />
                                        </CardContent>
                                    </Card>
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
                                    Ses: [API'den kari seçimi gelecek]
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
