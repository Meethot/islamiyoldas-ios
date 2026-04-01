import WidgetKit
import SwiftUI

/// Timeline entry for Esma-ül Hüsna (99 Names of Allah) widget
struct EsmaEntry: TimelineEntry {
    let date: Date
    let esma: DailyEsma
    
    struct DailyEsma {
        let number: Int
        let arabic: String
        let transliteration: String
        let meaning: String
    }
    
    // MARK: - 99 Esma-ül Hüsna
    
    static let allEsma: [DailyEsma] = [
        DailyEsma(number: 1, arabic: "ٱلرَّحْمَٰنُ", transliteration: "Er-Rahmân", meaning: "Dünyada bütün mahlukata merhamet eden"),
        DailyEsma(number: 2, arabic: "ٱلرَّحِيمُ", transliteration: "Er-Rahîm", meaning: "Ahirette yalnız müminlere merhamet eden"),
        DailyEsma(number: 3, arabic: "ٱلْمَلِكُ", transliteration: "El-Melik", meaning: "Bütün kainatın sahibi ve mutlak hükümdarı"),
        DailyEsma(number: 4, arabic: "ٱلْقُدُّوسُ", transliteration: "El-Kuddûs", meaning: "Her türlü eksiklikten uzak, pek temiz olan"),
        DailyEsma(number: 5, arabic: "ٱلسَّلَامُ", transliteration: "Es-Selâm", meaning: "Mahlukatı her çeşit tehlikeden selamete çıkaran"),
        DailyEsma(number: 6, arabic: "ٱلْمُؤْمِنُ", transliteration: "El-Mü'min", meaning: "Güven veren, emniyete kavuşturan"),
        DailyEsma(number: 7, arabic: "ٱلْمُهَيْمِنُ", transliteration: "El-Müheymin", meaning: "Her şeyi görüp gözeten ve koruyan"),
        DailyEsma(number: 8, arabic: "ٱلْعَزِيزُ", transliteration: "El-Azîz", meaning: "İzzet sahibi, mutlak kâdir ve galip olan"),
        DailyEsma(number: 9, arabic: "ٱلْجَبَّارُ", transliteration: "El-Cebbâr", meaning: "Dilediğini zorla yaptırmaya muktedir olan, eksikleri tamlayan"),
        DailyEsma(number: 10, arabic: "ٱلْمُتَكَبِّرُ", transliteration: "El-Mütekebbir", meaning: "Büyüklükte eşsiz, sonsuz yücelik sahibi"),
        DailyEsma(number: 11, arabic: "ٱلْخَالِقُ", transliteration: "El-Hâlık", meaning: "Her şeyi yoktan var eden, yaratan"),
        DailyEsma(number: 12, arabic: "ٱلْبَارِئُ", transliteration: "El-Bâri'", meaning: "Her şeyi kusursuz ve uyumlu bir şekilde yaratan"),
        DailyEsma(number: 13, arabic: "ٱلْمُصَوِّرُ", transliteration: "El-Musavvir", meaning: "Varlıklara şekil ve suret veren"),
        DailyEsma(number: 14, arabic: "ٱلْغَفَّارُ", transliteration: "El-Gaffâr", meaning: "Günahları çokça bağışlayan, örten"),
        DailyEsma(number: 15, arabic: "ٱلْقَهَّارُ", transliteration: "El-Kahhâr", meaning: "Her şeye mutlak galip gelen ve boyun eğdiren"),
        DailyEsma(number: 16, arabic: "ٱلْوَهَّابُ", transliteration: "El-Vehhâb", meaning: "Karşılıksız veren, ihsan ve nimeti bol olan"),
        DailyEsma(number: 17, arabic: "ٱلرَّزَّاقُ", transliteration: "Er-Rezzâk", meaning: "Yaratılmış bütün varlıkların rızkını veren"),
        DailyEsma(number: 18, arabic: "ٱلْفَتَّاحُ", transliteration: "El-Fettâh", meaning: "Her türlü kapıyı açan, zorlukları kolaylaştıran"),
        DailyEsma(number: 19, arabic: "ٱلْعَلِيمُ", transliteration: "El-Alîm", meaning: "Her şeyi hakkıyla, en ince teferruatına kadar bilen"),
        DailyEsma(number: 20, arabic: "ٱلْقَابِضُ", transliteration: "El-Kâbıd", meaning: "Dilediğinin rızkını daraltan, ruhları kabzeden"),
        DailyEsma(number: 21, arabic: "ٱلْبَاسِطُ", transliteration: "El-Bâsıt", meaning: "Dilediğinin rızkını genişleten, ruhlara canlılık veren"),
        DailyEsma(number: 22, arabic: "ٱلْخَافِضُ", transliteration: "El-Hâfıd", meaning: "Kafirleri ve zalimleri alçaltan"),
        DailyEsma(number: 23, arabic: "ٱلرَّافِعُ", transliteration: "Er-Râfi'", meaning: "İnananları ve iyileri yücelten"),
        DailyEsma(number: 24, arabic: "ٱلْمُعِزُّ", transliteration: "El-Mu'izz", meaning: "Dilediğini aziz kılan, şereflendiren"),
        DailyEsma(number: 25, arabic: "ٱلْمُذِلُّ", transliteration: "El-Müzill", meaning: "Dilediğini zillete düşüren, hor ve hakir kılan"),
        DailyEsma(number: 26, arabic: "ٱلسَّمِيعُ", transliteration: "Es-Semî'", meaning: "Her şeyi hakkıyla işiten"),
        DailyEsma(number: 27, arabic: "ٱلْبَصِيرُ", transliteration: "El-Basîr", meaning: "Her şeyi hakkıyla gören"),
        DailyEsma(number: 28, arabic: "ٱلْحَكَمُ", transliteration: "El-Hakem", meaning: "Mutlak hakim olan, hakkı bâtıldan ayıran"),
        DailyEsma(number: 29, arabic: "ٱلْعَدْلُ", transliteration: "El-Adl", meaning: "Mutlak adil, adaleti tam olan"),
        DailyEsma(number: 30, arabic: "ٱللَّطِيفُ", transliteration: "El-Latîf", meaning: "Lütuf sahibi, gizli işlerin inceliklerini bilen"),
        DailyEsma(number: 31, arabic: "ٱلْخَبِيرُ", transliteration: "El-Habîr", meaning: "Her şeyin iç yüzünden gizlisinden haberdar olan"),
        DailyEsma(number: 32, arabic: "ٱلْحَلِيمُ", transliteration: "El-Halîm", meaning: "Çok şefkatli olan, ceza vermede acele etmeyen"),
        DailyEsma(number: 33, arabic: "ٱلْعَظِيمُ", transliteration: "El-Azîm", meaning: "Büyüklükte, yücelikte eşi benzeri olmayan"),
        DailyEsma(number: 34, arabic: "ٱلْغَفُورُ", transliteration: "El-Gafûr", meaning: "Bağışlaması ve mağfireti çok olan"),
        DailyEsma(number: 35, arabic: "ٱلشَّكُورُ", transliteration: "Eş-Şekûr", meaning: "Kendi rızası için yapılan iyiliklere çok mükafat veren"),
        DailyEsma(number: 36, arabic: "ٱلْعَلِيُّ", transliteration: "El-Aliyy", meaning: "Şanı, kadri, yüceliği en üst noktada olan"),
        DailyEsma(number: 37, arabic: "ٱلْكَبِيرُ", transliteration: "El-Kebîr", meaning: "Büyüklüğünde hudut olmayan"),
        DailyEsma(number: 38, arabic: "ٱلْحَفِيظُ", transliteration: "El-Hafîz", meaning: "Her şeyi noksansız olarak koruyup gözeten"),
        DailyEsma(number: 39, arabic: "ٱلْمُقِيتُ", transliteration: "El-Mukît", meaning: "Yaratılmış mahlukatın yiyecek ve gıdalarını veren"),
        DailyEsma(number: 40, arabic: "ٱلْحَسِيبُ", transliteration: "El-Hasîb", meaning: "Kullarının amellerinden hesap soran, yeten"),
        DailyEsma(number: 41, arabic: "ٱلْجَلِيلُ", transliteration: "El-Celîl", meaning: "Celal, azamet ve ululuk sahibi olan"),
        DailyEsma(number: 42, arabic: "ٱلْكَرِيمُ", transliteration: "El-Kerîm", meaning: "Cömertliği, lütfu ve ikramı bol olan"),
        DailyEsma(number: 43, arabic: "ٱلرَّقِيبُ", transliteration: "Er-Rakîb", meaning: "Bütün varlıkları her an gözeten"),
        DailyEsma(number: 44, arabic: "ٱلْمُجِيبُ", transliteration: "El-Mucîb", meaning: "Özden tevbe edenlerin dualarını kabul eden"),
        DailyEsma(number: 45, arabic: "ٱلْوَاسِعُ", transliteration: "El-Vâsi'", meaning: "İlmi, rahmeti ve kudreti her şeyi kuşatan"),
        DailyEsma(number: 46, arabic: "ٱلْحَكِيمُ", transliteration: "El-Hakîm", meaning: "Her işi hikmetli ve eksiksiz olan"),
        DailyEsma(number: 47, arabic: "ٱلْوَدُودُ", transliteration: "El-Vedûd", meaning: "İyi kullarını çok seven, çok sevilen"),
        DailyEsma(number: 48, arabic: "ٱلْمَجِيدُ", transliteration: "El-Mecîd", meaning: "Kadr-ü şanı, yüceliği çok büyük olan"),
        DailyEsma(number: 49, arabic: "ٱلْبَاعِثُ", transliteration: "El-Bâis", meaning: "Ölüleri dirilten, peygamberler gönderen"),
        DailyEsma(number: 50, arabic: "ٱلشَّهِيدُ", transliteration: "Eş-Şehîd", meaning: "Her zamanda ve her yerde her şeye şahit olan"),
        DailyEsma(number: 51, arabic: "ٱلْحَقُّ", transliteration: "El-Hakk", meaning: "Varlığı mutlak ve gerçek olan, Hakk'ın kendisi"),
        DailyEsma(number: 52, arabic: "ٱلْوَكِيلُ", transliteration: "El-Vekîl", meaning: "Kendisine tevekkül edenlerin işlerini en iyi sonuçlandıran"),
        DailyEsma(number: 53, arabic: "ٱلْقَوِيُّ", transliteration: "El-Kaviyy", meaning: "Çok kuvvetli, mutlak kâdir olan"),
        DailyEsma(number: 54, arabic: "ٱلْمَتِينُ", transliteration: "El-Metîn", meaning: "Çok sağlam ve kudretli olan"),
        DailyEsma(number: 55, arabic: "ٱلْوَلِيُّ", transliteration: "El-Veliyy", meaning: "İnanan ve iyi kullarının dostu, yardımcısı"),
        DailyEsma(number: 56, arabic: "ٱلْحَمِيدُ", transliteration: "El-Hamîd", meaning: "Her türlü övgüye ve hamde layık olan"),
        DailyEsma(number: 57, arabic: "ٱلْمُحْصِي", transliteration: "El-Muhsî", meaning: "Kainattaki her şeyin sayısını ve teferruatını bilen"),
        DailyEsma(number: 58, arabic: "ٱلْمُبْدِئُ", transliteration: "El-Mübdi'", meaning: "Hiçbir örneği olmadan maddesiz olarak vareden"),
        DailyEsma(number: 59, arabic: "ٱلْمُعِيدُ", transliteration: "El-Muîd", meaning: "Yarattıklarını öldürdükten sonra tekrar dirilten"),
        DailyEsma(number: 60, arabic: "ٱلْمُحْيِي", transliteration: "El-Muhyî", meaning: "Can bağışlayan, hayat veren"),
        DailyEsma(number: 61, arabic: "ٱلْمُمِيتُ", transliteration: "El-Mümît", meaning: "Eceli gelen bütün canlılara ölümü tattıran"),
        DailyEsma(number: 62, arabic: "ٱلْحَيُّ", transliteration: "El-Hayy", meaning: "Daima diri olan, ezeli ve ebedi hayata sahip olan"),
        DailyEsma(number: 63, arabic: "ٱلْقَيُّومُ", transliteration: "El-Kayyûm", meaning: "Gökleri, yeri ve tüm varlıkları ayakta tutan"),
        DailyEsma(number: 64, arabic: "ٱلْوَاجِدُ", transliteration: "El-Vâcid", meaning: "İstediğini, dilediği vakit eksiksiz bulan"),
        DailyEsma(number: 65, arabic: "ٱلْمَاجِدُ", transliteration: "El-Mâcid", meaning: "Kadri büyük, keremi ve merhameti bol olan"),
        DailyEsma(number: 66, arabic: "ٱلْوَاحِدُ", transliteration: "El-Vâhid", meaning: "Zâtında, sıfatlarında, isimlerinde tek ve benzersiz olan"),
        DailyEsma(number: 67, arabic: "ٱلصَّمَدُ", transliteration: "Es-Samed", meaning: "Herkesin muhtaç olduğu, kendisi kimseye muhtaç olmayan"),
        DailyEsma(number: 68, arabic: "ٱلْقَادِرُ", transliteration: "El-Kâdir", meaning: "İstediğini yapmaya her zaman gücü yeten"),
        DailyEsma(number: 69, arabic: "ٱلْمُقْتَدِرُ", transliteration: "El-Muktedir", meaning: "Sınırsız güç ve iktidar sahibi olan"),
        DailyEsma(number: 70, arabic: "ٱلْمُقَدِّمُ", transliteration: "El-Mukaddim", meaning: "Dilediğini öne alan, ileri geçiren"),
        DailyEsma(number: 71, arabic: "ٱلْمُؤَخِّرُ", transliteration: "El-Muahhir", meaning: "Dilediğini geride bırakan, erteleyen"),
        DailyEsma(number: 72, arabic: "ٱلْأَوَّلُ", transliteration: "El-Evvel", meaning: "Her şeyden önce var olan, başlangıcı olmayan"),
        DailyEsma(number: 73, arabic: "ٱلْآخِرُ", transliteration: "El-Âhir", meaning: "Her şey helak olduktan sonra da daim olan"),
        DailyEsma(number: 74, arabic: "ٱلظَّاهِرُ", transliteration: "Ez-Zâhir", meaning: "Yarattığı eserleriyle varlığı sayısız delillerle apaçık olan"),
        DailyEsma(number: 75, arabic: "ٱلْبَاطِنُ", transliteration: "El-Bâtın", meaning: "Akılların idrakinden ve varlıkların gözünden gizli olan"),
        DailyEsma(number: 76, arabic: "ٱلْوَالِي", transliteration: "El-Vâlî", meaning: "Bütün evreni tek başına yöneten, idare eden"),
        DailyEsma(number: 77, arabic: "ٱلْمُتَعَالِي", transliteration: "El-Müteâlî", meaning: "Her türlü noksanlıklardan ve benzetmelerden münezzeh ve yüce olan"),
        DailyEsma(number: 78, arabic: "ٱلْبَرُّ", transliteration: "El-Berr", meaning: "Kullarına karşı iyiliği, ihsanı ve şefkati bol olan"),
        DailyEsma(number: 79, arabic: "ٱلتَّوَّابُ", transliteration: "Et-Tevvâb", meaning: "Tövbeleri çokça kabul eden, günahları bağışlayan"),
        DailyEsma(number: 80, arabic: "ٱلْمُنْتَقِمُ", transliteration: "El-Müntakim", meaning: "Suçlulara, isyancılara hak ettikleri cezayı veren"),
        DailyEsma(number: 81, arabic: "ٱلْعَفُوُّ", transliteration: "El-Afüvv", meaning: "Kulunun günahlarını tamamen silen, affeden"),
        DailyEsma(number: 82, arabic: "ٱلرَّءُوفُ", transliteration: "Er-Raûf", meaning: "Çok şefkatli, merhamet ve lütfu pek bol olan"),
        DailyEsma(number: 83, arabic: "مَالِكُ ٱلْمُلْكِ", transliteration: "Mâlikü'l-Mülk", meaning: "Mülkün mutlak, tek ve ebedi sahibi"),
        DailyEsma(number: 84, arabic: "ذُو ٱلْجَلَالِ وَٱلْإِكْرَامِ", transliteration: "Zü'l-Celâli ve'l-İkrâm", meaning: "Sonsuz ihtişam, kerem ve ikram sahibi olan"),
        DailyEsma(number: 85, arabic: "ٱلْمُقْسِطُ", transliteration: "El-Muksit", meaning: "Bütün işlerini adalet, uyum ve dengeyle yapan"),
        DailyEsma(number: 86, arabic: "ٱلْجَامِعُ", transliteration: "El-Câmi'", meaning: "Dilediklerini istediği zaman, dilediği yerde toplayan"),
        DailyEsma(number: 87, arabic: "ٱلْغَنِيُّ", transliteration: "El-Ganiyy", meaning: "Gerçek zenginlik sahibi, hiçbir şeye ve kimseye muhtaç olmayan"),
        DailyEsma(number: 88, arabic: "ٱلْمُغْنِي", transliteration: "El-Muğnî", meaning: "Dilediği kulunu zenginleştiren, her şeyden müstağni kılan"),
        DailyEsma(number: 89, arabic: "ٱلْمَانِعُ", transliteration: "El-Mâni'", meaning: "Kötü şeylerin meydana gelmesine engel olan"),
        DailyEsma(number: 90, arabic: "ٱلضَّارُّ", transliteration: "Ed-Dârr", meaning: "Elem, zarar ve ziyan verecek şeyleri yaratan"),
        DailyEsma(number: 91, arabic: "ٱلنَّافِعُ", transliteration: "En-Nâfi'", meaning: "Hayır ve menfaat verecek şeyleri yaratan, fayda veren"),
        DailyEsma(number: 92, arabic: "ٱلنُّورُ", transliteration: "En-Nûr", meaning: "Alemleri, zihinleri ve kalpleri nurlandırıp aydınlatan"),
        DailyEsma(number: 93, arabic: "ٱلْهَادِي", transliteration: "El-Hâdî", meaning: "Kullarına doğru yolu gösteren, hidayet veren"),
        DailyEsma(number: 94, arabic: "ٱلْبَدِيعُ", transliteration: "El-Bedî'", meaning: "Benzersiz, örneksiz ve eşsiz güzellikte yaratan"),
        DailyEsma(number: 95, arabic: "ٱلْبَاقِي", transliteration: "El-Bâkî", meaning: "Varlığının başlangıcı ve sonu olmayan, ebedi olan"),
        DailyEsma(number: 96, arabic: "ٱلْوَارِثُ", transliteration: "El-Vâris", meaning: "Mahlukat yok olduktan sonra da baki kalan, her şeyin yegane sahibi"),
        DailyEsma(number: 97, arabic: "ٱلرَّشِيدُ", transliteration: "Er-Reşîd", meaning: "Bütün işleri isabetli ve doğru olan, doğru yolu gösterip irşad eden"),
        DailyEsma(number: 98, arabic: "ٱلصَّبُورُ", transliteration: "Es-Sabûr", meaning: "Çok sabırlı olan, günahkarları cezalandırmada acele etmeyen"),
        DailyEsma(number: 99, arabic: "ٱللَّٰهُ", transliteration: "Allah", meaning: "Bütün kemali sıfatları kendinde toplayan yüce yaratıcının Zât ismi")
    ]
    
    // MARK: - Day-based Esma Selection
    
    static func esmaForDate(_ date: Date) -> DailyEsma {
        let calendar = Calendar.current
        let dayOfYear = calendar.ordinality(of: .day, in: .year, for: date) ?? 1
        let index = abs(dayOfYear - 1) % allEsma.count
        return allEsma[index]
    }
    
    // MARK: - Hourly Esma Selection
    
    static func hourlyEsmaForDate(_ date: Date) -> DailyEsma {
        let calendar = Calendar.current
        let dayOfYear = calendar.ordinality(of: .day, in: .year, for: date) ?? 1
        let hour = calendar.component(.hour, from: date)
        let index = abs(dayOfYear * 24 + hour) % allEsma.count
        return allEsma[index]
    }
    
    // MARK: - Placeholder
    
    static var placeholder: EsmaEntry {
        EsmaEntry(
            date: Date(),
            esma: esmaForDate(Date())
        )
    }
}
