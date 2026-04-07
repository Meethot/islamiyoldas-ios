import Foundation

/// Reads the user's app language from App Group UserDefaults.
/// Falls back to system language, then to "tr" if unavailable.
struct WidgetLanguageHelper {
    
    private static let suiteName = "group.H5GZ9H5MX8.islamiyoldas"
    private static let langKey = "widget_language"
    private static let supportedLanguages = ["tr", "en", "de", "ru", "az", "ar"]
    
    /// Returns the current widget language code (tr, en, de, ru, az, ar)
    static var currentLanguage: String {
        // 1. Try reading from App Group (set by the main app)
        if let defaults = UserDefaults(suiteName: suiteName),
           let lang = defaults.string(forKey: langKey),
           supportedLanguages.contains(lang) {
            return lang
        }
        
        // 2. Fallback to system language
        let systemLang = Locale.preferredLanguages.first?.prefix(2).lowercased() ?? "tr"
        if supportedLanguages.contains(String(systemLang)) {
            return String(systemLang)
        }
        
        // 3. Final fallback
        return "tr"
    }
}
