const STORAGE_KEYS = {
    CREDITS: 'aminKumbara_credits',
    PREMIUM: 'aminKumbara_premium',
    TOTAL_AMINS: 'aminKumbara_totalAmins',
};

export const CREDIT_COSTS = {
    POST_DUA: 50,
    AMIN_REWARD: 1,
    AD_REWARD: 5,
};

export function getCredits() {
    return parseInt(localStorage.getItem(STORAGE_KEYS.CREDITS) || '0', 10);
}

export function addCredit(amount = 1) {
    const current = getCredits();
    const updated = current + amount;
    localStorage.setItem(STORAGE_KEYS.CREDITS, updated.toString());

    const totalAmins = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_AMINS) || '0', 10);
    localStorage.setItem(STORAGE_KEYS.TOTAL_AMINS, (totalAmins + amount).toString());

    return updated;
}

export function spendCredits(amount) {
    const current = getCredits();
    if (current < amount) return false;
    localStorage.setItem(STORAGE_KEYS.CREDITS, (current - amount).toString());
    return true;
}

export function getTotalAmins() {
    return parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_AMINS) || '0', 10);
}

export function isPremium() {
    return localStorage.getItem(STORAGE_KEYS.PREMIUM) === 'true';
}

export function setPremium(value) {
    localStorage.setItem(STORAGE_KEYS.PREMIUM, value ? 'true' : 'false');
    window.dispatchEvent(new Event('premiumStatusChanged'));
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
