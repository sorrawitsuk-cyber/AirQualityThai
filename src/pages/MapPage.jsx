import React, { useContext, useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { WeatherContext } from '../context/WeatherContext';

// ... (provMap และ legendConfigs ไว้เหมือนเดิม) ...

function MapChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, zoom, { animate: true, duration: 1.5 }); }, [center, zoom, map]);
  return null;
}

function MapZoomListener({ setMapZoom }) {
  useMapEvents({ zoomend: (e) => setMapZoom(e.target.getZoom()) });
  return null;
}

export default function MapPage() {
  const { stations, stationTemps, darkMode } = useContext(WeatherContext);
  
  // 🌟 Hooks ทั้งหมดต้องประกาศก่อนเงื่อนไข Return
  const [geoData, setGeoData] = useState(null);
  const [activeMode, setActiveMode] = useState('pm25');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mapZoom, setMapZoom] = useState(window.innerWidth < 1024 ? 5 : 6);
  const [polyOpacity, setPolyOpacity] = useState(0.75);
  const [selectedProvForecast, setSelectedProvForecast] = useState(null);
  const [basemapStyle, setBasemapStyle] = useState('default'); 
  const [flyToPos, setFlyToPos] = useState(null);
  
  // 📱 State ใหม่สำหรับ Mobile UI
  const [showControls, setShowControls] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setShowControls(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch('/thailand.json').then(res => res.json()).then(data => setGeoData(data)).catch(e => console.error(e));
  }, []);

  // ... (ฟังก์ชัน getVal, getColor, rankedStations, fetchForecast, styleGeoJSON, onEachFeature, createLabelIcon, handleLocateMe ไว้เหมือนเดิม) ...

  const appBg = darkMode ? '#020617' : '#f8fafc'; 
  const cardBg = darkMode ? '#0f172a' : '#ffffff';
  const textColor = darkMode ? '#f8fafc' : '#0f172a'; 
  const borderColor = darkMode ? '#1e293b' : '#e2e8f0';
  const subTextColor = darkMode ? '#94a3b8' : '#64748b'; 

  if (!geoData || Object.keys(stationTemps).length === 0) return <div style={{ height: '100%', background: appBg }} />;

  return (
    <div style={{ height: '100%', width: '100%', background: appBg, display: 'flex', flexDirection: 'column', fontFamily: 'Kanit, sans-serif', padding: isMobile ? '10px' : '20px' }}>
      
      {/* Tab Selectors */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '15px', background: cardBg, borderRadius: '20px', marginBottom: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', flexShrink: 0 }} className="hide-scrollbar">
        {/* ... ปุ่มโหมดเดิม ... */}
      </div>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flex: 1, gap: '15px', overflow: 'hidden' }}>
          <div style={{ flex: 1, borderRadius: '25px', overflow: 'hidden', border: `1px solid ${borderColor}`, position: 'relative' }}>
            <MapContainer center={[13.5, 100.5]} zoom={isMobile ? 5 : 6} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer url={basemapUrls[basemapStyle]} />
                <MapZoomListener setMapZoom={setMapZoom} />
                <MapChangeView center={flyToPos} zoom={8} />
                {geoData && <GeoJSON key={`${activeMode}-${polyOpacity}`} data={geoData} style={styleGeoJSON} onEachFeature={onEachFeature} />}
                {/* ... Markers ... */}
            </MapContainer>

            {/* 🛠️ Floating Control Center (จุดที่ปรับ) */}
            <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                {isMobile && (
                    <button onClick={() => setShowControls(!showControls)} style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#0ea5e9', color: '#fff', border: 'none', fontSize: '1.2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                        {showControls ? '✕' : '⚙️'}
                    </button>
                )}

                {(showControls || !isMobile) && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                        <button onClick={handleLocateMe} style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            📍 {isMobile ? '' : 'ตำแหน่งฉัน'}
                        </button>

                        <div style={{ background: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', padding: '12px', borderRadius: '16px', border: `1px solid ${borderColor}`, width: isMobile ? '150px' : 'auto' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: subTextColor }}>รูปแบบแผนที่</span>
                            <select value={basemapStyle} onChange={(e) => setBasemapStyle(e.target.value)} style={{ width: '100%', background: darkMode ? '#1e293b' : '#f1f5f9', color: textColor, border: 'none', padding: '5px', borderRadius: '8px', fontSize: '0.8rem', marginTop: '5px' }}>
                                <option value="default">มาตรฐาน</option>
                                <option value="osm">ถนน</option>
                                <option value="satellite">ดาวเทียม</option>
                            </select>
                            
                            <div style={{ marginTop: '10px' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: subTextColor }}>ความทึบสี: {Math.round(polyOpacity*100)}%</span>
                                <input type="range" min="0.1" max="1" step="0.1" value={polyOpacity} onChange={(e) => setPolyOpacity(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#0ea5e9' }} />
                            </div>
                        </div>

                        {/* Legend ย่อในมือถือ */}
                        {isMobile && (
                            <div style={{ background: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)', padding: '12px', borderRadius: '16px', border: `1px solid ${borderColor}`, width: '150px' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '5px' }}>เกณฑ์สี</div>
                                {legendConfigs[activeMode].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.65rem', marginBottom: '3px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.c }}></span>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.t}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
          </div>
          {/* ... Sidebar Desktop ... */}
      </div>
    </div>
  );
}