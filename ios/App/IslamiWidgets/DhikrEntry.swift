import WidgetKit
import SwiftUI

/// Timeline entry for Dhikr (Tasbih) counter widget
struct DhikrEntry: TimelineEntry {
    let date: Date
    let currentPresetIndex: Int
    let count: Int
    let target: Int
    let total: Int
    
    /// A single dhikr preset
    struct DhikrPreset {
        let id: String
        let name: String
        let arabic: String
        let meaning: String
        let defaultTarget: Int
    }
    
    // MARK: - 6 Dhikr Presets (matches web app)
    
    static let allPresets: [DhikrPreset] = [
        DhikrPreset(id: "subhanallah", name: "Sübhanallah", arabic: "سُبْحَانَ اللَّهِ", meaning: "Allah noksan sıfatlardan uzaktır", defaultTarget: 33),
        DhikrPreset(id: "elhamdulillah", name: "Elhamdülillah", arabic: "الْحَمْدُ لِلَّهِ", meaning: "Hamd Allah'adır", defaultTarget: 33),
        DhikrPreset(id: "allahuekber", name: "Allahü Ekber", arabic: "اللَّهُ أَكْبَرُ", meaning: "Allah en büyüktür", defaultTarget: 33),
        DhikrPreset(id: "last", name: "Lâ ilâhe illallah", arabic: "لَا إِلٰهَ إِلَّا اللّٰه", meaning: "Allah'tan başka ilah yoktur", defaultTarget: 100),
        DhikrPreset(id: "istigfar", name: "Estağfirullah", arabic: "أَسْتَغْفِرُ اللَّهَ", meaning: "Allah'tan bağışlanma dilerim", defaultTarget: 100),
        DhikrPreset(id: "salavat", name: "Salavat", arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ", meaning: "Allah'ım, Muhammed'e rahmet et", defaultTarget: 100),
    ]
    
    // MARK: - App Group Keys
    
    private static let suiteName = "group.H5GZ9H5MX8.islamiyoldas"
    static let countKey = "dhikr_widget_count"
    static let presetIndexKey = "dhikr_widget_preset_index"
    static let totalKey = "dhikr_widget_total"
    static let targetKey = "dhikr_widget_target"
    
    /// Current preset based on index
    var currentPreset: DhikrPreset {
        let idx = max(0, min(currentPresetIndex, DhikrEntry.allPresets.count - 1))
        return DhikrEntry.allPresets[idx]
    }
    
    /// Progress percentage (0.0 - 1.0)
    var progress: Double {
        guard target > 0 else { return 0 }
        return min(Double(count) / Double(target), 1.0)
    }
    
    // MARK: - Read from App Group
    
    static func readFromDefaults() -> DhikrEntry {
        guard let defaults = UserDefaults(suiteName: suiteName) else {
            return .placeholder
        }
        
        let presetIndex = defaults.integer(forKey: presetIndexKey) // defaults to 0
        let count = defaults.integer(forKey: countKey)
        let preset = allPresets[max(0, min(presetIndex, allPresets.count - 1))]
        
        var target = defaults.object(forKey: targetKey) != nil ? defaults.integer(forKey: targetKey) : preset.defaultTarget
        if target <= 0 {
            target = preset.defaultTarget
        }
        
        let total = defaults.integer(forKey: totalKey)
        
        return DhikrEntry(
            date: Date(),
            currentPresetIndex: presetIndex,
            count: count,
            target: target,
            total: total
        )
    }
    
    // MARK: - Write to App Group
    
    static func writeToDefaults(count: Int, presetIndex: Int, total: Int? = nil, target: Int? = nil) {
        guard let defaults = UserDefaults(suiteName: suiteName) else { return }
        defaults.set(count, forKey: countKey)
        defaults.set(presetIndex, forKey: presetIndexKey)
        if let total = total {
            defaults.set(total, forKey: totalKey)
        }
        if let target = target {
            defaults.set(target, forKey: targetKey)
        }
        defaults.synchronize()
    }
    
    static func readTotal() -> Int {
        guard let defaults = UserDefaults(suiteName: suiteName) else { return 0 }
        return defaults.integer(forKey: totalKey)
    }
    
    // MARK: - Placeholder
    
    static var placeholder: DhikrEntry {
        DhikrEntry(
            date: Date(),
            currentPresetIndex: 0,
            count: 0,
            target: 33,
            total: 0
        )
    }
}
