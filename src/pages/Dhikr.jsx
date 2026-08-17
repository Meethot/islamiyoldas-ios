import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Volume2, Volume1, Volume, VolumeX, Smartphone, Settings, Heart, Star, Sparkles, Edit3, X, Check, Trash2, ChevronLeft, Crown, ChevronDown, Fingerprint, Sliders, Palette } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHaptics } from '../hooks/useMobile';
import { triggerReviewPrompt } from '@/components/ReviewPrompt';
import { useTranslation } from 'react-i18next';
import { DAILY_DHIKR_LIMIT } from '@/lib/limits';
import { isPremium } from '@/services/creditService';
import { getAppDate } from '@/lib/testDate';
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { analytics } from '@/services/analyticsService';
import { Preferences } from '@capacitor/preferences';
import DhikrPickerSheet from '@/components/DhikrPickerSheet';
import { ESMA_UL_HUSNA } from '@/data/esmaUlHusna';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { VolumeButtons } from '@capacitor-community/volume-buttons';

// Tasbih theme bead materials — layered CSS gradients (base stone + veins/grain)
// so each material reads as a real texture (amber glow, wood grain, turquoise
// matrix, marble veins), not just a recolor. `gloss` drives the specular highlight.
const TASBIH_MATERIALS = {
    kehribar: {
        name: 'Kehribar',
        base: 'radial-gradient(circle at 32% 28%, #ffe6a1 0%, #f3ae2e 28%, #cf7410 56%, #8a4407 82%, #421c02 100%)',
        veins: 'radial-gradient(ellipse 55% 16% at 60% 56%, rgba(120,53,15,0.32), transparent 70%), radial-gradient(ellipse 40% 11% at 32% 72%, rgba(146,64,14,0.26), transparent 70%), radial-gradient(circle at 52% 64%, rgba(255,178,48,0.4), transparent 55%)',
        shadow: '0 5px 9px rgba(0,0,0,0.5), 0 0 16px rgba(245,158,11,0.35)',
        gloss: 0.95
    },
    kuka: {
        name: 'Kuka',
        base: 'radial-gradient(circle at 32% 28%, #b3773c 0%, #7a4514 42%, #47230a 76%, #241001 100%)',
        veins: 'repeating-radial-gradient(circle at 58% 52%, rgba(43,19,1,0) 0px, rgba(43,19,1,0.22) 2px, rgba(122,69,20,0) 4px, rgba(43,19,1,0) 7px), linear-gradient(80deg, transparent 44%, rgba(43,19,1,0.2) 46%, transparent 48%)',
        shadow: '0 5px 9px rgba(0,0,0,0.55), 0 0 10px rgba(92,49,12,0.35)',
        gloss: 0.45
    },
    turkuaz: {
        name: 'Turkuaz',
        base: 'radial-gradient(circle at 32% 28%, #8ceade 0%, #2fb9ac 34%, #10796f 68%, #053f3a 100%)',
        veins: 'linear-gradient(115deg, transparent 42%, rgba(40,30,20,0.32) 43.5%, transparent 45%), linear-gradient(28deg, transparent 60%, rgba(40,30,20,0.26) 61.5%, transparent 63%), linear-gradient(-50deg, transparent 30%, rgba(30,22,15,0.3) 31.2%, transparent 32.6%)',
        shadow: '0 5px 9px rgba(0,0,0,0.5), 0 0 12px rgba(13,148,136,0.35)',
        gloss: 0.8
    },
    zumrut: {
        name: 'Zümrüt',
        base: 'radial-gradient(circle at 32% 28%, #8df4bd 0%, #10a35c 34%, #05643a 68%, #02311c 100%)',
        veins: 'linear-gradient(105deg, transparent 38%, rgba(220,255,235,0.26) 39.5%, transparent 41%), linear-gradient(-35deg, transparent 55%, rgba(200,255,225,0.18) 56.2%, transparent 57.8%), linear-gradient(160deg, transparent 68%, rgba(3,58,32,0.35) 70%, transparent 72%)',
        shadow: '0 5px 9px rgba(0,0,0,0.5), 0 0 14px rgba(16,185,129,0.4)',
        gloss: 0.9
    }
};

const DHIKR_PRESETS = [
    { id: 'subhanallah', name: 'Sübhanallah', arabic: 'سُبْحَانَ اللَّهِ', meaning: 'Allah noksan sıfatlardan uzaktır', defaultTarget: 33 },
    { id: 'elhamdulillah', name: 'Elhamdülillah', arabic: 'الْحَمْدُ لِلَّهِ', meaning: 'Hamd (şükür) Allah\'adır', defaultTarget: 33 },
    { id: 'allahuekber', name: 'Allahü Ekber', arabic: 'اللَّهُ أَكْبَرُ', meaning: 'Allah en büyüktür', defaultTarget: 33 },
    { id: 'last', name: 'Lâ ilâhe illallah', arabic: 'لَا إِلٰهَ إِلَّا اللّٰه', meaning: 'Allah\'tan başka ilah yoktur', defaultTarget: 100 },
    { id: 'istigfar', name: 'Estağfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', meaning: 'Allah\'tan bağışlanma dilerim', defaultTarget: 100 },
    { id: 'salavat', name: 'Salavat', arabic: 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ', meaning: 'Allah\'ım, Efendimiz Muhammed\'e rahmet et', defaultTarget: 100 },
    { id: 'ihlas', name: 'İhlas Suresi', arabic: 'سُورَةُ الإِخْلَاصِ', meaning: 'O tektir, Samed\'dir, doğurmamış ve doğurulmamıştır.', defaultTarget: 100 },
    { id: 'fatiha', name: 'Fatiha Suresi', arabic: 'سُورَةُ الْفَاتِحَةِ', meaning: 'Hamd, âlemlerin Rabbi olan Allah\'a mahsustur.', defaultTarget: 100 },
    { id: 'ayetel_kursi', name: 'Ayetel Kürsi', arabic: 'آيَةُ الْكُرْسِيِّ', meaning: 'Allah, O\'ndan başka ilah yoktur. Diridir, Kayyum\'dur.', defaultTarget: 100 },
    { id: 'hasbunallah', name: 'Hasbünallahü ve Ni\'mel Vekîl', arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', meaning: 'Allah bize yeter, O ne güzel vekildir.', defaultTarget: 100 },
    { id: 'lahavle', name: 'Lâ Havle ve Lâ Kuvvete illâ Billâh', arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', meaning: 'Güç ve kuvvet ancak Allah\'a mahsustur.', defaultTarget: 100 },
    { id: 'yunus_duasi', name: 'Dua-i Yunus', arabic: 'لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', meaning: 'Senden başka ilah yoktur, seni tenzih ederim.', defaultTarget: 100 },
    { id: 'salati_tefriciye', name: 'Salat-ı Tefriciye', arabic: 'الصَّلَاةُ التَّفْرِيجِيَّةُ', meaning: 'Tüm sıkıntıların giderilmesi, dileklerin kabulü için.', defaultTarget: 4444 },
    { id: 'kelime_i_tevhid', name: 'Kelime-i Tevhid', arabic: 'لَا إِلٰهَ إِلَّا اللَّهُ مُحَمَّدٌ رَسُولُ اللَّهِ', meaning: 'Allah\'tan başka ilah yoktur, Muhammed O\'nun elçisidir.', defaultTarget: 100 },
    { id: 'kelime_i_sehadet', name: 'Kelime-i Şehadet', arabic: 'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ', meaning: 'Şahitlik ederim ki Allah\'tan başka ilah yoktur ve Muhammed O\'nun kulu ve elçisidir.', defaultTarget: 33 },
    { id: 'besmele', name: 'Besmele', arabic: 'بِسْمِ اللَّهِ الرَّحْمٰنِ الرَّحِيمِ', meaning: 'Rahman ve Rahim olan Allah\'ın adıyla.', defaultTarget: 100 },
    { id: 'subhanallahi_ve_bihamdihi', name: 'Sübhanallahi ve Bihamdihî', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', meaning: 'Allah\'ı hamd ile tesbih ederim.', defaultTarget: 100 },
    { id: 'subhanallahi_velazim', name: 'Sübhanallahi ve Bihamdihî Sübhanallahil-Azîm', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ', meaning: 'Dile hafif, mizanda ağır iki cümle.', defaultTarget: 100 },
    { id: 'bakiyat_salihat', name: 'Sübhanallahi velhamdülillahi ve lâ ilâhe illallahü vallahü ekber', arabic: 'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلٰهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ', meaning: 'En kalıcı güzel ameller: tesbih, hamd, tevhid ve tekbir.', defaultTarget: 100 },
    { id: 'tevhid_zikri', name: 'Lâ ilâhe illallahü vahdehû lâ şerîke leh', arabic: 'لَا إِلٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', meaning: 'Allah birdir, ortağı yoktur; mülk O\'nun, hamd O\'nadır; O her şeye kadirdir.', defaultTarget: 100 },
    { id: 'seyyidul_istigfar', name: 'Seyyidü\'l-İstiğfar', arabic: 'سَيِّدُ الِاسْتِغْفَارِ', meaning: 'İstiğfar dualarının en üstünü — sabah akşam okunur.', defaultTarget: 1 },
    { id: 'hasbiyallah', name: 'Hasbiyallahü lâ ilâhe illâ Hû', arabic: 'حَسْبِيَ اللَّهُ لَا إِلٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ', meaning: 'Allah bana yeter; O\'ndan başka ilah yoktur, O\'na tevekkül ettim.', defaultTarget: 7 },
    { id: 'allahumme_ecirni', name: 'Allahümme Ecirnî Minen-Nâr', arabic: 'اَللَّهُمَّ أَجِرْنِي مِنَ النَّارِ', meaning: 'Allah\'ım, beni cehennem ateşinden koru.', defaultTarget: 7 },
    { id: 'rabbena_atina', name: 'Rabbenâ Âtinâ', arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', meaning: 'Rabbimiz! Bize dünyada ve ahirette iyilik ver, bizi ateş azabından koru.', defaultTarget: 10 },
    { id: 'salaten_tuncina', name: 'Salât-ı Münciye (Tüncînâ)', arabic: 'الصَّلَاةُ الْمُنْجِيَةُ', meaning: 'Tüm tehlike ve sıkıntılardan kurtuluş için okunan salavat.', defaultTarget: 100 },
    { id: 'felak', name: 'Felak Suresi', arabic: 'سُورَةُ الْفَلَقِ', meaning: 'Yarattıklarının şerrinden sabahın Rabbine sığınırım.', defaultTarget: 100 },
    { id: 'nas', name: 'Nas Suresi', arabic: 'سُورَةُ النَّاسِ', meaning: 'İnsanların Rabbine, Melikine ve İlahına sığınırım.', defaultTarget: 100 },
    { id: 'subhane_rabbiyel_azim', name: 'Sübhâne Rabbiyel-Azîm', arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ', meaning: 'Yüce Rabbimi tenzih ederim — rükû tesbihi.', defaultTarget: 33 },
    { id: 'subhane_rabbiyel_ala', name: 'Sübhâne Rabbiyel-A\'lâ', arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى', meaning: 'En yüce Rabbimi tenzih ederim — secde tesbihi.', defaultTarget: 33 },
    { id: 'subbuhun_kuddusun', name: 'Sübbûhun Kuddûsün', arabic: 'سُبُّوحٌ قُدُّوسٌ رَبُّ الْمَلَائِكَةِ وَالرُّوحِ', meaning: 'Meleklerin ve Rûh\'un Rabbi; her noksandan münezzeh, mukaddestir.', defaultTarget: 33 },
    { id: 'rabbi_zidni_ilma', name: 'Rabbi Zidnî İlmâ', arabic: 'رَبِّ زِدْنِي عِلْمًا', meaning: 'Rabbim, ilmimi artır. (Tâhâ 114)', defaultTarget: 33 },
    { id: 'rabbisrah_li_sadri', name: 'Rabbi\'şrah lî Sadrî', arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', meaning: 'Rabbim! Göğsümü genişlet, işimi kolaylaştır. (Tâhâ 25-26)', defaultTarget: 33 },
    { id: 'rabbena_la_tuzig', name: 'Rabbenâ lâ Tüziğ Kulûbenâ', arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً', meaning: 'Rabbimiz! Bizi doğru yola ilettikten sonra kalplerimizi kaydırma. (Âl-i İmrân 8)', defaultTarget: 10 },
    { id: 'ya_hayyu_ya_kayyum', name: 'Yâ Hayyu Yâ Kayyûm', arabic: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ', meaning: 'Ey Hayy ve Kayyûm! Rahmetinle yardım diliyorum.', defaultTarget: 100 },
    { id: 'ya_erhamer_rahimin', name: 'Yâ Erhamer-Râhimîn', arabic: 'يَا أَرْحَمَ الرَّاحِمِينَ', meaning: 'Ey merhametlilerin en merhametlisi!', defaultTarget: 100 },
    { id: 'melikul_hakkul_mubin', name: 'Lâ ilâhe illallahü\'l-Melikü\'l-Hakku\'l-Mübîn', arabic: 'لَا إِلٰهَ إِلَّا اللَّهُ الْمَلِكُ الْحَقُّ الْمُبِينُ', meaning: 'Apaçık hak ve mülkün sahibi olan Allah\'tan başka ilah yoktur.', defaultTarget: 100 },
    { id: 'estagfirullah_elazim', name: 'Estağfirullahe\'l-Azîm ve Etûbü İleyh', arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلٰهَ إِلَّا هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ', meaning: 'Hayy ve Kayyûm olan yüce Allah\'tan bağışlanma diler, O\'na tövbe ederim.', defaultTarget: 100 },
    { id: 'afv_afiyet', name: 'Allahümme innî es\'elüke\'l-Afve ve\'l-Âfiye', arabic: 'اَللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ', meaning: 'Allah\'ım! Senden af ve âfiyet dilerim.', defaultTarget: 100 },
    { id: 'bismillahillezi', name: 'Bismillâhillezî lâ Yedurru', arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ', meaning: 'O\'nun adıyla; yerde ve gökte hiçbir şey zarar veremez. (sabah-akşam 3 kez)', defaultTarget: 3 },
    { id: 'euzu_bikelimatillah', name: 'Eûzü bi-Kelimâtillâh', arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', meaning: 'Yarattıklarının şerrinden Allah\'ın eksiksiz kelimelerine sığınırım.', defaultTarget: 3 },
    { id: 'radiytu_billahi', name: 'Radîtü Billâhi Rabbâ', arabic: 'رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ نَبِيًّا', meaning: 'Rab olarak Allah\'tan, din olarak İslam\'dan, peygamber olarak Muhammed\'den razıyım.', defaultTarget: 3 },
    { id: 'adede_halkihi', name: 'Sübhânallâhi ve Bihamdihî Adede Halkıhî', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ وَرِضَا نَفْسِهِ وَزِنَةَ عَرْشِهِ وَمِدَادَ كَلِمَاتِهِ', meaning: 'Yarattıkları sayısınca, zâtının rızasınca, arşının ağırlığınca Allah\'ı tesbih ederim.', defaultTarget: 3 },
    { id: 'salat_i_fetih', name: 'Salât-ı Fetih', arabic: 'صَلَاةُ الْفَاتِحِ', meaning: 'Maddî ve manevî fetihler, işlerin açılması için okunan salavat.', defaultTarget: 100 },
    { id: 'allahumme_entes_selam', name: 'Allahümme Ente\'s-Selâm', arabic: 'اَللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', meaning: 'Allah\'ım! Sen Selâm\'sın, selâmet Sendendir — namaz sonrası zikri.', defaultTarget: 1 },
];

export default function Dhikr() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation('dhikr');

    // Countdown mode from Manevi Asistan
    const navState = location.state || {};
    const isCountdownMode = navState.mode === 'countdown' && navState.targetCount > 0;
    const countdownTarget = isCountdownMode ? navState.targetCount : 0;
    const countdownName = navState.targetZikirName || '';
    const countdownArabic = navState.zikirArabic || '';
    const countdownMeaning = navState.zikirMeaning || '';

    const [count, setCount] = useState(isCountdownMode ? countdownTarget : 0);
    const [totalCount, setTotalCount] = useState(() => parseInt(localStorage.getItem('totalDhikrOverall') || '0', 10));
    const [activePreset, setActivePreset] = useState(() => {
        if (isCountdownMode) return DHIKR_PRESETS[2];
        try {
            const saved = localStorage.getItem('last_active_dhikr_preset');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.id) {
                    const standard = DHIKR_PRESETS.find(p => p.id === parsed.id);
                    if (standard) return standard;
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Failed to parse last active dhikr:', e);
        }
        return DHIKR_PRESETS[2];
    });
    const [target, setTarget] = useState(isCountdownMode ? countdownTarget : (isPremium() ? 33 : 33));
    const [showDhikrLimit, setShowDhikrLimit] = useState(false);
    const [hapticsMode, setHapticsMode] = useState(() => localStorage.getItem('dhikr_haptics_mode') || 'all');
    const [soundMode, setSoundMode] = useState(() => localStorage.getItem('dhikr_sound_mode') || 'digital'); // 'digital', 'wood', 'water', 'mute'
    const [volumeButtonsEnabled, setVolumeButtonsEnabled] = useState(() => localStorage.getItem('dhikr_volume_buttons') === 'true');
    const [dhikrTheme, setDhikrTheme] = useState(() => localStorage.getItem('dhikr_theme') || 'tasbih'); // 'tasbih', 'tally', 'classic'
    const [beadType, setBeadType] = useState(() => {
        const saved = localStorage.getItem('dhikr_bead_type') || 'kehribar';
        if (saved !== 'kehribar' && !isPremium()) {
            return 'kehribar';
        }
        return saved;
    });
    const [tallyColor, setTallyColor] = useState(() => {
        const saved = localStorage.getItem('dhikr_tally_color') || 'emerald';
        if (saved !== 'emerald' && !isPremium()) {
            return 'emerald';
        }
        return saved;
    });
    const [particles, setParticles] = useState([]);

    const beadDragY = useMotionValue(0);

    // Dynamic thread sway path mapping (bends the string reactively as you drag)
    const stringPath = useTransform(beadDragY, [-80, 80], [
        "M 160 0 Q 185 140 160 320",
        "M 160 0 Q 215 180 160 320"
    ]);

    // Tassel dynamic drag sway rotation mapping
    const tasselDragRotate = useTransform(beadDragY, [-80, 80], [-2.5, 2.5]);
    const tasselImpactRotate = useMotionValue(0);
    const tasselRotate = useTransform([tasselDragRotate, tasselImpactRotate], ([d, i]) => d + i);

    // Dynamic glare shift mapping (moves highlights opposite to drag direction)
    const glareY = useTransform(beadDragY, [-80, 80], [5, -5]);
    const glareX = useTransform(beadDragY, [-80, 80], [2, -2]);

    // Dynamic core shift mapping (moves inner features for 3D parallax depth)
    const coreY = useTransform(beadDragY, [-80, 80], [2, -2]);
    const coreX = useTransform(beadDragY, [-80, 80], [1, -1]);

    const triggerParticles = () => {
        const newParticles = Array.from({ length: 6 }).map((_, i) => ({
            id: Math.random(),
            angle: (i * 360) / 6 + Math.random() * 15,
            distance: 45 + Math.random() * 25
        }));
        setParticles(newParticles);
        setTimeout(() => setParticles([]), 480);
    };
    const [isRipple, setIsRipple] = useState(false);
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [tempTarget, setTempTarget] = useState('33');
    const [celebrating, setCelebrating] = useState(false);
    const [hapticMessage, setHapticMessage] = useState('');
    const [showTotalResetConfirm, setShowTotalResetConfirm] = useState(false);
    const [countdownCompleted, setCountdownCompleted] = useState(false);
    const [countdownRounds, setCountdownRounds] = useState(0);
    const [showDhikrPicker, setShowDhikrPicker] = useState(false);

    // Full-screen tap mode and feedback states
    const [isFullScreenTap, setIsFullScreenTap] = useState(() => localStorage.getItem('dhikr_fullscreen_tap') === 'true');
    const [isScreenFlash, setIsScreenFlash] = useState(false);
    
    // States for custom total zikir count editing
    const [showTotalModal, setShowTotalModal] = useState(false);
    const [tempTotal, setTempTotal] = useState('0');
    const [isTargetInputFocused, setIsTargetInputFocused] = useState(false);
    const [isTotalInputFocused, setIsTotalInputFocused] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    
    // Scroll detection coordinates for safe touch input
    const touchStartYRef = useRef(0);
    const touchStartXRef = useRef(0);
    const haptics = useHaptics();

    // Quick Settings Bottom Sheet state
    const [showQuickSettings, setShowQuickSettings] = useState(false);

    // Debouncing widget sync to prevent bridge congestion during fast tapping
    const widgetSyncTimeoutRef = useRef(null);
    const latestSyncValuesRef = useRef({ count, preset: activePreset, total: totalCount, target });
    const isSyncingRef = useRef(false);
    const incrementRef = useRef(null);

    // Keep the latest sync ref updated as states change
    useEffect(() => {
        latestSyncValuesRef.current = { count, preset: activePreset, total: totalCount, target };
    }, [count, activePreset, totalCount, target]);

    const syncToWidget = async (currentCount, preset, currentTotal, currentTarget) => {
        if (isCountdownMode) return;
        const idx = DHIKR_PRESETS.findIndex(p => p.id === preset.id);
        try {
            await Preferences.set({ key: 'dhikr_widget_count', value: String(currentCount) });
            await Preferences.set({ key: 'dhikr_widget_preset_index', value: String(idx >= 0 ? idx : -1) });
            await Preferences.set({ key: 'dhikr_widget_total', value: String(currentTotal) });
            await Preferences.set({ key: 'dhikr_widget_target', value: String(currentTarget) });
            
            if (idx === -1) {
                await Preferences.set({ key: 'dhikr_widget_custom_name', value: preset.name || '' });
                await Preferences.set({ key: 'dhikr_widget_custom_arabic', value: preset.arabic || '' });
            } else {
                await Preferences.remove({ key: 'dhikr_widget_custom_name' });
                await Preferences.remove({ key: 'dhikr_widget_custom_arabic' });
            }
        } catch (error) {
            console.error('Widget sync error:', error);
        }
    };

    const queueSyncToWidget = (currentCount, preset, currentTotal, currentTarget) => {
        if (isCountdownMode) return;
        
        // Update the latest values ref immediately
        latestSyncValuesRef.current = { count: currentCount, preset, total: currentTotal, target: currentTarget };
        
        // Clear existing timeout
        if (widgetSyncTimeoutRef.current) {
            clearTimeout(widgetSyncTimeoutRef.current);
        }
        
        // Schedule widget sync in 500ms
        widgetSyncTimeoutRef.current = setTimeout(() => {
            syncToWidget(
                latestSyncValuesRef.current.count,
                latestSyncValuesRef.current.preset,
                latestSyncValuesRef.current.total,
                latestSyncValuesRef.current.target
            );
        }, 500);
    };

    // Track dhikr session start
    useEffect(() => {
        const scrollToTop = () => {
            const container = document.getElementById('main-scroll-container');
            if (container) {
                container.scrollTo(0, 0);
                container.scrollTop = 0;
            }
            window.scrollTo(0, 0);
        };
        
        scrollToTop();
        // Fallback for route transition delays or layout rendering shifts
        const timer1 = setTimeout(scrollToTop, 100);
        const timer2 = setTimeout(scrollToTop, 300);

        const name = isCountdownMode ? countdownName : activePreset.name;
        const t = isCountdownMode ? countdownTarget : target;
        analytics.dhikrStarted(name, t);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Listen to backgrounding to immediately flush any pending widget sync
    useEffect(() => {
        let stateListener = null;
        const setupStateListener = async () => {
            try {
                stateListener = await App.addListener('appStateChange', ({ isActive }) => {
                    if (!isActive) {
                        if (widgetSyncTimeoutRef.current) {
                            clearTimeout(widgetSyncTimeoutRef.current);
                        }
                        syncToWidget(
                            latestSyncValuesRef.current.count,
                            latestSyncValuesRef.current.preset,
                            latestSyncValuesRef.current.total,
                            latestSyncValuesRef.current.target
                        );
                    }
                });
            } catch (e) {
                console.warn('App state listener not supported:', e);
            }
        };
        setupStateListener();

        return () => {
            if (stateListener) stateListener.remove();
            if (widgetSyncTimeoutRef.current) {
                clearTimeout(widgetSyncTimeoutRef.current);
            }
        };
    }, []);

    // Web Audio API Context and Buffers
    const audioContextRef = useRef(null);
    const audioBuffersRef = useRef({
        digital: null
    });

    useEffect(() => {
        // Initialize Audio Context and pre-load all zikir sounds
        const initAudio = async () => {
            try {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                }

                const loadSound = async (key, url) => {
                    if (audioBuffersRef.current[key]) return;
                    try {
                        const response = await fetch(url);
                        const arrayBuffer = await response.arrayBuffer();
                        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
                        audioBuffersRef.current[key] = audioBuffer;
                    } catch (e) {
                        console.error(`Failed to load sound ${key}:`, e);
                    }
                };

                await loadSound('digital', 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            } catch (error) {
                console.error("Audio init error:", error);
            }
        };

        initAudio();

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const playClickSound = () => {
        if (soundMode === 'mute' || !audioContextRef.current || !audioBuffersRef.current[soundMode]) return;

        // Resume context if suspended (browser autoplay policy)
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        // Create a new buffer source for every click -> Zero Latency, Perfect Concurrency
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffersRef.current[soundMode];
        source.connect(audioContextRef.current.destination);
        source.start(0);
    };

    useEffect(() => {
        if (hapticMessage) {
            const timer = setTimeout(() => setHapticMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [hapticMessage]);

    // Sway tassel gently on zikir count changes using smooth spring velocity impulses
    useEffect(() => {
        if (count === 0) return;
        // Inject a physical velocity impulse alternating direction, avoiding hard position sets to prevent jitter
        const impulse = count % 2 === 0 ? 15 : -15;
        animate(tasselImpactRotate, 0, {
            type: 'spring',
            velocity: impulse,
            stiffness: 40,
            damping: 14,
            mass: 0.8
        });
    }, [count]);

    const syncAndLoadWidgetData = async () => {
        if (isSyncingRef.current) return;
        isSyncingRef.current = true;
        try {
            const activeIdx = DHIKR_PRESETS.findIndex(p => p.id === activePreset.id);
            const { value: indexStr } = await Preferences.get({ key: 'dhikr_widget_preset_index' });
            const { value: countStr } = await Preferences.get({ key: 'dhikr_widget_count' });
            const { value: targetStr } = await Preferences.get({ key: 'dhikr_widget_target' });
            const { value: totalStr } = await Preferences.get({ key: 'dhikr_widget_total' });
            const { value: syncFlag } = await Preferences.get({ key: 'widget_sync_flag' });
            const { value: customName } = await Preferences.get({ key: 'dhikr_widget_custom_name' });
            const { value: customArabic } = await Preferences.get({ key: 'dhikr_widget_custom_arabic' });

            const widgetIdx = indexStr ? parseInt(indexStr, 10) : -1;
            const isWidgetSyncActive = syncFlag === 'true';
            
            if (isWidgetSyncActive) {
                await Preferences.remove({ key: 'widget_sync_flag' });
            }
            
            // 1. Determine target preset (either from widget or current active)
            let targetPreset = activePreset;
            if (widgetIdx >= 0 && widgetIdx < DHIKR_PRESETS.length) {
                targetPreset = DHIKR_PRESETS[widgetIdx];
            } else if (widgetIdx === -1 && customName) {
                targetPreset = {
                    id: 'custom',
                    name: customName,
                    arabic: customArabic || '',
                    meaning: '',
                    defaultTarget: 100,
                    isEsma: true
                };
            }
            
            // 2. Sync overall total count
            if (isWidgetSyncActive && totalStr) {
                const widgetTotal = parseInt(totalStr, 10);
                const localTotal = parseInt(localStorage.getItem('totalDhikrOverall') || '0', 10);
                if (!isNaN(widgetTotal) && widgetTotal !== localTotal) {
                    setTotalCount(widgetTotal);
                    localStorage.setItem('totalDhikrOverall', widgetTotal.toString());
                }
            }
            
            // 3. Sync target count
            let activeTarget = targetPreset.defaultTarget;
            const savedTarget = localStorage.getItem(`dhikr_target_${targetPreset.id}`);
            if (savedTarget) {
                activeTarget = parseInt(savedTarget, 10);
            }
            
            if (isWidgetSyncActive && targetStr) {
                activeTarget = parseInt(targetStr, 10);
                setTarget(activeTarget);
                setTempTarget(targetStr);
                localStorage.setItem(`dhikr_target_${targetPreset.id}`, targetStr);
            } else {
                setTarget(activeTarget);
                setTempTarget(String(activeTarget));
            }

            // 4. Sync count
            if (isWidgetSyncActive && countStr) {
                const widgetCount = parseInt(countStr, 10);
                setCount(widgetCount);
                localStorage.setItem(`dhikr_count_${targetPreset.id}`, widgetCount.toString());
            } else {
                const savedCount = localStorage.getItem(`dhikr_count_${targetPreset.id}`) || '0';
                setCount(parseInt(savedCount, 10));
                const currentTotal = parseInt(localStorage.getItem('totalDhikrOverall') || '0', 10);
                syncToWidget(parseInt(savedCount, 10), targetPreset, currentTotal, activeTarget);
            }
            
            // 5. Update selected preset in app state if it differs
            if (targetPreset.id !== activePreset.id || (targetPreset.id === 'custom' && targetPreset.name !== activePreset.name)) {
                setActivePreset(targetPreset);
            }
        } catch (e) {
            console.error('Failed to sync widget data:', e);
            const savedCount = localStorage.getItem(`dhikr_count_${activePreset.id}`) || '0';
            setCount(parseInt(savedCount, 10));
        } finally {
            isSyncingRef.current = false;
        }
    };

    // Mount-level initialization and state listener
    useEffect(() => {
        if (isCountdownMode) return;
        
        syncAndLoadWidgetData();

        let appListener = null;
        const setupStateListener = async () => {
            try {
                appListener = await App.addListener('appStateChange', ({ isActive }) => {
                    if (isActive) {
                        syncAndLoadWidgetData();
                    }
                });
            } catch (e) {
                console.warn('App state listener not supported:', e);
            }
        };
        setupStateListener();

        return () => {
            if (appListener) appListener.remove();
        };
    }, []);

    // Preset changing sync
    useEffect(() => {
        if (isCountdownMode) return;
        
        const loadAndSyncPreset = async () => {
            const savedCount = parseInt(localStorage.getItem(`dhikr_count_${activePreset.id}`) || '0', 10);
            const savedTarget = parseInt(localStorage.getItem(`dhikr_target_${activePreset.id}`) || String(activePreset.defaultTarget), 10);
            
            setCount(savedCount);
            setTarget(savedTarget);
            setTempTarget(String(savedTarget));
            
            // Persist last active preset selection
            localStorage.setItem('last_active_dhikr_preset', JSON.stringify(activePreset));
            
            const currentTotal = parseInt(localStorage.getItem('totalDhikrOverall') || '0', 10);
            await syncToWidget(savedCount, activePreset, currentTotal, savedTarget);
        };
        
        loadAndSyncPreset();
    }, [activePreset.id, activePreset.name]);

    // Sync increment function to ref to avoid volume listener stale closures
    useEffect(() => {
        incrementRef.current = increment;
    });

    // Handle physical volume button presses natively on iOS/Android
    useEffect(() => {
        let isWatching = false;
        
        const startWatching = async () => {
            if (!volumeButtonsEnabled) {
                try {
                    await VolumeButtons.clearWatch();
                } catch (e) {
                    console.warn('clearWatch failed:', e);
                }
                return;
            }

            try {
                // Clear any existing watcher first (wrapped in try/catch to prevent failure from aborting execution)
                try {
                    await VolumeButtons.clearWatch();
                } catch (e) {
                    // Ignore if no watch is currently active
                }
                
                const options = {
                    disableSystemVolumeHandler: true,
                    suppressVolumeIndicator: true
                };
                
                await VolumeButtons.watchVolume(options, (result) => {
                    // Call the latest increment handler
                    if (incrementRef.current) {
                        incrementRef.current();
                    }
                });
                isWatching = true;
            } catch (e) {
                console.warn('watchVolume failed:', e);
            }
        };

        if (Capacitor.isNativePlatform()) {
            startWatching();
        }

        return () => {
            if (isWatching && Capacitor.isNativePlatform()) {
                VolumeButtons.clearWatch().catch(e => console.warn('clearWatch failed on unmount:', e));
            }
        };
    }, [volumeButtonsEnabled]);

    // Handle dhikr/esma selection from picker
    const handleDhikrSelect = useCallback((item) => {
        // Check if it's a standard preset, custom zikir, or an esma
        const standardPreset = DHIKR_PRESETS.find(p => p.id === item.id);
        if (standardPreset) {
            setActivePreset(standardPreset);
        } else if (item.id === 'custom') {
            setActivePreset({
                id: 'custom',
                name: item.name,
                arabic: item.arabic === '✨' ? '' : item.arabic,
                meaning: '',
                defaultTarget: 100,
                isEsma: false
            });
        } else {
            // Esma-ül Hüsna item — adapt to preset shape
            setActivePreset({
                id: item.id,
                name: item.transliteration || item.name,
                arabic: item.arabic,
                meaning: item.meaning || '',
                defaultTarget: item.defaultTarget || 100,
                isEsma: true,
            });
        }
    }, []);

    const increment = (skipStandardHaptic = false) => {
        triggerParticles();
        if (isFullScreenTap) {
            setIsScreenFlash(true);
            setTimeout(() => setIsScreenFlash(false), 120);
        }

        if (isCountdownMode) {
            // COUNTDOWN MODE: Decrement (resets at 0 for next round)
            // Daily dhikr limit for non-premium users (100 free per day)
            if (!isPremium()) {
                const stored = JSON.parse(localStorage.getItem('zikirmatik_daily_limit') || '{}');
                const today = getAppDate().toISOString().slice(0, 10);
                const dailyCount = stored.date === today ? (stored.count || 0) : 0;
                if (dailyCount >= DAILY_DHIKR_LIMIT) {
                    setShowDhikrLimit(true);
                    return;
                }
                localStorage.setItem('zikirmatik_daily_limit', JSON.stringify({
                    count: dailyCount + 1,
                    date: today
                }));
            }

            const newCount = count - 1;
            const newTotal = totalCount + 1;

            setTotalCount(newTotal);
            localStorage.setItem('totalDhikrOverall', newTotal.toString());

            // Haptic feedback
            if (hapticsMode !== 'off' && !skipStandardHaptic) {
                if (newCount === 0) {
                    haptics.targetReached();
                } else if (hapticsMode === 'all') {
                    haptics.heavy();
                }
            }

            playClickSound();

            setIsRipple(true);
            setTimeout(() => setIsRipple(false), 300);

            // Round complete! Reset to target and increment round
            if (newCount === 0) {
                setCount(countdownTarget); // restart from target
                setCountdownRounds(prev => prev + 1);
                setCelebrating(true);
                triggerReviewPrompt('dhikr');
                analytics.dhikrCompleted(countdownName, countdownTarget);
                setTimeout(() => {
                    setCelebrating(false);
                    import('@/services/adService').then(({ showInterstitialAd }) => showInterstitialAd()).catch(() => {});
                }, 3000);
            } else {
                setCount(newCount);
            }
        } else {
            // STANDARD MODE: Increment
            // Daily dhikr limit for non-premium users (100 free per day)
            if (!isPremium()) {
                const stored = JSON.parse(localStorage.getItem('zikirmatik_daily_limit') || '{}');
                const today = getAppDate().toISOString().slice(0, 10);
                const dailyCount = stored.date === today ? (stored.count || 0) : 0;
                if (dailyCount >= DAILY_DHIKR_LIMIT) {
                    setShowDhikrLimit(true);
                    return;
                }
                localStorage.setItem('zikirmatik_daily_limit', JSON.stringify({
                    count: dailyCount + 1,
                    date: today
                }));
            }

            const newCount = count + 1;
            const newTotal = totalCount + 1;
            const isTargetReached = newCount > 0 && newCount % target === 0;

            setCount(newCount);
            setTotalCount(newTotal);

            localStorage.setItem(`dhikr_count_${activePreset.id}`, newCount.toString());
            localStorage.setItem('totalDhikrOverall', newTotal.toString());
            queueSyncToWidget(newCount, activePreset, newTotal, target);

            if (hapticsMode !== 'off' && !skipStandardHaptic) {
                if (isTargetReached) {
                    haptics.targetReached();
                } else if (hapticsMode === 'all') {
                    haptics.heavy();
                }
            }

            playClickSound();

            setIsRipple(true);
            setTimeout(() => setIsRipple(false), 300);

            if (isTargetReached) {
                setCelebrating(true);
                triggerReviewPrompt('dhikr');
                analytics.dhikrCompleted(activePreset.name, newCount);
                setTimeout(() => {
                    setCelebrating(false);
                    import('@/services/adService').then(({ showInterstitialAd }) => showInterstitialAd()).catch(() => {});
                }, 2000);
            }
        }
    };

    const handleSaveTarget = () => {
        let val = parseInt(tempTarget, 10);
        if (!isNaN(val) && val > 0) {
            if (val > 999999) {
                val = 999999;
            }
            setTarget(val);
            localStorage.setItem(`dhikr_target_${activePreset.id}`, val.toString());
            
            // Mathematically reset turn/round to 1 by setting count to count % newTarget
            const newCount = count % val;
            setCount(newCount);
            localStorage.setItem(`dhikr_count_${activePreset.id}`, newCount.toString());
            
            setShowTargetModal(false);
            syncToWidget(newCount, activePreset, totalCount, val);
            
            // Trigger success haptic feedback
            try {
                haptics.success();
            } catch (e) {
                console.warn('Haptics failed:', e);
            }
        }
    };

    const handleSaveTotal = () => {
        let val = parseInt(tempTotal, 10);
        if (!isNaN(val) && val > 0) {
            if (val > 999999) {
                val = 999999;
            }
            
            // Calculate difference to update the overall cumulative total consistently
            const diff = val - count;
            const newTotal = Math.max(0, totalCount + diff);
            
            // Update active preset count (the main number in the middle)
            setCount(val);
            localStorage.setItem(`dhikr_count_${activePreset.id}`, val.toString());
            
            // Update overall cumulative total count
            setTotalCount(newTotal);
            localStorage.setItem('totalDhikrOverall', newTotal.toString());
            
            setShowTotalModal(false);
            syncToWidget(val, activePreset, newTotal, target);
            
            // Trigger success haptic feedback
            try {
                haptics.success();
            } catch (e) {
                console.warn('Haptics failed:', e);
            }
        }
    };

    const reset = () => {
        setShowResetConfirm(true);
    };

    const handleResetConfirm = () => {
        if (isCountdownMode) {
            setCount(countdownTarget);
            setCountdownCompleted(false);
            setCountdownRounds(0);
        } else {
            setCount(0);
            localStorage.setItem(`dhikr_count_${activePreset.id}`, '0');
            syncToWidget(0, activePreset, totalCount, target);
        }
        setShowResetConfirm(false);
    };

    const resetTotal = () => {
        setTotalCount(0);
        localStorage.setItem('totalDhikrOverall', '0');
        
        setCount(0);
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('dhikr_count_')) {
                localStorage.setItem(key, '0');
            }
        });
        
        setShowTotalResetConfirm(false);
        syncToWidget(0, activePreset, 0, target);
    };

    const progress = isCountdownMode
        ? ((countdownTarget - count) / countdownTarget) * 100
        : (count % target) / target * 100;
    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    // Progress percentage (0 to 1) for visual glow intensity
    const progressRatio = isCountdownMode
        ? (countdownTarget > 0 ? (countdownTarget - count) / countdownTarget : 0)
        : (target > 0 ? (count % target) / target : 0);

    // Dynamic skeuomorphic hand-held tally counter styling specifications
    const tallyColorThemes = {
        emerald: {
            case: "from-[#0d5c3a] via-[#05321f] to-[#021c11] border-islamic-gold/70 shadow-[0_25px_50px_rgba(0,0,0,0.75),_inset_0_2px_4px_rgba(255,255,255,0.2)]",
            bezel: "border-islamic-gold/30",
            bezelText: "text-islamic-gold/80",
            button: "from-[#ffe89c] via-[#d4af37] via-[#a88216] to-[#664d0a] border-[#fff6d1]",
            reset: "from-white via-[#cbd5e1] to-[#64748b] border-zinc-200",
            badge: "bg-islamic-gold/10 border-islamic-gold/20 text-islamic-gold"
        },
        blue: {
            case: "from-[#1b365d] via-[#0f2038] to-[#07111f] border-zinc-300/60 shadow-[0_25px_50px_rgba(0,0,0,0.75),_inset_0_2px_4px_rgba(255,255,255,0.2)]",
            bezel: "border-white/20",
            bezelText: "text-white/80",
            button: "from-[#ff9c54] via-[#ea580c] via-[#c2410c] to-[#7c2d12] border-[#ffedd5]",
            reset: "from-[#ffe89c] via-[#d4af37] to-[#8d6f16] border-[#fff2c2]",
            badge: "bg-white/5 border-white/10 text-white/80"
        },
        red: {
            case: "from-[#5f0f0f] via-[#370808] to-[#1a0303] border-islamic-gold/70 shadow-[0_25px_50px_rgba(0,0,0,0.75),_inset_0_2px_4px_rgba(255,255,255,0.2)]",
            bezel: "border-islamic-gold/30",
            bezelText: "text-islamic-gold/80",
            button: "from-[#ffe89c] via-[#d4af37] via-[#a88216] to-[#664d0a] border-[#fff6d1]",
            reset: "from-white via-[#cbd5e1] to-[#64748b] border-zinc-200",
            badge: "bg-islamic-gold/10 border-islamic-gold/20 text-islamic-gold"
        },
        gold: {
            case: "from-[#aa8f3c] via-[#756024] to-[#403410] border-[#d4af37]/45 shadow-[0_25px_50px_rgba(0,0,0,0.75),_inset_0_2px_3px_rgba(255,255,255,0.08)]",
            bezel: "border-[#d4af37]/35 bg-[#141209]",
            bezelText: "text-[#d4af37]",
            button: "from-[#52525b] via-[#27272a] via-[#18181b] to-black border-[#71717a]",
            reset: "from-white via-[#cbd5e1] to-[#64748b] border-zinc-200",
            badge: "bg-white/5 border-white/10 text-white/80"
        },
        grey: {
            case: "from-[#71717a] via-[#3f3f46] to-[#18181b] border-zinc-400/50 shadow-[0_25px_50px_rgba(0,0,0,0.75),_inset_0_2px_4px_rgba(255,255,255,0.2)]",
            bezel: "border-zinc-700",
            bezelText: "text-zinc-400",
            button: "from-[#ffe89c] via-[#d4af37] via-[#a88216] to-[#664d0a] border-[#fff6d1]",
            reset: "from-[#ffe89c] via-[#d4af37] to-[#8d6f16] border-[#fff2c2]",
            badge: "bg-white/5 border-white/10 text-white/80"
        }
    };

    const currentTallyTheme = tallyColorThemes[tallyColor] || tallyColorThemes.emerald;

    // Subtle glow that intensifies as target approaches
    const glowStyle = {
        boxShadow: `0 0 ${40 + progressRatio * 40}px rgba(212, 175, 55, ${0.1 + progressRatio * 0.25}), inset 0 0 20px rgba(255, 255, 255, 0.03)`
    };

    return (
        <div 
            onTouchStart={(e) => {
                if (isFullScreenTap) {
                    touchStartYRef.current = e.touches[0].clientY;
                    touchStartXRef.current = e.touches[0].clientX;
                }
            }}
            onTouchEnd={(e) => {
                if (isFullScreenTap) {
                    // Prevent incrementing when tapping on buttons, header, or footer
                    if (e.target.closest('button') || e.target.closest('header') || e.target.closest('footer') || e.target.closest('.no-tap-anywhere')) {
                        return;
                    }
                    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartYRef.current);
                    const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartXRef.current);
                    // Standard tap click has minimal displacement (<10px)
                    if (deltaY < 10 && deltaX < 10) {
                        e.preventDefault();
                        increment();
                    }
                }
            }}
            onClick={(e) => {
                if (isFullScreenTap) {
                    if (e.target.closest('button') || e.target.closest('header') || e.target.closest('footer') || e.target.closest('.no-tap-anywhere')) {
                        return;
                    }
                    increment();
                }
            }}
            className={cn(
                "flex flex-col min-h-screen text-stone-800 dark:text-white px-5 pb-5 pt-0 relative overflow-hidden font-sans transition-colors duration-150 select-none",
                isScreenFlash && isFullScreenTap ? "bg-[#DCEFE2] dark:bg-[#042818]" : (dhikrTheme === 'tally' ? "bg-[#F1EBDC] dark:bg-[#010e08]" : "bg-[#F6F0E1] dark:bg-[#021a0f]")
            )}
        >
            {/* Custom pulse animation for theme selector visibility */}
            <style>{`
                @keyframes goldPulse {
                    0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.75); }
                    70% { box-shadow: 0 0 0 8px rgba(212, 175, 55, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
                }
                .animate-gold-pulse {
                    animation: goldPulse 2s infinite;
                }
            `}</style>

            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-islamic-gold/10 rounded-full blur-[100px] pointer-events-none opacity-[0.35] dark:opacity-100" />
            <div className="absolute bottom-[-5%] left-[-5%] w-72 h-72 bg-islamic-green/20 rounded-full blur-[120px] pointer-events-none opacity-[0.35] dark:opacity-100" />

            {/* Islamic Geometric Background Pattern */}
            <div
                className="absolute inset-0 opacity-[0.02] dark:opacity-[0.035] pointer-events-none z-0 mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath d='M40 0 L80 40 L40 80 L0 40 Z' fill='none' stroke='%23D4AF37' stroke-width='0.5'/%3E%3Ccircle cx='40' cy='40' r='12' fill='none' stroke='%23D4AF37' stroke-width='0.5'/%3E%3Cpath d='M0 0 L80 80 M80 0 L0 80' stroke='%23D4AF37' stroke-width='0.3' stroke-dasharray='1,2'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat'
                }} 
            />

            <header className={cn("flex justify-between items-center z-30 mb-4 sticky top-0 backdrop-blur-sm -mx-6 px-6 py-1 border-b border-[#E2D9C4]/60 dark:border-white/5 transition-colors duration-150", dhikrTheme === 'tally' ? "bg-[#F1EBDC]/80 dark:bg-[#010e08]/80" : "bg-[#F6F0E1]/80 dark:bg-[#021a0f]/80")}>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl bg-[#F0E8D5] hover:bg-[#E9DFC8] dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-stone-500 hover:text-stone-800 dark:text-white/60 dark:hover:text-white active:scale-90 transition-all border border-[#E2D9C4] dark:border-white/10"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="bg-islamic-green/10 dark:bg-islamic-gold/10 p-2 rounded-xl">
                        <Sparkles className="w-5 h-5 text-islamic-green dark:text-islamic-gold animate-pulse" />
                    </div>
                    <h2 className="text-xl font-serif font-bold tracking-tight">{isCountdownMode ? countdownName : t('title')}</h2>
                </div>
                <div className="flex items-center gap-1 bg-white/60 dark:bg-black/20 p-1 rounded-2xl border border-[#E2D9C4] dark:border-white/10 backdrop-blur-md relative">
                    <button
                        onClick={() => {
                            const themeOrder = ['tasbih', 'tally', 'classic'];
                            const currentIndex = themeOrder.indexOf(dhikrTheme);
                            const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
                            setDhikrTheme(nextTheme);
                            localStorage.setItem('dhikr_theme', nextTheme);
                            setHapticMessage(
                                nextTheme === 'tasbih' ? t('theme.tasbih', { defaultValue: 'Tesbih Teması' }) : 
                                nextTheme === 'tally' ? t('theme.tally', { defaultValue: 'Zikirmatik Teması' }) : t('theme.classic', { defaultValue: 'Klasik Tema' })
                            );
                            try {
                                haptics.selection();
                            } catch (e) {}
                        }}
                        className="w-10 h-10 rounded-xl transition-all relative flex items-center justify-center active:scale-95 duration-300 animate-gold-pulse bg-gradient-to-r from-amber-400 to-[#d4af37] text-zinc-950 border border-amber-300/40 shadow-[0_2px_8px_rgba(212,175,55,0.4)]"
                        title={t('theme.tooltip', { defaultValue: 'Temayı Değiştir' })}
                    >
                        <Palette size={18} />
                    </button>
                    
                    <button
                        onClick={() => {
                            setShowQuickSettings(true);
                            try {
                                haptics.selection();
                            } catch (e) {}
                        }}
                        className={cn(
                            "w-10 h-10 rounded-xl transition-all relative flex items-center justify-center border active:scale-95 duration-200",
                            showQuickSettings ? "text-islamic-green bg-islamic-green/10 border-islamic-green/40 dark:text-islamic-gold dark:bg-white/15 dark:border-islamic-gold/45" : "text-stone-500 hover:text-stone-800 bg-[#F0E8D5] border-[#E2D9C4] dark:text-white/60 dark:hover:text-white dark:bg-white/5 dark:border-white/10"
                        )}
                        title={t('settings', { defaultValue: 'Hızlı Ayarlar' })}
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            {/* Main Interaction Area - Aesthetic spacing from top */}
            <div className="flex-1 flex flex-col justify-start items-center z-10 relative mt-8">
                {/* Visual Feedback Text - Balanced margin */}
                <div className="text-center mb-6 animate-in fade-in zoom-in duration-700">
                    {isCountdownMode ? (
                        <>
                            <p className="text-islamic-green dark:text-islamic-gold font-serif text-4xl mb-2 opacity-95 drop-shadow-lg" dir="rtl">{countdownArabic || countdownName}</p>
                            {countdownArabic && (
                                <p className="text-stone-800 dark:text-white font-bold text-lg mb-1 tracking-wide">{countdownName}</p>
                            )}
                            <p className="text-stone-400 dark:text-white/40 text-xs italic mb-4 font-normal tracking-wide">{countdownMeaning}</p>
                            <div className="flex items-center justify-center gap-3 bg-islamic-green/5 border-islamic-green/40 dark:bg-islamic-gold/5 dark:border-islamic-gold/40 px-10 py-3.5 rounded-full border mx-auto shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                                <span className="text-islamic-green dark:text-islamic-gold font-bold text-xs uppercase tracking-[0.25em]">{t('targetWithUnit', { count: countdownTarget })}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Display of Arabic and Meaning (Elegant, static floating layout) */}
                            <div className="flex flex-col items-center text-center select-none pointer-events-none mb-4 animate-in fade-in duration-300">
                                <p className="text-islamic-green dark:text-islamic-gold font-serif text-4xl mb-2 opacity-95 drop-shadow-[0_4px_12px_rgba(212,175,55,0.2)]" dir="rtl">
                                    {activePreset.arabic}
                                </p>
                                <p className="text-stone-400 dark:text-white/40 text-xs italic font-normal tracking-wide max-w-[280px]">
                                    {activePreset.id === 'custom'
                                        ? ''
                                        : (activePreset.isEsma
                                            ? t(`esma.${activePreset.id}.meaning`, { defaultValue: activePreset.meaning })
                                            : t(`presets.${activePreset.id}.meaning`))}
                                </p>
                            </div>

                            {/* Control Row: Zikir Selector & Target Setting side-by-side */}
                            <div className="flex items-center justify-center gap-2 mb-2">
                                {/* Zikir Selector Pill */}
                                <button
                                    onClick={() => setShowDhikrPicker(true)}
                                    className="group flex items-center gap-2 bg-[#FFFDF6] hover:bg-stone-50 dark:bg-white/5 dark:hover:bg-white/10 px-4 py-2 rounded-full border border-[#E2D9C4] dark:border-white/10 transition-all active:scale-95 text-xs font-semibold text-stone-600 dark:text-white/80 shadow-md"
                                >
                                    <span>{activePreset.id === 'custom' || activePreset.isEsma ? activePreset.name : t(`presets.${activePreset.id}.name`, { defaultValue: activePreset.name })}</span>
                                    <ChevronDown size={14} className="text-islamic-green dark:text-islamic-gold opacity-85 transition-transform group-active:translate-y-[1px]" />
                                </button>

                                {/* Target Pill */}
                                <button
                                    onClick={() => setShowTargetModal(true)}
                                    className="group flex items-center gap-2 bg-islamic-green/5 hover:bg-islamic-green/10 border-islamic-green/30 dark:bg-islamic-gold/5 dark:hover:bg-islamic-gold/10 dark:border-islamic-gold/30 px-4 py-2 rounded-full border transition-all active:scale-95 text-xs font-bold text-islamic-green dark:text-islamic-gold shadow-md"
                                >
                                    <span>{t('target', { count: target })}</span>
                                    <Edit3 size={11} className="text-islamic-green/75 dark:text-islamic-gold/75" />
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* The Button & Progress / Tasbih Beads */}
                {dhikrTheme === 'classic' && (
                    <div className="relative w-80 h-80 flex items-center justify-center">
                        {/* SVG Progress Ring */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                            {/* Background Ring */}
                            <circle
                                cx="100"
                                cy="100"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="transparent"
                                className="text-stone-900/5 dark:text-white/5"
                            />
                            {/* Progress Ring */}
                            <circle
                                cx="100"
                                cy="100"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                className={cn(
                                    "transition-all duration-300 ease-out",
                                    celebrating ? "text-amber-500 dark:text-emerald-400 stroke-[14px]" : "text-islamic-green dark:text-islamic-gold"
                                )}
                            />
                        </svg>

                        {/* Ripple Effect Background */}
                        <div className={cn(
                            "absolute inset-0 bg-islamic-gold/10 rounded-full transition-all duration-700 scale-0",
                            isRipple && "scale-100 opacity-0"
                        )} />

                        {/* Target Reached Celebration Sparkles */}
                        {celebrating && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <Sparkles className="text-islamic-gold w-full h-full animate-ping opacity-20" />
                            </div>
                        )}

                        {/* Main Button with Framer Motion spring physics & progress glow */}
                        <motion.button
                            whileTap={{ scale: 0.94 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            onTouchStart={(e) => {
                                e.preventDefault(); // Prevent long-press context menu on iOS
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault(); // Prevent ghost click
                                increment();
                            }}
                            onClick={(e) => {
                                // Desktop/web fallback — touch devices already handled above
                                if (e.detail > 0) increment(); // Only keyboard/mouse, not synthetic from touch
                            }}
                            onContextMenu={(e) => e.preventDefault()} // Block long-press context menu
                            className={cn(
                                "w-60 h-60 rounded-full bg-gradient-to-br from-white to-stone-100 shadow-lg dark:shadow-none dark:from-white/10 dark:to-black/30 border border-[#E2D9C4] dark:border-white/20 flex flex-col items-center justify-center relative backdrop-blur-lg group select-none touch-manipulation",
                                celebrating && "border-amber-500/50 dark:border-emerald-500/50 shadow-amber-500/20 dark:shadow-emerald-500/20"
                            )}
                            style={glowStyle}
                        >
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/5 rounded-t-full pointer-events-none" />

                            <span className={cn(
                                "text-7xl font-mono font-bold tracking-tighter transition-all duration-300 drop-shadow-2xl",
                                celebrating ? "text-amber-600 dark:text-emerald-400 scale-110" : "text-stone-900 group-hover:text-islamic-green dark:text-white dark:group-hover:text-islamic-gold",
                                countdownCompleted && "text-amber-600 dark:text-emerald-400"
                            )}>
                                {isCountdownMode ? count : (count % target === 0 && count > 0 ? target : count % target)}
                            </span>

                            {isCountdownMode ? (
                                <div className="flex flex-col items-center mt-2 opacity-40">
                                    {countdownRounds > 0 && (
                                        <span className="text-[10px] font-bold text-islamic-green/60 dark:text-islamic-gold/60 uppercase tracking-[0.15em]">{t('roundCompleted', { round: countdownRounds })}</span>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center mt-2 opacity-40">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{t('round')}</span>
                                    <span className="text-xl font-mono font-bold">{Math.floor(count / target) + 1}</span>
                                </div>
                            )}
                        </motion.button>

                        {/* Decorative Stars */}
                        <Star size={16} className="absolute top-8 right-8 text-islamic-gold/20 animate-pulse" />
                        <Star size={12} className="absolute bottom-10 left-12 text-islamic-gold/10 animate-pulse delay-700" />
                        <Heart size={14} className="absolute top-12 left-10 text-islamic-gold/10 animate-pulse delay-500" />
                    </div>
                )}

                {dhikrTheme === 'tasbih' && (
                    <div className="flex flex-col items-center z-10 w-full">
                        {/* Dynamic Aura Glow linked to active material */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                            <motion.div
                                key={`aura-${beadType}-${count}`}
                                initial={{ scale: 0.8, opacity: 0.35 }}
                                animate={{ 
                                    scale: 1, 
                                    opacity: 1,
                                    transition: { type: 'spring', stiffness: 180, damping: 14 }
                                }}
                                className={cn(
                                    "w-56 h-56 rounded-full blur-[70px] mix-blend-screen transition-all duration-700",
                                    beadType === 'kehribar' && "bg-gradient-to-br from-amber-500/25 to-orange-600/15 shadow-[0_0_90px_rgba(245,158,11,0.25)]",
                                    beadType === 'kuka' && "bg-gradient-to-br from-amber-900/15 to-[#3d2102]/15 shadow-[0_0_70px_rgba(146,64,14,0.15)]",
                                    beadType === 'turkuaz' && "bg-gradient-to-br from-cyan-500/25 to-teal-700/15 shadow-[0_0_80px_rgba(6,182,212,0.2)]",
                                    beadType === 'zumrut' && "bg-gradient-to-br from-emerald-500/30 to-emerald-900/20 shadow-[0_0_100px_rgba(16,185,129,0.35)]"
                                )}
                            />
                        </div>

                        {/* Realistic horizontal misbaha: the whole stage is one big tap
                            target. Each pull slides one bead from the waiting group (left)
                            over to the pulled group (right), like a real tasbih on a string.
                            `no-tap-anywhere` + stopPropagation keep the fullscreen-tap
                            handler from double counting. */}
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); increment(); }}
                            className="relative w-full max-w-[400px] h-[320px] select-none touch-manipulation z-10 no-tap-anywhere cursor-pointer overflow-hidden"
                        >
                            {/* Round indicator */}
                            <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-islamic-green/10 border-islamic-green/20 dark:bg-islamic-gold/10 dark:border-islamic-gold/20 px-4 py-1.5 rounded-full border flex items-center gap-1.5 backdrop-blur-md z-20 pointer-events-none">
                                <span className="text-[10px] font-bold text-islamic-green/60 dark:text-islamic-gold/60 uppercase tracking-widest">{t('round')}:</span>
                                <span className="text-xs font-mono font-bold text-islamic-green dark:text-islamic-gold">{isCountdownMode ? countdownRounds + 1 : Math.floor(count / target) + 1}</span>
                            </div>

                            {/* Big photo-style counter: 5/100 */}
                            <div className="absolute top-14 inset-x-0 flex flex-col items-center z-10 pointer-events-none">
                                <div className="flex items-baseline gap-0.5">
                                    <span className={cn(
                                        "text-6xl font-mono font-bold tracking-tighter drop-shadow-xl transition-colors duration-300",
                                        celebrating ? "text-amber-600 dark:text-emerald-400" : "text-stone-900 dark:text-white"
                                    )}>
                                        {isCountdownMode ? count : (count % target === 0 && count > 0 ? target : count % target)}
                                    </span>
                                    <span className="text-2xl font-mono font-bold text-stone-400 dark:text-white/35">
                                        /{isCountdownMode ? countdownTarget : target}
                                    </span>
                                </div>
                            </div>

                            {/* Floating +1 on every pull */}
                            <AnimatePresence initial={false}>
                                <motion.span
                                    key={`plus-${totalCount}`}
                                    initial={{ opacity: 0, y: 10, scale: 0.7 }}
                                    animate={{ opacity: 1, y: -8, scale: 1 }}
                                    exit={{ opacity: 0, y: -26, scale: 0.9 }}
                                    transition={{ duration: 0.45, ease: 'easeOut' }}
                                    className="absolute top-[130px] right-[18%] text-2xl font-mono font-bold text-islamic-green/70 dark:text-islamic-gold/80 pointer-events-none z-20"
                                >
                                    +1
                                </motion.span>
                            </AnimatePresence>

                            {/* Stage: thread + beads share one 400x150 coordinate space */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[400px] h-[150px] pointer-events-none">
                                {/* Silk cord the beads ride on: soft shadow + dark core +
                                    gold body + thin top sheen = round, polished rope look */}
                                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 150">
                                    <defs>
                                        <linearGradient id="ropeGradH" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#9a7a24" />
                                            <stop offset="30%" stopColor="#d4af37" />
                                            <stop offset="50%" stopColor="#f0cf5e" />
                                            <stop offset="70%" stopColor="#d4af37" />
                                            <stop offset="100%" stopColor="#9a7a24" />
                                        </linearGradient>
                                        <filter id="ropeShadow" x="-20%" y="-60%" width="140%" height="220%">
                                            <feGaussianBlur stdDeviation="2.5" />
                                        </filter>
                                    </defs>
                                    <path d="M -10 94 Q 200 14 410 94" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="6" strokeLinecap="round" filter="url(#ropeShadow)" />
                                    <path d="M -10 90 Q 200 10 410 90" fill="none" stroke="#6b4f14" strokeWidth="7" strokeLinecap="round" />
                                    <path d="M -10 90 Q 200 10 410 90" fill="none" stroke="url(#ropeGradH)" strokeWidth="4.6" strokeLinecap="round" />
                                    <path d="M -10 88.5 Q 200 8.5 410 88.5" fill="none" stroke="#ffedb0" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
                                </svg>

                                {/* Beads: id = totalCount + offset, so every pull (both modes)
                                    slides one bead across; positions re-derive from totalCount
                                    and framer springs the whole strand into place */}
                                {Array.from({ length: 11 }, (_, k) => {
                                    const beadId = totalCount - 5 + k;
                                    const s = beadId - totalCount; // >= 0 waiting (left) | <= -1 pulled (right)
                                    const x = s >= 0 ? 148 - s * 44 : 252 + (-s - 1) * 44;
                                    const tt = Math.min(Math.max((x + 10) / 420, 0), 1);
                                    const y = 90 - 160 * tt * (1 - tt); // matches the ∩ Q-curve above
                                    const hidden = x < -14 || x > 414;
                                    return (
                                        <motion.div
                                            key={beadId}
                                            initial={false}
                                            animate={{
                                                x: x - 24,
                                                y: y - 24,
                                                opacity: hidden ? 0 : 1,
                                                scale: s === -1 ? 1.05 : 1
                                            }}
                                            transition={{ type: 'spring', stiffness: 320, damping: 22, mass: 0.7 }}
                                            className="absolute left-0 top-0 w-12 h-12"
                                            style={{ zIndex: s === -1 ? 8 : 5 }}
                                        >
                                            <div
                                                className="w-12 h-12 rounded-full relative overflow-hidden"
                                                style={{
                                                    backgroundImage: `${TASBIH_MATERIALS[beadType].veins}, ${TASBIH_MATERIALS[beadType].base}`,
                                                    boxShadow: TASBIH_MATERIALS[beadType].shadow
                                                }}
                                            >
                                                {/* Sphere shading: lit from top-left, dark lower rim,
                                                    inset edge falloff all around — no flat sticker look */}
                                                <div className="absolute inset-0 rounded-full" style={{
                                                    background: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.2), rgba(255,255,255,0) 46%), radial-gradient(circle at 72% 84%, rgba(0,0,0,0.38), transparent 58%)',
                                                    boxShadow: 'inset 0 -7px 9px rgba(0,0,0,0.4), inset 0 3px 5px rgba(255,255,255,0.16), inset -3px -3px 7px rgba(0,0,0,0.28)'
                                                }} />
                                                {/* Bottom bounce light — reflected glow that sells the sphere */}
                                                <div className="absolute inset-0 rounded-full" style={{
                                                    background: 'radial-gradient(ellipse 55% 20% at 50% 94%, rgba(255,255,255,0.18), transparent 75%)'
                                                }} />
                                                {/* Specular: sharp hotspot + soft halo (gloss per material) */}
                                                <div className="absolute rounded-full" style={{
                                                    top: '12%', left: '18%', width: '34%', height: '26%',
                                                    transform: 'rotate(-22deg)',
                                                    background: 'radial-gradient(ellipse at 42% 40%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 34%, rgba(255,255,255,0) 70%)',
                                                    opacity: TASBIH_MATERIALS[beadType].gloss
                                                }} />
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {/* Star burst where the pulled bead lands */}
                                <div className="absolute left-[252px] top-[60px] z-10">
                                    {particles.map((p) => {
                                        const rad = (p.angle * Math.PI) / 180;
                                        const tx = Math.cos(rad) * p.distance;
                                        const ty = Math.sin(rad) * p.distance;
                                        return (
                                            <motion.div
                                                key={p.id}
                                                initial={{ x: 0, y: 0, scale: 0.1, opacity: 1 }}
                                                animate={{ x: tx, y: ty, scale: 1.1, opacity: 0, rotate: p.angle * 3 }}
                                                transition={{ duration: 0.45, ease: "easeOut" }}
                                                className="absolute pointer-events-none"
                                            >
                                                <Star size={12} className="text-[#ffd700] fill-[#ffd700] drop-shadow-[0_0_8px_rgba(212,175,55,0.9)]" />
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </button>

                        {/* Bead Material Selector */}
                        <div className="flex items-center gap-3.5 mt-4 bg-white/70 border-[#E2D9C4] dark:bg-black/35 dark:border-white/10 px-4 py-2 rounded-full border backdrop-blur-md z-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {Object.entries(TASBIH_MATERIALS).map(([id, m]) => ({ id, ...m })).map((mat) => (
                                <button
                                    key={mat.id}
                                    onClick={() => {
                                        if (mat.id !== 'kehribar' && !isPremium()) {
                                            navigate('/premium');
                                            return;
                                        }
                                        setBeadType(mat.id);
                                        localStorage.setItem('dhikr_bead_type', mat.id);
                                        if (hapticsMode !== 'off') {
                                            try {
                                                haptics.selection();
                                            } catch (e) {}
                                        }
                                    }}
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center border transition-all active:scale-90 relative",
                                        beadType === mat.id ? "border-islamic-gold scale-110 shadow-[0_0_10px_rgba(212,175,55,0.4)]" : "border-stone-300 dark:border-white/20 opacity-55 hover:opacity-90"
                                    )}
                                    title={mat.name}
                                >
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center relative shadow-md" style={{ backgroundImage: `${mat.veins}, ${mat.base}`, boxShadow: 'inset -2px -3px 5px rgba(0,0,0,0.45), inset 2px 2px 4px rgba(255,255,255,0.3)' }}>
                                        {mat.id !== 'kehribar' && !isPremium() && (
                                            <Crown size={8} className="text-white absolute fill-white" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {dhikrTheme === 'tally' && (
                    <div className="flex flex-col items-center z-10 no-tap-anywhere relative mt-2 animate-in fade-in zoom-in duration-300">
                        {/* Ambient casing glow for depth and separation */}
                        <div className={cn(
                            "absolute top-12 w-64 h-64 rounded-full blur-[80px] opacity-25 pointer-events-none transition-all duration-500 -z-10",
                            tallyColor === 'emerald' ? "bg-islamic-gold" :
                            tallyColor === 'blue' ? "bg-[#3b82f6]" :
                            tallyColor === 'red' ? "bg-[#ef4444]" :
                            tallyColor === 'gold' ? "bg-[#fbbf24]" :
                            "bg-[#FFFDF6]"
                        )} />

                        {/* Realistic Tally Counter Chassis */}
                        <div className={cn(
                            "relative w-[280px] h-[345px] bg-gradient-to-br rounded-[3.2rem] flex flex-col items-center justify-start pt-6 pb-8 px-6 shadow-[0_30px_60px_rgba(0,0,0,0.75),_inset_0_4px_8px_rgba(255,255,255,0.08)] transition-all duration-500 border-[3px]",
                            currentTallyTheme.case
                        )}>
                            {/* Decorative corner metallic precision screws */}
                            <div className="absolute top-4.5 left-6.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),_0_1px_2px_rgba(0,0,0,0.4)] border border-white/5 flex items-center justify-center pointer-events-none" >
                                <div className="w-1.5 h-[1px] bg-black/40 rotate-45" />
                            </div>
                            <div className="absolute top-4.5 right-6.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),_0_1px_2px_rgba(0,0,0,0.4)] border border-white/5 flex items-center justify-center pointer-events-none" >
                                <div className="w-1.5 h-[1px] bg-black/40 -rotate-45" />
                            </div>
                            
                            {/* Skeuomorphic Blinking Status LED Indicator */}
                            <div className="absolute top-4.5 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
                                <div className="w-2.5 h-2.5 rounded-full bg-black/50 border border-white/5 flex items-center justify-center shadow-inner">
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                        isRipple 
                                            ? "bg-amber-500 shadow-[0_0_8px_#d97706] dark:bg-emerald-400 dark:shadow-[0_0_8px_#10b981]" 
                                            : (celebrating ? "bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-ping" : "bg-[#1f2d25]")
                                    )} />
                                </div>
                            </div>
                            
                            {/* Beveled Screen Surround (Precision-milled Bezel) */}
                            <div className={cn(
                                "w-full bg-gradient-to-b from-[#18181b] to-[#09090b] rounded-2xl border-2 px-3 py-2.5 shadow-[0_6px_15px_rgba(0,0,0,0.5),_inset_0_2px_4px_rgba(0,0,0,0.8),_0_0_15px_rgba(255,255,255,0.02)] flex flex-col items-center gap-1.5 relative overflow-hidden transition-all duration-500",
                                currentTallyTheme.bezel
                            )}>
                                {/* Glass shine overlay */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.08] pointer-events-none" />
                                
                                <span className={cn("text-[9px] font-bold tracking-[0.15em] uppercase leading-none transition-colors duration-500 text-center px-1", currentTallyTheme.bezelText)}>{t('tallyCounter', { defaultValue: 'TALLY COUNTER' })}</span>
                                
                                {/* Simulated Retro LCD Display (Flashes illuminated green on click) */}
                                <div className={cn(
                                    "w-full rounded-lg border-2 shadow-[inset_2px_3px_6px_rgba(0,0,0,0.5)] px-4 py-2 flex items-center justify-end h-[54px] relative overflow-hidden transition-all duration-150",
                                    isRipple ? "bg-[#c4dfcd] border-[#81a18c]" : "bg-[#b4ccbd] border-[#768c7e]"
                                )}>
                                    <div className="absolute inset-x-0 top-0 h-1.5 bg-black/10 pointer-events-none" />
                                    <div className="absolute inset-0 bg-amber-500/[0.02] dark:bg-emerald-500/[0.02] pointer-events-none" />
                                    
                                    {/* Scanline pattern overlay */}
                                    <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
                                         style={{
                                             backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.4) 50%)',
                                             backgroundSize: '100% 4px'
                                         }}
                                    />
                                    
                                    {/* Curved light reflection sheet across display */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.12] pointer-events-none transform -skew-x-12 origin-top-left scale-150" />

                                    <div className="relative flex items-center justify-end w-full h-full pr-1.5">
                                        {/* Crisp high-contrast live count */}
                                        <span className="text-3.5xl font-mono font-black text-[#0a120e] tracking-[0.18em] drop-shadow-[0.5px_0.5px_0px_rgba(255,255,255,0.45)] select-none">
                                            {(isCountdownMode ? count : (count % target === 0 && count > 0 ? target : count % target)).toString().padStart(4, '0')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between w-full px-2 text-[7.5px] font-bold text-white/40 tracking-[0.15em] uppercase leading-none">
                                    <span>{t('tallyCount', { defaultValue: 'COUNT' })}</span>
                                    <span>{t('tallyReset', { defaultValue: 'RESET' })}</span>
                                </div>
                            </div>

                            {/* Main Tap Button (Tactile Lathe-Brushed Dial) */}
                            <div className="w-28 h-28 rounded-full bg-black/55 shadow-[inset_0_4px_8px_rgba(0,0,0,0.85),_0_1px_1px_rgba(255,255,255,0.06)] border border-white/5 flex items-center justify-center mt-7 relative">
                                {/* Ring light reflection inside recess */}
                                <div className="absolute inset-0.5 rounded-full border border-white/[0.03] pointer-events-none" />
                                
                                {/* Concentric Golden Shockwave Ripple on press */}
                                <AnimatePresence>
                                    {isRipple && (
                                        <motion.div
                                            initial={{ scale: 0.85, opacity: 0.95 }}
                                            animate={{ scale: 1.45, opacity: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.28, ease: "easeOut" }}
                                            className="absolute inset-0 rounded-full bg-gradient-to-r from-islamic-gold/45 to-amber-500/20 pointer-events-none z-0 shadow-[0_0_20px_rgba(212,175,55,0.55)]"
                                        />
                                    )}
                                </AnimatePresence>
                                
                                {/* Particle spray burst centered inside the button recess */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                                    {particles.map((p) => {
                                        const rad = (p.angle * Math.PI) / 180;
                                        const tx = Math.cos(rad) * p.distance;
                                        const ty = Math.sin(rad) * p.distance;
                                        
                                        return (
                                            <motion.div
                                                key={p.id}
                                                initial={{ x: 0, y: 0, scale: 0.1, opacity: 1 }}
                                                animate={{ 
                                                    x: tx * 0.75, 
                                                    y: ty * 0.75, 
                                                    scale: 1.1, 
                                                    opacity: 0,
                                                    rotate: p.angle * 2.5
                                                }}
                                                transition={{ duration: 0.45, ease: "easeOut" }}
                                                className="absolute pointer-events-none"
                                            >
                                                <Star size={9} className="text-[#ffd700] fill-[#ffd700] drop-shadow-[0_0_6px_rgba(212,175,55,0.9)]" />
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.92, y: 3 }}
                                    onClick={(e) => {
                                        if (e.detail > 0) increment(); // Only mouse click, touch is handled below
                                    }}
                                    onTouchStart={(e) => {
                                        e.preventDefault();
                                    }}
                                    onTouchEnd={(e) => {
                                        e.preventDefault();
                                        increment();
                                    }}
                                    className={cn(
                                        "w-24 h-24 rounded-full bg-gradient-to-b shadow-[0_8px_20px_rgba(0,0,0,0.6),_inset_0_2px_4px_rgba(255,255,255,0.35)] flex items-center justify-center relative active:outline-none focus:outline-none transition-all duration-500",
                                        currentTallyTheme.button
                                    )}
                                >
                                    {/* Concentric circular grooves (simulating lathe brushed metal) */}
                                    <div className="absolute inset-1.5 border border-white/[0.08] rounded-full pointer-events-none" />
                                    <div className="absolute inset-3 border border-black/[0.12] rounded-full pointer-events-none" />
                                    <div className="absolute inset-5 border border-white/[0.05] rounded-full pointer-events-none" />
                                    <div className="absolute inset-7 border border-black/[0.08] rounded-full pointer-events-none" />
                                    
                                    {/* Center core cap to give a refined watch-dial look */}
                                    <div className="w-8 h-8 rounded-full bg-black/15 border border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)] flex items-center justify-center pointer-events-none">
                                        <div className="w-2.5 h-2.5 rounded-full bg-white/20 shadow-inner" />
                                    </div>
                                    
                                    {/* Highlight reflections */}
                                    <div className="absolute top-1.5 left-5 w-12 h-3.5 bg-gradient-to-b from-white/25 to-transparent rounded-full blur-[1px] rotate-[-5deg] pointer-events-none" />
                                </motion.button>
                            </div>

                            {/* Reset Button Assembly (Silver/Gold Metal Pin in Precision Milled Socket) */}
                            <div className="absolute bottom-[4.5rem] right-7 flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-black/45 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center border border-white/5">
                                    <motion.button
                                        whileTap={{ scale: 0.88, y: 1 }}
                                        onClick={() => reset()}
                                        onTouchStart={(e) => {
                                            e.preventDefault();
                                        }}
                                        onTouchEnd={(e) => {
                                            e.preventDefault();
                                            reset();
                                        }}
                                        className={cn(
                                            "w-6 h-6 rounded-full bg-gradient-to-b shadow-md flex items-center justify-center active:outline-none focus:outline-none transition-all duration-500 relative",
                                            currentTallyTheme.reset
                                        )}
                                        title={t('confirmReset')}
                                    >
                                        {/* Center groove pin point */}
                                        <div className="w-1.5 h-1.5 rounded-full bg-black/25 border border-white/10 pointer-events-none" />
                                    </motion.button>
                                </div>
                            </div>
                        </div>

                        {/* Tally Casing Color Selector */}
                        <div className="flex items-center gap-3 mt-4 bg-white/70 border-[#E2D9C4] dark:bg-black/35 dark:border-white/10 px-4 py-2 rounded-full border backdrop-blur-md z-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {[
                                { id: 'emerald', name: t('tallyColors.emerald', { defaultValue: 'Zümrüt' }), bg: 'bg-[#064a2c] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]' },
                                { id: 'blue', name: t('tallyColors.blue', { defaultValue: 'Mavi' }), bg: 'bg-[#1d4ed8] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]' },
                                { id: 'red', name: t('tallyColors.red', { defaultValue: 'Yakut' }), bg: 'bg-[#b91c1c] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]' },
                                { id: 'gold', name: t('tallyColors.gold', { defaultValue: 'Altın' }), bg: 'bg-[#d4af37] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]' },
                                { id: 'grey', name: t('tallyColors.grey', { defaultValue: 'Gümüş' }), bg: 'bg-[#3f3f46] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]' }
                            ].map((col) => (
                                <button
                                    key={col.id}
                                    onClick={() => {
                                        if (col.id !== 'emerald' && !isPremium()) {
                                            navigate('/premium');
                                            return;
                                        }
                                        setTallyColor(col.id);
                                        localStorage.setItem('dhikr_tally_color', col.id);
                                        if (hapticsMode !== 'off') {
                                            try {
                                                haptics.selection();
                                            } catch (e) {}
                                        }
                                    }}
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center border transition-all active:scale-90 relative",
                                        tallyColor === col.id ? "border-islamic-gold scale-110 shadow-[0_0_10px_rgba(212,175,55,0.4)]" : "border-stone-300 dark:border-white/20 opacity-55 hover:opacity-90"
                                    )}
                                    title={col.name}
                                >
                                    <div className={cn("w-6 h-6 rounded-full shadow-md flex items-center justify-center relative", col.bg)}>
                                        {col.id !== 'emerald' && !isPremium() && (
                                            <Crown size={8} className="text-white absolute fill-white" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Round indicator overlay badge below casing */}
                        <div className={cn(
                            "mt-4 px-4 py-1.5 rounded-full border flex items-center gap-1.5 backdrop-blur-md transition-all duration-500",
                            currentTallyTheme.badge
                        )}>
                            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{t('round')}:</span>
                            <span className="text-xs font-mono font-bold">{Math.floor(count / target) + 1}</span>
                        </div>
                    </div>
                )}

                {/* Cumulative Counter Card - Compact floating pill */}
                <div className="relative bg-white/80 border-[#E2D9C4] hover:bg-[#FFFDF6] dark:bg-white/[0.07] dark:border-white/15 dark:hover:bg-white/10 backdrop-blur-md px-6 py-3.5 rounded-full border flex items-center justify-between gap-4 shadow-xl max-w-[320px] mx-auto w-full mt-14 transition-all hover:border-islamic-green/40 dark:hover:border-islamic-gold/40 dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    <button
                        onClick={() => {
                            setTempTotal('');
                            setShowTotalModal(true);
                        }}
                        className="flex items-center gap-3.5 text-left active:scale-[0.97] transition-transform flex-1 py-1"
                    >
                        <div className="p-1.5 bg-islamic-green/15 dark:bg-islamic-gold/20 rounded-full shrink-0">
                            <Star size={18} className="text-islamic-green dark:text-islamic-gold dark:drop-shadow-[0_0_6px_rgba(212,175,55,0.6)]" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-[10px] font-bold text-stone-400 dark:text-white/50 uppercase tracking-[0.15em] leading-none mb-1 flex items-center gap-1">
                                {t('totalDhikr')}
                                <Edit3 size={11} className="text-islamic-green/80 dark:text-islamic-gold/80 animate-pulse" />
                            </span>
                            <span className="text-lg font-mono font-bold text-islamic-green dark:text-islamic-gold leading-none">{totalCount.toLocaleString('tr-TR')}</span>
                        </div>
                    </button>

                    {/* Reset Total Button */}
                    <button
                        onClick={() => setShowTotalResetConfirm(true)}
                        className="p-2.5 bg-[#F0E8D5] hover:bg-[#E9DFC8] text-stone-400 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 rounded-full transition-all active:scale-90 border border-[#E2D9C4] dark:border-white/10 shrink-0"
                        title={t('resetAllTooltip')}
                    >
                        <RotateCcw size={15} />
                    </button>

                    {/* Total Reset Confirmation Dialog */}
                    {showTotalResetConfirm && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center animate-in fade-in zoom-in duration-200">
                            <div className="absolute inset-0 bg-[#F6F0E1]/95 dark:bg-[#021a0f]/95 rounded-full backdrop-blur-md" />
                            <div className="relative text-center px-4 z-10 flex flex-col items-center justify-center h-full w-full">
                                <p className="text-[10px] text-stone-700 dark:text-white/90 font-bold uppercase tracking-wider mb-2 leading-none">{t('resetAllTitle')}</p>
                                <div className="flex gap-2.5 justify-center">
                                    <button
                                        onClick={() => setShowTotalResetConfirm(false)}
                                        className="px-4 py-1 rounded-full bg-[#E9DFC8] text-stone-600 dark:bg-white/15 dark:text-white/80 text-[10px] font-bold uppercase transition-all active:scale-95"
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        onClick={resetTotal}
                                        className="px-4 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase transition-all shadow-md shadow-red-500/20 active:scale-95"
                                    >
                                        {t('reset')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Quote / Inspiration */}
            <footer className="mt-4 text-center pb-6 z-10 px-10">
                <div className="relative inline-block px-12">
                    <div className="relative py-4 flex flex-col items-center">
                        <div className="absolute top-0 left-0 w-10 h-[1px] bg-gradient-to-r from-transparent to-islamic-gold/40" />
                        <div className="absolute top-0 right-0 w-10 h-[1px] bg-gradient-to-l from-transparent to-islamic-gold/40" />

                        <p className="text-islamic-green/80 dark:text-islamic-gold/80 italic font-serif text-sm leading-relaxed px-2">
                            {t('footerVerse')}
                        </p>

                        <div className="absolute bottom-0 left-0 w-10 h-[1px] bg-gradient-to-r from-transparent to-islamic-gold/40" />
                        <div className="absolute bottom-0 right-0 w-10 h-[1px] bg-gradient-to-l from-transparent to-islamic-gold/40" />
                    </div>
                    <p className="text-[9px] text-stone-400 dark:text-white/20 mt-4 font-bold uppercase tracking-[0.2em] font-sans">{t('footerVerseSource')}</p>
                </div>
            </footer>

            {/* Daily Dhikr Limit Overlay */}
            <AnimatePresence>
                {showDhikrLimit && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-white/70 dark:bg-black/30 backdrop-blur-md flex items-center justify-center z-[9999]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <motion.div
                            initial={{ scale: 0.85, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.85, y: 30 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="px-8 text-center"
                        >
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <svg width="96" height="96" viewBox="0 0 96 96" className="transform -rotate-90">
                                        <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="4" />
                                        <motion.circle
                                            cx="48" cy="48" r="42"
                                            fill="none"
                                            stroke="url(#goldGradZ)"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeDasharray={2 * Math.PI * 42}
                                            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                                            animate={{ strokeDashoffset: 0 }}
                                            transition={{ duration: 1.2, ease: 'easeOut' }}
                                        />
                                        <defs>
                                            <linearGradient id="goldGradZ" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#D4AF37" />
                                                <stop offset="100%" stopColor="#F5D68A" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-black text-islamic-green dark:text-islamic-gold">{DAILY_DHIKR_LIMIT}</span>
                                        <span className="text-[9px] text-islamic-green/50 dark:text-islamic-gold/50 font-bold uppercase tracking-widest">/ {DAILY_DHIKR_LIMIT}</span>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-white mb-2 leading-tight">
                                {t('dhikrLimit.title', { defaultValue: 'Günlük Zikir Hakkınız' })}<br />
                                <span className="text-islamic-green dark:text-islamic-gold">{t('dhikrLimit.completed', { defaultValue: 'Tamamlandı' })}</span>
                            </h3>

                            <p className="text-[13px] text-stone-500 dark:text-white/45 leading-relaxed mb-8">
                                {t('dhikrLimit.desc1', { defaultValue: 'Ücretsiz olarak günde' })} <span className="text-islamic-green/80 dark:text-islamic-gold/80 font-semibold">{t('dhikrLimit.count', { count: DAILY_DHIKR_LIMIT, defaultValue: `${DAILY_DHIKR_LIMIT} zikir` })}</span> {t('dhikrLimit.desc2', { defaultValue: 'çekebilirsiniz.' })}<br />
                                {t('dhikrLimit.desc3', { defaultValue: 'Sınırsız zikir için Premium\'a yükseltin.' })}
                            </p>

                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => { setShowDhikrLimit(false); navigate('/premium'); }}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-islamic-gold via-amber-400 to-islamic-gold text-[#0a2e1f] font-bold text-sm tracking-wide shadow-lg shadow-islamic-gold/20 flex items-center justify-center gap-2"
                            >
                                <Sparkles size={16} />
                                {t('dhikrLimit.cta', { defaultValue: 'Sınırsız Zikir — Premium' })}
                            </motion.button>

                            <button
                                onClick={() => {
                                    setShowDhikrLimit(false);
                                    import('@/services/adService').then(({ showInterstitialAd }) => showInterstitialAd()).catch(() => {});
                                }}
                                className="w-full mt-4 py-2 text-stone-400 hover:text-stone-600 dark:text-white/25 dark:hover:text-white/40 text-xs font-medium transition-colors"
                            >
                                {t('dhikrLimit.dismiss', { defaultValue: 'Yarın tekrar gel' })}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Countdown Completed Overlay */}


            {/* Haptic Mode Feedback Message */}
            <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                <div className={cn(
                    "bg-islamic-gold/90 text-[#021a0f] px-6 py-2 rounded-full font-bold text-xs shadow-2xl transition-all duration-500 transform translate-y-4 opacity-0 border border-white/20",
                    hapticMessage && "translate-y-0 opacity-100"
                )}>
                    {hapticMessage}
                </div>
            </div>

            {showTargetModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-md" onClick={() => setShowTargetModal(false)} />
                    <div className={cn(
                        "bg-[#FFFDF6] dark:bg-[#032e18] border border-[#E2D9C4] dark:border-white/10 rounded-[3rem] p-8 w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in slide-in-from-bottom-5 duration-300 overflow-hidden transition-all duration-300",
                        isTargetInputFocused && "-translate-y-[100px]"
                    )}>
                        <div className="absolute top-0 right-0 p-4">
                            <button onClick={() => setShowTargetModal(false)} className="text-stone-400 hover:text-stone-700 dark:text-white/40 dark:hover:text-white p-2">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-islamic-green/10 border-islamic-green/20 dark:bg-islamic-gold/10 dark:border-islamic-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border">
                                <Settings className="text-islamic-green dark:text-islamic-gold w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-islamic-green dark:text-islamic-gold mb-2">{t('setTarget')}</h3>
                            <p className="text-stone-500 dark:text-white/40 text-sm">{t('setTargetDesc', { name: activePreset.name })}</p>
                        </div>

                        <div className="relative mb-8">
                            <input
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={tempTarget}
                                onChange={(e) => {
                                    if (!isPremium()) return;
                                    let val = e.target.value;
                                    const parsed = parseInt(val, 10);
                                    if (!isNaN(parsed) && parsed > 999999) {
                                        val = "999999";
                                    }
                                    setTempTarget(val);
                                }}
                                onFocus={() => setIsTargetInputFocused(true)}
                                onBlur={() => setIsTargetInputFocused(false)}
                                readOnly={!isPremium()}
                                className={cn(
                                    "w-full bg-[#F0E8D5] border-[#E2D9C4] text-islamic-green focus:border-islamic-green/50 dark:bg-black/30 dark:border-white/10 dark:text-islamic-gold dark:focus:border-islamic-gold/50 border rounded-2xl py-5 px-6 text-4xl font-mono font-bold text-center focus:outline-none transition-all placeholder:opacity-20",
                                    !isPremium() && "opacity-50 cursor-not-allowed"
                                )}
                                placeholder="33"
                                autoFocus={isPremium()}
                            />
                            <div className="mt-3 flex gap-2 justify-center">
                                {[33, 99, 100, 313, 1000].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => isPremium() ? setTempTarget(v.toString()) : navigate('/premium')}
                                        className={cn(
                                            "text-[12px] font-bold px-3 py-1 rounded-lg border border-[#E2D9C4] dark:border-white/5 transition-all",
                                            isPremium()
                                                ? "bg-[#F0E8D5] hover:bg-islamic-green/15 hover:text-islamic-green dark:bg-white/5 dark:hover:bg-islamic-gold/20 dark:hover:text-islamic-gold"
                                                : "bg-[#F0E8D5] dark:bg-white/5 opacity-50"
                                        )}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => isPremium() ? handleSaveTarget() : navigate('/premium')}
                            className="w-full h-16 rounded-2xl bg-islamic-gold hover:bg-amber-600 text-[#021a0f] text-lg font-bold shadow-lg shadow-islamic-gold/20 flex items-center justify-center gap-3"
                        >
                            {isPremium() ? (
                                <><Check size={20} strokeWidth={3} /> {t('saveTarget')}</>
                            ) : (
                                <><Crown size={20} fill="currentColor" /> Premium</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {showTotalModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-md" onClick={() => setShowTotalModal(false)} />
                    <div className={cn(
                        "bg-[#FFFDF6] dark:bg-[#032e18] border border-[#E2D9C4] dark:border-white/10 rounded-[3rem] p-8 w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in slide-in-from-bottom-5 duration-300 overflow-hidden transition-all duration-300",
                        isTotalInputFocused && "-translate-y-[100px]"
                    )}>
                        <div className="absolute top-0 right-0 p-4">
                            <button onClick={() => setShowTotalModal(false)} className="text-stone-400 hover:text-stone-700 dark:text-white/40 dark:hover:text-white p-2">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-islamic-green/10 border-islamic-green/20 dark:bg-islamic-gold/10 dark:border-islamic-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border">
                                <Star className="text-islamic-green dark:text-islamic-gold w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-islamic-green dark:text-islamic-gold mb-2">{t('setTotalCount', { defaultValue: 'Toplam Zikri Ayarla' })}</h3>
                            <p className="text-stone-500 dark:text-white/40 text-sm">{t('setTotalCountDesc', { defaultValue: 'Başka yerde çektiğiniz zikirleri buraya eklemek için toplam zikir sayısını güncelleyebilirsiniz.' })}</p>
                        </div>

                        <div className="relative mb-8">
                            <input
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={tempTotal}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (!isNaN(val) && val > 999999) {
                                        setTempTotal('999999');
                                    } else {
                                        setTempTotal(e.target.value);
                                    }
                                }}
                                onFocus={() => setIsTotalInputFocused(true)}
                                onBlur={() => setIsTotalInputFocused(false)}
                                max="999999"
                                className="w-full bg-[#F0E8D5] border-[#E2D9C4] text-islamic-green focus:border-islamic-green/50 dark:bg-black/30 dark:border-white/10 dark:text-islamic-gold dark:focus:border-islamic-gold/50 border rounded-2xl py-5 px-6 text-4xl font-mono font-bold text-center focus:outline-none transition-all placeholder:opacity-20"
                                placeholder="1000"
                                autoFocus
                            />
                        </div>

                        <button
                            onClick={handleSaveTotal}
                            disabled={isNaN(parseInt(tempTotal, 10)) || parseInt(tempTotal, 10) <= 0}
                            className={cn(
                                "w-full h-16 rounded-2xl bg-islamic-gold hover:bg-amber-600 text-[#021a0f] text-lg font-bold shadow-lg shadow-islamic-gold/20 flex items-center justify-center gap-3 transition-all",
                                (isNaN(parseInt(tempTotal, 10)) || parseInt(tempTotal, 10) <= 0) && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Check size={20} strokeWidth={3} /> {t('save', { defaultValue: 'KAYDET' })}
                        </button>
                    </div>
                </div>
            )}

            {showResetConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[3px]" onClick={() => setShowResetConfirm(false)} />
                    <div className="bg-[#FFFDF6] border-[#E2D9C4] dark:bg-gradient-to-br dark:from-[#021f11]/95 dark:via-[#010e08]/98 dark:to-[#010e08]/95 dark:border-islamic-gold/20 border rounded-[2rem] p-6 w-full max-w-[290px] relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden text-center">
                        <div className="absolute top-0 right-0 p-3">
                            <button onClick={() => setShowResetConfirm(false)} className="text-stone-400 hover:text-stone-700 dark:text-white/30 dark:hover:text-white p-1 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex flex-col items-center mb-6">
                            <div className="w-12 h-12 bg-islamic-green/10 border-islamic-green/20 dark:bg-islamic-gold/10 dark:border-islamic-gold/20 rounded-full flex items-center justify-center mb-3 border dark:shadow-[0_0_15px_rgba(212,175,55,0.05)]">
                                <RotateCcw className="text-islamic-green dark:text-islamic-gold w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-serif font-bold text-islamic-green/90 dark:text-islamic-gold/90 mb-1">{t('resetDhikrTitle', { defaultValue: 'Zikri Sıfırla' })}</h3>
                            <p className="text-[11px] text-stone-500 dark:text-white/50 leading-relaxed px-2">{t('confirmReset')}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                className="flex-1 h-10 rounded-xl bg-[#F0E8D5] hover:bg-[#E9DFC8] text-stone-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/70 text-xs font-semibold transition-all active:scale-95 border border-[#E2D9C4] dark:border-white/10"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleResetConfirm}
                                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-islamic-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#010e08] text-xs font-bold shadow-md shadow-islamic-gold/15 transition-all active:scale-95"
                            >
                                {t('reset')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Style for hiding scrollbar */}
            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* Quick Settings Bottom Sheet */}
            <AnimatePresence>
                {showQuickSettings && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-[3px] z-[90]"
                            onClick={() => setShowQuickSettings(false)}
                        />

                        {/* Sheet */}
                        <motion.div
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={{ top: 0.05, bottom: 0.95 }}
                            onDragEnd={(event, info) => {
                                if (info.offset.y > 100 || info.velocity.y > 150) {
                                    setShowQuickSettings(false);
                                }
                            }}
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            className="fixed inset-x-0 bottom-0 bg-[#F6F0E1] dark:bg-gradient-to-b dark:from-[#06331c] dark:via-[#021f11] dark:to-[#010e08] border-t border-[#E2D9C4] dark:border-white/10 rounded-t-[2.5rem] px-6 pb-8 pt-4 z-[100] shadow-[0_-10px_35px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_35px_rgba(0,0,0,0.6)] flex flex-col gap-4 no-tap-anywhere"
                        >
                            {/* Drag handle / Grabber */}
                            <div
                                className="w-14 h-1.5 bg-stone-300 hover:bg-stone-400 dark:bg-white/20 dark:hover:bg-white/30 rounded-full mx-auto cursor-pointer transition-colors"
                                onClick={() => setShowQuickSettings(false)}
                            />

                            {/* Header */}
                            <div className="flex justify-between items-center pb-2 relative">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-islamic-green/10 border-islamic-green/20 dark:bg-islamic-gold/15 dark:border-islamic-gold/20 rounded-xl border dark:shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                                        <Sparkles className="w-5 h-5 text-islamic-green dark:text-islamic-gold animate-pulse" />
                                    </div>
                                    <h3 className="text-xl font-serif font-black text-islamic-green dark:text-transparent dark:bg-gradient-to-r dark:from-amber-200 dark:via-islamic-gold dark:to-amber-500 dark:bg-clip-text uppercase tracking-wider">
                                        {t('quickSettings', { defaultValue: 'Hızlı Ayarlar' })}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowQuickSettings(false)}
                                    className="p-2 rounded-full bg-[#F0E8D5] hover:bg-[#E9DFC8] text-stone-500 hover:text-stone-800 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/55 dark:hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Decorative line */}
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-islamic-green/25 dark:via-islamic-gold/30 to-transparent -mt-2" />

                            {/* Settings Container */}
                            <div className="flex flex-col bg-[#FFFDF6] dark:bg-black/35 rounded-3xl border border-[#E2D9C4] dark:border-islamic-gold/15 divide-y divide-stone-100 dark:divide-white/5 overflow-hidden shadow-md dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.5)]">
                                
                                {/* Sound Row */}
                                <div className="flex items-center justify-between p-5">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-[#F0E8D5] border border-[#E2D9C4] text-islamic-green dark:bg-white/5 dark:border-white/10 dark:text-islamic-gold flex items-center justify-center dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
                                            {soundMode === 'mute' ? <VolumeX size={18} className="text-stone-400 dark:text-white/40" /> : <Volume2 size={18} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-base font-bold text-stone-800 dark:text-white/95 tracking-wide">{t('soundLabel', { defaultValue: 'Ses Efekti' })}</span>
                                            <span className="text-xs text-stone-500 dark:text-white/50 leading-relaxed mt-0.5">{soundMode === 'mute' ? t('sound.mute', { defaultValue: 'Kapalı' }) : t('sound.click', { defaultValue: 'Klik Sesi' })}</span>
                                        </div>
                                    </div>
                                    {/* Toggle Switch */}
                                    <div 
                                        onClick={() => {
                                            const newMode = soundMode === 'mute' ? 'digital' : 'mute';
                                            setSoundMode(newMode);
                                            localStorage.setItem('dhikr_sound_mode', newMode);
                                            const labels = {
                                                digital: t('sound.click', { defaultValue: 'Klik Sesi' }),
                                                mute: t('sound.mute', { defaultValue: 'Ses Kapalı' })
                                            };
                                            setHapticMessage(labels[newMode]);
                                            try { haptics.medium(); } catch(e){}
                                        }}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        className={cn(
                                            "w-12 h-7 rounded-full p-0.5 cursor-pointer transition-all duration-200 relative flex items-center shadow-md",
                                            soundMode !== 'mute' ? "bg-gradient-to-r from-amber-500 to-islamic-gold shadow-[0_0_12px_rgba(212,175,55,0.35)]" : "bg-stone-300 dark:bg-white/10"
                                        )}
                                    >
                                        <div 
                                            className={cn(
                                                "w-6 h-6 rounded-full bg-[#FFFDF6] shadow-md transform transition-transform duration-200",
                                                soundMode !== 'mute' ? "translate-x-5" : "translate-x-0"
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Vibration Row */}
                                <div className="flex flex-col gap-3.5 p-5">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-[#F0E8D5] border border-[#E2D9C4] text-islamic-green dark:bg-white/5 dark:border-white/10 dark:text-islamic-gold flex items-center justify-center dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
                                            <Smartphone size={18} className={hapticsMode !== 'off' ? "text-islamic-green dark:text-islamic-gold" : "text-stone-400 dark:text-white/40"} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-base font-bold text-stone-800 dark:text-white/95 tracking-wide">{t('vibrationLabel', { defaultValue: 'Titreşim Geri Bildirimi' })}</span>
                                            <span className="text-xs text-stone-500 dark:text-white/50 leading-relaxed mt-0.5">
                                                {hapticsMode === 'all' ? t('vibration.everyClick', { defaultValue: 'Her tıklamada titreşir' }) :
                                                 hapticsMode === 'target' ? t('vibration.targetOnly', { defaultValue: 'Sadece hedefe ulaşıldığında titreşir' }) :
                                                 t('vibration.off', { defaultValue: 'Titreşim kapalı' })}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Segmented Picker */}
                                    <div className="grid grid-cols-3 bg-[#F0E8D5] border-[#E2D9C4] dark:bg-black/45 dark:border-white/10 border rounded-2xl p-0.5 select-none relative mt-1 overflow-hidden shadow-inner">
                                        {[
                                            { id: 'off', label: t('vibration.offShort', { defaultValue: 'Kapalı' }) },
                                            { id: 'target', label: t('vibration.targetOnlyShort', { defaultValue: 'Hedef' }) },
                                            { id: 'all', label: t('vibration.everyClickShort', { defaultValue: 'Her Tık' }) }
                                        ].map((opt) => {
                                            const isSelected = hapticsMode === opt.id;
                                            return (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => {
                                                        setHapticsMode(opt.id);
                                                        localStorage.setItem('dhikr_haptics_mode', opt.id);
                                                        const labels = {
                                                            all: t('vibration.everyClick'),
                                                            target: t('vibration.targetOnly'),
                                                            off: t('vibration.off')
                                                        };
                                                        setHapticMessage(labels[opt.id]);
                                                        try { haptics.medium(); } catch (e) {}
                                                    }}
                                                    onTouchStart={(e) => e.stopPropagation()}
                                                    className={cn(
                                                        "py-2.5 text-xs font-bold rounded-xl z-10 transition-all text-center relative flex items-center justify-center active:scale-95 duration-150",
                                                        isSelected ? "text-[#021a0f]" : "text-stone-500 dark:text-white/60"
                                                    )}
                                                >
                                                    {isSelected && (
                                                        <motion.div 
                                                            layoutId="activeVibeSegment"
                                                            className="absolute inset-0 bg-gradient-to-r from-amber-400 to-[#d4af37] rounded-xl -z-10 shadow-[0_2px_8px_rgba(212,175,55,0.35)]"
                                                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                                        />
                                                    )}
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Fullscreen Click Row */}
                                <div className="flex items-center justify-between p-5">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-[#F0E8D5] border border-[#E2D9C4] text-islamic-green dark:bg-white/5 dark:border-white/10 dark:text-islamic-gold flex items-center justify-center dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
                                            <Fingerprint size={18} className={isFullScreenTap ? "text-islamic-green dark:text-islamic-gold" : "text-stone-400 dark:text-white/40"} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-base font-bold text-stone-800 dark:text-white/95 tracking-wide">{t('fullscreenTap', { defaultValue: 'Tam Ekran Tıklama' })}</span>
                                            <span className="text-xs text-stone-500 dark:text-white/50 leading-relaxed mt-0.5">{t('fullScreenTapDesc', { defaultValue: 'Ekranın herhangi bir yerine dokunarak çekim yapın' })}</span>
                                        </div>
                                    </div>
                                    {/* Toggle Switch */}
                                    <div 
                                        onClick={() => {
                                            const newMode = !isFullScreenTap;
                                            setIsFullScreenTap(newMode);
                                            localStorage.setItem('dhikr_fullscreen_tap', String(newMode));
                                            setHapticMessage(newMode ? t('fullScreenTap.enabled', { defaultValue: 'Ekran Dokunma Açık' }) : t('fullScreenTap.disabled', { defaultValue: 'Ekran Dokunma Kapalı' }));
                                            try { haptics.medium(); } catch(e){}
                                        }}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        className={cn(
                                            "w-12 h-7 rounded-full p-0.5 cursor-pointer transition-all duration-200 relative flex items-center shadow-md",
                                            isFullScreenTap ? "bg-gradient-to-r from-amber-500 to-islamic-gold shadow-[0_0_12px_rgba(212,175,55,0.35)]" : "bg-stone-300 dark:bg-white/10"
                                        )}
                                    >
                                        <div 
                                            className={cn(
                                                "w-6 h-6 rounded-full bg-[#FFFDF6] shadow-md transform transition-transform duration-200",
                                                isFullScreenTap ? "translate-x-5" : "translate-x-0"
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Volume Button Control Row - Conditional */}
                                {Capacitor.isNativePlatform() && (
                                    <div className="flex items-center justify-between p-5">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-[#F0E8D5] border border-[#E2D9C4] text-islamic-green dark:bg-white/5 dark:border-white/10 dark:text-islamic-gold flex items-center justify-center dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
                                                <Sliders size={18} className={volumeButtonsEnabled ? "text-islamic-green dark:text-islamic-gold" : "text-stone-400 dark:text-white/40"} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-base font-bold text-stone-800 dark:text-white/95 tracking-wide">{t('volumeButtonsLabel', { defaultValue: 'Ses Tuşları' })}</span>
                                                <span className="text-xs text-stone-500 dark:text-white/50 leading-relaxed mt-0.5">{t('volumeButtonsDesc', { defaultValue: 'Cihazın fiziksel ses tuşları ile zikir çekin' })}</span>
                                            </div>
                                        </div>
                                        {/* Toggle Switch */}
                                        <div 
                                            onClick={() => {
                                                const newMode = !volumeButtonsEnabled;
                                                setVolumeButtonsEnabled(newMode);
                                                localStorage.setItem('dhikr_volume_buttons', String(newMode));
                                                setHapticMessage(newMode ? t('volumeButtons.enabled', { defaultValue: 'Ses Tuşları ile Çekim Açık' }) : t('volumeButtons.disabled', { defaultValue: 'Ses Tuşları ile Çekim Kapalı' }));
                                                try { haptics.medium(); } catch(e){}
                                            }}
                                            onTouchStart={(e) => e.stopPropagation()}
                                            className={cn(
                                                "w-12 h-7 rounded-full p-0.5 cursor-pointer transition-all duration-200 relative flex items-center shadow-md",
                                                volumeButtonsEnabled ? "bg-gradient-to-r from-amber-500 to-islamic-gold shadow-[0_0_12px_rgba(212,175,55,0.35)]" : "bg-stone-300 dark:bg-white/10"
                                            )}
                                        >
                                            <div 
                                                className={cn(
                                                    "w-6 h-6 rounded-full bg-[#FFFDF6] shadow-md transform transition-transform duration-200",
                                                    volumeButtonsEnabled ? "translate-x-5" : "translate-x-0"
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>


            {/* Dhikr Picker Bottom Sheet */}
            <DhikrPickerSheet
                isOpen={showDhikrPicker}
                onClose={() => setShowDhikrPicker(false)}
                activePreset={activePreset}
                dhikrPresets={DHIKR_PRESETS}
                onSelect={handleDhikrSelect}
            />
        </div>
    );
}