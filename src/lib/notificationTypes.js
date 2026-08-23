/**
 * Bildirim ID'sini analytics kategorisine çevirir.
 *
 * TEK KAYNAK. Yeni bildirim aralığı eklerken burayı da güncelle, yoksa olay
 * sessizce 'other'a düşer — sahur (4000), ezber (5100-5107) ve mest
 * (5200-5201) tam olarak böyle kaçmıştı.
 *
 * Kullanımdaki aralıklar: 1-35 ezan, 100-114 ön hatırlatma, 1001-1003 ayet,
 * 2000 cuma, 3000 zikir, 4000 sahur, 5100-5107 ezber, 5200-5201 mest.
 *
 * @param {number|undefined} id bildirim ID'si
 * @param {string|undefined} extraType `extra.type` varsa o kazanır (bildirimi
 *        kuran taraf kendi adını verir; ID aralığından tahmin etmekten kesin)
 * @returns {string} analytics kategorisi
 */
export function notificationTypeOf(id, extraType) {
    if (typeof extraType === 'string' && extraType) return extraType;
    if (typeof id !== 'number' || !Number.isFinite(id)) return 'other';
    if (id >= 1 && id <= 45) return 'prayer';
    if (id >= 100 && id <= 114) return 'pre_reminder';
    if (id >= 1001 && id <= 1003) return 'verse';
    if (id === 2000) return 'friday';
    if (id === 3000) return 'dhikr';
    if (id === 4000) return 'sahur';
    if (id >= 5100 && id <= 5107) return 'ezber';
    if (id === 5200 || id === 5201) return 'mest';
    return 'other';
}
