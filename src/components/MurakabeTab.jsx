import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, X, Scale, Sparkles, RotateCcw, Home, Crown, Lock, Flame, CalendarDays, Zap, Star, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useMobile';
import { QUESTION_POOL } from '@/data/murakabeQuestions';
import { getMurakabeKey, getAppDate } from '@/lib/testDate';
import { useTranslation } from 'react-i18next';
import { isPremium } from '@/services/creditService';

// Animation Variants
const cardVariants = {
    enter: {
        opacity: 0,
        y: 50,
        scale: 0.95
    },
    center: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1]
        }
    },
    exit: (direction) => ({
        opacity: 0,
        x: direction > 0 ? 200 : -200,
        scale: 0.9,
        transition: {
            duration: 0.3
        }
    })
};

export default function MurakabeTab() {
    const navigate = useNavigate();
    const { selection, success, heavy } = useHaptics();
    const { t, i18n } = useTranslation('murakabe');
    const currentLang = (i18n.language || 'en').split('-')[0];

    // Randomly selected questions for the day (7 items)
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [direction, setDirection] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [savedScore, setSavedScore] = useState(null);
    const [selectedAyah, setSelectedAyah] = useState(null);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [weeklyDays, setWeeklyDays] = useState([]);

    // Gift Ayahs - Themed spiritual rewards for completing Murakabe
    const giftAyahs = [
        { text: { tr: "Şüphesiz rızkı veren, sarsılmaz gücün sahibi olan Allah'tır.", en: "Indeed, it is Allah who is the Provider, the Firm Possessor of Strength.", ar: "إِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ الْمَتِينُ.", de: "Wahrlich, Allah ist der Versorger, der Besitzer unerschütterlicher Stärke.", az: "Həqiqətən, ruzi verən, möhkəm qüvvət sahibi Allahdır.", es: "En verdad, Allah es el Proveedor, el Poseedor de una fuerza inquebrantable.", fr: "C'est Allah qui est le Grand Pourvoyeur, le Détenteur de la force inébranlable.", id: "Sesungguhnya Allah, Dialah Maha Pemberi Rezeki, Yang Mempunyai Kekuatan lagi Sangat Kokoh.", nl: "Waarlijk, Allah is de Voorziener, de Bezitter van onwankelbare kracht.", ru: "Поистине, Аллах — Дарующий удел, Обладатель могущества, Крепкий." }, source: { tr: "Zâriyat, 58", en: "Adh-Dhariyat, 58", ar: "الذاريات، ٥٨" } },
        { text: { tr: "Kim Allah'tan sakınırsa, Allah ona bir çıkış yolu ihsan eder ve ona beklemediği yerden rızık verir.", en: "Whoever fears Allah, He will make a way out for him. And will provide for him from where he does not expect.", ar: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ.", de: "Wer Allah fürchtet, dem wird Er einen Ausweg schaffen und ihn versorgen, von wo er es nicht erwartet.", az: "Kim Allahdan qorxarsa, Allah ona bir çıxış yolu verər və onu gözləmədiyi yerdən ruzi verər.", es: "Quien teme a Allah, Él le dará una salida y le proveerá desde donde no lo espera.", fr: "Quiconque craint Allah, Il lui donnera une issue et lui accordera des dons d'où il ne s'y attend pas.", id: "Barang siapa bertakwa kepada Allah, niscaya Dia akan membukakan jalan keluar baginya dan memberi rezeki dari arah yang tidak disangka-sangkanya.", nl: "Wie Allah vreest, voor hem zal Hij een uitweg maken en hem voorzien van waar hij het niet verwacht.", ru: "Кто боится Аллаха, тому Он устроит выход и наделит его уделом, откуда он не ожидает." }, source: { tr: "Talâk, 2-3", en: "At-Talaq, 2-3", ar: "الطلاق، ٢-٣" } },
        { text: { tr: "Yeryüzünde kımıldayan hiçbir canlı yoktur ki rızkı Allah'a ait olmasın.", en: "There is no creature on earth but that upon Allah is its provision.", ar: "وَمَا مِن دَابَّةٍ فِي الْأَرْضِ إِلَّا عَلَى اللَّهِ رِزْقُهَا.", de: "Es gibt kein Lebewesen auf der Erde, dessen Versorgung nicht Allah obliegt.", az: "Yer üzündə elə bir canlı yoxdur ki, ruzisi Allaha aid olmasın.", es: "No hay criatura en la tierra cuya provisión no dependa de Allah.", fr: "Il n'y a point de bête sur terre dont la subsistance n'incombe à Allah.", id: "Tidak ada suatu makhluk melata pun di bumi melainkan semuanya dijamin Allah rezekinya.", nl: "Er is geen schepsel op aarde of zijn voorziening berust bij Allah.", ru: "Нет ни одного живого существа на земле, которое Аллах не обеспечил бы пропитанием." }, source: { tr: "Hûd, 6", en: "Hud, 6", ar: "هود، ٦" } },
        { text: { tr: "Hastalandığım zaman bana şifa veren O'dur.", en: "And when I am ill, it is He who cures me.", ar: "وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ.", de: "Und wenn ich krank bin, ist Er es, der mich heilt.", az: "Xəstələndiyim zaman mənə şəfa verən Odur.", es: "Y cuando enfermo, es Él quien me cura.", fr: "Et quand je suis malade, c'est Lui qui me guérit.", id: "Dan apabila aku sakit, Dialah yang menyembuhkan aku.", nl: "En wanneer ik ziek ben, is Hij het die mij geneest.", ru: "А когда я заболеваю, Он исцеляет меня." }, source: { tr: "Şuarâ, 80", en: "Ash-Shu'ara, 80", ar: "الشعراء، ٨٠" } },
        { text: { tr: "Biz Kur'an'dan, müminler için şifa ve rahmet olan şeyler indiriyoruz.", en: "We send down of the Quran that which is healing and mercy for the believers.", ar: "وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ.", de: "Wir senden vom Quran herab, was Heilung und Barmherzigkeit für die Gläubigen ist.", az: "Biz Qurandan möminlər üçün şəfa və rəhmət olan şeylər nazil edirik.", es: "Hacemos descender en el Corán lo que es curación y misericordia para los creyentes.", fr: "Nous faisons descendre du Coran ce qui est une guérison et une miséricorde pour les croyants.", id: "Kami turunkan dari Al-Qur'an apa yang menjadi penawar dan rahmat bagi orang-orang yang beriman.", nl: "Wij zenden van de Koran neer wat genezing en barmhartigheid is voor de gelovigen.", ru: "Мы ниспосылаем в Коране то, что является исцелением и милостью для верующих." }, source: { tr: "İsrâ, 82", en: "Al-Isra, 82", ar: "الإسراء، ٨٢" } },
        { text: { tr: "Kendileri ile huzur bulasınız diye sizin için türünüzden eşler yaratması ve aranıza sevgi ve merhamet koyması O'nun ayetlerindendir.", en: "And of His signs is that He created for you from yourselves mates that you may find tranquility in them; and He placed between you affection and mercy.", ar: "وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً.", de: "Zu Seinen Zeichen gehört, dass Er euch Gattinnen aus euch selbst erschuf, damit ihr bei ihnen Ruhe findet, und Zuneigung und Barmherzigkeit zwischen euch setzte.", az: "Onun dəlillərindən biri də sizin üçün öz cinsinizdən zövcələr yaratması və aranıza sevgi və mərhəmət qoymasıdır.", es: "Entre Sus signos está el haber creado para vosotros esposas de vuestra misma especie para que encontréis sosiego en ellas, y puso entre vosotros afecto y misericordia.", fr: "Parmi Ses signes, Il a créé pour vous des épouses issues de vous-mêmes pour que vous trouviez la quiétude auprès d'elles, et Il a mis entre vous de l'affection et de la miséricorde.", id: "Di antara tanda-tanda-Nya ialah Dia menciptakan untukmu istri-istri dari jenismu sendiri, supaya kamu merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.", nl: "Tot Zijn tekenen behoort dat Hij echtgenotes voor jullie schiep uit jullie eigen soort opdat jullie rust bij hen vinden, en Hij bracht genegenheid en barmhartigheid tussen jullie.", ru: "Среди Его знамений — то, что Он сотворил из вас самих жён для вас, чтобы вы находили в них покой, и установил между вами любовь и милосердие." }, source: { tr: "Rûm, 21", en: "Ar-Rum, 21", ar: "الروم، ٢١" } },
        { text: { tr: "Rabbimiz! Bize göz aydınlığı olacak eşler ve çocuklar bahşet.", en: "Our Lord, grant us from among our spouses and offspring comfort to our eyes.", ar: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ.", de: "Unser Herr, schenke uns an unseren Gattinnen und Nachkommen Freude unserer Augen.", az: "Rəbbimiz! Bizə göz aydınlığı olacaq həyat yoldaşları və övladlar bəxş et.", es: "¡Señor nuestro! Concédenos en nuestras esposas e hijos el consuelo de nuestros ojos.", fr: "Seigneur ! Accorde-nous en nos épouses et nos enfants la joie de nos yeux.", id: "Ya Tuhan kami, anugerahkanlah kepada kami pasangan kami dan keturunan kami sebagai penyenang hati kami.", nl: "Onze Heer, schenk ons van onze echtgenoten en nakomelingen vreugde voor onze ogen.", ru: "Господь наш! Даруй нам отраду глаз в наших супругах и потомках." }, source: { tr: "Furkân, 74", en: "Al-Furqan, 74", ar: "الفرقان، ٧٤" } },
        { text: { tr: "Elbette zorluğun yanında bir kolaylık vardır. Gerçekten, zorlukla beraber bir kolaylık daha vardır.", en: "For indeed, with hardship will be ease. Indeed, with hardship will be ease.", ar: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا. إِنَّ مَعَ الْعُسْرِ يُسْرًا.", de: "Denn wahrlich, mit der Erschwernis kommt Erleichterung. Gewiss, mit der Erschwernis kommt Erleichterung.", az: "Əlbəttə, çətinliyin yanında asanlıq vardır. Həqiqətən, çətinliklə bərabər bir asanlıq daha vardır.", es: "Pues ciertamente con la dificultad viene la facilidad. En verdad, con la dificultad viene la facilidad.", fr: "Car avec la difficulté vient la facilité. Oui, avec la difficulté vient la facilité.", id: "Karena sesungguhnya sesudah kesulitan itu ada kemudahan. Sesungguhnya sesudah kesulitan itu ada kemudahan.", nl: "Want met de moeilijkheid komt het gemak. Voorwaar, met de moeilijkheid komt het gemak.", ru: "Поистине, за трудностью приходит облегчение. Воистину, за трудностью приходит облегчение." }, source: { tr: "İnşirah, 5-6", en: "Ash-Sharh, 5-6", ar: "الشرح، ٥-٦" } },
        { text: { tr: "Kalpler ancak Allah'ı anmakla huzur bulur.", en: "Verily, in the remembrance of Allah do hearts find rest.", ar: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ.", de: "Wahrlich, im Gedenken Allahs finden die Herzen Ruhe.", az: "Qəlblər ancaq Allahı zikr etməklə huzur tapır.", es: "En verdad, en el recuerdo de Allah encuentran sosiego los corazones.", fr: "C'est par le rappel d'Allah que les cœurs se tranquillisent.", id: "Ketahuilah, hanya dengan mengingat Allah hati menjadi tenteram.", nl: "Voorwaar, door het gedenken van Allah vinden de harten rust.", ru: "Поистине, поминанием Аллаха успокаиваются сердца." }, source: { tr: "Ra'd, 28", en: "Ar-Ra'd, 28", ar: "الرعد، ٢٨" } },
        { text: { tr: "Rabbin seni terk etmedi ve sana darılmadı.", en: "Your Lord has not forsaken you, nor has He become displeased.", ar: "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ.", de: "Dein Herr hat dich weder verlassen noch verschmäht.", az: "Rəbbin səni tərk etmədi və sənə qəzəblənmədi.", es: "Tu Señor no te ha abandonado ni se ha disgustado contigo.", fr: "Ton Seigneur ne t'a ni abandonné ni détesté.", id: "Tuhanmu tidak meninggalkanmu dan tidak pula membencimu.", nl: "Je Heer heeft je niet verlaten en Hij is niet ontevreden over je.", ru: "Твой Господь не покинул тебя и не возненавидел." }, source: { tr: "Duhâ, 3", en: "Ad-Duha, 3", ar: "الضحى، ٣" } },
        { text: { tr: "Sabret! Senin sabrın ancak Allah'ın yardımı iledir.", en: "Be patient, for your patience is only through Allah.", ar: "وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ.", de: "Sei geduldig, denn deine Geduld ist nur durch Allah.", az: "Səbr et! Sənin səbrin ancaq Allahın köməyi ilədir.", es: "Ten paciencia, pues tu paciencia solo es posible con la ayuda de Allah.", fr: "Sois patient, car ta patience n'est possible qu'avec l'aide d'Allah.", id: "Bersabarlah, dan kesabaranmu itu hanya dengan pertolongan Allah.", nl: "Wees geduldig, want je geduld is slechts door Allah.", ru: "Терпи, ведь твоё терпение — только от Аллаха." }, source: { tr: "Nahl, 127", en: "An-Nahl, 127", ar: "النحل، ١٢٧" } },
        { text: { tr: "İnsan için ancak çalıştığının karşılığı vardır.", en: "And that there is not for man except that for which he strives.", ar: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ.", de: "Und dass dem Menschen nur das zusteht, worum er sich bemüht.", az: "İnsan üçün ancaq çalışdığının qarşılığı vardır.", es: "Y que el hombre solo obtendrá lo que se esfuerce por conseguir.", fr: "Et que l'homme n'obtient que le fruit de ses efforts.", id: "Dan bahwasanya seorang manusia tiada memperoleh selain apa yang telah diusahakannya.", nl: "En dat de mens slechts krijgt waarvoor hij zich inspant.", ru: "И что человеку уготовано лишь то, к чему он стремился." }, source: { tr: "Necm, 39", en: "An-Najm, 39", ar: "النجم، ٣٩" } },
        { text: { tr: "Allah, hiç kimseye gücünün yettiğinden fazlasını yüklemez.", en: "Allah does not burden a soul beyond that it can bear.", ar: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا.", de: "Allah erlegt keiner Seele mehr auf, als sie zu tragen vermag.", az: "Allah heç kimə gücünün çatdığından artığını yükləməz.", es: "Allah no impone a nadie una carga superior a sus fuerzas.", fr: "Allah n'impose à aucune âme une charge supérieure à sa capacité.", id: "Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.", nl: "Allah belast niemand boven zijn vermogen.", ru: "Аллах не возлагает на душу сверх её возможностей." }, source: { tr: "Bakara, 286", en: "Al-Baqarah, 286", ar: "البقرة، ٢٨٦" } }
    ];

    // Initial Shuffle on Mount & Check Storage
    useEffect(() => {
        // 1. Check Storage
        const todayKey = getMurakabeKey();

        const stored = localStorage.getItem(todayKey);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                if (data.completed) {
                    setIsCompleted(true);
                    setSavedScore(data.score);
                }
            } catch (e) {
                console.error("Storage parse error", e);
            }
        }

        // 2. Shuffle array using Fisher-Yates
        const shuffled = [...QUESTION_POOL];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // Select first 7
        setQuestions(shuffled.slice(0, 7));

        // Select random gift ayah
        const randomIndex = Math.floor(Math.random() * giftAyahs.length);
        setSelectedAyah(giftAyahs[randomIndex]);

        // 3. Calculate streak
        calculateStreak();
    }, []);

    const calculateStreak = useCallback(() => {
        const today = getAppDate();
        let currentStreak = 0;

        // Check if today is completed
        const todayKey = getMurakabeKey();
        const todayData = localStorage.getItem(todayKey);
        let todayCompleted = false;
        if (todayData) {
            try {
                todayCompleted = JSON.parse(todayData).completed;
            } catch (e) { /* ignore */ }
        }

        // Count backwards from yesterday (or today if completed)
        const startDate = new Date(today);
        if (todayCompleted) {
            currentStreak = 1;
        } else {
            startDate.setDate(startDate.getDate() - 1);
        }

        // Go backwards to count streak
        const checkDate = new Date(todayCompleted ? today : startDate);
        if (!todayCompleted) {
            const prevKey = `divine_companionship_murakabe_${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`;
            const prevData = localStorage.getItem(prevKey);
            if (prevData) {
                try {
                    if (JSON.parse(prevData).completed) currentStreak = 1;
                } catch (e) { /* ignore */ }
            }
        }

        if (currentStreak > 0) {
            let d = new Date(todayCompleted ? today : checkDate);
            d.setDate(d.getDate() - 1);
            for (let i = 0; i < 365; i++) {
                const key = `divine_companionship_murakabe_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        if (JSON.parse(data).completed) {
                            currentStreak++;
                            d.setDate(d.getDate() - 1);
                            continue;
                        }
                    } catch (e) { /* ignore */ }
                }
                break;
            }
        }

        setStreak(currentStreak);

        // Best streak
        const storedBest = parseInt(localStorage.getItem('murakabe_best_streak') || '0', 10);
        const newBest = Math.max(storedBest, currentStreak);
        if (newBest > storedBest) {
            localStorage.setItem('murakabe_best_streak', newBest.toString());
        }
        setBestStreak(newBest);

        // Weekly calendar (last 7 days)
        const days = [];
        const dayNames = {
            tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
            en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            ar: ['اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت', 'أحد'],
            az: ['B.e', 'Ç.a', 'Çər', 'C.a', 'Cüm', 'Ş', 'B'],
            de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
            fr: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
            es: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            id: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
            nl: ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'],
            ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
        };
        const names = dayNames[currentLang] || dayNames.tr;
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = `divine_companionship_murakabe_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
            const data = localStorage.getItem(key);
            let completed = false;
            if (data) {
                try { completed = JSON.parse(data).completed; } catch (e) { /* ignore */ }
            }
            const dayIndex = (d.getDay() + 6) % 7; // Monday = 0
            days.push({
                name: names[dayIndex],
                completed,
                isToday: i === 0,
            });
        }
        setWeeklyDays(days);
    }, [currentLang]);

    // Safety: only access current question if not completed and index is valid
    const currentQuestion = !isCompleted && questions.length > 0 && currentIndex < questions.length
        ? questions[currentIndex]
        : null;

    // Only calculate progress if questions are loaded
    const progress = questions.length > 0
        ? ((currentIndex) / questions.length) * 100
        : 0;

    const handleAnswer = useCallback((answer) => {
        // Block clicks if animating, completed, or no question
        if (isAnimating || isCompleted || !currentQuestion) return;

        setIsAnimating(true);
        heavy();

        // Store answer
        const newAnswers = { ...answers, [currentQuestion.id]: answer };
        setAnswers(newAnswers);

        // Determine direction for exit animation
        setDirection(answer ? 1 : -1);

        // Move to next question or complete
        if (currentIndex < questions.length - 1) {
            // Premium gate: only first question is free
            if (currentIndex >= 1 && !isPremium()) {
                setIsAnimating(false);
                navigate('/premium');
                return;
            }
            if (currentIndex === 0 && !isPremium()) {
                // Answered first question, redirect before showing second
                setTimeout(() => {
                    setIsAnimating(false);
                    navigate('/premium');
                }, 350);
            } else {
                setTimeout(() => {
                    setCurrentIndex(prev => prev + 1);
                    setIsAnimating(false);
                }, 350);
            }
        } else {
            // Save to storage
            const todayKey = getMurakabeKey();

            const finalScore = Object.entries(newAnswers).filter(([id, ans]) => {
                const q = questions.find(q => q.id === parseInt(id));
                // Safety check
                if (!q) return false;
                return (q.type === 'positive' && ans === true) || (q.type === 'negative' && ans === false);
            }).length;

            localStorage.setItem(todayKey, JSON.stringify({ completed: true, score: finalScore }));

            setTimeout(() => {
                setIsCompleted(true);
                setIsAnimating(false);
                success();
                // Recalculate streak after completion
                setTimeout(() => calculateStreak(), 100);
            }, 400);
        }
    }, [currentIndex, currentQuestion, heavy, success, isAnimating, isCompleted, questions, answers]);

    // Calculate summary stats
    const positiveCount = savedScore !== null
        ? savedScore
        : Object.entries(answers).filter(([id, ans]) => {
            const q = questions.find(q => q.id === parseInt(id));
            if (!q) return false;
            // For positive questions, "yes" is good. For negative, "no" is good.
            return (q.type === 'positive' && ans === true) || (q.type === 'negative' && ans === false);
        }).length;

    return (
        <div className="min-h-[60vh] sm:min-h-[70vh] relative overflow-hidden rounded-b-3xl bg-gradient-to-b from-[#F6F0E1] via-[#EFE8D6] to-[#EAE1CB] dark:from-transparent dark:via-transparent dark:to-transparent"
            style={{
                '--murakabe-dark-bg': 'linear-gradient(180deg, #021a0f 0%, #032e18 25%, #064e3b 50%, #043927 75%, #021a0f 100%)'
            }}
        >
            {/* Dark mode background overlay */}
            <div className="absolute inset-0 hidden dark:block" style={{ background: 'linear-gradient(180deg, #021a0f 0%, #032e18 25%, #064e3b 50%, #043927 75%, #021a0f 100%)' }} />
            {/* Layered Ambient Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-islamic-gold/[0.08] dark:bg-islamic-gold/[0.04] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-primary/[0.06] dark:bg-emerald-500/[0.06] rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-0 w-[250px] h-[250px] bg-islamic-gold/[0.06] dark:bg-islamic-gold/[0.03] rounded-full blur-[80px] pointer-events-none" />

            {/* Floating Particles */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-islamic-gold/20 dark:bg-islamic-gold/30"
                    style={{
                        left: `${15 + i * 15}%`,
                        top: `${20 + (i % 3) * 25}%`,
                    }}
                    animate={{
                        y: [0, -20, 0],
                        opacity: [0.2, 0.6, 0.2],
                        scale: [1, 1.5, 1],
                    }}
                    transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.7,
                    }}
                />
            ))}

            {/* Islamic Geometric Pattern Overlay */}
            <div
                className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4AF37' stroke-width='0.5'%3E%3Ccircle cx='40' cy='40' r='20'/%3E%3Ccircle cx='40' cy='40' r='30'/%3E%3Cpath d='M40 10 L40 70 M10 40 L70 40 M18 18 L62 62 M62 18 L18 62'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '80px 80px'
                }}
            />

            {/* Header */}
            <header className="relative z-10 text-center pt-4 sm:pt-8 pb-3 sm:pb-5">
                {/* Decorative Flourish */}
                <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/30 dark:to-islamic-gold/40" />
                    <div className="w-2 h-2 rounded-full bg-primary/40 dark:bg-islamic-gold/50 shadow-[0_0_8px_rgba(217,119,6,0.2)] dark:shadow-[0_0_8px_rgba(212,175,55,0.3)]" />
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/30 dark:to-islamic-gold/40" />
                </div>

                <h1 className="text-2xl font-serif font-bold text-primary dark:text-islamic-gold tracking-wider dark:drop-shadow-[0_0_12px_rgba(212,175,55,0.2)]">
                    {t('title')}
                </h1>

                {!isCompleted && questions.length > 0 && (
                    <motion.p
                        key={currentIndex}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-primary/50 dark:text-islamic-gold/50 mt-2 font-medium tracking-widest"
                    >
                        {currentIndex + 1} / {questions.length}
                    </motion.p>
                )}
            </header>

            {/* Progress Bar */}
            {!isCompleted && (
                <div className="relative z-10 h-1.5 bg-primary/[0.08] dark:bg-white/[0.04] mx-8 rounded-full overflow-hidden border border-primary/[0.08] dark:border-white/[0.03]">
                    <motion.div
                        className="h-full rounded-full"
                        style={{
                            background: 'linear-gradient(90deg, rgba(212,175,55,0.6) 0%, #D4AF37 100%)',
                            boxShadow: '0 0 12px rgba(212,175,55,0.4), 0 0 4px rgba(212,175,55,0.6)'
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                </div>
            )}

            {/* Premium Notice for non-premium users */}
            {!isCompleted && !isPremium() && (
                <motion.div
                    className="relative z-10 mx-8 mt-4"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-islamic-gold/[0.12] dark:bg-islamic-gold/[0.08] border border-islamic-gold/20 dark:border-islamic-gold/15">
                        <Crown size={13} className="text-islamic-gold" fill="currentColor" />
                        <span className="text-[11px] text-islamic-gold/80 font-medium tracking-wide">
                            {t('premiumNotice', 'Devam etmek için Premium gerekli')}
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-8">
                <AnimatePresence mode="wait" custom={direction}>
                    {!isCompleted && currentQuestion ? (
                        <motion.div
                            key={currentQuestion.id}
                            custom={direction}
                            variants={cardVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="w-full max-w-sm"
                        >
                            {/* The Card */}
                            <div
                                className="relative rounded-[2.5rem] p-5 sm:p-7 shadow-2xl shadow-primary/10 dark:shadow-black/40 overflow-hidden border border-primary/10 dark:border-islamic-gold/[0.08] bg-white/80 dark:bg-[#043927]"
                                style={{
                                    backdropFilter: 'blur(20px)',
                                }}
                            >
                                {/* Card Inner Glow */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-islamic-gold/[0.04] dark:bg-islamic-gold/[0.06] rounded-full blur-[60px] pointer-events-none" />
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-primary/[0.04] dark:bg-emerald-400/[0.04] rounded-full blur-[40px] pointer-events-none" />

                                {/* Gold Corner Accents */}
                                <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-primary/15 dark:border-islamic-gold/20 rounded-tl-xl" />
                                <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-primary/15 dark:border-islamic-gold/20 rounded-tr-xl" />
                                <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-primary/15 dark:border-islamic-gold/20 rounded-bl-xl" />
                                <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-primary/15 dark:border-islamic-gold/20 rounded-br-xl" />

                                {/* Icon */}
                                <div className="relative flex justify-center mb-4 sm:mb-6">
                                    <motion.div
                                        className="p-4 rounded-2xl border border-primary/15 dark:border-islamic-gold/20 relative bg-primary/5 dark:bg-transparent"
                                        style={{
                                            boxShadow: '0 0 20px rgba(217,119,6,0.05), inset 0 1px 0 rgba(217,119,6,0.05)'
                                        }}
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <currentQuestion.icon
                                            className="w-8 h-8 text-primary dark:text-islamic-gold dark:drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]"
                                            strokeWidth={1.5}
                                        />
                                    </motion.div>
                                </div>

                                {/* Question */}
                                <h2 className="text-xl font-serif text-foreground/90 dark:text-amber-50/90 text-center leading-relaxed min-h-[80px] flex items-center justify-center px-2 relative z-10">
                                    {typeof currentQuestion.text === 'object' ? currentQuestion.text[currentLang] : currentQuestion.text}
                                </h2>

                                {/* Decorative Line */}
                                <div className="flex items-center justify-center gap-3 mt-6 relative z-10">
                                    <div className="h-px w-10 bg-gradient-to-r from-transparent to-primary/20 dark:to-islamic-gold/30" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30 dark:bg-islamic-gold/40" />
                                    <div className="h-px w-10 bg-gradient-to-l from-transparent to-primary/20 dark:to-islamic-gold/30" />
                                </div>
                            </div>

                            {/* Answer Buttons */}
                            <div className="flex gap-3 mt-6">
                                <Button
                                    onClick={() => handleAnswer(false)}
                                    className={cn(
                                        "flex-1 h-14 rounded-2xl font-semibold text-base transition-all active:scale-95",
                                        "bg-muted/60 dark:bg-white/[0.04] border border-border dark:border-white/10 text-muted-foreground dark:text-white/70 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 dark:hover:text-red-300"
                                    )}
                                >
                                    <X className="w-5 h-5 mr-2" />
                                    {t('no')}
                                </Button>
                                <Button
                                    onClick={() => handleAnswer(true)}
                                    className={cn(
                                        "flex-1 h-14 rounded-2xl font-semibold text-base transition-all active:scale-95",
                                        "bg-gradient-to-r from-islamic-gold to-amber-500 text-emerald-950 hover:from-islamic-gold/90 hover:to-amber-500/90 shadow-lg shadow-islamic-gold/25"
                                    )}
                                    style={{ boxShadow: '0 4px 20px rgba(212,175,55,0.25), 0 0 0 1px rgba(212,175,55,0.1)' }}
                                >
                                    <Check className="w-5 h-5 mr-2" />
                                    {t('yes')}
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        /* Premium Completion Screen - "Seal of Light" */
                        <motion.div
                            key="completion"
                            initial="hidden"
                            animate="visible"
                            className="w-full max-w-sm text-center py-8"
                        >
                            {/* Breathing Light Circle */}
                            <motion.div
                                className="flex justify-center mb-10"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                            >
                                <div className="relative">
                                    {/* Outer Glow Rings */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-yellow-600/30 rounded-full blur-3xl"
                                        animate={{
                                            scale: [1, 1.3, 1],
                                            opacity: [0.5, 0.8, 0.5]
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        style={{ width: '200px', height: '200px', margin: '-30px' }}
                                    />
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-br from-amber-300/20 to-yellow-500/20 rounded-full blur-2xl"
                                        animate={{
                                            scale: [1.1, 1.4, 1.1],
                                            opacity: [0.3, 0.6, 0.3]
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: 0.5
                                        }}
                                        style={{ width: '180px', height: '180px', margin: '-20px' }}
                                    />

                                    {/* Main Breathing Circle */}
                                    <motion.div
                                        className="relative w-32 h-32 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 shadow-2xl shadow-amber-500/50 flex items-center justify-center"
                                        animate={{
                                            scale: [1, 1.08, 1],
                                            boxShadow: [
                                                '0 0 40px rgba(251, 191, 36, 0.5)',
                                                '0 0 80px rgba(251, 191, 36, 0.7)',
                                                '0 0 40px rgba(251, 191, 36, 0.5)'
                                            ]
                                        }}
                                        transition={{
                                            duration: 2.5,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    >
                                        {/* Inner Icon */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.5, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                                        >
                                            <Check className="w-14 h-14 text-white drop-shadow-lg" strokeWidth={2.5} />
                                        </motion.div>
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Title - Staggered */}
                            <motion.h2
                                className="text-4xl font-serif text-primary dark:text-islamic-gold mb-4 tracking-wide dark:drop-shadow-[0_0_16px_rgba(212,175,55,0.3)]"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.6 }}
                            >
                                {t('elhamdulillah')}
                            </motion.h2>

                            {/* Spiritual Message - Staggered */}
                            <motion.p
                                className="text-lg text-foreground/70 dark:text-emerald-100/80 font-light mb-10 leading-relaxed px-4 text-center"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.9, duration: 0.6 }}
                            >
                                {t('completionMsg')}
                            </motion.p>

                            {/* Daily Destiny (Ayah) Card */}
                            {selectedAyah && (
                                <motion.div
                                    className="relative rounded-3xl p-6 mb-8 mx-4 overflow-hidden border border-primary/10 dark:border-islamic-gold/15 bg-white/60 dark:bg-[#032e18]"
                                    style={{
                                        backdropFilter: 'blur(12px)',
                                    }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.2, duration: 0.6 }}
                                >
                                    <p className="text-sm text-primary/60 dark:text-islamic-gold/70 italic text-center mb-3 tracking-wide relative z-10">
                                        {t('yourShare')}
                                    </p>

                                    {/* Decorative Line */}
                                    <div className="flex items-center justify-center gap-3 mb-4 relative z-10">
                                        <div className="h-px w-10 bg-primary/20 dark:bg-islamic-gold/30" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/30 dark:bg-islamic-gold/50" />
                                        <div className="h-px w-10 bg-primary/20 dark:bg-islamic-gold/30" />
                                    </div>

                                    {/* Ayah Text */}
                                    <p className="text-lg font-serif text-foreground/80 dark:text-amber-100 text-center leading-relaxed mb-4 relative z-10">
                                        "{typeof selectedAyah.text === 'object' ? (selectedAyah.text[currentLang] || selectedAyah.text.en || selectedAyah.text.tr) : selectedAyah.text}"
                                    </p>

                                    {/* Reference */}
                                    <p className="text-xs text-muted-foreground dark:text-white/40 text-center tracking-wider relative z-10">
                                        — {typeof selectedAyah.source === 'object' ? (selectedAyah.source[currentLang] || selectedAyah.source.en || selectedAyah.source.tr) : selectedAyah.source}
                                    </p>
                                </motion.div>
                            )}

                            {/* ── Streak Section ── */}
                            <motion.div
                                className="relative rounded-3xl p-5 mb-6 mx-2 overflow-hidden border border-primary/10 dark:border-islamic-gold/10 bg-white/60 dark:bg-[#043927]"
                                style={{
                                    backdropFilter: 'blur(12px)',
                                }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5, duration: 0.6 }}
                            >
                                {/* Streak Counter */}
                                <div className="flex items-center justify-center gap-4 mb-5">
                                    {/* Fire Icon */}
                                    <motion.div
                                        className="relative"
                                        animate={{
                                            scale: streak > 0 ? [1, 1.15, 1] : 1,
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: streak > 0 ? Infinity : 0,
                                            ease: "easeInOut"
                                        }}
                                    >
                                        {/* Glow behind flame */}
                                        {streak > 0 && (
                                            <motion.div
                                                className="absolute inset-0 bg-orange-500/30 rounded-full blur-xl"
                                                animate={{
                                                    opacity: [0.3, 0.7, 0.3],
                                                    scale: [1, 1.4, 1],
                                                }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                style={{ width: '60px', height: '60px', margin: '-10px' }}
                                            />
                                        )}
                                        <div className={cn(
                                            "relative p-3 rounded-2xl border",
                                            streak > 0
                                                ? "bg-gradient-to-br from-orange-500/20 to-red-500/10 border-orange-500/25"
                                                : "bg-white/5 border-white/10"
                                        )}>
                                            <Flame
                                                size={28}
                                                className={streak > 0 ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" : "text-white/30"}
                                                fill={streak > 0 ? "currentColor" : "none"}
                                            />
                                        </div>
                                    </motion.div>

                                    {/* Streak Number */}
                                    <div className="text-center">
                                        <motion.div
                                            className="text-5xl font-black text-transparent bg-clip-text"
                                            style={{
                                                backgroundImage: streak > 0
                                                    ? 'linear-gradient(135deg, #f59e0b, #ef4444, #f59e0b)'
                                                    : 'linear-gradient(135deg, #6b7280, #9ca3af)',
                                                backgroundSize: '200% 200%',
                                            }}
                                            animate={streak > 0 ? {
                                                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                                            } : {}}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        >
                                            {streak}
                                        </motion.div>
                                        <p className="text-xs text-muted-foreground dark:text-white/40 font-medium tracking-wider mt-0.5 uppercase">
                                            {t('streakDays', 'Gün Serisi')}
                                        </p>
                                    </div>

                                    {/* Best Streak Badge */}
                                    {bestStreak > 0 && (
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-islamic-gold/10 border border-islamic-gold/15">
                                                <Trophy size={12} className="text-islamic-gold" />
                                                <span className="text-sm font-bold text-islamic-gold">{bestStreak}</span>
                                            </div>
                                            <p className="text-[9px] text-muted-foreground/60 dark:text-white/30 mt-1 uppercase tracking-wider">
                                                {t('bestStreak', 'En İyi')}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Weekly Calendar */}
                                <div className="flex items-center justify-between gap-1 px-1">
                                    {weeklyDays.map((day, i) => (
                                        <motion.div
                                            key={i}
                                            className="flex flex-col items-center gap-1.5 flex-1"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 1.7 + i * 0.08 }}
                                        >
                                            <span className={cn(
                                                "text-[10px] font-medium tracking-wide",
                                                day.isToday ? "text-primary dark:text-islamic-gold" : "text-muted-foreground/50 dark:text-white/30"
                                            )}>
                                                {day.name}
                                            </span>
                                            <div className={cn(
                                                "w-8 h-8 rounded-xl flex items-center justify-center transition-all border",
                                                day.completed
                                                    ? "bg-gradient-to-br from-amber-500/20 dark:from-emerald-500/30 to-amber-600/10 dark:to-emerald-600/20 border-amber-500/20 dark:border-emerald-500/30"
                                                    : day.isToday
                                                        ? "bg-primary/10 dark:bg-islamic-gold/10 border-primary/25 dark:border-islamic-gold/25 border-dashed"
                                                        : "bg-muted/40 dark:bg-white/[0.03] border-border/50 dark:border-white/[0.06]"
                                            )}>
                                                {day.completed ? (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 1.8 + i * 0.08 }}
                                                    >
                                                        <Check size={14} className="text-amber-600 dark:text-emerald-400" strokeWidth={3} />
                                                    </motion.div>
                                                ) : day.isToday ? (
                                                    <div className="w-2 h-2 rounded-full bg-primary/40 dark:bg-islamic-gold/50" />
                                                ) : (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20 dark:bg-white/10" />
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Motivational Message */}
                                <motion.p
                                    className="text-center text-xs text-muted-foreground dark:text-white/40 mt-4 italic"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 2.3 }}
                                >
                                    {streak === 0 && t('streakMsg0', 'Yarın tekrar gel, seri başlat! 🌱')}
                                    {streak === 1 && t('streakMsg1', 'İlk adım atıldı! Devam et! 🌿')}
                                    {streak >= 2 && streak <= 4 && t('streakMsg2', 'Harika gidiyorsun! Bırakma! 🔥')}
                                    {streak >= 5 && streak <= 9 && t('streakMsg5', 'Muhteşem! Alışkanlık oluşuyor! ⭐')}
                                    {streak >= 10 && streak <= 29 && t('streakMsg10', 'Mükemmel disiplin! İlham veriyorsun! 💎')}
                                    {streak >= 30 && t('streakMsg30', 'Efsanevi seri! Tebrikler! 🏆')}
                                </motion.p>
                            </motion.div>

                            {/* Home Button - Staggered */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 2.5, duration: 0.6 }}
                            >
                                <Button
                                    onClick={() => navigate('/')}
                                    className="w-full h-14 rounded-2xl font-semibold text-base bg-muted/60 dark:bg-white/[0.06] border border-border dark:border-white/10 text-foreground dark:text-white hover:bg-muted dark:hover:bg-white/10 backdrop-blur-md transition-all active:scale-95"
                                >
                                    <Home className="w-4 h-4 mr-2" />
                                    {t('goHome')}
                                </Button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#EAE1CB] dark:from-[#021a0f] to-transparent pointer-events-none" />
        </div>
    );
}
