// src/pages/Dashboard.jsx
import React, { useContext, useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ComposedChart, Line, LineChart } from 'recharts';
import { useNavigate } from 'react-router-dom'; 
import { WeatherContext } from '../context/WeatherContext';
import { extractProvince, formatLocationName, getPM25Color, getDistanceFromLatLonInKm } from '../utils/helpers';

const getHealthStatus = (pm) => {
  if (pm == null || isNaN(pm)) return { face: '😶', text: 'ไม่มีข้อมูล', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
  if (pm <= 15.0) return { face: '😁', text: 'คุณภาพอากาศดีมาก', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }; 
  if (pm <= 25.0) return { face: '🙂', text: 'คุณภาพอากาศดี', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' }; 
  if (pm <= 37.5) return { face: '😐', text: 'คุณภาพปานกลาง', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' }; 
  if (pm <= 75.0) return { face: '😷', text: 'เริ่มมีผลกระทบ', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' }; 
  return { face: '🤢', text: 'มีผลกระทบสุขภาพ', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }; 
};

const getHeatStatus = (val) => {
  if (val == null || isNaN(val)) return { face: '😶', text: 'ไม่มีข้อมูล', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
  if (val >= 52) return { face: '🥵', text: 'อันตรายมาก (ฮีทสโตรก)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
  if (val >= 41) return { face: '😰', text: 'อันตราย (เลี่ยงแดด)', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' };
  if (val >= 32) return { face: '😅', text: 'เฝ้าระวัง (เตือนภัย)', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' };
  return { face: '😎', text: 'ปกติ (ปลอดภัย)', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' };
};

const getStatColor = (type, val) => {
  if (type === 'pm25') return getPM25Color(val);
  if (type === 'heat') return getHeatStatus(val).color;
  if (type === 'temp') return val >= 35 ? '#ef4444' : val >= 30 ? '#f97316' : '#22c55e';
  if (type === 'rain') return '#3b82f6';
  return '#94a3b8';
};

// 🌟 ตัวช่วยตัดคำให้เหลือแค่ชื่อสถานที่ (ตำบล/เขต)
const formatAreaName = (areaTH) => areaTH ? areaTH.split(',')[0].trim() : '';

function MiniMapUpdate({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon && !isNaN(lat) && !isNaN(lon)) map.flyTo([lat, lon], 10);
  }, [lat, lon, map]);
  return null;
}

export default function Dashboard() {
  const navigate = useNavigate(); 
  const { stations, stationTemps, loading, darkMode, lastUpdateText } = useContext(WeatherContext);
  
  // 🌟 State สำหรับตัวกรอง 2 ชั้น
  const [selectedProv, setSelectedProv] = useState('');
  const [selectedStationId, setSelectedStationId] = useState(() => localStorage.getItem('lastStationId') || '');
  const [activeStation, setActiveStation] = useState(null);
  
  const [greeting, setGreeting] = useState('สวัสดี');
  const [timeOfDay, setTimeOfDay] = useState('morning'); 
  
  const [statFilter, setStatFilter] = useState('pm25');
  const [historicalData, setHistoricalData] = useState([]);
  const [masterTableData, setMasterTableData] = useState([]);
  
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  // ดึงรายชื่อจังหวัดทั้งหมดแบบไม่ซ้ำ
  const allProvinces = [...new Set((stations || []).map(s => extractProvince(s.areaTH)))].sort((a, b) => a.localeCompare(b, 'th'));

  useEffect(() => {
    if (window.innerWidth >= 1024 && !sessionStorage.getItem('hasRedirectedToMap')) {
      sessionStorage.setItem('hasRedirectedToMap', 'true');
      navigate('/map', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) { setGreeting('สวัสดีตอนเช้า ⛅'); setTimeOfDay('morning'); }
    else if (hour >= 12 && hour < 18) { setGreeting('สวัสดีตอนบ่าย ☀️'); setTimeOfDay('afternoon'); }
    else { setGreeting('สวัสดีตอนเย็น 🌙'); setTimeOfDay('evening'); }
  }, []);

  // 🌟 การตั้งค่าเริ่มต้นเมื่อโหลดแอป
  useEffect(() => {
    if (stations && stations.length > 0 && !selectedProv) {
      const savedStId = localStorage.getItem('lastStationId');
      if (savedStId) {
        const st = stations.find(s => s.stationID === savedStId);
        if (st) {
          setSelectedProv(extractProvince(st.areaTH));
          setSelectedStationId(savedStId);
          return;
        }
      }
      // ถ้าไม่มีให้ค่าเริ่มต้นเป็นกรุงเทพฯ
      const bkk = stations.find(s => extractProvince(s.areaTH) === 'กรุงเทพมหานคร');
      const initial = bkk || stations[0];
      setSelectedProv(extractProvince(initial.areaTH));
      setSelectedStationId(initial.stationID);
    }
  }, [stations, selectedProv]);

  useEffect(() => {
    if (stations && stations.length > 0 && selectedStationId) {
      const target = stations.find(s => s.stationID === selectedStationId);
      if (target) setActiveStation(target);
    }
  }, [selectedStationId, stations]);

  // 🌟 ฟังก์ชันหาพิกัดปัจจุบัน (GPS Button)
  const handleGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          let nearest = null; let minD = Infinity;
          stations.forEach(s => { 
            const d = getDistanceFromLatLonInKm(pos.coords.latitude, pos.coords.longitude, parseFloat(s.lat), parseFloat(s.long)); 
            if (d < minD) { minD = d; nearest = s; } 
          });
          if (nearest) { 
            setSelectedProv(extractProvince(nearest.areaTH));
            setSelectedStationId(nearest.stationID); 
            localStorage.setItem('lastStationId', nearest.stationID); 
          }
        }, 
        () => alert("⚠️ ไม่สามารถดึงตำแหน่งปัจจุบันได้ กรุณาเปิด GPS"),
        { timeout: 10000 }
      );
    } else {
      alert("❌ อุปกรณ์ของคุณไม่รองรับ GPS");
    }
  };

  useEffect(() => {
    if (stations && stations.length > 0) {
      const baseValue = statFilter === 'pm25' ? 30 : statFilter === 'heat' ? 40 : statFilter === 'temp' ? 32 : 20;
      const historyMock = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
        const randomVal = baseValue + (Math.random() * 20 - 10);
        return { day: i === 6 ? 'วันนี้' : days[d.getDay()], val: Math.max(0, Math.round(randomVal)), avg10Year: Math.max(0, Math.round(baseValue + 2)) };
      });
      setHistoricalData(historyMock);

      if (isDesktop) {
        const tableArr = allProvinces.map(prov => {
          const provStations = stations.filter(s => extractProvince(s.areaTH) === prov);
          let sumPm = 0, sumTemp = 0, sumHeat = 0, sumRain = 0; let validPm = 0, validTemp = 0;
          provStations.forEach(s => {
            const pm = s.AQILast && s.AQILast.PM25 ? Number(s.AQILast.PM25.value) : NaN;
            if (!isNaN(pm)) { sumPm += pm; validPm++; }
            const tObj = stationTemps[s.stationID];
            if (tObj) {
              if (tObj.temp != null) { sumTemp += tObj.temp; validTemp++; }
              if (tObj.feelsLike != null) sumHeat += tObj.feelsLike;
              if (tObj.rainProb != null) sumRain += tObj.rainProb;
            }
          });
          const avgPm = validPm > 0 ? Math.round(sumPm / validPm) : 0;
          const trendMock = Array.from({ length: 7 }, () => ({ val: Math.max(0, avgPm + (Math.random() * 20 - 10)) }));
          return { 
            prov, pm25: avgPm, 
            temp: validTemp > 0 ? Math.round(sumTemp / validTemp) : 0, 
            heat: validTemp > 0 ? Math.round(sumHeat / validTemp) : 0, 
            rain: validTemp > 0 ? Math.round(sumRain / validTemp) : 0,
            trend: trendMock
          };
        });
        setMasterTableData(tableArr.sort((a, b) => b.pm25 - a.pm25));
      }
    }
  }, [stations, stationTemps, statFilter, isDesktop]);

  const todayStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

  let dynamicBg = darkMode ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : (timeOfDay === 'morning' ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' : (timeOfDay === 'afternoon' ? 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)')); 
  const cardBg = darkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)';
  const innerCardBg = darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)';
  const textColor = darkMode ? '#f8fafc' : '#0f172a';
  const subTextColor = darkMode ? '#94a3b8' : '#64748b'; 
  const borderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'; 
  
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: dynamicBg, color: textColor, fontWeight: 'bold' }}>กำลังโหลดข้อมูล... ⏳</div>;

  const pmVal = activeStation && activeStation.AQILast && activeStation.AQILast.PM25 ? Number(activeStation.AQILast.PM25.value) : null;
  const tObj = activeStation ? stationTemps[activeStation.stationID] : null;
  const tempVal = tObj ? tObj.temp : null;
  const humidityVal = tObj && tObj.humidity != null ? tObj.humidity : '-';
  const windVal = tObj ? tObj.windSpeed : null;
  const heatVal = tObj ? tObj.feelsLike : null;

  const health = getHealthStatus(pmVal);
  const heatStatus = getHeatStatus(heatVal);
  const pmColor = getPM25Color(pmVal);

  // 🌟 ฟังก์ชันเรนเดอร์อิโมจิในวงกลมเปลี่ยนสี
  const renderEmojiBadge = (emoji, color) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      width: isMobile ? '70px' : '90px', height: isMobile ? '70px' : '90px',
      background: `radial-gradient(circle at 30% 30%, ${color} 0%, ${color}dd 100%)`, // วงกลมสีทึบตามความอันตราย
      borderRadius: '50%',
      boxShadow: `0 8px 20px ${color}60, inset 0 2px 5px rgba(255,255,255,0.4)`, // เงาเรืองแสงรอบๆ
      border: `3px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#fff'}`
    }}>
      <span style={{ fontSize: isMobile ? '3rem' : '4rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
        {emoji}
      </span>
    </div>
  );

  return (
    <div style={{ height: '100%', width: '100%', maxWidth: '100vw', padding: !isDesktop ? '15px' : '30px', paddingBottom: !isDesktop ? '100px' : '40px', display: 'flex', flexDirection: 'column', gap: !isDesktop ? '12px' : '20px', boxSizing: 'border-box', overflowY: 'auto', overflowX: 'hidden', background: dynamicBg, fontFamily: 'Kanit, sans-serif' }} className="hide-scrollbar">
      
      {/* 🟢 HEADER (ซ่อนอัปเดตในมือถือ เพราะย้ายไป Layout แล้ว) */}
      <div style={{ display: !isDesktop ? 'none' : 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: textColor, margin: 0, fontWeight: '800', filter: darkMode ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }}>{greeting}</h1>
          <p style={{ margin: '2px 0 0 0', color: subTextColor, fontSize: '0.95rem' }}>{todayStr}</p>
        </div>
        <div style={{ background: innerCardBg, backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: '12px', color: subTextColor, fontSize: '0.75rem', fontWeight: 'bold', border: `1px solid ${borderColor}`, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
          ⏱️ อัปเดต: {lastUpdateText || '-'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1.4fr 1fr' : '1fr', gap: '20px', width: '100%', flexShrink: 0 }}>
        
        {/* 📍 ฝั่งซ้าย: HERO CARD */}
        <div style={{ background: cardBg, backdropFilter: 'blur(20px)', borderRadius: isMobile ? '20px' : '24px', padding: !isDesktop ? '15px' : '30px', border: `1px solid ${borderColor}`, boxShadow: '0 10px 40px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
          
          {/* 🌟 ตัวกรอง 2 ชั้น & ปุ่ม GPS */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px', width: '100%', marginBottom: isMobile ? '15px' : '25px' }}>
            
            {/* ชั้นที่ 1: ปุ่ม GPS + เลือกจังหวัด */}
            <div style={{ display: 'flex', gap: '8px', flex: isDesktop ? 0.4 : 1 }}>
              <button 
                onClick={handleGPS} 
                style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '14px', padding: '0 15px', cursor: 'pointer', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(14,165,233,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                title="ค้นหาตำแหน่งปัจจุบัน"
              >
                🎯
              </button>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: innerCardBg, padding: '10px 15px', borderRadius: '14px', border: `1px solid ${borderColor}` }}>
                <span style={{ marginRight: '8px', fontSize: '1.1rem' }}>📍</span>
                <select value={selectedProv} onChange={e => {
                  const prov = e.target.value;
                  setSelectedProv(prov);
                  const firstSt = stations.find(s => extractProvince(s.areaTH) === prov);
                  if (firstSt) { setSelectedStationId(firstSt.stationID); localStorage.setItem('lastStationId', firstSt.stationID); }
                }} style={{ flex: 1, background: 'transparent', color: textColor, border: 'none', fontWeight: 'bold', fontSize: '0.95rem', outline: 'none', cursor: 'pointer', appearance: 'none' }}>
                  {allProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <span style={{ color: subTextColor, fontSize: '0.8rem' }}>▼</span>
              </div>
            </div>

            {/* ชั้นที่ 2: เลือกจุดตรวจวัด (ตำบล/เขต) */}
            <div style={{ flex: isDesktop ? 0.6 : 1, display: 'flex', alignItems: 'center', background: innerCardBg, padding: '10px 15px', borderRadius: '14px', border: `1px solid ${borderColor}` }}>
              <span style={{ marginRight: '8px', fontSize: '1.1rem' }}>🏢</span>
              <select value={selectedStationId} onChange={handleStationChange} style={{ flex: 1, background: 'transparent', color: textColor, border: 'none', fontWeight: 'bold', fontSize: '0.95rem', outline: 'none', cursor: 'pointer', appearance: 'none', textOverflow: 'ellipsis' }}>
                {stations.filter(s => extractProvince(s.areaTH) === selectedProv).map(s => (
                  <option key={s.stationID} value={s.stationID}>{formatAreaName(s.areaTH)}</option>
                ))}
              </select>
              <span style={{ color: subTextColor, fontSize: '0.8rem' }}>▼</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '15px', width: '100%' }}>
            {/* การ์ด PM2.5 (วงกลมเปลี่ยนสีตามความอันตราย) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: innerCardBg, padding: '12px 20px', borderRadius: '20px', border: `1px solid ${borderColor}` }}>
              {renderEmojiBadge(health.face, health.color)}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                 <span style={{ fontSize: '0.75rem', color: subTextColor, fontWeight: 'bold', letterSpacing: '0.5px' }}>PM2.5 (µg/m³)</span>
                 <span style={{ fontSize: isMobile ? '3rem' : '3.5rem', fontWeight: '900', color: health.color, lineHeight: 1.1 }}>{pmVal != null && !isNaN(pmVal) ? pmVal : '-'}</span>
                 <span style={{ background: health.bg, color: health.color, padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '4px' }}>{health.text}</span>
              </div>
            </div>
            {/* การ์ดดัชนีความร้อน (วงกลมเปลี่ยนสีตามความอันตราย) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: innerCardBg, padding: '12px 20px', borderRadius: '20px', border: `1px solid ${borderColor}` }}>
              {renderEmojiBadge(heatStatus.face, heatStatus.color)}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                 <span style={{ fontSize: '0.75rem', color: subTextColor, fontWeight: 'bold', letterSpacing: '0.5px' }}>ดัชนีความร้อน (°C)</span>
                 <span style={{ fontSize: isMobile ? '3rem' : '3.5rem', fontWeight: '900', color: heatStatus.color, lineHeight: 1.1 }}>{heatVal != null ? Math.round(heatVal) : '-'}</span>
                 <span style={{ background: heatStatus.bg, color: heatStatus.color, padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '4px' }}>{heatStatus.text}</span>
              </div>
            </div>
          </div>

          {/* แถบข้อมูลรองด้านล่าง */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: isMobile ? '15px' : '20px', paddingTop: '15px', borderTop: `1px dashed ${borderColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🌡️</span>
              <div><div style={{ fontSize: '0.65rem', color: subTextColor }}>อุณหภูมิ</div><div style={{ fontWeight: 'bold', color: textColor, fontSize: '0.85rem' }}>{tempVal ? Math.round(tempVal) : '-'}°C</div></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderLeft: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}` }}>
              <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>💧</span>
              <div><div style={{ fontSize: '0.65rem', color: subTextColor }}>ความชื้น</div><div style={{ fontWeight: 'bold', color: textColor, fontSize: '0.85rem' }}>{humidityVal}%</div></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🌬️</span>
              <div><div style={{ fontSize: '0.65rem', color: subTextColor }}>ลม</div><div style={{ fontWeight: 'bold', color: textColor, fontSize: '0.85rem' }}>{windVal != null ? Math.round(windVal) : '-'} <span style={{fontSize: '0.6rem'}}>km/h</span></div></div>
            </div>
          </div>
        </div>

        {/* 📍 ฝั่งขวา: แผนที่ย่อ (แสดงเฉพาะคอม) */}
        {isDesktop && (
          <div style={{ background: cardBg, backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '15px', border: `1px solid ${borderColor}`, boxShadow: '0 10px 40px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.9rem', color: subTextColor, fontWeight: 'bold', margin: '0 0 10px 5px' }}>🗺️ ตำแหน่งจุดตรวจวัด</h3>
            <div style={{ flex: 1, borderRadius: '15px', overflow: 'hidden', background: innerCardBg, position: 'relative' }}>
              {activeStation && !isNaN(parseFloat(activeStation.lat)) ? (
                <MapContainer center={[parseFloat(activeStation.lat), parseFloat(activeStation.long)]} zoom={10} style={{ height: '100%', width: '100%', zIndex: 1 }} zoomControl={false} dragging={true} scrollWheelZoom={false}>
                  <TileLayer url={darkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} />
                  <MiniMapUpdate lat={parseFloat(activeStation.lat)} lon={parseFloat(activeStation.long)} />
                  <CircleMarker center={[parseFloat(activeStation.lat), parseFloat(activeStation.long)]} radius={25} pathOptions={{ color: pmColor, fillColor: pmColor, fillOpacity: 0.3, weight: 0 }} />
                  <CircleMarker center={[parseFloat(activeStation.lat), parseFloat(activeStation.long)]} radius={6} pathOptions={{ color: '#fff', fillColor: pmColor, fillOpacity: 1, weight: 2 }} />
                </MapContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subTextColor }}>ไม่มีข้อมูลแผนที่</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 🌟🌟 ส่วนต่อขยาย: สถิติเชิงลึก (ซ่อนในมือถือ) 🌟🌟 */}
      {isDesktop && (
        <div style={{ background: cardBg, backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '25px', border: `1px solid ${borderColor}`, boxShadow: '0 10px 40px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '25px', flexShrink: 0 }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${borderColor}`, paddingBottom: '15px' }}>
            <h3 style={{ fontSize: '1.2rem', color: textColor, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 วิเคราะห์สถิติข้อมูล
            </h3>
            
            <div style={{ display: 'flex', gap: '8px', background: innerCardBg, padding: '4px', borderRadius: '12px' }}>
              {[{ id: 'pm25', label: 'ฝุ่น PM2.5' }, { id: 'heat', label: 'ดัชนีความร้อน' }, { id: 'temp', label: 'อุณหภูมิ' }, { id: 'rain', label: 'โอกาสฝน' }].map(f => (
                <button 
                  key={f.id} onClick={() => setStatFilter(f.id)}
                  style={{ 
                    padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer',
                    background: statFilter === f.id ? '#0ea5e9' : 'transparent', color: statFilter === f.id ? '#fff' : subTextColor,
                    boxShadow: statFilter === f.id ? '0 2px 5px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s'
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: '350px', width: '100%', background: innerCardBg, borderRadius: '16px', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.85rem', color: subTextColor, fontWeight: 'bold', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
              <span>สถิติ 7 วันย้อนหลัง ณ จุดตรวจวัด</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '20px', height: '3px', background: darkMode ? '#cbd5e1' : '#64748b', borderStyle: 'dashed' }}></div> ค่าเฉลี่ย 10 ปี</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={historicalData} margin={{ top: 20, right: 20, bottom: 5, left: -20 }}>
                  <XAxis dataKey="day" stroke={subTextColor} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke={subTextColor} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: `1px solid ${borderColor}`, background: cardBg, color: textColor }} />
                  <Bar dataKey="val" radius={[6, 6, 0, 0]} maxBarSize={35}>
                    {historicalData.map((entry, index) => <Cell key={`cell-${index}`} fill={getStatColor(statFilter, entry.val)} />)}
                  </Bar>
                  <Line type="monotone" dataKey="avg10Year" stroke={darkMode ? '#cbd5e1' : '#64748b'} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <h3 style={{ fontSize: '1rem', color: textColor, fontWeight: 'bold', margin: '0 0 15px 0' }}>📋 ตารางข้อมูลระดับจังหวัด (77 จังหวัด)</h3>
            <div style={{ overflowX: 'auto', background: innerCardBg, borderRadius: '16px', border: `1px solid ${borderColor}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', color: textColor }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${borderColor}`, color: subTextColor }}>
                    <th style={{ padding: '15px 20px', fontWeight: 'bold' }}>จังหวัด</th>
                    <th style={{ padding: '15px', fontWeight: 'bold', textAlign: 'center' }}>PM2.5</th>
                    <th style={{ padding: '15px', fontWeight: 'bold', textAlign: 'center' }}>ดัชนีร้อน</th>
                    <th style={{ padding: '15px', fontWeight: 'bold', textAlign: 'center' }}>อุณหภูมิ</th>
                    <th style={{ padding: '15px', fontWeight: 'bold', textAlign: 'center' }}>โอกาสฝน</th>
                    <th style={{ padding: '15px', fontWeight: 'bold', textAlign: 'center' }}>สถานะ PM2.5</th>
                    <th style={{ padding: '15px', fontWeight: 'bold', textAlign: 'center', width: '120px' }}>แนวโน้ม (7 วัน)</th>
                  </tr>
                </thead>
                <tbody>
                  {masterTableData.map((row, idx) => {
                    const status = getHealthStatus(row.pm25);
                    return (
                      <tr key={idx} style={{ borderBottom: `1px solid ${borderColor}`, transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background=darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.02)'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                        <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>{row.prov}</td>
                        <td style={{ padding: '15px', textAlign: 'center', fontWeight: '900', color: getPM25Color(row.pm25) }}>{row.pm25}</td>
                        <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: getHeatStatus(row.heat).color }}>{row.heat}°</td>
                        <td style={{ padding: '15px', textAlign: 'center', color: subTextColor }}>{row.temp}°C</td>
                        <td style={{ padding: '15px', textAlign: 'center', color: '#3b82f6', fontWeight: 'bold' }}>{row.rain}%</td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <span style={{ background: status.bg, color: status.color, padding: '6px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', border: `1px solid ${status.color}30` }}>
                            {status.face} {status.text.replace('⭐', '').replace('⭐', '')}
                          </span>
                        </td>
                        <td style={{ padding: '10px 15px' }}>
                          <ResponsiveContainer width="100%" height={35}>
                            <LineChart data={row.trend.map(v => ({val: v.val}))}>
                              <Line type="monotone" dataKey="val" stroke={getPM25Color(row.pm25)} strokeWidth={2.5} dot={false} isAnimationActive={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}