import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Play, BookOpen, Clock, Headphones, Heart, Sparkles, Crown, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStoryImage } from '@/lib/storyImages';

const FALLBACK_ICONS = {
    prophets: BookOpen,
    companions: Heart,
    moral: Sparkles,
};

export default function StoryCard({ story, onClick, category = 'prophets', locked = false }) {
    const { t, i18n } = useTranslation('stories');
    const imageSrc = useStoryImage(story);
    const FallbackIcon = FALLBACK_ICONS[category] || BookOpen;
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
            className="group overflow-hidden border-none shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] rounded-[1.75rem] bg-[#FFFDF6] dark:bg-white/5 cursor-pointer hover:shadow-xl active:scale-[0.985] transition-all duration-300"
            onClick={onClick}
        >
            <div className="flex items-center gap-4 p-3">
                {/* Kapak görseli + play */}
                <div className="relative w-[88px] h-[88px] shrink-0 rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            alt={story.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-islamic-green/15 to-islamic-gold/25 dark:from-islamic-gold/15 dark:to-islamic-green/40 flex items-center justify-center">
                            <FallbackIcon className="w-7 h-7 text-islamic-green dark:text-islamic-gold opacity-60" />
                        </div>
                    )}
                    {locked && (
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-r from-islamic-gold to-amber-600 text-white text-[9px] font-bold tracking-wider py-1 pointer-events-none">
                            <Crown size={9} fill="white" /> PREMIUM
                        </div>
                    )}
                </div>

                {/* Metin */}
                <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-start gap-2">
                        <h3 className="flex-1 min-w-0 text-[17px] font-serif font-bold text-gray-900 dark:text-white group-hover:text-islamic-green dark:group-hover:text-islamic-gold transition-colors leading-snug line-clamp-2">
                            {story.title}
                        </h3>
                        <span className="shrink-0 w-9 h-9 rounded-full bg-islamic-green dark:bg-islamic-gold flex items-center justify-center shadow-md shadow-islamic-green/25 dark:shadow-islamic-gold/25 transition-transform duration-200 group-hover:scale-110 group-active:scale-95 pointer-events-none">
                            {locked
                                ? <Lock className="w-4 h-4 text-white dark:text-[#032e18]" />
                                : <Play className="w-4 h-4 ml-0.5 fill-white text-white dark:fill-[#032e18] dark:text-[#032e18]" />}
                        </span>
                    </div>
                    <p className="text-[13px] text-gray-400 line-clamp-1 leading-snug italic mt-1 mb-2">
                        {story.content.substring(0, 80)}...
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                            <Clock className="w-3 h-3" /> {story.duration}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-islamic-green dark:text-islamic-gold">
                            <BookOpen className="w-3 h-3" /> {t('read')}
                        </div>
                        {/* Live Listener Indicator */}
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-400/10 px-2 py-0.5 rounded-full ring-1 ring-amber-500/20">
                            <Headphones className="w-3 h-3 animate-pulse" />
                            <span>{t('listenersCount', { count: formattedCount })}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
