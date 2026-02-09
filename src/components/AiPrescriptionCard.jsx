import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Quote, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getVerifiedVerse } from '@/services/VerseLookupService';

export default function AiPrescriptionCard({ data }) {
    const navigate = useNavigate();
    const [verseData, setVerseData] = useState(null);
    const [loadingVerse, setLoadingVerse] = useState(true);

    // Unpack AI Data
    const { advice, recommendedZikr, quranRef } = data;

    // Fetch Verse on Mount
    useEffect(() => {
        async function load() {
            if (quranRef) {
                const v = await getVerifiedVerse(quranRef);
                setVerseData(v);
            }
            setLoadingVerse(false);
        }
        load();
    }, [quranRef]);

    const handleStartDhikr = () => {
        // Navigate to Dhikr page with state
        navigate('/dhikr', {
            state: {
                autoStart: true,
                zikirName: recommendedZikr.name,
                zikirTarget: recommendedZikr.count,
                zikirMeaning: recommendedZikr.meaning
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

                <div className="p-6 space-y-5 relative z-10">
                    {/* Header: Reçete Başlığı */}
                    <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                        <Sparkles className="w-5 h-5 text-islamic-gold" />
                        <h3 className="text-islamic-gold font-serif font-bold text-lg tracking-wide">
                            Manevi Reçete
                        </h3>
                    </div>

                    {/* 1. Ayet Bölümü */}
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        {loadingVerse ? (
                            <div className="h-16 animate-pulse bg-white/5 rounded-xl" />
                        ) : (
                            <>
                                <p className="text-right font-arabic text-xl text-white/90 leading-loose mb-3">
                                    {verseData?.arabic}
                                </p>
                                <p className="text-gray-300 text-sm italic leading-relaxed">
                                    "{verseData?.translation}"
                                </p>
                                <p className="text-islamic-gold/60 text-xs font-bold mt-2 text-right uppercase tracking-wider">
                                    {verseData?.source}
                                </p>
                            </>
                        )}
                    </div>

                    {/* 2. Tavsiye Metni */}
                    <div className="space-y-1">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Hekim Tavsiyesi</p>
                        <p className="text-white text-sm leading-relaxed">
                            {advice}
                        </p>
                    </div>

                    {/* 3. Zikir Aksiyonu */}
                    {recommendedZikr && (
                        <div className="bg-islamic-gold/10 rounded-2xl p-4 border border-islamic-gold/20">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-islamic-gold font-bold text-lg">{recommendedZikr.name}</p>
                                    <p className="text-xs text-white/60">{recommendedZikr.meaning}</p>
                                </div>
                                <div className="bg-islamic-gold text-[#032e18] px-2 py-1 rounded-lg text-xs font-bold">
                                    {recommendedZikr.count} Adet
                                </div>
                            </div>

                            <Button
                                onClick={handleStartDhikr}
                                className="w-full bg-islamic-gold hover:bg-amber-400 text-[#032e18] font-bold rounded-xl h-10 gap-2"
                            >
                                📿 Zikre Başla
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
