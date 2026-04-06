// src/pages/AIPage.jsx
import React, { useContext, useState, useEffect, useMemo } from 'react';
import { WeatherContext } from '../context/WeatherContext';

export default function AIPage() {
  const { stations, weatherData, fetchWeatherByCoords, loadingWeather, darkMode } = useContext(WeatherContext);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [locationName, setLocationName] = useState('กรุงเทพมหานคร');
  const [selectedProv, setSelectedProv] = useState('');
  const [targetDateIdx, setTargetDateIdx] = useState(0); 
  const [activeTab, setActiveTab] = useState('summary'); 
  const [showFilters, setShowFilters] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setShowFilters(true);
    };
    window.addEventListener('resize', handleResize);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        setLocationName('ตำแหน่งปัจจุบัน');
      }, null, { timeout: 5000 });
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchWeatherByCoords]);

  const generateAIReport = () => {
    if (!weatherData || !weatherData.daily) return null;
    const daily = weatherData.daily;
    const tMax = Math.round(daily.temperature_2m_max[targetDateIdx] || 0);
    const rain = daily.precipitation_probability_max[targetDateIdx] || 0;
    const pm25 = daily.pm25_max ? Math.round(daily.pm25_max[targetDateIdx] || 0) : (weatherData.current?.pm25 || 0);
    
    let report = { score: 10, title: '', text: '', icon: '', timeline: [] };
    if (rain > 70) report.score -= 4; else if (rain > 40) report.score -= 2;
    if (tMax > 38) report.score -= 3; else if (tMax > 35) report.score -= 1;
    if (pm25 > 75) report.score -= 4; else if (pm25 > 37.5) report.score -= 2;
    if (report.score < 1) report.score = 1;

    const dateName = targetDateIdx === 0 ? 'วันนี้' : targetDateIdx === 1 ? 'พรุ่งนี้' : `วันที่ +${targetDateIdx}`;
    
    const contents = {
        summary: { title: `สรุปภาพรวม ${dateName}`, icon: '📋', morning: 'อากาศสดชื่น เริ่มต้นวันได้ดี', afternoon: tMax > 36 ? 'ร้อนจัด เลี่ยงกิจกรรมแดดจ้า' : 'ท้องฟ้าโปร่ง เดินทางสะดวก', evening: rain > 40 ? 'ระวังฝนตกช่วงค่ำ พกร่มด้วย' : 'อากาศเย็นลง พักผ่อนสบาย' },
        travel: { title: 'วางแผนท่องเที่ยว', icon: '🎒', morning: 'เตรียมเสื้อผ้าสีอ่อน ระบายอากาศดี', afternoon: 'แดดแรงมาก อย่าลืมครีมกันแดด', evening: 'แสงสวย เหมาะกับการถ่ายรูป' },
        health: { title: 'สุขภาพ & กีฬา', icon: '🏃‍♂️', morning: pm25 > 50 ? 'ฝุ่นเยอะ งดวิ่งกลางแจ้ง' : 'อากาศดี เหมาะกับการวิ่งเช้า', afternoon: 'เสี่ยงฮีทสโตรก ดื่มน้ำบ่อยๆ', evening: 'ยืดเหยียดกล้ามเนื้อในร่ม' },
        driving: { title: 'วิเคราะห์การขับขี่', icon: '🚘', morning: 'ทัศนวิสัยดี ถนนแห้ง ขับขี่ปลอดภัย', afternoon: 'ระวังแสงแดดสะท้อนเข้าตา', evening: rain > 50 ? 'ถนนลื่น ลดความเร็วทิ้งระยะห่าง' : 'การจราจรปกติ' },
        home: { title: 'งานบ้าน', icon: '🧺', morning: 'เริ่มซักผ้าได้เลย แดดกำลังมา', afternoon: rain > 40 ? 'รีบเก็บผ้า ฝนอาจตกกะทันหัน' : 'ตากผ้านวมได้ แห้งไว', evening: 'ปิดหน้าต่างกันฝุ่นเข้าบ้าน' },
        farm: { title: 'การเกษตร', icon: '🌾', morning: 'เหมาะกับการฉีดพ่นปุ๋ย', afternoon: 'หยุดรดน้ำช่วงแดดจัด ป้องกันรากไหม้', evening: 'รดน้ำให้ชุ่มชื่นรับวันถัดไป' }
    };

    const current = contents[activeTab] || contents.summary;
    report.title = current.title;
    report.icon = current.icon;
    report.text = report.score >= 7 ? `สภาพอากาศโดยรวมดีค่ะ` : `มีข้อควรระวังในบางช่วงเวลานะคะ`;
    report.timeline = [
        { label: 'เช้า', time: '06:00-12:00', icon: '🌅', text: current.morning },
        { label: 'บ่าย', time: '12:00-18:00', icon: '☀️', text: current.afternoon },
        { label: 'ค่ำ', time: '18:00+', icon: '🌙', text: current.evening }
    ];
    return report;
  };

  const aiReport = useMemo(() => generateAIReport(), [activeTab, targetDateIdx, weatherData, locationName]);

  const tabConfigs = [
    { id: 'summary', icon: '📋', label: 'ภาพรวม', color: '#8b5cf6' },
    { id: 'travel', icon: '🎒', label: 'ท่องเที่ยว', color: '#ec4899' },
    { id: 'health', icon: '🏃‍♂️', label: 'สุขภาพ', color: '#22c55e' },
    { id: 'driving', icon: '🚘', label: 'ขับขี่', color: '#f97316' },
    { id: 'home', icon: '🧺', label: 'งานบ้าน', color: '#0ea5e9' },
    { id: 'farm', icon: '🌾', label: 'เกษตร', color: '#10b981' }
  ];

  const appBg = darkMode ? '#020617' : '#f8fafc'; 
  const cardBg = darkMode ? '#0f172a' : '#ffffff';
  const textColor = darkMode ? '#f8fafc' : '#0f172a'; 
  const borderColor = darkMode ? '#1e293b' : '#e2e8f0';
  const subTextColor = darkMode ? '#94a3b8' : '#64748b'; 
  const activeColor = tabConfigs.find(t => t.id === activeTab)?.color || '#8b5cf6';

  if (loadingWeather || !weatherData) return <div style={{ height: '100vh', background: appBg, display: 'flex', justifyContent: 'center', alignItems: 'center', color: textColor }}>🤖 AI กำลังประมวลผล...</div>;

  return (
    /* 🌟 ปรับ Container หลักให้ Scroll ได้ลื่นไหลบนมือถือ */
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      background: appBg, 
      display: 'flex', 
      justifyContent: 'center', 
      overflowY: 'auto', // เปิด Scroll แนวตั้ง
      WebkitOverflowScrolling: 'touch', // ทำให้ Scroll ลื่นใน iOS
      fontFamily: 'Kanit, sans-serif' 
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '1100px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px', 
        padding: isMobile ? '15px' : '30px', 
        paddingBottom: '120px' // 🌟 เว้นที่ไว้ให้เมนู Tab ด้านล่างไม่บังเนื้อหา
      }}>

        {/* 1. FILTER SECTION */}
        <div style={{ background: cardBg, borderRadius: '24px', padding: '15px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', color: textColor }}>📍 {locationName}</h3>
                {isMobile && <button onClick={() => setShowFilters(!showFilters)} style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9', border: 'none', padding: '6px 12px', borderRadius: '50px', fontWeight: 'bold', fontSize: '0.75rem' }}>{showFilters ? '▲ ปิด' : '▼ ตั้งค่า'}</button>}
            </div>
            {showFilters && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <select value={selectedProv} onChange={(e) => { setSelectedProv(e.target.value); setLocationName(e.target.value); }} style={{ padding: '8px', borderRadius: '10px', background: darkMode ? '#1e293b' : '#f1f5f9', color: textColor, border: 'none', fontSize: '0.85rem' }}>
                            <option value="">เลือกจังหวัด</option>
                            {stations.map(s => <option key={s.stationID} value={s.areaTH}>{s.areaTH}</option>)}
                        </select>
                        <button onClick={() => { if(navigator.geolocation) navigator.geolocation.getCurrentPosition(p => fetchWeatherByCoords(p.coords.latitude, p.coords.longitude))}} style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '8px', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.85rem' }}>ใช้ GPS</button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }} className="hide-scrollbar">
                        {[0,1,2,3,4,5,6].map(idx => (
                            <button key={idx} onClick={() => setTargetDateIdx(idx)} style={{ flexShrink: 0, padding: '8px 12px', borderRadius: '10px', border: `1px solid ${targetDateIdx === idx ? activeColor : borderColor}`, background: targetDateIdx === idx ? activeColor : 'transparent', color: targetDateIdx === idx ? '#fff' : textColor, fontSize: '0.75rem', fontWeight: 'bold' }}>
                                {idx === 0 ? 'วันนี้' : idx === 1 ? 'พรุ่งนี้' : `+${idx}`}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* 2. MAIN LAYOUT */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '15px' }}>
            
            {/* TABS (Mobile: แนวนอน | Desktop: แนวตั้ง) */}
            <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'row' : 'column', 
                gap: '8px', 
                width: isMobile ? '100%' : '220px',
                overflowX: isMobile ? 'auto' : 'visible'
            }} className="hide-scrollbar">
                {tabConfigs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '15px', border: 'none',
                            background: isActive ? (darkMode ? `${tab.color}30` : `${tab.color}15`) : (darkMode ? '#1e293b' : '#f8fafc'),
                            color: isActive ? (darkMode ? '#fff' : tab.color) : subTextColor,
                            fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', width: isMobile ? 'auto' : '100%'
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
                            <span style={{ fontSize: '0.85rem' }}>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* AI REPORT BOX (เลื่อนขึ้นมาอันดับต้นๆ) */}
            <div style={{ flex: 1, background: cardBg, borderRadius: '24px', padding: isMobile ? '20px' : '30px', border: `1px solid ${borderColor}`, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: textColor }}>{aiReport?.icon} {aiReport?.title}</h2>
                    <div style={{ background: darkMode ? '#1e293b' : '#f8fafc', padding: '8px 12px', borderRadius: '15px', border: `1px solid ${borderColor}` }}>
                        <span style={{ fontSize: '1rem', fontWeight: '900', color: activeColor }}>{aiReport?.score}/10</span>
                    </div>
                </div>

                <div style={{ padding: '15px', background: `${activeColor}10`, borderRadius: '15px', borderLeft: `4px solid ${activeColor}`, marginBottom: '20px' }}>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: textColor, lineHeight: 1.5 }}>{aiReport?.text}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {aiReport?.timeline.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: activeColor }}></div>
                                {i < 2 && <div style={{ width: '1px', flex: 1, background: borderColor }}></div>}
                            </div>
                            <div style={{ flex: 1, background: darkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', padding: '12px', borderRadius: '15px', border: `1px solid ${borderColor}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: activeColor }}>{item.icon} {item.label}</span>
                                    <span style={{ fontSize: '0.7rem', color: subTextColor }}>{item.time}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: textColor }}>{item.text}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}