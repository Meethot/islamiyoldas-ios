import SwiftUI
import WidgetKit

// MARK: - Medium Widget View

struct MediumWidgetView: View {
    let entry: PrayerTimesEntry
    
    var body: some View {
        ZStack {
            // Islamic gradient background
            LinearGradient(
                colors: [
                    Color(red: 0.012, green: 0.180, blue: 0.094),
                    Color(red: 0.020, green: 0.240, blue: 0.130),
                    Color(red: 0.012, green: 0.180, blue: 0.094)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            GeometricPatternOverlay()
                .opacity(0.03)
            
            HStack(spacing: 0) {
                // Left side: Next prayer highlight
                VStack(alignment: .leading, spacing: 4) {
                    // City
                    HStack(spacing: 3) {
                        Image(systemName: "mappin.circle.fill")
                            .font(.system(size: 8))
                        Text(entry.city)
                            .font(.system(size: 9, weight: .bold))
                            .tracking(1.2)
                            .textCase(.uppercase)
                    }
                    .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                    
                    Spacer()
                    
                    if let next = entry.nextPrayer {
                        Text("Sonraki")
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundColor(.white.opacity(0.4))
                            .tracking(2)
                            .textCase(.uppercase)
                        
                        Text(next.name)
                            .font(.system(size: 24, weight: .bold, design: .serif))
                            .foregroundColor(.white)
                            .shadow(color: .black.opacity(0.3), radius: 2, y: 1)
                        
                        Text(formatTime(next.time))
                            .font(.system(size: 14, weight: .medium, design: .monospaced))
                            .foregroundColor(.white.opacity(0.6))
                        
                        Spacer()
                        
                        // Live countdown
                        HStack(spacing: 4) {
                            Image(systemName: "clock.fill")
                                .font(.system(size: 9))
                            Text(next.time, style: .timer)
                                .font(.system(size: 15, weight: .bold, design: .monospaced))
                                .multilineTextAlignment(.leading)
                        }
                        .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(Color.white.opacity(0.07))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .strokeBorder(Color(red: 0.831, green: 0.686, blue: 0.216).opacity(0.15), lineWidth: 0.5)
                                )
                        )
                    } else {
                        VStack(spacing: 4) {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.system(size: 28))
                                .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                            Text("Tüm Vakitler\nTamamlandı")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.white.opacity(0.7))
                                .multilineTextAlignment(.center)
                        }
                        Spacer()
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(14)
                
                // Divider
                Rectangle()
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 1)
                    .padding(.vertical, 12)
                
                // Right side: All 5 prayer times
                VStack(spacing: 0) {
                    ForEach(entry.prayers) { prayer in
                        PrayerRow(prayer: prayer, isNext: prayer.id == entry.nextPrayer?.id)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .padding(.horizontal, 10)
            }
        }
    }
    
    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }
}

// MARK: - Prayer Row (Medium Widget)

struct PrayerRow: View {
    let prayer: PrayerTimesEntry.PrayerItem
    let isNext: Bool
    
    private let goldColor = Color(red: 0.831, green: 0.686, blue: 0.216)
    
    var body: some View {
        HStack {
            // Prayer icon
            Image(systemName: iconForPrayer(prayer.id))
                .font(.system(size: 9))
                .foregroundColor(isNext ? goldColor : (prayer.isPassed ? .white.opacity(0.25) : .white.opacity(0.45)))
                .frame(width: 14)
            
            // Prayer name
            Text(prayer.name)
                .font(.system(size: 11, weight: isNext ? .bold : .medium))
                .foregroundColor(isNext ? .white : (prayer.isPassed ? .white.opacity(0.3) : .white.opacity(0.6)))
            
            Spacer()
            
            // Time
            Text(formatTime(prayer.time))
                .font(.system(size: 11, weight: isNext ? .bold : .regular, design: .monospaced))
                .foregroundColor(isNext ? goldColor : (prayer.isPassed ? .white.opacity(0.25) : .white.opacity(0.5)))
        }
        .padding(.vertical, 5)
        .padding(.horizontal, 6)
        .background(
            RoundedRectangle(cornerRadius: 6)
                .fill(goldColor.opacity(isNext ? 0.1 : 0))
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .strokeBorder(goldColor.opacity(isNext ? 0.15 : 0), lineWidth: 0.5)
                )
        )
    }
    
    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
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
