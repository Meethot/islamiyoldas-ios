import { Preferences } from '@capacitor/preferences';

const CRITICAL_KEYS = [
    'onboardingComplete',
    'userData',
    'userProfile',
    'aminKumbara_premium',
    'aminKumbara_credits',
    'tubaAgaci_data',
    'notifications',
    'userAvatar',
    'userStreak',
    'app_data_version',
    'cached_address',
    'cached_district',
    'cached_country_code'
];

/**
 * StorageService: localStorage ve Capacitor Preferences arasında köprü kurar.
 * Verilerin kaybolmasını engellemek için çift yazma ve otomatik senkronizasyon yapar.
 */
class StorageService {
    isReady = false;

    async initialize() {
        console.log('[StorageService] Initializing and synchronizing storage...');
        
        // Final fallback: check explicitly for critical keys if not in keys()
        for (const key of CRITICAL_KEYS) {
            const localValue = localStorage.getItem(key);
            const { value: prefValue } = await Preferences.get({ key });
            if (localValue && !prefValue) {
                await Preferences.set({ key, value: localValue });
            } else if (!localValue && prefValue) {
                localStorage.setItem(key, prefValue);
            }
        }

        // Extra Safety: sync EVERYTHING from Preferences to localStorage
        try {
            const { keys } = await Preferences.keys();
            for (const key of keys) {
                const localValue = localStorage.getItem(key);
                const { value: prefValue } = await Preferences.get({ key });
                if (!localValue && prefValue) {
                    console.log(`[StorageService] Auto-restoring ${key} from Preferences`);
                    localStorage.setItem(key, prefValue);
                }
            }
        } catch (e) {
            console.error('[StorageService] Deep sync failed:', e);
        }

        console.log('[StorageService] Synchronization complete.');
        this.isReady = true;
        window.dispatchEvent(new Event('storageReady'));
    }

    /**
     * Veriyi her iki yere de yazar.
     */
    async setItem(key, value) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, stringValue);
        await Preferences.set({ key, value: stringValue });
    }

    /**
     * Veriyi okur (Senkron olarak localStorage kullanılır, ama init sırasında senkronize edilmiş olmalıdır).
     */
    getItem(key) {
        return localStorage.getItem(key);
    }

    /**
     * Veriyi her iki yerden de siler.
     */
    async removeItem(key) {
        localStorage.removeItem(key);
        await Preferences.remove({ key });
    }
}

export const storageService = new StorageService();
export default storageService;
