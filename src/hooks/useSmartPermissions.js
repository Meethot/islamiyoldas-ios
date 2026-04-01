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

    // Web platform fallback functionality for development
    if (Capacitor.getPlatform() === 'web') {
        return localStorage.getItem('web_notification_prompted') !== 'true';
    }

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
    const locationStatusRef = useRef(locationStatus);
    const cardRef = useRef(null);
    const timeoutRef = useRef(null);

    // Güncel referansların tutulması
    useEffect(() => { locationStatusRef.current = locationStatus; }, [locationStatus]);
    useEffect(() => { cardRef.current = permissionCard; }, [permissionCard]);
    
    // Unmount (sayfa değişimi vs) durumunda var olan timer'ları temizleriz (hafıza kaçağını önlemek için)
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const recordDismiss = useCallback((type) => {
        const keys = PERM_KEYS[type];
        const count = parseInt(localStorage.getItem(keys.count) || '0', 10);
        localStorage.setItem(keys.count, String(count + 1));
        localStorage.setItem(keys.time, String(Date.now()));
    }, []);

    const recordSuccess = useCallback((type) => {
        const keys = PERM_KEYS[type];
        localStorage.setItem(keys.count, String(MAX_ASKS)); // Bir daha sormaması için kalıcı doldur
    }, []);

    // Konum izni bittikten sonra olacaklar: Ya hemen başka sayfaya gidecek ya da 6.5s bekleyecek
    const scheduleNotificationAfterLocation = useCallback((willNavigateAway = false) => {
        _notificationPending = true;

        if (willNavigateAway) {
            // Ayarlara vs gidiyor, geldiğinde göstereceğiz
            return;
        }

        // Anasayfada kalıyorsa, arka arkaya bombardıman yapmamak için 6.5 saniye bekle
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            if (_notificationPending && await shouldShowNotificationCard()) {
                setPermissionCard('notification');
                _notificationPending = false;
            } else {
                _notificationPending = false;
            }
        }, 6500);
    }, []);

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
            scheduleNotificationAfterLocation(true); // Ayarlara gidiyor
        }
    }, [recordDismiss, scheduleNotificationAfterLocation]);

    // Ana tetikleyici - Bileşen her mount olduğunda tek sefer
    useEffect(() => {
        // Önceden bekleyen bir bildirim kartı akışı var mı? (Gezinip geri gelmişse)
        if (_notificationPending) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(async () => {
                if (_notificationPending && await shouldShowNotificationCard()) {
                    setPermissionCard('notification');
                    _notificationPending = false;
                } else {
                    _notificationPending = false;
                }
            }, 1000); // Geri döndüğünde de hemen çıkmasın diye çok ufak (1s) bir ara
            return;
        }

        // Akış zaten aktifse tekrar tekrar başlatma
        if (_sessionFlowStarted) return;
        _sessionFlowStarted = true;

        // Faz 1: Onboarding sonrası veya ilk açılışta 2.5s bekle, sonra karar ver
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            const locGranted = 
                localStorage.getItem('location_permission_granted') === 'true' || 
                locationStatusRef.current === 'granted';

            if (!locGranted && shouldShowPermission('location')) {
                setPermissionCard('location');
            } else {
                // Konum izni zaten verilmişse (veya reddedilme hakkı dolmuşsa), yavaşça bildirim sırasına geç
                _notificationPending = true;
                timeoutRef.current = setTimeout(async () => {
                    if (_notificationPending && await shouldShowNotificationCard()) {
                        setPermissionCard('notification');
                        _notificationPending = false;
                    } else {
                        _notificationPending = false;
                    }
                }, 1000);
            }
        }, 2500);

    }, []); // Sadece mount'ta çalışır

    return {
        permissionCard,
        dismissCurrentCard,
        markCurrentSuccess,
        handleManualRedirect
    };
}
