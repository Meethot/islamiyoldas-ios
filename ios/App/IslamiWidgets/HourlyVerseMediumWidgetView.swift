import SwiftUI
import WidgetKit

// MARK: - Medium Hourly Verse Widget View

struct HourlyVerseMediumWidgetView: View {
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
            
            // Mihrab arch decoration (subtle, background)
            MihrabArchShape()
                .stroke(Color.white.opacity(0.03), lineWidth: 1.2)
                .frame(width: 140, height: 180)
                .offset(x: 0, y: 20)
            
            // Ambient glow orbs
            Circle()
                .fill(goldColor.opacity(0.06))
                .frame(width: 100, height: 100)
                .blur(radius: 25)
                .offset(x: 120, y: -50)
            
            Circle()
                .fill(Color.green.opacity(0.08))
                .frame(width: 80, height: 80)
                .blur(radius: 22)
                .offset(x: -110, y: 40)
            
            // Content
            VStack(spacing: 0) {
                // Header bar
                HStack {
                    HStack(spacing: 5) {
                        // Clock Ornamental icon
                        ZStack {
                            RoundedRectangle(cornerRadius: 6)
                                .fill(goldColor.opacity(0.1))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 6)
                                        .strokeBorder(goldColor.opacity(0.2), lineWidth: 0.5)
                                )
                                .frame(width: 22, height: 22)
                            
                            Image(systemName: "clock")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(goldColor)
                        }
                        
                        Text("SAATLİK AYET")
                            .font(.system(size: 8, weight: .heavy))
                            .tracking(2)
                            .foregroundColor(goldColor)
                    }
                }
                .padding(.bottom, 8)
                
                Spacer()
                
                // Top decorative ornament
                HStack(spacing: 3) {
                    OrnamentLineBase()
                    Circle()
                        .fill(goldColor.opacity(0.3))
                        .frame(width: 3, height: 3)
                    OrnamentLineBase()
                }
                .padding(.bottom, 6)
                
                // Verse text (centered, larger in medium)
                Text("\u{201C}" + entry.verse.text + "\u{201D}")
                    .font(.system(size: 14, weight: .medium, design: .serif))
                    .foregroundColor(.white.opacity(0.9))
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .minimumScaleFactor(0.65)
                    .lineLimit(4)
                    .fixedSize(horizontal: false, vertical: true)
                
                Spacer()
                
                // Bottom divider
                HStack(spacing: 5) {
                    Rectangle()
                        .fill(goldColor.opacity(0.18))
                        .frame(width: 24, height: 0.5)
                    Circle()
                        .fill(goldColor.opacity(0.25))
                        .frame(width: 3.5, height: 3.5)
                    Rectangle()
                        .fill(goldColor.opacity(0.18))
                        .frame(width: 24, height: 0.5)
                }
                .padding(.bottom, 4)
                
                // Source attribution
                Text("\u{2014} " + entry.verse.source)
                    .font(.system(size: 8, weight: .bold))
                    .tracking(1)
                    .foregroundColor(goldColor.opacity(0.5))
                    .textCase(.uppercase)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
        }
    }
}

// MARK: - Ornament Line Helper

private struct OrnamentLineBase: View {
    private let goldColor = Color(red: 0.831, green: 0.686, blue: 0.216)
    
    var body: some View {
        Rectangle()
            .fill(
                LinearGradient(
                    colors: [goldColor.opacity(0), goldColor.opacity(0.2), goldColor.opacity(0)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .frame(width: 40, height: 0.5)
    }
}
