const axios = require('axios');
async function run() {
  const res = await axios.get('https://api.aladhan.com/v1/calendar/2026/7?latitude=38.4237&longitude=27.1428&method=13');
  const days = res.data.data;
  days.forEach(d => {
    if (d.timings.Fajr.includes("02:") || d.timings.Fajr.includes("03:")) {
      console.log(d.date.gregorian.date, d.timings.Fajr, d.timings.Dhuhr);
    }
  });
}
run();
