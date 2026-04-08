import React, { useContext, useState, useEffect, useMemo } from 'react';
import { WeatherContext } from '../context/WeatherContext';

const getWindDirectionTH = (deg) => {
    if (deg >= 337.5 || deg < 22.5) return 'เหนือ';
    if (deg >= 22.5 && deg < 67.5) return 'ตะวันออกเฉียงเหนือ';
    if (deg >= 67.5 && deg < 112.5) return 'ตะวันออก';
    if (deg >= 112.5 && deg < 157.5) return 'ตะวันออกเฉียงใต้';
    if (deg >= 157.5 && deg < 202.5) return 'ใต้';
    if (deg >= 202.5 && deg < 247.5) return 'ตะวันตกเฉียงใต้';
    if (deg >= 247.5 && deg < 292.5) return 'ตะวันตก';
    if (deg >= 292.5 && deg < 337.5) return 'ตะวันตกเฉียงเหนือ';
    return '-';
};

export default function ClimatePage() {
  const { stations, stationTemps, loading, darkMode, lastUpdated } = useContext(WeatherContext);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyTop10, setShowOnlyTop10] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { groupedAlerts } = useMemo(() => {
    let alerts = { heat: [], pm25: [], uv: [], rain: [] };

    if (stations?.length > 0 && stationTemps) {
        stations.forEach(st => {
          const data = stationTemps[st.stationID];
          if (!data) return;

          const pm25 = st.AQILast?.PM25?.value || 0;
          const feelsLike = Math.round(data.feelsLike || data.temp || 0); 
          const rain = data.rainProb || 0;
          const uv = data.uv || 0; 
          const provName = st.areaTH.replace('จังหวัด', '');

          // ปรับเกณฑ์การแสดงผล (Alert Thresholds)
          if (feelsLike >= 35) alerts.heat.push({ prov: provName, val: feelsLike, unit: '°C' });
          if (pm25 > 15) alerts.pm25.push({ prov: provName, val: pm25, unit: 'µg' });
          if (uv >= 3) alerts.uv.push({ prov: provName, val: uv, unit: 'Index' }); // เริ่มโชว์ตั้งแต่ระดับ 3
          if (rain > 30) alerts.rain.push({ prov: provName, val: rain, unit: '%' });
        });
    }

    // Sort ทุกอย่างตามความรุนแรง (มากไปน้อย)
    Object.keys(alerts).forEach(key => alerts[key].sort((a, b) => b.val - a.val));

    return { groupedAlerts: alerts };
  }, [stations, stationTemps]);

  const appBg = darkMode ? '#020617' : '#f8fafc'; 
  const cardBg = darkMode ? '#0f172a' : '#ffffff';
  const textColor = darkMode ? '#f8fafc' : '#0f172a'; 
  const borderColor = darkMode ? '#1e293b' : '#e2e8f0';
  const subTextColor = darkMode ? '#94a3b8' : '#64748b'; 

  // ฟังก์ชันกรองข้อมูล (Search + Top10)
  const filterData = (data) => {
    let result = data.filter(item => item.prov.includes(searchTerm));
    if (showOnlyTop10) result = result.slice(0, 10);
    return result;
  };

  const AlertBox = ({ title, icon, data, color }) => {
    const filtered = filterData(data);
    return (
      <div style={{ background: cardBg, borderRadius: '24px', border: `1px solid ${borderColor}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ background: `${color}20`, color: color, padding: '15px 20px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${color}30` }}>
              <span>{icon} {title}</span>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>พบ {filtered.length} พื้นที่</span>
          </div>
          <div style={{ padding: '10px', maxHeight: '300px', overflowY: 'auto' }} className="hide-scrollbar">
              {filtered.length > 0 ? filtered.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 10px', borderBottom: `1px solid ${borderColor}`, fontSize: '0.95rem' }}>
                      <span style={{ color: textColor, fontWeight: '500' }}>จ.{item.prov}</span>
                      <span style={{ color: color, fontWeight: 'bold' }}>{item.val} <small style={{fontSize: '0.7rem'}}>{item.unit}</small></span>
                  </div>
              )) : <div style={{ textAlign: 'center', padding: '40px 0', color: subTextColor, fontSize: '0.9rem' }}>ไม่พบข้อมูลที่ตรงเงื่อนไข</div>}
          </div>
      </div>
    );
  };

  if (loading) return <div style={{ height: '100vh', background: appBg }}></div>;

  return (
    <div style={{ height: '100%', width: '100%', background: appBg, display: 'flex', justifyContent: 'center', overflowY: 'auto', fontFamily: 'Kanit, sans-serif' }} className="hide-scrollbar">
      <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '25px', padding: isMobile ? '15px' : '30px', paddingBottom: '100px' }}>
        
        {/* Header & Timestamp */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '10px' }}>
            <div>
                <h1 style={{ margin: 0, color: textColor, fontSize: '1.8rem' }}>⚠️ ศูนย์เฝ้าระวังภัยพิบัติ</h1>
                <p style={{ margin: 0, color: subTextColor, fontSize: '0.9rem' }}>วิเคราะห์สภาวะอากาศและปัจจัยเสี่ยงรายจังหวัด</p>
            </div>
            <div style={{ textAlign: isMobile ? 'left' : 'right', background: darkMode ? '#1e293b' : '#fff', padding: '8px 15px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
                <div style={{ fontSize: '0.7rem', color: subTextColor, fontWeight: 'bold' }}>อัปเดตล่าสุด</div>
                <div style={{ fontSize: '0.9rem', color: '#0ea5e9', fontWeight: 'bold' }}>{lastUpdated ? new Date(lastUpdated).toLocaleString('th-TH') : 'กำลังโหลด...'}</div>
            </div>
        </div>

        {/* Filters Panel */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input 
                type="text" 
                placeholder="🔍 ค้นหาจังหวัด..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: isMobile ? '1' : 'none', width: isMobile ? 'auto' : '250px', padding: '12px 20px', borderRadius: '15px', border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none' }}
            />
            <button 
                onClick={() => setShowOnlyTop10(!showOnlyTop10)}
                style={{ padding: '12px 20px', borderRadius: '15px', border: 'none', background: showOnlyTop10 ? '#ef4444' : (darkMode ? '#1e293b' : '#e2e8f0'), color: showOnlyTop10 ? '#fff' : textColor, fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
            >
                {showOnlyTop10 ? '🔥 แสดงทั้งหมด' : '🏆 ดู 10 อันดับสูงสุด'}
            </button>
        </div>

        {/* Top Summary Cards - ปรับสีให้ไม่ขาวจ้า */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '15px' }}>
            {[
                { label: 'วิกฤตความร้อน', icon: '🥵', count: groupedAlerts.heat.length, color: '#ef4444' },
                { label: 'ฝุ่นเกินมาตรฐาน', icon: '😷', count: groupedAlerts.pm25.length, color: '#f97316' },
                { label: 'UV ระดับสูง', icon: '☀️', count: groupedAlerts.uv.length, color: '#a855f7' },
                { label: 'ระวังฝนหนัก', icon: '⛈️', count: groupedAlerts.rain.length, color: '#3b82f6' }
            ].map((item, idx) => (
                <div key={idx} style={{ background: darkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', padding: '20px', borderRadius: '24px', border: `1px solid ${borderColor}`, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ fontSize: '1.8rem' }}>{item.icon}</span>
                    <span style={{ fontSize: '0.75rem', color: subTextColor, fontWeight: 'bold' }}>{item.label}</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: '900', color: item.color }}>{item.count} <small style={{fontSize: '0.8rem', fontWeight: 'bold'}}>จ.</small></span>
                </div>
            ))}
        </div>

        {/* Alert Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '25px' }}>
            <AlertBox title="ดัชนีความร้อน (Feels Like)" icon="🥵" data={groupedAlerts.heat} color="#ef4444" />
            <AlertBox title="ฝุ่น PM2.5 (คุณภาพอากาศ)" icon="😷" data={groupedAlerts.pm25} color="#f97316" />
            <AlertBox title="รังสี UV (UV Index)" icon="☀️" data={groupedAlerts.uv} color="#a855f7" />
            <AlertBox title="โอกาสฝนตกหนัก" icon="⛈️" data={groupedAlerts.rain} color="#3b82f6" />
        </div>

      </div>
    </div>
  );
}