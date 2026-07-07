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
        // (today's and tomorrow's, in case the 5-hour window crosses midnight)
        if let data = readWidgetData() {
            let horizon = now.addingTimeInterval(Double(maxEntries * intervalMinutes * 60))
            var transitionTimes = prayerItems(onDayOf: now, evaluatedAt: now, from: data).map { $0.time }
            if let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: now) {
                transitionTimes += prayerItems(onDayOf: tomorrow, evaluatedAt: now, from: data).map { $0.time }
            }
            for time in transitionTimes where time > now && time <= horizon {
                entries.append(buildEntry(for: time.addingTimeInterval(1)))
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
        // Multi-day schedule — optional so payloads from older app versions still decode
        let days: [DayRaw]?

        struct PrayerRaw: Codable {
            let id: String
            let name: String
            let time: String // "HH:mm" format
        }

        struct DayRaw: Codable {
            let date: String // "yyyy-MM-dd" (device-local calendar day)
            let prayers: [PrayerRaw]
        }
    }

    private func readWidgetData() -> WidgetData? {
        guard let defaults = UserDefaults(suiteName: suiteName) else {
            print("[IslamiWidgets] ERROR: Cannot access UserDefaults suite: \(suiteName)")
            return nil
        }

        guard let jsonString = defaults.string(forKey: dataKey),
              let jsonData = jsonString.data(using: .utf8) else {
            print("[IslamiWidgets] ERROR: No prayer data for key '\(dataKey)'")
            return nil
        }

        do {
            let data = try JSONDecoder().decode(WidgetData.self, from: jsonData)
            print("[IslamiWidgets] SUCCESS: city=\(data.city), prayers=\(data.prayers.count), days=\(data.days?.count ?? 0)")
            return data
        } catch {
            print("[IslamiWidgets] DECODE ERROR: \(error)")
            return nil
        }
    }

    private static let dayKeyFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.calendar = Calendar.current
        formatter.timeZone = TimeZone.current
        return formatter
    }()

    /// Raw prayer list for the calendar day containing `date`.
    /// Prefers the multi-day schedule (correct times for each day); beyond the
    /// synced window the last day is the closest approximation. Legacy payloads
    /// (no `days`) fall back to the single-day list.
    private func rawPrayers(for date: Date, from data: WidgetData) -> [WidgetData.PrayerRaw] {
        if let days = data.days, !days.isEmpty {
            let dayKey = Self.dayKeyFormatter.string(from: date)
            if let day = days.first(where: { $0.date == dayKey }) {
                return day.prayers
            }
            if let last = days.last {
                return last.prayers
            }
        }
        return data.prayers
    }

    /// Absolute prayer Dates on the calendar day of `anchor`, sequence-aware:
    /// a time earlier than its predecessor (midnight-crossing Isha like "00:10"
    /// at high latitudes) rolls to the next day. `isPassed` is evaluated against
    /// `reference` so tomorrow's list can be judged from today's clock.
    /// Mirrors buildPrayerSchedule in the JS app.
    private func prayerItems(onDayOf anchor: Date, evaluatedAt reference: Date, from data: WidgetData) -> [PrayerTimesEntry.PrayerItem] {
        let calendar = Calendar.current
        var items: [PrayerTimesEntry.PrayerItem] = []
        var previous: Date? = nil

        for raw in rawPrayers(for: anchor, from: data) {
            let parts = raw.time.split(separator: ":").compactMap { Int($0) }
            guard parts.count >= 2 else { continue }

            var components = calendar.dateComponents([.year, .month, .day], from: anchor)
            components.hour = parts[0]
            components.minute = parts[1]
            components.second = 0
            guard var time = calendar.date(from: components) else { continue }

            while let prev = previous, time < prev {
                time = calendar.date(byAdding: .day, value: 1, to: time) ?? time
            }
            previous = time

            items.append(PrayerTimesEntry.PrayerItem(
                id: raw.id,
                name: raw.name,
                time: time,
                isPassed: time <= reference
            ))
        }
        return items
    }

    private func buildEntry(for date: Date) -> PrayerTimesEntry {
        guard let data = readWidgetData() else {
            return PrayerTimesEntry.placeholder
        }

        let prayers = prayerItems(onDayOf: date, evaluatedAt: date, from: data)

        // Next upcoming prayer; if all of today's passed, use tomorrow's actual
        // first prayer from the multi-day schedule
        var nextPrayer = prayers.first(where: { !$0.isPassed })
        if nextPrayer == nil, let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: date) {
            nextPrayer = prayerItems(onDayOf: tomorrow, evaluatedAt: date, from: data).first(where: { !$0.isPassed })
        }
        if nextPrayer == nil, let first = prayers.first {
            // Legacy fallback: same times shifted to tomorrow
            let tomorrowTime = Calendar.current.date(byAdding: .day, value: 1, to: first.time) ?? first.time
            nextPrayer = PrayerTimesEntry.PrayerItem(
                id: first.id,
                name: first.name,
                time: tomorrowTime,
                isPassed: false
            )
        }

        return PrayerTimesEntry(
            date: date,
            city: data.city,
            prayers: prayers,
            nextPrayer: nextPrayer,
            hijriDate: data.hijriDate ?? ""
        )
    }
}
