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
    const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted' | 'denied' | 'prompt'

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
            setError('Konum izni alınamadı');
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

    const getCurrentPosition = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000 // Cache for 1 minute
            });

            const coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
            };

            setLocation(coords);
            localStorage.setItem('cached_location', JSON.stringify(coords));

            // Fetch city name asynchronously
            getReverseGeocode(coords.latitude, coords.longitude);

            return coords;
        } catch (err) {
            console.error('Geolocation error:', err);

            const cached = localStorage.getItem('cached_location');
            if (cached) {
                const cachedCoords = JSON.parse(cached);
                setLocation(cachedCoords);

                const cachedAddr = localStorage.getItem('cached_address');
                if (cachedAddr) setAddress(cachedAddr);

                setError('Güncel konum alınamadı, son bilinen konum kullanılıyor');
                return cachedCoords;
            }

            setError('Konum alınamadı: ' + (err.message || 'Bilinmeyen hata'));
            return null;
        } finally {
            setLoading(false);
        }
    }, [getReverseGeocode]);

    const refreshLocation = useCallback(async () => {
        const status = await checkPermissions();

        if (status === 'granted') {
            return await getCurrentPosition();
        } else if (status === 'prompt') {
            const newStatus = await requestPermissions();
            if (newStatus === 'granted') {
                return await getCurrentPosition();
            }
        }

        setLoading(false);
        setError('Konum izni verilmedi');
        return null;
    }, [checkPermissions, requestPermissions, getCurrentPosition]);

    // Auto-request location on mount
    useEffect(() => {
        const initLocation = async () => {
            // First, try to load cached location immediately
            const cached = localStorage.getItem('cached_location');
            if (cached) {
                try {
                    setLocation(JSON.parse(cached));
                    const cachedAddr = localStorage.getItem('cached_address');
                    if (cachedAddr) setAddress(cachedAddr);
                } catch (e) {
                    // Invalid cache, ignore
                }
            }

            // Then request fresh location
            await refreshLocation();
        };

        initLocation();
    }, [refreshLocation]);

    const value = {
        location,
        address,
        error,
        loading,
        permissionStatus,
        refreshLocation,
        // Convenience getters
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
