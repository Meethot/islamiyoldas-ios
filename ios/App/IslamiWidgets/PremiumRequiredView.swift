import SwiftUI
import WidgetKit

// MARK: - Premium Required View (Home Screen - Small)

struct PremiumRequiredSmallView: View {
    private let premiumURL = URL(string: "islamiyoldas://premium")!
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.012, green: 0.180, blue: 0.094),
                    Color(red: 0.016, green: 0.302, blue: 0.161),
                    Color(red: 0.012, green: 0.180, blue: 0.094)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            VStack(spacing: 10) {
                // Lock icon with gold ring
                ZStack {
                    Circle()
                        .fill(Color(red: 0.831, green: 0.686, blue: 0.216).opacity(0.15))
                        .frame(width: 48, height: 48)
                    
                    Circle()
                        .strokeBorder(Color(red: 0.831, green: 0.686, blue: 0.216).opacity(0.3), lineWidth: 1)
                        .frame(width: 48, height: 48)
                    
                    Image(systemName: "lock.fill")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                }
                
                // Title
                Text(WidgetAccessHelper.premiumRequiredTitle)
                    .font(.system(size: 12, weight: .bold, design: .serif))
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                
                // Crown badge
                HStack(spacing: 3) {
                    Image(systemName: "crown.fill")
                        .font(.system(size: 8))
                    Text("Premium")
                        .font(.system(size: 9, weight: .bold))
                }
                .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(
                    Capsule()
                        .fill(Color(red: 0.831, green: 0.686, blue: 0.216).opacity(0.12))
                        .overlay(
                            Capsule()
                                .strokeBorder(Color(red: 0.831, green: 0.686, blue: 0.216).opacity(0.2), lineWidth: 0.5)
                        )
                )
            }
            .padding(14)
        }
        .widgetURL(premiumURL)
    }
}

// MARK: - Premium Required View (Home Screen - Medium)

struct PremiumRequiredMediumView: View {
    private let premiumURL = URL(string: "islamiyoldas://premium")!
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.012, green: 0.180, blue: 0.094),
                    Color(red: 0.016, green: 0.302, blue: 0.161),
                    Color(red: 0.012, green: 0.180, blue: 0.094)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            HStack(spacing: 16) {
                // Lock icon
                ZStack {
                    Circle()
                        .fill(Color(red: 0.831, green: 0.686, blue: 0.216).opacity(0.15))
                        .frame(width: 56, height: 56)
                    
                    Circle()
                        .strokeBorder(Color(red: 0.831, green: 0.686, blue: 0.216).opacity(0.3), lineWidth: 1)
                        .frame(width: 56, height: 56)
                    
                    Image(systemName: "lock.fill")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    // Title
                    Text(WidgetAccessHelper.premiumRequiredTitle)
                        .font(.system(size: 16, weight: .bold, design: .serif))
                        .foregroundColor(.white)
                    
                    // Subtitle
                    Text(WidgetAccessHelper.premiumRequiredSubtitle)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.6))
                    
                    // Crown badge
                    HStack(spacing: 4) {
                        Image(systemName: "crown.fill")
                            .font(.system(size: 9))
                        Text("Premium")
                            .font(.system(size: 10, weight: .bold))
                    }
                    .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(
                        Capsule()
                            .fill(Color(red: 0.831, green: 0.686, blue: 0.216).opacity(0.12))
                            .overlay(
                                Capsule()
                                    .strokeBorder(Color(red: 0.831, green: 0.686, blue: 0.216).opacity(0.2), lineWidth: 0.5)
                            )
                    )
                    .padding(.top, 2)
                }
                
                Spacer()
            }
            .padding(16)
        }
        .widgetURL(premiumURL)
    }
}

// MARK: - Premium Required View (Lock Screen - Rectangular)

struct PremiumRequiredLockRectangularView: View {
    private let premiumURL = URL(string: "islamiyoldas://premium")!
    
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "lock.fill")
                .font(.system(size: 12, weight: .semibold))
            Text(WidgetAccessHelper.premiumRequiredTitle)
                .font(.system(size: 12, weight: .bold))
                .lineLimit(1)
        }
        .widgetURL(premiumURL)
    }
}

// MARK: - Premium Required View (Lock Screen - Circular)

@available(iOSApplicationExtension 16.0, *)
struct PremiumRequiredLockCircularView: View {
    private let premiumURL = URL(string: "islamiyoldas://premium")!
    
    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: 2) {
                Image(systemName: "lock.fill")
                    .font(.system(size: 14, weight: .semibold))
                Text("Premium")
                    .font(.system(size: 8, weight: .bold))
            }
        }
        .widgetURL(premiumURL)
    }
}

// MARK: - Premium Required View (Lock Screen - Inline)

struct PremiumRequiredLockInlineView: View {
    private let premiumURL = URL(string: "islamiyoldas://premium")!
    
    var body: some View {
        Text("🔒 \(WidgetAccessHelper.premiumRequiredTitle)")
            .font(.system(size: 12, weight: .bold))
            .widgetURL(premiumURL)
    }
}
