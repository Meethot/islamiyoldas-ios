import WidgetKit
import SwiftUI

/// Timeline provider for Hourly Verse widget.
/// Generates an entry every hour, refreshing at the top of the hour.
struct HourlyVerseProvider: TimelineProvider {
    
    func placeholder(in context: Context) -> HourlyVerseEntry {
        HourlyVerseEntry.placeholder
    }
    
    func getSnapshot(in context: Context, completion: @escaping (HourlyVerseEntry) -> Void) {
        let verse = HourlyVerseEntry.verseForDate(Date())
        completion(HourlyVerseEntry(
            date: Date(),
            verse: verse
        ))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<HourlyVerseEntry>) -> Void) {
        let calendar = Calendar.current
        let now = Date()
        
        // Set first entry for right now
        let currentVerse = HourlyVerseEntry.verseForDate(now)
        let currentEntry = HourlyVerseEntry(date: now, verse: currentVerse)
        
        // Calculate the exact start of the NEXT hour for refresh
        let nextHour = calendar.date(byAdding: .hour, value: 1, to: now)!
        let components = calendar.dateComponents([.year, .month, .day, .hour], from: nextHour)
        let exactNextHour = calendar.date(from: components) ?? nextHour
        
        // Add tomorrow's immediate next frame for smooth UX
        let nextVerse = HourlyVerseEntry.verseForDate(exactNextHour)
        let nextEntry = HourlyVerseEntry(date: exactNextHour, verse: nextVerse)
        
        let timeline = Timeline(
            entries: [currentEntry, nextEntry],
            policy: .after(exactNextHour)
        )
        completion(timeline)
    }
}
