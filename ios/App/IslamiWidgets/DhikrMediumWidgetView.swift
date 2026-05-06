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
    private let ringStroke: CGFloat = 6
    
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
            counterRing
        }
        .overlay(alignment: .top) {
            cycleBadge
                .offset(y: -4) // Align perfectly with the header text
        }
        .padding(16)
        .animation(.snappy, value: entry.count)
    }
    
    // MARK: - Cycle Badge
    
    private var cycleBadge: some View {
        let cycleCount = entry.total / 33
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
            
            Spacer()
            
            // Progress bar
            progressBar
            
            // Tesbih sequence indicator
            tesbihSequence
                .padding(.top, 6)
        }
    }
    
    // MARK: - Counter Ring
    
    private var counterRing: some View {
        ZStack {
            // Ring background
            Circle()
                .stroke(.white.opacity(0.12), lineWidth: ringStroke)
                .frame(width: ringRadius * 2, height: ringRadius * 2)
            
            // Ring progress
            Circle()
                .trim(from: 0, to: entry.progress)
                .stroke(
                    LinearGradient(
                        colors: [goldColor.opacity(0.6), goldColor, .white.opacity(0.9)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    style: StrokeStyle(lineWidth: ringStroke, lineCap: .round)
                )
                .frame(width: ringRadius * 2, height: ringRadius * 2)
                .rotationEffect(.degrees(-90))
            
            // Count text
            VStack(spacing: 0) {
                Text("\(entry.count)")
                    .font(.system(size: 36, weight: .black, design: .rounded))
                    .foregroundColor(goldColor)
                    .modifier(NumericTransitionModifier())
                
                Text("/ \(entry.target)")
                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                    .foregroundColor(.white.opacity(0.4))
            }
            
            // Tap hint (subtle "+" at bottom)
            if #available(iOSApplicationExtension 17.0, *) {
                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(goldColor.opacity(0.4))
                    .offset(y: ringRadius + 10)
            }
        }
        .frame(width: ringRadius * 2 + 24, height: ringRadius * 2 + 24)
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
    
    // MARK: - Tesbih Sequence Dots
    
    private var tesbihSequence: some View {
        HStack(spacing: 4) {
            ForEach(0..<3, id: \.self) { i in
                HStack(spacing: 2) {
                    Circle()
                        .fill(i == entry.currentPresetIndex ? goldColor : .white.opacity(0.15))
                        .frame(width: 4, height: 4)
                    
                    Text(DhikrEntry.allPresets[i].name)
                        .font(.system(size: 6, weight: .bold))
                        .foregroundColor(i == entry.currentPresetIndex ? goldColor.opacity(0.8) : .white.opacity(0.2))
                }
            }
        }
    }
}
