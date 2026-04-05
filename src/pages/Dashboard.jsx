// src/pages/Dashboard.jsx
import React, { useContext, useState, useEffect, useMemo } from 'react';
import { WeatherContext } from '../context/WeatherContext';
import { extractProvince } from '../utils/helpers';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from 'recharts';

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
  if (pm25 <= 15) return { text: 'ดีเยี่ยม', color: '#00e400', bg: 'rgba(0,228,0,0.9)', font: '#000' };
  if (pm25 <= 25) return { text: 'ดี', color: '#ffff00', bg: 'rgba(255,255,0,0.9)', font: '#000' };
  if (pm25 <= 37.5) return { text: 'ปานกลาง', color: '#ff7e00', bg: 'rgba(255,126,0,0.9)', font: '#fff' };
  if (pm25 <= 75) return { text: 'เริ่มมีผลกระทบ', color: '#ff0000', bg: 'rgba(255,0,0,0.9)', font: '#fff' };
  return { text: 'อันตราย', color: '#8f3f97', bg: 'rgba(143,63,151,0.9)', font: '#fff' };
};

export default function Dashboard() {
  const { stations, stationTemps, loading, darkMode, lastUpdateText } = useContext(WeatherContext);
  
  // 🌟 Hooks ทั้งหมดถูกประกาศไว้ด้านบนสุด ป้องกันจอขาว
  const [selectedStation, setSelectedStation] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  const safeStations = stations || [];
  const provinces = useMemo(() => [...new Set(safeStations.map(s => extractProvince(s.areaTH)))].sort((a, b) => a.localeCompare(b, 'th')), [safeStations]);

  // 1. เช็กขนาดหน้าจอ (Responsive)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024); // ตัดที่ 1024px สำหรับโหมด Pro Desktop
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. ดึงพิกัด GPS อัตโนมัติ (Hyper-local Logic)
  useEffect(() => {
    if (safeStations.length > 0 && !selectedStation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude; const lon = pos.coords.longitude;
            setUserCoords({ lat, lon });
            
            // จับคู่พิกัด GPS กับสถานีที่ใกล้ที่สุด (หรือในอนาคตใช้ยิง API Open-Meteo ได้เลย)
            let nearest = safeStations[0]; let minD = Infinity;
            safeStations.forEach(st => {
              const d = getDistance(lat, lon, parseFloat(st.lat), parseFloat(st.long));
              if (d < minD) { minD = d; nearest = st; }
            });
            setSelectedStation(nearest);
            setIsLocating(false);
          },
          () => {
            // โดนบล็อก GPS ให้ใช้ค่าเริ่มต้น
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeStations]);

  // 🌟 ป้องกันจอขาวระหว่างโหลด
  if (loading || isLocating) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: darkMode ? '#020617' : '#f1f5f9', color: darkMode ? '#fff' : '#000', fontSize: '1.2rem', fontWeight: 'bold' }}>📍 กำลังตรวจสอบพิกัดและสภาพอากาศของคุณ... ⏳</div>;
  }

  if (!selectedStation) return <div style={{padding: '20px', color: darkMode ? '#fff' : '#000'}}>⚠️ ไม่พบข้อมูลสถานี กรุณารีเฟรชหน้าจอ</div>;

  // --- 🛠️ เตรียมข้อมูลตัวเลขแบบปลอดภัย ---
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

  // Dynamic Background การ์ด Hero
  let bgGradient = darkMode ? 'linear-gradient(135deg, #1e3a8a, #0f172a)' : 'linear-gradient(135deg, #0ea5e9, #38bdf8)';
  if (isRaining) bgGradient = 'linear-gradient(135deg, #334155, #0f172a)';
  else if (isHot) bgGradient = 'linear-gradient(135deg, #ea580c, #9a3412)';

  // --- 🔮 สร้างข้อมูลพยากรณ์จำลอง (อิงจากค่าจริง) ---
  const currentHour = new Date().getHours();
  const hourlyForecast = Array.from({length: 24}, (_, i) => {
    const hr = (currentHour + i) % 24;
    const tempVar = Math.sin((hr - 6) * Math.PI / 12) * 5; 
    const fTemp = Math.max(20, Math.round(tempVal + tempVar));
    return {
      time: i === 0 ? 'ตอนนี้' : `${hr.toString().padStart(2, '0')}:00`,
      temp: fTemp,
      icon: (hr >= 18 || hr <= 5) ? '🌙' : (fTemp > 33 ? '☀️' : '🌤️'),
      chartVal: fTemp // สำหรับใช้วาดกราฟ
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
  const appBg = darkMode ? '#020617' : '#f8fafc';
  const cardBg = darkMode ? '#0f172a' : '#ffffff';
  const textColor = darkMode ? '#f8fafc' : '#0f172a';
  const subTextColor = darkMode ? '#94a3b8' : '#64748b';
  const borderColor = darkMode ? '#1e293b' : '#e2e8f0';

  return (
    <div style={{ height: '100%', width: '100%', background: appBg, display: 'flex', justifyContent: 'center', overflowY: 'auto' }} className="hide-scrollbar">
      <style dangerouslySetInlineStyle={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />

      {/* 🌟 คอนเทนเนอร์หลัก (Adaptive Layout: เปลี่ยนแนวการเรียงตามขนาดจอ) */}
      <div style={{ 
        width: '100%', 
        maxWidth: isMobile ? '600px' : '1200px', // จอคอมขยายได้ถึง 1200px
        minHeight: '100%', 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', // มือถือเรียงลงล่าง คอมเรียงซ้ายขวา
        gap: '20px', 
        padding: isMobile ? '15px' : '30px', 
        paddingBottom: '100px', 
        fontFamily: 'Kanit, sans-serif' 
      }}>

        {/* ======================================================== */}
        {/* 📱 ฝั่งซ้าย (หรือด้านบนในมือถือ) : Hero Dashboard */}
        {/* ======================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          
          {/* Header: แสดงพิกัดและเวลา */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
               <select 
                 value={extractProvince(selectedStation.areaTH)} 
                 onChange={(e) => {
                   const target = safeStations.find(s => extractProvince(s.areaTH) === e.target.value);
                   if(target) setSelectedStation(target);
                 }}
                 style={{ background: 'transparent', color: textColor, border: 'none', fontSize: isMobile ? '1.8rem' : '2.2rem', fontWeight: '900', outline: 'none', cursor: 'pointer', appearance: 'none', padding: 0, fontFamily: 'Kanit' }}
               >
                 {provinces.map(p => <option key={p} value={p} style={{color: '#000'}}>{p}</option>)}
               </select>
               <div style={{ color: subTextColor, fontSize: '0.95rem', fontWeight: 'bold', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                 📍 เขต{extractDistrict(selectedStation.areaTH)} 
                 {userCoords && <span style={{fontSize: '0.75rem', background: darkMode?'#1e293b':'#e2e8f0', padding: '2px 8px', borderRadius: '10px'}}>GPS: {userCoords.lat.toFixed(2)}, {userCoords.lon.toFixed(2)}</span>}
               </div>
            </div>
            {!isMobile && <div style={{ color: subTextColor, fontSize: '0.8rem', fontWeight: 'bold', background: cardBg, padding: '8px 15px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>อัปเดต: {lastUpdateText || '-'}</div>}
          </div>

          {/* การ์ดอากาศหลัก (Hero Widget) */}
          <div style={{ background: bgGradient, borderRadius: '30px', padding: isMobile ? '25px 20px' : '40px 30px', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
             
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                <span style={{ fontSize: isMobile ? '4.5rem' : '6rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>{weatherIcon}</span>
                <span style={{ fontSize: isMobile ? '5.5rem' : '7rem', fontWeight: '900', letterSpacing: '-0.05em', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))', lineHeight: 1 }}>{tempVal}°</span>
             </div>
             
             <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)', marginTop: '10px' }}>
                {weatherText}
             </div>
             <div style={{ fontSize: '1rem', opacity: 0.9, marginTop: '2px' }}>
                รู้สึกเหมือน (Heat Index) {heatVal}°C
             </div>

             <div style={{ marginTop: '20px', background: aqiInfo.bg, color: aqiInfo.font, padding: '8px 25px', borderRadius: '50px', fontSize: '1rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                😷 ฝุ่น PM2.5: {pmVal || '-'} µg/m³ ({aqiInfo.text})
             </div>

             {/* ข้อมูลย่อย 4 ช่อง */}
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', width: '100%', marginTop: '30px', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '15px 10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                   <span style={{ fontSize: '1.4rem' }}>☔</span>
                   <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>โอกาสฝน</span>
                   <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{rainProb}%</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                   <span style={{ fontSize: '1.4rem' }}>💧</span>
                   <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>ความชื้น</span>
                   <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{humidity}%</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                   <span style={{ fontSize: '1.4rem' }}>🌬️</span>
                   <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>ลม</span>
                   <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{windVal} <span style={{fontSize:'0.6rem'}}>km/h</span></span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                   <span style={{ fontSize: '1.4rem' }}>☀️</span>
                   <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>UV</span>
                   <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{isHot ? 'สูง' : 'ปานกลาง'}</span>
                </div>
             </div>
          </div>
          
          {/* AI Insights (สรุปสั้นๆ ให้ดูฉลาด) */}
          <div style={{ background: cardBg, padding: '20px', borderRadius: '25px', border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'flex-start', gap: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '2rem' }}>🤖</span>
            <div>
               <h4 style={{ margin: '0 0 5px 0', color: textColor, fontSize: '1rem' }}>คำแนะนำจาก AI</h4>
               <p style={{ margin: 0, color: subTextColor, fontSize: '0.9rem', lineHeight: 1.5 }}>
                 {isRaining ? "เตรียมร่มและเสื้อกันฝนให้พร้อม โอกาสฝนตกสูงในพื้นที่นี้ การจราจรอาจติดขัดเผื่อเวลาเดินทางด้วยนะครับ" 
                  : (isHot ? "แดดร้อนจัด ดื่มน้ำเยอะๆ และหลีกเลี่ยงการทำกิจกรรมกลางแจ้งเป็นเวลานานเพื่อป้องกันฮีทสโตรก" 
                  : "อากาศค่อนข้างเป็นใจ เหมาะกับการทำกิจกรรมนอกบ้านครับ")}
               </p>
            </div>
          </div>
        </div>


        {/* ======================================================== */}
        {/* 💻 ฝั่งขวา (หรือด้านล่างในมือถือ) : Pro Data Monitor */}
        {/* ======================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: isMobile ? 'none' : '1.2' }}>
          
          {/* พยากรณ์รายชั่วโมง (พร้อมกราฟในโหมด Desktop) */}
          <div style={{ background: cardBg, borderRadius: '25px', padding: '20px', border: `1px solid ${borderColor}`, boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
             <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: textColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
               ⏱️ แนวโน้มอุณหภูมิ 24 ชั่วโมง
             </h3>
             
             {!isMobile && (
               <div style={{ height: '120px', width: '100%', marginBottom: '15px' }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={hourlyForecast.slice(0, 12)} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                         <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <RechartsTooltip contentStyle={{ background: cardBg, borderColor: borderColor, borderRadius: '10px', color: textColor }} />
                     <Area type="monotone" dataKey="chartVal" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
             )}

             <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }} className="hide-scrollbar">
                {hourlyForecast.map((hr, idx) => (
                   <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '65px', background: idx === 0 ? (darkMode ? '#1e293b' : '#f1f5f9') : 'transparent', padding: '12px 10px', borderRadius: '16px' }}>
                      <span style={{ fontSize: '0.85rem', color: subTextColor, fontWeight: idx===0?'bold':'normal' }}>{hr.time}</span>
                      <span style={{ fontSize: '1.6rem' }}>{hr.icon}</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: textColor }}>{hr.temp}°</span>
                   </div>
                ))}
             </div>
          </div>

          {/* พยากรณ์ล่วงหน้า 7 วัน */}
          <div style={{ background: cardBg, borderRadius: '25px', padding: '25px', border: `1px solid ${borderColor}`, boxShadow: '0 10px 30px rgba(0,0,0,0.02)', flex: 1 }}>
             <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: textColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
               📅 พยากรณ์ล่วงหน้า 7 วัน
             </h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {dailyForecast.map((day, idx) => (
                   <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: idx !== 6 ? '18px' : '0', borderBottom: idx !== 6 ? `1px solid ${borderColor}` : 'none' }}>
                      
                      <div style={{ width: '45px', fontSize: '1rem', fontWeight: 'bold', color: textColor }}>
                         {day.day}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px' }}>
                         <span style={{ fontSize: '1.5rem' }}>{day.icon}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, justifyContent: 'flex-end' }}>
                         <span style={{ fontSize: '1rem', color: subTextColor, fontWeight: 'bold', width: '35px', textAlign: 'right' }}>{day.min}°</span>
                         
                         <div style={{ flex: 1, maxWidth: '150px', height: '8px', background: darkMode ? '#1e293b' : '#e2e8f0', borderRadius: '10px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', left: '20%', right: '20%', top: 0, bottom: 0, background: 'linear-gradient(to right, #3b82f6, #f97316)', borderRadius: '10px' }}></div>
                         </div>
                         
                         <span style={{ fontSize: '1rem', color: textColor, fontWeight: '900', width: '35px', textAlign: 'left' }}>{day.max}°</span>
                      </div>

                   </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}