import WidgetKit
import SwiftUI

// MARK: - Home Screen Prayer Widget

struct PrayerTimesWidget: Widget {
    let kind: String = "PrayerTimesWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PrayerTimesProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                PrayerWidgetEntryView(entry: entry)
                    .containerBackground(for: .widget) {
                        LinearGradient(
                            colors: [
                                Color(red: 0.012, green: 0.180, blue: 0.094),
                                Color(red: 0.016, green: 0.302, blue: 0.161),
                                Color(red: 0.012, green: 0.180, blue: 0.094)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
            } else {
                PrayerWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("Namaz Vakitleri")
        .description("Sonraki namaz vaktini ve geri sayımı takip edin")
        .supportedFamilies([.systemSmall, .systemMedium])
        .contentMarginsDisabledIfAvailable()
    }
}

// MARK: - Lock Screen Prayer Widget

/// On iOS 16+ this provides Lock Screen widget families.
/// On iOS 15 it falls back to a duplicate small home screen widget (invisible to user since PrayerTimesWidget already covers it).
struct PrayerLockScreenWidget: Widget {
    let kind: String = "PrayerLockScreenWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PrayerTimesProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                LockScreenOrFallbackView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                LockScreenOrFallbackView(entry: entry)
            }
        }
        .configurationDisplayName("Namaz Vakti")
        .description("Kilidi ekranından namaz vaktini takip edin")
        .supportedFamilies(lockScreenFamilies)
    }
    
    private var lockScreenFamilies: [WidgetFamily] {
        if #available(iOSApplicationExtension 16.0, *) {
            return [.accessoryCircular, .accessoryRectangular, .accessoryInline]
        } else {
            return []
        }
    }
}

// MARK: - Lock Screen / Fallback View Router

struct LockScreenOrFallbackView: View {
    @Environment(\.widgetFamily) var family
    let entry: PrayerTimesEntry
    
    var body: some View {
        if #available(iOSApplicationExtension 16.0, *) {
            switch family {
            case .accessoryCircular:
                LockScreenCircularView(entry: entry)
            case .accessoryRectangular:
                LockScreenRectangularView(entry: entry)
            case .accessoryInline:
                LockScreenInlineView(entry: entry)
            default:
                SmallWidgetView(entry: entry)
            }
        } else {
            SmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Entry View Router (Home Screen)

struct PrayerWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: PrayerTimesEntry
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Widget Bundle

@main
struct IslamiWidgetsBundle: WidgetBundle {
    var body: some Widget {
        PrayerTimesWidget()
        PrayerLockScreenWidget()
    }
}

// MARK: - Preview

#if DEBUG
struct PrayerTimesWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            SmallWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Small")
            
            MediumWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Medium")
        }
    }
}
#endif

// MARK: - Content Margins Helper

extension WidgetConfiguration {
    func contentMarginsDisabledIfAvailable() -> some WidgetConfiguration {
        if #available(iOSApplicationExtension 17.0, *) {
            return self.contentMarginsDisabled()
        } else {
            return self
        }
    }
}

