import { Capacitor } from '@capacitor/core';
import { FacebookAnalytics } from '@capgo/capacitor-facebook-analytics';

/**
 * Meta (Facebook) App Events köprüsü.
 *
 * Neden var: Meta reklamlarının kimin uygulamayı kurduğunu ve abone olduğunu
 * görebilmesi için. RevenueCat abonelik olaylarını sunucudan sunucuya Meta'ya
 * gönderiyor ama olayı bir cihazla eşleştirebilmek için kimlik istiyor:
 *   Android → $gpsAdId (reklam kimliği, ATT gerekmez)
 *   iOS     → $idfa + ATT izni, YA DA $fbAnonId
 * Türkiye'de ATT kabul oranı düşük olduğu için $fbAnonId yolu şart —
 * eklentiye o metodu patch-package ile biz ekledik.
 *
 * SDK anahtarları (App ID / Client Token) JS'te DEĞİL, Info.plist ve
 * AndroidManifest'te duruyor; eklenti onları native tarafta okuyor.
 * Anahtarlar konmadan initAppEvents() hata verir — bu dosyadaki her çağrı
 * sessizce yutar, uygulama etkilenmez.
 */

const IS_NATIVE = Capacitor.isNativePlatform();

let sdkReady = false;
let initPromise = null;

/**
 * Meta SDK'sını başlatır. İlk açılışta çağrılmalı: kurulum ve uygulama açılışı
 * olayları SDK aktifken otomatik gider, ayrıca kimlik eşleşmesi için gereken
 * anonim kimlik ancak bundan sonra üretilir.
 *
 * ATT beklenmez — anonim kimlik izinden bağımsız çalışır. IDFA'ya bağlı kısım
 * kullanıcı izni verince `setMetaAdvertiserTracking` ile açılır.
 */
export async function initMetaSdk() {
    if (!IS_NATIVE || sdkReady) return sdkReady;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            await FacebookAnalytics.initAppEvents();
            sdkReady = true;
        } catch (error) {
            // Anahtarlar henüz yapılandırılmamış olabilir. Sessiz kal.
            console.warn('[Meta] SDK başlatılamadı:', error?.message || error);
            initPromise = null;
        }
        return sdkReady;
    })();

    return initPromise;
}

/**
 * ATT cevabından sonra çağrılır. İzin verildiyse Meta IDFA'yı kullanabilir,
 * verilmediyse reklam kimliği toplama kapatılır (anonim kimlik çalışmaya devam eder).
 */
export async function setMetaAdvertiserTracking(enabled) {
    if (!IS_NATIVE) return;
    if (!await initMetaSdk()) return;

    try {
        if (enabled) {
            await FacebookAnalytics.enableAdvertiserTracking();
        } else {
            await FacebookAnalytics.disableAdvertiserTracking();
        }
    } catch (error) {
        console.warn('[Meta] Reklam izleme ayarı uygulanamadı:', error?.message || error);
    }
}

/**
 * Meta'nın anonim cihaz kimliğini döndürür. Yoksa null.
 * (patch-package ile eklendi — bkz. patches/@capgo+capacitor-facebook-analytics)
 */
export async function getMetaAnonymousId() {
    if (!IS_NATIVE) return null;
    if (!await initMetaSdk()) return null;

    try {
        const { anonymousID } = await FacebookAnalytics.getAnonymousID();
        return anonymousID || null;
    } catch (error) {
        console.warn('[Meta] Anonim kimlik alınamadı:', error?.message || error);
        return null;
    }
}
