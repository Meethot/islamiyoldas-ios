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
        let presetIndex = defaults?.integer(forKey: DhikrEntry.presetIndexKey) ?? 0
        var count = defaults?.integer(forKey: DhikrEntry.countKey) ?? 0
        var total = defaults?.integer(forKey: DhikrEntry.totalKey) ?? 0
        
        let customName = defaults?.string(forKey: DhikrEntry.customNameKey)
        let customArabic = defaults?.string(forKey: DhikrEntry.customArabicKey)
        
        let preset: DhikrEntry.DhikrPreset
        if presetIndex == -1, let name = customName, !name.isEmpty {
            preset = DhikrEntry.DhikrPreset(id: "custom", name: name, arabic: customArabic ?? "", meaning: "", defaultTarget: 100)
        } else {
            let idx = max(0, min(presetIndex, DhikrEntry.allPresets.count - 1))
            preset = DhikrEntry.allPresets[idx]
        }
        
        let groupTarget = defaults?.integer(forKey: DhikrEntry.targetKey) ?? 0
        let activeTarget = groupTarget > 0 ? groupTarget : preset.defaultTarget
        
        // Increment
        count += 1
        total += 1
        
        // Write back
        DhikrEntry.writeToDefaults(count: count, presetIndex: presetIndex, total: total, target: activeTarget, customName: customName, customArabic: customArabic)
        defaults?.set(true, forKey: "widget_modified_dhikr")
        
        // Reload widget timeline
        WidgetCenter.shared.reloadAllTimelines()
        
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
        let defaults = UserDefaults(suiteName: "group.H5GZ9H5MX8.islamiyoldas")
        defaults?.set(true, forKey: "widget_modified_dhikr")
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}
