/**
 * "Abdest ve Temizlik" merkezindeki konular.
 *
 * Sıra bilinçli: en sık sorulan ("Bozar mı?") en üstte, bir kez öğrenilip
 * bırakılan rehberler altta.
 *
 * `kind` konunun nasıl açılacağını söyler:
 *   guide → mevcut sihirbaz o konunun verisiyle açılır (yeni bileşen yok)
 *   sheet → alttan tabaka açılır (route DEĞİL: `useSmartPaywall` her route
 *           değişiminde sayaç artırıyor, konu gezen kullanıcı paywall yerdi)
 */
export const ABDEST_TOPICS = [
    { id: 'breakers', kind: 'sheet', arabic: 'نَوَاقِضُ الْوُضُوءِ', titleKey: 'topicBreakers', subKey: 'topicBreakersSub' },
    { id: 'abdest', kind: 'guide', arabic: 'اَلْوُضُوءُ', titleKey: 'topicWudu', subKey: 'topicWuduSub' },
    { id: 'mesh', kind: 'sheet', arabic: 'الْمَسْحُ عَلَى الْخُفَّيْنِ', titleKey: 'topicMesh', subKey: 'topicMeshSub' },
    { id: 'gusul', kind: 'guide', arabic: 'اَلْغُسْلُ', titleKey: 'topicGusul', subKey: 'topicGusulSub' },
    { id: 'teyemmum', kind: 'guide', arabic: 'اَلتَّيَمُّمُ', titleKey: 'topicTeyemmum', subKey: 'topicTeyemmumSub' },
];

/**
 * Mesh tabakasındaki fıkıh bölümleri — ekrandaki sıra.
 *
 * Burada durur çünkü iki yer okur: MeshSheet çizer, AbdestHub arar. İkisi
 * ayrı liste tutsaydı yeni bölüm eklendiğinde aranamaz kalırdı.
 */
export const MESH_SECTIONS = [
    'sureBaslangici', 'sartlar', 'nasilYapilir', 'sureler',
    'bozanlar', 'sureDolunca', 'mukimMisafirGecisi', 'mestNedir', 'sargiMesh',
];
