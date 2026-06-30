import re

with open('src/pages/settings/LocationSettings.jsx', 'r') as f:
    content = f.read()

# Add CalculationMethodModal component
modal_code = """
const CALCULATION_METHODS = [
    { id: 'auto', nameKey: 'calcAuto', defaultName: 'Otomatik (Konuma Göre)', descKey: 'calcAutoDesc', defaultDesc: 'Türkiye için Diyanet, diğer ülkeler için MWL' },
    { id: '13', nameKey: 'calcDiyanet', defaultName: 'Diyanet İşleri Başkanlığı', descKey: 'calcDiyanetDesc', defaultDesc: 'İmsak: 18°, Yatsı: 17°' },
    { id: '3', nameKey: 'calcMwl', defaultName: 'Dünya İslam Birliği (MWL)', descKey: 'calcMwlDesc', defaultDesc: 'İmsak: 18°, Yatsı: 17°' },
    { id: '2', nameKey: 'calcIsna', defaultName: 'Kuzey Amerika (ISNA)', descKey: 'calcIsnaDesc', defaultDesc: 'İmsak: 15°, Yatsı: 15°' },
    { id: '4', nameKey: 'calcMekke', defaultName: 'Ümmü\\'l-Kurâ (Mekke)', descKey: 'calcMekkeDesc', defaultDesc: 'İmsak: 18.5°, Yatsı: 90 dk' },
    { id: '5', nameKey: 'calcMisir', defaultName: 'Mısır Ölçüm Kurumu', descKey: 'calcMisirDesc', defaultDesc: 'İmsak: 19.5°, Yatsı: 17.5°' },
    { id: '1', nameKey: 'calcKaraci', defaultName: 'Karaçi Üniversitesi', descKey: 'calcKaraciDesc', defaultDesc: 'İmsak: 18°, Yatsı: 18°' }
];

function CalculationMethodModal({ currentMethod, onSelect, onClose, t }) {
    const dragControls = useDragControls();
    const { selection, success } = useHaptics();

    const handleSelect = (id) => {
        selection();
        success();
        onSelect(id);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex flex-col"
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                drag="y"
                dragControls={dragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(e, info) => {
                    if (info.offset.y > 100 || info.velocity.y > 500) {
                        onClose();
                    }
                }}
                className="mt-auto max-h-[85vh] bg-white dark:bg-[#032e18] rounded-t-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
            >
                {/* Drag Handle */}
                <div 
                    className="w-full pt-4 pb-2 flex justify-center touch-none cursor-grab active:cursor-grabbing bg-white/50 dark:bg-[#032e18]/50 backdrop-blur-xl"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full pointer-events-none" />
                </div>

                <div className="px-6 pb-4 border-b dark:border-white/5 bg-white/50 dark:bg-[#032e18]/50 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between">
                    <h2 className="text-2xl font-serif font-bold text-islamic-green dark:text-islamic-gold">
                        {t('calculationMethod', 'Hesaplama Yöntemi')}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-gray-100 dark:bg-white/10">
                        <X size={20} />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {CALCULATION_METHODS.map(method => (
                        <button
                            key={method.id}
                            onClick={() => handleSelect(method.id)}
                            className={cn(
                                "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
                                currentMethod === method.id
                                    ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] shadow-lg shadow-islamic-green/20"
                                    : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                            )}
                        >
                            <div className="text-left">
                                <p className={cn("font-bold text-lg mb-1", currentMethod === method.id ? "" : "")}>
                                    {t(method.nameKey, method.defaultName)}
                                </p>
                                <p className={cn("text-xs", currentMethod === method.id ? "text-white/80 dark:text-black/60" : "text-gray-500")}>
                                    {t(method.descKey, method.defaultDesc)}
                                </p>
                            </div>
                            {currentMethod === method.id && (
                                <div className="bg-white/20 dark:bg-black/10 p-2 rounded-full shrink-0 ml-4">
                                    <Check size={20} className="stroke-[3]" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}

function LocationSelectionModal"""

content = content.replace("function LocationSelectionModal", modal_code)

# Import PrayerTimesContext
old_import_location = "import { useLocation } from '../../context/LocationContext';"
new_import_location = "import { useLocation } from '../../context/LocationContext';\nimport { usePrayerTimes } from '../../context/PrayerTimesContext';"
content = content.replace(old_import_location, new_import_location)


# Update LocationSettings states
old_settings_hook = """    const [useAutoLocation, setUseAutoLocation] = useState(false);"""
new_settings_hook = """    const [useAutoLocation, setUseAutoLocation] = useState(false);
    const { calculationMethod, setCalculationMethod, refreshPrayerTimes } = usePrayerTimes();
    const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);"""
content = content.replace(old_settings_hook, new_settings_hook)

# Add the UI button for calculation method
calc_button_ui = """                        {/* Calculation Method Button */}
                        <div className="flex flex-col border-t dark:border-white/5 mt-4 pt-2">
                            <button
                                onClick={() => { medium(); setIsCalcModalOpen(true); }}
                                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors rounded-2xl border border-gray-100 dark:border-white/5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400">
                                        <Navigation size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">{t('calculationMethod', 'Hesaplama Yöntemi')}</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                                            {CALCULATION_METHODS.find(m => m.id === calculationMethod)?.defaultName || 'Otomatik'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-gray-300" />
                            </button>
                        </div>"""

content = content.replace("                    </div>\n                    <p className=\"px-2 text-[9px] text-gray-400 dark:text-gray-500 italic\">\n                        {useAutoLocation", calc_button_ui + "\n                    </div>\n                    <p className=\"px-2 text-[9px] text-gray-400 dark:text-gray-500 italic mt-4\">\n                        {useAutoLocation")

# Add the AnimatePresence for the Calc Modal
calc_modal_ui = """
            {/* Calculation Method Modal */}
            <AnimatePresence>
                {isCalcModalOpen && (
                    <CalculationMethodModal
                        currentMethod={calculationMethod}
                        onSelect={(id) => {
                            setCalculationMethod(id);
                            refreshPrayerTimes();
                        }}
                        onClose={() => setIsCalcModalOpen(false)}
                        t={t}
                    />
                )}
            </AnimatePresence>
        </div>"""

content = content.replace("        </div>\n    );\n}", calc_modal_ui + "\n    );\n}")

with open('src/pages/settings/LocationSettings.jsx', 'w') as f:
    f.write(content)

