import re

with open('src/pages/settings/LocationSettings.jsx', 'r') as f:
    content = f.read()

# First, remove TURKEY_CITIES
content = re.sub(r'const TURKEY_CITIES = \[.*?\];', '', content, flags=re.DOTALL)

# Now define LocationSelectionModal
new_modal_code = """
function LocationSelectionModal({ currentCountry, currentCity, onSelect, onClose, t }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [mode, setMode] = useState('country'); // 'country' or 'city'
    const [selectedCountry, setSelectedCountry] = useState(currentCountry || 'Turkey');
    const [countriesData, setCountriesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { selection, success, medium } = useHaptics();

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                // Check if we have cached data
                const cached = localStorage.getItem('countries_data_cache');
                if (cached) {
                    setCountriesData(JSON.parse(cached));
                    setLoading(false);
                }
                
                const response = await fetch('https://countriesnow.space/api/v0.1/countries');
                const result = await response.json();
                if (result && result.data) {
                    setCountriesData(result.data);
                    localStorage.setItem('countries_data_cache', JSON.stringify(result.data));
                }
            } catch (err) {
                console.error('Failed to fetch countries', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCountries();
    }, []);

    const filteredItems = useMemo(() => {
        if (mode === 'country') {
            return countriesData
                .map(d => d.country)
                .filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
        } else {
            const countryObj = countriesData.find(d => d.country === selectedCountry);
            if (!countryObj) return [];
            return countryObj.cities.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
        }
    }, [searchTerm, mode, countriesData, selectedCountry]);

    const handleSelect = (item) => {
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
                className="mt-auto h-[90vh] bg-white dark:bg-[#032e18] rounded-t-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
            >
                {/* Modal Header */}
                <div className="p-6 pb-4 border-b dark:border-white/5 bg-white/50 dark:bg-[#032e18]/50 backdrop-blur-xl sticky top-0 z-10 space-y-4">
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full mx-auto" />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {mode === 'city' && (
                                <button onClick={() => setMode('country')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                    <ChevronLeft size={24} className="text-gray-600 dark:text-gray-300" />
                                </button>
                            )}
                            <h2 className="text-2xl font-serif font-bold text-islamic-green dark:text-islamic-gold">
                                {mode === 'country' ? t('selectCountry', 'Select Country') : t('selectCity', 'Select City')}
                            </h2>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-gray-100 dark:bg-white/10">
                            <X size={20} />
                        </Button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder={mode === 'country' ? t('searchCountry', 'Search country...') : t('searchCity', 'Search city...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-2xl pl-12 pr-4 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-islamic-green dark:focus:ring-islamic-gold transition-all"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 animate-in fade-in duration-500">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4">
                            <Loader2 size={40} className="animate-spin text-islamic-green dark:text-islamic-gold" />
                            <p className="text-gray-500 font-medium">{t('loadingLocations', 'Loading locations...')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {filteredItems.map(item => (
                                <button
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
                                </button>
                            ))}
                            {filteredItems.length === 0 && (
                                <div className="text-center py-20 opacity-50">
                                    <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
                                    <p className="text-gray-500 font-medium">{t('noResults', 'No results found')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
"""

# Replace CitySelectionModal with new_modal_code
content = re.sub(r'function CitySelectionModal.*?return \(.*?\);\n}\n', new_modal_code, content, flags=re.DOTALL)

with open('src/pages/settings/LocationSettings.jsx', 'w') as f:
    f.write(content)

