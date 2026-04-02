// src/pages/Dashboard.jsx
import React, { useContext, useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WeatherContext } from '../context/WeatherContext';
import { extractProvince, formatLocationName, getPM25Color, getDistanceFromLatLonInKm } from '../utils/helpers';

// 🌟 ฟังก์ชันสถานะฝุ่น (ปรับข้อความและไอคอนให้เข้ากับสไตล์การ์ตูน)
const getHealthStatus = (pm) => {
  if (pm == null || isNaN(pm)) return { face: '😶', text: 'ไม่มีข้อมูล', color: '#94a3b8', bg: '#f1f5f9' };
  if (pm <= 15.0) return { face: '😇', text: '⭐ อากาศดีเยี่ยม ⭐', color: '#059669', bg: '#d1fae5' }; 
  if (pm <= 25.0) return { face: '🙂', text: '⭐ อากาศดี ⭐', color: '#16a34a', bg: '#dcfce7' }; 
  if (pm <= 37.5) return { face: '😐', text: '⭐ ปานกลาง ⭐', color: '#d97706', bg: '#fef3c7' }; 
  if (pm <= 75.0) return { face: '😷', text: '⭐ เริ่มมีผลกระทบ ⭐', color: '#ea580c', bg: '#ffedd5' }; 
  return { face: '🤢', text: '⭐ อันตราย ⭐', color: '#dc2626', bg: '#fee2e2' }; 
};

// 🌟 ฟังก์ชันสถานะความร้อน (ปรับข้อความและไอคอนให้เข้ากับสไตล์การ์ตูน)
const getHeatStatus = (val) => {
  if (val == null || isNaN(val)) return { face: '😶', text: 'ไม่มีข้อมูล', color: '#94a3b8', bg: '#f1f5f9' };
  if (val >= 52) return { face: '🤯', text: '⭐ อันตรายมาก ⭐', color: '#dc2626', bg: '#fee2e2' };
  if (val >= 41) return { face: '🥵', text: '⭐ อันตราย ⭐', color: '#ea580c', bg: '#ffedd5' };
  if (val >= 32) return { face: '😰', text: '⭐ เฝ้าระวัง ⭐', color: '#d97706', bg: '#fef3c7' };
  return { face: '😎', text: '⭐ ปกติ ⭐', color: '#16a34a', bg: '#dcfce7' };
};

// ฟังก์ชันช่วยเลื่อนแผนที่
function MiniMapUpdate({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon && !isNaN(lat) && !isNaN(lon)) map.flyTo([lat, lon], 10);
  }, [lat, lon, map]);
  return null;
}

export default function Dashboard() {
  const { stations, stationTemps, loading, darkMode, lastUpdateText } = useContext(WeatherContext);
  
  const [selectedStationId, setSelectedStationId] = useState(() => localStorage.getItem('lastStationId') || '');
  const [activeStation, setActiveStation] = useState(null);
  const [gpsAttempted, setGpsAttempted] = useState(false);
  const [forecastData, setForecastData] = useState([]);
  
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ระบบดึงพิกัดอัตโนมัติ
  useEffect(() => {
    if (stations && stations.length > 0 && !selectedStationId && !gpsAttempted) {
      setGpsAttempted(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            let nearest = null; let minD = Infinity;
            stations.forEach(s => { 
              const d = getDistanceFromLatLonInKm(pos.coords.latitude, pos.coords.longitude, parseFloat(s.lat), parseFloat(s.long)); 
              if (d < minD) { minD = d; nearest = s; } 
            });
            if (nearest) { setSelectedStationId(nearest.stationID); localStorage.setItem('lastStationId', nearest.stationID); }
          }, 
          () => {
            const bkk = stations.find(s => s.areaTH && s.areaTH.includes('กรุงเทพ'));
            const fallbackId = bkk ? bkk.stationID : stations[0].stationID;
            setSelectedStationId(fallbackId); localStorage.setItem('lastStationId', fallbackId);
          }
        );
      } else {
        const bkk = stations.find(s => s.areaTH && s.areaTH.includes('กรุงเทพ'));
        const fallbackId = bkk ? bkk.stationID : stations[0].stationID;
        setSelectedStationId(fallbackId); localStorage.setItem('lastStationId', fallbackId);
      }
    }
  }, [stations, selectedStationId, gpsAttempted]);

  const handleStationChange = (e) => {
    const newId = e.target.value;
    setSelectedStationId(newId);
    localStorage.setItem('lastStationId', newId);
  };

  useEffect(() => {
    if (stations && stations.length > 0 && selectedStationId) {
      const target = stations.find(s => s.stationID === selectedStationId);
      if (target) { setActiveStation(target); } 
      else {
         const bkk = stations.find(s => s.areaTH && s.areaTH.includes('กรุงเทพ'));
         setSelectedStationId(bkk ? bkk.stationID : stations[0].stationID);
      }
    }
  }, [selectedStationId, stations]);

  // ดึงกราฟฝุ่นล่วงหน้า
  useEffect(() => {
    if (activeStation && activeStation.lat && activeStation.long) {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${activeStation.lat}&longitude=${activeStation.long}&hourly=pm2_5&timezone=auto&forecast_days=2`;
      fetch(url).then(r=>r.json()).then(data => {
        if (data && data.hourly && data.hourly.pm2_5) {
          const now = new Date().getTime();
          let sIdx = data.hourly.time.findIndex(t => new Date(t).getTime() >= now);
          if (sIdx === -1) sIdx = 0;
          const pmF = [];
          const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
          for (let i = sIdx; i < sIdx + 24; i += 4) { 
            if (data.hourly.pm2_5[i] != null) {
              const d = new Date(data.hourly.time[i]);
              pmF.push({ time: `${days[d.getDay()]} ${d.getHours()}h`, val: Math.round(data.hourly.pm2_5[i]) });
            }
          }
          setForecastData(pmF);
        }
      }).catch(() => setForecastData([]));
    }
  }, [activeStation]);

  const allLocations = [...(stations || [])].map(s => ({
    id: s.stationID, name: formatLocationName(s.areaTH)
  })).sort((a, b) => a.name.localeCompare(b.name, 'th'));

  // 🌟 ธีมสีสไตล์การ์ตูน (Cartoon UI Theme)
  const bgMain = darkMode ? '#0f172a' : '#bae6fd'; // สีฟ้าพาสเทลอ่อนๆ แบบในรูป
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const borderStyle = darkMode ? '2px solid #334155' : '2px solid #1e3a8a'; // ขอบหนาสีน้ำเงินเข้ม
  const textDark = darkMode ? '#f8fafc' : '#1e3a8a';
  const cardShadow = darkMode ? 'none' : '4px 4px 0px rgba(30, 58, 138, 0.1)'; // เงาแข็งๆ แบบการ์ตูน
  
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: bgMain, color: textDark, fontWeight: 'bold' }}>กำลังโหลดข้อมูล... ⏳</div>;

  const pmVal = activeStation && activeStation.AQILast && activeStation.AQILast.PM25 ? Number(activeStation.AQILast.PM25.value) : null;
  const tObj = activeStation ? stationTemps[activeStation.stationID] : null;
  
  const tempVal = tObj ? tObj.temp : null;
  const humidityVal = tObj && tObj.humidity != null ? tObj.humidity : '-';
  const windVal = tObj ? tObj.windSpeed : null;
  const heatVal = tObj ? tObj.feelsLike : null;

  const health = getHealthStatus(pmVal);
  const heatStatus = getHeatStatus(heatVal);
  const pmColor = getPM25Color(pmVal);

  return (
    <div style={{ background: bgMain, minHeight: '100%', padding: isMobile ? '15px' : '25px', paddingBottom: isMobile ? '90px' : '40px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box', overflowY: 'auto', fontFamily: 'Kanit, sans-serif' }} className="hide-scrollbar">
      
      {/* 🟢 HEADER: ตัวเลือกสถานที่แบบการ์ด */}
      <div style={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: cardBg, padding: '10px 20px', borderRadius: '16px', border: borderStyle, boxShadow: cardShadow, width: isMobile ? '100%' : 'auto', minWidth: '300px' }}>
          <span style={{ fontSize: '1.5rem' }}>📍</span>
          <select value={selectedStationId} onChange={handleStationChange} style={{ flex: 1, background: 'transparent', color: textDark, border: 'none', fontWeight: 'bold', fontSize: '1.1rem', outline: 'none', cursor: 'pointer', appearance: 'none' }}>
            {allLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
          </select>
          <span style={{ fontSize: '0.8rem', color: textDark }}>▼</span>
        </div>
      </div>

      {/* 🌟 MAIN GRID: 3 คอลัมน์ (PM | Heat | RightPanel) */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 300px', gap: '20px' }}>
        
        {/* 📍 CARD 1: ฝุ่น PM2.5 */}
        <div style={{ background: cardBg, borderRadius: '24px', border: borderStyle, boxShadow: cardShadow, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          <div style={{ padding: '25px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '6rem', filter: `drop-shadow(0 10px 15px ${health.color}40)`, lineHeight: 1 }}>{health.face}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1rem', color: textDark, fontWeight: 'bold' }}>PM2.5 (µg/m³)</div>
                <div style={{ fontSize: '4.5rem', fontWeight: '900', color: textDark, lineHeight: 1 }}>{pmVal != null && !isNaN(pmVal) ? pmVal : '-'}</div>
              </div>
            </div>

            {/* ป้ายสถานะ */}
            <div style={{ background: health.color, color: '#fff', padding: '8px 25px', borderRadius: '50px', fontWeight: 'bold', fontSize: '1.1rem', width: '80%', textAlign: 'center', border: `2px solid ${darkMode?'#fff':textDark}`, boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}>
              {health.text}
            </div>
          </div>

          {/* Footer (อุณหภูมิ, ความชื้น, ลม) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: darkMode ? '#334155' : '#e0f2fe', borderTop: borderStyle, padding: '15px 10px' }}>
            <div style={{ textAlign: 'center', borderRight: borderStyle }}>
              <div style={{ fontSize: '0.85rem', color: textDark, fontWeight: 'bold' }}>อุณหภูมิ</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: textDark }}>🌡️ {tempVal ? Math.round(tempVal) : '-'}°C</div>
            </div>
            <div style={{ textAlign: 'center', borderRight: borderStyle }}>
              <div style={{ fontSize: '0.85rem', color: textDark, fontWeight: 'bold' }}>ความชื้น</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: textDark }}>💧 {humidityVal}%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: textDark, fontWeight: 'bold' }}>ลม</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: textDark }}>🌬️ {windVal != null ? Math.round(windVal) : '-'} <span style={{fontSize:'0.7rem'}}>km/h</span></div>
            </div>
          </div>
        </div>

        {/* 📍 CARD 2: ดัชนีความร้อน */}
        <div style={{ background: cardBg, borderRadius: '24px', border: borderStyle, boxShadow: cardShadow, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          <div style={{ padding: '20px 25px 5px 25px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: textDark, fontWeight: 'bold' }}>ดัชนีความร้อน</h3>
          </div>

          <div style={{ padding: '0 25px 25px 25px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '6rem', filter: `drop-shadow(0 10px 15px ${heatStatus.color}40)`, lineHeight: 1 }}>{heatStatus.face}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1rem', color: textDark, fontWeight: 'bold' }}>ดัชนีความร้อน</div>
                <div style={{ fontSize: '4.5rem', fontWeight: '900', color: textDark, lineHeight: 1 }}>{heatVal != null ? Math.round(heatVal) : '-'}°C</div>
              </div>
            </div>

            {/* ป้ายสถานะ */}
            <div style={{ background: heatStatus.color, color: '#fff', padding: '8px 25px', borderRadius: '50px', fontWeight: 'bold', fontSize: '1.1rem', width: '80%', textAlign: 'center', border: `2px solid ${darkMode?'#fff':textDark}`, boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}>
              {heatStatus.text}
            </div>
          </div>

          {/* Footer (อุณหภูมิ, ความชื้น, ลม) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: darkMode ? '#334155' : '#e0f2fe', borderTop: borderStyle, padding: '15px 10px' }}>
            <div style={{ textAlign: 'center', borderRight: borderStyle }}>
              <div style={{ fontSize: '0.85rem', color: textDark, fontWeight: 'bold' }}>อุณหภูมิ</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: textDark }}>🌡️ {tempVal ? Math.round(tempVal) : '-'}°C</div>
            </div>
            <div style={{ textAlign: 'center', borderRight: borderStyle }}>
              <div style={{ fontSize: '0.85rem', color: textDark, fontWeight: 'bold' }}>ความชื้น</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: textDark }}>💧 {humidityVal}%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: textDark, fontWeight: 'bold' }}>ลม</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: textDark }}>🌬️ {windVal != null ? Math.round(windVal) : '-'} <span style={{fontSize:'0.7rem'}}>km/h</span></div>
            </div>
          </div>
        </div>

        {/* 📍 CARD 3: Sidebar (Map + Forecast) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Mini Map */}
          <div style={{ background: cardBg, borderRadius: '24px', border: borderStyle, boxShadow: cardShadow, padding: '15px', height: '220px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: textDark, fontWeight: 'bold' }}>Map</h3>
            <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: borderStyle, position: 'relative' }}>
              {activeStation && !isNaN(parseFloat(activeStation.lat)) ? (
                <MapContainer center={[parseFloat(activeStation.lat), parseFloat(activeStation.long)]} zoom={10} style={{ height: '100%', width: '100%', zIndex: 1 }} zoomControl={false} dragging={!isMobile} scrollWheelZoom={false}>
                  <TileLayer url={darkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} />
                  <MiniMapUpdate lat={parseFloat(activeStation.lat)} lon={parseFloat(activeStation.long)} />
                  <CircleMarker center={[parseFloat(activeStation.lat), parseFloat(activeStation.long)]} radius={8} pathOptions={{ color: textDark, fillColor: pmColor, fillOpacity: 1, weight: 2 }} />
                </MapContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textDark }}>ไม่มีข้อมูลแผนที่</div>
              )}
            </div>
          </div>

          {/* Forecast Chart */}
          <div style={{ background: cardBg, borderRadius: '24px', border: borderStyle, boxShadow: cardShadow, padding: '15px', flex: 1, minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: textDark, fontWeight: 'bold' }}>Forecast</h3>
            <div style={{ flex: 1 }}>
              {forecastData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forecastData} margin={{ top: 10, right: 0, bottom: 0, left: -30 }}>
                    <XAxis dataKey="time" stroke={textDark} fontSize={10} tickLine={false} axisLine={{stroke: textDark, strokeWidth: 2}} />
                    <YAxis stroke={textDark} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: darkMode ? '#334155' : '#e0f2fe' }} contentStyle={{ borderRadius: '10px', border: borderStyle, background: cardBg, color: textDark, fontWeight: 'bold' }} />
                    <Bar dataKey="val" radius={[4, 4, 0, 0]} stroke={textDark} strokeWidth={1}>
                      {forecastData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getPM25Color(entry.val)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textDark, fontSize: '0.85rem' }}>กำลังโหลด...</div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}