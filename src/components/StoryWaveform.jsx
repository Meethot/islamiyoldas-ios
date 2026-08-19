import React, { useMemo } from 'react';

// Sesin gerçek RMS zarfı (scripts/hikaye-zamanlama.mjs → timings.p, 0-31 arası 140 çubuk).
// İki kopya üst üste: alttaki sönük, üstteki altın ve clip-path ile çalınan kadarı açık.
// Böylece ilerledikçe tek bir stil değişiyor — 140 çubuk yeniden render olmuyor.
const Bars = React.memo(function Bars({ peaks, className }) {
    return (
        <div className="absolute inset-0 flex items-center justify-between gap-px">
            {peaks.map((peak, i) => (
                <span
                    key={i}
                    className={className}
                    style={{ height: `${Math.max(12, (peak / 31) * 100)}%` }}
                />
            ))}
        </div>
    );
});

export default function StoryWaveform({ peaks, percent, onSeek, duration, currentTime, label, compact = false }) {
    const bars = useMemo(() => peaks || [], [peaks]);
    if (!bars.length) return null;

    return (
        <div className={`relative w-full group/wave ${compact ? 'h-6' : 'h-9'}`}>
            <Bars peaks={bars} className="w-full rounded-full bg-white/20" />
            <div
                className="absolute inset-0 transition-[clip-path] duration-100 ease-linear"
                style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}
            >
                <Bars peaks={bars} className="w-full rounded-full bg-islamic-gold" />
            </div>

            {/* Çalınan yerin ucundaki ince imleç */}
            <div
                className="absolute top-0 bottom-0 w-[2px] rounded-full bg-[#FFFDF6] shadow-[0_0_8px_rgba(255,215,0,0.7)] pointer-events-none"
                style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
            />

            <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={onSeek}
                aria-label={label}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
        </div>
    );
}
