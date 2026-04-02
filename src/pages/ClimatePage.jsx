// src/pages/ClimatePage.jsx
import React, { useContext, useState, useEffect } from 'react';
import { WeatherContext } from '../context/WeatherContext';
import { extractProvince } from '../utils/helpers';

export default function ClimatePage() {
  const { stations, stationTemps, loading, darkMode, lastUpdateText } = useContext(WeatherContext);
  
  const [alertsLocationName, setAlertsLocationName] = useState('');
  const [activeStation, setActiveStation] = useState(null);
  
  // 🌟 State สำหรับแผนที่ Windy (ค่าเริ่มต้นคือ PM2.5)
  const [windyLayer, setWindyLayer] = useState('pm2p5');

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const safeStations = stations || [];
  const provinces = [...new Set(safeStations.map(s => extractProvince(s.areaTH)))].sort((a, b) => a.localeCompare(b, 'th'));

  useEffect(() => {
    if (provinces.length > 0 && !alertsLocationName) {
      const savedStId = localStorage.getItem('lastStationId');
      if (savedStId) {
        const st = safeStations.find(s => s.stationID === savedStId);
        if (st) {
          setAlertsLocationName(extractProvince(st.areaTH));
          return;
        }
      }
      setAlertsLocationName(provinces.includes('กรุงเทพมหานคร') ? 'กรุงเทพมหานคร' : provinces[0]);
    }
  }, [provinces, alertsLocationName, safeStations]);

  useEffect(() => {
    if (safeStations.length > 0 && alertsLocationName) {
      const target = safeStations.find(s => extractProvince(s.areaTH) === alertsLocationName);
      if (target) setActiveStation(target);
    }
  }, [alertsLocationName, safeStations]);

  const bgGradient = darkMode ? '#0f172a' : '#f8fafc'; 
  const cardBg = darkMode ? 'rgba(30, 41, 59, 0.95)' : '#ffffff';
  const innerCardBg = darkMode ? 'rgba(0,0,0,0.2)' : '#f1f5f9';
  const textColor = darkMode ? '#f8fafc' : '#0f172a';
  const subTextColor = darkMode ? '#94a3b8' : '#64748b'; 
  const borderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'; 

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: bgGradient, color: textColor, fontWeight: 'bold' }}>กำลังโหลดข้อมูล... ⏳</div>;

  // ดึงข้อมูล Real-time ของสถานีที่เลือก
  const pmVal = activeStation?.AQILast?.PM25?.value ? Number(activeStation.AQILast.PM25.value) : null;
  const tObj = activeStation ? stationTemps[activeStation.stationID] : {};
  const tempVal = tObj?.temp != null ? Math.round(tObj.temp) : '-';
  const heatVal = tObj?.feelsLike != null ? Math.round(tObj.feelsLike) : '-';
  const rainProb = tObj?.rainProb != null ? Math.round(tObj.rainProb) : 0;
  const windVal = tObj?.windSpeed != null ? Math.round(tObj.windSpeed) : 0;
  
  // จำลองความกดอากาศ (แปรผันตามอุณหภูมิและโอกาสฝน)
  const pressureVal = tempVal !== '-' ? Math.round(1013 - (tempVal - 30) * 0.5 - (rainProb > 50 ? 5 : 0)) : 1010;

  // 🌟 1. ระบบสร้างการแจ้งเตือนอัตโนมัติ (Dynamic Alerts)
  const generateAlerts = () => {
    const alerts = [];
    
    if (pmVal >= 75) alerts.push({ id: 1, type: 'danger', icon: '🚨', title: 'วิกฤตฝุ่น PM2.5 รุนแรง', desc: `ค่าฝุ่นพุ่งสูงถึง ${pmVal} µg/m³ งดกิจกรรมกลางแจ้งเด็ดขาด และสวมหน้ากาก N95 ตลอดเวลา`, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' });
    else if (pmVal >= 37.5) alerts.push({ id: 2, type: 'warning', icon: '⚠️', title: 'คุณภาพอากาศเริ่มมีผลกระทบ', desc: `ฝุ่น PM2.5 อยู่ที่ ${pmVal} µg/m³ ผู้สูงอายุและเด็กควรจำกัดเวลาอยู่กลางแจ้ง`, color: '#f97316', bg: 'rgba(249,115,22,0.1)' });

    if (heatVal >= 41) alerts.push({ id: 3, type: 'danger', icon: '🔥', title: 'เตือนภัยฮีทสโตรก (ลมแดด)', desc: `ดัชนีความร้อนพุ่งแตะ ${heatVal}°C หลีกเลี่ยงการทำงานกลางแดดจัด อาจเป็นอันตรายถึงชีวิต`, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' });
    else if (heatVal >= 35) alerts.push({ id: 4, type: 'warning', icon: '☀️', title: 'เฝ้าระวังอากาศร้อนจัด', desc: `ดัชนีความร้อน ${heatVal}°C ควรจิบน้ำบ่อยๆ และสวมเสื้อผ้าที่ระบายอากาศได้ดี`, color: '#f97316', bg: 'rgba(249,115,22,0.1)' });

    if (rainProb >= 70) alerts.push({ id: 5, type: 'info', icon: '⛈️', title: 'ระวังพายุฝนฟ้าคะนอง', desc: `โอกาสเกิดฝนตกสูงถึง ${rainProb}% เตรียมร่ม และระวังอันตรายจากลมกระโชกแรง`, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' });

    return alerts;
  };
  const activeAlerts = generateAlerts();

  // 🌟 2. ข่าวสารจากหน่วยงาน (Official News Mockup)
  const officialNews = [
    { id: 1, source: 'กรมอุตุนิยมวิทยา (TMD)', time: 'อัปเดต 2 ชม. ที่แล้ว', title: 'ประกาศเข้าสู่ฤดูร้อนอย่างเป็นทางการ', desc: 'ประเทศไทยคาดว่าจะมีอุณหภูมิสูงขึ้นอย่างต่อเนื่อง โดยเฉพาะภาคเหนือและภาคกลาง ขอให้ประชาชนระวังสุขภาพ' },
    { id: 2, source: 'GISTDA', time: 'อัปเดต 4 ชม. ที่แล้ว', title: 'รายงานจุดความร้อน (Hotspot) วันนี้', desc: 'ดาวเทียมตรวจพบจุดความร้อนกระจายตัวในบริเวณภาคเหนือและประเทศเพื่อนบ้าน ส่งผลให้ฝุ่นควันถูกพัดพาเข้าสู่ตอนกลางของประเทศ' },
    { id: 3, source: 'กระทรวงสาธารณสุข', time: 'เมื่อวานนี้', title: 'วิธีปฐมพยาบาลเบื้องต้นเมื่อพบผู้ป่วยฮีทสโตรก', desc: 'รีบนำเข้าที่ร่ม คลายเสื้อผ้า ใช้ผ้าชุบน้ำอุณหภูมิห้องเช็ดตัว และหากหมดสติให้รีบโทร 1669 ทันที' },
  ];

  // พิกัดสำหรับแผนที่ Windy
  const lat = activeStation ? parseFloat(activeStation.lat) : 13.75;
  const lon = activeStation ? parseFloat(activeStation.long) : 100.50;

  return (
    <div style={{ height: '100%', width: '100%', padding: isMobile ? '12px' : '30px', paddingBottom: isMobile ? '100px' : '40px', display: 'flex', flexDirection: 'column', gap: isMobile ? '15px' : '20px', boxSizing: 'border-box', overflowY: 'auto', overflowX: 'hidden', background: bgGradient, fontFamily: 'Kanit, sans-serif' }} className="hide-scrollbar">
      
      {/* 🟢 HEADER */}
      {!isMobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: textColor, margin: 0, fontWeight: '800' }}>🚨 ศูนย์เตือนภัย & ข่าวสาร</h1>
            <p style={{ margin: '2px 0 0 0', color: subTextColor, fontSize: '0.95rem' }}>ติดตามสถานการณ์ฉุกเฉินและเรดาร์สภาพอากาศ</p>
          </div>
          <div style={{ background: innerCardBg, padding: '6px 12px', borderRadius: '12px', color: subTextColor, fontSize: '0.75rem', fontWeight: 'bold', border: `1px solid ${borderColor}` }}>
            ⏱️ ข้อมูลล่าสุด: {lastUpdateText || '-'}
          </div>
        </div>
      )}

      {/* 📍 ตัวกรองพื้นที่ (แถวเดียวมินิมอล) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: cardBg, padding: '8px 15px', borderRadius: '14px', border: `1px solid ${borderColor}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', flexShrink: 0 }}>
        <span style={{ fontSize: '1.1rem' }}>📍 พื้นที่ติดตาม:</span>
        <select value={alertsLocationName} onChange={(e) => setAlertsLocationName(e.target.value)} style={{ flex: 1, background: 'transparent', color: '#0ea5e9', border: 'none', fontWeight: '900', fontSize: '1.05rem', outline: 'none', cursor: 'pointer', appearance: 'none', textOverflow: 'ellipsis' }}>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span style={{ color: subTextColor, fontSize: '0.8rem' }}>▼</span>
      </div>

      {/* 🌟🌟 1. โซนประกาศเตือนภัยฉุกเฉิน (Top Priority) 🌟🌟 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
        {activeAlerts.length > 0 ? (
          activeAlerts.map(alert => (
            <div key={alert.id} style={{ display: 'flex', gap: '15px', background: alert.bg, border: `1px solid ${alert.color}50`, padding: '15px', borderRadius: '16px', alignItems: 'flex-start', animation: alert.type === 'danger' ? 'pulse 2s infinite' : 'none' }}>
              <div style={{ fontSize: '2rem', lineHeight: 1 }}>{alert.icon}</div>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: alert.color, fontSize: '1rem', fontWeight: 'bold' }}>{alert.title}</h3>
                <p style={{ margin: 0, color: textColor, fontSize: '0.85rem', lineHeight: 1.5 }}>{alert.desc}</p>
              </div>
            </div>
          ))
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(34, 197, 94, 0.1)', border: `1px solid rgba(34, 197, 94, 0.3)`, padding: '15px', borderRadius: '16px' }}>
            <span style={{ fontSize: '1.8rem' }}>✅</span>
            <div>
              <h3 style={{ margin: '0 0 2px 0', color: '#22c55e', fontSize: '1rem', fontWeight: 'bold' }}>สถานการณ์ปกติ (All Clear)</h3>
              <p style={{ margin: 0, color: subTextColor, fontSize: '0.85rem' }}>ขณะนี้ไม่มีประกาศเตือนภัยร้ายแรงในพื้นที่ {alertsLocationName} สภาพอากาศปลอดภัยสำหรับการใช้ชีวิตประจำวันครับ</p>
            </div>
          </div>
        )}
      </div>

      {/* 🌟🌟 2. สรุป Nowcast (Dynamic 100%) 🌟🌟 */}
      <div style={{ background: cardBg, padding: '20px', borderRadius: '20px', border: `1px solid ${borderColor}`, flexShrink: 0 }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.05rem', color: textColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⏱️ สรุปสถานการณ์ ณ ปัจจุบัน (Nowcast)
        </h3>
        <p style={{ margin: 0, color: textColor, fontSize: '0.9rem', lineHeight: 1.8, background: innerCardBg, padding: '15px', borderRadius: '12px' }}>
          ขณะนี้ในพื้นที่ <strong>{alertsLocationName}</strong> อุณหภูมิอยู่ที่ <strong>{tempVal}°C</strong> โดยให้ความรู้สึกเหมือน <strong>{heatVal}°C</strong> 
          ระดับฝุ่นละออง PM2.5 ตรวจวัดได้ <strong>{pmVal || '-'} µg/m³</strong> โอกาสเกิดฝน <strong>{rainProb}%</strong> ความเร็วลม <strong>{windVal} km/h</strong> 
          และความกดอากาศบริเวณพื้นผิวอยู่ที่ <strong>{pressureVal} hPa</strong> {pressureVal < 1008 ? '(สภาพอากาศกดต่ำ อาจมีฝนหรือพายุ)' : '(สภาพอากาศค่อนข้างทรงตัว)'}
        </p>
      </div>

      {/* 🌟🌟 3. เรดาร์ Windy & โหมดแผนที่ 🌟🌟 */}
      <div style={{ background: cardBg, padding: isMobile ? '15px' : '20px', borderRadius: '20px', border: `1px solid ${borderColor}`, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: textColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🛰️ เรดาร์ตรวจอากาศ (Windy)
          </h3>
          
          {/* ปุ่มสลับโหมด Windy */}
          <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', width: '100%', paddingBottom: '5px' }} className="hide-scrollbar">
            {[
              { id: 'wind', label: 'ลม', icon: '🌬️' },
              { id: 'pm2p5', label: 'ฝุ่น', icon: '😷' },
              { id: 'rain', label: 'ฝนฟ้าผ่า', icon: '⛈️' },
              { id: 'clouds', label: 'เมฆ', icon: '☁️' },
              { id: 'pressure', label: 'ความกดอากาศ', icon: '🌡️' }
            ].map(layer => (
              <button 
                key={layer.id} onClick={() => setWindyLayer(layer.id)}
                style={{ 
                  background: windyLayer === layer.id ? '#0ea5e9' : innerCardBg, 
                  color: windyLayer === layer.id ? '#fff' : subTextColor,
                  border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0
                }}>
                {layer.icon} {layer.label}
              </button>
            ))}
          </div>
        </div>

        {/* Windy iframe */}
        <div style={{ height: isMobile ? '350px' : '450px', width: '100%', borderRadius: '14px', overflow: 'hidden', background: '#e2e8f0', position: 'relative' }}>
          <iframe 
            width="100%" height="100%" 
            src={`https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=650&height=450&zoom=6&level=surface&overlay=${windyLayer}&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`} 
            frameBorder="0" title="Windy Map"
          ></iframe>
        </div>
      </div>

      {/* 🌟🌟 4. ข่าวสารจากหน่วยงานรัฐ (Official Feed) เลื่อนลงมาอ่านด้านล่าง 🌟🌟 */}
      <div style={{ flexShrink: 0 }}>
        <h3 style={{ fontSize: '1.05rem', color: textColor, fontWeight: 'bold', margin: '10px 0 15px 5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📰 ข่าวสารจากหน่วยงานที่เกี่ยวข้อง
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {officialNews.map(news => (
            <div key={news.id} style={{ background: cardBg, padding: '20px', borderRadius: '16px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>{news.source}</span>
                <span style={{ fontSize: '0.75rem', color: subTextColor }}>⏱️ {news.time}</span>
              </div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: textColor }}>{news.title}</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: subTextColor, lineHeight: 1.6 }}>{news.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* สไตล์สำหรับอนิเมชันกระพริบ */}
      <style dangerouslySetInlineStyle={{__html: `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}} />
    </div>
  );
}