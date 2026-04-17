import WidgetKit
import SwiftUI

/// Reads prayer data from App Group UserDefaults and builds timelines
struct PrayerTimesProvider: TimelineProvider {
    
    private let suiteName = "group.H5GZ9H5MX8.islamiyoldas"
    private let dataKey = "widget_prayer_data"
    
    // MARK: - Placeholder (Widget Gallery)
    
    func placeholder(in context: Context) -> PrayerTimesEntry {
        PrayerTimesEntry.placeholder
    }
    
    // MARK: - Snapshot (Quick Preview)
    
    func getSnapshot(in context: Context, completion: @escaping (PrayerTimesEntry) -> Void) {
        let entry = buildEntry(for: Date())
        completion(entry)
    }
    
    // MARK: - Timeline (Actual Data)
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerTimesEntry>) -> Void) {
        let now = Date()
        var entries: [PrayerTimesEntry] = []
        
        // Generate entries every 5 minutes for the next 5 hours (60 entries max)
        // This ensures the widget updates frequently on the lock screen
        let intervalMinutes = 5
        let maxEntries = 60
        
        for i in 0..<maxEntries {
            let entryDate = now.addingTimeInterval(Double(i * intervalMinutes * 60))
            let entry = buildEntry(for: entryDate)
            entries.append(entry)
        }
        
        // Also add entries at exact prayer transitions for immediate switch
        if let prayers = readPrayerData()?.prayers {
            for prayer in prayers {
                if prayer.time > now {
                    let transitionDate = prayer.time.addingTimeInterval(1)
                    let transitionEntry = buildEntry(for: transitionDate)
                    entries.append(transitionEntry)
                }
            }
        }
        
        // Sort and deduplicate
        entries.sort { $0.date < $1.date }
        
        // Refresh timeline after 5 hours
        let refreshDate = now.addingTimeInterval(5 * 3600)
        let timeline = Timeline(entries: entries, policy: .after(refreshDate))
        completion(timeline)
    }
    
    // MARK: - Data Reading
    
    private struct WidgetData: Codable {
        let city: String
        let hijriDate: String?
        let prayers: [PrayerRaw]
        
        struct PrayerRaw: Codable {
            let id: String
            let name: String
            let time: String // "HH:mm" format
        }
    }
    
    private func readPrayerData() -> (city: String, hijriDate: String, prayers: [PrayerTimesEntry.PrayerItem])? {
        // Debug: Check if UserDefaults suite is accessible
        guard let defaults = UserDefaults(suiteName: suiteName) else {
            print("[IslamiWidgets] ERROR: Cannot access UserDefaults suite: \(suiteName)")
            return nil
        }
        
        // Debug: List all keys to see what's stored
        let allKeys = defaults.dictionaryRepresentation().keys
        print("[IslamiWidgets] Suite '\(suiteName)' has \(allKeys.count) keys: \(Array(allKeys).prefix(10))")
        
        guard let jsonString = defaults.string(forKey: dataKey) else {
            // Try object(forKey:) as fallback — in case data was saved as non-string
            let rawValue = defaults.object(forKey: dataKey)
            print("[IslamiWidgets] ERROR: No string for key '\(dataKey)'. Raw value type: \(type(of: rawValue)), value: \(String(describing: rawValue).prefix(200))")
            return nil
        }
        
        print("[IslamiWidgets] JSON data found (\(jsonString.count) chars): \(jsonString.prefix(200))")
        
        guard let jsonData = jsonString.data(using: .utf8) else {
            print("[IslamiWidgets] ERROR: Cannot convert JSON string to Data")
            return nil
        }
        
        do {
            let data = try JSONDecoder().decode(WidgetData.self, from: jsonData)
            let now = Date()
            
            let prayers: [PrayerTimesEntry.PrayerItem] = data.prayers.compactMap { raw in
                guard let time = parseTime(raw.time, relativeTo: now) else { return nil }
                return PrayerTimesEntry.PrayerItem(
                    id: raw.id,
                    name: raw.name,
                    time: time,
                    isPassed: time <= now
                )
            }
            
            print("[IslamiWidgets] SUCCESS: city=\(data.city), prayers=\(prayers.count)")
            return (city: data.city, hijriDate: data.hijriDate ?? "", prayers: prayers)
        } catch {
            print("[IslamiWidgets] DECODE ERROR: \(error)")
            return nil
        }
    }
    
    private func parseTime(_ timeString: String, relativeTo referenceDate: Date) -> Date? {
        let parts = timeString.split(separator: ":").compactMap { Int($0) }
        guard parts.count >= 2 else { return nil }
        
        let calendar = Calendar.current
        var components = calendar.dateComponents([.year, .month, .day], from: referenceDate)
        components.hour = parts[0]
        components.minute = parts[1]
        components.second = 0
        
        return calendar.date(from: components)
    }
    
    private func buildEntry(for date: Date) -> PrayerTimesEntry {
        guard let data = readPrayerData() else {
            return PrayerTimesEntry.placeholder
        }
        
        // Recalculate isPassed and nextPrayer based on the entry date
        let prayers = data.prayers.map { prayer in
            PrayerTimesEntry.PrayerItem(
                id: prayer.id,
                name: prayer.name,
                time: prayer.time,
                isPassed: prayer.time <= date
            )
        }
        
        // Find next upcoming prayer; if all passed, wrap to tomorrow's first prayer (Fajr)
        let nextPrayer: PrayerTimesEntry.PrayerItem?
        if let upcoming = prayers.first(where: { !$0.isPassed }) {
            nextPrayer = upcoming
        } else if let first = prayers.first {
            // All prayers passed — show tomorrow's first prayer
            let tomorrowTime = Calendar.current.date(byAdding: .day, value: 1, to: first.time) ?? first.time
            nextPrayer = PrayerTimesEntry.PrayerItem(
                id: first.id,
                name: first.name,
                time: tomorrowTime,
                isPassed: false
            )
        } else {
            nextPrayer = nil
        }
        
        return PrayerTimesEntry(
            date: date,
            city: data.city,
            prayers: prayers,
            nextPrayer: nextPrayer,
            hijriDate: data.hijriDate
        )
    }
}
