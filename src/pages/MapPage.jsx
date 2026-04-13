import React, { useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { WeatherContext } from '../context/WeatherContext';
import { useRiskAnalysis } from '../hooks/useRiskAnalysis';
import { MapSidebar, MapControls, MapLegend } from '../components/Map/MapComponents';
import { RiskModal, BasicModal, ReferenceModal } from '../components/Map/MapModals';

const provMap = {
  "Bangkok Metropolis": "กรุงเทพมหานคร", "Bangkok": "กรุงเทพมหานคร", "Samut Prakan": "สมุทรปราการ", "Nonthaburi": "นนทบุรี", "Pathum Thani": "ปทุมธานี",
  "Phra Nakhon Si Ayutthaya": "พระนครศรีอยุธยา", "Ayutthaya": "พระนครศรีอยุธยา", "Ang Thong": "อ่างทอง", "Lop Buri": "ลพบุรี", "Sing Buri": "สิงห์บุรี", "Chai Nat": "ชัยนาท", 
  "Saraburi": "สระบุรี", "Chon Buri": "ชลบุรี", "Rayong": "ระยอง", "Chanthaburi": "จันทบุรี", "Trat": "ตราด", "Chachoengsao": "ฉะเชิงเทรา", "Prachin Buri": "ปราจีนบุรี", "Nakhon Nayok": "นครนายก", 
  "Sa Kaeo": "สระแก้ว", "Nakhon Ratchasima": "นครราชสีมา", "Buri Ram": "บุรีรัมย์", "Surin": "สุรินทร์", "Si Sa Ket": "ศรีสะเกษ", "Ubon Ratchathani": "อุบลราชธานี", "Yasothon": "ยโสธร", "Chaiyaphum": "ชัยภูมิ", 
  "Amnat Charoen": "อำนาจเจริญ", "Bueng Kan": "บึงกาฬ", "Nong Bua Lam Phu": "หนองบัวลำภู", "Khon Kaen": "ขอนแก่น", "Udon Thani": "อุดรธานี", "Loei": "เลย", "Nong Khai": "หนองคาย", 
  "Maha Sarakham": "มหาสารคาม", "Roi Et": "ร้อยเอ็ด", "Kalasin": "กาฬสินธุ์", "Sakon Nakhon": "สกลนคร", "Nakhon Phanom": "นครพนม", "Mukdahan": "มุกดาหาร", "Chiang Mai": "เชียงใหม่", "Lamphun": "ลำพูน", 
  "Lampang": "ลำปาง", "Uttaradit": "อุตรดิตถ์", "Phrae": "แพร่", "Nan": "น่าน", "Phayao": "พะเยา", "Chiang Rai": "เชียงราย", "Mae Hong Son": "แม่ฮ่องสอน", "Nakhon Sawan": "นครสวรรค์", 
  "Uthai Thani": "อุทัยธานี", "Kamphaeng Phet": "กำแพงเพชร", "Tak": "ตาก", "Sukhothai": "สุโขทัย", "Phitsanulok": "พิษณุโลก", "Phichit": "พิจิตร", "Phetchabun": "เพชรบูรณ์", "Ratchaburi": "ราชบุรี", 
  "Kanchanaburi": "กาญจนบุรี", "Suphan Buri": "สุพรรณบุรี", "Nakhon Pathom": "นครปฐม", "Samut Sakhon": "สมุทรสาคร", "Samut Songkhram": "สมุทรสงคราม", "Phetchaburi": "เพชรบุรี",
  "Prachuap Khiri Khan": "ประจวบคีรีขันธ์", "Nakhon Si Thammarat": "นครศรีธรรมราช", "Krabi": "กระบี่", "Phangnga": "พังงา", "Phang Nga": "พังงา", "Phuket": "ภูเก็ต", "Surat Thani": "สุราษฎร์ธานี", 
  "Ranong": "ระนอง", "Chumphon": "ชุมพร", "Songkhla": "สงขลา", "Satun": "สตูล", "Trang": "ตรัง", "Phatthalung": "พัทลุง", "Pattani": "ปัตตานี", "Yala": "ยะลา", "Narathiwat": "นราธิวาส"
};

function MapChangeView({ center }) {
  const map = useMap();
  useEffect(() => { 
      if (center && center.pos) {
          map.flyTo(center.pos, center.zoom, { animate: true, duration: 1.5 }); 
      }
  }, [center, map]);
  return null;
}

function MapZoomListener({ setMapZoom }) {
  useMapEvents({ zoomend: (e) => setMapZoom(e.target.getZoom()) });
  return null;
}

const getWindDirection = (degree) => {
    if (degree === undefined || degree === null) return { name: '-', arrow: '🌀' };
    const val = Math.floor((degree / 45) + 0.5);
    const arr = ["เหนือ", "ตะวันออกเฉียงเหนือ", "ตะวันออก", "ตะวันออกเฉียงใต้", "ใต้", "ตะวันตกเฉียงใต้", "ตะวันตก", "ตะวันตกเฉียงเหนือ"];
    const arrows = ["⬇️", "↙️", "⬅️", "↖️", "⬆️", "↗️", "➡️", "↘️"]; 
    return { name: arr[(val % 8)], arrow: arrows[(val % 8)] };
};

const getUvText = (uv) => {
    if (uv > 10) return 'อันตรายรุนแรง';
    if (uv > 7) return 'สูงมาก';
    if (uv > 5) return 'สูง';
    if (uv > 2) return 'ปานกลาง';
    return 'ต่ำ';
}

const basicModes = [
  { id: 'pm25', name: '😷 PM2.5', color: '#f97316', unit: 'µg/m³', desc: 'ความหนาแน่นของฝุ่นละอองขนาดเล็ก' },
  { id: 'temp', name: '🌡️ อุณหภูมิ', color: '#ef4444', unit: '°C', desc: 'อุณหภูมิอากาศปัจจุบัน' },
  { id: 'heat', name: '🥵 ดัชนีความร้อน', color: '#ea580c', unit: '°C', desc: 'อุณหภูมิที่ร่างกายรู้สึกจริง (รวมความชื้น)' },
  { id: 'rain', name: '☔ โอกาสฝน', color: '#3b82f6', unit: '%', desc: 'ความน่าจะเป็นในการเกิดฝนตก' },
  { id: 'wind', name: '🌬️ ลมกระโชก', color: '#0ea5e9', unit: 'km/h', desc: 'ความเร็วลมกระโชกสูงสุด' },
  { id: 'uv', name: '☀️ รังสี UV', color: '#a855f7', unit: 'Idx', desc: 'ดัชนีรังสีอัลตราไวโอเลต' }
];

const riskModes = [
  { id: 'respiratory', name: '🫁 สุขภาพและทางเดินหายใจ', color: '#ec4899', desc: 'คำนวณจาก: ฝุ่น PM2.5 (70%) และ ความร้อน (30%)' },
  { id: 'outdoor', name: '🏕️ กิจกรรมกลางแจ้ง', color: '#3b82f6', desc: 'คำนวณจาก: ฝน (40%), ลม (30%), และความร้อน/UV (30%)' },
  { id: 'wildfire', name: '🔥 ความเสี่ยงไฟป่า', color: '#ea580c', desc: 'คำนวณจาก: ลมแรง (45%), อากาศแห้ง (35%), และความร้อน (20%)' },
  { id: 'heatstroke', name: '🥵 เฝ้าระวังโรคลมแดด', color: '#ef4444', desc: 'คำนวณจาก: อุณหภูมิความร้อน (60%) และ รังสี UV (40%)' }
];

export default function MapPage() {
  const { stations, stationTemps, darkMode } = useContext(WeatherContext);
  
  const [geoData, setGeoData] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mapZoom, setMapZoom] = useState(window.innerWidth < 1024 ? 5 : 6);
  const [polyOpacity, setPolyOpacity] = useState(0.7);
  
  const [mapCategory, setMapCategory] = useState('basic'); 
  const [activeBasicMode, setActiveBasicMode] = useState('pm25'); 
  const [activeRiskMode, setActiveRiskMode] = useState('respiratory');
  
  const [selectedHotspot, setSelectedHotspot] = useState(null); 
  const [showReferenceModal, setShowReferenceModal] = useState(false); 
  
  const [basemapStyle, setBasemapStyle] = useState('dark'); 
  const [flyToPos, setFlyToPos] = useState(null);
  const [showControls, setShowControls] = useState(window.innerWidth >= 1024);

  const [flashProv, setFlashProv] = useState(null);
  const hasAutoLocated = useRef(false);

  const { getBasicVal, getBasicColor, calculateRisk, getRiskColor, getRiskLabel } = useRiskAnalysis(stationTemps, darkMode, activeRiskMode);

  const basemapUrls = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  };

  useEffect(() => { setBasemapStyle(darkMode ? 'dark' : 'light'); }, [darkMode]);

  useEffect(() => {
    const handleResize = () => { 
        setIsMobile(window.innerWidth < 1024); 
        if (window.innerWidth >= 1024) setShowControls(true); 
    };
    window.addEventListener('resize', handleResize);
    fetch('/thailand.json').then(res => res.json()).then(data => setGeoData(data)).catch(e => console.error(e));
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAutoLocate = () => {
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(p => {
            let closest = null; let minDistance = Infinity;
            stations.forEach(st => {
                const dist = Math.sqrt(Math.pow(st.lat - p.coords.latitude, 2) + Math.pow(st.long - p.coords.longitude, 2));
                if (dist < minDistance) { minDistance = dist; closest = st; }
            });
            if(closest) {
                setFlyToPos({ pos: [closest.lat, closest.long], zoom: 8 });
                setFlashProv(closest.areaTH.replace('จังหวัด', '').trim());
                setTimeout(() => setFlashProv(null), 3000);
            } else {
                setFlyToPos({ pos: [p.coords.latitude, p.coords.longitude], zoom: 8 });
            }
        });
    }
  };

  useEffect(() => {
    if (stations && stations.length > 0 && !hasAutoLocated.current) {
        hasAutoLocated.current = true; 
        if (isMobile) { 
            handleAutoLocate();
        }
    }
  }, [stations, isMobile]);

  useEffect(() => { setSelectedHotspot(null); }, [mapCategory]);

  const allMapData = useMemo(() => {
    return (stations || []).map(st => {
        let val, color;
        if (mapCategory === 'basic') {
            val = getBasicVal(st, activeBasicMode);
            color = getBasicColor(val, activeBasicMode);
        } else {
            const risk = calculateRisk(st);
            val = risk.score;
            color = getRiskColor(risk.score);
        }
        return { ...st, displayVal: val, color };
    }).filter(st => st.displayVal !== null && st.displayVal !== undefined);
  }, [stations, mapCategory, activeBasicMode, calculateRisk, getBasicVal, getBasicColor, getRiskColor]);

  const rankedSidebarData = useMemo(() => {
    return [...allMapData].sort((a, b) => b.displayVal - a.displayVal).slice(0, 15);
  }, [allMapData]);

  const hasHighRisk = useMemo(() => allMapData.some(d => d.displayVal >= 8), [allMapData]);

  const styleGeoJSON = (feature) => {
    const props = Object.values(feature.properties || {}).map(v => String(v).trim());
    let thaiNameFromMap = "";
    for (let p of props) if (provMap[p]) { thaiNameFromMap = provMap[p]; break; }
    
    const station = stations.find(s => {
        const cleanName = s.areaTH.replace('จังหวัด', '').trim();
        return cleanName === thaiNameFromMap || props.includes(cleanName);
    });

    let color = 'var(--border-color)';
    if (station) {
        if (mapCategory === 'basic') color = getBasicColor(getBasicVal(station, activeBasicMode), activeBasicMode);
        else color = getRiskColor(calculateRisk(station).score);
    }
    
    const cleanStationName = station ? station.areaTH.replace('จังหวัด', '').trim() : '';
    const isFlashed = cleanStationName !== '' && cleanStationName === flashProv;

    return { 
        fillColor: color, 
        weight: isFlashed ? 3 : 1,
        opacity: 1, 
        color: isFlashed ? '#0ea5e9' : (darkMode ? '#0f172a' : '#ffffff'),
        fillOpacity: polyOpacity,
        className: isFlashed ? 'arcgis-flash-polygon' : '' 
    };
  };

  const handleRegionClick = (station) => {
      if (mapCategory === 'risk') {
          const risk = calculateRisk(station);
          setSelectedHotspot({ type: 'risk', station, riskScore: risk.score, factors: risk.factors, color: getRiskColor(risk.score) });
      } else {
          const data = stationTemps[station.stationID] || {};
          const pm25 = station.AQILast?.PM25?.value || 0;
          setSelectedHotspot({ type: 'basic', station, data, pm25 });
      }
      
      setFlyToPos({ pos: [station.lat, station.long], zoom: 8 });
      const cleanName = station.areaTH.replace('จังหวัด', '').trim();
      setFlashProv(cleanName);
      setTimeout(() => setFlashProv(null), 3000);
  };

  const onEachFeature = (feature, layer) => {
    layer.on({
        click: () => {
            const props = Object.values(feature.properties || {}).map(v => String(v).trim());
            let thaiNameFromMap = "";
            for (let p of props) if (provMap[p]) { thaiNameFromMap = provMap[p]; break; }
            const station = stations.find(s => s.areaTH.replace('จังหวัด', '').trim() === thaiNameFromMap);
            if (station) handleRegionClick(station);
        }
    });
  };

  const createMapIcon = (stationName, val, color) => {
    return L.divIcon({
        className: 'custom-risk-icon',
        html: `<div class="flex flex-col items-center leading-tight shadow-md rounded-lg border-2 border-white px-2 py-1" style="background: ${color}; color: ${color === '#eab308' || color === '#cbd5e1' ? '#0f172a' : '#fff'}; font-weight: 900; font-size: ${isMobile ? '9px' : '11px'};">
                 <span class="text-[0.7em] opacity-90">${stationName}</span>
                 <span>${val}</span>
               </div>`,
        iconSize: isMobile ? [50, 30] : [60, 40], 
        iconAnchor: isMobile ? [25, 15] : [30, 20]
    });
  };

  const activeModeObj = mapCategory === 'basic' ? basicModes.find(m => m.id === activeBasicMode) : riskModes.find(m => m.id === activeRiskMode);

  const getDynamicLegendContent = () => {
    if (mapCategory === 'risk') {
        return [
            { c: '#ef4444', l: 'วิกฤต/อันตราย', r: '8-10' },
            { c: '#f97316', l: 'ควรเฝ้าระวัง', r: '6-7.9' },
            { c: '#eab308', l: 'ปานกลาง', r: '4-5.9' },
            { c: '#22c55e', l: 'สถานการณ์ปกติ', r: '0-3.9' }
        ];
    }
    switch (activeBasicMode) {
        case 'pm25': return [{ c: '#ef4444', l: 'มีผลกระทบฯ', r: '> 75' }, { c: '#f97316', l: 'เริ่มมีผลกระทบฯ', r: '38-75' }, { c: '#eab308', l: 'ปานกลาง', r: '26-37' }, { c: '#22c55e', l: 'ดี', r: '16-25' }, { c: '#0ea5e9', l: 'ดีมาก', r: '0-15' }];
        case 'temp':
        case 'heat': return [{ c: '#ef4444', l: 'ร้อนจัด', r: '> 39' }, { c: '#f97316', l: 'ร้อน', r: '35-39' }, { c: '#eab308', l: 'อบอ้าว', r: '29-34' }, { c: '#22c55e', l: 'ปกติ/อบอุ่น', r: '23-28' }, { c: '#3b82f6', l: 'เย็นสบาย', r: '< 23' }];
        case 'rain': return [{ c: '#1e3a8a', l: 'ตกหนัก/พายุ', r: '> 70%' }, { c: '#3b82f6', l: 'โอกาสตกสูง', r: '41-70%' }, { c: '#60a5fa', l: 'โอกาสตกต่ำ', r: '11-40%' }, { c: '#94a3b8', l: 'ไม่มีฝน', r: '0-10%' }];
        case 'wind': return [{ c: '#ef4444', l: 'พายุ/อันตราย', r: '> 40' }, { c: '#f97316', l: 'ลมแรง', r: '21-40' }, { c: '#eab308', l: 'ลมกำลังดี', r: '11-20' }, { c: '#22c55e', l: 'ลมสงบ', r: '0-10' }];
        case 'uv': return [{ c: '#a855f7', l: 'อันตรายรุนแรง', r: '> 10' }, { c: '#ef4444', l: 'สูงมาก', r: '8-10' }, { c: '#ea580c', l: 'สูง', r: '6-7' }, { c: '#eab308', l: 'ปานกลาง', r: '3-5' }, { c: '#22c55e', l: 'ต่ำ', r: '0-2' }];
        default: return [];
    }
  };

  if (!geoData || Object.keys(stationTemps).length === 0) return (
    <div className="loading-container bg-[var(--bg-app)] text-[var(--text-main)]">
        <div className="loading-spinner w-20 h-20 relative mb-6"></div>
        <div className="text-xl font-black mt-4 bg-gradient-to-r from-sky-500 via-purple-500 to-pink-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradientText_3s_linear_infinite]">กำลังเตรียมแผนที่เฝ้าระวังภัย...</div>
        <div className="text-sm text-[var(--text-sub)] mt-2 opacity-80">ประมวลผลข้อมูลทั้ง 77 จังหวัด</div>
    </div>
  );

  return (
    <div className="h-full w-full bg-[var(--bg-app)] flex flex-col font-[Sarabun,sans-serif] p-3 md:p-5 box-border">
      
      <style dangerouslySetInlineStyle={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${darkMode ? '#334155' : '#cbd5e1'}; border-radius: 10px; }
        
        @keyframes arcgis-flash {
            0% { stroke: #38bdf8; stroke-width: 2px; }
            25% { stroke: #0ea5e9; stroke-width: 5px; fill-opacity: 0.9; }
            50% { stroke: #38bdf8; stroke-width: 2px; }
            75% { stroke: #0ea5e9; stroke-width: 5px; fill-opacity: 0.9; }
            100% { stroke: #38bdf8; stroke-width: 2px; }
        }
        .arcgis-flash-polygon {
            animation: arcgis-flash 2.5s ease-in-out forwards;
        }
      `}} />

      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mb-4 shrink-0">
          {isMobile ? (
              <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between items-center bg-[var(--bg-card)] p-3 rounded-2xl shadow-sm border border-[var(--border-color)]">
                      <h2 className="m-0 text-[var(--text-main)] text-lg flex items-center gap-2 font-bold">🗺️ แผนที่สภาพอากาศ</h2>
                      {mapCategory === 'risk' && (
                          <button onClick={() => setShowReferenceModal(true)} className="bg-[var(--bg-secondary)] text-purple-500 border border-purple-500/50 px-3 py-1 rounded-full text-xs font-bold font-[Sarabun] flex items-center gap-1">
                              📚 อ้างอิง
                          </button>
                      )}
                  </div>
                  <div className="flex bg-[var(--bg-card)] rounded-full border border-[var(--border-color)] p-1">
                      <button onClick={() => setMapCategory('basic')} className={`flex-1 border-none py-1.5 px-3 rounded-full text-xs font-bold transition-colors ${mapCategory === 'basic' ? 'bg-sky-500 text-white' : 'bg-transparent text-[var(--text-sub)]'}`}>📊 ข้อมูลทั่วไป</button>
                      <button onClick={() => setMapCategory('risk')} className={`flex-1 border-none py-1.5 px-3 rounded-full text-xs font-bold transition-colors ${mapCategory === 'risk' ? 'bg-purple-500 text-white' : 'bg-transparent text-[var(--text-sub)]'}`}>🧠 วิเคราะห์ความเสี่ยง</button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {mapCategory === 'basic' ? basicModes.map(m => (
                        <button key={m.id} onClick={() => setActiveBasicMode(m.id)} className={`shrink-0 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all`} style={{ borderColor: activeBasicMode === m.id ? m.color : 'var(--border-color)', backgroundColor: activeBasicMode === m.id ? (darkMode ? `${m.color}20` : `${m.color}15`) : 'var(--bg-card)', color: activeBasicMode === m.id ? m.color : 'var(--text-main)' }}>{m.name}</button>
                    )) : riskModes.map(m => (
                        <button key={m.id} onClick={() => setActiveRiskMode(m.id)} className={`shrink-0 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all`} style={{ borderColor: activeRiskMode === m.id ? m.color : 'var(--border-color)', backgroundColor: activeRiskMode === m.id ? (darkMode ? `${m.color}20` : `${m.color}15`) : 'var(--bg-card)', color: activeRiskMode === m.id ? m.color : 'var(--text-main)' }}>{m.name}</button>
                    ))}
                  </div>
              </div>
          ) : (
              <div className="flex flex-col gap-4 w-full bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border-color)] shadow-sm">
                  <div className="flex justify-between items-center">
                      <div className="flex items-center gap-5">
                          <h2 className="m-0 text-[var(--text-main)] text-2xl flex items-center gap-2 font-bold">🗺️ แผนที่สภาพอากาศ</h2>
                          <div className="flex bg-[var(--bg-secondary)] rounded-full border border-[var(--border-color)] p-1">
                              <button onClick={() => setMapCategory('basic')} className={`border-none py-1.5 px-5 rounded-full text-sm font-bold transition-colors cursor-pointer ${mapCategory === 'basic' ? 'bg-sky-500 text-white' : 'bg-transparent text-[var(--text-sub)]'}`}>📊 ข้อมูลทั่วไป</button>
                              <button onClick={() => setMapCategory('risk')} className={`border-none py-1.5 px-5 rounded-full text-sm font-bold transition-colors cursor-pointer ${mapCategory === 'risk' ? 'bg-purple-500 text-white' : 'bg-transparent text-[var(--text-sub)]'}`}>🧠 วิเคราะห์ความเสี่ยง</button>
                          </div>
                      </div>
                      {mapCategory === 'risk' && (
                          <button onClick={() => setShowReferenceModal(true)} className="bg-[var(--bg-secondary)] text-purple-500 border border-purple-500/50 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all hover:bg-purple-500/10 cursor-pointer">
                              📚 แหล่งอ้างอิงทางวิชาการ
                          </button>
                      )}
                  </div>
                  <div className="flex gap-2.5 flex-wrap">
                    {mapCategory === 'basic' ? basicModes.map(m => (
                        <button key={m.id} onClick={() => setActiveBasicMode(m.id)} className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all cursor-pointer`} style={{ borderColor: activeBasicMode === m.id ? m.color : 'var(--border-color)', backgroundColor: activeBasicMode === m.id ? (darkMode ? `${m.color}20` : `${m.color}15`) : 'var(--bg-secondary)', color: activeBasicMode === m.id ? m.color : 'var(--text-main)' }}>{m.name}</button>
                    )) : riskModes.map(m => (
                        <button key={m.id} onClick={() => setActiveRiskMode(m.id)} className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all cursor-pointer`} style={{ borderColor: activeRiskMode === m.id ? m.color : 'var(--border-color)', backgroundColor: activeRiskMode === m.id ? (darkMode ? `${m.color}20` : `${m.color}15`) : 'var(--bg-secondary)', color: activeRiskMode === m.id ? m.color : 'var(--text-main)' }}>{m.name}</button>
                    ))}
                  </div>
              </div>
          )}
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-4 overflow-hidden outline-none">
          
          <div className="flex-1 flex flex-col gap-4 relative">
              <div className="flex-1 rounded-2xl md:rounded-3xl overflow-hidden border border-[var(--border-color)] relative min-h-[400px] md:min-h-auto bg-[var(--bg-card)] shadow-inner">
                
                <MapContainer center={[13.5, 100.5]} zoom={isMobile ? 5 : 6} className="h-full w-full bg-[var(--bg-app)]" zoomControl={false}>
                    <TileLayer url={basemapUrls[basemapStyle]} />
                    <MapZoomListener setMapZoom={setMapZoom} />
                    <MapChangeView center={flyToPos} />
                    
                    {geoData && <GeoJSON key={`${mapCategory}-${activeRiskMode}-${activeBasicMode}-${polyOpacity}-${basemapStyle}-${flashProv}`} data={geoData} style={styleGeoJSON} onEachFeature={onEachFeature} />}
                    
                    {allMapData.map(st => {
                        let isVisible = false;

                        if (mapZoom >= 8) { 
                            isVisible = true; 
                        } else if (mapZoom >= 6) {
                            if (mapCategory === 'risk') {
                                isVisible = st.displayVal >= 4; 
                            } else {
                                isVisible = rankedSidebarData.some(r => r.stationID === st.stationID);
                            }
                        } else {
                            if (mapCategory === 'risk') {
                                isVisible = st.displayVal >= 6; 
                                if (!hasHighRisk) {
                                    isVisible = rankedSidebarData.slice(0, 3).some(r => r.stationID === st.stationID);
                                }
                            } else {
                                isVisible = rankedSidebarData.slice(0, 5).some(r => r.stationID === st.stationID);
                            }
                        }

                        if (!isVisible) return null;
                        return <Marker key={st.stationID} position={[st.lat, st.long]} icon={createMapIcon(st.areaTH.replace('จังหวัด',''), st.displayVal, st.color)} interactive={false} />;
                    })}
                </MapContainer>

                <MapLegend mapCategory={mapCategory} activeModeObj={activeModeObj} getDynamicLegendContent={getDynamicLegendContent} />
                <MapControls isMobile={isMobile} showControls={showControls} setShowControls={setShowControls} handleAutoLocate={handleAutoLocate} basemapStyle={basemapStyle} setBasemapStyle={setBasemapStyle} polyOpacity={polyOpacity} setPolyOpacity={setPolyOpacity} activeModeObj={activeModeObj} />
              </div>
          </div>

          <MapSidebar isMobile={isMobile} rankedSidebarData={rankedSidebarData} mapCategory={mapCategory} activeModeObj={activeModeObj} getRiskLabel={getRiskLabel} handleRegionClick={handleRegionClick} />
      </div>

      {selectedHotspot && selectedHotspot.type === 'risk' && (
          <RiskModal selectedHotspot={selectedHotspot} setSelectedHotspot={setSelectedHotspot} isMobile={isMobile} activeModeObj={activeModeObj} getRiskLabel={getRiskLabel} />
      )}

      {selectedHotspot && selectedHotspot.type === 'basic' && (
          <BasicModal selectedHotspot={selectedHotspot} setSelectedHotspot={setSelectedHotspot} isMobile={isMobile} getBasicColor={getBasicColor} getWindDirection={getWindDirection} getUvText={getUvText} />
      )}

      <ReferenceModal showReferenceModal={showReferenceModal} setShowReferenceModal={setShowReferenceModal} />

    </div>
  );
}