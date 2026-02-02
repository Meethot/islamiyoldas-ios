import {
    Moon, Heart, HandHeart, Wind, MessageCircle, BookOpen, Utensils, Eye,
    Scale, Gift, Cloud, Hourglass, Sun, VolumeX, Droplets, Compass, Users,
    CheckCircle, ArrowDown, RefreshCcw, Leaf, Clock, Smile, Star, Shield
} from 'lucide-react';

export const QUESTION_POOL = [
    // Mevcut Sorular (1-5)
    {
        id: 1,
        text: "Bugün namazlarını huşu içinde kılabildin mi?",
        type: "positive",
        icon: Moon
    },
    {
        id: 2,
        text: "Bugün bilerek bir kalp kırdın mı?",
        type: "negative",
        icon: Heart
    },
    {
        id: 3,
        text: "Bugün dilini gıybetten ve yalandan korudun mu?",
        type: "positive",
        icon: MessageCircle
    },
    {
        id: 4,
        text: "Bugün Allah için bir iyilik yaptın mı?",
        type: "positive",
        icon: HandHeart
    },
    {
        id: 5,
        text: "Bugün öfkeni yutabildin mi?",
        type: "positive",
        icon: Wind
    },
    // YENİ EKLENEN SORULAR (6-25)
    {
        id: 6,
        text: "Bugün Kuran-ı Kerim'den en az bir sayfa okudun mu?",
        type: "positive",
        icon: BookOpen
    },
    {
        id: 7,
        text: "Bugün Peygamberimize (s.a.v) salavat getirdin mi?",
        type: "positive",
        icon: Star
    },
    {
        id: 8,
        text: "Bugün yiyip içtiklerinin helal olmasına dikkat ettin mi?",
        type: "positive",
        icon: Utensils
    },
    {
        id: 9,
        text: "Bugün gözlerini haramdan sakındın mı?",
        type: "positive",
        icon: Eye
    },
    {
        id: 10,
        text: "Bugün işinde veya okulunda dürüst davrandın mı?",
        type: "positive",
        icon: Scale
    },
    {
        id: 11,
        text: "Bugün bir yoksula veya ihtiyacı olana yardım ettin mi? (Sadaka/Gülümseme)",
        type: "positive",
        icon: Gift
    },
    {
        id: 12,
        text: "Bugün ölümü ve ahireti tefekkür ettin mi?",
        type: "positive",
        icon: Cloud
    },
    {
        id: 13,
        text: "Bugün başına gelen bir sıkıntıya sabrettin mi?",
        type: "positive",
        icon: Hourglass
    },
    {
        id: 14,
        text: "Bugün sahip olduğun nimetler için Allah'a şükrettin mi?",
        type: "positive",
        icon: Sun
    },
    {
        id: 15,
        text: "Bugün gereksiz tartışmalardan uzak durdun mu?",
        type: "positive",
        icon: VolumeX
    },
    {
        id: 16,
        text: "Bugün israf etmekten (zaman, yemek, su) kaçındın mı?",
        type: "positive",
        icon: Droplets
    },
    {
        id: 17,
        text: "Bugün niyetlerini Allah rızası için tazeledin mi?",
        type: "positive",
        icon: Compass
    },
    {
        id: 18,
        text: "Bugün bir Müslüman kardeşine gıyabında dua ettin mi?",
        type: "positive",
        icon: Users
    },
    {
        id: 19,
        text: "Bugün verdiğin sözleri tutabildin mi?",
        type: "positive",
        icon: CheckCircle
    },
    {
        id: 20,
        text: "Bugün başkalarına karşı kibirlenmekten sakındın mı?",
        type: "positive",
        icon: ArrowDown
    },
    {
        id: 21,
        text: "Bugün yaptığın hatalar için tövbe istiğfar ettin mi?",
        type: "positive",
        icon: RefreshCcw
    },
    {
        id: 22,
        text: "Bugün doğayı veya bir hayvanı incitmekten sakındın mı?",
        type: "positive",
        icon: Leaf
    },
    {
        id: 23,
        text: "Bugün boş ve faydasız işlerle vaktini ziyan ettin mi?",
        type: "negative",
        icon: Clock
    },
    {
        id: 24,
        text: "Bugün komşuna veya arkadaşına güler yüz gösterdin mi?",
        type: "positive",
        icon: Smile
    },
    {
        id: 25,
        text: "Bugün yatağa girdiğinde vicdanın rahat mıydı?",
        type: "positive",
        icon: Shield
    }
];
