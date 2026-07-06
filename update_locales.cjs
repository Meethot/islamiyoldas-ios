const fs = require('fs');

const trPath = './public/locales/tr/common.json';
const enPath = './public/locales/en/common.json';

const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const newKeysTr = {
    "discount_ending": "Teklif Sona Eriyor",
    "discount_title": "Bekleyen Teklifiniz Var",
    "discount_desc1": "Premium'u",
    "discount_desc2": "şimdi %40 indirimle",
    "discount_desc3": "almak için son şansınız.",
    "discount_warning": "Sayfayı kapattığınızda bu teklif iptal olur.",
    "discount_badge": "%40 İNDİRİM",
    "normal_price": "Normal Fiyat",
    "daily_only": "Günlük Sadece",
    "cheaper_than_water": "💧 Bir şişe sudan bile çok daha ucuz",
    "billed_yearly": "Yıllık faturalandırılır",
    "feat_audio_stories": "Sesli Hikayeler",
    "feat_audio_quran": "Sesli Kur'an-ı Kerim",
    "feat_widgets": "Özel Widgetlar",
    "feat_no_ads": "Reklamsız Deneyim",
    "feat_all_premium": "Tüm Premium Özellikler",
    "use_offer": "TEKLİFİ KULLAN",
    "cancel_offer": "Teklifi iptal et ve çık"
};

const newKeysEn = {
    "discount_ending": "Offer Ending",
    "discount_title": "You Have a Pending Offer",
    "discount_desc1": "This is your last chance to get Premium with",
    "discount_desc2": "a 40% discount.",
    "discount_desc3": "",
    "discount_warning": "This offer will be canceled if you close the page.",
    "discount_badge": "40% OFF",
    "normal_price": "Normal Price",
    "daily_only": "Only Daily",
    "cheaper_than_water": "💧 Cheaper than a bottle of water",
    "billed_yearly": "Billed yearly",
    "feat_audio_stories": "Audio Stories",
    "feat_audio_quran": "Audio Quran",
    "feat_widgets": "Custom Widgets",
    "feat_no_ads": "Ad-Free Experience",
    "feat_all_premium": "All Premium Features",
    "use_offer": "CLAIM OFFER",
    "cancel_offer": "Cancel offer and exit"
};

Object.assign(trData.premium, newKeysTr);
Object.assign(enData.premium, newKeysEn);

fs.writeFileSync(trPath, JSON.stringify(trData, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));

console.log("Locales updated successfully.");
