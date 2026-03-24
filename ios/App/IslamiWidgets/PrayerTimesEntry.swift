import WidgetKit
import SwiftUI

/// Timeline entry model carrying all data needed to render the widget
struct PrayerTimesEntry: TimelineEntry {
    let date: Date
    let city: String
    let prayers: [PrayerItem]
    let nextPrayer: PrayerItem?
    let hijriDate: String
    
    struct PrayerItem: Identifiable {
        let id: String      // "fajr", "dhuhr", "asr", "maghrib", "isha"
        let name: String    // Localized display name
        let time: Date      // Actual prayer time as Date
        let isPassed: Bool  // Has this prayer time passed?
    }
    
    /// Placeholder entry for widget gallery preview
    static var placeholder: PrayerTimesEntry {
        let now = Date()
        let cal = Calendar.current
        
        let prayers: [PrayerItem] = [
            PrayerItem(id: "fajr",    name: "İmsak",   time: cal.date(bySettingHour: 5,  minute: 30, second: 0, of: now)!, isPassed: true),
            PrayerItem(id: "dhuhr",   name: "Öğle",    time: cal.date(bySettingHour: 12, minute: 45, second: 0, of: now)!, isPassed: true),
            PrayerItem(id: "asr",     name: "İkindi",  time: cal.date(bySettingHour: 16, minute: 15, second: 0, of: now)!, isPassed: false),
            PrayerItem(id: "maghrib", name: "Akşam",   time: cal.date(bySettingHour: 19, minute: 10, second: 0, of: now)!, isPassed: false),
            PrayerItem(id: "isha",    name: "Yatsı",   time: cal.date(bySettingHour: 20, minute: 40, second: 0, of: now)!, isPassed: false),
        ]
        
        return PrayerTimesEntry(
            date: now,
            city: "İstanbul",
            prayers: prayers,
            nextPrayer: prayers[2],
            hijriDate: "29 Ramazan 1447"
        )
    }
}
