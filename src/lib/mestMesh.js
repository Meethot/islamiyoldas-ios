/**
 * Mest üzerine mesh — süre mantığı.
 *
 * Fıkhî kurallar (Hanefî / Diyanet Din İşleri Yüksek Kurulu):
 *  - Süre mestin GİYİLDİĞİ anda değil, giyildikten sonra abdestin İLK
 *    BOZULDUĞU anda başlar. Kullanıcı sayacı o anda başlatır.
 *  - Mukim 24 saat, misafir (seferi) 72 saat.
 *  - Mukimken yolculuğa çıkan: süresi DOLMAMIŞSA 72 saate uzar. Dolduktan
 *    sonra yola çıkmak dolmuş bir hakkı geri getirmez.
 *  - Seferiyken mukim olan: 24 saati aşmamışsa süresi 24'e iner, aşmışsa mesh
 *    hakkı derhal düşer.
 *  - Sargı/alçı meshinin süresi YOKTUR; bu modül yalnız mest içindir.
 *
 * Süre dışında meshi düşüren haller (mestin çıkarılması, gusül gerektiren bir
 * hal) sayaçla ölçülemez — ekranda "sıfırla" ile karşılanır.
 */

export const MEST_KEY = 'mest_mesh_v1';

const HOUR = 3600 * 1000;
export const RESIDENT_MS = 24 * HOUR;
export const TRAVELER_MS = 72 * HOUR;

/** Bozuk/eksik kaydı sessizce yok sayar — asla exception atmaz. */
export function readMest(store = globalThis.localStorage) {
    try {
        const raw = JSON.parse(store?.getItem(MEST_KEY) || 'null');
        if (!raw || typeof raw !== 'object') return null;
        const startedAt = Number(raw.startedAt);
        if (!Number.isFinite(startedAt) || startedAt <= 0) return null;
        const switchedAt = Number(raw.switchedAt);
        return {
            startedAt,
            traveler: !!raw.traveler,
            switchedAt: Number.isFinite(switchedAt) && switchedAt > 0 ? switchedAt : null,
        };
    } catch {
        return null;
    }
}

/**
 * Geçerli üst sınır.
 *
 * `switchedAt`: mukimken 24 saat DOLDUKTAN sonra "misafirim" işaretlenirse
 * süre 72'ye uzamaz — hak zaten bitmişti. Bu tek alan o kuralı taşır.
 */
export function limitFor(state) {
    if (!state) return 0;
    if (!state.traveler) return RESIDENT_MS;
    if (state.switchedAt != null && state.switchedAt - state.startedAt >= RESIDENT_MS) return 0;
    return TRAVELER_MS;
}

/**
 * Durum özeti.
 * Cihaz saati geriye alınırsa geçen süre negatife düşer; 0'a kırpılır ki
 * kullanıcı sınırdan uzun bir hak görmesin.
 */
export function mestStatus(state, now = Date.now()) {
    if (!state) return { active: false, expired: false, elapsedMs: 0, remainingMs: 0, limitMs: 0, traveler: false };
    const limitMs = limitFor(state);
    const elapsedMs = Math.max(0, now - state.startedAt);
    const remainingMs = Math.max(0, limitMs - elapsedMs);
    return {
        active: remainingMs > 0,
        expired: remainingMs <= 0,
        elapsedMs,
        remainingMs,
        limitMs,
        traveler: !!state.traveler,
    };
}

/** Sayacı başlatır — "abdestim bozuldu" anı. */
export function startMest(traveler, now = Date.now()) {
    return { startedAt: now, traveler: !!traveler, switchedAt: null };
}

/**
 * Mukim ↔ misafir geçişi.
 *
 * Misafirden mukime dönüşte `switchedAt` temizlenir: sınır zaten 24 saate iner
 * ve 24'ü aşmışsa `mestStatus` kendiliğinden "bitti" der.
 */
export function setTraveler(state, traveler, now = Date.now()) {
    if (!state) return null;
    if (!!state.traveler === !!traveler) return state;
    return { ...state, traveler: !!traveler, switchedAt: traveler ? now : null };
}

/** Kalan süreyi saat/dakika/saniye olarak verir (biçimlendirme UI'da). */
export function splitRemaining(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    return {
        hours: Math.floor(total / 3600),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60,
    };
}

const pad = (n) => String(n).padStart(2, '0');

/** Geri sayım: 18:42:07 */
export function formatClock(ms) {
    const { hours, minutes, seconds } = splitRemaining(ms);
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
