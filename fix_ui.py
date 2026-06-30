import re

with open('src/pages/settings/LocationSettings.jsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "ChevronLeft, ChevronRight, MapPin, Crosshair, Navigation, Loader2,",
    "ChevronLeft, ChevronRight, MapPin, Globe, Crosshair, Navigation, Loader2,"
)

# 2. Update the Country icon
country_button = """                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-islamic-green/5 dark:bg-islamic-gold/10 rounded-2xl text-islamic-green dark:text-islamic-gold">
                                            <MapPin size={20} />
                                        </div>
                                        <div className="text-left">"""
new_country_button = """                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-islamic-green/5 dark:bg-islamic-gold/10 rounded-2xl text-islamic-green dark:text-islamic-gold">
                                            <Globe size={20} />
                                        </div>
                                        <div className="text-left">"""
content = content.replace(country_button, new_country_button)

# 3. Extract the Calculation Method out of the location card
old_calc_block = """                        {/* Calculation Method Button */}
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
                        </div>
                    </div>
                    <p className="px-2 text-[9px] text-gray-400 dark:text-gray-500 italic mt-4">"""

new_calc_block = """                    </div>

                    <p className="px-2 text-[9px] text-gray-400 dark:text-gray-500 italic mt-3 mb-6">
"""

# Now append the new card structure right below the italic description
old_hint_end = """                        {useAutoLocation
                            ? t('autoLocationHint')
                            : t('manualLocationHint')}
                    </p>
                </motion.section>"""

new_hint_end = """                        {useAutoLocation
                            ? t('autoLocationHint')
                            : t('manualLocationHint')}
                    </p>

                    {/* Calculation Method Card */}
                    <div className="bg-white dark:bg-[#032e18]/40 rounded-3xl border dark:border-white/5 overflow-hidden shadow-sm">
                        <button
                            onClick={() => { medium(); setIsCalcModalOpen(true); }}
                            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400">
                                    <Navigation size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">
                                        {t('calculationMethod', 'Hesaplama Yöntemi')}
                                    </p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                                        {CALCULATION_METHODS.find(m => m.id === calculationMethod)?.defaultName || 'Otomatik'}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-gray-300" />
                        </button>
                    </div>
                </motion.section>"""

content = content.replace(old_calc_block, new_calc_block)
content = content.replace(old_hint_end, new_hint_end)

with open('src/pages/settings/LocationSettings.jsx', 'w') as f:
    f.write(content)

