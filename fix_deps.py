import re

with open('src/context/PrayerTimesContext.jsx', 'r') as f:
    content = f.read()

# Replace the useEffect dependencies
content = content.replace(
    "}, [latitude, longitude, hasLocation, manualCity]);",
    "}, [latitude, longitude, hasLocation, manualCity, forceRefresh, calculationMethod]);"
)

with open('src/context/PrayerTimesContext.jsx', 'w') as f:
    f.write(content)
