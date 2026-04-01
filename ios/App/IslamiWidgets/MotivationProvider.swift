import WidgetKit
import SwiftUI

/// Timeline provider for Daily Motivation widget.
/// Generates an entry every day, refreshing at midnight.
struct MotivationProvider: TimelineProvider {
    
    func placeholder(in context: Context) -> MotivationEntry {
        MotivationEntry.placeholder
    }
    
    func getSnapshot(in context: Context, completion: @escaping (MotivationEntry) -> Void) {
        let motivation = MotivationEntry.motivationForDate(Date())
        completion(MotivationEntry(
            date: Date(),
            motivation: motivation
        ))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<MotivationEntry>) -> Void) {
        let calendar = Calendar.current
        let now = Date()
        
        // Ensure starting index is current day
        let currentMotivation = MotivationEntry.motivationForDate(now)
        let currentEntry = MotivationEntry(date: now, motivation: currentMotivation)
        
        // Calculate tomorrow midnight
        let tomorrow = calendar.date(byAdding: .day, value: 1, to: now)!
        let startOfTomorrow = calendar.startOfDay(for: tomorrow)
        
        // Buffer + tomorrow calculation
        let tomorrowMotivation = MotivationEntry.motivationForDate(startOfTomorrow)
        let tomorrowEntry = MotivationEntry(date: startOfTomorrow, motivation: tomorrowMotivation)
        
        let timeline = Timeline(
            entries: [currentEntry, tomorrowEntry],
            policy: .after(startOfTomorrow)
        )
        completion(timeline)
    }
}
