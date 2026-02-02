import React, { useCallback, useState, useEffect } from 'react';

export const useHaptics = () => {
    const vibrate = useCallback((pattern = 50) => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }, []);

    const selection = () => vibrate(10);
    const success = () => vibrate([10, 30, 10]);
    const warning = () => vibrate([100, 50, 100]);
    const error = () => vibrate([50, 100, 50, 100, 50]);
    const heavy = () => vibrate(70);
    const medium = () => vibrate(40);

    return { vibrate, selection, success, warning, error, heavy, medium };
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
