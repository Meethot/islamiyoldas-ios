import { memo } from 'react';
import { Crown, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * Arapça şerit tek satırda kalır; sığmayan kısım kesilmez, SÖNER.
 * Üç nokta (…) Arapça hatta çirkin duruyor. Yön RTL olduğu için metin sağdan
 * başlar, taşma solda olur — maske de soldan açılır.
 */
const FADE = {
    WebkitMaskImage: 'linear-gradient(to left, #000 62%, transparent 100%)',
    maskImage: 'linear-gradient(to left, #000 62%, transparent 100%)',
};

/** Mihrap kemeri — üç iç içe kemer, kartın üst köşesinde soluk tezhip. */
export const MihrabArch = (props) => (
    <svg viewBox="0 0 100 130" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" {...props}>
        <path d="M50 8c22 0 38 17 38 39v78H12V47C12 25 28 8 50 8z" />
        <path d="M50 20c16 0 27 12 27 28v68H23V48c0-16 11-28 27-28z" />
        <path d="M50 33c9 0 16 7 16 17v55H34V50c0-10 7-17 16-17z" />
    </svg>
);

/**
 * Raftaki tek dua kartı — "mihrap" tarzı (kullanıcı seçimi, 6 yön arasından).
 *
 * `compact`: yatay rafta kullanılan dar sürüm. Amaç satırı gizlenir (dar kartta
 * tek kelimeye düşerdi) ve kart kabın boyuna uzar — aynı raftaki kartların
 * hepsi eşit yükseklikte durur.
 */
const DuaRow = memo(function DuaRow({ dua, sectionId, locked, favorite, compact = false, onOpen }) {
    const { t } = useTranslation('learn');

    return (
        <button
            type="button"
            onClick={() => onOpen(dua, sectionId)}
            className={cn(
                'relative w-full overflow-hidden rounded-2xl border border-[#B45309]/25 bg-[linear-gradient(160deg,#FFFDF6_0%,#F4EBD8_100%)] p-4 text-start transition-transform duration-100 active:scale-[0.985] dark:border-islamic-gold/30 dark:bg-[linear-gradient(160deg,#073b21_0%,#04240f_100%)]',
                compact && 'flex h-full flex-col'
            )}
        >
            {/* Dar kartta kemer küçülür ve soluklaşır; Arapça satıra kendi
                şeridi (ps-11) bırakılır — yoksa hat kemerin içine giriyor. */}
            <MihrabArch className={cn(
                'pointer-events-none absolute text-[#92400E]/25 dark:text-islamic-gold/35',
                compact
                    ? '-top-1.5 -end-1.5 h-[4.5rem] w-[3.5rem] opacity-40'
                    : '-top-3 -end-2 h-[6rem] w-[4.75rem] opacity-45'
            )} />

            <span
                dir="rtl"
                lang="ar"
                style={FADE}
                className={cn(
                    'block overflow-hidden whitespace-nowrap font-arabic text-[1.1875rem] leading-[2] text-[#92400E] dark:text-islamic-gold',
                    compact ? 'ps-11 text-[1.0625rem]' : 'ps-14'
                )}
            >
                {dua.arabic}
            </span>

            <span className={cn(
                'block h-px bg-gradient-to-r from-[#92400E]/35 to-transparent rtl:bg-gradient-to-l dark:from-islamic-gold/45',
                compact ? 'my-3' : 'my-[0.7rem]'
            )} />

            <span className={cn('flex items-center gap-3', compact && 'mt-auto')}>
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                        <span className="min-w-0 font-display text-[0.9375rem] font-semibold leading-snug text-balance line-clamp-2 text-stone-800 dark:text-white">
                            {dua.title}
                        </span>
                        {favorite && (
                            <Heart
                                className="h-3 w-3 shrink-0 fill-current text-islamic-green dark:text-islamic-gold"
                                role="img"
                                aria-label={t('duaFavorites')}
                            />
                        )}
                    </span>
                    {!compact && dua.instruction && (
                        <span className="mt-1 block text-[0.78125rem] leading-snug line-clamp-1 text-black/45 dark:text-emerald-100/45">
                            {dua.instruction}
                        </span>
                    )}
                </span>

                {locked && (
                    <span
                        className="flex h-[1.625rem] w-[1.625rem] shrink-0 items-center justify-center rounded-full bg-[#B45309]/10 text-[#B45309] dark:bg-islamic-gold/15 dark:text-islamic-gold"
                        role="img"
                        aria-label={t('duaLockBadge')}
                    >
                        <Crown className="h-[0.875rem] w-[0.875rem]" />
                    </span>
                )}
            </span>
        </button>
    );
});

export default DuaRow;
