// src/pages/Dashboard.jsx
import React, { useContext, useState, useEffect } from 'react';
import { WeatherContext } from '../context/WeatherContext';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from 'recharts';

export default function Dashboard() {
  const { stations, weatherData, fetchWeatherByCoords, loadingWeather, darkMode, lastUpdateText } = useContext(WeatherContext);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [locationName, setLocationName] = useState('อยู่ระหว่างการประมวลผลพื้นที่...');
  
  const [selectedProv, setSelectedProv] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchLocationName = async (lat, lon) => {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=th`);
      const data = await res.json();
      setLocationName(data.locality || data.city || 'พิกัดภูมิศาสตร์ปัจจุบัน');
    } catch (e) { setLocationName('พิกัดภูมิศาสตร์ปัจจุบัน'); }
  };

  useEffect(() => {
    if (!weatherData) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
            fetchLocationName(pos.coords.latitude, pos.coords.longitude);
          }, 
          () => { fetchWeatherByCoords(13.75, 100.5); setLocationName('กรุงเทพมหานคร'); },
          { enableHighAccuracy: false, timeout: 3000, maximumAge: 300000 }
        );
      } else {
        fetchWeatherByCoords(13.75, 100.5); setLocationName('กรุงเทพมหานคร');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // เลือกระดับจังหวัด
  const handleProvChange = (e) => {
    const pName = e.target.value;
    setSelectedProv(pName); setSearchInput('');
    const target = stations.find(s => s.areaTH === pName);
    if (target) {
      fetchWeatherByCoords(target.lat, target.long);
      setLocationName(pName);
    }
  };

  // 🌟 ระบบค้นหาเชิงลึกระดับอำเภอ/ตำบล ผ่าน Geocoding API
  const handleSearch = async () => {
    if(!searchInput) return;
    setLocationName(`สืบค้นพิกัด: ${searchInput}...`);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${searchInput}&count=1&language=th`);
      const data = await res.json();
      if(data.results && data.results.length > 0) {
        fetchWeatherByCoords(data.results[0].latitude, data.results[0].longitude);
        setLocationName(`${data.results[0].name} ${data.results[0].admin1 ? '('+data.results[0].admin1+')' : ''}`);
        setSelectedProv('');
      } else {
        alert("ไม่พบข้อมูลพิกัดภูมิศาสตร์ที่ระบุ");
        setLocationName('พิกัดภูมิศาสตร์ปัจจุบัน');
      }
    } catch(e) { console.error(e); }
  };

  const appBg = darkMode ? '#020617' : '#f8fafc'; 
  const cardBg = darkMode ? '#0f172a' : '#ffffff';
  const textColor = darkMode ? '#f8fafc' : '#0f172a'; 
  const borderColor = darkMode ? '#1e293b' : '#e2e8f0';
  const subTextColor = darkMode ? '#94a3b8' : '#64748b'; 

  if (loadingWeather || !weatherData) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',background:appBg,color:textColor}}>📍 กำลังซิงโครไนซ์ข้อมูลอุตุนิยมวิทยาแบบเรียลไทม์...</div>;

  const { current, hourly, daily, coords } = weatherData;
  const aqiBg = current.pm25 > 75 ? '#ef4444' : current.pm25 > 37.5 ? '#f97316' : current.pm25 > 25 ? '#eab308' : '#22c55e';
  const aqiText = current.pm25 > 75 ? 'เริ่มมีผลกระทบ' : current.pm25 > 37.5 ? 'ปานกลาง' : 'คุณภาพอากาศดี';
  
  const isRaining = current.rain > 0; const isHot = current.feelsLike >= 38;
  const weatherIcon = isRaining ? '🌧️' : (isHot ? '☀️' : '🌤️');
  const weatherText = isRaining ? 'สภาวะฝนตกในพื้นที่' : (isHot ? 'สภาพอากาศร้อนจัด' : 'สภาวะอากาศปกติ (มีเมฆบางส่วน)');
  let bgGradient = darkMode ? 'linear-gradient(135deg, #1e3a8a, #0f172a)' : 'linear-gradient(135deg, #0ea5e9, #38bdf8)';
  if (isRaining) bgGradient = 'linear-gradient(135deg, #334155, #0f172a)'; else if (isHot) bgGradient = 'linear-gradient(135deg, #ea580c, #9a3412)';

  return (
    <div style={{ height: '100%', width: '100%', background: appBg, display: 'flex', justifyContent: 'center', overflowY: 'auto', fontFamily: 'Kanit, sans-serif' }} className="hide-scrollbar">
      <style dangerouslySetInlineStyle={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
      <div style={{ width: '100%', maxWidth: isMobile ? '600px' : '1200px', display: 'flex', flexDirection: 'column', gap: '20px', padding: isMobile ? '15px' : '30px', paddingBottom: '100px' }}>

        {/* 🌟 แผงควบคุมพิกัด (ค้นหาได้ทั้งประเทศ) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: cardBg, padding: '15px 20px', borderRadius: '16px', border: `1px solid ${borderColor}`, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.1rem', color: textColor, display: isMobile ? 'none' : 'block' }}>📍 ระบุพื้นที่ภูมิศาสตร์:</span>
          
          <select value={selectedProv} onChange={handleProvChange} style={{ flex: 1, minWidth: '150px', background: darkMode?'#1e293b':'#f1f5f9', color: '#0ea5e9', border: 'none', fontWeight: 'bold', fontSize: '1rem', padding: '10px 15px', borderRadius: '12px', outline: 'none' }}>
            <option value="">-- เลือก 77 จังหวัด --</option>
            {stations.map(p => <option key={p.stationID} value={p.areaTH}>{p.areaTH}</option>)}
          </select>

          <div style={{ display: 'flex', flex: 1.5, minWidth: '200px', background: darkMode?'#1e293b':'#f1f5f9', borderRadius: '12px', padding: '5px' }}>
            <input 
              type="text" value={searchInput} onChange={(e)=>setSearchInput(e.target.value)} 
              placeholder="หรือพิมพ์ค้นหา อำเภอ/ตำบล..." 
              style={{ flex: 1, background: 'transparent', border: 'none', color: textColor, padding: '5px 10px', outline: 'none', fontFamily: 'Kanit' }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', padding: '5px 15px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'Kanit' }}>ค้นหา</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '1.6rem', fontWeight: '900', color: textColor }}>{locationName}</span>
                <div style={{ fontSize: '0.8rem', color: '#0ea5e9', fontWeight: 'bold' }}>📡 ข้อมูลละติจูด/ลองจิจูด: {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}</div>
              </div>
              {!isMobile && <div style={{ color: subTextColor, fontSize: '0.8rem' }}>ซิงโครไนซ์ล่าสุด: {lastUpdateText}</div>}
            </div>

            <div style={{ background: bgGradient, borderRadius: '30px', padding: '30px 20px', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ fontSize: '5rem' }}>{weatherIcon}</span><span style={{ fontSize: '6rem', fontWeight: '900', lineHeight: 1 }}>{Math.round(current.temp)}°</span></div>
               <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginTop: '10px' }}>{weatherText}</div>
               <div style={{ fontSize: '1rem', opacity: 0.9 }}>อุณหภูมิที่รู้สึกได้จริง (Apparent Temp) {Math.round(current.feelsLike)}°C</div>
               <div style={{ marginTop: '20px', background: aqiBg, color: '#fff', padding: '8px 25px', borderRadius: '50px', fontWeight: '900' }}>😷 ค่าความหนาแน่น PM2.5: {current.pm25 || '-'} µg/m³ ({aqiText})</div>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', width: '100%', marginTop: '30px', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '15px 10px' }}>
                  <div style={{ textAlign: 'center' }}><div style={{fontSize:'1.2rem'}}>☔</div><div style={{fontSize:'0.7rem'}}>ปริมาณน้ำฝน</div><b>{current.rain} mm</b></div>
                  <div style={{ textAlign: 'center' }}><div style={{fontSize:'1.2rem'}}>💧</div><div style={{fontSize:'0.7rem'}}>ความชื้นสัมพัทธ์</div><b>{current.humidity}%</b></div>
                  <div style={{ textAlign: 'center' }}><div style={{fontSize:'1.2rem'}}>🌬️</div><div style={{fontSize:'0.7rem'}}>ความเร็วลม</div><b>{current.windSpeed} km/h</b></div>
                  <div style={{ textAlign: 'center' }}><div style={{fontSize:'1.2rem'}}>☀️</div><div style={{fontSize:'0.7rem'}}>รังสีอัลตราไวโอเลต</div><b>{current.uv}</b></div>
               </div>
            </div>
            
            {/* กล่องวิเคราะห์ AI (ใช้ศัพท์วิชาการ) */}
            <div style={{ background: cardBg, padding: '20px', borderRadius: '25px', border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
              <span style={{ fontSize: '2rem' }}>🤖</span>
              <div>
                 <h4 style={{ margin: '0 0 5px 0', color: textColor, fontSize: '1rem' }}>การวิเคราะห์สภาวะอากาศโดย AI</h4>
                 <p style={{ margin: 0, color: subTextColor, fontSize: '0.9rem', lineHeight: 1.5 }}>
                   {isRaining ? "สภาวะปัจจุบันตรวจพบกลุ่มฝนตกในพื้นที่ ขอแนะนำให้ตรวจสอบทัศนวิสัยในการสัญจรและพกพาอุปกรณ์กันฝน" 
                    : (isHot ? "ดัชนีความร้อน (Heat Index) อยู่ในเกณฑ์สูงเสี่ยงต่อสภาวะฮีทสโตรก ควรหลีกเลี่ยงการทำกิจกรรมกลางแจ้งเป็นเวลานาน" 
                    : "สภาพอากาศโดยรวมอยู่ในเกณฑ์ปกติ เหมาะสมต่อการดำเนินกิจกรรมในพื้นที่โล่งแจ้ง")}
                 </p>
              </div>
            </div>
          </div>

          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
            <div style={{ background: cardBg, borderRadius: '25px', padding: '20px', border: `1px solid ${borderColor}` }}>
               <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: textColor }}>⏱️ ข้อมูลสถิติอุณหภูมิล่วงหน้า (24 ชั่วโมง)</h3>
               <div style={{ height: '140px', width: '100%' }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={hourly.time.slice(0, 24).map((t, i) => ({ time: t.split('T')[1], temp: Math.round(hourly.temperature_2m[i]) }))}>
                     <defs><linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient></defs>
                     <RechartsTooltip contentStyle={{ background: cardBg, borderRadius: '10px', color: textColor }} />
                     <Area type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>

            <div style={{ background: cardBg, borderRadius: '25px', padding: '25px', border: `1px solid ${borderColor}`, flex: 1 }}>
               <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: textColor }}>📅 โมเดลพยากรณ์อากาศล่วงหน้า (7 วัน)</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {daily.time.map((t, idx) => (
                     <div key={idx} style={{ display: 'grid', gridTemplateColumns: '50px 50px 1fr', alignItems: 'center', paddingBottom: idx !== 6 ? '15px' : '0', borderBottom: idx !== 6 ? `1px solid ${borderColor}` : 'none' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: textColor }}>{idx === 0 ? 'วันนี้' : new Date(t).toLocaleDateString('th-TH', {weekday:'short'})}</div>
                        <div style={{ fontSize: '1.5rem', textAlign: 'center' }}>{daily.weathercode[idx] > 50 ? '🌧️' : '🌤️'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                           <span style={{ fontSize: '1rem', color: subTextColor, fontWeight: 'bold', width: '30px', textAlign: 'right' }}>{Math.round(daily.temperature_2m_min[idx])}°</span>
                           <div style={{ flex: 1, height: '6px', background: darkMode ? '#1e293b' : '#e2e8f0', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                              <div style={{ position: 'absolute', left: '20%', right: '20%', top: 0, bottom: 0, background: 'linear-gradient(to right, #3b82f6, #f97316)' }}></div>
                           </div>
                           <span style={{ fontSize: '1rem', color: textColor, fontWeight: '900', width: '30px' }}>{Math.round(daily.temperature_2m_max[idx])}°</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}