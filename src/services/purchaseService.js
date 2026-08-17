import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { storageService } from './storageService';
import { setPremiumUserProperties, setAnalyticsUserId } from './analyticsService';

// RevenueCat Public API Keys
const RC_API_KEY_IOS = 'appl_hKXYxTRTsDPOKptWBGGHoFltKZc';
const RC_API_KEY_ANDROID = import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID || 'goog_YOUR_ANDROID_API_KEY_HERE';

// Entitlement ID — RevenueCat Dashboard'da tanımlı (tam olarak eşleşmeli!)
const ENTITLEMENT_ID = 'İslami Yoldas Pro';

export const PRODUCT_IDS = {
    MONTHLY: 'com.islamiyoldas.app.monthly',
    YEARLY: 'com.islamiyoldas.app.yearly',
    YEARLY_OFFER_499: 'com.islamiyoldas.app.yearly.offer.499',
    YEARLY_OFFER_399: 'com.islamiyoldas.app.yearly.offer.399',
};

const PREMIUM_KEY = 'aminKumbara_premium';
const MIGRATION_KEY = 'rc_sdk_migration_done';

let isInitialized = false;
let isConfiguring = false;
let initPromise = null;
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
    
    // 🛡️ Fallback: Eğer spesifik ID eşleşmediyse ama içeride aktif başka bir entitlement varsa onu kullan.
    // Bu, test ortamlarında veya dashboard'da ID ismi değiştiğinde hatayı önler.
    const anyActiveEntitlement = Object.values(customerInfo.entitlements.active)[0];
    
    const activeEntitlement = premiumEntitlement || anyActiveEntitlement;

    if (activeEntitlement) {
        return {
            isPremium: true,
            planId: activeEntitlement.productIdentifier || 'premium',
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

    if (initPromise) return initPromise;

    initPromise = (async () => {
        isConfiguring = true;
        const isMigrating = !storageService.getItem(MIGRATION_KEY);
        const hadPremiumBefore = storageService.getItem(PREMIUM_KEY) === 'true';

        if (isMigrating) {
            console.log('[RC] 🔄 First SDK init — migration mode active. Current premium:', hadPremiumBefore);
        }

        try {
            const platform = Capacitor.getPlatform();
            const apiKey = platform === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;

            console.log(`[RC] Configuring for platform: ${platform} using key: ${apiKey.substring(0, 12)}...`);

            // SDK'yı yapılandır
            await Purchases.configure({
                apiKey: apiKey,
            });

            // Verbose log sadece geliştirme build'inde
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

            // Amplitude ↔ RevenueCat kullanıcı eşleşmesi: RC'nin app user ID'si
            // Amplitude userId olur — ödeme olayları analitikte aynı kullanıcıda birleşir.
            try {
                const { appUserID } = await Purchases.getAppUserID();
                setAnalyticsUserId(appUserID);
            } catch (e) {
                console.warn('[RC] getAppUserID failed:', e);
            }

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
            initPromise = null;
        } finally {
            isConfiguring = false;
        }
    })();

    return initPromise;
}

/**
 * Offerings'i al (A/B test desteği).
 * RevenueCat Dashboard'dan kontrol edilen farklı paketleri döndürür.
 */
export async function getOfferings() {
    if (!Capacitor.isNativePlatform()) return null;
    if (!isInitialized) { // init devam ediyorsa initializePurchases in-flight initPromise'i döndürür, bekleriz
        await initializePurchases();
    }
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
 * A/B test ve Limited Offer: İstenirse belirli bir vitrin (offeringIdentifier) çekilebilir.
 */
export async function getProducts(offeringIdentifier = 'current') {
    if (!Capacitor.isNativePlatform()) {
        if (offeringIdentifier !== 'current') return [];
        return [
            { identifier: PRODUCT_IDS.MONTHLY, priceString: '₺124,99', price: 124.99, currencyCode: 'TRY', title: 'Aylık Premium', description: 'Aylık abonelik' },
            { identifier: PRODUCT_IDS.YEARLY, priceString: '₺739,99', price: 739.99, currencyCode: 'TRY', title: 'Yıllık Premium', description: 'Yıllık abonelik' },
        ];
    }
    if (!isInitialized) { // init devam ediyorsa initializePurchases in-flight initPromise'i döndürür, bekleriz
        await initializePurchases();
    }
    try {
        // Önce Offerings'den çek (A/B test desteği)
        const offerings = await getOfferings();
        const targetOffering = offeringIdentifier === 'current' 
            ? offerings?.current 
            : offerings?.all?.[offeringIdentifier]; // HATA DÜZELTİLDİ: || offerings?.current KISMI SİLİNDİ

        if (targetOffering?.availablePackages?.length) {
            return targetOffering.availablePackages.map(pkg => ({
                identifier: pkg.product.identifier,
                packageType: pkg.packageType, // RevenueCat packageType (e.g., 'MONTHLY', 'ANNUAL')
                priceString: pkg.product.priceString,
                price: pkg.product.price,
                currencyCode: pkg.product.currencyCode,
                title: pkg.product.title,
                description: pkg.product.description,
                rcPackage: pkg, // RevenueCat package objesi — purchasePackage için
                offeringId: targetOffering.identifier,
            }));
        }

        // Fallback: Eğer spesifik bir vitrin istenmiş ama bulunamamışsa boş dön
        // Böylece çağıran yer kendi fallback'ini yapabilir (örn: PremiumPaywall)
        if (offeringIdentifier !== 'current') {
            return [];
        }

        // Fallback: Sadece 'current' ana vitrin istenmişse ve bulunamamışsa standart ürünleri getir
        const productsResult = await Purchases.getProducts({
            productIdentifiers: [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.YEARLY],
        });
        const products = productsResult?.products || [];
        return products.map(p => ({
            identifier: p.identifier,
            priceString: p.priceString,
            price: p.price,
            currencyCode: p.currencyCode,
            title: p.title,
            description: p.description,
        }));
    } catch (err) {
        console.warn('[RC] getProducts error:', err);
        return [];
    }
}

/**
 * Belirli ürün ID'leri için paketleri RevenueCat üzerinden getirir.
 * Downsell (Özel İndirim) popup'ında kullanılmak üzere eklendi.
 * @param {Array<string>} productIdentifiers (Örn: [PRODUCT_IDS.YEARLY_OFFER_499])
 */
export async function getSpecificProducts(productIdentifiers) {
    if (!Capacitor.isNativePlatform()) {
        return productIdentifiers.map(id => ({
            identifier: id,
            priceString: id.includes('499') ? '₺499,99' : '₺399,99',
            price: id.includes('499') ? 499.99 : 399.99,
            currencyCode: 'TRY',
            title: id.includes('499') ? 'Özel Yıllık Premium' : 'Sınırlı Yıllık Premium',
            description: 'İndirimli Yıllık Abonelik'
        }));
    }

    if (!isInitialized) { // init devam ediyorsa initializePurchases in-flight initPromise'i döndürür, bekleriz
        await initializePurchases();
    }
    
    try {
        const productsResult = await Purchases.getProducts({
            productIdentifiers,
        });
        const products = productsResult?.products || [];
        return products.map(p => ({
            identifier: p.identifier,
            priceString: p.priceString,
            price: p.price,
            currencyCode: p.currencyCode,
            title: p.title,
            description: p.description,
        }));
    } catch (err) {
        console.warn('[RC] getSpecificProducts error:', err);
        return [];
    }
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
    if (!isInitialized) { // init devam ediyorsa initializePurchases in-flight initPromise'i döndürür, bekleriz
        await initializePurchases();
    }
    try {
        let result;

        // RevenueCat Package objesi varsa onu kullan (Offerings/A/B test)
        if (typeof productIdOrObj === 'object' && productIdOrObj.rcPackage) {
            const wantedOfferingId = productIdOrObj.offeringId || productIdOrObj.rcPackage.offeringIdentifier;
            const wantedPkgId = productIdOrObj.rcPackage.identifier;
            console.log('[RC] Purchasing package:', wantedPkgId, 'from offering:', wantedOfferingId);

            let packageToBuy = productIdOrObj.rcPackage;
            try {
                // Taze paketi SADECE kullanıcının gerçekte gördüğü vitrinden çek.
                // ⚠️ Tüm vitrinlerde aramak YANLIŞ: paket id'leri ($rc_annual vb.) vitrinler
                // arası ortaktır; yanlış vitrinin paketi Google Play'de "invalid arguments" verir.
                const offerings = await Purchases.getOfferings();
                // İstenen vitrin taze listede yoksa current'a DÜŞME — current'ın $rc_annual'ı
                // tam fiyatlı üründür; indirim gösterip tam fiyat çekmiş olurduk.
                // Bulunamazsa eldeki rcPackage ile devam edilir.
                const targetOffering = wantedOfferingId
                    ? offerings?.all?.[wantedOfferingId]
                    : offerings?.current;
                const foundPkg = targetOffering?.availablePackages?.find(p => p.identifier === wantedPkgId);
                if (foundPkg) packageToBuy = foundPkg;
            } catch (e) {
                console.warn('[RC] Failed to fetch fresh package, using provided one', e);
            }

            result = await Purchases.purchasePackage({
                aPackage: packageToBuy,
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
        return { success: true, isPremium };
    } catch (err) {
        console.error('[RC] Purchase error:', JSON.stringify(err));
        const info = err?.data || {}; // Capacitor: native userInfo (readableErrorCode, underlyingErrorMessage) buraya düşer
        const msg = err?.message || String(err);
        const readable = info.readableErrorCode || info.readable_error_code || '';
        const underlying = info.underlyingErrorMessage || '';
        // İptal tespiti: önce güvenilir sinyaller (RC readable kodu / hata kodu 1),
        // sonra mağazaların BİLİNEN iptal metinleri. Eskiden ham `includes('cancel')`
        // vardı: içinde "cancel" geçen alakasız store hataları da "kullanıcı vazgeçti"
        // sayılıp analytics'i kirletiyordu.
        const CANCEL_PATTERN = /user cancell?ed|purchase cancell?ed|cancell?ed by (the )?user|USER_CANCELED|USER_CANCELLED|PURCHASE_CANCELLED|SKErrorPaymentCancelled/i;
        if (
            readable === 'PURCHASE_CANCELLED' ||
            err?.code === 1 || err?.code === '1' ||
            CANCEL_PATTERN.test(msg) ||
            CANCEL_PATTERN.test(underlying)
        ) {
            return { success: false, error: 'cancelled' };
        }
        // Asıl sebep (store hata kodu) analytics'e gider; UI tarafı getErrorMessage ile kullanıcı-dostu mesaja çevirir
        const detail = [readable, underlying].filter(Boolean).join(' | ');
        return { success: false, error: detail ? `${msg} [${detail}]` : msg };
    }
}

/**
 * Satın almaları geri yükle.
 */
export async function restorePurchases() {
    if (!Capacitor.isNativePlatform()) {
        return { success: false, isPremium: false };
    }
    if (!isInitialized) { // init devam ediyorsa initializePurchases in-flight initPromise'i döndürür, bekleriz
        await initializePurchases();
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
    if (!isInitialized) { // init devam ediyorsa initializePurchases in-flight initPromise'i döndürür, bekleriz
        await initializePurchases();
    }
    try {
        const { customerInfo } = await Purchases.getCustomerInfo();
        const { isPremium, planId } = checkEntitlements(customerInfo);
        console.log('[RC] Verify → isPremium:', isPremium, isMigration ? '(migration mode)' : '');

        // ÇEVRİMDIŞI GÜVENLİĞİ: Cihaz internetsizse ve kullanıcı daha önce premium ise, aboneliği İPTAL ETME.
        // Çünkü abonelik App Store'dan yenilenmiş olabilir ama internetsiz olduğu için fiş RC'ye ulaşmamıştır.
        const current = storageService.getItem(PREMIUM_KEY) === 'true';
        if (!navigator.onLine && current && !isPremium) {
            console.warn('[RC] ⚠️ Offline safety: Device is offline. Keeping existing premium status.');
            return true;
        }

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
