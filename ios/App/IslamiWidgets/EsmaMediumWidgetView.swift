import SwiftUI
import WidgetKit

// MARK: - Medium Esma Widget View

struct EsmaMediumWidgetView: View {
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
            
            // Mihrab arch decoration
            MihrabArchShape()
                .stroke(Color.white.opacity(0.03), lineWidth: 1.2)
                .frame(width: 120, height: 160)
                .offset(x: 0, y: 30)
            
            // Ambient glow orbs
            Circle()
                .fill(goldColor.opacity(0.06))
                .frame(width: 100, height: 100)
                .blur(radius: 25)
                .offset(x: 120, y: -40)
            
            Circle()
                .fill(Color.green.opacity(0.07))
                .frame(width: 80, height: 80)
                .blur(radius: 20)
                .offset(x: -110, y: 40)
            
            // Content — horizontal layout for medium
            HStack(spacing: 0) {
                // Left: Arabic name (large & centered)
                VStack(spacing: 4) {
                    Spacer()
                    
                    Text(entry.esma.arabic)
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(.white)
                        .minimumScaleFactor(0.4)
                        .lineLimit(1)
                    
                    // Number badge under Arabic
                    Text("#\(entry.esma.number)")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .foregroundColor(goldColor.opacity(0.4))
                    
                    Spacer()
                }
                .frame(maxWidth: .infinity)
                
                // Gold vertical divider
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [goldColor.opacity(0), goldColor.opacity(0.2), goldColor.opacity(0)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: 0.5)
                    .padding(.vertical, 16)
                
                // Right: Transliteration + Meaning
                VStack(spacing: 0) {
                    // Header
                    HStack(spacing: 4) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(goldColor)
                        
                        Text("GÜNÜN ESMASI")
                            .font(.system(size: 7, weight: .heavy))
                            .tracking(1.5)
                            .foregroundColor(goldColor)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.bottom, 8)
                    
                    Spacer()
                    
                    // Transliteration
                    Text(entry.esma.transliteration)
                        .font(.system(size: 16, weight: .semibold, design: .serif))
                        .foregroundColor(goldColor)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.bottom, 4)
                    
                    // Ornament
                    HStack(spacing: 3) {
                        OrnamentLineEsma()
                        Circle()
                            .fill(goldColor.opacity(0.3))
                            .frame(width: 2.5, height: 2.5)
                        OrnamentLineEsma()
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.bottom, 6)
                    
                    // Meaning
                    Text(entry.esma.meaning)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.white.opacity(0.7))
                        .multilineTextAlignment(.leading)
                        .lineLimit(3)
                        .minimumScaleFactor(0.7)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    Spacer()
                }
                .frame(maxWidth: .infinity)
                .padding(.leading, 12)
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
        }
    }
}

// MARK: - Ornament Line Helper (Esma)

private struct OrnamentLineEsma: View {
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
            .frame(width: 30, height: 0.5)
    }
}
