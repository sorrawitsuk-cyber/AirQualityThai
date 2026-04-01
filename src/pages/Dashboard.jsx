// src/pages/Dashboard.jsx
import React, { useContext, useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { WeatherContext } from '../context/WeatherContext';
import { extractProvince, getPM25Color, getTempColor, getDistanceFromLatLonInKm } from '../utils/helpers';

export default function Dashboard() {
  const { stations, stationTemps, loading, darkMode, favLocations, lastUpdateText } = useContext(WeatherContext);
  
  const [alertsLocationName, setAlertsLocationName] = useState('กรุงเทพมหานคร');
  const [activeStation, setActiveStation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [greeting, setGreeting] = useState('สวัสดี');
  const [timeOfDay, setTimeOfDay] = useState('morning'); // เก็บสถานะช่วงเวลาของวัน

  // 🌟 ตั้งคำทักทายและคำนวณช่วงเวลาของวัน (เช้า, บ่าย, ค่ำ)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      setGreeting('สวัสดีตอนเช้า ⛅');
      setTimeOfDay('morning');
    } else if (hour >= 12 && hour < 18) {
      setGreeting('สวัสดีตอนบ่าย ☀️');
      setTimeOfDay('afternoon');
    } else {
      setGreeting('สวัสดีตอนเย็น 🌙');
      setTimeOfDay('evening');
    }
  }, []);

  // ดึงข้อมูลสถานีที่เลือก
  useEffect(() => {
    if (stations && stations.length > 0 && alertsLocationName) {
      const targetStations = stations.filter(s => extractProvince(s.areaTH) === alertsLocationName.replace('จ.', ''));
      if (targetStations.length > 0) setActiveStation(targetStations[0]);
    }
  }, [alertsLocationName, stations]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return alert('อุปกรณ์ไม่รองรับ GPS');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        let nearest = null; let minD = Infinity;
        (stations || []).forEach(s => { 
          const d = getDistanceFromLatLonInKm(pos.coords.latitude, pos.coords.longitude, parseFloat(s.lat), parseFloat(s.long)); 
          if (d < minD) { minD = d; nearest = s; } 
        });
        if (nearest) {
          setAlertsLocationName(extractProvince(nearest.areaTH));
          setActiveStation(nearest);
        }
        setLocating(false);
      }, 
      () => { alert('ไม่สามารถระบุพิกัดได้'); setLocating(false); }
    );
  };

  const todayStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  const allProvinces = [...new Set((stations || []).map(s => extractProvince(s.areaTH)))].sort();

  // 🎨 ตั้งค่า ธีมสี (Theme Colors) แบบ Dynamic
  const bgGradient = darkMode 
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' 
    : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'; // พื้นหลังหลักสีฟ้าอ่อนสบายตา

  // 🌟 สร้างสีการ์ดหลักให้ไล่เฉดตาม "ช่วงเวลา" (Soft Sky Blue to White)
  let dynamicCardBg;
  if (darkMode) {
    dynamicCardBg = 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)';
  } else {
    if (timeOfDay === 'morning') {
      // เช้า: ฟ้าอ่อนละมุนๆ
      dynamicCardBg = 'linear-gradient(135deg, rgba(224, 242, 254, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)';
    } else if (timeOfDay === 'afternoon') {
      // บ่าย: ฟ้าสดใส ไล่ไปทางขาว (Sky Blue to White) -> แบบที่คุณต้องการเลยครับ!
      dynamicCardBg = 'linear-gradient(135deg, rgba(186, 230, 253, 0.85) 0%, rgba(255, 255, 255, 0.95) 100%)';
    } else {
      // เย็น/ค่ำ: ฟ้าน้ำเงินหม่นๆ (Twilight)
      dynamicCardBg = 'linear-gradient(135deg, rgba(219, 234, 254, 0.85) 0%, rgba(241, 245, 249, 0.95) 100%)';
    }
  }

  const textColor = darkMode ? '#f8fafc' : '#1e293b';
  const subTextColor = darkMode ? '#94a3b8' : '#475569'; // ทำให้ตัวหนังสือเข้มขึ้นนิดนึงเพื่อให้อ่านง่ายบนพื้นฟ้า
  const borderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'; // ขอบขาวใสๆ สไตล์กระจก
  const backdropBlur = 'blur(20px)';

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: bgGradient, color: textColor }}>กำลังโหลดข้อมูล... ⏳</div>;

  const pmVal = activeStation ? Number(activeStation.AQILast?.PM25?.value) : null;
  const tObj = activeStation ? stationTemps[activeStation.stationID] : null;
  const tempVal = tObj?.temp;
  const heatVal = tObj?.feelsLike;
  const rainVal = tObj?.rainProb;
  const windVal = tObj?.windSpeed;

  const pmBg = getPM25Color(pmVal);
  const pmTextColor = (pmBg === '#ffff00' || pmBg === '#00e400') ? '#222' : '#fff';
  const tempBg = getTempColor(tempVal).bg;
  const tempTextColor = getTempColor(tempVal).text;

  // วิเคราะห์การเตือนภัย
  let alertBanner = null;
  if (heatVal >= 41) alertBanner = { text: 'ดัชนีความร้อนอันตราย: ลดระยะเวลากิจกรรม ดื่มน้ำให้เพียงพอ', color: '#ef4444', bg: darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' };
  else if (pmVal > 75) alertBanner = { text: 'ฝุ่น PM2.5 วิกฤต: ควรสวมหน้ากาก N95 และงดกิจกรรมกลางแจ้ง', color: '#ef4444', bg: darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' };
  else if (pmVal > 37.5) alertBanner = { text: 'คุณภาพอากาศเริ่มมีผลกระทบต่อสุขภาพ: สวมหน้ากากอนามัยเมื่อออกนอกบ้าน', color: '#f59e0b', bg: darkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)' };

  return (
    <div style={{ background: bgGradient, minHeight: '100%', padding: '20px', paddingBottom: window.innerWidth < 768 ? '100px' : '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', color: textColor, margin: '0 0 5px 0', fontWeight: 'bold' }}>{greeting}</h1>
          <p style={{ margin: 0, color: subTextColor, fontSize: '1rem' }}>ภาพรวมสภาพอากาศประจำวันที่ {todayStr}</p>
        </div>
        <div style={{ background: darkMode ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.85)', backdropFilter: backdropBlur, padding: '8px 15px', borderRadius: '20px', border: `1px solid ${borderColor}`, color: subTextColor, fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          ⏱️ อัปเดตล่าสุด: {lastUpdateText || '-'}
        </div>
      </div>

      {/* 🌟 MAIN WEATHER CARD (การ์ดหลักสีฟ้าใสไล่เฉดขาว) */}
      <div style={{ background: dynamicCardBg, backdropFilter: backdropBlur, borderRadius: '25px', padding: '25px', border: `1px solid ${borderColor}`, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        
        {/* คอนโทรลด้านบนของการ์ด */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          <button onClick={handleLocateMe} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0ea5e9', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '15px', fontWeight: 'bold', cursor: locating ? 'wait' : 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)' }}>
            {locating ? '⏳ กำลังหาตำแหน่ง...' : '📍 ตำแหน่งปัจจุบัน'}
          </button>
          
          <select value={alertsLocationName} onChange={(e) => setAlertsLocationName(e.target.value)} style={{ padding: '10px 20px', borderRadius: '15px', background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)', color: textColor, border: `1px solid ${borderColor}`, fontWeight: 'bold', outline: 'none', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            {allProvinces.map(p => <option key={p} value={p}>จ.{p}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1.5fr 1fr', gap: '30px' }}>
          
          {/* ข้อมูลซ้ายมือ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '2.5rem', color: textColor, margin: 0, fontWeight: 'bold', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }}>จ.{alertsLocationName}</h2>
            
            {/* กล่องข้อมูลย่อย (Mini Stats) - ทำให้โปร่งใสและดูคลีนขึ้นเมื่ออยู่บนพื้นฟ้า */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)', padding: '10px 15px', borderRadius: '15px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '1.5rem' }}>💧</span>
                <div><div style={{ fontSize: '0.75rem', color: subTextColor }}>โอกาสฝนตก</div><div style={{ color: textColor, fontWeight: 'bold', fontSize: '1.1rem' }}>{rainVal != null ? `${Math.round(rainVal)}%` : '-'}</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)', padding: '10px 15px', borderRadius: '15px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '1.5rem' }}>🌬️</span>
                <div><div style={{ fontSize: '0.75rem', color: subTextColor }}>ความเร็วลม</div><div style={{ color: textColor, fontWeight: 'bold', fontSize: '1.1rem' }}>{windVal != null ? `${Math.round(windVal)} km/h` : '-'}</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)', padding: '10px 15px', borderRadius: '15px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '1.5rem' }}>🥵</span>
                <div><div style={{ fontSize: '0.75rem', color: subTextColor }}>Heat Index</div><div style={{ color: heatVal >= 40 ? '#ef4444' : textColor, fontWeight: 'bold', fontSize: '1.1rem' }}>{heatVal != null ? `${heatVal.toFixed(1)}°C` : '-'}</div></div>
              </div>
            </div>

            {/* แถบเตือนภัย */}
            {alertBanner && (
              <div style={{ background: alertBanner.bg, borderLeft: `5px solid ${alertBanner.color}`, padding: '15px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '1.5rem' }}>🚨</span>
                <span style={{ color: alertBanner.color, fontWeight: 'bold', fontSize: '0.95rem' }}>{alertBanner.text}</span>
              </div>
            )}
          </div>

          {/* ข้อมูลขวามือ (PM2.5, Temp, Map) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* แผนที่พรีวิว */}
            <div style={{ height: '140px', width: '100%', borderRadius: '15px', overflow: 'hidden', border: `2px solid rgba(255,255,255,0.5)`, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              {activeStation && !isNaN(parseFloat(activeStation.lat)) ? (
                <MapContainer center={[parseFloat(activeStation.lat), parseFloat(activeStation.long)]} zoom={10} style={{ height: '100%', width: '100%', zIndex: 1 }} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false}>
                  <TileLayer url={darkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} />
                  <CircleMarker center={[parseFloat(activeStation.lat), parseFloat(activeStation.long)]} radius={20} pathOptions={{ color: '#0ea5e9', fillColor: '#38bdf8', fillOpacity: 0.3, weight: 2 }} />
                  <CircleMarker center={[parseFloat(activeStation.lat), parseFloat(activeStation.long)]} radius={4} pathOptions={{ color: '#fff', fillColor: '#0ea5e9', fillOpacity: 1, weight: 2 }} />
                </MapContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: darkMode?'#1e293b':'#f1f5f9', color: subTextColor }}>ไม่มีข้อมูลแผนที่</div>
              )}
            </div>

            {/* กล่องแสดงผลหลัก PM2.5 & Temp */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, background: pmBg, borderRadius: '15px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: pmTextColor, boxShadow: `0 8px 20px ${pmBg}40`, border: '2px solid rgba(255,255,255,0.4)' }}>
                <span style={{ fontSize: '0.85rem', opacity: 0.9, fontWeight: 'bold' }}>PM2.5 (µg/m³)</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1.2 }}>{pmVal != null && !isNaN(pmVal) ? pmVal : '-'}</span>
              </div>
              <div style={{ flex: 1, background: tempBg, borderRadius: '15px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: tempTextColor, boxShadow: `0 8px 20px ${tempBg}40`, border: '2px solid rgba(255,255,255,0.4)' }}>
                <span style={{ fontSize: '0.85rem', opacity: 0.9, fontWeight: 'bold' }}>อุณหภูมิ</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1.2 }}>{tempVal != null ? `${Math.round(tempVal)}°C` : '-'}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* พื้นที่โปรดของคุณ (Favorites Section) */}
      <div style={{ marginTop: '10px' }}>
        <h3 style={{ fontSize: '1.2rem', color: textColor, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
          ⭐ พื้นที่โปรดของคุณ
        </h3>
        
        {favLocations && favLocations.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {favLocations.map((fav, index) => {
              const favStations = (stations || []).filter(s => extractProvince(s.areaTH) === fav.name);
              const target = favStations.length > 0 ? favStations[0] : null;
              if (!target) return null;
              
              const fPm = Number(target.AQILast?.PM25?.value);
              const fTemp = stationTemps[target.stationID]?.temp;
              
              return (
                <div key={index} onClick={() => setAlertsLocationName(fav.name)} style={{ background: darkMode ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.85)', backdropFilter: backdropBlur, padding: '15px 20px', borderRadius: '20px', border: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: textColor, fontSize: '1.1rem' }}>จ.{fav.name}</h4>
                    <span style={{ fontSize: '0.85rem', color: subTextColor }}>{fTemp != null ? `${fTemp.toFixed(1)}°C` : 'N/A'}</span>
                  </div>
                  <div style={{ background: getPM25Color(fPm), padding: '8px 15px', borderRadius: '12px', color: (getPM25Color(fPm)==='#ffff00'||getPM25Color(fPm)==='#00e400')?'#222':'#fff', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    {isNaN(fPm) ? '-' : fPm}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', padding: '20px', borderRadius: '20px', textAlign: 'center', color: subTextColor, border: `1px dashed ${borderColor}` }}>
            ยังไม่มีพื้นที่โปรด กด ⭐ ที่หน้าแผนที่เพื่อเพิ่มจังหวัดที่คุณดูบ่อยๆ ไว้ที่นี่ได้เลยครับ
          </div>
        )}
      </div>

    </div>
  );
}