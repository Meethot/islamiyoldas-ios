import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const STORAGE_KEY = 'review_prompt';
const APP_STORE_ID = '6745498032';
const SHOW_AFTER_OPENS = 3;
const MAX_PER_DAY = 2;

const todayStr = () => new Date().toISOString().slice(0, 10);

const getReviewData = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { opens: 0, reviewed: false, shownToday: 0, lastShownDate: null };
    } catch {
        return { opens: 0, reviewed: false, shownToday: 0, lastShownDate: null };
    }
};

const saveReviewData = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

export default function ReviewPrompt() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const data = getReviewData();
        data.opens = (data.opens || 0) + 1;

        if (data.reviewed) { saveReviewData(data); return; }

        const today = todayStr();
        if (data.lastShownDate !== today) {
            data.shownToday = 0;
            data.lastShownDate = today;
        }

        if (data.opens >= SHOW_AFTER_OPENS && data.shownToday < MAX_PER_DAY) {
            data.shownToday += 1;
            saveReviewData(data);
            const timer = setTimeout(() => setShow(true), 2500);
            return () => clearTimeout(timer);
        }

        saveReviewData(data);
    }, []);

    const handleRate = () => {
        const data = getReviewData();
        data.reviewed = true;
        saveReviewData(data);
        setShow(false);

        if (Capacitor.isNativePlatform()) {
            const platform = Capacitor.getPlatform();
            if (platform === 'ios') {
                window.open(`https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`, '_blank');
            } else if (platform === 'android') {
                window.open(`market://details?id=com.islamic.app`, '_blank');
            }
        }
    };

    const handleDismiss = () => {
        setShow(false);
    };

    const handleRemindLater = () => {
        setShow(false);
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center px-6"
                    onClick={handleDismiss}
                >
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.85, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 350 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-sm rounded-[2rem] overflow-hidden"
                        style={{
                            background: 'linear-gradient(180deg, #1a3a25 0%, #0d2518 50%, #091a10 100%)',
                            border: '1px solid rgba(212,175,55,0.15)',
                            boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>

                        {/* Top Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-20"
                            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.5) 0%, transparent 70%)' }} />

                        <div className="relative p-7 pt-8 text-center">
                            {/* Stars */}
                            <div className="flex items-center justify-center gap-1 mb-5">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0, rotate: -30 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.3 + i * 0.1, type: 'spring', damping: 12 }}
                                    >
                                        <Star
                                            size={28}
                                            className="text-islamic-gold"
                                            fill="currentColor"
                                            style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.4))' }}
                                        />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Title */}
                            <h2 className="text-xl font-serif font-bold text-white mb-2 tracking-wide">
                                İslami Yoldaş'ı Beğendiniz mi?
                            </h2>

                            {/* Ad-Free Badge */}
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/15 mb-4">
                                <Heart size={12} className="text-emerald-400" fill="currentColor" />
                                <span className="text-[11px] font-bold text-emerald-400/90">%100 Reklamsız Deneyim</span>
                            </div>

                            {/* Description */}
                            <p className="text-[13px] text-white/45 leading-relaxed mb-6">
                                Size en iyi deneyimi sunmak için reklam koymadan,
                                tamamen <span className="text-white/70 font-semibold">ücretsiz</span> bir uygulama geliştirdik.
                                Bizi desteklemek için değerlendirmeniz çok önemli! 🤲
                            </p>

                            {/* Rate Button */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleRate}
                                className="w-full py-3.5 rounded-2xl font-bold text-[15px] mb-3 cursor-pointer transition-all"
                                style={{
                                    background: 'linear-gradient(135deg, #b8860b 0%, #D4AF37 50%, #e8c547 100%)',
                                    boxShadow: '0 4px 20px rgba(212,175,55,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                                    color: '#1a1a0a',
                                }}
                            >
                                ⭐ Değerlendir
                            </motion.button>

                            {/* Remind Later */}
                            <button
                                onClick={handleRemindLater}
                                className="w-full py-3 rounded-2xl text-white/30 text-[13px] font-medium hover:text-white/50 transition-colors cursor-pointer"
                            >
                                Daha Sonra Hatırlat
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
