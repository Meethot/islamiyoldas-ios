import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import i18n from '@/i18n';

const LocationContext = createContext(null);

export function useLocation() {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
}

export function LocationProvider({ children }) {
    const [location, setLocation] = useState(null);
    const [address, setAddress] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [permissionStatus, setPermissionStatus] = useState('prompt');
    const [manualCity, setManualCityState] = useState(localStorage.getItem('userCity') || null);

    const setManualCity = useCallback((city) => {
        setManualCityState(city);
        localStorage.setItem('userCity', city);
        // Also update cached_district and cached_address for Diyanet API prayer time lookup
        localStorage.setItem('cached_district', city);
        localStorage.setItem('cached_address', city);
        
        // VITAL FIX: Clear GPS location so that fallback APIs (Aladhan) don't use stale GPS coordinates
        setLocation(null);
        localStorage.removeItem('cached_location');
        setAddress(city);
    }, []);

    const checkPermissions = useCallback(async () => {
        try {
            const status = await Geolocation.checkPermissions();
            setPermissionStatus(status.location);
            return status.location;
        } catch (err) {
            console.error('Permission check error:', err);
            return 'denied';
        }
    }, []);

    const requestPermissions = useCallback(async () => {
        try {
            const status = await Geolocation.requestPermissions();
            setPermissionStatus(status.location);
            return status.location;
        } catch (err) {
            console.error('Permission request error:', err);
            setError(i18n.t('common:errors.permissionDenied'));
            return 'denied';
        }
    }, []);

    const getReverseGeocode = useCallback(async (lat, lon) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12&addressdetails=1`,
                { headers: { 'Accept-Language': 'tr' } }
            );
            const data = await response.json();
            const addr = data.address || {};
            const city = addr.province || addr.city || addr.town || addr.village || addr.suburb;
            // District/ilçe: town > county > suburb (for Diyanet lookup)
            const district = addr.town || addr.county || addr.suburb || null;
            const countryCode = addr.country_code || null;

            setAddress(city);
            localStorage.setItem('cached_address', city);
            if (district) localStorage.setItem('cached_district', district);
            if (countryCode) localStorage.setItem('cached_country_code', countryCode);

            return { city, district, countryCode };
        } catch (err) {
            console.error('Reverse geocode error:', err);
            return null;
        }
    }, []);

    const getCurrentPosition = useCallback(async () => {
        setError(null);

        try {
            // Capacitor 6 Geolocation has a known bug where it can hang indefinitely without throwing a timeout error
            // if the user just returned from iOS settings. We wrap it in a JS-level Promise.race to guarantee a timeout.
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Location request timed out (JS forced)')), 6000)
            );

            // Fast position: cell/wifi, 5s timeout, accepts 5-min cached readings
            const position = await Promise.race([
                Geolocation.getCurrentPosition({
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 300000
                }),
                timeoutPromise
            ]);

            const coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
            };

            setLocation(coords);
            setLoading(false);
            localStorage.setItem('cached_location', JSON.stringify(coords));

            // Reverse geocode in background — never blocks
            getReverseGeocode(coords.latitude, coords.longitude);

            // Background GPS refinement — fire and forget
            Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }).then(accuratePos => {
                const accurate = {
                    latitude: accuratePos.coords.latitude,
                    longitude: accuratePos.coords.longitude,
                    accuracy: accuratePos.coords.accuracy,
                    timestamp: accuratePos.timestamp
                };
                setLocation(accurate);
                localStorage.setItem('cached_location', JSON.stringify(accurate));
                getReverseGeocode(accurate.latitude, accurate.longitude);
            }).catch(() => { /* silent — we already have a position */ });

            return coords;
        } catch (err) {
            console.error('Geolocation error:', err);

            // Fallback to cached
            const cached = localStorage.getItem('cached_location');
            if (cached) {
                const cachedCoords = JSON.parse(cached);
                setLocation(cachedCoords);
                const cachedAddr = localStorage.getItem('cached_address');
                if (cachedAddr) setAddress(cachedAddr);
                setError(i18n.t('common:errors.usingCachedLocation'));
                setLoading(false);
                return cachedCoords;
            }

            setError(i18n.t('common:errors.locationUnavailable') + (err.message || i18n.t('common:errors.unknownError')));
            setLoading(false);
            return null;
        }
    }, [getReverseGeocode]);

    const refreshLocation = useCallback(async () => {
        setLoading(true);
        const status = await checkPermissions();

        if (status === 'granted') {
            localStorage.setItem('location_permission_granted', 'true');
            await new Promise(resolve => setTimeout(resolve, 500)); // iOS Resume Bug workaround
            return await getCurrentPosition();
        }

        if (status === 'denied') {
            setLoading(false);
            setError(i18n.t('common:errors.permissionNotGranted'));
            return null;
        }

        // Status is 'prompt' — check if we previously had permission
        const wasGranted = localStorage.getItem('location_permission_granted') === 'true';
        if (wasGranted) {
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                const result = await getCurrentPosition();
                if (result) return result;
            } catch {
                localStorage.removeItem('location_permission_granted');
            }
        }

        // Request permission
        const newStatus = await requestPermissions();
        if (newStatus === 'granted') {
            localStorage.setItem('location_permission_granted', 'true');
            await new Promise(resolve => setTimeout(resolve, 500));
            return await getCurrentPosition();
        }

        setLoading(false);
        setError('Konum izni verilmedi');
        return null;
    }, [checkPermissions, requestPermissions, getCurrentPosition]);

    // Initialize location on mount
    useEffect(() => {
        const initLocation = async () => {
            // Step 1: Restore cached data immediately
            const cached = localStorage.getItem('cached_location');
            if (cached) {
                try {
                    const cachedCoords = JSON.parse(cached);
                    setLocation(cachedCoords);
                    const cachedAddr = localStorage.getItem('cached_address');
                    if (cachedAddr) setAddress(cachedAddr);
                    // Mark as NOT loading — we have usable data
                    setLoading(false);
                } catch {
                    // Invalid cache
                }
            }

            // Step 2: Refresh with real GPS (may update coords)
            const wasGranted = localStorage.getItem('location_permission_granted') === 'true';
            if (wasGranted) {
                // Permission already granted — refresh silently
                const status = await checkPermissions();
                if (status === 'granted') {
                    await getCurrentPosition();
                }
            } else {
                // If it's a completely fresh install (no location granted and NO manual city chose)
                // then request permission as the onboarding loop.
                const manualCitySaved = localStorage.getItem('userCity');
                if (!manualCitySaved) {
                    await refreshLocation();
                } else {
                    setLoading(false);
                }
            }
        };

        initLocation();
    }, []);

    const value = {
        location,
        address,
        error,
        loading,
        permissionStatus,
        refreshLocation,
        setManualCity,
        manualCity,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        hasLocation: !!location,
        cityName: address || manualCity || 'İstanbul',
        districtName: localStorage.getItem('cached_district') || null,
        countryCode: localStorage.getItem('cached_country_code') || null,
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
}

export default LocationContext;
