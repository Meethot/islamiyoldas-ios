import re

with open('src/pages/settings/LocationSettings.jsx', 'r') as f:
    content = f.read()

# 1. Update LocationSelectionModal definition to take i18n
modal_def = """function LocationSelectionModal({ currentCountry, currentCity, initialMode = 'country', onSelect, onClose, t }) {"""
new_modal_def = """function LocationSelectionModal({ currentCountry, currentCity, initialMode = 'country', onSelect, onClose, t, i18n }) {"""
content = content.replace(modal_def, new_modal_def)

# 2. Add translation helper inside the file
helper_code = """
const getTranslatedCountry = (iso2, englishName, lang) => {
    if (!iso2) return englishName;
    try {
        const displayNames = new Intl.DisplayNames([lang], { type: 'region' });
        return displayNames.of(iso2) || englishName;
    } catch (e) {
        return englishName;
    }
};

function SettingsToggle"""

content = content.replace("function SettingsToggle", helper_code)

# 3. Update filteredItems in LocationSelectionModal
old_filtered = """    const filteredItems = useMemo(() => {
        if (mode === 'country') {
            return countriesData
                .map(d => d.country)
                .filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
        } else {
            const countryObj = countriesData.find(d => d.country === selectedCountry);
            if (!countryObj) return [];
            return countryObj.cities.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
        }
    }, [searchTerm, mode, countriesData, selectedCountry]);"""

new_filtered = """    const filteredItems = useMemo(() => {
        if (mode === 'country') {
            return countriesData
                .map(d => {
                    const display = getTranslatedCountry(d.iso2, d.country, i18n.language);
                    return { original: d.country, display };
                })
                .filter(c => c.display.toLowerCase().includes(searchTerm.toLowerCase()) || c.original.toLowerCase().includes(searchTerm.toLowerCase()))
                .sort((a, b) => a.display.localeCompare(b.display, i18n.language));
        } else {
            const countryObj = countriesData.find(d => d.country === selectedCountry);
            if (!countryObj) return [];
            return countryObj.cities
                .map(c => ({ original: c, display: c }))
                .filter(c => c.display.toLowerCase().includes(searchTerm.toLowerCase()))
                .sort((a, b) => a.display.localeCompare(b.display, i18n.language));
        }
    }, [searchTerm, mode, countriesData, selectedCountry, i18n.language]);"""

content = content.replace(old_filtered, new_filtered)

# 4. Update rendering inside LocationSelectionModal to use .display and .original
old_item_render = """                                <button
                                    key={item}
                                    onClick={() => handleSelect(item)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
                                        (mode === 'country' ? selectedCountry === item : currentCity === item)
                                            ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] shadow-lg shadow-islamic-green/20"
                                            : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                                    )}
                                >
                                    <span className={cn("font-bold text-lg", (mode === 'country' ? selectedCountry === item : currentCity === item) ? "translate-x-2" : "group-hover:translate-x-2")} style={{ transition: 'transform 0.2s' }}>
                                        {item}
                                    </span>
                                    {(mode === 'country' ? selectedCountry === item : currentCity === item) && (
                                        <div className="bg-white/20 dark:bg-black/10 p-2 rounded-full">
                                            <Check size={20} className="stroke-[3]" />
                                        </div>
                                    )}
                                </button>"""

new_item_render = """                                <button
                                    key={item.original}
                                    onClick={() => handleSelect(item.original)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
                                        (mode === 'country' ? selectedCountry === item.original : currentCity === item.original)
                                            ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] shadow-lg shadow-islamic-green/20"
                                            : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                                    )}
                                >
                                    <span className={cn("font-bold text-lg", (mode === 'country' ? selectedCountry === item.original : currentCity === item.original) ? "translate-x-2" : "group-hover:translate-x-2")} style={{ transition: 'transform 0.2s' }}>
                                        {item.display}
                                    </span>
                                    {(mode === 'country' ? selectedCountry === item.original : currentCity === item.original) && (
                                        <div className="bg-white/20 dark:bg-black/10 p-2 rounded-full">
                                            <Check size={20} className="stroke-[3]" />
                                        </div>
                                    )}
                                </button>"""

content = content.replace(old_item_render, new_item_render)

# 5. Fix handleSelect
old_handle_select = """    const handleSelect = (item) => {
        selection();
        if (mode === 'country') {
            setSelectedCountry(item);
            setSearchTerm('');
            setMode('city'); // move to city selection
        } else {
            // City selected
            success();
            onSelect(selectedCountry, item);
            onClose();
        }
    };"""

new_handle_select = """    const handleSelect = (itemOriginal) => {
        selection();
        if (mode === 'country') {
            setSelectedCountry(itemOriginal);
            setSearchTerm('');
            setMode('city'); // move to city selection
        } else {
            // City selected
            success();
            onSelect(selectedCountry, itemOriginal);
            onClose();
        }
    };"""

content = content.replace(old_handle_select, new_handle_select)

# 6. Update LocationSettings component to use i18n
old_useTranslation = """    const { t } = useTranslation('settings');"""
new_useTranslation = """    const { t, i18n } = useTranslation('settings');"""
content = content.replace(old_useTranslation, new_useTranslation)

# 7. Add countriesData state in LocationSettings to translate the currently selected country name in the buttons
old_settings_states = """    const [useAutoLocation, setUseAutoLocation] = useState(false);"""
new_settings_states = """    const [useAutoLocation, setUseAutoLocation] = useState(false);
    const [globalCountriesData, setGlobalCountriesData] = useState([]);

    useEffect(() => {
        const cached = localStorage.getItem('countries_data_cache');
        if (cached) setGlobalCountriesData(JSON.parse(cached));
    }, []);

    const displayCountry = useMemo(() => {
        const obj = globalCountriesData.find(c => c.country === country);
        if (obj && obj.iso2) return getTranslatedCountry(obj.iso2, country, i18n.language);
        return country;
    }, [country, globalCountriesData, i18n.language]);"""

content = content.replace(old_settings_states, new_settings_states)

# 8. Update the rendering of Country in LocationSettings buttons
old_country_button_text = """<p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{country}</p>"""
new_country_button_text = """<p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{displayCountry}</p>"""
content = content.replace(old_country_button_text, new_country_button_text)

# 9. Pass i18n to LocationSelectionModal
old_modal_usage = """                        t={t}
                    />"""
new_modal_usage = """                        t={t}
                        i18n={i18n}
                    />"""
content = content.replace(old_modal_usage, new_modal_usage)

with open('src/pages/settings/LocationSettings.jsx', 'w') as f:
    f.write(content)

