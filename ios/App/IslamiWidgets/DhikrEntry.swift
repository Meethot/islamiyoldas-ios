import WidgetKit
import SwiftUI

/// Timeline entry for Dhikr (Tasbih) counter widget
struct DhikrEntry: TimelineEntry {
    let date: Date
    let currentPresetIndex: Int
    let count: Int
    let target: Int
    let total: Int
    let customName: String?
    let customArabic: String?
    
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
        DhikrPreset(id: "salavat", name: "Salavat", arabic: "اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ", meaning: "Allah'ım, Efendimiz Muhammed'e rahmet et", defaultTarget: 100),
        DhikrPreset(id: "ihlas", name: "İhlas Suresi", arabic: "سُورَةُ الإِخْلَاصِ", meaning: "O tektir, Samed'dir, doğurmamış ve doğurulmamıştır.", defaultTarget: 100),
        DhikrPreset(id: "fatiha", name: "Fatiha Suresi", arabic: "سُورَةُ الْفَاتِحَةِ", meaning: "Hamd, âlemlerin Rabbi olan Allah'a mahsustur.", defaultTarget: 100),
        DhikrPreset(id: "ayetel_kursi", name: "Ayetel Kürsi", arabic: "آيَةُ الْكُرْسِيِّ", meaning: "Allah, O'ndan başka ilah yoktur. Diridir, Kayyum'dur.", defaultTarget: 100),
        DhikrPreset(id: "hasbunallah", name: "Hasbünallahü ve Ni'mel Vekîl", arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", meaning: "Allah bize yeter, O ne güzel vekildir.", defaultTarget: 100),
        DhikrPreset(id: "lahavle", name: "Lâ Havle ve Lâ Kuvvete illâ Billâh", arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", meaning: "Güç ve kuvvet ancak Allah'a mahsustur.", defaultTarget: 100),
        DhikrPreset(id: "yunus_duasi", name: "Dua-i Yunus", arabic: "لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ", meaning: "Senden başka ilah yoktur, seni tenzih ederim.", defaultTarget: 100),
        DhikrPreset(id: "salati_tefriciye", name: "Salat-ı Tefriciye", arabic: "الصَّلَاةُ التَّفْرِيجِيَّةُ", meaning: "Tüm sıkıntıların giderilmesi, dileklerin kabulü için.", defaultTarget: 4444),
    ]
    
    // MARK: - App Group Keys
    
    private static let suiteName = "group.H5GZ9H5MX8.islamiyoldas"
    static let countKey = "dhikr_widget_count"
    static let presetIndexKey = "dhikr_widget_preset_index"
    static let totalKey = "dhikr_widget_total"
    static let targetKey = "dhikr_widget_target"
    static let customNameKey = "dhikr_widget_custom_name"
    static let customArabicKey = "dhikr_widget_custom_arabic"
    
    /// Current preset based on index
    var currentPreset: DhikrPreset {
        if currentPresetIndex == -1, let name = customName, !name.isEmpty {
            return DhikrPreset(
                id: "custom",
                name: name,
                arabic: customArabic ?? "",
                meaning: "",
                defaultTarget: 100
            )
        }
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
        
        let presetIndex = defaults.object(forKey: presetIndexKey) != nil ? defaults.integer(forKey: presetIndexKey) : 0
        let count = defaults.integer(forKey: countKey)
        
        let customName = defaults.string(forKey: customNameKey)
        let customArabic = defaults.string(forKey: customArabicKey)
        
        let preset: DhikrPreset
        if presetIndex == -1, let name = customName, !name.isEmpty {
            preset = DhikrPreset(
                id: "custom",
                name: name,
                arabic: customArabic ?? "",
                meaning: "",
                defaultTarget: 100
            )
        } else {
            let idx = max(0, min(presetIndex, allPresets.count - 1))
            preset = allPresets[idx]
        }
        
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
            total: total,
            customName: customName,
            customArabic: customArabic
        )
    }
    
    // MARK: - Write to App Group
    
    static func writeToDefaults(count: Int, presetIndex: Int, total: Int? = nil, target: Int? = nil, customName: String? = nil, customArabic: String? = nil) {
        guard let defaults = UserDefaults(suiteName: suiteName) else { return }
        defaults.set(count, forKey: countKey)
        defaults.set(presetIndex, forKey: presetIndexKey)
        if let total = total {
            defaults.set(total, forKey: totalKey)
        }
        if let target = target {
            defaults.set(target, forKey: targetKey)
        }
        if presetIndex == -1 {
            if let customName = customName {
                defaults.set(customName, forKey: customNameKey)
            }
            if let customArabic = customArabic {
                defaults.set(customArabic, forKey: customArabicKey)
            }
        } else {
            defaults.removeObject(forKey: customNameKey)
            defaults.removeObject(forKey: customArabicKey)
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
            total: 0,
            customName: nil,
            customArabic: nil
        )
    }
}
