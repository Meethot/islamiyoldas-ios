import SwiftUI
import WidgetKit

// MARK: - Lock Screen / Fallback View Router for Verse

struct VerseLockScreenOrFallbackView: View {
    @Environment(\.widgetFamily) var family
    let entry: VerseEntry
    
    var body: some View {
        if #available(iOSApplicationExtension 16.0, *) {
            switch family {
            case .accessoryCircular:
                VerseLockScreenCircularView(entry: entry)
            case .accessoryRectangular:
                VerseLockScreenRectangularView(entry: entry)
            case .accessoryInline:
                VerseLockScreenInlineView(entry: entry)
            default:
                VerseSmallWidgetView(entry: entry)
            }
        } else {
            VerseSmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Source Parsing Helpers

private func parseSurahName(from source: String) -> String {
    let parts = source.components(separatedBy: ",")
    let surahPart = parts.first ?? source
    return surahPart
        .replacingOccurrences(of: " Suresi", with: "")
        .trimmingCharacters(in: .whitespaces)
}

private func parseVerseNumber(from source: String) -> String {
    let parts = source.components(separatedBy: ",")
    if parts.count > 1 {
        return parts[1].trimmingCharacters(in: .whitespaces)
    }
    return ""
}

// MARK: - Verse Circular Lock Screen View

@available(iOSApplicationExtension 16.0, *)
struct VerseLockScreenCircularView: View {
    let entry: VerseEntry
    
    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            
            VStack(spacing: 1) {
                Text("📖")
                    .font(.system(size: 14))
                
                Text(parseVerseNumber(from: entry.verse.source))
                    .font(.system(size: 12, weight: .heavy, design: .rounded))
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
            }
        }
    }
}

// MARK: - Verse Rectangular Lock Screen View

@available(iOSApplicationExtension 16.0, *)
struct VerseLockScreenRectangularView: View {
    let entry: VerseEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            // Top row: emoji + surah/verse ref
            HStack(spacing: 4) {
                Text("📖")
                    .font(.system(size: 10))
                
                Text(parseSurahName(from: entry.verse.source) + " " + parseVerseNumber(from: entry.verse.source))
                    .font(.system(size: 13, weight: .bold))
                    .widgetAccentable()
            }
            
            // Verse text — big and readable
            Text(entry.verse.text)
                .font(.system(size: 13, weight: .medium))
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

// MARK: - Verse Inline Lock Screen View

@available(iOSApplicationExtension 16.0, *)
struct VerseLockScreenInlineView: View {
    let entry: VerseEntry
    
    var body: some View {
        Text("📖 " + parseSurahName(from: entry.verse.source) + " " + parseVerseNumber(from: entry.verse.source))
    }
}
