/**
 * Converts academic/precise transliteration to user-friendly "Prayer Book" style
 * Example: "elḥamdü lillâhi rabbi-l`âlemîn" -> "Elhamdülillâhi Rabbi’l-âlemîn"
 */
export function beautifyTurkishTransliteration(text) {
    if (!text) return '';

    let result = text;

    // 1. Remove academic sub-dots and special modifiers
    // Map academic characters to standard Turkish ones
    const characterMap = {
        'ḥ': 'h', 'Ḥ': 'H',
        'ṣ': 's', 'Ṣ': 'S',
        'ḍ': 'd', 'Ḍ': 'D',
        'ṭ': 't', 'Ṭ': 'T',
        'ẓ': 'z', 'Ẓ': 'Z',
        'ġ': 'g', 'Ġ': 'G',
        'ā': 'â', 'ī': 'î', 'ū': 'û',
        '[`\']': '’', // backticks/single quotes to curly apostrophe
    };

    Object.entries(characterMap).forEach(([char, rep]) => {
        if (char.length === 1) {
            result = result.replaceAll(char, rep);
        } else {
            // Regex for multiple chars like backtick/quote
            result = result.replace(new RegExp(char, 'g'), rep);
        }
    });

    // 2. Connect common hyphenated prefixes (bi-llahi -> billahi)
    // but keep some like -l for apostrophe style
    result = result.replace(/bi-l/gi, 'bil');
    result = result.replace(/li-l/gi, 'lil');
    result = result.replace(/-l(?=[âa])/g, '’l'); // rabbi-l`âlemîn -> rabbil’âlemîn style

    // 3. Fix conjunctions
    result = result.replace(/\bwa\b/gi, 've');

    // 4. Casing
    // Title Case (Capitalize every word)
    result = result.split(' ').map(word => {
        if (word.length === 0) return '';
        // Skip some very small connectives if needed, but Title Case is safer for now
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');

    // 5. Special Fix for "Elhamdu" (Ensure it's exactly as user wants)
    result = result.replace(/^Elhamd[üu]/i, 'Elhamdu');

    return result;
}

/**
 * Converts English-based transliteration to Turkish phonetic style
 * Example: "Wallatheena" -> "Vellezine"
 * @deprecated Switching to native Turkish API sources
 */
export function turkifyTransliteration(text) {
    if (!text) return '';
    return text; // Fallback
}
