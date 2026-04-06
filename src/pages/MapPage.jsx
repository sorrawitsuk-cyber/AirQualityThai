// src/pages/MapPage.jsx
import React, { useContext, useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { WeatherContext } from '../context/WeatherContext';

// 🌟 ดิกชันนารีแปลชื่อจังหวัด (อังกฤษ -> ไทย)
const provMap = {
  "Bangkok Metropolis": "กรุงเทพมหานคร", "Bangkok": "กรุงเทพมหานคร", 
  "Samut Prakan": "สมุทรปราการ", "Nonthaburi": "นนทบุรี", "Pathum Thani": "ปทุมธานี",
  "Phra Nakhon Si Ayutthaya": "พระนครศรีอยุธยา", "Ayutthaya": "พระนครศรีอยุธยา", 
  "Ang Thong": "อ่างทอง", "Lop Buri": "ลพบุรี", "Sing Buri": "สิงห์บุรี", "Chai Nat": "ชัยนาท", 
  "Saraburi": "สระบุรี", "Chon Buri": "ชลบุรี", "Rayong": "ระยอง", "Chanthaburi": "จันทบุรี",
  "Trat": "ตราด", "Chachoengsao": "ฉะเชิงเทรา", "Prachin Buri": "ปราจีนบุรี", "Nakhon Nayok": "นครนายก", 
  "Sa Kaeo": "สระแก้ว", "Nakhon Ratchasima": "นครราชสีมา", "Buri Ram": "บุรีรัมย์", "Surin": "สุรินทร์", 
  "Si Sa Ket": "ศรีสะเกษ", "Ubon Ratchathani": "อุบลราชธานี", "Yasothon": "ยโสธร", "Chaiyaphum": "ชัยภูมิ", 
  "Amnat Charoen": "อำนาจเจริญ", "Bueng Kan": "บึงกาฬ", "Nong Bua Lam Phu": "หนองบัวลำภู", 
  "Khon Kaen": "ขอนแก่น", "Udon Thani": "อุดรธานี", "Loei": "เลย", "Nong Khai": "หนองคาย", 
  "Maha Sarakham": "มหาสารคาม", "Roi Et": "ร้อยเอ็ด", "Kalasin": "กาฬสินธุ์", "Sakon Nakhon": "สกลนคร", 
  "Nakhon Phanom": "นครพนม", "Mukdahan": "มุกดาหาร", "Chiang Mai": "เชียงใหม่", "Lamphun": "ลำพูน", 
  "Lampang": "ลำปาง", "Uttaradit": "อุตรดิตถ์", "Phrae": "แพร่", "Nan": "น่าน", "Phayao": "พะเยา",
  "Chiang Rai": "เชียงราย", "Mae Hong Son": "แม่ฮ่องสอน", "Nakhon Sawan": "นครสวรรค์", 
  "Uthai Thani": "อุทัยธานี", "Kamphaeng Phet": "กำแพงเพชร", "Tak": "ตาก", "Sukhothai": "สุโขทัย", 
  "Phitsanulok": "พิษณุโลก", "Phichit": "พิจิตร", "Phetchabun": "เพชรบูรณ์", "Ratchaburi": "ราชบุรี", 
  "Kanchanaburi": "กาญจนบุรี", "Suphan Buri": "สุพรรณบุรี", "Nakhon Pathom": "นครปฐม", 
  "Samut Sakhon": "สมุทรสาคร", "Samut Songkhram": "สมุทรสงคราม", "Phetchaburi": "เพชรบุรี",
  "Prachuap Khiri Khan": "ประจวบคีรีขันธ์", "Nakhon Si Thammarat": "นครศรีธรรมราช", "Krabi": "กระบี่",
  "Phangnga": "พังงา", "Phang Nga": "พังงา", "Phuket": "ภูเก็ต", "Surat Thani": "สุราษฎร์ธานี", 
  "Ranong": "ระนอง", "Chumphon": "ชุมพร", "Songkhla": "สงขลา", "Satun": "สตูล", "Trang": "ตรัง", 
  "Phatthalung": "พัทลุง", "Pattani": "ปัตตานี", "Yala": "ยะลา", "Narathiwat": "นราธิวาส"
};

// 🌟 เกณฑ์แบ่งสีคำอธิบาย (Legend)
const legendConfigs = {
  pm25: [
    { c: '#ef4444', t: '> 75 (มีผลกระทบต่อสุขภาพ)' },
    { c: '#f97316', t: '38 - 75 (เริ่มมีผลกระทบ)' },
    { c: '#eab308', t: '26 - 37 (ปานกลาง)' },
    { c: '#22c55e', t: '0 - 25 (คุณภาพอากาศดี)' }
  ],
  temp: [
    { c: '#ef4444', t: '> 39°C (ร้อนจัด)' },
    { c: '#f97316', t: '35 - 39°C (ร้อน)' },
    { c: '#eab308', t: '29 - 34°C (อุ่น)' },
    { c: '#22c55e', t: '23 - 28°C (เย็นสบาย)' },
    { c: '#3b82f6', t: '< 23°C (อากาศเย็น)' }
  ],
  heat: [
    { c: '#ef4444', t: '> 39°C (อันตราย)' },
    { c: '#f97316', t: '35 - 39°C (เตือนภัย)' },
    { c: '#eab308', t: '29 - 34°C (เฝ้าระวัง)' },
    { c: '#22c55e', t: '23 - 28°C (ปกติ)' },
    { c: '#3b82f6', t: '< 23°C (ปลอดภัย)' }
  ],
  rain: [
    { c: '#1e3a8a', t: '> 70% (ฝนตกหนัก)' },
    { c: '#3b82f6', t: '41 - 70% (ฝนตกปานกลาง)' },
    { c: '#60a5fa', t: '11 - 40% (ฝนเล็กน้อย)' },
    { c: '#94a3b8', t: '0 - 10% (ฝนทิ้งช่วง)' }
  ],
  humidity: [
    { c: '#1e3a8a', t: '> 70% (ชื้นมาก / อึดอัด)' },
    { c: '#3b82f6', t: '41 - 70% (ปานกลาง)' },
    { c: '#60a5fa', t: '11 - 40% (แห้งสบาย)' },
    { c: '#94a3b8', t: '0 - 10% (แห้งมาก)' }
  ],
  wind: [
    { c: '#ef4444', t: '> 40 km/h (พายุลมแรง)' },
    { c: '#f97316', t: '21 - 40 km/h (ลมแรง)' },
    { c: '#eab308', t: '11 - 20 km/h (ลมปานกลาง)' },
    { c: '#22c55e', t: '0 - 10 km/h (ลมสงบ)' }
  ]
};

// 🌟 ตัวดักจับ Event การซูมแผนที่
function MapZoomListener({ setMapZoom }) {
  useMapEvents({
    zoomend: (e) => {
      setMapZoom(e.target.getZoom());
    }
  });
  return null;
}

export default function MapPage() {
  const { stations, stationTemps, darkMode } = useContext(WeatherContext);
  const [geoData, setGeoData] = useState(null);
  const [activeMode, setActiveMode] = useState('pm25');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  // 🌟 State สำหรับฟีเจอร์ใหม่
  const [mapZoom, setMapZoom] = useState(window.innerWidth < 1024 ? 5 : 6);
  const [polyOpacity, setPolyOpacity] = useState(0.75); // ปรับความโปร่งใส

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch('/thailand.json')
      .then(res => {
          if(!res.ok) throw new Error("หาไฟล์ GeoJSON ไม่เจอ");
          return res.json();
      })
      .then(data => setGeoData(data))
      .catch(e => console.error('Error loading GeoJSON:', e));
  }, []);

  const modes = [
    { id: 'pm25', name: '😷 ฝุ่น PM2.5', unit: 'µg/m³' },
    { id: 'heat', name: '🥵 ดัชนีความร้อน', unit: '°C' },
    { id: 'temp', name: '🌡️ อุณหภูมิ', unit: '°C' },
    { id: 'rain', name: '☔ โอกาสฝนตก', unit: '%' },
    { id: 'humidity', name: '💧 ความชื้น', unit: '%' },
    { id: 'wind', name: '🌬️ ความเร็วลม', unit: 'km/h' }
  ];

  const getVal = (station) => {
    if (!station || !stationTemps[station.stationID]) return null;
    const data = stationTemps[station.stationID];
    switch(activeMode) {
        case 'pm25': return station.AQILast?.PM25?.value || 0;
        case 'heat': return Math.round(data.feelsLike || 0);
        case 'temp': return Math.round(data.temp || 0);
        case 'rain': return data.rainProb || 0;
        case 'humidity': return Math.round(data.humidity || 0);
        case 'wind': return Math.round(data.windSpeed || 0);
        default: return 0;
    }
  };

  const getColor = (val, mode) => {
    if (val === null || val === undefined) return darkMode ? '#334155' : '#cbd5e1';
    if (mode === 'pm25') return val > 75 ? '#ef4444' : val > 37.5 ? '#f97316' : val > 25 ? '#eab308' : '#22c55e';
    if (mode === 'temp' || mode === 'heat') return val > 39 ? '#ef4444' : val > 34 ? '#f97316' : val > 28 ? '#eab308' : val > 22 ? '#22c55e' : '#3b82f6';
    if (mode === 'rain' || mode === 'humidity') return val > 70 ? '#1e3a8a' : val > 40 ? '#3b82f6' : val > 10 ? '#60a5fa' : '#94a3b8';
    if (mode === 'wind') return val > 40 ? '#ef4444' : val > 20 ? '#f97316' : val > 10 ? '#eab308' : '#22c55e';
    return darkMode ? '#334155' : '#cbd5e1';
  };

  // 🌟 ประมวลผลข้อมูลจัดอันดับ Sidebar
  const rankedStations = useMemo(() => {
    return stations
      .map(st => {
        const val = getVal(st);
        return { ...st, val: val, color: getColor(val, activeMode) };
      })
      .filter(st => st.val !== null && st.val !== undefined)
      .sort((a, b) => b.val - a.val); // เรียงจากมากไปน้อย
  }, [stations, stationTemps, activeMode, darkMode]);

  // กำหนดสไตล์ Polygon
  const styleGeoJSON = (feature) => {
    const props = Object.values(feature.properties || {}).map(v => String(v).trim());
    let thaiNameFromMap = "";
    for (let p of props) {
        if (provMap[p]) { thaiNameFromMap = provMap[p]; break; }
    }
    const station = stations.find(s => {
        const cleanName = s.areaTH.replace('จังหวัด', '').trim();
        return cleanName === thaiNameFromMap || props.includes(cleanName) || props.some(p => p.includes(cleanName));
    });

    const val = getVal(station);
    const color = station ? getColor(val, activeMode) : (darkMode ? '#334155' : '#cbd5e1');

    return {
        fillColor: color,
        weight: 1.5, 
        opacity: 1,
        color: '#ffffff', 
        fillOpacity: polyOpacity // 🌟 ใช้ State ความโปร่งใส
    };
  };

  // 🌟 สร้างไอคอน (โชว์ทั้งชื่อและตัวเลขเมื่อซูมเข้า)
  const createLabelIcon = (name, val) => {
    return L.divIcon({
        className: 'custom-text-icon',
        html: `<div style="color: #1e293b; font-weight: 900; font-size: ${isMobile ? '10px' : '11px'}; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff; text-align: center; line-height: 1.2; display: flex; flex-direction: column; align-items: center; justify-content: center; white-space: nowrap;">
                 <div style="font-size: 0.85em; opacity: 0.85;">${name.replace('จังหวัด', '')}</div>
                 <div style="font-size: 1.2em;">${val}</div>
               </div>`,
        iconSize: [60, 40],
        iconAnchor: [30, 20]
    });
  };

  const appBg = darkMode ? '#020617' : '#f8fafc'; 
  const cardBg = darkMode ? '#0f172a' : '#ffffff';
  const textColor = darkMode ? '#f8fafc' : '#0f172a'; 
  const borderColor = darkMode ? '#1e293b' : '#e2e8f0';
  const subTextColor = darkMode ? '#94a3b8' : '#64748b'; 
  const activeUnit = modes.find(m => m.id === activeMode)?.unit || '';
  
  const mapUrl = darkMode 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  if (!geoData || Object.keys(stationTemps).length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', background: appBg, color: textColor, fontFamily: 'Kanit, sans-serif' }}>
        <style dangerouslySetInlineStyle={{__html: `@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.95); } }`}} />
        <div style={{ fontSize: '4rem', animation: 'pulse 1.5s infinite ease-in-out' }}>🗺️</div>
        <div style={{ marginTop: '20px', fontSize: '1.2rem', fontWeight: 'bold' }}>กำลังประมวลผลแผนที่</div>
        <div style={{ fontSize: '0.9rem', color: subTextColor, marginTop: '8px' }}>กรุณารอสักครู่...</div>
    </div>
  );

  return (
    <div style={{ height: '100%', width: '100%', background: appBg, display: 'flex', flexDirection: 'column', fontFamily: 'Kanit, sans-serif', padding: isMobile ? '10px' : '20px' }}>
      
      {/* Tab Bar เลือกโหมด */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '15px', background: cardBg, borderRadius: '20px', marginBottom: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', flexShrink: 0 }} className="hide-scrollbar">
        <style dangerouslySetInlineStyle={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
        {modes.map(m => (
           <button 
             key={m.id} 
             onClick={() => setActiveMode(m.id)} 
             style={{ 
                padding: '10px 20px', borderRadius: '12px', border: 'none', 
                background: activeMode === m.id ? '#0ea5e9' : (darkMode ? '#1e293b' : '#f1f5f9'), 
                color: activeMode === m.id ? '#fff' : textColor, 
                fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                boxShadow: activeMode === m.id ? '0 4px 10px rgba(14, 165, 233, 0.3)' : 'none'
             }}
           >
              {m.name}
           </button>
        ))}
      </div>

      {/* 🌟 Layout หลัก: แผนที่ ซ้าย / Sidebar ขวา */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flex: 1, gap: '15px', overflow: 'hidden' }}>
          
          {/* ส่วนของแผนที่ */}
          <div style={{ flex: 1, borderRadius: '25px', overflow: 'hidden', border: `1px solid ${borderColor}`, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', position: 'relative', minHeight: isMobile ? '500px' : 'auto' }}>
            
            <MapContainer center={[13.5, 100.5]} zoom={isMobile ? 5 : 6} style={{ height: '100%', width: '100%', background: darkMode ? '#020617' : '#f8fafc' }} zoomControl={false}>
                <TileLayer url={mapUrl} attribution='&copy; OpenStreetMap & CartoDB' />
                <MapZoomListener setMapZoom={setMapZoom} />

                {/* วาดพื้นที่ GeoJSON พร้อมบังคับรีเรนเดอร์เมื่อเปลี่ยนโหมดหรือความโปร่งใส */}
                {geoData && <GeoJSON key={`${activeMode}-${polyOpacity}`} data={geoData} style={styleGeoJSON} />}

                {/* 🌟 ซ่อนตัวเลขถ้าซูมออกเกินไป ป้องกันแผนที่รก (กำหนดให้โชว์เมื่อ zoom >= 7) */}
                {mapZoom >= 7 && stations.map(st => {
                    const val = getVal(st);
                    if (val === null || (val === 0 && activeMode === 'rain')) return null; 
                    return (
                        <Marker key={st.stationID} position={[st.lat, st.long]} icon={createLabelIcon(st.areaTH, val)} interactive={false} />
                    );
                })}
            </MapContainer>

            {/* 🌟 แถบปรับความโปร่งใส (Opacity Slider) ลอยอยู่ขวาบน */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, background: darkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(5px)', padding: '10px 15px', borderRadius: '16px', border: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', gap: '5px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: textColor }}>ความทึบของสีแผนที่</span>
                <input 
                   type="range" min="0.1" max="1" step="0.05" 
                   value={polyOpacity} 
                   onChange={(e) => setPolyOpacity(parseFloat(e.target.value))} 
                   style={{ width: '120px', cursor: 'pointer', accentColor: '#0ea5e9' }}
                />
            </div>

            {/* 🌟 กล่องคำอธิบายเกณฑ์สี (Legend) ลอยอยู่ขวาล่าง */}
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 1000, background: darkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(5px)', padding: '15px', borderRadius: '16px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: textColor, marginBottom: '8px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '5px' }}>เกณฑ์การประเมิน</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                   {legendConfigs[activeMode].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: subTextColor, fontWeight: 'bold' }}>
                         <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: item.c, border: '1px solid rgba(255,255,255,0.3)' }}></span>
                         {item.t}
                      </div>
                   ))}
                </div>
            </div>
          </div>

          {/* 🌟 Sidebar จัดอันดับข้อมูล (Ranking List) */}
          <div style={{ width: isMobile ? '100%' : '320px', background: cardBg, borderRadius: '25px', padding: '20px', border: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
             <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: textColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏆</span> จัดอันดับ 77 จังหวัด
             </h3>
             <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }} className="hide-scrollbar">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   {rankedStations.map((st, idx) => (
                      <div key={st.stationID} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: darkMode ? '#1e293b' : '#f1f5f9', borderRadius: '12px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.9rem', color: subTextColor, fontWeight: 'bold', width: '20px' }}>{idx + 1}.</span>
                            <span style={{ fontSize: '0.95rem', color: textColor, fontWeight: 'bold' }}>{st.areaTH.replace('จังหวัด', '')}</span>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: '900', color: textColor }}>{st.val} <span style={{ fontSize: '0.7rem', color: subTextColor }}>{activeUnit}</span></span>
                            {/* จุดสีบอกระดับความเสี่ยง */}
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: st.color }}></span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>

      </div>

      {/* Spacer ดันขอบล่างสำหรับมือถือ */}
      <div style={{ height: isMobile ? '80px' : '20px', flexShrink: 0 }}></div>
    </div>
  );
}