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

// On-screen debug logger (visible on device)
function dbg(msg) {
    console.log('[IAP]', msg);
    let el = document.getElementById('iap-debug');
    if (!el) {
        el = document.createElement('div');
        el.id = 'iap-debug';
        el.style.cssText = 'position:fixed;top:50px;left:10px;right:10px;z-index:99999;background:rgba(0,0,0,0.9);color:#0f0;font-size:11px;padding:10px;border-radius:8px;max-height:200px;overflow-y:auto;font-family:monospace;pointer-events:auto;';
        document.body.appendChild(el);
    }
    el.innerHTML += msg + '<br>';
    el.scrollTop = el.scrollHeight;
}

function isNative() {
    return Capacitor.isNativePlatform();
}

// Plugin readiness promise — resolves to undefined (NOT the Proxy!) to avoid thenable deadlock
let pluginReadyResolve;
const pluginReadyPromise = new Promise(resolve => { pluginReadyResolve = resolve; });

// Load plugin eagerly
if (isNative()) {
    import('@capgo/native-purchases').then(mod => {
        dbg('Module loaded: ' + Object.keys(mod).join(','));
        NativePurchases = mod.NativePurchases;
        dbg('Plugin ready: ' + !!NativePurchases);
        pluginReadyResolve(); // Resolve with undefined — safe!
    }).catch(err => {
        dbg('IMPORT FAILED: ' + (err?.message || err));
        pluginReadyResolve(); // Still resolve so callers don't hang
    });
} else {
    pluginReadyResolve(); // Not native — resolve immediately
}

/**
 * Wait for plugin import to complete. Returns VOID — never the Proxy!
 * After this resolves, access NativePurchases directly from module scope.
 */
async function waitForPlugin() {
    await pluginReadyPromise;
    // DO NOT return NativePurchases here — it's a Proxy with .then, 
    // which causes async function to deadlock!
}

/**
 * Initialize IAP — call once on app startup.
 */
export async function initializePurchases() {
    if (isInitialized) return;
    await waitForPlugin();
    if (!NativePurchases) return;
    try {
        NativePurchases.addListener('transactionUpdated', (transaction) => {
            dbg('transactionUpdated event');
            const active = isTransactionActive(transaction);
            localStorage.setItem(PREMIUM_KEY, active ? 'true' : 'false');
            purchaseListeners.forEach(fn => fn(active, transaction));
        }).catch(() => {});
        isInitialized = true;
        dbg('Init OK');
        verifySubscription().then(() => dbg('Subscription verified')).catch(() => {});
    } catch (err) {
        dbg('Init ERROR: ' + (err?.message || err));
        isInitialized = true;
    }
}

/**
 * Fetch subscription products with real localized prices from the store.
 */
export async function getProducts() {
    dbg('getProducts: START');
    await waitForPlugin();
    dbg('getProducts: plugin=' + !!NativePurchases);
    if (!NativePurchases) {
        dbg('getProducts: NO PLUGIN, mocks');
        return [
            { identifier: PRODUCT_IDS.MONTHLY, priceString: '₺124,99', price: 124.99, currencyCode: 'TRY', title: 'Aylık Premium', description: 'Aylık abonelik', introductoryPrice: null, discounts: [] },
            { identifier: PRODUCT_IDS.YEARLY, priceString: '₺979,99', price: 979.99, currencyCode: 'TRY', title: 'Yıllık Premium', description: 'Yıllık abonelik', introductoryPrice: null, discounts: [] },
        ];
    }
    try {
        dbg('getProducts: CALLING STORE...');
        const result = await NativePurchases.getProducts({
            productIdentifiers: [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.YEARLY],
            productType: 'subs',
        });
        dbg('getProducts: RESULT=' + JSON.stringify(result));
        const products = result?.products || [];
        dbg('getProducts: ' + products.length + ' products');
        return products;
    } catch (err) {
        dbg('getProducts: ERROR=' + (err?.message || err));
        return [];
    }
}

/**
 * Purchase a subscription product. Triggers native StoreKit/Play Billing flow.
 * @param {string} productId - PRODUCT_IDS.MONTHLY or PRODUCT_IDS.YEARLY
 * @returns {Promise<{success: boolean, transaction?: object, error?: string}>}
 */
export async function purchaseProduct(productId) {
    dbg('purchase: START ' + productId);
    await waitForPlugin();
    dbg('purchase: plugin=' + !!NativePurchases);
    if (!NativePurchases) {
        localStorage.setItem(PREMIUM_KEY, 'true');
        return { success: true, transaction: { productIdentifier: productId, transactionId: 'web-dev-mock' } };
    }
    try {
        dbg('purchase: CALLING NATIVE...');
        const transaction = await NativePurchases.purchaseProduct({
            productIdentifier: productId,
            productType: 'subs',
        });
        dbg('purchase: OK txn=' + JSON.stringify(transaction?.transactionId || 'none'));
        const active = isTransactionActive(transaction);
        localStorage.setItem(PREMIUM_KEY, active ? 'true' : 'false');
        return { success: active, transaction };
    } catch (err) {
        const message = err?.message || String(err);
        dbg('purchase: ERROR=' + message);
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
