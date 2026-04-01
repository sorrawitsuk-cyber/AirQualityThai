// src/pages/ClimatePage.jsx
import React, { useContext, useState, useEffect } from 'react';
import { WeatherContext } from '../context/WeatherContext';

export default function ClimatePage() {
  const { nationwideSummary, loading, darkMode, lastUpdateText } = useContext(WeatherContext);
  
  const [earthquakes, setEarthquakes] = useState([]);
  const [loadingQuakes, setLoadingQuakes] = useState(true);
  const [radarLayer, setRadarLayer] = useState('radar'); // radar, clouds, wind, temp

  // ธีมสีสไตล์ Glassmorphism
  const cardBg = darkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)';
  const textColor = darkMode ? '#f8fafc' : '#1e293b';
  const subTextColor = darkMode ? '#94a3b8' : '#64748b';
  const borderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  const backdropBlur = 'blur(16px)';

  // 🌍 ดึงข้อมูลแผ่นดินไหวล่าสุดจาก USGS
  useEffect(() => {
    const fetchEarthquakes = async () => {
      try {
        const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
        const data = await res.json();
        // กรองเอาเฉพาะแถบภูมิภาค SEA (พิกัดคร่าวๆ)
        const seaQuakes = data.features.filter(q => {
          const [lon, lat] = q.geometry.coordinates;
          return lat >= -10 && lat <= 30 && lon >= 90 && lon <= 120;
        }).slice(0, 5); // เอา 5 อันดับล่าสุด
        setEarthquakes(seaQuakes);
      } catch (error) {
        console.error('Error fetching earthquakes:', error);
      } finally {
        setLoadingQuakes(false);
      }
    };
    fetchEarthquakes();
  }, []);

  // 🚨 ฟังก์ชันสร้าง Nowcast อัตโนมัติจากข้อมูลเรียลไทม์
  const generateNowcastAlerts = () => {
    let alerts = [];
    if (!nationwideSummary) return alerts;

    // 1. เตือนพายุ/ฝนตกหนัก
    const heavyRain = nationwideSummary.storm.filter(s => s.rain >= 70);
    if (heavyRain.length > 0) {
      alerts.push({
        id: 'rain', icon: '⛈️', color: '#ef4444', bg: darkMode ? 'rgba(239,68,68,0.15)' : '#fee2e2', border: '#fca5a5',
        title: 'ระวังพายุฝนฟ้าคะนอง / น้ำท่วมขัง',
        desc: `พบกลุ่มฝนหนาแน่น โอกาสตกสูงกว่า 70% ในพื้นที่: ${heavyRain.map(h => 'จ.'+h.prov).join(', ')} โปรดระมัดระวังการเดินทางและน้ำรอการระบาย`
      });
    }

    // 2. เตือนวิกฤตฝุ่น
    const toxicAir = nationwideSummary.pm25.filter(s => s.val >= 150);
    if (toxicAir.length > 0) {
      alerts.push({
        id: 'pm25', icon: '🌫️', color: '#a855f7', bg: darkMode ? 'rgba(168,85,247,0.15)' : '#f3e8ff', border: '#d8b4fe',
        title: 'วิกฤตฝุ่นควันระดับอันตราย (สีม่วง/เลือดหมู)',
        desc: `ค่าฝุ่น PM2.5 เกินมาตรฐานขั้นวิกฤตในพื้นที่: ${toxicAir.map(h => 'จ.'+h.prov).join(', ')} ควรงดกิจกรรมกลางแจ้งและสวมหน้ากาก N95 ทันที`
      });
    }

    // 3. เตือนฮีทสโตรก
    const extremeHeat = nationwideSummary.heat.filter(s => s.val >= 41);
    if (extremeHeat.length > 0) {
      alerts.push({
        id: 'heat', icon: '🥵', color: '#ea580c', bg: darkMode ? 'rgba(234,88,12,0.15)' : '#ffedd5', border: '#fdba74',
        title: 'อากาศร้อนจัด เสี่ยงภัยฮีทสโตรก',
        desc: `ดัชนีความร้อนทะลุ 41°C อันตรายต่อร่างกายในพื้นที่: ${extremeHeat.map(h => 'จ.'+h.prov).join(', ')} หลีกเลี่ยงแสงแดดจัดและดื่มน้ำบ่อยๆ`
      });
    }

    return alerts;
  };

  const nowcastAlerts = generateNowcastAlerts();

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: textColor }}>กำลังโหลดข้อมูลศูนย์ภัยพิบัติ... ⏳</div>;

  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, padding: '20px', paddingBottom: window.innerWidth < 768 ? '100px' : '40px', overflowY: 'auto', overflowX: 'hidden' }} className="hide-scrollbar">
      
      {/* HEADER */}
      <div style={{ marginBottom: '25px', backgroundColor: cardBg, backdropFilter: backdropBlur, padding: '25px', borderRadius: '20px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', color: textColor, margin: '0 0 5px 0', fontWeight:'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '2.2rem' }}>🌍</span> ศูนย์เฝ้าระวังและภัยพิบัติ
            </h2>
            <p style={{ margin: 0, color: subTextColor, fontSize: '0.95rem' }}>วิเคราะห์ข้อมูลสภาพอากาศและแผ่นดินไหวแบบเรียลไทม์</p>
          </div>
          <div style={{ background: darkMode ? 'rgba(0,0,0,0.3)' : '#f1f5f9', padding: '8px 15px', borderRadius: '20px', border: `1px solid ${borderColor}`, color: subTextColor, fontSize: '0.85rem', fontWeight: 'bold' }}>
            ⏱️ อัปเดตล่าสุด: {lastUpdateText || '-'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

        {/* 🚨 1. NOWCAST ALERTS */}
        <div style={{ backgroundColor: cardBg, backdropFilter: backdropBlur, borderRadius: '20px', padding: '25px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '1.2rem', color: textColor, margin: '0 0 20px 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🚨 Nowcast ประกาศเตือนภัย (วิเคราะห์สด)
          </h3>
          
          {nowcastAlerts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {nowcastAlerts.map((alert, idx) => (
                <div key={idx} style={{ background: alert.bg, borderLeft: `6px solid ${alert.color}`, borderTop: `1px solid ${alert.border}`, borderRight: `1px solid ${alert.border}`, borderBottom: `1px solid ${alert.border}`, padding: '20px', borderRadius: '15px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '2rem' }}>{alert.icon}</div>
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: alert.color, fontSize: '1.1rem', fontWeight: 'bold' }}>{alert.title}</h4>
                    <p style={{ margin: 0, color: textColor, fontSize: '0.95rem', lineHeight: 1.5 }}>{alert.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: darkMode ? 'rgba(34,197,94,0.1)' : '#f0fdf4', border: `1px dashed ${darkMode ? '#16a34a' : '#86efac'}`, padding: '25px', borderRadius: '15px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🟢</div>
              <h4 style={{ margin: '0 0 5px 0', color: '#16a34a', fontSize: '1.1rem', fontWeight: 'bold' }}>สถานการณ์ปกติ</h4>
              <p style={{ margin: 0, color: subTextColor, fontSize: '0.95rem' }}>ขณะนี้ไม่มีพื้นที่ใดอยู่ในเกณฑ์เฝ้าระวังอันตรายขั้นวิกฤต</p>
            </div>
          )}
        </div>

        {/* 🌍 2. EARTHQUAKE & 🛰️ 3. RADAR (แบ่ง 2 คอลัมน์บนจอใหญ่) */}
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth >= 1024 ? '1fr 2fr' : '1fr', gap: '25px' }}>
          
          {/* แผ่นดินไหว */}
          <div style={{ backgroundColor: cardBg, backdropFilter: backdropBlur, borderRadius: '20px', padding: '25px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', color: textColor, margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🫨 แผ่นดินไหวล่าสุด
              </h3>
              <span style={{ fontSize: '0.7rem', color: subTextColor, background: darkMode?'#334155':'#e2e8f0', padding: '4px 8px', borderRadius: '10px' }}>USGS Data</span>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }} className="hide-scrollbar">
              {loadingQuakes ? (
                <div style={{ textAlign: 'center', color: subTextColor, padding: '20px 0' }}>กำลังดึงพิกัด...</div>
              ) : earthquakes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {earthquakes.map((quake, idx) => {
                    const mag = quake.properties.mag;
                    const isDanger = mag >= 5.0;
                    return (
                      <div key={idx} style={{ background: darkMode ? 'rgba(0,0,0,0.2)' : '#f8fafc', border: `1px solid ${isDanger ? '#ef4444' : borderColor}`, padding: '15px', borderRadius: '12px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div style={{ background: isDanger ? '#ef4444' : '#f59e0b', color: '#fff', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0 }}>
                          {mag.toFixed(1)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0 0 5px 0', color: textColor, fontSize: '0.9rem', fontWeight: 'bold', lineHeight: 1.3 }}>{quake.properties.place}</p>
                          <p style={{ margin: 0, color: subTextColor, fontSize: '0.75rem' }}>{new Date(quake.properties.time).toLocaleString('th-TH')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: subTextColor, padding: '20px 0' }}>ไม่พบแผ่นดินไหวในภูมิภาค SEA ล่าสุด</div>
              )}
            </div>
          </div>

          {/* เรดาร์ดาวเทียม */}
          <div style={{ backgroundColor: cardBg, backdropFilter: backdropBlur, borderRadius: '20px', padding: '25px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '1.2rem', color: textColor, margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🛰️ ศูนย์เฝ้าระวังดาวเทียม
              </h3>
              
              {/* ปุ่มเปลี่ยนเลเยอร์เรดาร์ */}
              <div style={{ display: 'flex', background: darkMode ? 'rgba(0,0,0,0.3)' : '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                <button onClick={() => setRadarLayer('radar')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: radarLayer === 'radar' ? '#3b82f6' : 'transparent', color: radarLayer === 'radar' ? '#fff' : subTextColor, fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>📡 เรดาร์ฝน</button>
                <button onClick={() => setRadarLayer('clouds')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: radarLayer === 'clouds' ? '#64748b' : 'transparent', color: radarLayer === 'clouds' ? '#fff' : subTextColor, fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>☁️ เมฆ</button>
                <button onClick={() => setRadarLayer('wind')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: radarLayer === 'wind' ? '#14b8a6' : 'transparent', color: radarLayer === 'wind' ? '#fff' : subTextColor, fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>🌬️ ลม</button>
                <button onClick={() => setRadarLayer('temp')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: radarLayer === 'temp' ? '#ef4444' : 'transparent', color: radarLayer === 'temp' ? '#fff' : subTextColor, fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>🌡️ อุณหภูมิ</button>
              </div>
            </div>

            <div style={{ width: '100%', height: '350px', borderRadius: '15px', overflow: 'hidden', border: `1px solid ${borderColor}`, background: '#e2e8f0' }}>
              <iframe width="100%" height="100%" src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=km/h&zoom=5&overlay=${radarLayer}&product=radar&level=surface&lat=13.5&lon=101.0`} frameBorder="0" title="Windy Radar"></iframe>
            </div>
          </div>

        </div>

        {/* 📞 4. เบอร์ติดต่อฉุกเฉิน */}
        <div style={{ backgroundColor: cardBg, backdropFilter: backdropBlur, borderRadius: '20px', padding: '25px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '1.2rem', color: textColor, margin: '0 0 20px 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            📞 สายด่วนฉุกเฉิน (ประเทศไทย)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            
            <div style={{ background: darkMode ? 'rgba(239,68,68,0.1)' : '#fee2e2', border: `1px solid ${darkMode?'#b91c1c':'#fca5a5'}`, padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ fontSize: '2rem' }}>🚑</div>
              <div>
                <h4 style={{ margin: '0 0 2px 0', color: '#ef4444', fontSize: '1.4rem', fontWeight: 'bold' }}>1669</h4>
                <p style={{ margin: 0, color: textColor, fontSize: '0.85rem' }}>เจ็บป่วยฉุกเฉิน (สพฉ.)</p>
              </div>
            </div>

            <div style={{ background: darkMode ? 'rgba(249,115,22,0.1)' : '#ffedd5', border: `1px solid ${darkMode?'#c2410c':'#fdba74'}`, padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ fontSize: '2rem' }}>🚒</div>
              <div>
                <h4 style={{ margin: '0 0 2px 0', color: '#f97316', fontSize: '1.4rem', fontWeight: 'bold' }}>1784</h4>
                <p style={{ margin: 0, color: textColor, fontSize: '0.85rem' }}>กรมป้องกันและบรรเทาสาธารณภัย</p>
              </div>
            </div>

            <div style={{ background: darkMode ? 'rgba(59,130,246,0.1)' : '#dbeafe', border: `1px solid ${darkMode?'#1d4ed8':'#93c5fd'}`, padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ fontSize: '2rem' }}>🚓</div>
              <div>
                <h4 style={{ margin: '0 0 2px 0', color: '#3b82f6', fontSize: '1.4rem', fontWeight: 'bold' }}>1193</h4>
                <p style={{ margin: 0, color: textColor, fontSize: '0.85rem' }}>ตำรวจทางหลวง</p>
              </div>
            </div>

            <div style={{ background: darkMode ? 'rgba(168,85,247,0.1)' : '#f3e8ff', border: `1px solid ${darkMode?'#7e22ce':'#d8b4fe'}`, padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ fontSize: '2rem' }}>🌳</div>
              <div>
                <h4 style={{ margin: '0 0 2px 0', color: '#a855f7', fontSize: '1.4rem', fontWeight: 'bold' }}>1362</h4>
                <p style={{ margin: 0, color: textColor, fontSize: '0.85rem' }}>แจ้งเหตุไฟป่า (กรมป่าไม้)</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}