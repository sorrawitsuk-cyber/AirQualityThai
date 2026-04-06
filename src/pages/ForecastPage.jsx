// src/pages/AIPage.jsx
import React, { useContext, useState, useEffect, useMemo } from 'react';
import { WeatherContext } from '../context/WeatherContext';

export default function AIPage() {
  const { stations, weatherData, fetchWeatherByCoords, loadingWeather, darkMode } = useContext(WeatherContext);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [locationName, setLocationName] = useState('กำลังระบุตำแหน่ง...');
  
  const [geoData, setGeoData] = useState([]);
  const [geoError, setGeoError] = useState(false);
  const [selectedProv, setSelectedProv] = useState('');
  const [selectedDist, setSelectedDist] = useState('');
  const [targetDateIdx, setTargetDateIdx] = useState(0); 
  
  const [activeTab, setActiveTab] = useState('summary'); 

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch('/thai_geo.json')
      .then(res => res.json())
      .then(data => setGeoData(Array.isArray(data) ? data : (data.data || data.RECORDS || data.records || Object.values(data)[0] || [])))
      .catch(e => setGeoError(true));
  }, []);

  const sortedStations = useMemo(() => [...(stations || [])].sort((a, b) => a.areaTH.localeCompare(b.areaTH, 'th')), [stations]);
  
  const currentAmphoes = useMemo(() => {
    if (!geoData || geoData.length === 0 || !selectedProv) return [];
    const cleanProv = selectedProv.replace('จังหวัด', '').trim();
    const pObj = geoData.find(p => {
      const pName = String(p.name_th || p.nameTh || p.name || p.province || p.province_name || '').replace('จังหวัด', '').trim();
      return pName === cleanProv || pName.includes(cleanProv) || cleanProv.includes(pName);
    });

    if (pObj) {
      const distArray = pObj.amphure || pObj.amphures || pObj.district || pObj.districts || pObj.amphoe || pObj.amphoes || pObj.amphur || [];
      return [...distArray].map(a => {
        const distName = String(a.name_th || a.nameTh || a.name || a.amphoe || a.district_name || a.amphur_name || '').trim();
        return { id: a.id || a.code || Math.random(), name: distName };
      }).filter(a => a.name !== "").sort((a, b) => a.name.localeCompare(b.name, 'th'));
    }
    return [];
  }, [geoData, selectedProv]);

  const fetchLocationName = async (lat, lon) => {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=th`);
      const data = await res.json();
      setLocationName(data?.locality || data?.city || 'ตำแหน่งปัจจุบัน');
    } catch (e) { setLocationName('ตำแหน่งปัจจุบัน'); }
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
        setLocationName('กำลังหาตำแหน่ง...');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
                fetchLocationName(pos.coords.latitude, pos.coords.longitude);
                setSelectedProv(''); 
                setSelectedDist('');
            },
            () => {
                alert("ไม่สามารถดึงตำแหน่งได้ กรุณาเปิด GPS หรือเลือกจังหวัดจากเมนูค่ะ");
                setLocationName('กรุณาระบุตำแหน่ง');
            },
            { timeout: 5000 }
        );
    }
  };

  useEffect(() => {
    if (!weatherData) {
      handleLocateMe(); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProvChange = (e) => {
    const pName = e.target.value;
    setSelectedProv(pName); setSelectedDist('');
    const fallbackProv = stations?.find(s => s.areaTH === pName);
    if (fallbackProv) { fetchWeatherByCoords(fallbackProv.lat, fallbackProv.long); setLocationName(pName); }
  };

  const handleDistChange = async (e) => {
    const dName = e.target.value;
    setSelectedDist(dName);
    if (!dName) return;
    const prefix = (selectedProv === 'กรุงเทพมหานคร' || dName.startsWith('เขต') || dName.startsWith('อ.')) ? '' : 'อ.';
    setLocationName(`${prefix}${dName}, ${selectedProv}`);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${dName} ${selectedProv} Thailand`)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) fetchWeatherByCoords(parseFloat(data[0].lat), parseFloat(data[0].lon));
    } catch (err) { console.error(err); }
  };

  const appBg = darkMode ? '#020617' : '#f8fafc'; 
  const cardBg = darkMode ? '#0f172a' : '#ffffff';
  const textColor = darkMode ? '#f8fafc' : '#0f172a'; 
  const borderColor = darkMode ? '#1e293b' : '#e2e8f0';
  const subTextColor = darkMode ? '#94a3b8' : '#64748b'; 

  if (loadingWeather || !weatherData || !weatherData.daily) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', background: appBg, color: textColor, fontFamily: 'Kanit, sans-serif' }}>
        <style dangerouslySetInlineStyle={{__html: `@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.95); } }`}} />
        <div style={{ fontSize: '4rem', animation: 'pulse 1.5s infinite ease-in-out' }}>🤖</div>
        <div style={{ marginTop: '20px', fontSize: '1.2rem', fontWeight: 'bold' }}>AI กำลังวิเคราะห์และจัดตารางชีวิต...</div>
    </div>
  );

  const daily = weatherData.daily;
  const targetDateStr = daily.time[targetDateIdx];
  const displayDateName = targetDateIdx === 0 ? 'วันนี้' : targetDateIdx === 1 ? 'พรุ่งนี้' : new Date(targetDateStr).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });
  
  const dayData = {
      tMax: Math.round(daily.temperature_2m_max[targetDateIdx] || 0),
      tMin: Math.round(daily.temperature_2m_min[targetDateIdx] || 0),
      rain: daily.precipitation_probability_max[targetDateIdx] || 0,
      pm25: daily.pm25_max ? Math.round(daily.pm25_max[targetDateIdx] || 0) : (weatherData.current?.pm25 || 0),
      wind: daily.windspeed_10m_max ? Math.round(daily.windspeed_10m_max[targetDateIdx] || 0) : (weatherData.current?.windSpeed || 0)
  };

  const tabConfigs = [
    { id: 'summary', icon: '📋', label: 'ภาพรวมรายวัน', color: '#8b5cf6' },
    { id: 'travel', icon: '🎒', label: 'แต่งกาย & ท่องเที่ยว', color: '#ec4899' },
    { id: 'health', icon: '🏃‍♂️', label: 'สุขภาพ & ออกกำลังกาย', color: '#22c55e' },
    { id: 'driving', icon: '🚘', label: 'ขับขี่ & เดินทาง', color: '#f97316' },
    { id: 'home', icon: '🧺', label: 'ซักผ้า & งานบ้าน', color: '#0ea5e9' },
    { id: 'event', icon: '⛺', label: 'จัดอีเวนต์ & แคมป์ปิ้ง', color: '#eab308' },
    { id: 'pet', icon: '🐕', label: 'ดูแลสัตว์เลี้ยง', color: '#d97706' },
    { id: 'farm', icon: '🌾', label: 'ผู้ช่วยการเกษตร', color: '#10b981' }
  ];

  const activeThemeColor = tabConfigs.find(t => t.id === activeTab)?.color || '#8b5cf6';

  // 🌟 AI Logic Engine สำหรับสร้าง Report และ ตารางเวลา (Timeline)
  const generateAIReport = () => {
      const { tMax, rain, pm25, wind } = dayData;
      let report = { score: 10, title: '', text: '', icon: '', tips: [], timeline: [] };
      
      let m_text = "", a_text = "", e_text = ""; // ข้อความ 3 ช่วงเวลา

      // หักคะแนนภาพรวม
      if (rain > 70) report.score -= 4; else if (rain > 40) report.score -= 2;
      if (tMax > 38) report.score -= 3; else if (tMax > 35) report.score -= 1;
      if (pm25 > 75) report.score -= 4; else if (pm25 > 37.5) report.score -= 2;
      if (report.score < 1) report.score = 1;

      switch (activeTab) {
          case 'summary':
              report.title = `สรุปภาพรวม ${displayDateName}`;
              if (report.score >= 8) report.text = `สภาพอากาศที่ ${locationName} ${displayDateName} ค่อนข้างเป็นใจสุดๆ ค่ะ อากาศโปร่งใส เหมาะกับการทำกิจกรรมเกือบทุกประเภท`;
              else if (report.score >= 5) report.text = `สภาพอากาศที่ ${locationName} ${displayDateName} อยู่ในเกณฑ์ปานกลาง อาจมีปัจจัยรบกวนบ้างเล็กน้อย โปรดเตรียมตัวให้พร้อมก่อนออกจากบ้านค่ะ`;
              else report.text = `โปรดระมัดระวัง! สภาพอากาศที่ ${locationName} ${displayDateName} ค่อนข้างย่ำแย่ ไม่แนะนำให้อยู่กลางแจ้งเป็นเวลานานค่ะ`;
              
              m_text = `อุณหภูมิเย็นสุดของวัน เริ่มต้นวันใหม่ด้วยความสดชื่น ${pm25 > 37.5 ? '(ระวังฝุ่นตอนเช้า)' : ''}`;
              a_text = tMax > 35 ? `แดดร้อนจัด อุณหภูมิพุ่งถึง ${tMax}°C ควรเลี่ยงการอยู่กลางแดด` : (rain > 40 ? `อากาศอุ่นขึ้น ระวังกลุ่มเมฆฝนก่อตัว` : `อากาศโปร่งสบาย เหมาะกับการเดินทาง`);
              e_text = rain > 40 ? `ความเสี่ยงฝนตกสูง แนะนำให้พกร่มและเดินทางกลับที่พัก` : `อากาศเย็นลง เหมาะแก่การพักผ่อนสบายๆ`;
              break;

          case 'travel':
              report.title = `วางแผนแต่งกาย & ท่องเที่ยว`;
              if (rain > 60) report.text = `อุปสรรคฝนตกหนัก แนะนำให้เผื่อเวลาและหาร้านอาหาร/คาเฟ่ในร่ม เลือกรองเท้าที่เปียกน้ำได้ค่ะ`;
              else if (tMax > 36) report.text = `แดดค่อนข้างแรงมาก ใส่เสื้อผ้าระบายอากาศได้ดี สีอ่อน และอย่าลืมทาครีมกันแดดค่ะ`;
              else report.text = `อากาศกำลังดี เหมาะกับการแต่งตัวสวยๆ ไปถ่ายรูปและเที่ยวกลางแจ้งได้อย่างราบรื่นค่ะ`;
              
              m_text = rain > 40 ? `แนะนำเข้าคาเฟ่ หรือแวะพิพิธภัณฑ์ หลบฝนช่วงสาย` : `แสงตอนเช้าสวยที่สุด! เหมาะกับการถ่ายรูปกลางแจ้ง`;
              a_text = tMax > 35 ? `แดดแรงจัด แนะนำให้หาที่หลบแดดในห้างสรรพสินค้า หรือหาร้านนั่งชิล` : (rain > 40 ? `เช็กเรดาร์ฝน หากมีเมฆดำควรย้ายเข้าในอาคาร` : `เดินทางท่องเที่ยวได้เต็มที่`);
              e_text = rain > 40 ? `ฝนอาจทำให้รถติดและเดินลำบาก หาร้านอาหารใกล้ๆ ไว้ดีกว่า` : `เดินถนนคนเดิน หรือชมวิวกลางคืนชิลๆ ได้เลย`;
              break;

          case 'health':
              report.title = `คำแนะนำด้านสุขภาพ & กีฬา`;
              if (pm25 > 50 || tMax > 38) report.text = `ห้ามออกกำลังกายกลางแจ้งใน${displayDateName}เด็ดขาด! (เสี่ยงฮีทสโตรกหรือภูมิแพ้ฝุ่น) ควรไปยิมหรือฟิตเนสในร่มแทนค่ะ`;
              else if (pm25 > 25 || rain > 40) report.text = `สามารถออกกำลังกายเบาๆ ได้ แต่ควรคอยสังเกตอาการตัวเอง หากมีฝนให้งดวิ่งกลางแจ้งเพื่อป้องกันไข้หวัด`;
              else report.text = `เพอร์เฟกต์สำหรับการวิ่ง ปั่นจักรยาน หรือเล่นกีฬากลางแจ้งค่ะ!`;

              m_text = pm25 > 50 ? `ฝุ่นหนา งดวิ่งและปั่นจักรยานกลางแจ้งเด็ดขาด` : `เวลาทองของการวิ่ง! อากาศเย็นสบายและสดชื่น`;
              a_text = tMax > 35 || rain > 40 ? `เปลี่ยนแผนไปว่ายน้ำ หรือเข้ายิม/โยคะในร่มแทน` : `ออกกำลังกายได้ แต่ควรดื่มน้ำชดเชยให้เพียงพอ`;
              e_text = `เหมาะกับการออกกำลังกายเบาๆ เช่น เดินแกว่งแขน หรือยืดเหยียดกล้ามเนื้อ`;
              break;

          case 'driving':
              report.title = `วิเคราะห์การขับขี่ & จราจร`;
              if (rain > 70) report.text = `ถนนจะลื่นและมีแอ่งน้ำขัง ทัศนวิสัยย่ำแย่ แนะนำให้ชะลอความเร็วและทิ้งระยะห่างให้มากกว่าปกติค่ะ`;
              else if (rain > 30) report.text = `ระวังถนนลื่นในช่วงฝนเริ่มตกใหม่ๆ อาจมีคราบน้ำมันบนผิวจราจร ขับขี่ระมัดระวังค่ะ`;
              else report.text = `สภาพอากาศปลอดโปร่ง ทัศนวิสัยชัดเจน เดินทางได้อย่างปลอดภัยค่ะ`;

              m_text = rain > 30 ? `หมอกและละอองฝนตอนเช้าทำให้ทัศนวิสัยต่ำ เปิดไฟตัดหมอกด้วยนะคะ` : `การจราจรอาจหนาแน่น แต่สภาพอากาศเคลียร์`;
              a_text = tMax > 35 ? `ระวังแสงแดดสะท้อนเข้าตา และความร้อนสะสมในเครื่องยนต์หากรถติด` : `ขับขี่ได้อย่างปลอดภัย`;
              e_text = rain > 40 ? `ถนนลื่น + มืด อันตรายทวีคูณ ขับรถช้าๆ และระวังจักรยานยนต์` : `เปิดไฟหน้าให้พร้อม ทัศนวิสัยปกติ`;
              break;

          case 'home':
              report.title = `ซักผ้า & งานบ้าน`;
              if (rain > 40) report.text = `ไม่แนะนำให้ซักผ้าตากแจ้ง เพราะเสี่ยงฝนตกสูง ผ้าอาจมีกลิ่นอับ ให้อบผ้าหรือตากในที่ร่มแทน`;
              else if (tMax > 33 && rain < 20) report.text = `แดดดีเยี่ยม! เป็นวันที่เหมาะมากสำหรับการซักผ้าชิ้นใหญ่ ตากผ้านวม ผ้าแห้งสนิทแน่นอน`;
              else report.text = `สามารถซักผ้าได้ แต่ควรตากในจุดที่มีหลังคาหรือคอยสังเกตท้องฟ้าค่ะ`;

              m_text = `เริ่มเดินเครื่องซักผ้า ล้างแอร์ หรือทำความสะอาดบ้านเปิดรับลม`;
              a_text = rain > 40 ? `รีบเก็บผ้าเข้าที่ร่ม เฝ้าระวังลมกระโชกแรง` : `นำผ้าออกตากแดด รับความร้อนสูงสุด ผ้าแห้งและหอมแดด`;
              e_text = pm25 > 37.5 ? `ปิดหน้าต่างให้สนิทกันฝุ่นเข้าบ้าน และเปิดเครื่องฟอกอากาศ` : `รีดผ้า และจัดระเบียบของใช้สบายๆ`;
              break;

          case 'event':
              report.title = `จัดอีเวนต์ & แคมป์ปิ้ง`;
              if (rain > 50 || wind > 25) report.text = `ไม่เหมาะกับการตั้งแคมป์ โอกาสเจอพายุฝนและลมแรงสูงมาก ควรมีเต็นท์สำรองหรือย้ายเข้าในร่ม`;
              else if (tMax > 37) report.text = `อากาศร้อนจัด ควรเตรียมพัดลมไอน้ำ หรือจุดพักผ่อนที่มีร่มเงาให้เพียงพอ เพื่อป้องกันฮีทสโตรก`;
              else report.text = `บรรยากาศดีมาก! เหมาะแก่การกางเต็นท์ ปิกนิก หรือจัดกิจกรรมกลางแจ้ง`;

              m_text = `เหมาะกับการลงพื้นที่ กางเต็นท์ จัดเตรียมโครงสร้างเวที`;
              a_text = tMax > 35 ? `หาที่ร่มและพัดลมไอน้ำคลายร้อนให้แขก งดกิจกรรมกลางแจ้งจัดๆ` : `รันกิจกรรมได้ตามแพลนที่วางไว้`;
              e_text = rain > 40 ? `เตรียมย้ายเข้าเต็นท์ใหญ่ ระวังลมแรงพัดของพัง` : `อากาศเย็นลง เหมาะกับการรอบกองไฟ หรือเปิดไฟประดับสวยๆ`;
              break;

          case 'pet':
              report.title = `การดูแลสัตว์เลี้ยง`;
              if (tMax > 36) report.text = `พื้นถนนและพื้นปูนจะร้อนจัดจนทำให้ฝ่าเท้าสัตว์เลี้ยงพองได้ งดพาเดินเล่นตอนกลางวัน ให้พาไปตอนเช้าหรือค่ำแทนค่ะ`;
              else if (pm25 > 50) report.text = `ฝุ่นสูง น้องแมว/หมาก็สูดฝุ่นพิษได้เหมือนคน งดกิจกรรมกลางแจ้งและเปิดเครื่องฟอกอากาศในบ้าน`;
              else report.text = `อากาศกำลังสบาย พาน้องๆ ไปวิ่งเล่นปลดปล่อยพลังงานได้เลยค่ะ`;

              m_text = `พาเดินเล่น ขับถ่ายสูดอากาศตอนเช้า ระวังหญ้าเปียกน้ำค้าง`;
              a_text = tMax > 34 ? `ห้ามพาออกเดินพื้นปูนเด็ดขาด (ตีนพอง) ให้อยู่ในห้องแอร์/พัดลม และเตรียมน้ำให้เยอะๆ` : `นอนพักผ่อนในบ้าน`;
              e_text = `อากาศเริ่มเย็น พาไปสวนสาธารณะวิ่งเล่นได้ปลอดภัย`;
              break;

          case 'farm':
              report.title = `ผู้ช่วยการเกษตร`;
              if (rain > 60) report.text = `งดการฉีดพ่นยาหรือปุ๋ยทางใบทุกชนิด เพราะฝนจะชะล้างน้ำยาทิ้งหมดค่ะ และระวังน้ำขังในแปลง`;
              else if (rain > 20) report.text = `มีความเสี่ยงฝนตกประปราย ควรเช็กเรดาร์เมฆฝนก่อนเริ่มงานฉีดพ่นยา`;
              else if (tMax > 37) report.text = `อากาศร้อนและแห้งจัด ควรเพิ่มปริมาณการรดน้ำต้นไม้ในช่วงเช้าตรู่ งดรดน้ำตอนแดดจัดเพื่อป้องกันใบไหม้ค่ะ`;
              else report.text = `สภาพอากาศเป็นใจ เหมาะสำหรับการลงแปลง ดายหญ้า รดน้ำ หรือฉีดพ่นปุ๋ยค่ะ`;

              m_text = rain > 50 ? `เคลียร์ทางระบายน้ำ` : `เวลาทอง! เหมาะกับการฉีดพ่นฮอร์โมน/ยา เพราะปากใบเปิดและยาไม่ปลิวทิ้ง`;
              a_text = tMax > 34 ? `หยุดรดน้ำ (น้ำจะต้มรากสุก) ทำงานในร่ม ซ่อมแซมเครื่องมือการเกษตร` : `ดายหญ้า หรือตัดแต่งกิ่ง`;
              e_text = `รดน้ำต้นไม้ให้ชุ่มชื้น เพื่อให้พืชดูดซึมน้ำเก็บไว้ใช้ในคืนนี้`;
              break;

          default: break;
      }

      // ดึง Tip จากโหมด (ใส่ข้อมูลร่วมเข้าไปด้วย)
      report.tips.push(`🌡️ อุณหภูมิ: สูงสุด ${tMax}°C / ต่ำสุด ${dayData.tMin}°C`);
      report.tips.push(`☔ โอกาสฝนตก: ${rain}%`);
      report.tips.push(`😷 ฝุ่น PM2.5: ${pm25} µg/m³`);

      // 🌟 สร้าง Timeline Array 3 ช่วงเวลา
      report.timeline = [
          { id: 'morning', time: '06:00 - 12:00', label: 'ช่วงเช้า', icon: '🌅', text: m_text },
          { id: 'afternoon', time: '12:00 - 18:00', label: 'ช่วงบ่าย', icon: '☀️', text: a_text },
          { id: 'evening', time: '18:00 เป็นต้นไป', label: 'ช่วงค่ำ', icon: '🌙', text: e_text }
      ];

      return report;
  };

  const aiReport = generateAIReport();
  const scoreColor = aiReport.score >= 8 ? '#22c55e' : aiReport.score >= 5 ? '#eab308' : '#ef4444';

  return (
    <div style={{ height: '100%', width: '100%', background: appBg, display: 'flex', justifyContent: 'center', overflowY: 'auto', fontFamily: 'Kanit, sans-serif' }} className="hide-scrollbar">
      <style dangerouslySetInlineStyle={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .fade-in { animation: fadeIn 0.4s ease-in-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}} />
      
      <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '20px', padding: isMobile ? '15px' : '30px', paddingBottom: '50px' }}>

        <div style={{ background: cardBg, padding: '20px', borderRadius: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ margin: 0, color: textColor, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🧠</span> กำหนดเงื่อนไขให้ AI วางแผน
                </h2>
                <button onClick={handleLocateMe} style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: '1px solid #0ea5e9', padding: '6px 14px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s' }}>
                    📍 ใช้ตำแหน่งปัจจุบัน
                </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '15px' }}>
                <select value={selectedProv} onChange={handleProvChange} style={{ padding: '12px', borderRadius: '12px', background: darkMode ? '#1e293b' : '#f1f5f9', color: textColor, border: 'none', outline: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                    <option value="">-- เลือกจังหวัดเป้าหมาย --</option>
                    {sortedStations.map(p => <option key={p.stationID} value={p.areaTH}>{p.areaTH}</option>)}
                </select>
                <select value={selectedDist} onChange={handleDistChange} disabled={!selectedProv} style={{ padding: '12px', borderRadius: '12px', background: darkMode ? '#1e293b' : '#f1f5f9', color: textColor, border: 'none', outline: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: !selectedProv ? 0.5 : 1 }}>
                    <option value="">-- เลือกอำเภอเป้าหมาย --</option>
                    {currentAmphoes.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }} className="hide-scrollbar">
                {daily.time.map((t, idx) => {
                    const isSelected = targetDateIdx === idx;
                    const dateObj = new Date(t);
                    return (
                        <button key={idx} onClick={() => setTargetDateIdx(idx)} style={{ flexShrink: 0, padding: '10px 20px', borderRadius: '16px', border: `1px solid ${isSelected ? activeThemeColor : borderColor}`, background: isSelected ? `linear-gradient(135deg, ${activeThemeColor}, ${activeThemeColor}dd)` : (darkMode ? '#1e293b' : '#f8fafc'), color: isSelected ? '#fff' : textColor, fontWeight: 'bold', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', transition: 'all 0.3s', boxShadow: isSelected ? `0 10px 20px ${activeThemeColor}40` : 'none' }}>
                            <span style={{ fontSize: '0.8rem', opacity: isSelected ? 0.9 : 0.6 }}>{idx === 0 ? 'วันนี้' : idx === 1 ? 'พรุ่งนี้' : dateObj.toLocaleDateString('th-TH', { weekday: 'short' })}</span>
                            <span style={{ fontSize: '1.1rem' }}>{dateObj.getDate()}</span>
                        </button>
                    )
                })}
            </div>
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr', gap: '10px', width: isMobile ? '100%' : '260px' }}>
                {tabConfigs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderRadius: '16px', border: `1px solid ${isActive ? tab.color : 'transparent'}`, background: isActive ? (darkMode ? `${tab.color}20` : `${tab.color}15`) : (darkMode ? '#1e293b' : '#f8fafc'), color: isActive ? (darkMode ? '#fff' : tab.color) : subTextColor, fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', boxShadow: isActive ? `0 4px 15px ${tab.color}20` : 'none' }}>
                            <span style={{ fontSize: '1.4rem', filter: isActive ? 'grayscale(0%)' : 'grayscale(100%)', opacity: isActive ? 1 : 0.5 }}>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="fade-in" key={`${activeTab}-${targetDateIdx}-${selectedProv}`} style={{ flex: 1, background: cardBg, borderRadius: '24px', padding: isMobile ? '20px' : '30px', border: `1px solid ${borderColor}`, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden' }}>
                
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: `radial-gradient(circle, ${activeThemeColor}30 0%, rgba(255,255,255,0) 70%)`, borderRadius: '50%', pointerEvents: 'none' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: activeThemeColor, fontWeight: 'bold', marginBottom: '5px', letterSpacing: '1px' }}>AI ANALYSIS REPORT ✨</div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: textColor }}>{tabConfigs.find(t=>t.id===activeTab).icon} {aiReport.title}</h2>
                        <div style={{ fontSize: '0.9rem', color: subTextColor, marginTop: '5px' }}>📍 {locationName}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: darkMode ? '#1e293b' : '#f8fafc', padding: '10px 15px', borderRadius: '16px', border: `1px solid ${borderColor}` }}>
                        <span style={{ fontSize: '0.75rem', color: subTextColor, fontWeight: 'bold' }}>คะแนนความเหมาะสม</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', color: scoreColor }}>
                            <span style={{ fontSize: '1.8rem', fontWeight: '900' }}>{aiReport.score}</span>
                            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>/10</span>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '20px', background: darkMode ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: '16px', borderLeft: `4px solid ${activeThemeColor}`, marginBottom: '20px' }}>
                    <p style={{ margin: 0, fontSize: '1.05rem', color: textColor, lineHeight: 1.6, fontWeight: '500' }}>
                        {aiReport.text}
                    </p>
                </div>

                {/* 🌟 ส่วนใหม่: ตารางเวลา (Timeline Schedule) 🌟 */}
                <h4 style={{ margin: '20px 0 15px 0', color: textColor, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🕒</span> ตารางกิจกรรมแนะนำ (AI Schedule)
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative', paddingLeft: '15px', marginBottom: '25px' }}>
                    {/* เส้นตรงแนวตั้งเชื่อมไทม์ไลน์ */}
                    <div style={{ position: 'absolute', left: '22px', top: '20px', bottom: '20px', width: '2px', background: darkMode ? '#334155' : '#e2e8f0', zIndex: 0 }}></div>

                    {aiReport.timeline.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '15px', position: 'relative', zIndex: 1, marginBottom: i !== 2 ? '20px' : '0' }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: activeThemeColor, border: `4px solid ${cardBg}`, marginTop: '15px', flexShrink: 0 }}></div>
                            <div style={{ flex: 1, background: darkMode ? '#1e293b' : '#f8fafc', padding: '15px', borderRadius: '16px', border: `1px solid ${borderColor}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                                    <span style={{ fontWeight: 'bold', color: activeThemeColor, fontSize: '0.95rem' }}>{item.label}</span>
                                    <span style={{ fontSize: '0.8rem', color: subTextColor }}>({item.time})</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: textColor, lineHeight: 1.5 }}>{item.text}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <h4 style={{ margin: '0 0 10px 0', color: textColor, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>📊</span> ข้อมูลประกอบการตัดสินใจ
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '10px' }}>
                    {aiReport.tips.map((tip, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: darkMode ? '#1e293b' : '#f1f5f9', padding: '12px 15px', borderRadius: '12px', fontSize: '0.85rem', color: textColor, fontWeight: '500' }}>
                            {tip}
                        </div>
                    ))}
                </div>

            </div>
        </div>

        <div style={{ height: isMobile ? '80px' : '0px', flexShrink: 0, width: '100%' }}></div>
      </div>
    </div>
  );
}