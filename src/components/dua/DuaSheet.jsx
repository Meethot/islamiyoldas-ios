import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls, useReducedMotion } from 'framer-motion';
import { ChevronLeft, Crown, Heart, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';
import { useHardwareBack } from '@/hooks/useHardwareBack';

/**
 * Arapça metin uzadıkça punto küçülür; satır aralığı her boyda geniş kalır
 * (hareke üst üste binmesin). Sihirbazdaki kopyadan bağımsızdır — sihirbaza
 * dokunmama kuralı.
 */
function arabicTypeClass(text) {
    const len = (text || '').length;
    if (len <= 60) return 'text-[1.95rem] leading-[2.3]';
    if (len <= 140) return 'text-[1.6rem] leading-[2.35]';
    if (len <= 280) return 'text-[1.35rem] leading-[2.4]';
    return 'text-[1.15rem] leading-[2.45]';
}

/** Etiketli metin bloğu (OKUNUŞU / ANLAMI / İPUÇLARI). */
const FieldBlock = ({ label, className, children }) => (
    <div className={className}>
        <p className="mb-1.5 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-black/55 dark:text-emerald-100/55">
            {label}
        </p>
        {children}
    </div>
);

/** Levhanın dört köşesindeki elmas süsler. */
const CORNERS = ['-top-1 -start-1', '-top-1 -end-1', '-bottom-1 -start-1', '-bottom-1 -end-1'];

const ICON_BTN = 'flex h-10 w-10 items-center justify-center rounded-full text-stone-500 transition-colors active:bg-black/[0.05] dark:text-emerald-100/70 dark:active:bg-white/10';

/**
 * Tek duanın okuma tabakası — sayfa değiştirmeden alttan açılır.
 *
 * Route DEĞİL: `useSmartPaywall` her route değişiminde sayaç artırıyor,
 * birkaç dua gezen kullanıcı zorla paywall'a düşerdi. Portal + in-page state
 * hem bunu hem liste kaydırma konumunu korur.
 */
export default function DuaSheet({ dua, locked, lockedCount, favorite, related = [], isRtl, onClose, onToggleFavorite, onOpenRelated, onGoPremium }) {
    const { t, i18n } = useTranslation('learn');
    const { light, success } = useHaptics();
    const dragControls = useDragControls();
    const reduceMotion = useReducedMotion();
    const panelRef = useRef(null);

    const open = !!dua;

    // Android donanım geri tuşu tabakayı kapatır (yoksa uygulamadan çıkardı)
    useHardwareBack(open, onClose);

    /**
     * Alttaki liste kaymasın. Temizlik effect'in return'ünde: `/premium`'a
     * gidilip bileşen sökülse bile kaydırma kabı kilitli kalmaz.
     */
    useEffect(() => {
        if (!open) return;
        const el = document.getElementById('main-scroll-container');
        if (!el) return;
        const saved = el.scrollTop;
        el.style.overflow = 'hidden';
        return () => {
            el.style.overflow = '';
            requestAnimationFrame(() => { el.scrollTop = saved; });
        };
    }, [open]);

    // Komşu duaya geçince baştan okunsun
    useEffect(() => {
        if (panelRef.current) panelRef.current.scrollTop = 0;
    }, [dua?.arabic]);

    const handleShare = useCallback(async () => {
        if (!dua) return;
        light();
        const platform = Capacitor.getPlatform();
        let appLink = 'https://islamiyoldas.com';
        if (platform === 'ios') appLink = 'https://apps.apple.com/app/id6759666173';
        else if (platform === 'android') appLink = 'https://play.google.com/store/apps/details?id=com.islamiyoldas.app';

        const body = [dua.title, dua.arabic, dua.transcription, dua.meaning, t('duaShareFooter', { link: appLink })]
            .filter(Boolean)
            .join('\n\n');

        try {
            // DuaKosesi kalıbı: iOS `title`/`url`'ü ayrı öğe sayıp "2 Öğe" yazıyor,
            // o yüzden sadece `text` gönderiliyor.
            const { Share } = await import('@capacitor/share');
            await Share.share({ text: body, dialogTitle: t('duaShareDialogTitle') });
        } catch {
            if (navigator.share) {
                try { await navigator.share({ text: body }); } catch { /* kullanıcı iptal etti */ }
            }
        }
    }, [dua, light, t]);

    const spring = reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 34 };
    const fade = reduceMotion ? { duration: 0 } : { duration: 0.16, ease: 'easeOut' };

    // AR arayüzde `meaning` gerçek meal değil, Arapça metnin harekesiz hali — gizlenir
    const showMeaning = !!dua?.meaning && i18n.language?.split('-')[0] !== 'ar';

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[100]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={fade}
                >
                    <div className="absolute inset-0 bg-black/50" onClick={onClose} />

                    <motion.div
                        data-sheet
                        className="absolute inset-x-0 bottom-0 flex h-[92vh] flex-col rounded-t-[2rem] bg-[#F6F0E1] shadow-[0_-8px_40px_-10px_rgba(0,0,0,0.35)] dark:bg-[#032e18]"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%', transition: reduceMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeIn' } }}
                        transition={spring}
                        drag="y"
                        dragListener={false}
                        dragControls={dragControls}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.4 }}
                        onDragEnd={(_e, info) => {
                            if (info.offset.y > 120 || info.velocity.y > 600) onClose();
                        }}
                    >
                        {/* Sürükleme YALNIZ tutamaktan başlar — buton satırından değil
                            (dokunuşu yutardı), içerikten de değil (uzun metnin
                            ortasında tabaka kapanırdı). */}
                        <div
                            className="shrink-0 cursor-grab touch-none pt-3 pb-1"
                            onPointerDown={(e) => dragControls.start(e)}
                        >
                            <div className="mx-auto h-1 w-10 rounded-full bg-[#E2D9C4] dark:bg-white/15" />
                        </div>

                        <div className="flex shrink-0 items-center justify-between px-3 pb-1">
                            <button type="button" onClick={onClose} aria-label={t('duaClose')} className={ICON_BTN}>
                                <ChevronLeft className={cn('h-5 w-5', isRtl && 'rotate-180')} />
                            </button>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    data-tour="dua-favorite"
                                    onClick={() => { success(); onToggleFavorite(dua); }}
                                    aria-label={favorite ? t('duaFavRemove') : t('duaFavAdd')}
                                    aria-pressed={favorite}
                                    className={ICON_BTN}
                                >
                                    <motion.span
                                        key={favorite ? 'on' : 'off'}
                                        initial={reduceMotion ? false : { scale: 1 }}
                                        animate={reduceMotion ? {} : { scale: [1, 1.15, 1] }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <Heart className={cn('h-5 w-5', favorite && 'fill-current text-islamic-green dark:text-islamic-gold')} />
                                    </motion.span>
                                </button>

                                {!locked && (
                                    <button type="button" onClick={handleShare} aria-label={t('duaShare')} className={ICON_BTN}>
                                        <Share2 className="h-[1.15rem] w-[1.15rem]" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div ref={panelRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)]">
                            <h2 className="font-display text-[1.375rem] font-bold tracking-tight text-balance text-stone-900 dark:text-emerald-50">
                                {dua.title}
                            </h2>
                            {dua.instruction && (
                                <p className="mt-1 text-[0.875rem] leading-relaxed text-stone-500 dark:text-emerald-100/60">
                                    {dua.instruction}
                                </p>
                            )}

                            {/* Levha: duvara asılan hat levhası gibi çift çerçeve ve
                                köşe elmasları. Dış çerçeve kalın altın, iç çerçeve ince. */}
                            <div className="mt-5 rounded-md border border-[#B45309]/50 p-[0.5625rem] dark:border-islamic-gold/55">
                                <div className="relative rounded-[0.1875rem] border border-[#B45309]/30 bg-black/[0.03] px-4 py-7 dark:border-islamic-gold/30 dark:bg-black/20">
                                    {CORNERS.map(pos => (
                                        <span
                                            key={pos}
                                            aria-hidden="true"
                                            className={cn(
                                                'absolute h-[0.4375rem] w-[0.4375rem] rotate-45 border border-[#B45309]/70 dark:border-islamic-gold/70',
                                                pos
                                            )}
                                        />
                                    ))}
                                    <p
                                        dir="rtl"
                                        lang="ar"
                                        className={cn('break-words text-center font-arabic text-[#92400E] dark:text-islamic-gold', arabicTypeClass(dua.arabic))}
                                    >
                                        {dua.arabic}
                                    </p>
                                </div>
                            </div>

                            {locked ? (
                                <div className="mt-5 rounded-2xl border border-islamic-gold/25 bg-islamic-gold/10 p-4 dark:bg-islamic-gold/[0.07]">
                                    <div className="flex items-start gap-2.5">
                                        <Crown className="mt-0.5 h-4 w-4 shrink-0 text-[#B45309] dark:text-islamic-gold" />
                                        <div className="min-w-0">
                                            <p className="font-display text-[0.9375rem] font-semibold text-stone-800 dark:text-emerald-50">
                                                {t('duaLockTitle')}
                                            </p>
                                            <p className="mt-1 text-[0.8125rem] text-stone-500 dark:text-emerald-100/60">
                                                {t('duaLockSub', { n: lockedCount })}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onGoPremium}
                                        className="mt-3.5 h-12 w-full rounded-2xl bg-islamic-green text-[0.9375rem] font-bold text-white transition-transform active:scale-[0.98] dark:bg-islamic-gold dark:text-[#021a0f]"
                                    >
                                        {t('duaLockCta')}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {dua.transcription && (
                                        <FieldBlock label={t('translitLabel')} className="mt-6">
                                            <p dir="ltr" className="text-start text-[0.9375rem] font-medium leading-relaxed text-stone-700 dark:text-emerald-100/85">
                                                {dua.transcription}
                                            </p>
                                        </FieldBlock>
                                    )}

                                    {showMeaning && (
                                        <FieldBlock label={t('meaningLabel')} className="mt-5 border-t border-black/[0.07] pt-4 dark:border-white/[0.09]">
                                            {/* Meal sayfanın en parlak metni — asıl okunacak şey o. */}
                                            <p className="text-[0.9375rem] leading-relaxed text-stone-900 dark:text-white">
                                                {dua.meaning}
                                            </p>
                                        </FieldBlock>
                                    )}

                                    {dua.tips?.length > 0 && (
                                        <FieldBlock label={t('tipsTitle')} className="mt-6 rounded-2xl border border-[#B45309]/25 p-4 dark:border-islamic-gold/25">
                                            <ul className="space-y-2">
                                                {dua.tips.map((tip, i) => (
                                                    <li key={i} className="flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-stone-600 dark:text-emerald-100/60">
                                                        <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-[#B45309] dark:bg-islamic-gold" />
                                                        <span>{tip}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </FieldBlock>
                                    )}
                                </>
                            )}

                            {related.length > 0 && (
                                <FieldBlock label={t('duaRelated')} className="mt-7">
                                    <div className="-mx-6 flex gap-2 overflow-x-auto scrollbar-hide px-6">
                                        {related.map(r => (
                                            <button
                                                key={r.arabic}
                                                type="button"
                                                onClick={() => onOpenRelated(r)}
                                                className="min-h-[2.5rem] shrink-0 whitespace-nowrap rounded-full bg-[#F0E8D5] px-3.5 font-display text-[0.8125rem] font-medium text-stone-600 transition-colors active:bg-[#E9DFC8] dark:bg-white/5 dark:text-emerald-100/70 dark:active:bg-white/10"
                                            >
                                                {r.title}
                                            </button>
                                        ))}
                                    </div>
                                </FieldBlock>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
