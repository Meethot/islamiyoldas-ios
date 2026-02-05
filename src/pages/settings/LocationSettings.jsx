import React, { useState, useMemo } from 'react';
import {
    MapPin, Crosshair, Navigation, RefreshCw, Loader2,
    AlertTriangle, Search, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useHaptics } from '@/hooks/useMobile';
import { useLocation } from '@/context/LocationContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    SettingsContainer,
    SettingsHeader,
    SettingsSection,
    SettingsToggle
} from '@/components/SettingsComponents';

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

export default function LocationSettings() {
    const navigate = useNavigate();
    const { selection, success, medium } = useHaptics();
    const { latitude, longitude, loading: locationLoading, hasLocation, refreshLocation } = useLocation();

    const [useAutoLocation, setUseAutoLocation] = useState(true);
    const [city, setCityState] = useState(localStorage.getItem('userCity') || 'İstanbul');
    const [isCityModalOpen, setIsCityModalOpen] = useState(false);

    const setCity = (newCity) => {
        setCityState(newCity);
        localStorage.setItem('userCity', newCity);
        success();
        setIsCityModalOpen(false);
    };

    return (
        <SettingsContainer>
            <SettingsHeader title="Konum" onBack={() => navigate(-1)} />

            <div className="p-5 space-y-6">
                <SettingsSection title="Konum Kaynağı">
                    <SettingsToggle
                        icon={Crosshair}
                        label="Otomatik Konum"
                        subtitle="GPS ile konumunuz otomatik algılansın"
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
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Konum Alınıyor...</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">GPS sinyali bekleniyor</p>
                                    </div>
                                </div>
                            ) : hasLocation && latitude && longitude ? (
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl">
                                        <Navigation className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-current" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">GPS Aktif</p>
                                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[8px] font-black uppercase tracking-wider rounded-full">
                                                Canlı
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                            Konumunuz otomatik olarak algılandı
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
                                        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">Konum Alınamadı</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                            Varsayılan konum (İstanbul) kullanılıyor
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
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">Şehrin</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{city}</p>
                                </div>
                            </div>
                            <span className="text-gray-300">›</span>
                        </button>
                    )}
                </SettingsSection>

                <p className="px-2 text-[9px] text-gray-400 dark:text-gray-500 italic text-center">
                    {useAutoLocation
                        ? "Namaz vakitleri GPS konumunuza göre otomatik hesaplanır."
                        : "Ezan vakitleri seçtiğiniz şehre göre belirlenir."}
                </p>
            </div>

            {/* City Selection Modal */}
            <AnimatePresence>
                {isCityModalOpen && (
                    <CitySelectionModal
                        currentCity={city}
                        onSelect={setCity}
                        onClose={() => setIsCityModalOpen(false)}
                    />
                )}
            </AnimatePresence>
        </SettingsContainer>
    );
}

function CitySelectionModal({ currentCity, onSelect, onClose }) {
    const [searchTerm, setSearchTerm] = useState('');
    const { selection } = useHaptics();

    const filteredCities = useMemo(() => {
        return TURKEY_CITIES.filter(city =>
            city.toLocaleLowerCase('tr').includes(searchTerm.toLocaleLowerCase('tr'))
        );
    }, [searchTerm]);

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
                        <h2 className="text-2xl font-serif font-bold text-islamic-green dark:text-islamic-gold">Şehir Seçin</h2>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-gray-100 dark:bg-white/10">
                            <X size={20} />
                        </Button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Şehir ara..."
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
                                <p className="text-gray-500 font-medium">Şehir bulunamadı</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
