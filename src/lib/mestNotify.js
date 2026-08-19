import { LocalNotifications } from '@capacitor/local-notifications';
import { limitFor } from '@/lib/mestMesh';

/**
 * Mest mesh süresi hatırlatmaları — iki tek atışlık bildirim.
 *
 * `every: 'day'` KULLANILMAZ: süre bir kez dolar, her gün "süren doldu" demek
 * güveni bitirir (ezber hatırlatmalarında da aynı gerekçe geçerliydi).
 *
 * ID aralığı 5200-5201. Kullanılan diğer aralıklar: 1-35 ezan, 100-114 ön
 * hatırlatma, 1001-1003 ayet, 2000 cuma, 3000 zikir, 4000 sahur,
 * 5100-5107 ezber. iOS'un 64 bildirim bütçesinde yer var.
 */
const ID_WARN = 5200;
const ID_END = 5201;
const WARN_BEFORE_MS = 3600 * 1000;

/**
 * Bildirime dokunan kullanıcı doğrudan mesh ekranına düşmeli.
 * Düz `/learn` yolu Öğren'i varsayılan sekmesinde (Dualar) açıyordu:
 * "Mesh süren bitmek üzere" bildirimine dokunup dua listesi görmek
 * bildirimi anlamsız kılar.
 */
const MEST_ROUTE = '/learn?abdest=mesh';

const ids = [{ id: ID_WARN }, { id: ID_END }];

/** Kurulu mest bildirimlerini kaldırır. */
export async function cancelMestReminders() {
    try {
        await LocalNotifications.cancel({ notifications: ids });
    } catch {
        // izin yok / web: sessizce geç
    }
}

/**
 * Süreye göre bildirimleri yeniden kurar. Süre yoksa ya da dolmuşsa yalnız
 * iptal eder.
 *
 * @param {{startedAt:number,traveler:boolean,switchedAt:number|null}|null} state
 * @param {{warnTitle:string,warnBody:string,endTitle:string,endBody:string}} texts
 * @returns {Promise<number>} kurulan bildirim sayısı
 */
export async function rescheduleMestReminders(state, texts, now = Date.now()) {
    await cancelMestReminders();
    if (!state) return 0;

    const limit = limitFor(state);
    if (limit <= 0) return 0;

    const endAt = state.startedAt + limit;
    const warnAt = endAt - WARN_BEFORE_MS;

    const notifications = [];
    // Uyarı bildirimi yalnız geleceğe kurulur; son bir saatin içinde sayaç
    // açılırsa uyarı atlanır, bitiş bildirimi yine kurulur.
    if (warnAt > now) {
        notifications.push({
            id: ID_WARN,
            title: texts.warnTitle,
            body: texts.warnBody,
            schedule: { at: new Date(warnAt), allowWhileIdle: true },
            smallIcon: 'ic_stat_icon_config_sample',
            extra: { type: 'mest_warn', route: MEST_ROUTE },
        });
    }
    if (endAt > now) {
        notifications.push({
            id: ID_END,
            title: texts.endTitle,
            body: texts.endBody,
            schedule: { at: new Date(endAt), allowWhileIdle: true },
            smallIcon: 'ic_stat_icon_config_sample',
            extra: { type: 'mest_end', route: MEST_ROUTE },
        });
    }

    if (!notifications.length) return 0;
    try {
        await LocalNotifications.schedule({ notifications });
        return notifications.length;
    } catch {
        return 0;
    }
}
