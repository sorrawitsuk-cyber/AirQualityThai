import React, { useContext, useState, useEffect, useMemo } from 'react';
import { WeatherContext } from '../context/WeatherContext';

export default function AIPage() {
  const { stations, weatherData, fetchWeatherByCoords, loadingWeather, darkMode } = useContext(WeatherContext);
  
  // 🌟 Hooks ลำดับต้องคงที่
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [locationName, setLocationName] = useState('กำลังระบุตำแหน่ง...');
  const [geoData, setGeoData] = useState([]);
  const [selectedProv, setSelectedProv] = useState('');
  const [selectedDist, setSelectedDist] = useState('');
  const [targetDateIdx, setTargetDateIdx] = useState(0); 
  const [activeTab, setActiveTab] = useState('summary'); 
  
  // 📱 State ใหม่สำหรับคุมตัวกรองในมือถือ
  const [showFilters, setShowFilters] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setShowFilters(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ... (useEffect โหลด Geo, currentAmphoes, generateAIReport อื่นๆ เหมือนเดิม) ...

  const aiReport = useMemo(() => generateAIReport(), [activeTab, targetDateIdx, weatherData]);

  if (loadingWeather || !weatherData) return <div style={{ height: '100%', background: appBg }} />;

  return (
    <div style={{ height: '100%', width: '100%', background: appBg, display: 'flex', justifyContent: 'center', overflowY: 'auto', fontFamily: 'Kanit, sans-serif' }} className="hide-scrollbar">
      <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '15px', padding: isMobile ? '10px' : '30px', paddingBottom: '80px' }}>

        {/* 🌟 1. AI Content Box (เลื่อนขึ้นมาอันดับแรกใน Mobile) */}
        <div style={{ order: isMobile ? 1 : 2 }} className="fade-in">
             {/* ก๊อปปี้ส่วน <div className="fade-in" key={...}> รายงาน AI เดิมมาวางตรงนี้ */}
             {/* แนะนำ: ในมือถือให้ลด padding กล่องนี้เหลือ 15px */}
        </div>

        {/* 🌟 2. Tab Selectors (Horizontal Scroll สำหรับมือถือ) */}
        <div style={{ order: isMobile ? 2 : 3, display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }} className="hide-scrollbar">
            {tabConfigs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        flexShrink: 0, padding: isMobile ? '10px 15px' : '15px', 
                        fontSize: isMobile ? '0.85rem' : '0.95rem',
                        borderRadius: '16px', border: 'none',
                        background: isActive ? (darkMode ? `${tab.color}30` : `${tab.color}15`) : (darkMode ? '#1e293b' : '#f8fafc'),
                        color: isActive ? (darkMode ? '#fff' : tab.color) : subTextColor,
                        fontWeight: 'bold', cursor: 'pointer'
                    }}>
                        {tab.icon} {isMobile ? tab.label.split(' ')[0] : tab.label}
                    </button>
                );
            })}
        </div>

        {/* 🌟 3. Filter Section (ย้ายลงมา และทำเป็นปุ่มกางออก) */}
        <div style={{ order: isMobile ? 3 : 1, background: cardBg, borderRadius: '24px', padding: '15px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{fontSize:'1.2rem'}}>📍</span> พื้นที่: {locationName.split(',')[0]}
                </h3>
                {isMobile && (
                    <button onClick={() => setShowFilters(!showFilters)} style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: 'none', padding: '6px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {showFilters ? '🔼 ปิดตั้งค่า' : '🔽 เปลี่ยนพื้นที่/วันที่'}
                    </button>
                )}
            </div>

            {showFilters && (
                <div className="fade-in" style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <select value={selectedProv} onChange={handleProvChange} style={{ padding: '10px', borderRadius: '12px', background: darkMode ? '#1e293b' : '#f1f5f9', color: textColor, border: 'none', fontSize:'0.85rem' }}>
                            <option value="">-- เลือกจังหวัด --</option>
                            {sortedStations.map(p => <option key={p.stationID} value={p.areaTH}>{p.areaTH}</option>)}
                        </select>
                        <select value={selectedDist} onChange={handleDistChange} disabled={!selectedProv} style={{ padding: '10px', borderRadius: '12px', background: darkMode ? '#1e293b' : '#f1f5f9', color: textColor, border: 'none', fontSize:'0.85rem' }}>
                            <option value="">-- เลือกอำเภอ --</option>
                            {currentAmphoes.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                        </select>
                    </div>
                    {/* ส่วน Date Buttons เดิมของคุณ */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }} className="hide-scrollbar">
                        {/* ... map daily.time เดิม ... */}
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}