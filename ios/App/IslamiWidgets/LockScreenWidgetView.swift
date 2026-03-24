import SwiftUI
import WidgetKit

// MARK: - Lock Screen Circular Widget (iOS 16+)

@available(iOSApplicationExtension 16.0, *)
struct LockScreenCircularView: View {
    let entry: PrayerTimesEntry
    
    var body: some View {
        if let next = entry.nextPrayer {
            ZStack {
                // Outer progress ring
                AccessoryWidgetBackground()
                
                // Progress arc
                Circle()
                    .trim(from: 0, to: CGFloat(gaugeProgress()))
                    .stroke(
                        style: StrokeStyle(lineWidth: 3, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .padding(2)
                
                // Center content: prayer time
                VStack(spacing: 0) {
                    Image(systemName: iconForPrayer(next.id))
                        .font(.system(size: 11, weight: .bold))
                    Text(formatTime(next.time))
                        .font(.system(size: 12, weight: .heavy, design: .monospaced))
                        .minimumScaleFactor(0.7)
                }
            }
        } else {
            ZStack {
                AccessoryWidgetBackground()
                Image(systemName: "checkmark.seal.fill")
                    .font(.system(size: 20, weight: .medium))
            }
        }
    }
    
    private func gaugeProgress() -> Double {
        guard let next = entry.nextPrayer else { return 1.0 }
        let now = Date()
        let total: TimeInterval = 3600 * 4
        let remaining = next.time.timeIntervalSince(now)
        if remaining <= 0 { return 1.0 }
        return max(0.05, min(1, 1 - (remaining / total)))
    }
    
    private func formatTime(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f.string(from: date)
    }
    
    private func iconForPrayer(_ id: String) -> String {
        switch id {
        case "fajr":    return "sunrise.fill"
        case "dhuhr":   return "sun.max.fill"
        case "asr":     return "sun.haze.fill"
        case "maghrib": return "sunset.fill"
        case "isha":    return "moon.stars.fill"
        default:        return "clock.fill"
        }
    }
}

// MARK: - Lock Screen Rectangular Widget (iOS 16+)

@available(iOSApplicationExtension 16.0, *)
struct LockScreenRectangularView: View {
    let entry: PrayerTimesEntry
    
    var body: some View {
        if let next = entry.nextPrayer {
            HStack(spacing: 8) {
                // Left: Prayer icon with circle background
                ZStack {
                    Circle()
                        .fill(.ultraThinMaterial)
                        .frame(width: 28, height: 28)
                    Image(systemName: iconForPrayer(next.id))
                        .font(.system(size: 13, weight: .semibold))
                }
                
                // Right: Prayer info — two rows
                VStack(alignment: .leading, spacing: 2) {
                    // Row 1: Name + Time
                    HStack(spacing: 6) {
                        Text(next.name)
                            .font(.system(size: 14, weight: .bold))
                        Text(formatTime(next.time))
                            .font(.system(size: 12, weight: .medium, design: .monospaced))
                            .foregroundStyle(.secondary)
                    }
                    
                    // Row 2: Countdown only
                    Text(next.time, style: .timer)
                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                        .monospacedDigit()
                        .foregroundStyle(.primary)
                }
                
                Spacer()
            }
        } else {
            HStack(spacing: 8) {
                Image(systemName: "checkmark.seal.fill")
                    .font(.system(size: 16, weight: .medium))
                VStack(alignment: .leading, spacing: 1) {
                    Text("Tüm Vakitler")
                        .font(.system(size: 13, weight: .bold))
                    Text("Tamamlandı")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }
        }
    }
    
    private func formatTime(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f.string(from: date)
    }
    
    private func iconForPrayer(_ id: String) -> String {
        switch id {
        case "fajr":    return "sunrise.fill"
        case "dhuhr":   return "sun.max.fill"
        case "asr":     return "sun.haze.fill"
        case "maghrib": return "sunset.fill"
        case "isha":    return "moon.stars.fill"
        default:        return "clock.fill"
        }
    }
}

// MARK: - Lock Screen Inline Widget (iOS 16+)

@available(iOSApplicationExtension 16.0, *)
struct LockScreenInlineView: View {
    let entry: PrayerTimesEntry
    
    var body: some View {
        if let next = entry.nextPrayer {
            HStack(spacing: 4) {
                Image(systemName: iconForPrayer(next.id))
                Text("\(next.name) \(formatTime(next.time))")
                    .font(.system(size: 13, weight: .semibold))
            }
        } else {
            HStack(spacing: 4) {
                Image(systemName: "checkmark.seal.fill")
                Text("Tüm Vakitler Tamam")
            }
        }
    }
    
    private func formatTime(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f.string(from: date)
    }
    
    private func iconForPrayer(_ id: String) -> String {
        switch id {
        case "fajr":    return "sunrise.fill"
        case "dhuhr":   return "sun.max.fill"
        case "asr":     return "sun.haze.fill"
        case "maghrib": return "sunset.fill"
        case "isha":    return "moon.stars.fill"
        default:        return "clock.fill"
        }
    }
}
