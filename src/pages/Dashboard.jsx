// src/pages/Dashboard.jsx
import React, { useContext, useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WeatherContext } from '../context/WeatherContext';
import { extractProvince, formatLocationName, getPM25Color, getTempColor, getDistanceFromLatLonInKm } from '../utils/helpers';

// 🌟 ฟังก์ชันคำนวณสถานะสุขภาพแบบ GISTDA (มีหน้าคนและสีชัดเจน)
const getHealthStatus = (pm) => {
  if (pm == null || isNaN(pm)) return { face: '❓', text: 'ไม่มีข้อมูล', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
  if (pm <= 15.0) return { face: '😁', text: 'คุณภาพอากาศดีมาก', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' }; 
  if (pm <= 25.0) return { face: '🙂', text: 'คุณภาพอากาศดี', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)' }; 
  if (pm <= 37.5) return { face: '😐', text: 'คุณภาพอากาศปานกลาง', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' }; 
  if (pm <= 75.0) return { face: '😷', text: 'เริ่มมีผลกระทบต่อสุขภาพ', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' }; 
  return { face: '🤢', text: 'มีผลกระทบต่อสุขภาพ', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }; 
};

// คอมโพเนนต์ช่วยเลื่อนแผนที่อัตโนมัติ
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
  const [greeting, setGreeting] = useState('สวัสดี');
  const [gpsAttempted, setGpsAttempted] = useState(false);
  const [forecastData, setForecastData] = useState([]);
  
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) setGreeting('สวัสดีตอนเช้า ⛅');
    else if (hour >= 12 && hour < 18) setGreeting('สวัสดีตอนบ่าย ☀️');
    else setGreeting('สวัสดีตอนเย็น 🌙');
  }, []);

  // 🌟 ระบบหาพิกัดและตั้งค่าเริ่มต้น
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

  // 🌟 ดึงข้อมูลพยากรณ์ฝุ่นล่วงหน้า 24 ชม. มาทำกราฟแบบ GISTDA
  useEffect(() => {
    if (activeStation && activeStation.lat && activeStation.long) {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${activeStation.lat}&longitude=${activeStation.long}&hourly=pm2_5&timezone=auto&forecast_days=2`;
      fetch(url).then(r=>r.json()).then(data => {
        if (data && data.hourly && data.hourly.pm2_5) {
          const now = new Date().getTime();
          let sIdx = data.hourly.time.findIndex(t => new Date(t).getTime() >= now);
          if (sIdx === -1) sIdx = 0;
          const pmF = [];
          for (let i = sIdx; i < sIdx + 24; i += 2) { 
            if (data.hourly.pm2_5[i] != null) {
              pmF.push({ time: `${new Date(data.hourly.time[i]).getHours().toString().padStart(2, '0')}:00`, val: Math.round(data.hourly.pm2_5[i]) });
            }
          }
          setForecastData(pmF);
        }
      }).catch(() => setForecastData([]));
    }
  }, [activeStation]);

  const todayStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const allLocations = [...(stations || [])].map(s => ({
    id: s.stationID, name: formatLocationName(s.areaTH)
  })).sort((a, b) => a.name.localeCompare(b.name, 'th'));

  const bgGradient = darkMode ? '#0f172a' : '#f8fafc'; 
  const cardBg = darkMode ? 'rgba(30, 41, 59, 0.95)' : '#ffffff';
  const innerCardBg = darkMode ? 'rgba(0,0,0,0.2)' : '#f1f5f9';
  const textColor = darkMode ? '#f8fafc' : '#0f172a';
  const subTextColor = darkMode ? '#94a3b8' : '#64748b'; 
  const borderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'; 

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: bgGradient, color: textColor }}>กำลังโหลดข้อมูล... ⏳</div>;

  const pmVal = activeStation && activeStation.AQILast && activeStation.AQILast.PM25 ? Number(activeStation.AQILast.PM25.value) : null;
  const tObj = activeStation ? stationTemps[activeStation.stationID] : null;
  
  const tempVal = tObj ? tObj.temp : null;
  const humidityVal = tObj && tObj.humidity != null ? tObj.humidity : '-';
  const windVal = tObj ? tObj.windSpeed : null;
  const heatVal = tObj ? tObj.feelsLike : null;
  const uvVal = tObj && tObj.uvMax != null ? Math.round(tObj.uvMax) : '-';

  const health = getHealthStatus(pmVal);
  const pmColor = getPM25Color(pmVal);
  const tempColor = getTempColor(tempVal).bg;

  return (
    <div style={{ background: bgGradient, minHeight: '100%', padding: isMobile ? '15px' : '30px', paddingBottom: isMobile ? '90px' : '40px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box', overflowY: 'auto' }} className="hide-scrollbar">
      
      {/* 🟢 HEADER */}
      <div style={{ display: 'flex', justifyContent: isMobile ? 'flex-end' : 'space-between', alignItems: 'center' }}>
        {!isMobile && (
          <div>
            <h1 style={{ fontSize: '2rem', color: textColor, margin: 0, fontWeight: '800' }}>{greeting}</h1>
            <p style={{ margin: '2px 0 0 0', color: subTextColor, fontSize: '0.95rem' }}>{todayStr}</p>
          </div>
        )}
        <div style={{ background: innerCardBg, padding: '8px 15px', borderRadius: '12px', color: subTextColor, fontSize: '0.8rem', fontWeight: 'bold', border: `1px solid ${borderColor}` }}>
          ⏱️ ข้อมูลล่าสุด: {lastUpdateText || '-'}
        </div>
      </div>

      {/* 🌟 MAIN GRID: ซ้าย (GISTDA Hero Card) | ขวา (แผนที่ + ลึกซึ้ง) */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr', gap: '20px' }}>
        
        {/* 📍 ฝั่งซ้าย: Hero Card สไตล์ GISTDA */}
        <div style={{ background: cardBg, borderRadius: '24px', padding: isMobile ? '20px' : '30px', border: `1px solid ${borderColor}`, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
          
          {/* ตัวเลือกสถานที่ (ทรงแคปซูลแบบ GISTDA) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: innerCardBg, padding: '5px 5px 5px 15px', borderRadius: '50px', marginBottom: '30px', border: `1px solid ${borderColor}` }}>
            <span style={{ fontSize: '1.2rem' }}>📍</span>
            <select value={selectedStationId} onChange={handleStationChange} style={{ flex: 1, background: 'transparent', color: textColor, border: 'none', fontWeight: 'bold', fontSize: '1rem', outline: 'none', cursor: 'pointer', appearance: 'none', textOverflow: 'ellipsis' }}>
              {allLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </select>
          </div>

          {/* ข้อมูล PM2.5 แบบเน้นอารมณ์ (Humanized) */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? '20px' : '40px', flex: 1, justifyContent: 'center' }}>
            
            {/* ไอคอนหน้าคนเต้นดุ๊กดิ๊ก */}
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: isMobile ? '6rem' : '8rem', filter: `drop-shadow(0 10px 20px ${health.color}40)`, lineHeight: 1 }}>
                {health.face}
              </div>
              <div style={{ position: 'absolute', bottom: isMobile ? '-10px' : '0', right: '-10px', background: health.color, color: '#fff', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', border: `3px solid ${cardBg}` }}>
                {pmVal <= 25 ? '✓' : '!'}
              </div>
            </div>

            {/* ตัวเลขและสถานะ */}
            <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
              <div style={{ fontSize: '1rem', color: subTextColor, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>PM2.5 (µg/m³)</div>
              <div style={{ fontSize: isMobile ? '4.5rem' : '6rem', fontWeight: '900', color: textColor, lineHeight: '1' }}>
                {pmVal != null && !isNaN(pmVal) ? pmVal : '-'}
              </div>
              <div style={{ background: health.bg, color: health.color, padding: '8px 20px', borderRadius: '50px', display: 'inline-block', fontWeight: 'bold', fontSize: '1rem', marginTop: '10px', border: `1px solid ${health.color}30` }}>
                {health.text}
              </div>
            </div>

          </div>

          {/* แถบข้อมูลรองด้านล่าง (Footer Stats) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '30px', paddingTop: '20px', borderTop: `1px dashed ${borderColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem', color: tempColor }}>🌡️</span>
              <div><div style={{ fontSize: '0.7rem', color: subTextColor }}>อุณหภูมิ</div><div style={{ fontWeight: 'bold', color: textColor }}>{tempVal ? Math.round(tempVal) : '-'}°C</div></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderLeft: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}` }}>
              <span style={{ fontSize: '1.5rem', color: '#3b82f6' }}>💧</span>
              <div><div style={{ fontSize: '0.7rem', color: subTextColor }}>ความชื้น</div><div style={{ fontWeight: 'bold', color: textColor }}>{humidityVal}%</div></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>🌬️</span>
              <div><div style={{ fontSize: '0.7rem', color: subTextColor }}>ลม</div><div style={{ fontWeight: 'bold', color: textColor }}>{windVal != null ? Math.round(windVal) : '-'} km/h</div></div>
            </div>
          </div>
        </div>

        {/* 📍 ฝั่งขวา: แผนที่ย่อ + กราฟ 24 ชม. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* แผนที่แบบย่อ */}
          <div style={{ background: cardBg, borderRadius: '24px', padding: '15px', border: `1px solid ${borderColor}`, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', flex: 1, minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.9rem', color: subTextColor, fontWeight: 'bold', margin: '0 0 10px 5px' }}>🗺️ ตำแหน่งจุดตรวจวัด</h3>
            <div style={{ flex: 1, borderRadius: '15px', overflow: 'hidden', background: innerCardBg, position: 'relative' }}>
              {activeStation && !isNaN(parseFloat(activeStation.lat)) ? (
                <MapContainer center={[parseFloat(activeStation.lat), parseFloat(activeStation.long)]} zoom={10} style={{ height: '100%', width: '100%', zIndex: 1 }} zoomControl={false} dragging={!isMobile} scrollWheelZoom={false}>
                  <TileLayer url={darkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} />
                  <MiniMapUpdate lat={parseFloat(activeStation.lat)} lon={parseFloat(activeStation.long)} />
                  {/* วงกลมรัศมีฝุ่นแบบสวยงาม */}
                  <CircleMarker center={[parseFloat(activeStation.lat), parseFloat(activeStation.long)]} radius={25} pathOptions={{ color: pmColor, fillColor: pmColor, fillOpacity: 0.3, weight: 0 }} />
                  <CircleMarker center={[parseFloat(activeStation.lat), parseFloat(activeStation.long)]} radius={6} pathOptions={{ color: '#fff', fillColor: pmColor, fillOpacity: 1, weight: 2 }} />
                </MapContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subTextColor }}>ไม่มีข้อมูลแผนที่</div>
              )}
            </div>
          </div>

          {/* กราฟแนวโน้มฝุ่น 24 ชม. (GISTDA Style) */}
          <div style={{ background: cardBg, borderRadius: '24px', padding: '20px', border: `1px solid ${borderColor}`, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', height: '220px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.9rem', color: subTextColor, fontWeight: 'bold', margin: '0 0 15px 5px' }}>📊 แนวโน้มฝุ่น PM2.5 ล่วงหน้า (24 ชม.)</h3>
            <div style={{ flex: 1 }}>
              {forecastData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forecastData} margin={{ top: 5, right: 5, bottom: -5, left: -25 }}>
                    <XAxis dataKey="time" stroke={subTextColor} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke={subTextColor} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: innerCardBg }} contentStyle={{ borderRadius: '10px', border: `1px solid ${borderColor}`, background: cardBg, color: textColor }} />
                    <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                      {forecastData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getPM25Color(entry.val)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subTextColor, fontSize: '0.85rem' }}>กำลังคำนวณโมเดลพยากรณ์...</div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}