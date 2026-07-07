package com.islamiyoldas.app;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.Calendar;
import java.util.Locale;

/**
 * Widget içerik verileri ve gün/saat bazlı seçim mantığı.
 * iOS karşılıkları: VerseEntry / HourlyVerseEntry / MotivationEntry / EsmaEntry (IslamiWidgets).
 * Bu dosya scripts ile Swift kaynaklarından üretildi — elle düzenlerken iOS ile pariteyi koru.
 */
public final class WidgetData {

    private WidgetData() {}

    private static final String[] SUPPORTED_LANGUAGES = { "tr", "en", "de", "ru", "az", "ar" };

    private static final String[][] VERSES_TR = {
        { "Rabbin seni terk etmedi ve sana darılmadı.", "Duhâ Suresi, 3" },
        { "Şüphesiz zorlukla beraber bir kolaylık vardır.", "İnşirâh Suresi, 5" },
        { "Yalnız sana ibadet eder, yalnız senden yardım dileriz.", "Fâtiha Suresi, 5" },
        { "Öyleyse beni anın ki ben de sizi anayım.", "Bakara Suresi, 152" },
        { "Ey iman edenler! Sabır ve namaz ile Allah'tan yardım isteyin. Şüphesiz Allah sabredenlerle beraberdir.", "Bakara Suresi, 153" },
        { "Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi ateş azabından koru.", "Bakara Suresi, 201" },
        { "Allah... O'ndan başka ilah yoktur. O, hayydır, kayyûmdur.", "Bakara Suresi, 255" },
        { "Allah hiçbir nefsi gücünün yettiğinden başkasıyla yükümlü tutmaz.", "Bakara Suresi, 286" },
        { "Rabbimiz! Bizi hidayete erdirdikten sonra kalplerimizi eğriltme. Bize katından bir rahmet bağışla.", "Âl-i İmrân Suresi, 8" },
        { "Onlar bollukta ve darlıkta Allah yolunda harcayanlar, öfkelerini yenenler ve insanları affedenlerdir.", "Âl-i İmrân Suresi, 134" },
        { "Onlar ayaktayken, otururken ve yanları üzerine yatarken Allah'ı anarlar...", "Âl-i İmrân Suresi, 191" },
        { "Şüphesiz namaz, müminlere belirli vakitlerde farz kılınmıştır.", "Nisâ Suresi, 103" },
        { "Bilesiniz ki kalpler ancak Allah'ı anmakla huzur bulur.", "Ra'd Suresi, 28" },
        { "Eğer şükrederseniz, elbette size nimetimi artırırım.", "İbrâhîm Suresi, 7" },
        { "Rabbimiz! Hesap görülecek günde, beni, ana babamı ve inananları bağışla.", "İbrâhîm Suresi, 41" },
        { "Rabbin, yalnız kendisine ibadet etmenizi ve ana babaya iyilik yapmanızı kesin olarak emretti.", "İsrâ Suresi, 23" },
        { "Rabbimiz! Bize katından bir rahmet ver ve şu işimizde bize doğruyu göster.", "Kehf Suresi, 10" },
        { "Rabbim! İlmimi artır.", "Tâ-Hâ Suresi, 114" },
        { "Biz seni ancak âlemlere rahmet olarak gönderdik.", "Enbiyâ Suresi, 107" },
        { "Bir şeyi dilediği zaman O'nun emri o şeye ancak 'Ol!' demektir, o da hemen oluverir.", "Yâsîn Suresi, 82" },
        { "Ey kendi aleyhlerine haddi aşan kullarım! Allah'ın rahmetinden ümit kesmeyin.", "Zümer Suresi, 53" },
        { "Rabbiniz şöyle buyurdu: Bana dua edin, duanıza cevap vereyim.", "Mü'min Suresi, 60" },
        { "Müminler ancak kardeştirler. Öyleyse kardeşlerinizin arasını düzeltin.", "Hucurât Suresi, 10" },
        { "İyiliğin karşılığı, yalnız iyilik değil midir?", "Rahmân Suresi, 60" },
        { "Sen elbette yüce bir ahlâk üzeresin.", "Kalem Suresi, 4" },
        { "Biz insanı en güzel biçimde yarattık.", "Tîn Suresi, 4" },
        { "Kadir gecesi, bin aydan daha hayırlıdır.", "Kadir Suresi, 3" },
        { "Zamana andolsun ki, insan ziyandadır. Ancak iman edip salih ameller işleyenler müstesna.", "Asr Suresi, 1-3" },
        { "Gevşemeyin, hüzünlenmeyin. Eğer iman etmiş kimseler iseniz üstün olan sizsiniz.", "Âl-i İmrân Suresi, 139" },
        { "Ve Biz insana şahdamarından daha yakınız.", "Kâf Suresi, 16" },
        { "Rabbinin rızası için sabret.", "Müddessir Suresi, 7" },
    };

    private static final String[][] VERSES_EN = {
        { "Your Lord has not abandoned you, nor has He detested you.", "Ad-Duhaa, 3" },
        { "For indeed, with hardship will be ease.", "Ash-Sharh, 5" },
        { "It is You we worship and You we ask for help.", "Al-Fatihah, 5" },
        { "So remember Me; I will remember you.", "Al-Baqarah, 152" },
        { "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.", "Al-Baqarah, 153" },
        { "Our Lord, give us in this world that which is good and in the Hereafter that which is good and protect us from the punishment of the Fire.", "Al-Baqarah, 201" },
        { "Allah - there is no deity except Him, the Ever-Living, the Sustainer of all existence.", "Al-Baqarah, 255" },
        { "Allah does not charge a soul except with that within its capacity.", "Al-Baqarah, 286" },
        { "Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy.", "Ali 'Imran, 8" },
        { "Who spend in the cause of Allah during ease and hardship and who restrain anger and who pardon the people.", "Ali 'Imran, 134" },
        { "Who remember Allah while standing or sitting or lying on their sides...", "Ali 'Imran, 191" },
        { "Indeed, prayer has been decreed upon the believers a decree of specified times.", "An-Nisa, 103" },
        { "Unquestionably, by the remembrance of Allah hearts are assured.", "Ar-Ra'd, 28" },
        { "If you are grateful, I will surely increase your favors.", "Ibrahim, 7" },
        { "Our Lord, forgive me and my parents and the believers the Day the account is established.", "Ibrahim, 41" },
        { "And your Lord has decreed that you not worship except Him, and to parents, good treatment.", "Al-Isra, 23" },
        { "Our Lord, grant us from Yourself mercy and prepare for us from our affair right guidance.", "Al-Kahf, 10" },
        { "My Lord, increase me in knowledge.", "Ta-Ha, 114" },
        { "And We have not sent you, except as a mercy to the worlds.", "Al-Anbiya, 107" },
        { "His command is only when He intends a thing that He says to it, 'Be,' and it is.", "Ya-Sin, 82" },
        { "O My servants who have transgressed against themselves, do not despair of the mercy of Allah.", "Az-Zumar, 53" },
        { "And your Lord says, \"Call upon Me; I will respond to you.\"", "Ghafir, 60" },
        { "The believers are but brothers, so make settlement between your brothers.", "Al-Hujurat, 10" },
        { "Is the reward for good anything but good?", "Ar-Rahman, 60" },
        { "And indeed, you are of a great moral character.", "Al-Qalam, 4" },
        { "We have certainly created man in the best of stature.", "At-Tin, 4" },
        { "The Night of Decree is better than a thousand months.", "Al-Qadr, 3" },
        { "By time, Indeed, mankind is in loss, Except for those who have believed and done righteous deeds...", "Al-Asr, 1-3" },
        { "Do not lose heart or despair- if you are true believers you have the upper hand.", "Ali 'Imran, 139" },
        { "And We are closer to him than his jugular vein.", "Qaaf, 16" },
        { "And for the sake of your Lord, be patient.", "Al-Muddaththir, 7" },
    };

    private static final String[][] VERSES_DE = {
        { "Dein Herr hat dich nicht verlassen und verabscheut dich nicht.", "Ad-Duha, 3" },
        { "Gewiss, mit der Erschwernis ist Erleichterung.", "Asch-Scharh, 5" },
        { "Dir allein dienen wir, und Dich allein bitten wir um Hilfe.", "Al-Fatiha, 5" },
        { "So gedenket Meiner, damit Ich eurer gedenke.", "Al-Baqara, 152" },
        { "O die ihr glaubt! Sucht Hilfe in der Geduld und im Gebet. Wahrlich, Allah ist mit den Geduldigen.", "Al-Baqara, 153" },
        { "Unser Herr, gib uns im Diesseits Gutes und im Jenseits Gutes und bewahre uns vor der Strafe des Höllenfeuers.", "Al-Baqara, 201" },
        { "Allah - es gibt keinen Gott außer Ihm, dem Ewiglebenden, dem Erhalter.", "Al-Baqara, 255" },
        { "Allah erlegt keiner Seele mehr auf, als sie zu leisten vermag.", "Al-Baqara, 286" },
        { "Unser Herr, lass unsere Herzen nicht abweichen, nachdem Du uns rechtgeleitet hast.", "Ali Imran, 8" },
        { "Diejenigen, die in Wohlstand und in der Not spenden, ihren Zorn zurückhalten und den Menschen vergeben.", "Ali Imran, 134" },
        { "Diejenigen, die Allahs gedenken im Stehen, Sitzen und auf ihren Seiten liegend...", "Ali Imran, 191" },
        { "Wahrlich, das Gebet ist für die Gläubigen eine Pflicht zu festgelegten Zeiten.", "An-Nisa, 103" },
        { "Wahrlich, im Gedenken Allahs finden die Herzen Ruhe.", "Ar-Ra'd, 28" },
        { "Wenn ihr dankbar seid, so werde Ich euch ganz gewiss noch mehr geben.", "Ibrahim, 7" },
        { "Unser Herr, vergib mir und meinen Eltern und den Gläubigen an dem Tag, da die Abrechnung stattfindet.", "Ibrahim, 41" },
        { "Dein Herr hat bestimmt, dass ihr nur Ihm dienen und den Eltern Gutes tun sollt.", "Al-Isra, 23" },
        { "Unser Herr, gib uns Barmherzigkeit von Dir aus und bereite uns in unserer Angelegenheit einen rechten Weg.", "Al-Kahf, 10" },
        { "Mein Herr, mehre mein Wissen.", "Ta-Ha, 114" },
        { "Und Wir haben dich nur als Barmherzigkeit für die Weltenbewohner gesandt.", "Al-Anbiya, 107" },
        { "Sein Befehl, wenn Er ein Ding will, ist nur, zu ihm zu sagen: 'Sei!', und so ist es.", "Ya-Sin, 82" },
        { "O Meine Diener, die ihr gegen euch selbst maßlos gewesen seid, verliert nicht die Hoffnung auf Allahs Barmherzigkeit.", "Az-Zumar, 53" },
        { "Euer Herr sagt: Ruft Mich an, so werde Ich euch Erhörung gewähren.", "Ghafir, 60" },
        { "Die Gläubigen sind doch Brüder. So stiftet Frieden zwischen euren Brüdern.", "Al-Hudschurat, 10" },
        { "Gibt es für das Gute einen anderen Lohn als das Gute?", "Ar-Rahman, 60" },
        { "Und du bist wahrlich von großartiger Wesensart.", "Al-Qalam, 4" },
        { "Wir haben den Menschen ja in schönster Gestaltung erschaffen.", "At-Tin, 4" },
        { "Die Nacht der Bestimmung ist besser als tausend Monate.", "Al-Qadr, 3" },
        { "Beim Zeitalter! Der Mensch befindet sich wahrlich in Verlust, außer denjenigen, die glauben und rechtschaffene Werke tun...", "Al-Asr, 1-3" },
        { "Und verliert nicht den Mut und seid nicht traurig; ihr seid die Oberhand Habenden, wenn ihr gläubig seid.", "Ali Imran, 139" },
        { "Und Wir sind ihm näher als seine Halsschlagader.", "Qaf, 16" },
        { "Und für deinen Herrn sei geduldig.", "Al-Muddaththir, 7" },
    };

    private static final String[][] VERSES_RU = {
        { "Твой Господь не покинул тебя и не возненавидел.", "Ад-Духа, 3" },
        { "Воистину, за каждой тягостью наступает облегчение.", "Аш-Шарх, 5" },
        { "Тебе одному мы поклоняемся и Тебя одного молим о помощи.", "Аль-Фатиха, 5" },
        { "Поминайте Меня, и Я буду помнить вас.", "Аль-Бакара, 152" },
        { "О те, которые уверовали! Обратитесь за помощью к терпению и молитве. Поистине, Аллах - с терпеливыми.", "Аль-Бакара, 153" },
        { "Господь наш! Даруй нам благо в этом мире и благо в Последней жизни и защити нас от мучений в Огне.", "Аль-Бакара, 201" },
        { "Аллах - нет божества, кроме Него, Живого, Поддерживающего жизнь.", "Аль-Бакара, 255" },
        { "Аллах не возлагает на человека сверх его возможностей.", "Аль-Бакара, 286" },
        { "Господь наш! Не уклоняй наши сердца в сторону после того, как Ты наставил нас на прямой путь.", "Аль Имран, 8" },
        { "Которые делают пожертвования в радости и в горе, сдерживают гнев и прощают людей.", "Аль Имран, 134" },
        { "Которые поминают Аллаха стоя, сидя и на боку...", "Аль Имран, 191" },
        { "Воистину, молитва предписана верующим в определенное время.", "Ан-Ниса, 103" },
        { "Разве не поминанием Аллаха утешаются сердца?", "Ар-Раад, 28" },
        { "Если вы будете благодарны, то Я одарю вас еще большим.", "Ибрахим, 7" },
        { "Господь наш! Прости меня, моих родителей и верующих в тот день, когда будет представлен счет.", "Ибрахим, 41" },
        { "Твой Господь предписал вам не поклоняться никому, кроме Него, и делать добро родителям.", "Аль-Исра, 23" },
        { "Господь наш! Даруй нам милость от Себя и устрой наше дело наилучшим образом.", "Аль-Кахф, 10" },
        { "Господи! Приумножь мои знания.", "Та-Ха, 114" },
        { "Мы отправили тебя только в качестве милости к мирам.", "Аль-Анбия, 107" },
        { "Когда Он желает чего-либо, то стоит Ему сказать: «Будь!» — как это сбывается.", "Йа Син, 82" },
        { "О Мои рабы, которые преступили границы во вред самим себе! Не отчаивайтесь в милости Аллаха.", "Аз-Зумар, 53" },
        { "Ваш Господь сказал: «Взывайте ко Мне, и Я отвечу вам».", "Гафир, 60" },
        { "Воистину, верующие - братья. Посему примиряйте братьев.", "Аль-Худжурат, 10" },
        { "Воздают ли за добро иначе, чем добром?", "Ар-Рахман, 60" },
        { "Воистину, твой нрав превосходен.", "Аль-Калам, 4" },
        { "Мы сотворили человека в прекраснейшем облике.", "Ат-Тин, 4" },
        { "Ночь предопределения лучше тысячи месяцев.", "Аль-Кадр, 3" },
        { "Клянусь временем! Воистину, каждый человек в убытке, кроме тех, которые уверовали и совершали праведные деяния...", "Аль-Аср, 1-3" },
        { "Не слабейте и не печальтесь, в то время как вы будете на высоте, если вы действительно являетесь верующими.", "Аль Имран, 139" },
        { "И Мы ближе к нему, чем яремная вена.", "Каф, 16" },
        { "Ради своего Господа будь терпелив.", "Аль-Муддассир, 7" },
    };

    private static final String[][] VERSES_AZ = {
        { "Rəbbin səni tərk etməyib və sənə acığı tutmayıb.", "Duha Surəsi, 3" },
        { "Şübhəsiz ki, hər çətinlikdən sonra bir asanlıq gəlir!", "İnşirah Surəsi, 5" },
        { "Biz yalnız Sənə ibadət edir və yalnız Səndən kömək diləyirik.", "Fatihə Surəsi, 5" },
        { "Məni anın ki, Mən də sizi anım.", "Bəqərə Surəsi, 152" },
        { "Ey iman gətirənlər! Səbir etmək və namaz qılmaqla Allahdan kömək diləyin. Həqiqətən, Allah səbir edənlərlədir.", "Bəqərə Surəsi, 153" },
        { "Ey Rəbbimiz! Bizə bu dünyada da, axirətdə də gözəllik ver və bizi cəhənnəm əzabından qoru!", "Bəqərə Surəsi, 201" },
        { "Allah Özündən başqa heç bir məbud olmayan, əbədi Yaşayan, bütün varlıqları Qoruyandır.", "Bəqərə Surəsi, 255" },
        { "Allah hər kəsi yalnız onun qüvvəsi çatdığı qədər mükəlləf edər.", "Bəqərə Surəsi, 286" },
        { "Ey Rəbbimiz! Bizi doğru yola yönəltdikdən sonra qəlblərimizi sapdırma.", "Ali-İmran Surəsi, 8" },
        { "O kəslər ki, asanlıqda da, çətinlikdə də xərcləyirlər, qəzəblərini boğur və insanları bağışlayırlar.", "Ali-İmran Surəsi, 134" },
        { "Onlar ayaq üstə, oturarkən və yanları üzərində uzanarkən Allahı anarlar...", "Ali-İmran Surəsi, 191" },
        { "Həqiqətən, namaz möminlərə müəyyən olunmuş vaxtlarda fərz edilmişdir.", "Nisa Surəsi, 103" },
        { "Bilin ki, qəlblər yalnız Allahı zikr etməklə aram tapar!", "Rəd Surəsi, 28" },
        { "Əgər şükür etsəniz, sizə (olan nemətimi) mütləq artıracağam.", "İbrahim Surəsi, 7" },
        { "Ey Rəbbimiz! Haqq-hesab çəkiləcəyi gün məni, ata-anamı və möminləri bağışla!", "İbrahim Surəsi, 41" },
        { "Rəbbin yalnız Ona ibadət etməyi və ata-anaya yaxşılıq etməyi əmr etdi.", "İsra Surəsi, 23" },
        { "Ey Rəbbimiz! Bizə Öz tərəfindən bir mərhəmət bəxş et və işimizdə bizə doğru yolu göstər.", "Kəhf Surəsi, 10" },
        { "Ey Rəbbim! Mənim elmimi artır.", "Taha Surəsi, 114" },
        { "Biz səni aləmlərə yalnız bir rəhmət olaraq göndərdik.", "Ənbiya Surəsi, 107" },
        { "O, hər hansı bir şeyi yaratmaq istədikdə, ona yalnız \"Ol!\" deyər, o da dərhal olar.", "Yasin Surəsi, 82" },
        { "Ey öz canlarına zülm etmiş qullarım! Allahın rəhmətindən ümidinizi kəsməyin.", "Zümər Surəsi, 53" },
        { "Rəbbiniz dedi: Mənə dua edin, Mən də sizin dualarınızı qəbul edim!", "Mömin Surəsi, 60" },
        { "Möminlər, həqiqətən də, qardaşdırlar. Elə isə qardaşlarınızı barışdırın.", "Hucurat Surəsi, 10" },
        { "Yaxşılığın əvəzi ancaq yaxşılıq deyilmi?!", "Rəhman Surəsi, 60" },
        { "Sən həqiqətən, böyük bir əxlaq sahibisən!", "Qələm Surəsi, 4" },
        { "Biz insanı ən gözəl biçimdə yaratdıq.", "Tin Surəsi, 4" },
        { "Qədr gecəsi min aydan xeyirlidir.", "Qədir Surəsi, 3" },
        { "And olsun zamana! Həqiqətən, insan ziyandadır. Lakin iman gətirib yaxşı işlər görənlər istisnadır...", "Əsr Surəsi, 1-3" },
        { "Zəifləməyin və qəmgin rəftarda olmayın. Çünki əgər inanırsınızsa, siz üstünsünüz.", "Ali-İmran Surəsi, 139" },
        { "Və Biz ona şah damarından da yaxınıq.", "Qaf Surəsi, 16" },
        { "Rəbbin üçün səbir et.", "Müddəssir Surəsi, 7" },
    };

    private static final String[][] VERSES_AR = {
        { "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ.", "الضحى، 3" },
        { "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا.", "الشرح، 5" },
        { "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ.", "الفاتحة، 5" },
        { "فَاذْكُرُونِي أَذْكُرْكُمْ.", "البقرة، 152" },
        { "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ.", "البقرة، 153" },
        { "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ.", "البقرة، 201" },
        { "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ.", "البقرة، 255" },
        { "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا.", "البقرة، 286" },
        { "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً.", "آل عمران، 8" },
        { "الَّذِينَ يُنفِقُونَ فِي السَّرَّاءِ وَالضَّرَّاءِ وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ.", "آل عمران، 134" },
        { "الَّذِينَ يَذْكُرُونَ اللَّهَ قِيَامًا وَقُعُودًا وَعَلَىٰ جُنُوبِهِمْ...", "آل عمران، 191" },
        { "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا.", "النساء، 103" },
        { "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ.", "الرعد، 28" },
        { "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ.", "إبراهيم، 7" },
        { "رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ.", "إبراهيم، 41" },
        { "وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا.", "الإسراء، 23" },
        { "رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا.", "الكهف، 10" },
        { "رَّبِّ زِدْنِي عِلْمًا.", "طه، 114" },
        { "وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ.", "الأنبياء، 107" },
        { "إِنَّمَا أَمْرُهُ إِذَا أَرَادَ شَيْئًا أَن يَقُولَ لَهُ كُن فَيَكُونُ.", "يس، 82" },
        { "يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ.", "الزمر، 53" },
        { "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ.", "غافر، 60" },
        { "إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ فَأَصْلِحُوا بَيْنَ أَخَوَيْكُمْ.", "الحجرات، 10" },
        { "هَلْ جَزَاءُ الْإِحْسَانِ إِلَّا الْإِحْسَانُ.", "الرحمن، 60" },
        { "وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ.", "القلم، 4" },
        { "لَقَدْ خَلَقْنَا الْإِنسَانَ فِي أَحْسَنِ تَقْوِيمٍ.", "التين، 4" },
        { "لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ.", "القدر، 3" },
        { "وَالْعَصْرِ ۝ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ ۝ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ...", "العصر، 1-3" },
        { "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ.", "آل عمران، 139" },
        { "وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ.", "ق، 16" },
        { "وَلِرَبِّكَ فَاصْبِرْ.", "المدثر، 7" },
    };

    private static final String[][] MOTIVATIONS_TR = {
        { "Şüphesiz zorlukla beraber bir kolaylık vardır. Gerçekten, zorlukla beraber bir kolaylık daha vardır.", "İnşirâh Suresi, 5-6" },
        { "Allah hiçbir nefsi, gücünün yetmeyeceği bir yükle yükümlü tutmaz.", "Bakara Suresi, 286" },
        { "Rabbin seni asla terk etmedi ve sana darılmadı.", "Duhâ Suresi, 3" },
        { "Gevşemeyin, hüzünlenmeyin. Eğer gerçekten inanıyorsanız, üstün olan sizsiniz.", "Âl-i İmrân Suresi, 139" },
        { "Kim Allah’a tevekkül ederse, O kendisine yeter.", "Talâk Suresi, 3" },
        { "Üzülme, çünkü Allah bizimle beraberdir.", "Tevbe Suresi, 40" },
        { "Ey iman edenler! Sabır ve namaz ile Allah’tan yardım isteyin. Şüphesiz Allah, sabredenlerle beraberdir.", "Bakara Suresi, 153" },
        { "Ey kendi nefisleri aleyhine haddi aşan kullarım! Allah’ın rahmetinden asla ümit kesmeyin.", "Zümer Suresi, 53" },
        { "Rabbiniz şöyle buyurdu: Bana dua edin, duanıza cevap vereyim.", "Mü'min Suresi, 60" },
        { "Şüphesiz Rabbin sana verecek ve sen hoşnut olacaksın.", "Duhâ Suresi, 5" },
        { "Olur ki, bir şey sizin için hayırlı iken ondan hoşlanmazsınız. Yine olur ki, bir şey sizin için kötü iken onu seversiniz. Allah bilir, siz bilemezsiniz.", "Bakara Suresi, 216" },
        { "Onlar tuzak kuruyorlardı; Allah da onların tuzaklarını bozuyordu. Allah, tuzak kuranların en hayırlısıdır.", "Enfâl Suresi, 30" },
        { "Bilesiniz ki, kalpler ancak Allah’ı anmakla huzur bulur.", "Ra'd Suresi, 28" },
        { "Yaratan hiç bilmez mi? O, her şeyi ince ince bilir ve her şeyden haberdardır.", "Mülk Suresi, 14" },
        { "Allah'ın rahmetinden ümidinizi kesmeyin. Çünkü kâfirler topluluğundan başkası Allah'ın rahmetinden ümit kesmez.", "Yûsuf Suresi, 87" },
        { "Rabbinin rahmetinden, sapıklardan başka kim ümit keser?", "Hicr Suresi, 56" },
        { "Şüphesiz rızkı veren, mutlak kudret sahibi olan ancak Allah'tır.", "Zâriyât Suresi, 58" },
        { "Bilsin ki insan için kendi çalışmasından başka bir şey yoktur.", "Necm Suresi, 39" },
        { "O halde onlara güzel bir hoşgörü ile muamele et.", "Hicr Suresi, 85" },
        { "Kim Allah'a karşı gelmekten sakınırsa, Allah ona bir çıkış yolu açar.", "Talâk Suresi, 2" },
        { "Andolsun, insanı biz yarattık ve nefsinin kendisine fısıldadıklarını biliriz. Ve biz ona şah damarından daha yakınız.", "Kaf Suresi, 16" },
        { "Sabret; senin sabrın da ancak Allah'ın yardımıyladır. Onlardan dolayı üzülme.", "Nahl Suresi, 127" },
        { "Korkmayın, çünkü ben sizinle beraberim; işitiyorum ve görüyorum.", "Tâ Hâ Suresi, 46" },
        { "Sen şimdi sabret. Şüphesiz Allah'ın vaadi gerçektir.", "Rum Suresi, 60" },
        { "Kullarım sana beni sorduklarında bilsinler ki, ben muhakkak onlara pek yakınım.", "Bakara Suresi, 186" },
        { "Rabbimiz Allah'tır deyip sonra dosdoğru gidenlere melekler iner: Korkmayın, üzülmeyin ve vaat olunduğunuz cennetle sevinin, derler.", "Fussilet Suresi, 30" },
        { "Eğer Allah sana bir hayır dilerse, O'nun lütfunu geri çevirecek yoktur.", "Yûnus Suresi, 107" },
        { "Ey iman edenler! Sabredin, sabır yarışında düşmanlarınızı geçin.", "Âl-i İmrân Suresi, 200" },
        { "İşte onlar, sabretmelerine karşılık cennetin en yüksek makamlarıyla ödüllendirileceklerdir.", "Furkân Suresi, 75" },
        { "Sizin yanınızdaki tükenir, Allah katında olan ise kalıcıdır. Elbette sabredenlere mükafatlarını vereceğiz.", "Nahl Suresi, 96" },
        { "Bana Allah yeter. O'ndan başka hiçbir ilah yoktur. Ben O'na tevekkül ettim.", "Tevbe Suresi, 129" },
    };

    private static final String[][] MOTIVATIONS_EN = {
        { "For indeed, with hardship will be ease.", "Ash-Sharh, 5-6" },
        { "Allah does not charge a soul except with that within its capacity.", "Al-Baqarah, 286" },
        { "Your Lord has not abandoned you, nor has He detested you.", "Ad-Duhaa, 3" },
        { "Do not lose heart or despair- if you are true believers you have the upper hand.", "Ali 'Imran, 139" },
        { "And whoever relies upon Allah - then He is sufficient for him.", "At-Talaq, 3" },
        { "Do not grieve; indeed Allah is with us.", "At-Tawbah, 40" },
        { "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.", "Al-Baqarah, 153" },
        { "O My servants who have transgressed against themselves, do not despair of the mercy of Allah.", "Az-Zumar, 53" },
        { "And your Lord says, \"Call upon Me; I will respond to you.\"", "Ghafir, 60" },
        { "And your Lord is going to give you, and you will be satisfied.", "Ad-Duhaa, 5" },
        { "But perhaps you hate a thing and it is good for you; and perhaps you love a thing and it is bad for you. And Allah Knows, while you know not.", "Al-Baqarah, 216" },
        { "But they plan, and Allah plans. And Allah is the best of planners.", "Al-Anfal, 30" },
        { "Unquestionably, by the remembrance of Allah hearts are assured.", "Ar-Ra'd, 28" },
        { "Does He who created not know, while He is the Subtle, the Acquainted?", "Al-Mulk, 14" },
        { "And despair not of relief from Allah. Indeed, no one despairs of relief from Allah except the disbelieving people.", "Yusuf, 87" },
        { "And who despairs of the mercy of his Lord except for those astray?", "Al-Hijr, 56" },
        { "Indeed, it is Allah who is the [continual] Provider, the firm possessor of strength.", "Adh-Dhariyat, 58" },
        { "And that there is not for man except that for which he strives.", "An-Najm, 39" },
        { "So forgive with gracious forgiveness.", "Al-Hijr, 85" },
        { "And whoever fears Allah - He will make for him a way out.", "At-Talaq, 2" },
        { "And We have already created man and know what his soul whispers to him, and We are closer to him than his jugular vein.", "Qaaf, 16" },
        { "And be patient, and your patience is not but through Allah. And do not grieve over them.", "An-Nahl, 127" },
        { "Fear not. Indeed, I am with you both; I hear and I see.", "Ta-Ha, 46" },
        { "So be patient. Indeed, the promise of Allah is truth.", "Ar-Rum, 60" },
        { "And when My servants ask you, concerning Me - indeed I am near.", "Al-Baqarah, 186" },
        { "Indeed, those who have said, \"Our Lord is Allah\" and then remained on a right course - the angels will descend upon them, [saying], \"Do not fear and do not grieve but receive good tidings of Paradise, which you were promised.\"", "Fussilat, 30" },
        { "And if He intends for you good, then there is no repeller of His bounty.", "Yunus, 107" },
        { "O you who have believed, persevere and endure and remain stationed.", "Ali 'Imran, 200" },
        { "Those will be awarded the Chamber for what they patiently endured.", "Al-Furqan, 75" },
        { "Whatever you have will end, but what Allah has is lasting. And We will surely give those who were patient their reward.", "An-Nahl, 96" },
        { "Sufficient for me is Allah; there is no deity except Him. On Him I have relied.", "At-Tawbah, 129" },
    };

    private static final String[][] MOTIVATIONS_DE = {
        { "Gewiss, mit der Erschwernis ist Erleichterung.", "Asch-Scharh, 5-6" },
        { "Allah erlegt keiner Seele mehr auf, als sie zu leisten vermag.", "Al-Baqara, 286" },
        { "Dein Herr hat dich nicht verlassen und verabscheut dich nicht.", "Ad-Duha, 3" },
        { "Und verliert nicht den Mut und seid nicht traurig; ihr seid die Oberhand Habenden, wenn ihr gläubig seid.", "Ali Imran, 139" },
        { "Und wer sich auf Allah verlässt, dem ist Er genüge.", "At-Talaq, 3" },
        { "Sei nicht traurig! Gewiss, Allah ist mit uns.", "At-Tauba, 40" },
        { "O die ihr glaubt! Sucht Hilfe in der Geduld und im Gebet. Wahrlich, Allah ist mit den Geduldigen.", "Al-Baqara, 153" },
        { "O Meine Diener, die ihr gegen euch selbst maßlos gewesen seid, verliert nicht die Hoffnung auf Allahs Barmherzigkeit.", "Az-Zumar, 53" },
        { "Euer Herr sagt: Ruft Mich an, so werde Ich euch Erhörung gewähren.", "Ghafir, 60" },
        { "Und dein Herr wird dir wahrlich geben, und du wirst zufrieden sein.", "Ad-Duha, 5" },
        { "Vielleicht ist euch etwas zuwider, während es gut für euch ist, und vielleicht liebt ihr etwas, während es schlecht für euch ist. Allah weiß, ihr aber wisst nicht.", "Al-Baqara, 216" },
        { "Sie schmiedeten Ränke, und Allah schmiedete Ränke; und Allah ist der beste Ränkeschmied.", "Al-Anfal, 30" },
        { "Wahrlich, im Gedenken Allahs finden die Herzen Ruhe.", "Ar-Ra'd, 28" },
        { "Sollte Er denn nicht wissen, Was Er erschaffen hat? Und Er ist der Feinfühlige, der Allkundige.", "Al-Mulk, 14" },
        { "Und gebt die Hoffnung auf Allahs Erbarmen nicht auf. Es geben nur die ungläubigen Leute die Hoffnung auf Allahs Erbarmen auf.", "Yusuf, 87" },
        { "Wer verliert die Hoffnung auf die Barmherzigkeit seines Herrn außer den Irregegangenen?", "Al-Hijr, 56" },
        { "Gewiß, Allah ist der Versorger, der Besitzer von Kraft und der Feste.", "Adh-Dhariyat, 58" },
        { "Und dass dem Menschen nichts anderes zuteil wird als das, wonach er strebt.", "An-Najm, 39" },
        { "So übe Nachsicht auf eine schöne Weise.", "Al-Hijr, 85" },
        { "Und wer Allah fürchtet, dem schafft Er einen Ausweg.", "At-Talaq, 2" },
        { "Wir haben den Menschen ja erschaffen und wissen, was (ihm) seine Seele einflüstert, und Wir sind ihm näher als seine Halsschlagader.", "Qaf, 16" },
        { "Und sei geduldig! Deine Geduld ist nur mit Allahs (Hilfe) möglich. Sei nicht traurig über sie.", "An-Nahl, 127" },
        { "Fürchtet euch nicht. Gewiß, Ich bin mit euch beiden; Ich höre und sehe.", "Ta-Ha, 46" },
        { "So sei geduldig. Gewiß, das Versprechen Allahs ist wahr.", "Ar-Rum, 60" },
        { "Und wenn dich Meine Diener nach Mir fragen, so bin Ich nahe.", "Al-Baqara, 186" },
        { "Gewiß, diejenigen, die sagen: „Unser Herr ist Allah“, und sich hierauf geradlinig verhalten, auf sie steigen die Engel herab (und sagen): „Fürchtet euch nicht, traurig zu sein, und freut euch über den Paradiesgarten, der euch stets versprochen wurde.“", "Fussilat, 30" },
        { "Und wenn Er für dich Gutes will, gibt es niemanden, der Seine Huld abweisen könnte.", "Yunus, 107" },
        { "O die ihr glaubt, geduldet euch, haltet standhaft aus, seid wachsam.", "Ali Imran, 200" },
        { "Sie werden mit dem Obergemach belohnt, dafür, daß sie standhaft geblieben sind.", "Al-Furqan, 75" },
        { "Was bei euch ist, vergeht; was aber bei Allah ist, bleibt bestehen. Wir werden denjenigen, die standhaft waren, gewiß ihren Lohn vergelten.", "An-Nahl, 96" },
        { "Allah genügt mir. Es gibt keinen Gott außer Ihm. Auf Ihn verlasse ich mich.", "At-Tauba, 129" },
    };

    private static final String[][] MOTIVATIONS_RU = {
        { "Воистину, за каждой тягостью наступает облегчение.", "Аш-Шарх, 5-6" },
        { "Аллах не возлагает на человека сверх его возможностей.", "Аль-Бакара, 286" },
        { "Твой Господь не покинул тебя и не возненавидел.", "Ад-Духа, 3" },
        { "Не слабейте и не печальтесь, в то время как вы будете на высоте, если вы действительно являетесь верующими.", "Аль Имран, 139" },
        { "Тому, кто уповает на Аллаха, достаточно Его.", "Ат-Талак, 3" },
        { "Не печалься, ибо Аллах — с нами.", "Ат-Тауба, 40" },
        { "О те, которые уверовали! Обратитесь за помощью к терпению и молитве. Поистине, Аллах - с терпеливыми.", "Аль-Бакара, 153" },
        { "О Мои рабы, которые преступили границы во вред самим себе! Не отчаивайтесь в милости Аллаха.", "Аз-Зумар, 53" },
        { "Ваш Господь сказал: «Взывайте ко Мне, и Я отвечу вам».", "Гафир, 60" },
        { "Господь твой непременно одарит тебя, и ты будешь доволен.", "Ад-Духа, 5" },
        { "Быть может, вам неприятно то, что является благом для вас. И быть может, вы любите то, что является злом для вас. Аллах знает, а вы не знаете.", "Аль-Бакара, 216" },
        { "Они хитрили, и Аллах хитрил, а ведь Аллах — Наилучший из хитрецов.", "Аль-Анфаль, 30" },
        { "Разве не поминанием Аллаха утешаются сердца?", "Ар-Раад, 28" },
        { "Неужели этого не будет знать Тот, Кто сотворил, если Он — Проницательный, Ведающий?", "Аль-Мульк, 14" },
        { "И не отчаивайтесь в милости Аллаха. Воистину, отчаиваются в милости Аллаха только люди неверующие.", "Йусуф, 87" },
        { "Кто же отчаивается в милости своего Господа, кроме заблудших?", "Аль-Хиджр, 56" },
        { "Воистину, Аллах является Наделяющим уделом, Обладающим могуществом, Крепким.", "Аз-Зарият, 58" },
        { "Человек получит только то, к чему он стремился.", "Ан-Наджм, 39" },
        { "Прости же их прекрасным прощением.", "Аль-Хиджр, 85" },
        { "Тому, кто боится Аллаха, Он создает выход из положения.", "Ат-Талак, 2" },
        { "Мы сотворили человека и знаем, что нашептывает ему душа. Мы ближе к нему, чем яремная вена.", "Каф, 16" },
        { "Терпи, ибо твое терпение — только от Аллаха. Не скорби по ним.", "Ан-Нахль, 127" },
        { "Не бойтесь, ибо Я — с вами. Я слышу и вижу.", "Та Ха, 46" },
        { "Будь же терпелив! Воистину, обещание Аллаха истинно.", "Ар-Рум, 60" },
        { "Если Мои рабы спросят тебя обо Мне, то ведь Я близок и отвечаю на зов молящегося.", "Аль-Бакара, 186" },
        { "Воистину, к тем, которые сказали: «Наш Господь — Аллах», а потом были стойки, нисходят ангелы: «Не бойтесь и не печальтесь, а возрадуйтесь Раю, который был обещан вам».", "Фуссилят, 30" },
        { "Если Он пожелает одарить тебя добром, то никто не отвратит Его милости.", "Йунус, 107" },
        { "О те, которые уверовали! Будьте терпеливы, запасайтесь терпением, несите службу на заставах.", "Аль Имран, 200" },
        { "Они получат Горницу за то, что были терпеливы.", "Аль-Фуркан, 75" },
        { "То, что есть у вас, иссякнет, а то, что есть у Аллаха, останется навсегда. А тем, которые проявляли терпение, Мы непременно воздадим наградой.", "Ан-Нахль, 96" },
        { "Мне достаточно Аллаха! Нет божества, кроме Него. На Него я уповаю.", "Ат-Тауба, 129" },
    };

    private static final String[][] MOTIVATIONS_AZ = {
        { "Şübhəsiz ki, hər çətinlikdən sonra bir asanlıq gəlir!", "İnşirah Surəsi, 5-6" },
        { "Allah hər kəsi yalnız onun qüvvəsi çatdığı qədər mükəlləf edər.", "Bəqərə Surəsi, 286" },
        { "Rəbbin səni tərk etməyib və sənə acığı tutmayıb.", "Duha Surəsi, 3" },
        { "Zəifləməyin və qəmgin rəftarda olmayın. Çünki əgər inanırsınızsa, siz üstünsünüz.", "Ali-İmran Surəsi, 139" },
        { "Kim Allaha təvəkkül etsə, Allah ona kifayət edər.", "Talaq Surəsi, 3" },
        { "Kədərlənmə, Allah bizimlədir.", "Tövbə Surəsi, 40" },
        { "Ey iman gətirənlər! Səbir etmək və namaz qılmaqla Allahdan kömək diləyin. Həqiqətən, Allah səbir edənlərlədir.", "Bəqərə Surəsi, 153" },
        { "Ey öz canlarına zülm etmiş qullarım! Allahın rəhmətindən ümidinizi kəsməyin.", "Zümər Surəsi, 53" },
        { "Rəbbiniz dedi: Mənə dua edin, Mən də sizin dualarınızı qəbul edim!", "Mömin Surəsi, 60" },
        { "Rəbbin sənə verəcək, sən də razı qalacaqsan.", "Duha Surəsi, 5" },
        { "Bəzən xoşlamadığınız bir şey sizin üçün xeyirli ola bilər, bəzən də sevdiyiniz bir şey sizin üçün zərərli ola bilər. Allah bilir, siz bilmirsiniz.", "Bəqərə Surəsi, 216" },
        { "Onlar hiylə qurdular, Allah da onların hiyləsini boşa çıxartdı. Allah hiylə quranların ən xeyirlisidir.", "Ənfal Surəsi, 30" },
        { "Bilin ki, qəlblər yalnız Allahı zikr etməklə aram tapar!", "Rəd Surəsi, 28" },
        { "Yaradan bilməzmi? O, ən incə işləri biləndir, (hər şeydən) xəbərdardır.", "Mülk Surəsi, 14" },
        { "Allahın mərhəmətindən ümidinizi kəsməyin. Çünki kafir qövmdən başqa heç kəs Allahın mərhəmətindən ümidini kəsməz.", "Yusif Surəsi, 87" },
        { "Azanlardan başqa Rəbbinin mərhəmətindən kim ümidini kəsər?", "Hicr Surəsi, 56" },
        { "Şübhəsiz ki, ruzi verən də, qüvvət sahibi də, yenilməz olan da Allahdır.", "Zariyat Surəsi, 58" },
        { "İnsan üçün yalnız öz zəhmətinin bəhrəsi vardır.", "Nəcm Surəsi, 39" },
        { "Elə isə gözəl bir bağışlama ilə bağışla.", "Hicr Surəsi, 85" },
        { "Kim Allahdan qorxarsa, Allah onun üçün bir çıxış yolu yaradar.", "Talaq Surəsi, 2" },
        { "İnsanı Biz yaratdıq və nəfsinin ona nələr pıçıldadığını da Biz bilirik. Biz ona şah damarından da yaxınıq.", "Qaf Surəsi, 16" },
        { "Səbir et! Sən ancaq Allahın köməyi ilə səbir edə bilərsən. Onlara görə kədərlənmə.", "Nəhl Surəsi, 127" },
        { "Qorxmayın! Mən sizinləyəm, eşidirəm və görürəm.", "Taha Surəsi, 46" },
        { "Səbir et! Allahın vədi, həqiqətən, haqdır.", "Rum Surəsi, 60" },
        { "Qullarım səndən Mənim barəmdə soruşsalar, Mən (onlara) yaxınam.", "Bəqərə Surəsi, 186" },
        { "“Rəbbimiz Allahdır!” deyib sonra doğru yolda olanlara mələklər nazil olaraq: “Qorxmayın və kədərlənməyin, sizə vəd olunan Cənnətlə sevinin!” – deyərlər.", "Fussilət Surəsi, 30" },
        { "Əgər sənə bir xeyir yetirmək istəsə, heç kəs Onun lütfünün qarşısını ala bilməz.", "Yunus Surəsi, 107" },
        { "Ey iman gətirənlər! Səbir edin, dözümlü olun, sərhəddə durub növbə çəkin.", "Ali-İmran Surəsi, 200" },
        { "Onlar səbir etdiklərinə görə (Cənnətdə) yüksək məqamlarla mükafatlandırılacaqlar.", "Furqan Surəsi, 75" },
        { "Sizdə olanlar tükənər, Allahın yanında olanlar isə qalarlar. Səbir edənlərin mükafatını mütləq verəcəyik.", "Nəhl Surəsi, 96" },
        { "Mənə Allah yetər. Ondan başqa məbud yoxdur. Mən ancaq Ona təvəkkül edirəm.", "Tövbə Surəsi, 129" },
    };

    private static final String[][] MOTIVATIONS_AR = {
        { "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا.", "الشرح، 5-6" },
        { "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا.", "البقرة، 286" },
        { "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ.", "الضحى، 3" },
        { "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ.", "آل عمران، 139" },
        { "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ.", "الطلاق، 3" },
        { "لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا.", "التوبة، 40" },
        { "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ.", "البقرة، 153" },
        { "يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ.", "الزمر، 53" },
        { "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ.", "غافر، 60" },
        { "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ.", "الضحى، 5" },
        { "وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ ۖ وَعَسَىٰ أَن تُحِبُّوا شَيْئًا وَهُوَ شَرٌّ لَّكُمْ.", "البقرة، 216" },
        { "وَيَمْكُرُونَ وَيَمْكُرُ اللَّهُ ۖ وَاللَّهُ خَيْرُ الْمَاكِرِينَ.", "الأنفال، 30" },
        { "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ.", "الرعد، 28" },
        { "أَلَا يَعْلَمُ مَنْ خَلَقَ وَهُوَ اللَّطِيفُ الْخَبِيرُ.", "الملك، 14" },
        { "وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ ۖ إِنَّهُ لَا يَيْأَسُ مِن رَّوْحِ اللَّهِ إِلَّا الْقَوْمُ الْكَافِرُونَ.", "يوسف، 87" },
        { "وَمَن يَقْنَطُ مِن رَّحْمَةِ رَبِّهِ إِلَّا الضَّالُّونَ.", "الحجر، 56" },
        { "إِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ الْمَتِينُ.", "الذاريات، 58" },
        { "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ.", "النجم، 39" },
        { "فَاصْفَحِ الصَّفْحَ الْجَمِيلَ.", "الحجر، 85" },
        { "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا.", "الطلاق، 2" },
        { "وَلَقَدْ خَلَقْنَا الْإِنسَانَ وَنَعْلَمُ مَا تُوَسْوِسُ بِهِ نَفْسُهُ ۖ وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ.", "ق، 16" },
        { "وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ ۚ وَلَا تَحْزَنْ عَلَيْهِمْ.", "النحل، 127" },
        { "لَا تَخَافَا ۖ إِنَّنِي مَعَكُمَا أَسْمَعُ وَأَرَىٰ.", "طه، 46" },
        { "فَاصْبِرْ إِنَّ وَعْدَ اللَّهِ حَقٌّ.", "الروم، 60" },
        { "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ.", "البقرة، 186" },
        { "إِنَّ الَّذِينَ قَالُوا رَبُّنَا اللَّهُ ثُمَّ اسْتَقَامُوا تَتَنَزَّلُ عَلَيْهِمُ الْمَلَائِكَةُ أَلَّا تَخَافُوا وَلَا تَحْزَنُوا وَأَبْشِرُوا بِالْجَنَّةِ الَّتِي كُنتُمْ تُوعَدُونَ.", "فصلت، 30" },
        { "وَإِن يُرِدْكَ بِخَيْرٍ فَلَا رَادَّ لِفَضْلِهِ.", "يونس، 107" },
        { "يَا أَيُّهَا الَّذِينَ آمَنُوا اصْبِرُوا وَصَابِرُوا وَرَابِطُوا.", "آل عمران، 200" },
        { "أُولَٰئِكَ يُجْزَوْنَ الْغُرْفَةَ بِمَا صَبَرُوا.", "الفرقان، 75" },
        { "مَا عِندَكُمْ يَنفَدُ ۖ وَمَا عِندَ اللَّهِ بَاقٍ ۗ وَلَنَجْزِيَنَّ الَّذِينَ صَبَرُوا أَجْرَهُم.", "النحل، 96" },
        { "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ.", "التوبة، 129" },
    };

    private static final String[][] HOURLY_VERSES_TR = {
        { "Rabbin seni terk etmedi ve sana darılmadı.", "Duhâ Suresi, 3" },
        { "Şüphesiz zorlukla beraber bir kolaylık vardır.", "İnşirâh Suresi, 5" },
        { "Öyleyse beni anın ki ben de sizi anayım.", "Bakara Suresi, 152" },
        { "Ey iman edenler! Sabır ve namaz ile Allah'tan yardım isteyin. Şüphesiz Allah sabredenlerle beraberdir.", "Bakara Suresi, 153" },
        { "Kullarım beni sana soracak olursa, muhakkak ki ben (onlara) pek yakınım.", "Bakara Suresi, 186" },
        { "Allah hiçbir nefsi gücünün yettiğinden başkasıyla yükümlü tutmaz.", "Bakara Suresi, 286" },
        { "Rabbimiz! Bizi hidayete erdirdikten sonra kalplerimizi eğriltme.", "Âl-i İmrân Suresi, 8" },
        { "Gevşemeyin, hüzünlenmeyin. Eğer iman etmiş kimseler iseniz üstün olan sizsiniz.", "Âl-i İmrân Suresi, 139" },
        { "Hayır! Sizin mevlânız Allah'tır. O, yardımcıların en hayırlısıdır.", "Âl-i İmrân Suresi, 150" },
        { "Allah size yardım ederse, artık size üstün gelecek hiç kimse yoktur.", "Âl-i İmrân Suresi, 160" },
        { "Onlar, inananlar ve kalpleri Allah'ı anmakla huzura kavuşanlardır.", "Ra'd Suresi, 28" },
        { "Bilesiniz ki kalpler ancak Allah'ı anmakla huzur bulur.", "Ra'd Suresi, 28" },
        { "Eğer şükrederseniz, elbette size nimetimi artırırım.", "İbrâhîm Suresi, 7" },
        { "Rabbin, yalnız kendisine ibadet etmenizi ve ana babaya iyilik yapmanızı kesin olarak emretti.", "İsrâ Suresi, 23" },
        { "Rabbim! Küçüklüğümde onlar beni nasıl yetiştirmişlerse, şimdi sen de onlara öyle rahmet et!", "İsrâ Suresi, 24" },
        { "De ki: Hak geldi, batıl yok oldu. Şüphesiz batıl, yok olmaya mahkûmdur.", "İsrâ Suresi, 81" },
        { "Rabbimiz! Bize katından bir rahmet ver ve şu işimizde bize doğruyu göster.", "Kehf Suresi, 10" },
        { "Korkmayın, çünkü ben sizinle beraberim; işitiyorum ve görüyorum.", "Tâ-Hâ Suresi, 46" },
        { "Rabbim! İlmimi artır.", "Tâ-Hâ Suresi, 114" },
        { "Biz seni ancak âlemlere rahmet olarak gönderdik.", "Enbiyâ Suresi, 107" },
        { "Senden başka hiçbir ilâh yoktur. Seni eksikliklerden uzak tutarım. Ben gerçekten (nefsine) zulmedenlerden oldum.", "Enbiyâ Suresi, 87" },
        { "Rabbiniz şöyle buyurdu: Bana dua edin, duanıza cevap vereyim.", "Mü'min Suresi, 60" },
        { "Ey kendi aleyhlerine haddi aşan kullarım! Allah'ın rahmetinden ümit kesmeyin.", "Zümer Suresi, 53" },
        { "Şüphesiz Allah, bütün günahları affeder.", "Zümer Suresi, 53" },
        { "Müminler ancak kardeştirler. Öyleyse kardeşlerinizin arasını düzeltin.", "Hucurât Suresi, 10" },
        { "Ey iman edenler! Zannın çoğundan sakının; çünkü zannın bir kısmı günahtır.", "Hucurât Suresi, 12" },
        { "O, Karada ve denizde olanı bilir. O'nun ilmi dışında bir yaprak bile düşmez.", "En'âm Suresi, 59" },
        { "Allah sizin suretlerinize ve mallarınıza değil, kalplerinize ve amellerinize bakar.", "Hadis-i Şerif (Müslim)" },
        { "Nerede olursanız olun, O sizinle beraberdir.", "Hadîd Suresi, 4" },
        { "İyiliğin karşılığı, yalnız iyilik değil midir?", "Rahmân Suresi, 60" },
        { "Biz insanı en güzel biçimde yarattık.", "Tîn Suresi, 4" },
        { "Şüphesiz Rabbin sana verecek ve sen hoşnut olacaksın.", "Duhâ Suresi, 5" },
        { "Yetimi sakın ezme. El açıp isteyeni de sakın azarlama.", "Duhâ Suresi, 9-10" },
        { "Ve Rabbinin nimetini minnet ve şükranla an.", "Duhâ Suresi, 11" },
        { "Zamana andolsun ki, insan ziyandadır. Ancak iman edip salih ameller işleyenler müstesna.", "Asr Suresi, 1-3" },
        { "Ve Biz insana şahdamarından daha yakınız.", "Kâf Suresi, 16" },
        { "Rabbinin rızası için sabret.", "Müddessir Suresi, 7" },
        { "Göklerde ve yerde olanların hepsi O'nundur. Bütün işler ancak O'na döndürülür.", "Âl-i İmrân Suresi, 109" },
        { "İman edip salih ameller işleyenlere gelince, onlar için kesintisiz bir mükafat vardır.", "Tîn Suresi, 6" },
        { "O, yarattığı her şeyi en güzel yapan ve insanı yaratmaya çamurdan başlayandır.", "Secde Suresi, 7" },
        { "Onlar bollukta ve darlıkta Allah yolunda harcayanlar, öfkelerini yenenler ve insanları affedenlerdir.", "Âl-i İmrân Suresi, 134" },
        { "Şüphesiz Allah, iyilik yapanları sever.", "Âl-i İmrân Suresi, 134" },
        { "Eğer Allah sana bir sıkıntı dokundurursa, onu O'ndan başka giderecek yoktur.", "Yûnus Suresi, 107" },
        { "O, sizin için kulakları, gözleri ve kalpleri yaratandır. Ne kadar da az şükrediyorsunuz!", "Mü'minûn Suresi, 78" },
        { "De ki: Ey insanlar! Şüphesiz size Rabbinizden hak gelmiştir.", "Yûnus Suresi, 108" },
        { "Allah, samimi olarak kendi rızasını gözeterek yapılan amellerden başkasını kabul etmez.", "Nesâî" },
        { "Allah, göklerin ve yerin nurudur.", "Nûr Suresi, 35" },
        { "Görmedin mi Allah nasıl bir misal getirdi: Güzel bir söz, kökü sağlam, dalları göğe yükselen güzel bir ağaç gibidir.", "İbrâhîm Suresi, 24" },
        { "Bilesiniz ki, Allah'ın dostlarına hiçbir korku yoktur. Onlar üzülmeyeceklerdir de.", "Yûnus Suresi, 62" },
        { "Rabbinizin mağfiretine ve genişliği gökler ve yer kadar olan cennete koşun.", "Âl-i İmrân Suresi, 133" },
        { "O, kullarının tövbesini kabul eden, kötülükleri bağışlayan ve yaptıklarınızı bilendir.", "Şûrâ Suresi, 25" },
        { "Onlar, yalan şahitlikte bulunmayan, boş ve yararsız sözle karşılaştıkları zaman onurlu olarak geçenlerdir.", "Furkân Suresi, 72" },
        { "Şüphesiz Allah, adaleti, iyilik yapmayı, yakınlara yardım etmeyi emreder.", "Nahl Suresi, 90" },
        { "Hayâsızlığı, fenalığı ve azgınlığı da yasaklar.", "Nahl Suresi, 90" },
        { "Biz, emaneti göklere, yere ve dağlara sunduk da onlar bunu yüklenmekten kaçındılar.", "Ahzâb Suresi, 72" },
        { "Allah ve melekleri, Peygamber'e çok salavât getirirler. Ey iman edenler! Siz de ona salavât getirin.", "Ahzâb Suresi, 56" },
        { "O halde onlara güzel bir hoşgörü ile muamele et.", "Hicr Suresi, 85" },
        { "Ben hüznümü ve kederimi ancak Allah'a şikayet ederim.", "Yûsuf Suresi, 86" },
        { "Üzülme, çünkü Allah bizimle beraberdir.", "Tevbe Suresi, 40" },
        { "İman edip salih ameller işleyenlerin ise, kuşkusuz biz güzel iş yapanların mükafatını zayi etmeyiz.", "Kehf Suresi, 30" },
        { "Andolsun, biz insanı zorluklar içinde yarattık.", "Beled Suresi, 4" },
        { "Allah'ın ipine (Kur'an'a) hep birlikte sımsıkı sarılın, parçalanıp bölünmeyin.", "Âl-i İmrân Suresi, 103" },
        { "Sizden, hayra çağıran, iyiliği emreden ve kötülükten men eden bir topluluk bulunsun.", "Âl-i İmrân Suresi, 104" },
        { "Eğer mümin iseniz, Allah'a tevekkül edin.", "Mâide Suresi, 23" },
        { "Göklerin ve yerin mülkü Allah'ındır. Allah, her şeye hakkıyla gücü yetendir.", "Âl-i İmrân Suresi, 189" },
        { "Allah size yardım ederse, artık size üstün gelecek hiç kimse yoktur.", "Âl-i İmrân Suresi, 160" },
        { "Hepiniz O'ndan geldiniz ve O'na döndürüleceksiniz.", "Yâsîn Suresi, 83" },
        { "Güneş ve ay bir hesaba göre hareket etmektedir.", "Rahmân Suresi, 5" },
        { "Göğü Allah yükseltti ve mizanı (dengeyi) O koydu.", "Rahmân Suresi, 7" },
        { "Rabbinizin hangi nimetlerini yalanlayabilirsiniz?", "Rahmân Suresi, 13" },
        { "İman edip iyi işler yapanları, altından ırmaklar akan cennetlere koyacağız.", "Nisa Suresi, 122" },
        { "Gerçek şu ki, Allah zerre kadar haksızlık yapmaz.", "Nisa Suresi, 40" },
        { "Müminler ancak onlardır ki, Allah anıldığı zaman kalpleri titrer.", "Enfâl Suresi, 2" },
        { "Şüphesiz Allah, hakkıyla işiten, hakkıyla bilendir.", "Mü'min Suresi, 56" },
        { "Bir şeyi dilediği zaman O'nun emri o şeye ancak 'Ol!' demektir, o da hemen oluverir.", "Yâsîn Suresi, 82" },
        { "Kuşkusuz Rabbinin yakalaması çok şiddetlidir.", "Bürûc Suresi, 12" },
        { "O, çok bağışlayan ve çok sevendir.", "Bürûc Suresi, 14" },
        { "Ancak Allah'a ibadet edin ve O'na hiçbir şeyi ortak koşmayın.", "Nisa Suresi, 36" },
        { "Anne-babaya, akrabaya, yetimlere, yoksullara iyi davranın.", "Nisa Suresi, 36" },
        { "Kim Allah'a tevekkül ederse, O kendisine yeter.", "Talâk Suresi, 3" },
        { "Şüphesiz ki namaz hayasızlıktan ve kötülükten alıkoyar.", "Ankebût Suresi, 45" },
        { "Allah'a kaçın (sığının). Şüphesiz ben, O'nun tarafından size gönderilmiş apaçık bir uyarıcıyım.", "Zâriyât Suresi, 50" },
        { "Ben cinleri ve insanları ancak bana kulluk etsinler diye yarattım.", "Zâriyât Suresi, 56" },
        { "İşte onlar, barış yurdu (cennet) içindedirler. Orada onlara Rablerinden istedikleri her şey vardır.", "Kâf Suresi, 31" },
        { "Sabrederek ve namaz kılarak (Allah'tan) yardım dileyin.", "Bakara Suresi, 45" },
        { "Şüphesiz sabredenlere mükafatları hesapsız ödenecektir.", "Zümer Suresi, 10" },
        { "Rahmân'ın kulları, yeryüzünde vakar ve tevazu ile yürüyen kimselerdir.", "Furkân Suresi, 63" },
        { "Cahiller onlara laf attıkları zaman, 'Selam!' der (geçer)ler.", "Furkân Suresi, 63" },
        { "Muhakkak ki Allah, tövbe edenleri sever, temizlenenleri de sever.", "Bakara Suresi, 222" },
        { "Her nefis ölümü tadacaktır. Sizi bir imtihan olarak kötülük ve iyilikle deneyeceğiz.", "Enbiyâ Suresi, 35" },
        { "Eğer Allah, insanları zulümleri yüzünden cezalandıracak olsaydı, yeryüzünde hiçbir canlı bırakmazdı.", "Nahl Suresi, 61" },
        { "Şüphesiz rızkı veren, mutlak kudret sahibi olan ancak Allah'tır.", "Zâriyât Suresi, 58" },
        { "Yeryüzünde böbürlenerek yürüme. Çünkü sen yeri yaramazsın, boyca da dağlara ulaşamazsın.", "İsrâ Suresi, 37" },
        { "Güzel bir söz ve bağışlama, peşinden eziyet gelen bir sadakadan daha hayırlıdır.", "Bakara Suresi, 263" },
        { "Onlar ki, ne ticaret ne de alışveriş onları Allah'ı anmaktan alıkoymaz.", "Nûr Suresi, 37" },
        { "Rabbimiz! Bizi bağışla, bizden önce iman etmiş olan kardeşlerimizi de bağışla.", "Haşr Suresi, 10" },
        { "Allah, gözlerin hain bakışını ve göğüslerin gizlediğini bilir.", "Mü'min Suresi, 19" },
        { "Ey Peygamber! Biz seni bir şahit, bir müjdeleyici ve bir uyarıcı olarak gönderdik.", "Ahzâb Suresi, 45" },
        { "Kıyamet günü onlar için adalet terazileri kuracağız. Hiç kimseye zerre kadar haksızlık edilmeyecek.", "Enbiyâ Suresi, 47" },
        { "Siz ancak alemlerin Rabbi olan Allah dilerse dileyebilirsiniz.", "İnsan Suresi, 30" },
    };

    private static final String[][] ESMA = {
        { "1", "ٱلرَّحْمَٰنُ", "Er-Rahmân", "Dünyada bütün mahlukata merhamet eden" },
        { "2", "ٱلرَّحِيمُ", "Er-Rahîm", "Ahirette yalnız müminlere merhamet eden" },
        { "3", "ٱلْمَلِكُ", "El-Melik", "Bütün kainatın sahibi ve mutlak hükümdarı" },
        { "4", "ٱلْقُدُّوسُ", "El-Kuddûs", "Her türlü eksiklikten uzak, pek temiz olan" },
        { "5", "ٱلسَّلَامُ", "Es-Selâm", "Mahlukatı her çeşit tehlikeden selamete çıkaran" },
        { "6", "ٱلْمُؤْمِنُ", "El-Mü'min", "Güven veren, emniyete kavuşturan" },
        { "7", "ٱلْمُهَيْمِنُ", "El-Müheymin", "Her şeyi görüp gözeten ve koruyan" },
        { "8", "ٱلْعَزِيزُ", "El-Azîz", "İzzet sahibi, mutlak kâdir ve galip olan" },
        { "9", "ٱلْجَبَّارُ", "El-Cebbâr", "Dilediğini zorla yaptırmaya muktedir olan, eksikleri tamlayan" },
        { "10", "ٱلْمُتَكَبِّرُ", "El-Mütekebbir", "Büyüklükte eşsiz, sonsuz yücelik sahibi" },
        { "11", "ٱلْخَالِقُ", "El-Hâlık", "Her şeyi yoktan var eden, yaratan" },
        { "12", "ٱلْبَارِئُ", "El-Bâri'", "Her şeyi kusursuz ve uyumlu bir şekilde yaratan" },
        { "13", "ٱلْمُصَوِّرُ", "El-Musavvir", "Varlıklara şekil ve suret veren" },
        { "14", "ٱلْغَفَّارُ", "El-Gaffâr", "Günahları çokça bağışlayan, örten" },
        { "15", "ٱلْقَهَّارُ", "El-Kahhâr", "Her şeye mutlak galip gelen ve boyun eğdiren" },
        { "16", "ٱلْوَهَّابُ", "El-Vehhâb", "Karşılıksız veren, ihsan ve nimeti bol olan" },
        { "17", "ٱلرَّزَّاقُ", "Er-Rezzâk", "Yaratılmış bütün varlıkların rızkını veren" },
        { "18", "ٱلْفَتَّاحُ", "El-Fettâh", "Her türlü kapıyı açan, zorlukları kolaylaştıran" },
        { "19", "ٱلْعَلِيمُ", "El-Alîm", "Her şeyi hakkıyla, en ince teferruatına kadar bilen" },
        { "20", "ٱلْقَابِضُ", "El-Kâbıd", "Dilediğinin rızkını daraltan, ruhları kabzeden" },
        { "21", "ٱلْبَاسِطُ", "El-Bâsıt", "Dilediğinin rızkını genişleten, ruhlara canlılık veren" },
        { "22", "ٱلْخَافِضُ", "El-Hâfıd", "Kafirleri ve zalimleri alçaltan" },
        { "23", "ٱلرَّافِعُ", "Er-Râfi'", "İnananları ve iyileri yücelten" },
        { "24", "ٱلْمُعِزُّ", "El-Mu'izz", "Dilediğini aziz kılan, şereflendiren" },
        { "25", "ٱلْمُذِلُّ", "El-Müzill", "Dilediğini zillete düşüren, hor ve hakir kılan" },
        { "26", "ٱلسَّمِيعُ", "Es-Semî'", "Her şeyi hakkıyla işiten" },
        { "27", "ٱلْبَصِيرُ", "El-Basîr", "Her şeyi hakkıyla gören" },
        { "28", "ٱلْحَكَمُ", "El-Hakem", "Mutlak hakim olan, hakkı bâtıldan ayıran" },
        { "29", "ٱلْعَدْلُ", "El-Adl", "Mutlak adil, adaleti tam olan" },
        { "30", "ٱللَّطِيفُ", "El-Latîf", "Lütuf sahibi, gizli işlerin inceliklerini bilen" },
        { "31", "ٱلْخَبِيرُ", "El-Habîr", "Her şeyin iç yüzünden gizlisinden haberdar olan" },
        { "32", "ٱلْحَلِيمُ", "El-Halîm", "Çok şefkatli olan, ceza vermede acele etmeyen" },
        { "33", "ٱلْعَظِيمُ", "El-Azîm", "Büyüklükte, yücelikte eşi benzeri olmayan" },
        { "34", "ٱلْغَفُورُ", "El-Gafûr", "Bağışlaması ve mağfireti çok olan" },
        { "35", "ٱلشَّكُورُ", "Eş-Şekûr", "Kendi rızası için yapılan iyiliklere çok mükafat veren" },
        { "36", "ٱلْعَلِيُّ", "El-Aliyy", "Şanı, kadri, yüceliği en üst noktada olan" },
        { "37", "ٱلْكَبِيرُ", "El-Kebîr", "Büyüklüğünde hudut olmayan" },
        { "38", "ٱلْحَفِيظُ", "El-Hafîz", "Her şeyi noksansız olarak koruyup gözeten" },
        { "39", "ٱلْمُقِيتُ", "El-Mukît", "Yaratılmış mahlukatın yiyecek ve gıdalarını veren" },
        { "40", "ٱلْحَسِيبُ", "El-Hasîb", "Kullarının amellerinden hesap soran, yeten" },
        { "41", "ٱلْجَلِيلُ", "El-Celîl", "Celal, azamet ve ululuk sahibi olan" },
        { "42", "ٱلْكَرِيمُ", "El-Kerîm", "Cömertliği, lütfu ve ikramı bol olan" },
        { "43", "ٱلرَّقِيبُ", "Er-Rakîb", "Bütün varlıkları her an gözeten" },
        { "44", "ٱلْمُجِيبُ", "El-Mucîb", "Özden tevbe edenlerin dualarını kabul eden" },
        { "45", "ٱلْوَاسِعُ", "El-Vâsi'", "İlmi, rahmeti ve kudreti her şeyi kuşatan" },
        { "46", "ٱلْحَكِيمُ", "El-Hakîm", "Her işi hikmetli ve eksiksiz olan" },
        { "47", "ٱلْوَدُودُ", "El-Vedûd", "İyi kullarını çok seven, çok sevilen" },
        { "48", "ٱلْمَجِيدُ", "El-Mecîd", "Kadr-ü şanı, yüceliği çok büyük olan" },
        { "49", "ٱلْبَاعِثُ", "El-Bâis", "Ölüleri dirilten, peygamberler gönderen" },
        { "50", "ٱلشَّهِيدُ", "Eş-Şehîd", "Her zamanda ve her yerde her şeye şahit olan" },
        { "51", "ٱلْحَقُّ", "El-Hakk", "Varlığı mutlak ve gerçek olan, Hakk'ın kendisi" },
        { "52", "ٱلْوَكِيلُ", "El-Vekîl", "Kendisine tevekkül edenlerin işlerini en iyi sonuçlandıran" },
        { "53", "ٱلْقَوِيُّ", "El-Kaviyy", "Çok kuvvetli, mutlak kâdir olan" },
        { "54", "ٱلْمَتِينُ", "El-Metîn", "Çok sağlam ve kudretli olan" },
        { "55", "ٱلْوَلِيُّ", "El-Veliyy", "İnanan ve iyi kullarının dostu, yardımcısı" },
        { "56", "ٱلْحَمِيدُ", "El-Hamîd", "Her türlü övgüye ve hamde layık olan" },
        { "57", "ٱلْمُحْصِي", "El-Muhsî", "Kainattaki her şeyin sayısını ve teferruatını bilen" },
        { "58", "ٱلْمُبْدِئُ", "El-Mübdi'", "Hiçbir örneği olmadan maddesiz olarak vareden" },
        { "59", "ٱلْمُعِيدُ", "El-Muîd", "Yarattıklarını öldürdükten sonra tekrar dirilten" },
        { "60", "ٱلْمُحْيِي", "El-Muhyî", "Can bağışlayan, hayat veren" },
        { "61", "ٱلْمُمِيتُ", "El-Mümît", "Eceli gelen bütün canlılara ölümü tattıran" },
        { "62", "ٱلْحَيُّ", "El-Hayy", "Daima diri olan, ezeli ve ebedi hayata sahip olan" },
        { "63", "ٱلْقَيُّومُ", "El-Kayyûm", "Gökleri, yeri ve tüm varlıkları ayakta tutan" },
        { "64", "ٱلْوَاجِدُ", "El-Vâcid", "İstediğini, dilediği vakit eksiksiz bulan" },
        { "65", "ٱلْمَاجِدُ", "El-Mâcid", "Kadri büyük, keremi ve merhameti bol olan" },
        { "66", "ٱلْوَاحِدُ", "El-Vâhid", "Zâtında, sıfatlarında, isimlerinde tek ve benzersiz olan" },
        { "67", "ٱلصَّمَدُ", "Es-Samed", "Herkesin muhtaç olduğu, kendisi kimseye muhtaç olmayan" },
        { "68", "ٱلْقَادِرُ", "El-Kâdir", "İstediğini yapmaya her zaman gücü yeten" },
        { "69", "ٱلْمُقْتَدِرُ", "El-Muktedir", "Sınırsız güç ve iktidar sahibi olan" },
        { "70", "ٱلْمُقَدِّمُ", "El-Mukaddim", "Dilediğini öne alan, ileri geçiren" },
        { "71", "ٱلْمُؤَخِّرُ", "El-Muahhir", "Dilediğini geride bırakan, erteleyen" },
        { "72", "ٱلْأَوَّلُ", "El-Evvel", "Her şeyden önce var olan, başlangıcı olmayan" },
        { "73", "ٱلْآخِرُ", "El-Âhir", "Her şey helak olduktan sonra da daim olan" },
        { "74", "ٱلظَّاهِرُ", "Ez-Zâhir", "Yarattığı eserleriyle varlığı sayısız delillerle apaçık olan" },
        { "75", "ٱلْبَاطِنُ", "El-Bâtın", "Akılların idrakinden ve varlıkların gözünden gizli olan" },
        { "76", "ٱلْوَالِي", "El-Vâlî", "Bütün evreni tek başına yöneten, idare eden" },
        { "77", "ٱلْمُتَعَالِي", "El-Müteâlî", "Her türlü noksanlıklardan ve benzetmelerden münezzeh ve yüce olan" },
        { "78", "ٱلْبَرُّ", "El-Berr", "Kullarına karşı iyiliği, ihsanı ve şefkati bol olan" },
        { "79", "ٱلتَّوَّابُ", "Et-Tevvâb", "Tövbeleri çokça kabul eden, günahları bağışlayan" },
        { "80", "ٱلْمُنْتَقِمُ", "El-Müntakim", "Suçlulara, isyancılara hak ettikleri cezayı veren" },
        { "81", "ٱلْعَفُوُّ", "El-Afüvv", "Kulunun günahlarını tamamen silen, affeden" },
        { "82", "ٱلرَّءُوفُ", "Er-Raûf", "Çok şefkatli, merhamet ve lütfu pek bol olan" },
        { "83", "مَالِكُ ٱلْمُلْكِ", "Mâlikü'l-Mülk", "Mülkün mutlak, tek ve ebedi sahibi" },
        { "84", "ذُو ٱلْجَلَالِ وَٱلْإِكْرَامِ", "Zü'l-Celâli ve'l-İkrâm", "Sonsuz ihtişam, kerem ve ikram sahibi olan" },
        { "85", "ٱلْمُقْسِطُ", "El-Muksit", "Bütün işlerini adalet, uyum ve dengeyle yapan" },
        { "86", "ٱلْجَامِعُ", "El-Câmi'", "Dilediklerini istediği zaman, dilediği yerde toplayan" },
        { "87", "ٱلْغَنِيُّ", "El-Ganiyy", "Gerçek zenginlik sahibi, hiçbir şeye ve kimseye muhtaç olmayan" },
        { "88", "ٱلْمُغْنِي", "El-Muğnî", "Dilediği kulunu zenginleştiren, her şeyden müstağni kılan" },
        { "89", "ٱلْمَانِعُ", "El-Mâni'", "Kötü şeylerin meydana gelmesine engel olan" },
        { "90", "ٱلضَّارُّ", "Ed-Dârr", "Elem, zarar ve ziyan verecek şeyleri yaratan" },
        { "91", "ٱلنَّافِعُ", "En-Nâfi'", "Hayır ve menfaat verecek şeyleri yaratan, fayda veren" },
        { "92", "ٱلنُّورُ", "En-Nûr", "Alemleri, zihinleri ve kalpleri nurlandırıp aydınlatan" },
        { "93", "ٱلْهَادِي", "El-Hâdî", "Kullarına doğru yolu gösteren, hidayet veren" },
        { "94", "ٱلْبَدِيعُ", "El-Bedî'", "Benzersiz, örneksiz ve eşsiz güzellikte yaratan" },
        { "95", "ٱلْبَاقِي", "El-Bâkî", "Varlığının başlangıcı ve sonu olmayan, ebedi olan" },
        { "96", "ٱلْوَارِثُ", "El-Vâris", "Mahlukat yok olduktan sonra da baki kalan, her şeyin yegane sahibi" },
        { "97", "ٱلرَّشِيدُ", "Er-Reşîd", "Bütün işleri isabetli ve doğru olan, doğru yolu gösterip irşad eden" },
        { "98", "ٱلصَّبُورُ", "Es-Sabûr", "Çok sabırlı olan, günahkarları cezalandırmada acele etmeyen" },
        { "99", "ٱللَّٰهُ", "Allah", "Bütün kemali sıfatları kendinde toplayan yüce yaratıcının Zât ismi" },
    };

    // MARK: - Dil çözümü (iOS WidgetLanguageHelper karşılığı)

    public static String resolveLanguage(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String lang = prefs.getString("widget_language_bridge", null);
            if (isSupported(lang)) return lang;
        } catch (Exception e) { /* ignore */ }
        String systemLang = Locale.getDefault().getLanguage();
        if (isSupported(systemLang)) return systemLang;
        return "tr";
    }

    private static boolean isSupported(String lang) {
        if (lang == null) return false;
        for (String s : SUPPORTED_LANGUAGES) {
            if (s.equals(lang)) return true;
        }
        return false;
    }

    private static String[][] versesFor(String lang) {
        switch (lang) {
            case "en": return VERSES_EN;
            case "de": return VERSES_DE;
            case "ru": return VERSES_RU;
            case "az": return VERSES_AZ;
            case "ar": return VERSES_AR;
            default:   return VERSES_TR;
        }
    }

    private static String[][] motivationsFor(String lang) {
        switch (lang) {
            case "en": return MOTIVATIONS_EN;
            case "de": return MOTIVATIONS_DE;
            case "ru": return MOTIVATIONS_RU;
            case "az": return MOTIVATIONS_AZ;
            case "ar": return MOTIVATIONS_AR;
            default:   return MOTIVATIONS_TR;
        }
    }

    // MARK: - Gün / saat bazlı seçim (iOS ile aynı indeks formülleri)

    public static String[] dailyVerse(Context context) {
        String lang = resolveLanguage(context);
        String[][] verses = versesFor(lang);
        int dayOfYear = Calendar.getInstance().get(Calendar.DAY_OF_YEAR);
        return verses[dayOfYear % verses.length];
    }

    /** TR için 100 ayetlik geniş havuz, diğer diller için günlük 31 ayet havuzu (iOS ile aynı). */
    public static String[] hourlyVerse(Context context) {
        String lang = resolveLanguage(context);
        String[][] verses = "tr".equals(lang) ? HOURLY_VERSES_TR : versesFor(lang);
        Calendar cal = Calendar.getInstance();
        int index = (cal.get(Calendar.DAY_OF_YEAR) * 24 + cal.get(Calendar.HOUR_OF_DAY)) % verses.length;
        return verses[index];
    }

    public static String[] dailyMotivation(Context context) {
        String lang = resolveLanguage(context);
        String[][] motivations = motivationsFor(lang);
        int dayOfYear = Calendar.getInstance().get(Calendar.DAY_OF_YEAR);
        return motivations[Math.abs(dayOfYear - 1) % motivations.length];
    }

    public static String[] dailyEsma() {
        int dayOfYear = Calendar.getInstance().get(Calendar.DAY_OF_YEAR);
        return ESMA[Math.abs(dayOfYear - 1) % ESMA.length];
    }

    public static String[] hourlyEsma() {
        Calendar cal = Calendar.getInstance();
        int index = (cal.get(Calendar.DAY_OF_YEAR) * 24 + cal.get(Calendar.HOUR_OF_DAY)) % ESMA.length;
        return ESMA[index];
    }

    /** Kaynak metnini içerik diline göre büyük harfe çevirir (iOS .textCase(.uppercase)). */
    public static String uppercaseSource(Context context, String source) {
        String lang = resolveLanguage(context);
        return source.toUpperCase(new Locale(lang));
    }
}