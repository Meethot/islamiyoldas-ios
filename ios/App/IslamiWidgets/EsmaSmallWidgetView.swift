import SwiftUI
import WidgetKit

// MARK: - Small Esma Widget View

struct EsmaSmallWidgetView: View {
    let entry: EsmaEntry
    
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
            
            // Ambient glow orbs
            Circle()
                .fill(goldColor.opacity(0.08))
                .frame(width: 90, height: 90)
                .blur(radius: 22)
                .offset(x: 45, y: -35)
            
            Circle()
                .fill(Color.green.opacity(0.06))
                .frame(width: 60, height: 60)
                .blur(radius: 18)
                .offset(x: -35, y: 45)
            
            // Content
            VStack(spacing: 0) {
                // Header
                HStack(spacing: 4) {
                    Image(systemName: "star.fill")
                        .font(.system(size: 7, weight: .bold))
                        .foregroundColor(goldColor)
                    
                    Text("ESMALAR")
                        .font(.system(size: 7, weight: .heavy))
                        .tracking(1.5)
                        .foregroundColor(goldColor)
                    
                    Spacer()
                    
                    // Number badge
                    Text("#\(entry.esma.number)")
                        .font(.system(size: 7, weight: .bold, design: .monospaced))
                        .foregroundColor(.white.opacity(0.3))
                }
                .padding(.bottom, 4)
                
                Spacer()
                
                // Arabic name (prominent)
                Text(entry.esma.arabic)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(.white)
                    .minimumScaleFactor(0.5)
                    .lineLimit(1)
                
                .padding(.bottom, 2)
                
                // Transliteration
                Text(entry.esma.transliteration)
                    .font(.system(size: 11, weight: .semibold, design: .serif))
                    .foregroundColor(goldColor.opacity(0.9))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                
                Spacer()
                
                // Ornament divider
                HStack(spacing: 4) {
                    Rectangle()
                        .fill(goldColor.opacity(0.2))
                        .frame(width: 14, height: 0.5)
                    Circle()
                        .fill(goldColor.opacity(0.3))
                        .frame(width: 3, height: 3)
                    Rectangle()
                        .fill(goldColor.opacity(0.2))
                        .frame(width: 14, height: 0.5)
                }
                .padding(.bottom, 3)
                
                // Meaning
                Text(entry.esma.meaning)
                    .font(.system(size: 8, weight: .medium))
                    .foregroundColor(.white.opacity(0.55))
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .minimumScaleFactor(0.7)
            }
            .padding(14)
        }
    }
}
