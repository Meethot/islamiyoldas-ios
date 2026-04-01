import WidgetKit
import SwiftUI

struct MotivationEntry: TimelineEntry {
    let date: Date
    let motivation: DailyMotivation

    struct DailyMotivation {
        let text: String
        let source: String
    }

    static let allMotivations: [DailyMotivation] = [
        DailyMotivation(text: "Şüphesiz zorlukla beraber bir kolaylık vardır. Gerçekten, zorlukla beraber bir kolaylık daha vardır.", source: "İnşirâh Suresi, 5-6"),
        DailyMotivation(text: "Allah hiçbir nefsi, gücünün yetmeyeceği bir yükle yükümlü tutmaz.", source: "Bakara Suresi, 286"),
        DailyMotivation(text: "Rabbin seni asla terk etmedi ve sana darılmadı.", source: "Duhâ Suresi, 3"),
        DailyMotivation(text: "Gevşemeyin, hüzünlenmeyin. Eğer gerçekten inanıyorsanız, üstün olan sizsiniz.", source: "Âl-i İmrân Suresi, 139"),
        DailyMotivation(text: "Kim Allah’a tevekkül ederse, O kendisine yeter.", source: "Talâk Suresi, 3"),
        DailyMotivation(text: "Üzülme, çünkü Allah bizimle beraberdir.", source: "Tevbe Suresi, 40"),
        DailyMotivation(text: "Ey iman edenler! Sabır ve namaz ile Allah’tan yardım isteyin. Şüphesiz Allah, sabredenlerle beraberdir.", source: "Bakara Suresi, 153"),
        DailyMotivation(text: "Ey kendi nefisleri aleyhine haddi aşan kullarım! Allah’ın rahmetinden asla ümit kesmeyin.", source: "Zümer Suresi, 53"),
        DailyMotivation(text: "Rabbiniz şöyle buyurdu: Bana dua edin, duanıza cevap vereyim.", source: "Mü'min Suresi, 60"),
        DailyMotivation(text: "Şüphesiz Rabbin sana verecek ve sen hoşnut olacaksın.", source: "Duhâ Suresi, 5"),
        DailyMotivation(text: "Olur ki, bir şey sizin için hayırlı iken ondan hoşlanmazsınız. Yine olur ki, bir şey sizin için kötü iken onu seversiniz. Allah bilir, siz bilemezsiniz.", source: "Bakara Suresi, 216"),
        DailyMotivation(text: "Onlar tuzak kuruyorlardı; Allah da onların tuzaklarını bozuyordu. Allah, tuzak kuranların en hayırlısıdır.", source: "Enfâl Suresi, 30"),
        DailyMotivation(text: "Bilesiniz ki, kalpler ancak Allah’ı anmakla huzur bulur.", source: "Ra'd Suresi, 28"),
        DailyMotivation(text: "Yaratan hiç bilmez mi? O, her şeyi ince ince bilir ve her şeyden haberdardır.", source: "Mülk Suresi, 14"),
        DailyMotivation(text: "Allah'ın rahmetinden ümidinizi kesmeyin. Çünkü kâfirler topluluğundan başkası Allah'ın rahmetinden ümit kesmez.", source: "Yûsuf Suresi, 87"),
        DailyMotivation(text: "Rabbinin rahmetinden, sapıklardan başka kim ümit keser?", source: "Hicr Suresi, 56"),
        DailyMotivation(text: "Şüphesiz rızkı veren, mutlak kudret sahibi olan ancak Allah'tır.", source: "Zâriyât Suresi, 58"),
        DailyMotivation(text: "Bilsin ki insan için kendi çalışmasından başka bir şey yoktur.", source: "Necm Suresi, 39"),
        DailyMotivation(text: "O halde onlara güzel bir hoşgörü ile muamele et.", source: "Hicr Suresi, 85"),
        DailyMotivation(text: "Kim Allah'a karşı gelmekten sakınırsa, Allah ona bir çıkış yolu açar.", source: "Talâk Suresi, 2"),
        DailyMotivation(text: "Andolsun, insanı biz yarattık ve nefsinin kendisine fısıldadıklarını biliriz. Ve biz ona şah damarından daha yakınız.", source: "Kaf Suresi, 16"),
        DailyMotivation(text: "Sabret; senin sabrın da ancak Allah'ın yardımıyladır. Onlardan dolayı üzülme.", source: "Nahl Suresi, 127"),
        DailyMotivation(text: "Korkmayın, çünkü ben sizinle beraberim; işitiyorum ve görüyorum.", source: "Tâ Hâ Suresi, 46"),
        DailyMotivation(text: "Sen şimdi sabret. Şüphesiz Allah'ın vaadi gerçektir.", source: "Rum Suresi, 60"),
        DailyMotivation(text: "Kullarım sana beni sorduklarında bilsinler ki, ben muhakkak onlara pek yakınım.", source: "Bakara Suresi, 186"),
        DailyMotivation(text: "Rabbimiz Allah'tır deyip sonra dosdoğru gidenlere melekler iner: Korkmayın, üzülmeyin ve vaat olunduğunuz cennetle sevinin, derler.", source: "Fussilet Suresi, 30"),
        DailyMotivation(text: "Eğer Allah sana bir hayır dilerse, O'nun lütfunu geri çevirecek yoktur.", source: "Yûnus Suresi, 107"),
        DailyMotivation(text: "Ey iman edenler! Sabredin, sabır yarışında düşmanlarınızı geçin.", source: "Âl-i İmrân Suresi, 200"),
        DailyMotivation(text: "İşte onlar, sabretmelerine karşılık cennetin en yüksek makamlarıyla ödüllendirileceklerdir.", source: "Furkân Suresi, 75"),
        DailyMotivation(text: "Sizin yanınızdaki tükenir, Allah katında olan ise kalıcıdır. Elbette sabredenlere mükafatlarını vereceğiz.", source: "Nahl Suresi, 96"),
        DailyMotivation(text: "Bana Allah yeter. O'ndan başka hiçbir ilah yoktur. Ben O'na tevekkül ettim.", source: "Tevbe Suresi, 129")
    ]

    static func motivationForDate(_ date: Date) -> DailyMotivation {
        let calendar = Calendar.current
        let dayOfYear = calendar.ordinality(of: .day, in: .year, for: date) ?? 1
        let index = abs(dayOfYear - 1) % allMotivations.count
        return allMotivations[index]
    }

    static var placeholder: MotivationEntry {
        MotivationEntry(
            date: Date(),
            motivation: motivationForDate(Date())
        )
    }
}
