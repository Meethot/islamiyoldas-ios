import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BookOpen, ArrowLeft, Bookmark, BookmarkCheck, Share2, RefreshCw, WifiOff,
    Loader2, ChevronDown, ChevronRight, CornerDownLeft, X, Play, Pause, Volume2, VolumeX, Crown,
    SkipBack, SkipForward, MousePointerClick, Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { fetchSurahContent, fetchChapterInfo, fetchSurahAudio, fetchAyahAudio, fetchChapterAudioFiles, fetchChapterWordTransliterations } from '@/services/quranApi';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { safeGetStorage, safeSetStorage } from '@/utils/storageHelper';
import ShareCard, { SHARE_THEMES } from '@/components/ShareCard';
import { shareHiddenElement } from '@/lib/share';
import { isPremium } from '@/services/creditService';
import { analytics } from '@/services/analyticsService';

import { useTranslation } from 'react-i18next';
import { Capacitor, registerPlugin } from '@capacitor/core';

const NowPlaying = Capacitor.isNativePlatform() ? registerPlugin('NowPlaying') : null;

// Background Mode Helper (Cordova Plugin)
const BackgroundMode = {
    enable: (title, text) => {
        if (Capacitor.getPlatform() === 'ios') return; // iOS WKWebView handles background audio automatically; this plugin breaks lock screen metadata.
        if (window.cordova?.plugins?.backgroundMode) {
            window.cordova.plugins.backgroundMode.enable();
            window.cordova.plugins.backgroundMode.setDefaults({
                title: 'İslami Yoldaş',
                text: text,
                icon: 'ic_launcher',
                color: 'D4AF37',
                resume: true,
                hidden: false,
                bigText: false
            });
        }
    },
    disable: () => {
        if (Capacitor.getPlatform() === 'ios') return;
        if (window.cordova?.plugins?.backgroundMode) {
            window.cordova.plugins.backgroundMode.disable();
        }
    }
};

const BOOKMARKS_KEY = 'quran_bookmarks';

const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toArabicNumber = (num) => {
    return String(num).split('').map(digit => arabicNumerals[digit]).join('');
};

// Word-synced follow-along for the playing verse. Uses quran.com per-word segments
// ([wordPos, wordNo, startMs, endMs]) when available, else falls back to linear time.
// Keeps state local so only THIS verse re-renders.
//
// Sync strategy (fixes "lags behind" / "freezes"):
//  - Prefer the real audio.currentTime. On web it advances every frame, so we track it
//    exactly. On iOS, WKWebView hands <audio> to the native media stack and currentTime
//    can freeze between updates — so when it stalls we bridge with a wall clock, and snap
//    back the instant currentTime moves again. Result: exact when possible, smooth always.
//  - Arabic: segment count matches the word count, so map the active segment straight to
//    the word (1:1, no ratio drift). Transliteration has a different word count, so fall
//    back to fractional progress interpolated inside the active segment.
const KaraokeVerse = React.memo(({ audio, text, words: wordsProp, segments, readClass, currentClass, dimClass, onWordTap }) => {
    // wordsProp (Okunuş) is already aligned 1:1 with segments; text (Arabic) is split on spaces
    const words = React.useMemo(() => wordsProp || (text || '').split(' '), [wordsProp, text]);
    const [wordIdx, setWordIdx] = React.useState(-1);

    React.useEffect(() => {
        let raf;
        let anchorTime = audio.currentTime || 0;   // last trusted playhead (s)
        let anchorAt = performance.now();           // wall clock at that read (ms)
        const direct = !!segments && segments.length === words.length;

        const compute = (t) => {
            let idx = -1;
            if (segments && segments.length) {
                const ms = t * 1000;
                let cur = -1;
                for (let i = 0; i < segments.length; i++) {
                    if (ms >= segments[i][2]) cur = i; else break; // last segment whose start passed
                }
                if (direct) {
                    idx = cur; // 1:1 word mapping (Arabic)
                } else {
                    // fractional progress, smoothed inside the active segment
                    let within = 0;
                    if (cur >= 0) {
                        const s = segments[cur][2], e = segments[cur][3];
                        within = e > s ? Math.min(1, (ms - s) / (e - s)) : 0;
                    }
                    idx = Math.floor(((cur + within) / segments.length) * words.length);
                }
            } else if (audio.duration > 0 && isFinite(audio.duration)) {
                idx = Math.floor(Math.min(1, t / audio.duration) * words.length);
            }
            setWordIdx(Math.min(words.length - 1, idx));
        };

        const tick = () => {
            const now = performance.now();
            const real = audio.currentTime || 0;
            // Forward drift → trust it exactly; big backward jump (user scrubbed back) →
            // re-anchor too so the highlight follows seeks in both directions.
            if (real > anchorTime + 0.02 || real < anchorTime - 0.25) { anchorTime = real; anchorAt = now; }
            const t = audio.paused ? anchorTime : anchorTime + (now - anchorAt) / 1000;
            compute(t);
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [audio, segments, words.length]);

    return (
        <>
            {words.map((word, i) => (
                <span
                    key={i}
                    onClick={onWordTap ? () => onWordTap(i, words.length) : undefined}
                    className={cn(
                        'transition-colors duration-200',
                        onWordTap && 'cursor-pointer active:opacity-50',
                        i < wordIdx ? readClass : i === wordIdx ? currentClass : dimClass
                    )}
                >
                    {word}{i < words.length - 1 ? ' ' : ''}
                </span>
            ))}
        </>
    );
});

// Seekable scrubber for the focus card (Apple Music style): draggable gold track with a
// knob, elapsed/total time labels, verse counter in the middle. All visuals are written
// straight to the DOM from RAF (no state) so it runs at 60fps without re-rendering.
const formatClock = (s) => {
    s = Math.max(0, Math.floor(s || 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// ——— Islamic ornaments for the focus card (SVG, tinted via currentColor) ———

// Thin divider: hairlines meeting small diamonds and a central 8-pointed star
const OrnamentDivider = ({ className }) => (
    <svg viewBox="0 0 300 16" className={className} fill="none" aria-hidden="true">
        <line x1="10" y1="8" x2="118" y2="8" stroke="currentColor" strokeWidth="0.75" opacity="0.45" />
        <line x1="182" y1="8" x2="290" y2="8" stroke="currentColor" strokeWidth="0.75" opacity="0.45" />
        <path d="M124 8 l4 -3 4 3 -4 3 z" fill="currentColor" opacity="0.6" />
        <path d="M168 8 l4 -3 4 3 -4 3 z" fill="currentColor" opacity="0.6" />
        <g transform="translate(150 8)">
            <path d="M0 -6 L1.8 -1.8 L6 0 L1.8 1.8 L0 6 L-1.8 1.8 L-6 0 L-1.8 -1.8 Z" fill="currentColor" opacity="0.9" />
            <path transform="rotate(45)" d="M0 -6 L1.8 -1.8 L6 0 L1.8 1.8 L0 6 L-1.8 1.8 L-6 0 L-1.8 -1.8 Z" fill="currentColor" opacity="0.5" />
        </g>
    </svg>
);

// Corner arabesque: nested quarter arcs + a small diamond bud
const CornerOrnament = ({ className }) => (
    <svg viewBox="0 0 80 80" className={className} fill="none" stroke="currentColor" aria-hidden="true">
        <path d="M2 78 C2 36 36 2 78 2" strokeWidth="0.8" opacity="0.65" />
        <path d="M2 60 C2 27 27 2 60 2" strokeWidth="0.6" opacity="0.4" />
        <path d="M13 13 l5 -4 5 4 -5 4 z" fill="currentColor" stroke="none" opacity="0.7" />
    </svg>
);

// Stage themes for the verse focus card. Single-palette immersive skins (Apple Music
// lyrics style); `light` flips the neutral chrome (header/controls/labels) accordingly.
const FOCUS_THEMES = [
    {
        id: 'emerald', light: false,
        accent: 'text-islamic-gold',
        dot: 'bg-[#0a4d2c]',
        sheet: 'bg-[#042313]',
        glow: 'bg-islamic-gold/[0.08]',
        read: 'text-white', current: 'text-islamic-gold', dim: 'text-white/25',
        arRead: 'text-islamic-gold', arCurrent: 'text-white drop-shadow-[0_0_12px_rgba(212,175,55,0.5)]', arDim: 'text-islamic-gold/25',
        fill: 'bg-islamic-gold',
        play: 'bg-islamic-gold text-[#032e18] shadow-islamic-gold/25',
    },
    {
        id: 'night', light: false,
        accent: 'text-islamic-gold',
        dot: 'bg-[#15151f]',
        sheet: 'bg-[#0b0b14]',
        glow: 'bg-islamic-gold/[0.07]',
        read: 'text-white', current: 'text-islamic-gold', dim: 'text-white/25',
        arRead: 'text-white/90', arCurrent: 'text-islamic-gold drop-shadow-[0_0_12px_rgba(212,175,55,0.5)]', arDim: 'text-white/25',
        fill: 'bg-islamic-gold',
        play: 'bg-islamic-gold text-[#0b0b14] shadow-islamic-gold/25',
    },
    {
        id: 'sand', light: true,
        accent: 'text-amber-700',
        dot: 'bg-[#efe5cf]',
        sheet: 'bg-[#F6F0E1]',
        glow: 'bg-amber-500/[0.10]',
        read: 'text-stone-900', current: 'text-amber-700', dim: 'text-stone-900/25',
        arRead: 'text-emerald-900', arCurrent: 'text-amber-700', arDim: 'text-emerald-900/30',
        fill: 'bg-amber-600',
        play: 'bg-emerald-900 text-white shadow-emerald-900/25',
    },
    {
        id: 'navy', light: false,
        accent: 'text-sky-300',
        dot: 'bg-[#122a52]',
        sheet: 'bg-[#081326]',
        glow: 'bg-sky-400/[0.08]',
        read: 'text-white', current: 'text-sky-300', dim: 'text-white/25',
        arRead: 'text-sky-200/90', arCurrent: 'text-white drop-shadow-[0_0_12px_rgba(125,211,252,0.5)]', arDim: 'text-sky-200/25',
        fill: 'bg-sky-400',
        play: 'bg-sky-400 text-[#081326] shadow-sky-400/25',
    },
    {
        id: 'rose', light: false,
        accent: 'text-rose-300',
        dot: 'bg-[#4a1f33]',
        sheet: 'bg-[#22101b]',
        glow: 'bg-rose-400/[0.08]',
        read: 'text-white', current: 'text-rose-300', dim: 'text-white/25',
        arRead: 'text-rose-200/90', arCurrent: 'text-white drop-shadow-[0_0_12px_rgba(253,164,175,0.5)]', arDim: 'text-rose-200/25',
        fill: 'bg-rose-400',
        play: 'bg-rose-400 text-[#22101b] shadow-rose-400/25',
    },
];
const FOCUS_THEME_KEY = 'quran_focus_theme';
const FOCUS_HINT_KEY = 'quran_focus_hint';

const AyahScrubber = ({ audio, segments, counterLabel, onSeekTo, trackClass, fillClass, labelClass }) => {
    const trackRef = React.useRef(null);
    const fillRef = React.useRef(null);
    const knobRef = React.useRef(null);
    const elapsedRef = React.useRef(null);
    const totalRef = React.useRef(null);
    const dragFracRef = React.useRef(null); // non-null while the user is scrubbing

    const getDuration = React.useCallback(() => (
        segments && segments.length
            ? segments[segments.length - 1][3] / 1000
            : (isFinite(audio.duration) ? audio.duration : 0)
    ), [audio, segments]);

    React.useEffect(() => {
        let raf;
        let anchorTime = audio.currentTime || 0;
        let anchorAt = performance.now();

        const tick = () => {
            const now = performance.now();
            const real = audio.currentTime || 0;
            if (real > anchorTime + 0.02 || real < anchorTime - 0.25) { anchorTime = real; anchorAt = now; }
            const t = audio.paused ? anchorTime : anchorTime + (now - anchorAt) / 1000;
            const dur = getDuration();
            const frac = dragFracRef.current ?? (dur > 0 ? Math.min(1, t / dur) : 0);
            if (fillRef.current) fillRef.current.style.width = `${frac * 100}%`;
            if (knobRef.current) knobRef.current.style.left = `${frac * 100}%`;
            if (elapsedRef.current) elapsedRef.current.textContent = formatClock(dragFracRef.current != null ? dragFracRef.current * dur : Math.min(t, dur || t));
            if (totalRef.current) totalRef.current.textContent = formatClock(dur);
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [audio, segments, getDuration]);

    const fracFromEvent = (e) => {
        const rect = trackRef.current.getBoundingClientRect();
        return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    };
    const handleDown = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragFracRef.current = fracFromEvent(e);
        if (knobRef.current) knobRef.current.style.transform = 'translateY(-50%) scale(1.35)';
    };
    const handleMove = (e) => {
        if (dragFracRef.current != null) dragFracRef.current = fracFromEvent(e);
    };
    const handleUp = () => {
        if (dragFracRef.current == null) return;
        const dur = getDuration();
        if (dur > 0) onSeekTo(dragFracRef.current * dur);
        dragFracRef.current = null;
        if (knobRef.current) knobRef.current.style.transform = 'translateY(-50%) scale(1)';
    };

    return (
        <div>
            <div
                ref={trackRef}
                onPointerDown={handleDown}
                onPointerMove={handleMove}
                onPointerUp={handleUp}
                onPointerCancel={handleUp}
                className="relative h-8 flex items-center touch-none cursor-pointer"
            >
                <div className={cn("h-[6px] w-full rounded-full overflow-hidden", trackClass || "bg-white/10")}>
                    <div ref={fillRef} className={cn("h-full w-0 rounded-full", fillClass || "bg-islamic-gold")} />
                </div>
                <div
                    ref={knobRef}
                    style={{ left: 0, top: '50%', transform: 'translateY(-50%) scale(1)' }}
                    className="absolute w-4 h-4 -ml-2 rounded-full bg-[#FFFDF6] shadow-[0_1px_6px_rgba(0,0,0,0.35)] transition-transform duration-150 pointer-events-none"
                />
            </div>
            <div className={cn("flex justify-between items-center text-[11px] font-medium tabular-nums", labelClass || "text-white/35")}>
                <span ref={elapsedRef}>0:00</span>
                <span>{counterLabel}</span>
                <span ref={totalRef}>0:00</span>
            </div>
        </div>
    );
};

// Full-screen focus sheet for a single verse (opened by double-tapping a verse in reading
// mode). Apple Music lyrics-style: one mode, one text, huge type, minimal chrome.
// mode: 'translit' (word-synced Okunuş) | 'ar' (word-synced Arabic) | 'tr' (Meâl, static)
const VerseFocusCard = ({ mode, verse, surahName, ayatLabel, verseCount, audio, segments, words, isPlaying, onClose, onToggle, onPrev, onNext, onSeekTo, hasPrev, hasNext }) => {
    const dragControls = useDragControls();

    // Tap a word → jump to its timestamp. Direct when word count === segment count
    // (Arabic / aligned Okunuş); otherwise proportional segment lookup.
    const handleWordTap = (i, wordCount) => {
        if (segments && segments.length) {
            const seg = Math.min(segments.length - 1, Math.floor((i * segments.length) / wordCount));
            onSeekTo(segments[seg][2] / 1000);
        } else if (isFinite(audio.duration) && audio.duration > 0) {
            onSeekTo((i / wordCount) * audio.duration);
        }
    };

    // Stage theme (persisted)
    const [themeId, setThemeId] = React.useState(() => safeGetStorage(FOCUS_THEME_KEY, 'emerald'));
    const theme = FOCUS_THEMES.find(th => th.id === themeId) || FOCUS_THEMES[0];
    const pickTheme = (id) => {
        setThemeId(id);
        safeSetStorage(FOCUS_THEME_KEY, id);
    };
    // Neutral chrome derived from the theme's light/dark stage
    const chrome = theme.light
        ? {
            grabber: 'bg-stone-400/50', title: 'text-stone-900', muted: 'text-stone-500',
            close: 'bg-stone-900/[0.06] text-stone-600', control: 'text-stone-700',
            track: 'bg-stone-900/10', label: 'text-stone-500/80'
        }
        : {
            grabber: 'bg-white/20', title: 'text-white', muted: 'text-white/40',
            close: 'bg-white/10 text-white/70', control: 'text-white/80',
            track: 'bg-white/10', label: 'text-white/35'
        };

    return (
        <motion.div
            className="fixed inset-0 z-[95]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Backdrop — solid (no backdrop-blur: Android perf) */}
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />

            {/* Sheet */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', bounce: 0.12, duration: 0.5 }}
                drag="y"
                dragListener={false}
                dragControls={dragControls}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.7 }}
                onDragEnd={(e, info) => {
                    if (info.offset.y > 120 || info.velocity.y > 800) onClose();
                }}
                className={cn(
                    "absolute inset-x-0 bottom-0 top-[7vh] rounded-t-[2.25rem] overflow-hidden flex flex-col shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.6)] transition-colors duration-300",
                    theme.sheet
                )}
            >
                {/* Ambient stage glow */}
                <div className={cn("absolute -top-28 left-1/2 -translate-x-1/2 w-[26rem] h-[26rem] rounded-full blur-3xl pointer-events-none transition-colors duration-300", theme.glow)} />

                {/* Islamic ornaments — corner arabesques */}
                <CornerOrnament className={cn("absolute top-3 left-3 w-16 h-16 pointer-events-none", theme.accent, theme.light ? "opacity-40" : "opacity-30")} />
                <CornerOrnament className={cn("absolute top-3 right-3 w-16 h-16 pointer-events-none -scale-x-100", theme.accent, theme.light ? "opacity-40" : "opacity-30")} />

                {/* Grabber + header (drag handle area) */}
                <div
                    className="relative shrink-0 pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <div className={cn("mx-auto w-10 h-1.5 rounded-full", chrome.grabber)} />
                    <div className="mt-4 text-center px-16">
                        <p className={cn("text-[16px] font-semibold tracking-tight truncate", chrome.title)}>{surahName}</p>
                        <p className={cn("text-[12px] font-medium mt-0.5", chrome.muted)}>{ayatLabel}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className={cn("absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform", chrome.close)}
                    >
                        <X className="w-[18px] h-[18px]" />
                    </button>
                </div>

                {/* Ornamental divider under the header */}
                <OrnamentDivider className={cn("relative shrink-0 w-64 h-4 mx-auto mt-1", theme.accent, theme.light ? "opacity-80" : "opacity-70")} />

                {/* Theme dots */}
                <div className="relative shrink-0 flex justify-center gap-3 pt-1.5 pb-1">
                    {FOCUS_THEMES.map(th => (
                        <button
                            key={th.id}
                            onClick={() => pickTheme(th.id)}
                            aria-label={th.id}
                            className={cn(
                                "w-5 h-5 rounded-full border transition-all duration-200",
                                th.dot,
                                th.light ? "border-stone-400/60" : "border-white/25",
                                themeId === th.id
                                    ? "scale-125 ring-2 ring-offset-1 ring-offset-transparent " + (theme.light ? "ring-stone-500/70" : "ring-white/70")
                                    : "opacity-70"
                            )}
                        />
                    ))}
                </div>

                {/* Hero text — only the active mode's content */}
                <div className="relative flex-1 overflow-y-auto px-7">
                    <div className="min-h-full flex flex-col justify-center py-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={verse.verseKey}
                                initial={{ opacity: 0, y: 28 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
                            >
                                {mode === 'ar' && (
                                    <p dir="rtl" className="font-arabic text-[40px] leading-[2] text-right">
                                        <KaraokeVerse
                                            audio={audio}
                                            text={verse.arabic}
                                            segments={segments}
                                            onWordTap={handleWordTap}
                                            readClass={theme.arRead}
                                            currentClass={theme.arCurrent}
                                            dimClass={theme.arDim}
                                        />
                                    </p>
                                )}

                                {mode === 'translit' && (
                                    <p className="text-[27px] leading-[1.55] font-semibold tracking-tight">
                                        <KaraokeVerse
                                            audio={audio}
                                            text={verse.transliteration}
                                            words={words}
                                            segments={segments}
                                            onWordTap={handleWordTap}
                                            readClass={theme.read}
                                            currentClass={theme.current}
                                            dimClass={theme.dim}
                                        />
                                    </p>
                                )}

                                {mode === 'tr' && (
                                    <div className={cn("text-[25px] leading-[1.5] font-semibold tracking-tight", theme.read)}>
                                        <span dangerouslySetInnerHTML={{ __html: verse.translation }} />
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer — scrubber + transport */}
                <div className="relative shrink-0 px-7 pt-1 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
                    <OrnamentDivider className={cn("w-52 h-3.5 mx-auto mb-1.5", theme.accent, theme.light ? "opacity-60" : "opacity-50")} />
                    <AyahScrubber
                        audio={audio}
                        segments={segments}
                        counterLabel={`${verse.verseNumber}${verseCount ? ` / ${verseCount}` : ''}`}
                        onSeekTo={onSeekTo}
                        trackClass={chrome.track}
                        fillClass={theme.fill}
                        labelClass={chrome.label}
                    />
                    <div className="mt-3 flex items-center justify-center gap-9">
                        <button
                            onClick={onPrev}
                            disabled={!hasPrev}
                            className={cn("w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-25", chrome.control)}
                        >
                            <SkipBack className="w-6 h-6 fill-current" />
                        </button>
                        <button
                            onClick={onToggle}
                            className={cn("w-[68px] h-[68px] rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform", theme.play)}
                        >
                            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!hasNext}
                            className={cn("w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-25", chrome.control)}
                        >
                            <SkipForward className="w-6 h-6 fill-current" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Memoized individual verse to prevent list re-renders
const VerseItem = React.memo(({ verse, index, isBookmarked, toggleBookmark, handleShareClick, handlePlayAyah, playFromVerse, playingAyahKey, t, verseRef, hasPremium }) => {
    const isPlaying = playingAyahKey === verse.verseKey;

    return (
        <motion.div
            ref={verseRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.5) }}
        >
            <div className="relative mb-6">
                <Card className="border-none shadow-xl rounded-[2.5rem] bg-[#FFFDF6] dark:bg-white/5 overflow-hidden p-6 relative dark:text-white">
                    <div className="space-y-6">
                        {/* Header: Number & Actions */}
                        <div className="flex items-start justify-between">
                            <button
                                type="button"
                                onClick={() => playFromVerse(verse.verseNumber)}
                                className="w-14 h-14 bg-islamic-green dark:bg-islamic-gold rounded-2xl flex items-center justify-center text-white dark:text-[#032e18] font-bold text-lg shadow-lg shrink-0 active:scale-95 transition-transform"
                            >
                                {verse.verseNumber}
                            </button>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => toggleBookmark(verse)}
                                    className={cn(
                                        "rounded-xl transition-colors w-10 h-10 flex items-center justify-center active:scale-95",
                                        isBookmarked
                                            ? "text-islamic-gold bg-islamic-gold/10"
                                            : "text-gray-400 active:text-islamic-gold active:bg-islamic-gold/10"
                                    )}
                                >
                                    {isBookmarked
                                        ? <BookmarkCheck className="w-5 h-5 fill-current" />
                                        : <Bookmark className="w-5 h-5" />
                                    }
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePlayAyah(verse)}
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                        isPlaying 
                                            ? "bg-islamic-gold text-[#032e18] shadow-lg shadow-islamic-gold/40"
                                            : hasPremium 
                                                ? "bg-[#F0E8D5] dark:bg-white/10 text-stone-600 dark:text-white/70 hover:bg-[#E9DFC8] dark:hover:bg-white/20"
                                                : "premium-play-btn bg-gradient-to-br from-[#D4AF37] via-[#E8C94A] to-[#C9982A] text-[#3D2E0A] shadow-[0_2px_12px_rgba(212,175,55,0.35)]"
                                    )}
                                >
                                    {isPlaying 
                                        ? <Pause className="w-5 h-5 fill-current" /> 
                                        : hasPremium 
                                            ? <Play className="w-5 h-5 fill-current ml-0.5" />
                                            : <Crown className="w-5 h-5 fill-current" />
                                    }
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleShareClick(verse)}
                                    className="rounded-xl text-gray-400 active:text-islamic-gold active:bg-islamic-gold/10 transition-colors w-10 h-10 flex items-center justify-center active:scale-95"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
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
        prev.playingAyahKey === next.playingAyahKey &&
        prev.index === next.index
    );
});

export default function SurahDetail() {
    const { surahId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { selection, success } = useHaptics();
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language?.split('-')[0] || 'en';
    const autoPlayKey = useRef(null);

    // State
    const [bookmarks, setBookmarks] = useState(() => safeGetStorage(BOOKMARKS_KEY, []));

    // Reading Mode State
    const [viewMode, setViewMode] = useState(() => safeGetStorage('quran_default_view_mode', 'reading'));
    const [readingSubMode, setReadingSubMode] = useState(() => safeGetStorage('quran_default_sub_mode', 'tr'));
    const [zoomLevel, setZoomLevel] = useState(() => safeGetStorage('quran_reading_zoom', 1));

    useEffect(() => {
        safeSetStorage('quran_reading_zoom', zoomLevel);
    }, [zoomLevel]);

    useEffect(() => {
        safeSetStorage('quran_default_view_mode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        safeSetStorage('quran_default_sub_mode', readingSubMode);
    }, [readingSubMode]);

    // Jump to Verse State
    const verseRefs = React.useRef({});
    const [jumpTarget, setJumpTarget] = useState('');
    const [pendingJumpVerse, setPendingJumpVerse] = useState(null);

    const hasPremium = isPremium();

    // Share State
    const [shareModalData, setShareModalData] = useState(null);
    const [activeTheme, setActiveTheme] = useState(SHARE_THEMES.emerald);
    const [sharing, setSharing] = useState(false);

    // Audio State
    const [audio] = useState(() => new Audio());

    useEffect(() => {
        document.body.appendChild(audio);
        return () => {
            if (document.body.contains(audio)) {
                document.body.removeChild(audio);
            }
        };
    }, [audio]);

    useEffect(() => {
        if (!NowPlaying) return;
        let playListener;
        let pauseListener;

        const setupListeners = async () => {
            playListener = await NowPlaying.addListener('remotePlay', () => {
                audio.play().catch(() => {});
                navigator.mediaSession.playbackState = 'playing';
                setIsSurahPlaying(true);
                NowPlaying.setNowPlaying({ isPlaying: true, currentTime: audio.currentTime });
            });
            pauseListener = await NowPlaying.addListener('remotePause', () => {
                audio.pause();
                navigator.mediaSession.playbackState = 'paused';
                setIsSurahPlaying(false);
                NowPlaying.setNowPlaying({ isPlaying: false, currentTime: audio.currentTime });
            });
        };

        setupListeners();

        return () => {
            if (playListener) playListener.remove();
            if (pauseListener) pauseListener.remove();
        };
    }, [audio]);
    const [isSurahPlaying, setIsSurahPlaying] = useState(false);
    const [isSurahLoading, setIsSurahLoading] = useState(false);
    const [playingAyahKey, setPlayingAyahKey] = useState(null);
    const [audioPlaylist, setAudioPlaylist] = useState([]); // Array of {verseKey, url}
    const [playlistIndex, setPlaylistIndex] = useState(-1);
    // NOTE: no per-tick audio state here on purpose — there is no visible player UI on this
    // screen, and updating state from ontimeupdate re-rendered every verse span ~4x/sec (jank).
    const [volume] = useState(1);
    const [isMuted] = useState(false);

    const handleJumpToVerse = (e) => {
        e.preventDefault();
        let verseNumber = parseInt(jumpTarget);
        if (!verseNumber) return;
        if (surahInfo?.ayahCount) verseNumber = Math.min(verseNumber, surahInfo.ayahCount);
        document.activeElement?.blur?.();

        // Scroll to verse; pendingJumpVerse effect auto-fetches missing pages
        const element = verseRefs.current[verseNumber] || verseRefs.current[`idx-${verseNumber}`];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            setPendingJumpVerse(verseNumber);
        }
        setJumpTarget('');

        // Premium: start (or move) listening from that verse; free users just scroll
        if (hasPremium) {
            playFromVerse(verseNumber);
        } else {
            selection();
        }
    };

    const toggleZoom = () => {
        selection();
        setZoomLevel(prev => prev >= 4 ? 1 : prev + 1);
    };

    const getArabicZoomClass = () => {
        switch (zoomLevel) {
            case 2: return 'text-4xl leading-[2.5]';
            case 3: return 'text-5xl leading-[2.2]';
            case 4: return 'text-[50px] leading-[2.1]';
            default: return 'text-3xl leading-[3]'; // level 1
        }
    };

    const getLatinZoomClass = () => {
        switch (zoomLevel) {
            case 2: return 'text-xl leading-relaxed';
            case 3: return 'text-2xl leading-relaxed';
            case 4: return 'text-3xl leading-relaxed';
            default: return 'text-lg leading-relaxed'; // level 1
        }
    };

    // Auto-Scroll to Playing Ayah (for Reading Mode)
    // readingSubMode dep: Meâl/Arapça/Okunuş switch changes text heights, so the pixel
    // scroll position lands on different verses — re-center on the playing ayah.
    useEffect(() => {
        if (playingAyahKey && viewMode === 'reading') {
            const verseElement = verseRefs.current[playingAyahKey];
            if (verseElement) {
                // adding a small timeout helps avoiding scroll jumps if DOM is mid-paint
                setTimeout(() => {
                    verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
            }
        }
    }, [playingAyahKey, viewMode, readingSubMode]);

    // TanStack Query: Surah Info
    const { data: surahInfo, isLoading: infoLoading, error: infoError } = useQuery({
        queryKey: ['surahInfo', surahId, currentLang],
        queryFn: () => fetchChapterInfo(surahId, currentLang),
    });

    useEffect(() => {
        if (surahInfo?.name) {
            analytics.quranOpened(surahInfo.name, 'all');
        }
    }, [surahInfo?.name]);


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
        if (!isPremium()) { navigate('/premium'); return; }
        setBookmarks(prev => {
            const exists = prev.some(b => b.verseKey === verse.verseKey);
            let updated;
            if (exists) {
                updated = prev.filter(b => b.verseKey !== verse.verseKey);
            } else {
                analytics.quranBookmarkAdded(surahInfo?.name || String(surahId), verse.verseNumber);
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
            surah: surahInfo?.name || `Surah ${surahId}`,
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
                `"${shareModalData.translation}"\n\n${surahInfo?.name || t('quran:pageTitle')} ${shareModalData.verseNumber}. ${t('quran:ayat', { number: '' }).trim()} - ${t('quran:bgTitle')} 🤲`,
                t('quran:shareVerse')
            );
            analytics.contentShared('quran_verse', 'system_share');
            setShareModalData(null);
        } catch (e) {
            console.error(e);
        } finally {
            setSharing(false);
        }
    };

    // Media Session Helper
    const updateMediaSession = (title, album, isPlaying = true) => {
        if (NowPlaying) {
            NowPlaying.setNowPlaying({
                title: title,
                artist: 'İslami Yoldaş',
                album: album || 'Kuran-ı Kerim',
                duration: audio.duration || 0,
                currentTime: audio.currentTime || 0,
                isPlaying: isPlaying
            }).catch(() => {});
            
            // Listeners are added in useEffect
        }
        
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title,
                artist: 'İslami Yoldaş',
                album: album || 'Kuran-ı Kerim',
                artwork: [
                    { src: window.location.origin + '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
                    { src: window.location.origin + '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
                ]
            });
            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
            navigator.mediaSession.setActionHandler('play', () => {
                audio.play().catch(() => {});
                if (NowPlaying) NowPlaying.setNowPlaying({ isPlaying: true, currentTime: audio.currentTime });
                navigator.mediaSession.playbackState = 'playing';
                setIsSurahPlaying(true);
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                audio.pause();
                if (NowPlaying) NowPlaying.setNowPlaying({ isPlaying: false, currentTime: audio.currentTime });
                navigator.mediaSession.playbackState = 'paused';
                setIsSurahPlaying(false);
            });
        }
    };

    // Audio Logic
    const toggleSurahAudio = async () => {
        selection();
        if (!hasPremium) { navigate('/premium'); return; }

        if (isSurahPlaying) {
            audio.pause();
            setIsSurahPlaying(false);
            return;
        }

        // If we have a playlist and were paused, just resume
        if (audioPlaylist.length > 0 && playlistIndex >= 0 && audio.src) {
            audio.play();
            setIsSurahPlaying(true);
            updateMediaSession(`${surahInfo?.name} Suresi`);
            BackgroundMode.enable(surahInfo?.name, t('quran:listeningTo', { name: surahInfo?.name }));
            return;
        }

        // Start fresh playlist playback
        try {
            setIsSurahLoading(true);
            const files = await fetchChapterAudioFiles(surahId);
            if (!files || files.length === 0) throw new Error("Could not load audio files");

            setAudioPlaylist(files);
            analytics.quranAudioPlayed(surahInfo?.name || String(surahId), 'chapter'); // RE-ADDED ANALYTICS
            playFromPlaylist(0, files);
        } catch (e) {
            console.error(e);
            setIsSurahLoading(false);
        }
    };

    // Auto-play when navigated with autoPlay state
    useEffect(() => {
        const ts = location.state?._ts;
        if (location.state?.autoPlay && ts && ts !== autoPlayKey.current && surahInfo && verses.length > 0) {
            autoPlayKey.current = ts;
            // Clear the state so back/forward doesn't re-trigger
            window.history.replaceState({}, '');
            const timer = setTimeout(() => {
                toggleSurahAudio();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [location.state, surahInfo, verses.length]);

    const playFromPlaylist = (index, playlist = audioPlaylist) => {
        if (!playlist || index >= playlist.length) {
            setIsSurahPlaying(false);
            setPlayingAyahKey(null);
            setPlaylistIndex(-1);
            if (NowPlaying) NowPlaying.clearNowPlaying().catch(() => {});
            BackgroundMode.disable();
            return;
        }

        const track = playlist[index];
        setPlaylistIndex(index);
        setPlayingAyahKey(track.verseKey);
        setIsSurahPlaying(true);
        setIsSurahLoading(false);

        audio.src = track.url;
        audio.load();
        audio.volume = volume;
        audio.muted = isMuted;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => console.error("Playback error", err));
        }

        updateMediaSession(`${surahInfo?.name} Suresi`);
        BackgroundMode.enable(surahInfo?.name, `${surahInfo?.name} - ${index + 1}/${playlist.length}`);

        audio.onended = () => {
            playFromPlaylist(index + 1, playlist);
        };
    };

    // Start (or move) playlist playback from a specific verse number
    const playFromVerse = async (verseNumber) => {
        const target = parseInt(verseNumber);
        if (!target) return;
        selection();
        if (!hasPremium) { navigate('/premium'); return; }

        try {
            let files = audioPlaylist;
            if (!files || files.length === 0) {
                setIsSurahLoading(true);
                files = await fetchChapterAudioFiles(surahId);
                if (!files || files.length === 0) throw new Error("Could not load audio files");
                setAudioPlaylist(files);
                analytics.quranAudioPlayed(surahInfo?.name || String(surahId), 'chapter');
            }
            const index = files.findIndex(f => f.verseKey === `${surahId}:${target}`);
            playFromPlaylist(index >= 0 ? index : Math.max(0, Math.min(target - 1, files.length - 1)), files);
        } catch (e) {
            console.error(e);
            setIsSurahLoading(false);
        }
    };

    const handlePlayAyah = async (verse) => {
        selection();
        if (!hasPremium) { navigate('/premium'); return; }

        // Stop current playlist if running
        if (isSurahPlaying) {
            audio.pause();
            setIsSurahPlaying(false);
            setAudioPlaylist([]);
            setPlaylistIndex(-1);
        }

        if (playingAyahKey === verse.verseKey) {
            audio.pause();
            setPlayingAyahKey(null);
            return;
        }

        try {
            setPlayingAyahKey(verse.verseKey);
            const url = await fetchAyahAudio(verse.verseKey);
            if (!url) throw new Error('No audio URL');

            audio.src = url;
            audio.load();
            audio.volume = volume;
            audio.muted = isMuted;
            audio.play();
            updateMediaSession(`${surahInfo?.name} Suresi - Ayet ${verse.verseNumber}`);
            analytics.quranAudioPlayed(surahInfo?.name || String(surahId), 'verse_recitation');

            audio.onended = () => {
                setPlayingAyahKey(null);
            };
        } catch (e) {
            console.error(e);
            setPlayingAyahKey(null);
        }
    };

    // Scroll to top when surah changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [surahId]);

    // Clean up audio object
    useEffect(() => {
        return () => {
            audio.pause();
            audio.src = '';
            BackgroundMode.disable();
            // CLEANUP EVENTS
            audio.onended = null;
            audio.ontimeupdate = null;
            audio.onloadedmetadata = null;
        };
    }, [audio]);

    const loadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            analytics.quranPageScrolled(surahId);
            fetchNextPage();
        }
    };

    const isBookmarked = (verseKey) => bookmarks.some(b => b.verseKey === verseKey);

    // Word timings of the currently playing ayah (null → KaraokeVerse falls back to linear)
    const playingSegments = React.useMemo(() => {
        if (!playingAyahKey) return null;
        return audioPlaylist.find(t => t.verseKey === playingAyahKey)?.segments || null;
    }, [audioPlaylist, playingAyahKey]);

    // Segment-aligned word transliterations (verseKey → [word,...]) for the Okunuş view
    // and the verse focus card. Loaded once; falls back to the CDN string until ready.
    const [verseWords, setVerseWords] = useState({});
    const [focusVerseKey, setFocusVerseKey] = useState(null);
    useEffect(() => {
        if (readingSubMode !== 'translit' && !focusVerseKey) return;
        if (Object.keys(verseWords).length) return;
        let alive = true;
        fetchChapterWordTransliterations(surahId).then(w => { if (alive) setVerseWords(w); });
        return () => { alive = false; };
    }, [readingSubMode, focusVerseKey, surahId]);

    // One-time coach mark: teach the double-tap gesture (max 3 shows, done once used)
    const [showFocusHint, setShowFocusHint] = useState(false);
    const hintScheduledRef = useRef(false);
    useEffect(() => {
        if (versesLoading || verses.length === 0 || hintScheduledRef.current) return;
        const st = safeGetStorage(FOCUS_HINT_KEY, { count: 0, done: false });
        if (st.done || st.count >= 3) return;
        hintScheduledRef.current = true;
        const showTimer = setTimeout(() => {
            setShowFocusHint(true);
            safeSetStorage(FOCUS_HINT_KEY, { ...st, count: (st.count || 0) + 1 });
        }, 1200);
        const hideTimer = setTimeout(() => setShowFocusHint(false), 9000);
        return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }, [versesLoading, verses.length]);

    // Double-tap a verse in reading mode → open its focus card and play it
    const lastVerseTapRef = useRef({ key: null, t: 0 });
    const handleVerseTap = (verse) => {
        const now = Date.now();
        const last = lastVerseTapRef.current;
        lastVerseTapRef.current = { key: verse.verseKey, t: now };
        if (last.key === verse.verseKey && now - last.t < 350) {
            selection();
            setFocusVerseKey(verse.verseKey);
            if (playingAyahKey !== verse.verseKey) playFromVerse(verse.verseNumber);
            // Gesture learned — never show the coach mark again
            setShowFocusHint(false);
            safeSetStorage(FOCUS_HINT_KEY, { count: 99, done: true });
        }
    };

    // While the focus card is open, follow the recitation to the next ayah
    useEffect(() => {
        if (focusVerseKey && playingAyahKey && playingAyahKey !== focusVerseKey) {
            setFocusVerseKey(playingAyahKey);
        }
    }, [playingAyahKey]);

    const focusVerse = focusVerseKey ? verses.find(v => v.verseKey === focusVerseKey) : null;

    const toggleFocusPlayback = () => {
        selection();
        if (!focusVerse) return;
        if (isSurahPlaying && playingAyahKey === focusVerseKey) {
            audio.pause();
            setIsSurahPlaying(false);
        } else if (!isSurahPlaying && playingAyahKey === focusVerseKey && audio.src) {
            audio.play();
            setIsSurahPlaying(true);
        } else {
            playFromVerse(focusVerse.verseNumber);
        }
    };

    // Seek within the focus verse (scrubber drag / word tap). If the audio isn't on this
    // verse anymore (e.g. playback ended), restart the verse instead of seeking stale audio.
    const seekFocusTo = (seconds) => {
        if (!focusVerse) return;
        if (playingAyahKey !== focusVerseKey || !audio.src) {
            playFromVerse(focusVerse.verseNumber);
            return;
        }
        audio.currentTime = seconds;
        if (audio.paused) {
            audio.play();
            setIsSurahPlaying(true);
        }
    };

    const stepFocusVerse = (delta) => {
        if (!focusVerse) return;
        const target = focusVerse.verseNumber + delta;
        if (target < 1 || (surahInfo?.ayahCount && target > surahInfo.ayahCount)) return;
        selection();
        const targetVerse = verses.find(v => v.verseNumber === target);
        if (targetVerse) setFocusVerseKey(targetVerse.verseKey);
        else setPendingJumpVerse(target); // loads missing pages; follow effect catches up
        playFromVerse(target);
    };

    // Auto-Pagination Effect for Jump to Verse
    useEffect(() => {
        if (!pendingJumpVerse) return;

        const verseNumber = pendingJumpVerse;
        const element = verseRefs.current[verseNumber] || verseRefs.current[`idx-${verseNumber}`];

        if (element) {
            // Found it! Scroll and clear pending
            selection();
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setPendingJumpVerse(null);
            setJumpTarget('');
        } else {
            // Not found yet
            if (isFetchingNextPage) {
                // Already loading, just wait
                return;
            }

            if (hasNextPage) {
                fetchNextPage();
            } else {
                // No more pages and still not found
                console.warn(`Verse ${verseNumber} could not be found even after loading all pages.`);
                setPendingJumpVerse(null);
                // Optionally trigger an alert here via a toast system if available
            }
        }
    }, [pendingJumpVerse, verses.length, hasNextPage, isFetchingNextPage, fetchNextPage, selection]);

    // Reading completed tracking
    useEffect(() => {
        if (!hasNextPage && verses.length > 0) {
            analytics.quranReadingCompleted(surahId);
        }
    }, [hasNextPage, verses.length, surahId]);

    // Initial Loading State
    if (infoLoading || (versesLoading && !verseData)) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#F6F0E1] to-[#EDE5D1] dark:from-[#032e18] dark:to-[#021a0f] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <Loader2 className="w-12 h-12 text-islamic-gold mx-auto" />
                    </motion.div>
                    <p className="text-gray-500 dark:text-gray-400">{t('quran:versesLoading')}</p>
                </div>
            </div>
        );
    }

    // Error State
    const error = infoError || versesError;
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#F6F0E1] to-[#EDE5D1] dark:from-[#032e18] dark:to-[#021a0f] flex items-center justify-center p-6">
                <Card className="w-full max-w-md glass-panel border-none">
                    <CardContent className="p-8 text-center space-y-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                            <WifiOff className="w-10 h-10 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {t('quran.connection_error', 'Connection Error')}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400">
                                {error.message || 'An error occurred'}
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={() => { selection(); navigate(-1); }}
                                variant="outline"
                                className="border-[#E2D9C4] dark:border-white/10"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {t('quran.back', 'Back')}
                            </Button>
                            <Button
                                onClick={retry}
                                className="bg-islamic-green hover:bg-islamic-green/90"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {t('quran.retry', 'Retry')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#F6F0E1] to-[#EDE5D1] dark:from-[#032e18] dark:to-[#021a0f] pb-24">
            <>
                <div className="bg-islamic-green dark:bg-[#032e18] px-4 py-2 sticky top-0 z-40 border-b border-white/10 shadow-lg">
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => {
                                selection();
                                navigate(-1);
                            }}
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10 w-8 h-8 shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base font-serif font-bold text-white truncate leading-tight">
                                {currentLang === 'tr' ? (surahInfo?.translatedName || surahInfo?.name) : surahInfo?.name}
                            </h1>
                            <div className="flex gap-2 text-[10px] text-white/60 font-medium items-center">
                                <p>{surahInfo?.ayahCount} {t('quran:ayahCount', { count: surahInfo?.ayahCount || 0 }).split(' ').slice(1).join(' ')}</p>
                                <span>•</span>
                                <p>{t(`quran:revelation.${surahInfo?.revelationPlace}`)}</p>
        
                            </div>
                        </div>
                        <p className="text-lg font-arabic text-islamic-gold shrink-0">
                            {surahInfo?.nameArabic}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                onClick={toggleZoom}
                                variant="ghost"
                                className="bg-white/10 hover:bg-white/20 text-white h-10 w-10 p-0 rounded-xl border border-white/10 flex items-center justify-center shadow-sm"
                            >
                                <span className="font-serif text-base">A<span className="text-xs ml-[1px]">a</span></span>
                            </Button>
                            <Button
                                onClick={toggleSurahAudio}
                                disabled={isSurahLoading}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all",
                                    hasPremium 
                                        ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] hover:opacity-90"
                                        : "premium-play-btn bg-gradient-to-r from-[#D4AF37] via-[#E8C94A] to-[#C9982A] text-[#3D2E0A] shadow-[0_2px_16px_rgba(212,175,55,0.4)]"
                                )}
                            >
                                {isSurahLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isSurahPlaying ? (
                                    <><Pause size={18} fill="currentColor" /> {t('quran:stop')}</>
                                ) : !hasPremium ? (
                                    <>
                                        <Crown size={16} className="fill-current opacity-80" />
                                        <span className="font-bold">{t('quran:listen')}</span>
                                    </>
                                ) : (
                                    <><Play size={18} fill="currentColor" className="ml-0.5" /> {t('quran:listen')}</>
                                )}
                            </Button>
                        </div>
                    </div>
                    
                    <div className="mt-2 border-t border-white/5 pt-2 flex items-center gap-2">
                        <div className="bg-black/5 dark:bg-white/5 p-1 rounded-xl flex gap-1 overflow-hidden relative flex-1 min-w-0">
                            {['translit', 'tr', 'ar'].map(mode => (
                                <button
                                    key={`submode-${mode}`}
                                    onClick={() => { selection(); setReadingSubMode(mode); }}
                                    className={cn(
                                        "flex-1 py-2 text-[12px] font-bold rounded-lg transition-all duration-300 relative z-10 capitalize",
                                        readingSubMode === mode ? "text-white" : "text-white/60 hover:text-white/80"
                                    )}
                                >
                                    {readingSubMode === mode && (
                                        <motion.div
                                            layoutId="readingSubModeBg"
                                            className="absolute inset-0 bg-white/20 rounded-lg -z-10"
                                        />
                                    )}
                                    {mode === 'tr' ? t('quran:modeTranslation') : mode === 'ar' ? t('quran:modeArabic') : t('quran:modeTranslit')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </>

            <div className="p-4 space-y-4">
                {/* Surah opening panel — bismillah + jump-to-verse */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[1.75rem] bg-[#FFFDF6] dark:bg-white/[0.06] border border-[#E2D9C4]/60 dark:border-white/10 shadow-[0_8px_24px_-12px_rgba(4,77,41,0.12)] dark:shadow-lg dark:shadow-black/20 p-5"
                >
                    {surahInfo?.id !== 1 && surahInfo?.id !== 9 && (
                        <>
                            <p className="text-2xl font-arabic text-islamic-green dark:text-islamic-gold leading-relaxed text-center">
                                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                                {t('quran.bismillah_translation')}
                            </p>
                            <OrnamentDivider className="w-48 h-4 mx-auto my-3 text-amber-700/70 dark:text-islamic-gold/80" />
                        </>
                    )}
                    {/* Jump to verse: scrolls there, premium also starts listening from it */}
                    <form onSubmit={handleJumpToVerse} className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-white/40" />
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={jumpTarget}
                                onChange={(e) => setJumpTarget(e.target.value.replace(/\D/g, ''))}
                                placeholder={t('quran:jumpToVersePlaceholder')}
                                className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#F0E8D5] dark:bg-white/10 text-[15px] font-semibold text-stone-800 dark:text-white placeholder-stone-400 dark:placeholder-white/40 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-islamic-green/40 dark:focus:ring-islamic-gold/40"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!jumpTarget}
                            className="h-11 w-14 rounded-xl bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] flex items-center justify-center shadow-md shadow-islamic-green/25 dark:shadow-islamic-gold/30 active:scale-95 transition-all disabled:opacity-40 disabled:shadow-none"
                        >
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                        </button>
                    </form>
                </motion.div>

                <AnimatePresence mode="wait">
                    {viewMode === 'verses' ? (
                        <motion.div
                            key="verses-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-4"
                        >
                            {verses.map((verse, index) => (
                                <VerseItem
                                    key={verse.verseKey}
                                    verse={verse}
                                    index={index}
                                    isBookmarked={isBookmarked(verse.verseKey)}
                                    toggleBookmark={toggleBookmark}
                                    handleShareClick={handleShareClick}
                                    handlePlayAyah={handlePlayAyah}
                                    playFromVerse={playFromVerse}
                                    playingAyahKey={playingAyahKey}
                                    t={t}
                                    verseRef={(el) => {
                                        if (el) {
                                            verseRefs.current[verse.verseNumber] = el;
                                            verseRefs.current[verse.verseKey] = el;
                                            verseRefs.current[`idx-${verse.verseNumber}`] = el;
                                        }
                                    }}
                                    hasPremium={hasPremium}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="reading-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                        >
                            <Card className="border-none shadow-xl rounded-[2.5rem] bg-[#FFFDF6] dark:bg-white/5 overflow-hidden p-8 dark:text-white">
                                {readingSubMode === 'ar' && (
                                    <div className="text-right font-arabic" dir="rtl">
                                        {verses.map((verse) => {
                                            const isPlayingVerse = playingAyahKey === verse.verseKey;
                                            return (
                                                <span
                                                    key={verse.id}
                                                    id={`verse-${verse.verseKey}`}
                                                    ref={(el) => { if (el) verseRefs.current[verse.verseKey] = el; }}
                                                    onClick={() => handleVerseTap(verse)}
                                                    className={cn(
                                                        "inline",
                                                        getArabicZoomClass(),
                                                        !isPlayingVerse && "text-islamic-green dark:text-islamic-gold"
                                                    )}
                                                >
                                                    {isPlayingVerse ? (
                                                        <KaraokeVerse
                                                            audio={audio}
                                                            text={verse.arabic}
                                                            segments={playingSegments}
                                                            readClass="text-islamic-green dark:text-islamic-gold"
                                                            currentClass="text-islamic-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] dark:text-white"
                                                            dimClass="text-islamic-green/40 dark:text-islamic-gold/30"
                                                        />
                                                    ) : (
                                                        verse.arabic
                                                    )}{' '}<span
                                                        role="button"
                                                        onClick={(e) => { e.stopPropagation(); playFromVerse(verse.verseNumber); }}
                                                        className={cn(
                                                        "text-islamic-gold/70 inline-flex items-center justify-center mr-1 ml-2 relative top-1 cursor-pointer active:scale-90 transition-transform",
                                                        zoomLevel >= 3 ? "text-4xl" : "text-2xl"
                                                    )}>۝<span className={cn(
                                                        "absolute font-sans font-bold text-islamic-green dark:text-white/80",
                                                        zoomLevel >= 3 ? "text-sm" : "text-[11px]"
                                                    )}>{toArabicNumber(verse.verseNumber)}</span></span>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                {readingSubMode === 'tr' && (
                                    <div className="text-left space-y-2">
                                        {verses.map((verse) => (
                                            <span
                                                key={verse.id}
                                                id={`verse-${verse.verseKey}`}
                                                ref={(el) => { if (el) verseRefs.current[verse.verseKey] = el; }}
                                                onClick={() => handleVerseTap(verse)}
                                                className={cn(
                                                    "font-sans transition-all duration-700 inline rounded-md py-0.5",
                                                    getLatinZoomClass(),
                                                    playingAyahKey === verse.verseKey
                                                        ? "bg-islamic-gold/20 dark:bg-islamic-gold/30 text-gray-900 dark:text-white font-semibold"
                                                        : "text-gray-800 dark:text-emerald-50"
                                                )}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); playFromVerse(verse.verseNumber); }}
                                                    className="text-[10px] font-bold bg-amber-600/10 text-amber-700 dark:bg-islamic-gold/10 dark:text-islamic-gold px-1.5 py-0.5 rounded-md mx-1 relative -top-0.5 active:scale-90 transition-transform"
                                                >
                                                    {verse.verseNumber}
                                                </button>
                                                <span dangerouslySetInnerHTML={{ __html: verse.translation }} />
                                                {" "}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {readingSubMode === 'translit' && (
                                    <div className="text-left space-y-2">
                                        {verses.map((verse) => {
                                            const isPlayingVerse = playingAyahKey === verse.verseKey;
                                            // Segment-aligned words when loaded, else the CDN string
                                            const wordArr = verseWords[verse.verseKey];
                                            return (
                                                <span
                                                    key={verse.id}
                                                    id={`verse-${verse.verseKey}`}
                                                    ref={(el) => { if (el) verseRefs.current[verse.verseKey] = el; }}
                                                    onClick={() => handleVerseTap(verse)}
                                                    className={cn(
                                                        "font-sans inline py-0.5",
                                                        getLatinZoomClass(),
                                                        !isPlayingVerse && "text-gray-800 dark:text-emerald-50"
                                                    )}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); playFromVerse(verse.verseNumber); }}
                                                        className={cn(
                                                            "text-[10px] font-bold px-1.5 py-0.5 rounded-md mx-1 relative -top-0.5 active:scale-90 transition-all",
                                                            isPlayingVerse
                                                                ? "bg-islamic-gold text-[#032e18]"
                                                                : "bg-amber-600/10 text-amber-700 dark:bg-islamic-gold/10 dark:text-islamic-gold"
                                                        )}
                                                    >
                                                        {verse.verseNumber}
                                                    </button>
                                                    {isPlayingVerse ? (
                                                        <KaraokeVerse
                                                            audio={audio}
                                                            text={verse.transliteration}
                                                            words={wordArr}
                                                            segments={playingSegments}
                                                            readClass="text-gray-800 dark:text-emerald-50"
                                                            currentClass="text-amber-600 dark:text-islamic-gold"
                                                            dimClass="text-gray-300 dark:text-emerald-50/30"
                                                        />
                                                    ) : (
                                                        wordArr ? wordArr.join(' ') : verse.transliteration
                                                    )}
                                                    {" "}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                    {t('quran.loading', 'Loading...')}
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
                            className="w-full py-4 bg-amber-600/10 dark:bg-emerald-900/50 text-amber-800 dark:text-islamic-gold rounded-xl border border-amber-600/30 dark:border-emerald-800 flex justify-center items-center gap-2 font-semibold active:scale-95 transition-all hover:bg-amber-600/20 dark:hover:bg-emerald-900/70"
                        >
                            {t('quran.next_surah')}
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Coach mark: double-tap hint */}
            <AnimatePresence>
                {showFocusHint && (
                    <div className="fixed bottom-[calc(2.5rem+env(safe-area-inset-bottom))] inset-x-0 z-[80] flex justify-center pointer-events-none">
                        <motion.button
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
                            onClick={() => setShowFocusHint(false)}
                            className="pointer-events-auto flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-full bg-[#FFFDF6] dark:bg-[#0b2f1a]/95 border border-[#E2D9C4] dark:border-islamic-gold/25 shadow-xl shadow-black/20 dark:shadow-black/40"
                        >
                            <motion.span
                                animate={{ scale: [1, 0.8, 1, 0.8, 1] }}
                                transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 1.4 }}
                                className="w-8 h-8 rounded-full bg-islamic-green/10 dark:bg-islamic-gold/15 flex items-center justify-center shrink-0"
                            >
                                <MousePointerClick className="w-[18px] h-[18px] text-islamic-green dark:text-islamic-gold" />
                            </motion.span>
                            <span className="text-[13px] font-medium text-stone-800 dark:text-white">{t('quran:focusHint')}</span>
                        </motion.button>
                    </div>
                )}
            </AnimatePresence>

            {/* Verse Focus Card (double-tap a verse to open) */}
            <AnimatePresence>
                {focusVerse && (
                    <VerseFocusCard
                        mode={readingSubMode}
                        verse={focusVerse}
                        surahName={currentLang === 'tr' ? (surahInfo?.translatedName || surahInfo?.name) : surahInfo?.name}
                        ayatLabel={t('quran:ayat', { number: focusVerse.verseNumber })}
                        verseCount={surahInfo?.ayahCount}
                        audio={audio}
                        segments={playingSegments}
                        words={verseWords[focusVerse.verseKey]}
                        isPlaying={isSurahPlaying && playingAyahKey === focusVerse.verseKey}
                        onClose={() => { selection(); setFocusVerseKey(null); }}
                        onToggle={toggleFocusPlayback}
                        onPrev={() => stepFocusVerse(-1)}
                        onNext={() => stepFocusVerse(1)}
                        onSeekTo={seekFocusTo}
                        hasPrev={focusVerse.verseNumber > 1}
                        hasNext={!surahInfo?.ayahCount || focusVerse.verseNumber < surahInfo.ayahCount}
                    />
                )}
            </AnimatePresence>

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
                            className="bg-[#F6F0E1] dark:bg-[#021a0f] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-serif text-xl font-bold text-islamic-green dark:text-islamic-gold">
                                    {t('quran:shareVerse')}
                                </h3>
                                <button
                                    onClick={() => setShareModalData(null)}
                                    className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-800 dark:text-white" />
                                </button>
                            </div>

                            <div className="grid grid-cols-5 gap-3 mb-8">
                                {Object.values(SHARE_THEMES).map((theme, index) => {
                                    const isFree = index === 0;
                                    const isLocked = !isFree && !isPremium();
                                    return (
                                        <button
                                            key={theme.id}
                                            onClick={() => {
                                                selection();
                                                if (isLocked) {
                                                    navigate('/premium');
                                                    return;
                                                }
                                                setActiveTheme(theme);
                                            }}
                                            className={cn(
                                                "aspect-square rounded-full transition-all duration-300 relative border-2 border-transparent",
                                                theme.preview,
                                                activeTheme.id === theme.id ? "scale-110 ring-2 ring-offset-2 ring-islamic-gold ring-offset-[#021a0f]" : isLocked ? "opacity-40" : "opacity-70 hover:opacity-100"
                                            )}
                                            aria-label={theme.name}
                                        >
                                            {activeTheme.id === theme.id && (
                                                <motion.div
                                                    layoutId="activeTheme"
                                                    className="absolute inset-0 border-2 border-white/50 rounded-full"
                                                />
                                            )}
                                            {isLocked && (
                                                <div className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-gradient-to-br from-islamic-gold to-amber-600 flex items-center justify-center shadow-md shadow-islamic-gold/30">
                                                    <Crown size={9} className="text-white" fill="white" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <Button
                                onClick={handleShare}
                                disabled={sharing}
                                className="w-full bg-islamic-gold hover:bg-islamic-gold/90 text-white font-bold h-14 rounded-2xl text-lg shadow-lg shadow-islamic-gold/20"
                            >
                                {sharing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        {t('quran:preparing')}
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-5 h-5 mr-2" />
                                        {t('quran:share')}
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {shareModalData && (
                <ShareCard
                    theme={activeTheme.id}
                    data={shareModalData}
                />
            )}


        </div>
    );
}
