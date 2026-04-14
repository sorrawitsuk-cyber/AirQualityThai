import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import { provinces77 } from '../src/provinces77.js';

export default async function handler(req, res) {
  try {
    console.log("Cron: เริ่มทำงาน ดึงข้อมูลเปรียบเทียบ (Actual Temp)...");

    const dbUrl = process.env.VITE_FIREBASE_DATABASE_URL;
    if (!dbUrl) return res.status(500).json({ success: false, error: "🚨 หา VITE_FIREBASE_DATABASE_URL ไม่เจอ!" });

    const firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      databaseURL: dbUrl,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID
    };

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getDatabase(app, dbUrl); 

    const chunkSize = 40; 
    let allWData = [];
    let allAData = [];
    const timestamp = Date.now();

    for (let i = 0; i < provinces77.length; i += chunkSize) {
      const chunk = provinces77.slice(i, i + chunkSize);
      const lats = chunk.map(p => p.lat).join(',');
      const lons = chunk.map(p => p.lon).join(',');

      // 🌟 เพิ่ม temperature_2m เข้าไปใน hourly & daily
      const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,apparent_temperature,precipitation_probability,wind_speed_10m,uv_index&daily=temperature_2m_max,apparent_temperature_max,precipitation_probability_max,uv_index_max,wind_speed_10m_max&timezone=Asia%2FBangkok&past_days=7&forecast_days=8&_t=${timestamp}`;
      const aUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}&current=pm2_5&hourly=pm2_5&timezone=Asia%2FBangkok&past_days=7&forecast_days=8&_t=${timestamp}`;

      const [wRes, aRes] = await Promise.all([fetch(wUrl), fetch(aUrl)]);

      if (wRes.ok && aRes.ok) {
        const wJson = await wRes.json();
        const aJson = await aRes.json();
        allWData = [...allWData, ...(Array.isArray(wJson) ? wJson : [wJson])];
        allAData = [...allAData, ...(Array.isArray(aJson) ? aJson : [aJson])];
      }
      if (i + chunkSize < provinces77.length) await new Promise(r => setTimeout(r, 200));
    }

    const newStations = [];
    const newTemps = {};
    const newYesterday = {};    
    const newMaxYesterday = {}; 
    const newDaily = {}; 

    const bangkokTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
    const currentHour = bangkokTime.getHours(); 

    provinces77.forEach((p, idx) => {
      const w = allWData[idx] || {};
      const a = allAData[idx] || {};
      const sID = `PROV_${idx}`;

      newStations.push({
        stationID: sID, areaTH: p.n, lat: p.lat, long: p.lon,
        AQILast: { PM25: { value: Math.round(a.current?.pm2_5 || 0) } }
      });

      // ✅ FIX: past_days=7 → index 7 = วันนี้ (ไม่ใช่ index 1 ซึ่งคือ 6 วันก่อน)
      newTemps[sID] = {
        temp: Math.round(w.current?.temperature_2m || 0),
        feelsLike: Math.round(w.current?.apparent_temperature || 0),
        humidity: Math.round(w.current?.relative_humidity_2m || 0),
        rainProb: Math.round(w.daily?.precipitation_probability_max?.[7] || 0),
        windSpeed: Math.round(w.current?.wind_speed_10m || 0),
        windDir: Math.round(w.current?.wind_direction_10m || 0),
        uv: Math.round(w.daily?.uv_index_max?.[7] || 0)
      };

      // 🌟 เปลี่ยนมาดึง temperature_2m (อุณหภูมิปรอทปกติ) แทน Feels Like
      const prevTemp = w.hourly?.temperature_2m?.[currentHour];
      const prevPm25 = a.hourly?.pm2_5?.[currentHour];
      const prevUv = w.hourly?.uv_index?.[currentHour];
      const prevRain = w.hourly?.precipitation_probability?.[currentHour];
      const prevWind = w.hourly?.wind_speed_10m?.[currentHour];

      newYesterday[sID] = {
        temp: Math.round(prevTemp !== undefined ? prevTemp : (w.daily?.temperature_2m_max?.[0] || 0)),
        pm25: Math.round(prevPm25 !== undefined ? prevPm25 : (a.current?.pm2_5 || 0)),
        uv: Math.round(prevUv !== undefined ? prevUv : (w.daily?.uv_index_max?.[0] || 0)),
        rain: Math.round(prevRain !== undefined ? prevRain : (w.daily?.precipitation_probability_max?.[0] || 0)),
        wind: Math.round(prevWind !== undefined ? prevWind : (w.daily?.wind_speed_10m_max?.[0] || 0))
      };

      let maxPm25 = 0;
      if (a.hourly?.pm2_5) {
          const yesterdayHourly = a.hourly.pm2_5.slice(0, 24).filter(v => v !== null);
          if(yesterdayHourly.length > 0) maxPm25 = Math.max(...yesterdayHourly);
      }

      // 🌟 เปลี่ยนมาเซฟค่า Max เป็น temperature_2m_max
      newMaxYesterday[sID] = {
        temp: Math.round(w.daily?.temperature_2m_max?.[0] || 0),
        pm25: Math.round(maxPm25 || a.current?.pm2_5 || 0),
        uv: Math.round(w.daily?.uv_index_max?.[0] || 0),
        rain: Math.round(w.daily?.precipitation_probability_max?.[0] || 0),
        wind: Math.round(w.daily?.wind_speed_10m_max?.[0] || 0)
      };

      // --- Build 15-day arrays for Map Slider ---
      const dailyDates = w.daily?.time || [];
      const dailyPm25Values = [];
      if (a.hourly?.pm2_5 && a.hourly.pm2_5.length >= dailyDates.length * 24) {
          for (let d = 0; d < dailyDates.length; d++) {
             const slice = a.hourly.pm2_5.slice(d * 24, (d + 1) * 24);
             const valid = slice.filter(v => v !== null);
             dailyPm25Values.push(valid.length > 0 ? Math.round(Math.max(...valid)) : 0);
          }
      } else {
          for (let d = 0; d < dailyDates.length; d++) {
             dailyPm25Values.push(Math.round(a.current?.pm2_5 || 0));
          }
      }

      newDaily[sID] = {
          dates: dailyDates,
          temp: w.daily?.temperature_2m_max?.map(v => Math.round(v)) || [],
          heat: w.daily?.apparent_temperature_max?.map(v => Math.round(v)) || [],
          pm25: dailyPm25Values,
          rain: w.daily?.precipitation_probability_max?.map(v => Math.round(v)) || [],
          wind: w.daily?.wind_speed_10m_max?.map(v => Math.round(v)) || [],
          uv: w.daily?.uv_index_max?.map(v => Math.round(v)) || []
      };
    });

    const payload = { 
        lastUpdated: bangkokTime.toISOString(), 
        stations: newStations, 
        stationTemps: newTemps,
        stationYesterday: newYesterday,
        stationMaxYesterday: newMaxYesterday,
        stationDaily: newDaily
    };
    
    await set(ref(db, 'weather_data'), payload);

    // --- 🌟 เริ่มระบบดึงข้อมูล GISTDA ดิบ (API ตรง ไม่ต้องเปิดบราวเซอร์) ---
    console.log("Cron: กำลังดึงข้อมูล GISTDA...");
    let hotspotsTop5 = [];
    let burntAreaTop5 = [];
    
    // พจนานุกรมรหัสจังหวัด 2 ตัวแรก (อ้างอิงจาก TIS-1099)
    const provMap = {
      "10": "กรุงเทพมหานคร", "11": "สมุทรปราการ", "12": "นนทบุรี", "13": "ปทุมธานี", "14": "พระนครศรีอยุธยา", "15": "อ่างทอง", "16": "ลพบุรี", "17": "สิงห์บุรี", 
      "18": "ชัยนาท", "19": "สระบุรี", "20": "ชลบุรี", "21": "ระยอง", "22": "จันทบุรี", "23": "ตราด", "24": "ฉะเชิงเทรา", "25": "ปราจีนบุรี", "26": "นครนายก", 
      "27": "สระแก้ว", "30": "นครราชสีมา", "31": "บุรีรัมย์", "32": "สุรินทร์", "33": "ศรีสะเกษ", "34": "อุบลราชธานี", "35": "ยโสธร", "36": "ชัยภูมิ", 
      "37": "อำนาจเจริญ", "38": "บึงกาฬ", "39": "หนองบัวลำภู", "40": "ขอนแก่น", "41": "อุดรธานี", "42": "เลย", "43": "หนองคาย", "44": "มหาสารคาม", 
      "45": "ร้อยเอ็ด", "46": "กาฬสินธุ์", "47": "สกลนคร", "48": "นครพนม", "49": "มุกดาหาร", "50": "เชียงใหม่", "51": "ลำพูน", "52": "ลำปาง", "53": "อุตรดิตถ์", 
      "54": "แพร่", "55": "น่าน", "56": "พะเยา", "57": "เชียงราย", "58": "แม่ฮ่องสอน", "60": "นครสวรรค์", "61": "อุทัยธานี", "62": "กำแพงเพชร", "63": "ตาก", 
      "64": "สุโขทัย", "65": "พิษณุโลก", "66": "พิจิตร", "67": "เพชรบูรณ์", "70": "ราชบุรี", "71": "กาญจนบุรี", "72": "สุพรรณบุรี", "73": "นครปฐม", 
      "74": "สมุทรสาคร", "75": "สมุทรสงคราม", "76": "เพชรบุรี", "77": "ประจวบคีรีขันธ์", "80": "นครศรีธรรมราช", "81": "กระบี่", "82": "พังงา", "83": "ภูเก็ต", 
      "84": "สุราษฎร์ธานี", "85": "ระนอง", "86": "ชุมพร", "90": "สงขลา", "91": "สตูล", "92": "ตรัง", "93": "พัทลุง", "94": "ปัตตานี", "95": "ยะลา", "96": "นราธิวาส"
    };

    try {
        const fireRes = await fetch("https://disaster.gistda.or.th/app-api/services/viirs/7days");
        if (fireRes.ok) {
            const fireData = await fireRes.json();
            if (fireData && fireData.items) {
                const provCount = {};
                fireData.items.forEach(it => {
                    const provCode = String(it.amphoeCode).substring(0, 2);
                    const provName = provMap[provCode] || it.amphoe;
                    provCount[provName] = (provCount[provName] || 0) + 1;
                });
                hotspotsTop5 = Object.entries(provCount)
                    .map(([name, val]) => ({ province: name, value: val }))
                    .sort((a,b) => b.value - a.value).slice(0, 5);
            }
        }
    } catch(e) { console.error("Cron GISTDA Fire Error:", e); }

    try {
        const burnRes = await fetch("https://disaster.gistda.or.th/app-api/analytics/services/burn_10_Days/burn_10_days?sort=provinceCode:asc,amphoeCode:asc,tambonCode:asc,lu_name:asc,area:asc&offset=0&limit=10000");
        if (burnRes.ok) {
            const burnData = await burnRes.json();
            if (burnData && burnData.items) {
                const provCount = {};
                burnData.items.forEach(it => {
                    const provCode = String(it.amphoeCode).substring(0, 2);
                    const provName = provMap[provCode] || it.amphoe;
                    provCount[provName] = (provCount[provName] || 0) + (it.area || 0);
                });
                burntAreaTop5 = Object.entries(provCount)
                    .map(([name, val]) => ({ province: name, value: Math.round(val) }))
                    .sort((a,b) => b.value - a.value).slice(0, 5);
            }
        }
    } catch(e) { console.error("Cron GISTDA Burn Error:", e); }

    // ✅ FIX: ลบ hardcoded fallback ออก — ถ้า API ล่มจะแสดง "ไม่มีข้อมูล" แทนข้อมูลปลอม
    const gistdaPayload = {
        lastUpdated: bangkokTime.toISOString(),
        hotspots: hotspotsTop5,
        burntArea: burntAreaTop5,
        // ⚠️ GISTDA ไม่มี Public API สำหรับข้อมูลเหล่านี้ — ส่ง array ว่างจนกว่าจะหา API ได้
        lowSoilMoisture: [],
        lowVegetationMoisture: [],
        floodArea: []
    };
    await set(ref(db, 'gistda_disaster'), gistdaPayload);

    return res.status(200).json({ success: true, message: `Auto-Sync สภาพอากาศและ GISTDA สำเร็จ!` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.toString() });
  }
}