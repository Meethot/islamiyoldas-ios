import { LocalNotifications } from '@capacitor/local-notifications';
import { dueList, readProgress } from '@/lib/ezber';

/**
 * Ezber tekrar hatırlatması — TARİHLİ ve TEKİL.
 *
 * Uygulamadaki diğer hatırlatmalar `every: 'day'` ile her gün çalar; burada o
 * yanlış olurdu: tekrar günü olmayan bir günde "tekrar et" demek güveni bitirir.
 * Bu yüzden yalnız gerçekten tekrar günü olan tarihlere tek atışlık bildirim
 * kurulur ve her planlamada eskiler iptal edilir.
 *
 * ID aralığı 5100-5109 — kullanılan aralıklar: 1-35 ezan, 100-114 ön hatırlatma,
 * 1001-1003 ayet, 2000 cuma, 3000 zikir, 4000 sahur.
 */
const ID_BASE = 5100;
const MAX_REMINDERS = 8;
const HOUR = 20;

const ids = Array.from({ length: MAX_REMINDERS }, (_, i) => ({ id: ID_BASE + i }));

/** Bir tarihi (yyyy-mm-dd) yerel saatle akşam 20:00'ye çevirir. */
function atEvening(dateStr) {
    const [y, m, d] = String(dateStr).split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, HOUR, 0, 0, 0);
}

/**
 * Tekrar günü gelen/gelecek sureler için bildirimleri yeniden kurar.
 * @param {(key: string) => string|null} titleOf sure anahtarından başlık üretir
 * @param {{title: string, body: (n: number) => string}} texts yerelleştirilmiş metinler
 */
export async function rescheduleEzberReminders(titleOf, texts) {
    try {
        await LocalNotifications.cancel({ notifications: ids });
    } catch {
        // izin yok / web: sessizce geç
    }

    const progress = readProgress();
    const now = new Date();
    const upcoming = Object.entries(progress)
        .filter(([, v]) => v.lines > 0 && v.done >= v.lines && v.due)
        .map(([k, v]) => ({ key: k, at: atEvening(v.due) }))
        .filter(x => x.at && x.at > now)
        .sort((a, b) => a.at - b.at);

    // Aynı güne düşen sureler tek bildirimde toplanır — arka arkaya çalmasın.
    // Sınır GÜN sayısına uygulanır, sureye değil: aynı güne düşen 8 sure eskiden
    // bütün kotayı yiyip sonraki günlerin hatırlatmasını sildiriyordu.
    const byDay = new Map();
    for (const item of upcoming) {
        const dayKey = item.at.toDateString();
        if (!byDay.has(dayKey)) byDay.set(dayKey, { at: item.at, keys: [] });
        byDay.get(dayKey).keys.push(item.key);
    }

    const notifications = [...byDay.values()].slice(0, MAX_REMINDERS).map((day, i) => {
        const first = titleOf(day.keys[0]);
        return {
            id: ID_BASE + i,
            title: texts.title,
            body: day.keys.length > 1 && first
                ? texts.bodyMany(first, day.keys.length - 1)
                : texts.bodyOne(first || ''),
            schedule: { at: day.at, allowWhileIdle: true },
            smallIcon: 'ic_stat_icon_config_sample',
            extra: { type: 'ezber_review', route: '/learn' },
        };
    }).filter(n => n.body);

    if (!notifications.length) return 0;
    try {
        await LocalNotifications.schedule({ notifications });
        return notifications.length;
    } catch {
        return 0;
    }
}

/** Bugün tekrarı gelenlerin sayısı — rozet/satır için. */
export function dueCount() {
    return dueList(readProgress()).length;
}
