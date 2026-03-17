import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// ----------------------------------------------------
// 1. ฟังก์ชันคำนวณสีและข้อความตามเกณฑ์ต่างๆ
// ----------------------------------------------------

const getAqiDetails = (aqiValue) => {
  const aqi = Number(aqiValue);
  if (isNaN(aqi) || aqi === 0) return { color: '#cccccc', text: 'ไม่มีข้อมูล', level: 0 };
  if (aqi <= 25) return { color: '#00b0f0', text: 'ดีมาก', level: 1 };
  if (aqi <= 50) return { color: '#92d050', text: 'ดี', level: 2 };
  if (aqi <= 100) return { color: '#ffff00', text: 'ปานกลาง', level: 3 };
  if (aqi <= 200) return { color: '#ffc000', text: 'เริ่มมีผลกระทบ', level: 4 };
  return { color: '#ff0000', text: 'มีผลกระทบ', level: 5 };
};

const getPM25Color = (val) => {
  const num = Number(val);
  if (isNaN(num)) return '#333333';
  if (num <= 15.0) return '#008bbf'; 
  if (num <= 25.0) return '#6aa84f'; 
  if (num <= 37.5) return '#d4b500'; 
  if (num <= 75.0) return '#e67e22'; 
  return '#e74c3c'; 
};

const getPM10Color = (val) => {
  const num = Number(val);
  if (isNaN(num)) return '#333333';
  if (num <= 50) return '#008bbf';
  if (num <= 80) return '#6aa84f';
  if (num <= 120) return '#d4b500';
  if (num <= 180) return '#e67e22';
  return '#e74c3c';
};

const getTempColor = (val) => {
  if (isNaN(val)) return { bg: '#cccccc', text: '#333' };
  if (val < 27) return { bg: '#3498db', text: '#fff' }; 
  if (val <= 32) return { bg: '#2ecc71', text: '#222' }; 
  if (val <= 35) return { bg: '#f1c40f', text: '#222' }; 
  if (val <= 38) return { bg: '#e67e22', text: '#fff' }; 
  return { bg: '#e74c3c', text: '#fff' }; 
};

const extractProvince = (areaTH) => {
  if (!areaTH) return 'ไม่ระบุ';
  const parts = areaTH.split(',');
  return parts[parts.length - 1].trim();
};

// ----------------------------------------------------
// 2. Map Components
// ----------------------------------------------------

const createCustomMarker = (viewMode, value, level) => {
  let bg, textColor, displayValue;

  if (viewMode === 'aqi') {
    bg = getAqiDetails(value).color;
    textColor = (level >= 2 && level <= 4) ? '#222' : '#fff';
    displayValue = (value === 0 || isNaN(value)) ? '-' : value;
  } else {
    const tempInfo = getTempColor(value);
    bg = tempInfo.bg;
    textColor = tempInfo.text;
    displayValue = (value === 0 || isNaN(value)) ? '-' : value.toFixed(1);
  }

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${bg}; 
        width: 32px; height: 32px; 
        border-radius: 50%; 
        border: 2px solid white; 
        box-shadow: 0 2px 5px rgba(0,0,0,0.4); 
        display: flex; justify-content: center; align-items: center; 
        color: ${textColor}; font-weight: bold; font-size: 11px;
        font-family: 'Kanit', sans-serif;
        transition: all 0.3s ease;
      ">
        ${displayValue}
      </div>
    `,
    iconSize: [36, 36], 
    iconAnchor: [18, 18] 
  });
};

function FitBounds({ stations, activeStation }) {
  const map = useMap();
  useEffect(() => {
    if (activeStation) return; 
    if (stations && stations.length > 0) {
      const bounds = L.latLngBounds(stations.map(s => [parseFloat(s.lat), parseFloat(s.long)]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [stations, map, activeStation]);
  return null;
}

function FlyToActiveStation({ activeStation }) {
  const map = useMap();
  useEffect(() => {
    if (activeStation) {
      map.flyTo([parseFloat(activeStation.lat), parseFloat(activeStation.long)], 13, { duration: 1.5 });
    }
  }, [activeStation, map]);
  return null;
}

// ----------------------------------------------------
// 3. Main App Component
// ----------------------------------------------------

export default function App() {
  const [allStations, setAllStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [provinces, setProvinces] = useState([]);
  
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedStationId, setSelectedStationId] = useState('');
  
  const [viewMode, setViewMode] = useState('aqi');
  const [stationTemps, setStationTemps] = useState({});
  const [activeStation, setActiveStation] = useState(null);
  const [activeWeather, setActiveWeather] = useState(null); 
  const [activeForecast, setActiveForecast] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [lastUpdateText, setLastUpdateText] = useState('');
  
  const cardRefs = useRef({});
  const markerRefs = useRef({});

  // ฟังก์ชันดึงข้อมูลฝุ่น Air4Thai
  const fetchAirQuality = async (isBackgroundLoad = false) => {
    if (!isBackgroundLoad) setLoading(true);
    try {
      const response = await fetch('/api-air/services/getNewAQI_JSON.php');
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      
      if (data && data.stations) {
        setAllStations(data.stations);
        
        const provs = [...new Set(data.stations.map(s => extractProvince(s.areaTH)))];
        setProvinces(provs.sort());

        if (data.stations.length > 0) {
          const updateDate = data.stations[0].AQILast?.date || '';
          const updateTime = data.stations[0].AQILast?.time || '';
          setLastUpdateText(`${updateDate} เวลา ${updateTime} น.`);
        }

        // ดึงอุณหภูมิของทุกสถานีรวดเดียวแบบเบื้องหลัง
        fetchTemperaturesForAll(data.stations);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      if (!isBackgroundLoad) setLoading(false);
    }
  };

  // ดึงข้อมูลอุณหภูมิ (แบ่งทีละ 40 สถานีเพื่อไม่ให้ API บล็อก)
  const fetchTemperaturesForAll = async (stations) => {
    const newTemps = {};
    const chunkSize = 40; 
    
    for (let i = 0; i < stations.length; i += chunkSize) {
      const chunk = stations.slice(i, i + chunkSize);
      const lats = chunk.map(s => s.lat).join(',');
      const lons = chunk.map(s => s.long).join(',');
      
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current_weather=true`);
        const weatherData = await res.json();
        
        const results = Array.isArray(weatherData) ? weatherData : [weatherData];
        results.forEach((r, idx) => {
          if (r && r.current_weather) {
            newTemps[chunk[idx].stationID] = r.current_weather.temperature;
          }
        });
      } catch (err) {
        console.error("Batch Temp fetch error", err);
      }
    }
    setStationTemps(prev => ({...prev, ...newTemps}));
  };

  useEffect(() => {
    fetchAirQuality();
    const intervalId = setInterval(() => { fetchAirQuality(true); }, 600000);
    return () => clearInterval(intervalId);
  }, []);

  // กรองข้อมูลและเรียงลำดับใหม่เมื่อ Filter เปลี่ยน หรือ เปลี่ยนแท็บโหมด
  useEffect(() => {
    let result = [...allStations];
    
    if (selectedProvince) {
      result = result.filter(s => extractProvince(s.areaTH) === selectedProvince);
    }
    if (selectedStationId) {
      result = result.filter(s => s.stationID === selectedStationId);
    }
    
    result.sort((a, b) => {
      if (viewMode === 'aqi') {
        const aqiA = Number(a.AQILast?.AQI?.aqi) || 0;
        const aqiB = Number(b.AQILast?.AQI?.aqi) || 0;
        return aqiB - aqiA; 
      } else {
        const tempA = stationTemps[a.stationID] || -99;
        const tempB = stationTemps[b.stationID] || -99;
        return tempB - tempA;
      }
    });

    setFilteredStations(result);
  }, [selectedProvince, selectedStationId, allStations, viewMode, stationTemps]);

  // เมื่อคลิกเลือกสถานี ให้ดึงข้อมูลอากาศเชิงลึก + พยากรณ์ฝุ่น 24 ชม.
  useEffect(() => {
    if (activeStation) {
      if (cardRefs.current[activeStation.stationID]) {
        cardRefs.current[activeStation.stationID].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const marker = markerRefs.current[activeStation.stationID];
      if (marker) marker.openPopup();

      setActiveWeather(null); 
      setActiveForecast(null);

      const fetchDetails = async () => {
        try {
          const resW = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${activeStation.lat}&longitude=${activeStation.long}&current_weather=true`);
          const wData = await resW.json();
          if (wData.current_weather) {
            setActiveWeather({
              temp: wData.current_weather.temperature,
              windSpeed: wData.current_weather.windspeed,
              windDir: wData.current_weather.winddirection,
            });
          }

          const resAqi = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${activeStation.lat}&longitude=${activeStation.long}&hourly=pm2_5&timezone=auto&forecast_days=2`);
          const aData = await resAqi.json();
          
          if (aData && aData.hourly) {
            const nowTime = new Date().getTime();
            let startIndex = aData.hourly.time.findIndex(tStr => new Date(tStr).getTime() >= nowTime);
            if (startIndex === -1) startIndex = 0;
            
            const forecastList = [];
            for (let i = startIndex; i < aData.hourly.time.length && forecastList.length < 12; i += 2) {
              const val = aData.hourly.pm2_5[i] || 0;
              const tDate = new Date(aData.hourly.time[i]);
              forecastList.push({
                time: `${tDate.getHours().toString().padStart(2, '0')}:00`,
                val: Math.round(val),
                color: getPM25Color(val)
              });
            }
            setActiveForecast(forecastList);
          }
        } catch (err) {
          console.error("Fetch detail error", err);
          setActiveWeather('error');
        }
      };
      fetchDetails();
    }
  }, [activeStation]);

  if (loading) return <div className="loading-screen">กำลังโหลดข้อมูลสถานีทั่วประเทศ...</div>;

  return (
    <div className="app-wrapper">
      <div className="top-filter-bar">
        <div className="filter-group">
          <label>🗺️ เลือกจังหวัด:</label>
          <select 
            value={selectedProvince} 
            onChange={(e) => {
              setSelectedProvince(e.target.value);
              setSelectedStationId('');
              setActiveStation(null);
            }}
          >
            <option value="">-- แสดงทุกจังหวัด (ทั่วประเทศ) --</option>
            {provinces.map(prov => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>📍 เลือกสถานี:</label>
          <select 
            value={selectedStationId} 
            onChange={(e) => {
              setSelectedStationId(e.target.value);
              const stat = allStations.find(s => s.stationID === e.target.value);
              if(stat) setActiveStation(stat);
            }}
            disabled={!selectedProvince && filteredStations.length > 50}
          >
            <option value="">-- ทุกสถานีในพื้นที่ --</option>
            {filteredStations.map(station => (
              <option key={station.stationID} value={station.stationID}>
                {station.nameTH}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.95rem', color: '#555', fontWeight: 'bold' }}>
          ข้อมูลอัปเดตล่าสุด: <span style={{ color: '#0984e3' }}>{lastUpdateText || 'กำลังโหลด...'}</span>
        </div>
      </div>

      <div className="dashboard-layout">
        
        <div className="map-section">
          {/* ปุ่มสลับโหมดแผนที่ (Toggle) ลอยอยู่มุมขวาบนของแผนที่ */}
          <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 1000, background: '#fff', padding: '4px', borderRadius: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', gap: '5px' }}>
            <button 
              onClick={() => setViewMode('aqi')}
              style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', backgroundColor: viewMode === 'aqi' ? '#0984e3' : 'transparent', color: viewMode === 'aqi' ? '#fff' : '#666' }}
            >
              ☁️ AQI
            </button>
            <button 
              onClick={() => setViewMode('temp')}
              style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', backgroundColor: viewMode === 'temp' ? '#e67e22' : 'transparent', color: viewMode === 'temp' ? '#fff' : '#666' }}
            >
              🌡️ อุณหภูมิ
            </button>
          </div>

          <MapContainer center={[13.0, 100.0]} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <FitBounds stations={filteredStations} activeStation={activeStation} />
            <FlyToActiveStation activeStation={activeStation} />

            {filteredStations.map((station) => {
              const aqiValue = station.AQILast?.AQI?.aqi || 0;
              const aqiInfo = getAqiDetails(aqiValue);
              const markerValue = viewMode === 'aqi' ? aqiValue : (stationTemps[station.stationID] || 0);

              return (
                <Marker 
                  key={station.stationID} 
                  position={[parseFloat(station.lat), parseFloat(station.long)]}
                  icon={createCustomMarker(viewMode, markerValue, aqiInfo.level)}
                  ref={(ref) => markerRefs.current[station.stationID] = ref}
                  eventHandlers={{ click: () => setActiveStation(station) }}
                >
                  <Popup minWidth={240}>
                    <div style={{ textAlign: 'center', fontFamily: 'Kanit' }}>
                      <strong style={{ fontSize: '1.1rem' }}>{station.nameTH}</strong><br/>
                      
                      <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <span style={{ fontSize: '1.2rem', color: aqiInfo.color === '#ffff00' ? '#d4b500' : aqiInfo.color, fontWeight: 'bold' }}>
                          AQI: {aqiValue} ({aqiInfo.text})
                        </span>
                      </div>
                      
                      {activeStation?.stationID === station.stationID && (
                        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff7e6', borderRadius: '8px', color: '#d35400', fontWeight: 'bold' }}>
                          {activeWeather === null ? (
                            <span>กำลังดึงข้อมูลสภาพอากาศ...</span>
                          ) : activeWeather === 'error' ? (
                            <span>ไม่สามารถดึงข้อมูลได้</span>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                              <span style={{ fontSize: '1.1rem' }}>🌡️ {activeWeather.temp} °C</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
                                🌬️ {activeWeather.windSpeed} km/h
                                <div style={{ transform: `rotate(${activeWeather.windDir}deg)`, display: 'inline-block', fontSize: '1.2rem', transition: 'transform 0.5s ease' }}>↓</div>
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-header" style={{ padding: '15px 20px', background: viewMode === 'aqi' ? '#fff' : '#fffaf0', transition: 'background 0.3s' }}>
            <h2 style={{ fontSize: '1.1rem', color: '#2c3e50', margin: 0 }}>
              {viewMode === 'aqi' ? `เรียงตามมลพิษสูงสุด (${filteredStations.length})` : `เรียงตามอุณหภูมิสูงสุด (${filteredStations.length})`}
            </h2>
          </div>

          <div className="cards-container">
            {filteredStations.map((station) => {
              const aqiValue = station.AQILast?.AQI?.aqi || '--';
              const aqiInfo = getAqiDetails(station.AQILast?.AQI?.aqi);
              const isActive = activeStation?.stationID === station.stationID;
              const currentTemp = stationTemps[station.stationID];
              
              const isAqiMode = viewMode === 'aqi';
              const displayMainVal = isAqiMode ? aqiValue : (currentTemp ? currentTemp.toFixed(1) : '-');
              const boxColorInfo = isAqiMode ? { bg: aqiInfo.color, text: aqiInfo.level === 3 ? '#000' : '#fff' } : getTempColor(currentTemp);

              const pm25Val = station.AQILast?.PM25?.value || '-';
              const pm10Val = station.AQILast?.PM10?.value || '-';

              return (
                <div 
                  key={station.stationID}
                  ref={el => cardRefs.current[station.stationID] = el}
                  className={`station-card ${isActive ? 'active-card' : ''}`}
                  onClick={() => setActiveStation(station)}
                  style={{ borderLeftColor: boxColorInfo.bg, padding: isActive ? '20px 15px' : '15px' }}
                >
                  <div className="card-info" style={{ width: '100%' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h4>{station.nameTH}</h4>
                        <p className="area-text">{extractProvince(station.areaTH)}</p>
                      </div>
                      <div className="card-aqi" style={{ backgroundColor: boxColorInfo.bg, color: boxColorInfo.text, minWidth: '60px', height: '60px' }}>
                        <span className="val">{displayMainVal}</span>
                        <span className="lbl">{isAqiMode ? 'AQI' : '°C'}</span>
                      </div>
                    </div>

                    <div className="pm-data" style={{ marginBottom: isActive ? '15px' : '0', borderBottom: isActive ? '1px solid #eee' : 'none', paddingBottom: isActive ? '10px' : '0' }}>
                      <span>PM2.5: <strong style={{ color: getPM25Color(pm25Val), fontSize: '1rem' }}>{pm25Val}</strong> µg/m³</span>
                      <span style={{ marginLeft: '15px' }}>PM10: <strong style={{ color: getPM10Color(pm10Val), fontSize: '1rem' }}>{pm10Val}</strong> µg/m³</span>
                    </div>

                    {isActive && (
                      <div style={{ animation: 'fadeIn 0.5s ease' }}>
                        
                        <div style={{ padding: '8px 12px', backgroundColor: '#fff7e6', borderRadius: '6px', color: '#d35400', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          {activeWeather === null ? (
                            <span style={{ fontSize: '0.85rem' }}>กำลังดึงสภาพอากาศ...</span>
                          ) : activeWeather === 'error' ? (
                            <span style={{ fontSize: '0.85rem' }}>ดึงข้อมูลล้มเหลว</span>
                          ) : (
                            <>
                              <span style={{ fontSize: '1rem' }}>🌡️ {activeWeather.temp} °C</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
                                🌬️ ลม: {activeWeather.windSpeed} km/h
                                <span style={{ transform: `rotate(${activeWeather.windDir}deg)`, display: 'inline-block', fontSize: '1.2rem', transition: 'transform 0.5s ease' }}>↓</span>
                              </span>
                            </>
                          )}
                        </div>

                        <div>
                          <h5 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#666', marginBottom: '10px' }}>📈 คาดการณ์ PM2.5 ล่วงหน้า 24 ชม.</h5>
                          
                          {activeForecast === null ? (
                            <p style={{ fontSize: '0.8rem', color: '#999', textAlign: 'center' }}>กำลังดึงข้อมูลพยากรณ์ฝุ่น...</p>
                          ) : (
                            <div style={{ height: '90px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '3px', borderBottom: '1px solid #ddd', paddingBottom: '2px' }}>
                              {(() => {
                                const maxVal = Math.max(...activeForecast.map(d => d.val)) + 15;
                                return activeForecast.map((data, index) => {
                                  const heightPercent = Math.max((data.val / maxVal) * 100, 5); 
                                  return (
                                    <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }} title={`เวลา ${data.time} = ${data.val} µg/m³`}>
                                      <div style={{ width: '100%', height: `${heightPercent}%`, backgroundColor: data.color, borderRadius: '2px 2px 0 0', opacity: 0.85, transition: '0.3s' }} className="hover-bar"></div>
                                      <span style={{ fontSize: '9px', color: '#999', marginTop: '4px', display: index % 2 === 0 ? 'block' : 'none' }}>{data.time.split(':')[0]}</span>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}