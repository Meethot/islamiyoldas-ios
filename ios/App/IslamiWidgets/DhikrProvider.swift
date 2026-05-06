import WidgetKit

struct DhikrProvider: TimelineProvider {
    typealias Entry = DhikrEntry
    
    func placeholder(in context: Context) -> DhikrEntry {
        .placeholder
    }
    
    func getSnapshot(in context: Context, completion: @escaping (DhikrEntry) -> Void) {
        completion(DhikrEntry.readFromDefaults())
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<DhikrEntry>) -> Void) {
        let entry = DhikrEntry.readFromDefaults()
        // Refresh every 15 minutes (interactive widget reloads via WidgetCenter anyway)
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}
