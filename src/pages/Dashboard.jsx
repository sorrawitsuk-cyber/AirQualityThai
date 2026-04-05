// src/pages/Dashboard.jsx
import React, { useContext, useState, useEffect, useMemo } from 'react';
import { WeatherContext } from '../context/WeatherContext';
import { extractProvince, getPM25Color } from '../utils/helpers';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// --- ฟังก์ชันช่วยเหลือ (Helpers) ---
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const extractDistrict = (areaTH) => {
  if (!areaTH) return 'ทั่วไป';
  const match = areaTH.match(/(เขต|อ\.|อำเภอ)\s*([a-zA-Zก-ฮะ-์]+)/);
  if (match) return match[2];
  return areaTH.split(' ')[0]; 
};

const getAQILevel = (pm25) => {
  if (pm25 == null) return { text: 'ไม่มีข้อมูล', color: '#94a3b8', bg: 'rgba(148,163,184,0.2)' };
  if (pm25 <= 15) return { text: 'ดีเยี่ยม', color: '#00e400', bg: 'rgba(0,228,0,0.8)', font: '#000' };
  if (pm25 <= 25) return { text: 'ดี', color: '#ffff00', bg: 'rgba(255,255,0,0.8)', font: '#000' };
  if (pm25 <= 37.5) return { text: 'ปานกลาง', color: '#ff7e00', bg: 'rgba(255,126,0,0.8)', font: '#fff' };
  if (pm25 <= 75) return { text: 'เริ่มมีผลกระทบ', color: '#ff0000', bg: 'rgba(255,0,0,0.8)', font: '#fff' };
  return { text: 'อันตราย', color: '#8f3f97', bg: 'rgba(143,63,151,0.8)', font: '#fff' };
};

export default function Dashboard() {
  const { stations, stationTemps, loading, darkMode, lastUpdateText } = useContext(WeatherContext);
  
  const [selectedStation, setSelectedStation] = useState(null);
  const [isLocating, setIsLocating] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  const safeStations = stations || [];
  const provinces = useMemo(() => [...new Set(safeStations.map(s => extractProvince(s.areaTH)))].sort((a, b) => a.localeCompare(b, 'th')), [safeStations]);

  // 🌟 ระบบ Auto-Location หาพิกัดผู้ใช้ตอนโหลดหน้าเว็บ
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    if (safeStations.length > 0 && !selectedStation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude; const lon = pos.coords.longitude;
            let nearest = safeStations[0]; let minD = Infinity;
            safeStations.forEach(st => {
              const d = getDistance(lat, lon, parseFloat(st.lat), parseFloat(st.long));
              if (d < minD) { minD = d; nearest = st; }
            });
            setSelectedStation(nearest);
            setIsLocating(false);
          },
          () => {
            // ถ้าไม่อนุญาต GPS ให้ใช้ กทม. เป็นค่าเริ่มต้น
            setSelectedStation(safeStations.find(s => extractProvince(s.areaTH) === 'กรุงเทพมหานคร') || safeStations[0]);
            setIsLocating(false);
          },
          { timeout: 5000 }
        );
      } else {
        setSelectedStation(safeStations.find(s => extractProvince(s.areaTH) === 'กรุงเทพมหานคร') || safeStations[0]);
        setIsLocating(false);
      }
    }
    return () => window.removeEventListener('resize', handleResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeStations]);

  if (loading || isLocating) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: darkMode ? '#0f172a' : '#f0f9ff', color: darkMode ? '#fff' : '#000' }}>📍 กำลังค้นหาตำแหน่งของคุณ... ⏳</div>;
  }

  if (!selectedStation) return <div>ไม่มีข้อมูลสถานี</div>;

  // --- ดึงข้อมูลสภาพอากาศปัจจุบัน ---
  const tObj = stationTemps[selectedStation.stationID] || {};
  const pmVal = selectedStation.AQILast?.PM25?.value ? Number(selectedStation.AQILast.PM25.value) : null;
  const aqiInfo = getAQILevel(pmVal);
  
  const tempVal = tObj.temp != null ? Math.round(tObj.temp) : 30;
  const heatVal = tObj.feelsLike != null ? Math.round(tObj.feelsLike) : tempVal + 2;
  const rainProb = tObj.rainProb != null ? Math.round(tObj.rainProb) : 0;
  const humidity = tObj.humidity != null ? tObj.humidity : 60;
  const windVal = tObj.windSpeed != null ? Math.round(tObj.windSpeed) : 5;

  const isRaining = rainProb > 50;
  const isHot = heatVal >= 38;
  const weatherIcon = isRaining ? '🌧️' : (isHot ? '☀️' : '🌤️');
  const weatherText = isRaining ? 'มีโอกาสฝนตกหนัก' : (isHot ? 'แดดจัดและร้อนมาก' : 'ท้องฟ้าโปร่ง มีเมฆบางส่วน');

  // --- 🎨 Dynamic Background (เปลี่ยนสีตามสภาพอากาศ) ---
  let bgGradient = darkMode ? 'linear-gradient(135deg, #0f172a, #1e293b)' : 'linear-gradient(135deg, #0ea5e9, #38bdf8)';
  if (isRaining) bgGradient = 'linear-gradient(135deg, #475569, #1e293b)';
  else if (isHot) bgGradient = 'linear-gradient(135deg, #f97316, #ea580c)';

  // --- 🔮 สร้างข้อมูลพยากรณ์จำลอง (Hourly & Daily) อิงจากค่าจริง ---
  const currentHour = new Date().getHours();
  const hourlyForecast = Array.from({length: 24}, (_, i) => {
    const hr = (currentHour + i) % 24;
    const timeStr = `${hr.toString().padStart(2, '0')}:00`;
    const tempVar = Math.sin((hr - 6) * Math.PI / 12) * 5; // จำลองอุณหภูมิขึ้นลงตามเวลา
    const fTemp = Math.round(tempVal + tempVar);
    return {
      time: i === 0 ? 'ตอนนี้' : timeStr,
      temp: fTemp,
      icon: (hr >= 18 || hr <= 5) ? '🌙' : (fTemp > 33 ? '☀️' : '🌤️'),
      rain: Math.max(0, rainProb - i * 3)
    };
  });

  const daysTh = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const dailyForecast = Array.from({length: 7}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return {
      day: i === 0 ? 'วันนี้' : daysTh[d.getDay()],
      min: Math.round(tempVal - 4 - Math.random() * 2),
      max: Math.round(tempVal + 3 + Math.random() * 3),
      rain: Math.max(0, Math.round(rainProb + (Math.random() * 40 - 20))),
      icon: Math.random() > 0.7 ? '🌧️' : '🌤️'
    };
  });

  return (
    <div style={{ height: '100%', width: '100%', background: darkMode ? '#020617' : '#f1f5f9', display: 'flex', justifyContent: 'center', overflowY: 'auto' }} className="hide-scrollbar">
      <style dangerouslySetInlineStyle={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />

      {/* 📱 Mobile Container (จำกัดความกว้างให้ดูเหมือนแอปมือถือ) */}
      <div style={{ width: '100%', maxWidth: '600px', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px', padding: isMobile ? '15px' : '30px', paddingBottom: '100px', fontFamily: 'Kanit, sans-serif' }}>

        {/* 🌟 1. ส่วนหัว (Header & Auto-Location) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
             <select 
               value={extractProvince(selectedStation.areaTH)} 
               onChange={(e) => {
                 const target = safeStations.find(s => extractProvince(s.areaTH) === e.target.value);
                 if(target) setSelectedStation(target);
               }}
               style={{ background: 'transparent', color: darkMode ? '#fff' : '#0f172a', border: 'none', fontSize: '1.5rem', fontWeight: '900', outline: 'none', cursor: 'pointer', appearance: 'none', padding: 0 }}
             >
               {provinces.map(p => <option key={p} value={p} style={{color: '#000'}}>{p}</option>)}
             </select>
             <div style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '0.9rem', fontWeight: 'bold' }}>
               📍 เขต{extractDistrict(selectedStation.areaTH)}
             </div>
          </div>
          <button style={{ background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', border: 'none', width: '45px', height: '45px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             🔔
          </button>
        </div>

        {/* 🌟 2. Hero Widget (การ์ดสภาพอากาศหลัก) */}
        <div style={{ background: bgGradient, borderRadius: '35px', padding: '30px 20px', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
           
           {/* อุณหภูมิยักษ์ */}
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
              <span style={{ fontSize: '5rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>{weatherIcon}</span>
              <span style={{ fontSize: '6rem', fontWeight: '900', letterSpacing: '-0.05em', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>{tempVal}°</span>
           </div>
           
           <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '-10px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              {weatherText}
           </div>
           <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '5px' }}>
              รู้สึกเหมือน {heatVal}°C
           </div>

           {/* ป้าย PM2.5 */}
           <div style={{ marginTop: '20px', background: aqiInfo.bg, color: aqiInfo.font, padding: '6px 20px', borderRadius: '50px', fontSize: '0.95rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
              😷 PM2.5: {pmVal || '-'} ({aqiInfo.text})
           </div>

           {/* 4 ช่องข้อมูลย่อย (Glassmorphism) */}
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', width: '100%', marginTop: '35px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(15px)', borderRadius: '25px', padding: '15px 10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                 <span style={{ fontSize: '1.2rem' }}>☔</span>
                 <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>ฝนตก</span>
                 <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{rainProb}%</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                 <span style={{ fontSize: '1.2rem' }}>💧</span>
                 <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>ความชื้น</span>
                 <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{humidity}%</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                 <span style={{ fontSize: '1.2rem' }}>🌬️</span>
                 <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>ลม</span>
                 <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{windVal} <span style={{fontSize:'0.6rem'}}>km/h</span></span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                 <span style={{ fontSize: '1.2rem' }}>☀️</span>
                 <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>UV</span>
                 <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>ปานกลาง</span>
              </div>
           </div>
        </div>

        {/* 🌟 3. พยากรณ์รายชั่วโมง (Hourly Forecast - แถบเลื่อนซ้ายขวา) */}
        <div style={{ background: darkMode ? '#0f172a' : '#fff', borderRadius: '25px', padding: '20px', border: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
           <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: darkMode ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
             ⏱️ พยากรณ์รายชั่วโมง
           </h3>
           <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }} className="hide-scrollbar">
              {hourlyForecast.map((hr, idx) => (
                 <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '60px', background: idx === 0 ? (darkMode ? '#1e293b' : '#f1f5f9') : 'transparent', padding: '10px', borderRadius: '16px' }}>
                    <span style={{ fontSize: '0.8rem', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: idx===0?'bold':'normal' }}>{hr.time}</span>
                    <span style={{ fontSize: '1.5rem' }}>{hr.icon}</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: darkMode ? '#f8fafc' : '#0f172a' }}>{hr.temp}°</span>
                    {hr.rain > 20 && <span style={{ fontSize: '0.7rem', color: '#0ea5e9', fontWeight: 'bold' }}>{hr.rain}%</span>}
                 </div>
              ))}
           </div>
        </div>

        {/* 🌟 4. พยากรณ์รายสัปดาห์ 7 วัน (7-Day Forecast - แนวตั้ง) */}
        <div style={{ background: darkMode ? '#0f172a' : '#fff', borderRadius: '25px', padding: '20px', border: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
           <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: darkMode ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
             📅 พยากรณ์ล่วงหน้า 7 วัน
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {dailyForecast.map((day, idx) => (
                 <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: idx !== 6 ? '15px' : '0', borderBottom: idx !== 6 ? `1px solid ${darkMode ? '#1e293b' : '#f1f5f9'}` : 'none' }}>
                    
                    {/* วันที่ */}
                    <div style={{ width: '40px', fontSize: '0.95rem', fontWeight: 'bold', color: darkMode ? '#f8fafc' : '#0f172a' }}>
                       {day.day}
                    </div>
                    
                    {/* โอกาสฝน + ไอคอน */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '70px' }}>
                       {day.rain > 30 ? <span style={{ fontSize: '0.75rem', color: '#0ea5e9', fontWeight: 'bold', width: '25px', textAlign: 'right' }}>{day.rain}%</span> : <span style={{width: '25px'}}></span>}
                       <span style={{ fontSize: '1.3rem' }}>{day.icon}</span>
                    </div>
                    
                    {/* หลอดกราฟอุณหภูมิ Min-Max */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
                       <span style={{ fontSize: '0.9rem', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 'bold', width: '30px', textAlign: 'right' }}>{day.min}°</span>
                       
                       {/* หลอดสี */}
                       <div style={{ flex: 1, maxWidth: '100px', height: '6px', background: darkMode ? '#1e293b' : '#e2e8f0', borderRadius: '10px', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', left: '20%', right: '20%', top: 0, bottom: 0, background: 'linear-gradient(to right, #38bdf8, #f97316)', borderRadius: '10px' }}></div>
                       </div>
                       
                       <span style={{ fontSize: '0.9rem', color: darkMode ? '#f8fafc' : '#0f172a', fontWeight: '900', width: '30px', textAlign: 'left' }}>{day.max}°</span>
                    </div>

                 </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}