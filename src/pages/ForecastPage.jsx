// src/pages/ForecastPage.jsx
import React, { useContext, useState, useEffect } from 'react';
import { WeatherContext } from '../context/WeatherContext';
import { extractProvince } from '../utils/helpers';

// (ปล่อยโค้ดเดิมส่วน getProvinceKnowledge ไว้ตามปกติ)
const getProvinceKnowledge = (prov) => {
  const north = ['เชียงใหม่', 'เชียงราย', 'แม่ฮ่องสอน', 'น่าน', 'พะเยา', 'แพร่', 'ลำปาง', 'ลำพูน', 'ตาก'];
  if (north.includes(prov)) return { region: 'เหนือ', crops: 'กาแฟ, สตรอว์เบอร์รี', tour: 'ขึ้นดอยชมหมอก' };
  return { region: 'กลาง/ทั่วไป', crops: 'ข้าว, อ้อย', tour: 'ไหว้พระ, ตลาดน้ำ' };
};

export default function ForecastPage() {
  const { stations, weatherData, loadingWeather, darkMode, lastUpdateText } = useContext(WeatherContext);
  
  const [selectedProv, setSelectedProv] = useState('');
  const [activeTopic, setActiveTopic] = useState('summary');
  const [isThinking, setIsThinking] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const safeStations = stations || [];
  const provinces = [...new Set(safeStations.map(s => extractProvince(s.areaTH)))].sort();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (provinces.length > 0 && !selectedProv) {
      setSelectedProv(provinces.includes('กรุงเทพมหานคร') ? 'กรุงเทพมหานคร' : provinces[0]);
    }
  }, [provinces, selectedProv]);

  const generateResponse = (topic, prov) => {
    // ใช้ข้อมูลจาก weatherData ที่เพิ่งโหลดมาแทนสถานีเก่า
    if (!weatherData) return;
    
    const { current } = weatherData;
    const know = getProvinceKnowledge(prov);
    const pmVal = current.pm25; const tempVal = Math.round(current.temp);
    const heatVal = Math.round(current.feelsLike); const rainProb = current.rain > 0 ? 80 : 0;
    const humidity = current.humidity; const wind = current.windSpeed;
    
    let content = [{ title: `สรุปภาพรวม ${prov}`, text: `อุณหภูมิ ${tempVal}°C ฝุ่น ${pmVal} µg/m³` }];
    // (ใส่ Logic AI เดิมของคุณตรงนี้ได้เลย)

    setAiResponse({ prov, pmVal, tempVal, heatVal, rainProb, humidity, content });
  };

  useEffect(() => {
    if (selectedProv && weatherData) {
      setIsThinking(true);
      setTimeout(() => { generateResponse(activeTopic, selectedProv); setIsThinking(false); }, 800);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProv, activeTopic, weatherData]);

  if (loadingWeather) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',background:darkMode?'#0f172a':'#f8fafc',color:darkMode?'#fff':'#000'}}>กำลังโหลดระบบ AI...</div>;

  const bgGradient = darkMode ? '#0f172a' : '#f8fafc'; 
  const cardBg = darkMode ? 'rgba(30, 41, 59, 0.95)' : '#ffffff';
  const textColor = darkMode ? '#f8fafc' : '#0f172a';

  return (
    <div style={{ height: '100%', padding: '30px', background: bgGradient, color: textColor }}>
      <h1>✨ AI ผู้ช่วยอัจฉริยะ</h1>
      {/* (วาง Layout เดิมของหน้า AI ของคุณตรงนี้ได้เลยครับ มันจะดึงข้อมูล weatherData มาใช้ได้เลย)
      */}
    </div>
  );
}