import json
import os

locales = ['ar', 'az', 'de', 'en', 'ru', 'tr']
translations = {
    'en': {
        'selectCountry': 'Select Country',
        'selectCity': 'Select City',
        'searchCountry': 'Search country...',
        'searchCity': 'Search city...',
        'loadingLocations': 'Loading locations...',
        'noResults': 'No results found',
        'noCityFound': 'City not found',
        'country': 'Country',
        'city': 'City'
    },
    'tr': {
        'selectCountry': 'Ülke Seç',
        'selectCity': 'Şehir Seç',
        'searchCountry': 'Ülke ara...',
        'searchCity': 'Şehir ara...',
        'loadingLocations': 'Konumlar yükleniyor...',
        'noResults': 'Sonuç bulunamadı',
        'noCityFound': 'Şehir bulunamadı',
        'country': 'Ülke',
        'city': 'Şehir'
    },
    'de': {
        'selectCountry': 'Land auswählen',
        'selectCity': 'Stadt auswählen',
        'searchCountry': 'Land suchen...',
        'searchCity': 'Stadt suchen...',
        'loadingLocations': 'Standorte werden geladen...',
        'noResults': 'Keine Ergebnisse gefunden',
        'noCityFound': 'Stadt nicht gefunden',
        'country': 'Land',
        'city': 'Stadt'
    },
    'ar': {
        'selectCountry': 'اختر البلد',
        'selectCity': 'اختر المدينة',
        'searchCountry': 'البحث عن بلد...',
        'searchCity': 'البحث عن مدينة...',
        'loadingLocations': 'جاري تحميل المواقع...',
        'noResults': 'لا توجد نتائج',
        'noCityFound': 'المدينة غير موجودة',
        'country': 'البلد',
        'city': 'المدينة'
    },
    'ru': {
        'selectCountry': 'Выберите страну',
        'selectCity': 'Выберите город',
        'searchCountry': 'Поиск страны...',
        'searchCity': 'Поиск города...',
        'loadingLocations': 'Загрузка местоположений...',
        'noResults': 'Ничего не найдено',
        'noCityFound': 'Город не найден',
        'country': 'Страна',
        'city': 'Город'
    },
    'az': {
        'selectCountry': 'Ölkə seçin',
        'selectCity': 'Şəhər seçin',
        'searchCountry': 'Ölkə axtar...',
        'searchCity': 'Şəhər axtar...',
        'loadingLocations': 'Məkanlar yüklənir...',
        'noResults': 'Nəticə tapılmadı',
        'noCityFound': 'Şəhər tapılmadı',
        'country': 'Ölkə',
        'city': 'Şəhər'
    }
}

for lang in locales:
    filepath = f"public/locales/{lang}/settings.json"
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Add new keys
        for key, val in translations[lang].items():
            data[key] = val
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
print("Settings translations updated successfully.")
