import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import { provinces77 } from '../src/provinces77.js';

export default async function handler(req, res) {
  try {
    console.log("Cron: เริ่มทำงาน...");

    // 1. ดึง URL มาเก็บในตัวแปรตรงๆ เพื่อเช็คให้ชัวร์ก่อนเลย
    const dbUrl = process.env.VITE_FIREBASE_DATABASE_URL;

    if (!dbUrl) {
        // ถ้ายามหน้าประตูหา URL ไม่เจอ ให้พ่น Error ออกมาทางหน้าจอเลย จะได้ไม่ Crash
        return res.status(500).json({ 
            success: false, 
            error: "🚨 หา VITE_FIREBASE_DATABASE_URL ไม่เจอ! รบกวนเช็คใน Vercel Environment Variables อีกรอบครับ" 
        });
    }

    // 2. ตั้งค่า Firebase (เอามาไว้ข้างในนี้ จะได้ดึงกุญแจทัน)
    const firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      databaseURL: dbUrl,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID
    };

    // 3. ปลุก Firebase และบังคับยัด dbUrl เข้าไปตรงๆ ให้มันเถียงไม่ออก!
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getDatabase(app, dbUrl); 

    // --- ส่วนของการดึงข้อมูลเหมือนเดิม ---
    const chunkSize = 40; 
    let allWData = [];
    let allAData = [];
    const timestamp = Date.now(); // Cache buster ป้องกันข้อมูลเก่า

    for (let i = 0; i < provinces77.length; i += chunkSize) {
      const chunk = provinces77.slice(i, i + chunkSize);
      const lats = chunk.map(p => p.lat).join(',');
      const lons = chunk.map(p => p.lon).join(',');

      const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m&daily=precipitation_probability_max,uv_index_max&timezone=Asia%2FBangkok&_t=${timestamp}`;
      const aUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}&current=pm2_5&timezone=Asia%2FBangkok&_t=${timestamp}`;

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
        rainProb: Math.round(w.daily?.precipitation_probability_max?.[0] || 0),
        windSpeed: Math.round(w.current?.wind_speed_10m || 0),
        windDir: Math.round(w.current?.wind_direction_10m || 0),
        uv: Math.round(w.daily?.uv_index_max?.[0] || 0) // เพิ่มรังสี UV
      };
    });

    const payload = { lastUpdated: new Date().toISOString(), stations: newStations, stationTemps: newTemps };
    await set(ref(db, 'weather_data'), payload);
    
    return res.status(200).json({ success: true, message: 'Auto-Sync สำเร็จ! ข้อมูลใหม่เข้า Firebase แล้ว' });
  } catch (error) {
    // ดัก Error ให้โชว์ออกมาที่หน้าจอชัดๆ จะได้ไม่ต้องไปงมใน Logs
    console.error("Cron Error Details:", error);
    return res.status(500).json({ success: false, error: error.toString(), stack: error.stack });
  }
}