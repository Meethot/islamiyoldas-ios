import { Capacitor } from '@capacitor/core';

// Product IDs — must match App Store Connect & Google Play Console
export const PRODUCT_IDS = {
    MONTHLY: 'com.islamiyoldas.app.monthly',
    YEARLY: 'com.islamiyoldas.app.yearly',
};

const PREMIUM_KEY = 'aminKumbara_premium';
let NativePurchases = null;
let isInitialized = false;
let purchaseListeners = [];

function isNative() {
    return Capacitor.isNativePlatform();
}

// Plugin readiness promise — resolves to undefined (NOT the Proxy!) to avoid thenable deadlock
let pluginReadyResolve;
const pluginReadyPromise = new Promise(resolve => { pluginReadyResolve = resolve; });

// Load plugin eagerly — NEVER return the Proxy from an async function
if (isNative()) {
    import('@capgo/native-purchases').then(mod => {
        NativePurchases = mod.NativePurchases;
        pluginReadyResolve();
    }).catch(() => {
        pluginReadyResolve();
    });
} else {
    pluginReadyResolve();
}

/**
 * Wait for plugin import to complete. Returns VOID — never the Proxy!
 * After this resolves, access NativePurchases directly from module scope.
 */
async function waitForPlugin() {
    await pluginReadyPromise;
}

/**
 * Initialize IAP — call once on app startup.
 * Sets up transaction listeners for StoreKit 2 updates.
 */
export async function initializePurchases() {
    if (isInitialized) return;
    await waitForPlugin();
    if (!NativePurchases) return;
    try {
        NativePurchases.addListener('transactionUpdated', (transaction) => {
            const active = isTransactionActive(transaction);
            localStorage.setItem(PREMIUM_KEY, active ? 'true' : 'false');
            purchaseListeners.forEach(fn => fn(active, transaction));
        }).catch(() => {});
        isInitialized = true;
        verifySubscription().catch(() => {});
    } catch (err) {
        console.warn('[IAP] Init error:', err);
        isInitialized = true;
    }
}

/**
 * Fetch subscription products with real localized prices from the store.
 * Returns array of products or fallback mocks on web/error.
 */
export async function getProducts() {
    await waitForPlugin();
    if (!NativePurchases) {
        return [
            { identifier: PRODUCT_IDS.MONTHLY, priceString: '₺124,99', price: 124.99, currencyCode: 'TRY', title: 'Aylık Premium', description: 'Aylık abonelik', introductoryPrice: null, discounts: [] },
            { identifier: PRODUCT_IDS.YEARLY, priceString: '₺979,99', price: 979.99, currencyCode: 'TRY', title: 'Yıllık Premium', description: 'Yıllık abonelik', introductoryPrice: null, discounts: [] },
        ];
    }
    try {
        const result = await NativePurchases.getProducts({
            productIdentifiers: [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.YEARLY],
            productType: 'subs',
        });
        return result?.products || [];
    } catch (err) {
        console.warn('[IAP] getProducts error:', err);
        return [];
    }
}

/**
 * Purchase a subscription product. Triggers native StoreKit/Play Billing flow.
 * @param {string} productId - PRODUCT_IDS.MONTHLY or PRODUCT_IDS.YEARLY
 * @returns {Promise<{success: boolean, transaction?: object, error?: string}>}
 */
export async function purchaseProduct(productId) {
    await waitForPlugin();
    if (!NativePurchases) {
        localStorage.setItem(PREMIUM_KEY, 'true');
        return { success: true, transaction: { productIdentifier: productId, transactionId: 'web-dev-mock' } };
    }
    try {
        const transaction = await NativePurchases.purchaseProduct({
            productIdentifier: productId,
            productType: 'subs',
        });
        const active = isTransactionActive(transaction);
        localStorage.setItem(PREMIUM_KEY, active ? 'true' : 'false');
        return { success: active, transaction };
    } catch (err) {
        const message = err?.message || String(err);
        if (message.includes('cancel') || message.includes('Cancel') || message.includes('SKError Code=2')) {
            return { success: false, error: 'cancelled' };
        }
        return { success: false, error: message };
    }
}

/**
 * Restore previous purchases.
 * @returns {Promise<{success: boolean, isPremium: boolean}>}
 */
export async function restorePurchases() {
    await waitForPlugin();
    if (!NativePurchases) {
        return { success: false, isPremium: false };
    }
    try {
        await NativePurchases.restorePurchases();
        const isPremium = await verifySubscription();
        return { success: true, isPremium };
    } catch (err) {
        console.warn('[IAP] Restore error:', err);
        return { success: false, isPremium: false };
    }
}

/**
 * Verify whether the user currently has an active subscription.
 * Queries the native store, updates localStorage cache.
 * @returns {Promise<boolean>} true if user is premium
 */
export async function verifySubscription() {
    await waitForPlugin();
    if (!NativePurchases) {
        return localStorage.getItem(PREMIUM_KEY) === 'true';
    }
    try {
        const { purchases } = await NativePurchases.getPurchases({ productType: 'subs' });
        const hasActive = purchases.some(t => isTransactionActive(t));
        localStorage.setItem(PREMIUM_KEY, hasActive ? 'true' : 'false');
        return hasActive;
    } catch (err) {
        return localStorage.getItem(PREMIUM_KEY) === 'true';
    }
}

/**
 * Check if billing is supported on this device.
 */
export async function isBillingSupported() {
    await waitForPlugin();
    if (!NativePurchases) return false;
    try {
        const { isBillingSupported: supported } = await NativePurchases.isBillingSupported();
        return supported;
    } catch {
        return false;
    }
}

/**
 * Open native subscription management page.
 */
export async function manageSubscriptions() {
    await waitForPlugin();
    if (!NativePurchases) return;
    try {
        await NativePurchases.manageSubscriptions();
    } catch (err) {
        console.warn('[IAP] manageSubscriptions error:', err);
    }
}

/**
 * Register a listener for purchase state changes.
 * @param {(isPremium: boolean, transaction: object) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function onPurchaseUpdate(callback) {
    purchaseListeners.push(callback);
    return () => {
        purchaseListeners = purchaseListeners.filter(fn => fn !== callback);
    };
}

// ─── Helpers ───

function isTransactionActive(transaction) {
    if (transaction.isActive === true) return true;
    if (transaction.isActive === false) return false;
    if (transaction.expirationDate) {
        return new Date(transaction.expirationDate) > new Date();
    }
    if (transaction.purchaseState === '1') return true;
    if (transaction.isInGracePeriod) return true;
    return false;
}
