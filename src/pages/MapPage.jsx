// src/pages/MapPage.jsx
import React, { useContext, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { WeatherContext } from '../context/WeatherContext';
import { getPM25Color } from '../utils/helpers';
import 'leaflet/dist/leaflet.css';

const getHeatColor = (val) => { if(val==null)return'#94a3b8'; if(val>=41)return'#ef4444'; if(val>=32)return'#f97316'; if(val>=27)return'#eab308'; return'#22c55e'; };
const getTempColor = (val) => { if(val==null)return'#94a3b8'; if(val>=35)return'#ef4444'; if(val>=30)return'#f97316'; if(val>=25)return'#eab308'; if(val>=20)return'#22c55e'; return'#3b82f6'; };
const getRainColor = (val) => { if(val==null)return'#94a3b8'; if(val>=80)return'#1e3a8a'; if(val>=20)return'#3b82f6'; if(val>0)return'#93c5fd'; return'#e0f2fe'; };
const getHumidityColor = (val) => { if(val==null)return'#94a3b8'; if(val>=80)return'#064e3b'; if(val>=60)return'#059669'; if(val>=40)return'#34d399'; return'#a7f3d0'; };
const getWindColor = (val) => { if(val==null)return'#94a3b8'; if(val>=30)return'#831843'; if(val>=15)return'#db2777'; if(val>=5)return'#f472b6'; return'#fbcfe8'; };

const getColorByMode = (mode, val) => {
  if (mode === 'pm25') return getPM25Color(val);
  if (mode === 'heat') return getHeatColor(val);
  if (mode === 'temp') return getTempColor(val);
  if (mode === 'rain') return getRainColor(val);
  if (mode === 'humidity') return getHumidityColor(val);
  if (mode === 'wind') return getWindColor(val);
  return '#94a3b8';
};

function LocationMarker({ onMapClick }) {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

export default function MapPage() {
  const { stations, stationTemps, darkMode, fetchWeatherByCoords, weatherData } = useContext(WeatherContext);
  
  const [activeMode, setActiveMode] = useState('pm25');
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [clickPos, setClickPos] = useState(null);

  const modes = [
    { id: 'pm25', label: 'ฝุ่น PM2.5', icon: '😷', color: '#0ea5e9', unit: 'µg/m³', type: 'leaflet' },
    { id: 'heat', label: 'ดัชนีความร้อน', icon: '🥵', color: '#f97316', unit: '°C', type: 'leaflet' },
    { id: 'temp', label: 'อุณหภูมิ', icon: '🌡️', color: '#eab308', unit: '°C', type: 'leaflet' },
    { id: 'rain', label: 'ปริมาณฝน', icon: '☔', color: '#3b82f6', unit: 'mm', type: 'leaflet' }, // เปลี่ยนจากโอกาสฝน เป็นปริมาณฝน mm เพื่อความสมจริง
    { id: 'humidity', label: 'ความชื้น', icon: '💧', color: '#10b981', unit: '%', type: 'leaflet' },
    { id: 'wind', label: 'ความเร็วลม', icon: '🌬️', color: '#db2777', unit: 'km/h', type: 'leaflet' },
    { id: 'radar', label: 'เรดาร์สภาพอากาศ', icon: '⛈️', color: '#8b5cf6', type: 'windy', layer: 'rain' }
  ];

  const currentModeObj = modes.find(m => m.id === activeMode);
  const isWindy = currentModeObj.type === 'windy';

  const handleMapClick = (lat, lon) => {
    if (isWindy) return; 
    setClickPos({ lat, lon });
    fetchWeatherByCoords(lat, lon); 
  };

  const rankingData = useMemo(() => {
    if (isWindy || stations.length === 0) return [];
    return stations.map(st => {
      const tObj = stationTemps[st.stationID] || {};
      let val = activeMode === 'pm25' ? Number(st.AQILast?.PM25?.value) : (activeMode === 'heat' ? tObj.feelsLike : (activeMode === 'temp' ? tObj.temp : (activeMode === 'rain' ? tObj.rainProb : (activeMode === 'humidity' ? tObj.humidity : tObj.windSpeed))));
      return { name: st.areaTH, value: activeMode === 'rain' ? val.toFixed(1) : Math.round(val) };
    }).sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
  }, [activeMode, stations, stationTemps, isWindy]);

  const mapBg = darkMode ? '#0f172a' : '#f8fafc';
  const cardBg = darkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)';
  const textColor = darkMode ? '#f8fafc' : '#0f172a';
  const borderColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', background: mapBg, overflow: 'hidden', fontFamily: 'Kanit' }}>
      
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: isWindy ? -1 : 1, opacity: isWindy ? 0 : 1 }}>
        <MapContainer center={[13.75, 100.5]} zoom={6} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url={darkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} />
          
          <LocationMarker onMapClick={handleMapClick} />

          {!isWindy && stations.map(st => {
            const lat = parseFloat(st.lat); const lon = parseFloat(st.long);
            const tObj = stationTemps[st.stationID] || {};
            const pmVal = Number(st.AQILast?.PM25?.value);
            
            let valToShow = '-'; let circleColor = '#94a3b8';
            if (activeMode === 'pm25') { valToShow = pmVal; circleColor = getPM25Color(pmVal); }
            else if (activeMode === 'heat') { valToShow = Math.round(tObj.feelsLike); circleColor = getHeatColor(tObj.feelsLike); }
            else if (activeMode === 'temp') { valToShow = Math.round(tObj.temp); circleColor = getTempColor(tObj.temp); }
            else if (activeMode === 'rain') { valToShow = tObj.rainProb.toFixed(1); circleColor = getRainColor(tObj.rainProb); }
            else if (activeMode === 'humidity') { valToShow = Math.round(tObj.humidity); circleColor = getHumidityColor(tObj.humidity); }
            else if (activeMode === 'wind') { valToShow = Math.round(tObj.windSpeed); circleColor = getWindColor(tObj.windSpeed); }

            const htmlContent = `<div style="background-color: ${circleColor}; color: #fff; width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 11px; border: 2px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${valToShow}</div>`;
            const icon = L.divIcon({ html: htmlContent, className: 'custom-div-icon', iconSize: [32, 32], iconAnchor: [16, 16] });

            return (
              <Marker key={st.stationID} position={[lat, lon]} icon={icon}>
                <Tooltip direction="top"><b>{st.areaTH}</b><br/>{valToShow} {currentModeObj.unit}</Tooltip>
              </Marker>
            );
          })}

          {clickPos && weatherData && (
            <Marker position={[clickPos.lat, clickPos.lon]}>
              <Popup closeButton={true} autoPan={true}>
                <div style={{ padding: '10px', fontFamily: 'Kanit', minWidth: '150px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#0ea5e9' }}>📍 ผลวิเคราะห์พิกัดที่เลือก</h4>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>🌡️ อุณหภูมิ: {Math.round(weatherData.current.temp)}°C</div>
                  <div style={{ fontSize: '0.9rem' }}>😷 ดัชนีฝุ่น PM2.5: <b>{weatherData.current.pm25}</b></div>
                  <div style={{ fontSize: '0.9rem' }}>☔ ปริมาณฝน: <b>{weatherData.current.rain} mm</b></div>
                  <hr style={{ margin: '10px 0', opacity: 0.2 }} />
                  <div style={{ fontSize: '0.7rem', color: '#666' }}>GPS: {clickPos.lat.toFixed(4)}, {clickPos.lon.toFixed(4)}</div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {isWindy && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2 }}>
          <iframe width="100%" height="100%" src={`https://embed.windy.com/embed2.html?lat=13.75&lon=100.5&zoom=6&level=surface&overlay=${currentModeObj.layer}&product=ecmwf&menu=&message=true`} frameBorder="0"></iframe>
        </div>
      )}

      <div style={{ position: 'absolute', top: 20, left: 20, right: 20, zIndex: 1000, display: 'flex', gap: '15px', overflowX: 'auto' }} className="hide-scrollbar">
        <div style={{ display: 'flex', alignItems: 'center', background: cardBg, borderRadius: '50px', padding: '6px 8px', border: `1px solid ${borderColor}` }}>
          <span style={{ fontSize: '1rem', fontWeight: 'bold', color: textColor, margin: '0 15px' }}>🇹🇭 ครอบคลุมฐานข้อมูล 77 จังหวัด</span>
          {modes.map(mode => (
            <button key={mode.id} onClick={() => setActiveMode(mode.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: '50px', border: 'none', background: activeMode === mode.id ? mode.color : 'transparent', color: activeMode === mode.id ? '#fff' : textColor, fontWeight: 'bold', cursor: 'pointer', marginRight: '4px' }}>
              <span>{mode.icon}</span>{mode.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', top: 80, right: 20, zIndex: 1000 }}>
        {!isWindy && (
          <button onClick={() => setIsRankingOpen(!isRankingOpen)} style={{ background: isRankingOpen ? '#8b5cf6' : cardBg, color: isRankingOpen ? '#fff' : textColor, border: `1px solid ${borderColor}`, padding: '10px 15px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <span style={{ fontSize: '1.2rem' }}>📊</span> {isRankingOpen ? 'ปิดหน้าต่างรายงาน' : 'เปิดรายงานข้อมูลสถิติ'}
          </button>
        )}
      </div>

      <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '380px', zIndex: 9998, background: cardBg, borderLeft: `1px solid ${borderColor}`, transform: isRankingOpen && !isWindy ? 'translateX(0)' : 'translateX(105%)', transition: 'transform 0.4s', display: 'flex', flexDirection: 'column', paddingTop: '100px' }}>
        <div style={{ padding: '0 25px 15px', borderBottom: `1px solid ${borderColor}` }}>
          <h3 style={{ margin: 0, color: textColor }}>🏆 ข้อมูลการจัดอันดับ ({currentModeObj.label})</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>รายงานสถิติเรียลไทม์ 77 จังหวัด</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px 20px' }}>
          {rankingData.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: darkMode?'rgba(0,0,0,0.3)':'#f1f5f9', padding: '12px 15px', borderRadius: '16px', marginBottom: '10px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#64748b' }}>{idx + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: textColor }}>{item.name}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: getColorByMode(activeMode, parseFloat(item.value)) }}>{item.value} <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{currentModeObj.unit}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}