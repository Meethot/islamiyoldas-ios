/**
 * Prayer Reminder Service
 * 
 * Logic to generate personalized, gentle reminders based on user habits.
 * "Nazik Yoldaş" Philosophy: Adapt tone based on consistency.
 */

// Message Bank
const MESSAGES = {
    gentle: [
        "Namaz vakti yaklaşıyor, hazırlanmak ister misin? 🌸",
        "Vaktin çıkmasına az kaldı, huzuru erteleme. 🌙",
        "Biraz yavaşlayıp Rabbinle buluşma vakti. 🤲",
        "Dünya işlerine kısa bir ara verelim mi? 🕌"
    ],
    encouraging: [
        "Bu aralar çok iyisin, istikrarını bozma! 💪",
        "Zorlandığını biliyorum ama sonra gelen huzur buna değer. 💚",
        "Bugün kendine yapacağın en büyük iyilik bu namaz olsun. ✨",
        "Şeytan sadece ertelemeni ister, sen yapabilirsin! 🔥"
    ],
    celebratory: [
        "Harika gidiyorsun! Bu istikrarın daim olsun. 🎉",
        "Maşallah, namazlarını hiç aksatmıyorsun. 🌟",
        "Rabbim bu güzel alışkanlığını kabul etsin. 🤲"
    ],
    missed_fajr: [
        "Sabahın bereketi namazla başlar. Yarın başarabilirsin! ☀️",
        "Güneş doğmadan uyanmanın sırrı: Niyet ve Erken Uyku. 🌙",
        "Sabah namazı, günün manevi zırhıdır. Onu kuşanmayı unutma. 🛡️"
    ]
};

// Calculate Habit Score (0-1) for a specific prayer
export const calculateHabitScore = (stats, prayerName) => {
    if (!stats || !stats[prayerName]) return 0;
    const { completed, total } = stats[prayerName];
    return total === 0 ? 0 : completed / total;
};

// Detect Pattern & Get Message
export const getSmartReminderMessage = (prayerName, stats) => {
    const score = calculateHabitScore(stats, prayerName);

    // Case 1: Consistent User (Score > 0.8)
    if (score > 0.8) {
        return getRandomMessage('gentle');
    }

    // Case 2: Struggling User (Score < 0.5)
    if (score < 0.5) {
        // Special case for Fajr
        if (prayerName === 'İmsak' || prayerName === 'Sabah') {
            return getRandomMessage('missed_fajr');
        }
        return getRandomMessage('encouraging');
    }

    // Case 3: Average User (0.5 - 0.8)
    // Sometimes celebrate, sometimes gentle nudge
    return Math.random() > 0.5 ? getRandomMessage('gentle') : getRandomMessage('celebratory');
};

const getRandomMessage = (category) => {
    const list = MESSAGES[category];
    return list[Math.floor(Math.random() * list.length)];
};

// Update Stats Logic (Call this when user toggles prayer)
export const updatePrayerStats = (currentStats, prayerName, isCompleted) => {
    const stats = { ...currentStats };

    if (!stats[prayerName]) {
        stats[prayerName] = { completed: 0, total: 0 };
    }

    // We increment total only once per day (handled by checking last date logic else where)
    // For simplicity here, we assume this is called when verifying daily progress

    // This is a simplified tracker. Real implementation needs date tracking.
    // We will just return the update delta structure for now.

    return stats;
};

export const INITIAL_STATS = {
    İmsak: { completed: 0, total: 0 },
    Öğle: { completed: 0, total: 0 },
    İkindi: { completed: 0, total: 0 },
    Akşam: { completed: 0, total: 0 },
    Yatsı: { completed: 0, total: 0 }
};
