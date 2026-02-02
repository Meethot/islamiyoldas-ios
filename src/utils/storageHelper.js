/**
 * Safe Storage Utilities
 *
 * Provides crash-resistant localStorage access with automatic
 * corruption detection and self-healing capabilities.
 */

/**
 * Safely retrieve and parse JSON from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist or is corrupted
 * @returns {*} Parsed value or default
 */
export const safeGetStorage = (key, defaultValue = null) => {
    try {
        const stored = localStorage.getItem(key);

        // Handle missing or invalid values
        if (!stored || stored === 'undefined' || stored === 'null') {
            return defaultValue;
        }

        return JSON.parse(stored);
    } catch (error) {
        console.warn(`[StorageHelper] Corruption detected for key "${key}". Resetting to default.`, error);

        // Self-heal by removing corrupted data
        localStorage.removeItem(key);

        return defaultValue;
    }
};

/**
 * Safely save JSON to localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON.stringify'd)
 * @returns {boolean} Success status
 */
export const safeSetStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`[StorageHelper] Failed to save "${key}"`, error);
        return false;
    }
};

/**
 * Safely remove a key from localStorage
 * @param {string} key - Storage key
 */
export const safeRemoveStorage = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`[StorageHelper] Failed to remove "${key}"`, error);
    }
};

/**
 * Check if a storage key exists and contains valid data
 * @param {string} key - Storage key
 * @returns {boolean}
 */
export const hasValidStorage = (key) => {
    try {
        const stored = localStorage.getItem(key);
        if (!stored || stored === 'undefined' || stored === 'null') return false;
        JSON.parse(stored); // Test parse
        return true;
    } catch {
        return false;
    }
};
