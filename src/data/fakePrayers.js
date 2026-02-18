/**
 * Language-based fake prayer pools for the Dua Kardeşliği feed.
 * Each language has its own set of sample prayers that feel natural
 * and culturally appropriate for that language's audience.
 *
 * Supported languages: tr, az, en, de, ar, ru
 * Fallback: en (English)
 */

const FAKE_PRAYERS = {
    tr: [
        { id: 1, text: "Annem çok hasta, şifa bekliyoruz. Dualarınızda ona da yer ayırır mısınız?", count: 128 },
        { id: 2, text: "Üzerimde çok büyük bir borç yükü var, hayırlı bir kapı açılması için dua bekliyorum.", count: 84 },
        { id: 3, text: "Yarın çok kritik bir sınavım var, zihin açıklığı için dua eder misiniz?", count: 215 },
        { id: 4, text: "Ruhum çok daralıyor, iç huzur ve inşirah için dualarınıza talibim.", count: 156 },
        { id: 5, text: "Evladım hayırlı bir yola girsin, kötü alışkanlıklardan kurtulsun diye dua bekliyorum.", count: 312 },
        { id: 6, text: "Yalnızlık ve kimsesizlik hissinden kurtulmak için kalpten bir dua istiyorum.", count: 97 },
        { id: 7, text: "Babam ameliyata girecek, başarılı geçmesi için dua eder misiniz?", count: 203 },
        { id: 8, text: "Eşimle aramız çok bozuldu, aileme huzur vermesi için Allah'a yalvarıyorum.", count: 176 },
        { id: 9, text: "İş bulamıyorum, hayırlı bir kapının açılması için dualarınızı bekliyorum.", count: 145 },
        { id: 10, text: "Küçük kızım çok ağır hasta, şifa nasip etmesi için dua edin lütfen.", count: 387 },
        { id: 11, text: "Borçlarımdan kurtulamıyorum, maddi sıkıntılarım için dua istiyorum.", count: 132 },
        { id: 12, text: "Hayırlı bir eş nasip etmesi için dua ediyorum, siz de dua eder misiniz?", count: 267 },
        { id: 13, text: "Depresyondayım, Allah'ın bana şifa ve huzur vermesi için dua edin.", count: 198 },
        { id: 14, text: "Askerdeki oğlum için dua istiyorum, sağ salim dönmesi için.", count: 341 },
        { id: 15, text: "Hamileliğim çok riskli, bebeğimin sağlıklı doğması için dua edin.", count: 276 },
        { id: 16, text: "Sınavlara hazırlanıyorum, Allah zihin açıklığı ve başarı versin.", count: 189 },
        { id: 17, text: "Çok zor günlerden geçiyorum, sabrım tükeniyor. Dua edin lütfen.", count: 154 },
        { id: 18, text: "Kanser tedavisi görüyorum, şifa diliyorum. Dualarınıza ihtiyacım var.", count: 412 },
        { id: 19, text: "Ailecek çok zor durumdayız, Allah yardımcımız olsun.", count: 167 },
        { id: 20, text: "Gurbette çok yalnızım, Allah sabır ve güç versin.", count: 143 },
        { id: 21, text: "Kardeşim yanlış yollara düştü, hidayet nasip etmesi için dua edin.", count: 234 },
        { id: 22, text: "Namazlarıma düzen veremiyorum, Allah beni bu konuda güçlendirsin.", count: 178 },
        { id: 23, text: "Ebeveynlerimin sağlığı için dua istiyorum, ikisi de yaşlı ve hasta.", count: 289 },
        { id: 24, text: "Çocuğum okula uyum sağlayamıyor, hayırlısı olması için dua edin.", count: 112 },
        { id: 25, text: "Kötü alışkanlıklarımdan kurtulmak istiyorum, bana dua edin.", count: 165 },
        { id: 26, text: "Üniversite sınavına hazırlanıyorum, hayırlı bir sonuç için dua edin.", count: 298 },
        { id: 27, text: "Ameliyat olacağım, Allah'tan sağlıklı bir şekilde atlatmayı diliyorum.", count: 223 },
        { id: 28, text: "İşsiz kaldım, ailemle birlikte çok zordayız. Dua edin kardeşler.", count: 187 },
        { id: 29, text: "Evliliğimin kurtulması için dua edin, çocuklarım var.", count: 201 },
        { id: 30, text: "Hac'ca gidebilmek için dua ediyorum, nasip olması dileğiyle.", count: 356 },
        { id: 31, text: "Allah bizi doğru yoldan ayırmasın, imanımızı güçlendirsin.", count: 445 },
        { id: 32, text: "Vesveseden çok rahatsız oluyorum, Allah kurtarsın. Dua edin.", count: 134 },
        { id: 33, text: "Gece uykularım çok bozuk, huzurlu uyumak için dua istiyorum.", count: 108 },
        { id: 34, text: "Ablam yoğun bakımda, şifa vermesi için yalvarıyorum. Dua edin.", count: 378 },
        { id: 35, text: "Mahkemem var, hakkımın teslim edilmesi için dua ediyorum.", count: 146 },
        { id: 36, text: "Tövbelerimin kabul olması için dua edin, çok pişmanım.", count: 192 },
        { id: 37, text: "Ailemle barışmak istiyorum, gönüllerin yumuşaması için dua edin.", count: 163 },
        { id: 38, text: "Küçük oğlum engelli, onun ve bizim için sabır diliyorum.", count: 334 },
        { id: 39, text: "Maddi manevi sıkıntılarımdan kurtulmak için dualarınıza ihtiyacım var.", count: 171 },
        { id: 40, text: "Rızkımın bereketlenmesi için dua edin, çok dar geçiniyoruz.", count: 218 },
    ],

    az: [
        { id: 1, text: "Anam çox xəstədir, şəfa tapması üçün dua edin.", count: 134 },
        { id: 2, text: "Borclarım çox ağırdır, xeyirli bir qapının açılması üçün dua istəyirəm.", count: 89 },
        { id: 3, text: "Sabah çox vacib imtahanım var, zehin açıqlığı üçün dua edərsinizmi?", count: 198 },
        { id: 4, text: "Ruhum çox sıxılır, daxili hüzur və rahatlıq üçün dualarınıza möhtacam.", count: 145 },
        { id: 5, text: "Övladım düz yola gəlsin deyə dua gözləyirəm.", count: 287 },
        { id: 6, text: "Tənhalıq hissindən qurtulmaq üçün ürəkdən bir dua istəyirəm.", count: 102 },
        { id: 7, text: "Atam əməliyyata girəcək, uğurlu keçməsi üçün dua edin.", count: 211 },
        { id: 8, text: "Həyat yoldaşımla aramız pozulub, ailəmə hüzur diləyirəm.", count: 167 },
        { id: 9, text: "İş tapa bilmirəm, xeyirli bir ruzinin açılması üçün dua edin.", count: 139 },
        { id: 10, text: "Balaca qızım çox ağır xəstədir, şəfa nəsib etsin deyə dua edin.", count: 356 },
        { id: 11, text: "Maddi çətinliklərim var, Allah yardımçım olsun.", count: 121 },
        { id: 12, text: "Xeyirli bir həyat yoldaşı nəsib etməsi üçün dua edirəm.", count: 245 },
        { id: 13, text: "Depressiyadadam, Allahın mənə şəfa və hüzur verməsi üçün dua edin.", count: 183 },
        { id: 14, text: "Əsgər olan oğlum üçün dua istəyirəm, sağ-salamat qayıtsın.", count: 312 },
        { id: 15, text: "Hamiləliyim çox risklidir, körpəmin sağlam doğulması üçün dua edin.", count: 256 },
        { id: 16, text: "İmtahanlara hazırlaşıram, Allah zehin açıqlığı və uğur versin.", count: 176 },
        { id: 17, text: "Çox çətin günlərdən keçirəm, səbrim tükənir. Dua edin.", count: 143 },
        { id: 18, text: "Xərçəng müalicəsi alıram, şəfa diləyirəm. Dualarınıza ehtiyacım var.", count: 389 },
        { id: 19, text: "Ailəcə çox çətin vəziyyətdəyik, Allah köməkçimiz olsun.", count: 158 },
        { id: 20, text: "Qürbətdə çox tənhayam, Allah səbir və güc versin.", count: 134 },
    ],

    en: [
        { id: 1, text: "My mother is very sick, please pray for her healing.", count: 142 },
        { id: 2, text: "I'm overwhelmed with debt, please pray for a way out.", count: 96 },
        { id: 3, text: "I have a critical exam tomorrow, please pray for clarity and success.", count: 223 },
        { id: 4, text: "My soul feels heavy, I need prayers for inner peace and tranquility.", count: 167 },
        { id: 5, text: "Please pray that my child finds the right path and leaves bad habits.", count: 298 },
        { id: 6, text: "I feel so alone, please pray for my loneliness to ease.", count: 108 },
        { id: 7, text: "My father is going into surgery, please pray it goes well.", count: 215 },
        { id: 8, text: "My marriage is falling apart, please pray for harmony in my family.", count: 182 },
        { id: 9, text: "I can't find a job, please pray for new opportunities to open up.", count: 151 },
        { id: 10, text: "My little daughter is critically ill, please pray for her recovery.", count: 401 },
        { id: 11, text: "I'm struggling with financial difficulties, please keep me in your prayers.", count: 127 },
        { id: 12, text: "I pray for a righteous spouse, please include me in your prayers.", count: 256 },
        { id: 13, text: "I'm going through depression, please pray for my mental health and peace.", count: 194 },
        { id: 14, text: "My son is in the military, please pray for his safe return.", count: 334 },
        { id: 15, text: "My pregnancy is high-risk, please pray for my baby's health.", count: 267 },
        { id: 16, text: "I'm preparing for exams, may Allah grant me clarity and success.", count: 185 },
        { id: 17, text: "I'm going through very hard times, my patience is running thin. Please pray.", count: 148 },
        { id: 18, text: "I'm undergoing cancer treatment, I need your prayers for healing.", count: 423 },
        { id: 19, text: "Our whole family is struggling, may Allah be our helper.", count: 162 },
        { id: 20, text: "I'm far from home and feeling very alone, may Allah grant me strength.", count: 137 },
    ],

    de: [
        { id: 1, text: "Meine Mutter ist sehr krank, bitte betet für ihre Genesung.", count: 131 },
        { id: 2, text: "Ich bin hoch verschuldet, bitte betet für einen Ausweg.", count: 87 },
        { id: 3, text: "Ich habe morgen eine wichtige Prüfung, bitte betet für Klarheit und Erfolg.", count: 209 },
        { id: 4, text: "Meine Seele fühlt sich schwer an, ich bitte um Gebete für inneren Frieden.", count: 152 },
        { id: 5, text: "Bitte betet, dass mein Kind den richtigen Weg findet.", count: 276 },
        { id: 6, text: "Ich fühle mich so einsam, bitte betet für mich.", count: 98 },
        { id: 7, text: "Mein Vater wird operiert, bitte betet, dass alles gut geht.", count: 198 },
        { id: 8, text: "Meine Ehe ist in Schwierigkeiten, bitte betet für Harmonie in meiner Familie.", count: 171 },
        { id: 9, text: "Ich finde keine Arbeit, bitte betet für neue Möglichkeiten.", count: 142 },
        { id: 10, text: "Meine kleine Tochter ist schwer krank, bitte betet für ihre Heilung.", count: 389 },
        { id: 11, text: "Ich habe finanzielle Schwierigkeiten, bitte denkt an mich in euren Gebeten.", count: 118 },
        { id: 12, text: "Ich bete um einen rechtschaffenen Ehepartner, bitte betet auch für mich.", count: 243 },
        { id: 13, text: "Ich leide unter Depressionen, bitte betet für meine Gesundheit und meinen Frieden.", count: 187 },
        { id: 14, text: "Mein Sohn ist beim Militär, bitte betet für seine sichere Rückkehr.", count: 321 },
        { id: 15, text: "Meine Schwangerschaft ist riskant, bitte betet für die Gesundheit meines Babys.", count: 259 },
        { id: 16, text: "Ich bereite mich auf Prüfungen vor, möge Allah mir Klarheit und Erfolg geben.", count: 178 },
        { id: 17, text: "Ich durchlebe sehr schwere Zeiten, meine Geduld ist am Ende. Bitte betet.", count: 141 },
        { id: 18, text: "Ich bin in Krebsbehandlung, ich brauche eure Gebete für Heilung.", count: 407 },
        { id: 19, text: "Unsere ganze Familie hat Schwierigkeiten, möge Allah uns helfen.", count: 156 },
        { id: 20, text: "Ich bin weit von zu Hause und fühle mich sehr allein, möge Allah mir Kraft geben.", count: 129 },
    ],

    ar: [
        { id: 1, text: "أمي مريضة جداً، أرجوكم ادعوا لها بالشفاء.", count: 148 },
        { id: 2, text: "عليّ ديون كثيرة، أرجو الدعاء بأن يفتح الله لي باباً للفرج.", count: 92 },
        { id: 3, text: "عندي امتحان مهم غداً، ادعوا لي بالتوفيق والنجاح.", count: 231 },
        { id: 4, text: "نفسي ضيقة جداً، أحتاج دعاءكم لراحة البال والسكينة.", count: 163 },
        { id: 5, text: "ادعوا لابني أن يهديه الله ويبعده عن الطريق الخاطئ.", count: 305 },
        { id: 6, text: "أشعر بالوحدة الشديدة، ادعوا لي بالأنس والراحة.", count: 104 },
        { id: 7, text: "أبي سيجري عملية جراحية، ادعوا له بالسلامة.", count: 219 },
        { id: 8, text: "علاقتي بزوجتي متوترة، ادعوا لعائلتي بالوئام والسكينة.", count: 178 },
        { id: 9, text: "لا أجد عملاً، ادعوا بأن يفتح الله لي أبواب الرزق.", count: 147 },
        { id: 10, text: "ابنتي الصغيرة مريضة جداً، ادعوا لها بالشفاء العاجل.", count: 412 },
        { id: 11, text: "أعاني من ضائقة مالية، ادعوا لي بالفرج.", count: 125 },
        { id: 12, text: "أدعو الله أن يرزقني بزوجة صالحة، ادعوا لي.", count: 261 },
        { id: 13, text: "أعاني من الاكتئاب، ادعوا لي بالشفاء وراحة البال.", count: 196 },
        { id: 14, text: "ابني في الجيش، ادعوا له بالسلامة والعودة الآمنة.", count: 345 },
        { id: 15, text: "حملي خطير، ادعوا لي ولطفلي بالسلامة.", count: 273 },
        { id: 16, text: "أستعد للامتحانات، اللهم ارزقني التوفيق والسداد.", count: 182 },
        { id: 17, text: "أمرّ بأوقات صعبة جداً، صبري ينفد. ادعوا لي.", count: 151 },
        { id: 18, text: "أتلقى علاج السرطان، أحتاج دعاءكم بالشفاء.", count: 431 },
        { id: 19, text: "عائلتنا كلها تمر بظروف صعبة، اللهم كن عوناً لنا.", count: 164 },
        { id: 20, text: "أنا بعيد عن أهلي وأشعر بالغربة الشديدة، ادعوا لي بالصبر.", count: 139 },
    ],

    ru: [
        { id: 1, text: "Моя мама очень больна, прошу помолиться за её выздоровление.", count: 137 },
        { id: 2, text: "У меня большие долги, прошу помолиться за выход из трудной ситуации.", count: 91 },
        { id: 3, text: "Завтра у меня важный экзамен, прошу помолиться за ясность ума и успех.", count: 217 },
        { id: 4, text: "На душе очень тяжело, прошу помолиться за мой внутренний покой.", count: 159 },
        { id: 5, text: "Помолитесь, чтобы мой ребёнок встал на правильный путь.", count: 291 },
        { id: 6, text: "Чувствую себя очень одиноким, прошу помолиться за меня.", count: 101 },
        { id: 7, text: "Моему отцу предстоит операция, помолитесь, чтобы всё прошло хорошо.", count: 207 },
        { id: 8, text: "Мой брак в кризисе, прошу помолиться за гармонию в семье.", count: 174 },
        { id: 9, text: "Не могу найти работу, помолитесь за новые возможности.", count: 144 },
        { id: 10, text: "Моя маленькая дочь тяжело больна, прошу помолиться за её исцеление.", count: 398 },
        { id: 11, text: "У меня финансовые трудности, прошу о молитвенной поддержке.", count: 123 },
        { id: 12, text: "Молюсь о праведном спутнике жизни, прошу помолиться и за меня.", count: 249 },
        { id: 13, text: "Страдаю от депрессии, прошу помолиться за моё здоровье и покой.", count: 191 },
        { id: 14, text: "Мой сын служит в армии, помолитесь за его безопасное возвращение.", count: 328 },
        { id: 15, text: "Моя беременность с осложнениями, прошу помолиться за здоровье малыша.", count: 263 },
        { id: 16, text: "Готовлюсь к экзаменам, да дарует Аллах мне ясность и успех.", count: 179 },
        { id: 17, text: "Прохожу через очень тяжёлые времена, терпение на исходе. Помолитесь.", count: 146 },
        { id: 18, text: "Прохожу лечение от рака, нуждаюсь в ваших молитвах об исцелении.", count: 416 },
        { id: 19, text: "Вся наша семья в трудном положении, да поможет нам Аллах.", count: 161 },
        { id: 20, text: "Я далеко от дома и очень одинок, да дарует Аллах мне силы.", count: 133 },
    ],
};

/**
 * Returns fake prayers for a given language.
 * Falls back to English if the language is not supported.
 */
export function getFakePrayersByLang(lang) {
    const normalizedLang = lang?.split('-')[0] || 'en';
    return FAKE_PRAYERS[normalizedLang] || FAKE_PRAYERS.en;
}

/**
 * Normalizes the i18n language code to a base language code.
 * e.g., 'en-US' → 'en', 'tr' → 'tr'
 */
export function normalizeLang(lang) {
    const base = lang?.split('-')[0] || 'en';
    const supported = Object.keys(FAKE_PRAYERS);
    return supported.includes(base) ? base : 'en';
}

export default FAKE_PRAYERS;
