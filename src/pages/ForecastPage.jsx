// src/pages/ForecastPage.jsx
import React, { useContext, useState, useEffect } from 'react';
import { WeatherContext } from '../context/WeatherContext';
import { extractProvince, getPM25Color, getTempColor } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ForecastPage() {
  const { stations, stationTemps, loading, darkMode, lastUpdateText } = useContext(WeatherContext);
  
  const [alertsLocationName, setAlertsLocationName] = useState('');
  const [activeStation, setActiveStation] = useState(null);
  const [aiSummaryJson, setAiSummaryJson] = useState(null);
  const [activeAiTopic, setActiveAiTopic] = useState('summary');
  const [isGenerating, setIsGenerating] = useState(false);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🌟 รายชื่อจังหวัดทั้งหมดสำหรับ Dropdown
  const provinces = [...new Set((stations || []).map(s => extractProvince(s.areaTH)))].sort((a, b) => a.localeCompare(b, 'th'));

  // 🌟 ตั้งค่าเริ่มต้นเป็นกรุงเทพฯ หากยังไม่ได้เลือก
  useEffect(() => {
    if (provinces.length > 0 && !alertsLocationName) {
      setAlertsLocationName(provinces.includes('กรุงเทพมหานคร') ? 'กรุงเทพมหานคร' : provinces[0]);
    }
  }, [provinces, alertsLocationName]);

  // 🌟 อัปเดตข้อมูลสถานีเมื่อเปลี่ยนจังหวัด
  useEffect(() => {
    if (stations && alertsLocationName) {
      const target = stations.find(s => extractProvince(s.areaTH) === alertsLocationName);
      if (target) setActiveStation(target);
    }
  }, [alertsLocationName, stations]);

  // 🌟 ฟังก์ชันจำลองการเรียก AI (คุณสามารถแก้โค้ดตรงนี้ให้ต่อกับ API AI ของคุณได้เลยครับ)
  const handleGenerateAI = () => {
    setIsGenerating(true);
    // จำลองเวลาโหลด
    setTimeout(() => {
      setAiSummaryJson({
        summary: `ภาพรวมสภาพอากาศใน ${alertsLocationName} วันนี้ คุณภาพอากาศและระดับฝุ่นละอองมีการเปลี่ยนแปลง ควรติดตามอย่างใกล้ชิด อุณหภูมิอยู่ในระดับที่รู้สึกได้ถึงความร้อนในช่วงบ่าย`,
        health: `ผู้ที่แพ้ฝุ่นควรสวมหน้ากากอนามัยเมื่อออกนอกอาคาร และหลีกเลี่ยงการทำกิจกรรมกลางแจ้งเป็นเวลานานหากรู้สึกอึดอัด หรือมีอาการระคายเคืองคอ`,
        recommendation: `แนะนำให้เปิดเครื่องฟอกอากาศเมื่ออยู่ในบ้าน ดื่มน้ำให้เพียงพอตลอดวัน และพกหน้ากากอนามัยติดตัวเสมอเมื่อต้องเดินทาง`
      });
      setIsGenerating(false);
    }, 1500);
  };

  const bgGradient = darkMode ? '#0f172a' : '#f8fafc'; 
  const cardBg = darkMode ? 'rgba(30, 41, 59, 0.95)' : '#ffffff';
  const innerCardBg = darkMode ? 'rgba(0,0,0,0.2)' : '#f1f5f9';
  const textColor = darkMode ? '#f8fafc' : '#0f172a';
  const subTextColor = darkMode ? '#94a3b8' : '#64748b'; 
  const borderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'; 

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: bgGradient, color: textColor, fontWeight: 'bold' }}>กำลังโหลดข้อมูล... ⏳</div>;

  const pmVal = activeStation && activeStation.AQILast && activeStation.AQILast.PM25 ? Number(activeStation.AQILast.PM25.value) : null;
  const tObj = activeStation ? stationTemps[activeStation.stationID] : null;
  const tempVal = tObj ? tObj.temp : null;
  const heatVal = tObj ? tObj.feelsLike : null;
  const humidityVal = tObj && tObj.humidity != null ? tObj.humidity : '-';
  const pmBg = getPM25Color(pmVal);
  const pmTextColor = (pmBg === '#ffff00' || pmBg === '#00e400') ? '#222' : '#fff';

  return (
    <div style={{ background: bgGradient, minHeight: '100%', width: '100%', padding: isMobile ? '12px' : '30px', paddingBottom: isMobile ? '100px' : '40px', display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '20px', boxSizing: 'border-box', overflowY: 'auto', overflowX: 'hidden', fontFamily: 'Kanit, sans-serif' }} className="hide-scrollbar">
      
      {/* 🟢 HEADER */}
      <div style={{ display: 'flex', justifyContent: isMobile ? 'flex-end' : 'space-between', alignItems: 'center' }}>
        {!isMobile && (
          <div>
            <h1 style={{ fontSize: '2rem', color: textColor, margin: 0, fontWeight: '800' }}>✨ AI ผู้ช่วยอัจฉริยะ</h1>
            <p style={{ margin: '2px 0 0 0', color: subTextColor, fontSize: '0.95rem' }}>วิเคราะห์สภาพอากาศและสุขภาพเชิงลึก</p>
          </div>
        )}
        <div style={{ background: innerCardBg, padding: '6px 12px', borderRadius: '12px', color: subTextColor, fontSize: '0.75rem', fontWeight: 'bold', border: `1px solid ${borderColor}` }}>
          ⏱️ อัปเดต: {lastUpdateText || '-'}
        </div>
      </div>

      {/* 📍 ตัวเลือกสถานที่ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: cardBg, padding: '10px 15px', borderRadius: '16px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <span style={{ fontSize: '1.2rem' }}>📍</span>
        <select value={alertsLocationName} onChange={(e) => { setAlertsLocationName(e.target.value); setAiSummaryJson(null); setActiveAiTopic('summary'); }} style={{ flex: 1, background: 'transparent', color: textColor, border: 'none', fontWeight: 'bold', fontSize: '1rem', outline: 'none', cursor: 'pointer', appearance: 'none', textOverflow: 'ellipsis' }}>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span style={{ color: subTextColor, fontSize: '0.8rem' }}>▼</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 🌟 1. AI HERO SECTION (อยู่บนสุด เด่นสุด) */}
        <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', padding: '2px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(139, 92, 246, 0.2)' }}>
          <div style={{ background: cardBg, borderRadius: '22px', padding: isMobile ? '20px' : '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', color: textColor, margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>✨</span> บทวิเคราะห์ AI ({alertsLocationName})
              </h2>
              {!aiSummaryJson && !isGenerating && (
                <button onClick={handleGenerateAI} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)' }}>
                  เริ่มวิเคราะห์
                </button>
              )}
            </div>

            {isGenerating ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: subTextColor, background: innerCardBg, borderRadius: '16px', border: `1px dashed ${borderColor}` }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px', animation: 'spin 2s linear infinite' }}>⏳</div>
                <div style={{ fontWeight: 'bold' }}>AI กำลังประมวลผลข้อมูล...</div>
                <div style={{ fontSize: '0.8rem' }}>กรุณารอสักครู่ครับ</div>
              </div>
            ) : aiSummaryJson ? (
              <>
                {/* ปุ่มสลับหัวข้อ AI */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }} className="hide-scrollbar">
                  <button onClick={() => setActiveAiTopic('summary')} style={{ padding: '6px 12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', background: activeAiTopic === 'summary' ? '#8b5cf6' : innerCardBg, color: activeAiTopic === 'summary' ? '#fff' : subTextColor, transition: 'all 0.2s' }}>📝 ภาพรวม</button>
                  <button onClick={() => setActiveAiTopic('health')} style={{ padding: '6px 12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', background: activeAiTopic === 'health' ? '#ef4444' : innerCardBg, color: activeAiTopic === 'health' ? '#fff' : subTextColor, transition: 'all 0.2s' }}>🏥 สุขภาพ</button>
                  <button onClick={() => setActiveAiTopic('recommendation')} style={{ padding: '6px 12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', background: activeAiTopic === 'recommendation' ? '#10b981' : innerCardBg, color: activeAiTopic === 'recommendation' ? '#fff' : subTextColor, transition: 'all 0.2s' }}>💡 คำแนะนำ</button>
                </div>
                
                {/* กล่องข้อความ AI */}
                <div style={{ background: innerCardBg, padding: '20px', borderRadius: '16px', border: `1px solid ${borderColor}`, fontSize: '0.95rem', color: textColor, lineHeight: '1.6' }}>
                  {aiSummaryJson[activeAiTopic]}
                </div>
              </>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: subTextColor, background: innerCardBg, borderRadius: '16px', border: `1px dashed ${borderColor}`, fontSize: '0.9rem' }}>
                กดปุ่ม "เริ่มวิเคราะห์" เพื่อให้ AI ช่วยสรุปสภาพอากาศและให้คำแนะนำแบบเฉพาะเจาะจงครับ
              </div>
            )}
          </div>
        </div>

        {/* 🌟 2. MINI METRICS (การ์ดเล็กจิ๋วสุดๆ เรียง 4 ช่อง) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          
          <div style={{ background: pmBg, borderRadius: '16px', padding: '12px 5px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: pmTextColor, opacity: 0.9 }}>PM2.5</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: pmTextColor, lineHeight: 1.2 }}>{pmVal != null && !isNaN(pmVal) ? pmVal : '-'}</div>
          </div>
          
          <div style={{ background: cardBg, borderRadius: '16px', padding: '12px 5px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: `1px solid ${borderColor}`, boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: subTextColor }}>อุณหภูมิ</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: textColor, lineHeight: 1.2 }}>{tempVal ? Math.round(tempVal) : '-'}°</div>
          </div>

          <div style={{ background: cardBg, borderRadius: '16px', padding: '12px 5px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: `1px solid ${borderColor}`, boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: subTextColor }}>ดัชนีร้อน</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: heatVal >= 41 ? '#ef4444' : textColor, lineHeight: 1.2 }}>{heatVal ? Math.round(heatVal) : '-'}°</div>
          </div>

          <div style={{ background: cardBg, borderRadius: '16px', padding: '12px 5px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: `1px solid ${borderColor}`, boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: subTextColor }}>ความชื้น</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: textColor, lineHeight: 1.2 }}>{humidityVal}%</div>
          </div>

        </div>

        {/* 🌟 3. ข้อมูลสถิติเชิงลึก (ไล่ลงมาด้านล่าง) */}
        <div style={{ background: cardBg, borderRadius: '24px', padding: '20px', border: `1px solid ${borderColor}`, boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '1rem', color: textColor, fontWeight: 'bold', margin: '0 0 15px 0' }}>📊 ข้อมูลพื้นฐานจุดตรวจวัด</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
             <div style={{ background: innerCardBg, padding: '12px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
               <div style={{ fontSize: '0.75rem', color: subTextColor }}>มาตรฐาน PM2.5 (ไทย)</div>
               <div style={{ fontSize: '1rem', fontWeight: 'bold', color: textColor }}>{pmVal || '-'} µg/m³</div>
             </div>
             <div style={{ background: innerCardBg, padding: '12px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
               <div style={{ fontSize: '0.75rem', color: subTextColor }}>อุณหภูมิต่ำสุด-สูงสุด</div>
               <div style={{ fontSize: '1rem', fontWeight: 'bold', color: textColor }}>{tObj && tObj.tempMin ? Math.round(tObj.tempMin) : '-'}° - {tObj && tObj.tempMax ? Math.round(tObj.tempMax) : '-'}°</div>
             </div>
             <div style={{ background: innerCardBg, padding: '12px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
               <div style={{ fontSize: '0.75rem', color: subTextColor }}>โอกาสเกิดฝน</div>
               <div style={{ fontSize: '1rem', fontWeight: 'bold', color: textColor }}>{tObj && tObj.rainProb != null ? Math.round(tObj.rainProb) : '-'}%</div>
             </div>
             <div style={{ background: innerCardBg, padding: '12px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
               <div style={{ fontSize: '0.75rem', color: subTextColor }}>ความเร็วลมสูงสุด</div>
               <div style={{ fontSize: '1rem', fontWeight: 'bold', color: textColor }}>{tObj && tObj.windMax != null ? Math.round(tObj.windMax) : '-'} km/h</div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}