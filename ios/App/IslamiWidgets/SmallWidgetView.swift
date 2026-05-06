import SwiftUI
import WidgetKit

// MARK: - Small Widget View

struct SmallWidgetView: View {
    let entry: PrayerTimesEntry
    
    var body: some View {
        ZStack {
            // Islamic gradient background
            LinearGradient(
                colors: [
                    Color(red: 0.012, green: 0.180, blue: 0.094),  // #032e18
                    Color(red: 0.016, green: 0.302, blue: 0.161),  // #044d29
                    Color(red: 0.012, green: 0.180, blue: 0.094)   // #032e18
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            // Subtle geometric pattern overlay
            GeometricPatternOverlay()
                .opacity(0.04)
            
            VStack(spacing: 0) {
                // City name
                HStack {
                    Image(systemName: "mappin.circle.fill")
                        .font(.system(size: 8))
                        .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216)) // Islamic gold
                    Text(entry.city)
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                        .tracking(1.5)
                        .textCase(.uppercase)
                    Spacer()
                }
                .padding(.bottom, 6)
                
                Spacer()
                
                if let next = entry.nextPrayer {
                    // Next prayer name
                    Text(next.name)
                        .font(.system(size: 22, weight: .bold, design: .serif))
                        .foregroundColor(.white)
                        .shadow(color: .black.opacity(0.3), radius: 2, y: 1)
                    
                    // Prayer time
                    Text(formatTime(next.time))
                        .font(.system(size: 13, weight: .medium, design: .monospaced))
                        .foregroundColor(.white.opacity(0.7))
                        .padding(.top, 1)
                    
                    Spacer()
                    
                    // Live countdown timer
                    HStack(spacing: 4) {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 9))
                            .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                        Text(next.time, style: .timer)
                            .font(.system(size: 14, weight: .bold, design: .monospaced))
                            .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                            .multilineTextAlignment(.leading)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.white.opacity(0.08))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .strokeBorder(Color(red: 0.831, green: 0.686, blue: 0.216).opacity(0.2), lineWidth: 0.5)
                            )
                    )
                } else {
                    // All prayers completed
                    VStack(spacing: 4) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 28))
                            .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                        Text("Tüm Vakitler")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white.opacity(0.8))
                        Text("Tamamlandı")
                            .font(.system(size: 9, weight: .medium))
                            .foregroundColor(.white.opacity(0.5))
                    }
                    Spacer()
                }
            }
            .padding(14)
        }
    }
    
    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }
}

// MARK: - Geometric Pattern Overlay

struct GeometricPatternOverlay: View {
    var body: some View {
        GeometryReader { geo in
            Path { path in
                let spacing: CGFloat = 24
                let cols = Int(geo.size.width / spacing) + 2
                let rows = Int(geo.size.height / spacing) + 2
                
                for row in 0..<rows {
                    for col in 0..<cols {
                        let x = CGFloat(col) * spacing
                        let y = CGFloat(row) * spacing
                        let starSize: CGFloat = 6
                        
                        for i in 0..<8 {
                            let angle = CGFloat(i) * .pi / 4
                            let px = x + cos(angle) * starSize
                            let py = y + sin(angle) * starSize
                            if i == 0 {
                                path.move(to: CGPoint(x: px, y: py))
                            } else {
                                path.addLine(to: CGPoint(x: px, y: py))
                            }
                        }
                        path.closeSubpath()
                    }
                }
            }
            .stroke(Color.white, lineWidth: 0.3)
        }
    }
}

// MARK: - Numeric Transition Modifier (iOS 16+ safe)

struct NumericTransitionModifier: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 16.0, *) {
            content.contentTransition(.numericText())
        } else {
            content
        }
    }
}

