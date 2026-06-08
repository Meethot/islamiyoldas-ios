import SwiftUI
import WidgetKit

// MARK: - Medium Dhikr Widget View

struct DhikrMediumWidgetView: View {
    let entry: DhikrEntry
    
    private let goldColor = Color(red: 0.831, green: 0.686, blue: 0.216)
    private let darkGreen1 = Color(red: 0.012, green: 0.180, blue: 0.094)
    private let darkGreen2 = Color(red: 0.016, green: 0.302, blue: 0.161)
    
    // Progress ring dimensions
    private let ringRadius: CGFloat = 42
    private let beadSize: CGFloat = 6.0
    
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
                    colors: [darkGreen1, darkGreen2, darkGreen1],
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
    
    // MARK: - Shared Content Body
    
    private var contentBody: some View {
        HStack(spacing: 14) {
            leftColumn
            Spacer()
            VStack(spacing: 8) {
                counterRing
                
                // "+ Zikret" pill button under the circle
                Text("+ Zikret")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(darkGreen1)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 6)
                    .background(goldColor)
                    .clipShape(Capsule())
            }
            .padding(.top, 4)
        }
        .overlay(alignment: .top) {
            cycleBadge
                .offset(y: -4) // Align perfectly with the header text
        }
        .padding(16)
        .animation(.snappy, value: entry.count)
    }
    
    private var cycleBadge: some View {
        let cycleCount = (entry.count / max(1, entry.target)) + 1
        return HStack(spacing: 3) {
            Image(systemName: "arrow.triangle.2.circlepath")
                .font(.system(size: 8, weight: .bold))
            Text("\(cycleCount) Tur")
                .font(.system(size: 10, weight: .bold))
                .modifier(NumericTransitionModifier())
        }
        .foregroundColor(goldColor)
        .padding(.horizontal, 6)
        .padding(.vertical, 3)
        .background(goldColor.opacity(0.15))
        .overlay(Capsule().strokeBorder(goldColor.opacity(0.3), lineWidth: 0.5))
        .clipShape(Capsule())
    }
    
    // MARK: - Left Column (Dhikr Info)
    
    private var leftColumn: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack(spacing: 4) {
                Image(systemName: "sparkles")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(goldColor)
                
                Text("ZİKİR")
                    .font(.system(size: 10, weight: .heavy))
                    .tracking(1.5)
                    .foregroundColor(goldColor)
            }
            .padding(.bottom, 8)
            
            // Arabic text
            Text(entry.currentPreset.arabic)
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(.white)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
                .padding(.bottom, 2)
                .id(entry.currentPresetIndex)
            
            // Transliteration
            Text(entry.currentPreset.name)
                .font(.system(size: 16, weight: .bold, design: .serif))
                .foregroundColor(goldColor.opacity(0.9))
                .lineLimit(1)
            
            // Meaning
            Text(entry.currentPreset.meaning)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.white.opacity(0.4))
                .lineLimit(2)
                .padding(.top, 2)
            
            Spacer(minLength: 0)
            
            // Progress bar (Restored per user request)
            progressBar
            
            // Tesbih sequence indicator (Restored per user request)
            tesbihSequence
                .padding(.top, 6)
        }
    }
    
    // MARK: - Counter Ring
    
    private var counterRing: some View {
        let displayCount = entry.count % max(1, entry.target) == 0 && entry.count > 0 ? entry.target : entry.count % max(1, entry.target)
        let progress = Double(displayCount) / Double(max(1, entry.target))
        
        return ZStack {
            // Background Thread Ring
            Circle()
                .stroke(goldColor.opacity(0.12), lineWidth: 0.5)
                .frame(width: ringRadius * 2, height: ringRadius * 2)
            
            // Beads
            ForEach(0..<33, id: \.self) { i in
                let angle = Double(i) * (2 * .pi / 33) - (.pi / 2)
                let x = ringRadius * CGFloat(cos(angle))
                let y = ringRadius * CGFloat(sin(angle))
                
                let threshold = Double(i) / 33.0
                let isFilled = progress > threshold
                
                // Only the last completed bead glows
                let isActive = displayCount > 0 && isFilled && (i == 32 || progress <= Double(i + 1) / 33.0)
                
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
            
            // Count text
            VStack(spacing: 0) {
                Text("\(displayCount)")
                    .font(.system(size: 30, weight: .black, design: .rounded))
                    .foregroundColor(goldColor)
                    .lineLimit(1)
                    .minimumScaleFactor(0.3)
                    .modifier(NumericTransitionModifier())
                
                Text("/ \(entry.target)")
                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                    .foregroundColor(.white.opacity(0.4))
                    .lineLimit(1)
                    .minimumScaleFactor(0.4)
            }
            .frame(maxWidth: ringRadius * 2 - 20)
        }
        .frame(width: ringRadius * 2, height: ringRadius * 2)
    }
    
    // MARK: - Progress Bar
    
    private var progressBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(.white.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 2)
                            .stroke(.white.opacity(0.15), lineWidth: 0.5)
                    )
                    .frame(height: 4)
                
                RoundedRectangle(cornerRadius: 2)
                    .fill(
                        LinearGradient(
                            colors: [goldColor.opacity(0.5), goldColor, .white.opacity(0.8)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geo.size.width * entry.progress, height: 4)
            }
        }
        .frame(height: 4)
    }
    
    // MARK: - Tesbih Sequence Dots (Restored per user request)
    
    private var tesbihSequence: some View {
        HStack(spacing: 8) {
            ForEach(0..<3, id: \.self) { i in
                HStack(spacing: 3) {
                    Circle()
                        .fill(i == entry.currentPresetIndex ? goldColor : .white.opacity(0.15))
                        .frame(width: 5, height: 5)
                    
                    Text(DhikrEntry.allPresets[i].name)
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(i == entry.currentPresetIndex ? goldColor.opacity(0.9) : .white.opacity(0.3))
                }
            }
        }
    }
}
