import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { storageService } from './storageService';
import { setPremiumUserProperties } from './analyticsService';

// RevenueCat Public API Key (iOS)
const RC_API_KEY = 'appl_hKXYxTRTsDPOKptWBGGHoFltKZc';

// Entitlement ID — RevenueCat Dashboard'da tanımlı (tam olarak eşleşmeli!)
const ENTITLEMENT_ID = 'İslami Yoldas Pro';

export const PRODUCT_IDS = {
    MONTHLY: 'com.islamiyoldas.app.monthly',
    YEARLY: 'com.islamiyoldas.app.yearly',
};

const PREMIUM_KEY = 'aminKumbara_premium';
const MIGRATION_KEY = 'rc_sdk_migration_done';

let isInitialized = false;
let purchaseListeners = [];
let cachedOfferings = null;

/**
 * Premium durumunu güncelle ve tüm UI'ı/Analytics'i bilgilendir.
 * migration=true ise, sadece premium VERME yönünde güncelle (asla iptal etme).
 */
function updatePremiumStatus(isPremium, planId = 'free', isMigration = false) {
    const current = storageService.getItem(PREMIUM_KEY) === 'true';

    // ⚠️ GÖÇ GÜVENLİĞİ: Göç sırasında premium'u ASLA iptal etme.
    // RC henüz receipt'i işlememiş olabilir. Sadece premium VER, alma.
    if (isMigration && current && !isPremium) {
        console.warn('[RC] ⚠️ Migration safety: RC says NOT premium, but local cache says premium. KEEPING premium.');
        return;
    }

    if (current !== isPremium) {
        storageService.setItem(PREMIUM_KEY, isPremium ? 'true' : 'false');
        window.dispatchEvent(new Event('premiumStatusChanged'));
        console.log('[RC] Premium status →', isPremium);
    }
    setPremiumUserProperties(isPremium, planId);
}

/**
 * CustomerInfo'dan premium durumunu çıkar.
 */
function checkEntitlements(customerInfo) {
    if (!customerInfo?.entitlements?.active) return { isPremium: false, planId: 'free' };

    const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (premiumEntitlement) {
        return {
            isPremium: true,
            planId: premiumEntitlement.productIdentifier || 'premium',
        };
    }
    return { isPremium: false, planId: 'free' };
}

/**
 * RevenueCat SDK'yı başlat.
 */
export async function initializePurchases() {
    if (isInitialized) return;
    if (!Capacitor.isNativePlatform()) return;

    const isMigrating = !storageService.getItem(MIGRATION_KEY);
    const hadPremiumBefore = storageService.getItem(PREMIUM_KEY) === 'true';

    if (isMigrating) {
        console.log('[RC] 🔄 First SDK init — migration mode active. Current premium:', hadPremiumBefore);
    }

    try {
        // SDK'yı yapılandır
        await Purchases.configure({
            apiKey: RC_API_KEY,
        });

        // Debug modda verbose log
        if (import.meta.env.DEV) {
            await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        }

        // Müşteri bilgisi değişikliklerini dinle (yenilenme, iptal, geri ödeme)
        await Purchases.addCustomerInfoUpdateListener((customerInfo) => {
            console.log('[RC] Customer info updated');
            const { isPremium, planId } = checkEntitlements(customerInfo);
            // Migration tamamlandıktan sonra listener normal çalışır
            updatePremiumStatus(isPremium, planId, false);
            purchaseListeners.forEach(fn => fn(isPremium, customerInfo));
        });

        isInitialized = true;

        // Uygulama açılışında mevcut abonelikleri doğrula (migration güvenli)
        await verifySubscription(isMigrating);

        // Migration başarılı — işaretle
        if (isMigrating) {
            storageService.setItem(MIGRATION_KEY, 'true');
            console.log('[RC] ✅ Migration complete. Flag set.');

            // 30 saniye sonra tekrar doğrula (RC receipt işleme gecikmesi için)
            if (hadPremiumBefore) {
                setTimeout(async () => {
                    console.log('[RC] 🔄 Delayed post-migration re-verification...');
                    await verifySubscription(false);
                }, 30000);
            }
        }

        console.log('[RC] Initialization complete ✓');
    } catch (err) {
        console.warn('[RC] Init error:', err);
        // Hata durumunda mevcut premium durumunu koru
        if (hadPremiumBefore) {
            console.warn('[RC] ⚠️ Init failed, keeping existing premium status');
        }
    }
}

/**
 * Offerings'i al (A/B test desteği).
 * RevenueCat Dashboard'dan kontrol edilen farklı paketleri döndürür.
 */
export async function getOfferings() {
    if (!Capacitor.isNativePlatform()) return null;
    try {
        const offerings = await Purchases.getOfferings();
        cachedOfferings = offerings;
        console.log('[RC] Offerings loaded:', offerings?.current?.identifier);
        return offerings;
    } catch (err) {
        console.warn('[RC] getOfferings error:', err);
        return null;
    }
}

/**
 * Ürünleri getir — önce Offerings'den, yoksa doğrudan product ID ile.
 * A/B test: RevenueCat Dashboard'daki "current" offering otomatik seçilir.
 */
export async function getProducts() {
    if (!Capacitor.isNativePlatform()) {
        return [
            { identifier: PRODUCT_IDS.MONTHLY, priceString: '₺124,99', title: 'Aylık Premium', description: 'Aylık abonelik' },
            { identifier: PRODUCT_IDS.YEARLY, priceString: '₺739,99', title: 'Yıllık Premium', description: 'Yıllık abonelik' },
        ];
    }
    try {
        // Önce Offerings'den çek (A/B test desteği)
        const offerings = await getOfferings();
        if (offerings?.current?.availablePackages?.length) {
            return offerings.current.availablePackages.map(pkg => ({
                identifier: pkg.product.identifier,
                priceString: pkg.product.priceString,
                price: pkg.product.price,
                currencyCode: pkg.product.currencyCode,
                title: pkg.product.title,
                description: pkg.product.description,
                rcPackage: pkg, // RevenueCat package objesi — purchasePackage için
                offeringId: offerings.current.identifier,
            }));
        }

        // Fallback: Offerings yoksa doğrudan ürün ID ile sorgula
        const products = await Purchases.getProducts({
            productIdentifiers: [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.YEARLY],
        });
        return (products?.products || []).map(p => ({
            identifier: p.identifier,
            priceString: p.priceString,
            price: p.price,
            currencyCode: p.currencyCode,
            title: p.title,
            description: p.description,
        }));
    } catch (err) {
        console.warn('[RC] getProducts error:', err);
    }
    return [];
}

/**
 * Satın alma — önce RevenueCat Package ile, yoksa product ID ile.
 */
export async function purchaseProduct(productIdOrObj) {
    if (!Capacitor.isNativePlatform()) {
        const productIdentifier = typeof productIdOrObj === 'object'
            ? (productIdOrObj.identifier || productIdOrObj.productIdentifier)
            : productIdOrObj;
        updatePremiumStatus(true, productIdentifier);
        return { success: true };
    }
    try {
        let result;

        // RevenueCat Package objesi varsa onu kullan (Offerings/A/B test)
        if (typeof productIdOrObj === 'object' && productIdOrObj.rcPackage) {
            console.log('[RC] Purchasing package:', productIdOrObj.rcPackage.identifier);
            result = await Purchases.purchasePackage({
                aPackage: productIdOrObj.rcPackage,
            });
        } else {
            // Doğrudan product ID ile satın al
            const productIdentifier = typeof productIdOrObj === 'object'
                ? (productIdOrObj.identifier || productIdOrObj.productIdentifier)
                : productIdOrObj;

            console.log('[RC] Purchasing product:', productIdentifier);

            // Önce ürünü bul
            const productsResult = await Purchases.getProducts({
                productIdentifiers: [productIdentifier],
            });
            const product = productsResult?.products?.[0];
            if (!product) throw new Error('Product not found: ' + productIdentifier);

            result = await Purchases.purchaseStoreProduct({
                product,
            });
        }

        // Başarılı — entitlement'ları kontrol et
        const { isPremium, planId } = checkEntitlements(result?.customerInfo);
        updatePremiumStatus(isPremium, planId);
        return { success: true };
    } catch (err) {
        console.error('[RC] Purchase error:', JSON.stringify(err));
        const msg = err?.message || String(err);
        if (msg.includes('cancel') || msg.includes('Cancel') || msg.includes('PURCHASE_CANCELLED') || err?.code === 1) {
            return { success: false, error: 'cancelled' };
        }
        return { success: false, error: msg };
    }
}

/**
 * Satın almaları geri yükle.
 */
export async function restorePurchases() {
    if (!Capacitor.isNativePlatform()) {
        return { success: false, isPremium: false };
    }
    try {
        const { customerInfo } = await Purchases.restorePurchases();
        console.log('[RC] Restore complete');
        const { isPremium, planId } = checkEntitlements(customerInfo);
        updatePremiumStatus(isPremium, planId);
        return { success: true, isPremium };
    } catch (err) {
        console.warn('[RC] Restore error:', err);
        return { success: false, isPremium: false };
    }
}

/**
 * Abonelik durumunu doğrula (açılışta ve periyodik olarak).
 * isMigration=true ise, premium iptal etmez (güvenli göç).
 */
export async function verifySubscription(isMigration = false) {
    if (!Capacitor.isNativePlatform()) {
        return storageService.getItem(PREMIUM_KEY) === 'true';
    }
    try {
        const { customerInfo } = await Purchases.getCustomerInfo();
        const { isPremium, planId } = checkEntitlements(customerInfo);
        console.log('[RC] Verify → isPremium:', isPremium, isMigration ? '(migration mode)' : '');
        updatePremiumStatus(isPremium, planId, isMigration);
        return isPremium;
    } catch (err) {
        console.warn('[RC] Verify error:', err);
        // Hata durumunda mevcut cache'i ASLA silme
        return storageService.getItem(PREMIUM_KEY) === 'true';
    }
}

/**
 * Billing desteği kontrolü.
 */
export async function isBillingSupported() {
    if (!Capacitor.isNativePlatform()) return false;
    return true;
}

/**
 * Abonelik yönetimi sayfasını aç.
 */
export async function manageSubscriptions() {
    if (Capacitor.getPlatform() === 'ios') {
        window.open('https://apps.apple.com/account/subscriptions', '_blank');
    } else if (Capacitor.getPlatform() === 'android') {
        window.open('https://play.google.com/store/account/subscriptions', '_blank');
    }
}

/**
 * Satın alma güncelleme dinleyicisi.
 */
export function onPurchaseUpdate(callback) {
    purchaseListeners.push(callback);
    return () => {
        purchaseListeners = purchaseListeners.filter(fn => fn !== callback);
    };
}
