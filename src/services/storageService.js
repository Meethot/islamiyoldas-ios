import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

// Uygulama silinse bile korunması gereken veriler
const CRITICAL_KEYS = [
    'onboardingComplete',
    'userData',
    'userProfile',
    'aminKumbara_premium',
    'aminKumbara_credits',
    'aminKumbara_totalAmins',
    'tubaAgaci_data',
    'notifications',
    'userAvatar',
    'userStreak',
    'app_data_version',
    'cached_address',
    'cached_district',
    'cached_country_code',
    'selectedLanguage',
    'darkMode',
    'fontSize',
    // Kaza sayaçları — kullanıcının yıllarca biriktirdiği borç kaydı.
    // Sadece localStorage'daydı: uygulama silinip kurulunca ve iOS depolama
    // baskısında WKWebView localStorage'ı temizlediğinde geri dönüşsüz gidiyordu.
    'qadaCounts',
    'qadaGoal',
    // Öğren > Dualar favorileri — kullanıcının kendi seçtiği kısa liste.
    'dua_favorites',
    // Sure ezber ilerlemesi ve tekrar takvimi — haftalarca emek verilen kayıt.
    'sure_ezber_v1'
];

/**
 * StorageService: 3 katmanlı depolama sistemi
 * 1. localStorage (hızlı, senkron okuma)
 * 2. Capacitor Preferences (native yedek)
 * 3. Secure Storage / Keychain (uygulama silinse bile kalır)
 *
 * Uygulama silinip yeniden yüklendiğinde:
 * → localStorage ve Preferences boş olur
 * → Keychain'den veriler geri yüklenir
 */
class StorageService {
    isReady = false;
    _secureStorage = null;
    wasReinstall = false; // Flag to notify consumers about reinstall

    async _initSecureStorage() {
        if (this._secureStorage) return true;
        if (!Capacitor.isNativePlatform()) return false;
        try {
            const { SecureStorage } = await import('@aparajita/capacitor-secure-storage');
            this._secureStorage = SecureStorage;
            return true;
        } catch (e) {
            console.warn('[StorageService] SecureStorage not available:', e.message);
            return false;
        }
    }

    /**
     * Başlatma — Reinstall tespiti yaparak Keychain'den geri yükleme yapar.
     * storageReady event'i ancak Keychain restore tamamlandıktan SONRA tetiklenir.
     */
    async initialize() {
        console.log('[StorageService] Init starting…');
        const t0 = performance.now();

        // ── 0. Reinstall tespiti ──
        // localStorage VE Preferences ikisi de boşsa → silip yeniden yükleme
        const localHasData = localStorage.getItem('has_launched_before');
        const prefResult = await Preferences.get({ key: 'has_launched_before' });
        const isReinstall = Capacitor.isNativePlatform() && !localHasData && !prefResult.value;

        // ── 1. Reinstall ise ÖNCE Keychain'den geri yükle ──
        if (isReinstall) {
            this.wasReinstall = true;
            await this._restoreFromKeychain();
        }

        // ── 2. localStorage ↔ Preferences senkronizasyonu (paralel) ──
        const prefResults = await Promise.all(
            CRITICAL_KEYS.map(key => Preferences.get({ key }))
        );

        const writeToPrefs = [];
        for (let i = 0; i < CRITICAL_KEYS.length; i++) {
            const key = CRITICAL_KEYS[i];
            const localValue = localStorage.getItem(key);
            const prefValue = prefResults[i].value;

            if (localValue && !prefValue) {
                writeToPrefs.push(Preferences.set({ key, value: localValue }));
            } else if (!localValue && prefValue) {
                localStorage.setItem(key, prefValue);
            }
        }
        if (writeToPrefs.length > 0) {
            await Promise.all(writeToPrefs);
        }

        // ── 3. Tüm Preferences key'lerini localStorage'a senkronize et ──
        try {
            const { keys } = await Preferences.keys();
            const missingKeys = keys.filter(k => !localStorage.getItem(k));
            if (missingKeys.length > 0) {
                const missingResults = await Promise.all(
                    missingKeys.map(k => Preferences.get({ key: k }))
                );
                missingResults.forEach((result, idx) => {
                    if (result.value) {
                        localStorage.setItem(missingKeys[idx], result.value);
                    }
                });
            }
        } catch (e) {
            console.error('[StorageService] Deep sync failed:', e);
        }

        const elapsed = Math.round(performance.now() - t0);
        console.log(`[StorageService] Init complete ✓ (${elapsed}ms) reinstall=${isReinstall}`);
        this.isReady = true;
        window.dispatchEvent(new Event('storageReady'));

        // ── 4. Arka planda Keychain'e yedekleme (restore değil) ──
        setTimeout(() => this._backupToKeychain(), 2000);
    }

    /**
     * Keychain'den localStorage ve Preferences'a geri yükleme.
     * SADECE initialize() içinden, storageReady'den ÖNCE çağrılır.
     */
    async _restoreFromKeychain() {
        const isReady = await this._initSecureStorage();
        if (!isReady) {
            console.warn('[StorageService] Keychain not available, skipping restore');
            return;
        }
        const secure = this._secureStorage;

        console.log('[StorageService] 🔄 Reinstall detected — restoring from Keychain…');

        let restoredCount = 0;
        const writeToPrefs = [];

        for (const key of CRITICAL_KEYS) {
            try {
                const keychainValue = await secure.getItem(key);
                if (keychainValue) {
                    localStorage.setItem(key, keychainValue);
                    writeToPrefs.push(Preferences.set({ key, value: keychainValue }));
                    restoredCount++;
                    console.log(`[StorageService] ✅ Restored "${key}" from Keychain`);
                }
            } catch {
                // Key Keychain'de yoksa hata verir, sorun değil
            }
        }

        if (writeToPrefs.length > 0) {
            await Promise.all(writeToPrefs);
        }

        console.log(`[StorageService] Keychain restore complete: ${restoredCount} keys restored`);
    }

    /**
     * Mevcut localStorage verilerini Keychain'e yedekle.
     * Arka planda çalışır, splash ekranını etkilemez.
     */
    async _backupToKeychain() {
        const isReady = await this._initSecureStorage();
        if (!isReady) return;
        const secure = this._secureStorage;

        console.log('[StorageService] Keychain backup starting…');

        for (const key of CRITICAL_KEYS) {
            const localValue = localStorage.getItem(key);
            if (localValue) {
                try {
                    await secure.setItem(key, localValue);
                } catch {
                    // Keychain yazma hatası — kritik değil
                }
            }
        }

        console.log('[StorageService] Keychain backup complete ✓');
    }

    /**
     * Veriyi 3 katmana yazar: localStorage + Preferences + Keychain (kritik ise)
     */
    async setItem(key, value) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, stringValue);
        await Preferences.set({ key, value: stringValue });

        // Kritik anahtar ise Keychain'e de yaz
        if (CRITICAL_KEYS.includes(key)) {
            const isReady = await this._initSecureStorage();
            if (isReady) {
                const secure = this._secureStorage;
                try { await secure.setItem(key, stringValue); } catch {}
            }
        }
    }

    /**
     * Senkron okuma (localStorage üzerinden, init sırasında senkronize edilmiş olmalı)
     */
    getItem(key) {
        return localStorage.getItem(key);
    }

    /**
     * Veriyi 3 katmandan da siler.
     */
    async removeItem(key) {
        localStorage.removeItem(key);
        await Preferences.remove({ key });

        if (CRITICAL_KEYS.includes(key)) {
            const isReady = await this._initSecureStorage();
            if (isReady) {
                const secure = this._secureStorage;
                try { await secure.removeItem(key); } catch {}
            }
        }
    }

    /**
     * Hesap silme: TÜM verileri 3 katmandan temizler.
     */
    async clearAll() {
        // 1. localStorage
        localStorage.clear();

        // 2. Preferences
        await Preferences.clear();

        // 3. Keychain (kritik key'ler)
        const isReady = await this._initSecureStorage();
        if (isReady) {
            const secure = this._secureStorage;
            for (const key of CRITICAL_KEYS) {
                try { await secure.removeItem(key); } catch {}
            }
        }
    }
}

export const storageService = new StorageService();
export default storageService;
