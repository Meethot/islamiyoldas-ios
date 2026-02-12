import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';

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

    // Language helper — no i18n dependency needed here
    const isEn = (localStorage.getItem('i18nextLng') || 'tr').startsWith('en');

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
            setError(isEn ? 'Location permission denied' : 'Konum izni alınamadı');
            return 'denied';
        }
    }, []);

    const getReverseGeocode = useCallback(async (lat, lon) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
                { headers: { 'Accept-Language': 'tr' } }
            );
            const data = await response.json();
            const city = data.address.province || data.address.city || data.address.town || data.address.village || data.address.suburb;
            setAddress(city);
            localStorage.setItem('cached_address', city);
            return city;
        } catch (err) {
            console.error('Reverse geocode error:', err);
            return null;
        }
    }, []);

    // Simple, fast position getter — no two-phase complexity
    const getCurrentPosition = useCallback(async () => {
        setError(null);

        try {
            // Fast position: cell/wifi, 5s timeout, accepts 5-min cached readings
            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 300000
            });

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
                setError(isEn ? 'Could not get current location, using last known position' : 'Güncel konum alınamadı, son bilinen konum kullanılıyor');
                setLoading(false);
                return cachedCoords;
            }

            setError((isEn ? 'Location unavailable: ' : 'Konum alınamadı: ') + (err.message || (isEn ? 'Unknown error' : 'Bilinmeyen hata')));
            setLoading(false);
            return null;
        }
    }, [getReverseGeocode]);

    const refreshLocation = useCallback(async () => {
        setLoading(true);
        const status = await checkPermissions();

        if (status === 'granted') {
            localStorage.setItem('location_permission_granted', 'true');
            return await getCurrentPosition();
        }

        if (status === 'denied') {
            setLoading(false);
            setError(isEn ? 'Location permission not granted' : 'Konum izni verilmedi');
            return null;
        }

        // Status is 'prompt' — check if we previously had permission
        const wasGranted = localStorage.getItem('location_permission_granted') === 'true';
        if (wasGranted) {
            try {
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
                // Fresh install — need to request permission
                await refreshLocation();
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
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        hasLocation: !!location,
        cityName: address || 'İstanbul'
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
}

export default LocationContext;
