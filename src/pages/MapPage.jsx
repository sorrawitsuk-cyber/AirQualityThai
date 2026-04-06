// src/pages/MapPage.jsx
import React, { useContext, useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { WeatherContext } from '../context/WeatherContext';

// 🌟 ดิกชันนารีแปลชื่อจังหวัด (อังกฤษ -> ไทย) เพื่อให้ GeoJSON คุยกับข้อมูลเราได้รู้เรื่อง
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

export default function MapPage() {
  const { stations, stationTemps, darkMode } = useContext(WeatherContext);
  const [geoData, setGeoData] = useState(null);
  const [activeMode, setActiveMode] = useState('pm25');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch('/thailand.json')
      .then(res => {
          if(!res.ok) throw new Error("หาไฟล์ไม่เจอ");
          return res.json();
      })
      .then(data => setGeoData(data))
      .catch(e => console.error('Error loading GeoJSON:', e));
  }, []);

  const modes = [
    { id: 'pm25', name: '😷 ฝุ่น PM2.5' },
    { id: 'heat', name: '🥵 ดัชนีความร้อน' },
    { id: 'temp', name: '🌡️ อุณหภูมิ' },
    { id: 'rain', name: '☔ โอกาสฝนตก' },
    { id: 'humidity', name: '💧 ความชื้น' },
    { id: 'wind', name: '🌬️ ความเร็วลม' }
  ];

  const getVal = (station) => {
    if (!station || !stationTemps[station.stationID]) return null;
    const data = stationTemps[station.stationID];
    switch(activeMode) {
        case 'pm25': return station.AQILast?.PM25?.value || 0;
        case 'heat': return Math.round(data.feelsLike);
        case 'temp': return Math.round(data.temp);
        case 'rain': return data.rainProb || 0;
        case 'humidity': return Math.round(data.humidity);
        case 'wind': return Math.round(data.windSpeed);
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

  // 🌟 ฟังก์ชันวาดเส้นและลงสี (ฉบับอัปเกรด)
  const styleGeoJSON = (feature) => {
    // 1. ดึงชื่อทั้งหมดที่มีในไฟล์แผนที่
    const props = Object.values(feature.properties || {}).map(v => String(v).trim());
    let thaiNameFromMap = "";

    // 2. ลองแปลจากอังกฤษเป็นไทยผ่าน Dictionary
    for (let p of props) {
        if (provMap[p]) {
            thaiNameFromMap = provMap[p];
            break;
        }
    }

    // 3. จับคู่กับข้อมูล Stations ของเรา
    const station = stations.find(s => {
        const cleanName = s.areaTH.replace('จังหวัด', '').trim();
        return cleanName === thaiNameFromMap || props.includes(cleanName) || props.some(p => p.includes(cleanName));
    });

    const val = getVal(station);
    const color = station ? getColor(val, activeMode) : (darkMode ? '#334155' : '#cbd5e1');

    return {
        fillColor: color,
        weight: 1.5, // ความหนาเส้นขอบ
        opacity: 1,
        color: '#ffffff', // 🌟 เส้นขอบ Polygon สีขาว
        fillOpacity: 0.8  // ความทึบสี
    };
  };

  // 🌟 สร้างไอคอนตัวเลขลอยตัวขนาดมินิมอล (สีเทาดำ ขอบขาวบางๆ)
  const createLabelIcon = (val) => {
    return L.divIcon({
        className: 'custom-text-icon',
        html: `<div style="color: #1e293b; font-weight: 900; font-size: ${isMobile ? '10px' : '12px'}; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff; text-align: center;">${val}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
  };

  const appBg = darkMode ? '#020617' : '#f8fafc'; 
  const cardBg = darkMode ? '#0f172a' : '#ffffff';
  const textColor = darkMode ? '#f8fafc' : '#0f172a'; 
  const subTextColor = darkMode ? '#94a3b8' : '#64748b'; 
  
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
      
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '15px', background: cardBg, borderRadius: '20px', marginBottom: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} className="hide-scrollbar">
        <style dangerouslySetInlineStyle={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
        {modes.map(m => (
           <button 
             key={m.id} 
             onClick={() => setActiveMode(m.id)} 
             style={{ 
                padding: '10px 20px', 
                borderRadius: '12px', 
                border: 'none', 
                background: activeMode === m.id ? '#0ea5e9' : (darkMode ? '#1e293b' : '#f1f5f9'), 
                color: activeMode === m.id ? '#fff' : textColor, 
                fontWeight: 'bold', 
                cursor: 'pointer', 
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                boxShadow: activeMode === m.id ? '0 4px 10px rgba(14, 165, 233, 0.3)' : 'none'
             }}
           >
              {m.name}
           </button>
        ))}
      </div>

      <div style={{ flex: 1, borderRadius: '25px', overflow: 'hidden', border: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', position: 'relative' }}>
        <MapContainer 
            center={[13.5, 100.5]} 
            zoom={isMobile ? 5 : 6} 
            style={{ height: '100%', width: '100%', background: darkMode ? '#020617' : '#f8fafc' }}
            zoomControl={false}
        >
            <TileLayer url={mapUrl} attribution='&copy; OpenStreetMap & CartoDB' />

            {geoData && <GeoJSON data={geoData} style={styleGeoJSON} />}

            {stations.map(st => {
                const val = getVal(st);
                // ตัดซ่อนตัวเลข 0 เฉพาะตอนโหมด % ฝนตก
                if (val === 0 && activeMode === 'rain') return null; 
                if (val === null) return null; // กันพังถ้าไม่มีข้อมูล

                return (
                    <Marker 
                        key={st.stationID} 
                        position={[st.lat, st.long]} 
                        icon={createLabelIcon(val)} 
                        interactive={false} // ทะลุได้ เลื่อนแมพได้ปกติ
                    />
                );
            })}
        </MapContainer>
      </div>
      
      {/* Spacer ดันขอบล่างสำหรับมือถือ */}
      <div style={{ height: isMobile ? '80px' : '20px', flexShrink: 0 }}></div>
    </div>
  );
}