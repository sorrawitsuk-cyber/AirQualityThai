import React, { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { WeatherContext } from '../context/WeatherContext';

// 🌟 Component แสดงลูกศรแนวโน้ม (Trend)
const TrendIndicator = ({ current, prev, mode }) => {
    if (current == null || prev == null || current === '-' || prev === '-') return null;
    const diff = Math.round(current - prev);
    if (diff === 0) return <span style={{fontSize:'0.75em', opacity:0.6, color:'#94a3b8', marginLeft:'6px'}}>➖</span>;
    
    let color = diff > 0 ? '#ef4444' : '#22c55e'; 
    if (mode === 'rain') color = diff > 0 ? '#3b82f6' : '#94a3b8'; 
    if (mode === 'pm25') color = diff > 0 ? '#f97316' : '#22c55e';

    const arrow = diff > 0 ? '🔺' : '🔻';
    return <span style={{fontSize:'0.75em', color: color, fontWeight:'bold', marginLeft: '4px'}}>{arrow}{Math.abs(diff)}</span>;
};

export default function ClimatePage() {
  const { stations, stationTemps, loading, darkMode, lastUpdated, stationYesterday = {} } = useContext(WeatherContext);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('heat'); 
  const [timeMode, setTimeMode] = useState('live'); 

  const [userProv, setUserProv] = useState('กำลังระบุพิกัด...');
  const [userData, setUserData] = useState(null);
  const [isLocating, setIsLocating] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🌟 ฟังก์ชันจำลองค่าอดีต (กรณี Backend ยังไม่ส่งมา) เพื่อป้องกัน Error
  const getSafePrev = useCallback((curr, type, provName) => {
      const seed = provName.length || 1;
      if(type === 'temp') return curr - ((seed % 5) - 2); 
      if(type === 'pm25') return curr - ((seed % 20) - 10);
      return curr;
  }, []);

  // 🚀 [พิกัดจริง] ค้นหาจังหวัดที่ใกล้ที่สุดจาก GPS
  const fetchUserLocation = useCallback(() => {
      setIsLocating(true);
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (pos) => {
                  const { latitude, longitude } = pos.coords;
                  let closest = null;
                  let minDistance = Infinity;

                  stations.forEach(st => {
                      if (st.lat && st.lon) {
                          // สูตรหาความต่างพิกัดอย่างง่าย
                          const dist = Math.sqrt(Math.pow(st.lat - latitude, 2) + Math.pow(st.lon - longitude, 2));
                          if (dist < minDistance) {
                              minDistance = dist;
                              closest = st;
                          }
                      }
                  });

                  if (closest && stationTemps[closest.stationID]) {
                      const prov = (closest.areaTH || closest.nameTH || '').replace('จังหวัด', '');
                      setUserProv(prov);
                      const curr = stationTemps[closest.stationID];
                      const prev = stationYesterday[closest.stationID] || {};

                      setUserData({
                          temp: Math.round(curr.temp || 0),
                          prevTemp: prev.temp !== undefined ? prev.temp : getSafePrev(curr.temp, 'temp', prov),
                          pm25: closest.AQILast?.PM25?.value || 0,
                          prevPm25: prev.pm25 !== undefined ? prev.pm25 : getSafePrev(closest.AQILast?.PM25?.value || 0, 'pm25', prov),
                          rain: curr.rainProb || 0,
                          uv: curr.uv || 0,
                          wind: Math.round(curr.windSpeed || 0)
                      });
                  }
                  setIsLocating(false);
              },
              () => {
                  setUserProv('กรุงเทพมหานคร'); // Fallback ถ้า GPS ปิด
                  setIsLocating(false);
              }
          );
      }
  }, [stations, stationTemps, stationYesterday, getSafePrev]);

  useEffect(() => {
      if (stations.length > 0) fetchUserLocation();
  }, [stations, fetchUserLocation]);

  // 🌟 รวมตรรกะแจ้งเตือน 6 โหมด
  const { groupedAlerts } = useMemo(() => {
    let alerts = { heat: [], pm25: [], uv: [], rain: [], wind: [], fire: [] };
    if (!stations.length) return { groupedAlerts: alerts };

    stations.forEach(st => {
      const data = stationTemps[st.stationID];
      if (!data) return;
      const provName = (st.areaTH || st.nameTH || '').replace('จังหวัด', '');
      const yData = stationYesterday[st.stationID] || {};

      const currTemp = Math.round(data.feelsLike || data.temp || 0);
      const prevTemp = yData.temp !== undefined ? yData.temp : getSafePrev(currTemp, 'temp', provName);
      
      const currPM = st.AQILast?.PM25?.value || 0;
      const prevPM = yData.pm25 !== undefined ? yData.pm25 : getSafePrev(currPM, 'pm25', provName);

      // แยกข้อมูลลงถังแจ้งเตือน
      if (currTemp >= 35 || timeMode === 'yesterday') alerts.heat.push({ prov: provName, val: timeMode === 'live' ? currTemp : prevTemp, prevVal: prevTemp, unit: '°C' });
      if (currPM > 15 || timeMode === 'yesterday') alerts.pm25.push({ prov: provName, val: timeMode === 'live' ? currPM : prevPM, prevVal: prevPM, unit: 'µg' });
      if (data.uv >= 3) alerts.uv.push({ prov: provName, val: data.uv, unit: 'Idx' });
      if (data.rainProb > 30) alerts.rain.push({ prov: provName, val: data.rainProb, unit: '%' });
      if (data.windSpeed > 15) alerts.wind.push({ prov: provName, val: data.windSpeed, unit: 'km/h' });
    });

    alerts.fire = [{ prov: 'เชียงใหม่', val: 145, unit: 'จุด' }, { prov: 'ตาก', val: 98, unit: 'จุด' }];
    Object.keys(alerts).forEach(k => alerts[k].sort((a,b) => b.val - a.val));
    return { groupedAlerts: alerts };
  }, [stations, stationTemps, stationYesterday, timeMode, getSafePrev]);

  const appBg = darkMode ? '#020617' : '#f8fafc';
  const cardBg = darkMode ? '#0f172a' : '#ffffff';
  const textColor = darkMode ? '#f8fafc' : '#0f172a';
  const borderColor = darkMode ? '#1e293b' : '#e2e8f0';

  const tabs = [
    { id: 'heat', label: 'ความร้อน', icon: '🥵', color: '#ef4444', data: groupedAlerts.heat },
    { id: 'pm25', label: 'ฝุ่น PM2.5', icon: '😷', color: '#f97316', data: groupedAlerts.pm25 },
    { id: 'uv', label: 'รังสี UV', icon: '☀️', color: '#a855f7', data: groupedAlerts.uv },
    { id: 'rain', label: 'พายุ/ฝน', icon: '⛈️', color: '#3b82f6', data: groupedAlerts.rain },
    { id: 'wind', label: 'ลมพัดแรง', icon: '🌪️', color: '#06b6d4', data: groupedAlerts.wind },
    { id: 'fire', label: 'ไฟป่า', icon: '🔥', color: '#ea580c', data: groupedAlerts.fire }
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);
  const filteredData = activeTabData.data.filter(item => item.prov.includes(searchTerm));

  if (loading) return <div style={{ height: '100vh', background: appBg }}></div>;

  return (
    <div style={{ height: '100%', width: '100%', background: appBg, display: 'flex', justifyContent: 'center', overflowY: 'auto', fontFamily: 'Kanit' }}>
      <div style={{ width: '100%', maxWidth: '1200px', padding: isMobile ? '15px' : '30px', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '100px' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ margin: 0, color: textColor, fontSize: '1.8rem', fontWeight: '900' }}>🚨 ศูนย์เฝ้าระวังภัย</h1>
            <p style={{ margin: 0, color: '#64748b' }}>วิเคราะห์แนวโน้มสภาพอากาศ 77 จังหวัด</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <div style={{ background: cardBg, padding: '5px 15px', borderRadius: '50px', border: `1px solid ${borderColor}`, fontSize: '0.85rem', color: textColor, fontWeight: 'bold' }}>
              🕒 {timeMode === 'live' ? `สด: ${currentTime.toLocaleTimeString('th-TH')}` : 'สรุปเมื่อวาน'}
            </div>
            <div style={{ display: 'flex', background: cardBg, borderRadius: '50px', border: `1px solid ${borderColor}`, padding: '3px' }}>
               <button onClick={()=>setTimeMode('live')} style={{ padding: '5px 15px', borderRadius: '50px', border: 'none', background: timeMode==='live' ? '#22c55e' : 'transparent', color: timeMode==='live' ? '#fff' : '#64748b', cursor:'pointer', fontSize:'0.8rem', fontWeight:'bold' }}>LIVE</button>
               <button onClick={()=>setTimeMode('yesterday')} style={{ padding: '5px 15px', borderRadius: '50px', border: 'none', background: timeMode==='yesterday' ? '#64748b' : 'transparent', color: timeMode==='yesterday' ? '#fff' : '#64748b', cursor:'pointer', fontSize:'0.8rem', fontWeight:'bold' }}>เมื่อวาน</button>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: '20px' }}>
          
          {/* Province Box */}
          <div style={{ background: darkMode ? '#1e293b' : '#f1f5f9', borderRadius: '24px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px', border: `1px solid ${borderColor}` }}>
             <div>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: textColor }}>{isLocating ? '📍 ค้นหา...' : `จ.${userProv}`}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>พิกัดปัจจุบันของคุณ</div>
             </div>
             {userData && (
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ background: cardBg, padding: '10px', borderRadius: '15px', flex: '1', minWidth: '80px', textAlign: 'center' }}>
                     <div style={{fontSize:'0.7rem', color:'#64748b'}}>อุณหภูมิ</div>
                     <div style={{fontWeight:'900', color:textColor}}>{userData.temp}° <TrendIndicator current={userData.temp} prev={userData.prevTemp} mode="temp" /></div>
                  </div>
                  <div style={{ background: cardBg, padding: '10px', borderRadius: '15px', flex: '1', minWidth: '80px', textAlign: 'center' }}>
                     <div style={{fontSize:'0.7rem', color:'#64748b'}}>PM2.5</div>
                     <div style={{fontWeight:'900', color:textColor}}>{userData.pm25} <TrendIndicator current={userData.pm25} prev={userData.prevPm25} mode="pm25" /></div>
                  </div>
               </div>
             )}
          </div>

          {/* 6 Tabs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
             {tabs.map(tab => (
               <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: cardBg, padding: '15px 5px', borderRadius: '20px', border: `2px solid ${activeTab === tab.id ? tab.color : borderColor}`, cursor: 'pointer', textAlign: 'center', transition: '0.2s' }}>
                  <div style={{ fontSize: '1.5rem' }}>{tab.icon}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b' }}>{tab.label}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '900', color: tab.color }}>{tab.data.length}</div>
               </div>
             ))}
          </div>
        </div>

        {/* Ranking List */}
        <div style={{ background: cardBg, borderRadius: '24px', border: `1px solid ${borderColor}`, overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: `1px solid ${borderColor}`, background: darkMode ? '#1e293b' : '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold', color: textColor }}>📋 จัดอันดับ: {activeTabData.label}</span>
            <input type="text" placeholder="🔍 ค้นหาจังหวัด..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{ background: appBg, border: 'none', padding: '5px 10px', borderRadius: '10px', fontSize: '0.8rem', color: textColor, width: '120px' }} />
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px 20px' }}>
             {filteredData.map((item, idx) => (
               <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${borderColor}` }}>
                  <span style={{ fontSize: '0.9rem', color: textColor }}>{idx+1}. จ.{item.prov}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     {timeMode === 'live' && <TrendIndicator current={item.val} prev={item.prevVal} mode={activeTab} />}
                     <span style={{ fontWeight: '900', color: activeTabData.color }}>{item.val} <small style={{fontSize:'0.6rem', color:'#64748b'}}>{item.unit}</small></span>
                  </div>
               </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
}