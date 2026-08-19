/**
 * Abdesti bozan ve bozmayan durumlar — arama iskeleti.
 *
 * Görünen metinler burada DEĞİL, locale dosyalarında (`breakers.<id>.*`):
 * altı dil paritesi mevcut parite scriptiyle ölçülebilsin diye.
 *
 * İçerik iki bağımsız araştırmadan birleştirildi; hüküm çelişkileri Diyanet
 * Din İşleri Yüksek Kurulu fetvalarıyla çözüldü. Hanefî esas alınır.
 *
 * `aliases` altı dilde de doludur: yerelleştirilmiş başlık ve gövdede arama
 * yapmak yetmiyordu — "kanama" ile "kan verme" gibi çekim farkları yüzünden
 * kullanıcı büyük cevap kartında yanlış maddeyi görebiliyordu. Yeni takma ad
 * eklerken aynı kelimeyi iki maddeye VERME; scratchpad'deki alias testi bunu
 * ölçüyor (her takma ad kendi maddesini ilk sıraya koymalı).
 */

/** Üç cevap durumu. İkili olsaydı yalan söylerdi: uyku, kusma ve kanamanın
 *  hepsi şarta bağlı. */
export const VERDICT = { BREAKS: 'bozar', KEEPS: 'bozmaz', DEPENDS: 'duruma-gore' };

/** Listeleme sırası: önce şarta bağlı olanlar (en çok karıştırılanlar). */
export const VERDICT_ORDER = [VERDICT.DEPENDS, VERDICT.BREAKS, VERDICT.KEEPS];

/**
 * Aksan/büyük-küçük/apostrof duyarsız normalizasyon.
 * DuaLibrary ve Quran.jsx'teki kalıbın aynısı.
 */
export const normalizeSearch = (s) => (s || '')
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/['\u2019\u02bc-]/g, '');

/**
 * Eşleşme puanı. Sıralama olmadan "kan" araması 41 maddenin 18'ini getiriyor
 * ve en üstte dizi sırasındaki ilk madde çıkıyordu — kullanıcı yanlış cevabı
 * büyük kartta görürdü. Başlık ve takma ad eşleşmesi gövde eşleşmesini yener.
 *
 * @returns {number} 0 = eşleşme yok
 */
export function scoreMatch({ title, aliases, body }, query) {
    const q = normalizeSearch(query);
    if (!q) return 0;
    const t = normalizeSearch(title);
    if (t === q) return 5;
    if (t.startsWith(q)) return 4;
    const list = (aliases || []).map(normalizeSearch);
    if (list.some(a => a === q)) return 4;
    if (t.includes(q)) return 3;
    if (list.some(a => a.startsWith(q))) return 2;
    if (list.some(a => a.includes(q))) return 1;
    return normalizeSearch(body).includes(q) ? 1 : 0;
}

/**
 * Sonuç sıralaması. Puan eşitse **daha kısa başlık** kazanır: genel terim
 * ("Kanama") özel terimden ("Kan verme, tahlil, hacamat") önce gelir.
 * Eşitlikte dizi sırası karar verseydi "kan" arayan birine büyük cevap
 * kartında "Kan verme → Bozar" çıkardı; parmağını kesen kullanıcı için
 * yanlış cevap.
 */
export const byRelevance = (a, b) => b.score - a.score || a.title.length - b.title.length;

export const BREAKERS = [
    { id: 'idrar-diski', hukum: VERDICT.BREAKS, aliases: {
        tr: ["idrar", "çiş", "tuvalet", "dışkı", "büyük abdest", "küçük abdest", "işemek", "gaz çıkarmak"],
        en: ["urine", "urinate", "pee", "toilet", "stool", "faeces", "bathroom"],
        de: ["urin", "pinkeln", "toilette", "stuhlgang", "kot", "klo"],
        ru: ["моча", "мочеиспускание", "туалет", "кал", "стул", "пописать"],
        az: ["sidik", "ayaqyolu", "tualet", "nəcis", "işəmək"],
        ar: ["بول", "تبول", "مرحاض", "غائط", "براز", "حمام"],
    } },
    { id: 'gaz', hukum: VERDICT.BREAKS, aliases: {
        tr: ["gaz", "yellenmek", "osurmak", "gaz kaçırmak", "yel", "hava"],
        en: ["gas", "fart", "wind", "flatulence", "passing wind"],
        de: ["blähung", "furz", "pupsen", "winde", "darmwind"],
        ru: ["газы", "пукать", "ветры", "метеоризм"],
        az: ["qaz", "yellənmək", "külək"],
        ar: ["ريح", "غازات", "ضرطة", "خروج ريح", "فساء"],
    } },
    { id: 'meni-mezi', hukum: VERDICT.BREAKS, aliases: {
        tr: ["meni", "ihtilam", "rüyalanmak", "boşalma", "cünüp", "mezi", "şehvet", "berrak sıvı", "vedi", "ıslaklık", "rüya", "cünüplük", "gusül gerekir mi"],
        en: ["semen", "sperm", "madhi", "wadi", "wet dream", "ejaculation", "discharge male"],
        de: ["sperma", "samen", "madhi", "wadi", "feuchter traum", "samenerguss"],
        ru: ["сперма", "мазй", "вадй", "поллюция", "семяизвержение"],
        az: ["məni", "məzi", "vədi", "ehtilam", "boşalma"],
        ar: ["مني", "مذي", "ودي", "احتلام", "إنزال"],
    } },
    { id: 'cinsel-iliski', hukum: VERDICT.BREAKS, aliases: {
        tr: ["cinsel ilişki", "cima", "eşiyle birlikte olmak", "ilişki sonrası"],
        en: ["intercourse", "sex", "marital relations", "intimacy"],
        de: ["geschlechtsverkehr", "sex", "intimität", "beischlaf"],
        ru: ["половой акт", "близость", "интимная близость", "секс"],
        az: ["cinsi əlaqə", "yaxınlıq", "cima"],
        ar: ["جماع", "معاشرة", "علاقة زوجية"],
    } },
    { id: 'bayilma', hukum: VERDICT.BREAKS, aliases: {
        tr: ["bayılmak", "bayılma", "kendinden geçmek", "şuur kaybı", "baygınlık", "sara", "nöbet", "sarhoş", "sarhoşluk", "alkol", "içki", "uyuşturucu", "aklı gitmek", "delirmek", "akıl", "şuur", "bilinç kaybı", "aklını yitirmek", "epilepsi", "sara nöbeti"],
        en: ["fainting", "unconscious", "drunk", "alcohol", "seizure", "epilepsy", "passing out", "blackout"],
        de: ["ohnmacht", "bewusstlos", "betrunken", "alkohol", "anfall", "epilepsie"],
        ru: ["обморок", "без сознания", "пьяный", "алкоголь", "припадок", "эпилепсия"],
        az: ["bayılma", "huşsuz", "sərxoş", "spirt", "tutma", "epilepsiya"],
        ar: ["إغماء", "فقدان الوعي", "سكر", "خمر", "نوبة", "صرع"],
    } },
    { id: 'namazda-kahkaha', hukum: VERDICT.BREAKS, aliases: {
        tr: ["kahkaha", "namazda gülmek", "gülmek", "sesli gülmek", "cenaze namazı", "namaz bozuldu mu"],
        en: ["laughing in prayer", "laughter", "laugh out loud", "giggle"],
        de: ["lachen im gebet", "gelächter", "laut lachen"],
        ru: ["смех в намазе", "хохот", "смеяться"],
        az: ["namazda gülmək", "qəhqəhə", "gülüş"],
        ar: ["قهقهة", "الضحك في الصلاة", "ضحك"],
    } },
    { id: 'agiz-dolusu-kan', hukum: VERDICT.BREAKS, aliases: {
        tr: ["ağızdan kan", "kan tükürmek", "ağız kanaması"],
        en: ["blood from mouth", "spitting blood", "mouthful of blood"],
        de: ["blut aus dem mund", "blut spucken", "mund voll blut"],
        ru: ["кровь изо рта", "сплюнул кровь", "полный рот крови"],
        az: ["ağızdan qan", "qan tüpürmək"],
        ar: ["دم من الفم", "بصق دم", "ملء الفم دما"],
    } },
    { id: 'bagirsak-kurtlari', hukum: VERDICT.BREAKS, aliases: {
        tr: ["tenya", "bağırsak kurdu", "solucan", "parazit", "kurt düşmesi"],
        en: ["tapeworm", "worm", "intestinal worm", "parasite", "pinworm"],
        de: ["bandwurm", "wurm", "darmwurm", "parasit", "madenwurm"],
        ru: ["глисты", "червь", "солитёр", "паразит", "острицы"],
        az: ["qurd", "bağırsaq qurdu", "parazit", "soliter"],
        ar: ["دودة", "الدودة الشريطية", "ديدان", "طفيلي"],
    } },
    { id: 'kan-vermek', hukum: VERDICT.BREAKS, aliases: {
        tr: ["kan vermek", "kan bağışı", "kan tahlili", "kan aldırmak", "damardan kan", "parmaktan kan", "hacamat", "şeker ölçümü", "trombosit"],
        en: ["blood donation", "donate blood", "blood test", "cupping", "hijama", "blood draw", "needle blood"],
        de: ["blutspende", "blut spenden", "blutabnahme", "bluttest", "schröpfen", "hidschama"],
        ru: ["донорство", "сдать кровь", "анализ крови", "хиджама", "кровопускание", "забор крови"],
        az: ["qan vermək", "qan bağışı", "qan analizi", "hicamə"],
        ar: ["تبرع بالدم", "سحب الدم", "تحليل دم", "حجامة", "فصد"],
    } },
    { id: 'diyaliz', hukum: VERDICT.BREAKS, aliases: {
        tr: ["diyaliz", "periton diyalizi", "hemodiyaliz", "böbrek yetmezliği", "makineye bağlanmak", "kateter"],
        en: ["dialysis", "haemodialysis", "hemodialysis", "kidney machine", "peritoneal"],
        de: ["dialyse", "hämodialyse", "bauchfelldialyse", "nierenwäsche"],
        ru: ["диализ", "гемодиализ", "перитонеальный", "почки аппарат"],
        az: ["dializ", "hemodializ", "böyrək"],
        ar: ["غسيل الكلى", "ديلزة", "الديال", "غسيل بريتوني"],
    } },
    { id: 'adet-lohusalik', hukum: VERDICT.BREAKS, aliases: {
        tr: ["adet", "regl", "hayız", "ay hali", "lohusa", "nifas", "loğusalık", "doğum sonrası", "âdet", "kan kesilmesi"],
        en: ["period", "menstruation", "menses", "hayd", "postpartum", "nifas", "lochia"],
        de: ["periode", "menstruation", "regel", "hayd", "wochenbett", "nifas"],
        ru: ["месячные", "менструация", "хайд", "послеродовое", "нифас", "критические дни", "прокладка", "тампон"],
        az: ["aybaşı", "heyz", "adət", "nifas", "zahılıq"],
        ar: ["حيض", "دورة شهرية", "عادة شهرية", "نفاس", "بعد الولادة"],
    } },
    { id: 'uyku', hukum: VERDICT.DEPENDS, aliases: {
        tr: ["uyku", "uyumak", "uyuklamak", "şekerleme", "namazda uyuklamak", "uykuya dalmak", "yatarak uyumak", "uzanmak", "derin uyku", "yatmak", "dayanarak uyumak", "oturarak uyumak", "otobüste uyumak", "camide uyuklamak", "kestirmek", "dalıp gitmek"],
        en: ["sleep", "sleeping", "nap", "doze", "dozing off", "fell asleep", "lying down"],
        de: ["schlaf", "schlafen", "nickerchen", "einnicken", "eingeschlafen", "hinlegen"],
        ru: ["сон", "спать", "вздремнуть", "дремать", "уснул", "прилечь"],
        az: ["yuxu", "yatmaq", "mürgüləmək", "yuxuya getmək"],
        ar: ["نوم", "النوم", "نعاس", "غفوة", "اضطجاع"],
    } },
    { id: 'kusma', hukum: VERDICT.DEPENDS, aliases: {
        tr: ["kusmak", "kusma", "istifra", "mide bulantısı", "bulantı", "hamilelik", "ağız dolusu", "safra", "az kusmak", "ağız dolusu değil", "geğirmek", "mide ekşimesi", "bebek kusmuğu", "hafif kusma"],
        en: ["vomit", "vomiting", "throw up", "nausea", "sick", "morning sickness", "reflux"],
        de: ["erbrechen", "übergeben", "übelkeit", "brechreiz", "spucken"],
        ru: ["рвота", "стошнило", "тошнота", "вырвало", "срыгивание"],
        az: ["qusmaq", "qusma", "ürəkbulanma", "istifra"],
        ar: ["قيء", "تقيؤ", "استفراغ", "غثيان"],
    } },
    { id: 'kanama', hukum: VERDICT.DEPENDS, aliases: {
        tr: ["kanama", "kan", "yara", "irin", "sarı su", "kesik", "çıban", "kan akması", "kanamak"],
        en: ["blood", "bleeding", "bleed", "wound", "cut", "pus", "graze", "injury"],
        de: ["blut", "blutung", "bluten", "wunde", "schnitt", "eiter", "verletzung"],
        ru: ["кровь", "кровотечение", "рана", "порез", "гной", "ссадина"],
        az: ["qan", "qanama", "yara", "kəsik", "irin"],
        ar: ["دم", "نزيف", "جرح", "قيح", "صديد"],
    } },
    { id: 'karsi-cinse-dokunmak', hukum: VERDICT.DEPENDS, aliases: {
        tr: ["dokunmak", "el sıkışmak", "tokalaşmak", "kadına dokunmak", "eşine dokunmak", "temas", "sarılmak", "öpmek", "karşı cinse dokunmak", "kadına değmek", "tavafta değmek", "el ele tutuşmak"],
        en: ["touching opposite sex", "shaking hands", "handshake", "touching wife", "hug", "kiss", "skin contact"],
        de: ["berührung", "händeschütteln", "hand geben", "frau berühren", "umarmung", "kuss"],
        ru: ["рукопожатие", "пожать руку", "обнять", "поцелуй", "коснуться женщины"],
        az: ["toxunmaq", "əl vermək", "görüşmək", "öpmək", "qucaqlamaq"],
        ar: ["لمس", "مصافحة", "السلام باليد", "لمس الزوجة", "تقبيل", "عناق"],
    } },
    { id: 'dis-eti-kanamasi', hukum: VERDICT.DEPENDS, aliases: {
        tr: ["diş eti", "diş eti kanaması", "diş kanaması", "diş çektirmek", "diş fırçalarken kan", "dişçi", "tükürükte kan", "dolgu", "kanlı tükürük", "az kan", "pembe tükürük", "ağzımda kan tadı"],
        en: ["gum bleeding", "gums", "bleeding gums", "dentist", "tooth extraction", "blood in saliva"],
        de: ["zahnfleischbluten", "zahnfleisch", "zahnarzt", "zahn ziehen", "blut im speichel"],
        ru: ["десна", "кровь из десны", "дёсны", "стоматолог", "удаление зуба", "кровь в слюне"],
        az: ["diş əti", "diş əti qanaması", "diş həkimi", "diş çəkdirmək"],
        ar: ["نزيف اللثة", "اللثة", "طبيب الأسنان", "خلع الضرس", "دم في اللعاب"],
    } },
    { id: 'burun-kanamasi', hukum: VERDICT.DEPENDS, aliases: {
        tr: ["burun kanaması", "burun kanadı", "burnum kanıyor", "burun", "sümkürünce kan", "namazda burnu kanamak", "burnum kanadı"],
        en: ["nosebleed", "nose bleeding", "blood from nose", "blowing nose"],
        de: ["nasenbluten", "nase blutet", "blut aus der nase", "schnäuzen"],
        ru: ["носовое кровотечение", "кровь из носа", "нос кровь", "высморкался"],
        az: ["burun qanaması", "burundan qan", "burun"],
        ar: ["رعاف", "نزيف الأنف", "دم من الأنف", "تمخط"],
    } },
    { id: 'tibbi-mudahale', hukum: VERDICT.DEPENDS, aliases: {
        tr: ["iğne", "aşı", "enjeksiyon", "serum", "ameliyat", "narkoz", "anestezi", "lokal anestezi", "uyutulmak", "operasyon", "diş anestezisi"],
        en: ["injection", "needle", "vaccine", "shot", "surgery", "operation", "anaesthesia", "anesthesia", "drip", "iv"],
        de: ["spritze", "injektion", "impfung", "nadel", "operation", "narkose", "betäubung", "infusion"],
        ru: ["укол", "инъекция", "игла", "прививка", "операция", "наркоз", "анестезия", "капельница"],
        az: ["iynə", "peyvənd", "əməliyyat", "narkoz", "anesteziya", "serum"],
        ar: ["إبرة", "حقنة", "تطعيم", "عملية", "تخدير", "بنج", "محلول وريدي"],
    } },
    { id: 'kulak-goz-akintisi', hukum: VERDICT.DEPENDS, aliases: {
        tr: ["kulak akıntısı", "göz akıntısı", "kulak", "iltihap", "göbek akıntısı", "çapak", "protez göz", "kulak ağrısı"],
        en: ["ear discharge", "eye discharge", "earwax", "watery eye", "navel discharge", "infection"],
        de: ["ohrenausfluss", "augenausfluss", "tränendes auge", "nabel", "entzündung"],
        ru: ["выделения из уха", "выделения из глаза", "слезится глаз", "пупок", "воспаление"],
        az: ["qulaq axıntısı", "göz axıntısı", "göbək", "iltihab"],
        ar: ["إفراز الأذن", "إفراز العين", "دمع", "السرة", "التهاب"],
    } },
    { id: 'ozur-sahibi', hukum: VERDICT.DEPENDS, aliases: {
        tr: ["özür", "mazeret", "idrar kaçırma", "idrarımı tutamıyorum", "sürekli kanama", "istihaze", "prostat", "özür sahibi", "istihâze", "idrar torbası", "gaz tutamama", "sürekli akıntı"],
        en: ["chronic excuse", "incontinence", "cannot hold urine", "constant bleeding", "istihada", "prostate", "excused"],
        de: ["entschuldigter", "inkontinenz", "harn nicht halten", "dauerblutung", "istihada", "prostata"],
        ru: ["узр", "недержание", "не могу удержать", "постоянное кровотечение", "истихада", "простата"],
        az: ["üzr", "sidik saxlaya bilməmək", "davamlı qanama", "istihazə", "prostat"],
        ar: ["صاحب العذر", "سلس البول", "استحاضة", "نزيف مستمر", "البروستاتا"],
    } },
    { id: 'mest-cikarmak', hukum: VERDICT.DEPENDS, aliases: {
        tr: ["mest", "mesh", "çorap çıkarmak", "ayakkabı", "mest üzerine mesh", "çorap giymek"],
        en: ["khuff", "taking off socks", "removing khuff", "leather socks", "shoes"],
        de: ["chuff", "socken ausziehen", "ledersocken ausziehen", "schuhe"],
        ru: ["хуффы", "снять носки", "снять хуффы", "кожаные носки", "обувь"],
        az: ["məst", "corab çıxarmaq", "ayaqqabı"],
        ar: ["خلع الخف", "الخفان", "نزع الجورب", "حذاء"],
    } },
    { id: 'tirnak-sac-kesmek', hukum: VERDICT.KEEPS, aliases: {
        tr: ["tırnak", "tırnak kesmek", "tırnak kesimi", "manikür", "el bakımı", "tıraş", "saç kesmek", "sakal", "berber", "kuaför", "bıyık", "ağda", "epilasyon", "ayak tırnağı", "makas"],
        en: ["nails", "cutting nails", "manicure", "haircut", "shaving", "beard", "barber", "waxing"],
        de: ["nägel", "nägel schneiden", "maniküre", "haare schneiden", "rasieren", "bart", "friseur"],
        ru: ["ногти", "стричь ногти", "стрижка", "бритьё", "борода", "парикмахер"],
        az: ["dırnaq", "dırnaq kəsmək", "manikür", "saç kəsmək", "üz qırxmaq", "saqqal"],
        ar: ["قص الأظافر", "الأظافر", "حلاقة", "اللحية", "قص الشعر", "مانيكير"],
    } },
    { id: 'ter', hukum: VERDICT.KEEPS, aliases: {
        tr: ["ter", "terlemek", "sıcak", "spor", "terli", "koku"],
        en: ["sweat", "sweating", "perspiration", "gym", "heat"],
        de: ["schweiß", "schwitzen", "sport", "hitze"],
        ru: ["пот", "потеть", "потливость", "спорт", "жара"],
        az: ["tər", "tərləmək", "idman", "isti"],
        ar: ["عرق", "تعرق", "رياضة", "حر"],
    } },
    { id: 'balgam', hukum: VERDICT.KEEPS, aliases: {
        tr: ["balgam", "sümük", "öksürmek", "geniz", "hapşırmak", "sümkürmek", "tükürmek", "boğaz", "geniz akıntısı"],
        en: ["phlegm", "mucus", "cough", "spitting", "sneezing", "throat"],
        de: ["schleim", "husten", "niesen", "rachen"],
        ru: ["мокрота", "слизь", "кашель", "плевать", "чихание", "горло"],
        az: ["bəlğəm", "selik", "öskürək", "tüpürmək", "asqırmaq"],
        ar: ["بلغم", "مخاط", "سعال", "بصق", "عطاس"],
    } },
    { id: 'aglamak', hukum: VERDICT.KEEPS, aliases: {
        tr: ["ağlamak", "gözyaşı", "göz yaşı", "hüngür hüngür", "duada ağlamak", "gözüm sulandı", "hüzün", "namazda ağlamak"],
        en: ["crying", "tears", "weeping", "cry in prayer", "emotional"],
        de: ["weinen", "tränen", "heulen", "im gebet weinen"],
        ru: ["плач", "слёзы", "плакать", "плакать в намазе"],
        az: ["ağlamaq", "göz yaşı", "namazda ağlamaq"],
        ar: ["بكاء", "دموع", "البكاء في الصلاة"],
    } },
    { id: 'namaz-disinda-gulmek', hukum: VERDICT.KEEPS, aliases: {
        tr: ["namaz dışında gülmek", "gülme", "şaka", "tebessüm", "komik"],
        en: ["laughing outside prayer", "joke", "smile", "funny"],
        de: ["lachen außerhalb des gebets", "witz", "lächeln", "lustig"],
        ru: ["смех вне намаза", "шутка", "улыбка", "смешно"],
        az: ["namazdan kənar gülmək", "zarafat", "təbəssüm"],
        ar: ["الضحك خارج الصلاة", "مزاح", "ابتسامة"],
    } },
    { id: 'kan-gormek', hukum: VERDICT.KEEPS, aliases: {
        tr: ["kan görmek", "kanlı görüntü", "kurban kesimi", "kan izlemek", "kan akmadı", "iğne yeri", "çizik", "sivilce", "kan noktası", "hemoroit"],
        en: ["seeing blood", "blood that does not flow", "pimple", "scratch", "needle mark", "haemorrhoid", "hemorrhoid", "qurban"],
        de: ["blut sehen", "blut das nicht fließt", "pickel", "kratzer", "hämorrhoiden", "schlachten"],
        ru: ["увидеть кровь", "кровь не течёт", "прыщ", "царапина", "геморрой", "забой скота"],
        az: ["qan görmək", "axmayan qan", "sızanaq", "cızıq", "hemorroy"],
        ar: ["رؤية الدم", "دم لا يسيل", "بثرة", "خدش", "بواسير", "ذبح"],
    } },
    { id: 'banyo', hukum: VERDICT.KEEPS, aliases: {
        tr: ["banyo", "duş", "yıkanmak", "denize girmek", "havuz", "yüzmek", "gusül", "hamam", "su"],
        en: ["bath", "shower", "bathing", "swimming", "pool", "sea", "ghusl"],
        de: ["bad", "dusche", "duschen", "schwimmen", "schwimmbad", "meer", "ghusl"],
        ru: ["ванна", "душ", "мыться", "плавать", "бассейн", "море", "гусль"],
        az: ["hamam", "duş", "yuyunmaq", "üzmək", "hovuz", "dəniz", "qüsl"],
        ar: ["استحمام", "دش", "سباحة", "مسبح", "بحر", "غسل"],
    } },
    { id: 'elbise-degistirmek', hukum: VERDICT.KEEPS, aliases: {
        tr: ["elbise", "kıyafet", "soyunmak", "giyinmek", "üstünü değiştirmek", "çıplak", "elbise değiştirmek", "üst değiştirmek", "çıplaklık", "don değiştirmek"],
        en: ["changing clothes", "undressing", "getting dressed", "naked", "clothes"],
        de: ["umziehen", "ausziehen", "anziehen", "nackt", "kleidung"],
        ru: ["переодеться", "раздеться", "одеться", "голый", "одежда"],
        az: ["paltar dəyişmək", "soyunmaq", "geyinmək", "paltar"],
        ar: ["تبديل الملابس", "خلع الملابس", "التعري", "لبس"],
    } },
    { id: 'yemek-sakiz', hukum: VERDICT.KEEPS, aliases: {
        tr: ["yemek", "yemek yemek", "su içmek", "çay", "kahve", "atıştırmak", "iftar", "sakız", "sakız çiğnemek", "çiklet", "namazda sakız", "çay içmek", "deve eti"],
        en: ["eating", "food", "drinking", "tea", "coffee", "chewing gum", "gum", "snack", "camel meat"],
        de: ["essen", "trinken", "tee", "kaffee", "kaugummi", "snack", "kamelfleisch"],
        ru: ["еда", "есть", "пить", "чай", "кофе", "жвачка", "жевательная резинка", "верблюжье мясо"],
        az: ["yemək", "içmək", "çay", "qəhvə", "saqqız", "dəvə əti"],
        ar: ["أكل", "شرب", "شاي", "قهوة", "علكة", "لحم الإبل"],
    } },
    { id: 'dis-fircalamak', hukum: VERDICT.KEEPS, aliases: {
        tr: ["diş fırçalamak", "diş fırçası", "misvak", "diş macunu", "ağız bakımı", "ağız temizliği", "diş ipi"],
        en: ["brushing teeth", "toothbrush", "miswak", "toothpaste", "floss", "teeth"],
        de: ["zähneputzen", "zahnbürste", "miswak", "zahnpasta", "zahnseide", "zähne"],
        ru: ["чистить зубы", "зубная щётка", "мисвак", "зубная паста", "зубная нить", "зубы"],
        az: ["diş fırçalamaq", "diş fırçası", "misvak", "diş məcunu"],
        ar: ["تفريش الأسنان", "فرشاة الأسنان", "سواك", "معجون الأسنان", "الأسنان"],
    } },
    { id: 'sivrisinek-isirigi', hukum: VERDICT.KEEPS, aliases: {
        tr: ["sivrisinek", "böcek", "ısırık", "pire", "kaşınmak", "sinek", "kene", "böcek ısırığı", "tahtakurusu", "sokmak", "arı", "sülük", "sülük tedavisi"],
        en: ["mosquito", "insect", "bite", "flea", "tick", "itching", "bed bug", "bee sting", "leech"],
        de: ["mücke", "insekt", "stich", "floh", "zecke", "jucken", "bettwanze", "biene", "blutegel"],
        ru: ["комар", "насекомое", "укус", "блоха", "клещ", "чесаться", "клоп", "пчела", "пиявка"],
        az: ["ağcaqanad", "həşərat", "dişləmə", "birə", "gənə", "qaşınmaq", "arı", "zəli"],
        ar: ["بعوضة", "حشرة", "لدغة", "برغوث", "قراد", "حكة", "نحلة", "علقة"],
    } },
    { id: 'damla', hukum: VERDICT.KEEPS, aliases: {
        tr: ["göz damlası", "kulak damlası", "burun spreyi", "damla", "ilaç damlatmak", "lens"],
        en: ["eye drops", "ear drops", "nasal spray", "drops", "contact lens", "lens", "medicine drops"],
        de: ["augentropfen", "ohrentropfen", "nasenspray", "tropfen", "kontaktlinse", "linse"],
        ru: ["глазные капли", "ушные капли", "спрей для носа", "капли", "линзы", "контактные линзы"],
        az: ["göz damcısı", "qulaq damcısı", "burun spreyi", "damcı", "linza"],
        ar: ["قطرة العين", "قطرة الأذن", "بخاخ الأنف", "قطرة", "عدسات لاصقة"],
    } },
    { id: 'makyaj-oje', hukum: VERDICT.KEEPS, aliases: {
        tr: ["makyaj", "oje", "ruj", "jöle", "fondöten", "boya", "protez tırnak", "kalıcı oje"],
        en: ["makeup", "nail polish", "lipstick", "foundation", "hair gel", "henna", "false nails"],
        de: ["make-up", "nagellack", "lippenstift", "foundation", "haargel", "henna", "künstliche nägel"],
        ru: ["макияж", "лак для ногтей", "помада", "тональный крем", "гель для волос", "хна", "маникюр"],
        az: ["makiyaj", "dırnaq lakı", "pomada", "saç geli", "xna"],
        ar: ["مكياج", "طلاء الأظافر", "أحمر شفاه", "جل الشعر", "حناء"],
    } },
    { id: 'kadin-akintisi', hukum: VERDICT.KEEPS, aliases: {
        tr: ["akıntı", "kadın akıntısı", "beyaz akıntı", "rahim akıntısı", "leke", "kokusuz akıntı", "günlük ped", "hanımlara özgü"],
        en: ["white discharge", "vaginal discharge", "discharge women", "panty liner", "spotting"],
        de: ["weißfluss", "ausfluss", "scheidenausfluss", "slipeinlage"],
        ru: ["выделения", "белые выделения", "бели", "ежедневная прокладка", "мазня"],
        az: ["ağ axıntı", "axıntı", "gündəlik ped"],
        ar: ["إفرازات", "إفرازات بيضاء", "إفراز المرأة", "فوطة يومية"],
    } },
    { id: 'yara-kabugu', hukum: VERDICT.KEEPS, aliases: {
        tr: ["yara kabuğu", "kabuk", "kabuk düştü", "iyileşen yara"],
        en: ["scab", "scab falling off", "healing wound", "crust"],
        de: ["schorf", "kruste", "abgefallener schorf", "heilende wunde"],
        ru: ["корочка", "струп", "корка отпала", "заживающая рана"],
        az: ["yara qabığı", "qabıq", "sağalan yara"],
        ar: ["قشرة الجرح", "قشرة", "جرح يلتئم"],
    } },
    { id: 'supheye-dusmek', hukum: VERDICT.KEEPS, aliases: {
        tr: ["şüphe", "vesvese", "gaz geldi mi", "emin değilim", "acaba bozuldu mu", "kuruntu"],
        en: ["doubt", "waswas", "whispering", "not sure", "did i break it", "uncertainty"],
        de: ["zweifel", "waswasa", "einflüsterung", "nicht sicher", "unsicherheit"],
        ru: ["сомнение", "васваса", "наваждение", "не уверен", "сомневаюсь"],
        az: ["şübhə", "vəsvəsə", "əmin deyiləm"],
        ar: ["شك", "وسواس", "لست متأكدا", "الوسوسة"],
    } },
    { id: 'karsi-cinsin-saci', hukum: VERDICT.KEEPS, aliases: {
        tr: ["saça dokunmak", "el değmesi", "saçına dokunmak", "tırnağına dokunmak"],
        en: ["hair of opposite sex", "touching hair", "nails of opposite sex", "tooth"],
        de: ["haare des anderen geschlechts", "haare berühren"],
        ru: ["волосы другого пола", "коснуться волос", "зуб"],
        az: ["saçına toxunmaq", "qarşı cinsin saçı", "dırnağına toxunmaq"],
        ar: ["شعر الجنس الآخر", "لمس الشعر", "السن"],
    } },
    { id: 'sigara', hukum: VERDICT.KEEPS, aliases: {
        tr: ["sigara", "tütün", "nargile", "duman", "içmek"],
        en: ["smoking", "cigarette", "tobacco", "shisha", "hookah", "vape", "smoke"],
        de: ["rauchen", "zigarette", "tabak", "shisha", "wasserpfeife", "dampfen"],
        ru: ["курение", "сигарета", "табак", "кальян", "вейп", "дым"],
        az: ["siqaret", "tütün", "qəlyan", "tüstü"],
        ar: ["تدخين", "سيجارة", "تبغ", "شيشة", "نرجيلة", "دخان"],
    } },
    { id: 'cenazeye-dokunmak', hukum: VERDICT.KEEPS, aliases: {
        tr: ["cenaze", "ölü", "gasil", "cenaze yıkamak", "meyyit", "tabut"],
        en: ["touching the dead", "corpse", "funeral", "washing the dead", "janazah", "body"],
        de: ["toten berühren", "leiche", "beerdigung", "totenwaschung", "janaza"],
        ru: ["прикосновение к покойному", "труп", "похороны", "обмывание покойного", "джаназа"],
        az: ["cənazəyə toxunmaq", "meyit", "dəfn", "cənazə yumaq"],
        ar: ["مس الميت", "الجنازة", "تغسيل الميت", "الميت"],
    } },
    { id: 'kendi-avret-yerine-dokunmak', hukum: VERDICT.KEEPS, aliases: {
        tr: ["avret", "cinsel organ", "tuvalet sonrası", "temizlenmek", "kendine dokunmak", "avret yeri"],
        en: ["touching private parts", "private parts", "awrah", "after toilet", "cleaning oneself", "genitals"],
        de: ["intimbereich berühren", "intimbereich", "aura", "nach der toilette", "genitalien"],
        ru: ["касание аврата", "аврат", "половые органы", "после туалета", "подмыться"],
        az: ["avrətə toxunmaq", "avrət", "cinsiyyət orqanı", "tualetdən sonra"],
        ar: ["مس الفرج", "العورة", "بعد قضاء الحاجة", "الاستنجاء"],
    } },
];

/** Boş ekranda çip olarak duran, en çok sorulan durumlar. */
export const POPULAR = ['uyku', 'gaz', 'kusma', 'burun-kanamasi', 'tirnak-sac-kesmek', 'karsi-cinse-dokunmak', 'aglamak', 'kan-gormek'];
