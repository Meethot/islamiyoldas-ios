/**
 * VakitWidget.swift
 * 
 * PURPOSE: Prayer Time Tracker widget showing the next prayer with live countdown.
 * Uses SwiftUI's Text(date, style: .timer) for battery-efficient updates.
 * 
 * LOCATION: ios/App/IslamiYoldasWidgets/VakitWidget.swift
 * 
 * FEATURES:
 * - Displays next prayer name prominently
 * - Live countdown timer (auto-updates every second)
 * - Footer showing other prayer times
 * - Dark green Islamic theme with gold accents
 */

import WidgetKit
import SwiftUI

// MARK: - Timeline Entry

struct VakitEntry: TimelineEntry {
    let date: Date
    let prayerData: WidgetPrayerData
}

// MARK: - Timeline Provider

struct VakitTimelineProvider: TimelineProvider {
    
    func placeholder(in context: Context) -> VakitEntry {
        VakitEntry(date: Date(), prayerData: .placeholder)
    }
    
    func getSnapshot(in context: Context, completion: @escaping (VakitEntry) -> Void) {
        let data = SharedDataService.shared.getPrayerData()
        let entry = VakitEntry(date: Date(), prayerData: data)
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<VakitEntry>) -> Void) {
        let data = SharedDataService.shared.getPrayerData()
        let currentDate = Date()
        
        var entries: [VakitEntry] = []
        
        // Create entry for now
        entries.append(VakitEntry(date: currentDate, prayerData: data))
        
        // Create entries for each prayer transition
        for prayer in data.prayers {
            if let prayerDate = prayer.prayerDate, prayerDate > currentDate {
                // Add entry at prayer time (widget will update)
                entries.append(VakitEntry(date: prayerDate, prayerData: data))
            }
        }
        
        // Refresh every 30 minutes as fallback
        let refreshDate = Calendar.current.date(byAdding: .minute, value: 30, to: currentDate)!
        
        let timeline = Timeline(entries: entries, policy: .after(refreshDate))
        completion(timeline)
    }
}

// MARK: - Widget View

struct VakitWidgetEntryView: View {
    var entry: VakitEntry
    
    @Environment(\.widgetFamily) var family
    
    // Islamic color palette
    private let darkGreen = Color(red: 6/255, green: 78/255, blue: 59/255)  // #064e3b
    private let gold = Color(red: 212/255, green: 175/255, blue: 55/255)    // #D4AF37
    private let lightGreen = Color(red: 16/255, green: 185/255, blue: 129/255)
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                gradient: Gradient(colors: [darkGreen, Color.black.opacity(0.9)]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            VStack(spacing: 8) {
                // Next Prayer Name
                Text(entry.prayerData.nextPrayerName.uppercased())
                    .font(.system(size: family == .systemSmall ? 18 : 24, weight: .bold, design: .rounded))
                    .foregroundColor(gold)
                    .tracking(2)
                
                // Mosque Icon
                Image(systemName: "building.columns.fill")
                    .font(.system(size: family == .systemSmall ? 20 : 28))
                    .foregroundColor(gold.opacity(0.8))
                
                // Countdown Timer
                if let nextDate = entry.prayerData.nextPrayerDate {
                    Text(nextDate, style: .timer)
                        .font(.system(size: family == .systemSmall ? 28 : 36, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                } else {
                    Text("--:--:--")
                        .font(.system(size: family == .systemSmall ? 28 : 36, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                }
                
                // Footer with other times (only on medium/large)
                if family != .systemSmall {
                    Divider()
                        .background(gold.opacity(0.5))
                        .padding(.horizontal)
                    
                    HStack(spacing: 16) {
                        ForEach(getUpcomingPrayers(), id: \.name) { prayer in
                            VStack(spacing: 2) {
                                Text(prayer.name)
                                    .font(.system(size: 10, weight: .medium))
                                    .foregroundColor(gold.opacity(0.8))
                                Text(prayer.time)
                                    .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                    .foregroundColor(.white.opacity(0.9))
                            }
                        }
                    }
                }
            }
            .padding()
        }
    }
    
    /// Get upcoming prayers for footer (excluding current next prayer)
    private func getUpcomingPrayers() -> [PrayerTime] {
        let nextName = entry.prayerData.nextPrayerName
        return entry.prayerData.prayers
            .filter { $0.name != nextName }
            .prefix(3)
            .map { $0 }
    }
}

// MARK: - Widget Configuration

struct VakitWidget: Widget {
    let kind: String = "VakitWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: VakitTimelineProvider()) { entry in
            VakitWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Vakit Takipçisi")
        .description("Bir sonraki namaz vaktini ve geri sayımı gösterir.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Preview

#Preview(as: .systemMedium) {
    VakitWidget()
} timeline: {
    VakitEntry(date: Date(), prayerData: .placeholder)
}
