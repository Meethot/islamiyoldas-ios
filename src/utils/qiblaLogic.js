/**
 * Scientific Qibla Logic Engine
 * Implements Geodesic Azimuth, WMM2025 Magnetic Declination, and Signal Processing.
 * Based on "High Precision Qibla Direction Determination Systems on Mobile Platforms"
 */

import geomagnetism from 'geomagnetism';

// Constants
const KAABA = {
    LAT: 21.422487, // Precise coordinates
    LNG: 39.826206
};

const RADIUS_EARTH_KM = 6371.0;

/**
 * Calculates Great Circle Azimuth (Bearing) from Point A to Point B
 * Formula: tan(θ) = sin(Δλ) / (cos(φ1) * tan(φ2) - sin(φ1) * cos(Δλ))
 * @param {number} lat1 Origin Latitude
 * @param {number} lng1 Origin Longitude
 * @param {number} lat2 Destination Latitude
 * @param {number} lng2 Destination Longitude
 * @returns {number} True North Azimuth (0-360)
 */
export const bearingBetween = (lat1, lng1, lat2, lng2) => {
    const phi1 = lat1 * (Math.PI / 180);
    const phi2 = lat2 * (Math.PI / 180);
    const deltaLambda = (lng2 - lng1) * (Math.PI / 180);

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

    let theta = Math.atan2(y, x);
    let bearing = (theta * 180) / Math.PI;

    return (bearing + 360) % 360;
};

/**
 * Calculates Great Circle Azimuth (Bearing) from user location to the Kaaba
 * @param {number} lat1 User Latitude
 * @param {number} lng1 User Longitude
 * @returns {number} True North Azimuth (0-360)
 */
export const calculateGeodesicAzimuth = (lat1, lng1) => bearingBetween(lat1, lng1, KAABA.LAT, KAABA.LNG);

/**
 * Calculates Magnetic Declination using World Magnetic Model (WMM)
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @returns {object} { declination: number, modelDate: string }
 */
export const getDetailedDeclination = (lat, lng) => {
    try {
        const model = geomagnetism.model();
        const info = model.point([lat, lng]);
        return {
            declination: info.decl,
            modelDate: 'WMM-2025' // geomagnetism uses latest model automatically
        };
    } catch (e) {
        console.warn("WMM Calculation Failed, defaulting to 0", e);
        return { declination: 0, modelDate: 'N/A' };
    }
};

/**
 * Low-Pass Filter Implementation
 * y[n] = α * x[n] + (1 - α) * y[n-1]
 * @param {number} currentRaw Current raw sensor value (x[n])
 * @param {number} previousSmoothed Previous smoothed value (y[n-1])
 * @param {number} alpha Smoothing factor (0 < α <= 1)
 * @returns {number} Smoothed value (y[n])
 */
export const lowPassFilter = (currentRaw, previousSmoothed, alpha) => {
    // Handle angle wrapping (0 <-> 360) logic for shortest path
    let diff = currentRaw - previousSmoothed;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;

    const smoothed = previousSmoothed + alpha * diff;
    return (smoothed + 360) % 360;
};

/**
 * Calculates precise Distance between two points using Haversine
 * @param {number} lat1 Origin Latitude
 * @param {number} lng1 Origin Longitude
 * @param {number} lat2 Destination Latitude
 * @param {number} lng2 Destination Longitude
 * @returns {number} Distance in KM
 */
export const distanceBetweenKM = (lat1, lng1, lat2, lng2) => {
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const dPhi = (lat2 - lat1) * Math.PI / 180;
    const dLambda = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(dLambda / 2) * Math.sin(dLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return RADIUS_EARTH_KM * c;
};

/**
 * Calculates precise Distance from user location to the Kaaba
 * @param {number} lat1 User Latitude
 * @param {number} lng1 User Longitude
 * @returns {number} Distance in KM
 */
export const calculateGeodesicDistance = (lat1, lng1) => distanceBetweenKM(lat1, lng1, KAABA.LAT, KAABA.LNG);
