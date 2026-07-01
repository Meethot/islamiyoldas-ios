const axios = require('axios');
async function run() {
  const regions = [9451, 9448, 9450, 9465, 9500, 9600, 9700]; // some IDs for eastern turkey
  for (let id=9400; id<9500; id++) {
    try {
        const res = await axios.get(`https://prayertimes.api.abdus.dev/api/diyanet/prayertimes?location_id=${id}`);
        const today = res.data[0]; // July 1 2026
        if (today && today.fajr === "02:42") {
            console.log("FOUND EXACT MATCH:", id, today);
        }
    } catch(e) {}
  }
}
run();
