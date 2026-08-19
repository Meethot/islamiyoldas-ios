import { memo, useMemo } from 'react';
import { Crown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { sureKey, buildLines, stateOf } from '@/lib/ezber';

/**
 * Arapça şerit tek satırda kalır; sığmayan kısım kesilmez, SÖNER.
 * (Dua kartıyla aynı kural — üç nokta Arapça hatta çirkin duruyor.)
 */
const FADE = {
    WebkitMaskImage: 'linear-gradient(to left, #000 62%, transparent 100%)',
    maskImage: 'linear-gradient(to left, #000 62%, transparent 100%)',
};

/** Mihrap kemeri — dua kartlarıyla ortak tezhip. */
const MihrabArch = (props) => (
    <svg viewBox="0 0 100 130" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" {...props}>
        <path d="M50 8c22 0 38 17 38 39v78H12V47C12 25 28 8 50 8z" />
        <path d="M50 20c16 0 27 12 27 28v68H23V48c0-16 11-28 27-28z" />
        <path d="M50 33c9 0 16 7 16 17v55H34V50c0-10 7-17 16-17z" />
    </svg>
);

const SureCard = memo(function SureCard({ sure, snippet, state, done, lines, locked, tour, onOpen }) {
    const { t } = useTranslation('learn');
    const pct = lines > 0 ? Math.min(100, Math.round((done / lines) * 100)) : 0;

    return (
        <button
            type="button"
            data-tour={tour}
            onClick={() => onOpen(sure, locked)}
            className="relative w-full overflow-hidden rounded-2xl border border-[#B45309]/25 bg-[linear-gradient(160deg,#FFFDF6_0%,#F4EBD8_100%)] p-4 text-start transition-transform duration-100 active:scale-[0.985] dark:border-islamic-gold/30 dark:bg-[linear-gradient(160deg,#073b21_0%,#04240f_100%)]"
        >
            <MihrabArch className="pointer-events-none absolute -top-3 -end-2 h-[6rem] w-[4.75rem] text-[#92400E]/25 opacity-45 dark:text-islamic-gold/35" />

            <span dir="rtl" lang="ar" style={FADE} className="block overflow-hidden whitespace-nowrap ps-14 font-arabic text-[1.1875rem] leading-[2] text-[#92400E] dark:text-islamic-gold">
                {snippet}
            </span>

            <span className="my-[0.7rem] block h-px bg-gradient-to-r from-[#92400E]/35 to-transparent rtl:bg-gradient-to-l dark:from-islamic-gold/45" />

            <span className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                    <span className="block min-w-0 font-display text-[0.9375rem] font-semibold leading-snug text-balance line-clamp-2 text-stone-800 dark:text-white">
                        {sure.title}
                    </span>
                    {sure.instruction && (
                        <span className="mt-1 block text-[0.78125rem] leading-snug line-clamp-1 text-black/45 dark:text-emerald-100/45">
                            {sure.instruction}
                        </span>
                    )}
                </span>

                {locked ? (
                    <span
                        className="flex h-[1.625rem] w-[1.625rem] shrink-0 items-center justify-center rounded-full bg-[#B45309]/10 text-[#B45309] dark:bg-islamic-gold/15 dark:text-islamic-gold"
                        role="img"
                        aria-label={t('duaLockBadge')}
                    >
                        <Crown className="h-[0.875rem] w-[0.875rem]" />
                    </span>
                ) : state === 'memorized' ? (
                    <span
                        className="flex h-[1.625rem] w-[1.625rem] shrink-0 items-center justify-center rounded-full bg-islamic-green text-white dark:bg-islamic-gold dark:text-[#032e18]"
                        role="img"
                        aria-label={t('ezberBadgeMemorized')}
                    >
                        <Check className="h-[0.875rem] w-[0.875rem]" strokeWidth={3} />
                    </span>
                ) : state === 'due' ? (
                    <span className="shrink-0 rounded-full bg-[#B45309]/12 px-2.5 py-1 font-display text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#B45309] dark:bg-islamic-gold/15 dark:text-islamic-gold">
                        {t('ezberBadgeDue')}
                    </span>
                ) : state === 'learning' ? (
                    <span
                        className="shrink-0 font-display text-[0.8125rem] font-bold tabular-nums text-[#B45309] dark:text-islamic-gold"
                        aria-label={t('ezberBadgeProgressLabel', { done, total: lines })}
                    >
                        {done}/{lines}
                    </span>
                ) : null}
            </span>

            {/* İlerleme yalnız başlanmış surede — boş çubuk her kartta tekrar eden gürültü olurdu. */}
            {!locked && state === 'learning' && (
                <span className="mt-3 block h-[3px] w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
                    <span className="block h-full rounded-full bg-islamic-green dark:bg-islamic-gold" style={{ width: `${pct}%` }} />
                </span>
            )}
        </button>
    );
});

/**
 * Sureler = ezberlenen yer. Okuma/dinleme işini Kur'an sekmesi zaten daha iyi
 * yapıyor; burası sıralı bir okuma sihirbazı değil, ezber listesi.
 */
export default function SureList({ sures, progress, freeCount, onOpen }) {
    const { t } = useTranslation('learn');

    const rows = useMemo(() => sures.map((sure, i) => {
        const lines = buildLines(sure);
        const entry = progress[sureKey(sure.arabic)];
        return {
            id: `${i}-${sure.title}`,
            sure,
            // Besmele her surede aynı — ayırt eden ilk gerçek satır gösterilir.
            snippet: (lines[1] || lines[0])?.ar || sure.arabic,
            state: stateOf(entry),
            done: Math.min(entry?.done || 0, lines.length),
            lines: lines.length,
            locked: i >= freeCount,
        };
    }), [sures, progress, freeCount]);

    const memorized = rows.filter(r => r.state === 'memorized' || r.state === 'due').length;

    return (
        <div className="space-y-3">
            <p data-tour="sure-progress" className="px-1 text-[0.8125rem] text-stone-600 dark:text-emerald-100/55">
                {t('ezberListSummary', { n: memorized, total: rows.length })}
            </p>
            {rows.map((r, i) => (
                <SureCard key={r.id} {...r} tour={i === 0 ? 'sure-card' : undefined} onOpen={onOpen} />
            ))}
        </div>
    );
}
