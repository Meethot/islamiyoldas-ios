//
//  OfferLiveActivity.swift
//  IslamiWidgets
//
//  "Son Teklif" Live Activity — kilit ekranı + Dynamic Island geri sayımı.
//  Sayaç ve fitil (ProgressView) sistem tarafında kendi kendine akar;
//  uygulama kapalıyken bile çalışır, push/backend gerektirmez.
//  Dokununca islamiyoldas://premium?offer=true deep link'i ile paywall açılır.
//

import WidgetKit
import SwiftUI
#if canImport(ActivityKit)
import ActivityKit

// MARK: - Tema (canlı zümrüt + altın — iç açıcı, koyu değil)

@available(iOSApplicationExtension 16.1, *)
private enum OfferTheme {
    static let gold = Color(red: 0.831, green: 0.686, blue: 0.216)      // #D4AF37
    static let brightGold = Color(red: 1.0, green: 0.843, blue: 0.0)    // #FFD700
    static let paleGold = Color(red: 1.0, green: 0.878, blue: 0.40)     // #FFE066

    // Tema zümrüt paleti — uygulamanın indirim ekranıyla aynı aile (#115e3b → #073822),
    // simsiyah uca inmeden. Canlı çimen yeşili değil, asil zümrüt.
    static let greenLight = Color(red: 0.086, green: 0.420, blue: 0.263)  // #166B43 (temanın aydınlık ucu)
    static let greenMid = Color(red: 0.067, green: 0.369, blue: 0.231)    // #115e3b (indirim ekranı üst tonu)
    static let greenDeep = Color(red: 0.027, green: 0.220, blue: 0.133)   // #073822 (indirim ekranı orta tonu)

    static let deepLink = URL(string: "islamiyoldas://premium?offer=true")

    /// Süre geçmişse Text(timerInterval:) çökmesin diye aralığı güvenceye al
    static func safeRange(to endDate: Date) -> ClosedRange<Date> {
        let now = Date()
        return now...max(endDate, now.addingTimeInterval(1))
    }

    /// Fitil için tam aralık (başlangıç → bitiş); bozuksa güvenli varsayılan
    static func fuseRange(_ state: OfferActivityAttributes.ContentState) -> ClosedRange<Date> {
        guard state.endDate > state.startDate else {
            return Date()...Date().addingTimeInterval(1)
        }
        return state.startDate...state.endDate
    }
}

// MARK: - Altın Hilal Mührü (marka kimliği — jenerik alev değil)

@available(iOSApplicationExtension 16.1, *)
private struct GoldCrescentSeal: View {
    var size: CGFloat = 46
    /// Bekleme modunda (AOD) parlama kapatılır — Apple AOD tasarım önerisi
    var dimmed: Bool = false

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    LinearGradient(
                        colors: [OfferTheme.paleGold, OfferTheme.brightGold, OfferTheme.gold],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
            Image(systemName: "moon.stars.fill")
                .font(.system(size: size * 0.42, weight: .bold))
                .foregroundColor(OfferTheme.greenDeep)
        }
        .frame(width: size, height: size)
        .shadow(color: dimmed ? .clear : OfferTheme.brightGold.opacity(0.5), radius: 6, x: 0, y: 2)
    }
}

// MARK: - Kilit Ekranı Görünümü

@available(iOSApplicationExtension 16.1, *)
struct OfferLockScreenView: View {
    let context: ActivityViewContext<OfferActivityAttributes>
    /// Bekleme modu (Always-On Display, karartılmış ekran) — saniye güncellenmez,
    /// bu yüzden "3:--" yerine dakika bazlı sade gösterim yaparız.
    @Environment(\.isLuminanceReduced) private var isLuminanceReduced

    var body: some View {
        VStack(spacing: 10) {
            HStack(spacing: 13) {
                GoldCrescentSeal(dimmed: isLuminanceReduced)

                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 4) {
                        Text(context.attributes.title.uppercased())
                            .font(.system(size: 12, weight: .heavy))
                            .tracking(1.6)
                            .foregroundColor(OfferTheme.paleGold)
                        Image(systemName: "sparkle")
                            .font(.system(size: 9))
                            .foregroundColor(OfferTheme.paleGold.opacity(0.9))
                    }
                    Text(context.attributes.message)
                        .font(.system(size: 13.5, weight: .semibold))
                        .foregroundColor(.white.opacity(0.95))
                        .lineLimit(1)
                }

                Spacer(minLength: 8)

                // Geri sayım — sistem kendi yürütür
                if isLuminanceReduced {
                    // Bekleme modu: saniye yok → "3 dk" (sistem dakikada bir günceller), parlamasız
                    Text(context.state.endDate, style: .relative)
                        .font(.system(size: 24, weight: .heavy, design: .rounded))
                        .monospacedDigit()
                        .foregroundColor(.white.opacity(0.9))
                        .multilineTextAlignment(.trailing)
                        .frame(width: 92)
                } else {
                    Text(timerInterval: OfferTheme.safeRange(to: context.state.endDate), countsDown: true)
                        .font(.system(size: 32, weight: .heavy, design: .rounded))
                        .monospacedDigit()
                        .foregroundColor(.white)
                        .shadow(color: OfferTheme.brightGold.opacity(0.55), radius: 5, x: 0, y: 0)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 92)
                }
            }

            // Yanan fitil — gerçek zamanlı eriyen altın çubuk (sistem animasyonu)
            ProgressView(timerInterval: OfferTheme.fuseRange(context.state), countsDown: true) {
                EmptyView()
            } currentValueLabel: {
                EmptyView()
            }
            .progressViewStyle(.linear)
            .tint(OfferTheme.brightGold)
            .scaleEffect(y: 1.6, anchor: .center)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
        .background(
            ZStack {
                // Canlı, aydınlık yeşil zemin
                LinearGradient(
                    colors: [OfferTheme.greenLight, OfferTheme.greenMid, OfferTheme.greenDeep],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                // Işık vurguları sadece tam parlaklıkta — bekleme modunda kapalı (AOD önerisi)
                if !isLuminanceReduced {
                    RadialGradient(
                        colors: [Color.white.opacity(0.10), .clear],
                        center: .topLeading,
                        startRadius: 0,
                        endRadius: 190
                    )
                    RadialGradient(
                        colors: [OfferTheme.brightGold.opacity(0.16), .clear],
                        center: .trailing,
                        startRadius: 0,
                        endRadius: 130
                    )
                }
            }
        )
        .widgetURL(OfferTheme.deepLink)
    }
}

// MARK: - Live Activity Widget

@available(iOSApplicationExtension 16.1, *)
struct OfferLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: OfferActivityAttributes.self) { context in
            // Kilit ekranı / bildirim bandı
            OfferLockScreenView(context: context)
                .activityBackgroundTint(OfferTheme.greenMid)
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                // ── Genişletilmiş (basılı tutunca) ──
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 7) {
                        GoldCrescentSeal(size: 30)
                        Text(context.attributes.title.uppercased())
                            .font(.system(size: 11, weight: .heavy))
                            .tracking(1.2)
                            .foregroundColor(OfferTheme.paleGold)
                    }
                    .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(timerInterval: OfferTheme.safeRange(to: context.state.endDate), countsDown: true)
                        .font(.system(size: 26, weight: .heavy, design: .rounded))
                        .monospacedDigit()
                        .foregroundColor(OfferTheme.brightGold)
                        .frame(width: 76)
                        .padding(.trailing, 4)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 7) {
                        Text(context.attributes.message)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white.opacity(0.9))
                            .lineLimit(1)
                        ProgressView(timerInterval: OfferTheme.fuseRange(context.state), countsDown: true) {
                            EmptyView()
                        } currentValueLabel: {
                            EmptyView()
                        }
                        .progressViewStyle(.linear)
                        .tint(OfferTheme.brightGold)
                    }
                    .padding(.horizontal, 4)
                }
            } compactLeading: {
                Image(systemName: "moon.stars.fill")
                    .font(.system(size: 13))
                    .foregroundColor(OfferTheme.brightGold)
            } compactTrailing: {
                Text(timerInterval: OfferTheme.safeRange(to: context.state.endDate), countsDown: true)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundColor(OfferTheme.brightGold)
                    .frame(width: 42)
            } minimal: {
                Image(systemName: "moon.stars.fill")
                    .font(.system(size: 12))
                    .foregroundColor(OfferTheme.brightGold)
            }
            .widgetURL(OfferTheme.deepLink)
            .keylineTint(OfferTheme.brightGold)
        }
    }
}
#endif
