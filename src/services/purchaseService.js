import { Capacitor } from '@capacitor/core';
import { NativePurchases } from '@capgo/native-purchases';
import { storageService } from './storageService';
import { setPremiumUserProperties } from './analyticsService';

export const PRODUCT_IDS = {
    MONTHLY: 'com.islamiyoldas.app.monthly',
    YEARLY: 'com.islamiyoldas.app.yearly',
};

const PREMIUM_KEY = 'aminKumbara_premium';

let isInitialized = false;
let purchaseListeners = [];

/**
 * Transaction'un aktif bir abonelik olup olmadığını kontrol et.
 * StoreKit 2 revocationDate null ise ve expiryDate gelecekteyse → aktif.
 */
function isTransactionActive(transaction) {
    if (!transaction) return false;
    // Revoke edilmişse iptal
    if (transaction.revocationDate) return false;
    // Expiry tarihi varsa kontrol et
    if (transaction.expiryDate) {
        return new Date(transaction.expiryDate) > new Date();
    }
    // Expiry yoksa (lifetime/consumable) → aktif kabul et
    return true;
}

/**
 * Premium durumunu güncelle ve tüm UI'ı/Analytics'i bilgilendir.
 */
function updatePremiumStatus(isPremium, planId = 'free') {
    const current = storageService.getItem(PREMIUM_KEY) === 'true';
    if (current !== isPremium) {
        storageService.setItem(PREMIUM_KEY, isPremium ? 'true' : 'false');
        window.dispatchEvent(new Event('premiumStatusChanged'));
        console.log('[IAP] Premium status →', isPremium);
    }
    // Set Amplitude User Properties on init/update
    setPremiumUserProperties(isPremium, planId);
}

export async function initializePurchases() {
    if (isInitialized) return;
    if (!Capacitor.isNativePlatform()) return;

    try {
        // Transaction güncellemelerini dinle (yenilenme, iptal, geri ödeme)
        await NativePurchases.addListener('transactionUpdated', (transaction) => {
            console.log('[IAP] Transaction updated:', transaction?.productIdentifier);
            const active = isTransactionActive(transaction);
            updatePremiumStatus(active, active ? transaction?.productIdentifier : 'free');
            purchaseListeners.forEach(fn => fn(active, transaction));
        });

        isInitialized = true;

        // Uygulama açılışında mevcut abonelikleri doğrula
        await verifySubscription();
        
        console.log('[IAP] Initialization complete ✓');
    } catch (err) {
        console.warn('[IAP] Init error:', err);
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
        const { products } = await NativePurchases.getProducts({
            productIdentifiers: [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.YEARLY],
            productType: 'subs',
        });
        return (products || []).map(p => ({
            identifier: p.productIdentifier,
            priceString: p.priceString,
            price: p.price,
            currencyCode: p.currencyCode,
            title: p.title || p.displayName,
            description: p.description,
            product: p, // Native objeyi sakla — purchaseProduct için
        }));
    } catch (err) {
        console.warn('[IAP] getProducts error:', err);
    }
    return [];
}

export async function purchaseProduct(productIdOrObj) {
    if (!Capacitor.isNativePlatform()) {
        const productIdentifier = typeof productIdOrObj === 'object'
            ? (productIdOrObj.identifier || productIdOrObj.productIdentifier)
            : productIdOrObj;
        updatePremiumStatus(true, productIdentifier);
        return { success: true };
    }
    try {
        const productIdentifier = typeof productIdOrObj === 'object'
            ? (productIdOrObj.identifier || productIdOrObj.productIdentifier)
            : productIdOrObj;

        console.log('[IAP] Purchasing:', productIdentifier);
        
        const transaction = await NativePurchases.purchaseProduct({
            productIdentifier,
            productType: 'subs',
        });

        console.log('[IAP] Purchase result:', transaction?.transactionId);

        // purchaseProduct hata fırlatmadıysa başarılı demektir
        updatePremiumStatus(true, productIdentifier);
        return { success: true };
    } catch (err) {
        console.error('[IAP] Purchase error:', JSON.stringify(err));
        const msg = err?.message || String(err);
        if (msg.includes('cancel') || msg.includes('Cancel') || msg.includes('SKError') || err?.code === 2) {
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
        // App Store / Google Play'den makbuzları yenile (Apple ID şifre sorabilir)
        await NativePurchases.restorePurchases();
        
        // Sonra da aktif abonelik var mı diye kontrol et (şifre sormadan cihazdaki makbuzu okur)
        const { purchases } = await NativePurchases.getPurchases({
            productType: 'subs',
        });
        
        console.log('[IAP] Restore result:', purchases?.length, 'transactions');
        
        const activeTran = (purchases || []).find(t => isTransactionActive(t));
        const hasActive = !!activeTran;
        updatePremiumStatus(hasActive, activeTran ? activeTran.productIdentifier : 'free');
        
        return { success: true, isPremium: hasActive };
    } catch (err) {
        console.warn('[IAP] Restore error:', err);
        return { success: false, isPremium: false };
    }
}

export async function verifySubscription() {
    if (!Capacitor.isNativePlatform()) {
        return storageService.getItem(PREMIUM_KEY) === 'true';
    }
    try {
        // getPurchases → cihazdaki receipt'i sessizce okur, Apple ID şifresi SORMAZ
        const { purchases } = await NativePurchases.getPurchases({
            productType: 'subs',
        });
        
        const activeTran = (purchases || []).find(t => isTransactionActive(t));
        const hasActive = !!activeTran;
        console.log('[IAP] Verify → isPremium:', hasActive, '(', (purchases || []).length, 'transactions)');
        
        updatePremiumStatus(hasActive, activeTran ? activeTran.productIdentifier : 'free');
        return hasActive;
    } catch (err) {
        console.warn('[IAP] Verify error:', err);
        // Hata durumunda mevcut cache'i koru
        return storageService.getItem(PREMIUM_KEY) === 'true';
    }
}

export async function isBillingSupported() {
    if (!Capacitor.isNativePlatform()) return false;
    try {
        const { isBillingSupported } = await NativePurchases.isBillingSupported();
        return isBillingSupported;
    } catch {
        return false;
    }
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
