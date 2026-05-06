import AppIntents
import WidgetKit
import SwiftUI

// MARK: - Increment Dhikr Intent (iOS 17+)

@available(iOS 17.0, *)
struct IncrementDhikrIntent: AppIntent {
    static var title: LocalizedStringResource = "Zikir Çek"
    static var description = IntentDescription("Zikir sayacını bir artırır")
    
    init() {}
    
    func perform() async throws -> some IntentResult {
        let defaults = UserDefaults(suiteName: "group.H5GZ9H5MX8.islamiyoldas")
        
        // Read current state
        var presetIndex = defaults?.integer(forKey: DhikrEntry.presetIndexKey) ?? 0
        var count = defaults?.integer(forKey: DhikrEntry.countKey) ?? 0
        var total = defaults?.integer(forKey: DhikrEntry.totalKey) ?? 0
        
        let preset = DhikrEntry.allPresets[max(0, min(presetIndex, DhikrEntry.allPresets.count - 1))]
        
        // Increment
        count += 1
        total += 1
        
        // Check if target reached — auto-advance to next preset (namaz tesbih sırası)
        if count >= preset.defaultTarget {
            count = 0
            // Cycle through first 3 presets (Sübhanallah → Elhamdülillah → Allahü Ekber → loop)
            if presetIndex < 2 {
                presetIndex += 1
            } else {
                presetIndex = 0
            }
        }
        
        // Write back
        DhikrEntry.writeToDefaults(count: count, presetIndex: presetIndex, total: total)
        
        // Reload widget timeline
        WidgetCenter.shared.reloadTimelines(ofKind: "DhikrWidget")
        
        return .result()
    }
}

// MARK: - Reset Dhikr Intent (iOS 17+)

@available(iOS 17.0, *)
struct ResetDhikrIntent: AppIntent {
    static var title: LocalizedStringResource = "Zikir Sıfırla"
    static var description = IntentDescription("Zikir sayacını sıfırlar")
    
    init() {}
    
    func perform() async throws -> some IntentResult {
        DhikrEntry.writeToDefaults(count: 0, presetIndex: 0)
        WidgetCenter.shared.reloadTimelines(ofKind: "DhikrWidget")
        return .result()
    }
}
