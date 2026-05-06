import SwiftUI
import WidgetKit

// MARK: - Small Dhikr Widget View

struct DhikrSmallWidgetView: View {
    let entry: DhikrEntry
    
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
            
            // Ambient glow
            Circle()
                .fill(goldColor.opacity(0.15))
                .frame(width: 120, height: 120)
                .blur(radius: 30)
                .offset(x: 0, y: -10)
            
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
            HStack(spacing: 4) {
                Image(systemName: "sparkles")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(goldColor)
                
                Text("ZİKİR")
                    .font(.system(size: 9, weight: .heavy))
                    .tracking(1.5)
                    .foregroundColor(goldColor)
                
                Spacer()
                
                // Count / Target badge
                Text("\(entry.count)/\(entry.target)")
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .foregroundColor(.white.opacity(0.4))
            }
            .padding(.bottom, 4)
            
            Spacer()
            
            // Arabic text (prominent)
            Text(entry.currentPreset.arabic)
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.white)
                .shadow(color: .black.opacity(0.4), radius: 2, y: 1)
                .minimumScaleFactor(0.5)
                .lineLimit(1)
                .padding(.bottom, 2)
            
            // Transliteration
            Text(entry.currentPreset.name)
                .font(.system(size: 14, weight: .bold, design: .serif))
                .foregroundColor(goldColor.opacity(0.9))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            
            Spacer()
            
            // Large count display
            HStack(spacing: 0) {
                Text("\(entry.count)")
                    .font(.system(size: 38, weight: .black, design: .rounded))
                    .foregroundColor(goldColor)
                    .shadow(color: goldColor.opacity(0.35), radius: 6, y: 2)
            }
            .padding(.bottom, 4)
            
            // Progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    // Track (Glassmorphism)
                    RoundedRectangle(cornerRadius: 2.5)
                        .fill(.white.opacity(0.1))
                        .overlay(
                            RoundedRectangle(cornerRadius: 2.5)
                                .stroke(.white.opacity(0.15), lineWidth: 0.5)
                        )
                        .frame(height: 5)
                    
                    // Fill (Neon)
                    RoundedRectangle(cornerRadius: 2.5)
                        .fill(
                            LinearGradient(
                                colors: [goldColor.opacity(0.7), goldColor, .white.opacity(0.8)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .shadow(color: goldColor.opacity(0.6), radius: 3, y: 0)
                        .frame(width: geo.size.width * entry.progress, height: 5)
                }
            }
            .frame(height: 5)
        }
        .padding(14)
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
                Text("\(entry.count)")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
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
                
                Text("\(entry.count)")
                    .font(.system(size: 24, weight: .heavy, design: .rounded))
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
        Text("\(entry.currentPreset.name): \(entry.count)")
    }
}
