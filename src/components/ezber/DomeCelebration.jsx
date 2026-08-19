import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { buildDomeSlots, DOME_ARCHES, DOME_VIEW, STAR_SOLID, STAR_HOLLOW } from '@/lib/ezberDome';

/** Levha köşe elmasları — uygulamanın kendi motifi. */
const CORNERS = ['-top-1 -start-1', '-top-1 -end-1', '-bottom-1 -start-1', '-bottom-1 -end-1'];

const Tile = ({ x, y, scale, kind, delay, reduceMotion }) => {
    // Konum DIŞTA, animasyon İÇTE: ikisi aynı elemana konursa CSS transform
    // translate'i ezer ve taşlar 0,0 noktasına yığılır.
    const inner = kind === 'solid'
        ? (
            <>
                <path d={STAR_SOLID.facet} fill="none" stroke="currentColor" strokeWidth="1.1" strokeOpacity="0.5" strokeLinejoin="round" />
                <path d={STAR_SOLID.body} fill="currentColor" fillRule="nonzero" />
            </>
        )
        : <path d={STAR_HOLLOW} fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />;

    return (
        <g transform={`translate(${x},${y}) scale(${scale})`}>
            <motion.g
                initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }}
                animate={{ opacity: kind === 'solid' ? 1 : 0.3, scale: 1 }}
                transition={reduceMotion ? { duration: 0 } : { delay, type: 'spring', stiffness: 320, damping: 18 }}
                className={kind === 'solid' ? 'drop-shadow-[0_0_4px_rgba(180,83,9,0.4)] dark:drop-shadow-[0_0_4px_rgba(212,175,55,0.45)]' : undefined}
            >
                {inner}
            </motion.g>
        </g>
    );
};

/**
 * Bitiş ekranı — ezber kubbesi.
 *
 * Her taş bir sure: ezberlediklerin dolu kesme yıldız, kalanlar aynı formun
 * boş konturu (kullanıcı seçimi). Bu turda kazanılan taşın yuvası, kullanıcı
 * basılı tutup yerine koyana kadar BOŞ ve nabız gibi atar — ödül kendiliğinden
 * belirmez, kullanıcı yerleştirir.
 */
export default function DomeCelebration({
    title,
    lineCount,
    /** Sure listesiyle AYNI sıradaki ezber durumu — her surenin kubbede sabit yeri var. */
    mask = [],
    /** Bu turda çalışılan surenin listedeki sırası (= kubbedeki yuvası). */
    slotIndex = -1,
    dueLabel,
    isNew,
    placed,
    headline,
}) {
    const { t } = useTranslation('learn');
    const reduceMotion = useReducedMotion();

    const total = mask.length;
    const { slots, scale } = useMemo(() => buildDomeSlots(total), [total]);
    const newIndex = isNew && slotIndex >= 0 && slotIndex < total ? slotIndex : -1;
    const memorized = useMemo(() => mask.filter(Boolean).length, [mask]);
    // Yıldız konmadan önce sayaç bir eksik durur; veri bozulsa bile negatife düşmez.
    const shownCount = Math.max(0, isNew && !placed ? memorized - 1 : memorized);

    return (
        <div className="flex flex-col items-center text-center">
            {/* Kubbe telefon genişliğine göre kurgulandı; geniş ekranda büyüyüp
                ekranı yutmasın diye hem genişlik hem yükseklik sınırlı. */}
            <div className="mx-auto mt-1 w-full max-w-[22rem] text-[#B45309] dark:text-islamic-gold">
                <svg viewBox={`0 0 ${DOME_VIEW.w} ${DOME_VIEW.h}`} className="block max-h-[34vh] w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                    <defs>
                        <radialGradient id="ezberDomeGlow">
                            <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
                            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    {/* Yıldız yerine oturunca kubbenin içi aydınlanır */}
                    <motion.ellipse
                        cx="173" cy="150" rx="160" ry="110" fill="url(#ezberDomeGlow)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: placed ? 1 : 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.9 }}
                    />

                    {DOME_ARCHES.map((d, i) => (
                        <motion.path
                            key={d}
                            d={d}
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeWidth={[1.1, 0.8, 0.6][i]}
                            opacity={[0.5, 0.28, 0.16][i]}
                            initial={reduceMotion ? false : { pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={reduceMotion ? { duration: 0 } : { duration: 1.2, delay: 0.05 + i * 0.12, ease: [0.3, 0.8, 0.3, 1] }}
                        />
                    ))}

                    {slots.map((s, i) => {
                        if (i === newIndex) {
                            return (
                                <g key={`slot-${i}`}>
                                    {/* Bekleyen yuva: boş kontur + nabız halkası */}
                                    {!placed && (
                                        <g transform={`translate(${s.x},${s.y}) scale(${scale})`}>
                                            <motion.g
                                                animate={reduceMotion ? { opacity: 0.35 } : { opacity: [0.25, 0.75, 0.25] }}
                                                transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
                                            >
                                                <path d={STAR_HOLLOW} fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
                                            </motion.g>
                                            {!reduceMotion && (
                                                <motion.circle
                                                    r="14" fill="none" stroke="currentColor" strokeWidth="1.1"
                                                    initial={{ scale: 0.7, opacity: 0.6 }}
                                                    animate={{ scale: [0.7, 1.7], opacity: [0.6, 0] }}
                                                    transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut' }}
                                                />
                                            )}
                                        </g>
                                    )}

                                    {/* Yerine oturan yıldız + patlama */}
                                    {placed && (
                                        <g transform={`translate(${s.x},${s.y}) scale(${scale})`}>
                                            <motion.circle
                                                r="24" fill="currentColor"
                                                initial={{ opacity: 0, scale: 0.4 }}
                                                animate={{ opacity: [0, 0.35, 0.16], scale: 1 }}
                                                transition={{ duration: reduceMotion ? 0 : 0.9, delay: reduceMotion ? 0 : 0.42 }}
                                                style={{ filter: 'blur(7px)' }}
                                            />
                                            {!reduceMotion && (
                                                <motion.circle
                                                    r="15" fill="none" stroke="currentColor" strokeWidth="1.6"
                                                    initial={{ scale: 0.4, opacity: 0.9 }}
                                                    animate={{ scale: 2.6, opacity: 0 }}
                                                    transition={{ duration: 1, delay: 0.42, ease: [0.1, 0.7, 0.3, 1] }}
                                                />
                                            )}
                                            <motion.g
                                                initial={reduceMotion ? false : { opacity: 0, y: -70, scale: 0.45, rotate: -40 }}
                                                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                                                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 240, damping: 15 }}
                                                className="drop-shadow-[0_0_5px_rgba(180,83,9,0.5)] dark:drop-shadow-[0_0_5px_rgba(212,175,55,0.55)]"
                                            >
                                                <path d={STAR_SOLID.facet} fill="none" stroke="currentColor" strokeWidth="1.1" strokeOpacity="0.5" strokeLinejoin="round" />
                                                <path d={STAR_SOLID.body} fill="currentColor" fillRule="nonzero" />
                                            </motion.g>
                                        </g>
                                    )}
                                </g>
                            );
                        }
                        return (
                            <Tile
                                key={`t-${i}`}
                                x={s.x} y={s.y} scale={scale}
                                kind={mask[i] ? 'solid' : 'hollow'}
                                delay={0.1 + i * 0.018}
                                reduceMotion={reduceMotion}
                            />
                        );
                    })}
                </svg>
            </div>

            <motion.h3
                className="mt-1 font-display text-[1.75rem] font-black leading-tight text-[#B45309] dark:text-islamic-gold"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.35 }}
            >
                {headline}
            </motion.h3>

            <motion.p
                className="mt-1.5 font-display text-[0.9375rem] font-semibold text-stone-800 dark:text-emerald-50"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.58, duration: 0.35 }}
            >
                {t('ezberDoneSub', { title, n: lineCount })}
            </motion.p>

            <motion.div
                className="mt-5 flex flex-col items-center"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.66, duration: 0.35 }}
            >
                <p className="flex items-baseline gap-1.5 font-display tabular-nums">
                    <motion.span
                        key={shownCount}
                        className="text-[2rem] font-black leading-none text-[#B45309] dark:text-islamic-gold"
                        initial={placed && isNew && !reduceMotion ? { scale: 1 } : false}
                        animate={placed && isNew && !reduceMotion ? { scale: [1, 1.35, 1] } : {}}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    >
                        {shownCount}
                    </motion.span>
                    <span className="text-[1.125rem] font-semibold leading-none text-stone-400 dark:text-emerald-100/40">/ {total}</span>
                </p>
                <p className="mt-1.5 font-display text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-stone-500 dark:text-emerald-100/50">
                    {t('ezberDoneProgress')}
                </p>
            </motion.div>

            {/* Sure yarım kaldıysa tekrar tarihi yoktur — o zaman levha yerine tek satır */}
            {!dueLabel && (
                <motion.p
                    className="mt-5 text-[0.8125rem] text-stone-500 dark:text-emerald-100/50"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.74, duration: 0.35 }}
                >
                    {t('ezberDoneKeep')}
                </motion.p>
            )}

            {dueLabel && (
                <motion.div
                    className="relative mt-4 w-full max-w-[20rem] rounded-[7px] border-[1.4px] border-[#B45309]/45 p-[7px] dark:border-islamic-gold/50"
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.74, duration: 0.4 }}
                >
                    {CORNERS.map(pos => (
                        <span key={pos} aria-hidden="true" className={cn('absolute h-[7px] w-[7px] rotate-45 bg-[#B45309] dark:bg-islamic-gold', pos)} />
                    ))}
                    <div className="rounded-[4px] border-[0.8px] border-[#B45309]/25 bg-black/[0.03] px-4 py-3 text-center dark:border-islamic-gold/25 dark:bg-black/20">
                        <span className="block font-display text-[0.5625rem] font-bold uppercase tracking-[0.22em] text-stone-500 dark:text-emerald-100/45">
                            {t('ezberDoneNextLabel')}
                        </span>
                        <span className="mt-1 block font-display text-[1.0625rem] font-bold text-stone-800 dark:text-white">{dueLabel}</span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
