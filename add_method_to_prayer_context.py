import re

with open('src/context/PrayerTimesContext.jsx', 'r') as f:
    content = f.read()

# Add state to PrayerTimesProvider
old_state = """    const [prayerTimes, setPrayerTimes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [currentPrayer, setCurrentPrayer] = useState(null);"""

new_state = """    const [prayerTimes, setPrayerTimes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [currentPrayer, setCurrentPrayer] = useState(null);
    const [calculationMethod, setCalculationMethodState] = useState(localStorage.getItem('calculationMethod') || 'auto');

    const setCalculationMethod = (method) => {
        setCalculationMethodState(method);
        localStorage.setItem('calculationMethod', method);
    };"""
content = content.replace(old_state, new_state)

# Add to value object
old_value = """        error,
        nextPrayer,
        currentPrayer,
        refreshPrayerTimes: () => setForceRefresh(prev => prev + 1)
    };"""

new_value = """        error,
        nextPrayer,
        currentPrayer,
        calculationMethod,
        setCalculationMethod,
        refreshPrayerTimes: () => setForceRefresh(prev => prev + 1)
    };"""
content = content.replace(old_value, new_value)

# Update method logic in fetchPrayerTimes
# Find: const method = turkish ? 13 : 3;
# Replace: const method = calculationMethod === 'auto' ? (turkish ? 13 : 3) : parseInt(calculationMethod, 10);
content = content.replace("const method = turkish ? 13 : 3;", "const method = calculationMethod === 'auto' ? (turkish ? 13 : 3) : parseInt(calculationMethod, 10);")

# Find: const method = isTurkishLocation ? 13 : 3;
# Replace: const method = calculationMethod === 'auto' ? (isTurkishLocation ? 13 : 3) : parseInt(calculationMethod, 10);
content = content.replace("const method = isTurkishLocation ? 13 : 3;", "const method = calculationMethod === 'auto' ? (isTurkishLocation ? 13 : 3) : parseInt(calculationMethod, 10);")


with open('src/context/PrayerTimesContext.jsx', 'w') as f:
    f.write(content)

