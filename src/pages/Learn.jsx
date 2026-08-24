import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, ChevronDown, Droplets, BookOpen, Heart, CheckCircle2, RotateCcw, Sparkles as SparklesIcon, Crown, CalendarCheck, MoveHorizontal, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { useTranslation } from 'react-i18next';
import { isPremium } from '@/services/creditService';
import { GUIDES_EN } from '@/data/guidesEN';
import { GUIDES_DE } from '@/data/guidesDE';
import { GUIDES_RU } from '@/data/guidesRU';
import { GUIDES_AR } from '@/data/guidesAR';
import { GUIDES_AZ } from '@/data/guidesAZ';
import { Levha } from '@/components/ui/levha';
import DuaLibrary from '@/components/dua/DuaLibrary';
import EzberSheet from '@/components/ezber/EzberSheet';
import SureList from '@/components/ezber/SureList';
import { sureKey, readProgress, dueList } from '@/lib/ezber';
import { rescheduleEzberReminders } from '@/lib/ezberNotify';
import AbdestHub from '@/components/abdest/AbdestHub';
import MeshSheet from '@/components/abdest/MeshSheet';
import BreakerSheet from '@/components/abdest/BreakerSheet';
import HandsFree from '@/components/abdest/HandsFree';
import StepJumpSheet from '@/components/abdest/StepJumpSheet';
import { readMest, mestStatus, splitRemaining } from '@/lib/mestMesh';
import { wuduMeta, stepImage } from '@/data/wuduSteps';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import { analytics } from '@/services/analyticsService';
import { storageService } from '@/services/storageService';
import HintCoach from '@/components/HintCoach';
import { readSeenHints, markHintSeen } from '@/lib/hints';

// Secde (sujood) ikonu - erkek namazı için
const SecdeIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <circle cx="6" cy="14" r="2" />
        <path d="M8 15c1.5 1 3 2 5 2h5c1 0 2-.5 2-1.5S19 14 18 14h-4l-2-2c-.5-.5-1.5-1-2.5-1H8v4z" />
        <rect x="2" y="18" width="20" height="1.5" rx="0.75" />
    </svg>
);

const CATEGORIES = [
    { id: 'dualar', labelKey: 'catDualar', icon: Heart },
    { id: 'sureler', labelKey: 'catSureler', icon: BookOpen },
    { id: 'abdest', labelKey: 'catAbdest', icon: Droplets },
    { id: 'namazlar', labelKey: 'catErkekNamaz', icon: SecdeIcon },
    { id: 'kadinNamaz', labelKey: 'catKadinNamaz', icon: SparklesIcon },
];

// Sure listesi ipuçları (HintCoach). Ezber tabakasının içindekiler ayrı zincir,
// EzberSheet'te duruyor. Ortak kayıt + test bayrağı: src/lib/hints.js
const SURE_HINTS = [
    { id: 'learn:sureCard', target: 'sure-card', titleKey: 'tour.sureCard.title', bodyKey: 'tour.sureCard.body', icon: BookOpen },
    { id: 'learn:sureProgress', target: 'sure-progress', titleKey: 'tour.sureProgress.title', bodyKey: 'tour.sureProgress.body', icon: CalendarCheck },
];
// Namaz sihirbazı (erkek + kadın) ipuçları. İlk ikisi ORTAK kimlikte: iki
// kategoriyi de gezen kullanıcı aynı şeyi iki kez okumaz. Kadın namazında
// üçüncü adım var — farkların nerede yazdığını gösterir.
const NAMAZ_HINTS = [
    { id: 'learn:namazSwipe', target: 'namaz-card', titleKey: 'tour.namazSwipe.title', bodyKey: 'tour.namazSwipe.body', icon: MoveHorizontal },
    { id: 'learn:namazJump', target: 'namaz-jump', titleKey: 'tour.namazJump.title', bodyKey: 'tour.namazJump.body', icon: ListOrdered },
];
const KADIN_NAMAZ_HINTS = [
    ...NAMAZ_HINTS,
    { id: 'learn:namazKadin', target: 'namaz-tips', titleKey: 'tour.namazKadin.title', bodyKey: 'tour.namazKadin.body', icon: SparklesIcon },
];
const HINT_CHAINS = { sure: SURE_HINTS, namaz: NAMAZ_HINTS, kadin: KADIN_NAMAZ_HINTS };
const NO_HINTS = [];

const nextHint = (chain, seen, after = -1) => chain.findIndex((h, i) => i > after && !seen[h.id]);

/**
 * Abdest sihirbazının "Kısa / Tam" tercihi.
 *
 * Varsayılan KISA: 15 adımın yeni başlayanı boğması bu bölümün asıl sorunuydu.
 * Tam liste tek dokunuş uzakta ve etiketi ne vaat ettiğini söylüyor
 * ("Tam · sünnetleriyle"). Varsayılanı değiştirmek tek satır.
 */
const WUDU_MODE_KEY = 'abdest_mode';
const readWuduMode = () => (localStorage.getItem(WUDU_MODE_KEY) === 'full' ? 'full' : 'short');



const GUIDES = {
    abdest: {
        title: 'Abdest Rehberi',
        steps: [
            {
                id: 'wudu-niyet',
                title: 'Niyet',
                instruction: 'Kalbinden abdest almaya niyet et. Dil ile söylemek gerekmez ama söylenebilir.',
                arabic: 'نَوَيْتُ اَنْ اَتَوَضَّأَ لِرِضَا اللهِ تَعَالَى',
                transcription: "Neveytü en etevadda’e li-ridâillâhi teâlâ.",
                meaning: "Allah’ın rızası için abdest almaya niyet ettim.",
                tips: ['Niyet kalbin işidir', 'Abdest boyunca niyeti muhafaza et', 'Şâfiî mezhebinde niyet abdestin farzlarındandır; niyetsiz abdest geçerli olmaz.']
            },
            {
                id: 'wudu-besmele',
                title: 'Eûzu Besmele',
                instruction: 'Abdestin başında Eûzu Besmele çekilir.',
                arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ ، بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
                transcription: 'Eûzu billâhi mineş-şeytânir-racîm. Bismillâhir-rahmânir-rahîm.',
                meaning: 'Kovulmuş şeytanın şerrinden Allah’a sığınırım. Rahman ve Rahim olan Allah’ın adıyla.',
                tips: ['Besmele abdestin sünnetidir', 'Huzurla başla']
            },
            {
                id: 'wudu-eller',
                title: 'Elleri Yıkama',
                repeat: '3x tekrar',
                instruction: 'Elleri bileklere kadar (bilekler dahil) üç kere yıka. Parmak aralarını iyice ovala ve suyu her yerine ulaştır.',
                arabic: 'بِسْمِ اللهِ الْعَظِيمِ وَالْحَمْدُ للهِ عَلَى دِينِ اْلاِسْلاَمِ',
                transcription: "Bismillâhil-azîmi vel-hamdü lillâhi alâ dînil-İslâm.",
                meaning: "Yüce Allah’ın adıyla başlarım. İslam dinini bize nasip eden Allah’a hamd olsun.",
                tips: ['Yüzük varsa altına su geçecek şekilde oynatılmalı', 'Kuru yer kalmamasına dikkat edilmeli', 'Parmak aralarını hilallemek sünnettir']
            },
            {
                id: 'wudu-misvak',
                title: 'Diş Temizliği (Misvak)',
                instruction: 'Misvak, diş fırçası veya sağ elin parmakları ile dişleri ve diş etlerini temizlemek sünnettir. Dişler üst-alt ve sağ-sol olarak fırçalanır.',
                arabic: 'اَللَّهُمَّ بَارِكْ لِي فِي فَمِي',
                transcription: 'Allahümme bârik lî fî femî.',
                meaning: 'Allah’ım! Ağzımda benim için bereket halk eyle.',
                tips: ['Misvak kullanmak abdestin müstehaplarındandır', 'Yoksa sağ elin işaret ve orta parmağıyla dişler ovalanır']
            },
            {
                id: 'wudu-agiz',
                title: 'Ağza Su Verme (Mazmaza)',
                repeat: '3x tekrar',
                instruction: 'Sağ elinle ağzına üç kere su al. Her seferinde suyu ağzında iyice çalkala ve tükür. Dişlerin, damağın ve dilin ıslanmasını sağla.',
                arabic: 'اَللَّهُمَّ اَسْقِنِي مِنْ حَوْضِ نَبِيِّكَ كَاْساً لاَ اَظْمَأُ بَعْدَهُ اَبَداً',
                transcription: "Allahümme eskınî min havdi nebiyyike ke’sen lâ ezmeü ba’dehü ebedâ.",
                meaning: "Allah’ım! Peygamberinin havzından bana öyle bir kadeh içir ki, ondan sonra asla susamayayım.",
                tips: ['Oruçluysan suyu genzine kaçırmamaya dikkat et', 'Ağzın her yerine su ulaşmalı']
            },
            {
                id: 'wudu-burun',
                title: 'Burna Su Verme (İstinşak)',
                repeat: '3x tekrar',
                instruction: 'Sağ elinle burnuna üç kere su çek. Sol elinle sümkürerek burnu temizle. Suyu hafifçe genzine doğru çek.',
                arabic: 'اَللَّهُمَّ اَرِحْنِي رَائِحَةَ الْجَنَّةِ',
                transcription: 'Allahümme erihnî râihatel cenneti.',
                meaning: 'Allah’ım! Bana cennetin kokusunu duyur.',
                tips: ['Oruçluysan suyu fazla çekme', 'Burnun her iki deliği de temizlenmeli']
            },
            {
                id: 'wudu-yuz',
                title: 'Yüzü Yıkama',
                repeat: '3x tekrar',
                instruction: 'Alnın üst kısmındaki saç bitim çizgisinden çene altına, bir kulak yumuşağından diğerine kadar bütün yüzünü üç kere yıka. Kaşların, göz çukurlarının ve sakal altının ıslanmasına dikkat et.',
                arabic: 'اَللَّهُمَّ بَيِّضْ وَجْهِي بِنُورِكَ يَوْمَ تَبْيَضُّ وُجُوهٌ وَتَسْوَدُّ وُجُوهٌ',
                transcription: 'Allahümme beyyid vechî binûrike yevme tebyaddu vücûhün ve tesveddü vücûh.',
                meaning: 'Allah’ım! Bazı yüzlerin ağarıp, bazı yüzlerin kararacağı günde benim yüzümü nurunla ak et.',
                tips: ['Sakal olan erkekler sakal altını hilallemeli', 'Göz pınarları ve burun kenarları temizlenmeli', 'Yüz yıkamak abdestin farzlarındandır']
            },
            {
                id: 'wudu-sag-kol',
                title: 'Sağ Kolu Yıkama',
                repeat: '3x tekrar',
                instruction: 'Sağ kolunu parmak uçlarından dirseklere kadar (dirsekler dahil) üç kere yıka. Su her yere ulaşmalı.',
                arabic: 'اَللَّهُمَّ اَعْطِنِي كِتَابِي بِيَمِينِي وَحَاسِبْنِي حِسَاباً يَسِيراً',
                transcription: "Allahümme a’tinî kitâbî biyemînî ve hâsibnî hisâben yesîrâ.",
                meaning: "Allah’ım! Kitabımı sağ tarafımdan ver ve hesabımı kolaylaştır.",
                tips: ['Dirsekler mutlaka yıkanmalı (farzdır)', 'Kol kıvrımlarına dikkat edilmeli', 'Sağ koldan başlamak sünnettir']
            },
            {
                id: 'wudu-sol-kol',
                title: 'Sol Kolu Yıkama',
                repeat: '3x tekrar',
                instruction: 'Sol kolunu parmak uçlarından dirseklere kadar (dirsekler dahil) üç kere yıka.',
                arabic: 'اَللَّهُمَّ لاَ تُعْطِنِي كِتَابِي بِشِمَالِي وَلاَ مِنْ وَرَاءِ ظَهْرِي',
                transcription: "Allahümme lâ tut’inî kitâbî bişimâlî velâ min verâi zahrî.",
                meaning: 'Allah’ım! Kitabımı solumdan ve arkamdan verme.',
                tips: ['Sıralama önemli: önce sağ, sonra sol (tertip sünnettir)', 'Kuru yer kalmamalı']
            },
            {
                id: 'wudu-bas-mesh',
                title: 'Başın Mesh Edilmesi',
                instruction: 'Ellerini yeni suyla ıslat. Islak ellerini alnın saç bitim çizgisinden enseye doğru çek, sonra enseden alna doğru geri getir. Başın en az dörtte birini mesh etmek farzdır, tamamını mesh etmek sünnettir.',
                arabic: 'اَللَّهُمَّ غَشِّنِي بِرَحْمَتِكَ وَأَنْزِلْ عَلَيَّ مِنْ بَرَكَاتِكَ',
                transcription: 'Allahümme ğaşşinî birahmetike ve enzil aleyye min berekâtike.',
                meaning: 'Allah’ım! Beni rahmetinle kuşat, üzerime bereketlerini indir.',
                tips: ['Mesh: ıslak elle sıvazlama demektir, yıkama değildir', 'Kaplama mesh (tüm baş) daha faziletlidir', 'Mesh için yeni su almak gerekir']
            },
            {
                id: 'wudu-kulak',
                title: 'Kulakların Meshi',
                instruction: 'Başı mesh eden ıslak ellerle kulakları mesh et. İşaret parmaklarını kulak deliğine, baş parmaklarını kulak arkasına koy ve aynı anda mesh et.',
                arabic: 'اَللَّهُمَّ اجْعَلْنِي مِنَ الَّذِينَ يَسْتَمِعُونَ الْقَوْلَ فَيَتَّبِعُونَ اَحْسَنَهُ',
                transcription: "Allahümme’c-alnî minellezîne yestemiûnel kavle feyettebiûne ahseneh.",
                meaning: 'Allah’ım! Beni sözü dinleyip de en güzeline uyanlardan eyle.',
                tips: ['İşaret parmağı kulak içini, baş parmak kulak arkasını mesh eder', 'Kulak memesinin arkası da mesh edilir']
            },
            {
                id: 'wudu-boyun',
                title: 'Boynun Meshi',
                instruction: 'Her iki elin dış yüzeyiyle (el sırtıyla) boynunun yan ve arka kısmını mesh et. Boğaz (ön kısım) mesh edilmez.',
                arabic: 'اَللَّهُمَّ اَعْتِقْ رَقَبَتِي مِنَ النَّارِ',
                transcription: "Allahümme a’tık rakabetî minen nâr.",
                meaning: 'Allah’ım! Boynumu cehennem ateşinden azad eyle.',
                tips: ['Mesh el sırtıyla yapılır, avuç içiyle değil', 'Sadece ense ve boyun yanları mesh edilir', 'Boğaza mesh yapılmaz']
            },
            {
                id: 'wudu-sag-ayak',
                title: 'Sağ Ayak Yıkama',
                repeat: '3x tekrar',
                instruction: 'Sağ ayağını topuk kemikleri dahil üç kere yıka. Parmak aralarını sol elin küçük parmağıyla hilalle (ayak serçe parmağından başlayarak).',
                arabic: 'اَللَّهُمَّ ثَبِّتْ قَدَمَيَّ عَلَى الصِّرَاطِ يَوْمَ تَزِلُّ فِيهِ الْأَقْدَامُ',
                transcription: 'Allahümme sebbit kademeyye ales-sırâtı yevme tezillü fîhil akdâm.',
                meaning: 'Allah’ım! Ayakların kaydığı günde ayaklarımı sırat üzerinde sabit kıl.',
                tips: ['Parmak araları mutlaka hilallenmeli', 'Topuklar çoğu insanın eksik bıraktığı yerdir', 'Aşık kemikleri dahil yıkanmalı']
            },
            {
                id: 'wudu-sol-ayak',
                title: 'Sol Ayak Yıkama',
                repeat: '3x tekrar',
                instruction: 'Sol ayağını topuk kemikleri dahil üç kere yıka. Parmak aralarını aynı şekilde hilalle.',
                arabic: 'اَللَّهُمَّ اجْعَلْ سَعْيِي مَشْكُوراً وَذَنْبِي مَغْفُوراً',
                transcription: "Allahümme’c-al sa’yî meşkûran ve zenbî mağfûrâ.",
                meaning: 'Allah’ım! Çalışmamı şükre layık, günahımı bağışlanmış eyle.',
                tips: ['Sol ayakla abdest tamamlanır', 'Topuk ve aşık kemiklerini kontrol et']
            },
            {
                id: 'wudu-bitis-dua',
                title: 'Abdest Sonrası Dua',
                instruction: 'Abdest bittikten sonra göğe doğru bakarak veya kıbleye dönerek Kelime-i Şehadet ve dua okunur. Bu duayı okuyana cennetin sekiz kapısı açılır.',
                arabic: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ ، اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ',
                transcription: "Eşhedü en lâ ilâhe illallâhü vahdehü lâ şerîke leh, ve eşhedü enne Muhammeden abdühü ve rasûlüh. Allahümme’c-alnî minet-tevvâbîne vec’alnî minel-mütetahhirîn.",
                meaning: "Şehadet ederim ki Allah’tan başka ilah yoktur, O tektir, ortağı yoktur. Muhammed O’nun kulu ve elçisidir. Allah’ım! Beni çok tövbe edenlerden ve çok temizlenenlerden eyle.",
                tips: ['Müslim rivayet etmiştir', 'Bu duayı okuyana cennetin 8 kapısı açılır', 'Abdest sonrası 2 rekat namaz kılmak da sünnettir']
            }
        ]
    },
    gusul: {
        title: "Gusül",
        steps: [
            {
                id: 'gusul-ne-zaman',
                title: "Gusül ne zaman gerekir?",
                instruction: "Gusül; cünüplük hâlinde, hayız (âdet) kanamasının bitiminde ve lohusalık (nifas) kanamasının bitiminde farz olur. Bu hâllerde namaz kılmak, Kâbe'yi tavaf etmek ve Kur'an'a el sürmek için önce gusledilir.",
                tips: [
                    "Hayız ve lohusalıkta kanama tamamen kesildiğinde gusül farz olur; kanama sürdüğü müddetçe gusül beklenir.",
                    "Cuma ve bayram günleri, ihrama girerken alınan gusül farz değil sünnettir.",
                    "Gusül gerektiğinde geciktirmemek, hiç değilse namaz vakti çıkmadan yerine getirmek uygundur.",
                ]
            },
            {
                id: 'gusul-niyet',
                title: "Niyet et, besmele çek",
                instruction: "Temizlenmeye niyet edip besmele ile başlanır. Niyet kalbin işidir; dil ile söylemek şart değildir.",
                arabic: "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ",
                transcription: "Bismillâhirrahmânirrahîm",
                meaning: "Rahmân ve Rahîm olan Allah'ın adıyla.",
                tips: [
                    "Hanefî mezhebinde gusülde niyet ve besmele sünnettir; unutulsa da gusül geçerlidir.",
                    "Banyoda veya tuvalette besmeleyi sesli söylemek yerine kalpten getirmek edebe daha uygundur.",
                    "Şâfiî mezhebinde niyet guslün farzlarındandır; niyetsiz gusül geçerli olmaz.",
                ]
            },
            {
                id: 'gusul-eller-avret',
                title: "Elleri ve avret mahallini yıka",
                repeat: "3x tekrar",
                instruction: "Önce eller bileklere kadar yıkanır, sonra avret mahalli ve bedende kirlilik varsa temizlenir. Suyun cilde ulaşmasını engelleyen ne varsa bu aşamada giderilir.",
                tips: [
                    "Oje, su geçirmeyen makyaj, yara bandı, yapışkan boya gibi cilt üzerinde katman oluşturan şeyler gusülden önce çıkarılır; altına su ulaşmazsa gusül tamamlanmış olmaz.",
                    "Diş dolgusu, kaplama ve saç jölesi katman oluşturmadığı için gusle engel değildir.",
                    "Boyacı, çiftçi gibi işi gereği tırnağına boya veya çamur bulaşanlar için Diyanet bu durumu mazeret sayar.",
                ]
            },
            {
                id: 'gusul-abdest',
                title: "Namaz abdesti al",
                instruction: "Gusle başlamadan önce namaz abdesti gibi bir abdest alınır. Suyun biriktiği bir yerde yıkanılıyorsa ayakların yıkanması en sona bırakılabilir.",
                tips: [
                    "Bu abdest guslün farzı değildir; sünnete uygun sırayı tamamlar.",
                    "Bir uzuvda sargı, alçı veya yıkanması zarar verecek bir yara varsa o bölge yıkanmaz, üzerine bir kez elle mesh edilir; sargının tamamını mesh etmek gerekmez.",
                    "Sargı veya alçı yıkanacak yerlerin çoğunu kaplıyorsa gusül yerine teyemmüm yapılır.",
                ]
            },
            {
                id: 'gusul-agiz',
                title: "Ağzına su ver",
                repeat: "3x tekrar",
                instruction: "Ağza boğaza kadar ulaşacak şekilde dolu dolu su alınır ve çalkalanır. Hanefî mezhebinde bu, guslün farzlarındandır.",
                tips: [
                    "Suyun ağzın her yerine, diş aralarına ve boğazın başlangıcına ulaşması gerekir.",
                    "Oruçlu iken gargara yapmadan, suyu boğaza kaçırmadan yapılır.",
                    "Şâfiî ve Mâlikî mezheplerinde ağza su vermek farz değil sünnettir.",
                ]
            },
            {
                id: 'gusul-burun',
                title: "Burnuna su çek",
                repeat: "3x tekrar",
                instruction: "Buruna dolu dolu su çekilir, yumuşak kısma kadar ulaştırılır ve sümkürerek çıkarılır. Bu da Hanefî mezhebinde farzdır.",
                tips: [
                    "Suyun burun kıllarının bittiği yumuşak bölgeye kadar ulaşması esastır.",
                    "Oruçlu iken suyu abartılı şekilde yukarı çekmemeye dikkat edilir.",
                    "Şâfiî ve Mâlikî mezheplerinde buruna su çekmek sünnettir.",
                ]
            },
            {
                id: 'gusul-beden',
                title: "Suyu tüm bedene ulaştır",
                repeat: "3x tekrar",
                instruction: "Önce başa, sonra sağ ve sol omuza su dökerek bedenin tamamı yıkanır. İğne ucu kadar kuru yer kalmayacak şekilde su her yere ulaşmalıdır.",
                tips: [
                    "En çok unutulan yerler: saç dipleri, kulak arkası ve kıvrımları, göbek deliği, koltuk altı, diz arkası, tırnak altları ve küpe delikleri.",
                    "Kadınların saç örgüsünü çözmesi gerekmez; suyun saç diplerine ulaşması yeterlidir. Örgü suyun dibe ulaşmasını engelliyorsa çözülür.",
                    "Küvette veya duşta yıkanmak fark etmez; önemli olan suyun bedenin her yerine ulaşmasıdır.",
                ]
            },
        ]
    },
    teyemmum: {
        title: "Teyemmüm",
        steps: [
            {
                id: 'tey-ne-zaman',
                title: "Teyemmüm ne zaman caizdir?",
                instruction: "Su bulunamadığında, su kolayca gidip gelinemeyecek kadar uzakta olduğunda ya da suyu kullanmak hastalığı artırma veya iyileşmeyi geciktirme riski taşıdığında teyemmüm yapılır. Teyemmüm hem abdest hem gusül yerine geçer.",
                tips: [
                    "Klasik fıkıhta ölçü 'bir mil' (yaklaşık 1,5 km) olarak verilir; Diyanet bunu 'yürüyerek veya vasıtayla kolayca gidip gelinemeyecek uzaklık' diye ifade eder.",
                    "Su varken sadece namaz vakti daralıyor diye teyemmüm yapılmaz; vakit namazı kazaya kalsa da sonradan kılınabilir. Cenaze ve bayram namazı bunun istisnasıdır, çünkü onların kazası yoktur.",
                    "Eldeki su içme gibi daha zaruri bir ihtiyaç için gerekliyse teyemmüm yapılabilir.",
                ]
            },
            {
                id: 'tey-niyet-vurus',
                title: "Niyet et, ellerini toprağa vur",
                instruction: "Abdest veya gusül için teyemmüme niyet edilir. Parmaklar açık şekilde eller temiz toprağa veya toprak cinsinden bir yüzeye vurulur, ileri geri hareket ettirilip kaldırılır ve hafifçe silkelenir.",
                tips: [
                    "Abdestte niyet sünnetken teyemmümde farzdır; niyetsiz teyemmüm geçerli olmaz.",
                    "Hanefî mezhebinde toprak, kum, taş, kerpiç, tuğla, sıvalı duvar gibi toprak cinsinden temiz her şeyle teyemmüm yapılabilir.",
                    "Şâfiî mezhebinde ele toz bulaşması şart görüldüğü için tozsuz taş veya duvar yeterli sayılmaz.",
                ]
            },
            {
                id: 'tey-yuz',
                title: "Yüzünü mesh et",
                instruction: "Ellerin içiyle yüzün tamamı bir kez mesh edilir. Yüzde mesh edilmeyen bir yer kalmamalıdır.",
                tips: [
                    "Yüz, alından çene altına ve iki kulak arasındaki bölgedir; abdestte yıkanan sınırın aynısıdır.",
                    "Yüzük ve benzeri takılar mesh sırasında oynatılır ki altına da el değsin.",
                    "Şâfiî mezhebinde önce yüz sonra kollar sırasına uymak farzdır; Hanefî mezhebinde bu sıra sünnettir.",
                ]
            },
            {
                id: 'tey-kollar',
                title: "İkinci kez vur, kollarını mesh et",
                instruction: "Eller ikinci kez toprağa vurulur. Sol elin içiyle sağ kol, dirsekle birlikte mesh edilir; ardından sağ elin içiyle sol kol aynı şekilde mesh edilir.",
                tips: [
                    "Dirsekler mesh edilen bölgeye dahildir; parmak araları da unutulmaz.",
                    "Teyemmümü bozan şeyler: abdesti bozan her şey, guslü gerektiren hâller ve teyemmümü mubah kılan mazeretin ortadan kalkması.",
                    "Kullanılabilir su bulunduğu anda ya da hastalık geçtiğinde teyemmüm sona erer; artık abdest veya gusül alınır.",
                ]
            },
        ]
    },
    dualar: {
        title: 'Dualar (Gönül İlaçları)',
        steps: [
            {
                title: 'Kadir Gecesi Duası',
                instruction: 'Hz. Ayşe’ye öğretilen af duası.',
                arabic: 'اَللَّهُمَّ اِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
                transcription: 'Allahümme inneke afuvvun tuhibbul afve fa’fu annî.',
                meaning: 'Allah’ım! Sen çok affedicisin, affetmeyi seversin. Beni bağışla.',
                tips: ['Tirmizi', 'Kandil gecelerinde ve ramazanda çokça okunmalı.'],
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
            },
            {
                title: 'Kelime-i Tevhid',
                instruction: 'İmanın özü ve en faziletli zikir. Son sözü bu olan cennete girer.',
                arabic: 'لاَ اِلَهَ اِلاَّ اللهُ مُحَمَّدٌ رَسُولُ اللهِ',
                transcription: 'Lâ ilâhe illâllâh Muhammedün Rasûlullâh.',
                meaning: 'Allah\u2019tan başka ilah yoktur, Muhammed Allah\u2019ın elçisidir.',
                tips: ['Son sözü "Lâ ilâhe illâllâh" olan cennete girer. (Ebu Davud)', 'Zikirlerin en faziletlisi Kelime-i Tevhid\u2019dir. (Tirmizi)'],
            },
            {
                title: "Camiden Çıkarken",
                instruction: "Allah'ın lütfunu istemek.",
                arabic: "اَللَّهُمَّ اِنِّي اَسْأَلُكَ مِنْ فَضْلِكَ",
                transcription: "Allahümme innî es'elüke min fadlik.",
                meaning: "Allah'ım! Senden lütfunu isterim.",
                tips: ["Müslim", "Sol ayakla çıkılır."],
            },
            {
                title: "Elbise Giyerken",
                instruction: "Giyilen nimete şükretmek.",
                arabic: "اَلْحَمْدُ للهِ الَّذِي كَسَانِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلاَ قُوَّةٍ",
                transcription: "Elhamdülillâhillezî kesânî hâzâ ve razakanîhi min gayri havlin minnî ve lâ kuvveh.",
                meaning: "Beni bunu giydiren ve gücüm kuvvetim olmadan bana rızık olarak veren Allah'a hamd olsun.",
                tips: ["Ebu Davud, Tirmizi", "Geçmiş günahların bağışlanmasına vesiledir."],
            },
            {
                title: "Hilâli Görünce",
                instruction: "Yeni ayın hayırlı geçmesi için.",
                arabic: "اَللَّهُمَّ اَهِلَّهُ عَلَيْنَا بِالْيُمْنِ وَاْلاِيمَانِ وَالسَّلاَمَةِ وَاْلاِسْلاَمِ",
                transcription: "Allahümme ehillehû aleynâ bil-yümni vel-îmâni ves-selâmeti vel-İslâm.",
                meaning: "Allah'ım! Onu bize bereket, iman, esenlik ve İslam ile hilâl kıl.",
                tips: ["Tirmizi", "Ramazan ve kandil aylarının başında okunur."],
            },
            {
                title: "Çarşıya Girerken",
                instruction: "Gaflet yerinde Allah'ı anmak.",
                arabic: "لاَ اِلَهَ اِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
                transcription: "Lâ ilâhe illallâhu vahdehû lâ şerîke leh, lehül-mülkü ve lehül-hamdü ve hüve alâ külli şey'in kadîr.",
                meaning: "Allah'tan başka ilah yoktur, O tektir, ortağı yoktur. Mülk O'nundur, hamd O'nadır. O her şeye kadirdir.",
                tips: ["Tirmizi", "Kalabalıkta Allah'ı ananın sevabı büyüktür."],
            },
            {
                title: "Hasta Ziyaretinde",
                instruction: "Hastaya şifa dilemek.",
                arabic: "لاَ بَأْسَ طَهُورٌ اِنْ شَاءَ اللهُ",
                transcription: "Lâ be'se tahûrun inşâallâh.",
                meaning: "Zararı yok, inşallah günahlarına kefaret olur (temizleyicidir).",
                tips: ["Buhari", "Hastanın yanında üç kez tekrar edilir."],
            },
            {
                title: "Musibet Anında",
                instruction: "Kayıp ve felaket karşısında sabır.",
                arabic: "اِنَّا للهِ وَاِنَّا اِلَيْهِ رَاجِعُونَ ، اَللَّهُمَّ اْجُرْنِي فِي مُصِيبَتِي وَاَخْلِفْ لِي خَيْرًا مِنْهَا",
                transcription: "İnnâ lillâhi ve innâ ileyhi râciûn. Allahümme'curnî fî musîbetî vahlüf lî hayran minhâ.",
                meaning: "Biz Allah'a aitiz ve O'na döneceğiz. Allah'ım! Musibetimde bana ecir ver ve bana ondan daha hayırlısını ver.",
                tips: ["Müslim", "Her türlü kayıpta okunur."],
            },
            {
                title: "Üzüntü ve Keder Anında",
                instruction: "Daralan gönlü Allah'a açmak.",
                arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ اَسْتَغِيثُ اَصْلِحْ لِي شَأْنِي كُلَّهُ",
                transcription: "Yâ Hayyu yâ Kayyûm, bi-rahmetike estagîs, aslih lî şe'nî küllehû.",
                meaning: "Ey Hayy ve Kayyûm olan Allah'ım! Rahmetinle Senden yardım dilerim. Bütün işlerimi düzelt.",
                tips: ["Tirmizi", "Peygamberimiz sıkıntılı anlarda bunu söylerdi."],
            },
            {
                title: "Şeytandan Sığınma (Eûzü)",
                instruction: "Kur'an okumadan ve her işten önce.",
                arabic: "اَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
                transcription: "Eûzü billâhi mineş-şeytânir-racîm.",
                meaning: "Kovulmuş şeytanın şerrinden Allah'a sığınırım.",
                tips: ["Nahl Suresi, 98. Ayet", "Öfke anında da okunur."],
            },
            {
                title: "Kötü Rüya Görünce",
                instruction: "Kabusun şerrinden korunmak.",
                arabic: "اَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ وَمِنْ شَرِّ مَا رَاَيْتُ",
                transcription: "Eûzü billâhi mineş-şeytâni ve min şerri mâ raeytü.",
                meaning: "Şeytandan ve gördüğüm şeyin şerrinden Allah'a sığınırım.",
                tips: ["Müslim", "Sola üç kez üflenir, yan değiştirilir; rüya kimseye anlatılmaz."],
            },
            {
                title: "Çocuklar İçin Koruma",
                instruction: "Evladı nazardan ve şerden korumak.",
                arabic: "اُعِيذُكُمَا بِكَلِمَاتِ اللهِ التَّامَّةِ مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ وَمِنْ كُلِّ عَيْنٍ لاَمَّةٍ",
                transcription: "Üîzükümâ bi-kelimâtillâhit-tâmmeti min külli şeytânin ve hâmmetin ve min külli aynin lâmmeh.",
                meaning: "Sizi, her şeytandan, zehirli hayvandan ve değen her kötü gözden Allah'ın eksiksiz kelimelerine emanet ederim.",
                tips: ["Buhari", "Peygamberimiz Hasan ve Hüseyin'e böyle dua ederdi."],
            },
            {
                title: "Rükû Tesbihi",
                instruction: "Namazda rükûda okunur.",
                arabic: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
                transcription: "Sübhâne Rabbiyel-azîm.",
                meaning: "Yüce olan Rabbimi tenzih ederim.",
                tips: ["En az üç kez söylenir.", "Müslim, Ebu Davud"],
            },
            {
                title: "Secde Tesbihi",
                instruction: "Namazda secdede okunur.",
                arabic: "سُبْحَانَ رَبِّيَ اْلاَعْلَى",
                transcription: "Sübhâne Rabbiyel-a'lâ.",
                meaning: "En yüce olan Rabbimi tenzih ederim.",
                tips: ["En az üç kez söylenir.", "Kulun Allah'a en yakın olduğu andır."],
            },
            {
                title: "İki Secde Arasında",
                instruction: "Celsede okunan dua.",
                arabic: "رَبِّ اغْفِرْ لِي وَارْحَمْنِي وَاهْدِنِي وَعَافِنِي وَارْزُقْنِي",
                transcription: "Rabbiğfir lî verhamnî vehdinî ve âfinî verzuknî.",
                meaning: "Rabbim! Beni bağışla, bana merhamet et, hidayet ver, afiyet ver ve rızık ver.",
                tips: ["Ebu Davud, Tirmizi", "Secdeden doğrulup oturunca okunur."],
            },
            {
                title: "Uzun İstiğfar",
                instruction: "Günahların bağışlanması için.",
                arabic: "اَسْتَغْفِرُ اللهَ الَّذِي لاَ اِلَهَ اِلاَّ هُوَ الْحَيُّ الْقَيُّومُ وَاَتُوبُ اِلَيْهِ",
                transcription: "Estağfirullâhellezî lâ ilâhe illâ hüvel-Hayyul-Kayyûmü ve etûbü ileyh.",
                meaning: "Kendisinden başka ilah olmayan, Hayy ve Kayyûm olan Allah'tan bağışlanma diler ve O'na tövbe ederim.",
                tips: ["Ebu Davud, Tirmizi", "Savaştan kaçmış olsa bile bağışlanır denilmiştir."],
            },
            {
                title: "Günahtan Sonra Tövbe",
                instruction: "Bütün günahların affı için.",
                arabic: "اَللَّهُمَّ اغْفِرْ لِي ذَنْبِي كُلَّهُ دِقَّهُ وَجِلَّهُ وَاَوَّلَهُ وَآخِرَهُ",
                transcription: "Allahümmağfir lî zenbî küllehû, dikkahû ve cillehû, ve evvelehû ve âhirah.",
                meaning: "Allah'ım! Günahımın hepsini bağışla; küçüğünü büyüğünü, öncekini sonrakini.",
                tips: ["Müslim", "Secdede okunması tavsiye edilmiştir."],
            },
            {
                title: "Salâtü'l-Fâtih",
                instruction: "Kapalı kapıların açılması için salavat.",
                arabic: "اَللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ الْفَاتِحِ لِمَا اُغْلِقَ وَالْخَاتِمِ لِمَا سَبَقَ",
                transcription: "Allahümme salli alâ seyyidinâ Muhammedinil-fâtihi limâ uğlika vel-hâtimi limâ sebak.",
                meaning: "Allah'ım! Kapalı olanı açan, geçmişi mühürleyen efendimiz Muhammed'e salat eyle.",
                tips: ["Fazileti büyük salavatlardandır.", "Hacet zamanlarında okunur."],
            },
            {
                title: "Hayırlı Rızık Duası",
                instruction: "Faydalı ilim, temiz rızık ve kabul olunmuş amel.",
                arabic: "اَللَّهُمَّ اِنِّي اَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلاً مُتَقَبَّلاً",
                transcription: "Allahümme innî es'elüke ilmen nâfian ve rizkan tayyiben ve amelen mütekabbelâ.",
                meaning: "Allah'ım! Senden faydalı ilim, temiz rızık ve kabul edilmiş amel isterim.",
                tips: ["İbn Mace", "Sabah namazından sonra okunması tavsiye edilmiştir."],
            },
            {
                title: "Eş ve Çocuk Duası",
                instruction: "Hayırlı bir aile için.",
                arabic: "رَبَّنَا هَبْ لَنَا مِنْ اَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ اَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ اِمَامًا",
                transcription: "Rabbenâ heb lenâ min ezvâcinâ ve zürriyyâtinâ kurrate a'yunin vec'alnâ lil-müttekîne imâmâ.",
                meaning: "Rabbimiz! Bize eşlerimizden ve çocuklarımızdan göz aydınlığı ver ve bizi takva sahiplerine önder kıl.",
                tips: ["Furkan Suresi, 74. Ayet", "Rahman'ın kullarının duasıdır."],
            },
            {
                title: "Anne Babaya Dua",
                instruction: "Ebeveyn için rahmet dilemek.",
                arabic: "رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
                transcription: "Rabbirhamhümâ kemâ rabbeyânî sagîrâ.",
                meaning: "Rabbim! Onlar beni küçükken nasıl yetiştirdilerse, Sen de onlara öyle merhamet et.",
                tips: ["İsrâ Suresi, 24. Ayet", "Vefat etmiş olsalar da okunur."],
            },
            {
                title: "İstihare Duası",
                instruction: "Bir karar öncesi hayırlısını istemek.",
                arabic: "اَللَّهُمَّ اِنِّي اَسْتَخِيرُكَ بِعِلْمِكَ وَاَسْتَقْدِرُكَ بِقُدْرَتِكَ وَاَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ",
                transcription: "Allahümme innî estehîruke bi-ilmike ve estakdiruke bi-kudretike ve es'elüke min fadlikel-azîm.",
                meaning: "Allah'ım! İlminle benim için hayırlısını seçmeni, kudretinle güç vermeni diliyor ve büyük lütfundan istiyorum.",
                tips: ["Buhari", "İki rekat namazdan sonra okunur, ardından niyet edilen iş söylenir."],
            },
]
    },
    sureler: {
        title: 'Sureler Rehberi',
        steps: [
            {
                title: 'İhlâs Suresi',
                instruction: 'Allah\'ın birliğini en net anlatan suredir. Okumak, Kur\'an\'ın üçte birine denktir.',
                arabic: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
                transcription: 'Bismillâhirrahmânirrahîm. Kul hüvallâhü ehad. Allâhüssamed. Lem yelid ve lem yûled. Ve lem yekün lehû küfüven ehad.',
                meaning: 'De ki: O Allah tektir. Allah Samed\'dir (Her şey O\'na muhtaçtır, O hiçbir şeye muhtaç değildir). O, doğurmamış ve doğmamıştır. O\'nun hiçbir dengi yoktur.',
                tips: ['Tevhidin en kısa ve öz ifadesidir.', 'Namazlarda çok sık okunur.']
            },
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
            },
            {
                title: "Asr Suresi",
                instruction: "Zamana yemin ederek insanın hüsranda olduğunu, kurtuluşun iman ve salih amelde olduğunu bildirir.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ وَالْعَصْرِ ۝ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ ۝ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ",
                transcription: "Bismillâhirrahmânirrahîm. Vel asr. İnnel insâne le fî husr. İllellezîne âmenû ve amilûs sâlihâti ve tevâsav bil hakkı ve tevâsav bis sabr.",
                meaning: "Asra yemin ederim ki. İnsan gerçekten ziyan içindedir. Bundan ancak iman edip iyi ameller işleyenler, birbirlerine hakkı tavsiye edenler ve sabrı tavsiye edenler müstesnadır.",
                tips: ["İmam Şâfiî: “İnsanlar sadece bu sureyi düşünseydi, onlara yeterdi.”", "Üç ayetle Kur'an'ın özeti sayılır: iman, amel, hakkı ve sabrı tavsiye."]
            },
            {
                title: "İnşirah Suresi",
                instruction: "Peygamberimizin göğsünün açılmasını ve yükünün kaldırılmasını anlatır; sıkıntının geçici olduğunu müjdeler.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ ۝ وَوَضَعْنَا عَنكَ وِزْرَكَ ۝ الَّذِي أَنقَضَ ظَهْرَكَ ۝ وَرَفَعْنَا لَكَ ذِكْرَكَ ۝ فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ فَإِذَا فَرَغْتَ فَانصَبْ ۝ وَإِلَىٰ رَبِّكَ فَارْغَب",
                transcription: "Bismillâhirrahmânirrahîm. E lem neşrah leke sadrek. Ve vedagnâ anke vizrek. Ellezî enkada zahrek. Ve refa’nâ leke zikrek. Fe inne maal usri yusra. İnne maal usri yusrâ. Fe izâ feragte fensab. Ve ilâ rabbike fergab.",
                meaning: "Biz senin göğsünü açıp genişletmedik mi. Yükünü senden alıp atmadık mı. O senin belini büken yükü. Senin şanını ve ününü yüceltmedik mi. Elbette zorluğun yanında bir kolaylık vardır. Gerçekten, zorlukla beraber bir kolaylık daha vardır. Boş kaldın mı hemen (başka) işe koyul. Yalnız Rabbine yönel.",
                tips: ["“Zorlukla beraber bir kolaylık vardır” müjdesi arka arkaya iki kez tekrarlanır.", "Duhâ Suresi'nin devamı niteliğindedir, sıkıntı anında okunur."]
            },
            {
                title: "Tekâsür Suresi",
                instruction: "Mal ve çokluk yarışının insanı nasıl oyaladığını, ölüme kadar süren bu gafleti anlatır.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ أَلْهَاكُمُ التَّكَاثُرُ ۝ حَتَّىٰ زُرْتُمُ الْمَقَابِرَ ۝ كَلَّا سَوْفَ تَعْلَمُونَ ۝ ثُمَّ كَلَّا سَوْفَ تَعْلَمُونَ ۝ كَلَّا لَوْ تَعْلَمُونَ عِلْمَ الْيَقِينِ ۝ لَتَرَوُنَّ الْجَحِيمَ ۝ ثُمَّ لَتَرَوُنَّهَا عَيْنَ الْيَقِينِ ۝ ثُمَّ لَتُسْأَلُنَّ يَوْمَئِذٍ عَنِ النَّعِيمِ",
                transcription: "Bismillâhirrahmânirrahîm. Elhâkumut tekâsur. Hattâ zurtumul mekâbir. Kellâ sevfe ta’lemûn. Summe kellâ sevfe ta’lemûn. Kellâ lev ta’lemûne ilmel yakîn. Le terevunnel cahîm. Summe le terevunnehâ aynel yakîn. Summe le tus’elunne yevmeizin anin naîm.",
                meaning: "Çokluk kuruntusu sizi o derece oyaladı ki. Nihayet kabirleri ziyaret ettiniz. Hayır! Yakında bileceksiniz. Elbette yakında bileceksiniz. Gerçek öyle değil! Kesin bilgi ile bilmiş olsaydınız. Mutlaka cehennem ateşini görürdünüz. Sonra ahirette onu çıplak gözle göreceksiniz. Nihayet o gün (dünyada yararlandığınız) nimetlerden elbette ve elbette hesaba çekileceksiniz.",
                tips: ["Dünya hırsının panzehiri sayılır.", "Verilen her nimetten hesap sorulacağını hatırlatır."]
            },
            {
                title: "Kadir Suresi",
                instruction: "Kur'an'ın Kadir gecesinde indirildiğini ve bu gecenin bin aydan hayırlı olduğunu bildirir.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ ۝ وَمَا أَدْرَاكَ مَا لَيْلَةُ الْقَدْرِ ۝ لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ ۝ تَنَزَّلُ الْمَلَائِكَةُ وَالرُّوحُ فِيهَا بِإِذْنِ رَبِّهِم مِّن كُلِّ أَمْرٍ ۝ سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ",
                transcription: "Bismillâhirrahmânirrahîm. İnnâ enzelnâhu fî leyletil kadr. Ve mâ edrâke mâ leyletul kadr. Leyletul kadri hayrun min elfi şehr. Tenezzelul melâiketu ver rûhu fîhâ bi izni rabbihim min kulli emrin. Selâmun, hiye hattâ matlaıl fecr.",
                meaning: "Biz onu (Kur'an'ı) Kadir gecesinde indirdik. Kadir gecesinin ne olduğunu sen bilir misin. Kadir gecesi, bin aydan hayırlıdır. O gecede, Rablerinin izniyle melekler ve Ruh (Cebrail), her iş için iner dururlar. O gece, esenlik doludur. Ta fecrin doğuşuna kadar.",
                tips: ["Ramazan'ın son on gecesinde çokça okunur.", "Kadir gecesi meleklerin ve Cebrail'in indiği, esenlik dolu gecedir."]
            },
            {
                title: "Tîn Suresi",
                instruction: "İncire, zeytine, Sina Dağı'na ve güvenli beldeye yemin ederek insanın en güzel biçimde yaratıldığını bildirir.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ وَالتِّينِ وَالزَّيْتُونِ ۝ وَطُورِ سِينِينَ ۝ وَهَٰذَا الْبَلَدِ الْأَمِينِ ۝ لَقَدْ خَلَقْنَا الْإِنسَانَ فِي أَحْسَنِ تَقْوِيمٍ ۝ ثُمَّ رَدَدْنَاهُ أَسْفَلَ سَافِلِينَ ۝ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ فَلَهُمْ أَجْرٌ غَيْرُ مَمْنُونٍ ۝ فَمَا يُكَذِّبُكَ بَعْدُ بِالدِّينِ ۝ أَلَيْسَ اللَّهُ بِأَحْكَمِ الْحَاكِمِينَ",
                transcription: "Bismillâhirrahmânirrahîm. Vet tîni vez zeytûn. Ve tûri sînîn. Ve hâzel beledil emîn. Lekad halaknel insâne fî ahseni takvîm. Summe redednâhu esfele sâfilîn. İllellezîne âmenû ve amilûs sâlihâti fe lehum ecrun gayru memnûn. Fe mâ yukezzibuke ba’du bid dîn. E leysallâhu bi ahkemil hâkimîn.",
                meaning: "İncire, zeytine. Sina dağına. Ve şu emin beldeye yemin ederim ki. Biz insanı en güzel biçimde yarattık. Sonra da çevirdik aşağıların aşağısına attık. Fakat iman edip salih amel işleyenler için eksilmeyen devamlı bir ecir vardır. Artık bundan sonra, ceza günü konusunda seni kim yalanlayabilir. Allah, hüküm verenlerin en üstünü değil midir.",
                tips: ["İnsanın şerefi imanla korunur, imansızlıkla düşer.", "Namazlarda zamm-ı sure olarak sık okunur."]
            },
            {
                title: "Hümeze Suresi",
                instruction: "İnsanları arkadan çekiştiren, mal biriktirip onunla övünen kimseyi uyarır.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ وَيْلٌ لِّكُلِّ هُمَزَةٍ لُّمَزَةٍ ۝ الَّذِي جَمَعَ مَالًا وَعَدَّدَهُ ۝ يَحْسَبُ أَنَّ مَالَهُ أَخْلَدَهُ ۝ كَلَّا لَيُنبَذَنَّ فِي الْحُطَمَةِ ۝ وَمَا أَدْرَاكَ مَا الْحُطَمَةُ ۝ نَارُ اللَّهِ الْمُوقَدَةُ ۝ الَّتِي تَطَّلِعُ عَلَى الْأَفْئِدَةِ ۝ إِنَّهَا عَلَيْهِم مُّؤْصَدَةٌ ۝ فِي عَمَدٍ مُّمَدَّدَةٍ",
                transcription: "Bismillâhirrahmânirrahîm. Veylun li kulli humezetin lumezeh. Ellezî cemea mâlen ve addedeh. Yahsebu enne mâlehû ahledeh. Kellâ le yunbezenne fîl hutameh. Ve mâ edrâke mel hutameh. Nârullâhil mûkadeh. Elletî tettaliu alel ef’ideh. İnnehâ aleyhim mu’sadeh. Fî amedin mumeddedeh.",
                meaning: "Arkadan çekiştirmeyi, yüze karşı eğlenmeyi adet edinen herkesin vay haline. O ki, toplamış ve onu sayıp durmuştur. Malının kendisini ebedi kılacağını zanneder. Hayır! Andolsun ki o, Hutame'ye atılacaktır. Hutame'nin ne olduğunu bilir misin. Allah'ın, tutuşturulmuş ateşidir. (Yandıkça) tırmanıp kalplerin ta üstüne çıkar. O, onların üzerine kapatılıp kilitlenecektir. (Bu ateşin içinde) uzatılmış sütunlara bağlanmışlar.",
                tips: ["Dedikodu ve alay etmenin ağır sonucunu anlatır.", "“Hutame”, kalplere işleyen ateşin adıdır."]
            },
            {
                title: "Zilzâl Suresi",
                instruction: "Kıyamet günü yerin sarsılmasını ve herkesin zerre kadar hayrını da şerrini de göreceğini anlatır.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ إِذَا زُلْزِلَتِ الْأَرْضُ زِلْزَالَهَا ۝ وَأَخْرَجَتِ الْأَرْضُ أَثْقَالَهَا ۝ وَقَالَ الْإِنسَانُ مَا لَهَا ۝ يَوْمَئِذٍ تُحَدِّثُ أَخْبَارَهَا ۝ بِأَنَّ رَبَّكَ أَوْحَىٰ لَهَا ۝ يَوْمَئِذٍ يَصْدُرُ النَّاسُ أَشْتَاتًا لِّيُرَوْا أَعْمَالَهُمْ ۝ فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ ۝ وَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ شَرًّا يَرَهُ",
                transcription: "Bismillâhirrahmânirrahîm. İzâ zulziletil ardu zilzâlehâ. Ve ahrecetil ardu eskâlehâ. Ve kâlel insânu mâ lehâ. Yevme izin tuhaddisu ahbârehâ. Bi enne rabbeke ehvâlehâ. Yevme izin yasdurun nâsu eştâten li yurev a’mâlehum. Fe men ya’mel miskâle zerretin hayren yereh. Ve men ya’mel miskâle zerretin şerren yereh.",
                meaning: "Yerküre kendine has sarsıntısıyla sallandığı. Toprak ağırlıklarını dışarı çıkardığı. Ve insan “Ne oluyor buna!” dediği vakit. İşte o gün (yer) haberlerini anlatır. Rabbinin ona bildirmesiyle. O gün insanlar amellerini görmeleri (karşılığını almaları) için darmadağınık geri dönüp gelirler. Kim zerre miktarı hayır yapmışsa onu görür. Kim de zerre miktarı şer işlemişse onu görür.",
                tips: ["Küçük görülen iyiliklerin de kayda geçtiğini hatırlatır.", "Hesap gününün adaletini en net anlatan surelerdendir."]
            },
            {
                title: "Kâria Suresi",
                instruction: "Kıyametin dehşetini; insanların pervane, dağların atılmış yün gibi olacağını ve amel terazisini anlatır.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ الْقَارِعَةُ ۝ مَا الْقَارِعَةُ ۝ وَمَا أَدْرَاكَ مَا الْقَارِعَةُ ۝ يَوْمَ يَكُونُ النَّاسُ كَالْفَرَاشِ الْمَبْثُوثِ ۝ وَتَكُونُ الْجِبَالُ كَالْعِهْنِ الْمَنفُوشِ ۝ فَأَمَّا مَن ثَقُلَتْ مَوَازِينُهُ ۝ فَهُوَ فِي عِيشَةٍ رَّاضِيَةٍ ۝ وَأَمَّا مَنْ خَفَّتْ مَوَازِينُهُ ۝ فَأُمُّهُ هَاوِيَةٌ ۝ وَمَا أَدْرَاكَ مَا هِيَهْ ۝ نَارٌ حَامِيَةٌ",
                transcription: "Bismillâhirrahmânirrahîm. El kâriah. Mel kâriah. Ve mâ edrâke mel kâriah. Yevme yekûnun nâsu kel ferâşil mebsûs. Ve tekûnul cibâlu kel ıhnil menfûş. Fe emmâ men sekulet mevâzînuh. Fe huve fî îşetin râdiyeh. Ve emmâ men haffet mevâzînuh. Fe ummuhu hâviyeh. Ve mâ edrâke mâhiyeh. Nârun hâmiyeh.",
                meaning: "Kapı çalan. Nedir o kapı çalan. O kapı çalanın ne olduğunu bilir misin. İnsanların, ateşin etrafını sarmış pervaneler gibi olur. Dağların da atılmış renkli yüne dönüştüğü gündür (o Karia). O gün kimin tartılan ameli ağır gelirse. İşte o, hoşnut edici bir yaşayış içinde olur. Ameli yeğni olana gelince. İşte onun anası (yeri, yurdu) Haviye'dir. Nedir o (Haviye) bilir misin. Kızgın ateş.",
                tips: ["Terazisi ağır gelen hoşnut bir hayattadır.", "Kıyamet sahnesini görüntüyle anlatan kısa surelerdendir."]
            },
            {
                title: "Duhâ Suresi",
                instruction: "Vahyin bir süre kesildiği günlerde Peygamberimize “Rabbin seni terk etmedi” diyerek teselli verir.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ وَالضُّحَىٰ ۝ وَاللَّيْلِ إِذَا سَجَىٰ ۝ مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ ۝ وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ ۝ وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ ۝ أَلَمْ يَجِدْكَ يَتِيمًا فَآوَىٰ ۝ وَوَجَدَكَ ضَالًّا فَهَدَىٰ ۝ وَوَجَدَكَ عَائِلًا فَأَغْنَىٰ ۝ فَأَمَّا الْيَتِيمَ فَلَا تَقْهَرْ ۝ وَأَمَّا السَّائِلَ فَلَا تَنْهَرْ ۝ وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ",
                transcription: "Bismillâhirrahmânirrahîm. Ved duhâ. Vel leyli izâ secâ. Mâ veddeake rabbuke ve mâ kalâ. Ve lel âhıretu hayrun leke minel ûlâ. Ve le sevfe yu’tîke rabbuke fe terdâ. E lem yecidke yetîmen fe âvâ. Ve vecedeke dâllen fe hedâ. Ve vecedeke âilen fe agnâ. Fe emmel yetîme fe lâ takher. Ve emmes sâile fe lâ tenher. Ve emmâ bi ni’meti rabbike fe haddis.",
                meaning: "Andolsun kuşluk vaktine. Ve sükuna erdiğinde geceye ki. Rabbin seni bırakmadı ve sana darılmadı. Gerçekten senin için ahiret dünyadan daha hayırlıdır. Pek yakında Rabbin sana verecek de hoşnut olacaksın. O, seni yetim bulup barındırmadı mı. Şaşırmış bulup da yol göstermedi mi. Seni fakir bulup zengin etmedi mi. Öyleyse yetimi sakın ezme. El açıp isteyeni de sakın azarlama. Ve Rabbinin nimetini minnet ve şükranla an.",
                tips: ["Ümitsizliğe düşenler için teselli suresi sayılır.", "Yetimi ve isteyeni geri çevirmemeyi öğütler."]
            },
            {
                title: "Âdiyât Suresi",
                instruction: "Savaşa koşan atlara yemin ederek insanın Rabbine karşı nankörlüğünü ve mal sevgisini anlatır.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ وَالْعَادِيَاتِ ضَبْحًا ۝ فَالْمُورِيَاتِ قَدْحًا ۝ فَالْمُغِيرَاتِ صُبْحًا ۝ فَأَثَرْنَ بِهِ نَقْعًا ۝ فَوَسَطْنَ بِهِ جَمْعًا ۝ إِنَّ الْإِنسَانَ لِرَبِّهِ لَكَنُودٌ ۝ وَإِنَّهُ عَلَىٰ ذَٰلِكَ لَشَهِيدٌ ۝ وَإِنَّهُ لِحُبِّ الْخَيْرِ لَشَدِيدٌ ۝ أَفَلَا يَعْلَمُ إِذَا بُعْثِرَ مَا فِي الْقُبُورِ ۝ وَحُصِّلَ مَا فِي الصُّدُورِ ۝ إِنَّ رَبَّهُم بِهِمْ يَوْمَئِذٍ لَّخَبِيرٌ",
                transcription: "Bismillâhirrahmânirrahîm. Vel âdiyâti dabhâ. Fel mûriyâti kadhâ. Fel mugîrâti subhâ. Fe eserne bihî nak’â. Fe vesatne bihî cem’â. İnnel insâne li rabbihî le kenûd. Ve innehu alâ zâlike le şehîd. Ve innehu li hubbil hayri le şedîd. E fe lâ ya’lemu izâ bu’siramâ fîl kubûr. Ve hussıle mâ fîs sudûr. İnne rabbehum bihim yevme izin le habîr.",
                meaning: "Harıl harıl koşanlara. (Nallarıyla) çakarak kıvılcım saçanlara. (Ansızın) sabah baskını yapanlara. Orada tozu dumana katanlara. Derken orada bir topluluğun ta ortasına girenlere yemin ederim ki. Şüphesiz insan, Rabbine karşı pek nankördür. Şüphesiz buna kendisi de şahittir. Ve o, mal sevgisine de aşırı derecede düşkündür. Kabirlerde bulunanların diriltilip dışarı atıldığını düşünmez mi. Ve kalplerde gizlenenler ortaya konduğu zaman. Şüphesiz Rableri o gün onlardan tamamıyle haberdar.",
                tips: ["Nankörlüğün panzehiri şükürdür.", "Kabirlerdekilerin diriltileceği günü hatırlatır."]
            },
            {
                title: "Şems Suresi",
                instruction: "Güneşe, aya, gündüze ve geceye yemin ederek nefsini arındıranın kurtulacağını bildirir; Semûd kavmini örnek verir.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ وَالشَّمْسِ وَضُحَاهَا ۝ وَالْقَمَرِ إِذَا تَلَاهَا ۝ وَالنَّهَارِ إِذَا جَلَّاهَا ۝ وَاللَّيْلِ إِذَا يَغْشَاهَا ۝ وَالسَّمَاءِ وَمَا بَنَاهَا ۝ وَالْأَرْضِ وَمَا طَحَاهَا ۝ وَنَفْسٍ وَمَا سَوَّاهَا ۝ فَأَلْهَمَهَا فُجُورَهَا وَتَقْوَاهَا ۝ قَدْ أَفْلَحَ مَن زَكَّاهَا ۝ وَقَدْ خَابَ مَن دَسَّاهَا ۝ كَذَّبَتْ ثَمُودُ بِطَغْوَاهَا ۝ إِذِ انبَعَثَ أَشْقَاهَا ۝ فَقَالَ لَهُمْ رَسُولُ اللَّهِ نَاقَةَ اللَّهِ وَسُقْيَاهَا ۝ فَكَذَّبُوهُ فَعَقَرُوهَا فَدَمْدَمَ عَلَيْهِمْ رَبُّهُم بِذَنبِهِمْ فَسَوَّاهَا ۝ وَلَا يَخَافُ عُقْبَاهَا",
                transcription: "Bismillâhirrahmânirrahîm. Veş şemsi ve duhâhâ. Vel kameri izâ telâhâ. Ven nehâri izâ cellâhâ. Vel leyli izâ yagşâhâ. Ves semâi ve mâ benâhâ. Vel ardı ve mâ tahâhâ. Ve nefsin ve mâ sevvâhâ. Fe elhemehâ fucûrehâ ve takvâhâ. Kad efleha men zekkâhâ. Ve kad hâbe men dessâhâ. Kezzebet semûdu bi tagvâhâ. İzin baase eşkâhâ. Fe kâle lehum resûlullâhi nâkatallâhi ve sukyâhâ. Fe kezzebûhu fe akarûhâ fe demdeme aleyhim rabbuhum bi zenbihim fe sevvâhâ. Ve lâ yehâfu ukbâhâ.",
                meaning: "Güneşe ve kuşluk vaktindeki aydınlığına. Güneşi takip ettiğinde Ay'a. Onu açığa çıkarttığında gündüze. Onu örttüğünde geceye. Gökyüzüne ve onu bina edene. Yere ve onu yapıp döşeyene. Nefse ve ona birtakım kabiliyetler verene. Sonra da ona iyilik ve kötülükleri ilham edene yemin ederim ki. Nefsini kötülüklerden arındıran kurtuluşa ermiştir. Onu kötülüklere gömen de ziyan etmiştir. Semud kavmi azgınlığı yüzünden (Allah'ın elçisini) yalanladı. Onların en bedbahtı (deveyi kesmek için) atıldığında. Allah'ın Resulü onlara: “Allah'ın devesine ve onun su hakkına dokunmayın!” dedi. Ama onlar, onu yalanladılar ve deveyi kestiler. Bunun üzerine Rableri günahları sebebiyle onlara büyük bir felaket gönderdi de hepsini helak etti. (Allah, bu şekilde azap etmenin) akıbetinden korkacak değil ya.",
                tips: ["“Nefsini arındıran kurtuldu” ayeti surenin özüdür.", "Deveyi kesen Semûd kavminin helâki ibret olarak anlatılır."]
            },
            {
                title: "Leyl Suresi",
                instruction: "Geceye ve gündüze yemin ederek verip sakınanla cimrilik edenin yolunun ayrıldığını anlatır.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ وَاللَّيْلِ إِذَا يَغْشَىٰ ۝ وَالنَّهَارِ إِذَا تَجَلَّىٰ ۝ وَمَا خَلَقَ الذَّكَرَ وَالْأُنثَىٰ ۝ إِنَّ سَعْيَكُمْ لَشَتَّىٰ ۝ فَأَمَّا مَنْ أَعْطَىٰ وَاتَّقَىٰ ۝ وَصَدَّقَ بِالْحُسْنَىٰ ۝ فَسَنُيَسِّرُهُ لِلْيُسْرَىٰ ۝ وَأَمَّا مَن بَخِلَ وَاسْتَغْنَىٰ ۝ وَكَذَّبَ بِالْحُسْنَىٰ ۝ فَسَنُيَسِّرُهُ لِلْعُسْرَىٰ ۝ وَمَا يُغْنِي عَنْهُ مَالُهُ إِذَا تَرَدَّىٰ ۝ إِنَّ عَلَيْنَا لَلْهُدَىٰ ۝ وَإِنَّ لَنَا لَلْآخِرَةَ وَالْأُولَىٰ ۝ فَأَنذَرْتُكُمْ نَارًا تَلَظَّىٰ ۝ لَا يَصْلَاهَا إِلَّا الْأَشْقَى ۝ الَّذِي كَذَّبَ وَتَوَلَّىٰ ۝ وَسَيُجَنَّبُهَا الْأَتْقَى ۝ الَّذِي يُؤْتِي مَالَهُ يَتَزَكَّىٰ ۝ وَمَا لِأَحَدٍ عِندَهُ مِن نِّعْمَةٍ تُجْزَىٰ ۝ إِلَّا ابْتِغَاءَ وَجْهِ رَبِّهِ الْأَعْلَىٰ ۝ وَلَسَوْفَ يَرْضَىٰ",
                transcription: "Bismillâhirrahmânirrahîm. Vel leyli izâ yagşâ. Ven nehâri izâ tecellâ. Ve mâ halâkaz zekera vel unsâ. İnne sa’yekum le şettâ. Fe emmâ men a’tâ vettekâ. Ve saddeka bil husnâ. Fe senuyessiruhu lil yusrâ. Ve emmâ men bahıle vestagnâ. Ve kezzebe bil husnâ. Fe senuyessiruhu lil usrâ. Ve mâ yugnî anhu mâluhû izâ tereddâ. İnne aleynâ lel hudâ. Ve inne lenâ lel âhırete vel ûlâ. Fe enzertukum nâren telezzâ. Lâ yaslâhâ illel eşkâ. Ellezî kezzebe ve tevellâ. Ve seyucennebuhel etkâ. Ellezî yu’tî mâ lehu yetezekkâ. Ve mâ li ehadin indehu min ni´metin tuczâ. İllebtigâe vechi rabbihil a’lâ. Ve le sevfe yerdâ.",
                meaning: "(Karanlığı ile etrafı) bürüyüp örttüğü zaman geceye. Açılıp ağardığı vakit gündüze. Erkeği ve dişiyi yaratana yemin ederim ki. Sizin işleriniz başka başkadır. Artık kim verir ve sakınırsa. Ve en güzeli de tasdik ederse. Biz de onu en kolaya hazırlarız (onda başarılı kılarız). Kim cimrilik eder, kendini müstağni sayar. Ve en güzeli de yalanlarsa. Biz de onu en zora hazırlarız. Düştüğü zaman da malı kendisine hiç fayda vermez. Doğru yolu göstermek bize aittir. Şüphesiz ahiret de dünya da bizimdir. (Ey insanlar! ) Alev alev yanan bir ateşle sizi uyardım. O ateşe, ancak kötü olan girer. Öyle kötü ki, yalanlayıp ve yüz çevirmiştir. En çok korunan ise ondan (ateşten) uzak tutulur. O ki, Allah yolunda malını verir, temizlenir. Onun nezdinde hiçbir kimseye ait şükranla karşılanacak bir nimet yoktur. O ancak Yüce Rabbinin rızasını aramak için verir. Ve o (buna kavuşarak) hoşnut olacaktır.",
                tips: ["Cömertlik ile cimriliğin sonucunu karşılaştırır.", "İnfakın kolaylık, cimriliğin zorluk getirdiğini bildirir."]
            },
            {
                title: "Alak Suresi",
                instruction: "Kur'an'ın ilk inen ayetleridir: “Yaratan Rabbinin adıyla oku.” İlmin ve kalemin değerini bildirir.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ ۝ خَلَقَ الْإِنسَانَ مِنْ عَلَقٍ ۝ اقْرَأْ وَرَبُّكَ الْأَكْرَمُ ۝ الَّذِي عَلَّمَ بِالْقَلَمِ ۝ عَلَّمَ الْإِنسَانَ مَا لَمْ يَعْلَمْ ۝ كَلَّا إِنَّ الْإِنسَانَ لَيَطْغَىٰ ۝ أَن رَّآهُ اسْتَغْنَىٰ ۝ إِنَّ إِلَىٰ رَبِّكَ الرُّجْعَىٰ ۝ أَرَأَيْتَ الَّذِي يَنْهَىٰ ۝ عَبْدًا إِذَا صَلَّىٰ ۝ أَرَأَيْتَ إِن كَانَ عَلَى الْهُدَىٰ ۝ أَوْ أَمَرَ بِالتَّقْوَىٰ ۝ أَرَأَيْتَ إِن كَذَّبَ وَتَوَلَّىٰ ۝ أَلَمْ يَعْلَم بِأَنَّ اللَّهَ يَرَىٰ ۝ كَلَّا لَئِن لَّمْ يَنتَهِ لَنَسْفَعًا بِالنَّاصِيَةِ ۝ نَاصِيَةٍ كَاذِبَةٍ خَاطِئَةٍ ۝ فَلْيَدْعُ نَادِيَهُ ۝ سَنَدْعُ الزَّبَانِيَةَ ۝ كَلَّا لَا تُطِعْهُ وَاسْجُدْ وَاقْتَرِب",
                transcription: "Bismillâhirrahmânirrahîm. Ikra’bismi rabbikellezî halak. Halakal insâne min alak. Ikra’ ve rabbukel ekrem. Ellezî alleme bil kalem. Allemel insâne mâ lem ya’lem. Kellâ innel insâne le yatgâ. En reâhustagnâ. İnne ilâ rabbiker ruc’â. E reeytellezî yenhâ. Abden izâ sallâ. E reeyte in kâne alel hudâ. Ev emera bit takvâ. E reeyte in kezzebe ve tevellâ. E lem ya’lem bi ennellâhe yerâ. Kellâ le in lem yentehi le nesfean bin nâsıyeh. Nâsiyetin kâzibetin hâtıeh. Felyed’u nâdiyeh. Sened’uz zebâniyeh. Kellâ, lâ tutı’hu vescud vakterib.",
                meaning: "Yaratan Rabbinin adıyla oku. O, insanı bir aşılanmış yumurtadan yarattı. Oku! Rabbin, en büyük kerem sahibidir. O Rab ki kalemle (yazmayı) öğretti. İnsana bilmedikleri şeyi öğretti. Gerçek şu ki, insan azar. Kendini kendine yeterli gördüğü için. Kuşkusuz dönüş Rabbinedir. Gördün mü şu men edeni. Namaz kılarken bir kulu (Peygamber'i namazdan). Gördün mü, ya o (Peygamber) doğru yolda olur. Yahut takvayı emrediyorsa. Ne dersin o (meneden, Peygamber'i) yalanlıyor ve doğru yoldan yüz çeviriyorsa. (Bu adam) Allah'ın, (yaptıklarını) gördüğünü bilmez mi. Hayır, hayır! Eğer vazgeçmezse, derhal onu alnından (perçeminden), yakalarız (cehenneme atarız). O yalancı, günahkar alından (perçemden). O, hemen gidip meclisini (kendi taraftarlarını) çağırsın. Biz de zebanileri çağıracağız. Hayır! Ona uyma! Allah'a secde et ve (yalnızca O'na) yaklaş.",
                tips: ["İlk beş ayeti Hira'da inen ilk vahiydir.", "DİKKAT: Son ayeti secde ayetidir; okuyan tilâvet secdesi yapar."]
            },
            {
                title: "A'lâ Suresi",
                instruction: "“Rabbinin yüce adını tesbih et” diyerek başlar; yaratılış düzenini ve öğüdün faydasını anlatır.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ سَبِّحِ اسْمَ رَبِّكَ الْأَعْلَى ۝ الَّذِي خَلَقَ فَسَوَّىٰ ۝ وَالَّذِي قَدَّرَ فَهَدَىٰ ۝ وَالَّذِي أَخْرَجَ الْمَرْعَىٰ ۝ فَجَعَلَهُ غُثَاءً أَحْوَىٰ ۝ سَنُقْرِئُكَ فَلَا تَنسَىٰ ۝ إِلَّا مَا شَاءَ اللَّهُ إِنَّهُ يَعْلَمُ الْجَهْرَ وَمَا يَخْفَىٰ ۝ وَنُيَسِّرُكَ لِلْيُسْرَىٰ ۝ فَذَكِّرْ إِن نَّفَعَتِ الذِّكْرَىٰ ۝ سَيَذَّكَّرُ مَن يَخْشَىٰ ۝ وَيَتَجَنَّبُهَا الْأَشْقَى ۝ الَّذِي يَصْلَى النَّارَ الْكُبْرَىٰ ۝ ثُمَّ لَا يَمُوتُ فِيهَا وَلَا يَحْيَىٰ ۝ قَدْ أَفْلَحَ مَن تَزَكَّىٰ ۝ وَذَكَرَ اسْمَ رَبِّهِ فَصَلَّىٰ ۝ بَلْ تُؤْثِرُونَ الْحَيَاةَ الدُّنْيَا ۝ وَالْآخِرَةُ خَيْرٌ وَأَبْقَىٰ ۝ إِنَّ هَٰذَا لَفِي الصُّحُفِ الْأُولَىٰ ۝ صُحُفِ إِبْرَاهِيمَ وَمُوسَىٰ",
                transcription: "Bismillâhirrahmânirrahîm. Sebbihısme rabbikel a’lâ. Ellezî halaka fesevvâ. Vellezî kaddere fe hedâ. Vellezî ahrecel mer’â. Fe cealehu gusâen ahvâ. Senukriuke fe lâ tensâ. İllâ mâ şâallâh, innehu ya’lemul cehre ve mâ yahfâ. Ve nuyessiruke lil yusrâ. Fe zekkir in nefeatiz zikrâ. Seyezzekkeru men yahşâ. Ve yetecennebuhel eşkâ. Ellezî yaslen nârel kubrâ. Summe lâ yemûtu fîhâ ve lâ yahyâ. Kad efleha men tezekkâ. Ve zekeresme rabbihî fe sallâ. Bel tu’sırûnel hayâted dunyâ. Vel âhıretu hayrun ve ebkâ. İnne hâzâ le fîs suhufîl ûlâ. Suhufi ibrâhîme ve mûsâ.",
                meaning: "Yüce Rabbinin adını. Yaratıp düzene koyan. Takdir edip yol gösteren. (Topraktan) yeşil otu çıkaran. Sonra da onu kapkara bir sel artığına çeviren yüce Rabbinin adını tesbih (ve takdis) et. Sana (Kur an'ı) okutacağız; sen hiç unutmayacaksın. Artık Allah'ın dilediği hariç, Şüphesiz Allah, açığı ve gizleneni bilir. Seni en kolaya muvaffak kılacağız. O halde eğer öğüt fayda verirse öğüt ver. (Allah'tan) korkan öğütten yararlanacak. Kötü kimse ise öğütten kaçınacaktır. O ki, en büyük ateşe girecektir. Sonra o, ateşte ne ölür ne de yaşar. Doğrusu feraha ermiştir temizlenen. Rabbinin adını anıp O'na kulluk eden. Fakat siz (ey insanlar! ) dünya hayatını tercih ediyorsunuz. Oysa ahiret daha hayırlı daha devamlıdır. Şüphesiz bu (anlatılanlar), önceki kitaplarda, vardır. İbrahim ve Musa'nın kitaplarında.",
                tips: ["Peygamberimiz cuma ve bayram namazlarında okurdu.", "Vitir namazının ilk rekâtında okunması yaygındır."]
            },
            {
                title: "Beled Suresi",
                instruction: "Mekke şehrine yemin ederek insanın zorluk içinde yaratıldığını ve sarp yokuşun ne olduğunu anlatır.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ لَا أُقْسِمُ بِهَٰذَا الْبَلَدِ ۝ وَأَنتَ حِلٌّ بِهَٰذَا الْبَلَدِ ۝ وَوَالِدٍ وَمَا وَلَدَ ۝ لَقَدْ خَلَقْنَا الْإِنسَانَ فِي كَبَدٍ ۝ أَيَحْسَبُ أَن لَّن يَقْدِرَ عَلَيْهِ أَحَدٌ ۝ يَقُولُ أَهْلَكْتُ مَالًا لُّبَدًا ۝ أَيَحْسَبُ أَن لَّمْ يَرَهُ أَحَدٌ ۝ أَلَمْ نَجْعَل لَّهُ عَيْنَيْنِ ۝ وَلِسَانًا وَشَفَتَيْنِ ۝ وَهَدَيْنَاهُ النَّجْدَيْنِ ۝ فَلَا اقْتَحَمَ الْعَقَبَةَ ۝ وَمَا أَدْرَاكَ مَا الْعَقَبَةُ ۝ فَكُّ رَقَبَةٍ ۝ أَوْ إِطْعَامٌ فِي يَوْمٍ ذِي مَسْغَبَةٍ ۝ يَتِيمًا ذَا مَقْرَبَةٍ ۝ أَوْ مِسْكِينًا ذَا مَتْرَبَةٍ ۝ ثُمَّ كَانَ مِنَ الَّذِينَ آمَنُوا وَتَوَاصَوْا بِالصَّبْرِ وَتَوَاصَوْا بِالْمَرْحَمَةِ ۝ أُولَٰئِكَ أَصْحَابُ الْمَيْمَنَةِ ۝ وَالَّذِينَ كَفَرُوا بِآيَاتِنَا هُمْ أَصْحَابُ الْمَشْأَمَةِ ۝ عَلَيْهِمْ نَارٌ مُّؤْصَدَةٌ",
                transcription: "Bismillâhirrahmânirrahîm. Lâ uksimu bi hâzel beled. Ve ente hıllun bi hâzel beled. Ve vâlidin ve mâ veled. Lekad halaknel insâne fî kebed. E yahsebu en len yakdira aleyhi ehad. Yekûlu ehlektu mâlen lubedâ. E yahsebu en lem yerahû ehad. E lem nec’al lehu ayneyn. Ve lisânen ve şefeteyn. Ve hedeynâhun necdeyn. Fe laktehamel akabete. Ve mâ edrâke mel akabeh. Fekku rekabetin. Ev ıt’âmun fî yevmin zî mesgabeh. Yetîmen zâ makrabeh. Ev miskînen zâ metrabeh. Summe kâne minellezîne âmenû ve tevâsav bis sabri ve tevâsav bil merhame. Ulâike ashâbul meymeneh. Vellezîne keferû bi âyâtinâ hum ashâbul meş’emeh. Aleyhim nârun mu’sadeh.",
                meaning: "Andolsun bu beldeye. Ki sen bu beldedesin. Ve andolsun babaya ve ondan meydana gelen çocuğa. Biz, insanı ( yüzyüze geleceği nice ) zorluklar içinde yarattık. İnsan, hiç kimsenin kendisine güç yetiremeyeceğini mi sanıyor. Pek çok mal harcadım “ diyor. Kimse onu görmedi mi sanıyor. Biz ona iki göz vermedik mi. Bir dil ve iki dudak. Ona iki yolu ( doğru ve eğriyi ) gösterdik. Fakat o, sarp yokuşu aşamadı. O sarp yokuş nedir bilir misin. Köle azat etmek. Veya açlık gününde yemek yedirmektir. Yakınlığı olan bir yetime. Veya hiçbir şeyi olmayan yoksula. Sonra iman edenlerden, birbirlerine sabrı tavsiye edenlerden ve birbirlerine acımayı öğütleyenlerden olmaktır. İşte bunlar sağdakilerdir. Ayetlerimizi inkar edenler ise işte onlar soldakilerdir. Cezaları, kapıları üzerlerine sımsıkı kapatılmış bir ateştir.",
                tips: ["Sarp yokuş: köle azat etmek, yetimi ve yoksulu doyurmak.", "Gerçek yiğitliğin merhamet olduğunu öğretir."]
            },
            {
                title: "Ğâşiye Suresi",
                instruction: "Her şeyi kaplayan kıyamet gününü; cehennem ve cennet tablolarını anlatır, deveye ve göğe bakmaya çağırır.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ هَلْ أَتَاكَ حَدِيثُ الْغَاشِيَةِ ۝ وُجُوهٌ يَوْمَئِذٍ خَاشِعَةٌ ۝ عَامِلَةٌ نَّاصِبَةٌ ۝ تَصْلَىٰ نَارًا حَامِيَةً ۝ تُسْقَىٰ مِنْ عَيْنٍ آنِيَةٍ ۝ لَّيْسَ لَهُمْ طَعَامٌ إِلَّا مِن ضَرِيعٍ ۝ لَّا يُسْمِنُ وَلَا يُغْنِي مِن جُوعٍ ۝ وُجُوهٌ يَوْمَئِذٍ نَّاعِمَةٌ ۝ لِّسَعْيِهَا رَاضِيَةٌ ۝ فِي جَنَّةٍ عَالِيَةٍ ۝ لَّا تَسْمَعُ فِيهَا لَاغِيَةً ۝ فِيهَا عَيْنٌ جَارِيَةٌ ۝ فِيهَا سُرُرٌ مَّرْفُوعَةٌ ۝ وَأَكْوَابٌ مَّوْضُوعَةٌ ۝ وَنَمَارِقُ مَصْفُوفَةٌ ۝ وَزَرَابِيُّ مَبْثُوثَةٌ ۝ أَفَلَا يَنظُرُونَ إِلَى الْإِبِلِ كَيْفَ خُلِقَتْ ۝ وَإِلَى السَّمَاءِ كَيْفَ رُفِعَتْ ۝ وَإِلَى الْجِبَالِ كَيْفَ نُصِبَتْ ۝ وَإِلَى الْأَرْضِ كَيْفَ سُطِحَتْ ۝ فَذَكِّرْ إِنَّمَا أَنتَ مُذَكِّرٌ ۝ لَّسْتَ عَلَيْهِم بِمُصَيْطِرٍ ۝ إِلَّا مَن تَوَلَّىٰ وَكَفَرَ ۝ فَيُعَذِّبُهُ اللَّهُ الْعَذَابَ الْأَكْبَرَ ۝ إِنَّ إِلَيْنَا إِيَابَهُمْ ۝ ثُمَّ إِنَّ عَلَيْنَا حِسَابَهُم",
                transcription: "Bismillâhirrahmânirrahîm. Hel etâke hadîsul gâşiyeh. Vucûhun yevmeizin hâşiah. Âmiletun nâsıbeh. Teslâ nâren hâmiyeh. Tuskâ min aynin âniyeh. Leyse lehum taâmun illâ min darî’. Lâ yusminu ve lâ yugnî min cû’. Vucûhun yevmeizin nâımeh. Li sa’yihâ râdiyeh. Fî cennetin âliyeh. Lâ tesmeu fîhâ lâgıyeh. Fîhâ aynun câriyeh. Fîhâ sururun merfûah. Ve ekvabun mevdûah. Ve nemârıku masfûfeh. Ve zerâbiyyu mebsûseh. E fe lâ yanzurûne ilel ibili keyfe hulikat. Ve iles semâi keyfe rufiat. Ve ilel cibâli keyfe nusıbet. Ve ilel ardı keyfe sutıhat. Fezekkir innemâ ente muzekkir. Leste aleyhim bi musaytır. İllâ men tevellâ ve kefer. Fe yuazzibuhullâhul azâbel ekber. İnne ileynâ iyâbehum. Summe inne aleynâ hisâbehum.",
                meaning: "(Resulüm!) Dehşeti her şeyi kaplayan kıyametin haberi sana geldi mi. O gün bir takım yüzler zelildir. Durmadan çalışır, (fakat boşuna) yorulur. Kızgın ateşe girer. Onlara kaynar su pınarından içirilir. Onlar için kuru dikenden başka yemek yoktur. O ise ne besler ne de açlığı giderir. O gün bir takım yüzler de vardır ki, mutludurlar. (Dünyadaki) çabalarından hoşnut olmuşlardır. Yüce bir cennettedirler. Orada boş bir söz işitmezler. Orada (cennette) devamlı akan bir pınar. Yükseltilmiş tahtlar. Konulmuş kadehler. Sıra sıra dizilmiş yastıklar. Serilmiş halılar vardır. (İnsanlar) devenin nasıl yaratıldığına, bakmazlar mı. Göğe bakmıyorlar mı nasıl yükseltilmiş. Dağların nasıl dikildiğine, bakmazlar mı. Yeryüzünün nasıl yayıldığına bir bakmazlar mı. O halde (Resulüm), öğüt ver. Çünkü sen ancak öğüt vericisin. Onların üzerinde bir zorba değilsin. Ancak yüz çevirir inkar ederse. İşte öylesini Allah en büyük azap ile cezalandırır. Şüphesiz onların dönüşü sadece bizedir. Sonra onların sorguya çekilmesi de sadece bize aittir.",
                tips: ["Peygamberimiz cuma namazında A'lâ ile birlikte okurdu.", "Kâinata bakıp düşünmeye çağıran ayetleri meşhurdur."]
            },
            {
                title: "Beyyine Suresi",
                instruction: "Apaçık delil olan Peygamberi, halis dini, namaz ve zekâtı; iyilerin ve inkârcıların âkıbetini anlatır.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ لَمْ يَكُنِ الَّذِينَ كَفَرُوا مِنْ أَهْلِ الْكِتَابِ وَالْمُشْرِكِينَ مُنفَكِّينَ حَتَّىٰ تَأْتِيَهُمُ الْبَيِّنَةُ ۝ رَسُولٌ مِّنَ اللَّهِ يَتْلُو صُحُفًا مُّطَهَّرَةً ۝ فِيهَا كُتُبٌ قَيِّمَةٌ ۝ وَمَا تَفَرَّقَ الَّذِينَ أُوتُوا الْكِتَابَ إِلَّا مِن بَعْدِ مَا جَاءَتْهُمُ الْبَيِّنَةُ ۝ وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللَّهَ مُخْلِصِينَ لَهُ الدِّينَ حُنَفَاءَ وَيُقِيمُوا الصَّلَاةَ وَيُؤْتُوا الزَّكَاةَ وَذَٰلِكَ دِينُ الْقَيِّمَةِ ۝ إِنَّ الَّذِينَ كَفَرُوا مِنْ أَهْلِ الْكِتَابِ وَالْمُشْرِكِينَ فِي نَارِ جَهَنَّمَ خَالِدِينَ فِيهَا أُولَٰئِكَ هُمْ شَرُّ الْبَرِيَّةِ ۝ إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ أُولَٰئِكَ هُمْ خَيْرُ الْبَرِيَّةِ ۝ جَزَاؤُهُمْ عِندَ رَبِّهِمْ جَنَّاتُ عَدْنٍ تَجْرِي مِن تَحْتِهَا الْأَنْهَارُ خَالِدِينَ فِيهَا أَبَدًا رَّضِيَ اللَّهُ عَنْهُمْ وَرَضُوا عَنْهُ ذَٰلِكَ لِمَنْ خَشِيَ رَبَّهُ",
                transcription: "Bismillâhirrahmânirrahîm. Lem yekunillizîne keferû min ehlil kitâbi vel muşrikîne munfekkîne hattâ te’tiye humul beyyineh. Resûlun minallâhi yetlû suhufen mutahharah. Fîhâ kutubun kayyimeh. Ve mâ teferrekallezîne ûtûl kitâbe illâ min ba’di mâ câet humul beyyineh. Ve mâ umirû illâ li ya’budûllâhe muhlisîne lehud dîne hunefâe ve yukîmûs salâte ve yu’tûz zekâte ve zâlike dînul kayyimeh. İnnellezîne keferû min ehlil kitâbi velmuşrikîne fî nâri cehenneme hâlidîne fîhâ, ulâike hum şerrul beriyeh. İnnellezîne âmenû ve amilûs sâlihâti ulâike hum hayrul beriyyeh. Cezâuhum inde rabbihim cennâtu adnin tecrî min tahtihel enhâru hâlidîne fîhâ ebedâ, radıyallâhu anhum ve radû anh, zâlike li men haşiye rabbeh.",
                meaning: "Apaçık delil kendilerine gelinceye kadar ehl-i kitaptan ve müşriklerden inkarcılar (küfürden) ayrılacak değillerdi. (İşte o apaçık delil,) Allah tarafından gönderilen ve tertemiz sahifeleri okuyan bir elçidir. En doğru hükümler vardır şu sahifelerde. Kendilerine kitap verilenler ancak o açık delil (Peygamber) kendilerine geldikten sonra ayrılığa düştüler. Halbuki onlara ancak, dini yalnız O'na has kılarak ve hanifler olarak Allah'a kulluk etmeleri, namaz kılmaları ve zekat vermeleri emrolunmuştu. Sağlam din de budur. Ehl-i kitap ve müşriklerden olan inkarcılar, içinde ebedi olarak kalacakları cehennem ateşindedirler. İşte halkın en şerlileri onlardır. İman edip salih ameller işleyenlere gelince, halkın en hayırlısı da onlardır. Onların Rableri katındaki mükafatları, zemininden ırmaklar akan, içinde devamlı olarak kalacakları Adn cennetleridir. Allah kendilerinden hoşnut olmuş, onlar da Allah'tan hoşnut olmuşlardır. Bu söylenenler hep Rabbinden korkan (O'na saygı gösterenler) içindir.",
                tips: ["Ayetleri uzundur; acele etmeden bölüm bölüm çalış.", "“Dinde ihlâs” yani niyeti Allah'a halis kılmak vurgulanır."]
            },
            {
                title: "Fecr Suresi",
                instruction: "Tan yerine ve on geceye yemin eder; Âd, Semûd ve Firavun'un sonunu anlatır, huzura eren nefse müjde verir.",
                arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ وَالْفَجْرِ ۝ وَلَيَالٍ عَشْرٍ ۝ وَالشَّفْعِ وَالْوَتْرِ ۝ وَاللَّيْلِ إِذَا يَسْرِ ۝ هَلْ فِي ذَٰلِكَ قَسَمٌ لِّذِي حِجْرٍ ۝ أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِعَادٍ ۝ إِرَمَ ذَاتِ الْعِمَادِ ۝ الَّتِي لَمْ يُخْلَقْ مِثْلُهَا فِي الْبِلَادِ ۝ وَثَمُودَ الَّذِينَ جَابُوا الصَّخْرَ بِالْوَادِ ۝ وَفِرْعَوْنَ ذِي الْأَوْتَادِ ۝ الَّذِينَ طَغَوْا فِي الْبِلَادِ ۝ فَأَكْثَرُوا فِيهَا الْفَسَادَ ۝ فَصَبَّ عَلَيْهِمْ رَبُّكَ سَوْطَ عَذَابٍ ۝ إِنَّ رَبَّكَ لَبِالْمِرْصَادِ ۝ فَأَمَّا الْإِنسَانُ إِذَا مَا ابْتَلَاهُ رَبُّهُ فَأَكْرَمَهُ وَنَعَّمَهُ فَيَقُولُ رَبِّي أَكْرَمَنِ ۝ وَأَمَّا إِذَا مَا ابْتَلَاهُ فَقَدَرَ عَلَيْهِ رِزْقَهُ فَيَقُولُ رَبِّي أَهَانَنِ ۝ كَلَّا بَل لَّا تُكْرِمُونَ الْيَتِيمَ ۝ وَلَا تَحَاضُّونَ عَلَىٰ طَعَامِ الْمِسْكِينِ ۝ وَتَأْكُلُونَ التُّرَاثَ أَكْلًا لَّمًّا ۝ وَتُحِبُّونَ الْمَالَ حُبًّا جَمًّا ۝ كَلَّا إِذَا دُكَّتِ الْأَرْضُ دَكًّا دَكًّا ۝ وَجَاءَ رَبُّكَ وَالْمَلَكُ صَفًّا صَفًّا ۝ وَجِيءَ يَوْمَئِذٍ بِجَهَنَّمَ يَوْمَئِذٍ يَتَذَكَّرُ الْإِنسَانُ وَأَنَّىٰ لَهُ الذِّكْرَىٰ ۝ يَقُولُ يَا لَيْتَنِي قَدَّمْتُ لِحَيَاتِي ۝ فَيَوْمَئِذٍ لَّا يُعَذِّبُ عَذَابَهُ أَحَدٌ ۝ وَلَا يُوثِقُ وَثَاقَهُ أَحَدٌ ۝ يَا أَيَّتُهَا النَّفْسُ الْمُطْمَئِنَّةُ ۝ ارْجِعِي إِلَىٰ رَبِّكِ رَاضِيَةً مَّرْضِيَّةً ۝ فَادْخُلِي فِي عِبَادِي ۝ وَادْخُلِي جَنَّتِي",
                transcription: "Bismillâhirrahmânirrahîm. Vel fecr. Ve leyâlin aşr. Veş şef’ı vel vetr. Vel leyli izâ yesr. Hel fî zâlike kasemun lizî hicr. E lem tere keyfe feale rabbuke bi âd. İreme zâtil ımâd. Elletî lem yuhlak misluhâ fîl bilâd. Ve semûdelleziyne câbûssahre bil vâd. Ve fir avne zîl evtâd. Ellezîne tagav fîl bilâd. Fe ekserû fîhel fesâd. Fe sabbe aleyhim rabbuke sevta azâb. İnne rabbeke le bil mirsâd. Fe emmel insânu izâ mebtelâhu rabbuhu fe ekremehu ve na’amehu fe yekûlu rabbî ekremen. Ve emmâ izâ mebtelâhu fe kadere aleyhi rızkahu fe yekûlu rabbî ehânen. Kellâ bel lâ tukrimûnel yetîm. Ve lâ tehâddûne alâ taâmil miskîn. Ve te’kulûnet turâse eklen lemmâ. Ve tuhıbbûnel mâle hubben cemmâ. Kellâ izâ dukketil ardu dekken dekkâ. Ve câe rabbuke vel meleku saffen saffâ. Ve cîe yevmeizin bi cehenneme yevmeizin yetezekkerul insânu ve ennâ lehuz zikrâ. Yekûlu yâ leytenî kaddemtu li hayâtî. Fe yevmeizin lâ yuazzibu azâbehû ehad. Ve lâ yûsiku ve sâkahû ehad. Yâ eyyetuhen nefsul mutmainneh. İrciî ilâ rabbiki râdıyeten mardıyyeh. Fedhulî fî ibâdî. Vedhulî cennetî.",
                meaning: "Andolsun Fecre. On geceye. Çifte ve teke. (Her şeyi karanlığı ile) örttüğü an geceye. Bunlarda akıl sahibi için elbette birer yemin (değeri) vardır. Görmedin mi, Rabbin ne yaptı Âd kavmine. Direkleri (yüksek binaları) olan, İrem şehrine. Ki ülkeler içinde onun benzeri yaratılmamıştı. O vadide kayaları yontan Semud kavmine. Kazıklar (çadırlar, ordular) sahibi Firavun'a. Ki onların hepsi ülkelerinde azgınlık ettiler. Oralarda kötülüğü çoğalttılar. Bu yüzden Rabbin onların üstüne azap kamçısı yağdırdı. Çünkü Rabbin (her an) gözetlemededir. İnsan var ya, Rabbi kendisini imtihan edip de ikramda bulunduğunda ve bol nimet verdiğinde “Rabbim bana ikram etti” der. Onu imtihan edip rızkını daralttığında ise “Rabbim beni önemsemedi” der. Hayır! Doğrusu siz yetime ikram etmiyorsunuz. Yoksulu yedirmeye birbirinizi teşvik etmiyorsunuz. Haram helal demeden mirası yiyorsunuz. Malı aşırı biçimde seviyorsunuz. Ama yeryüzü parça parça döküldüğü. Rabbin(in emri) geldiği ve melekler saf saf dizildiği zaman (her şey ortaya çıkacaktır). O gün cehennem getirilir, insan yaptıklarını birer birer hatırlar. Fakat bu hatırlamanın ne faydası var. (İşte o zaman insan:) “Keşke bu hayatım için bir şeyler yapıp gönderseydim!” der. Artık o gün, Allah'ın edeceği azabı kimse edemez. O'nun vuracağı bağı kimse vuramaz. Ey huzura kavuşmuş insan. Sen O'ndan hoşnut, O da senden hoşnut olarak Rabbine dön. (Seçkin) kullarım arasına katıl. Ve cennetim gir.",
                tips: ["“On gece” çoğunlukla Zilhicce'nin ilk on gecesi kabul edilir.", "Son ayetleri cenaze ve teselli meclislerinde çok okunur."]
            },
            {
                title: "Haşr Suresi Son 3 Ayet",
                instruction: "Allah'ın güzel isimlerini arka arkaya anan üç ayettir; sabah ve akşam okunması tavsiye edilmiştir.",
                arabic: "هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ عَالِمُ الْغَيْبِ وَالشَّهَادَةِ هُوَ الرَّحْمَٰنُ الرَّحِيمُ ۝ هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْمَلِكُ الْقُدُّوسُ السَّلَامُ الْمُؤْمِنُ الْمُهَيْمِنُ الْعَزِيزُ الْجَبَّارُ الْمُتَكَبِّرُ سُبْحَانَ اللَّهِ عَمَّا يُشْرِكُونَ ۝ هُوَ اللَّهُ الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ لَهُ الْأَسْمَاءُ الْحُسْنَىٰ يُسَبِّحُ لَهُ مَا فِي السَّمَاوَاتِ وَالْأَرْضِ وَهُوَ الْعَزِيزُ الْحَكِيمُ",
                transcription: "Huvallâhullezî lâ ilâhe illâ huve, âlimul gaybi veş şehâdeh. Huver rahmânur rahîm. Huvallâhullezî lâ ilâhe illâ huve, elmelikul kuddûsus selâmul mû’minul muheyminul azîzul cebbârul mutekebbir. Subhânallâhi ammâ yuşrikûn. Huvallâhul hâlikul bâriûl musavviru lehul esmâul husnâ. Yusebbihu lehu mâ fîs semâvâti vel ard ve huvel azîzul hakîm.",
                meaning: "O, öyle Allah'tır ki, O'ndan başka tanrı yoktur. Görülmeyeni ve görüleni bilendir. O, esirgeyendir, bağışlayandır. O, öyle Allah'tır ki, kendisinden başka hiçbir tanrı yoktur. O, mülkün sahibidir, eksiklikten münezzehtir, selamet verendir, emniyete kavuşturandır, gözetip koruyandır, üstündür, istediğini zorla yaptıran, büyüklükte eşi olmayandır. Allah, müşriklerin ortak koştukları şeylerden münezzehtir. O, yaratan, var eden, şekil veren Allah'tır. En güzel isimler O'nundur. Göklerde ve yerde olanlar O'nun şanını yüceltmektedirler. O, galiptir, hikmet sahibidir.",
                tips: ["Bir rivayette sabah okuyana akşama kadar, akşam okuyana sabaha kadar melekler dua eder (Tirmizî).", "İlk iki ayet aynı başlar: 22'de “âlimül gaybi”, 23'te “el melikül kuddûs” diye ayrılır."]
            },
            {
                title: "Âmenerrasûlü",
                instruction: "Bakara Suresi'nin son iki ayetidir; imanın özeti ve baştan kabul edilmiş bir duadır.",
                arabic: "آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ وَقَالُوا سَمِعْنَا وَأَطَعْنَا غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ ۝ لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
                transcription: "Âmener resûlu bimâ unzile ileyhi min rabbihî vel mu’minûn. Kullun âmene billâhi ve melâiketihî ve kutubihî ve rusulih. Lâ nuferriku beyne ehadin min rusulih. Ve kâlû semi’nâ ve ata’nâ gufrâneke rabbenâ ve ileykel masîr. Lâ yukellifullâhu nefsen illâ vus’ahâ. Lehâ mâ kesebet ve aleyhâ mektesebet. Rabbenâ lâ tuâhıznâ in nesînâ ev ahta’nâ. Rabbenâ ve lâ tahmil aleynâ ısran kemâ hameltehu alellezîne min kablinâ. Rabbenâ ve lâ tuhammilnâ mâ lâ tâkate lenâ bih. Va’fu annâ, vagfir lenâ, verhamnâ, ente mevlânâ fensurnâ alel kavmil kâfirîn.",
                meaning: "Peygamber ve inananlar, ona Rabb'inden indirilene inandı. Hepsi Allah'a, meleklerine, kitaplarına, peygamberlerine inandı. “Peygamberleri arasından hiçbirini ayırdetmeyiz, işittik, itaat ettik, Rabbimiz! Affını dileriz, dönüş Sanadır” dediler. Allah kişiye ancak gücünün yeteceği kadar yükler; kazandığı iyilik lehine, ettiği kötülük de aleyhinedir. Rabbimiz! Eğer unutacak veya yanılacak olursak bizi sorumlu tutma. Rabbimiz bizden öncekilere yüklediğin gibi, bize de ağır yük yükleme. Rabbimiz! Bize gücümüzün yetmeyeceği şeyi taşıtma, bizi affet, bizi bağışla, bize acı. Sen Mevlamızsın, kafirlere karşı bize yardım et.",
                tips: ["Hadiste: “Kim geceleyin Bakara'nın son iki ayetini okursa, o iki ayet ona yeter.” (Buhârî, Müslim)", "Miraç gecesi Peygamberimize verilen üç şeyden biri sayılır."]
            },
            {
                title: "Ahzâb Suresi 35. Ayet",
                instruction: "Kadınla erkeği aynı on vasıfta yan yana sayar ve ikisine de aynı mükâfatı vaat eder.",
                arabic: "إِنَّ الْمُسْلِمِينَ وَالْمُسْلِمَاتِ وَالْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ وَالْقَانِتِينَ وَالْقَانِتَاتِ وَالصَّادِقِينَ وَالصَّادِقَاتِ وَالصَّابِرِينَ وَالصَّابِرَاتِ وَالْخَاشِعِينَ وَالْخَاشِعَاتِ وَالْمُتَصَدِّقِينَ وَالْمُتَصَدِّقَاتِ وَالصَّائِمِينَ وَالصَّائِمَاتِ وَالْحَافِظِينَ فُرُوجَهُمْ وَالْحَافِظَاتِ وَالذَّاكِرِينَ اللَّهَ كَثِيرًا وَالذَّاكِرَاتِ أَعَدَّ اللَّهُ لَهُم مَّغْفِرَةً وَأَجْرًا عَظِيمًا",
                transcription: "İnnel muslimîne vel muslimâti vel mu’minîne vel mu’minâti. Vel kânitîne vel kânitâti ves sâdikîne ves sâdikâti. Ves sâbirîne ves sâbirâti vel hâşiîne vel hâşiâti. Vel mutesaddikîne vel mutesaddikâti ves sâimîne ves sâimâti. Vel hâfızîne furûcehum vel hâfızâti vez zâkirînallâhe kesîren vez zâkirâti. Eaddallâhu lehum magfireten ve ecren azîmâ.",
                meaning: "Müslüman erkekler ve müslüman kadınlar, mümin erkekler ve mümin kadınlar, taata devam eden erkekler ve taata devam eden kadınlar, doğru erkekler ve doğru kadınlar, sabreden erkekler ve sabreden kadınlar, mütevazi erkekler ve mütevazi kadınlar, sadaka veren erkekler ve sadaka veren kadınlar, oruç tutan erkekler ve oruç tutan kadınlar, ırzlarını koruyan erkekler ve (ırzlarını) koruyan kadınlar, Allah'ı çok zikreden erkekler ve zikreden kadınlar var ya; işte Allah, bunlar için bir mağfiret ve büyük bir mükafat hazırlamıştır.",
                tips: ["On çift vasıf: müslüman, mümin, itaatkâr, doğru, sabırlı, mütevazı, sadaka veren, oruç tutan, iffetini koruyan, Allah'ı çok zikreden.", "Ümmü Seleme'nin “Kadınlar neden anılmıyor?” sorusu üzerine indiği rivayet edilir (Tirmizî, Nesâî)."]
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
                instruction: '"Semiallâhü limen hamideh" diyerek doğrulunur. Tam dik durulur ve "Rabbenâ lekel hamd" denir. Eller yanlara salınır.',
                arabic: 'سَمِعَ اللهُ لِمَنْ حَمِدَهُ ، رَبَّنَا لَكَ الْحَمْدُ',
                transcription: 'Doğrulurken: "Semiallâhü limen hamideh". Dik durunca: "Rabbenâ lekel hamd".',
                meaning: 'Allah, kendisine hamd edeni işitti. Rabbimiz, hamd Sanadır.',
                tips: ['Bu duruşa "Kavme" denir ve vaciptir.', 'Tam doğrulmadan secdeye gidilmez (Tadil-i Erkan).', 'Eller yanlara salınır, bağlanmaz.']
            },
            {
                title: '6. Birinci Secde',
                instruction: '"Allâhu Ekber" diyerek secdeye gidilir. Sırasıyla: dizler, eller, burun ve alın yere konur. Dirsekler havada (yere değmez), karın uyluktan uzak tutulur. Ayaklar dik, parmak uçları kıbleye döner.',
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
                tips: ['Alın ve burun yerde sabitlenir.', 'Secde anı, kulun Allah\'a en yakın olduğu anıdır.', 'Bu makamda gönülden dua edilebilir.']
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
                tips: ['Kadınların şehadet parmağını kaldırıp kaldırmayacağı konusunda farklı görüşler vardır.', 'Bakışlar kucağa yönelir, sükunetle okunur.']
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


/**
 * Arapça metin uzadıkça punto küçülür — Ettehiyyatü gibi uzun dualar sabit
 * puntoda kartı taşırıyor, "Hasbünallah" gibi kısa olanlar ise kaybolup gidiyordu.
 * Satır aralığı her boyda geniş kalır: harekeler üst üste binmesin.
 */
function arabicTypeClass(text) {
    const len = (text || '').length;
    if (len <= 60) return 'text-[1.95rem] leading-[2.3]';
    if (len <= 140) return 'text-[1.6rem] leading-[2.35]';
    if (len <= 280) return 'text-[1.35rem] leading-[2.4]';
    return 'text-[1.15rem] leading-[2.45]';
}

/** Etiket + içerik bloğu — okunuş ve anlam artık aynı gri yığında değil. */
const FieldBlock = ({ label, children, className, tour }) => (
    <div className={className} data-tour={tour}>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-emerald-100/30">
            {label}
        </p>
        {children}
    </div>
);

// Language-indexed guide overrides — add new languages here
const GUIDES_MAP = { en: GUIDES_EN, de: GUIDES_DE, ru: GUIDES_RU, ar: GUIDES_AR, az: GUIDES_AZ };

/** Hüküm rozeti — FARZ dolgulu, sünnet/müstehap çerçeveli. */
const RankPill = ({ rank }) => {
    const { t } = useTranslation('learn');
    if (!rank) return null;
    const label = t(rank === 'farz' ? 'rankFarz' : rank === 'sunnet' ? 'rankSunnet' : 'rankMustehab');
    return (
        <span
            className={cn(
                'rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]',
                rank === 'farz'
                    ? 'bg-[#B45309] text-white dark:bg-islamic-gold dark:text-[#032e18]'
                    : 'border border-[#B45309]/30 bg-[#B45309]/10 text-[#B45309] dark:border-islamic-gold/30 dark:bg-islamic-gold/10 dark:text-islamic-gold'
            )}
        >
            {label}
        </span>
    );
};

/** Katlanır bölüm başlığı — açık/kapalı tek satır. */
const FoldRow = ({ label, open, onToggle }) => (
    <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
            'flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-[0.8125rem] font-bold transition-colors',
            open
                ? 'border-[#B45309]/30 bg-[#B45309]/5 text-[#B45309] dark:border-islamic-gold/30 dark:bg-islamic-gold/10 dark:text-islamic-gold'
                : 'border-[#EDE5D1] text-gray-600 dark:border-white/10 dark:text-emerald-100/60'
        )}
    >
        <span className="flex-1 text-start">{label}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
    </button>
);

/**
 * Sihirbaz kartı.
 *
 * Denetimde kapatılan kusurlar: (a) aynı sayaç ekranda üç kez yazılıyordu —
 * artık YALNIZ burada; (b) başlık `font-serif`'ti, projenin kendi kuralı
 * "başlıkta serif yasak" diyor; (c) her adımda aynı damla ikonu bir kutuda
 * duruyordu (Dua bölümünde sildirilen "hepsi aynı ikon" kalıbının aynısı);
 * (d) Arapça düz bir şeritteydi, dua ve ezber ekranlarındaki levhaya bağlandı.
 *
 * Fıkhî talimat HİÇBİR yerde kırpılmaz (`line-clamp` yok) ve hüküm asla
 * yalnız renkle taşınmaz — rozetin metni her zaman okunur.
 */
const GuideStepCard = memo(({ step, index, total, isRtl, meta = null, collapsed = false, assurance = false, onJump = null, tour = false }) => {
    const { t } = useTranslation('learn');
    // Görsel dosyası henüz konmadıysa kart bozulmasın: hata olursa hiç çizilmez.
    // `loaded` olmadan yer AYRILMAZ — aksi hâlde dosya yokken kart önce 4:3
    // boşluk açıp sonra kapatıyor, her adımda zıplama oluyordu.
    const [imgOk, setImgOk] = useState(true);
    const [imgLoaded, setImgLoaded] = useState(false);
    // Kısa modda dua ve ipuçları katlı gelir — önce hareketi öğren.
    const [showDua, setShowDua] = useState(!collapsed);
    const [showTips, setShowTips] = useState(!collapsed);

    if (!step) return null;

    const image = imgOk ? stepImage(meta) : null;
    const hasDua = !!(step.arabic || step.transcription || step.meaning);
    const hasTips = step.tips?.length > 0;
    const isFarz = meta?.rank === 'farz';

    const duaBlock = (
        <div className="px-5 pb-1 pt-4">
            {step.arabic && (
                <Levha>
                    <p
                        dir="rtl"
                        lang="ar"
                        className={cn('break-words text-center font-arabic text-[#92400E] dark:text-islamic-gold', arabicTypeClass(step.arabic))}
                    >
                        {step.arabic}
                    </p>
                </Levha>
            )}

            {(step.transcription || step.meaning) && (
                <div className="space-y-4 pt-5">
                    {step.transcription && (
                        <FieldBlock label={t('translitLabel')}>
                            <p className="text-[0.8125rem] leading-relaxed text-gray-600 dark:text-emerald-100/65">
                                {step.transcription}
                            </p>
                        </FieldBlock>
                    )}

                    {/* Anlam sayfanın EN PARLAK metni: asıl okunacak şey bu. */}
                    {step.meaning && (
                        <FieldBlock label={t('meaningLabel')}>
                            <p
                                dir={isRtl ? 'rtl' : 'ltr'}
                                className="text-[0.9375rem] leading-relaxed text-stone-900 dark:text-white"
                            >
                                {step.meaning}
                            </p>
                        </FieldBlock>
                    )}
                </div>
            )}
        </div>
    );

    const tipsBlock = hasTips && (
        <div className="px-5 pb-1 pt-5">
            <FieldBlock
                label={t('tipsTitle')}
                tour={tour ? 'namaz-tips' : undefined}
                className="rounded-2xl border border-[#B45309]/25 p-4 dark:border-islamic-gold/25"
            >
                <ul className="space-y-2">
                    {step.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-gray-600 dark:text-emerald-100/55">
                            <span className="mt-[0.4375rem] h-[3px] w-[3px] shrink-0 rotate-45 bg-[#B45309] dark:bg-islamic-gold" />
                            <span>{tip}</span>
                        </li>
                    ))}
                </ul>
            </FieldBlock>
        </div>
    );

    return (
        <Card
            className={cn(
                'relative overflow-hidden rounded-[1.75rem] bg-[#FFFDF6] p-0 shadow-[0_10px_40px_-18px_rgba(0,0,0,0.28)] dark:bg-white/5 dark:text-white',
                // Farz adımın çerçevesi bir tık kalın: hüküm renkten bağımsız
                // ikinci bir kanalla da taşınsın.
                isFarz
                    ? 'border-[1.5px] border-[#B45309]/35 dark:border-islamic-gold/35'
                    : 'border border-[#B45309]/15 dark:border-islamic-gold/15'
            )}
        >
            {/* Görsel kartın en başında: fiziksel bir işlem önce gösterilir,
                sonra anlatılır. Dosya yoksa blok hiç çizilmez. */}
            {image && (
                <img
                    src={image}
                    alt=""
                    aria-hidden="true"
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgOk(false)}
                    className={cn(
                        'aspect-[4/3] w-full border-b border-[#B45309]/15 object-cover dark:border-islamic-gold/15',
                        !imgLoaded && 'hidden'
                    )}
                />
            )}

            <div className="px-5 pb-5 pt-5">
                {/* Künye — adım sayacının ekrandaki TEK yeri. */}
                <div className="mb-3 flex items-center gap-2">
                    {/* Künye dokunulabilir: "boynumu meshettim mi" sorusunun cevabı
                        12. karttaydı ve 11 kaydırma uzaktaydı. Bu ADIM yönünün
                        kabul edilen tek zayıflığıydı; O(n) gezinme O(1) seçime indi. */}
                    <button
                        type="button"
                        data-tour={tour && onJump ? 'namaz-jump' : undefined}
                        onClick={onJump}
                        disabled={!onJump}
                        aria-label={t('stepJumpTitle')}
                        className="-ms-1 -my-1 flex items-center gap-1.5 rounded-lg px-1 py-1 text-[1.125rem] font-extrabold tabular-nums tracking-tight text-black/35 transition-colors active:bg-black/[0.05] disabled:pointer-events-none dark:text-emerald-100/35 dark:active:bg-white/10"
                    >
                        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                        {onJump && <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    <span className="ms-auto flex items-center gap-1.5">
                        {step.repeat && (
                            <span className="rounded-full border border-[#B45309]/30 bg-[#B45309]/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#B45309] dark:border-islamic-gold/30 dark:bg-islamic-gold/10 dark:text-islamic-gold">
                                {step.repeat}
                            </span>
                        )}
                        <RankPill rank={meta?.rank} />
                    </span>
                </div>

                <h2 className="font-display text-[1.5rem] font-bold leading-tight tracking-tight text-balance text-stone-900 dark:text-white">
                    {step.title}
                </h2>
                {step.instruction && (
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-gray-600 dark:text-emerald-100/60">
                        {step.instruction}
                    </p>
                )}

                {/* Güvence satırı: üç kez yıkamak sünnet, bir kez farzı düşürür.
                    Ceza dili yok — "3'ü tamamlayamadın" hissi ürünü ters çevirir.
                    Yalnız TEKRARLI farz adımlarında; baş meshi farz ama tekrarsız. */}
                {assurance && isFarz && step.repeat && (
                    <p className="mt-3 text-[0.75rem] font-bold leading-relaxed text-[#B45309] dark:text-islamic-gold">
                        {t('farzAssurance')}
                    </p>
                )}

                {collapsed && (hasDua || hasTips) && (
                    <div className="mt-4 grid gap-2">
                        {hasDua && <FoldRow label={t('stepDuaLabel')} open={showDua} onToggle={() => setShowDua(v => !v)} />}
                        {hasTips && <FoldRow label={t('tipsTitle')} open={showTips} onToggle={() => setShowTips(v => !v)} />}
                    </div>
                )}
            </div>

            {hasDua && showDua && duaBlock}
            {hasTips && showTips && tipsBlock}
            {((hasDua && showDua) || (hasTips && showTips)) && <div className="pb-5" />}
        </Card>
    );
});

export default function Learn() {
    const navigate = useNavigate();
    /**
     * Bildirimden gelindiyse doğrudan ilgili ekran açılır:
     * `/learn?abdest=mesh` mesh tabakası, `/learn?ezber=1` Sureler listesi. `useLocation` kullanılıyor çünkü router biçimi değişse
     * bile (hash/browser) sorgu dizesi buradan doğru okunur. Başlangıç
     * değerleri olarak veriliyor — effect içinde setState yok.
     */
    const deepLinkParams = new URLSearchParams(useLocation().search);
    const deepLink = deepLinkParams.get('abdest');
    // `/learn?ezber=1` — ezber tekrar bildirimi doğrudan Sureler listesine düşer.
    const ezberLink = deepLinkParams.get('ezber');
    const [selectedCategory, setSelectedCategory] = useState(
        deepLink ? 'abdest' : ezberLink ? 'sureler' : 'dualar'
    );
    const [currentStep, setCurrentStep] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    // Ezber ("Perde") — yalnız Sureler kategorisinde
    const [ezberSure, setEzberSure] = useState(null);
    const [ezberProgress, setEzberProgress] = useState(readProgress);
    // Abdest merkezi: hangi konu açık (null = kart listesi)
    const [abdestTopic, setAbdestTopic] = useState(null);
    const [abdestSheet, setAbdestSheet] = useState(deepLink === 'mesh' ? 'mesh' : null);
    const [breakerId, setBreakerId] = useState(null);
    const [meshSection, setMeshSection] = useState(null);
    const [wuduMode, setWuduMode] = useState(readWuduMode);
    const [handsFree, setHandsFree] = useState(false);
    const [stepJump, setStepJump] = useState(false);
    // Mest durumu React state'inde TUTULMAZ: tek yazan MeshSheet, tek okuyan
    // aşağıdaki rozet. Kopyasını burada tutmak, tabaka her yazdığında iki
    // kaynağı senkron tutmayı gerektiriyordu. Tik yalnız "yeniden oku" işareti.
    const [mestTick, setMestTick] = useState(0);
    const bumpMest = useCallback(() => setMestTick(v => v + 1), []);
    // Hub aramasından gelince "Tam" moda geçici geçiş yapılır; konudan
    // çıkınca kullanıcının gerçek tercihi buradan geri yüklenir.
    const restoreModeRef = React.useRef(null);

    const { selection, success, heavy, light } = useHaptics();
    const { t, i18n } = useTranslation('learn');

    const lang = (i18n.language || 'en').split('-')[0];

    // Her render'da yeni nesne üretilirse AbdestHub'ın arama indeksi useMemo'su
    // hiç önbelleğe girmez (67 kayıt her tuş vuruşunda baştan kurulurdu).
    const activeGuides = useMemo(() => ({ ...GUIDES, ...(GUIDES_MAP[lang] || {}) }), [lang]);
    /**
     * Abdest artık tek rehber değil bir merkez: sihirbaz hangi konuya
     * dokunulduysa onun verisiyle açılır (abdest / gusul / teyemmum).
     * Diğer kategorilerde davranış aynı.
     */
    const guideKey = selectedCategory === 'abdest' ? abdestTopic : selectedCategory;
    const guide = guideKey ? activeGuides[guideKey] : null;

    // Sureler: ilk 1 sure ücretsiz, gerisi premium (ezber listesinde)
    const FREE_SURE_COUNT = 1;

    /**
     * "Kısa · farzlar" modu adımları SÜZER, yeni metin üretmez.
     * Süzgeç boş dönerse (bir dil dosyasında adım metni değişmiş olabilir)
     * tam listeye düşülür — kullanıcı boş sihirbaz görmez.
     */
    const wizardSteps = useMemo(() => {
        const all = guide?.steps || [];
        if (guideKey !== 'abdest' || wuduMode !== 'short') return all;
        const short = all.filter(st => wuduMeta(st)?.short);
        return short.length ? short : all;
    }, [guide, guideKey, wuduMode]);

    /**
     * İndeks liste boyunu ASLA aşmamalı. Bugün her geçişte sıfırlanıyor
     * (mod değişimi, konu açma/kapama) ama liste "Kısa" modda 15'ten 7'ye
     * düşüyor: bir yerde sıfırlama unutulursa kart boş çizilir ve göstergede
     * "9 / 7" yazardı. Ezberde birebir bu hata yaşandı.
     */
    const safeStep = Math.min(currentStep, Math.max(0, wizardSteps.length - 1));
    const step = wizardSteps[safeStep];
    const totalSteps = wizardSteps.length;
    // Rozet ve görsel üç temizlik rehberinde de var; namaz kategorileri hariç.
    const stepMeta = useMemo(() => (step ? wuduMeta(step) : null), [step]);

    // Adım sayısı ref'te taşınmıyordu diye değil, taşındığı için sorunluydu:
    // ref'i render sırasında yazmak React'in kuralını çiğniyor. `useHaptics`
    // zaten her render'da yeni kimlik döndürdüğü için `next` hiçbir zaman
    // kararlı değildi; ref bir şey kazandırmıyordu. Yan etki de updater'ın
    // içinden çıkarıldı (StrictMode updater'ı iki kez çalıştırıyor).
    const next = useCallback(() => {
        light();
        if (safeStep < totalSteps - 1) {
            setCurrentStep(safeStep + 1);
        } else {
            success();
            setIsComplete(true);
            if (guideKey) analytics.abdestGuideCompleted(guideKey, totalSteps, wuduMode);
        }
    }, [light, safeStep, success, totalSteps, guideKey, wuduMode]);

    const prev = useCallback(() => {
        light();
        setCurrentStep(Math.max(0, safeStep - 1));
    }, [light, safeStep]);

    const isRtl = lang === 'ar';

    /** Kartı yana kaydırmak adım değiştirir; RTL'de yön ters. */
    const handleSwipe = useCallback((_e, info) => {
        const dx = info.offset.x;
        const vx = info.velocity.x;
        if (!(Math.abs(dx) > 70 || Math.abs(vx) > 450)) return;
        if (isRtl ? dx > 0 : dx < 0) next(); else prev();
    }, [isRtl, next, prev]);

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
        setAbdestTopic(null);
        setAbdestSheet(null);
    }, [selection]);

    /** Merkezden bir konu açılır: sihirbaz konusu ya da tabaka. */
    const openAbdestTopic = useCallback((topic, stepIndex = -1, breaker = null, section = null) => {
        if (topic.kind === 'sheet') {
            setBreakerId(breaker);
            setMeshSection(section);
            setAbdestSheet(topic.id);
            return;
        }
        // Aramadan gelen adım kısa modda süzülmüş olabilir; tam listeye geçilir
        // ki kullanıcı tıkladığı adımı gerçekten görsün. DEPOYA YAZILMAZ:
        // eskiden kullanıcının tercihi arka planda kalıcı olarak değişiyordu.
        // Konudan çıkınca eski tercih geri gelir (`closeAbdestTopic`).
        if (stepIndex >= 0 && wuduMode === 'short') {
            restoreModeRef.current = 'short';
            setWuduMode('full');
        }
        setAbdestTopic(topic.id);
        setCurrentStep(Math.max(0, stepIndex));
        setIsComplete(false);
    }, [wuduMode]);

    const closeAbdestTopic = useCallback(() => {
        light();
        // Arama yüzünden geçici olarak açılan "Tam" modu geri alınır.
        if (restoreModeRef.current) {
            setWuduMode(restoreModeRef.current);
            restoreModeRef.current = null;
        }
        setAbdestTopic(null);
        setCurrentStep(0);
        setIsComplete(false);
    }, [light]);

    /**
     * Adıma git tabakası — künyeden açılır.
     *
     * Haptic ref üzerinden okunur: `useHaptics` her render'da YENİ fonksiyon
     * kimliği döndürüyor (`selection` bir `useCallback` değil). Doğrudan
     * bağımlılık verilseydi `openStepJump` her render'da değişir ve karta prop
     * olarak gittiği için `GuideStepCard`'ın `memo`'su boşa düşerdi.
     * (HandsFree'deki `goNextRef` aynı sebeple var.)
     */
    const selectionRef = React.useRef(selection);
    useEffect(() => { selectionRef.current = selection; });
    const openStepJump = useCallback(() => { selectionRef.current?.(); setStepJump(true); }, []);
    const pickStep = useCallback((i) => {
        setCurrentStep(i);
        setStepJump(false);
        setIsComplete(false);
        // Kabuğu namazlar/kadınNamaz/gusül/teyemmüm de kullanıyor: hangi rehberden
        // atlandığı yazılmazsa olay "abdest" adı altında karışık veri üretir.
        analytics.abdestStepJump(guideKey, i);
    }, [guideKey]);

    /** Islak el modu — açılışı ölçülüyor; bu modun kullanımı hiç bilinmiyordu. */
    const openHandsFree = useCallback(() => {
        selection();
        setHandsFree(true);
        analytics.abdestHandsFreeStart(wizardSteps.length, wuduMode);
    }, [selection, wizardSteps.length, wuduMode]);

    /**
     * Mod değişimi KONUMU KORUR. Eskiden `setCurrentStep(0)` vardı: 12. adımdaki
     * kullanıcı "Kısa"ya bakıp geri dönünce baştan başlıyordu.
     *
     * Eşleme indeksle değil `id` ile: iki listenin uzunluğu farklı (15 ↔ 7).
     * Bulunulan adım yeni listede yoksa ONDAN ÖNCEKİ en yakın adıma düşülür —
     * ileri atlamak, görülmemiş bir farzı geçmiş göstermek olurdu.
     */
    const changeWuduMode = useCallback((mode) => {
        selection();
        const all = guide?.steps || [];
        const nextList = mode === 'short'
            ? (all.filter(st => wuduMeta(st)?.short).length ? all.filter(st => wuduMeta(st)?.short) : all)
            : all;
        const currentId = wizardSteps[safeStep]?.id;
        let target = nextList.findIndex(st => st.id === currentId);
        if (target < 0) {
            const posInAll = all.findIndex(st => st.id === currentId);
            target = 0;
            for (let i = 0; i < nextList.length; i++) {
                const idx = all.findIndex(st => st.id === nextList[i].id);
                if (idx <= posInAll) target = i; else break;
            }
        }
        setWuduMode(mode);
        setCurrentStep(Math.max(0, target));
        storageService.setItem(WUDU_MODE_KEY, mode);
        analytics.abdestModeChanged(mode);
    }, [selection, guide, wizardSteps, safeStep]);

    const abdestHubVisible = selectedCategory === 'abdest' && !abdestTopic;

    useEffect(() => {
        if (!abdestHubVisible) return undefined;
        const timer = setInterval(() => setMestTick(v => v + 1), 60000);
        return () => clearInterval(timer);
    }, [abdestHubVisible]);

    /** Mest kartındaki kalan-süre rozeti; süre yoksa hiç çıkmaz. */
    const meshBadge = useMemo(() => {
        if (!abdestHubVisible) return null;
        void mestTick;                       // dakikalık tazeleme + tabaka yazınca
        const state = readMest();
        if (!state || state.startedAt <= 0) return null;
        const status = mestStatus(state);
        if (status.expired) return t('mesh.badgeExpired');
        const { hours, minutes } = splitRemaining(status.remainingMs);
        return hours >= 1 ? t('mesh.badgeHours', { n: hours }) : t('mesh.badgeMinutes', { n: minutes });
    }, [abdestHubVisible, mestTick, t]);

    /**
     * Donanım geri tuşu: sihirbazdan merkeze döner.
     *
     * Tabaka ve tam ekran mod kendi dinleyicilerini kurar; Capacitor
     * dinleyicileri BİRİKTİRDİĞİ için burada da açık kalsaydı geri tuşu ikisini
     * birden tetikler, kullanıcı bir adım geri giderken iki adım geri giderdi.
     */
    useHardwareBack(
        selectedCategory === 'abdest' && !!abdestTopic && !abdestSheet && !handsFree && !stepJump,
        closeAbdestTopic
    );

    /**
     * Kubbe maskesi: sure listesiyle aynı sırada "ezberde mi" bilgisi.
     * Her surenin kubbede SABİT yeri olsun diye sıra listeden gelir — yoksa
     * taşlar sadece sayıya göre dolar ve İhlâs'ın yeri her seferinde değişir.
     */
    const ezberMask = useMemo(() => {
        if (selectedCategory !== 'sureler') return [];
        return (guide?.steps || []).map(st => {
            const e = ezberProgress[sureKey(st.arabic)];
            return !!(e && e.lines > 0 && e.done >= e.lines);
        });
    }, [selectedCategory, guide, ezberProgress]);

    const ezberSlotIndex = useMemo(
        () => (ezberSure ? (guide?.steps || []).indexOf(ezberSure) : -1),
        [ezberSure, guide]
    );

    // ── İpuçları ─────────────────────────────────────────────────────────
    // Bağlam = o an hangi ekran görünüyor. Sure listesi ve namaz sihirbazı ayrı
    // zincirler; ezber tabakası açıkken sure ipuçlarını EzberSheet yönetir.
    const [seenHints, setSeenHints] = useState(readSeenHints);
    const [hintId, setHintId] = useState(null);
    const hintTimerRef = React.useRef(null);
    const shownHintRef = React.useRef(null);
    const sureListReady = selectedCategory === 'sureler' && !ezberSure && (guide?.steps?.length || 0) > 0;
    // Sihirbaz ipuçları: adım listesi / tam ekran açıkken hedefler görünmüyor
    const isNamazGuide = selectedCategory === 'namazlar' || selectedCategory === 'kadinNamaz';
    const namazReady = isNamazGuide && !isComplete && !stepJump && !handsFree && (guide?.steps?.length || 0) > 0;
    const hintCtx = sureListReady ? 'sure'
        : namazReady ? (selectedCategory === 'kadinNamaz' ? 'kadin' : 'namaz')
            : null;
    const hintChain = hintCtx ? HINT_CHAINS[hintCtx] : NO_HINTS;

    // Ekranda duran ipucunun kimliği — ekran değişince "görüldü" yazmak için.
    useEffect(() => { shownHintRef.current = hintId; }, [hintId]);

    useEffect(() => {
        if (!hintCtx) return undefined;
        const chain = HINT_CHAINS[hintCtx];
        const first = nextHint(chain, readSeenHints());
        const timer = first === -1 ? null : setTimeout(() => setHintId(chain[first].id), 800);
        return () => {
            if (timer) clearTimeout(timer);
            clearTimeout(hintTimerRef.current);
            // Balon kullanıcı kapatmadan düştü (sure açıldı, kategori değişti).
            // Görüldü yazılmazsa ekrana her dönüşte aynı ipucu baştan çıkar.
            const shown = shownHintRef.current;
            if (shown && chain.some(h => h.id === shown)) {
                setSeenHints(markHintSeen(shown));
                shownHintRef.current = null;
                setHintId(null);
            }
        };
    }, [hintCtx]);

    useEffect(() => () => clearTimeout(hintTimerRef.current), []);

    const closeHint = useCallback((markSeen = true) => {
        const index = hintId ? hintChain.findIndex(h => h.id === hintId) : -1;
        if (index < 0) return;
        // markHintSeen TEST modunda hiçbir şey yazmaz (bkz. lib/hints.js)
        const nextSeen = markSeen ? markHintSeen(hintChain[index].id) : seenHints;
        setSeenHints(nextSeen);
        setHintId(null);
        const nextIdx = nextHint(hintChain, nextSeen, index);
        if (nextIdx >= 0) {
            clearTimeout(hintTimerRef.current);
            hintTimerRef.current = setTimeout(() => setHintId(hintChain[nextIdx].id), 180);
        }
    }, [hintChain, hintId, seenHints]);

    // Zincir değişince eski kimlik bulunamaz — yanlış balon çıkmaz.
    const activeHint = hintId ? hintChain.find(h => h.id === hintId) : null;

    /** Bugün tekrarı gelen ilk sure — sihirbazın üstünde tek satır. */
    const dueToday = useMemo(() => {
        if (selectedCategory !== 'sureler') return null;
        const keys = dueList(ezberProgress);
        if (!keys.length) return null;
        const steps = guide?.steps || [];
        const hit = steps.find(st => keys.includes(sureKey(st.arabic)));
        return hit ? { step: hit, count: keys.length } : null;
    }, [selectedCategory, ezberProgress, guide]);

    /**
     * Tekrar hatırlatmaları. Her ilerleme değişiminde yeniden kurulur; tarihli
     * ve tekil olduğu için tekrar günü olmayan günlerde bildirim çalmaz.
     */
    const surelerSteps = useMemo(() => ({ ...GUIDES, ...(GUIDES_MAP[lang] || {}) }).sureler?.steps || [], [lang]);
    useEffect(() => {
        if (!surelerSteps.length) return;
        const titleOf = (k) => surelerSteps.find(st => sureKey(st.arabic) === k)?.title || null;
        rescheduleEzberReminders(titleOf, {
            title: t('ezberNotifTitle'),
            bodyOne: (title) => t('ezberNotifOne', { title }),
            bodyMany: (title, n) => t('ezberNotifMany', { title, n }),
        });
    }, [ezberProgress, surelerSteps, t]);

    if (isComplete) {
        return (
            <div className="relative min-h-[80vh] flex flex-col items-center justify-center p-6 m-2 overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 rounded-[3rem] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-islamic-green/5 via-islamic-green/[0.02] to-transparent dark:from-islamic-gold/10 dark:via-islamic-gold/5 dark:to-transparent" />
                    {/* Sabit hale. Eskiden sonsuz nefes alıyordu: günde beş kez
                        görülen bir ekranda sürekli animasyon hem tören fazlası
                        hem de bitmeyen repaint. Ekranda tek glow kuralı. */}
                    <div className="absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-islamic-green/10 blur-3xl dark:bg-islamic-gold/15" />
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
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-islamic-green to-amber-700 dark:from-islamic-gold dark:to-amber-500 flex items-center justify-center shadow-2xl shadow-islamic-green/30 dark:shadow-islamic-gold/30">
                            <CheckCircle2 className="w-14 h-14 text-white dark:text-[#032e18]" strokeWidth={2.5} />
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <p className="text-sm font-bold uppercase tracking-[0.3em] text-islamic-green/60 dark:text-islamic-gold/60 mb-2">
                            {t('elhamdulillah')}
                        </p>
                        <h2 className="font-display text-[2rem] font-extrabold tracking-tight text-islamic-green dark:text-islamic-gold mb-3">
                            {t('mashallah')}
                        </h2>
                    </motion.div>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="text-gray-500 dark:text-emerald-100/50 mb-6 max-w-[280px] leading-relaxed"
                    >
                        <span className="font-semibold text-islamic-green dark:text-islamic-gold">{guide?.title}</span>
                        {' '}{t('completionMsg')}
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
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-emerald-100/30 font-medium">{t('stepLabel')}</span>
                        </div>
                        <div className="w-px h-8 bg-islamic-green/10 dark:bg-islamic-gold/15" />
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-islamic-green dark:text-islamic-gold">✓</span>
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-emerald-100/30 font-medium">{t('done')}</span>
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
                            {t('completionQuote')}
                        </p>
                        <p className="text-[10px] text-gray-300 dark:text-emerald-100/20 mt-1">{t('completionSource')}</p>
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
                            {t('restartBtn')}
                        </motion.button>
                        <button
                            onClick={() => setIsComplete(false)}
                            className="h-11 rounded-2xl text-sm font-medium text-gray-400 dark:text-emerald-100/30 hover:text-gray-600 dark:hover:text-emerald-100/50 transition-colors"
                        >
                            {t('goBackBtn')}
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Kategori şeridi her iki kolda da ortak — Hikayeler ve İbadetlerim
    // sekmeleriyle aynı segment paneli (kullanıcı kararı 2026-08-18).
    const categoryStrip = (
        <div className="glass-panel grid grid-cols-5 gap-1 rounded-3xl p-2">
            {CATEGORIES.map((cat, index) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                // Ücretsiz: abdest, dualar, sureler — premium: namazlar, kadinNamaz
                const isLocked = index > 2 && !isPremium();
                return (
                    <motion.button
                        key={cat.id}
                        onClick={() => {
                            if (isLocked) { navigate('/premium'); return; }
                            handleCategorySelect(cat.id);
                        }}
                        className={cn(
                            "relative overflow-hidden rounded-2xl px-2 py-3 text-xs font-bold uppercase tracking-wider transition-all",
                            isActive
                                ? "bg-islamic-green text-white shadow-lg dark:bg-islamic-gold dark:text-[#032e18]"
                                : isLocked
                                    ? "text-gray-400 opacity-60 dark:text-gray-500"
                                    : "text-gray-600 hover:bg-[#F0E8D5] dark:text-gray-300 dark:hover:bg-white/5"
                        )}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isLocked && (
                            <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-islamic-gold to-amber-600 shadow-sm">
                                <Crown size={8} className="text-white" fill="white" />
                            </div>
                        )}
                        <Icon className={cn("mx-auto mb-1 h-5 w-5", isActive && "drop-shadow-md")} />
                        <span className="block text-[9px] leading-tight">{t(cat.labelKey)}</span>
                    </motion.button>
                );
            })}
        </div>
    );

    // Sureler de sihirbaz değil: okuma/dinleme işini Kur'an sekmesi yapıyor,
    // burası ezberlenen yer. Kart listesi → dokun → Perde tabakası.
    if (selectedCategory === 'sureler') {
        return (
            <div className="flex flex-col space-y-6 p-5 pb-32">
                {categoryStrip}

                {/* Bugün tekrarı gelen sure — kutu değil, tek satır (Dualar'daki
                    "0px kalıcı krom" kuralı). Tekrar yoksa hiç görünmez. */}
                {dueToday && (
                    <div className="-mt-2 flex items-center gap-3 px-1">
                        <p className="min-w-0 flex-1 text-[0.875rem] leading-snug text-stone-700 dark:text-emerald-50">
                            {t('ezberDueToday', { title: dueToday.step.title })}
                            {dueToday.count > 1 && (
                                <span className="text-stone-500 dark:text-emerald-100/50"> {t('ezberDueMore', { n: dueToday.count - 1 })}</span>
                            )}
                        </p>
                        <button
                            type="button"
                            onClick={() => { selection(); setEzberSure(dueToday.step); }}
                            className="shrink-0 rounded-full bg-islamic-green px-4 py-2 font-display text-[0.8125rem] font-bold text-white active:opacity-90 dark:bg-islamic-gold dark:text-[#032e18]"
                        >
                            {t('ezberDueStart')}
                        </button>
                    </div>
                )}

                <SureList
                    sures={guide?.steps || []}
                    progress={ezberProgress}
                    freeCount={isPremium() ? Infinity : FREE_SURE_COUNT}
                    onOpen={(sure, locked) => {
                        if (locked) { navigate('/premium'); return; }
                        selection();
                        setEzberSure(sure);
                    }}
                />

                <EzberSheet
                    sure={ezberSure}
                    progress={ezberProgress}
                    mask={ezberMask}
                    slotIndex={ezberSlotIndex}
                    onClose={() => setEzberSure(null)}
                    onProgress={setEzberProgress}
                />

                {/* Tek seferlik ipuçları — karartmaz, engellemez */}
                {activeHint && (
                    <HintCoach
                        key={activeHint.id}
                        targetId={activeHint.target}
                        titleKey={activeHint.titleKey}
                        bodyKey={activeHint.bodyKey}
                        icon={activeHint.icon}
                        ns="learn"
                        step={hintChain.indexOf(activeHint)}
                        total={hintChain.length}
                        onClose={closeHint}
                    />
                )}
            </div>
        );
    }

    // Abdest artık tek rehber değil bir merkez: 5 konu kartı + arama.
    // Sihirbaz yalnız bir konu seçilince açılır (aşağıdaki ortak dal).
    if (selectedCategory === 'abdest' && !abdestTopic) {
        return (
            <div className="flex flex-col space-y-6 p-5 pb-32">
                {categoryStrip}
                <AbdestHub guides={activeGuides} meshBadge={meshBadge} onOpen={openAbdestTopic} />

                <BreakerSheet
                    open={abdestSheet === 'breakers'}
                    initialId={breakerId}
                    isRtl={isRtl}
                    onClose={() => { setAbdestSheet(null); setBreakerId(null); }}
                />

                <MeshSheet
                    open={abdestSheet === 'mesh'}
                    initialSection={meshSection}
                    isRtl={isRtl}
                    onClose={() => { setAbdestSheet(null); setMeshSection(null); }}
                    onStateChange={bumpMest}
                />
            </div>
        );
    }

    // Dualar artık sıralı sihirbaz değil, aranabilir bir raf.
    // Sihirbaz abdest/sureler/namaz gibi gerçekten prosedürel rehberlerde kalır.
    if (selectedCategory === 'dualar') {
        return (
            /* pb-32: son raf bottom bar'ın altında kalmasın (sihirbaz dalında da var) */
            <div className="flex flex-col pt-5 pb-32">
                <div className="px-5">{categoryStrip}</div>
                <DuaLibrary duas={guide?.steps || []} isRtl={isRtl} />
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-6 p-5 pb-32">
            {categoryStrip}

            {/* Merkeze dönüş — yalnız Abdest kolunda; diğer kategorilerde
                sihirbaz zaten kategorinin kendisi. */}
            {selectedCategory === 'abdest' && (
                <div className="-mb-2 flex items-center gap-1">
                    <button
                        type="button"
                        onClick={closeAbdestTopic}
                        aria-label={t('abdestBack')}
                        className="-ms-2.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-600 active:bg-black/[0.05] dark:text-emerald-100/70 dark:active:bg-white/10"
                    >
                        <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
                    </button>
                    <span className="truncate font-display text-[1.0625rem] font-bold text-stone-800 dark:text-emerald-50">
                        {guide?.title}
                    </span>
                </div>
            )}

            {/* Kısa / Tam — yalnız abdestte. Gusül ve teyemmümde her adım
                gerekli, süzecek bir şey yok. */}
            {guideKey === 'abdest' && (
                <div className="grid grid-cols-2 gap-1 rounded-full bg-[#F0E8D5] p-1 dark:bg-white/[0.06]">
                    {['short', 'full'].map(mode => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => changeWuduMode(mode)}
                            aria-pressed={wuduMode === mode}
                            className={cn(
                                'rounded-full py-2 text-[0.8125rem] font-bold transition-colors',
                                wuduMode === mode
                                    ? 'bg-[#FFFDF6] text-[#B45309] shadow-sm dark:bg-white/10 dark:text-islamic-gold'
                                    : 'text-gray-600 dark:text-emerald-100/55'
                            )}
                        >
                            {t(mode === 'short' ? 'abdestModeShort' : 'abdestModeFull')}
                        </button>
                    ))}
                </div>
            )}

            {/* İlerleme — yalnız çubuk.
                Başlık geri satırında zaten yazıyor, adım sayacı da kartın
                künyesinde: eskiden aynı iki bilgi ekranda üçer kez vardı. */}
            <div>
                <div
                    role="progressbar"
                    aria-valuenow={safeStep + 1}
                    aria-valuemin={1}
                    aria-valuemax={totalSteps || 1}
                    aria-label={t('stepProgress', { current: safeStep + 1, total: totalSteps })}
                    className="h-1 w-full overflow-hidden rounded-full bg-[#F0E8D5] dark:bg-white/10"
                >
                    <motion.div
                        className="h-full rounded-full bg-islamic-green dark:bg-islamic-gold"
                        initial={{ width: 0 }}
                        animate={{ width: `${((safeStep + 1) / (totalSteps || 1)) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>
            </div>

            {/* Main Presentation Area — yatay sürükleme adım değiştirir (dikey kaydırma kilitlenmez) */}
            <div className="relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        data-tour={isNamazGuide ? 'namaz-card' : undefined}
                        key={`${guideKey}-${wuduMode}-${safeStep}`}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        drag="x"
                        dragDirectionLock
                        dragElastic={0.08}
                        dragMomentum={false}
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={handleSwipe}
                    >
                        <GuideStepCard
                            step={step}
                            index={safeStep}
                            total={totalSteps}
                            isRtl={isRtl}
                            tour={isNamazGuide}
                            meta={stepMeta}
                            collapsed={guideKey === 'abdest' && wuduMode === 'short'}
                            assurance={guideKey === 'abdest'}
                            onJump={totalSteps > 1 ? openStepJump : null}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Islak el modu — YALNIZ abdest rehberinde. Kaydırmalı sihirbaz tam
                kullanılacağı anda kullanılamıyordu; bu onun cevabı. Gusül ve
                teyemmümde gösterilmez: bitiş metni abdest duasını hatırlatıyor
                ve bazı dillerde butonun nesnesi de açıkça "abdest".

                Navigasyonun ÜSTÜNDE duruyor: ekranın kurucu özelliğiydi ama
                kartın da butonların da altında gömülüydü — bitiş duası kartı
                ~800 karakter, o adımda kimse oraya inmiyordu. İkon yok; aynı
                damla simgesi bu ekranda üç ayrı yerde tekrarlanıyordu. */}
            {abdestTopic === 'abdest' && totalSteps > 0 && (
                <button
                    type="button"
                    onClick={openHandsFree}
                    className="flex h-[3.25rem] items-center justify-center rounded-2xl border border-[#B45309]/35 font-display text-[0.9375rem] font-bold text-[#B45309] transition-colors active:bg-[#B45309]/[0.06] dark:border-islamic-gold/35 dark:text-islamic-gold dark:active:bg-islamic-gold/10"
                >
                    {t('handsFreeCta')}
                </button>
            )}

            {/* Navigation — akışın içinde, kartın altında. Eskiden ekrana sabitliydi
                ve kaydırırken içeriğin üstünde kalıyordu. */}
            <div className="flex items-stretch gap-3">
                <Button
                    variant="outline"
                    onClick={prev}
                    disabled={safeStep === 0}
                    aria-label={t('navBack')}
                    className="h-14 w-14 shrink-0 rounded-2xl border-[#EDE5D1] bg-[#FFFDF6] p-0 text-gray-500 shadow-sm transition-all active:scale-95 disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                    <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
                </Button>

                <Button
                    onClick={next}
                    className="h-14 flex-1 rounded-2xl bg-islamic-green text-sm font-bold text-white shadow-lg shadow-islamic-green/20 transition-all active:scale-[0.98] dark:bg-islamic-gold dark:text-[#032e18] dark:shadow-islamic-gold/20"
                >
                    {safeStep === totalSteps - 1 ? (
                        <>{t('navComplete')} <CheckCircle2 className="ms-1.5 h-4 w-4" /></>
                    ) : (
                        <>{t('navNext')} <ChevronRight className="ms-1.5 h-4 w-4 rtl:rotate-180" /></>
                    )}
                </Button>
            </div>

            <StepJumpSheet
                open={stepJump}
                steps={wizardSteps}
                current={safeStep}
                guideTitle={guide?.title}
                isRtl={isRtl}
                onPick={pickStep}
                onClose={() => setStepJump(false)}
            />

            <HandsFree
                open={handsFree}
                steps={wizardSteps}
                onClose={() => setHandsFree(false)}
            />

            {/* Tek seferlik ipuçları — karartmaz, engellemez */}
            {activeHint && (
                <HintCoach
                    key={activeHint.id}
                    targetId={activeHint.target}
                    titleKey={activeHint.titleKey}
                    bodyKey={activeHint.bodyKey}
                    icon={activeHint.icon}
                    ns="learn"
                    step={hintChain.indexOf(activeHint)}
                    total={hintChain.length}
                    onClose={closeHint}
                />
            )}
        </div>
    );
}
