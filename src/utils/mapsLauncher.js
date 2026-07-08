import { Capacitor } from '@capacitor/core';

function launch(url) {
    try {
        window.open(url, '_blank');
    } catch {
        window.location.href = url;
    }
}

/**
 * Opens the platform's native maps app searching for a term near the given point.
 * Non-http schemes (maps://, geo:) are handed off to the OS by Capacitor's WebView.
 * @param {number} lat Search center latitude
 * @param {number} lng Search center longitude
 * @param {string} searchTerm Localized query, e.g. "Cami" / "Mosque"
 */
export function openMosqueSearch(lat, lng, searchTerm) {
    const platform = Capacitor.getPlatform();
    const term = encodeURIComponent(searchTerm);
    if (platform === 'ios') {
        launch(`maps://?q=${term}&sll=${lat},${lng}`);
    } else if (platform === 'android') {
        launch(`geo:${lat},${lng}?q=${term}`);
    } else {
        launch(`https://www.google.com/maps/search/${term}/@${lat},${lng},14z`);
    }
}
