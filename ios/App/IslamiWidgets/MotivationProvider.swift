import WidgetKit
import SwiftUI

/// Timeline provider for Daily Motivation widget.
/// Home screen shows daily motivation, lock screen rotates hourly.
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
        var entries: [MotivationEntry] = []
        
        // For lock screen: generate hourly entries throughout the day
        // For home screen: all entries within the same day show same daily motivation
        // This works because home screen views use motivationForDate internally
        // while lock screen views use the entry's motivation directly
        for hourOffset in 0..<24 {
            guard let entryDate = calendar.date(byAdding: .hour, value: hourOffset, to: now) else { continue }
            let motivation = MotivationEntry.hourlyMotivationForDate(entryDate)
            entries.append(MotivationEntry(date: entryDate, motivation: motivation))
        }
        
        let refreshDate = calendar.date(byAdding: .hour, value: 24, to: now) ?? now
        let timeline = Timeline(entries: entries, policy: .after(refreshDate))
        completion(timeline)
    }
}
