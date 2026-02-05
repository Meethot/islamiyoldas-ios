/**
 * IlhamWidget.swift
 * 
 * PURPOSE: Daily Inspiration widget showing rotating verses/hadiths.
 * Content changes 4 times per day: Morning, Noon, Evening, Night.
 * 
 * LOCATION: ios/App/IslamiYoldasWidgets/IlhamWidget.swift
 * 
 * FEATURES:
 * - Elegant serif typography for spiritual content
 * - Gradient background with Islamic aesthetic
 * - Source attribution (Surah name or Hadith source)
 * - Time-based content rotation
 */

import WidgetKit
import SwiftUI

// MARK: - Timeline Entry

struct IlhamEntry: TimelineEntry {
    let date: Date
    let inspirationData: WidgetInspirationData
}

// MARK: - Timeline Provider

struct IlhamTimelineProvider: TimelineProvider {
    
    func placeholder(in context: Context) -> IlhamEntry {
        IlhamEntry(date: Date(), inspirationData: .placeholder)
    }
    
    func getSnapshot(in context: Context, completion: @escaping (IlhamEntry) -> Void) {
        let data = SharedDataService.shared.getInspirationData()
        let entry = IlhamEntry(date: Date(), inspirationData: data)
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<IlhamEntry>) -> Void) {
        let data = SharedDataService.shared.getInspirationData()
        let currentDate = Date()
        
        var entries: [IlhamEntry] = []
        
        // Create entry for now
        entries.append(IlhamEntry(date: currentDate, inspirationData: data))
        
        // Create entries for period transitions (6AM, 12PM, 6PM, 12AM)
        let calendar = Calendar.current
        let periodHours = [6, 12, 18, 0]
        
        for hour in periodHours {
            var components = calendar.dateComponents([.year, .month, .day], from: currentDate)
            components.hour = hour
            components.minute = 0
            
            if let transitionDate = calendar.date(from: components) {
                // If this transition is in the future
                var dateToUse = transitionDate
                if transitionDate <= currentDate {
                    // Move to next day for this hour
                    dateToUse = calendar.date(byAdding: .day, value: 1, to: transitionDate)!
                }
                
                entries.append(IlhamEntry(date: dateToUse, inspirationData: data))
            }
        }
        
        // Sort entries by date
        entries.sort { $0.date < $1.date }
        
        // Refresh in 6 hours as fallback
        let refreshDate = calendar.date(byAdding: .hour, value: 6, to: currentDate)!
        
        let timeline = Timeline(entries: entries, policy: .after(refreshDate))
        completion(timeline)
    }
}

// MARK: - Widget View

struct IlhamWidgetEntryView: View {
    var entry: IlhamEntry
    
    @Environment(\.widgetFamily) var family
    
    // Color palette
    private let darkGreen = Color(red: 6/255, green: 78/255, blue: 59/255)
    private let deepBlack = Color(red: 2/255, green: 26/255, blue: 15/255)
    private let gold = Color(red: 212/255, green: 175/255, blue: 55/255)
    private let creamWhite = Color(red: 255/255, green: 253/255, blue: 240/255)
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                gradient: Gradient(colors: [deepBlack, darkGreen.opacity(0.8), deepBlack]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            // Subtle pattern overlay
            GeometryReader { geometry in
                Path { path in
                    // Islamic geometric pattern hint
                    let size = min(geometry.size.width, geometry.size.height) * 0.3
                    let center = CGPoint(x: geometry.size.width * 0.85, y: geometry.size.height * 0.15)
                    
                    // Simple star pattern
                    for i in 0..<8 {
                        let angle = Double(i) * .pi / 4
                        let x = center.x + cos(angle) * size
                        let y = center.y + sin(angle) * size
                        if i == 0 {
                            path.move(to: CGPoint(x: x, y: y))
                        } else {
                            path.addLine(to: CGPoint(x: x, y: y))
                        }
                    }
                    path.closeSubpath()
                }
                .stroke(gold.opacity(0.1), lineWidth: 1)
            }
            
            // Content
            VStack(spacing: 12) {
                Spacer()
                
                // Decorative top element
                Image(systemName: "sparkles")
                    .font(.system(size: 14))
                    .foregroundColor(gold.opacity(0.6))
                
                // Main quote text
                Text(entry.inspirationData.text)
                    .font(.system(size: family == .systemSmall ? 14 : 18, weight: .medium, design: .serif))
                    .foregroundColor(creamWhite)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, family == .systemSmall ? 8 : 16)
                
                // Source attribution
                Text("— \(entry.inspirationData.source)")
                    .font(.system(size: family == .systemSmall ? 10 : 12, weight: .regular, design: .serif))
                    .foregroundColor(gold)
                    .italic()
                
                Spacer()
                
                // Period indicator (only on medium+)
                if family != .systemSmall {
                    HStack {
                        Spacer()
                        Text(entry.inspirationData.timePeriod.displayName)
                            .font(.system(size: 9, weight: .medium))
                            .foregroundColor(gold.opacity(0.5))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(
                                Capsule()
                                    .fill(gold.opacity(0.1))
                            )
                    }
                }
            }
            .padding()
        }
    }
}

// MARK: - Widget Configuration

struct IlhamWidget: Widget {
    let kind: String = "IlhamWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: IlhamTimelineProvider()) { entry in
            IlhamWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Günün İlhamı")
        .description("Gün boyunca değişen ayet ve hadisler ile manevi ilham.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Preview

#Preview(as: .systemMedium) {
    IlhamWidget()
} timeline: {
    IlhamEntry(date: Date(), inspirationData: .placeholder)
}
