import { Capacitor } from '@capacitor/core';
import { AdMob, RewardAdPluginEvents, InterstitialAdPluginEvents, AdmobConsentStatus } from '@capacitor-community/admob';

// 🔴 Reklamlar şu an kapalı — aktif etmek için true yap
export const ADS_ENABLED = true;

const IS_NATIVE = Capacitor.isNativePlatform();

const AD_IDS = {
    REWARDED: {
        ios: 'ca-app-pub-3345957146167395/3831462313',
        android: 'ca-app-pub-3345957146167395/7443404265',
    },
    INTERSTITIAL: {
        // ⚠️ Şu an Google test ID'leri — AdMob'dan gerçek Interstitial ad unit oluşturup buraya yaz
        ios: 'ca-app-pub-3345957146167395/7195992256',
        android: 'ca-app-pub-3345957146167395/3512742007',
    },
};

let initialized = false;

export async function initAdMob() {
    if (!ADS_ENABLED || !IS_NATIVE || initialized) return;

    try {
        await AdMob.initialize({
            // Production'a geçerken false yapıldı
            initializeForTesting: false,
        });

        const consentInfo = await AdMob.requestConsentInfo();
        if (consentInfo.isConsentFormAvailable && consentInfo.status === AdmobConsentStatus.REQUIRED) {
            await AdMob.showConsentForm();
        }

        initialized = true;
    } catch (error) {
        console.error('AdMob init error:', error);
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

// ─── INTERSTITIAL AD (30 saniye sonra otomatik, 5 saniyede atlanabilir) ───

export async function showInterstitialAd() {
    console.log('[AdMob] showInterstitialAd tetiklendi. ADS_ENABLED:', ADS_ENABLED, 'IS_NATIVE:', IS_NATIVE);
    if (!ADS_ENABLED) return;
    if (!IS_NATIVE) {
        console.log('[AdMob] Web/Simule ortam - Interstitial atlandı.');
        return;
    }

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
