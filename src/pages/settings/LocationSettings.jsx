import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, MapPin, Globe, Crosshair, Navigation, Loader2,
    RefreshCw, AlertTriangle, Search, Check, X
} from 'lucide-react';
import { COUNTRY_CODES } from '@/data/countryCodes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { useLocation } from '../../context/LocationContext';
import { usePrayerTimes } from '../../context/PrayerTimesContext';
import { useTranslation } from 'react-i18next';
import { Geolocation } from '@capacitor/geolocation';




const getTranslatedCountry = (iso2, englishName, lang) => {
    if (!iso2) return englishName;
    try {
        const displayNames = new Intl.DisplayNames([lang], { type: 'region' });
        return displayNames.of(iso2) || englishName;
    } catch (e) {
        return englishName;
    }
};

function SettingsToggle({ icon: Icon, label, subtitle, active, onToggle }) {
    return (
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b last:border-0 dark:border-white/5"
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "p-3 rounded-2xl transition-colors",
                    active ? "bg-islamic-green/10 text-islamic-green dark:bg-islamic-gold/20 dark:text-islamic-gold" : "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500"
                )}>
                    <Icon size={20} />
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{label}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{subtitle}</p>
                </div>
            </div>
            <div className={cn(
                "w-12 h-6 rounded-full p-1 transition-colors relative",
                active ? "bg-islamic-green dark:bg-islamic-gold" : "bg-gray-200 dark:bg-white/10"
            )}>
                <div className={cn(
                    "w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
                    active ? "translate-x-6" : "translate-x-0"
                )} />
            </div>
        </button>
    );
}



const CALCULATION_METHODS = [
    { id: 'auto', nameKey: 'calcAuto', defaultName: 'Otomatik', descKey: 'calcAutoDesc', defaultDesc: 'Konumunuza göre: Diyanet (Türkiye)' },
    { id: '13', nameKey: 'calcDiyanet', defaultName: 'Diyanet (Türkiye)', descKey: 'calcDiyanetDesc', defaultDesc: 'Fajr: 18.0° | Isha: 17.0°' },
    { id: '3', nameKey: 'calcMwl', defaultName: 'Muslim World League', descKey: 'calcMwlDesc', defaultDesc: 'Fajr: 18.0° | Isha: 17.0°' },
    { id: '4', nameKey: 'calcMekke', defaultName: 'Umm al-Qura (Saudi Arabia)', descKey: 'calcMekkeDesc', defaultDesc: 'Fajr: 18.5° | Isha: 90 min' },
    { id: '2', nameKey: 'calcIsna', defaultName: 'ISNA (North America)', descKey: 'calcIsnaDesc', defaultDesc: 'Fajr: 15.0° | Isha: 15.0°' },
    { id: '1', nameKey: 'calcKaraci', defaultName: 'University of Karachi', descKey: 'calcKaraciDesc', defaultDesc: 'Fajr: 18.0° | Isha: 18.0°' },
    { id: '5', nameKey: 'calcMisir', defaultName: 'Egyptian General Authority', descKey: 'calcMisirDesc', defaultDesc: 'Fajr: 19.5° | Isha: 17.5°' },
    { id: '16', nameKey: 'calcDubai', defaultName: 'Dubai (UAE)', descKey: 'calcDubaiDesc', defaultDesc: 'Fajr: 18.2° | Isha: 18.2°' },
    { id: '10', nameKey: 'calcQatar', defaultName: 'Qatar', descKey: 'calcQatarDesc', defaultDesc: 'Fajr: 18.0° | Isha: 90 min' },
    { id: '9', nameKey: 'calcKuwait', defaultName: 'Kuwait', descKey: 'calcKuwaitDesc', defaultDesc: 'Fajr: 18.0° | Isha: 17.5°' },
    { id: '8', nameKey: 'calcGulf', defaultName: 'Gulf Region', descKey: 'calcGulfDesc', defaultDesc: 'Fajr: 19.5° | Isha: 90 min' },
    { id: '11', nameKey: 'calcMuis', defaultName: 'MUIS (Singapore)', descKey: 'calcMuisDesc', defaultDesc: 'Fajr: 20.0° | Isha: 18.0°' },
    { id: '20', nameKey: 'calcKemenag', defaultName: 'KEMENAG (Indonesia)', descKey: 'calcKemenagDesc', defaultDesc: 'Fajr: 20.0° | Isha: 18.0°' },
    { id: '21', nameKey: 'calcMorocco', defaultName: 'Morocco', descKey: 'calcMoroccoDesc', defaultDesc: 'Fajr: 19.0° | Isha: 17.0°' },
    { id: '19', nameKey: 'calcAlgeria', defaultName: 'Algeria', descKey: 'calcAlgeriaDesc', defaultDesc: 'Fajr: 18.0° | Isha: 17.0°' },
    { id: '18', nameKey: 'calcTunisia', defaultName: 'Tunisia', descKey: 'calcTunisiaDesc', defaultDesc: 'Fajr: 18.0° | Isha: 18.0°' },
    { id: '12', nameKey: 'calcUoif', defaultName: 'UOIF (France)', descKey: 'calcUoifDesc', defaultDesc: 'Fajr: 12.0° | Isha: 12.0°' },
    { id: '7', nameKey: 'calcTehran', defaultName: 'Institute of Geophysics (Tehran)', descKey: 'calcTehranDesc', defaultDesc: 'Fajr: 17.7° | Isha: 14.0°' }
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

// Two-step picker: country (static ISO list, localized via Intl — no API) →
// full city list from the bundled GeoNames dataset (public/data/cities/{cc}.json,
// every settlement with 5000+ population, offline, with coordinates — the old
// countriesnow.space list had huge gaps: 8 cities for all of Azerbaijan). Typing
// filters the bundled list; places too small for the dataset fall back to a
// Photon (OSM) search restricted to the selected country.
const PLACE_TYPES = new Set(['city', 'town', 'village', 'municipality', 'locality', 'district']);

// Diacritic-tolerant matching: "balakan" finds "Balakən", "uskudar" finds "Üsküdar"
const FOLD_MAP = { 'ə': 'e', 'ı': 'i', 'ğ': 'g', 'ş': 's', 'ç': 'c', 'ö': 'o', 'ü': 'u', 'ʻ': '' };
const foldText = (s) => (s || '')
    .toLowerCase()
    .replace(/[əığşçöüʻ]/g, c => FOLD_MAP[c] ?? c)
    .normalize('NFD').replace(/[̀-ͯ]/g, '');

// Long country lists (US ~5k towns) would jank the WebView — cap the DOM,
// typing narrows the rest
const MAX_LIST_ROWS = 400;

const parsePhotonPlaces = (data, countryCode) => {
    const seen = new Set();
    return (data.features || [])
        .filter(f => PLACE_TYPES.has(f.properties?.type) && f.properties?.name && f.geometry?.coordinates)
        .filter(f => (f.properties.countrycode || '').toLowerCase() === countryCode)
        .map(f => {
            const p = f.properties;
            return {
                name: p.name,
                region: p.state || p.county || '',
                countryCode: p.countrycode.toLowerCase(),
                country: p.country || '',
                latitude: f.geometry.coordinates[1],
                longitude: f.geometry.coordinates[0],
            };
        })
        .filter(pl => {
            const key = `${pl.name}|${pl.region}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
};

function LocationSelectionModal({ currentCountryCode, currentCity, initialMode = 'country', onSelect, onClose, t, i18n }) {
    const dragControls = useDragControls();
    const [searchTerm, setSearchTerm] = useState('');
    const [mode, setMode] = useState(initialMode); // 'country' or 'city'
    const [selectedCountry, setSelectedCountry] = useState(currentCountryCode || 'tr');
    const [cityList, setCityList] = useState(null); // null = loading bundled list
    const [results, setResults] = useState([]); // Photon fallback results
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const { selection, success } = useHaptics();

    // Static, localized country list — matches against both the user's language
    // and the English name ("Almanya" and "Germany" both find DE)
    const countries = useMemo(() => {
        let dn = null, dnEn = null;
        try { dn = new Intl.DisplayNames([i18n.language], { type: 'region' }); } catch { /* old WebView */ }
        try { dnEn = new Intl.DisplayNames(['en'], { type: 'region' }); } catch { /* old WebView */ }
        return COUNTRY_CODES
            .map(code => ({
                code: code.toLowerCase(),
                display: dn?.of(code) || dnEn?.of(code) || code,
                en: dnEn?.of(code) || code,
            }))
            .filter(c => c.display !== c.code.toUpperCase())
            .sort((a, b) => a.display.localeCompare(b.display, i18n.language));
    }, [i18n.language]);

    const filteredCountries = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return countries;
        return countries.filter(c => c.display.toLowerCase().includes(q) || c.en.toLowerCase().includes(q));
    }, [countries, searchTerm]);

    const selectedCountryObj = countries.find(c => c.code === selectedCountry);
    const selectedCountryEn = selectedCountryObj?.en || '';

    // Load the bundled city list for the selected country
    useEffect(() => {
        if (mode !== 'city') return;
        let cancelled = false;
        setCityList(null);
        fetch(`/data/cities/${selectedCountry}.json`)
            .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
            .then(rows => {
                if (cancelled) return;
                setCityList(rows.map(([name, region, lat, lon]) => ({
                    name,
                    region,
                    countryCode: selectedCountry,
                    country: selectedCountryObj?.display || '',
                    latitude: lat,
                    longitude: lon,
                })));
            })
            .catch(() => { if (!cancelled) setCityList([]); }); // tiny countries / fetch fail → Photon only
        return () => { cancelled = true; };
    }, [mode, selectedCountry]); // eslint-disable-line react-hooks/exhaustive-deps

    // Bundled list filtered by the query (diacritic-tolerant)
    const localMatches = useMemo(() => {
        if (mode !== 'city' || !cityList) return [];
        const q = foldText(searchTerm.trim());
        if (!q) return cityList.slice(0, MAX_LIST_ROWS);
        return cityList.filter(c => foldText(c.name).includes(q)).slice(0, MAX_LIST_ROWS);
    }, [mode, cityList, searchTerm]);

    // Photon fallback — only when the bundled list has no match for the query
    useEffect(() => {
        if (mode !== 'city') return;
        const query = searchTerm.trim();
        const needRemote = query.length >= 2 && cityList !== null && localMatches.length === 0;
        if (!needRemote) {
            setResults([]);
            setLoading(false);
            setFailed(false);
            return;
        }

        const controller = new AbortController();
        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const search = async (q) => {
                    const res = await fetch(
                        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=50`,
                        { signal: controller.signal }
                    );
                    return parsePhotonPlaces(await res.json(), selectedCountry);
                };
                let places = await search(query);
                // Common name crowded out of the global top-50 by other countries?
                // Retry with the country name appended — the filter still guards.
                if (places.length === 0 && selectedCountryEn) {
                    places = await search(`${query} ${selectedCountryEn}`);
                }
                setResults(places);
                setFailed(false);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('City search failed', err);
                    setResults([]);
                    setFailed(true);
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 450);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [searchTerm, mode, selectedCountry, selectedCountryEn, cityList, localMatches.length]);

    const handleCountrySelect = (country) => {
        selection();
        setSelectedCountry(country.code);
        setSearchTerm('');
        setResults([]);
        setMode('city');
    };

    const handleCitySelect = (place) => {
        selection();
        success();
        onSelect(place);
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
                className="mt-auto h-[90vh] bg-white dark:bg-[#032e18] rounded-t-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
            >
                {/* Drag Handle */}
                <div 
                    className="w-full pt-4 pb-2 flex justify-center touch-none cursor-grab active:cursor-grabbing bg-white/50 dark:bg-[#032e18]/50 backdrop-blur-xl"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full pointer-events-none" />
                </div>

                {/* Modal Header */}
                <div className="px-6 pb-4 border-b dark:border-white/5 bg-white/50 dark:bg-[#032e18]/50 backdrop-blur-xl sticky top-0 z-10 space-y-4">

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {mode === 'city' && (
                                <button onClick={() => { setMode('country'); setSearchTerm(''); setResults([]); }} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
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
                        {mode === 'city' && loading && (
                            <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-islamic-green dark:text-islamic-gold" />
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 gap-2">
                        {mode === 'country' && filteredCountries.map(country => {
                            const isCurrent = selectedCountry === country.code;
                            return (
                                <button
                                    key={country.code}
                                    onClick={() => handleCountrySelect(country)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group text-left",
                                        isCurrent
                                            ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] shadow-lg shadow-islamic-green/20"
                                            : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                                    )}
                                >
                                    <span className={cn("font-bold text-lg", isCurrent ? "translate-x-2" : "group-hover:translate-x-2")} style={{ transition: 'transform 0.2s' }}>
                                        {country.display}
                                    </span>
                                    {isCurrent && (
                                        <div className="bg-white/20 dark:bg-black/10 p-2 rounded-full shrink-0 ml-4">
                                            <Check size={20} className="stroke-[3]" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                        {mode === 'country' && filteredCountries.length === 0 && (
                            <div className="text-center py-20 opacity-50">
                                <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500 font-medium">{t('noResults', 'No results found')}</p>
                            </div>
                        )}

                        {mode === 'city' && cityList === null && (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
                                <Loader2 size={40} className="animate-spin text-islamic-green dark:text-islamic-gold" />
                                <p className="text-gray-500 font-medium">{t('loadingLocations', 'Loading locations...')}</p>
                            </div>
                        )}
                        {mode === 'city' && cityList !== null && (localMatches.length > 0 ? localMatches : results).map(place => {
                            const isCurrent = currentCity === place.name;
                            return (
                                <button
                                    key={`${place.name}|${place.region}|${place.latitude}`}
                                    onClick={() => handleCitySelect(place)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group text-left",
                                        isCurrent
                                            ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] shadow-lg shadow-islamic-green/20"
                                            : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                                    )}
                                >
                                    <div className={cn(isCurrent ? "translate-x-2" : "group-hover:translate-x-2")} style={{ transition: 'transform 0.2s' }}>
                                        <p className="font-bold text-lg leading-tight">{place.name}</p>
                                        {place.region && (
                                            <p className={cn("text-xs mt-0.5", isCurrent ? "text-white/70 dark:text-black/50" : "text-gray-400 dark:text-gray-500")}>
                                                {place.region}
                                            </p>
                                        )}
                                    </div>
                                    {isCurrent && (
                                        <div className="bg-white/20 dark:bg-black/10 p-2 rounded-full shrink-0 ml-4">
                                            <Check size={20} className="stroke-[3]" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                        {mode === 'city' && cityList !== null && localMatches.length === 0 && results.length === 0 && !loading && (
                            <div className="text-center py-20 opacity-50">
                                <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500 font-medium">
                                    {searchTerm.trim().length < 2
                                        ? t('searchCity', 'Search city...')
                                        : (failed ? t('locationFailed', 'Location failed') : t('noResults', 'No results found'))}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function LocationSettings() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('settings');
    const { selection, success, medium } = useHaptics();
    const { latitude, longitude, loading: locationLoading, hasLocation, error: locationError, refreshLocation, permissionStatus, setManualLocation, disableManualLocation, storedManualCity, storedManualCountry } = useLocation();

    const [city, setCityState] = useState(storedManualCity || 'İstanbul');
    const [country, setCountryState] = useState(storedManualCountry || 'Turkey');
    const [countryCode, setCountryCode] = useState(() => localStorage.getItem('userCountryCode') || null);
    const [isCityModalOpen, setIsCityModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('country');
    const [useAutoLocation, setUseAutoLocation] = useState(false);
    const { calculationMethod, setCalculationMethod, refreshPrayerTimes } = usePrayerTimes();
    const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);

    const displayCountry = useMemo(() => {
        if (countryCode) return getTranslatedCountry(countryCode.toUpperCase(), country, i18n.language);
        return country;
    }, [country, countryCode, i18n.language]);

    const setLocationData = (place) => {
        setCountryState(place.country || '');
        setCityState(place.name);
        setCountryCode(place.countryCode || null);
        setManualLocation(place.country || '', place.name, {
            countryCode: place.countryCode,
            latitude: place.latitude,
            longitude: place.longitude,
        });
    };

    // Sync toggle with actual OS permission state
    useEffect(() => {
        const syncPermission = async () => {
            try {
                const status = await Geolocation.checkPermissions();
                setUseAutoLocation(status.location === 'granted');
            } catch {
                setUseAutoLocation(false);
            }
        };
        syncPermission();

        // Re-check when page becomes visible (user returns from iOS Settings)
        const handleVisibility = () => {
            if (!document.hidden) syncPermission();
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    const handleAutoLocationToggle = async () => {
        selection();

        if (useAutoLocation) {
            // Turning OFF — redirect to iOS Settings to revoke permission
            setUseAutoLocation(false);
            try {
                window.open('app-settings:', '_blank');
            } catch (e) {
                console.warn('[LOCATION] Could not open settings:', e?.message);
            }
            return;
        }

        // Turning ON — check permission
        try {
            let status = await Geolocation.checkPermissions();

            if (status.location === 'prompt') {
                // First time — request permission
                status = await Geolocation.requestPermissions();
            }

            if (status.location === 'granted') {
                setUseAutoLocation(true);
                localStorage.setItem('location_permission_granted', 'true');
                // GPS becomes authoritative — release the manual city override
                disableManualLocation();
                refreshLocation();
            } else {
                // Denied — redirect to iOS Settings
                try {
                    window.open('app-settings:', '_blank');
                } catch (e) {
                    console.warn('[LOCATION] Could not open settings:', e?.message);
                }
                setUseAutoLocation(false);
            }
        } catch (e) {
            console.error('[LOCATION] Permission error:', e);
            setUseAutoLocation(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#021a0f] text-gray-900 dark:text-white pb-24">
            <div className="px-5 pt-4 flex items-center gap-3">
                <button
                    onClick={() => { selection(); navigate(-1); }}
                    aria-label={t('common:common.back')}
                    className="flex-shrink-0 w-9 h-9 rounded-full bg-white dark:bg-white/5 border border-stone-200/80 dark:border-white/10 shadow-sm dark:shadow-none flex items-center justify-center text-islamic-green dark:text-islamic-gold hover:bg-stone-50 dark:hover:bg-white/10 transition-colors active:scale-95"
                >
                    <ChevronLeft size={18} />
                </button>
                <h1 className="text-xl font-bold font-serif text-islamic-green dark:text-islamic-gold">{t('location')}</h1>
            </div>
            <motion.div
                className="p-5 space-y-6"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.section variants={itemVariants} className="space-y-3">
                    <div className="bg-white dark:bg-white/5 rounded-[2rem] shadow-sm border dark:border-white/5 overflow-hidden">
                        {/* Auto Location Toggle */}
                        <SettingsToggle
                            icon={Crosshair}
                            label={t('autoLocation')}
                            subtitle={t('autoLocationSubtitle')}
                            active={useAutoLocation}
                            onToggle={handleAutoLocationToggle}
                        />

                        {/* GPS Status Indicator */}
                        {useAutoLocation && (
                            <div className="p-5 border-t dark:border-white/5">
                                {locationLoading ? (
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-2xl">
                                            <Loader2 className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-spin" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{t('gettingLocation')}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500">{t('waitingGPS')}</p>
                                        </div>
                                    </div>
                                ) : hasLocation && latitude && longitude ? (
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl">
                                            <Navigation className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-current" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{t('gpsActive')}</p>
                                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[8px] font-black uppercase tracking-wider rounded-full">
                                                    {t('live')}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                                {t('locationDetected')}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => { selection(); refreshLocation(); }}
                                            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all active:scale-90"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-2xl">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{t('locationFailed')}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                                {t('defaultLocation')}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => { selection(); refreshLocation(); }}
                                            className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all active:scale-90"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Manual Location Selection — country first, then city (Photon, country-filtered) */}
                        {!useAutoLocation && (
                            <div className="flex flex-col border-t dark:border-white/5">
                                <button
                                    onClick={() => { medium(); setModalMode('country'); setIsCityModalOpen(true); }}
                                    className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b dark:border-white/5"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-islamic-green/5 dark:bg-islamic-gold/10 rounded-2xl text-islamic-green dark:text-islamic-gold">
                                            <Globe size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">{t('country', 'Ülke')}</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{displayCountry}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300" />
                                </button>
                                <button
                                    onClick={() => { medium(); setModalMode('city'); setIsCityModalOpen(true); }}
                                    className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-islamic-green/5 dark:bg-islamic-gold/10 rounded-2xl text-islamic-green dark:text-islamic-gold">
                                            <MapPin size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">{t('city', 'Şehir')}</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{city}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300" />
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="px-2 text-[9px] text-gray-400 dark:text-gray-500 italic mt-3 mb-6">

                        {useAutoLocation
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
                </motion.section>
            </motion.div>

            {/* Location Selection Modal */}
            <AnimatePresence>
                {isCityModalOpen && (
                    <LocationSelectionModal
                        currentCountryCode={countryCode}
                        currentCity={city}
                        initialMode={modalMode}
                        onSelect={setLocationData}
                        onClose={() => setIsCityModalOpen(false)}
                        t={t}
                        i18n={i18n}
                    />
                )}
            </AnimatePresence>

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
        </div>
    );
}
