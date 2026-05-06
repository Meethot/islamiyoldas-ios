import SwiftUI
import WidgetKit

// MARK: - Lock Screen / Fallback View Router for Verse (Oval Style)

struct VerseLockScreenOrFallbackView: View {
    @Environment(\.widgetFamily) var family
    let entry: VerseEntry
    
    var body: some View {
        if WidgetAccessHelper.checkAccess() == .expired {
            if #available(iOSApplicationExtension 16.0, *) {
                switch family {
                case .accessoryRectangular:
                    PremiumRequiredLockRectangularView()
                case .accessoryInline:
                    PremiumRequiredLockInlineView()
                default:
                    PremiumRequiredSmallView()
                }
            } else {
                PremiumRequiredSmallView()
            }
        } else if #available(iOSApplicationExtension 16.0, *) {
            switch family {
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

// MARK: - Verse Rectangular Lock Screen View (OVAL Background)

@available(iOSApplicationExtension 16.0, *)
struct VerseLockScreenRectangularView: View {
    let entry: VerseEntry
    
    var body: some View {
        ZStack {
            // Transparent background
            
            VStack(alignment: .leading, spacing: 1) {
                // Top row: tiny emoji + small surah/verse ref
                HStack(spacing: 3) {
                    Text("📖")
                        .font(.system(size: 8))
                    
                    Text(parseSurahName(from: entry.verse.source) + " " + parseVerseNumber(from: entry.verse.source))
                        .font(.system(size: 11, weight: .semibold, design: .serif).italic())
                        .widgetAccentable()
                    
                    Spacer()
                }
                
                // Verse text — maximized space, scales down for long verses
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



// MARK: - Verse Inline Lock Screen View (shared)

@available(iOSApplicationExtension 16.0, *)
struct VerseLockScreenInlineView: View {
    let entry: VerseEntry
    
    var body: some View {
        Text("📖 " + parseSurahName(from: entry.verse.source) + " " + parseVerseNumber(from: entry.verse.source))
    }
}
