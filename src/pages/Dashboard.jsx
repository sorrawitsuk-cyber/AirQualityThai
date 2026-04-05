// src/pages/Dashboard.jsx
import React, { useContext, useState, useEffect, useMemo } from 'react';
import { WeatherContext } from '../context/WeatherContext';
import { extractProvince } from '../utils/helpers';

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

// คำนวณสีและข้อความของ PM2.5
const getAQILevel = (pm25) => {
  if (pm25 == null) return { text: 'ไม่มีข้อมูล', color: '#94a3b8', bg: 'rgba(148,163,184,0.2)' };
  if (pm25 <= 15) return { text: 'ดีเยี่ยม', color: '#00e400', bg: 'rgba(0,228,0,0.9)', font: '#000' };
  if (pm25 <= 25) return { text: 'ดี', color: '#ffff00', bg: 'rgba(255,255,0,0.9)', font: '#000' };
  if (pm25 <= 37.5) return { text: 'ปานกลาง', color: '#ff7e00', bg: 'rgba(255,126,0,0.9)', font: '#fff' };
  if (pm25 <= 75) return { text: 'เริ่มมีผลกระทบ', color: '#ff0000', bg: 'rgba(255,0,0,0.9)', font: '#fff' };
  return { text: 'อันตราย', color: '#8f3f97', bg: 'rgba(143,63,151,0.9)', font: '#fff' };
};

export default function Dashboard() {
  const { stations, stationTemps, loading, darkMode } = useContext(WeatherContext);
  
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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: darkMode ? '#020617' : '#f1f5f9', color: darkMode ? '#fff' : '#000' }}>📍 กำลังระบุตำแหน่งของคุณ... ⏳</div>;
  }

  if (!selectedStation) return <div>ไม่มีข้อมูลสถานี</div>;

  // --- 🛠️ เตรียมข้อมูลตัวเลขทั้งหมด ---
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

  // สีพื้นหลังของการ์ดหลัก (เปลี่ยนตามสภาพอากาศ)
  let bgGradient = darkMode ? 'linear-gradient(135deg, #1e3a8a, #0f172a)' : 'linear-gradient(135deg, #0ea5e9, #38bdf8)';
  if (isRaining) bgGradient = 'linear-gradient(135deg, #334155, #0f172a)';
  else if (isHot) bgGradient = 'linear-gradient(135deg, #ea580c, #9a3412)';

  // --- 🔮 สร้างข้อมูลพยากรณ์จำลอง ---
  const currentHour = new Date().getHours();
  const hourlyForecast = Array.from({length: 24}, (_, i) => {
    const hr = (currentHour + i) % 24;
    const timeStr = `${hr.toString().padStart(2, '0')}:00`;
    const tempVar = Math.sin((hr - 6) * Math.PI / 12) * 5; 
    const fTemp = Math.round(tempVal + tempVar);
    return {
      time: i === 0 ? 'ตอนนี้' : timeStr,
      temp: fTemp,
      icon: (hr >= 18 || hr <= 5) ? '🌙' : (fTemp > 33 ? '☀️' : '🌤️'),
    };
  });

  const daysTh = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const dailyForecast = Array.from({length: 7}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return {
      day: i === 0 ? 'วันนี้' : daysTh[d.getDay()],
      min: Math.round(tempVal - 4 - Math.random() * 2),
      max: Math.round(tempVal + 3 + Math.random() * 3),
      icon: Math.random() > 0.7 ? '🌧️' : (Math.random() > 0.5 ? '🌤️' : '☀️')
    };
  });

  // สี Theme
  const appBg = darkMode ? '#020617' : '#f8fafc'; // พื้นหลังสุด
  const cardBg = darkMode ? '#0f172a' : '#ffffff'; // กล่องพยากรณ์
  const textColor = darkMode ? '#f8fafc' : '#0f172a';
  const subTextColor = darkMode ? '#94a3b8' : '#64748b';

  return (
    <div style={{ height: '100%', width: '100%', background: appBg, display: 'flex', justifyContent: 'center', overflowY: 'auto' }} className="hide-scrollbar">
      
      <style dangerouslySetInlineStyle={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />

      {/* 📱 Mobile Container (จัดกึ่งกลางความกว้างสูงสุด 600px) */}
      <div style={{ width: '100%', maxWidth: '600px', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px', padding: isMobile ? '15px' : '30px', paddingBottom: '100px', fontFamily: 'Kanit, sans-serif' }}>

        {/* 🌟 1. Header (เลือกจังหวัด + เขต) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, position: 'relative' }}>
             {/* ดรอปดาวน์ซ่อนเนียนๆ ให้ดูเหมือนหัวข้อแอป */}
             <select 
               value={extractProvince(selectedStation.areaTH)} 
               onChange={(e) => {
                 const target = safeStations.find(s => extractProvince(s.areaTH) === e.target.value);
                 if(target) setSelectedStation(target);
               }}
               style={{ 
                 background: 'transparent', color: textColor, border: 'none', 
                 fontSize: '1.8rem', fontWeight: '900', outline: 'none', cursor: 'pointer', 
                 appearance: 'none', padding: 0, margin: 0, width: '100%', fontFamily: 'Kanit'
               }}
             >
               {provinces.map(p => <option key={p} value={p} style={{color: '#000'}}>{p}</option>)}
             </select>
             <div style={{ color: subTextColor, fontSize: '0.9rem', fontWeight: 'bold', marginTop: '2px' }}>
               📍 เขต{extractDistrict(selectedStation.areaTH)}
             </div>
          </div>
          <button style={{ background: darkMode ? '#1e293b' : '#e2e8f0', color: textColor, border: 'none', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             🔔
          </button>
        </div>

        {/* 🌟 2. Hero Widget (การ์ดสภาพอากาศหลักที่เคยว่างเปล่า จัดเต็มแล้ว!) */}
        <div style={{ background: bgGradient, borderRadius: '30px', padding: '25px 20px', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
           
           {/* อุณหภูมิและไอคอน */}
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
              <span style={{ fontSize: '4.5rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>{weatherIcon}</span>
              <span style={{ fontSize: '5.5rem', fontWeight: '900', letterSpacing: '-0.05em', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))', lineHeight: 1 }}>{tempVal}°</span>
           </div>
           
           <div style={{ fontSize: '1.2rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)', marginTop: '5px' }}>
              {weatherText}
           </div>
           <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '2px' }}>
              รู้สึกเหมือน (Heat Index) {heatVal}°C
           </div>

           {/* 😷 ป้ายฝุ่น PM2.5 แบบแคปซูล */}
           <div style={{ marginTop: '15px', background: aqiInfo.bg, color: aqiInfo.font, padding: '6px 20px', borderRadius: '50px', fontSize: '0.9rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
              😷 ฝุ่น PM2.5: {pmVal || '-'} µg/m³ ({aqiInfo.text})
           </div>

           {/* 📊 4 ช่องข้อมูลย่อย (โอกาสฝน, ความชื้น, ลม, UV) */}
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', width: '100%', marginTop: '25px', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '15px 10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                 <span style={{ fontSize: '1.2rem' }}>☔</span>
                 <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>โอกาสฝน</span>
                 <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{rainProb}%</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                 <span style={{ fontSize: '1.2rem' }}>💧</span>
                 <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>ความชื้น</span>
                 <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{humidity}%</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                 <span style={{ fontSize: '1.2rem' }}>🌬️</span>
                 <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>ความเร็วลม</span>
                 <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{windVal} <span style={{fontSize:'0.6rem'}}>km/h</span></span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                 <span style={{ fontSize: '1.2rem' }}>☀️</span>
                 <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>UV Index</span>
                 <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{isHot ? 'สูง' : 'ปานกลาง'}</span>
              </div>
           </div>
        </div>

        {/* 🌟 3. พยากรณ์รายชั่วโมง (Hourly Forecast) */}
        <div style={{ background: cardBg, borderRadius: '25px', padding: '20px', border: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
           <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: textColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
             ⏱️ พยากรณ์รายชั่วโมง
           </h3>
           <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '5px' }} className="hide-scrollbar">
              {hourlyForecast.map((hr, idx) => (
                 <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '60px', background: idx === 0 ? (darkMode ? '#1e293b' : '#f1f5f9') : 'transparent', padding: '10px', borderRadius: '16px' }}>
                    <span style={{ fontSize: '0.85rem', color: subTextColor, fontWeight: idx===0?'bold':'normal' }}>{hr.time}</span>
                    <span style={{ fontSize: '1.5rem' }}>{hr.icon}</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: textColor }}>{hr.temp}°</span>
                 </div>
              ))}
           </div>
        </div>

        {/* 🌟 4. พยากรณ์ล่วงหน้า 7 วัน (7-Day Forecast) */}
        <div style={{ background: cardBg, borderRadius: '25px', padding: '20px', border: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
           <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: textColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
             📅 พยากรณ์ล่วงหน้า 7 วัน
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {dailyForecast.map((day, idx) => (
                 <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: idx !== 6 ? '15px' : '0', borderBottom: idx !== 6 ? `1px solid ${darkMode ? '#1e293b' : '#f1f5f9'}` : 'none' }}>
                    
                    {/* วันที่ */}
                    <div style={{ width: '40px', fontSize: '0.95rem', fontWeight: 'bold', color: textColor }}>
                       {day.day}
                    </div>
                    
                    {/* ไอคอน */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px' }}>
                       <span style={{ fontSize: '1.3rem' }}>{day.icon}</span>
                    </div>
                    
                    {/* หลอดกราฟ Min-Max */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
                       <span style={{ fontSize: '0.95rem', color: subTextColor, fontWeight: 'bold', width: '30px', textAlign: 'right' }}>{day.min}°</span>
                       
                       <div style={{ flex: 1, maxWidth: '120px', height: '6px', background: darkMode ? '#1e293b' : '#e2e8f0', borderRadius: '10px', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', left: '20%', right: '20%', top: 0, bottom: 0, background: 'linear-gradient(to right, #3b82f6, #f97316)', borderRadius: '10px' }}></div>
                       </div>
                       
                       <span style={{ fontSize: '0.95rem', color: textColor, fontWeight: '900', width: '30px', textAlign: 'left' }}>{day.max}°</span>
                    </div>

                 </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}