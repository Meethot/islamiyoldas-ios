import WidgetKit
import SwiftUI

/// Timeline provider for Hourly Esma widget.
/// Generates an entry every hour, refreshing at the top of the hour.
struct HourlyEsmaProvider: TimelineProvider {
    
    func placeholder(in context: Context) -> EsmaEntry {
        EsmaEntry.placeholder
    }
    
    func getSnapshot(in context: Context, completion: @escaping (EsmaEntry) -> Void) {
        let esma = EsmaEntry.hourlyEsmaForDate(Date())
        completion(EsmaEntry(
            date: Date(),
            esma: esma
        ))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<EsmaEntry>) -> Void) {
        let calendar = Calendar.current
        let now = Date()
        
        // Current Hour
        let currentEsma = EsmaEntry.hourlyEsmaForDate(now)
        let currentEntry = EsmaEntry(date: now, esma: currentEsma)
        
        // Exact Start of Next Hour
        let nextHour = calendar.date(byAdding: .hour, value: 1, to: now)!
        let components = calendar.dateComponents([.year, .month, .day, .hour], from: nextHour)
        let exactNextHour = calendar.date(from: components) ?? nextHour
        
        // Next Hour immediate entry
        let nextEsma = EsmaEntry.hourlyEsmaForDate(exactNextHour)
        let nextEntry = EsmaEntry(date: exactNextHour, esma: nextEsma)
        
        let timeline = Timeline(
            entries: [currentEntry, nextEntry],
            policy: .after(exactNextHour)
        )
        completion(timeline)
    }
}
