import WidgetKit
import SwiftUI

/// Timeline provider for Esma-ül Hüsna widget — refreshes daily at midnight
struct EsmaProvider: TimelineProvider {
    typealias Entry = EsmaEntry
    
    func placeholder(in context: Context) -> EsmaEntry {
        .placeholder
    }
    
    func getSnapshot(in context: Context, completion: @escaping (EsmaEntry) -> Void) {
        let esma = EsmaEntry.esmaForDate(Date())
        completion(EsmaEntry(date: Date(), esma: esma))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<EsmaEntry>) -> Void) {
        let now = Date()
        let calendar = Calendar.current
        let esma = EsmaEntry.esmaForDate(now)
        let entry = EsmaEntry(date: now, esma: esma)
        
        // Refresh at next midnight
        let tomorrow = calendar.startOfDay(for: calendar.date(byAdding: .day, value: 1, to: now)!)
        let timeline = Timeline(entries: [entry], policy: .after(tomorrow))
        completion(timeline)
    }
}
