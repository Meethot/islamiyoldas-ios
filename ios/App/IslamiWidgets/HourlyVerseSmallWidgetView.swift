import SwiftUI
import WidgetKit

// MARK: - Small Hourly Verse Widget View

struct HourlyVerseSmallWidgetView: View {
    let entry: HourlyVerseEntry
    
    private let goldColor = Color(red: 0.831, green: 0.686, blue: 0.216)
    private let darkGreen1 = Color(red: 0.012, green: 0.180, blue: 0.094)
    private let darkGreen2 = Color(red: 0.040, green: 0.271, blue: 0.157)
    
    var body: some View {
        ZStack {
            // Islamic gradient background
            LinearGradient(
                colors: [darkGreen1, darkGreen2, darkGreen1],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            // Geometric pattern overlay
            GeometricPatternOverlay()
                .opacity(0.03)
            
            // Ambient glow orbs (mirroring existing theme)
            Circle()
                .fill(goldColor.opacity(0.06))
                .frame(width: 80, height: 80)
                .blur(radius: 20)
                .offset(x: 50, y: -40)
            
            Circle()
                .fill(Color.green.opacity(0.08))
                .frame(width: 60, height: 60)
                .blur(radius: 18)
                .offset(x: -40, y: 50)
            
            // Content
            VStack(spacing: 0) {
                // Header
                HStack(spacing: 4) {
                    // Clock ornament icon representing hourly pattern
                    Image(systemName: "clock")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(goldColor)
                    
                    Text("SAATLİK AYET")
                        .font(.system(size: 7, weight: .heavy))
                        .tracking(1.5)
                        .foregroundColor(goldColor)
                    
                    Spacer()
                }
                .padding(.bottom, 6)
                
                Spacer()
                
                // Decorative ornament line
                HStack(spacing: 2) {
                    ForEach(Array(0..<5), id: \.self) { _ in
                        Circle()
                            .fill(goldColor.opacity(0.2))
                            .frame(width: 1.5, height: 1.5)
                    }
                }
                .padding(.bottom, 4)
                
                // Verse text
                Text("\u{201C}" + entry.verse.text + "\u{201D}")
                    .font(.system(size: 11, weight: .medium, design: .serif))
                    .foregroundColor(.white.opacity(0.88))
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
                    .minimumScaleFactor(0.7)
                    .lineLimit(5)
                
                Spacer()
                
                // Gold divider
                HStack(spacing: 4) {
                    Rectangle()
                        .fill(goldColor.opacity(0.2))
                        .frame(width: 16, height: 0.5)
                    Circle()
                        .fill(goldColor.opacity(0.3))
                        .frame(width: 3, height: 3)
                    Rectangle()
                        .fill(goldColor.opacity(0.2))
                        .frame(width: 16, height: 0.5)
                }
                .padding(.bottom, 3)
                
                // Source
                Text("\u{2014} " + entry.verse.source)
                    .font(.system(size: 7, weight: .bold))
                    .tracking(0.5)
                    .foregroundColor(goldColor.opacity(0.5))
                    .textCase(.uppercase)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .padding(14)
        }
    }
}
