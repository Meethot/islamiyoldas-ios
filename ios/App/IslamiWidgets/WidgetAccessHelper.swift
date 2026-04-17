import Foundation

/// Central access control for widget premium/trial logic.
/// Reads isPremium from App Group UserDefaults (synced from JS via AppDelegate).
/// Tracks widget_first_seen per widget — 24h trial for free users.
enum WidgetAccessLevel {
    case fullAccess   // Premium user
    case trial        // Free user, within 24h
    case expired      // Free user, past 24h
}

struct WidgetAccessHelper {
    private static let suiteName = "group.H5GZ9H5MX8.islamiyoldas"
    private static let premiumKey = "widget_is_premium"
    private static let firstSeenKey = "widget_first_seen"
    private static let trialDuration: TimeInterval = 24 * 60 * 60 // 24 saat ücretsiz deneme
    
    /// Check if widget access is allowed. Records first-seen timestamp on first call.
    static func checkAccess() -> WidgetAccessLevel {
        guard let defaults = UserDefaults(suiteName: suiteName) else {
            return .trial // Can't read defaults, allow gracefully
        }
        
        // Premium users always have full access
        if defaults.bool(forKey: premiumKey) {
            return .fullAccess
        }
        
        // Check first-seen timestamp
        if let firstSeen = defaults.object(forKey: firstSeenKey) as? Date {
            let elapsed = Date().timeIntervalSince(firstSeen)
            if elapsed < trialDuration {
                return .trial
            } else {
                return .expired
            }
        } else {
            // First time widget is loaded — start trial now
            defaults.set(Date(), forKey: firstSeenKey)
            defaults.synchronize()
            return .trial
        }
    }
    
    /// Remaining trial time in seconds (0 if expired or premium)
    static var remainingTrialSeconds: Int {
        guard let defaults = UserDefaults(suiteName: suiteName),
              let firstSeen = defaults.object(forKey: firstSeenKey) as? Date else {
            return Int(trialDuration)
        }
        let remaining = trialDuration - Date().timeIntervalSince(firstSeen)
        return max(0, Int(remaining))
    }
    
    /// Localized "Premium Required" text
    static var premiumRequiredTitle: String {
        let lang = WidgetLanguageHelper.currentLanguage
        switch lang {
        case "en": return "Premium Required"
        case "de": return "Premium erforderlich"
        case "ru": return "Требуется Premium"
        case "az": return "Premium tələb olunur"
        case "ar": return "يتطلب بريميوم"
        default:   return "Premium Gerekli"
        }
    }
    
    /// Localized subtitle for expired trial
    static var premiumRequiredSubtitle: String {
        let lang = WidgetLanguageHelper.currentLanguage
        switch lang {
        case "en": return "Upgrade to unlock widgets"
        case "de": return "Upgrade für Widgets"
        case "ru": return "Обновитесь для виджетов"
        case "az": return "Widget üçün yüksəldin"
        case "ar": return "قم بالترقية لفتح الويجتات"
        default:   return "Widget'ları açmak için yükselt"
        }
    }
}
