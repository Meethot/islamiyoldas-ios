import WidgetKit
import SwiftUI

/// Timeline entry for Verse of the Day widget
struct VerseEntry: TimelineEntry {
    let date: Date
    let verse: DailyVerse
    let dayNumber: Int       // 1-based day index within the cycle
    let totalVerses: Int     // total verse count (31)
    
    struct DailyVerse {
        let text: String
        let source: String
    }
    
    // MARK: - 31 Curated Verses (Turkish)
    
    static let allVerses: [DailyVerse] = [
        DailyVerse(text: "Rabbin seni terk etmedi ve sana darılmadı.", source: "Duhâ Suresi, 3"),
        DailyVerse(text: "Şüphesiz zorlukla beraber bir kolaylık vardır.", source: "İnşirâh Suresi, 5"),
        DailyVerse(text: "Yalnız sana ibadet eder, yalnız senden yardım dileriz.", source: "Fâtiha Suresi, 5"),
        DailyVerse(text: "Öyleyse beni anın ki ben de sizi anayım.", source: "Bakara Suresi, 152"),
        DailyVerse(text: "Ey iman edenler! Sabır ve namaz ile Allah'tan yardım isteyin. Şüphesiz Allah sabredenlerle beraberdir.", source: "Bakara Suresi, 153"),
        DailyVerse(text: "Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi ateş azabından koru.", source: "Bakara Suresi, 201"),
        DailyVerse(text: "Allah... O'ndan başka ilah yoktur. O, hayydır, kayyûmdur.", source: "Bakara Suresi, 255"),
        DailyVerse(text: "Allah hiçbir nefsi gücünün yettiğinden başkasıyla yükümlü tutmaz.", source: "Bakara Suresi, 286"),
        DailyVerse(text: "Rabbimiz! Bizi hidayete erdirdikten sonra kalplerimizi eğriltme. Bize katından bir rahmet bağışla.", source: "Âl-i İmrân Suresi, 8"),
        DailyVerse(text: "Onlar bollukta ve darlıkta Allah yolunda harcayanlar, öfkelerini yenenler ve insanları affedenlerdir.", source: "Âl-i İmrân Suresi, 134"),
        DailyVerse(text: "Onlar ayaktayken, otururken ve yanları üzerine yatarken Allah'ı anarlar...", source: "Âl-i İmrân Suresi, 191"),
        DailyVerse(text: "Şüphesiz namaz, müminlere belirli vakitlerde farz kılınmıştır.", source: "Nisâ Suresi, 103"),
        DailyVerse(text: "Bilesiniz ki kalpler ancak Allah'ı anmakla huzur bulur.", source: "Ra'd Suresi, 28"),
        DailyVerse(text: "Eğer şükrederseniz, elbette size nimetimi artırırım.", source: "İbrâhîm Suresi, 7"),
        DailyVerse(text: "Rabbimiz! Hesap görülecek günde, beni, ana babamı ve inananları bağışla.", source: "İbrâhîm Suresi, 41"),
        DailyVerse(text: "Rabbin, yalnız kendisine ibadet etmenizi ve ana babaya iyilik yapmanızı kesin olarak emretti.", source: "İsrâ Suresi, 23"),
        DailyVerse(text: "Rabbimiz! Bize katından bir rahmet ver ve şu işimizde bize doğruyu göster.", source: "Kehf Suresi, 10"),
        DailyVerse(text: "Rabbim! İlmimi artır.", source: "Tâ-Hâ Suresi, 114"),
        DailyVerse(text: "Biz seni ancak âlemlere rahmet olarak gönderdik.", source: "Enbiyâ Suresi, 107"),
        DailyVerse(text: "Bir şeyi dilediği zaman O'nun emri o şeye ancak 'Ol!' demektir, o da hemen oluverir.", source: "Yâsîn Suresi, 82"),
        DailyVerse(text: "Ey kendi aleyhlerine haddi aşan kullarım! Allah'ın rahmetinden ümit kesmeyin.", source: "Zümer Suresi, 53"),
        DailyVerse(text: "Rabbiniz şöyle buyurdu: Bana dua edin, duanıza cevap vereyim.", source: "Mü'min Suresi, 60"),
        DailyVerse(text: "Müminler ancak kardeştirler. Öyleyse kardeşlerinizin arasını düzeltin.", source: "Hucurât Suresi, 10"),
        DailyVerse(text: "İyiliğin karşılığı, yalnız iyilik değil midir?", source: "Rahmân Suresi, 60"),
        DailyVerse(text: "Sen elbette yüce bir ahlâk üzeresin.", source: "Kalem Suresi, 4"),
        DailyVerse(text: "Biz insanı en güzel biçimde yarattık.", source: "Tîn Suresi, 4"),
        DailyVerse(text: "Kadir gecesi, bin aydan daha hayırlıdır.", source: "Kadir Suresi, 3"),
        DailyVerse(text: "Zamana andolsun ki, insan ziyandadır. Ancak iman edip salih ameller işleyenler müstesna.", source: "Asr Suresi, 1-3"),
        DailyVerse(text: "Gevşemeyin, hüzünlenmeyin. Eğer iman etmiş kimseler iseniz üstün olan sizsiniz.", source: "Âl-i İmrân Suresi, 139"),
        DailyVerse(text: "Ve Biz insana şahdamarından daha yakınız.", source: "Kâf Suresi, 16"),
        DailyVerse(text: "Rabbinin rızası için sabret.", source: "Müddessir Suresi, 7"),
    ]
    
    // MARK: - Day-based Verse Selection (matches JS getDailyVerse logic)
    
    static func verseForDate(_ date: Date) -> (verse: DailyVerse, dayNumber: Int) {
        let calendar = Calendar.current
        let dayOfYear = calendar.ordinality(of: .day, in: .year, for: date) ?? 1
        let index = abs(dayOfYear) % allVerses.count
        return (allVerses[index], index + 1)
    }
    
    // MARK: - Placeholder
    
    static var placeholder: VerseEntry {
        let (verse, day) = verseForDate(Date())
        return VerseEntry(
            date: Date(),
            verse: verse,
            dayNumber: day,
            totalVerses: allVerses.count
        )
    }
}
