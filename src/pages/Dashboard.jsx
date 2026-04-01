// src/pages/Dashboard.jsx
import React, { useContext, useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { WeatherContext } from '../context/WeatherContext';
import { extractProvince, formatLocationName, getPM25Color, getTempColor, getDistanceFromLatLonInKm } from '../utils/helpers';

export default function Dashboard() {
  const { stations, stationTemps, loading, darkMode, favLocations, lastUpdateText } = useContext(WeatherContext);
  
  const [selectedStationId, setSelectedStationId] = useState('');
  const [activeStation, setActiveStation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [greeting, setGreeting] = useState('สวัสดี');
  const [timeOfDay, setTimeOfDay] = useState('morning'); 
  
  // 🌟 เพิ่ม State เช็คขนาดจอมือถือแบบ Real-time เพื่อปรับ Layout ให้เป๊ะ
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      setGreeting('สวัสดีตอนเช้า ⛅'); setTimeOfDay('morning');
    } else if (hour >= 12 && hour < 18) {
      setGreeting('สวัสดีตอนบ่าย ☀️'); setTimeOfDay('afternoon');
    } else {
      setGreeting('สวัสดีตอนเย็น 🌙'); setTimeOfDay('evening');
    }
  }, []);

  useEffect(() => {
    if (stations && stations.length > 0 && !selectedStationId) {
      const bkk = stations.find(s => s.areaTH && s.areaTH.includes('กรุงเทพ'));
      setSelectedStationId(bkk ? bkk.stationID : stations[0].stationID);
    }
  }, [stations, selectedStationId]);

  useEffect(() => {
    if (stations && selectedStationId) {
      const target = stations.find(s => s.stationID === selectedStationId);
      if (target) setActiveStation(target);
    }
  }, [selectedStationId, stations]);

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
        if (nearest) setSelectedStationId(nearest.stationID);
        setLocating(false);
      }, 
      () => { alert('ไม่สามารถระบุพิกัดได้'); setLocating(false); }
    );
  };

  const todayStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const allLocations = [...(stations || [])].map(s => ({
    id: s.stationID,
    name: formatLocationName(s.areaTH)
  })).sort((a, b) => a.name.localeCompare(b.name, 'th'));

  const bgGradient = darkMode 
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' 
    : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'; 

  let dynamicCardBg = darkMode 
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)'
    : (timeOfDay === 'morning' ? 'linear-gradient(135deg, rgba(224, 242, 254, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)' 
    : timeOfDay === 'afternoon' ? 'linear-gradient(135deg, rgba(186, 230, 253, 0.85) 0%, rgba(255, 255, 255, 0.95) 100%)' 
    : 'linear-gradient(135deg, rgba(219, 234, 254, 0.85) 0%, rgba(241, 245, 249, 0.95) 100%)');

  const textColor = darkMode ? '#f8fafc' : '#1e293b';
  const subTextColor = darkMode ? '#94a3b8' : '#475569'; 
  const borderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'; 
  const backdropBlur = 'blur(20px)';

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: bgGradient, color: textColor }}>กำลังโหลดข้อมูล... ⏳</div>;

  // 🌟 ดึงข้อมูลอย่างปลอดภัย ป้องกันจอขาวเด็ดขาด
  const pmVal = activeStation && activeStation.AQILast && activeStation.AQILast.PM25 ? Number(activeStation.AQILast.PM25.value) : null;
  const tObj = activeStation ? stationTemps[activeStation.stationID] : null;
  const tempVal = tObj ? tObj.temp : null;
  const heatVal = tObj ? tObj.feelsLike : null;
  const rainVal = tObj ? tObj.rainProb : null;
  const windVal = tObj ? tObj.windSpeed : null;

  const pmBg = getPM25Color(pmVal);
  const pmTextColor = (pmBg === '#ffff00' || pmBg === '#00e400') ? '#222' : '#fff';
  const tempBg = getTempColor(tempVal).bg;
  const tempTextColor = getTempColor(tempVal).text;

  let alertBanner = null;
  if (heatVal >= 41) alertBanner = { text: 'ดัชนีความร้อนอันตราย: หลีกเลี่ยงแสงแดดจัด', color: '#ef4444', bg: darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' };
  else if (pmVal > 75) alertBanner = { text: 'ฝุ่น PM2.5 วิกฤต: ควรสวมหน้ากาก N95', color: '#ef4444', bg: darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' };
  else if (pmVal > 37.5) alertBanner = { text: 'คุณภาพอากาศเริ่มมีผล: ควรสวมหน้ากากอนามัย', color: '#f59e0b', bg: darkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)' };

  const mainProvinceName = activeStation ? extractProvince(activeStation.areaTH) : '';
  const displayMainTitle = mainProvinceName === 'กรุงเทพมหานคร' ? mainProvinceName : `จ.${mainProvinceName}`;

  return (
    <div style={{ background: bgGradient, minHeight: '100%', padding: isMobile ? '15px' : '20px', paddingBottom: isMobile ? '95px' : '40px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '1.6rem' : '2.2rem', color: textColor, margin: '0 0 2px 0', fontWeight: 'bold' }}>{greeting}</h1>
          <p style={{ margin: 0, color: subTextColor, fontSize: isMobile ? '0.9rem' : '1rem' }}>{todayStr}</p>
        </div>
        <div style={{ background: darkMode ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.85)', backdropFilter: backdropBlur, padding: '6px 12px', borderRadius: '15px', border: `1px solid ${borderColor}`, color: subTextColor, fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          ⏱️ {lastUpdateText ? lastUpdateText.split(' ')[1] : '-'}
        </div>
      </div>

      {/* 🌟 MAIN WEATHER CARD */}
      <div style={{ background: dynamicCardBg, backdropFilter: backdropBlur, borderRadius: '25px', padding: isMobile ? '15px' : '25px', border: `1px solid ${borderColor}`, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', boxSizing: 'border-box' }}>
        
        {/* ตัวควบคุมแผนที่และค้นหา (จัดให้พอดีจอมือถือ) */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: '10px', marginBottom: '20px' }}>
          
          <select value={selectedStationId} onChange={(e) => setSelectedStationId(e.target.value)} style={{ flex: 1, width: '100%', padding: '12px 15px', borderRadius: '15px', background: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.9)', color: textColor, border: `1px solid ${borderColor}`, fontWeight: 'bold', outline: 'none', cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', boxSizing: 'border-box', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {allLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
          </select>

          <button onClick={handleLocateMe} style={{ width: isMobile ? '100%' : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#0ea5e9', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '15px', fontWeight: 'bold', cursor: locating ? 'wait' : 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)', boxSizing: 'border-box', flexShrink: 0 }}>
            {locating ? '⏳ ค้นหา...' : '📍 พิกัดปัจจุบัน'}
          </button>
        </div>

        {/* 🌟 เลย์เอาต์ข้อมูลแบบ Flex-Wrap (กันจอตกขอบ 100%) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '25px' }}>
          
          {/* 📍 ข้อมูลซ้ายมือ (ชื่อจังหวัด และ Mini Stats) */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', color: textColor, margin: 0, fontWeight: 'bold', lineHeight: 1.2 }}>
                {displayMainTitle}
              </h2>
              <p style={{ margin: '4px 0 0 0', color: subTextColor, fontSize: '0.9rem', lineHeight: 1.4 }}>
                📍 {activeStation ? formatLocationName(activeStation.areaTH) : ''}
              </p>
            </div>
            
            {/* 🌟 Mini Stats แบบ Grid ที่ปรับขนาดตามจอมือถืออัตโนมัติ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)', padding: '12px 5px', borderRadius: '15px', border: `1px solid ${borderColor}` }}>
                <span style={{ fontSize: '1.4rem', marginBottom: '5px' }}>💧</span>
                <div style={{ fontSize: '0.7rem', color: subTextColor }}>โอกาสฝน</div>
                <div style={{ color: textColor, fontWeight: 'bold', fontSize: '1rem' }}>{rainVal != null ? `${Math.round(rainVal)}%` : '-'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)', padding: '12px 5px', borderRadius: '15px', border: `1px solid ${borderColor}` }}>
                <span style={{ fontSize: '1.4rem', marginBottom: '5px' }}>🌬️</span>
                <div style={{ fontSize: '0.7rem', color: subTextColor }}>ความเร็วลม</div>
                <div style={{ color: textColor, fontWeight: 'bold', fontSize: '1rem' }}>{windVal != null ? `${Math.round(windVal)} km/h` : '-'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)', padding: '12px 5px', borderRadius: '15px', border: `1px solid ${borderColor}` }}>
                <span style={{ fontSize: '1.4rem', marginBottom: '5px' }}>🥵</span>
                <div style={{ fontSize: '0.7rem', color: subTextColor }}>Heat Index</div>
                <div style={{ color: heatVal >= 40 ? '#ef4444' : textColor, fontWeight: 'bold', fontSize: '1rem' }}>{heatVal != null ? `${heatVal.toFixed(1)}°C` : '-'}</div>
              </div>
            </div>

            {alertBanner && (
              <div style={{ background: alertBanner.bg, borderLeft: `5px solid ${alertBanner.color}`, padding: '12px 15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>🚨</span>
                <span style={{ color: alertBanner.color, fontWeight: 'bold', fontSize: '0.85rem', lineHeight: 1.4 }}>{alertBanner.text}</span>
              </div>
            )}
          </div>

          {/* 📍 ข้อมูลขวามือ (PM2.5, Temp, แผนที่ย่อ) */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* กล่องแสดงผลหลัก PM2.5 & Temp */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1, background: pmBg, borderRadius: '15px', padding: '15px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: pmTextColor, boxShadow: `0 6px 15px ${pmBg}40`, border: '2px solid rgba(255,255,255,0.4)' }}>
                <span style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 'bold' }}>PM2.5 (µg/m³)</span>
                <span style={{ fontSize: '2.2rem', fontWeight: 'bold', lineHeight: 1.1 }}>{pmVal != null && !isNaN(pmVal) ? pmVal : '-'}</span>
              </div>
              <div style={{ flex: 1, background: tempBg, borderRadius: '15px', padding: '15px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: tempTextColor, boxShadow: `0 6px 15px ${tempBg}40`, border: '2px solid rgba(255,255,255,0.4)' }}>
                <span style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 'bold' }}>อุณหภูมิ</span>
                <span style={{ fontSize: '2.2rem', fontWeight: 'bold', lineHeight: 1.1 }}>{tempVal != null ? `${Math.round(tempVal)}°C` : '-'}</span>
              </div>
            </div>

            {/* แผนที่พรีวิว */}
            <div style={{ height: '120px', width: '100%', borderRadius: '15px', overflow: 'hidden', border: `2px solid rgba(255,255,255,0.5)`, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
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

          </div>
        </div>
      </div>

      {/* ⭐ พื้นที่โปรดของคุณ (Favorites Section) */}
      <div style={{ marginTop: '5px' }}>
        <h3 style={{ fontSize: '1.1rem', color: textColor, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          ⭐ พื้นที่โปรดของคุณ
        </h3>
        
        {favLocations && favLocations.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {favLocations.map((fav, index) => {
              const favStations = (stations || []).filter(s => extractProvince(s.areaTH) === fav.name);
              const target = favStations.length > 0 ? favStations[0] : null;
              if (!target) return null;
              
              // ตรวจสอบค่าอย่างปลอดภัย ป้องกันพัง
              const fPm = target.AQILast && target.AQILast.PM25 ? Number(target.AQILast.PM25.value) : NaN;
              const fTemp = stationTemps[target.stationID] ? stationTemps[target.stationID].temp : null;
              
              const displayFavName = fav.name === 'กรุงเทพมหานคร' ? fav.name : `จ.${fav.name}`;

              return (
                <div key={index} onClick={() => setSelectedStationId(target.stationID)} style={{ background: darkMode ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.85)', backdropFilter: backdropBlur, padding: '15px', borderRadius: '18px', border: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                  <div style={{ flex: 1, paddingRight: '10px', overflow: 'hidden' }}>
                    <h4 style={{ margin: '0 0 3px 0', color: textColor, fontSize: '1rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{displayFavName}</h4>
                    <span style={{ fontSize: '0.8rem', color: subTextColor }}>{fTemp != null ? `${fTemp.toFixed(1)}°C` : 'N/A'}</span>
                  </div>
                  <div style={{ background: getPM25Color(fPm), padding: '6px 12px', borderRadius: '10px', color: (getPM25Color(fPm)==='#ffff00'||getPM25Color(fPm)==='#00e400')?'#222':'#fff', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', flexShrink: 0 }}>
                    {isNaN(fPm) ? '-' : fPm}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', padding: '20px', borderRadius: '20px', textAlign: 'center', color: subTextColor, border: `1px dashed ${borderColor}`, fontSize: '0.9rem' }}>
            ยังไม่มีพื้นที่โปรด กด ⭐ ที่หน้าแผนที่เพื่อเพิ่มจังหวัดที่คุณดูบ่อยๆ
          </div>
        )}
      </div>

    </div>
  );
}