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
        DhikrPreset(id: "kelime_i_tevhid", name: "Kelime-i Tevhid", arabic: "لَا إِلٰهَ إِلَّا اللَّهُ مُحَمَّدٌ رَسُولُ اللَّهِ", meaning: "Allah'tan başka ilah yoktur, Muhammed O'nun elçisidir.", defaultTarget: 100),
        DhikrPreset(id: "kelime_i_sehadet", name: "Kelime-i Şehadet", arabic: "أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ", meaning: "Şahitlik ederim ki Allah'tan başka ilah yoktur ve Muhammed O'nun kulu ve elçisidir.", defaultTarget: 33),
        DhikrPreset(id: "besmele", name: "Besmele", arabic: "بِسْمِ اللَّهِ الرَّحْمٰنِ الرَّحِيمِ", meaning: "Rahman ve Rahim olan Allah'ın adıyla.", defaultTarget: 100),
        DhikrPreset(id: "subhanallahi_ve_bihamdihi", name: "Sübhanallahi ve Bihamdihî", arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", meaning: "Allah'ı hamd ile tesbih ederim.", defaultTarget: 100),
        DhikrPreset(id: "subhanallahi_velazim", name: "Sübhanallahi ve Bihamdihî Sübhanallahil-Azîm", arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ", meaning: "Dile hafif, mizanda ağır iki cümle.", defaultTarget: 100),
        DhikrPreset(id: "bakiyat_salihat", name: "Sübhanallahi velhamdülillahi ve lâ ilâhe illallahü vallahü ekber", arabic: "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلٰهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ", meaning: "En kalıcı güzel ameller: tesbih, hamd, tevhid ve tekbir.", defaultTarget: 100),
        DhikrPreset(id: "tevhid_zikri", name: "Lâ ilâhe illallahü vahdehû lâ şerîke leh", arabic: "لَا إِلٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", meaning: "Allah birdir, ortağı yoktur; mülk O'nun, hamd O'nadır; O her şeye kadirdir.", defaultTarget: 100),
        DhikrPreset(id: "seyyidul_istigfar", name: "Seyyidü'l-İstiğfar", arabic: "سَيِّدُ الِاسْتِغْفَارِ", meaning: "İstiğfar dualarının en üstünü — sabah akşam okunur.", defaultTarget: 1),
        DhikrPreset(id: "hasbiyallah", name: "Hasbiyallahü lâ ilâhe illâ Hû", arabic: "حَسْبِيَ اللَّهُ لَا إِلٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", meaning: "Allah bana yeter; O'ndan başka ilah yoktur, O'na tevekkül ettim.", defaultTarget: 7),
        DhikrPreset(id: "allahumme_ecirni", name: "Allahümme Ecirnî Minen-Nâr", arabic: "اَللَّهُمَّ أَجِرْنِي مِنَ النَّارِ", meaning: "Allah'ım, beni cehennem ateşinden koru.", defaultTarget: 7),
        DhikrPreset(id: "rabbena_atina", name: "Rabbenâ Âtinâ", arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", meaning: "Rabbimiz! Bize dünyada ve ahirette iyilik ver, bizi ateş azabından koru.", defaultTarget: 10),
        DhikrPreset(id: "salaten_tuncina", name: "Salât-ı Münciye (Tüncînâ)", arabic: "الصَّلَاةُ الْمُنْجِيَةُ", meaning: "Tüm tehlike ve sıkıntılardan kurtuluş için okunan salavat.", defaultTarget: 100),
        DhikrPreset(id: "felak", name: "Felak Suresi", arabic: "سُورَةُ الْفَلَقِ", meaning: "Yarattıklarının şerrinden sabahın Rabbine sığınırım.", defaultTarget: 100),
        DhikrPreset(id: "nas", name: "Nas Suresi", arabic: "سُورَةُ النَّاسِ", meaning: "İnsanların Rabbine, Melikine ve İlahına sığınırım.", defaultTarget: 100),
        DhikrPreset(id: "subhane_rabbiyel_azim", name: "Sübhâne Rabbiyel-Azîm", arabic: "سُبْحَانَ رَبِّيَ الْعَظِيمِ", meaning: "Yüce Rabbimi tenzih ederim — rükû tesbihi.", defaultTarget: 33),
        DhikrPreset(id: "subhane_rabbiyel_ala", name: "Sübhâne Rabbiyel-A'lâ", arabic: "سُبْحَانَ رَبِّيَ الْأَعْلَى", meaning: "En yüce Rabbimi tenzih ederim — secde tesbihi.", defaultTarget: 33),
        DhikrPreset(id: "subbuhun_kuddusun", name: "Sübbûhun Kuddûsün", arabic: "سُبُّوحٌ قُدُّوسٌ رَبُّ الْمَلَائِكَةِ وَالرُّوحِ", meaning: "Meleklerin ve Rûh'un Rabbi; her noksandan münezzeh, mukaddestir.", defaultTarget: 33),
        DhikrPreset(id: "rabbi_zidni_ilma", name: "Rabbi Zidnî İlmâ", arabic: "رَبِّ زِدْنِي عِلْمًا", meaning: "Rabbim, ilmimi artır. (Tâhâ 114)", defaultTarget: 33),
        DhikrPreset(id: "rabbisrah_li_sadri", name: "Rabbi'şrah lî Sadrî", arabic: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي", meaning: "Rabbim! Göğsümü genişlet, işimi kolaylaştır. (Tâhâ 25-26)", defaultTarget: 33),
        DhikrPreset(id: "rabbena_la_tuzig", name: "Rabbenâ lâ Tüziğ Kulûbenâ", arabic: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً", meaning: "Rabbimiz! Bizi doğru yola ilettikten sonra kalplerimizi kaydırma. (Âl-i İmrân 8)", defaultTarget: 10),
        DhikrPreset(id: "ya_hayyu_ya_kayyum", name: "Yâ Hayyu Yâ Kayyûm", arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ", meaning: "Ey Hayy ve Kayyûm! Rahmetinle yardım diliyorum.", defaultTarget: 100),
        DhikrPreset(id: "ya_erhamer_rahimin", name: "Yâ Erhamer-Râhimîn", arabic: "يَا أَرْحَمَ الرَّاحِمِينَ", meaning: "Ey merhametlilerin en merhametlisi!", defaultTarget: 100),
        DhikrPreset(id: "melikul_hakkul_mubin", name: "Lâ ilâhe illallahü'l-Melikü'l-Hakku'l-Mübîn", arabic: "لَا إِلٰهَ إِلَّا اللَّهُ الْمَلِكُ الْحَقُّ الْمُبِينُ", meaning: "Apaçık hak ve mülkün sahibi olan Allah'tan başka ilah yoktur.", defaultTarget: 100),
        DhikrPreset(id: "estagfirullah_elazim", name: "Estağfirullahe'l-Azîm ve Etûbü İleyh", arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلٰهَ إِلَّا هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ", meaning: "Hayy ve Kayyûm olan yüce Allah'tan bağışlanma diler, O'na tövbe ederim.", defaultTarget: 100),
        DhikrPreset(id: "afv_afiyet", name: "Allahümme innî es'elüke'l-Afve ve'l-Âfiye", arabic: "اَللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ", meaning: "Allah'ım! Senden af ve âfiyet dilerim.", defaultTarget: 100),
        DhikrPreset(id: "bismillahillezi", name: "Bismillâhillezî lâ Yedurru", arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", meaning: "O'nun adıyla; yerde ve gökte hiçbir şey zarar veremez. (sabah-akşam 3 kez)", defaultTarget: 3),
        DhikrPreset(id: "euzu_bikelimatillah", name: "Eûzü bi-Kelimâtillâh", arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", meaning: "Yarattıklarının şerrinden Allah'ın eksiksiz kelimelerine sığınırım.", defaultTarget: 3),
        DhikrPreset(id: "radiytu_billahi", name: "Radîtü Billâhi Rabbâ", arabic: "رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ نَبِيًّا", meaning: "Rab olarak Allah'tan, din olarak İslam'dan, peygamber olarak Muhammed'den razıyım.", defaultTarget: 3),
        DhikrPreset(id: "adede_halkihi", name: "Sübhânallâhi ve Bihamdihî Adede Halkıhî", arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ وَرِضَا نَفْسِهِ وَزِنَةَ عَرْشِهِ وَمِدَادَ كَلِمَاتِهِ", meaning: "Yarattıkları sayısınca, zâtının rızasınca, arşının ağırlığınca Allah'ı tesbih ederim.", defaultTarget: 3),
        DhikrPreset(id: "salat_i_fetih", name: "Salât-ı Fetih", arabic: "صَلَاةُ الْفَاتِحِ", meaning: "Maddî ve manevî fetihler, işlerin açılması için okunan salavat.", defaultTarget: 100),
        DhikrPreset(id: "allahumme_entes_selam", name: "Allahümme Ente's-Selâm", arabic: "اَللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ", meaning: "Allah'ım! Sen Selâm'sın, selâmet Sendendir — namaz sonrası zikri.", defaultTarget: 1),
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
