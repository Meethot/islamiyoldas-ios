import SwiftUI
import WidgetKit

// MARK: - Small Dhikr Widget View

struct DhikrSmallWidgetView: View {
    let entry: DhikrEntry
    
    private let goldColor = Color(red: 0.831, green: 0.686, blue: 0.216)
    private let darkGreen1 = Color(red: 0.012, green: 0.180, blue: 0.094)
    private let darkGreen2 = Color(red: 0.040, green: 0.271, blue: 0.157)
    
    // Ring and bead dimensions for small widget
    private let ringRadius: CGFloat = 34
    private let beadSize: CGFloat = 5.0
    
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
            contentLayout
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
    
    // MARK: - iOS 14-16 Static Content (opens app)
    
    private var staticContent: some View {
        contentLayout
    }
    
    // MARK: - Shared Layout
    
    private var contentLayout: some View {
        VStack(spacing: 0) {
            // Header
            HStack(spacing: 3) {
                Image(systemName: "sparkles")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(goldColor)
                
                Text("ZİKİR")
                    .font(.system(size: 8, weight: .heavy))
                    .tracking(1.5)
                    .foregroundColor(goldColor)
                
                Spacer()
            }
            .padding(.bottom, 2)
            
            Spacer(minLength: 0)
            
            // Center: Bead Ring with Count
            ZStack {
                // Background Thread Ring
                Circle()
                    .stroke(goldColor.opacity(0.12), lineWidth: 0.5)
                    .frame(width: ringRadius * 2, height: ringRadius * 2)
                
                // Beads
                let displayCount = entry.count % max(1, entry.target) == 0 && entry.count > 0 ? entry.target : entry.count % max(1, entry.target)
                let progress = Double(displayCount) / Double(max(1, entry.target))
                
                ForEach(0..<33, id: \.self) { i in
                    let angle = Double(i) * (2 * .pi / 33) - (.pi / 2)
                    let x = ringRadius * CGFloat(cos(angle))
                    let y = ringRadius * CGFloat(sin(angle))
                    
                    let threshold = Double(i) / 33.0
                    let isFilled = progress > threshold
                    
                    let isActive = displayCount > 0 && isFilled && (i == 32 || progress <= Double(i + 1) / 33.0)
                    
                    if isFilled {
                        Circle()
                            .fill(goldenBeadGradient(size: beadSize))
                            .frame(width: beadSize, height: beadSize)
                            .shadow(color: goldColor.opacity(isActive ? 0.45 : 0.2), radius: isActive ? 2.0 : 1.0, x: 0, y: 0)
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
                
                // Center count text
                VStack(spacing: -2) {
                    Text("\(displayCount)")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                        .foregroundColor(goldColor)
                        .lineLimit(1)
                        .minimumScaleFactor(0.3)
                        .modifier(NumericTransitionModifier())
                    
                    Text("/ \(entry.target)")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .foregroundColor(.white.opacity(0.4))
                        .lineLimit(1)
                        .minimumScaleFactor(0.4)
                }
                .frame(maxWidth: ringRadius * 2 - 18)
            }
            .frame(width: ringRadius * 2 + 16, height: ringRadius * 2 + 16)
            
            Spacer(minLength: 0)
            
            // Zikir Name (footer)
            Text(entry.currentPreset.name)
                .font(.system(size: 11, weight: .bold, design: .serif))
                .foregroundColor(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .padding(12)
        .animation(.snappy, value: entry.count)
    }
}
import SwiftUI
import WidgetKit

// MARK: - Lock Screen Circular Widget (iOS 16+)

@available(iOSApplicationExtension 16.0, *)
struct DhikrLockScreenCircularView: View {
    let entry: DhikrEntry
    
    var body: some View {
        if #available(iOS 17.0, *) {
            Button(intent: IncrementDhikrIntent()) {
                circularContent
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        } else {
            circularContent
        }
    }
    
    private var circularContent: some View {
        ZStack {
            AccessoryWidgetBackground()
            
            VStack(spacing: 0) {
                let displayCount = entry.count % max(1, entry.target) == 0 && entry.count > 0 ? entry.target : entry.count % max(1, entry.target)
                Text("\(displayCount)")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)
                
                Text(entry.currentPreset.name.prefix(4).uppercased())
                    .font(.system(size: 8, weight: .semibold))
                    .opacity(0.8)
            }
        }
    }
}

// MARK: - Lock Screen Rectangular Widget (iOS 16+)

@available(iOSApplicationExtension 16.0, *)
struct DhikrLockScreenRectangularView: View {
    let entry: DhikrEntry
    
    var body: some View {
        if #available(iOS 17.0, *) {
            Button(intent: IncrementDhikrIntent()) {
                rectangularContent
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        } else {
            rectangularContent
        }
    }
    
    private var rectangularContent: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.currentPreset.name.uppercased())
                    .font(.system(size: 12, weight: .bold))
                
                let displayCount = entry.count % max(1, entry.target) == 0 && entry.count > 0 ? entry.target : entry.count % max(1, entry.target)
                Text("\(displayCount)")
                    .font(.system(size: 24, weight: .heavy, design: .rounded))
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)
            }
            Spacer()
            
            // Interaction icon to indicate it can be tapped
            if #available(iOS 17.0, *) {
                Image(systemName: "hand.tap.fill")
                    .font(.system(size: 16))
                    .opacity(0.6)
            }
        }
    }
}

// MARK: - Lock Screen Inline Widget (iOS 16+)

@available(iOSApplicationExtension 16.0, *)
struct DhikrLockScreenInlineView: View {
    let entry: DhikrEntry
    
    var body: some View {
        if #available(iOS 17.0, *) {
            Button(intent: IncrementDhikrIntent()) {
                inlineContent
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        } else {
            inlineContent
        }
    }
    
    private var inlineContent: some View {
        let displayCount = entry.count % max(1, entry.target) == 0 && entry.count > 0 ? entry.target : entry.count % max(1, entry.target)
        return Text("\(entry.currentPreset.name): \(displayCount)")
    }
}
