/**
 * SharedDataService.swift
 * 
 * PURPOSE: Shared data models and UserDefaults access for iOS widgets.
 * This file contains Codable structs matching the JavaScript interfaces
 * and provides type-safe data reading from App Groups.
 * 
 * LOCATION: ios/App/IslamiYoldasWidgets/SharedDataService.swift
 * 
 * IMPORTANT: This file must be added to BOTH targets in Xcode:
 *   - IslamiYoldasWidgets (Widget Extension)
 *   - Optionally to App target if you need to access data there too
 */

import Foundation

// MARK: - App Group Configuration

/// The App Group identifier - read from Info.plist (key: AppGroupSuiteName) with fallback
private let appGroupSuiteName: String = {
    // Try to read from main bundle Info.plist first
    if let value = Bundle.main.object(forInfoDictionaryKey: "AppGroupSuiteName") as? String, !value.isEmpty {
        return value
    }
    // Try to read from the widget bundle if running in extension
    if let widgetBundle = Bundle(identifier: Bundle.main.bundleIdentifier ?? ""),
       let value = widgetBundle.object(forInfoDictionaryKey: "AppGroupSuiteName") as? String, !value.isEmpty {
        return value
    }
    // No fallback to any App Group identifier; returning empty string disables App Group usage.
    return ""
}()

/// UserDefaults keys for widget data (must match JavaScript constants)
let prayerDataKey = "widget_prayer_data"
let inspirationDataKey = "widget_inspiration_data"

// MARK: - Prayer Data Models

/// Represents a single prayer time
struct PrayerTime: Codable, Identifiable {
    let name: String
    let time: String
    let date: String
    
    var id: String { name }
    
    /// Converts ISO 8601 date string to Date object
    var prayerDate: Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: date) ?? ISO8601DateFormatter().date(from: date)
    }
}

/// Full prayer widget data structure
struct WidgetPrayerData: Codable {
    let prayers: [PrayerTime]
    let nextPrayerName: String
    let nextPrayerTime: String
    let lastUpdated: String
    
    /// Get the next prayer as a Date for countdown timer
    var nextPrayerDate: Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: nextPrayerTime) ?? ISO8601DateFormatter().date(from: nextPrayerTime)
    }
    
    /// Default placeholder data when no real data is available
    static var placeholder: WidgetPrayerData {
        WidgetPrayerData(
            prayers: [
                PrayerTime(name: "Sabah", time: "05:30", date: Date().ISO8601Format()),
                PrayerTime(name: "Öğle", time: "12:45", date: Date().ISO8601Format()),
                PrayerTime(name: "İkindi", time: "15:30", date: Date().ISO8601Format()),
                PrayerTime(name: "Akşam", time: "18:15", date: Date().ISO8601Format()),
                PrayerTime(name: "Yatsı", time: "19:45", date: Date().ISO8601Format())
            ],
            nextPrayerName: "İkindi",
            nextPrayerTime: Date().addingTimeInterval(3600).ISO8601Format(),
            lastUpdated: Date().ISO8601Format()
        )
    }
}

// MARK: - Inspiration Data Models

/// Time period for daily inspiration rotation
enum TimePeriod: String, Codable {
    case morning
    case noon
    case evening
    case night
    
    /// Turkish display name
    var displayName: String {
        switch self {
        case .morning: return "Sabah"
        case .noon: return "Öğle"
        case .evening: return "Akşam"
        case .night: return "Gece"
        }
    }
}

/// Daily inspiration widget data structure
struct WidgetInspirationData: Codable {
    let text: String
    let source: String
    let period: String
    let lastUpdated: String
    
    /// Get the period as enum
    var timePeriod: TimePeriod {
        TimePeriod(rawValue: period) ?? .morning
    }
    
    /// Default placeholder data
    static var placeholder: WidgetInspirationData {
        WidgetInspirationData(
            text: "Sabır güzeldir.",
            source: "Yusuf Suresi, 18",
            period: "morning",
            lastUpdated: Date().ISO8601Format()
        )
    }
}

// MARK: - Data Service

/// Service class for reading widget data from App Group UserDefaults
class SharedDataService {
    
    static let shared = SharedDataService()
    
    private let userDefaults: UserDefaults?
    private let decoder = JSONDecoder()
    
    private init() {
        if appGroupSuiteName.isEmpty {
            // No App Group configured; use standard UserDefaults
            userDefaults = UserDefaults.standard
        } else if let suite = UserDefaults(suiteName: appGroupSuiteName) {
            userDefaults = suite
        } else {
            // App Group entitlement not available or suite creation failed
            print("[SharedDataService] App Group not available: \(appGroupSuiteName). Falling back to standard UserDefaults.")
            userDefaults = UserDefaults.standard
        }
    }
    
    // MARK: - Prayer Data
    
    /// Reads prayer data from UserDefaults
    /// Returns placeholder if no data available or parsing fails
    func getPrayerData() -> WidgetPrayerData {
        guard let userDefaults = userDefaults,
              let jsonString = userDefaults.string(forKey: prayerDataKey),
              let jsonData = jsonString.data(using: .utf8) else {
            return .placeholder
        }
        
        do {
            return try decoder.decode(WidgetPrayerData.self, from: jsonData)
        } catch {
            print("[SharedDataService] Failed to decode prayer data: \(error)")
            return .placeholder
        }
    }
    
    // MARK: - Inspiration Data
    
    /// Reads inspiration data from UserDefaults
    /// Returns placeholder if no data available or parsing fails
    func getInspirationData() -> WidgetInspirationData {
        guard let userDefaults = userDefaults,
              let jsonString = userDefaults.string(forKey: inspirationDataKey),
              let jsonData = jsonString.data(using: .utf8) else {
            return .placeholder
        }
        
        do {
            return try decoder.decode(WidgetInspirationData.self, from: jsonData)
        } catch {
            print("[SharedDataService] Failed to decode inspiration data: \(error)")
            return .placeholder
        }
    }
}

