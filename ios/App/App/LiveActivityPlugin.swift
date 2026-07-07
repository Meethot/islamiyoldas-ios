//
//  LiveActivityPlugin.swift
//  App
//
//  "Son Teklif" geri sayımı için Live Activity Capacitor köprüsü.
//  JS tarafı: src/services/liveActivityService.js
//  iOS 16.1 altında tüm çağrılar sessizce "desteklenmiyor" döner.
//

import Foundation
import Capacitor
#if canImport(ActivityKit)
import ActivityKit
#endif

@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveActivityPlugin"
    public let jsName = "LiveActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startOfferCountdown", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "endOfferCountdown", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise)
    ]

    @objc func isSupported(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.1, *) {
            call.resolve(["supported": ActivityAuthorizationInfo().areActivitiesEnabled])
            return
        }
        #endif
        call.resolve(["supported": false])
    }

    @objc func startOfferCountdown(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.1, *) {
            let endMs = call.getDouble("endTimestamp") ?? 0
            let nowMs = Date().timeIntervalSince1970 * 1000
            guard endMs > nowMs + 1000 else {
                call.resolve(["started": false, "reason": "endTimestamp geçmişte"])
                return
            }
            guard ActivityAuthorizationInfo().areActivitiesEnabled else {
                call.resolve(["started": false, "reason": "disabled"])
                return
            }

            let endDate = Date(timeIntervalSince1970: endMs / 1000)
            let title = call.getString("title") ?? "Son Teklif"
            let message = call.getString("message") ?? ""

            Task {
                // Önce varsa eski aktiviteyi kapat (tek aktif sayaç kuralı)
                await Self.endAllActivities()

                let attributes = OfferActivityAttributes(title: title, message: message)
                let state = OfferActivityAttributes.ContentState(startDate: Date(), endDate: endDate)
                do {
                    if #available(iOS 16.2, *) {
                        _ = try Activity.request(
                            attributes: attributes,
                            content: .init(state: state, staleDate: endDate)
                        )
                    } else {
                        _ = try Activity.request(attributes: attributes, contentState: state)
                    }
                    call.resolve(["started": true])
                } catch {
                    // Kullanıcı ayarlardan kapatmış olabilir vb. — uygulamayı etkilemesin
                    call.resolve(["started": false, "reason": error.localizedDescription])
                }
            }
            return
        }
        #endif
        call.resolve(["started": false, "reason": "unsupported"])
    }

    @objc func endOfferCountdown(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.1, *) {
            Task {
                await Self.endAllActivities()
                call.resolve(["ended": true])
            }
            return
        }
        #endif
        call.resolve(["ended": false])
    }

    #if canImport(ActivityKit)
    @available(iOS 16.1, *)
    private static func endAllActivities() async {
        for activity in Activity<OfferActivityAttributes>.activities {
            if #available(iOS 16.2, *) {
                await activity.end(nil, dismissalPolicy: .immediate)
            } else {
                await activity.end(using: nil, dismissalPolicy: .immediate)
            }
        }
    }
    #endif
}
