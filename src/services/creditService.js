import { storageService } from './storageService';
import { setPremiumUserProperties } from './analyticsService';

const STORAGE_KEYS = {
    CREDITS: 'aminKumbara_credits',
    PREMIUM: 'aminKumbara_premium',
    TOTAL_AMINS: 'aminKumbara_totalAmins',
};

export const CREDIT_COSTS = {
    POST_DUA: 30,
    AMIN_REWARD: 1,
    AD_REWARD: 5,
};

/**
 * Depodaki sayacı güvenli oku: bozuk değer (NaN), negatif veya eksik → 0.
 * Ham parseInt tehlikeliydi — NaN dönünce "NaN < 30" false olduğu için kredi
 * kontrolleri sessizce devre dışı kalıyor (bedava sınırsız dua), ekranda da
 * "NaN 🪙" yazıyordu. NaN bir kez yazıldığında kendiliğinden düzelmiyordu.
 */
function readCounter(key) {
    const parsed = parseInt(storageService.getItem(key) || '0', 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

/** Miktar argümanını güvenli tamsayıya çevir (NaN/undefined/string → 0). */
function safeAmount(amount) {
    return Number.isFinite(amount) ? Math.trunc(amount) : 0;
}

export function getCredits() {
    return readCounter(STORAGE_KEYS.CREDITS);
}

export function addCredit(amount = 1) {
    const delta = safeAmount(amount);
    const updated = getCredits() + delta;
    storageService.setItem(STORAGE_KEYS.CREDITS, updated.toString());

    const totalAmins = readCounter(STORAGE_KEYS.TOTAL_AMINS);
    storageService.setItem(STORAGE_KEYS.TOTAL_AMINS, (totalAmins + delta).toString());

    return updated;
}

export function spendCredits(amount) {
    const cost = safeAmount(amount);
    const current = getCredits();
    // Geçersiz miktarda "başarılı" dönmemek için cost<=0 da reddedilir.
    if (cost <= 0 || current < cost) return false;
    storageService.setItem(STORAGE_KEYS.CREDITS, (current - cost).toString());
    return true;
}

export function getTotalAmins() {
    return readCounter(STORAGE_KEYS.TOTAL_AMINS);
}

export function isPremium() {
    return storageService.getItem(STORAGE_KEYS.PREMIUM) === 'true';
}

export function setPremium(value, planId = 'promo') {
    storageService.setItem(STORAGE_KEYS.PREMIUM, value ? 'true' : 'false');
    window.dispatchEvent(new Event('premiumStatusChanged'));
    setPremiumUserProperties(value, planId);
}

/**
 * Verify premium status with the native store (StoreKit / Google Play).
 * Updates localStorage cache and returns the verified result.
 * Falls back to cached localStorage value on web or error.
 */
export async function verifyPremiumStatus() {
    try {
        const { verifySubscription } = await import('./purchaseService');
        return await verifySubscription();
    } catch {
        return isPremium();
    }
}
