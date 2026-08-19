import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { splitWords, wordIndexAt } from '@/lib/storyTimings';

// Kullanıcı elle kaydırdıysa otomatik kaydırma bir süre sussun
const USER_SCROLL_QUIET_MS = 6000;
// Vurguyu bir tık önden ver — göz kelimeyi sesten hemen önce görünce eşzamanlı hissediliyor
const LEAD_MS = 120;

// Metni paragraf → kelime olarak böler, kelimelere global indeks verir.
// Sıra scripts/hikaye-zamanlama.mjs çıktısıyla birebir aynı olmalı.
const buildParagraphs = (content) => {
    const result = [];
    let cursor = 0;
    for (const block of (content || '').split(/\n{2,}/)) {
        if (!block.trim()) continue;
        const words = splitWords(block);
        result.push({ words, start: cursor, end: cursor + words.length - 1 });
        cursor += words.length;
    }
    return result;
};

// Sadece okunan kelimeyi içeren paragraf yeniden render olur.
const Paragraph = React.memo(function Paragraph({ words, phase, localActive, isFirst, shouldScroll }) {
    const activeRef = useRef(null);
    const lastScrolled = useRef(-1);

    useEffect(() => {
        if (!shouldScroll || localActive < 0) return;
        const el = activeRef.current;
        if (!el) return;
        // Aynı satırda ilerlerken her kelimede kaydırma; sadece ekrandan çıkarken
        const rect = el.getBoundingClientRect();
        const viewport = window.innerHeight || 0;
        if (rect.top < viewport * 0.18 || rect.bottom > viewport * 0.72) {
            if (lastScrolled.current !== localActive) {
                lastScrolled.current = localActive;
                el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        }
    }, [localActive, shouldScroll]);

    return (
        <p
            // İlk paragraf kelime-takibi ipucunun hedefi (makalenin tamamı halkaya sığmazdı)
            data-tour={isFirst ? 'story-text' : undefined}
            className={cn(
                'whitespace-pre-wrap',
                isFirst && 'first-letter:text-4xl first-letter:font-bold first-letter:text-islamic-green dark:first-letter:text-islamic-gold first-letter:mr-2 first-letter:float-left'
            )}>
            {words.map((word, i) => {
                const state = phase === 'before' ? 'past'
                    : phase === 'after' ? 'future'
                        : i < localActive ? 'past'
                            : i === localActive ? 'active' : 'future';
                return (
                    <React.Fragment key={i}>
                        <span
                            ref={state === 'active' ? activeRef : null}
                            className={cn(
                                'transition-colors duration-300 ease-out motion-reduce:transition-none',
                                state === 'past' && 'text-gray-800 dark:text-white/90',
                                state === 'active' && 'text-amber-700 dark:text-islamic-gold',
                                state === 'future' && 'text-gray-400/80 dark:text-white/35'
                            )}
                        >
                            {word}
                        </span>
                        {i < words.length - 1 ? ' ' : ''}
                    </React.Fragment>
                );
            })}
        </p>
    );
});

export default function StoryKaraokeText({ content, timings, audioRef, isPlaying }) {
    const [activeIndex, setActiveIndex] = useState(-1);
    const lastUserScrollRef = useRef(0);
    const [scrollAllowed, setScrollAllowed] = useState(true);

    const paragraphs = useMemo(() => buildParagraphs(content), [content]);
    const times = timings?.w;

    // Elle kaydırma / dokunma → otomatik kaydırmayı geçici sustur
    useEffect(() => {
        const mark = () => {
            lastUserScrollRef.current = Date.now();
            setScrollAllowed(false);
        };
        window.addEventListener('wheel', mark, { passive: true });
        window.addEventListener('touchmove', mark, { passive: true });

        const timer = setInterval(() => {
            if (Date.now() - lastUserScrollRef.current > USER_SCROLL_QUIET_MS) setScrollAllowed(true);
        }, 1000);

        return () => {
            window.removeEventListener('wheel', mark);
            window.removeEventListener('touchmove', mark);
            clearInterval(timer);
        };
    }, []);

    // 60 ms'de bir bak, SADECE kelime değişince state güncelle
    useEffect(() => {
        if (!times) return undefined;

        let frame = 0;
        let lastCheck = 0;
        let lastIndex = -1;

        const tick = (now) => {
            frame = requestAnimationFrame(tick);
            if (now - lastCheck < 60) return;
            lastCheck = now;

            const audio = audioRef?.current;
            if (!audio) return;
            const index = wordIndexAt(times, audio.currentTime * 1000 + LEAD_MS);
            if (index !== lastIndex) {
                lastIndex = index;
                setActiveIndex(index);
            }
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [times, audioRef]);

    if (!times) {
        return (
            <p data-tour="story-text" className="whitespace-pre-wrap first-letter:text-4xl first-letter:font-bold first-letter:text-islamic-green dark:first-letter:text-islamic-gold first-letter:mr-2 first-letter:float-left">
                {content}
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {paragraphs.map((para, index) => {
                const phase = activeIndex < 0 || activeIndex < para.start ? 'after'
                    : activeIndex > para.end ? 'before' : 'contains';
                return (
                    <Paragraph
                        key={index}
                        isFirst={index === 0}
                        words={para.words}
                        phase={phase}
                        localActive={phase === 'contains' ? activeIndex - para.start : -1}
                        shouldScroll={isPlaying && scrollAllowed}
                    />
                );
            })}
        </div>
    );
}
