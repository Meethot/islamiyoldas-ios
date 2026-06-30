import json
import os

translations = {
    "tr": {
        "streakBadge": "🔥 {{count}} Gün Seri",
        "modalStreak": "7 günlük istikrarın sonunda güzel bir mertebeye ulaş."
    },
    "en": {
        "streakBadge": "🔥 {{count}} Day Streak",
        "modalStreak": "Reach a beautiful rank at the end of your 7-day streak."
    },
    "de": {
        "streakBadge": "🔥 {{count}} Tage Serie",
        "modalStreak": "Erreiche am Ende deiner 7-tägigen Serie einen schönen Rang."
    },
    "ru": {
        "streakBadge": "🔥 {{count}} Дней Подряд",
        "modalStreak": "Достигните прекрасного уровня в конце вашей 7-дневной серии."
    },
    "ar": {
        "streakBadge": "🔥 {{count}} أيام متتالية",
        "modalStreak": "صل إلى مرتبة جميلة في نهاية استمرارك لمدة 7 أيام."
    },
    "az": {
        "streakBadge": "🔥 {{count}} Gün Davamlılıq",
        "modalStreak": "7 günlük davamlılığın sonunda gözəl bir məqama çat."
    }
}

for lang, vals in translations.items():
    file_path = f"public/locales/{lang}/home.json"
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if "tuba" in data:
            data["tuba"]["streakBadge"] = vals["streakBadge"]
            data["tuba"]["modalStreak"] = vals["modalStreak"]
            
            # Remove the old incorrect 'streak' key to avoid confusion
            if "streak" in data["tuba"]:
                del data["tuba"]["streak"]

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

print("Tuba streak keys fixed successfully.")
