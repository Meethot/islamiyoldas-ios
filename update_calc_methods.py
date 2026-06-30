import re

with open('src/pages/settings/LocationSettings.jsx', 'r') as f:
    content = f.read()

old_methods_pattern = r'const CALCULATION_METHODS = \[.*?\];'

new_methods = """const CALCULATION_METHODS = [
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
];"""

content = re.sub(old_methods_pattern, new_methods, content, flags=re.DOTALL)

# Update styling in the map function to add dividers like the screenshot.
# Instead of full rounding, let's use a simpler structure. 
# But the user screenshot has a dark theme and dividers. Our app already has pretty styling.
# I will just keep the app's current styling but it handles large lists gracefully now.

with open('src/pages/settings/LocationSettings.jsx', 'w') as f:
    f.write(content)
