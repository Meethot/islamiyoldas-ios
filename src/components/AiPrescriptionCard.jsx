import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Play, Pause, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getVerifiedVerse } from '@/services/VerseLookupService';
import { ALL_ESMA } from '@/data/esmaData';
import { useTranslation } from 'react-i18next';

// Normalize Turkish/Arabic text for fuzzy matching
function normalize(str) {
    return str
        .toLowerCase()
        .replace(/[''`ʼ]/g, '')
        .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
        .replace(/ô/g, 'o').replace(/ê/g, 'e')
        .replace(/ğ/g, 'g').replace(/ş/g, 's').replace(/ç/g, 'c')
        .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ı/g, 'i')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim();
}

function findEsmaMatch(aiName) {
    const normalized = normalize(aiName);
    let match = ALL_ESMA.find(e => normalize(e.name) === normalized);
    if (match) return match;

    match = ALL_ESMA.find(e => {
        const eName = normalize(e.name);
        const stripped = eName.replace(/^(el-|er-|es-|ez-|ed-|en-|et-|ey-|eş-)/, '');
        const aiStripped = normalized.replace(/^(el-|er-|es-|ez-|ed-|en-|et-|ey-|eş-|ya\s+)/, '');
        return stripped === aiStripped || eName.includes(aiStripped) || aiStripped.includes(stripped);
    });
    return match || null;
}

// Fetch audio URL from Alquran.cloud (Mishary Rashid Alafasy)
async function fetchVerseAudio(surah, verse) {
    try {
        const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${verse}/ar.alafasy`);
        if (!res.ok) return null;
        const json = await res.json();
        return json.data?.audio || null;
    } catch {
        return null;
    }
}

export default function AiPrescriptionCard({ data }) {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('misc');
    const lang = i18n.language;
    const [verseData, setVerseData] = useState(null);
    const [loadingVerse, setLoadingVerse] = useState(true);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);
    const audioRef = useRef(null);

    const { advice, recommendedZikr, quranRef } = data;

    // Enrich AI recommendation with local esma data
    const enrichedZikr = useMemo(() => {
        if (!recommendedZikr) return null;
        const esmaMatch = findEsmaMatch(recommendedZikr.name);
        if (esmaMatch) {
            return {
                name: esmaMatch.name,
                arabic: esmaMatch.calligraphy,
                meaning: esmaMatch[`virtue_${lang}`] || esmaMatch.virtue_en || esmaMatch.virtue || recommendedZikr.meaning,
                count: esmaMatch.ebced,
                ebced: esmaMatch.ebced,
                isEsma: true
            };
        }
        return {
            name: recommendedZikr.name,
            arabic: recommendedZikr.arabic || '',
            meaning: recommendedZikr.meaning,
            count: recommendedZikr.count || 33,
            ebced: null,
            isEsma: false
        };
    }, [recommendedZikr]);

    // Fetch verse text + audio on mount
    useEffect(() => {
        async function load() {
            if (quranRef) {
                const [v, audio] = await Promise.all([
                    getVerifiedVerse(quranRef, i18n.language),
                    fetchVerseAudio(quranRef.surah, quranRef.verse)
                ]);
                setVerseData(v);
                setAudioUrl(audio);
            }
            setLoadingVerse(false);
        }
        load();
    }, [quranRef]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const toggleAudio = useCallback(() => {
        if (!audioUrl) return;

        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        setAudioLoading(true);

        if (!audioRef.current) {
            audioRef.current = new Audio(audioUrl);
            audioRef.current.addEventListener('ended', () => setIsPlaying(false));
            audioRef.current.addEventListener('canplaythrough', () => setAudioLoading(false));
            audioRef.current.addEventListener('error', () => {
                setAudioLoading(false);
                setIsPlaying(false);
            });
        }

        audioRef.current.currentTime = 0;
        audioRef.current.play()
            .then(() => {
                setIsPlaying(true);
                setAudioLoading(false);
            })
            .catch(() => {
                setAudioLoading(false);
            });
    }, [audioUrl, isPlaying]);

    const handleStartDhikr = () => {
        // Pause audio before navigating
        if (audioRef.current) audioRef.current.pause();
        navigate('/dhikr', {
            state: {
                mode: 'countdown',
                targetZikirName: enrichedZikr.name,
                targetCount: enrichedZikr.count,
                zikirArabic: enrichedZikr.arabic,
                zikirMeaning: enrichedZikr.meaning
            }
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm mx-auto mt-4 mb-2"
        >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#032e18] to-[#0a4a2e] border border-islamic-gold/20 shadow-xl">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-islamic-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="p-6 space-y-5 relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                        <Sparkles className="w-5 h-5 text-islamic-gold" />
                        <h3 className="text-islamic-gold font-serif font-bold text-lg tracking-wide">
                            {t('prescription.title')}
                        </h3>
                    </div>

                    {/* 1. Tavsiye Metni */}
                    <div className="space-y-1">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{t('prescription.adviceLabel')}</p>
                        <p className="text-white text-sm leading-relaxed">
                            {advice}
                        </p>
                    </div>

                    {/* 2. Zikir Reçetesi */}
                    {enrichedZikr && (
                        <div className="bg-islamic-gold/10 rounded-2xl p-4 border border-islamic-gold/20">
                            <p className="text-[10px] text-islamic-gold/60 uppercase tracking-widest font-bold mb-3">📿 {t('prescription.dhikrLabel')}</p>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    {enrichedZikr.arabic && (
                                        <p className="text-islamic-gold font-serif text-xl mb-1" dir="rtl">{enrichedZikr.arabic}</p>
                                    )}
                                    <p className="text-white font-bold text-base">{enrichedZikr.name}</p>
                                    <p className="text-xs text-white/60">{enrichedZikr.meaning}</p>
                                </div>
                                <div className="bg-islamic-gold text-[#032e18] px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap">
                                    {enrichedZikr.count} {enrichedZikr.isEsma ? t('prescription.ebced') : t('prescription.count')}
                                </div>
                            </div>

                            <Button
                                onClick={handleStartDhikr}
                                className="w-full bg-islamic-gold hover:bg-amber-400 text-[#032e18] font-bold rounded-xl h-10 gap-2"
                            >
                                📿 {t('prescription.startDhikr')}
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* 3. Şifa Ayeti (Audio Verse) */}
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] text-emerald-400/60 uppercase tracking-widest font-bold mb-3">📖 {t('prescription.verseLabel')}</p>

                        {loadingVerse ? (
                            <div className="h-20 animate-pulse bg-white/5 rounded-xl" />
                        ) : (
                            <>
                                <p className="text-right font-arabic text-xl text-islamic-gold/90 leading-loose mb-3">
                                    {verseData?.arabic}
                                </p>
                                <p className="text-gray-300 text-sm italic leading-relaxed mb-2">
                                    "{verseData?.translation}"
                                </p>

                                <div className="flex items-center justify-between mt-3">
                                    <p className="text-islamic-gold/50 text-xs font-bold uppercase tracking-wider">
                                        {verseData?.source}
                                    </p>

                                    {audioUrl && (
                                        <button
                                            onClick={toggleAudio}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${isPlaying
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-islamic-gold/10 text-islamic-gold border border-islamic-gold/30 hover:bg-islamic-gold/20'
                                                }`}
                                        >
                                            {audioLoading ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : isPlaying ? (
                                                <Pause className="w-3.5 h-3.5" />
                                            ) : (
                                                <Volume2 className="w-3.5 h-3.5" />
                                            )}
                                            {isPlaying ? t('prescription.pause') : t('prescription.listen')}
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
