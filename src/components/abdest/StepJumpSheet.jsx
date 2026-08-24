import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls, useReducedMotion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import { wuduMeta } from '@/data/wuduSteps';

const ICON_BTN = 'flex h-10 w-10 items-center justify-center rounded-full text-stone-500 transition-colors active:bg-black/[0.05] dark:text-emerald-100/70 dark:active:bg-white/10';

/**
 * Hüküm noktası. Renk tek taşıyıcı DEĞİL: satırın metninde hüküm adı da yazar
 * (`sr-only` değil, görünür sağ sütun) — renk körlüğü ve gündüz temasındaki
 * kehribar/altın ayrımı için ikinci kanal şart.
 */
const DOT = {
    farz: 'bg-[#B45309] dark:bg-islamic-gold',
    sunnet: 'border-[1.5px] border-[#B45309]/55 dark:border-islamic-gold/55',
    mustehab: 'border-[1.5px] border-[#B45309]/35 opacity-70 dark:border-islamic-gold/35',
};

/**
 * "Adıma git" tabakası.
 *
 * ADIM yönünün kabul edilen tek zayıflığının cevabı: "boynumu meshetmiş
 * miydim" sorusunun cevabı 12. karttaydı ve oraya ulaşmak 11 kaydırma
 * istiyordu — günde beş kez tekrarlanan bir işlemde en sık gelen soru bu.
 * Artık künyeye dokunmak yeter: O(n) gezinme O(1) seçime iner.
 *
 * Route DEĞİL, portal: `useSmartPaywall` her route değişiminde sayaç artırıyor.
 * Sihirbaz kabuğunu paylaşan gusül, teyemmüm ve namaz rehberleri de kazanır.
 */
export default function StepJumpSheet({ open, steps, current, guideTitle, isRtl, onPick, onClose }) {
    const { t } = useTranslation('learn');
    const { selection } = useHaptics();
    const dragControls = useDragControls();
    const reduceMotion = useReducedMotion();

    // Android donanım geri tuşu tabakayı kapatır (yoksa uygulamadan çıkardı).
    useHardwareBack(open, onClose);

    const spring = reduceMotion
        ? { duration: 0 }
        : { type: 'spring', damping: 32, stiffness: 320 };

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[105] bg-black/45"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.18 }}
                    onClick={onClose}
                >
                    <motion.div
                        data-sheet
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('stepJumpTitle')}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute inset-x-0 bottom-0 flex max-h-[80vh] flex-col rounded-t-[2rem] bg-[#F6F0E1] shadow-[0_-8px_40px_-10px_rgba(0,0,0,0.35)] dark:bg-[#032e18]"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%', transition: reduceMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeIn' } }}
                        transition={spring}
                        drag="y"
                        dragListener={false}
                        dragControls={dragControls}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.4 }}
                        onDragEnd={(_e, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose(); }}
                    >
                        <div className="shrink-0 cursor-grab touch-none pb-1 pt-3" onPointerDown={(e) => dragControls.start(e)}>
                            <div className="mx-auto h-1 w-10 rounded-full bg-[#E2D9C4] dark:bg-white/15" />
                        </div>

                        <div className="flex shrink-0 items-center gap-1 px-3 pb-2">
                            <button type="button" onClick={onClose} aria-label={t('duaClose')} className={ICON_BTN}>
                                <ChevronLeft className={cn('h-5 w-5', isRtl && 'rotate-180')} />
                            </button>
                            <span className="truncate font-display text-[1.0625rem] font-bold text-stone-800 dark:text-emerald-50">
                                {guideTitle || t('stepJumpTitle')}
                            </span>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                            <ul className="divide-y divide-[#E2D9C4] dark:divide-white/[0.08]">
                                {steps.map((st, i) => {
                                    const rank = wuduMeta(st)?.rank;
                                    const active = i === current;
                                    return (
                                        <li key={st.id || i}>
                                            <button
                                                type="button"
                                                aria-current={active ? 'step' : undefined}
                                                onClick={() => { selection(); onPick(i); }}
                                                className={cn(
                                                    'flex w-full items-center gap-3 py-3 text-start transition-colors',
                                                    active && 'text-[#B45309] dark:text-islamic-gold'
                                                )}
                                            >
                                                <span className={cn(
                                                    'w-7 shrink-0 text-[0.8125rem] font-bold tabular-nums',
                                                    active ? 'text-[#B45309] dark:text-islamic-gold' : 'text-black/35 dark:text-emerald-100/35'
                                                )}>
                                                    {String(i + 1).padStart(2, '0')}
                                                </span>

                                                <span className={cn(
                                                    'min-w-0 flex-1 truncate text-[0.9375rem]',
                                                    active ? 'font-bold' : 'font-medium text-stone-800 dark:text-emerald-50'
                                                )}>
                                                    {st.title}
                                                </span>

                                                {st.repeat && (
                                                    <span className="shrink-0 text-[0.6875rem] font-bold tabular-nums text-black/35 dark:text-emerald-100/35">
                                                        {st.repeat}
                                                    </span>
                                                )}

                                                {rank && (
                                                    <span className="shrink-0 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-black/40 dark:text-emerald-100/40">
                                                        {t(rank === 'farz' ? 'rankFarz' : rank === 'sunnet' ? 'rankSunnet' : 'rankMustehab')}
                                                    </span>
                                                )}

                                                <span
                                                    aria-hidden="true"
                                                    className={cn('h-2 w-2 shrink-0 rounded-full', rank ? DOT[rank] : 'bg-transparent')}
                                                />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
