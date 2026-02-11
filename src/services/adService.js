import { Capacitor } from '@capacitor/core';
import { AdMob, RewardAdPluginEvents, InterstitialAdPluginEvents, AdmobConsentStatus } from '@capacitor-community/admob';

// 🔴 Reklamlar şu an kapalı — aktif etmek için true yap
export const ADS_ENABLED = false;

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
            // ⚠️ Production'a geçerken false yap
            initializeForTesting: true,
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
    if (!ADS_ENABLED) return { rewarded: false, disabled: true };
    if (!IS_NATIVE) {
        console.log('[DEV] Rewarded reklam simülasyonu...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { rewarded: true, simulated: true };
    }

    const adId = Capacitor.getPlatform() === 'ios'
        ? AD_IDS.REWARDED.ios
        : AD_IDS.REWARDED.android;

    return new Promise(async (resolve, reject) => {
        let wasRewarded = false;

        const rewardListener = AdMob.addListener(
            RewardAdPluginEvents.Rewarded,
            () => { wasRewarded = true; }
        );

        const dismissListener = AdMob.addListener(
            RewardAdPluginEvents.Dismissed,
            () => {
                rewardListener.remove();
                dismissListener.remove();
                failedListener.remove();
                resolve({ rewarded: wasRewarded });
            }
        );

        const failedListener = AdMob.addListener(
            RewardAdPluginEvents.FailedToLoad,
            (error) => {
                rewardListener.remove();
                dismissListener.remove();
                failedListener.remove();
                reject(error);
            }
        );

        try {
            await AdMob.prepareRewardVideoAd({
                adId,
                // ⚠️ Production'a geçerken false yap
                isTesting: true,
                ssv: { userId: 'user', customData: 'aminKumbara' },
            });
            await AdMob.showRewardVideoAd();
        } catch (error) {
            rewardListener.remove();
            dismissListener.remove();
            failedListener.remove();
            reject(error);
        }
    });
}

// ─── INTERSTITIAL AD (30 saniye sonra otomatik, 5 saniyede atlanabilir) ───

export async function showInterstitialAd() {
    if (!ADS_ENABLED) return;
    if (!IS_NATIVE) {
        console.log('[DEV] Interstitial reklam simülasyonu...');
        return;
    }

    const adId = Capacitor.getPlatform() === 'ios'
        ? AD_IDS.INTERSTITIAL.ios
        : AD_IDS.INTERSTITIAL.android;

    return new Promise(async (resolve) => {
        const dismissListener = AdMob.addListener(
            InterstitialAdPluginEvents.Dismissed,
            () => {
                dismissListener.remove();
                failedListener.remove();
                resolve();
            }
        );

        const failedListener = AdMob.addListener(
            InterstitialAdPluginEvents.FailedToLoad,
            () => {
                dismissListener.remove();
                failedListener.remove();
                resolve(); // Sessizce devam et
            }
        );

        try {
            await AdMob.prepareInterstitial({
                adId,
                // ⚠️ Production'a geçerken false yap
                isTesting: true,
            });
            await AdMob.showInterstitial();
        } catch {
            dismissListener.remove();
            failedListener.remove();
            resolve();
        }
    });
}
