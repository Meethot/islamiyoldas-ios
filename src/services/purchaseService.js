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

async function getPlugin() {
    if (NativePurchases) return NativePurchases;
    if (!isNative()) return null;
    try {
        const mod = await import('@capgo/native-purchases');
        NativePurchases = mod.NativePurchases;
        return NativePurchases;
    } catch {
        console.warn('[IAP] Plugin not available');
        return null;
    }
}

/**
 * Initialize IAP — call once on app startup.
 * Sets up transaction listeners for StoreKit 2 updates.
 */
export async function initializePurchases() {
    if (isInitialized) return;
    const plugin = await getPlugin();
    if (!plugin) return;
    try {
        // Listen for background transaction updates (renewals, refunds, etc.)
        await plugin.addListener('transactionUpdated', (transaction) => {
            const active = isTransactionActive(transaction);
            localStorage.setItem(PREMIUM_KEY, active ? 'true' : 'false');
            purchaseListeners.forEach(fn => fn(active, transaction));
        });
        isInitialized = true;

        // Verify current subscription status on launch
        await verifySubscription();
    } catch (err) {
        console.warn('[IAP] Init error:', err);
    }
}

/**
 * Fetch subscription products with real localized prices from the store.
 * Returns array of products or empty array on web/error.
 */
export async function getProducts() {
    const plugin = await getPlugin();
    if (!plugin) {
        // Web fallback — return mock products for development
        return [
            { identifier: PRODUCT_IDS.MONTHLY, priceString: '₺124,99', price: 124.99, currencyCode: 'TRY', title: 'Aylık Premium', description: 'Aylık abonelik', introductoryPrice: null, discounts: [] },
            { identifier: PRODUCT_IDS.YEARLY, priceString: '₺979,99', price: 979.99, currencyCode: 'TRY', title: 'Yıllık Premium', description: 'Yıllık abonelik', introductoryPrice: null, discounts: [] },
        ];
    }
    try {
        const { products } = await plugin.getProducts({
            productIdentifiers: [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.YEARLY],
            productType: 'subs',
        });
        return products;
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
    const plugin = await getPlugin();
    if (!plugin) {
        // Web fallback — simulate purchase for development
        localStorage.setItem(PREMIUM_KEY, 'true');
        return { success: true, transaction: { productIdentifier: productId, transactionId: 'web-dev-mock' } };
    }
    try {
        const transaction = await plugin.purchaseProduct({
            productIdentifier: productId,
            productType: 'subs',
        });
        // Purchase succeeded — StoreKit auto-verifies + auto-acknowledges
        const active = isTransactionActive(transaction);
        localStorage.setItem(PREMIUM_KEY, active ? 'true' : 'false');
        return { success: active, transaction };
    } catch (err) {
        const message = err?.message || String(err);
        // User cancelled is not an error
        if (message.includes('cancel') || message.includes('Cancel') || message.includes('SKError Code=2')) {
            return { success: false, error: 'cancelled' };
        }
        console.warn('[IAP] Purchase error:', message);
        return { success: false, error: message };
    }
}

/**
 * Restore previous purchases.
 * @returns {Promise<{success: boolean, isPremium: boolean}>}
 */
export async function restorePurchases() {
    const plugin = await getPlugin();
    if (!plugin) {
        return { success: false, isPremium: false };
    }
    try {
        await plugin.restorePurchases();
        // After restore, re-check subscription status
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
    const plugin = await getPlugin();
    if (!plugin) {
        return localStorage.getItem(PREMIUM_KEY) === 'true';
    }
    try {
        const { purchases } = await plugin.getPurchases({ productType: 'subs' });
        const hasActive = purchases.some(t => isTransactionActive(t));
        localStorage.setItem(PREMIUM_KEY, hasActive ? 'true' : 'false');
        return hasActive;
    } catch (err) {
        console.warn('[IAP] Verify error:', err);
        // Fall back to cached value on error
        return localStorage.getItem(PREMIUM_KEY) === 'true';
    }
}

/**
 * Check if billing is supported on this device.
 */
export async function isBillingSupported() {
    const plugin = await getPlugin();
    if (!plugin) return false;
    try {
        const { isBillingSupported: supported } = await plugin.isBillingSupported();
        return supported;
    } catch {
        return false;
    }
}

/**
 * Open native subscription management page.
 */
export async function manageSubscriptions() {
    const plugin = await getPlugin();
    if (!plugin) return;
    try {
        await plugin.manageSubscriptions();
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
    // iOS: check isActive flag or expiration date
    if (transaction.isActive === true) return true;
    if (transaction.isActive === false) return false;
    // iOS fallback: check expiration date
    if (transaction.expirationDate) {
        return new Date(transaction.expirationDate) > new Date();
    }
    // Android: check purchaseState === "1" (PURCHASED)
    if (transaction.purchaseState === '1') return true;
    // Grace period — still grant access
    if (transaction.isInGracePeriod) return true;
    return false;
}
