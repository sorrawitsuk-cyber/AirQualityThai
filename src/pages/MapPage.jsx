import React, { useContext, useState, useEffect, useRef } from 'react';
import { WeatherContext } from '../context/WeatherContext';
import { useWeatherData } from '../hooks/useWeatherData';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Component to change map view programmatically
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

export default function MapPage() {
  const { darkMode, stations, stationTemps } = useContext(WeatherContext);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { weatherData, fetchWeatherByCoords } = useWeatherData();
  const [activeLayer, setActiveLayer] = useState('rain');
  const [timelineIndex, setTimelineIndex] = useState(24); // 0 to 24 (current)
  const [isPlaying, setIsPlaying] = useState(false);
  const playInterval = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!weatherData) fetchWeatherByCoords(13.75, 100.5);
  }, [fetchWeatherByCoords, weatherData]);

  // Timeline Player Logic
  useEffect(() => {
    if (isPlaying) {
      playInterval.current = setInterval(() => {
        setTimelineIndex(prev => {
          if (prev >= 24) return 0;
          return prev + 1;
        });
      }, 500);
    } else {
      clearInterval(playInterval.current);
    }
    return () => clearInterval(playInterval.current);
  }, [isPlaying]);

  const { current, hourly } = weatherData || {};

  const panelBg = darkMode ? 'rgba(15, 30, 54, 0.85)' : 'rgba(255, 255, 255, 0.85)';
  const panelBorder = 'var(--border-color)';
  const textColor = 'var(--text-main)';
  const subTextColor = 'var(--text-sub)';
  
  // Default map center (Thailand)
  const mapCenter = [13.75, 100.5];

  const floatingPanelStyle = {
    position: 'absolute',
    zIndex: 1000, // Above leaflet
    background: panelBg,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '24px',
    boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.1)',
    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)'}`,
    color: textColor
  };

  const layers = [
    { id: 'rain', icon: '🌧️', title: 'ฝนสะสม', subtitle: 'มม./ชั่วโมง', color: '#3b82f6' },
    { id: 'pm25', icon: '🌫️', title: 'PM2.5', subtitle: 'µg/m³', color: '#f59e0b' },
    { id: 'temp', icon: '🌡️', title: 'อุณหภูมิ', subtitle: '°C', color: '#ef4444' },
    { id: 'heat', icon: '🥵', title: 'ความรู้สึกร้อน', subtitle: '°C', color: '#f97316' },
    { id: 'wind', icon: '💨', title: 'ลม', subtitle: 'km/h', color: '#10b981' },
    { id: 'humidity', icon: '💧', title: 'ความชื้น', subtitle: '%', color: '#8b5cf6' },
  ];

  const LayerItem = ({ item }) => {
    const active = activeLayer === item.id;
    return (
      <div onClick={() => setActiveLayer(item.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: active ? (darkMode ? '#1e3a8a' : '#eff6ff') : 'transparent', borderRadius: '12px', cursor: 'pointer', border: active ? `1px solid ${darkMode ? '#3b82f6' : '#bfdbfe'}` : '1px solid transparent', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '1.2rem', width: '24px', textAlign: 'center', filter: active ? 'none' : 'grayscale(100%)', opacity: active ? 1 : 0.6 }}>{item.icon}</div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: active ? 'bold' : '600', color: active ? item.color : textColor }}>{item.title}</div>
            <div style={{ fontSize: '0.65rem', color: subTextColor }}>{item.subtitle}</div>
          </div>
        </div>
        {active && <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.6rem' }}>✓</div>}
      </div>
    );
  };

  // Helper to determine color based on layer and value
  const getColor = (layerId, value) => {
    if (layerId === 'rain') {
      if (value > 50) return '#7f1d1d';
      if (value > 20) return '#ef4444';
      if (value > 10) return '#f59e0b';
      if (value > 2) return '#3b82f6';
      if (value > 0.1) return '#93c5fd';
      return 'transparent';
    }
    if (layerId === 'temp') {
      if (value > 40) return '#7f1d1d';
      if (value > 35) return '#ef4444';
      if (value > 30) return '#f97316';
      if (value > 25) return '#f59e0b';
      return '#3b82f6';
    }
    if (layerId === 'pm25') {
      if (value > 150) return '#991b1b';
      if (value > 100) return '#ef4444';
      if (value > 50) return '#f97316';
      if (value > 37.5) return '#f59e0b';
      if (value > 15) return '#eab308';
      return '#22c55e';
    }
    return '#3b82f6';
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', fontFamily: 'Sarabun, sans-serif' }}>
      
      {/* 🗺️ REAL BACKGROUND MAP */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
         <MapContainer center={mapCenter} zoom={6} zoomControl={false} style={{ width: '100%', height: '100%', background: darkMode ? '#0f172a' : '#bfe8ff' }}>
            <TileLayer
               url={darkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
               attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            {/* Render Station Data Points */}
            {(stations && stations.length > 0) ? stations.map((station, i) => {
              const lat = parseFloat(station.lat);
              const lon = parseFloat(station.long);
              if (isNaN(lat) || isNaN(lon) || lat === 0) return null;

              // Use real values from WeatherContext
              const tObj = stationTemps ? stationTemps[station.stationID] : null;
              
              let val = 0;
              if (activeLayer === 'temp') val = tObj?.temp || 0;
              if (activeLayer === 'heat') val = tObj?.feelsLike || 0;
              if (activeLayer === 'rain') val = (tObj?.rainProb || 0) / 2; // Simulate rain amount roughly based on probability if real rainfall isn't available
              if (activeLayer === 'pm25') val = Number(station.AQILast?.PM25?.value) || 0;
              if (activeLayer === 'wind') val = tObj?.windSpeed || 0;
              if (activeLayer === 'humidity') val = tObj?.humidity || 0;

              // Skip rendering if value is completely 0 and it's PM25 or Temp, to avoid clutter
              if (val === 0 && (activeLayer === 'pm25' || activeLayer === 'temp')) return null;

              const color = getColor(activeLayer, val);
              if (color === 'transparent') return null;

              return (
                <CircleMarker
                  key={station.stationID || i}
                  center={[lat, lon]}
                  radius={8}
                  fillColor={color}
                  fillOpacity={0.8}
                  color="#fff"
                  weight={1}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                    <div style={{ fontFamily: 'Sarabun', fontWeight: 'bold' }}>
                      {station.nameTH || station.name}<br/>
                      <span style={{ color }}>
                        {Math.round(val)}{' '}
                        {activeLayer === 'temp' ? '°C' : 
                         activeLayer === 'heat' ? '°C' :
                         activeLayer === 'rain' ? 'มม.' : 
                         activeLayer === 'wind' ? 'km/h' :
                         activeLayer === 'humidity' ? '%' :
                         'µg/m³'}
                      </span>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            }) : null}
         </MapContainer>
      </div>

      {/* 🟢 TOP DATE INDICATOR */}
      <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: panelBg, backdropFilter: 'blur(8px)', padding: '8px 20px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', color: textColor, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
         16 พ.ค. 2567 <span style={{ color: '#3b82f6' }}>{new Date().toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})}</span> ▾
      </div>

      {/* 🟢 LEFT PANEL: LAYERS */}
      {!isMobile && (
        <div style={{ ...floatingPanelStyle, top: '24px', left: '24px', width: '300px', maxHeight: 'calc(100% - 140px)', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '20px', borderBottom: `1px solid ${panelBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>ชั้นข้อมูลแผนที่ <span style={{fontSize:'0.8rem', opacity:0.5}}>ⓘ</span></h3>
             <span style={{ fontSize: '0.8rem', cursor: 'pointer' }}>^</span>
          </div>

          <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }} className="hide-scrollbar">
             {layers.map(layer => <LayerItem key={layer.id} item={layer} />)}
             
             <div style={{ marginTop: '20px', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>สถานีตรวจวัด</div>
             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', marginBottom: '10px', cursor: 'pointer' }}>
               <input type="checkbox" defaultChecked /> แสดงสถานีตรวจวัด
             </label>
             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
               <input type="checkbox" defaultChecked /> แสดงชื่อจังหวัด
             </label>
          </div>
        </div>
      )}

      {/* 🟢 BOTTOM LEFT: TIMELINE */}
      {!isMobile && (
        <div style={{ ...floatingPanelStyle, bottom: '24px', left: '24px', right: '400px', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#3b82f6' }}>› {layers.find(l => l.id === activeLayer)?.title} ย้อนหลัง 24 ชั่วโมง</div>
              <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setTimelineIndex(24)}>ปัจจุบัน</div>
           </div>

           <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button onClick={() => setIsPlaying(!isPlaying)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: isPlaying ? '#ef4444' : '#fff', color: isPlaying ? '#fff' : '#000', border: `1px solid ${panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              
              <div style={{ flex: 1, position: 'relative', height: '30px', display: 'flex', alignItems: 'center' }}>
                 <div style={{ width: '100%', height: '4px', background: darkMode ? '#334155' : '#cbd5e1', borderRadius: '2px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(timelineIndex/24)*100}%`, background: '#3b82f6', borderRadius: '2px', transition: 'width 0.3s' }}></div>
                 </div>
                 
                 {/* Thumb */}
                 <div style={{ position: 'absolute', left: `calc(${(timelineIndex/24)*100}% - 8px)`, width: '16px', height: '16px', background: '#3b82f6', borderRadius: '50%', boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)', top: '50%', transform: 'translateY(-50%)', cursor: 'grab', transition: 'left 0.3s' }}></div>
              </div>
           </div>

           {/* Color Legend dynamically changing based on layer */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>ระดับความรุนแรง</div>
              {activeLayer === 'rain' && (
                <>
                  <div style={{ width: '100%', height: '12px', borderRadius: '6px', background: 'linear-gradient(to right, #e0f2fe, #38bdf8, #0284c7, #1e3a8a, #ef4444, #7f1d1d)' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: subTextColor, marginTop: '2px' }}>
                     <span>0</span><span>0.1</span><span>5</span><span>20</span><span>50</span><span>100+</span>
                  </div>
                </>
              )}
              {activeLayer === 'pm25' && (
                <>
                  <div style={{ width: '100%', height: '12px', borderRadius: '6px', background: 'linear-gradient(to right, #22c55e, #eab308, #f59e0b, #f97316, #ef4444, #991b1b)' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: subTextColor, marginTop: '2px' }}>
                     <span>0</span><span>15</span><span>37.5</span><span>50</span><span>100</span><span>150+</span>
                  </div>
                </>
              )}
              {activeLayer === 'temp' && (
                <>
                  <div style={{ width: '100%', height: '12px', borderRadius: '6px', background: 'linear-gradient(to right, #3b82f6, #f59e0b, #f97316, #ef4444, #7f1d1d)' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: subTextColor, marginTop: '2px' }}>
                     <span>&lt;25</span><span>30</span><span>35</span><span>40</span><span>40+</span>
                  </div>
                </>
              )}
           </div>
        </div>
      )}

      {/* 🟢 RIGHT PANEL: LOCATION INFO */}
      {!isMobile && (
        <div style={{ position: 'absolute', top: '24px', right: '80px', width: '340px', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 1000 }}>
           
           {/* Top Toggles */}
           <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <div style={{ display: 'flex', background: panelBg, backdropFilter: 'blur(8px)', borderRadius: '20px', padding: '4px', border: `1px solid ${panelBorder}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                 <button style={{ padding: '6px 16px', borderRadius: '16px', background: 'transparent', border: 'none', fontSize: '0.75rem', fontWeight: 'bold', color: subTextColor, cursor: 'pointer' }}>🌍 ภาพดาวเทียม</button>
                 <button style={{ padding: '6px 16px', borderRadius: '16px', background: '#3b82f6', border: 'none', fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', cursor: 'pointer' }}>★ แผนที่</button>
              </div>
           </div>

           {/* Location Card */}
           <div style={{ ...floatingPanelStyle, position: 'relative', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <div>
                   <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>กรุงเทพมหานคร</h2>
                   <div style={{ fontSize: '0.8rem', color: subTextColor, marginTop: '2px' }}>เขตบางนา กรุงเทพมหานคร</div>
                 </div>
                 <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.5 }}>☆</button>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.5 }}>✕</button>
                 </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ fontSize: '3rem', fontWeight: '900', lineHeight: 1 }}>{Math.round(current?.temp || 32)}<span style={{ fontSize: '1.5rem', fontWeight: 'normal', verticalAlign: 'top' }}>°C</span></div>
                 <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>มีเมฆบางส่วน</div>
                    <div style={{ fontSize: '0.8rem', color: subTextColor }}>รู้สึกเหมือน {Math.round(current?.feelsLike || 39)}°C</div>
                 </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${panelBorder}`, borderBottom: `1px solid ${panelBorder}`, padding: '12px 0' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '1.2rem', color: '#3b82f6' }}>🌧️</div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{current?.rainProb || 60}%</div>
                      <div style={{ fontSize: '0.65rem', color: subTextColor }}>ฝน</div>
                    </div>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '1.2rem', color: '#22c55e' }}>💨</div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{Math.round(current?.windSpeed || 15)} <span style={{fontSize:'0.6rem'}}>km/h</span></div>
                      <div style={{ fontSize: '0.65rem', color: subTextColor }}>ลม</div>
                    </div>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '1.2rem', color: '#10b981' }}>🌫️</div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{Math.round(current?.pm25 || 28)}</div>
                      <div style={{ fontSize: '0.65rem', color: '#10b981' }}>● ดี</div>
                    </div>
                 </div>
              </div>

              <div>
                 <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '12px' }}>พยากรณ์ 12 ชั่วโมงข้างหน้า</div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', overflowX: 'auto', paddingBottom: '4px' }} className="hide-scrollbar">
                    {['09:00', '12:00', '15:00', '18:00', '21:00', '00:00'].map((time, i) => (
                       <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '40px' }}>
                          <div style={{ fontSize: '0.7rem', color: subTextColor }}>{time}</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{[32, 34, 33, 29, 28, 27][i]}°</div>
                          <div style={{ fontSize: '1.2rem' }}>{['🌤️', '🌧️', '⛈️', '🌧️', '☁️', '☁️'][i]}</div>
                          <div style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 'bold' }}>{[10, 20, 60, 60, 30, 10][i]}%</div>
                       </div>
                    ))}
                 </div>
                 <button style={{ width: '100%', padding: '10px', marginTop: '16px', background: 'var(--bg-secondary)', border: `1px solid ${panelBorder}`, borderRadius: '12px', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    🔍 ดูพยากรณ์ 7 วัน
                 </button>
              </div>
           </div>

           {/* Nearby Stats */}
           <div style={{ ...floatingPanelStyle, position: 'relative', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '1rem', fontWeight: '800' }}>สถานการณ์ในพื้นที่ใกล้เคียง</div>
              
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px' }}>
                 <button style={{ flex: 1, padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', fontSize: '0.75rem', fontWeight: '600', color: subTextColor, cursor: 'pointer' }}>PM2.5</button>
                 <button style={{ flex: 1, padding: '6px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>ฝนสะสม</button>
                 <button style={{ flex: 1, padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', fontSize: '0.75rem', fontWeight: '600', color: subTextColor, cursor: 'pointer' }}>อุณหภูมิ</button>
                 <button style={{ flex: 1, padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', fontSize: '0.75rem', fontWeight: '600', color: subTextColor, cursor: 'pointer' }}>ลม</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {[
                   { name: 'สมุทรปราการ', val: '45.2' },
                   { name: 'ชลบุรี', val: '32.6' },
                   { name: 'นนทบุรี', val: '18.7' },
                   { name: 'ฉะเชิงเทรา', val: '12.4' },
                   { name: 'นครปฐม', val: '9.8' },
                 ].map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>📍</span> {p.name}
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '0.7rem', color: subTextColor }}>ฝนสะสม 24 ชม.</span>
                          <strong style={{ width: '40px', textAlign: 'right' }}>{p.val}</strong>
                          <span style={{ fontSize: '0.7rem', color: subTextColor, width: '20px' }}>มม.</span>
                       </div>
                    </div>
                 ))}
              </div>

              <button style={{ width: '100%', padding: '10px 0 0 0', marginTop: '4px', background: 'transparent', border: 'none', borderTop: `1px solid ${panelBorder}`, color: '#3b82f6', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>
                 ดูทั้งหมด
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
