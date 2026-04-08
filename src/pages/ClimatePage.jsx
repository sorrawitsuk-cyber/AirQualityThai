import React, { useContext, useState, useEffect, useMemo } from 'react';
import { WeatherContext } from '../context/WeatherContext';
// 🌟 เปลี่ยนอีโมจิเป็น Icon ระดับ Pro
import { ThermometerSun, Wind, CloudRain, Sun, ShieldAlert, MapPin, Flame, Droplets, AlertTriangle, Crosshair } from 'lucide-react';

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
  
  // 🌟 State สำหรับระบบ Auto Location
  const [userProv, setUserProv] = useState(null);
  const [isLocating, setIsLocating] = useState(true);

  // ตรวจจับขนาดหน้าจอ
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🌟 ระบบ Auto Location (คำนวณหาสถานีที่ใกล้ที่สุด)
  useEffect(() => {
    if (stations && stations.length > 0 && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          let closest = null;
          let minDistance = Infinity;
          
          stations.forEach(st => {
            // ใช้สูตรพีทาโกรัสหาระยะทางแบบง่าย
            if(st.lat && st.lon) {
                const dist = Math.sqrt(Math.pow(st.lat - latitude, 2) + Math.pow(st.lon - longitude, 2));
                if (dist < minDistance) {
                  minDistance = dist;
                  closest = st;
                }
            }
          });

          if (closest) {
            setUserProv(closest.areaTH.replace('จังหวัด', ''));
          }
          setIsLocating(false);
        },
        () => setIsLocating(false) // ถ้าผู้ใช้ไม่อนุญาต GPS ให้ข้ามไป
      );
    } else {
      setIsLocating(false);
    }
  }, [stations]);

  const { groupedAlerts, fireRisks } = useMemo(() => {
    let alerts = { heat: [], pm25: [], uv: [], rain: [] };
    let fires = [];

    if (stations?.length > 0 && stationTemps) {
        stations.forEach(st => {
          const data = stationTemps[st.stationID];
          if (!data) return;

          const pm25 = st.AQILast?.PM25?.value || 0;
          const temp = Math.round(data.temp || 0);
          const feelsLike = Math.round(data.feelsLike || temp || 0); 
          const rain = data.rainProb || 0;
          const uv = data.uv || 0; 
          const humidity = Math.round(data.humidity || 0);
          const windSpeed = Math.round(data.windSpeed || 0);
          const provName = st.areaTH.replace('จังหวัด', '');

          // Alerts
          if (feelsLike >= 35) alerts.heat.push({ prov: provName, val: feelsLike, unit: '°C' });
          if (pm25 > 15) alerts.pm25.push({ prov: provName, val: pm25, unit: 'µg' });
          if (uv >= 3) alerts.uv.push({ prov: provName, val: uv, unit: 'Index' });
          if (rain > 30) alerts.rain.push({ prov: provName, val: rain, unit: '%' });

          // Fire Risk
          let fireScore = (temp > 32 ? 30 : 0) + (humidity < 50 ? 30 : 0) + (windSpeed > 10 ? 20 : 0);
          if (fireScore >= 60) fires.push({ prov: provName, temp, humidity, windSpeed, riskLevel: 'สูง', riskColor: '#ef4444' });
        });
    }

    Object.keys(alerts).forEach(key => alerts[key].sort((a, b) => b.val - a.val));
    return { groupedAlerts: alerts, fireRisks: fires.sort((a,b) => b.score - a.score) };
  }, [stations, stationTemps]);

  const appBg = darkMode ? '#020617' : '#f8fafc'; 
  const cardBg = darkMode ? '#0f172a' : '#ffffff';
  const textColor = darkMode ? '#f8fafc' : '#0f172a'; 
  const borderColor = darkMode ? '#1e293b' : '#e2e8f0';
  const subTextColor = darkMode ? '#94a3b8' : '#64748b'; 

  // ฟังก์ชันกรองข้อมูล
  const filterData = (data) => {
    let result = data.filter(item => item.prov.includes(searchTerm));
    if (showOnlyTop10) result = result.slice(0, 10);
    return result;
  };

  const AlertBox = ({ title, icon, data, color }) => {
    const filtered = filterData(data);
    return (
      <div style={{ background: cardBg, borderRadius: '24px', border: `1px solid ${borderColor}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ background: `${color}15`, color: color, padding: '15px 20px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${color}30` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {icon} <span>{title}</span>
              </div>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{filtered.length} พื้นที่</span>
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

  // 🌟 สร้าง Skeleton Loading แบบมืออาชีพ (ลดปัญหาจอขาวตอนรอข้อมูล)
  if (loading) {
    return (
      <div style={{ height: '100%', width: '100%', background: appBg, padding: isMobile ? '15px' : '30px' }}>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        <div style={{ width: '200px', height: '30px', background: borderColor, borderRadius: '8px', animation: 'pulse 1.5s infinite', marginBottom: '20px' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
            {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '120px', background: cardBg, borderRadius: '24px', border: `1px solid ${borderColor}`, animation: 'pulse 1.5s infinite' }}></div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '25px' }}>
            {[1, 2].map(i => <div key={i} style={{ height: '300px', background: cardBg, borderRadius: '24px', border: `1px solid ${borderColor}`, animation: 'pulse 1.5s infinite' }}></div>)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', background: appBg, display: 'flex', justifyContent: 'center', overflowY: 'auto', fontFamily: 'Kanit, sans-serif' }} className="hide-scrollbar">
      <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '25px', padding: isMobile ? '15px' : '30px', paddingBottom: '100px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '10px' }}>
            <div>
                <h1 style={{ margin: 0, color: textColor, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={28} color="#ef4444" /> ศูนย์เฝ้าระวังภัยพิบัติ
                </h1>
                <p style={{ margin: '5px 0 0 0', color: subTextColor, fontSize: '0.9rem' }}>วิเคราะห์สภาวะอากาศและปัจจัยเสี่ยงรายจังหวัด</p>
            </div>
            <div style={{ textAlign: isMobile ? 'left' : 'right', background: cardBg, padding: '8px 15px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
                <div style={{ fontSize: '0.7rem', color: subTextColor, fontWeight: 'bold' }}>อัปเดตล่าสุด</div>
                <div style={{ fontSize: '0.9rem', color: '#0ea5e9', fontWeight: 'bold' }}>{lastUpdated ? new Date(lastUpdated).toLocaleString('th-TH') : 'กำลังโหลด...'}</div>
            </div>
        </div>

        {/* 🌟 แสดงป้ายพื้นที่ของผู้ใช้ (Auto Location) */}
        {userProv && (
            <div style={{ background: darkMode ? '#1e3a8a30' : '#eff6ff', border: `1px solid #3b82f650`, padding: '15px 20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#3b82f6', color: '#fff', padding: '8px', borderRadius: '50%' }}><MapPin size={20} /></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 'bold' }}>พิกัดปัจจุบันของคุณ</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: textColor }}>จังหวัด{userProv}</div>
                    </div>
                </div>
                <button onClick={() => setSearchTerm(userProv)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                    ดูการเตือนภัย
                </button>
            </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', flex: isMobile ? '1' : 'none', background: cardBg, borderRadius: '15px', border: `1px solid ${borderColor}`, alignItems: 'center', padding: '0 15px' }}>
                <Crosshair size={18} color={subTextColor} />
                <input 
                    type="text" 
                    placeholder="ค้นหาจังหวัด..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: isMobile ? '100%' : '200px', padding: '12px 10px', border: 'none', background: 'transparent', color: textColor, outline: 'none' }}
                />
            </div>
            <button 
                onClick={() => setShowOnlyTop10(!showOnlyTop10)}
                style={{ padding: '12px 20px', borderRadius: '15px', border: 'none', background: showOnlyTop10 ? '#ef4444' : cardBg, border: `1px solid ${showOnlyTop10 ? '#ef4444' : borderColor}`, color: showOnlyTop10 ? '#fff' : textColor, fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
            >
                {showOnlyTop10 ? 'แสดงทั้งหมด' : '🏆 ดู 10 อันดับสูงสุด'}
            </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '15px' }}>
            {[
                { label: 'วิกฤตความร้อน', icon: <ThermometerSun size={32} />, count: groupedAlerts.heat.length, color: '#ef4444' },
                { label: 'ฝุ่นเกินมาตรฐาน', icon: <ShieldAlert size={32} />, count: groupedAlerts.pm25.length, color: '#f97316' },
                { label: 'UV ระดับสูง', icon: <Sun size={32} />, count: groupedAlerts.uv.length, color: '#a855f7' },
                { label: 'ระวังฝนหนัก', icon: <CloudRain size={32} />, count: groupedAlerts.rain.length, color: '#3b82f6' }
            ].map((item, idx) => (
                <div key={idx} style={{ background: darkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', padding: '20px', borderRadius: '24px', border: `1px solid ${borderColor}`, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <div style={{ color: item.color }}>{item.icon}</div>
                    <span style={{ fontSize: '0.75rem', color: subTextColor, fontWeight: 'bold' }}>{item.label}</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: '900', color: item.color }}>{item.count} <small style={{fontSize: '0.8rem', fontWeight: 'bold'}}>จ.</small></span>
                </div>
            ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '25px' }}>
            <AlertBox title="ดัชนีความร้อน (Feels Like)" icon={<ThermometerSun size={20} />} data={groupedAlerts.heat} color="#ef4444" />
            <AlertBox title="ฝุ่น PM2.5 (คุณภาพอากาศ)" icon={<ShieldAlert size={20} />} data={groupedAlerts.pm25} color="#f97316" />
            <AlertBox title="รังสี UV (UV Index)" icon={<Sun size={20} />} data={groupedAlerts.uv} color="#a855f7" />
            <AlertBox title="โอกาสฝนตกหนัก" icon={<CloudRain size={20} />} data={groupedAlerts.rain} color="#3b82f6" />
        </div>

        {/* Windy Radar & Fire Risks */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1.2fr', gap: '20px', marginTop: '10px' }}>
            <div style={{ background: cardBg, padding: '20px', borderRadius: '24px', border: `1px solid ${borderColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h2 style={{ margin: 0, color: textColor, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={20} color="#3b82f6" /> เรดาร์สภาพอากาศสด
                    </h2>
                </div>
                <div style={{ width: '100%', height: '400px', borderRadius: '16px', overflow: 'hidden' }}>
                    <iframe width="100%" height="100%" src={`https://embed.windy.com/embed2.html?lat=13.75&lon=100.5&zoom=5&level=surface&overlay=rain&product=ecmwf&menu=&message=true&marker=true`} style={{ border: 'none' }}></iframe>
                </div>
            </div>

            <div style={{ background: cardBg, padding: '20px', borderRadius: '24px', border: `1px solid ${borderColor}` }}>
                <h2 style={{ margin: '0 0 15px 0', color: textColor, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Flame size={20} color="#ea580c" /> พื้นที่เสี่ยงไฟป่ารุนแรง
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {fireRisks.slice(0, 5).map((fire, i) => (
                        <div key={i} style={{ padding: '12px', borderRadius: '12px', background: `${fire.riskColor}10`, border: `1px solid ${fire.riskColor}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.9rem', color: fire.riskColor }}>
                                <span>จ.{fire.prov}</span>
                                <span>เสี่ยง{fire.riskLevel}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: subTextColor, marginTop: '8px', display: 'flex', gap: '10px' }}>
                                <span style={{display: 'flex', alignItems: 'center', gap: '3px'}}><Flame size={14}/> {fire.temp}°C</span>
                                <span style={{display: 'flex', alignItems: 'center', gap: '3px'}}><Droplets size={14}/> {fire.humidity}%</span>
                                <span style={{display: 'flex', alignItems: 'center', gap: '3px'}}><Wind size={14}/> {fire.windSpeed} km/h</span>
                            </div>
                        </div>
                    ))}
                    {fireRisks.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: '#22c55e', fontSize: '0.9rem' }}>✅ สถานการณ์ปกติ</div>}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}