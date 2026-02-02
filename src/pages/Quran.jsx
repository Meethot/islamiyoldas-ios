import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BookOpen, Search, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
    ChevronDown, ChevronUp, Bookmark, Share2, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';

export default function Quran() {
    const navigate = useNavigate();
    const { selection, success } = useHaptics();

    // State
    const [selectedSurah, setSelectedSurah] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentAyah, setCurrentAyah] = useState(1);
    const [showSurahList, setShowSurahList] = useState(true);

    // TODO: Replace with API data
    const PLACEHOLDER_SURAHS = [
        { id: 1, name: 'Fatiha', arabic: 'الفَاتِحَة', ayahCount: 7, revelation: 'Mekke' },
        { id: 2, name: 'Bakara', arabic: 'البَقَرَة', ayahCount: 286, revelation: 'Medine' },
        { id: 3, name: 'Al-i İmran', arabic: 'آلِ عِمۡرَان', ayahCount: 200, revelation: 'Medine' },
        { id: 4, name: 'Nisa', arabic: 'النِّسَاء', ayahCount: 176, revelation: 'Medine' },
        { id: 5, name: 'Maide', arabic: 'المَائِدَة', ayahCount: 120, revelation: 'Medine' },
    ];

    const PLACEHOLDER_AYAHS = selectedSurah ? Array.from({ length: 7 }, (_, i) => ({
        number: i + 1,
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        translation: '[API\'den Türkçe meal gelecek]',
        audio: null // API'den ses URL'i gelecek
    })) : [];

    const filteredSurahs = PLACEHOLDER_SURAHS.filter(surah =>
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
                {showSurahList && (
                    <div className="relative">
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
            </div>

            {/* Surah List */}
            <AnimatePresence>
                {showSurahList && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-5 space-y-2"
                    >
                        {filteredSurahs.map((surah, index) => (
                            <motion.div
                                key={surah.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card
                                    onClick={() => handleSurahSelect(surah)}
                                    className="glass-panel border-none cursor-pointer hover:shadow-lg transition-all active:scale-98"
                                >
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-islamic-gold/10 flex items-center justify-center">
                                                <span className="text-islamic-gold font-bold text-lg">{surah.id}</span>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-gray-900 dark:text-white">{surah.name}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {surah.ayahCount} Ayet • {surah.revelation}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-2xl font-arabic text-islamic-green dark:text-islamic-gold">
                                            {surah.arabic}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                        {filteredSurahs.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-400">Sure bulunamadı</p>
                            </div>
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
                            <p className="text-3xl font-arabic text-islamic-green dark:text-islamic-gold">
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

                                <p className="text-2xl leading-loose text-right font-arabic text-gray-900 dark:text-white">
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
