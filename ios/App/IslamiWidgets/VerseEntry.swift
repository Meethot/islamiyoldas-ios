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
    
    // MARK: - Localized Verse Arrays
    
    static func allVerses(for lang: String) -> [DailyVerse] {
        switch lang {
        case "en": return versesEN
        case "de": return versesDE
        case "ru": return versesRU
        case "az": return versesAZ
        case "ar": return versesAR
        default:   return versesTR
        }
    }
    
    // MARK: - Turkish (31)
    static let versesTR: [DailyVerse] = [
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
    
    // MARK: - English (31)
    static let versesEN: [DailyVerse] = [
        DailyVerse(text: "Your Lord has not abandoned you, nor has He detested you.", source: "Ad-Duhaa, 3"),
        DailyVerse(text: "For indeed, with hardship will be ease.", source: "Ash-Sharh, 5"),
        DailyVerse(text: "It is You we worship and You we ask for help.", source: "Al-Fatihah, 5"),
        DailyVerse(text: "So remember Me; I will remember you.", source: "Al-Baqarah, 152"),
        DailyVerse(text: "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.", source: "Al-Baqarah, 153"),
        DailyVerse(text: "Our Lord, give us in this world that which is good and in the Hereafter that which is good and protect us from the punishment of the Fire.", source: "Al-Baqarah, 201"),
        DailyVerse(text: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of all existence.", source: "Al-Baqarah, 255"),
        DailyVerse(text: "Allah does not charge a soul except with that within its capacity.", source: "Al-Baqarah, 286"),
        DailyVerse(text: "Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy.", source: "Ali 'Imran, 8"),
        DailyVerse(text: "Who spend in the cause of Allah during ease and hardship and who restrain anger and who pardon the people.", source: "Ali 'Imran, 134"),
        DailyVerse(text: "Who remember Allah while standing or sitting or lying on their sides...", source: "Ali 'Imran, 191"),
        DailyVerse(text: "Indeed, prayer has been decreed upon the believers a decree of specified times.", source: "An-Nisa, 103"),
        DailyVerse(text: "Unquestionably, by the remembrance of Allah hearts are assured.", source: "Ar-Ra'd, 28"),
        DailyVerse(text: "If you are grateful, I will surely increase your favors.", source: "Ibrahim, 7"),
        DailyVerse(text: "Our Lord, forgive me and my parents and the believers the Day the account is established.", source: "Ibrahim, 41"),
        DailyVerse(text: "And your Lord has decreed that you not worship except Him, and to parents, good treatment.", source: "Al-Isra, 23"),
        DailyVerse(text: "Our Lord, grant us from Yourself mercy and prepare for us from our affair right guidance.", source: "Al-Kahf, 10"),
        DailyVerse(text: "My Lord, increase me in knowledge.", source: "Ta-Ha, 114"),
        DailyVerse(text: "And We have not sent you, except as a mercy to the worlds.", source: "Al-Anbiya, 107"),
        DailyVerse(text: "His command is only when He intends a thing that He says to it, 'Be,' and it is.", source: "Ya-Sin, 82"),
        DailyVerse(text: "O My servants who have transgressed against themselves, do not despair of the mercy of Allah.", source: "Az-Zumar, 53"),
        DailyVerse(text: "And your Lord says, \"Call upon Me; I will respond to you.\"", source: "Ghafir, 60"),
        DailyVerse(text: "The believers are but brothers, so make settlement between your brothers.", source: "Al-Hujurat, 10"),
        DailyVerse(text: "Is the reward for good anything but good?", source: "Ar-Rahman, 60"),
        DailyVerse(text: "And indeed, you are of a great moral character.", source: "Al-Qalam, 4"),
        DailyVerse(text: "We have certainly created man in the best of stature.", source: "At-Tin, 4"),
        DailyVerse(text: "The Night of Decree is better than a thousand months.", source: "Al-Qadr, 3"),
        DailyVerse(text: "By time, Indeed, mankind is in loss, Except for those who have believed and done righteous deeds...", source: "Al-Asr, 1-3"),
        DailyVerse(text: "Do not lose heart or despair- if you are true believers you have the upper hand.", source: "Ali 'Imran, 139"),
        DailyVerse(text: "And We are closer to him than his jugular vein.", source: "Qaaf, 16"),
        DailyVerse(text: "And for the sake of your Lord, be patient.", source: "Al-Muddaththir, 7"),
    ]
    
    // MARK: - German (31)
    static let versesDE: [DailyVerse] = [
        DailyVerse(text: "Dein Herr hat dich nicht verlassen und verabscheut dich nicht.", source: "Ad-Duha, 3"),
        DailyVerse(text: "Gewiss, mit der Erschwernis ist Erleichterung.", source: "Asch-Scharh, 5"),
        DailyVerse(text: "Dir allein dienen wir, und Dich allein bitten wir um Hilfe.", source: "Al-Fatiha, 5"),
        DailyVerse(text: "So gedenket Meiner, damit Ich eurer gedenke.", source: "Al-Baqara, 152"),
        DailyVerse(text: "O die ihr glaubt! Sucht Hilfe in der Geduld und im Gebet. Wahrlich, Allah ist mit den Geduldigen.", source: "Al-Baqara, 153"),
        DailyVerse(text: "Unser Herr, gib uns im Diesseits Gutes und im Jenseits Gutes und bewahre uns vor der Strafe des Höllenfeuers.", source: "Al-Baqara, 201"),
        DailyVerse(text: "Allah - es gibt keinen Gott außer Ihm, dem Ewiglebenden, dem Erhalter.", source: "Al-Baqara, 255"),
        DailyVerse(text: "Allah erlegt keiner Seele mehr auf, als sie zu leisten vermag.", source: "Al-Baqara, 286"),
        DailyVerse(text: "Unser Herr, lass unsere Herzen nicht abweichen, nachdem Du uns rechtgeleitet hast.", source: "Ali Imran, 8"),
        DailyVerse(text: "Diejenigen, die in Wohlstand und in der Not spenden, ihren Zorn zurückhalten und den Menschen vergeben.", source: "Ali Imran, 134"),
        DailyVerse(text: "Diejenigen, die Allahs gedenken im Stehen, Sitzen und auf ihren Seiten liegend...", source: "Ali Imran, 191"),
        DailyVerse(text: "Wahrlich, das Gebet ist für die Gläubigen eine Pflicht zu festgelegten Zeiten.", source: "An-Nisa, 103"),
        DailyVerse(text: "Wahrlich, im Gedenken Allahs finden die Herzen Ruhe.", source: "Ar-Ra'd, 28"),
        DailyVerse(text: "Wenn ihr dankbar seid, so werde Ich euch ganz gewiss noch mehr geben.", source: "Ibrahim, 7"),
        DailyVerse(text: "Unser Herr, vergib mir und meinen Eltern und den Gläubigen an dem Tag, da die Abrechnung stattfindet.", source: "Ibrahim, 41"),
        DailyVerse(text: "Dein Herr hat bestimmt, dass ihr nur Ihm dienen und den Eltern Gutes tun sollt.", source: "Al-Isra, 23"),
        DailyVerse(text: "Unser Herr, gib uns Barmherzigkeit von Dir aus und bereite uns in unserer Angelegenheit einen rechten Weg.", source: "Al-Kahf, 10"),
        DailyVerse(text: "Mein Herr, mehre mein Wissen.", source: "Ta-Ha, 114"),
        DailyVerse(text: "Und Wir haben dich nur als Barmherzigkeit für die Weltenbewohner gesandt.", source: "Al-Anbiya, 107"),
        DailyVerse(text: "Sein Befehl, wenn Er ein Ding will, ist nur, zu ihm zu sagen: 'Sei!', und so ist es.", source: "Ya-Sin, 82"),
        DailyVerse(text: "O Meine Diener, die ihr gegen euch selbst maßlos gewesen seid, verliert nicht die Hoffnung auf Allahs Barmherzigkeit.", source: "Az-Zumar, 53"),
        DailyVerse(text: "Euer Herr sagt: Ruft Mich an, so werde Ich euch Erhörung gewähren.", source: "Ghafir, 60"),
        DailyVerse(text: "Die Gläubigen sind doch Brüder. So stiftet Frieden zwischen euren Brüdern.", source: "Al-Hudschurat, 10"),
        DailyVerse(text: "Gibt es für das Gute einen anderen Lohn als das Gute?", source: "Ar-Rahman, 60"),
        DailyVerse(text: "Und du bist wahrlich von großartiger Wesensart.", source: "Al-Qalam, 4"),
        DailyVerse(text: "Wir haben den Menschen ja in schönster Gestaltung erschaffen.", source: "At-Tin, 4"),
        DailyVerse(text: "Die Nacht der Bestimmung ist besser als tausend Monate.", source: "Al-Qadr, 3"),
        DailyVerse(text: "Beim Zeitalter! Der Mensch befindet sich wahrlich in Verlust, außer denjenigen, die glauben und rechtschaffene Werke tun...", source: "Al-Asr, 1-3"),
        DailyVerse(text: "Und verliert nicht den Mut und seid nicht traurig; ihr seid die Oberhand Habenden, wenn ihr gläubig seid.", source: "Ali Imran, 139"),
        DailyVerse(text: "Und Wir sind ihm näher als seine Halsschlagader.", source: "Qaf, 16"),
        DailyVerse(text: "Und für deinen Herrn sei geduldig.", source: "Al-Muddaththir, 7"),
    ]
    
    // MARK: - Russian (31)
    static let versesRU: [DailyVerse] = [
        DailyVerse(text: "Твой Господь не покинул тебя и не возненавидел.", source: "Ад-Духа, 3"),
        DailyVerse(text: "Воистину, за каждой тягостью наступает облегчение.", source: "Аш-Шарх, 5"),
        DailyVerse(text: "Тебе одному мы поклоняемся и Тебя одного молим о помощи.", source: "Аль-Фатиха, 5"),
        DailyVerse(text: "Поминайте Меня, и Я буду помнить вас.", source: "Аль-Бакара, 152"),
        DailyVerse(text: "О те, которые уверовали! Обратитесь за помощью к терпению и молитве. Поистине, Аллах - с терпеливыми.", source: "Аль-Бакара, 153"),
        DailyVerse(text: "Господь наш! Даруй нам благо в этом мире и благо в Последней жизни и защити нас от мучений в Огне.", source: "Аль-Бакара, 201"),
        DailyVerse(text: "Аллах - нет божества, кроме Него, Живого, Поддерживающего жизнь.", source: "Аль-Бакара, 255"),
        DailyVerse(text: "Аллах не возлагает на человека сверх его возможностей.", source: "Аль-Бакара, 286"),
        DailyVerse(text: "Господь наш! Не уклоняй наши сердца в сторону после того, как Ты наставил нас на прямой путь.", source: "Аль Имран, 8"),
        DailyVerse(text: "Которые делают пожертвования в радости и в горе, сдерживают гнев и прощают людей.", source: "Аль Имран, 134"),
        DailyVerse(text: "Которые поминают Аллаха стоя, сидя и на боку...", source: "Аль Имран, 191"),
        DailyVerse(text: "Воистину, молитва предписана верующим в определенное время.", source: "Ан-Ниса, 103"),
        DailyVerse(text: "Разве не поминанием Аллаха утешаются сердца?", source: "Ар-Раад, 28"),
        DailyVerse(text: "Если вы будете благодарны, то Я одарю вас еще большим.", source: "Ибрахим, 7"),
        DailyVerse(text: "Господь наш! Прости меня, моих родителей и верующих в тот день, когда будет представлен счет.", source: "Ибрахим, 41"),
        DailyVerse(text: "Твой Господь предписал вам не поклоняться никому, кроме Него, и делать добро родителям.", source: "Аль-Исра, 23"),
        DailyVerse(text: "Господь наш! Даруй нам милость от Себя и устрой наше дело наилучшим образом.", source: "Аль-Кахф, 10"),
        DailyVerse(text: "Господи! Приумножь мои знания.", source: "Та-Ха, 114"),
        DailyVerse(text: "Мы отправили тебя только в качестве милости к мирам.", source: "Аль-Анбия, 107"),
        DailyVerse(text: "Когда Он желает чего-либо, то стоит Ему сказать: «Будь!» — как это сбывается.", source: "Йа Син, 82"),
        DailyVerse(text: "О Мои рабы, которые преступили границы во вред самим себе! Не отчаивайтесь в милости Аллаха.", source: "Аз-Зумар, 53"),
        DailyVerse(text: "Ваш Господь сказал: «Взывайте ко Мне, и Я отвечу вам».", source: "Гафир, 60"),
        DailyVerse(text: "Воистину, верующие - братья. Посему примиряйте братьев.", source: "Аль-Худжурат, 10"),
        DailyVerse(text: "Воздают ли за добро иначе, чем добром?", source: "Ар-Рахман, 60"),
        DailyVerse(text: "Воистину, твой нрав превосходен.", source: "Аль-Калам, 4"),
        DailyVerse(text: "Мы сотворили человека в прекраснейшем облике.", source: "Ат-Тин, 4"),
        DailyVerse(text: "Ночь предопределения лучше тысячи месяцев.", source: "Аль-Кадр, 3"),
        DailyVerse(text: "Клянусь временем! Воистину, каждый человек в убытке, кроме тех, которые уверовали и совершали праведные деяния...", source: "Аль-Аср, 1-3"),
        DailyVerse(text: "Не слабейте и не печальтесь, в то время как вы будете на высоте, если вы действительно являетесь верующими.", source: "Аль Имран, 139"),
        DailyVerse(text: "И Мы ближе к нему, чем яремная вена.", source: "Каф, 16"),
        DailyVerse(text: "Ради своего Господа будь терпелив.", source: "Аль-Муддассир, 7"),
    ]
    
    // MARK: - Azerbaijani (31)
    static let versesAZ: [DailyVerse] = [
        DailyVerse(text: "Rəbbin səni tərk etməyib və sənə acığı tutmayıb.", source: "Duha Surəsi, 3"),
        DailyVerse(text: "Şübhəsiz ki, hər çətinlikdən sonra bir asanlıq gəlir!", source: "İnşirah Surəsi, 5"),
        DailyVerse(text: "Biz yalnız Sənə ibadət edir və yalnız Səndən kömək diləyirik.", source: "Fatihə Surəsi, 5"),
        DailyVerse(text: "Məni anın ki, Mən də sizi anım.", source: "Bəqərə Surəsi, 152"),
        DailyVerse(text: "Ey iman gətirənlər! Səbir etmək və namaz qılmaqla Allahdan kömək diləyin. Həqiqətən, Allah səbir edənlərlədir.", source: "Bəqərə Surəsi, 153"),
        DailyVerse(text: "Ey Rəbbimiz! Bizə bu dünyada da, axirətdə də gözəllik ver və bizi cəhənnəm əzabından qoru!", source: "Bəqərə Surəsi, 201"),
        DailyVerse(text: "Allah Özündən başqa heç bir məbud olmayan, əbədi Yaşayan, bütün varlıqları Qoruyandır.", source: "Bəqərə Surəsi, 255"),
        DailyVerse(text: "Allah hər kəsi yalnız onun qüvvəsi çatdığı qədər mükəlləf edər.", source: "Bəqərə Surəsi, 286"),
        DailyVerse(text: "Ey Rəbbimiz! Bizi doğru yola yönəltdikdən sonra qəlblərimizi sapdırma.", source: "Ali-İmran Surəsi, 8"),
        DailyVerse(text: "O kəslər ki, asanlıqda da, çətinlikdə də xərcləyirlər, qəzəblərini boğur və insanları bağışlayırlar.", source: "Ali-İmran Surəsi, 134"),
        DailyVerse(text: "Onlar ayaq üstə, oturarkən və yanları üzərində uzanarkən Allahı anarlar...", source: "Ali-İmran Surəsi, 191"),
        DailyVerse(text: "Həqiqətən, namaz möminlərə müəyyən olunmuş vaxtlarda fərz edilmişdir.", source: "Nisa Surəsi, 103"),
        DailyVerse(text: "Bilin ki, qəlblər yalnız Allahı zikr etməklə aram tapar!", source: "Rəd Surəsi, 28"),
        DailyVerse(text: "Əgər şükür etsəniz, sizə (olan nemətimi) mütləq artıracağam.", source: "İbrahim Surəsi, 7"),
        DailyVerse(text: "Ey Rəbbimiz! Haqq-hesab çəkiləcəyi gün məni, ata-anamı və möminləri bağışla!", source: "İbrahim Surəsi, 41"),
        DailyVerse(text: "Rəbbin yalnız Ona ibadət etməyi və ata-anaya yaxşılıq etməyi əmr etdi.", source: "İsra Surəsi, 23"),
        DailyVerse(text: "Ey Rəbbimiz! Bizə Öz tərəfindən bir mərhəmət bəxş et və işimizdə bizə doğru yolu göstər.", source: "Kəhf Surəsi, 10"),
        DailyVerse(text: "Ey Rəbbim! Mənim elmimi artır.", source: "Taha Surəsi, 114"),
        DailyVerse(text: "Biz səni aləmlərə yalnız bir rəhmət olaraq göndərdik.", source: "Ənbiya Surəsi, 107"),
        DailyVerse(text: "O, hər hansı bir şeyi yaratmaq istədikdə, ona yalnız \"Ol!\" deyər, o da dərhal olar.", source: "Yasin Surəsi, 82"),
        DailyVerse(text: "Ey öz canlarına zülm etmiş qullarım! Allahın rəhmətindən ümidinizi kəsməyin.", source: "Zümər Surəsi, 53"),
        DailyVerse(text: "Rəbbiniz dedi: Mənə dua edin, Mən də sizin dualarınızı qəbul edim!", source: "Mömin Surəsi, 60"),
        DailyVerse(text: "Möminlər, həqiqətən də, qardaşdırlar. Elə isə qardaşlarınızı barışdırın.", source: "Hucurat Surəsi, 10"),
        DailyVerse(text: "Yaxşılığın əvəzi ancaq yaxşılıq deyilmi?!", source: "Rəhman Surəsi, 60"),
        DailyVerse(text: "Sən həqiqətən, böyük bir əxlaq sahibisən!", source: "Qələm Surəsi, 4"),
        DailyVerse(text: "Biz insanı ən gözəl biçimdə yaratdıq.", source: "Tin Surəsi, 4"),
        DailyVerse(text: "Qədr gecəsi min aydan xeyirlidir.", source: "Qədir Surəsi, 3"),
        DailyVerse(text: "And olsun zamana! Həqiqətən, insan ziyandadır. Lakin iman gətirib yaxşı işlər görənlər istisnadır...", source: "Əsr Surəsi, 1-3"),
        DailyVerse(text: "Zəifləməyin və qəmgin rəftarda olmayın. Çünki əgər inanırsınızsa, siz üstünsünüz.", source: "Ali-İmran Surəsi, 139"),
        DailyVerse(text: "Və Biz ona şah damarından da yaxınıq.", source: "Qaf Surəsi, 16"),
        DailyVerse(text: "Rəbbin üçün səbir et.", source: "Müddəssir Surəsi, 7"),
    ]
    
    // MARK: - Arabic (31)
    static let versesAR: [DailyVerse] = [
        DailyVerse(text: "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ.", source: "الضحى، 3"),
        DailyVerse(text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا.", source: "الشرح، 5"),
        DailyVerse(text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ.", source: "الفاتحة، 5"),
        DailyVerse(text: "فَاذْكُرُونِي أَذْكُرْكُمْ.", source: "البقرة، 152"),
        DailyVerse(text: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ.", source: "البقرة، 153"),
        DailyVerse(text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ.", source: "البقرة، 201"),
        DailyVerse(text: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ.", source: "البقرة، 255"),
        DailyVerse(text: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا.", source: "البقرة، 286"),
        DailyVerse(text: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً.", source: "آل عمران، 8"),
        DailyVerse(text: "الَّذِينَ يُنفِقُونَ فِي السَّرَّاءِ وَالضَّرَّاءِ وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ.", source: "آل عمران، 134"),
        DailyVerse(text: "الَّذِينَ يَذْكُرُونَ اللَّهَ قِيَامًا وَقُعُودًا وَعَلَىٰ جُنُوبِهِمْ...", source: "آل عمران، 191"),
        DailyVerse(text: "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا.", source: "النساء، 103"),
        DailyVerse(text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ.", source: "الرعد، 28"),
        DailyVerse(text: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ.", source: "إبراهيم، 7"),
        DailyVerse(text: "رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ.", source: "إبراهيم، 41"),
        DailyVerse(text: "وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا.", source: "الإسراء، 23"),
        DailyVerse(text: "رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا.", source: "الكهف، 10"),
        DailyVerse(text: "رَّبِّ زِدْنِي عِلْمًا.", source: "طه، 114"),
        DailyVerse(text: "وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ.", source: "الأنبياء، 107"),
        DailyVerse(text: "إِنَّمَا أَمْرُهُ إِذَا أَرَادَ شَيْئًا أَن يَقُولَ لَهُ كُن فَيَكُونُ.", source: "يس، 82"),
        DailyVerse(text: "يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ.", source: "الزمر، 53"),
        DailyVerse(text: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ.", source: "غافر، 60"),
        DailyVerse(text: "إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ فَأَصْلِحُوا بَيْنَ أَخَوَيْكُمْ.", source: "الحجرات، 10"),
        DailyVerse(text: "هَلْ جَزَاءُ الْإِحْسَانِ إِلَّا الْإِحْسَانُ.", source: "الرحمن، 60"),
        DailyVerse(text: "وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ.", source: "القلم، 4"),
        DailyVerse(text: "لَقَدْ خَلَقْنَا الْإِنسَانَ فِي أَحْسَنِ تَقْوِيمٍ.", source: "التين، 4"),
        DailyVerse(text: "لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ.", source: "القدر، 3"),
        DailyVerse(text: "وَالْعَصْرِ ۝ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ ۝ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ...", source: "العصر، 1-3"),
        DailyVerse(text: "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ.", source: "آل عمران، 139"),
        DailyVerse(text: "وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ.", source: "ق، 16"),
        DailyVerse(text: "وَلِرَبِّكَ فَاصْبِرْ.", source: "المدثر، 7"),
    ]
    
    // MARK: - Day-based Verse Selection (language-aware)
    
    static func verseForDate(_ date: Date) -> (verse: DailyVerse, dayNumber: Int) {
        let lang = WidgetLanguageHelper.currentLanguage
        let verses = allVerses(for: lang)
        let calendar = Calendar.current
        let dayOfYear = calendar.ordinality(of: .day, in: .year, for: date) ?? 1
        let index = abs(dayOfYear) % verses.count
        return (verses[index], index + 1)
    }
    
    // MARK: - Placeholder
    
    static var placeholder: VerseEntry {
        let (verse, day) = verseForDate(Date())
        return VerseEntry(
            date: Date(),
            verse: verse,
            dayNumber: day,
            totalVerses: allVerses(for: WidgetLanguageHelper.currentLanguage).count
        )
    }
}
