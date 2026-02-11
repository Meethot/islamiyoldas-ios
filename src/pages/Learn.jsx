import React, { useState, useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Droplets, BookOpen, Heart, Moon, PartyPopper, CheckCircle2, RotateCcw, Sparkles as SparklesIcon, Shield, Flower2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';

// Secde (sujood) ikonu - erkek namazı için
const SecdeIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <circle cx="6" cy="14" r="2" />
        <path d="M8 15c1.5 1 3 2 5 2h5c1 0 2-.5 2-1.5S19 14 18 14h-4l-2-2c-.5-.5-1.5-1-2.5-1H8v4z" />
        <rect x="2" y="18" width="20" height="1.5" rx="0.75" />
    </svg>
);

const CATEGORIES = [
    { id: 'abdest', label: 'Abdest', icon: Droplets },
    { id: 'dualar', label: 'Dualar', icon: Heart },
    { id: 'sureler', label: 'Sureler', icon: BookOpen },
    { id: 'namazlar', label: 'Erkek Namazı', icon: SecdeIcon },
    { id: 'kadinNamaz', label: 'Kadın Namazı', icon: SparklesIcon },
];

const GUIDES = {
    abdest: {
        title: 'Abdest Rehberi',
        steps: [
            {
                title: 'Niyet',
                instruction: 'Kalbinden abdest almaya niyet et. Dil ile söylemek gerekmez ama söylenebilir.',
                arabic: 'نَوَيْتُ اَنْ اَتَوَضَّأَ لِرِضَا اللهِ تَعَالَى',
                transcription: "Neveytü en etevadda’e li-ridâillâhi teâlâ.",
                meaning: "Allah’ın rızası için abdest almaya niyet ettim.",
                tips: ['Niyet kalbin işidir', 'Abdest boyunca niyeti muhafaza et']
            },
            {
                title: 'Eûzu Besmele',
                instruction: 'Abdestin başında Eûzu Besmele çekilir.',
                arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ ، بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
                transcription: 'Eûzu billâhi mineş-şeytânir-racîm. Bismillâhir-rahmânir-rahîm.',
                meaning: 'Kovulmuş şeytanın şerrinden Allah’a sığınırım. Rahman ve Rahim olan Allah’ın adıyla.',
                tips: ['Besmele abdestin sünnetidir', 'Huzurla başla']
            },
            {
                title: 'Elleri Yıkama',
                repeat: '3x tekrar',
                instruction: 'Elleri bileklere kadar (bilekler dahil) üç kere yıka. Parmak aralarını iyice ovala ve suyu her yerine ulaştır.',
                arabic: 'بِسْمِ اللهِ الْعَظِيمِ وَالْحَمْدُ للهِ عَلَى دِينِ اْلاِسْلاَمِ',
                transcription: "Bismillâhil-azîmi vel-hamdü lillâhi alâ dînil-İslâm.",
                meaning: "Yüce Allah’ın adıyla başlarım. İslam dinini bize nasip eden Allah’a hamd olsun.",
                tips: ['Yüzük varsa altına su geçecek şekilde oynatılmalı', 'Kuru yer kalmamasına dikkat edilmeli', 'Parmak aralarını hilallemek sünnettir']
            },
            {
                title: 'Diş Temizliği (Misvak)',
                instruction: 'Misvak, diş fırçası veya sağ elin parmakları ile dişleri ve diş etlerini temizlemek sünnettir. Dişler üst-alt ve sağ-sol olarak fırçalanır.',
                arabic: 'اَللَّهُمَّ بَارِكْ لِي فِي فَمِي',
                transcription: 'Allahümme bârik lî fî femî.',
                meaning: 'Allah’ım! Ağzımda benim için bereket halk eyle.',
                tips: ['Misvak kullanmak abdestin müstehaplarındandır', 'Yoksa sağ elin işaret ve orta parmağıyla dişler ovalanır']
            },
            {
                title: 'Ağza Su Verme (Mazmaza)',
                repeat: '3x tekrar',
                instruction: 'Sağ elinle ağzına üç kere su al. Her seferinde suyu ağzında iyice çalkala ve tükür. Dişlerin, damağın ve dilin ıslanmasını sağla.',
                arabic: 'اَللَّهُمَّ اَسْقِنِي مِنْ حَوْضِ نَبِيِّكَ كَاْساً لاَ اَظْمَأُ بَعْدَهُ اَبَداً',
                transcription: "Allahümme eskınî min havdi nebiyyike ke’sen lâ ezmeü ba’dehü ebedâ.",
                meaning: "Allah’ım! Peygamberinin havzından bana öyle bir kadeh içir ki, ondan sonra asla susamayayım.",
                tips: ['Oruçluysan suyu genzine kaçırmamaya dikkat et', 'Ağzın her yerine su ulaşmalı']
            },
            {
                title: 'Burna Su Verme (İstinşak)',
                repeat: '3x tekrar',
                instruction: 'Sağ elinle burnuna üç kere su çek. Sol elinle sümkürerek burnu temizle. Suyu hafifçe genzine doğru çek.',
                arabic: 'اَللَّهُمَّ اَرِحْنِي رَائِحَةَ الْجَنَّةِ',
                transcription: 'Allahümme erihnî râihatel cenneti.',
                meaning: 'Allah’ım! Bana cennetin kokusunu duyur.',
                tips: ['Oruçluysan suyu fazla çekme', 'Burnun her iki deliği de temizlenmeli']
            },
            {
                title: 'Yüzü Yıkama (Farz)',
                repeat: '3x tekrar',
                instruction: 'Alnın üst kısmındaki saç bitim çizgisinden çene altına, bir kulak yumuşağından diğerine kadar bütün yüzünü üç kere yıka. Kaşların, göz çukurlarının ve sakal altının ıslanmasına dikkat et.',
                arabic: 'اَللَّهُمَّ بَيِّضْ وَجْهِي بِنُورِكَ يَوْمَ تَبْيَضُّ وُجُوهٌ وَتَسْوَدُّ وُجُوهٌ',
                transcription: 'Allahümme beyyid vechî binûrike yevme tebyaddu vücûhün ve tesveddü vücûh.',
                meaning: 'Allah’ım! Bazı yüzlerin ağarıp, bazı yüzlerin kararacağı günde benim yüzümü nurunla ak et.',
                tips: ['Sakal olan erkekler sakal altını hilallemeli', 'Göz pınarları ve burun kenarları temizlenmeli', 'Yüz yıkamak abdestin farzlarındandır']
            },
            {
                title: 'Sağ Kolu Yıkama (Farz)',
                repeat: '3x tekrar',
                instruction: 'Sağ kolunu parmak uçlarından dirseklere kadar (dirsekler dahil) üç kere yıka. Su her yere ulaşmalı.',
                arabic: 'اَللَّهُمَّ اَعْطِنِي كِتَابِي بِيَمِينِي وَحَاسِبْنِي حِسَاباً يَسِيراً',
                transcription: "Allahümme a’tinî kitâbî biyemînî ve hâsibnî hisâben yesîrâ.",
                meaning: "Allah’ım! Kitabımı sağ tarafımdan ver ve hesabımı kolaylaştır.",
                tips: ['Dirsekler mutlaka yıkanmalı (farzdır)', 'Kol kıvrımlarına dikkat edilmeli', 'Sağ koldan başlamak sünnettir']
            },
            {
                title: 'Sol Kolu Yıkama (Farz)',
                repeat: '3x tekrar',
                instruction: 'Sol kolunu parmak uçlarından dirseklere kadar (dirsekler dahil) üç kere yıka.',
                arabic: 'اَللَّهُمَّ لاَ تُعْطِنِي كِتَابِي بِشِمَالِي وَلاَ مِنْ وَرَاءِ ظَهْرِي',
                transcription: "Allahümme lâ tut’inî kitâbî bişimâlî velâ min verâi zahrî.",
                meaning: 'Allah’ım! Kitabımı solumdan ve arkamdan verme.',
                tips: ['Sıralama önemli: önce sağ, sonra sol (tertip sünnettir)', 'Kuru yer kalmamalı']
            },
            {
                title: 'Başın Mesh Edilmesi (Farz)',
                instruction: 'Ellerini yeni suyla ıslat. Islak ellerini alnın saç bitim çizgisinden enseye doğru çek, sonra enseden alna doğru geri getir. Başın en az dörtte birini mesh etmek farzdır, tamamını mesh etmek sünnettir.',
                arabic: 'اَللَّهُمَّ غَشِّنِي بِرَحْمَتِكَ وَأَنْزِلْ عَلَيَّ مِنْ بَرَكَاتِكَ',
                transcription: 'Allahümme ğaşşinî birahmetike ve enzil aleyye min berekâtike.',
                meaning: 'Allah’ım! Beni rahmetinle kuşat, üzerime bereketlerini indir.',
                tips: ['Mesh: ıslak elle sıvazlama demektir, yıkama değildir', 'Kaplama mesh (tüm baş) daha faziletlidir', 'Mesh için yeni su almak gerekir']
            },
            {
                title: 'Kulakların Meshi',
                instruction: 'Başı mesh eden ıslak ellerle kulakları mesh et. İşaret parmaklarını kulak deliğine, baş parmaklarını kulak arkasına koy ve aynı anda mesh et.',
                arabic: 'اَللَّهُمَّ اجْعَلْنِي مِنَ الَّذِينَ يَسْتَمِعُونَ الْقَوْلَ فَيَتَّبِعُونَ اَحْسَنَهُ',
                transcription: "Allahümme’c-alnî minellezîne yestemiûnel kavle feyettebiûne ahseneh.",
                meaning: 'Allah’ım! Beni sözü dinleyip de en güzeline uyanlardan eyle.',
                tips: ['İşaret parmağı kulak içini, baş parmak kulak arkasını mesh eder', 'Kulak memesinin arkası da mesh edilir']
            },
            {
                title: 'Boynun Meshi',
                instruction: 'Her iki elin dış yüzeyiyle (el sırtıyla) boynunun yan ve arka kısmını mesh et. Boğaz (ön kısım) mesh edilmez.',
                arabic: 'اَللَّهُمَّ اَعْتِقْ رَقَبَتِي مِنَ النَّارِ',
                transcription: "Allahümme a’tık rakabetî minen nâr.",
                meaning: 'Allah’ım! Boynumu cehennem ateşinden azad eyle.',
                tips: ['Mesh el sırtıyla yapılır, avuç içiyle değil', 'Sadece ense ve boyun yanları mesh edilir', 'Boğaza mesh yapılmaz']
            },
            {
                title: 'Sağ Ayak Yıkama (Farz)',
                repeat: '3x tekrar',
                instruction: 'Sağ ayağını topuk kemikleri dahil üç kere yıka. Parmak aralarını sol elin küçük parmağıyla hilalle (ayak serçe parmağından başlayarak).',
                arabic: 'اَللَّهُمَّ ثَبِّتْ قَدَمَيَّ عَلَى الصِّرَاطِ يَوْمَ تَزِلُّ فِيهِ الْأَقْدَامُ',
                transcription: 'Allahümme sebbit kademeyye ales-sırâtı yevme tezillü fîhil akdâm.',
                meaning: 'Allah’ım! Ayakların kaydığı günde ayaklarımı sırat üzerinde sabit kıl.',
                tips: ['Parmak araları mutlaka hilallenmeli', 'Topuklar çoğu insanın eksik bıraktığı yerdir', 'Aşık kemikleri dahil yıkanmalı']
            },
            {
                title: 'Sol Ayak Yıkama (Farz)',
                repeat: '3x tekrar',
                instruction: 'Sol ayağını topuk kemikleri dahil üç kere yıka. Parmak aralarını aynı şekilde hilalle.',
                arabic: 'اَللَّهُمَّ اجْعَلْ سَعْيِي مَشْكُوراً وَذَنْبِي مَغْفُوراً',
                transcription: "Allahümme’c-al sa’yî meşkûran ve zenbî mağfûrâ.",
                meaning: 'Allah’ım! Çalışmamı şükre layık, günahımı bağışlanmış eyle.',
                tips: ['Sol ayakla abdest tamamlanır', 'Topuk ve aşık kemiklerini kontrol et']
            },
            {
                title: 'Abdest Sonrası Dua',
                instruction: 'Abdest bittikten sonra göğe doğru bakarak veya kıbleye dönerek Kelime-i Şehadet ve dua okunur. Bu duayı okuyana cennetin sekiz kapısı açılır.',
                arabic: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ ، اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ',
                transcription: "Eşhedü en lâ ilâhe illallâhü vahdehü lâ şerîke leh, ve eşhedü enne Muhammeden abdühü ve rasûlüh. Allahümme’c-alnî minet-tevvâbîne vec’alnî minel-mütetahhirîn.",
                meaning: "Şehadet ederim ki Allah’tan başka ilah yoktur, O tektir, ortağı yoktur. Muhammed O’nun kulu ve elçisidir. Allah’ım! Beni çok tövbe edenlerden ve çok temizlenenlerden eyle.",
                tips: ['Müslim rivayet etmiştir', 'Bu duayı okuyana cennetin 8 kapısı açılır', 'Abdest sonrası 2 rekat namaz kılmak da sünnettir']
            }
        ]
    },
    dualar: {
        title: 'Elli Dua (Gönül İlaçları)',
        steps: [
            {
                title: 'Rabbena Âtina',
                instruction: 'En kapsamlı dünya ve ahiret duası. Peygamberimiz (s.a.v) en çok bu duayı ederdi.',
                arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
                transcription: 'Rabbenâ âtinâ fid-dünyâ haseneten ve fil-âhirati haseneten ve kınâ azâbennâr.',
                meaning: 'Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi cehennem azabından koru.',
                tips: ['Bakara Suresi, 201. Ayet', 'Peygamberimiz (s.a.v) en çok bu duayı ederdi.'],
            },
            {
                title: 'Rabbi Yessir',
                instruction: 'İşlerin kolaylaşması için dua. Her işe başlarken okunması tavsiye edilir.',
                arabic: 'رَبِّ يَسِّرْ وَلاَ تُعَسِّرْ ، رَبِّ تَمِّمْ بِالْخَيْرِ',
                transcription: 'Rabbi yessir ve lâ tuassir, Rabbi temmim bil-hayr.',
                meaning: 'Rabbim! Kolaylaştır zorlaştırma, Rabbim hayırla sonuçlandır.',
                tips: ['Hadis kaynaklıdır', 'Her işe başlarken okunması tavsiye edilir.'],
            },
            {
                title: 'Hasbünallah',
                instruction: 'Zorluklara karşı Allah’a güvenmek.',
                arabic: 'حَسْبُنَا اللهُ وَنِعْمَ الْوَكِيلُ',
                transcription: 'Hasbünallâhu ve ni’mel vekîl.',
                meaning: 'Allah bize yeter, O ne güzel vekildir.',
                tips: ['Ali İmran Suresi, 173. Ayet', 'Hz. İbrahim ateşe atılırken okumuştur.'],
            },
            {
                title: 'Hz. Yunus’un Duası',
                instruction: 'Sıkıntı ve darlıktan kurtuluş duası.',
                arabic: 'لاَ اِلَهَ اِلاَّ اَنْتَ سُبْحَانَكَ اِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
                transcription: 'Lâ ilâhe illâ ente sübhâneke innî küntü minez-zâlimîn.',
                meaning: 'Senden başka ilah yoktur. Seni tenzih ederim. Şüphesiz ben zalimlerden oldum.',
                tips: ['Enbiya Suresi, 87. Ayet', 'Balığın karnındaki Yunus (a.s)’un kurtuluş duası.'],
            },
            {
                title: 'Seyyidül İstiğfar',
                instruction: 'Tövbelerin en büyüğü ve efendisi.',
                arabic: 'اَللَّهُمَّ اَنْتَ رَبِّي لاَ اِلَهَ اِلاَّ اَنْتَ خَلَقْتَنِي وَاَنَا عَبْدُكَ',
                transcription: 'Allahümme ente Rabbî lâ ilâhe illâ ente halaktenî ve ene abdüke...',
                meaning: 'Allah’ım! Sen benim Rabbimsin. Senden başka ilah yoktur. Beni Sen yarattın ve ben Senin kulunum...',
                tips: ['Buhari', 'Sabah okuyup akşam ölen, akşam okuyup sabah ölen cennetliktir.'],
            },
            {
                title: 'Kadir Gecesi Duası',
                instruction: 'Hz. Ayşe’ye öğretilen af duası.',
                arabic: 'اَللَّهُمَّ اِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
                transcription: 'Allahümme inneke afuvvun tuhibbul afve fa’fu annî.',
                meaning: 'Allah’ım! Sen çok affedicisin, affetmeyi seversin. Beni bağışla.',
                tips: ['Tirmizi', 'Kandil gecelerinde ve ramazanda çokça okunmalı.'],
            },
            {
                title: 'Hz. Adem’in Tövbesi',
                instruction: 'Günah ve hatalardan pişmanlık.',
                arabic: 'رَبَّنَا ظَلَمْنَا اَنْفُسَنَا وَاِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',
                transcription: 'Rabbenâ zalemnâ enfüsenâ ve in lem tağfir lenâ ve terhamnâ lenekûnenne minel hâsirîn.',
                meaning: 'Rabbimiz! Biz kendimize zulmettik. Eğer bizi bağışlamaz ve bize merhamet etmezsen hüsrana uğrayanlardan oluruz.',
                tips: ['Araf Suresi, 23. Ayet', 'İlk insan ve ilk tövbe.'],
            },
            {
                title: 'Hz. Musa’nın Duası (İnşirah)',
                instruction: 'Konuşma zorluğu ve heyecan için.',
                arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي اَمْرِي وَاحْلُلْ عُقْدَةً مِنْ لِسَانِي يَفْقَهُوا قَوْلِي',
                transcription: 'Rabbişrah lî sadrî ve yessir lî emrî vahlul ukdeten min lisânî yefkahû kavlî.',
                meaning: 'Rabbim! Göğsüme genişlik ver, işimi kolaylaştır. Dilimdeki düğümü çöz ki sözümü anlasınlar.',
                tips: ['Taha Suresi, 25-28. Ayetler', 'Topluluk önünde konuşurken okunur.'],
            },
            {
                title: 'Rabbi Zidni',
                instruction: 'İlim ve anlayış artırma.',
                arabic: 'رَبِّ زِدْنِي عِلْمًا وَفَهْمًا',
                transcription: 'Rabbi zidnî ilmen ve fehmen.',
                meaning: 'Rabbim! İlmimi ve anlayışımı artır.',
                tips: ['Taha Suresi, 114. Ayet', 'Zihin açıklığı ve ders başarısı için.'],
            },
            {
                title: 'Rabbenağfirlî',
                instruction: 'Hesap günü bağışlanma duası.',
                arabic: 'رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ',
                transcription: 'Rabbenâğfirlî ve li-vâlideyye ve lil-mü’minîne yevme yekûmul hisâb.',
                meaning: 'Rabbimiz! Hesap kurulacağı gün beni, anamı, babamı ve müminleri bağışla.',
                tips: ['İbrahim Suresi, 41. Ayet', 'Hz. İbrahim’in duasıdır.'],
            },
            {
                title: 'Evden Çıkarken',
                instruction: 'Dışarıdaki tehlikelerden korunmak.',
                arabic: 'بِسْمِ اللهِ تَوَكَّلْتُ عَلَى اللهِ لاَ حَوْلَ وَلاَ قُوَّةَ اِلاَّ بِاللهِ',
                transcription: 'Bismillâhi tevekkeltü alellâhi lâ havle ve lâ kuvvete illâ billâh.',
                meaning: 'Allah’ın adıyla. Allah’a tevekkül ettim. Güç ve kuvvet ancak Allah’tandır.',
                tips: ['Tirmizi', 'Bunu okuyana şeytan yaklaşamaz denilmiştir.'],
            },
            {
                title: 'Yemek Duası (Başlarken)',
                instruction: 'Yemeğe bereket katmak.',
                arabic: 'بِسْمِ اللهِ ، اَللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ',
                transcription: 'Bismillah. Allahümme bârik lenâ fîmâ razaktenâ ve kınâ azâbennâr.',
                meaning: 'Bismillah. Allah’ım! Bize verdiğin rızkı bereketlendir ve bizi ateş azabından koru.',
                tips: ['Unutulursa \'Bismillahi evvelehu ve ahirahu\' denir.'],
            },
            {
                title: 'Yemek Duası (Bitince)',
                instruction: 'Nimete şükretmek.',
                arabic: 'اَلْحَمْدُ للهِ الَّذِي اَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مِنَ الْمُسْلِمِينَ',
                transcription: 'Elhamdülillâhillezî at’amenâ ve sekânâ ve cealenâ minel müslimîn.',
                meaning: 'Bizi yediren, içiren ve Müslümanlardan kılan Allah’a hamd olsun.',
                tips: ['Tirmizi', 'Sofradan kalkmadan okunur.'],
            },
            {
                title: 'Uyanınca Okunan Dua',
                instruction: 'Güne şükürle başlamak.',
                arabic: 'اَلْحَمْدُ للهِ الَّذِي اَحْيَانَا بَعْدَ مَا اَمَاتَنَا وَاِلَيْهِ النُّشُورُ',
                transcription: 'Elhamdülillâhillezî ahyânâ ba’de mâ emâtenâ ve ileyhin-nüşûr.',
                meaning: 'Bizi öldükten (uyuduktan) sonra dirilten Allah’a hamd olsun. Dönüş O’nadır.',
                tips: ['Buhari', 'Sabah uyanır uyanmaz ilk söz bu olmalı.'],
            },
            {
                title: 'Yatarken Okunan Dua',
                instruction: 'Günü Allah ile bitirmek.',
                arabic: 'بِاسْمِكَ اللَّهُمَّ اَمُوتُ وَاَحْيَا',
                transcription: 'Bismike Allahümme emûtü ve ahyâ.',
                meaning: 'Allah’ım! Senin adınla ölür (uyur) ve Senin adınla dirilirim (uyanırım).',
                tips: ['Buhari', 'Sağ tarafa yatıp avuç içine üfleyerek İhlas-Felak-Nas okunur.'],
            },
            {
                title: 'Yolculuk Duası',
                instruction: 'Kazadan beladan korunmak.',
                arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ',
                transcription: 'Sübhânellezî sehhara lenâ hâzâ ve mâ künnâ lehû mukrinîn.',
                meaning: 'Bunu bizim hizmetimize veren Allah’ı tenzih ederiz; yoksa biz buna güç yetiremezdik.',
                tips: ['Zuhruf Suresi, 13. Ayet', 'Her vasıtaya bindiğinde okunur.'],
            },
            {
                title: 'Eve Girerken',
                instruction: 'Eve bereket getirmek için.',
                arabic: 'اَللَّهُمَّ اِنِّي اَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ',
                transcription: 'Allahümme innî es’elüke hayral mevlici ve hayral mahraci.',
                meaning: 'Allah’ım! Senden girişin de çıkışın da hayırlısını isterim.',
                tips: ['Ebu Davud', 'Girerken selam vermek bereketi artırır.'],
            },
            {
                title: 'Camiye Girerken',
                instruction: 'Allah’ın rahmetini istemek.',
                arabic: 'اَللَّهُمَّ افْتَحْ لِي اَبْوَابَ رَحْمَتِكَ',
                transcription: 'Allahümmeftah lî ebvâbe rahmetik.',
                meaning: 'Allah’ım! Bana rahmet kapılarını aç.',
                tips: ['Müslim', 'Sağ ayakla girilir.'],
            },
            {
                title: 'Tuvalete Girerken',
                instruction: 'Manevi kirlerden sığınma.',
                arabic: 'اَللَّهُمَّ اِنِّي اَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ',
                transcription: 'Allahümme innî eûzü bike minel hubusi vel habâis.',
                meaning: 'Allah’ım! Pislikten ve pis şeylerden (şeytanlardan) Sana sığınırım.',
                tips: ['Buhari', 'Sol ayakla girilir.'],
            },
            {
                title: 'Aynaya Bakarken',
                instruction: 'Ahlak güzelliği istemek.',
                arabic: 'اَللَّهُمَّ كَمَا حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي',
                transcription: 'Allahümme kemâ hassente halkî fehassin hulukî.',
                meaning: 'Allah’ım! Yaratılışımı güzel yaptığın gibi ahlakımı da güzelleştir.',
                tips: ['İbn Hibban', 'Kişisel bakım yaparken okunur.'],
            },
            {
                title: 'Şifa Duası',
                instruction: 'Hasta ziyareti veya ağrı için.',
                arabic: 'اَذْهِبِ الْبَأْسَ رَبَّ النَّاسِ اِشْفِ اَنْتَ الشَّافِي',
                transcription: 'Ezhibil be’se rabben-nâsi işfi enteş-şâfî lâ şifâe illâ şifâuke.',
                meaning: 'Bu hastalığı gider ey insanların Rabbi! Şifa ver, çünkü şifa verici Sensin. Senin şifandan başka şifa yoktur.',
                tips: ['Buhari', 'Ağrıyan yere el konularak okunur.'],
            },
            {
                title: 'Korunma Duası (Bismillâhillezi)',
                instruction: 'Sabah-akşam okuyana zarar gelmez.',
                arabic: 'بِسْمِ اللهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي اْلاَرْضِ وَلاَ فِي السَّمَاءِ',
                transcription: 'Bismillâhillezî lâ yedurru meas-mihî şey’un fil ardı ve lâ fis-semâi.',
                meaning: 'İsmiyle beraber yerde ve gökte hiçbir şeyin zarar veremediği Allah’ın adıyla.',
                tips: ['Tirmizi', 'Sabah ve akşam 3 kere okunur.'],
            },
            {
                title: 'Kısa İstiğfar',
                instruction: 'Sürekli dil alışkanlığı için.',
                arabic: 'اَسْتَغْفِرُ اللهَ الْعَظِيمَ وَاَتُوبُ اِلَيْهِ',
                transcription: 'Estağfirullâhel-azîm ve etûbü ileyh.',
                meaning: 'Yüce Allah’tan bağışlanma diler ve O’na tövbe ederim.',
                tips: ['Günde en az 100 kere söylenmelidir.', 'Günahlara kefarettir.'],
            },
            {
                title: 'Salavat-ı Şerife',
                instruction: 'Peygamberimize selam.',
                arabic: 'اَللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ',
                transcription: 'Allahümme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed.',
                meaning: 'Allah’ım! Efendimiz Muhammed’e ve onun aline salat ve selam eyle.',
                tips: ['En kısa ve öz salavattır.', 'Her duanın başında ve sonunda okunmalı.'],
            },
            {
                title: 'Rabbena La Tuzig',
                instruction: 'Kalbi hidayet üzere sabit kılma.',
                arabic: 'رَبَّنَا لاَ تُزِغْ قُلُوبَنَا بَعْدَ اِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً',
                transcription: 'Rabbenâ lâ tüziğ kulûbenâ ba’de iz hedeytenâ ve heb lenâ min ledünke rahmeh.',
                meaning: 'Rabbimiz! Bizi doğru yola ilettikten sonra kalplerimizi eğriltme. Bize katından bir rahmet bağışla.',
                tips: ['Ali İmran Suresi, 8. Ayet', 'İmanla ölmek için okunur.'],
            },
            {
                title: 'Hz. Eyyüb’ün Şifa Duası',
                instruction: 'Hastalık anında okunacak dua.',
                arabic: 'اَنِّي مَسَّنِيَ الضُّرُّ وَاَنْتَ اَرْحَمُ الرَّاحِمِينَ',
                transcription: 'Ennî messeniyed-durru ve ente erhamur-râhimîn.',
                meaning: 'Şüphesiz ki bana bu dert dokundu. Sen merhametlilerin en merhametlisisin.',
                tips: ['Enbiya Suresi, 83. Ayet', 'Sabır ve şifa istemek için.'],
            },
            {
                title: 'Borç ve Sıkıntı Duası',
                instruction: 'Hz. Peygamber’in öğrettiği ferahlık duası.',
                arabic: 'اَللَّهُمَّ اِنِّي اَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ... وَغَلَبَةِ الدَّيْنِ',
                transcription: 'Allahümme innî eûzü bike minel hemmi vel hazeni ve minel aczi vel keseli... ve ğalebetid-deyni...',
                meaning: 'Allah’ım! Kederden, hüzünden, acizlikten, tembellikten, borç yükünden Sana sığınırım.',
                tips: ['Buhari', 'Sabah akşam okunması tavsiye edilmiştir.'],
            },
            {
                title: 'Nazar Ayeti',
                instruction: 'Göz değmesine karşı.',
                arabic: 'وَاِنْ يَكَادُ الَّذِينَ كَفَرُوا لَيُزْلِقُونَكَ بِاَبْصَارِهِمْ',
                transcription: 'Ve in yekâdullezîne keferû leyuzlikûneke biebsârihim lemmâ semiuz-zikra...',
                meaning: 'İnkar edenler Zikr’i (Kur’an’ı) işittikleri zaman, neredeyse seni gözleriyle devireceklerdi.',
                tips: ['Kalem Suresi, 51-52. Ayetler', 'Nazara karşı en etkili ayettir.'],
            },
            {
                title: 'Sıkıntı Anında (La ilahe illallah)',
                instruction: 'Büyük sıkıntılar için.',
                arabic: 'لاَ اِلَهَ اِلاَّ اللهُ الْعَظِيمُ الْحَلِيمُ',
                transcription: 'Lâ ilâhe illâllâhül azîmül halîm, Lâ ilâhe illâllâhü rabbül arşil azîm.',
                meaning: 'Azim ve Halim olan Allah’tan başka ilah yoktur. Büyük Arş’ın Rabbi Allah’tan başka ilah yoktur.',
                tips: ['Buhari', 'Peygamberimiz sıkıntılı anlarda bunu tekrar ederdi.'],
            },
            {
                title: 'Zor Bir İşle Karşılaşınca',
                instruction: 'Kolaylık istemek.',
                arabic: 'اَللَّهُمَّ لاَ سَهْلَ اِلاَّ مَا جَعَلْتَهُ سَهْلاً',
                transcription: 'Allahümme lâ sehle illâ mâ cealtehû sehlen ve ente tec’alül hazne izâ şi’te sehlen.',
                meaning: 'Allah’ım! Senin kolay kıldığından başka kolay yoktur. Sen dilersen zor olanı kolay kılarsın.',
                tips: ['İbn Hibban', 'Sınav, iş görüşmesi vb. öncesi okunur.'],
            },
            {
                title: 'Vücut Ağrısı İçin',
                instruction: 'Peygamberimizin tavsiyesi.',
                arabic: 'بِسْمِ اللهِ (3) اَعُوذُ بِاللهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا اَجِدُ وَاُحَاذِرُ (7)',
                transcription: 'Bismillah (3 kere). Eûzü billâhi ve kudretihî min şerri mâ ecidü ve uhâziru (7 kere).',
                meaning: 'Allah’ın adıyla. Hissettiğim ve sakındığım acının şerrinden Allah’a ve O’nun kudretine sığınırım.',
                tips: ['Müslim', 'Ağrıyan yere el konulup okunur.'],
            },
            {
                title: 'Tehlike Anında',
                instruction: 'Koruma kalkanı.',
                arabic: 'اَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
                transcription: 'Eûzü bikelimâtillâhit-tâmmâti min şerri mâ halak.',
                meaning: 'Yarattığı şeylerin şerrinden Allah’ın tam kelimelerine sığınırım.',
                tips: ['Müslim', 'Bir yere konaklayınca veya korkunca okunur.'],
            },
            {
                title: 'Vesveseye Karşı',
                instruction: 'Şeytanın fısıltılarına karşı.',
                arabic: 'آمَنْتُ بِاللَّهِ وَرُسُلِهِ',
                transcription: 'Âmentü billâhi ve rusülih.',
                meaning: 'Allah’a ve peygamberlerine iman ettim.',
                tips: ['Müslim', 'Bunu söyleyip şeytandan Allah’a sığınılmalıdır.'],
            },
            {
                title: 'Bereket Duası (Karınca)',
                instruction: 'Rızık bolluğu için.',
                arabic: 'اَللَّهُمَّ يَا رَبَّ جَبْرَائِيلَ وَمِيكَائِيلَ... اُرْزُقْنِي',
                transcription: 'Allahümme yâ Rabbe Cebrâîle ve Mîkâîle... ürzuknî...',
                meaning: 'Ey Cebrail ve Mikail’in Rabbi olan Allah’ım! Beni rızıklandır.',
                tips: ['Halk arasında Karınca Duası olarak bilinir, rızık için okunur.'],
            },
            {
                title: 'Salât-ı Tefriciye (Nariye)',
                instruction: 'Sıkıntıların giderilmesi için.',
                arabic: 'اَللَّهُمَّ صَلِّ صَلاَةً كَامِلَةً وَسَلِّمْ سَلاَماً تَامّاً عَلَى سَيِّدِنَا مُحَمَّدٍ',
                transcription: 'Allahümme salli salâten kâmileten ve sellim selâmen tâmmen alâ seyyidinâ Muhammedin...',
                meaning: 'Allah’ım! Efendimiz Muhammed’e kusursuz bir salat ve mükemmel bir selam eyle...',
                tips: ['4444 kere okunmasıyla meşhurdur.', 'Büyük hacetler için okunur.'],
            },
            {
                title: 'Salât-ı Münciye (Tuncina)',
                instruction: 'Belalardan kurtuluş salavatı.',
                arabic: 'اَللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ صَلاَةً تُنْجِينَا بِهَا مِنْ جَمِيعِ اْلاَحْوَالِ وَاْلآفَاتِ',
                transcription: 'Allahümme salli alâ seyyidinâ Muhammedin salâten tüncînâ bihâ min cemîil ahvâli vel âfât.',
                meaning: 'Allah’ım! Efendimiz Muhammed’e öyle bir salat et ki, onunla bizi her türlü korku ve afetten kurtar.',
                tips: ['Namazlardan sonra okunması çok faziletlidir.'],
            },
            {
                title: 'Namaz Sonrası İstiğfar',
                instruction: 'Selamdan sonra.',
                arabic: 'اَللَّهُمَّ اَنْتَ السَّلاَمُ وَمِنْكَ السَّلاَمُ تَبَارَكْتَ يَا ذَا الْجَلاَلِ وَاْلاِكْرَامِ',
                transcription: 'Allahümme entes-selâmü ve minkes-selâm, tebârakte yâ zel-celâli vel-ikrâm.',
                meaning: 'Allah’ım! Sen Selam’sın (esenlik sahibisin). Esenlik Sendendir. Ey Celal ve İkram sahibi, Sen münezzehsin.',
                tips: ['Müslim', 'Farz namazlardan sonra okunur.'],
            },
            {
                title: 'Kabul Duası',
                instruction: 'İbadetlerin kabulü için.',
                arabic: 'رَبَّنَا تَقَبَّلْ مِنَّا اِنَّكَ اَنْتَ السَّمِيعُ الْعَلِيمُ',
                transcription: 'Rabbenâ tekabbel minnâ inneke entes-semîul alîm.',
                meaning: 'Rabbimiz! Bizden kabul buyur. Şüphesiz Sen hakkıyla işitensin, hakkıyla bilensin.',
                tips: ['Bakara Suresi, 127. Ayet', 'Kabe inşa edilirken Hz. İbrahim’in duası.'],
            },
            {
                title: 'Şehadet Getirmek',
                instruction: 'İman tazeleme.',
                arabic: 'اَشْهَدُ اَنْ لاَ اِلَهَ اِلاَّ اللهُ وَاَشْهَدُ اَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
                transcription: 'Eşhedü en lâ ilâhe illâllâh ve eşhedü enne Muhammeden abdühû ve rasûlüh.',
                meaning: 'Şehadet ederim ki Allah’tan başka ilah yoktur ve yine şehadet ederim ki Muhammed O’nun kulu ve elçisidir.',
                tips: ['İmanın temelidir.', 'Sık sık tekrar edilerek iman tazelenir.'],
            },
            {
                title: 'Hatim/Bitiş Duası',
                instruction: 'Her duanın ve meclisin sonunda okunur.',
                arabic: 'سُبْحَانَ رَبِّكَ رَبِّ الْعِزَّةِ عَمَّا يَصِفُونَ وَسَلاَمٌ عَلَى الْمُرْسَلِينَ وَالْحَمْدُ للهِ رَبِّ الْعَالَمِينَ',
                transcription: 'Sübhâne Rabbike Rabbil-izzeti ammâ yasifûn. Ve selâmün alel-mürselîn. Vel-hamdü lillâhi Rabbil-âlemîn.',
                meaning: 'Senin Rabbin; kudret ve şeref sahibi olan Rab, onların nitelemelerinden münezzehtir. Peygamberlere selam olsun. Hamd Alemlerin Rabbi Allah’a mahsustur.',
                tips: ['Saffat Suresi, 180-182. Ayetler', 'Her duanın ve meclisin sonunda okunur.'],
            },
            {
                title: 'Sübhâneke',
                instruction: 'Namazın başlangıç duası. İftitah tekbirinden sonra okunur.',
                arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلاَ اِلَهَ غَيْرُكَ',
                transcription: 'Sübhânekellahümme ve bihamdike ve tebârekesmüke ve teâlâ ceddüke ve lâ ilâhe ğayrük.',
                meaning: 'Allah’ım! Seni bütün noksanlıklardan tenzih eder, Sana hamd ederim. Senin adın mübarektir. Senin şanın yücedir. Senden başka ilah yoktur.',
                tips: ['Her namazın ilk rekatında okunur.', 'Cenaze namazında da okunur.'],
            },
            {
                title: 'Ettehiyyatü',
                instruction: 'Namazda oturuşlarda okunan dua.',
                arabic: 'اَلتَّحِيَّاتُ للهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ اَلسَّلاَمُ عَلَيْكَ اَيُّهَا النَّبِيُّ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ اَلسَّلاَمُ عَلَيْنَا وَعَلَى عِبَادِ اللهِ الصَّالِحِينَ اَشْهَدُ اَنْ لاَ اِلَهَ اِلاَّ اللهُ وَاَشْهَدُ اَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
                transcription: 'Ettehiyyâtü lillâhi ves-salevâtü vet-tayyibât. Esselâmü aleyke eyyühen-nebiyyü ve rahmetullahi ve berekâtüh. Esselâmü aleynâ ve alâ ibâdillâhis-sâlihîn. Eşhedü en lâ ilâhe illâllâh ve eşhedü enne Muhammeden abdühû ve rasûlüh.',
                meaning: 'Bütün dil ile yapılan, beden ile yapılan ve mal ile yapılan ibadetler Allah’a mahsustur. Ey Peygamber! Allah’ın selamı, rahmeti ve bereketi senin üzerine olsun. Selam bizim ve Allah’ın salih kullarının üzerine olsun. Şehadet ederim ki Allah’tan başka ilah yoktur ve Muhammed O’nun kulu ve elçisidir.',
                tips: ['Her namazda okunması farzdır.', 'Oturarak ve sağ elin işaret parmağı kaldırılarak okunur.'],
            },
            {
                title: 'Allahümme Salli',
                instruction: 'Namazda Ettehiyyatü’den sonra okunan salavat.',
                arabic: 'اَللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى اِبْرَاهِيمَ وَعَلَى آلِ اِبْرَاهِيمَ اِنَّكَ حَمِيدٌ مَجِيدٌ',
                transcription: 'Allahümme salli alâ Muhammedin ve alâ âli Muhammed. Kemâ salleyte alâ İbrâhîme ve alâ âli İbrâhîm. İnneke hamîdün mecîd.',
                meaning: 'Allah’ım! Muhammed’e ve Muhammed’in ailesine rahmet et. İbrahim’e ve İbrahim’in ailesine rahmet ettiğin gibi. Şüphesiz Sen övülmeye layıksın, yücesin.',
                tips: ['Namazda son oturuşta okunur.', 'Ettehiyyatü’den hemen sonra gelir.'],
            },
            {
                title: 'Allahümme Bârik',
                instruction: 'Namazda Salli’den sonra okunan dua.',
                arabic: 'اَللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى اِبْرَاهِيمَ وَعَلَى آلِ اِبْرَاهِيمَ اِنَّكَ حَمِيدٌ مَجِيدٌ',
                transcription: 'Allahümme bârik alâ Muhammedin ve alâ âli Muhammed. Kemâ bârekte alâ İbrâhîme ve alâ âli İbrâhîm. İnneke hamîdün mecîd.',
                meaning: 'Allah’ım! Muhammed’e ve Muhammed’in ailesine bereket ver. İbrahim’e ve İbrahim’in ailesine bereket verdiğin gibi. Şüphesiz Sen övülmeye layıksın, yücesin.',
                tips: ['Salli’den hemen sonra okunur.', 'Namazın vaciplerinden sayılır.'],
            },
            {
                title: 'Rabbena Âtina (Âmenerrasulü Sonu)',
                instruction: 'Bakara Suresi’nin son iki ayetinin duası.',
                arabic: 'رَبَّنَا لاَ تُؤَاخِذْنَا اِنْ نَسِينَا اَوْ اَخْطَأْنَا رَبَّنَا وَلاَ تَحْمِلْ عَلَيْنَا اِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِنْ قَبْلِنَا رَبَّنَا وَلاَ تُحَمِّلْنَا مَا لاَ طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا اَنْتَ مَوْلاَنَا فَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
                transcription: 'Rabbenâ lâ tuâhıznâ in nesînâ ev ahtanâ. Rabbenâ ve lâ tahmil aleynâ ısran kemâ hameltehu alellezîne min kablinâ. Rabbenâ ve lâ tuhammilnâ mâ lâ tâkate lenâ bih. Va’fu annâ, vağfir lenâ, verhamnâ, ente mevlânâ fensurnâ alel-kavmil-kâfirîn.',
                meaning: 'Rabbimiz! Unutursak veya yanılırsak bizi sorumlu tutma. Rabbimiz! Bizden öncekilere yüklediğin gibi bize ağır yük yükleme. Rabbimiz! Gücümüzün yetmediğini bize taşıtma. Bizi affet, bizi bağışla, bize merhamet et. Sen bizim Mevlâmızsın.',
                tips: ['Bakara Suresi, 286. Ayet', 'Her gece yatmadan önce okunması tavsiye edilir.'],
            },
            {
                title: 'Kunut Duaları',
                instruction: 'Vitir namazının üçüncü rekatında okunan dualar.',
                arabic: 'اَللَّهُمَّ اِنَّا نَسْتَعِينُكَ وَنَسْتَغْفِرُكَ وَنَسْتَهْدِيكَ وَنُؤْمِنُ بِكَ وَنَتُوبُ اِلَيْكَ وَنَتَوَكَّلُ عَلَيْكَ',
                transcription: 'Allahümme innâ nesteînüke ve nestağfiruke ve nestehdîke ve nü’minü bike ve netûbü ileyke ve netevekkelü aleyke.',
                meaning: 'Allah’ım! Senden yardım isteriz, Senden bağışlanma dileriz, Senden hidayet isteriz, Sana iman ederiz, Sana tövbe ederiz, Sana tevekkül ederiz.',
                tips: ['Vitir namazında Fatiha ve sureden sonra okunur.', 'Kunut 1 ve Kunut 2 birlikte okunur.'],
            },
            {
                title: 'Cenaze Namazı Duası',
                instruction: 'Cenaze namazında ölü için okunan dua.',
                arabic: 'اَللَّهُمَّ اغْفِرْ لِحَيِّنَا وَمَيِّتِنَا وَشَاهِدِنَا وَغَائِبِنَا وَصَغِيرِنَا وَكَبِيرِنَا وَذَكَرِنَا وَاُنْثَانَا',
                transcription: 'Allahümmağfir lihayyinâ ve meyyitinâ ve şâhidinâ ve ğâibinâ ve sağîrinâ ve kebîrinâ ve zekerinâ ve ünsânâ.',
                meaning: 'Allah’ım! Dirimizi, ölümüzü, burada olanımızı, olmayanımızı, küçüğümüzü, büyüğümüzü, erkek ve kadınlarımızı bağışla.',
                tips: ['Cenaze namazının üçüncü tekbirinden sonra okunur.', 'Ebu Davud, Tirmizi'],
            },
            {
                title: 'Sabah-Akşam Zikri',
                instruction: 'Her sabah ve akşam okunması tavsiye edilen koruyucu zikir.',
                arabic: 'اَللَّهُ لاَ اِلَهَ اِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ',
                transcription: 'Allahu lâ ilâhe illâ hüvel hayyül kayyûm. Lâ te’huzühü sinetün ve lâ nevm...',
                meaning: 'Allah, O’ndan başka ilah olmayan, diri ve her şeye hakim olandır. O’nu ne uyuklama ne de uyku tutar...',
                tips: ['Ayetel Kürsi (Bakara 255)', 'Sabah ve akşam okunana koruma sağlar.'],
            },
            {
                title: 'Cuma Günü Salavatı',
                instruction: 'Cuma günü bolca okunması tavsiye edilen salavat.',
                arabic: 'اَللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ اَجْمَعِينَ',
                transcription: 'Allahümme salli ve sellim alâ seyyidinâ Muhammedin ve alâ âlihî ve sahbihî ecmaîn.',
                meaning: 'Allah’ım! Efendimiz Hz. Muhammed’e, ailesine ve bütün ashabına salat ve selam eyle.',
                tips: ['Cuma günü 100 salavat okuyanın 80 yıllık günahı bağışlanır.', 'İhya, Beyhaki'],
            }
        ]
    },
    sureler: {
        title: 'Sureler Rehberi',
        steps: [
            {
                title: 'Fâtiha Suresi',
                instruction: 'Kur\'an\'ın açılış kapısıdır. Namazın her rekatında okunması vaciptir.',
                arabic: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
                transcription: 'Bismillâhirrahmânirrahîm. Elhamdülillâhi rabbil\'alemin. Errahmânir\'rahim. Mâliki yevmiddin. İyyâke na\'budü ve iyyâke neste\'în. İhdinessırâtel müstakîm. Sırâtellezine en\'amte aleyhim ğayrilmağdûbi aleyhim ve leddâllîn.',
                meaning: 'Rahman ve Rahim olan Allah\'ın adıyla. Hamd, Alemlerin Rabbi, Rahman ve Rahim olan ve Din Gününün sahibi olan Allah\'a mahsustur. (Allahım!) Yalnız Sana ibadet ederiz ve yalnız Senden yardım dileriz. Bizi doğru yola, kendilerine nimet verdiklerinin yoluna ilet; gazaba uğrayanlarınkine ve sapıklarınkine değil.',
                tips: ['"Amin" kelimesi Fatiha\'dan sonra söylenir.', 'Kur\'an\'ın özü kabul edilir.']
            },
            {
                title: 'Fil Suresi',
                instruction: 'Kabe\'yi yıkmaya gelen Ebrehe\'nin ordusunun ebabil kuşlarıyla yok edilişini anlatır.',
                arabic: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ ۝ أَلَمْ يَجْعَلْ كَيْدَهُمْ فِي تَضْلِيلٍ ۝ وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ ۝ تَرْمِيهِمْ بِحِجَارَةٍ مِنْ سِجِّيلٍ ۝ فَجَعَلَهُمْ كَعَصْفٍ مَأْكُولٍ',
                transcription: 'Bismillâhirrahmânirrahîm. Elem tera keyfe fe\'ale rabbüke biashâbilfîl. Elem yec\'al keydehüm fî tadlîl. Ve ersele aleyhim tayran ebâbîl. Termîhim bihicâratin min siccîl. Fece\'alehüm ke\'asfin me\'kûl.',
                meaning: 'Rabbinin, fil sahiplerine ne yaptığını görmedin mi? Onların tuzaklarını boşa çıkarmadı mı? Üzerlerine sürü sürü kuşlar gönderdi. Onlara çamurdan sertleşmiş taşlar atıyorlardı. Nihayet onları yenilmiş ekin yaprağı gibi yapıverdi.',
                tips: ['Kabe\'nin kutsallığını ve korunmasını anlatır.', 'Namazda zamm-ı sure olarak okunur.']
            },
            {
                title: 'Kureyş Suresi',
                instruction: 'Kureyş kabilesine verilen güven ve nimetleri hatırlatır.',
                arabic: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ لِإِيلَافِ قُرَيْشٍ ۝ إِيلَافِهِمْ رِحْلَةَ الشِّتَاءِ وَالصَّيْفِ ۝ فَلْيَعْبُدُوا رَبَّ هَذَا الْبَيْتِ ۝ الَّذِي أَطْعَمَهُمْ مِنْ جُوعٍ وَآمَنَهُمْ مِنْ خَوْفٍ',
                transcription: 'Bismillâhirrahmânirrahîm. Li\'îlâfi Kureyşin. Îlâfihim rihleteşşitâi vessayf. Felye\'büdû rabbe hâzelbeyt. Ellezî et\'amehüm min cû\'in ve âmenehüm min havf.',
                meaning: 'Kureyş\'i ısındırıp alıştırdığı; onları kışın ve yazın yolculuğuna alıştırdığı için, Kureyş de, kendilerini besleyip açlıklarını gideren ve onları korkudan emin kılan bu Ev\'in (Kabe\'nin) Rabbine kulluk etsin.',
                tips: ['Nimetlere şükrü hatırlatır.', 'Ticaret ve güvenliğin Allah\'ın lütfu olduğu vurgulanır.']
            },
            {
                title: 'Maûn Suresi',
                instruction: 'Gösteriş yapanları ve yardıma engel olanları uyarır.',
                arabic: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ ۝ فَذَلِكَ الَّذِي يَدُعُّ الْيَتِيمَ ۝ وَلَا يَحُضُّ عَلَى طَعَامِ الْمِسْكِينِ ۝ فَوَيْلٌ لِلْمُصَلِّينَ ۝ الَّذِينَ هُمْ عَنْ صَلَاتِهِمْ سَاهُونَ ۝ الَّذِينَ هُمْ يُرَاءُونَ ۝ وَيَمْنَعُونَ الْمَاعُونَ',
                transcription: 'Bismillâhirrahmânirrahîm. Era\'eytellezî yükezzibü biddîn. Fezâlikellezî yedü\'ulyetîm. Ve lâ yehuddu alâ ta\'âmil miskîn. Feveylün lilmusallîn. Ellezîne hüm an salâtihim sâhûn. Ellezîne hüm yürâûn. Ve yemne\'ûnel mâ\'ûn.',
                meaning: 'Dini yalanlayanı gördün mü? İşte o, yetimi itip kakar; yoksulu doyurmaya teşvik etmez. Yazıklar olsun o namaz kılanlara ki; onlar namazlarını ciddiye almazlar. Onlar gösteriş yaparlar. Ufacık bir yardıma bile engel olurlar.',
                tips: ['Sosyal yardımlaşmanın önemini vurgular.', 'Samimiyetsiz ibadeti eleştirir.']
            },
            {
                title: 'Kevser Suresi',
                instruction: 'Kur\'an\'ın en kısa suresidir. Peygamberimize verilen bitmez tükenmez nimet anlatılır.',
                arabic: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ ۝ فَصَلِّ لِرَبِّكَ وَانْحَرْ ۝ إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ',
                transcription: 'Bismillâhirrahmânirrahîm. İnnâ a\'taynâkelkevser. Fesalli lirabbike venhar. İnne şâni\'eke hüvel ebter.',
                meaning: 'Şüphesiz Biz sana Kevser\'i (bol nimeti) verdik. O halde, Rabbin için namaz kıl ve kurban kes. Asıl soyu kesik olan, şüphesiz sana kin besleyendir.',
                tips: ['Kevser: Cennette bir havuz ve çok nimet.', 'Kurban ibadetinin emredildiği süredir.']
            },
            {
                title: 'Kâfirûn Suresi',
                instruction: 'İnançta taviz verilmeyeceğini, senin dinin sana, benimki bana ilkesini anlatır.',
                arabic: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ قُلْ يَا أَيُّهَا الْكَافِرُونَ ۝ لَا أَعْبُدُ مَا تَعْبُدُونَ ۝ وَلَا أَنْتُمْ عَابِدُونَ مَا أَعْبُدُ ۝ وَلَا أَنَا عَابِدٌ مَا عَبَدْتُمْ ۝ وَلَا أَنْتُمْ عَابِدُونَ مَا أَعْبُدُ ۝ لَكُمْ دِينُكُمْ وَلِيَ دِينِ',
                transcription: 'Bismillâhirrahmânirrahîm. Kul yâ eyyühel kâfirûn. Lâ a\'büdü mâ ta\'büdûn. Ve lâ entüm âbidûne mâ a\'büd. Ve lâ ene âbidün mâ abedtüm. Ve lâ entüm âbidûne mâ a\'büd. Leküm dînüküm veliye dîn.',
                meaning: 'De ki: Ey kâfirler! Ben sizin tapmakta olduğunuz şeylere tapmam. Siz de benim taptığıma tapıyor değilsiniz. Ben sizin taptıklarınıza tapacak değilim. Siz de benim taptığıma tapacak değilsiniz. Sizin dininiz size, benim dinim banadır.',
                tips: ['Tevhid inancının kesin sınırlarını çizer.', 'İnanca saygı ve kararlılık vurgulanır.']
            },
            {
                title: 'Nasr Suresi',
                instruction: 'Mekke\'nin fethini müjdeler. Peygamberimizin vefatının yaklaştığına işarettir.',
                arabic: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ ۝ وَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا ۝ فَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ إِنَّهُ كَانَ تَوَّابًا',
                transcription: 'Bismillâhirrahmânirrahîm. İzâ câe nasrullâhivelfeth. Ve raeytennâse yedhulûne fî dînillâhi efvâcâ. Fesebbih bihamdi rabbike vestağfirh. İnnehû kâne tevvâbâ.',
                meaning: 'Allah\'ın yardımı ve fetih (Mekke\'nin fethi) geldiğinde; ve insanların bölük bölük Allah\'ın dinine girdiğini gördüğünde; Rabbini hamd ile tesbih et ve O\'ndan bağışlanma dile. Şüphesiz O, tövbeleri çok kabul edendir.',
                tips: ['Kur\'an\'ın en son inen tam suresidir.', 'Zafer anında bile tevekkül öğütlenir.']
            },
            {
                title: 'Tebbet Suresi',
                instruction: 'Peygamberimizin amcası Ebu Leheb\'in inkarcılığını ve sonunu anlatır.',
                arabic: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ ۝ مَا أَغْنَى عَنْهُ مَالُهُ وَمَا كَسَبَ ۝ سَيَصْلَى نَارًا ذَاتَ لَهَبٍ ۝ وَامْرَأَتُهُ حَمَّالَةَ الْحَطَبِ ۝ فِي جِيدِهَا حَبْلٌ مِنْ مَسَدٍ',
                transcription: 'Bismillâhirrahmânirrahîm. Tebbet yedâ ebî lehebin ve tebb. Mâ ağnâ anhü mâlühû ve mâ keseb. Seyaslâ nâran zâte leheb. Vemraetüh. Hammâletelhatab. Fî cîdihâ hablün min mesed.',
                meaning: 'Ebu Leheb\'in elleri kurusun! Kurudu da. Malı ve kazandıkları ona fayda vermedi. O, alevli bir ateşe girecektir. Odun taşıyıcısı olarak karısı da (ateşe girecek). Boynunda hurma lifinden bükülmüş bir ip olduğu halde.',
                tips: ['"Tebbet": Kurusun, yok olsun demektir.', 'Zalımların sonunun hüsran olduğu anlatılır.']
            },
            {
                title: 'İhlâs Suresi',
                instruction: 'Allah\'ın birliğini en net anlatan suredir. Okumak, Kur\'an\'ın üçte birine denktir.',
                arabic: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
                transcription: 'Bismillâhirrahmânirrahîm. Kul hüvallâhü ehad. Allâhüssamed. Lem yelid ve lem yûled. Ve lem yekün lehû küfüven ehad.',
                meaning: 'De ki: O Allah tektir. Allah Samed\'dir (Her şey O\'na muhtaçtır, O hiçbir şeye muhtaç değildir). O, doğurmamış ve doğmamıştır. O\'nun hiçbir dengi yoktur.',
                tips: ['Tevhidin en kısa ve öz ifadesidir.', 'Namazlarda çok sık okunur.']
            },
            {
                title: 'Felak Suresi',
                instruction: 'Büyüden, karanlıktan ve kıskançlıktan Allah\'a sığınmayı öğretir.',
                arabic: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ',
                transcription: 'Bismillâhirrahmânirrahîm. Kul e\'ûzü birabbilfelak. Min şerri mâ halak. Ve min şerri ğâsikın izâ vekab. Ve min şerrinneffâsâti fil\'ukad. Ve min şerri hâsidin izâ hased.',
                meaning: 'De ki: Yarattığı şeylerin şerrinden, karanlığı çöktüğü zaman gecenin şerrinden, düğümlere üfleyen büyücülerin şerrinden ve haset ettiği zaman hasetçinin şerrinden sabahın Rabbine sığınırım.',
                tips: ['Muavvizeteyn (Koruyucu iki sure) dualarından biridir.', 'Nazar ve büyüye karşı okunur.']
            },
            {
                title: 'Nâs Suresi',
                instruction: 'İnsanların ve cinlerin sinsi vesveselerinden Allah\'a sığınmayı öğretir.',
                arabic: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَهِ النَّاسِ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ',
                transcription: 'Bismillâhirrahmânirrahîm. Kul e\'ûzü birabbinnâs. Melikinnâs. İlâhinnâs. Min şerrilvesvâsilhannâs. Ellezî yüvesvisü fî sudûrinnâs. Minelcinneti vennâs.',
                meaning: 'De ki: İnsanların ve cinlerin şerrinden, insanların göğüslerine vesvese veren o sinsi vesvesecinin şerrinden; insanların Rabbine, insanların Melikine (Hükümdarına), insanların İlahına sığınırım.',
                tips: ['Kur\'an\'ın son suresidir.', 'Psikolojik ve manevi korunma için okunur.']
            },
            {
                title: 'Ayetel Kürsi',
                instruction: 'Kur\'an\'ın en yüce ayetidir. Namazlardan sonra ve yatmadan önce okunur.',
                arabic: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ',
                transcription: 'Allâhü lâ ilâhe illâ hüvel hayyül kayyûm. Lâ te\'huzühû sinetün ve lâ nevm. Lehû mâ fis-semâvâti ve mâ fil ard. Men zellezî yeşfeu indehû illâ bi-iznih. Ya\'lemü mâ beyne eydîhim ve mâ halfehüm. Ve lâ yuhîtûne bi-şey\'in min ilmihî illâ bimâ şâe. Vesia kürsiyyühüs-semâvâti vel ard. Ve lâ yeûdühû hıfzuhumâ ve hüvel aliyyül azîm.',
                meaning: 'Allah, O\'ndan başka ilah yoktur; O, Hayy\'dır (diridir), Kayyum\'dur (her şeyi ayakta tutandır). O\'nu ne bir uyuklama ne de bir uyku tutar. Göklerde ve yerde ne varsa O\'nundur. İzni olmadan O\'nun katında kim şefaat edebilir? O, kullarının yaptıklarını ve yapacaklarını bilir. Onlar ise, O\'nun dilediği kadarından başka ilminden hiçbir şeyi kavrayamazlar. O\'nun kürsüsü gökleri ve yeri kaplamıştır. Onları koruyup gözetmek O\'na ağır gelmez. O, Aliy\'dir (yücedir), Azim\'dir (büyüktür).',
                tips: ['Bakara Suresi\'nin 255. ayetidir.', 'İçinde "Allah\'ın Kürsüsü" geçtiği için bu adı almıştır.']
            }
        ]
    },
    namazlar: {
        title: 'Erkek Namazı (2 Rekat Örnek)',
        steps: [
            {
                title: '1. Niyet ve İftitah Tekbiri',
                instruction: 'Kıbleye dönülür. Ayaklar arasında 4 parmak boşluk bırakılır. Eller kulak hizasına kaldırılır, baş parmaklar kulak memelerine değer. Avuç içleri kıbleye bakar.',
                arabic: 'نَوَيْتُ أَنْ أُصَلِّيَ... اَللهُ اَكْبَرُ',
                transcription: '"Niyet ettim Allah rızası için (…) namazını kılmaya" denir. Sonra "Allâhu Ekber" diyerek tekbir alınır ve eller bağlanır.',
                meaning: 'Allah en büyüktür.',
                tips: ['Tekbir alırken ellerin içi kıbleye dönük olmalı.', 'Niyet kalben yapılır, dil ile söylemek vacip değildir ama söylenebilir.', 'Hangi namazı kılıyorsanız onu niyet edin (örn: sabah namazının farzı).']
            },
            {
                title: '2. Kıyam (Sübhaneke)',
                instruction: 'Eller göbek altında bağlanır. Sağ elin küçük parmağı ve başparmağı sol bileği kavrar, diğer üç parmak üste konur. Gözler secde yerine bakar.',
                arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلاَ إِلٰهَ غَيْرُكَ',
                transcription: 'Sübhânekellâhümme ve bi hamdike ve tebârakesmüke ve teâlâ ceddüke ve lâ ilâhe ğayrük.',
                meaning: 'Allah\'ım! Seni hamdinle tesbih ederim. Senin adın mübarektir. Senin şanın yücedir. Senden başka ilah yoktur.',
                tips: ['Sübhaneke sadece birinci rekatta okunur.', 'Sessizce (gizli) okunur.', 'Bu duadan sonra Euzü Besmele çekilir.']
            },
            {
                title: '3. Kıyam (Fatiha ve Sure)',
                instruction: 'Aynı duruşta kalınır. Hareket edilmez, sadece dudaklar kıpırdar.',
                arabic: 'أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ ، بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ ، الْفَاتِحَة... سُورَة',
                transcription: 'Euzü Besmele çekilir. Fatiha okunur, sonunda "Âmîn" denir. Ardından bir Zamm-ı Sure okunur (Örn: Kevser Suresi).',
                meaning: 'Fatiha ve sure ile Allah\'a yalvarılır.',
                tips: ['Birinci rekatta Euzü + Besmele çekilir.', 'Zamm-ı sure en az 3 kısa ayet veya 1 uzun ayet olmalıdır.', 'Fatiha\'nın sonunda "Âmîn" sessizce söylenir.']
            },
            {
                title: '4. Rükû',
                instruction: '"Allâhu Ekber" diyerek eğilinir. Sırt dümdüz (masa gibi), baş sırt hizasında. Parmaklar açık şekilde dizleri kavrar. Bacaklar ve kollar gergin.',
                arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
                transcription: 'En az 3 kere: "Sübhâne Rabbiyel Azîm"',
                meaning: 'Büyük olan Rabbimi tenzih ederim.',
                tips: ['Sırt ile baş aynı hizada, düz bir hat oluşturmalı.', 'Gözler ayak üstüne bakar.', 'Dizler bükülmez, gergin durur.']
            },
            {
                title: '5. Doğrulma (Kavme)',
                instruction: '"Semiallâhü limen hamideh" diyerek doğrulunur. Tam dik durulur ve "Rabbenâ lekel hamd" denir.',
                arabic: 'سَمِعَ اللهُ لِمَنْ حَمِدَهُ ، رَبَّنَا لَكَ الْحَمْدُ',
                transcription: 'Doğrulurken: "Semiallâhü limen hamideh". Dik durunca: "Rabbenâ lekel hamd".',
                meaning: 'Allah, kendisine hamd edeni işitti. Rabbimiz, hamd Sanadır.',
                tips: ['Bu duruşa "Kavme" denir ve vaciptir.', 'Tam doğrulmadan secdeye gidilmez (Tadil-i Erkan).', 'Eller yanlara salınır, bağlanmaz.']
            },
            {
                title: '6. Birinci Secde',
                instruction: '"Allâhu Ekber" diyerek secdeye gidilir. Sırasıyla: dizler, eller, burun ve alın yere konur. Dirsekler havada (yere değmez), karın uyluktan uzak tutulur.',
                arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
                transcription: 'En az 3 kere: "Sübhâne Rabbiyel A\'lâ"',
                meaning: 'Yüce olan Rabbimi tenzih ederim.',
                tips: ['7 organ üzerinde secde edilir: alın+burun, iki el, iki diz, iki ayağın parmakları.', 'Ayak parmak uçları kıbleye dönük ve yere basılı olmalı.', 'Kollar yanlara açık, vücuttan ayrık tutulur.']
            },
            {
                title: '7. İki Secde Arası Oturuş (Celse)',
                instruction: '"Allâhu Ekber" diyerek doğrulup oturulur. Sol ayak yatırılıp üzerine oturulur, sağ ayak dik tutulur (parmakları kıbleye). Eller dizlerin üzerine konur.',
                arabic: 'رَبِّ اغْفِرْ لِي وَارْحَمْنِي',
                transcription: '"Rabbiğfir lî verhamnî" — en az bir "Sübhânallah" diyecek kadar beklenir.',
                meaning: 'Rabbim, beni bağışla ve bana merhamet et.',
                tips: ['Bu oturuşa "Celse" denir ve vaciptir.', 'Oturmadan ikinci secdeye gidilmez.', 'Parmak uçları kıbleye dönük olmalıdır.']
            },
            {
                title: '8. İkinci Secde',
                instruction: 'Tekrar "Allâhu Ekber" diyerek secdeye kapanılır. Birinci secdedeki pozisyon aynen alınır.',
                arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
                transcription: 'En az 3 kere: "Sübhâne Rabbiyel A\'lâ"',
                meaning: 'Yüce olan Rabbimi tenzih ederim.',
                tips: ['Secde anı, kulun Allah\'a en yakın olduğu anıdır.', 'Bu makamda gönülden dua edilebilir.']
            },
            {
                title: '9. İkinci Rekat (Kıyam)',
                instruction: '"Allâhu Ekber" diyerek ayağa kalkılır. Eller göbek altında bağlanır, gözler secde yerine bakar.',
                arabic: 'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ ، الْفَاتِحَة... سُورَة',
                transcription: 'Sadece Besmele ile başlanır. Fatiha ve Zamm-ı Sure okunur (Örn: İhlas Suresi).',
                meaning: 'Kur\'an kıraati.',
                tips: ['İkinci rekatta Sübhaneke okunmaz.', 'Euzü (Euzübillah) çekilmez, sadece Besmele ile başlanır.', 'Zamm-ı sure birinci rekattan farklı olması müstehap.']
            },
            {
                title: '10. Rükû ve Secdeler',
                instruction: 'Birinci rekattaki gibi sırasıyla: Rükû → Kavme → 1. Secde → Celse → 2. Secde yapılır.',
                arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ ، سُبْحَانَ رَبِّيَ الْأَعْلَى',
                transcription: 'Rükûda: "Sübhâne Rabbiyel Azîm" | Secdelerde: "Sübhâne Rabbiyel A\'lâ" (en az 3\'er kere).',
                meaning: 'Rabbimi her haliyle tenzih ederim.',
                tips: ['Hareketler arasında sükunet (tuma\'nine) sağlanır.', 'Acele etmeden, her pozisyonun hakkı verilir (Tadil-i Erkan).']
            },
            {
                title: '11. Son Oturuş (Ettehiyyatü)',
                instruction: 'İkinci secdeden sonra oturulur. Sol ayak yatırılıp üstüne oturulur, sağ ayak dik. Eller dizlerde. Bakışlar kucağa yönelir.',
                arabic: 'اَلتَّحِيَّاتُ لِلّٰهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ اَلسَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ اَلسَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللهِ الصَّالِحِينَ أَشْهَدُ أَنْ لآ إِلٰهَ إِلَّا اللهُ وَأَشْهَدُ أَنَّ مُحَمَّداً عَبْدُهُ وَرَسُولُهُ',
                transcription: 'Ettehiyyâtü lillâhi ves-salevâtü vet-tayyibât. Esselâmü aleyke eyyühen-nebiyyü ve rahmetullâhi ve berakâtüh. Esselâmü aleynâ ve alâ ibâdillâhis-sâlihîn. Eşhedü en lâ ilâhe illallâh ve eşhedü enne Muhammeden abdühû ve rasûlüh.',
                meaning: 'Bütün tahiyyatlar, salavat ve tayyibat Allah içindir. Ey Peygamber! Selam, rahmet ve bereket sana olsun. Bize ve salih kullara selam olsun. Şehadet ederim ki Allah\'tan başka ilah yoktur ve Muhammed O\'nun kulu ve rasülüdür.',
                tips: ['Şehadet cümlesinde "Lâ ilâhe" derken sağ elin şehadet parmağı kaldırılır.', '"\'İllallâh" denince indirilir.', 'Bu dua Hz. Peygamber\'in Miraç gecesinin hatırasıdır.']
            },
            {
                title: '12. Salli, Barik ve Rabbena',
                instruction: 'Oturuş bozulmaz. Sırasıyla Salli, Barik ve Rabbena duaları okunur.',
                arabic: 'اَللّٰهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ... اَللّٰهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ... رَبَّنَآ آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
                transcription: 'Allahümme salli alâ Muhammedin ve alâ âli Muhammed... Allahümme bârik alâ Muhammedin ve alâ âli Muhammed... Rabbenâ âtinâ fid-dünyâ haseneten ve fil-âhirati haseneten ve kınâ azâben-nâr.',
                meaning: 'Allah\'ım! Muhammed\'e ve ailesine rahmet/bereket eyle. Rabbimiz! Bize dünyada da ahirette de iyilik ver ve bizi cehennem azabından koru.',
                tips: ['Son oturuşun vacip dualarıdır.', 'Rabbena\'dan sonra farklı dualar da eklenebilir.', 'Dua sırasında huşu ve edep korunur.']
            },
            {
                title: '13. Selam',
                instruction: 'Başı önce sağ omuza, sonra sol omuza çevirerek selam verilir.',
                arabic: 'اَلسَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللهِ',
                transcription: 'Sağa: "Esselâmü aleyküm ve rahmetullâh". Sola: "Esselâmü aleyküm ve rahmetullâh".',
                meaning: 'Allah\'ın selamı ve rahmeti üzerinize olsun.',
                tips: ['Sağa selamda sağ omuzdaki meleklere, sola selamda sol omuzdaki meleklere ve cemaate niyet edilir.', 'Namaz selamla tamamlanır, ellerinizi kaldırıp dua edebilirsiniz.']
            }
        ]
    },
    kadinNamaz: {
        title: 'Kadın Namazı (2 Rekat Örnek)',
        steps: [
            {
                title: '1. Niyet ve İftitah Tekbiri',
                instruction: 'Kıbleye dönülür. Ayaklar bitişik tutulur. Eller omuz hizasına kadar kaldırılır (kulak hizasına değil). Parmaklar bitişik, avuç içleri kıbleye bakar.',
                arabic: 'نَوَيْتُ أَنْ أُصَلِّيَ... اَللهُ اَكْبَرُ',
                transcription: '"Niyet ettim Allah rızası için (…) namazını kılmaya" denir. Sonra "Allâhu Ekber" diyerek tekbir alınır ve eller göğüs üzerinde bağlanır.',
                meaning: 'Allah en büyüktür.',
                tips: ['Erkeklerden farkı: Eller kulak hizasına değil, omuz hizasına kaldırılır.', 'Kollar vücuda yakın tutulur, yanlara açılmaz.', 'Tekbirden sonra eller göğüs üzerinde bağlanır (göbek altında değil).']
            },
            {
                title: '2. Kıyam (Sübhaneke)',
                instruction: 'Eller göğüs üzerinde bağlanır. Sağ el solun üzerine konur (bilek kavranmaz, sadece üstüne yerleştirilir). Ayaklar bitişik tutulur.',
                arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلاَ إِلٰهَ غَيْرُكَ',
                transcription: 'Sübhânekellâhümme ve bi hamdike ve tebârakesmüke ve teâlâ ceddüke ve lâ ilâhe ğayrük.',
                meaning: 'Allah\'ım! Seni hamdinle tesbih ederim. Senin adın mübarektir. Senin şanın yücedir. Senden başka ilah yoktur.',
                tips: ['Sübhaneke sadece birinci rekatta okunur.', 'Sessizce okunur, gözler secde yerine bakar.', 'Erkeklerden farkı: Sağ el sol eli kavramaz, sadece üstüne konur.']
            },
            {
                title: '3. Kıyam (Fatiha ve Sure)',
                instruction: 'Eller göğüs üstünde bağlı kalır. Sükunetle, kıpırdamadan durulur.',
                arabic: 'أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ ، بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ ، الْفَاتِحَة... سُورَة',
                transcription: 'Euzü Besmele çekilir. Fatiha okunur, sonunda "Âmîn" denir. Ardından bir Zamm-ı Sure okunur (Örn: Kevser Suresi).',
                meaning: 'Fatiha ve sure ile Allah\'a yalvarılır.',
                tips: ['Birinci rekatta Euzü + Besmele çekilir.', 'Ses sadece kendi duyacağı kadar çıkar (gizli okunur).', 'Zamm-ı sure en az 3 kısa ayet veya 1 uzun ayet olmalıdır.']
            },
            {
                title: '4. Rükû',
                instruction: '"Allâhu Ekber" diyerek hafifçe eğilinir. Sırt dümdüz yapılmaz, erkeklere göre daha dik durulur. Dizler hafif bükük. Eller dizlerin üzerine konur (kavranmaz, sadece üstüne yerleştirilir).',
                arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
                transcription: 'En az 3 kere: "Sübhâne Rabbiyel Azîm"',
                meaning: 'Büyük olan Rabbimi tenzih ederim.',
                tips: ['Erkeklerden farkı: Sırt 90 derece yapılmaz, daha dik ve toplu durulur.', 'Parmaklar bitişik şekilde dizlere konur (erkeklerde açık ve kavrayarak).', 'Kollar vücuda yakın, dirsekler yanlara açılmaz.']
            },
            {
                title: '5. Doğrulma (Kavme)',
                instruction: '"Semiallâhü limen hamideh" diyerek doğrulunur. Tam dik durulur ve "Rabbenâ lekel hamd" denir.',
                arabic: 'سَمِعَ اللهُ لِمَنْ حَمِدَهُ ، رَبَّنَا لَكَ الْحَمْدُ',
                transcription: 'Doğrulurken: "Semiallâhü limen hamideh". Dik durunca: "Rabbenâ lekel hamd".',
                meaning: 'Allah, kendisine hamd edeni işitti. Rabbimiz, hamd Sanadır.',
                tips: ['Kavme vaciptir, tam doğrulmadan secdeye gidilmez.', 'Erkeklerle aynı şekilde uygulanır.', 'Eller yanlara salınır.']
            },
            {
                title: '6. Birinci Secde',
                instruction: '"Allâhu Ekber" diyerek secdeye gidilir. Kollar yere yapıştırılır (havada tutulmaz). Karın bacaklara bitişik, vücut toplanarak secde edilir.',
                arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
                transcription: 'En az 3 kere: "Sübhâne Rabbiyel A\'lâ"',
                meaning: 'Yüce olan Rabbimi tenzih ederim.',
                tips: ['Erkeklerden farkı: Dirsekler yere değer (erkeklerde havada).', 'Karın bacaklara yapışık, vücut mümkün olduğunca toplu tutulur.', 'Bu duruş tesettüre en uygun haldir.']
            },
            {
                title: '7. İki Secde Arası Oturuş (Celse)',
                instruction: '"Allâhu Ekber" diyerek doğrulup oturulur. Her iki ayak sağ tarafa çıkarılır ve yere oturulur (Teverrük oturuşu). Eller dizlerin üzerine konur.',
                arabic: 'رَبِّ اغْفِرْ لِي وَارْحَمْنِي',
                transcription: '"Rabbiğfir lî verhamnî" — en az bir "Sübhânallah" diyecek kadar beklenir.',
                meaning: 'Rabbim, beni bağışla ve bana merhamet et.',
                tips: ['Erkeklerden farkı: Sol ayağın üzerine oturulmaz, ayaklar sağa çıkarılıp yere oturulur.', 'Bu kadınlara özel oturuş şekli "Teverrük" olarak adlandırılır.', 'Celse vaciptir, oturmadan ikinci secdeye gidilmez.']
            },
            {
                title: '8. İkinci Secde',
                instruction: 'Tekrar "Allâhu Ekber" diyerek secdeye kapanılır. Birinci secdedeki pozisyon aynen alınır — kollar yere yapışık, vücut toplu.',
                arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
                transcription: 'En az 3 kere: "Sübhâne Rabbiyel A\'lâ"',
                meaning: 'Yüce olan Rabbimi tenzih ederim.',
                tips: ['Alın ve burun yerde sabitlenir.', 'Secde anı, kulun Allah\'a en yakın olduğu andır.', 'Bu makamda gönülden dua edilebilir.']
            },
            {
                title: '9. İkinci Rekat (Kıyam)',
                instruction: '"Allâhu Ekber" diyerek ayağa kalkılır. Eller göğüs üzerinde bağlanır. Ayaklar bitişik tutulur.',
                arabic: 'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ ، الْفَاتِحَة... سُورَة',
                transcription: 'Sadece Besmele ile başlanır. Fatiha ve Zamm-ı Sure okunur (Örn: İhlas Suresi).',
                meaning: 'Kur\'an kıraati.',
                tips: ['İkinci rekatta Sübhaneke okunmaz.', 'Euzü (Euzübillah) çekilmez, sadece Besmele ile başlanır.', 'Zamm-ı sure birinci rekattan farklı olması müstehap.']
            },
            {
                title: '10. Rükû ve Secdeler',
                instruction: 'Birinci rekattaki gibi sırasıyla: Rükû (hafif eğilme) → Kavme → 1. Secde (toplu duruş) → Celse (Teverrük) → 2. Secde yapılır.',
                arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ ، سُبْحَانَ رَبِّيَ الْأَعْلَى',
                transcription: 'Rükûda: "Sübhâne Rabbiyel Azîm" | Secdelerde: "Sübhâne Rabbiyel A\'lâ" (en az 3\'er kere).',
                meaning: 'Rabbimi her haliyle tenzih ederim.',
                tips: ['Hareketler arasında sükunet (tuma\'nine) sağlanır.', 'Kadınlara özel duruşlar (toplu secde, hafif rükû, Teverrük oturuş) aynen korunur.']
            },
            {
                title: '11. Son Oturuş (Ettehiyyatü)',
                instruction: 'İkinci secdeden sonra oturulur. Ayaklar sağa çıkarılıp yere oturulur (Teverrük oturuşu). Eller dizler üzerinde, bakışlar kucağa yönelir.',
                arabic: 'اَلتَّحِيَّاتُ لِلّٰهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ اَلسَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ اَلسَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللهِ الصَّالِحِينَ أَشْهَدُ أَنْ لآ إِلٰهَ إِلَّا اللهُ وَأَشْهَدُ أَنَّ مُحَمَّداً عَبْدُهُ وَرَسُولُهُ',
                transcription: 'Ettehiyyâtü lillâhi ves-salevâtü vet-tayyibât. Esselâmü aleyke eyyühen-nebiyyü ve rahmetullâhi ve berakâtüh. Esselâmü aleynâ ve alâ ibâdillâhis-sâlihîn. Eşhedü en lâ ilâhe illallâh ve eşhedü enne Muhammeden abdühû ve rasûlüh.',
                meaning: 'Bütün tahiyyatlar, salavat ve tayyibat Allah içindir. Ey Peygamber! Selam, rahmet ve bereket sana olsun. Şehadet ederim ki Allah\'tan başka ilah yoktur ve Muhammed O\'nun kulu ve rasülüdür.',
                tips: ['Şehadet cümlesinde "Lâ ilâhe" derken şehadet parmağı kaldırılmaz (kadınlarda).', 'Bakışlar kucağa yönelir, sükunetle okunur.', 'Erkek-kadın farkı: Kadınlarda şehadet parmağı kaldirma konusunda farklı görüşler vardır.']
            },
            {
                title: '12. Salli, Barik ve Rabbena',
                instruction: 'Teverrük oturuşu devam eder. Sırasıyla Salli, Barik ve Rabbena duaları okunur.',
                arabic: 'اَللّٰهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ... اَللّٰهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ... رَبَّنَآ آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
                transcription: 'Allahümme salli alâ Muhammedin ve alâ âli Muhammed... Allahümme bârik alâ Muhammedin ve alâ âli Muhammed... Rabbenâ âtinâ fid-dünyâ haseneten ve fil-âhirati haseneten ve kınâ azâben-nâr.',
                meaning: 'Allah\'ım! Muhammed\'e ve ailesine rahmet/bereket eyle. Rabbimiz! Bize dünyada da ahirette de iyilik ver ve bizi cehennem azabından koru.',
                tips: ['Son oturuşun vacip dualarıdır.', 'Rabbena\'dan sonra farklı dualar da eklenebilir.', 'Samimiyetle ve huşu içinde okunur.']
            },
            {
                title: '13. Selam',
                instruction: 'Başı önce sağ omuza, sonra sol omuza çevirerek selam verilir.',
                arabic: 'اَلسَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللهِ',
                transcription: 'Sağa: "Esselâmü aleyküm ve rahmetullâh". Sola: "Esselâmü aleyküm ve rahmetullâh".',
                meaning: 'Allah\'ın selamı ve rahmeti üzerinize olsun.',
                tips: ['Sağa selamda sağ omuzdaki meleklere, sola selamda sol omuzdaki meleklere niyet edilir.', 'Namaz selamla tamamlanır, ellerinizi kaldırıp dua edebilirsiniz.']
            }
        ]
    },
};

const CategoryButton = memo(({ cat, isSelected, onClick }) => (
    <button
        onClick={() => onClick(cat.id)}
        className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all text-sm font-bold whitespace-nowrap active:scale-95",
            isSelected
                ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] border-transparent shadow-lg"
                : "bg-white dark:bg-white/5 text-gray-500 dark:text-emerald-100/40 border-gray-100 dark:border-white/5 hover:border-islamic-gold"
        )}
    >
        <cat.icon size={18} />
        {cat.label}
    </button>
));

const GuideStepCard = memo(({ step }) => {
    if (!step) return null;
    return (
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-white/5 overflow-hidden p-6 relative dark:text-white">
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-islamic-green dark:bg-islamic-gold rounded-2xl flex items-center justify-center text-white dark:text-[#032e18] shadow-lg shrink-0">
                        <Heart className="w-8 h-8 fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {step.repeat && (
                                <span className="bg-islamic-gold/10 text-islamic-gold text-[10px] font-black px-2 py-0.5 rounded-full border border-islamic-gold/20 uppercase">
                                    {step.repeat}
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl font-serif font-bold leading-tight">{step.title}</h2>
                    </div>
                </div>

                <p className="text-gray-600 dark:text-emerald-100/80 leading-relaxed text-base italic">
                    "{step.instruction}"
                </p>

                {/* Arabic Content Box */}
                <div className="bg-islamic-green/[0.03] dark:bg-islamic-gold/5 border border-islamic-green/10 dark:border-islamic-gold/10 rounded-3xl p-6 text-center space-y-4 shadow-inner">
                    <p className="font-arabic text-[1.85rem] text-islamic-gold/90 leading-[2.1] break-words">{step.arabic}</p>
                    <div className="space-y-1">
                        <p className="text-gray-500 dark:text-gray-400 italic text-sm">{step.transcription}</p>
                        <p className="text-gray-700 dark:text-emerald-100/60 font-medium text-sm">"{step.meaning}"</p>
                    </div>
                </div>

                {/* Tips Section */}
                <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-6 border dark:border-white/5 shadow-sm">
                    <h4 className="flex items-center gap-2 text-islamic-gold font-bold text-xs uppercase tracking-widest mb-4">
                        <SparklesIcon size={14} /> İpucu
                    </h4>
                    <ul className="space-y-3">
                        {step.tips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-gray-600 dark:text-emerald-100/40 text-[14px]">
                                <div className="w-1.5 h-1.5 rounded-full bg-islamic-gold mt-1.5 shrink-0" />
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Card>
    );
});

export default function Learn() {
    const [selectedCategory, setSelectedCategory] = useState('abdest');
    const [currentStep, setCurrentStep] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const { selection, success, heavy } = useHaptics();

    const guide = GUIDES[selectedCategory];
    const step = guide?.steps[currentStep];
    const totalSteps = guide?.steps.length || 0;

    const next = useCallback(() => {
        selection();
        if (currentStep < totalSteps - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            success();
            setIsComplete(true);
        }
    }, [currentStep, totalSteps, selection, success]);

    const prev = useCallback(() => {
        selection();
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    }, [currentStep, selection]);

    const reset = useCallback(() => {
        heavy();
        setCurrentStep(0);
        setIsComplete(false);
    }, [heavy]);

    const handleCategorySelect = useCallback((id) => {
        selection();
        setSelectedCategory(id);
        setCurrentStep(0);
        setIsComplete(false);
    }, [selection]);

    if (isComplete) {
        return (
            <div className="relative min-h-[80vh] flex flex-col items-center justify-center p-6 m-2 overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 rounded-[3rem] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-islamic-green/5 via-islamic-green/[0.02] to-transparent dark:from-islamic-gold/10 dark:via-islamic-gold/5 dark:to-transparent" />
                    <motion.div
                        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-islamic-green/10 dark:bg-islamic-gold/15 blur-3xl"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center">
                    {/* Animated checkmark circle */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
                        className="relative mb-8"
                    >
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-islamic-green to-emerald-600 dark:from-islamic-gold dark:to-amber-500 flex items-center justify-center shadow-2xl shadow-islamic-green/30 dark:shadow-islamic-gold/30">
                            <CheckCircle2 className="w-14 h-14 text-white dark:text-[#032e18]" strokeWidth={2.5} />
                        </div>
                        {/* Pulse rings */}
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-islamic-green/40 dark:border-islamic-gold/40"
                            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                        />
                        <motion.div
                            className="absolute inset-0 rounded-full border border-islamic-green/20 dark:border-islamic-gold/20"
                            animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                        />
                    </motion.div>

                    {/* Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <p className="text-sm font-bold uppercase tracking-[0.3em] text-islamic-green/60 dark:text-islamic-gold/60 mb-2">
                            Elhamdülillah
                        </p>
                        <h2 className="text-4xl font-serif font-bold text-islamic-green dark:text-islamic-gold mb-3">
                            Maşallah!
                        </h2>
                    </motion.div>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="text-gray-500 dark:text-emerald-100/50 mb-6 max-w-[280px] leading-relaxed"
                    >
                        <span className="font-semibold text-islamic-green dark:text-islamic-gold">{guide.title}</span>
                        {' '}rehberini başarıyla tamamladın.
                    </motion.p>

                    {/* Stats badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.9 }}
                        className="flex items-center gap-4 bg-islamic-green/5 dark:bg-islamic-gold/10 border border-islamic-green/10 dark:border-islamic-gold/15 rounded-2xl px-6 py-3 mb-4"
                    >
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-islamic-green dark:text-islamic-gold">{totalSteps}</span>
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-emerald-100/30 font-medium">Adım</span>
                        </div>
                        <div className="w-px h-8 bg-islamic-green/10 dark:bg-islamic-gold/15" />
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-islamic-green dark:text-islamic-gold">✓</span>
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-emerald-100/30 font-medium">Tamam</span>
                        </div>
                    </motion.div>

                    {/* Spiritual quote */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 }}
                        className="mb-10 max-w-[260px]"
                    >
                        <p className="text-[11px] italic text-gray-400 dark:text-emerald-100/30 leading-relaxed">
                            "Namaz müminin miracıdır."
                        </p>
                        <p className="text-[10px] text-gray-300 dark:text-emerald-100/20 mt-1">— Hadis-i Şerif</p>
                    </motion.div>

                    {/* Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        className="grid gap-3 w-full max-w-[280px]"
                    >
                        <motion.button
                            onClick={reset}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center justify-center gap-2 h-14 rounded-2xl font-bold text-sm bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] shadow-xl shadow-islamic-green/20 dark:shadow-islamic-gold/20 active:opacity-90 transition-opacity"
                        >
                            <RotateCcw className="w-4.5 h-4.5" />
                            Tekrar Başa Dön
                        </motion.button>
                        <button
                            onClick={() => setIsComplete(false)}
                            className="h-11 rounded-2xl text-sm font-medium text-gray-400 dark:text-emerald-100/30 hover:text-gray-600 dark:hover:text-emerald-100/50 transition-colors"
                        >
                            Son Adıma Geri Dön
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-6 p-5 pb-32">
            {/* Category Selection */}
            <div className="glass-panel rounded-3xl p-2 grid grid-cols-5 gap-1">
                {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    return (
                        <motion.button
                            key={cat.id}
                            onClick={() => handleCategorySelect(cat.id)}
                            className={cn(
                                "relative px-2 py-3 overflow-hidden rounded-2xl font-bold text-xs uppercase tracking-wider transition-all",
                                isActive
                                    ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] shadow-lg"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                            )}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Icon className={cn("w-5 h-5 mx-auto mb-1", isActive && "drop-shadow-md")} />
                            <span className="text-[9px] leading-tight block">{cat.label}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Guide Title + Progress Bar */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 bg-islamic-gold/10 px-4 py-1.5 rounded-full border border-islamic-gold/20">
                        <Droplets className="w-4 h-4 text-islamic-gold" />
                        <span className="text-xs font-bold text-islamic-green dark:text-islamic-gold uppercase tracking-widest">{guide?.title}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adım {currentStep + 1} / {totalSteps}</span>
                </div>

                <div className="w-full h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                        className="h-full bg-islamic-green dark:bg-islamic-gold shadow-sm"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / (totalSteps || 1)) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>
            </div>

            {/* Main Presentation Area */}
            <div className="relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${selectedCategory}-${currentStep}`}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <GuideStepCard step={step} />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-md px-6 flex justify-between items-center pointer-events-none z-40">
                <Button
                    variant="outline"
                    onClick={prev}
                    disabled={currentStep === 0}
                    className="bg-white/80 dark:bg-white/10 backdrop-blur-md h-14 px-6 rounded-2xl border-gray-100 dark:border-white/10 text-gray-500 dark:text-white pointer-events-auto shadow-lg active:scale-95 disabled:opacity-30 font-bold text-sm"
                >
                    <ChevronLeft className="mr-1.5 h-4 w-4" /> Geri
                </Button>

                <Button
                    onClick={next}
                    className={cn(
                        "h-14 px-8 rounded-2xl shadow-xl pointer-events-auto transition-all active:scale-95 font-bold text-sm",
                        currentStep === totalSteps - 1
                            ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] px-10"
                            : "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18]"
                    )}
                >
                    {currentStep === totalSteps - 1 ? (
                        <>Tamamla <CheckCircle2 className="ml-1.5 h-4 w-4" /></>
                    ) : (
                        <>İleri <ChevronRight className="ml-1.5 h-4 w-4" /></>
                    )}
                </Button>
            </div>
        </div>
    );
}
