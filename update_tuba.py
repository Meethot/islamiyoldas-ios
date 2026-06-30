import json
import os

translations = {
    "tr": {
        "modalTitle": "Tuba Ağacı (Cennet Ağacı)",
        "quote": "\"Kökleri Arş'ta, dalları kalplere uzanan kutlu cennet ağacıdır.\"",
        "desc": "Tuba ağacı kökleri gökte, dalları yeryüzünde olan muazzam güzellikteki cennet ağacıdır.",
        "water": "Her gün uygulamaya girerek fidanını büyüt ve onu koca bir ağaca dönüştür.",
        "streak": "7 günlük istikrarın sonunda güzel bir mertebeye ulaş.",
        "understood": "Anladım"
    },
    "en": {
        "modalTitle": "Tuba Tree (Tree of Paradise)",
        "quote": "\"It is the blessed tree of paradise with its roots in the heavens and branches reaching to hearts.\"",
        "desc": "The Tuba tree is a magnificently beautiful tree of paradise with its roots in the heavens and branches on the earth.",
        "water": "Enter the app every day to grow your sapling and turn it into a massive tree.",
        "streak": "Reach a beautiful rank at the end of your 7-day streak.",
        "understood": "Understood"
    },
    "de": {
        "modalTitle": "Tuba-Baum (Baum des Paradieses)",
        "quote": "\"Es ist der gesegnete Baum des Paradieses, dessen Wurzeln im Himmel und dessen Äste in die Herzen reichen.\"",
        "desc": "Der Tuba-Baum ist ein wunderschöner Baum des Paradieses, dessen Wurzeln im Himmel und dessen Äste auf der Erde sind.",
        "water": "Besuche die App jeden Tag, um deinen Setzling zu pflegen und ihn in einen großen Baum zu verwandeln.",
        "streak": "Erreiche am Ende deiner 7-tägigen Serie einen schönen Rang.",
        "understood": "Verstanden"
    },
    "ru": {
        "modalTitle": "Дерево Туба (Райское дерево)",
        "quote": "\"Это благословенное райское дерево, корни которого на небесах, а ветви тянутся к сердцам.\"",
        "desc": "Дерево Туба — это великолепное райское дерево, корни которого находятся на небесах, а ветви — на земле.",
        "water": "Заходите в приложение каждый день, чтобы вырастить свой саженец и превратить его в огромное дерево.",
        "streak": "Достигните прекрасного уровня в конце вашей 7-дневной серии.",
        "understood": "Понятно"
    },
    "ar": {
        "modalTitle": "شجرة طوبى (شجرة الجنة)",
        "quote": "\"إنها شجرة الجنة المباركة، أصلها في السماء وفروعها تمتد إلى القلوب.\"",
        "desc": "شجرة طوبى هي شجرة الجنة العظيمة بجمالها، جذورها في السماء وأغصانها في الأرض.",
        "water": "ادخل التطبيق كل يوم لتنمية شتلتك وتحويلها إلى شجرة ضخمة.",
        "streak": "صل إلى مرتبة جميلة في نهاية استمرارك لمدة 7 أيام.",
        "understood": "فهمت"
    },
    "az": {
        "modalTitle": "Tuba Ağacı (Cənnət Ağacı)",
        "quote": "\"Kökü Ərşdə, budaqları qəlblərə uzanan mübarək cənnət ağacıdır.\"",
        "desc": "Tuba ağacı kökləri göydə, budaqları yerdə olan möhtəşəm gözəllikdə cənnət ağacıdır.",
        "water": "Hər gün tətbiqə daxil olaraq fidanını böyüt və onu nəhəng bir ağaca çevir.",
        "streak": "7 günlük davamlılığın sonunda gözəl bir məqama çat.",
        "understood": "Anladım"
    }
}

for lang, vals in translations.items():
    file_path = f"public/locales/{lang}/home.json"
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if "tuba" not in data:
            data["tuba"] = {}
            
        for k, v in vals.items():
            data["tuba"][k] = v

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

print("Tuba translations added successfully.")
