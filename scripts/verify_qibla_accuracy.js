import { calculateGeodesicAzimuth, getDetailedDeclination, calculateGeodesicDistance } from '../src/utils/qiblaLogic.js';

const TEST_LOCATIONS = [
    { name: 'London', lat: 51.5074, lng: -0.1278, expectedAzimuth: 118.98 },
    { name: 'New York', lat: 40.7128, lng: -74.0060, expectedAzimuth: 58.48 },
    { name: 'Jakarta', lat: -6.2088, lng: 106.8456, expectedAzimuth: 295.15 },
    { name: 'Istanbul', lat: 41.0082, lng: 28.9784, expectedAzimuth: 151.05 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503, expectedAzimuth: 292.90 } // Approx
];

console.log("Starting Scientific Qibla Verification...\n");
console.log("| Location | Lat / Lng | Calculated Azimuth | Expected | Error | Dist (KM) | Mag Declination |");
console.log("|---|---|---|---|---|---|---|");

let totalError = 0;

TEST_LOCATIONS.forEach(loc => {
    const azimuth = calculateGeodesicAzimuth(loc.lat, loc.lng);
    const distance = calculateGeodesicDistance(loc.lat, loc.lng);
    const declinationInfo = getDetailedDeclination(loc.lat, loc.lng);

    const error = Math.abs(azimuth - loc.expectedAzimuth);
    totalError += error;

    console.log(
        `| ${loc.name.padEnd(10)} ` +
        `| ${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)} ` +
        `| ${azimuth.toFixed(4)}° ` +
        `| ${loc.expectedAzimuth}° ` +
        `| ${error.toFixed(4)}° ` +
        `| ${distance.toFixed(0)} ` +
        `| ${declinationInfo.declination.toFixed(2)}° (${declinationInfo.modelDate}) |`
    );
});

console.log(`\nAverage Error: ${(totalError / TEST_LOCATIONS.length).toFixed(4)}°`);

if ((totalError / TEST_LOCATIONS.length) < 0.5) {
    console.log("\n✅ VERIFICATION PASSED: System is scientifically accurate.");
    process.exit(0);
} else {
    console.error("\n❌ VERIFICATION FAILED: Error too high.");
    process.exit(1);
}
