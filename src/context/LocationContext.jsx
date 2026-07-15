import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import i18n from '@/i18n';
import { analytics } from '@/services/analyticsService';

const LocationContext = createContext(null);

export function useLocation() {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
}

// Manual selection is "active" when the user picked a city AND auto-location
// isn't preferred. It stays authoritative until the user re-enables auto
// location — a background GPS fix must not silently override it.
const readManualActive = () =>
    !!localStorage.getItem('userCity') && (
        localStorage.getItem('manual_location_active') === 'true' ||
        localStorage.getItem('location_permission_granted') !== 'true'
    );

export function LocationProvider({ children }) {
    const [location, setLocation] = useState(null);
    const [address, setAddress] = useState(null);
    // District (ilçe) as STATE, not a render-time localStorage read: the geocode
    // often resolves the same province ("İzmir"), so setAddress bails out and the
    // UI never re-reads localStorage — cityName would stay stuck on the province.
    const [district, setDistrict] = useState(() => localStorage.getItem('cached_district') || null);
    // Bumped after every successful reverse geocode — PrayerTimesContext listens
    // to this to re-resolve times (its first fetch may have run while
    // cached_district was cleared and picked the province instead of the district)
    const [geoRevision, setGeoRevision] = useState(0);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [permissionStatus, setPermissionStatus] = useState('prompt');
    const [manualCity, setManualCityState] = useState(localStorage.getItem('userCity') || null);
    const [manualCountry, setManualCountryState] = useState(localStorage.getItem('userCountry') || 'Turkey');
    const [manualCountryCode, setManualCountryCodeState] = useState(localStorage.getItem('userCountryCode') || null);
    const [manualCoords, setManualCoordsState] = useState(() => {
        try {
            const raw = localStorage.getItem('userCityCoords');
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    });
    const [manualActive, setManualActiveState] = useState(readManualActive);

    // Geocoder-backed selection: coords + ISO country code ride along so prayer
    // times can use exact coordinates instead of a name-based address lookup.
    // Cities selected before this existed have no coords — callers must handle null.
    const setManualLocation = useCallback((country, city, extra = {}) => {
        setManualCountryState(country);
        setManualCityState(city);
        if (country) localStorage.setItem('userCountry', country);
        if (city) localStorage.setItem('userCity', city);
        const code = extra.countryCode ? String(extra.countryCode).toLowerCase() : null;
        setManualCountryCodeState(code);
        if (code) localStorage.setItem('userCountryCode', code);
        else localStorage.removeItem('userCountryCode');
        const coords = (Number.isFinite(extra.latitude) && Number.isFinite(extra.longitude))
            ? { latitude: extra.latitude, longitude: extra.longitude }
            : null;
        setManualCoordsState(coords);
        if (coords) localStorage.setItem('userCityCoords', JSON.stringify(coords));
        else localStorage.removeItem('userCityCoords');
        localStorage.setItem('manual_location_active', 'true');
        setManualActiveState(true);
        // Also update cached_district and cached_address for Diyanet API prayer time lookup
        localStorage.setItem('cached_district', city);
        localStorage.setItem('cached_address', city);
        setAddress(city);
        setDistrict(city);
    }, []);

    // Called when the user re-enables auto location — GPS becomes authoritative again
    const disableManualLocation = useCallback(() => {
        localStorage.removeItem('manual_location_active');
        setManualActiveState(readManualActive());
    }, []);

    const checkPermissions = useCallback(async () => {
        try {
            const status = await Geolocation.checkPermissions();
            setPermissionStatus(status.location);
            if (status.location === 'denied') {
                // OS permission revoked — a stored manual city becomes authoritative again
                localStorage.setItem('location_permission_granted', 'false');
                setManualActiveState(readManualActive());
            }
            return status.location;
        } catch (err) {
            console.error('Permission check error:', err);
            return 'denied';
        }
    }, []);

    const requestPermissions = useCallback(async () => {
        try {
            analytics.permissionRequested('location');
            const status = await Geolocation.requestPermissions();
            setPermissionStatus(status.location);
            if (status.location === 'granted') {
                analytics.permissionGranted('location');
            } else {
                analytics.permissionDenied('location');
            }
            return status.location;
        } catch (err) {
            console.error('Permission request error:', err);
            setError(i18n.t('common:errors.permissionDenied'));
            analytics.permissionDenied('location');
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

            // While a manual city is active, GPS data must not override the user's
            // choice (it would silently switch prayer times back to the GPS city)
            if (!readManualActive()) {
                setAddress(city);
                localStorage.setItem('cached_address', city);
                if (district) {
                    localStorage.setItem('cached_district', district);
                    setDistrict(district);
                }
                // Fresh geocode landed — let PrayerTimesContext re-resolve with it
                setGeoRevision(r => r + 1);
            }
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

            // Clear stale district/address so prayer times don't use old cached data
            // (reverse geocode below will set the correct values shortly) — unless a
            // manual city is active, in which case those keys belong to the user's choice.
            // NOTE: only localStorage is cleared — the `district` STATE stays so the UI
            // keeps showing the last known ilçe instead of flashing the province.
            if (!readManualActive()) {
                localStorage.removeItem('cached_district');
                localStorage.removeItem('cached_address');
            }

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
                // Fresh install: don't auto-request permission.
                // Home.jsx will trigger the permission request contextually
                // after the user has completed onboarding and seen the home screen.
                setLoading(false);
            }
        };

        initLocation();
    }, []);

    // Only expose the manual selection while it's active — when the user has
    // re-enabled auto location, prayer times must follow GPS, not the old city
    const effectiveManualCity = manualActive ? manualCity : null;
    // On GPS, prefer the district (ilçe) for display — prayer times are
    // district-specific, so "Urla" is more accurate/meaningful than the province "İzmir".
    const gpsDistrict = manualActive ? null : district;
    const value = {
        location,
        address,
        error,
        loading,
        geoRevision,
        permissionStatus,
        refreshLocation,
        setManualLocation,
        disableManualLocation,
        manualCity: effectiveManualCity,
        manualCountry,
        manualCountryCode: manualActive ? manualCountryCode : null,
        manualCoords: manualActive ? manualCoords : null,
        // Raw stored values for the settings UI
        storedManualCity: manualCity,
        storedManualCountry: manualCountry,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        hasLocation: !!location,
        cityName: effectiveManualCity || gpsDistrict || address || 'İstanbul',
        districtName: district,
        countryCode: localStorage.getItem('cached_country_code') || null,
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
}

export default LocationContext;
