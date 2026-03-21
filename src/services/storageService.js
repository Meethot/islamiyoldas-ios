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
    'fontSize'
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

    async _getSecureStorage() {
        if (this._secureStorage) return this._secureStorage;
        if (!Capacitor.isNativePlatform()) return null;
        try {
            const { SecureStorage } = await import('@aparajita/capacitor-secure-storage');
            this._secureStorage = SecureStorage;
            return SecureStorage;
        } catch (e) {
            console.warn('[StorageService] SecureStorage not available:', e.message);
            return null;
        }
    }

    /**
     * Hızlı başlatma — yalnızca localStorage ↔ Preferences senkronizasyonu.
     * Splash ekranını bloklamaz. Keychain işlemleri arka planda çalışır.
     */
    async initialize() {
        console.log('[StorageService] Fast init starting…');
        const t0 = performance.now();

        // ── 1. localStorage ↔ Preferences senkronizasyonu (paralel) ──
        // Her key için Preferences değerini oku — hepsini paralel at
        const prefResults = await Promise.all(
            CRITICAL_KEYS.map(key => Preferences.get({ key }))
        );

        // Sync kararları: localStorage ve Preferences arasında eksikleri doldur
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
        // Eksik Preferences yazımlarını paralel yap
        if (writeToPrefs.length > 0) {
            await Promise.all(writeToPrefs);
        }

        // ── 2. Tüm Preferences key'lerini localStorage'a senkronize et ──
        try {
            const { keys } = await Preferences.keys();
            // Sadece localStorage'da eksik olanları bul
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
        console.log(`[StorageService] Fast init complete ✓ (${elapsed}ms)`);
        this.isReady = true;
        window.dispatchEvent(new Event('storageReady'));

        // ── 3. Keychain senkronizasyonu — splash sonrasında arka planda ──
        setTimeout(() => this._deferredKeychainSync(), 2000);
    }

    /**
     * Arka plan Keychain senkronizasyonu.
     * Uygulama silinip yeniden yüklendiğinde verilerin kaybolmamasını sağlar.
     * Splash ekranını etkilemez.
     */
    async _deferredKeychainSync() {
        const secure = await this._getSecureStorage();
        if (!secure) return;

        console.log('[StorageService] Deferred Keychain sync starting…');

        // Keychain'den geri yükleme (silip yeniden yükleme senaryosu)
        for (const key of CRITICAL_KEYS) {
            try {
                const result = await secure.get(key);
                const keychainValue = result?.value ?? null;
                const localValue = localStorage.getItem(key);

                if (keychainValue && !localValue) {
                    console.log(`[StorageService] Restoring "${key}" from Keychain`);
                    localStorage.setItem(key, keychainValue);
                    await Preferences.set({ key, value: keychainValue });
                }
            } catch {
                // Key Keychain'de yoksa hata verir, sorun değil
            }
        }

        // Mevcut localStorage anahtarlarını Keychain'e yedekle
        for (const key of CRITICAL_KEYS) {
            const localValue = localStorage.getItem(key);
            if (localValue) {
                try {
                    const result = await secure.get(key);
                    if (!result?.value) {
                        await secure.set(key, localValue);
                    }
                } catch {
                    try { await secure.set(key, localValue); } catch {}
                }
            }
        }

        console.log('[StorageService] Deferred Keychain sync complete ✓');
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
            const secure = await this._getSecureStorage();
            if (secure) {
                try { await secure.set(key, stringValue); } catch {}
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
            const secure = await this._getSecureStorage();
            if (secure) {
                try { await secure.remove(key); } catch {}
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
        const secure = await this._getSecureStorage();
        if (secure) {
            for (const key of CRITICAL_KEYS) {
                try { await secure.remove(key); } catch {}
            }
        }
    }
}

export const storageService = new StorageService();
export default storageService;
