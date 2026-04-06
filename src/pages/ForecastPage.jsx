// src/pages/AIPage.jsx
import React, { useContext, useState, useEffect, useMemo } from 'react';
import { WeatherContext } from '../context/WeatherContext';

export default function AIPage() {
  const { stations, weatherData, fetchWeatherByCoords, loadingWeather, darkMode } = useContext(WeatherContext);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [locationName, setLocationName] = useState('กรุงเทพมหานคร'); // Default เพื่อกันโหลดนาน
  const [geoData, setGeoData] = useState([]);
  const [selectedProv, setSelectedProv] = useState('');
  const [selectedDist, setSelectedDist] = useState('');
  const [targetDateIdx, setTargetDateIdx] = useState(0); 
  const [activeTab, setActiveTab] = useState('summary'); 
  const [showFilters, setShowFilters] = useState(window.innerWidth >= 1024);

  // 🌟 AI Logic Engine แบบละเอียด (Timeline + Scoring)
  const generateAIReport = () => {
    if (!weatherData || !weatherData.daily) return null;
    const daily = weatherData.daily;
    const tMax = Math.round(daily.temperature_2m_max[targetDateIdx] || 0);
    const tMin = Math.round(daily.temperature_2m_min[targetDateIdx] || 0);
    const rain = daily.precipitation_probability_max[targetDateIdx] || 0;
    const pm25 = daily.pm25_max ? Math.round(daily.pm25_max[targetDateIdx] || 0) : (weatherData.current?.pm25 || 0);
    
    let report = { score: 10, title: '', text: '', icon: '', timeline: [] };
    if (rain > 70) report.score -= 4; else if (rain > 40) report.score -= 2;
    if (tMax > 38) report.score -= 3; else if (tMax > 35) report.score -= 1;
    if (pm25 > 75) report.score -= 4; else if (pm25 > 37.5) report.score -= 2;
    if (report.score < 1) report.score = 1;

    const dateName = targetDateIdx === 0 ? 'วันนี้' : targetDateIdx === 1 ? 'พรุ่งนี้' : `วันที่ +${targetDateIdx}`;
    
    // กำหนดเนื้อหาตามโหมด
    const contents = {
        summary: { title: `สรุปภาพรวม ${dateName}`, icon: '📋', morning: 'อากาศสดชื่น เหมาะกับการเริ่มต้นวัน', afternoon: tMax > 36 ? 'ร้อนจัด เลี่ยงกิจกรรมกลางแดด' : 'ท้องฟ้าโปร่ง เดินทางสะดวก', evening: rain > 40 ? 'ระวังฝนตกช่วงค่ำ พกร่มด้วย' : 'อากาศเย็นลง พักผ่อนสบาย' },
        travel: { title: 'วางแผนแต่งกาย & ท่องเที่ยว', icon: '🎒', morning: 'เตรียมเสื้อผ้าสีอ่อน ระบายอากาศดี', afternoon: 'แดดแรงมาก อย่าลืมครีมกันแดดและหมวก', evening: 'แสงสวย เหมาะกับการถ่ายรูปริมน้ำ' },
        health: { title: 'สุขภาพ & ออกกำลังกาย', icon: '🏃‍♂️', morning: pm25 > 50 ? 'ฝุ่นเยอะ งดวิ่งกลางแจ้ง' : 'อากาศดี เหมาะกับการวิ่งเช้า', afternoon: 'เสี่ยงฮีทสโตรก ดื่มน้ำบ่อยๆ', evening: 'ยืดเหยียดกล้ามเนื้อในร่ม' },
        driving: { title: 'วิเคราะห์การขับขี่', icon: '🚘', morning: 'ทัศนวิสัยดี ถนนแห้ง ขับขี่ปลอดภัย', afternoon: 'ระวังแสงแดดสะท้อนเข้าตาขณะขับ', evening: rain > 50 ? 'ถนนลื่น ลดความเร็วและทิ้งระยะห่าง' : 'การจราจรปกติ ไฟทางสว่าง' },
        home: { title: 'ซักผ้า & งานบ้าน', icon: '🧺', morning: 'เริ่มซักผ้าได้เลย แดดกำลังมา', afternoon: rain > 40 ? 'รีบเก็บผ้า ฝนอาจตกกะทันหัน' : 'ตากผ้านวมหรือชิ้นใหญ่ได้ แห้งไว', evening: 'ปิดหน้าต่างกันฝุ่นเข้าบ้าน' },
        farm: { title: 'ผู้ช่วยการเกษตร', icon: '🌾', morning: 'เหมาะกับการฉีดพ่นฮอร์โมน/ปุ๋ย', afternoon: 'หยุดรดน้ำช่วงแดดจัด ป้องกันรากไหม้', evening: 'รดน้ำให้ชุ่มชื่น เตรียมรับความร้อนวันถัดไป' }
    };

    const current = contents[activeTab] || contents.summary;
    report.title = current.title;
    report.icon = current.icon;
    report.text = report.score >= 7 ? `สภาพอากาศ ${locationName} ค่อนข้างเป็นใจค่ะ` : `สภาพอากาศมีข้อควรระวังสำหรับ ${locationName} ค่ะ`;
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

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setShowFilters(!mobile);
    };
    window.addEventListener('resize', handleResize);
    fetch('/thai_geo.json').then(res => res.json()).then(data => setGeoData(Array.isArray(data) ? data : data.data || []));
    
    // 🌟 ดึง GPS ทันทีพึ่งเริ่ม แต่ถ้าช้าจะไม่บล็อก UI
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        setLocationName('ตำแหน่งปัจจุบัน');
      }, null, { timeout: 5000 });
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeColor = tabConfigs.find(t => t.id === activeTab)?.color || '#8b5cf6';
  const appBg = darkMode ? '#020617' : '#f8fafc'; 
  const cardBg = darkMode ? '#0f172a' : '#ffffff';
  const textColor = darkMode ? '#f8fafc' : '#0f172a'; 
  const borderColor = darkMode ? '#1e293b' : '#e2e8f0';
  const subTextColor = darkMode ? '#94a3b8' : '#64748b'; 

  if (loadingWeather || !weatherData) return <div style={{ height: '100vh', background: appBg, display: 'flex', justifyContent: 'center', alignItems: 'center', color: textColor }}>🤖 AI กำลังคิดวิเคราะห์...</div>;

  return (
    <div style={{ height: '100%', width: '100%', background: appBg, display: 'flex', justifyContent: 'center', overflowY: 'auto', fontFamily: 'Kanit, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '20px', padding: isMobile ? '10px' : '30px', paddingBottom: '100px' }}>

        {/* 1. FILTER SECTION (ไว้บนสุดเสมอ) */}
        <div style={{ background: cardBg, borderRadius: '24px', padding: '20px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showFilters ? '15px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: textColor }}>📍 พื้นที่วิเคราะห์: <span style={{color: '#0ea5e9'}}>{locationName}</span></h3>
                </div>
                {isMobile && <button onClick={() => setShowFilters(!showFilters)} style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9', border: 'none', padding: '6px 12px', borderRadius: '50px', fontWeight: 'bold', fontSize: '0.8rem' }}>{showFilters ? '▲ ปิด' : '▼ ตั้งค่า'}</button>}
            </div>

            {showFilters && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr auto', gap: '10px' }}>
                        <select value={selectedProv} onChange={(e) => { setSelectedProv(e.target.value); setLocationName(e.target.value); }} style={{ padding: '10px', borderRadius: '12px', background: darkMode ? '#1e293b' : '#f1f5f9', color: textColor, border: 'none' }}>
                            <option value="">เลือกจังหวัด</option>
                            {stations.map(s => <option key={s.stationID} value={s.areaTH}>{s.areaTH}</option>)}
                        </select>
                        <select disabled style={{ padding: '10px', borderRadius: '12px', background: darkMode ? '#1e293b' : '#f1f5f9', color: textColor, border: 'none', opacity: 0.5 }}><option>เลือกอำเภอ</option></select>
                        <button onClick={() => { if(navigator.geolocation) navigator.geolocation.getCurrentPosition(p => fetchWeatherByCoords(p.coords.latitude, p.coords.longitude))}} style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>ใช้ GPS</button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }} className="hide-scrollbar">
                        {[0,1,2,3,4,5,6].map(idx => (
                            <button key={idx} onClick={() => setTargetDateIdx(idx)} style={{ flexShrink: 0, minWidth: '60px', padding: '8px', borderRadius: '12px', border: `1px solid ${targetDateIdx === idx ? activeColor : borderColor}`, background: targetDateIdx === idx ? activeColor : 'transparent', color: targetDateIdx === idx ? '#fff' : textColor, fontWeight: 'bold', fontSize: '0.8rem' }}>
                                {idx === 0 ? 'วันนี้' : idx === 1 ? 'พรุ่งนี้' : `+${idx} วัน`}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* 2. MAIN CONTENT AREA */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px', alignItems: 'flex-start' }}>
            
            {/* TABS SELECTOR (Mobile: แนวนอนด้านบน | Desktop: แนวตั้งด้านซ้าย) */}
            <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'row' : 'column', 
                gap: '10px', 
                width: isMobile ? '100%' : '240px',
                overflowX: isMobile ? 'auto' : 'visible',
                paddingBottom: isMobile ? '10px' : '0'
            }} className="hide-scrollbar">
                {tabConfigs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderRadius: '16px', border: 'none',
                            background: isActive ? (darkMode ? `${tab.color}30` : `${tab.color}15`) : (darkMode ? '#1e293b' : '#f8fafc'),
                            color: isActive ? (darkMode ? '#fff' : tab.color) : subTextColor,
                            fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                            boxShadow: isActive ? `0 4px 15px ${tab.color}20` : 'none',
                            width: isMobile ? 'auto' : '100%'
                        }}>
                            <span style={{ fontSize: '1.4rem' }}>{tab.icon}</span>
                            {!isMobile && <span>{tab.label}</span>}
                            {isMobile && <span style={{fontSize:'0.85rem'}}>{tab.label}</span>}
                        </button>
                    );
                })}
            </div>

            {/* AI REPORT BOX */}
            <div className="fade-in" key={activeTab} style={{ flex: 1, background: cardBg, borderRadius: '24px', padding: isMobile ? '20px' : '30px', border: `1px solid ${borderColor}`, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: activeColor, fontWeight: 'bold', letterSpacing: '1px', marginBottom: '5px' }}>AI ANALYSIS REPORT ✨</div>
                        <h2 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '1.8rem', color: textColor }}>{aiReport?.icon} {aiReport?.title}</h2>
                    </div>
                    <div style={{ background: darkMode ? '#1e293b' : '#f8fafc', padding: '12px', borderRadius: '20px', textAlign: 'center', border: `1px solid ${borderColor}`, minWidth: '80px' }}>
                        <span style={{ fontSize: '0.7rem', color: subTextColor, fontWeight: 'bold' }}>AI SCORE</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: '900', color: activeColor }}>{aiReport?.score}/10</div>
                    </div>
                </div>

                <div style={{ padding: '20px', background: `${activeColor}10`, borderRadius: '20px', borderLeft: `5px solid ${activeColor}`, marginBottom: '30px' }}>
                    <p style={{ margin: 0, fontSize: '1.1rem', color: textColor, lineHeight: 1.6 }}>{aiReport?.text}</p>
                </div>

                <h4 style={{ margin: '0 0 20px 0', color: textColor, display: 'flex', alignItems: 'center', gap: '10px' }}>🕒 ตารางกิจกรรมแนะนำ</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {aiReport?.timeline.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '15px', position: 'relative' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: activeColor, zIndex: 1 }}></div>
                                {i < 2 && <div style={{ width: '2px', flex: 1, background: borderColor }}></div>}
                            </div>
                            <div style={{ flex: 1, background: darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: '15px', borderRadius: '16px', border: `1px solid ${borderColor}`, marginBottom: i < 2 ? '10px' : '0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span style={{ fontWeight: 'bold', color: activeColor }}>{item.icon} {item.label}</span>
                                    <span style={{ fontSize: '0.75rem', color: subTextColor }}>{item.time}</span>
                                </div>
                                <div style={{ fontSize: '0.95rem', color: textColor }}>{item.text}</div>
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