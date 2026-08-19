/**
 * Kur'an dinleme denemesi — kullanıcı başına BİR KEZ, 60 saniye.
 *
 * Amaç: ücretsiz kullanıcı kelime-senkron takibi (karaoke) bir kez canlı görsün.
 * Tanıtım ipucu play tuşunu gösterir, kullanıcı basınca deneme başlar.
 *
 * ÖNEMLİ: `isPremium()` ASLA değiştirilmez. Deneme yalnızca DİNLEME kapılarını
 * açar — kaydetme (bookmark), paylaşım temaları, kaza hedefi, murakabe soruları
 * ve diğer her şey premium olarak kalır. Bunun için ayrı bir yetki fonksiyonu var:
 * `canListen()`. Dinleme dışı hiçbir yerde kullanılmamalı.
 */
import { isPremium } from '@/services/creditService';

export const TRIAL_MS = 60_000;
export const TRIAL_EVENT = 'quranTrialChanged';
/** Süre dolduğu AN yayınlanır — dinleyen her ekran çalan sesi durdurur. */
export const TRIAL_ENDED_EVENT = 'quranTrialEnded';

const KEY = 'quran_listen_trial_at';

function startedAt() {
    try {
        const raw = Number(localStorage.getItem(KEY));
        return Number.isFinite(raw) && raw > 0 ? raw : 0;
    } catch {
        return 0;
    }
}

/** Deneme daha önce kullanıldı mı (süresi dolmuş olsa bile)? */
export function hasUsedTrial() {
    return startedAt() > 0;
}

/**
 * Kalan süre (ms). Cihaz saati geri alınırsa süre uzamasın diye TRIAL_MS ile kırpılır.
 */
export function trialRemainingMs() {
    const started = startedAt();
    if (!started) return 0;
    const left = started + TRIAL_MS - Date.now();
    if (left <= 0) return 0;
    return Math.min(left, TRIAL_MS);
}

export function isTrialActive() {
    return trialRemainingMs() > 0;
}

/** Denemeyi hiç kullanmamış, premium olmayan kullanıcı */
export function isTrialEligible() {
    return !isPremium() && !hasUsedTrial();
}

/**
 * DİNLEME yetkisi: premium ya da süren deneme.
 * Yalnızca ses çalma kapılarında kullanılır — başka premium özellik için DEĞİL.
 */
export function canListen() {
    return isPremium() || isTrialActive();
}

/**
 * Denemeyi başlatır. Zaten kullanılmışsa veya kullanıcı premium ise hiçbir şey yapmaz.
 * @returns {boolean} deneme bu çağrıyla başladıysa true
 */
/**
 * Süre dolduğunda TRIAL_ENDED_EVENT'i yayınlayan tek zamanlayıcı.
 *
 * Neden ekranlarda değil de burada: kullanıcı sesi sure listesinden başlatıp başka
 * ekrana geçebilir. Sayacı ekrana bağlarsak o ekran sökülünce sayaç da ölür ve ses
 * 60 saniyeden sonra da çalmaya devam ederdi. Burada tek yerde durur.
 */
let endTimer = null;
function armWatchdog() {
    clearTimeout(endTimer);
    const left = trialRemainingMs();
    if (left <= 0) return;
    endTimer = setTimeout(() => {
        endTimer = null;
        window.dispatchEvent(new CustomEvent(TRIAL_ENDED_EVENT));
        window.dispatchEvent(new CustomEvent(TRIAL_EVENT));
    }, left);
}

// Uygulama açılışında deneme hâlâ sürüyorsa (kapatılıp açıldı) sayaç yeniden kurulur
if (typeof window !== 'undefined') {
    armWatchdog();
    // Arka plandan dönüşte setTimeout gecikmiş olabilir; süre dolduysa hemen bildir
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        if (endTimer && trialRemainingMs() <= 0) {
            clearTimeout(endTimer);
            endTimer = null;
            window.dispatchEvent(new CustomEvent(TRIAL_ENDED_EVENT));
            window.dispatchEvent(new CustomEvent(TRIAL_EVENT));
        }
    });
}

export function startTrial() {
    if (!isTrialEligible()) return false;
    try {
        localStorage.setItem(KEY, String(Date.now()));
    } catch {
        // kota dolu / gizli mod: deneme bu oturumda çalışmaz, premium akışı bozulmaz
        return false;
    }
    armWatchdog();
    window.dispatchEvent(new CustomEvent(TRIAL_EVENT));
    return true;
}

/**
 * Dinleme isteğini karşılar: gerekiyorsa denemeyi başlatır.
 * @returns {'allowed'|'started'|'blocked'}
 *   allowed → zaten yetkili (premium ya da süren deneme)
 *   started → deneme bu çağrıyla başladı, dinleme sürebilir
 *   blocked → yetki yok, paywall gösterilmeli
 */
export function requestListen() {
    if (canListen()) return 'allowed';
    return startTrial() ? 'started' : 'blocked';
}
