import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const PERM_KEYS = {
    location: { count: 'perm_loc_count_v2', time: 'perm_loc_time_v2' },
    notification: { count: 'perm_notif_count_v2', time: 'perm_notif_time_v2' },
};

const MAX_ASKS = 3;
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 1 day

// Module-level session guards
let _sessionFlowStarted = false;
let _notificationPending = false; // Survives unmount when user navigates away

function shouldShowPermission(type) {
    const keys = PERM_KEYS[type];
    const count = parseInt(localStorage.getItem(keys.count) || '0', 10);
    if (count >= MAX_ASKS) return false;

    const lastDismiss = parseInt(localStorage.getItem(keys.time) || '0', 10);
    if (lastDismiss && (Date.now() - lastDismiss < COOLDOWN_MS)) return false;

    return true;
}

// Check actual OS notification permission before showing card
async function shouldShowNotificationCard() {
    if (!shouldShowPermission('notification')) return false;
    try {
        const { display } = await LocalNotifications.checkPermissions();
        // Only show if OS permission is NOT granted
        return display !== 'granted';
    } catch {
        return false; // Can't check — don't annoy user
    }
}

export function useSmartPermissions(locationStatus) {
    const [permissionCard, setPermissionCard] = useState(null);
    
    // Refs to hold stable references for timers (no stale closures)
    const locationStatusRef = useRef(locationStatus);
    const cardRef = useRef(null);
    
    // Sync refs with latest values — must be in effect, not render (react-hooks/refs)
    useEffect(() => { locationStatusRef.current = locationStatus; }, [locationStatus]);
    useEffect(() => { cardRef.current = permissionCard; }, [permissionCard]);

    const recordDismiss = useCallback((type) => {
        const keys = PERM_KEYS[type];
        const count = parseInt(localStorage.getItem(keys.count) || '0', 10);
        localStorage.setItem(keys.count, String(count + 1));
        localStorage.setItem(keys.time, String(Date.now()));
    }, []);

    const recordSuccess = useCallback((type) => {
        const keys = PERM_KEYS[type];
        localStorage.setItem(keys.count, String(MAX_ASKS)); // Never ask again
    }, []);

    // Helper: try to show notification card (checks OS permission first)
    const tryShowNotification = useCallback(async () => {
        if (await shouldShowNotificationCard()) {
            setPermissionCard('notification');
        }
    }, []);

    // Single entry point — runs exactly ONCE per app session
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        
        // If there's a pending notification from a previous mount (user navigated away and came back)
        if (_notificationPending) {
            _notificationPending = false;
            const timer = setTimeout(() => tryShowNotification(), 1500);
            return () => clearTimeout(timer);
        }
        
        if (_sessionFlowStarted) return;
        _sessionFlowStarted = true;

        // Phase 1: Wait 2.5s, then decide what to show
        const initialTimer = setTimeout(() => {
            const locGranted = 
                localStorage.getItem('location_permission_granted') === 'true' || 
                locationStatusRef.current === 'granted';

            if (!locGranted && shouldShowPermission('location')) {
                setPermissionCard('location');
            } else {
                // Location already granted or exhausted — go straight to notification
                setTimeout(() => tryShowNotification(), 1500);
            }
        }, 2500);

        return () => clearTimeout(initialTimer);
    }, []); // Intentionally empty — runs once, reads refs for latest values

    const scheduleNotificationAfterLocation = useCallback((willNavigateAway = false) => {
        if (willNavigateAway) {
            // User is navigating to settings — flag it for when they return to Home
            _notificationPending = true;
            return;
        }
        // User stayed on Home (dismissed via backdrop/drag or accepted)
        setTimeout(() => tryShowNotification(), 3500);
    }, [tryShowNotification]);

    const dismissCurrentCard = useCallback(() => {
        const current = cardRef.current;
        setPermissionCard(null);
        if (current) recordDismiss(current);

        if (current === 'location') {
            scheduleNotificationAfterLocation(false);
        }
    }, [recordDismiss, scheduleNotificationAfterLocation]);

    const markCurrentSuccess = useCallback(() => {
        const current = cardRef.current;
        setPermissionCard(null);
        if (current) recordSuccess(current);

        if (current === 'location') {
            scheduleNotificationAfterLocation(false);
        }
    }, [recordSuccess, scheduleNotificationAfterLocation]);

    const handleManualRedirect = useCallback((type) => {
        setPermissionCard(null);
        recordDismiss(type);
        if (type === 'location') {
            scheduleNotificationAfterLocation(true); // will navigate away
        }
    }, [recordDismiss, scheduleNotificationAfterLocation]);

    return {
        permissionCard,
        dismissCurrentCard,
        markCurrentSuccess,
        handleManualRedirect
    };
}
