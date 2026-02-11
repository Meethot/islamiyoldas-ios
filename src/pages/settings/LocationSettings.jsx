import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, MapPin, Crosshair, Navigation, Loader2,
    RefreshCw, AlertTriangle, Search, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/useMobile';
import { useLocation } from '../../context/LocationContext';
import { useTranslation } from 'react-i18next';

const TURKEY_CITIES = [
    "İstanbul", "Ankara", "İzmir", "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Antalya",
    "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis",
    "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne",
    "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır",
    "Isparta", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli",
    "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş",
    "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa",
    "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

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

function CitySelectionModal({ currentCity, onSelect, onClose, t }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingLocation, setLoadingLocation] = useState(false);
    const { selection, success, error } = useHaptics();

    const filteredCities = useMemo(() => {
        return TURKEY_CITIES.filter(city =>
            city.toLocaleLowerCase('tr').includes(searchTerm.toLocaleLowerCase('tr'))
        );
    }, [searchTerm]);

    const detectLocation = () => {
        if (!navigator.geolocation) {
            alert(t('locationNotSupported', 'Your browser does not support location services.'));
            return;
        }

        selection();
        setLoadingLocation(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();

                    if (data && data.address) {
                        let detectedCity = data.address.province || data.address.city || data.address.town || data.address.state;
                        if (detectedCity) {
                            detectedCity = detectedCity.replace(' İli', '').replace(' Province', '');
                            const match = TURKEY_CITIES.find(c => c.localeCompare(detectedCity, 'tr', { sensitivity: 'base' }) === 0);
                            const finalCity = match || detectedCity;
                            success();
                            onSelect(finalCity);
                        } else {
                            throw new Error('City not found');
                        }
                    } else {
                        throw new Error('Address could not be resolved');
                    }
                } catch (err) {
                    console.error(err);
                    error();
                    alert(t('locationDetectFailed', 'Could not detect your location. Please select manually.'));
                } finally {
                    setLoadingLocation(false);
                }
            },
            (err) => {
                console.error(err);
                error();
                setLoadingLocation(false);
                alert(t('locationPermissionDenied', 'Location permission denied or unavailable.'));
            }
        );
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
                        <h2 className="text-2xl font-serif font-bold text-islamic-green dark:text-islamic-gold">{t('selectCity', 'Select City')}</h2>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-gray-100 dark:bg-white/10">
                            <X size={20} />
                        </Button>
                    </div>

                    {/* Auto Detect Button */}
                    <button
                        onClick={detectLocation}
                        disabled={loadingLocation}
                        className="w-full flex items-center justify-center gap-3 bg-islamic-green/10 dark:bg-islamic-gold/10 text-islamic-green dark:text-islamic-gold p-4 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loadingLocation ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} className="fill-current" />}
                        {loadingLocation ? t('findingLocation', 'Finding Location...') : t('findMyLocation', 'Find My Location')}
                    </button>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder={t('searchCity', 'Search city...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-2xl pl-12 pr-4 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-islamic-green dark:focus:ring-islamic-gold transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                {/* City List */}
                <div className="flex-1 overflow-y-auto p-4 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 gap-2">
                        {filteredCities.map(city => (
                            <button
                                key={city}
                                onClick={() => { selection(); onSelect(city); }}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
                                    currentCity === city
                                        ? "bg-islamic-green dark:bg-islamic-gold text-white dark:text-[#032e18] shadow-lg shadow-islamic-green/20"
                                        : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                                )}
                            >
                                <span className={cn("font-bold text-lg", currentCity === city ? "translate-x-2" : "group-hover:translate-x-2")} style={{ transition: 'transform 0.2s' }}>
                                    {city}
                                </span>
                                {currentCity === city && (
                                    <div className="bg-white/20 dark:bg-black/10 p-2 rounded-full">
                                        <Check size={20} className="stroke-[3]" />
                                    </div>
                                )}
                            </button>
                        ))}
                        {filteredCities.length === 0 && (
                            <div className="text-center py-20 opacity-50">
                                <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500 font-medium">{t('noCityFound', 'City not found')}</p>
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
    const { t } = useTranslation('settings');
    const { selection, success, medium } = useHaptics();
    const { latitude, longitude, loading: locationLoading, hasLocation, error: locationError, refreshLocation } = useLocation();

    const [city, setCityState] = useState(localStorage.getItem('userCity') || 'İstanbul');
    const [isCityModalOpen, setIsCityModalOpen] = useState(false);
    const [useAutoLocation, setUseAutoLocation] = useState(true);

    const setCity = (newCity) => {
        setCityState(newCity);
        localStorage.setItem('userCity', newCity);
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
                            onToggle={() => {
                                selection();
                                setUseAutoLocation(!useAutoLocation);
                            }}
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

                        {/* Manual City Selection */}
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
                        )}
                    </div>
                    <p className="px-2 text-[9px] text-gray-400 dark:text-gray-500 italic">
                        {useAutoLocation
                            ? t('autoLocationHint')
                            : t('manualLocationHint')}
                    </p>
                </motion.section>
            </motion.div>

            {/* City Selection Modal */}
            <AnimatePresence>
                {isCityModalOpen && (
                    <CitySelectionModal
                        currentCity={city}
                        onSelect={setCity}
                        onClose={() => setIsCityModalOpen(false)}
                        t={t}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
