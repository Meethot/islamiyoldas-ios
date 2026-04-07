import SwiftUI
import WidgetKit

// MARK: - Source Parsing Helpers (Hourly)

private func parseHourlySurahName(from source: String) -> String {
    let parts = source.components(separatedBy: ",")
    let surahPart = parts.first ?? source
    return surahPart
        .replacingOccurrences(of: " Suresi", with: "")
        .trimmingCharacters(in: .whitespaces)
}

private func parseHourlyVerseNumber(from source: String) -> String {
    let parts = source.components(separatedBy: ",")
    if parts.count > 1 {
        return parts[1].trimmingCharacters(in: .whitespaces)
    }
    return ""
}

// MARK: - Hourly Verse Rectangular Lock Screen View

@available(iOSApplicationExtension 16.0, *)
struct HourlyVerseLockScreenRectangularView: View {
    let entry: HourlyVerseEntry
    
    var body: some View {
        ZStack {
            // Oval/rounded background
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(.ultraThinMaterial)
            
            VStack(alignment: .leading, spacing: 1) {
                // Top row: clock emoji + surah/verse ref
                HStack(spacing: 3) {
                    Text("🕐")
                        .font(.system(size: 8))
                    
                    Text(parseHourlySurahName(from: entry.verse.source) + " " + parseHourlyVerseNumber(from: entry.verse.source))
                        .font(.system(size: 11, weight: .semibold, design: .serif).italic())
                        .widgetAccentable()
                    
                    Spacer()
                }
                
                // Verse text
                Text(entry.verse.text)
                    .font(.system(size: 13, weight: .medium))
                    .lineLimit(4)
                    .minimumScaleFactor(0.55)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
        }
    }
}

// MARK: - Hourly Verse Inline Lock Screen View

@available(iOSApplicationExtension 16.0, *)
struct HourlyVerseLockScreenInlineView: View {
    let entry: HourlyVerseEntry
    
    var body: some View {
        Text("🕐 " + parseHourlySurahName(from: entry.verse.source) + " " + parseHourlyVerseNumber(from: entry.verse.source))
    }
}
