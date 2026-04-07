import WidgetKit
import SwiftUI

struct MotivationEntry: TimelineEntry {
    let date: Date
    let motivation: DailyMotivation

    struct DailyMotivation {
        let text: String
        let source: String
    }
    
    // MARK: - Localized Motivations
    
    static func allMotivations(for lang: String) -> [DailyMotivation] {
        switch lang {
        case "en": return motivationsEN
        case "de": return motivationsDE
        case "ru": return motivationsRU
        case "az": return motivationsAZ
        case "ar": return motivationsAR
        default:   return motivationsTR
        }
    }

    static let motivationsTR: [DailyMotivation] = [
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
    
    static let motivationsEN: [DailyMotivation] = [
        DailyMotivation(text: "For indeed, with hardship will be ease.", source: "Ash-Sharh, 5-6"),
        DailyMotivation(text: "Allah does not charge a soul except with that within its capacity.", source: "Al-Baqarah, 286"),
        DailyMotivation(text: "Your Lord has not abandoned you, nor has He detested you.", source: "Ad-Duhaa, 3"),
        DailyMotivation(text: "Do not lose heart or despair- if you are true believers you have the upper hand.", source: "Ali 'Imran, 139"),
        DailyMotivation(text: "And whoever relies upon Allah - then He is sufficient for him.", source: "At-Talaq, 3"),
        DailyMotivation(text: "Do not grieve; indeed Allah is with us.", source: "At-Tawbah, 40"),
        DailyMotivation(text: "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.", source: "Al-Baqarah, 153"),
        DailyMotivation(text: "O My servants who have transgressed against themselves, do not despair of the mercy of Allah.", source: "Az-Zumar, 53"),
        DailyMotivation(text: "And your Lord says, \"Call upon Me; I will respond to you.\"", source: "Ghafir, 60"),
        DailyMotivation(text: "And your Lord is going to give you, and you will be satisfied.", source: "Ad-Duhaa, 5"),
        DailyMotivation(text: "But perhaps you hate a thing and it is good for you; and perhaps you love a thing and it is bad for you. And Allah Knows, while you know not.", source: "Al-Baqarah, 216"),
        DailyMotivation(text: "But they plan, and Allah plans. And Allah is the best of planners.", source: "Al-Anfal, 30"),
        DailyMotivation(text: "Unquestionably, by the remembrance of Allah hearts are assured.", source: "Ar-Ra'd, 28"),
        DailyMotivation(text: "Does He who created not know, while He is the Subtle, the Acquainted?", source: "Al-Mulk, 14"),
        DailyMotivation(text: "And despair not of relief from Allah. Indeed, no one despairs of relief from Allah except the disbelieving people.", source: "Yusuf, 87"),
        DailyMotivation(text: "And who despairs of the mercy of his Lord except for those astray?", source: "Al-Hijr, 56"),
        DailyMotivation(text: "Indeed, it is Allah who is the [continual] Provider, the firm possessor of strength.", source: "Adh-Dhariyat, 58"),
        DailyMotivation(text: "And that there is not for man except that for which he strives.", source: "An-Najm, 39"),
        DailyMotivation(text: "So forgive with gracious forgiveness.", source: "Al-Hijr, 85"),
        DailyMotivation(text: "And whoever fears Allah - He will make for him a way out.", source: "At-Talaq, 2"),
        DailyMotivation(text: "And We have already created man and know what his soul whispers to him, and We are closer to him than his jugular vein.", source: "Qaaf, 16"),
        DailyMotivation(text: "And be patient, and your patience is not but through Allah. And do not grieve over them.", source: "An-Nahl, 127"),
        DailyMotivation(text: "Fear not. Indeed, I am with you both; I hear and I see.", source: "Ta-Ha, 46"),
        DailyMotivation(text: "So be patient. Indeed, the promise of Allah is truth.", source: "Ar-Rum, 60"),
        DailyMotivation(text: "And when My servants ask you, concerning Me - indeed I am near.", source: "Al-Baqarah, 186"),
        DailyMotivation(text: "Indeed, those who have said, \"Our Lord is Allah\" and then remained on a right course - the angels will descend upon them, [saying], \"Do not fear and do not grieve but receive good tidings of Paradise, which you were promised.\"", source: "Fussilat, 30"),
        DailyMotivation(text: "And if He intends for you good, then there is no repeller of His bounty.", source: "Yunus, 107"),
        DailyMotivation(text: "O you who have believed, persevere and endure and remain stationed.", source: "Ali 'Imran, 200"),
        DailyMotivation(text: "Those will be awarded the Chamber for what they patiently endured.", source: "Al-Furqan, 75"),
        DailyMotivation(text: "Whatever you have will end, but what Allah has is lasting. And We will surely give those who were patient their reward.", source: "An-Nahl, 96"),
        DailyMotivation(text: "Sufficient for me is Allah; there is no deity except Him. On Him I have relied.", source: "At-Tawbah, 129")
    ]
    
    static let motivationsDE: [DailyMotivation] = [
        DailyMotivation(text: "Gewiss, mit der Erschwernis ist Erleichterung.", source: "Asch-Scharh, 5-6"),
        DailyMotivation(text: "Allah erlegt keiner Seele mehr auf, als sie zu leisten vermag.", source: "Al-Baqara, 286"),
        DailyMotivation(text: "Dein Herr hat dich nicht verlassen und verabscheut dich nicht.", source: "Ad-Duha, 3"),
        DailyMotivation(text: "Und verliert nicht den Mut und seid nicht traurig; ihr seid die Oberhand Habenden, wenn ihr gläubig seid.", source: "Ali Imran, 139"),
        DailyMotivation(text: "Und wer sich auf Allah verlässt, dem ist Er genüge.", source: "At-Talaq, 3"),
        DailyMotivation(text: "Sei nicht traurig! Gewiss, Allah ist mit uns.", source: "At-Tauba, 40"),
        DailyMotivation(text: "O die ihr glaubt! Sucht Hilfe in der Geduld und im Gebet. Wahrlich, Allah ist mit den Geduldigen.", source: "Al-Baqara, 153"),
        DailyMotivation(text: "O Meine Diener, die ihr gegen euch selbst maßlos gewesen seid, verliert nicht die Hoffnung auf Allahs Barmherzigkeit.", source: "Az-Zumar, 53"),
        DailyMotivation(text: "Euer Herr sagt: Ruft Mich an, so werde Ich euch Erhörung gewähren.", source: "Ghafir, 60"),
        DailyMotivation(text: "Und dein Herr wird dir wahrlich geben, und du wirst zufrieden sein.", source: "Ad-Duha, 5"),
        DailyMotivation(text: "Vielleicht ist euch etwas zuwider, während es gut für euch ist, und vielleicht liebt ihr etwas, während es schlecht für euch ist. Allah weiß, ihr aber wisst nicht.", source: "Al-Baqara, 216"),
        DailyMotivation(text: "Sie schmiedeten Ränke, und Allah schmiedete Ränke; und Allah ist der beste Ränkeschmied.", source: "Al-Anfal, 30"),
        DailyMotivation(text: "Wahrlich, im Gedenken Allahs finden die Herzen Ruhe.", source: "Ar-Ra'd, 28"),
        DailyMotivation(text: "Sollte Er denn nicht wissen, Was Er erschaffen hat? Und Er ist der Feinfühlige, der Allkundige.", source: "Al-Mulk, 14"),
        DailyMotivation(text: "Und gebt die Hoffnung auf Allahs Erbarmen nicht auf. Es geben nur die ungläubigen Leute die Hoffnung auf Allahs Erbarmen auf.", source: "Yusuf, 87"),
        DailyMotivation(text: "Wer verliert die Hoffnung auf die Barmherzigkeit seines Herrn außer den Irregegangenen?", source: "Al-Hijr, 56"),
        DailyMotivation(text: "Gewiß, Allah ist der Versorger, der Besitzer von Kraft und der Feste.", source: "Adh-Dhariyat, 58"),
        DailyMotivation(text: "Und dass dem Menschen nichts anderes zuteil wird als das, wonach er strebt.", source: "An-Najm, 39"),
        DailyMotivation(text: "So übe Nachsicht auf eine schöne Weise.", source: "Al-Hijr, 85"),
        DailyMotivation(text: "Und wer Allah fürchtet, dem schafft Er einen Ausweg.", source: "At-Talaq, 2"),
        DailyMotivation(text: "Wir haben den Menschen ja erschaffen und wissen, was (ihm) seine Seele einflüstert, und Wir sind ihm näher als seine Halsschlagader.", source: "Qaf, 16"),
        DailyMotivation(text: "Und sei geduldig! Deine Geduld ist nur mit Allahs (Hilfe) möglich. Sei nicht traurig über sie.", source: "An-Nahl, 127"),
        DailyMotivation(text: "Fürchtet euch nicht. Gewiß, Ich bin mit euch beiden; Ich höre und sehe.", source: "Ta-Ha, 46"),
        DailyMotivation(text: "So sei geduldig. Gewiß, das Versprechen Allahs ist wahr.", source: "Ar-Rum, 60"),
        DailyMotivation(text: "Und wenn dich Meine Diener nach Mir fragen, so bin Ich nahe.", source: "Al-Baqara, 186"),
        DailyMotivation(text: "Gewiß, diejenigen, die sagen: „Unser Herr ist Allah“, und sich hierauf geradlinig verhalten, auf sie steigen die Engel herab (und sagen): „Fürchtet euch nicht, traurig zu sein, und freut euch über den Paradiesgarten, der euch stets versprochen wurde.“", source: "Fussilat, 30"),
        DailyMotivation(text: "Und wenn Er für dich Gutes will, gibt es niemanden, der Seine Huld abweisen könnte.", source: "Yunus, 107"),
        DailyMotivation(text: "O die ihr glaubt, geduldet euch, haltet standhaft aus, seid wachsam.", source: "Ali Imran, 200"),
        DailyMotivation(text: "Sie werden mit dem Obergemach belohnt, dafür, daß sie standhaft geblieben sind.", source: "Al-Furqan, 75"),
        DailyMotivation(text: "Was bei euch ist, vergeht; was aber bei Allah ist, bleibt bestehen. Wir werden denjenigen, die standhaft waren, gewiß ihren Lohn vergelten.", source: "An-Nahl, 96"),
        DailyMotivation(text: "Allah genügt mir. Es gibt keinen Gott außer Ihm. Auf Ihn verlasse ich mich.", source: "At-Tauba, 129")
    ]
    
    static let motivationsRU: [DailyMotivation] = [
        DailyMotivation(text: "Воистину, за каждой тягостью наступает облегчение.", source: "Аш-Шарх, 5-6"),
        DailyMotivation(text: "Аллах не возлагает на человека сверх его возможностей.", source: "Аль-Бакара, 286"),
        DailyMotivation(text: "Твой Господь не покинул тебя и не возненавидел.", source: "Ад-Духа, 3"),
        DailyMotivation(text: "Не слабейте и не печальтесь, в то время как вы будете на высоте, если вы действительно являетесь верующими.", source: "Аль Имран, 139"),
        DailyMotivation(text: "Тому, кто уповает на Аллаха, достаточно Его.", source: "Ат-Талак, 3"),
        DailyMotivation(text: "Не печалься, ибо Аллах — с нами.", source: "Ат-Тауба, 40"),
        DailyMotivation(text: "О те, которые уверовали! Обратитесь за помощью к терпению и молитве. Поистине, Аллах - с терпеливыми.", source: "Аль-Бакара, 153"),
        DailyMotivation(text: "О Мои рабы, которые преступили границы во вред самим себе! Не отчаивайтесь в милости Аллаха.", source: "Аз-Зумар, 53"),
        DailyMotivation(text: "Ваш Господь сказал: «Взывайте ко Мне, и Я отвечу вам».", source: "Гафир, 60"),
        DailyMotivation(text: "Господь твой непременно одарит тебя, и ты будешь доволен.", source: "Ад-Духа, 5"),
        DailyMotivation(text: "Быть может, вам неприятно то, что является благом для вас. И быть может, вы любите то, что является злом для вас. Аллах знает, а вы не знаете.", source: "Аль-Бакара, 216"),
        DailyMotivation(text: "Они хитрили, и Аллах хитрил, а ведь Аллах — Наилучший из хитрецов.", source: "Аль-Анфаль, 30"),
        DailyMotivation(text: "Разве не поминанием Аллаха утешаются сердца?", source: "Ар-Раад, 28"),
        DailyMotivation(text: "Неужели этого не будет знать Тот, Кто сотворил, если Он — Проницательный, Ведающий?", source: "Аль-Мульк, 14"),
        DailyMotivation(text: "И не отчаивайтесь в милости Аллаха. Воистину, отчаиваются в милости Аллаха только люди неверующие.", source: "Йусуф, 87"),
        DailyMotivation(text: "Кто же отчаивается в милости своего Господа, кроме заблудших?", source: "Аль-Хиджр, 56"),
        DailyMotivation(text: "Воистину, Аллах является Наделяющим уделом, Обладающим могуществом, Крепким.", source: "Аз-Зарият, 58"),
        DailyMotivation(text: "Человек получит только то, к чему он стремился.", source: "Ан-Наджм, 39"),
        DailyMotivation(text: "Прости же их прекрасным прощением.", source: "Аль-Хиджр, 85"),
        DailyMotivation(text: "Тому, кто боится Аллаха, Он создает выход из положения.", source: "Ат-Талак, 2"),
        DailyMotivation(text: "Мы сотворили человека и знаем, что нашептывает ему душа. Мы ближе к нему, чем яремная вена.", source: "Каф, 16"),
        DailyMotivation(text: "Терпи, ибо твое терпение — только от Аллаха. Не скорби по ним.", source: "Ан-Нахль, 127"),
        DailyMotivation(text: "Не бойтесь, ибо Я — с вами. Я слышу и вижу.", source: "Та Ха, 46"),
        DailyMotivation(text: "Будь же терпелив! Воистину, обещание Аллаха истинно.", source: "Ар-Рум, 60"),
        DailyMotivation(text: "Если Мои рабы спросят тебя обо Мне, то ведь Я близок и отвечаю на зов молящегося.", source: "Аль-Бакара, 186"),
        DailyMotivation(text: "Воистину, к тем, которые сказали: «Наш Господь — Аллах», а потом были стойки, нисходят ангелы: «Не бойтесь и не печальтесь, а возрадуйтесь Раю, который был обещан вам».", source: "Фуссилят, 30"),
        DailyMotivation(text: "Если Он пожелает одарить тебя добром, то никто не отвратит Его милости.", source: "Йунус, 107"),
        DailyMotivation(text: "О те, которые уверовали! Будьте терпеливы, запасайтесь терпением, несите службу на заставах.", source: "Аль Имран, 200"),
        DailyMotivation(text: "Они получат Горницу за то, что были терпеливы.", source: "Аль-Фуркан, 75"),
        DailyMotivation(text: "То, что есть у вас, иссякнет, а то, что есть у Аллаха, останется навсегда. А тем, которые проявляли терпение, Мы непременно воздадим наградой.", source: "Ан-Нахль, 96"),
        DailyMotivation(text: "Мне достаточно Аллаха! Нет божества, кроме Него. На Него я уповаю.", source: "Ат-Тауба, 129")
    ]
    
    static let motivationsAZ: [DailyMotivation] = [
        DailyMotivation(text: "Şübhəsiz ki, hər çətinlikdən sonra bir asanlıq gəlir!", source: "İnşirah Surəsi, 5-6"),
        DailyMotivation(text: "Allah hər kəsi yalnız onun qüvvəsi çatdığı qədər mükəlləf edər.", source: "Bəqərə Surəsi, 286"),
        DailyMotivation(text: "Rəbbin səni tərk etməyib və sənə acığı tutmayıb.", source: "Duha Surəsi, 3"),
        DailyMotivation(text: "Zəifləməyin və qəmgin rəftarda olmayın. Çünki əgər inanırsınızsa, siz üstünsünüz.", source: "Ali-İmran Surəsi, 139"),
        DailyMotivation(text: "Kim Allaha təvəkkül etsə, Allah ona kifayət edər.", source: "Talaq Surəsi, 3"),
        DailyMotivation(text: "Kədərlənmə, Allah bizimlədir.", source: "Tövbə Surəsi, 40"),
        DailyMotivation(text: "Ey iman gətirənlər! Səbir etmək və namaz qılmaqla Allahdan kömək diləyin. Həqiqətən, Allah səbir edənlərlədir.", source: "Bəqərə Surəsi, 153"),
        DailyMotivation(text: "Ey öz canlarına zülm etmiş qullarım! Allahın rəhmətindən ümidinizi kəsməyin.", source: "Zümər Surəsi, 53"),
        DailyMotivation(text: "Rəbbiniz dedi: Mənə dua edin, Mən də sizin dualarınızı qəbul edim!", source: "Mömin Surəsi, 60"),
        DailyMotivation(text: "Rəbbin sənə verəcək, sən də razı qalacaqsan.", source: "Duha Surəsi, 5"),
        DailyMotivation(text: "Bəzən xoşlamadığınız bir şey sizin üçün xeyirli ola bilər, bəzən də sevdiyiniz bir şey sizin üçün zərərli ola bilər. Allah bilir, siz bilmirsiniz.", source: "Bəqərə Surəsi, 216"),
        DailyMotivation(text: "Onlar hiylə qurdular, Allah da onların hiyləsini boşa çıxartdı. Allah hiylə quranların ən xeyirlisidir.", source: "Ənfal Surəsi, 30"),
        DailyMotivation(text: "Bilin ki, qəlblər yalnız Allahı zikr etməklə aram tapar!", source: "Rəd Surəsi, 28"),
        DailyMotivation(text: "Yaradan bilməzmi? O, ən incə işləri biləndir, (hər şeydən) xəbərdardır.", source: "Mülk Surəsi, 14"),
        DailyMotivation(text: "Allahın mərhəmətindən ümidinizi kəsməyin. Çünki kafir qövmdən başqa heç kəs Allahın mərhəmətindən ümidini kəsməz.", source: "Yusif Surəsi, 87"),
        DailyMotivation(text: "Azanlardan başqa Rəbbinin mərhəmətindən kim ümidini kəsər?", source: "Hicr Surəsi, 56"),
        DailyMotivation(text: "Şübhəsiz ki, ruzi verən də, qüvvət sahibi də, yenilməz olan da Allahdır.", source: "Zariyat Surəsi, 58"),
        DailyMotivation(text: "İnsan üçün yalnız öz zəhmətinin bəhrəsi vardır.", source: "Nəcm Surəsi, 39"),
        DailyMotivation(text: "Elə isə gözəl bir bağışlama ilə bağışla.", source: "Hicr Surəsi, 85"),
        DailyMotivation(text: "Kim Allahdan qorxarsa, Allah onun üçün bir çıxış yolu yaradar.", source: "Talaq Surəsi, 2"),
        DailyMotivation(text: "İnsanı Biz yaratdıq və nəfsinin ona nələr pıçıldadığını da Biz bilirik. Biz ona şah damarından da yaxınıq.", source: "Qaf Surəsi, 16"),
        DailyMotivation(text: "Səbir et! Sən ancaq Allahın köməyi ilə səbir edə bilərsən. Onlara görə kədərlənmə.", source: "Nəhl Surəsi, 127"),
        DailyMotivation(text: "Qorxmayın! Mən sizinləyəm, eşidirəm və görürəm.", source: "Taha Surəsi, 46"),
        DailyMotivation(text: "Səbir et! Allahın vədi, həqiqətən, haqdır.", source: "Rum Surəsi, 60"),
        DailyMotivation(text: "Qullarım səndən Mənim barəmdə soruşsalar, Mən (onlara) yaxınam.", source: "Bəqərə Surəsi, 186"),
        DailyMotivation(text: "“Rəbbimiz Allahdır!” deyib sonra doğru yolda olanlara mələklər nazil olaraq: “Qorxmayın və kədərlənməyin, sizə vəd olunan Cənnətlə sevinin!” – deyərlər.", source: "Fussilət Surəsi, 30"),
        DailyMotivation(text: "Əgər sənə bir xeyir yetirmək istəsə, heç kəs Onun lütfünün qarşısını ala bilməz.", source: "Yunus Surəsi, 107"),
        DailyMotivation(text: "Ey iman gətirənlər! Səbir edin, dözümlü olun, sərhəddə durub növbə çəkin.", source: "Ali-İmran Surəsi, 200"),
        DailyMotivation(text: "Onlar səbir etdiklərinə görə (Cənnətdə) yüksək məqamlarla mükafatlandırılacaqlar.", source: "Furqan Surəsi, 75"),
        DailyMotivation(text: "Sizdə olanlar tükənər, Allahın yanında olanlar isə qalarlar. Səbir edənlərin mükafatını mütləq verəcəyik.", source: "Nəhl Surəsi, 96"),
        DailyMotivation(text: "Mənə Allah yetər. Ondan başqa məbud yoxdur. Mən ancaq Ona təvəkkül edirəm.", source: "Tövbə Surəsi, 129")
    ]
    
    static let motivationsAR: [DailyMotivation] = [
        DailyMotivation(text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا.", source: "الشرح، 5-6"),
        DailyMotivation(text: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا.", source: "البقرة، 286"),
        DailyMotivation(text: "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ.", source: "الضحى، 3"),
        DailyMotivation(text: "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ.", source: "آل عمران، 139"),
        DailyMotivation(text: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ.", source: "الطلاق، 3"),
        DailyMotivation(text: "لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا.", source: "التوبة، 40"),
        DailyMotivation(text: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ.", source: "البقرة، 153"),
        DailyMotivation(text: "يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ.", source: "الزمر، 53"),
        DailyMotivation(text: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ.", source: "غافر، 60"),
        DailyMotivation(text: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ.", source: "الضحى، 5"),
        DailyMotivation(text: "وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ ۖ وَعَسَىٰ أَن تُحِبُّوا شَيْئًا وَهُوَ شَرٌّ لَّكُمْ.", source: "البقرة، 216"),
        DailyMotivation(text: "وَيَمْكُرُونَ وَيَمْكُرُ اللَّهُ ۖ وَاللَّهُ خَيْرُ الْمَاكِرِينَ.", source: "الأنفال، 30"),
        DailyMotivation(text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ.", source: "الرعد، 28"),
        DailyMotivation(text: "أَلَا يَعْلَمُ مَنْ خَلَقَ وَهُوَ اللَّطِيفُ الْخَبِيرُ.", source: "الملك، 14"),
        DailyMotivation(text: "وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ ۖ إِنَّهُ لَا يَيْأَسُ مِن رَّوْحِ اللَّهِ إِلَّا الْقَوْمُ الْكَافِرُونَ.", source: "يوسف، 87"),
        DailyMotivation(text: "وَمَن يَقْنَطُ مِن رَّحْمَةِ رَبِّهِ إِلَّا الضَّالُّونَ.", source: "الحجر، 56"),
        DailyMotivation(text: "إِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ الْمَتِينُ.", source: "الذاريات، 58"),
        DailyMotivation(text: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ.", source: "النجم، 39"),
        DailyMotivation(text: "فَاصْفَحِ الصَّفْحَ الْجَمِيلَ.", source: "الحجر، 85"),
        DailyMotivation(text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا.", source: "الطلاق، 2"),
        DailyMotivation(text: "وَلَقَدْ خَلَقْنَا الْإِنسَانَ وَنَعْلَمُ مَا تُوَسْوِسُ بِهِ نَفْسُهُ ۖ وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ.", source: "ق، 16"),
        DailyMotivation(text: "وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ ۚ وَلَا تَحْزَنْ عَلَيْهِمْ.", source: "النحل، 127"),
        DailyMotivation(text: "لَا تَخَافَا ۖ إِنَّنِي مَعَكُمَا أَسْمَعُ وَأَرَىٰ.", source: "طه، 46"),
        DailyMotivation(text: "فَاصْبِرْ إِنَّ وَعْدَ اللَّهِ حَقٌّ.", source: "الروم، 60"),
        DailyMotivation(text: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ.", source: "البقرة، 186"),
        DailyMotivation(text: "إِنَّ الَّذِينَ قَالُوا رَبُّنَا اللَّهُ ثُمَّ اسْتَقَامُوا تَتَنَزَّلُ عَلَيْهِمُ الْمَلَائِكَةُ أَلَّا تَخَافُوا وَلَا تَحْزَنُوا وَأَبْشِرُوا بِالْجَنَّةِ الَّتِي كُنتُمْ تُوعَدُونَ.", source: "فصلت، 30"),
        DailyMotivation(text: "وَإِن يُرِدْكَ بِخَيْرٍ فَلَا رَادَّ لِفَضْلِهِ.", source: "يونس، 107"),
        DailyMotivation(text: "يَا أَيُّهَا الَّذِينَ آمَنُوا اصْبِرُوا وَصَابِرُوا وَرَابِطُوا.", source: "آل عمران، 200"),
        DailyMotivation(text: "أُولَٰئِكَ يُجْزَوْنَ الْغُرْفَةَ بِمَا صَبَرُوا.", source: "الفرقان، 75"),
        DailyMotivation(text: "مَا عِندَكُمْ يَنفَدُ ۖ وَمَا عِندَ اللَّهِ بَاقٍ ۗ وَلَنَجْزِيَنَّ الَّذِينَ صَبَرُوا أَجْرَهُم.", source: "النحل، 96"),
        DailyMotivation(text: "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ.", source: "التوبة، 129")
    ]

    static func motivationForDate(_ date: Date) -> DailyMotivation {
        let lang = WidgetLanguageHelper.currentLanguage
        let motivations = allMotivations(for: lang)
        
        let calendar = Calendar.current
        let dayOfYear = calendar.ordinality(of: .day, in: .year, for: date) ?? 1
        let index = abs(dayOfYear - 1) % motivations.count
        return motivations[index]
    }
    
    static func hourlyMotivationForDate(_ date: Date) -> DailyMotivation {
        let lang = WidgetLanguageHelper.currentLanguage
        let motivations = allMotivations(for: lang)
        
        let calendar = Calendar.current
        let dayOfYear = calendar.ordinality(of: .day, in: .year, for: date) ?? 1
        let hour = calendar.component(.hour, from: date)
        let index = abs(dayOfYear * 24 + hour) % motivations.count
        return motivations[index]
    }

    static var placeholder: MotivationEntry {
        MotivationEntry(
            date: Date(),
            motivation: motivationForDate(Date())
        )
    }
}
