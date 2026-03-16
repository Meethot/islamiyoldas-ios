import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';

export const PRODUCT_IDS = {
    MONTHLY: 'com.islamiyoldas.app.monthly',
    YEARLY: 'com.islamiyoldas.app.yearly',
};

const PREMIUM_KEY = 'aminKumbara_premium';

// RevenueCat API Keys
const RC_API_KEY_APPLE = 'appl_hKXYxTRTsDPOKptWBGGHoFltKZc';
const RC_API_KEY_GOOGLE = ''; // TODO: Android key

let isInitialized = false;
let purchaseListeners = [];

/**
 * Herhangi bir aktif entitlement varsa premium kabul et.
 * Entitlement ID uyumsuzluk sorunlarını tamamen ortadan kaldırır.
 */
function hasAnyActiveEntitlement(customerInfo) {
    const active = customerInfo?.entitlements?.active;
    if (!active || typeof active !== 'object') return false;
    const keys = Object.keys(active);
    console.log('[RevenueCat] Active entitlements:', keys);
    return keys.length > 0;
}

export async function initializePurchases() {
    if (isInitialized) return;
    try {
        const platform = Capacitor.getPlatform();
        if (platform === 'ios') {
            await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
            await Purchases.configure({ apiKey: RC_API_KEY_APPLE });
        } else if (platform === 'android') {
            if (!RC_API_KEY_GOOGLE) {
                console.warn('[RevenueCat] Android API Key is missing');
                return;
            }
            await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
            await Purchases.configure({ apiKey: RC_API_KEY_GOOGLE });
        } else {
            return; // Web
        }

        // Dinamik güncelleme dinleyicisi
        await Purchases.addCustomerInfoUpdateListener((info) => {
            const isPremium = hasAnyActiveEntitlement(info);
            console.log('[RevenueCat] CustomerInfo update → isPremium:', isPremium);
            localStorage.setItem(PREMIUM_KEY, isPremium ? 'true' : 'false');
            window.dispatchEvent(new Event('premiumStatusChanged')); // Notify components
            purchaseListeners.forEach(fn => fn(isPremium, info));
        });

        isInitialized = true;
        
        // İlk açılışta aboneliği doğrula
        const isPremium = await verifySubscription();
        
        // KRİTİK: Eğer localStorage'da premium idik ama RC 'false' diyorsa,
        // sessiz bir 'restore' tetikleyerek StoreKit makbuzunu tazeleyelim.
        // Bu durum genelde uygulama güncellemelerinden sonra yaşanır.
        const wasPremium = localStorage.getItem(PREMIUM_KEY) === 'true';
        if (wasPremium && !isPremium) {
            console.log('[RevenueCat] Discrepancy detected, attempting quiet sync...');
            await restorePurchases();
        }
    } catch (err) {
        console.warn('[RevenueCat] Init error:', err);
    }
}

export async function getProducts() {
    if (!Capacitor.isNativePlatform()) {
        return [
            { identifier: PRODUCT_IDS.MONTHLY, priceString: '₺124,99', title: 'Aylık Premium', description: 'Aylık abonelik' },
            { identifier: PRODUCT_IDS.YEARLY, priceString: '₺979,99', title: 'Yıllık Premium', description: 'Yıllık abonelik' },
        ];
    }
    try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current && offerings.current.availablePackages.length > 0) {
            return offerings.current.availablePackages.map(pkg => ({
                identifier: pkg.product.identifier,
                rcPackage: pkg,
                priceString: pkg.product.priceString,
                price: pkg.product.price,
                currencyCode: pkg.product.currencyCode,
                title: pkg.product.title,
                description: pkg.product.description,
            }));
        }
    } catch (err) {
        console.warn('[RevenueCat] getProducts error:', err);
    }
    return [];
}

export async function purchaseProduct(productIdOrObj) {
    if (!Capacitor.isNativePlatform()) {
        localStorage.setItem(PREMIUM_KEY, 'true');
        return { success: true };
    }
    try {
        let packageToBuy;

        if (typeof productIdOrObj === 'object' && productIdOrObj.rcPackage) {
            packageToBuy = productIdOrObj.rcPackage;
        } else {
            console.log('[RevenueCat] Looking up package for:', productIdOrObj);
            const offerings = await Purchases.getOfferings();
            if (offerings.current) {
                packageToBuy = offerings.current.availablePackages.find(
                    p => p.product?.identifier === productIdOrObj
                );
            }
        }

        if (!packageToBuy) {
            console.error('[RevenueCat] Package not found for:', productIdOrObj);
            return { success: false, error: 'Product not found' };
        }

        console.log('[RevenueCat] Purchasing:', packageToBuy.identifier, packageToBuy.product?.identifier);
        const result = await Purchases.purchasePackage({ aPackage: packageToBuy });
        const customerInfo = result?.customerInfo;

        // Loglama amaçlı entitlement kontrolü
        const isPremium = hasAnyActiveEntitlement(customerInfo);
        console.log('[RevenueCat] Purchase done → isPremium:', isPremium);

        // purchasePackage hata fırlatmadan tamamlandıysa satın alma BAŞARILI demektir.
        // Entitlement eşleşmesi olsun-olmasın premium olarak işaretle.
        localStorage.setItem(PREMIUM_KEY, 'true');
        window.dispatchEvent(new Event('premiumStatusChanged'));
        return { success: true };
    } catch (err) {
        console.error('[RevenueCat] Purchase error:', JSON.stringify(err));
        const msg = err?.message || String(err);
        if (err?.code === 1 || msg.includes('cancel') || msg.includes('Cancel') || msg.includes('PURCHASE_CANCELLED')) {
            return { success: false, error: 'cancelled' };
        }
        return { success: false, error: msg };
    }
}

export async function restorePurchases() {
    if (!Capacitor.isNativePlatform()) {
        return { success: false, isPremium: false };
    }
    try {
        const result = await Purchases.restorePurchases();
        const customerInfo = result?.customerInfo;
        const isPremium = hasAnyActiveEntitlement(customerInfo);
        console.log('[RevenueCat] Restore → isPremium:', isPremium);
        localStorage.setItem(PREMIUM_KEY, isPremium ? 'true' : 'false');
        window.dispatchEvent(new Event('premiumStatusChanged'));
        return { success: true, isPremium };
    } catch (err) {
        console.warn('[RevenueCat] Restore error:', err);
        return { success: false, isPremium: false };
    }
}

export async function verifySubscription() {
    if (!Capacitor.isNativePlatform()) {
        return localStorage.getItem(PREMIUM_KEY) === 'true';
    }
    try {
        const result = await Purchases.getCustomerInfo();
        const customerInfo = result?.customerInfo;
        const isPremium = hasAnyActiveEntitlement(customerInfo);
        console.log('[RevenueCat] Verify → isPremium:', isPremium);
        localStorage.setItem(PREMIUM_KEY, isPremium ? 'true' : 'false');
        window.dispatchEvent(new Event('premiumStatusChanged'));
        return isPremium;
    } catch (err) {
        console.warn('[RevenueCat] Verify error:', err);
        return localStorage.getItem(PREMIUM_KEY) === 'true';
    }
}

export async function isBillingSupported() {
    return Capacitor.isNativePlatform();
}

export async function manageSubscriptions() {
    if (Capacitor.getPlatform() === 'ios') {
        window.open('https://apps.apple.com/account/subscriptions', '_blank');
    } else if (Capacitor.getPlatform() === 'android') {
        window.open('https://play.google.com/store/account/subscriptions', '_blank');
    }
}

export function onPurchaseUpdate(callback) {
    purchaseListeners.push(callback);
    return () => {
        purchaseListeners = purchaseListeners.filter(fn => fn !== callback);
    };
}
