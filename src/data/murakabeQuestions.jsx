import {
    Moon, Heart, HandHeart, Wind, MessageCircle, BookOpen, Utensils, Eye,
    Scale, Gift, Cloud, Hourglass, Sun, VolumeX, Droplets, Compass, Users,
    CheckCircle, ArrowDown, RefreshCcw, Leaf, Clock, Smile, Star, Shield
} from 'lucide-react';

export const QUESTION_POOL = [
    {
        id: 1,
        text: { tr: "Bugün namazlarını huşu içinde kılabildin mi?", en: "Were you able to pray with devotion today?" },
        type: "positive",
        icon: Moon
    },
    {
        id: 2,
        text: { tr: "Bugün bilerek bir kalp kırdın mı?", en: "Did you knowingly hurt someone's feelings today?" },
        type: "negative",
        icon: Heart
    },
    {
        id: 3,
        text: { tr: "Bugün dilini gıybetten ve yalandan korudun mu?", en: "Did you guard your tongue from gossip and lies today?" },
        type: "positive",
        icon: MessageCircle
    },
    {
        id: 4,
        text: { tr: "Bugün Allah için bir iyilik yaptın mı?", en: "Did you do a good deed for the sake of Allah today?" },
        type: "positive",
        icon: HandHeart
    },
    {
        id: 5,
        text: { tr: "Bugün öfkeni yutabildin mi?", en: "Were you able to control your anger today?" },
        type: "positive",
        icon: Wind
    },
    {
        id: 6,
        text: { tr: "Bugün Kuran-ı Kerim'den en az bir sayfa okudun mu?", en: "Did you read at least one page of the Quran today?" },
        type: "positive",
        icon: BookOpen
    },
    {
        id: 7,
        text: { tr: "Bugün Peygamberimize (s.a.v) salavat getirdin mi?", en: "Did you send blessings upon the Prophet (ﷺ) today?" },
        type: "positive",
        icon: Star
    },
    {
        id: 8,
        text: { tr: "Bugün yiyip içtiklerinin helal olmasına dikkat ettin mi?", en: "Did you ensure your food and drink were halal today?" },
        type: "positive",
        icon: Utensils
    },
    {
        id: 9,
        text: { tr: "Bugün gözlerini haramdan sakındın mı?", en: "Did you lower your gaze from what is forbidden today?" },
        type: "positive",
        icon: Eye
    },
    {
        id: 10,
        text: { tr: "Bugün işinde veya okulunda dürüst davrandın mı?", en: "Were you honest at work or school today?" },
        type: "positive",
        icon: Scale
    },
    {
        id: 11,
        text: { tr: "Bugün bir yoksula veya ihtiyacı olana yardım ettin mi? (Sadaka/Gülümseme)", en: "Did you help someone in need today? (Charity/A smile)" },
        type: "positive",
        icon: Gift
    },
    {
        id: 12,
        text: { tr: "Bugün ölümü ve ahireti tefekkür ettin mi?", en: "Did you reflect on death and the hereafter today?" },
        type: "positive",
        icon: Cloud
    },
    {
        id: 13,
        text: { tr: "Bugün başına gelen bir sıkıntıya sabrettin mi?", en: "Did you show patience with a hardship you faced today?" },
        type: "positive",
        icon: Hourglass
    },
    {
        id: 14,
        text: { tr: "Bugün sahip olduğun nimetler için Allah'a şükrettin mi?", en: "Did you thank Allah for the blessings you have today?" },
        type: "positive",
        icon: Sun
    },
    {
        id: 15,
        text: { tr: "Bugün gereksiz tartışmalardan uzak durdun mu?", en: "Did you avoid unnecessary arguments today?" },
        type: "positive",
        icon: VolumeX
    },
    {
        id: 16,
        text: { tr: "Bugün israf etmekten (zaman, yemek, su) kaçındın mı?", en: "Did you avoid wasteful use of time, food, or water today?" },
        type: "positive",
        icon: Droplets
    },
    {
        id: 17,
        text: { tr: "Bugün niyetlerini Allah rızası için tazeledin mi?", en: "Did you renew your intentions for the sake of Allah today?" },
        type: "positive",
        icon: Compass
    },
    {
        id: 18,
        text: { tr: "Bugün bir Müslüman kardeşine gıyabında dua ettin mi?", en: "Did you make dua for a fellow Muslim in their absence today?" },
        type: "positive",
        icon: Users
    },
    {
        id: 19,
        text: { tr: "Bugün verdiğin sözleri tutabildin mi?", en: "Did you keep your promises today?" },
        type: "positive",
        icon: CheckCircle
    },
    {
        id: 20,
        text: { tr: "Bugün başkalarına karşı kibirlenmekten sakındın mı?", en: "Did you avoid being arrogant toward others today?" },
        type: "positive",
        icon: ArrowDown
    },
    {
        id: 21,
        text: { tr: "Bugün yaptığın hatalar için tövbe istiğfar ettin mi?", en: "Did you repent and seek forgiveness for your mistakes today?" },
        type: "positive",
        icon: RefreshCcw
    },
    {
        id: 22,
        text: { tr: "Bugün doğayı veya bir hayvanı incitmekten sakındın mı?", en: "Did you refrain from harming nature or animals today?" },
        type: "positive",
        icon: Leaf
    },
    {
        id: 23,
        text: { tr: "Bugün boş ve faydasız işlerle vaktini ziyan ettin mi?", en: "Did you waste your time on vain and useless matters today?" },
        type: "negative",
        icon: Clock
    },
    {
        id: 24,
        text: { tr: "Bugün komşuna veya arkadaşına güler yüz gösterdin mi?", en: "Did you greet your neighbor or friend with a kind face today?" },
        type: "positive",
        icon: Smile
    },
    {
        id: 25,
        text: { tr: "Bugün yatağa girdiğinde vicdanın rahat mıydı?", en: "Was your conscience at peace when you went to bed today?" },
        type: "positive",
        icon: Shield
    }
];
