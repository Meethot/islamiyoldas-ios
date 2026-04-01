import re

verses_list = [
    ("Rabbin seni terk etmedi ve sana darılmadı.", "Duhâ Suresi, 3"),
    ("Şüphesiz zorlukla beraber bir kolaylık vardır.", "İnşirâh Suresi, 5"),
    ("Öyleyse beni anın ki ben de sizi anayım.", "Bakara Suresi, 152"),
    ("Ey iman edenler! Sabır ve namaz ile Allah'tan yardım isteyin. Şüphesiz Allah sabredenlerle beraberdir.", "Bakara Suresi, 153"),
    ("Kullarım beni sana soracak olursa, muhakkak ki ben (onlara) pek yakınım.", "Bakara Suresi, 186"),
    ("Allah hiçbir nefsi gücünün yettiğinden başkasıyla yükümlü tutmaz.", "Bakara Suresi, 286"),
    ("Rabbimiz! Bizi hidayete erdirdikten sonra kalplerimizi eğriltme.", "Âl-i İmrân Suresi, 8"),
    ("Gevşemeyin, hüzünlenmeyin. Eğer iman etmiş kimseler iseniz üstün olan sizsiniz.", "Âl-i İmrân Suresi, 139"),
    ("Hayır! Sizin mevlânız Allah'tır. O, yardımcıların en hayırlısıdır.", "Âl-i İmrân Suresi, 150"),
    ("Allah size yardım ederse, artık size üstün gelecek hiç kimse yoktur.", "Âl-i İmrân Suresi, 160"),
    ("Onlar, inananlar ve kalpleri Allah'ı anmakla huzura kavuşanlardır.", "Ra'd Suresi, 28"),
    ("Bilesiniz ki kalpler ancak Allah'ı anmakla huzur bulur.", "Ra'd Suresi, 28"),
    ("Eğer şükrederseniz, elbette size nimetimi artırırım.", "İbrâhîm Suresi, 7"),
    ("Rabbin, yalnız kendisine ibadet etmenizi ve ana babaya iyilik yapmanızı kesin olarak emretti.", "İsrâ Suresi, 23"),
    ("Rabbim! Küçüklüğümde onlar beni nasıl yetiştirmişlerse, şimdi sen de onlara öyle rahmet et!", "İsrâ Suresi, 24"),
    ("De ki: Hak geldi, batıl yok oldu. Şüphesiz batıl, yok olmaya mahkûmdur.", "İsrâ Suresi, 81"),
    ("Rabbimiz! Bize katından bir rahmet ver ve şu işimizde bize doğruyu göster.", "Kehf Suresi, 10"),
    ("Korkmayın, çünkü ben sizinle beraberim; işitiyorum ve görüyorum.", "Tâ-Hâ Suresi, 46"),
    ("Rabbim! İlmimi artır.", "Tâ-Hâ Suresi, 114"),
    ("Biz seni ancak âlemlere rahmet olarak gönderdik.", "Enbiyâ Suresi, 107"),
    ("Senden başka hiçbir ilâh yoktur. Seni eksikliklerden uzak tutarım. Ben gerçekten (nefsine) zulmedenlerden oldum.", "Enbiyâ Suresi, 87"),
    ("Rabbiniz şöyle buyurdu: Bana dua edin, duanıza cevap vereyim.", "Mü'min Suresi, 60"),
    ("Ey kendi aleyhlerine haddi aşan kullarım! Allah'ın rahmetinden ümit kesmeyin.", "Zümer Suresi, 53"),
    ("Şüphesiz Allah, bütün günahları affeder.", "Zümer Suresi, 53"),
    ("Müminler ancak kardeştirler. Öyleyse kardeşlerinizin arasını düzeltin.", "Hucurât Suresi, 10"),
    ("Ey iman edenler! Zannın çoğundan sakının; çünkü zannın bir kısmı günahtır.", "Hucurât Suresi, 12"),
    ("O, Karada ve denizde olanı bilir. O'nun ilmi dışında bir yaprak bile düşmez.", "En'âm Suresi, 59"),
    ("Allah sizin suretlerinize ve mallarınıza değil, kalplerinize ve amellerinize bakar.", "Hadis-i Şerif (Müslim)"),  # Replacing with a verse next
    ("Nerede olursanız olun, O sizinle beraberdir.", "Hadîd Suresi, 4"),
    ("İyiliğin karşılığı, yalnız iyilik değil midir?", "Rahmân Suresi, 60"),
    ("Biz insanı en güzel biçimde yarattık.", "Tîn Suresi, 4"),
    ("Şüphesiz Rabbin sana verecek ve sen hoşnut olacaksın.", "Duhâ Suresi, 5"),
    ("Yetimi sakın ezme. El açıp isteyeni de sakın azarlama.", "Duhâ Suresi, 9-10"),
    ("Ve Rabbinin nimetini minnet ve şükranla an.", "Duhâ Suresi, 11"),
    ("Zamana andolsun ki, insan ziyandadır. Ancak iman edip salih ameller işleyenler müstesna.", "Asr Suresi, 1-3"),
    ("Ve Biz insana şahdamarından daha yakınız.", "Kâf Suresi, 16"),
    ("Rabbinin rızası için sabret.", "Müddessir Suresi, 7"),
    ("Göklerde ve yerde olanların hepsi O'nundur. Bütün işler ancak O'na döndürülür.", "Âl-i İmrân Suresi, 109"),
    ("İman edip salih ameller işleyenlere gelince, onlar için kesintisiz bir mükafat vardır.", "Tîn Suresi, 6"),
    ("O, yarattığı her şeyi en güzel yapan ve insanı yaratmaya çamurdan başlayandır.", "Secde Suresi, 7"),
    ("Onlar bollukta ve darlıkta Allah yolunda harcayanlar, öfkelerini yenenler ve insanları affedenlerdir.", "Âl-i İmrân Suresi, 134"),
    ("Şüphesiz Allah, iyilik yapanları sever.", "Âl-i İmrân Suresi, 134"),
    ("Eğer Allah sana bir sıkıntı dokundurursa, onu O'ndan başka giderecek yoktur.", "Yûnus Suresi, 107"),
    ("O, sizin için kulakları, gözleri ve kalpleri yaratandır. Ne kadar da az şükrediyorsunuz!", "Mü'minûn Suresi, 78"),
    ("De ki: Ey insanlar! Şüphesiz size Rabbinizden hak gelmiştir.", "Yûnus Suresi, 108"),
    ("Allah, samimi olarak kendi rızasını gözeterek yapılan amellerden başkasını kabul etmez.", "Nesâî"),
    ("Allah, göklerin ve yerin nurudur.", "Nûr Suresi, 35"),
    ("Görmedin mi Allah nasıl bir misal getirdi: Güzel bir söz, kökü sağlam, dalları göğe yükselen güzel bir ağaç gibidir.", "İbrâhîm Suresi, 24"),
    ("Bilesiniz ki, Allah'ın dostlarına hiçbir korku yoktur. Onlar üzülmeyeceklerdir de.", "Yûnus Suresi, 62"),
    ("Rabbinizin mağfiretine ve genişliği gökler ve yer kadar olan cennete koşun.", "Âl-i İmrân Suresi, 133"),
    ("O, kullarının tövbesini kabul eden, kötülükleri bağışlayan ve yaptıklarınızı bilendir.", "Şûrâ Suresi, 25"),
    ("Onlar, yalan şahitlikte bulunmayan, boş ve yararsız sözle karşılaştıkları zaman onurlu olarak geçenlerdir.", "Furkân Suresi, 72"),
    ("Şüphesiz Allah, adaleti, iyilik yapmayı, yakınlara yardım etmeyi emreder.", "Nahl Suresi, 90"),
    ("Hayâsızlığı, fenalığı ve azgınlığı da yasaklar.", "Nahl Suresi, 90"),
    ("Biz, emaneti göklere, yere ve dağlara sunduk da onlar bunu yüklenmekten kaçındılar.", "Ahzâb Suresi, 72"),
    ("Allah ve melekleri, Peygamber'e çok salavât getirirler. Ey iman edenler! Siz de ona salavât getirin.", "Ahzâb Suresi, 56"),
    ("O halde onlara güzel bir hoşgörü ile muamele et.", "Hicr Suresi, 85"),
    ("Ben hüznümü ve kederimi ancak Allah'a şikayet ederim.", "Yûsuf Suresi, 86"),
    ("Üzülme, çünkü Allah bizimle beraberdir.", "Tevbe Suresi, 40"),
    ("İman edip salih ameller işleyenlerin ise, kuşkusuz biz güzel iş yapanların mükafatını zayi etmeyiz.", "Kehf Suresi, 30"),
    ("Andolsun, biz insanı zorluklar içinde yarattık.", "Beled Suresi, 4"),
    ("Allah'ın ipine (Kur'an'a) hep birlikte sımsıkı sarılın, parçalanıp bölünmeyin.", "Âl-i İmrân Suresi, 103"),
    ("Sizden, hayra çağıran, iyiliği emreden ve kötülükten men eden bir topluluk bulunsun.", "Âl-i İmrân Suresi, 104"),
    ("Eğer mümin iseniz, Allah'a tevekkül edin.", "Mâide Suresi, 23"),
    ("Göklerin ve yerin mülkü Allah'ındır. Allah, her şeye hakkıyla gücü yetendir.", "Âl-i İmrân Suresi, 189"),
    ("Allah size yardım ederse, artık size üstün gelecek hiç kimse yoktur.", "Âl-i İmrân Suresi, 160"),
    ("Hepiniz O'ndan geldiniz ve O'na döndürüleceksiniz.", "Yâsîn Suresi, 83"),
    ("Güneş ve ay bir hesaba göre hareket etmektedir.", "Rahmân Suresi, 5"),
    ("Göğü Allah yükseltti ve mizanı (dengeyi) O koydu.", "Rahmân Suresi, 7"),
    ("Rabbinizin hangi nimetlerini yalanlayabilirsiniz?", "Rahmân Suresi, 13"),
    ("İman edip iyi işler yapanları, altından ırmaklar akan cennetlere koyacağız.", "Nisa Suresi, 122"),
    ("Gerçek şu ki, Allah zerre kadar haksızlık yapmaz.", "Nisa Suresi, 40"),
    ("Müminler ancak onlardır ki, Allah anıldığı zaman kalpleri titrer.", "Enfâl Suresi, 2"),
    ("Şüphesiz Allah, hakkıyla işiten, hakkıyla bilendir.", "Mü'min Suresi, 56"),
    ("Bir şeyi dilediği zaman O'nun emri o şeye ancak 'Ol!' demektir, o da hemen oluverir.", "Yâsîn Suresi, 82"),
    ("Kuşkusuz Rabbinin yakalaması çok şiddetlidir.", "Bürûc Suresi, 12"),
    ("O, çok bağışlayan ve çok sevendir.", "Bürûc Suresi, 14"),
    ("Ancak Allah'a ibadet edin ve O'na hiçbir şeyi ortak koşmayın.", "Nisa Suresi, 36"),
    ("Anne-babaya, akrabaya, yetimlere, yoksullara iyi davranın.", "Nisa Suresi, 36"),
    ("Kim Allah'a tevekkül ederse, O kendisine yeter.", "Talâk Suresi, 3"),
    ("Şüphesiz ki namaz hayasızlıktan ve kötülükten alıkoyar.", "Ankebût Suresi, 45"),
    ("Allah'a kaçın (sığının). Şüphesiz ben, O'nun tarafından size gönderilmiş apaçık bir uyarıcıyım.", "Zâriyât Suresi, 50"),
    ("Ben cinleri ve insanları ancak bana kulluk etsinler diye yarattım.", "Zâriyât Suresi, 56"),
    ("İşte onlar, barış yurdu (cennet) içindedirler. Orada onlara Rablerinden istedikleri her şey vardır.", "Kâf Suresi, 31"),
    ("Sabrederek ve namaz kılarak (Allah'tan) yardım dileyin.", "Bakara Suresi, 45"),
    ("Şüphesiz sabredenlere mükafatları hesapsız ödenecektir.", "Zümer Suresi, 10"),
    ("Rahmân'ın kulları, yeryüzünde vakar ve tevazu ile yürüyen kimselerdir.", "Furkân Suresi, 63"),
    ("Cahiller onlara laf attıkları zaman, 'Selam!' der (geçer)ler.", "Furkân Suresi, 63"),
    ("Muhakkak ki Allah, tövbe edenleri sever, temizlenenleri de sever.", "Bakara Suresi, 222"),
    ("Her nefis ölümü tadacaktır. Sizi bir imtihan olarak kötülük ve iyilikle deneyeceğiz.", "Enbiyâ Suresi, 35"),
    ("Eğer Allah, insanları zulümleri yüzünden cezalandıracak olsaydı, yeryüzünde hiçbir canlı bırakmazdı.", "Nahl Suresi, 61"),
    ("Şüphesiz rızkı veren, mutlak kudret sahibi olan ancak Allah'tır.", "Zâriyât Suresi, 58"),
    ("Yeryüzünde böbürlenerek yürüme. Çünkü sen yeri yaramazsın, boyca da dağlara ulaşamazsın.", "İsrâ Suresi, 37"),
    ("Güzel bir söz ve bağışlama, peşinden eziyet gelen bir sadakadan daha hayırlıdır.", "Bakara Suresi, 263"),
    ("Onlar ki, ne ticaret ne de alışveriş onları Allah'ı anmaktan alıkoymaz.", "Nûr Suresi, 37"),
    ("Rabbimiz! Bizi bağışla, bizden önce iman etmiş olan kardeşlerimizi de bağışla.", "Haşr Suresi, 10"),
    ("Allah, gözlerin hain bakışını ve göğüslerin gizlediğini bilir.", "Mü'min Suresi, 19"),
    ("Ey Peygamber! Biz seni bir şahit, bir müjdeleyici ve bir uyarıcı olarak gönderdik.", "Ahzâb Suresi, 45"),
    ("Kıyamet günü onlar için adalet terazileri kuracağız. Hiç kimseye zerre kadar haksızlık edilmeyecek.", "Enbiyâ Suresi, 47"),
    ("Siz ancak alemlerin Rabbi olan Allah dilerse dileyebilirsiniz.", "İnsan Suresi, 30")
]

# Write to Swift file
with open("/Users/mithat/Downloads/mobi/ios/App/IslamiWidgets/HourlyVerseEntry.swift", "w", encoding="utf-8") as f:
    f.write("import WidgetKit\nimport SwiftUI\n\n")
    f.write("/// Timeline entry for Hourly Verse widget\n")
    f.write("struct HourlyVerseEntry: TimelineEntry {\n")
    f.write("    let date: Date\n")
    f.write("    let verse: HourlyVerse\n\n")
    f.write("    struct HourlyVerse {\n        let text: String\n        let source: String\n    }\n\n")
    f.write("    static let allVerses: [HourlyVerse] = [\n")
    
    for i, (text, source) in enumerate(verses_list):
        comma = "," if i < len(verses_list) - 1 else ""
        f.write(f'        HourlyVerse(text: "{text}", source: "{source}"){comma}\n')
        
    f.write("    ]\n\n")
    f.write("    static func verseForDate(_ date: Date) -> HourlyVerse {\n")
    f.write("        let calendar = Calendar.current\n")
    f.write("        let dayOfYear = calendar.ordinality(of: .day, in: .year, for: date) ?? 1\n")
    f.write("        let hour = calendar.component(.hour, from: date)\n")
    f.write("        let index = abs(dayOfYear * 24 + hour) % allVerses.count\n")
    f.write("        return allVerses[index]\n")
    f.write("    }\n\n")
    f.write("    static var placeholder: HourlyVerseEntry {\n")
    f.write("        HourlyVerseEntry(\n            date: Date(),\n            verse: verseForDate(Date())\n        )\n    }\n")
    f.write("}\n")
