import { VERDICT } from '@/data/wuduBreakers';

/**
 * Hükmün görsel dili — tek kaynak.
 *
 * İki yer okur: "Bozar mı?" tabakası (liste + bölüm bandı) ve Öğren > Abdest
 * merkezinin arama sonuçları. Ayrı ayrı tutulsaydı iki ekran aynı hükmü
 * farklı renkte gösterirdi.
 *
 * KURAL: renk tek başına taşıyıcı DEĞİL. Nokta yalnız ritim verir; hükmün adı
 * her zaman yazılı durur (pil, bölüm bandı ya da `sr-only`). Gündüz temasında
 * yeşil yok — kehribar #B45309, gece islamic-gold.
 */

/** Satır başındaki 8px hüküm noktası. Halka `border-[1.5px]`: 2px'te delik
 *  kapanıp dolu noktaya benziyordu. */
export const VERDICT_DOT = {
    [VERDICT.BREAKS]: 'bg-[#B45309] dark:bg-islamic-gold',
    [VERDICT.KEEPS]: 'bg-black/30 dark:bg-white/25',
    [VERDICT.DEPENDS]: 'border-[1.5px] border-[#B45309] dark:border-islamic-gold',
};

/** Hükmü yazılı taşıyan pil — yalnız karışık listelerde gösterilir. */
export const VERDICT_PILL = {
    [VERDICT.BREAKS]: 'bg-[#B45309] text-white dark:bg-islamic-gold dark:text-[#032e18]',
    [VERDICT.KEEPS]: 'bg-black/[0.06] text-black/55 dark:bg-white/10 dark:text-emerald-100/60',
    [VERDICT.DEPENDS]: 'border border-dashed border-[#B45309]/70 text-[#92400E] dark:border-islamic-gold/70 dark:text-islamic-gold',
};

/** Bölüm başlığı rengi. */
export const VERDICT_BAND = {
    [VERDICT.BREAKS]: 'text-[#B45309] dark:text-islamic-gold',
    [VERDICT.DEPENDS]: 'text-stone-700 dark:text-emerald-100/75',
    [VERDICT.KEEPS]: 'text-black/40 dark:text-emerald-100/40',
};
