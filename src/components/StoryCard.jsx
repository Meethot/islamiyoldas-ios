import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, BookOpen, Clock, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export default function StoryCard({ story, onClick }) {
    const { t, i18n } = useTranslation('stories');
    // Deterministic Pseudo-Random Number Generator (PRNG)
    const getSyncedListenerCount = (id) => {
        // Time bucket: Changes every 30 seconds
        const timeBucket = Math.floor(Date.now() / 30000);

        // Generate a numeric seed from story ID (string or number)
        let idVal = 0;
        const idStr = String(id);
        for (let i = 0; i < idStr.length; i++) {
            idVal = ((idVal << 5) - idVal) + idStr.charCodeAt(i);
            idVal |= 0;
        }

        // Combine ID + Time Bucket
        const seed = Math.abs(idVal) + timeBucket;

        // Simple deterministic random using sin wave
        const x = Math.sin(seed) * 10000;
        const random0to1 = x - Math.floor(x);

        // Map to range [890, 2300]
        return Math.floor(890 + (random0to1 * (2300 - 890)));
    };

    const [listenerCount, setListenerCount] = useState(() => getSyncedListenerCount(story.id));

    useEffect(() => {
        // Align update with next 30s boundary
        const now = Date.now();
        const msUntilNext30s = 30000 - (now % 30000);

        const updateCount = () => {
            setListenerCount(getSyncedListenerCount(story.id));
        };

        // First timeout to align with global 30s bucket
        const timeout = setTimeout(() => {
            updateCount();
            // Then sync interval
            const interval = setInterval(updateCount, 30000);
            return () => clearInterval(interval);
        }, msUntilNext30s);

        return () => clearTimeout(timeout);
    }, [story.id]);

    const baseLang = (i18n.language || 'en').split('-')[0];
    const locale = baseLang === 'ar' ? 'ar-SA' : baseLang === 'de' ? 'de-DE' : baseLang === 'ru' ? 'ru-RU' : baseLang === 'tr' ? 'tr-TR' : 'en-US';
    const formattedCount = new Intl.NumberFormat(locale).format(listenerCount);

    return (
        <Card
            className="group overflow-hidden border-none shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] rounded-[2rem] bg-[#FFFDF6] dark:bg-white/5 cursor-pointer hover:shadow-xl transition-all duration-300"
            onClick={onClick}
        >
            <div className="flex">
                <div className="flex-1 p-6 pr-2">
                    <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white group-hover:text-islamic-green dark:group-hover:text-islamic-gold transition-colors mb-2">
                        {story.title}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed italic mb-4">
                        {story.content.substring(0, 80)}...
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-300">
                            <Clock className="w-3 h-3" /> {story.duration}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-islamic-green dark:text-islamic-gold">
                            <BookOpen className="w-3 h-3" /> {t('read')}
                        </div>
                        {/* Live Listener Indicator */}
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-500 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-400/10 px-2 py-0.5 rounded-full ring-1 ring-amber-500/20">
                            <Headphones className="w-3 h-3 animate-pulse" />
                            <span>{t('listenersCount', { count: formattedCount })}</span>
                        </div>
                    </div>
                </div>
                <div className="w-20 bg-islamic-green/5 dark:bg-islamic-gold/10 flex items-center justify-center group-hover:bg-islamic-gold/10 dark:group-hover:bg-islamic-gold/20 transition-colors">
                    <Button
                        className="w-12 h-12 rounded-full bg-islamic-green dark:bg-islamic-gold hover:opacity-90 text-white dark:text-[#032e18] shadow-lg transition-transform group-hover:scale-110"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick();
                        }}
                    >
                        <Play className="w-5 h-5 fill-current" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}
