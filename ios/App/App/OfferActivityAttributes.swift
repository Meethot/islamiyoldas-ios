//
//  OfferActivityAttributes.swift
//  App
//
//  "Son Teklif" Live Activity veri modeli.
//  Hem App target'ına hem IslamiWidgetsExtension target'ına dahildir (paylaşımlı).
//

import Foundation
#if canImport(ActivityKit)
import ActivityKit

@available(iOS 16.1, *)
public struct OfferActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        /// Teklifin başladığı an — fitil (ProgressView) oranı için gerekli.
        public var startDate: Date
        /// Geri sayımın biteceği an. SwiftUI Text(timerInterval:) bunu
        /// kullanarak sayacı sistem tarafında kendisi yürütür — push gerekmez.
        public var endDate: Date

        public init(startDate: Date = Date(), endDate: Date) {
            self.startDate = startDate
            self.endDate = endDate
        }
    }

    /// Başlık — JS tarafından i18n ile gelir (örn. "Son Teklif")
    public var title: String
    /// Alt metin — JS tarafından i18n ile gelir (örn. "Bekleyen Teklifiniz Var")
    public var message: String

    public init(title: String, message: String) {
        self.title = title
        self.message = message
    }
}
#endif
