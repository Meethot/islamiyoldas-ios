import React, { useCallback } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const checkHapticsEnabled = async () => {
    try {
        const { value } = await Preferences.get({ key: 'hapticsEnabled' });
        return value !== 'false';
    } catch {
        return true;
    }
};

export const useHaptics = () => {
    const vibrate = useCallback(async (pattern = 50) => {
        if (!(await checkHapticsEnabled())) return;

        // Native Haptics (iOS/Android)
        if (Capacitor.isNativePlatform()) {
            try {
                if (typeof pattern === 'number') {
                    if (pattern >= 100) await Haptics.impact({ style: ImpactStyle.Heavy });
                    else if (pattern >= 40) await Haptics.impact({ style: ImpactStyle.Medium });
                    else await Haptics.impact({ style: ImpactStyle.Light });
                } else {
                    await Haptics.vibrate();
                }
                return;
            } catch (e) {
                console.error('Native haptics error:', e);
            }
        }

        // Web Fallback
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }, []);

    const selection = async () => {
        if (!(await checkHapticsEnabled())) return;
        if (Capacitor.isNativePlatform()) Haptics.selectionStart();
        vibrate(10);
    };

    const success = async () => {
        if (!(await checkHapticsEnabled())) return;
        if (Capacitor.isNativePlatform()) Haptics.notification({ type: 'SUCCESS' });
        vibrate([10, 30, 10]);
    };

    const warning = async () => {
        if (!(await checkHapticsEnabled())) return;
        if (Capacitor.isNativePlatform()) Haptics.notification({ type: 'WARNING' });
        vibrate([100, 50, 100]);
    };

    const error = async () => {
        if (!(await checkHapticsEnabled())) return;
        if (Capacitor.isNativePlatform()) Haptics.notification({ type: 'ERROR' });
        vibrate([50, 100, 50, 100, 50]);
    };

    const heavy = async () => {
        if (!(await checkHapticsEnabled())) return;
        if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Heavy });
        else vibrate(70);
    };

    const medium = async () => {
        if (!(await checkHapticsEnabled())) return;
        if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Medium });
        else vibrate(50);
    };

    const light = async () => {
        if (!(await checkHapticsEnabled())) return;
        if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
        else vibrate(20);
    };

    const targetReached = async () => {
        if (!(await checkHapticsEnabled())) return;
        if (Capacitor.isNativePlatform()) {
            // Double heavy pulse for target reach
            await Haptics.impact({ style: ImpactStyle.Heavy });
            setTimeout(async () => {
                if (!(await checkHapticsEnabled())) return;
                await Haptics.impact({ style: ImpactStyle.Heavy });
            }, 150);
        } else {
            vibrate([100, 50, 100]);
        }
    };

    const impactMedium = medium;

    return { vibrate, selection, success, warning, error, heavy, medium, light, targetReached, impactMedium };
};


export const useIsMobile = () => {
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};
