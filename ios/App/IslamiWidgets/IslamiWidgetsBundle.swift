import WidgetKit
import SwiftUI

// MARK: - Widget Language Helper

/// Reads the user's app language from App Group UserDefaults.
/// Falls back to system language, then to "tr" if unavailable.
struct WidgetLanguageHelper {
    private static let suiteName = "group.H5GZ9H5MX8.islamiyoldas"
    private static let langKey = "widget_language"
    private static let supportedLanguages = ["tr", "en", "de", "ru", "az", "ar"]
    
    static var currentLanguage: String {
        if let defaults = UserDefaults(suiteName: suiteName),
           let lang = defaults.string(forKey: langKey),
           supportedLanguages.contains(lang) {
            return lang
        }
        
        let systemLang = Locale.preferredLanguages.first?.prefix(2).lowercased() ?? "tr"
        if supportedLanguages.contains(String(systemLang)) { return String(systemLang) }
        return "tr"
    }
}

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
        .configurationDisplayName(NSLocalizedString("widget_prayer_times", comment: ""))
        .description(NSLocalizedString("desc_prayer_times", comment: ""))
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
        .configurationDisplayName(NSLocalizedString("widget_prayer_lock", comment: ""))
        .description(NSLocalizedString("desc_prayer_lock", comment: ""))
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

// MARK: - Verse of the Day Widget

struct VerseWidget: Widget {
    let kind: String = "VerseWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: VerseProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                VerseWidgetEntryView(entry: entry)
                    .containerBackground(for: .widget) {
                        LinearGradient(
                            colors: [
                                Color(red: 0.012, green: 0.180, blue: 0.094),
                                Color(red: 0.040, green: 0.271, blue: 0.157),
                                Color(red: 0.012, green: 0.180, blue: 0.094)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
            } else {
                VerseWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName(NSLocalizedString("widget_daily_verse", comment: ""))
        .description(NSLocalizedString("desc_daily_verse", comment: ""))
        .supportedFamilies([.systemSmall, .systemMedium])
        .contentMarginsDisabledIfAvailable()
    }
}

// MARK: - Lock Screen Verse Widget

struct VerseLockScreenWidget: Widget {
    let kind: String = "VerseLockScreenWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: VerseProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                VerseLockScreenOrFallbackView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                VerseLockScreenOrFallbackView(entry: entry)
            }
        }
        .configurationDisplayName(NSLocalizedString("widget_daily_verse", comment: ""))
        .description(NSLocalizedString("desc_daily_verse", comment: ""))
        .supportedFamilies(lockScreenFamilies)
    }
    
    private var lockScreenFamilies: [WidgetFamily] {
        if #available(iOSApplicationExtension 16.0, *) {
            return [.accessoryRectangular, .accessoryInline]
        } else {
            return []
        }
    }
}

// MARK: - Lock Screen Verse Widget (Transparent)

struct VerseLockScreenTransparentWidget: Widget {
    let kind: String = "VerseLockScreenTransparentWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: VerseProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                VerseLockScreenTransparentOrFallbackView(entry: entry)
                    .containerBackground(.clear, for: .widget)
            } else {
                VerseLockScreenTransparentOrFallbackView(entry: entry)
            }
        }
        .configurationDisplayName(NSLocalizedString("widget_daily_verse_transparent", comment: ""))
        .description(NSLocalizedString("desc_daily_verse_transparent", comment: ""))
        .supportedFamilies(lockScreenFamilies)
    }
    
    private var lockScreenFamilies: [WidgetFamily] {
        if #available(iOSApplicationExtension 16.0, *) {
            return [.accessoryRectangular, .accessoryInline]
        } else {
            return []
        }
    }
}

// MARK: - Esma-ül Hüsna Widget

struct EsmaWidget: Widget {
    let kind: String = "EsmaWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: EsmaProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                EsmaWidgetEntryView(entry: entry)
                    .containerBackground(for: .widget) {
                        LinearGradient(
                            colors: [
                                Color(red: 0.012, green: 0.180, blue: 0.094),
                                Color(red: 0.024, green: 0.235, blue: 0.125),
                                Color(red: 0.012, green: 0.180, blue: 0.094)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
            } else {
                EsmaWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName(NSLocalizedString("widget_daily_esma", comment: ""))
        .description(NSLocalizedString("desc_daily_esma", comment: ""))
        .supportedFamilies([.systemSmall, .systemMedium])
        .contentMarginsDisabledIfAvailable()
    }
}

// MARK: - Hourly Esma Widget

struct HourlyEsmaWidget: Widget {
    let kind: String = "HourlyEsmaWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HourlyEsmaProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                HourlyEsmaWidgetEntryView(entry: entry)
                    .containerBackground(for: .widget) {
                        LinearGradient(
                            colors: [
                                Color(red: 0.012, green: 0.180, blue: 0.094),
                                Color(red: 0.024, green: 0.235, blue: 0.125),
                                Color(red: 0.012, green: 0.180, blue: 0.094)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
            } else {
                HourlyEsmaWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName(NSLocalizedString("widget_hourly_esma", comment: ""))
        .description(NSLocalizedString("desc_hourly_esma", comment: ""))
        .supportedFamilies([.systemSmall, .systemMedium])
        .contentMarginsDisabledIfAvailable()
    }
}

// MARK: - Daily Motivation Widget

struct MotivationWidget: Widget {
    let kind: String = "MotivationWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MotivationProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                MotivationWidgetEntryView(entry: entry)
                    .containerBackground(for: .widget) {
                        LinearGradient(
                            colors: [
                                Color(red: 0.012, green: 0.180, blue: 0.094),
                                Color(red: 0.040, green: 0.271, blue: 0.157),
                                Color(red: 0.012, green: 0.180, blue: 0.094)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
            } else {
                MotivationWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName(NSLocalizedString("widget_daily_motivation", comment: ""))
        .description(NSLocalizedString("desc_daily_motivation", comment: ""))
        .supportedFamilies(motivationFamilies)
        .contentMarginsDisabledIfAvailable()
    }
    
    private var motivationFamilies: [WidgetFamily] {
        if #available(iOSApplicationExtension 16.0, *) {
            return [.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline]
        } else {
            return [.systemSmall, .systemMedium]
        }
    }
}

// MARK: - Hourly Verse Widget

struct HourlyVerseWidget: Widget {
    let kind: String = "HourlyVerseWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HourlyVerseProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                HourlyVerseWidgetEntryView(entry: entry)
                    .containerBackground(for: .widget) {
                        LinearGradient(
                            colors: [
                                Color(red: 0.012, green: 0.180, blue: 0.094),
                                Color(red: 0.030, green: 0.250, blue: 0.140),
                                Color(red: 0.012, green: 0.180, blue: 0.094)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
            } else {
                HourlyVerseWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName(NSLocalizedString("widget_hourly_verse", comment: ""))
        .description(NSLocalizedString("desc_hourly_verse", comment: ""))
        .supportedFamilies(hourlyVerseFamilies)
        .contentMarginsDisabledIfAvailable()
    }
    
    private var hourlyVerseFamilies: [WidgetFamily] {
        if #available(iOSApplicationExtension 16.0, *) {
            return [.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline]
        } else {
            return [.systemSmall, .systemMedium]
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

// MARK: - Verse Entry View Router

struct VerseWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: VerseEntry
    
    var body: some View {
        switch family {
        case .systemSmall:
            VerseSmallWidgetView(entry: entry)
        case .systemMedium:
            VerseMediumWidgetView(entry: entry)
        default:
            VerseSmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Esma Entry View Router

struct EsmaWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: EsmaEntry
    
    var body: some View {
        switch family {
        case .systemSmall:
            EsmaSmallWidgetView(entry: entry)
        case .systemMedium:
            EsmaMediumWidgetView(entry: entry)
        default:
            EsmaSmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Hourly Esma Entry View Router

struct HourlyEsmaWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: EsmaEntry
    
    var body: some View {
        switch family {
        case .systemSmall:
            HourlyEsmaSmallWidgetView(entry: entry)
        case .systemMedium:
            HourlyEsmaMediumWidgetView(entry: entry)
        default:
            HourlyEsmaSmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Hourly Verse Entry View Router

struct HourlyVerseWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: HourlyVerseEntry
    
    var body: some View {
        if #available(iOSApplicationExtension 16.0, *) {
            switch family {
            case .systemSmall:
                HourlyVerseSmallWidgetView(entry: entry)
            case .systemMedium:
                HourlyVerseMediumWidgetView(entry: entry)
            case .accessoryRectangular:
                HourlyVerseLockScreenRectangularView(entry: entry)
            case .accessoryInline:
                HourlyVerseLockScreenInlineView(entry: entry)
            default:
                HourlyVerseSmallWidgetView(entry: entry)
            }
        } else {
            switch family {
            case .systemSmall:
                HourlyVerseSmallWidgetView(entry: entry)
            case .systemMedium:
                HourlyVerseMediumWidgetView(entry: entry)
            default:
                HourlyVerseSmallWidgetView(entry: entry)
            }
        }
    }
}

// MARK: - Motivation Entry View Router

struct MotivationWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: MotivationEntry
    
    /// Home screen should always show DAILY motivation (not hourly)
    private var dailyEntry: MotivationEntry {
        let dailyMotivation = MotivationEntry.motivationForDate(entry.date)
        return MotivationEntry(date: entry.date, motivation: dailyMotivation)
    }
    
    var body: some View {
        if #available(iOSApplicationExtension 16.0, *) {
            switch family {
            case .systemSmall:
                MotivationSmallWidgetView(entry: dailyEntry)
            case .systemMedium:
                MotivationMediumWidgetView(entry: dailyEntry)
            case .accessoryRectangular:
                MotivationLockScreenRectangularView(entry: entry)
            case .accessoryInline:
                MotivationLockScreenInlineView(entry: entry)
            default:
                MotivationSmallWidgetView(entry: dailyEntry)
            }
        } else {
            switch family {
            case .systemSmall:
                MotivationSmallWidgetView(entry: dailyEntry)
            case .systemMedium:
                MotivationMediumWidgetView(entry: dailyEntry)
            default:
                MotivationSmallWidgetView(entry: dailyEntry)
            }
        }
    }
}

// MARK: - Widget Bundle

@main
struct IslamiWidgetsBundle: WidgetBundle {
    var body: some Widget {
        PrayerTimesWidget()
        PrayerLockScreenWidget()
        VerseWidget()
        VerseLockScreenWidget()
        VerseLockScreenTransparentWidget()
        HourlyVerseWidget()
        EsmaWidget()
        HourlyEsmaWidget()
        MotivationWidget()
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
            
            VerseSmallWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Verse Small")
            
            VerseMediumWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Verse Medium")
                
            if #available(iOSApplicationExtension 16.0, *) {
                VerseLockScreenRectangularView(entry: .placeholder)
                    .previewContext(WidgetPreviewContext(family: .accessoryRectangular))
                    .previewDisplayName("Verse Lock Oval")
                
                VerseLockScreenTransparentRectangularView(entry: .placeholder)
                    .previewContext(WidgetPreviewContext(family: .accessoryRectangular))
                    .previewDisplayName("Verse Lock Transparent")
                
                VerseLockScreenInlineView(entry: .placeholder)
                    .previewContext(WidgetPreviewContext(family: .accessoryInline))
                    .previewDisplayName("Verse Lock Inline")
            }
            
            EsmaSmallWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Esma Small")
            
            EsmaMediumWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Esma Medium")
            
            HourlyVerseSmallWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Hourly Verse Small")
            
            HourlyVerseMediumWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Hourly Verse Medium")
            
            HourlyEsmaSmallWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Hourly Esma Small")
            
            HourlyEsmaMediumWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Hourly Esma Medium")
            
            MotivationSmallWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Motivation Small")
            
            MotivationMediumWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Motivation Medium")
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

