import SwiftUI
import WidgetKit

// MARK: - Source Parsing Helpers (Motivation)

private func parseMotivSurahName(from source: String) -> String {
    let parts = source.components(separatedBy: ",")
    let surahPart = parts.first ?? source
    return surahPart
        .replacingOccurrences(of: " Suresi", with: "")
        .trimmingCharacters(in: .whitespaces)
}

private func parseMotivVerseNumber(from source: String) -> String {
    let parts = source.components(separatedBy: ",")
    if parts.count > 1 {
        return parts[1].trimmingCharacters(in: .whitespaces)
    }
    return ""
}

// MARK: - Motivation Rectangular Lock Screen View (Oval)

@available(iOSApplicationExtension 16.0, *)
struct MotivationLockScreenRectangularView: View {
    let entry: MotivationEntry
    
    var body: some View {
        ZStack {
            // Transparent background
            
            VStack(alignment: .leading, spacing: 1) {
                HStack(spacing: 3) {
                    Text("💪")
                        .font(.system(size: 8))
                    
                    Text(parseMotivSurahName(from: entry.motivation.source) + " " + parseMotivVerseNumber(from: entry.motivation.source))
                        .font(.system(size: 11, weight: .semibold, design: .serif).italic())
                        .widgetAccentable()
                    
                    Spacer()
                }
                
                Text(entry.motivation.text)
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

// MARK: - Motivation Inline Lock Screen View

@available(iOSApplicationExtension 16.0, *)
struct MotivationLockScreenInlineView: View {
    let entry: MotivationEntry
    
    var body: some View {
        Text("💪 " + parseMotivSurahName(from: entry.motivation.source) + " " + parseMotivVerseNumber(from: entry.motivation.source))
    }
}
