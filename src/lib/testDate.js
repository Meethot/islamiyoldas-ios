// Global Test Date Utility
// This allows testing day-by-day progression across the entire app

/**
 * Get the current app date with test offset applied
 * This is used throughout the app instead of `new Date()` for consistency
 */
export const getAppDate = () => {
    const testDayOffset = parseInt(localStorage.getItem('appTestDayOffset') || '0', 10);
    const date = new Date();

    if (testDayOffset !== 0) {
        date.setDate(date.getDate() + testDayOffset);
    }

    return date;
};

/**
 * Get current test day offset
 */
export const getTestDayOffset = () => {
    return parseInt(localStorage.getItem('appTestDayOffset') || '0', 10);
};

/**
 * Advance to next day (for testing)
 * Clears daily data and reloads the app
 */
export const advanceTestDay = () => {
    const currentOffset = getTestDayOffset();
    const newOffset = currentOffset + 1;

    // Save new offset
    localStorage.setItem('appTestDayOffset', newOffset.toString());

    // Clear daily-specific data to simulate new day
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Keep certain keys, remove others for fresh day
        if (key && (
            key.includes('dailyDeed') ||
            key.includes('lastRevealed') ||
            key.startsWith('dailyPrayers_') || // Reset completed prayers (date-specific)
            key === 'fakeDuasSelection' ||       // Reset dua kardeşliği cache
            key === 'fakeDuasCounts'              // Reset amin counts on fake duas
        )) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Reload page to apply changes
    window.location.reload();
};

/**
 * Reset test mode back to real current date
 */
export const resetTestDay = () => {
    localStorage.removeItem('appTestDayOffset');

    // Clear test-related data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('dailyDeed') || key.includes('lastRevealed'))) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    window.location.reload();
};

/**
 * Get today's date string in YYYY-MM-DD format (with test offset)
 */
export const getTodayString = () => {
    const date = getAppDate();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get day of year (1-365/366) with test offset
 */
export const getDayOfYear = () => {
    const date = getAppDate();
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
    return dayOfYear;
};

/**
 * Get date key for daily prayers storage
 * @returns {string} e.g., "dailyPrayers_2026-2-2"
 */
export const getDailyPrayersKey = () => {
    return `dailyPrayers_${getTodayString()}`;
};

/**
 * Get date key for Murakabe completion storage
 * @returns {string} e.g., "divine_companionship_murakabe_2026-2-2"
 */
export const getMurakabeKey = () => {
    const date = getAppDate();
    return `divine_companionship_murakabe_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

/**
 * Get date key for Mizan (balance) data storage
 * @returns {string} e.g., "mizan_data_2026-2-2"
 */
export const getMizanKey = () => {
    const date = getAppDate();
    return `mizan_data_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

/**
 * Check if current time is midnight (for day transition checks)
 * @returns {boolean}
 */
export const isMidnight = () => {
    const now = new Date();
    return now.getHours() === 0 && now.getMinutes() === 0;
};

