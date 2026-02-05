import WidgetKit
import SwiftUI

@main
struct IslamiYoldasWidgetsBundle: WidgetBundle {
    var body: some Widget {
        // Eski silinenleri değil, yeni oluşturduklarımızı listeliyoruz:
        VakitWidget()
        IlhamWidget()
    }
}
