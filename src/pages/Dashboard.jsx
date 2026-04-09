import React, { useContext, useState, useEffect, useCallback } from 'react';
import { WeatherContext } from '../context/WeatherContext';

const Trend = ({ curr, prev, mode }) => {
    if (curr == null || prev == null || curr === '-') return null;
    const diff = Math.round(curr - prev);
    if (diff === 0) return <span style={{fontSize:'0.6em', color:'#94a3b8', marginLeft:'5px'}}>➖</span>;
    const color = diff > 0 ? '#ef4444' : '#22c55e';
    return <span style={{fontSize:'0.6em', color: color, fontWeight:'bold', marginLeft:'5px'}}>{diff > 0 ? '🔺' : '🔻'}{Math.abs(diff)}</span>;
};

export default function Dashboard() {
  const { stations, stationTemps, loading, darkMode, stationYesterday = {} } = useContext(WeatherContext);
  const [userData, setUserData] = useState({ prov: '...', temp: '-', pm25: '-', rain: '-', wind: '-' });

  const fetchClosest = useCallback(() => {
    if (!navigator.geolocation || stations.length === 0) return;
    navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        let min = Infinity; let best = stations[0];
        stations.forEach(st => {
            const d = Math.sqrt(Math.pow(st.lat-latitude,2) + Math.pow(st.lon-longitude,2));
            if(d < min) { min = d; best = st; }
        });
        const curr = stationTemps[best.stationID] || {};
        const prev = stationYesterday[best.stationID] || {};
        setUserData({
            prov: (best.areaTH || 'กรุงเทพฯ').replace('จังหวัด', ''),
            temp: Math.round(curr.temp || 0), prevTemp: prev.temp || (curr.temp - 2),
            pm25: best.AQILast?.PM25?.value || 0, prevPm25: prev.pm25 || (best.AQILast?.PM25?.value + 10),
            rain: curr.rainProb || 0, prevRain: prev.rain || 20,
            wind: Math.round(curr.windSpeed || 0), prevWind: prev.wind || 10
        });
    });
  }, [stations, stationTemps, stationYesterday]);

  useEffect(() => { if(stations.length > 0) fetchClosest(); }, [stations, fetchClosest]);

  const cardStyle = { background: darkMode ? '#0f172a' : '#fff', padding: '20px', borderRadius: '24px', border: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}` };

  if (loading) return <div style={{height:'100vh', background: darkMode ? '#020617' : '#f8fafc'}}></div>;

  return (
    <div style={{ height: '100%', width: '100%', background: darkMode ? '#020617' : '#f8fafc', padding: '20px', fontFamily: 'Kanit' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div>
           <h2 style={{ margin: 0, color: darkMode ? '#fff' : '#000' }}>สรุปสภาวะอากาศ 🌤️</h2>
           <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>พื้นที่: จ.{userData.prov}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
           <div style={cardStyle}>
              <div style={{fontSize:'0.75rem', color:'#64748b'}}>อุณหภูมิ 🌡️</div>
              <div style={{fontSize:'1.8rem', fontWeight:'900', color: darkMode ? '#fff' : '#000'}}>
                 {userData.temp}° <Trend curr={userData.temp} prev={userData.prevTemp} />
              </div>
           </div>
           <div style={cardStyle}>
              <div style={{fontSize:'0.75rem', color:'#64748b'}}>ฝุ่น PM2.5 😷</div>
              <div style={{fontSize:'1.8rem', fontWeight:'900', color: userData.pm25 > 50 ? '#f97316' : (darkMode ? '#fff' : '#000')}}>
                 {userData.pm25} <Trend curr={userData.pm25} prev={userData.prevPm25} mode="pm25" />
              </div>
           </div>
           <div style={cardStyle}>
              <div style={{fontSize:'0.75rem', color:'#64748b'}}>โอกาสฝนตก ☔</div>
              <div style={{fontSize:'1.8rem', fontWeight:'900', color:'#3b82f6'}}>
                 {userData.rain}% <Trend curr={userData.rain} prev={userData.prevRain} mode="rain" />
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}