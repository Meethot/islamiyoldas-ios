import json
import os

locales = {
    'tr': {
        "calcAuto": "Otomatik",
        "calcAutoDesc": "Bulunduğunuz konuma göre en uygun yöntem",
        "calcDiyanet": "Diyanet (Türkiye)",
        "calcDiyanetDesc": "Fajr: 18.0° | Isha: 17.0°",
        "calcMwl": "Muslim World League",
        "calcMwlDesc": "Fajr: 18.0° | Isha: 17.0°",
        "calcMekke": "Umm al-Qura (Saudi Arabia)",
        "calcMekkeDesc": "Fajr: 18.5° | Isha: 90 min",
        "calcIsna": "ISNA (North America)",
        "calcIsnaDesc": "Fajr: 15.0° | Isha: 15.0°",
        "calcKaraci": "University of Karachi",
        "calcKaraciDesc": "Fajr: 18.0° | Isha: 18.0°",
        "calcMisir": "Egyptian General Authority",
        "calcMisirDesc": "Fajr: 19.5° | Isha: 17.5°",
        "calcDubai": "Dubai (UAE)",
        "calcDubaiDesc": "Fajr: 18.2° | Isha: 18.2°",
        "calcQatar": "Qatar",
        "calcQatarDesc": "Fajr: 18.0° | Isha: 90 min",
        "calcKuwait": "Kuwait",
        "calcKuwaitDesc": "Fajr: 18.0° | Isha: 17.5°",
        "calcGulf": "Gulf Region",
        "calcGulfDesc": "Fajr: 19.5° | Isha: 90 min",
        "calcMuis": "MUIS (Singapore)",
        "calcMuisDesc": "Fajr: 20.0° | Isha: 18.0°",
        "calcKemenag": "KEMENAG (Indonesia)",
        "calcKemenagDesc": "Fajr: 20.0° | Isha: 18.0°",
        "calcMorocco": "Morocco",
        "calcMoroccoDesc": "Fajr: 19.0° | Isha: 17.0°",
        "calcAlgeria": "Algeria",
        "calcAlgeriaDesc": "Fajr: 18.0° | Isha: 17.0°",
        "calcTunisia": "Tunisia",
        "calcTunisiaDesc": "Fajr: 18.0° | Isha: 18.0°",
        "calcUoif": "UOIF (France)",
        "calcUoifDesc": "Fajr: 12.0° | Isha: 12.0°",
        "calcTehran": "Institute of Geophysics (Tehran)",
        "calcTehranDesc": "Fajr: 17.7° | Isha: 14.0°"
    },
    'en': {
        "calcAuto": "Automatic",
        "calcAutoDesc": "Best method based on your location"
    },
    'de': {
        "calcAuto": "Automatisch",
        "calcAutoDesc": "Beste Methode basierend auf Ihrem Standort"
    },
    'ru': {
        "calcAuto": "Автоматически",
        "calcAutoDesc": "Лучший метод на основе вашего местоположения"
    },
    'ar': {
        "calcAuto": "تلقائي",
        "calcAutoDesc": "أفضل طريقة بناءً على موقعك"
    },
    'az': {
        "calcAuto": "Avtomatik",
        "calcAutoDesc": "Məkanınıza görə ən uyğun üsul"
    }
}

base_keys = locales['tr']

for lang, vals in locales.items():
    file_path = f"public/locales/{lang}/settings.json"
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Merge keys
        for k, v in base_keys.items():
            if k not in data:
                data[k] = vals.get(k, v) # use translated if exists, else fallback to TR (or english names for institutions)
            else:
                data[k] = vals.get(k, v)

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

print("Translations added successfully.")
