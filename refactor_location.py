import re

with open('src/pages/settings/LocationSettings.jsx', 'r') as f:
    content = f.read()

# Replace the useLocation destructuring
content = content.replace(
    "permissionStatus, setManualCity } = useLocation();",
    "permissionStatus, setManualLocation, manualCity, manualCountry } = useLocation();"
)

# Update state variables
content = content.replace(
    "const [city, setCityState] = useState(localStorage.getItem('userCity') || 'İstanbul');",
    "const [city, setCityState] = useState(manualCity || 'İstanbul');\n    const [country, setCountryState] = useState(manualCountry || 'Turkey');"
)

# Replace setCity wrapper
set_city_func = """
    const setCity = (newCity) => {
        setCityState(newCity);
        setManualCity(newCity);
    };
"""
new_set_city_func = """
    const setLocationData = (newCountry, newCity) => {
        setCountryState(newCountry);
        setCityState(newCity);
        setManualLocation(newCountry, newCity);
    };
"""
content = content.replace(set_city_func, new_set_city_func)

# We need to change the Manual City Selection UI
manual_location_ui = """                        {/* Manual City Selection */}
                        {!useAutoLocation && (
                            <button
                                onClick={() => { medium(); setIsCityModalOpen(true); }}
                                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-t dark:border-white/5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-islamic-green/5 dark:bg-islamic-gold/10 rounded-2xl text-islamic-green dark:text-islamic-gold">
                                        <MapPin size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">{t('yourCity')}</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{city}</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-gray-300" />
                            </button>
                        )}"""

new_manual_location_ui = """                        {/* Manual Location Selection */}
                        {!useAutoLocation && (
                            <div className="flex flex-col border-t dark:border-white/5">
                                <button
                                    onClick={() => { medium(); setIsCityModalOpen(true); }}
                                    className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-islamic-green/5 dark:bg-islamic-gold/10 rounded-2xl text-islamic-green dark:text-islamic-gold">
                                            <MapPin size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">{t('location', 'Konum')}</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{country}, {city}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300" />
                                </button>
                            </div>
                        )}"""

content = content.replace(manual_location_ui, new_manual_location_ui)

# Replace CitySelectionModal with LocationSelectionModal
modal_invocation = """            {/* City Selection Modal */}
            <AnimatePresence>
                {isCityModalOpen && (
                    <CitySelectionModal
                        currentCity={city}
                        onSelect={setCity}
                        onClose={() => setIsCityModalOpen(false)}
                        t={t}
                    />
                )}
            </AnimatePresence>"""

new_modal_invocation = """            {/* Location Selection Modal */}
            <AnimatePresence>
                {isCityModalOpen && (
                    <LocationSelectionModal
                        currentCountry={country}
                        currentCity={city}
                        onSelect={setLocationData}
                        onClose={() => setIsCityModalOpen(false)}
                        t={t}
                    />
                )}
            </AnimatePresence>"""

content = content.replace(modal_invocation, new_modal_invocation)

with open('src/pages/settings/LocationSettings.jsx', 'w') as f:
    f.write(content)
