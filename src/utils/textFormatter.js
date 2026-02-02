/**
 * Converts English-based transliteration to Turkish phonetic style
 * Example: "Wallatheena" -> "Vellezine"
 */
export function turkifyTransliteration(text) {
    if (!text) return '';

    let result = text;

    // Ordered replacements (Specific to General)
    const replacements = [
        { pattern: /sh/gi, replacement: 'ş' },
        { pattern: /gh/gi, replacement: 'ğ' },
        { pattern: /kh/gi, replacement: 'h' },
        { pattern: /dh/gi, replacement: 'z' },
        { pattern: /th/gi, replacement: 'z' },
        { pattern: /oo/gi, replacement: 'u' },
        { pattern: /ee/gi, replacement: 'i' },
        { pattern: /aa/gi, replacement: 'a' },
        { pattern: /ou/gi, replacement: 'u' },
        { pattern: /'a/gi, replacement: 'a' }, // Handle Glottal stops

        // Single characters
        { pattern: /w/gi, replacement: 'v' },
        { pattern: /j/gi, replacement: 'c' },
        { pattern: /q/gi, replacement: 'k' }, // Extra common one
        { pattern: /x/gi, replacement: 'ks' }, // Just in case
    ];

    replacements.forEach(({ pattern, replacement }) => {
        result = result.replace(pattern, (match) => {
            // Preserve case
            return match === match.toUpperCase()
                ? replacement.toUpperCase()
                : replacement;
        });
    });

    return result;
}
