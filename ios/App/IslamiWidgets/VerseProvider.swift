import WidgetKit
import SwiftUI

/// Timeline provider for Verse of the Day widget.
/// Generates one entry per day, refreshing at midnight.
struct VerseProvider: TimelineProvider {
    
    func placeholder(in context: Context) -> VerseEntry {
        VerseEntry.placeholder
    }
    
    func getSnapshot(in context: Context, completion: @escaping (VerseEntry) -> Void) {
        let (verse, day) = VerseEntry.verseForDate(Date())
        completion(VerseEntry(
            date: Date(),
            verse: verse,
            dayNumber: day,
            totalVerses: VerseEntry.allVerses.count
        ))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<VerseEntry>) -> Void) {
        let calendar = Calendar.current
        let now = Date()
        
        // Create today's entry
        let (todayVerse, todayDay) = VerseEntry.verseForDate(now)
        let todayEntry = VerseEntry(
            date: now,
            verse: todayVerse,
            dayNumber: todayDay,
            totalVerses: VerseEntry.allVerses.count
        )
        
        // Calculate next midnight for refresh
        let tomorrow = calendar.startOfDay(for: calendar.date(byAdding: .day, value: 1, to: now)!)
        
        // Also create tomorrow's entry so the widget transitions smoothly
        let (tomorrowVerse, tomorrowDay) = VerseEntry.verseForDate(tomorrow)
        let tomorrowEntry = VerseEntry(
            date: tomorrow,
            verse: tomorrowVerse,
            dayNumber: tomorrowDay,
            totalVerses: VerseEntry.allVerses.count
        )
        
        let timeline = Timeline(
            entries: [todayEntry, tomorrowEntry],
            policy: .after(tomorrow)
        )
        completion(timeline)
    }
}
