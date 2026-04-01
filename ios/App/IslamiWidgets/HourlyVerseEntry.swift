import WidgetKit
import SwiftUI

/// Timeline entry for Hourly Verse widget
struct HourlyVerseEntry: TimelineEntry {
    let date: Date
    let verse: HourlyVerse

    struct HourlyVerse {
        let text: String
        let source: String
    }

    static let allVerses: [HourlyVerse] = [
        HourlyVerse(text: "Rabbin seni terk etmedi ve sana darılmadı.", source: "Duhâ Suresi, 3"),
        HourlyVerse(text: "Şüphesiz zorlukla beraber bir kolaylık vardır.", source: "İnşirâh Suresi, 5"),
        HourlyVerse(text: "Öyleyse beni anın ki ben de sizi anayım.", source: "Bakara Suresi, 152"),
        HourlyVerse(text: "Ey iman edenler! Sabır ve namaz ile Allah'tan yardım isteyin. Şüphesiz Allah sabredenlerle beraberdir.", source: "Bakara Suresi, 153"),
        HourlyVerse(text: "Kullarım beni sana soracak olursa, muhakkak ki ben (onlara) pek yakınım.", source: "Bakara Suresi, 186"),
        HourlyVerse(text: "Allah hiçbir nefsi gücünün yettiğinden başkasıyla yükümlü tutmaz.", source: "Bakara Suresi, 286"),
        HourlyVerse(text: "Rabbimiz! Bizi hidayete erdirdikten sonra kalplerimizi eğriltme.", source: "Âl-i İmrân Suresi, 8"),
        HourlyVerse(text: "Gevşemeyin, hüzünlenmeyin. Eğer iman etmiş kimseler iseniz üstün olan sizsiniz.", source: "Âl-i İmrân Suresi, 139"),
        HourlyVerse(text: "Hayır! Sizin mevlânız Allah'tır. O, yardımcıların en hayırlısıdır.", source: "Âl-i İmrân Suresi, 150"),
        HourlyVerse(text: "Allah size yardım ederse, artık size üstün gelecek hiç kimse yoktur.", source: "Âl-i İmrân Suresi, 160"),
        HourlyVerse(text: "Onlar, inananlar ve kalpleri Allah'ı anmakla huzura kavuşanlardır.", source: "Ra'd Suresi, 28"),
        HourlyVerse(text: "Bilesiniz ki kalpler ancak Allah'ı anmakla huzur bulur.", source: "Ra'd Suresi, 28"),
        HourlyVerse(text: "Eğer şükrederseniz, elbette size nimetimi artırırım.", source: "İbrâhîm Suresi, 7"),
        HourlyVerse(text: "Rabbin, yalnız kendisine ibadet etmenizi ve ana babaya iyilik yapmanızı kesin olarak emretti.", source: "İsrâ Suresi, 23"),
        HourlyVerse(text: "Rabbim! Küçüklüğümde onlar beni nasıl yetiştirmişlerse, şimdi sen de onlara öyle rahmet et!", source: "İsrâ Suresi, 24"),
        HourlyVerse(text: "De ki: Hak geldi, batıl yok oldu. Şüphesiz batıl, yok olmaya mahkûmdur.", source: "İsrâ Suresi, 81"),
        HourlyVerse(text: "Rabbimiz! Bize katından bir rahmet ver ve şu işimizde bize doğruyu göster.", source: "Kehf Suresi, 10"),
        HourlyVerse(text: "Korkmayın, çünkü ben sizinle beraberim; işitiyorum ve görüyorum.", source: "Tâ-Hâ Suresi, 46"),
        HourlyVerse(text: "Rabbim! İlmimi artır.", source: "Tâ-Hâ Suresi, 114"),
        HourlyVerse(text: "Biz seni ancak âlemlere rahmet olarak gönderdik.", source: "Enbiyâ Suresi, 107"),
        HourlyVerse(text: "Senden başka hiçbir ilâh yoktur. Seni eksikliklerden uzak tutarım. Ben gerçekten (nefsine) zulmedenlerden oldum.", source: "Enbiyâ Suresi, 87"),
        HourlyVerse(text: "Rabbiniz şöyle buyurdu: Bana dua edin, duanıza cevap vereyim.", source: "Mü'min Suresi, 60"),
        HourlyVerse(text: "Ey kendi aleyhlerine haddi aşan kullarım! Allah'ın rahmetinden ümit kesmeyin.", source: "Zümer Suresi, 53"),
        HourlyVerse(text: "Şüphesiz Allah, bütün günahları affeder.", source: "Zümer Suresi, 53"),
        HourlyVerse(text: "Müminler ancak kardeştirler. Öyleyse kardeşlerinizin arasını düzeltin.", source: "Hucurât Suresi, 10"),
        HourlyVerse(text: "Ey iman edenler! Zannın çoğundan sakının; çünkü zannın bir kısmı günahtır.", source: "Hucurât Suresi, 12"),
        HourlyVerse(text: "O, Karada ve denizde olanı bilir. O'nun ilmi dışında bir yaprak bile düşmez.", source: "En'âm Suresi, 59"),
        HourlyVerse(text: "Allah sizin suretlerinize ve mallarınıza değil, kalplerinize ve amellerinize bakar.", source: "Hadis-i Şerif (Müslim)"),
        HourlyVerse(text: "Nerede olursanız olun, O sizinle beraberdir.", source: "Hadîd Suresi, 4"),
        HourlyVerse(text: "İyiliğin karşılığı, yalnız iyilik değil midir?", source: "Rahmân Suresi, 60"),
        HourlyVerse(text: "Biz insanı en güzel biçimde yarattık.", source: "Tîn Suresi, 4"),
        HourlyVerse(text: "Şüphesiz Rabbin sana verecek ve sen hoşnut olacaksın.", source: "Duhâ Suresi, 5"),
        HourlyVerse(text: "Yetimi sakın ezme. El açıp isteyeni de sakın azarlama.", source: "Duhâ Suresi, 9-10"),
        HourlyVerse(text: "Ve Rabbinin nimetini minnet ve şükranla an.", source: "Duhâ Suresi, 11"),
        HourlyVerse(text: "Zamana andolsun ki, insan ziyandadır. Ancak iman edip salih ameller işleyenler müstesna.", source: "Asr Suresi, 1-3"),
        HourlyVerse(text: "Ve Biz insana şahdamarından daha yakınız.", source: "Kâf Suresi, 16"),
        HourlyVerse(text: "Rabbinin rızası için sabret.", source: "Müddessir Suresi, 7"),
        HourlyVerse(text: "Göklerde ve yerde olanların hepsi O'nundur. Bütün işler ancak O'na döndürülür.", source: "Âl-i İmrân Suresi, 109"),
        HourlyVerse(text: "İman edip salih ameller işleyenlere gelince, onlar için kesintisiz bir mükafat vardır.", source: "Tîn Suresi, 6"),
        HourlyVerse(text: "O, yarattığı her şeyi en güzel yapan ve insanı yaratmaya çamurdan başlayandır.", source: "Secde Suresi, 7"),
        HourlyVerse(text: "Onlar bollukta ve darlıkta Allah yolunda harcayanlar, öfkelerini yenenler ve insanları affedenlerdir.", source: "Âl-i İmrân Suresi, 134"),
        HourlyVerse(text: "Şüphesiz Allah, iyilik yapanları sever.", source: "Âl-i İmrân Suresi, 134"),
        HourlyVerse(text: "Eğer Allah sana bir sıkıntı dokundurursa, onu O'ndan başka giderecek yoktur.", source: "Yûnus Suresi, 107"),
        HourlyVerse(text: "O, sizin için kulakları, gözleri ve kalpleri yaratandır. Ne kadar da az şükrediyorsunuz!", source: "Mü'minûn Suresi, 78"),
        HourlyVerse(text: "De ki: Ey insanlar! Şüphesiz size Rabbinizden hak gelmiştir.", source: "Yûnus Suresi, 108"),
        HourlyVerse(text: "Allah, samimi olarak kendi rızasını gözeterek yapılan amellerden başkasını kabul etmez.", source: "Nesâî"),
        HourlyVerse(text: "Allah, göklerin ve yerin nurudur.", source: "Nûr Suresi, 35"),
        HourlyVerse(text: "Görmedin mi Allah nasıl bir misal getirdi: Güzel bir söz, kökü sağlam, dalları göğe yükselen güzel bir ağaç gibidir.", source: "İbrâhîm Suresi, 24"),
        HourlyVerse(text: "Bilesiniz ki, Allah'ın dostlarına hiçbir korku yoktur. Onlar üzülmeyeceklerdir de.", source: "Yûnus Suresi, 62"),
        HourlyVerse(text: "Rabbinizin mağfiretine ve genişliği gökler ve yer kadar olan cennete koşun.", source: "Âl-i İmrân Suresi, 133"),
        HourlyVerse(text: "O, kullarının tövbesini kabul eden, kötülükleri bağışlayan ve yaptıklarınızı bilendir.", source: "Şûrâ Suresi, 25"),
        HourlyVerse(text: "Onlar, yalan şahitlikte bulunmayan, boş ve yararsız sözle karşılaştıkları zaman onurlu olarak geçenlerdir.", source: "Furkân Suresi, 72"),
        HourlyVerse(text: "Şüphesiz Allah, adaleti, iyilik yapmayı, yakınlara yardım etmeyi emreder.", source: "Nahl Suresi, 90"),
        HourlyVerse(text: "Hayâsızlığı, fenalığı ve azgınlığı da yasaklar.", source: "Nahl Suresi, 90"),
        HourlyVerse(text: "Biz, emaneti göklere, yere ve dağlara sunduk da onlar bunu yüklenmekten kaçındılar.", source: "Ahzâb Suresi, 72"),
        HourlyVerse(text: "Allah ve melekleri, Peygamber'e çok salavât getirirler. Ey iman edenler! Siz de ona salavât getirin.", source: "Ahzâb Suresi, 56"),
        HourlyVerse(text: "O halde onlara güzel bir hoşgörü ile muamele et.", source: "Hicr Suresi, 85"),
        HourlyVerse(text: "Ben hüznümü ve kederimi ancak Allah'a şikayet ederim.", source: "Yûsuf Suresi, 86"),
        HourlyVerse(text: "Üzülme, çünkü Allah bizimle beraberdir.", source: "Tevbe Suresi, 40"),
        HourlyVerse(text: "İman edip salih ameller işleyenlerin ise, kuşkusuz biz güzel iş yapanların mükafatını zayi etmeyiz.", source: "Kehf Suresi, 30"),
        HourlyVerse(text: "Andolsun, biz insanı zorluklar içinde yarattık.", source: "Beled Suresi, 4"),
        HourlyVerse(text: "Allah'ın ipine (Kur'an'a) hep birlikte sımsıkı sarılın, parçalanıp bölünmeyin.", source: "Âl-i İmrân Suresi, 103"),
        HourlyVerse(text: "Sizden, hayra çağıran, iyiliği emreden ve kötülükten men eden bir topluluk bulunsun.", source: "Âl-i İmrân Suresi, 104"),
        HourlyVerse(text: "Eğer mümin iseniz, Allah'a tevekkül edin.", source: "Mâide Suresi, 23"),
        HourlyVerse(text: "Göklerin ve yerin mülkü Allah'ındır. Allah, her şeye hakkıyla gücü yetendir.", source: "Âl-i İmrân Suresi, 189"),
        HourlyVerse(text: "Allah size yardım ederse, artık size üstün gelecek hiç kimse yoktur.", source: "Âl-i İmrân Suresi, 160"),
        HourlyVerse(text: "Hepiniz O'ndan geldiniz ve O'na döndürüleceksiniz.", source: "Yâsîn Suresi, 83"),
        HourlyVerse(text: "Güneş ve ay bir hesaba göre hareket etmektedir.", source: "Rahmân Suresi, 5"),
        HourlyVerse(text: "Göğü Allah yükseltti ve mizanı (dengeyi) O koydu.", source: "Rahmân Suresi, 7"),
        HourlyVerse(text: "Rabbinizin hangi nimetlerini yalanlayabilirsiniz?", source: "Rahmân Suresi, 13"),
        HourlyVerse(text: "İman edip iyi işler yapanları, altından ırmaklar akan cennetlere koyacağız.", source: "Nisa Suresi, 122"),
        HourlyVerse(text: "Gerçek şu ki, Allah zerre kadar haksızlık yapmaz.", source: "Nisa Suresi, 40"),
        HourlyVerse(text: "Müminler ancak onlardır ki, Allah anıldığı zaman kalpleri titrer.", source: "Enfâl Suresi, 2"),
        HourlyVerse(text: "Şüphesiz Allah, hakkıyla işiten, hakkıyla bilendir.", source: "Mü'min Suresi, 56"),
        HourlyVerse(text: "Bir şeyi dilediği zaman O'nun emri o şeye ancak 'Ol!' demektir, o da hemen oluverir.", source: "Yâsîn Suresi, 82"),
        HourlyVerse(text: "Kuşkusuz Rabbinin yakalaması çok şiddetlidir.", source: "Bürûc Suresi, 12"),
        HourlyVerse(text: "O, çok bağışlayan ve çok sevendir.", source: "Bürûc Suresi, 14"),
        HourlyVerse(text: "Ancak Allah'a ibadet edin ve O'na hiçbir şeyi ortak koşmayın.", source: "Nisa Suresi, 36"),
        HourlyVerse(text: "Anne-babaya, akrabaya, yetimlere, yoksullara iyi davranın.", source: "Nisa Suresi, 36"),
        HourlyVerse(text: "Kim Allah'a tevekkül ederse, O kendisine yeter.", source: "Talâk Suresi, 3"),
        HourlyVerse(text: "Şüphesiz ki namaz hayasızlıktan ve kötülükten alıkoyar.", source: "Ankebût Suresi, 45"),
        HourlyVerse(text: "Allah'a kaçın (sığının). Şüphesiz ben, O'nun tarafından size gönderilmiş apaçık bir uyarıcıyım.", source: "Zâriyât Suresi, 50"),
        HourlyVerse(text: "Ben cinleri ve insanları ancak bana kulluk etsinler diye yarattım.", source: "Zâriyât Suresi, 56"),
        HourlyVerse(text: "İşte onlar, barış yurdu (cennet) içindedirler. Orada onlara Rablerinden istedikleri her şey vardır.", source: "Kâf Suresi, 31"),
        HourlyVerse(text: "Sabrederek ve namaz kılarak (Allah'tan) yardım dileyin.", source: "Bakara Suresi, 45"),
        HourlyVerse(text: "Şüphesiz sabredenlere mükafatları hesapsız ödenecektir.", source: "Zümer Suresi, 10"),
        HourlyVerse(text: "Rahmân'ın kulları, yeryüzünde vakar ve tevazu ile yürüyen kimselerdir.", source: "Furkân Suresi, 63"),
        HourlyVerse(text: "Cahiller onlara laf attıkları zaman, 'Selam!' der (geçer)ler.", source: "Furkân Suresi, 63"),
        HourlyVerse(text: "Muhakkak ki Allah, tövbe edenleri sever, temizlenenleri de sever.", source: "Bakara Suresi, 222"),
        HourlyVerse(text: "Her nefis ölümü tadacaktır. Sizi bir imtihan olarak kötülük ve iyilikle deneyeceğiz.", source: "Enbiyâ Suresi, 35"),
        HourlyVerse(text: "Eğer Allah, insanları zulümleri yüzünden cezalandıracak olsaydı, yeryüzünde hiçbir canlı bırakmazdı.", source: "Nahl Suresi, 61"),
        HourlyVerse(text: "Şüphesiz rızkı veren, mutlak kudret sahibi olan ancak Allah'tır.", source: "Zâriyât Suresi, 58"),
        HourlyVerse(text: "Yeryüzünde böbürlenerek yürüme. Çünkü sen yeri yaramazsın, boyca da dağlara ulaşamazsın.", source: "İsrâ Suresi, 37"),
        HourlyVerse(text: "Güzel bir söz ve bağışlama, peşinden eziyet gelen bir sadakadan daha hayırlıdır.", source: "Bakara Suresi, 263"),
        HourlyVerse(text: "Onlar ki, ne ticaret ne de alışveriş onları Allah'ı anmaktan alıkoymaz.", source: "Nûr Suresi, 37"),
        HourlyVerse(text: "Rabbimiz! Bizi bağışla, bizden önce iman etmiş olan kardeşlerimizi de bağışla.", source: "Haşr Suresi, 10"),
        HourlyVerse(text: "Allah, gözlerin hain bakışını ve göğüslerin gizlediğini bilir.", source: "Mü'min Suresi, 19"),
        HourlyVerse(text: "Ey Peygamber! Biz seni bir şahit, bir müjdeleyici ve bir uyarıcı olarak gönderdik.", source: "Ahzâb Suresi, 45"),
        HourlyVerse(text: "Kıyamet günü onlar için adalet terazileri kuracağız. Hiç kimseye zerre kadar haksızlık edilmeyecek.", source: "Enbiyâ Suresi, 47"),
        HourlyVerse(text: "Siz ancak alemlerin Rabbi olan Allah dilerse dileyebilirsiniz.", source: "İnsan Suresi, 30")
    ]

    static func verseForDate(_ date: Date) -> HourlyVerse {
        let calendar = Calendar.current
        let dayOfYear = calendar.ordinality(of: .day, in: .year, for: date) ?? 1
        let hour = calendar.component(.hour, from: date)
        let index = abs(dayOfYear * 24 + hour) % allVerses.count
        return allVerses[index]
    }

    static var placeholder: HourlyVerseEntry {
        HourlyVerseEntry(
            date: Date(),
            verse: verseForDate(Date())
        )
    }
}
