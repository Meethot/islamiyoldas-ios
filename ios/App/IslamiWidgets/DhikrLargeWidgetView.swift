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
    private let ringRadius: CGFloat = 72
    private let ringStroke: CGFloat = 8
    
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
    
    // MARK: - Shared Content Body
    
    private var contentBody: some View {
        VStack(spacing: 0) {
            // Top header bar
            headerSection
            
            Spacer(minLength: 8)
            
            // Center: Big counter ring
            counterRing
            
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
            // Outer decorative ring
            Circle()
                .stroke(goldColor.opacity(0.06), lineWidth: 1)
                .frame(width: ringRadius * 2 + 24, height: ringRadius * 2 + 24)
            
            // Ring background
            Circle()
                .stroke(.white.opacity(0.08), lineWidth: ringStroke)
                .frame(width: ringRadius * 2, height: ringRadius * 2)
            
            // Ring progress
            Circle()
                .trim(from: 0, to: entry.progress)
                .stroke(
                    AngularGradient(
                        gradient: Gradient(colors: [
                            goldColor.opacity(0.4),
                            goldColor.opacity(0.7),
                            goldColor,
                            .white.opacity(0.9),
                            goldColor
                        ]),
                        center: .center,
                        startAngle: .degrees(-90),
                        endAngle: .degrees(270)
                    ),
                    style: StrokeStyle(lineWidth: ringStroke, lineCap: .round)
                )
                .frame(width: ringRadius * 2, height: ringRadius * 2)
                .rotationEffect(.degrees(-90))
            
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
                    .font(.system(size: 48, weight: .black, design: .rounded))
                    .foregroundColor(goldColor)
                    .modifier(NumericTransitionModifier())
                
                // Target
                Text("/ \(entry.target)")
                    .font(.system(size: 14, weight: .bold, design: .monospaced))
                    .foregroundColor(.white.opacity(0.35))
            }
            
            // Tap hint
            if #available(iOSApplicationExtension 17.0, *) {
                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(goldColor.opacity(0.4))
                    .offset(y: ringRadius + 16)
            }
        }
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
        HStack(spacing: 0) {
            // Progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(.white.opacity(0.08))
                        .frame(height: 5)
                    
                    RoundedRectangle(cornerRadius: 3)
                        .fill(
                            LinearGradient(
                                colors: [goldColor.opacity(0.5), goldColor, .white.opacity(0.8)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geo.size.width * entry.progress, height: 5)
                }
            }
            .frame(height: 5)
            
            Spacer().frame(width: 12)
            
            // Total count
            Text("\(entry.total)")
                .font(.system(size: 13, weight: .heavy, design: .rounded))
                .foregroundColor(goldColor.opacity(0.8))
                .modifier(NumericTransitionModifier())
        }
    }
}
