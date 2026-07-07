import { Capacitor } from '@capacitor/core';
import { AdMob, RewardAdPluginEvents, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { storageService } from './storageService';

// 🔴 Reklamlar şu an kapalı — aktif etmek için true yap
export const ADS_ENABLED = true;

const IS_NATIVE = Capacitor.isNativePlatform();

const AD_IDS = {
    REWARDED: {
        ios: 'ca-app-pub-3345957146167395/6853507594',
        android: 'ca-app-pub-3345957146167395/7443404265',
    },
    INTERSTITIAL: {
        // GERÇEK PRODUCTION ID'LER
        ios: 'ca-app-pub-3345957146167395/7195992256',
        android: 'ca-app-pub-3345957146167395/3512742007',
    },
    BANNER: {
        // GERÇEK PRODUCTION ID'LER
        ios: 'ca-app-pub-3345957146167395/6354842705',
        android: 'ca-app-pub-3345957146167395/4535594651',
    }
};

let initialized = false;
let initPromise = null;

// ─── Yeni Özellik: 3. Gün Reklam Kontrolü ───
export function shouldShowAds() {
    if (!ADS_ENABLED) return false;
    
    const isPremiumUser = storageService.getItem('aminKumbara_premium') === 'true';
    if (isPremiumUser) return false;

    // 3. gün kuralı: İlk 2 gün reklamsız, 3. günden itibaren reklamlar başlar
    const uniqueDaysStr = storageService.getItem('unique_days_opened');
    const uniqueDays = uniqueDaysStr ? parseInt(uniqueDaysStr, 10) : 0;
    return uniqueDays >= 3;
}

// ─── Yeni Özellik: Reklam İznini (ATT) İlk Gün Sorma ───
export function shouldInitAdMobOnLaunch() {
    const uniqueDaysStr = storageService.getItem('unique_days_opened');
    const uniqueDays = uniqueDaysStr ? parseInt(uniqueDaysStr, 10) : 0;
    return uniqueDays >= 2;
}

export async function initAdMob() {
    if (!ADS_ENABLED || !IS_NATIVE || initialized) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            // iOS için zorunlu: App Tracking Transparency (ATT) izni iste
            if (Capacitor.getPlatform() === 'ios') {
                try {
                    await AdMob.requestTrackingAuthorization();
                } catch (e) {
                    console.warn('ATT Prompt error or already answered:', e);
                }
            }

            await AdMob.initialize({
                initializeForTesting: false,
            });

            initialized = true;
            console.log('[AdMob] Başarıyla başlatıldı.');
        } catch (error) {
            console.error('AdMob init error:', error);
            initPromise = null; // Hata durumunda tekrar denenebilsin
        }
    })();

    return initPromise;
}

// Tüm reklam fonksiyonları bu helper'ı çağırır — AdMob kesinlikle hazır olana kadar bekler
async function ensureInitialized() {
    if (initialized) return true;
    if (!ADS_ENABLED || !IS_NATIVE) return false;
    try {
        await initAdMob();
        return initialized;
    } catch {
        return false;
    }
}

// ─── REWARDED AD (Amin Kumbarası: +5 kredi) ───

export async function showRewardedAd() {
    console.log('[AdMob] showRewardedAd tetiklendi. ADS_ENABLED:', ADS_ENABLED, 'IS_NATIVE:', IS_NATIVE);
    
    if (!ADS_ENABLED) return { rewarded: false, disabled: true };
    if (!IS_NATIVE) {
        console.log('[AdMob] Web/Simule ortam - 2 saniye bekletip sahte ödül veriliyor.');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { rewarded: true, simulated: true };
    }

    const platform = Capacitor.getPlatform();
    const adId = platform === 'ios'
        ? AD_IDS.REWARDED.ios
        : AD_IDS.REWARDED.android;

    console.log(`[AdMob] Platform: ${platform}, Reklam ID: ${adId}`);

    return new Promise(async (resolve, reject) => {
        let wasRewarded = false;
        let listeners = [];

        // Yardımcı fonksiyon: Bütün event listener'ları temizle
        const clearListeners = () => {
            console.log('[AdMob] Event Listenerlar temizleniyor...');
            listeners.forEach(listener => listener.remove());
            listeners = [];
        };

        try {
            // 1. Ödül kazanma event'i
            const rewardListener = await AdMob.addListener(
                RewardAdPluginEvents.Rewarded,
                (reward) => {
                    console.log('[AdMob] Ödül kazanıldı event i tetiklendi!', reward);
                    wasRewarded = true;
                }
            );
            listeners.push(rewardListener);

            // 2. Reklamın kapatılma event'i (Kullanıcı çarpıya basınca)
            const dismissListener = await AdMob.addListener(
                RewardAdPluginEvents.Dismissed,
                () => {
                    console.log('[AdMob] Reklam kapatıldı. Ödül durumu:', wasRewarded);
                    clearListeners();
                    resolve({ rewarded: wasRewarded });
                }
            );
            listeners.push(dismissListener);

            // 3. Reklamın yüklenirken veya gösterilirken hata vermesi
            const failedToLoadListener = await AdMob.addListener(
                RewardAdPluginEvents.FailedToLoad,
                (error) => {
                    console.error('[AdMob] Reklam yüklenemedi:', error);
                    clearListeners();
                    reject(error);
                }
            );
            listeners.push(failedToLoadListener);
            
            const failedToShowListener = await AdMob.addListener(
                RewardAdPluginEvents.FailedToShow,
                (error) => {
                    console.error('[AdMob] Reklam gösterilemedi:', error);
                    clearListeners();
                    reject(error);
                }
            );
            listeners.push(failedToShowListener);

            console.log('[AdMob] prepareRewardVideoAd çağrılıyor...');
            await AdMob.prepareRewardVideoAd({
                adId,
                isTesting: false, // Production modda olduğumuzdan emin olalım
                ssv: { userId: 'user', customData: 'aminKumbara' },
            });
            
            console.log('[AdMob] showRewardVideoAd çağrılıyor...');
            await AdMob.showRewardVideoAd();
            console.log('[AdMob] Reklam gösterim isteği başarıyla iletildi.');
            
        } catch (error) {
            console.error('[AdMob] Hazırlık veya gösterim aşamasında beklenmeyen hata:', error);
            clearListeners();
            reject(error);
        }
    });
}

let interstitialCount = 0;
let lastInterstitialTime = Date.now();
const MAX_DAILY_INTERSTITIALS = 10;

// Günlük sayacı localStorage'dan yükle / gece yarısında sıfırla
function getDailyInterstitialCount() {
    try {
        const today = new Date().toLocaleDateString('en-CA');
        const stored = JSON.parse(localStorage.getItem('interstitial_daily') || '{}');
        if (stored.date !== today) return 0;
        return stored.count || 0;
    } catch { return 0; }
}

function saveDailyInterstitialCount(count) {
    try {
        const today = new Date().toLocaleDateString('en-CA');
        localStorage.setItem('interstitial_daily', JSON.stringify({ date: today, count }));
    } catch {}
}

export function getInterstitialCooldown() {
    // İlk reklam: 30 saniye, 2. reklam: 1 dakika, 3. reklam: 2 dakika, 4 ve sonrakiler: 3 dakika
    if (interstitialCount === 0) return 30 * 1000;
    if (interstitialCount === 1) return 1 * 60 * 1000;
    if (interstitialCount === 2) return 2 * 60 * 1000;
    return 3 * 60 * 1000;
}

// ─── INTERSTITIAL AD (30 saniye sonra otomatik, 5 saniyede atlanabilir) ───

export async function showInterstitialAd() {
    console.log('[AdMob] showInterstitialAd tetiklendi. ADS_ENABLED:', ADS_ENABLED, 'IS_NATIVE:', IS_NATIVE);
    
    if (!shouldShowAds()) {
        console.log('[AdMob] Reklam gösterim koşulları sağlanmadı (Premium veya henüz 3. gün değil). Atlanıyor.');
        return;
    }

    if (!IS_NATIVE) {
        console.log('[AdMob] Web/Simule ortam - Interstitial atlandı.');
        return;
    }

    // Günlük limit kontrolü (max 10)
    const dailyCount = getDailyInterstitialCount();
    if (dailyCount >= MAX_DAILY_INTERSTITIALS) {
        console.log(`[AdMob] Günlük interstitial limiti doldu (${dailyCount}/${MAX_DAILY_INTERSTITIALS}). Atlanıyor.`);
        return;
    }

    // ✅ AdMob init tamamlanana kadar bekle
    const ready = await ensureInitialized();
    if (!ready) {
        console.log('[AdMob] Interstitial: AdMob başlatılamadı, atlanıyor.');
        return;
    }

    const now = Date.now();
    const cooldown = getInterstitialCooldown();
    if (now - lastInterstitialTime < cooldown) {
        console.log(`[AdMob] Interstitial cooldown aktif. Kalan süre: ${Math.round((cooldown - (now - lastInterstitialTime)) / 1000)} saniye`);
        return;
    }
    
    // Zaman damgasını hemen güncelle ki üst üste çoklu çağrı olursa hepsini göstermesin
    lastInterstitialTime = now;
    interstitialCount++;
    saveDailyInterstitialCount(dailyCount + 1);
    console.log(`[AdMob] Interstitial #${dailyCount + 1}/${MAX_DAILY_INTERSTITIALS} gösteriliyor.`);

    const platform = Capacitor.getPlatform();
    const adId = platform === 'ios'
        ? AD_IDS.INTERSTITIAL.ios
        : AD_IDS.INTERSTITIAL.android;

    console.log(`[AdMob] Interstitial Platform: ${platform}, Reklam ID: ${adId}`);

    return new Promise(async (resolve) => {
        let listeners = [];

        const clearListeners = () => {
            console.log('[AdMob] Interstitial Event Listenerlar temizleniyor...');
            listeners.forEach(listener => listener.remove());
            listeners = [];
        };

        try {
            const dismissListener = await AdMob.addListener(
                InterstitialAdPluginEvents.Dismissed,
                () => {
                    console.log('[AdMob] Interstitial Reklam kapatıldı.');
                    clearListeners();
                    resolve();
                }
            );
            listeners.push(dismissListener);

            const failedToLoadListener = await AdMob.addListener(
                InterstitialAdPluginEvents.FailedToLoad,
                (error) => {
                    console.error('[AdMob] Interstitial yüklenemedi:', error);
                    clearListeners();
                    resolve(); // Hata verse de sessizce devam et, akış kesilmesin
                }
            );
            listeners.push(failedToLoadListener);
            
            const failedToShowListener = await AdMob.addListener(
                InterstitialAdPluginEvents.FailedToShow,
                (error) => {
                    console.error('[AdMob] Interstitial gösterilemedi:', error);
                    clearListeners();
                    resolve(); // Hata verse de sessizce devam et
                }
            );
            listeners.push(failedToShowListener);

            console.log('[AdMob] prepareInterstitial çağrılıyor...');
            await AdMob.prepareInterstitial({
                adId,
                isTesting: false,
            });
            
            console.log('[AdMob] showInterstitial çağrılıyor...');
            await AdMob.showInterstitial();
            console.log('[AdMob] Interstitial gösterim isteği başarıyla iletildi.');
            
        } catch (error) {
            console.error('[AdMob] Interstitial hazırlık/gösterim aşamasında beklenmeyen hata:', error);
            clearListeners();
            resolve();
        }
    });
}

// ─── BANNER AD (Alt menü üstünde sürekli döner) ───
let bannerShouldBeVisible = false;
let bannerActive = false; // Native tarafta banner var mı (show başarılı, henüz remove edilmedi)
let bannerOpChain = Promise.resolve();

// Banner işlemlerini serileştir: eşzamanlı show/hide native tarafta (BannerExecutor)
// race yaratıp NPE crash üretiyor (Play Console: lambda$hideBanner$1)
function enqueueBannerOp(op) {
    bannerOpChain = bannerOpChain.catch(() => {}).then(op);
    return bannerOpChain;
}

export async function showBannerAd() {
    console.log('[AdMob] showBannerAd tetiklendi.');
    bannerShouldBeVisible = true;

    if (!shouldShowAds()) {
        console.log('[AdMob] Banner gösterim koşulları sağlanmadı (Premium veya 3. gün değil).');
        hideBannerAd();
        return;
    }

    if (!IS_NATIVE) {
        console.log('[AdMob] Web/Simule ortam - Banner atlandı.');
        return;
    }

    // ✅ AdMob init tamamlanana kadar bekle
    const ready = await ensureInitialized();
    if (!ready) {
        console.log('[AdMob] Banner: AdMob başlatılamadı, atlanıyor.');
        return;
    }

    const platform = Capacitor.getPlatform();
    const adId = platform === 'ios'
        ? AD_IDS.BANNER.ios
        : AD_IDS.BANNER.android;

    return enqueueBannerOp(async () => {
        // Init/kuyruk beklerken hideBannerAd çağrıldıysa gösterme
        if (!bannerShouldBeVisible) {
            console.log('[AdMob] Banner iptal edildi (hideBannerAd çağrılmış).');
            return;
        }

        try {
            await AdMob.showBanner({
                adId,
                adSize: 'ADAPTIVE_BANNER',
                position: 'BOTTOM_CENTER',
                margin: 75,
                isTesting: false
            });
            bannerActive = true;
            console.log('[AdMob] Banner başarıyla gösterildi.');
        } catch (error) {
            console.error('[AdMob] Banner gösterim hatası:', error);
        }
    });
}

export async function hideBannerAd() {
    bannerShouldBeVisible = false;
    if (!IS_NATIVE) return;

    return enqueueBannerOp(async () => {
        // Hiç gösterilmemiş / zaten silinmiş banner'ı gizlemeye çalışma —
        // remove sonrası gelen hideBanner çağrısı native NPE'nin kaynağıydı
        if (!bannerActive) return;
        bannerActive = false;

        try { await AdMob.hideBanner(); } catch (error) {}
        try { await AdMob.removeBanner(); } catch (error) {}
        // removeBanner UI thread'e iş atıp hemen döner; sıradaki banner işleminden
        // önce native tarafın temizliği bitirmesi için kısa bekleme
        await new Promise((resolve) => setTimeout(resolve, 100));
        console.log('[AdMob] Banner gizlendi ve temizlendi.');
    });
}
