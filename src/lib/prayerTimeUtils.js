// Shared prayer time parsing helpers.
// Prayer times arrive as strings ("04:12", "04:12 (+03)" or "4:12 AM") and are
// compared against the device clock in several places (countdown, passed-state,
// focus overlay, notification scheduling). These helpers centralize parsing and
// handle times that cross midnight — at high latitudes Isha can be e.g. "00:10",
// which naive same-day parsing marks as "passed" all day.

/**
 * Parse a prayer time string into hours/minutes.
 * Supports "HH:MM", "HH:MM (+03)" and "h:mm AM/PM".
 * @returns {{hours: number, minutes: number} | null}
 */
export function parsePrayerTimeString(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const clean = timeStr.trim();

    const ampm = clean.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (ampm) {
        let h = parseInt(ampm[1], 10);
        const m = parseInt(ampm[2], 10);
        if (ampm[3].toUpperCase() === 'PM' && h !== 12) h += 12;
        if (ampm[3].toUpperCase() === 'AM' && h === 12) h = 0;
        return { hours: h, minutes: m };
    }

    const [h, m] = clean.split(' ')[0].split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return { hours: h, minutes: m };
}

/**
 * Build absolute Dates for an ordered list of prayer time strings
 * (Fajr → ... → Isha). The sequence is kept monotonic: a time earlier than
 * its predecessor is rolled to the next day, so a midnight-crossing Isha
 * ("00:10") lands on baseDate+1 instead of being treated as already passed.
 *
 * @param {string[]} orderedTimes - time strings in prayer order
 * @param {Date} [baseDate] - calendar day the first prayer belongs to
 * @returns {(Date|null)[]} aligned with input; null for unparseable entries
 */
export function buildPrayerSchedule(orderedTimes, baseDate = new Date()) {
    const result = [];
    let prev = null;

    for (const timeStr of orderedTimes) {
        const parsed = parsePrayerTimeString(timeStr);
        if (!parsed) {
            result.push(null);
            continue;
        }
        const d = new Date(baseDate);
        d.setHours(parsed.hours, parsed.minutes, 0, 0);
        while (prev && d < prev) {
            d.setDate(d.getDate() + 1);
        }
        result.push(d);
        prev = d;
    }

    return result;
}
