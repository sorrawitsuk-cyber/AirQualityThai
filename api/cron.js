import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import { provinces77 } from '../src/provinces77.js';

export default async function handler(req, res) {
  try {
    console.log("Cron: เริ่มทำงานและดึงข้อมูลอดีต...");

    // เช็คกุญแจ Firebase (ระบบป้องกันที่ทำไว้เดิม)
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

      // 🌟 ทริคแยกร่าง: ใส่ past_days=1 เพื่อดึงของเมื่อวานมาด้วย (Index 0 = เมื่อวาน, Index 1 = วันนี้)
      const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m&daily=apparent_temperature_max,precipitation_probability_max,uv_index_max,wind_speed_10m_max&timezone=Asia%2FBangkok&past_days=1&forecast_days=2&_t=${timestamp}`;
      
      // 🌟 ดึงรายชั่วโมงเพื่อเอามาหาค่าฝุ่น PM2.5 สูงสุดของเมื่อวาน
      const aUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}&current=pm2_5&hourly=pm2_5&timezone=Asia%2FBangkok&past_days=1&forecast_days=1&_t=${timestamp}`;

      const [wRes, aRes] = await Promise.all([fetch(wUrl), fetch(aUrl)]);

      if (wRes.ok && aRes.ok) {
        const wJson = await wRes.json();
        const aJson = await aRes.json();
        allWData = [...allWData, ...(Array.isArray(wJson) ? wJson : [wJson])];
        allAData = [...allAData, ...(Array.isArray(aJson) ? aJson : [aJson])];
      }
      if (i + chunkSize < provinces77.length) await new Promise(r => setTimeout(r, 1000));
    }

    const newStations = [];
    const newTemps = {};
    const newYesterday = {}; // 🌟 ลิ้นชักเก็บสถิติเมื่อวาน

    provinces77.forEach((p, idx) => {
      const w = allWData[idx] || {};
      const a = allAData[idx] || {};
      const sID = `PROV_${idx}`;

      newStations.push({
        stationID: sID, areaTH: p.n, lat: p.lat, long: p.lon,
        AQILast: { PM25: { value: Math.round(a.current?.pm2_5 || 0) } }
      });

      newTemps[sID] = {
        temp: Math.round(w.current?.temperature_2m || 0),
        feelsLike: Math.round(w.current?.apparent_temperature || 0),
        humidity: Math.round(w.current?.relative_humidity_2m || 0),
        rainProb: Math.round(w.daily?.precipitation_probability_max?.[1] || 0), // [1] คือวันนี้
        windSpeed: Math.round(w.current?.wind_speed_10m || 0),
        windDir: Math.round(w.current?.wind_direction_10m || 0),
        uv: Math.round(w.daily?.uv_index_max?.[1] || 0) // [1] คือวันนี้
      };

      // 🌟 คำนวณหาค่า PM2.5 ที่แย่ที่สุดของเมื่อวาน (24 ชั่วโมงแรก)
      let prevPm = 0;
      if (a.hourly && a.hourly.pm2_5) {
          const yesterdayHourly = a.hourly.pm2_5.slice(0, 24).filter(v => v !== null);
          if(yesterdayHourly.length > 0) prevPm = Math.max(...yesterdayHourly);
      }

      // 🌟 ยัดข้อมูลอดีตลงตู้เซฟ (ดึงจาก Index 0)
      newYesterday[sID] = {
        temp: Math.round(w.daily?.apparent_temperature_max?.[0] || w.current?.apparent_temperature || 0),
        pm25: Math.round(prevPm || a.current?.pm2_5 || 0),
        uv: Math.round(w.daily?.uv_index_max?.[0] || 0),
        rain: Math.round(w.daily?.precipitation_probability_max?.[0] || 0),
        wind: Math.round(w.daily?.wind_speed_10m_max?.[0] || w.current?.wind_speed_10m || 0)
      };
    });

    // 🌟 นำข้อมูลวันนี้และเมื่อวาน แพ็กรวมกันส่งเข้า Firebase ทีเดียว!
    const payload = { 
        lastUpdated: new Date().toISOString(), 
        stations: newStations, 
        stationTemps: newTemps,
        stationYesterday: newYesterday 
    };
    
    await set(ref(db, 'weather_data'), payload);
    return res.status(200).json({ success: true, message: 'Auto-Sync สำเร็จ! สถิติวันนี้และเมื่อวานเข้า Firebase แล้ว' });
  } catch (error) {
    console.error("Cron Error Details:", error);
    return res.status(500).json({ success: false, error: error.toString(), stack: error.stack });
  }
}