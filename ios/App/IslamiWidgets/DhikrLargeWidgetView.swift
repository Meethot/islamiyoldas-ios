import SwiftUI
import WidgetKit

// MARK: - Large Dhikr Widget View

struct DhikrLargeWidgetView: View {
    let entry: DhikrEntry
    
    private let goldColor = Color(red: 0.831, green: 0.686, blue: 0.216)
    private let darkGreen1 = Color(red: 0.012, green: 0.180, blue: 0.094)
    private let darkGreen2 = Color(red: 0.016, green: 0.302, blue: 0.161)
    private let darkGreen3 = Color(red: 0.008, green: 0.120, blue: 0.063)
    
    // Large ring dimensions
    private let ringRadius: CGFloat = 66
    private let beadSize: CGFloat = 8.0
    
    private func goldenBeadGradient(size: CGFloat) -> RadialGradient {
        RadialGradient(
            colors: [
                Color(red: 1.0, green: 0.95, blue: 0.8),  // Specular highlight
                Color(red: 0.933, green: 0.776, blue: 0.314), // Main gold
                Color(red: 0.588, green: 0.435, blue: 0.118)  // Deep shadow gold
            ],
            center: .init(x: 0.35, y: 0.35),
            startRadius: 0,
            endRadius: size * 0.7
        )
    }
    
    var body: some View {
        ZStack {
            // Background only needed for iOS 14-16 (iOS 17+ uses containerBackground)
            if #available(iOS 17.0, *) {
                // No background needed — containerBackground handles it
            } else {
                LinearGradient(
                    colors: [darkGreen3, darkGreen1, darkGreen2, darkGreen1, darkGreen3],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                
                GeometricPatternOverlay()
                    .opacity(0.03)
            }
            
            // Content
            if #available(iOS 17.0, *) {
                interactiveContent
            } else {
                staticContent
            }
        }
    }
    
    // MARK: - iOS 17+ Interactive Content
    
    @available(iOS 17.0, *)
    private var interactiveContent: some View {
        Button(intent: IncrementDhikrIntent()) {
            contentBody
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
    
    // MARK: - iOS 14-16 Static Content
    
    private var staticContent: some View {
        contentBody
    }
    
    private var contentBody: some View {
        VStack(spacing: 0) {
            // Top header bar
            headerSection
            
            Spacer(minLength: 8)
            
            // Center: Big counter ring
            VStack(spacing: 8) {
                counterRing
                
                if #available(iOSApplicationExtension 17.0, *) {
                    Text("+ Zikret")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(darkGreen1)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 6)
                        .background(goldColor)
                        .clipShape(Capsule())
                }
            }
            
            Spacer(minLength: 8)
            
            // Bottom: Tesbih sequence cards
            tesbihCardsSection
            
            Spacer(minLength: 4)
            
            // Stats row
            statsRow
        }
        .padding(16)
        .animation(.snappy, value: entry.count)
    }
    
    // MARK: - Header Section
    
    private var headerSection: some View {
        HStack {
            // Left: Dhikr badge
            HStack(spacing: 5) {
                Image(systemName: "sparkles")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(goldColor)
                
                Text("ZİKİR")
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(2)
                    .foregroundColor(goldColor)
            }
            
            Spacer()
            
            // Right: Cycle badge
            cycleBadge
        }
    }
    
    // MARK: - Cycle Badge
    
    private var cycleBadge: some View {
        let cycleCount = entry.total / 33
        return HStack(spacing: 4) {
            Image(systemName: "arrow.triangle.2.circlepath")
                .font(.system(size: 9, weight: .bold))
            Text("\(cycleCount) Tur")
                .font(.system(size: 11, weight: .bold))
                .modifier(NumericTransitionModifier())
        }
        .foregroundColor(goldColor)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(goldColor.opacity(0.15))
        .overlay(Capsule().strokeBorder(goldColor.opacity(0.3), lineWidth: 0.5))
        .clipShape(Capsule())
    }
    
    // MARK: - Counter Ring (Large)
    
    private var counterRing: some View {
        ZStack {
            // Background Thread Ring
            Circle()
                .stroke(goldColor.opacity(0.12), lineWidth: 0.5)
                .frame(width: ringRadius * 2, height: ringRadius * 2)
            
            // Beads
            ForEach(0..<33, id: \.self) { i in
                let angle = Double(i) * (2 * .pi / 33) - (.pi / 2)
                let x = ringRadius * CGFloat(cos(angle))
                let y = ringRadius * CGFloat(sin(angle))
                
                let progress = Double(entry.count) / Double(entry.target)
                let threshold = Double(i) / 33.0
                let isFilled = progress > threshold
                
                let isActive = entry.count > 0 && isFilled && (i == 32 || progress <= Double(i + 1) / 33.0)
                
                if isFilled {
                    Circle()
                        .fill(goldenBeadGradient(size: beadSize))
                        .frame(width: beadSize, height: beadSize)
                        .shadow(color: goldColor.opacity(isActive ? 0.45 : 0.2), radius: isActive ? 2.5 : 1.0, x: 0, y: 0)
                        .scaleEffect(isActive ? 1.25 : 1.0)
                        .offset(x: x, y: y)
                } else {
                    Circle()
                        .fill(Color.white.opacity(0.06))
                        .frame(width: beadSize, height: beadSize)
                        .overlay(
                            Circle()
                                .stroke(goldColor.opacity(0.25), lineWidth: 0.5)
                        )
                        .offset(x: x, y: y)
                }
            }
            
            // Center content
            VStack(spacing: 2) {
                // Arabic text
                Text(entry.currentPreset.arabic)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.white)
                    .minimumScaleFactor(0.5)
                    .lineLimit(1)
                    .id(entry.currentPresetIndex)
                
                // Count
                Text("\(entry.count)")
                    .font(.system(size: 44, weight: .black, design: .rounded))
                    .foregroundColor(goldColor)
                    .modifier(NumericTransitionModifier())
                
                // Target
                Text("/ \(entry.target)")
                    .font(.system(size: 13, weight: .bold, design: .monospaced))
                    .foregroundColor(.white.opacity(0.35))
            }
        }
        .frame(width: ringRadius * 2 + 24, height: ringRadius * 2 + 24)
    }
    
    // MARK: - Tesbih Cards Section
    
    private var tesbihCardsSection: some View {
        HStack(spacing: 8) {
            ForEach(0..<3, id: \.self) { i in
                tesbihCard(index: i, preset: DhikrEntry.allPresets[i])
            }
        }
    }
    
    private func tesbihCard(index: Int, preset: DhikrEntry.DhikrPreset) -> some View {
        let isActive = index == entry.currentPresetIndex
        let isCompleted = index < entry.currentPresetIndex
        
        return VStack(spacing: 4) {
            // Status icon
            ZStack {
                Circle()
                    .fill(isCompleted ? goldColor.opacity(0.25) : (isActive ? goldColor.opacity(0.15) : .white.opacity(0.05)))
                    .frame(width: 22, height: 22)
                
                if isCompleted {
                    Image(systemName: "checkmark")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(goldColor)
                } else if isActive {
                    Circle()
                        .fill(goldColor)
                        .frame(width: 6, height: 6)
                } else {
                    Circle()
                        .fill(.white.opacity(0.15))
                        .frame(width: 4, height: 4)
                }
            }
            
            // Name
            Text(preset.name)
                .font(.system(size: 10, weight: isActive ? .bold : .medium))
                .foregroundColor(isActive ? goldColor : (isCompleted ? goldColor.opacity(0.6) : .white.opacity(0.3)))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(isActive ? goldColor.opacity(0.08) : .white.opacity(0.03))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .strokeBorder(isActive ? goldColor.opacity(0.25) : .white.opacity(0.06), lineWidth: 0.5)
                )
        )
    }
    
    // MARK: - Stats Row
    
    private var statsRow: some View {
        HStack {
            Spacer()
            Image(systemName: "number.circle.fill")
                .font(.system(size: 13))
                .foregroundColor(goldColor.opacity(0.8))
            Text("Toplam Zikir: \(entry.total)")
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundColor(.white.opacity(0.6))
                .modifier(NumericTransitionModifier())
            Spacer()
        }
    }
}
