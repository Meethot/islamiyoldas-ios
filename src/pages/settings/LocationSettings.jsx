import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, MapPin, Globe, Crosshair, Navigation, Loader2,
    RefreshCw, AlertTriangle, Search, Check, X
} from 'lucide-react';
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

function LocationSelectionModal({ currentCountry, currentCity, initialMode = 'country', onSelect, onClose, t, i18n }) {
    const dragControls = useDragControls();
    const [searchTerm, setSearchTerm] = useState('');
    const [mode, setMode] = useState(initialMode); // 'country' or 'city'
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
    }, [searchTerm, mode, countriesData, selectedCountry, i18n.language]);

    const handleSelect = (itemOriginal) => {
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

export default function LocationSettings() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('settings');
    const { selection, success, medium } = useHaptics();
    const { latitude, longitude, loading: locationLoading, hasLocation, error: locationError, refreshLocation, permissionStatus, setManualLocation, manualCity, manualCountry } = useLocation();

    const [city, setCityState] = useState(manualCity || 'İstanbul');
    const [country, setCountryState] = useState(manualCountry || 'Turkey');
    const [isCityModalOpen, setIsCityModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('country');
    const [useAutoLocation, setUseAutoLocation] = useState(false);
    const { calculationMethod, setCalculationMethod, refreshPrayerTimes } = usePrayerTimes();
    const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
    const [globalCountriesData, setGlobalCountriesData] = useState(() => {
        const cached = localStorage.getItem('countries_data_cache');
        return cached ? JSON.parse(cached) : [];
    });

    const displayCountry = useMemo(() => {
        const obj = globalCountriesData.find(c => c.country === country);
        if (obj && obj.iso2) return getTranslatedCountry(obj.iso2, country, i18n.language);
        return country;
    }, [country, globalCountriesData, i18n.language]);

    const setLocationData = (newCountry, newCity) => {
        setCountryState(newCountry);
        setCityState(newCity);
        setManualLocation(newCountry, newCity);
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

    const setCity = (newCity) => {
        setCityState(newCity);
        setManualLocation(country, newCity);
        // Automatically disable auto-location if they pick a manual city to prevent GPS re-overwriting it
        setUseAutoLocation(false);
        localStorage.setItem('location_permission_granted', 'false');
        success();
        setIsCityModalOpen(false);
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
            {/* Header */}
            <div className="bg-white dark:bg-[#044d29]/40 backdrop-blur-md sticky top-0 z-40 p-4 flex items-center gap-4 border-b dark:border-white/5">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                    <ChevronLeft size={20} />
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
                    <h3 className="px-2 text-[10px] font-bold text-gray-400 dark:text-emerald-100/40 uppercase tracking-widest">{t('location')}</h3>
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

                        {/* Manual Location Selection */}
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
                        currentCountry={country}
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
