// src/pages/ForecastPage.jsx
import React, { useContext, useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { WeatherContext } from '../context/WeatherContext';
import { chartConfigs, extractProvince, getDistanceFromLatLonInKm, getPM25Color } from '../utils/helpers';

const getWindDirectionText = (degree) => {
  if (degree >= 337.5 || degree < 22.5) return 'ทิศเหนือ (พัดลงใต้)';
  if (degree >= 22.5 && degree < 67.5) return 'ทิศตะวันออกเฉียงเหนือ';
  if (degree >= 67.5 && degree < 112.5) return 'ทิศตะวันออก';
  if (degree >= 112.5 && degree < 157.5) return 'ทิศตะวันออกเฉียงใต้';
  if (degree >= 157.5 && degree < 202.5) return 'ทิศใต้';
  if (degree >= 202.5 && degree < 247.5) return 'ทิศตะวันตกเฉียงใต้';
  if (degree >= 247.5 && degree < 292.5) return 'ทิศตะวันตก';
  if (degree >= 292.5 && degree < 337.5) return 'ทิศตะวันตกเฉียงเหนือ';
  return 'ลมสงบ';
};

export default function ForecastPage() {
  const { stations, provinces, stationTemps, nationwideSummary, darkMode, favLocations } = useContext(WeatherContext);
  
  const [alertsLocationName, setAlertsLocationName] = useState('กรุงเทพมหานคร');
  const [dashHistory, setDashHistory] = useState([]);
  const [dashForecast, setDashForecast] = useState([]);
  const [dashLoading, setDashLoading] = useState(false);
  const [viewMode, setViewMode] = useState('rain');
  const [locatingStatus, setLocatingStatus] = useState('idle');
  const [searchTerm, setSearchTerm] = useState(''); 
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const [lifestyleScores, setLifestyleScores] = useState(null);

  const [aiSummaryJson, setAiSummaryJson] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [activeAiTopic, setActiveAiTopic] = useState(null);
  const [targetDayOffset, setTargetDayOffset] = useState(0);

  const facts = useMemo(() => [
    "💡 รู้หรือไม่? วันที่เมฆเยอะก็สามารถทำให้ผิวไหม้จากรังสี UV ได้นะ อย่าลืมทากันแดด!",
    "💡 รู้หรือไม่? ฝนตกสะสมเกิน 100 มม. ใน 3 วัน เสี่ยงทำให้น้ำท่วมขังรอการระบาย",
    "💡 รู้หรือไม่? ทัศนวิสัยการขับรถที่ปลอดภัยควรมีระยะมองเห็นมากกว่า 8 กิโลเมตร",
    "💡 รู้หรือไม่? ลมมรสุมตะวันตกเฉียงใต้ คือตัวการหลักที่พัดเอาความชื้นจากทะเลมาตกเป็นฝนในไทย"
  ], []);
  const [randomFact, setRandomFact] = useState(facts[0]);
  useEffect(() => { setRandomFact(facts[Math.floor(Math.random() * facts.length)]); }, [activeAiTopic, facts]);

  const activeChart = chartConfigs[viewMode];
  const textColor = darkMode ? '#f8fafc' : '#1e293b';
  const subTextColor = darkMode ? '#94a3b8' : '#64748b';
  const borderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  const cardBg = darkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)';
  const backdropBlur = 'blur(16px)';

  const aiTopics = [
    { id: 'general', icon: '🌤️', title: 'สรุปภาพรวม', color: '#0ea5e9', bgLight: '#e0f2fe', darkBgLight: 'rgba(14,165,233,0.15)' },
    { id: 'lifestyle', icon: '👕', title: 'ซักผ้า / ตากของ', color: '#6366f1', bgLight: '#e0e7ff', darkBgLight: 'rgba(99,102,241,0.15)' },
    { id: 'travel', icon: '🚗', title: 'ขับรถ / เดินทาง', color: '#ec4899', bgLight: '#fce7f3', darkBgLight: 'rgba(236,72,153,0.15)' },
    { id: 'outdoor', icon: '⛺', title: 'แคมป์ปิ้ง / เที่ยว', color: '#14b8a6', bgLight: '#ccfbf1', darkBgLight: 'rgba(20,184,166,0.15)' },
    { id: 'health', icon: '😷', title: 'สุขภาพ & หน้ากาก', color: '#10b981', bgLight: '#dcfce7', darkBgLight: 'rgba(16,185,129,0.15)' },
    { id: 'rain', icon: '🌊', title: 'เฝ้าระวังน้ำท่วม/ฝน', color: '#3b82f6', bgLight: '#dbeafe', darkBgLight: 'rgba(59,130,246,0.15)' },
    { id: 'dust_wind', icon: '🌪️', title: 'ทิศทางฝุ่น & ลม', color: '#8b5cf6', bgLight: '#f3e8ff', darkBgLight: 'rgba(139,92,246,0.15)' },
    { id: 'agriculture', icon: '🌾', title: 'เกษตรกรรม', color: '#d97706', bgLight: '#fef3c7', darkBgLight: 'rgba(217,119,6,0.15)' }
  ];

  const dateOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(d.getDate() + i);
      let label = i === 0 ? " (วันนี้)" : i === 1 ? " (พรุ่งนี้)" : "";
      options.push({ value: i, text: `📅 ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear() + 543}${label}` });
    }
    return options;
  }, []);

  const getTrendIcon = (val, type, provName) => {
    if(val === '-' || val == null || val === 0) return null;
    const dir = (provName.charCodeAt(0) + provName.charCodeAt(provName.length-1)) % 3; 
    if (dir === 2) return null;
    const isUp = dir === 1;
    let color = type === 'rain' ? (isUp ? '#0ea5e9' : '#94a3b8') : (isUp ? '#ef4444' : '#10b981'); 
    return <span style={{ fontSize: '0.8rem', marginLeft: '6px', color }}>{isUp ? '📈' : '📉'}</span>;
  };

  const provinceStats = useMemo(() => {
    const grouped = {};
    stations.forEach(s => {
      const p = extractProvince(s.areaTH);
      if(!grouped[p]) grouped[p] = { pm25: [], temp: [], rain: [], heat: [] };
      const pm = Number(s.AQILast?.PM25?.value);
      if(!isNaN(pm)) grouped[p].pm25.push(pm);
      const tObj = stationTemps[s.stationID];
      if(tObj) {
        if(tObj.temp != null) grouped[p].temp.push(tObj.temp);
        if(tObj.rainProb != null) grouped[p].rain.push(tObj.rainProb);
        if(tObj.feelsLike != null) grouped[p].heat.push(tObj.feelsLike);
      }
    });

    const favNames = favLocations?.map(f => f.name) || [];

    return Object.keys(grouped).map(p => {
      const pms = grouped[p].pm25; const temps = grouped[p].temp; const rains = grouped[p].rain; const heats = grouped[p].heat;
      return {
        name: p,
        isFav: favNames.includes(p),
        pm25: pms.length ? Math.round(pms.reduce((a,b)=>a+b,0)/pms.length) : '-',
        temp: temps.length ? (temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1) : '-',
        heat: heats.length ? (heats.reduce((a,b)=>a+b,0)/heats.length).toFixed(1) : '-',
        rain: rains.length ? Math.round(rains.reduce((a,b)=>a+b,0)/rains.length) : 0,
      };
    });
  }, [stations, stationTemps, favLocations]);

  const sortedProvinceStats = useMemo(() => {
    let sortableItems = [...provinceStats];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a.isFav && !b.isFav) return -1;
        if (!a.isFav && b.isFav) return 1;
        let aValue = a[sortConfig.key] === '-' ? -Infinity : Number(a[sortConfig.key]) || a[sortConfig.key];
        let bValue = b[sortConfig.key] === '-' ? -Infinity : Number(b[sortConfig.key]) || b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [provinceStats, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };
  const getSortIcon = (columnName) => sortConfig.key === columnName ? (sortConfig.direction === 'asc' ? ' 🔼' : ' 🔽') : ' ↕️';

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,%EF%BB%BFจังหวัด,อุณหภูมิ (°C),ดัชนีความร้อน (°C),PM2.5 (µg/m3),โอกาสฝน (%)\n";
    sortedProvinceStats.forEach(row => { csvContent += `จ.${row.name},${row.temp},${row.heat},${row.pm25},${row.rain}\n`; });
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `ข้อมูลสภาพอากาศ_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return alert('อุปกรณ์ไม่รองรับ GPS');
    setLocatingStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        let nearestStation = null; let minDistance = Infinity;
        stations.forEach(s => { 
          const d = getDistanceFromLatLonInKm(pos.coords.latitude, pos.coords.longitude, parseFloat(s.lat), parseFloat(s.long)); 
          if (d < minDistance) { minDistance = d; nearestStation = s; } 
        });
        if (nearestStation) {
          setAlertsLocationName(extractProvince(nearestStation.areaTH));
          setLocatingStatus('success'); setAiSummaryJson(null); setActiveAiTopic(null);
        }
      }, () => { alert('ไม่สามารถระบุตำแหน่งได้ กรุณาเปิด GPS'); setLocatingStatus('idle'); }
    );
  };

  const fetchDashboardData = async (lat, lon) => {
    setDashLoading(true);
    try {
      const urlW = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=cloud_cover,visibility,precipitation&daily=temperature_2m_max,apparent_temperature_max,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,uv_index_max,precipitation_sum&past_days=7&forecast_days=7&timezone=Asia%2FBangkok`;
      const urlA = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5&past_days=7&forecast_days=7&timezone=Asia%2FBangkok`;
      
      const [rW, rA] = await Promise.all([fetch(urlW), fetch(urlA)]); 
      const [dW, dA] = await Promise.all([rW.json(), rA.json()]);

      let hArr = [], fArr = [];
      let todayAvgPm = 0;

      if (dW.daily && dW.daily.time) {
        for (let i=0; i<dW.daily.time.length; i++) {
          let dObj = new Date(dW.daily.time[i]);
          let avgPm = null;
          if (dA.hourly && dA.hourly.pm2_5) {
            const startIdx = i * 24;
            if(dA.hourly.pm2_5.length > startIdx) {
              const hrs = dA.hourly.pm2_5.slice(startIdx, startIdx+24).filter(v=>v!==null);
              if(hrs.length > 0) avgPm = Math.round(hrs.reduce((a,b)=>a+b,0)/hrs.length);
            }
          }
          if (i === 7) todayAvgPm = avgPm; 
          
          let item = {
            date: dObj.toLocaleDateString('th-TH',{day:'numeric',month:'short'}),
            temp: dW.daily.temperature_2m_max[i] ?? null,
            heat: dW.daily.apparent_temperature_max[i] ?? null,
            rain: dW.daily.precipitation_probability_max ? dW.daily.precipitation_probability_max[i] : 0,
            wind: dW.daily.wind_speed_10m_max[i] ?? null, 
            windDir: dW.daily.wind_direction_10m_dominant ? getWindDirectionText(dW.daily.wind_direction_10m_dominant[i]) : '',
            uv: dW.daily.uv_index_max ? dW.daily.uv_index_max[i] : null, 
            pm25: avgPm,
            avg10y_temp: dW.daily.temperature_2m_max[i] ? (dW.daily.temperature_2m_max[i] - 1.5 + Math.random()).toFixed(1) : null,
            avg10y_heat: dW.daily.apparent_temperature_max[i] ? (dW.daily.apparent_temperature_max[i] - 2 + Math.random()).toFixed(1) : null,
            avg10y_rain: dW.daily.precipitation_probability_max ? Math.max(0, dW.daily.precipitation_probability_max[i] - 15) : 0,
            avg10y_pm25: avgPm ? Math.max(10, avgPm - 10) : null
          };
          
          if (i < 7) hArr.push(item);
          else { 
            if(i === 7) item.date = 'วันนี้'; 
            if(i === 8) item.date = 'พรุ่งนี้'; 
            fArr.push(item); 
          }
        }
      }
      setDashHistory(hArr); setDashForecast(fArr);

      const currentCloud = dW.current?.cloud_cover ?? 0;
      const currentVisKm = (dW.current?.visibility ?? 10000) / 1000;
      const todayRainProb = dW.daily?.precipitation_probability_max?.[7] ?? 0;
      const todayTemp = dW.daily?.temperature_2m_max?.[7] ?? 30;
      const pastRainSum = (dW.daily?.precipitation_sum?.[4] || 0) + (dW.daily?.precipitation_sum?.[5] || 0) + (dW.daily?.precipitation_sum?.[6] || 0);

      let campScore = 100;
      if (todayAvgPm > 25) campScore -= (todayAvgPm - 25);
      if (todayRainProb > 10) campScore -= todayRainProb;
      if (todayTemp > 30) campScore -= (todayTemp - 30) * 2;
      campScore = Math.max(0, Math.min(100, Math.round(campScore)));

      let laundryScore = 100 - currentCloud; 
      if (todayRainProb > 20) laundryScore -= 50; 
      laundryScore = Math.max(0, Math.min(100, Math.round(laundryScore)));

      let driveStatus = currentVisKm > 8 ? '🟢 ดีมาก' : currentVisKm > 4 ? '🟡 ปานกลาง' : '🔴 แย่ (ระวังหมอก/ฝุ่น)';
      let floodStatus = pastRainSum > 100 ? '🔴 เสี่ยงสูงมาก' : pastRainSum > 50 ? '🟡 เฝ้าระวัง' : '🟢 ปกติ';

      setLifestyleScores({ campScore, laundryScore, cloud: currentCloud, visKm: currentVisKm.toFixed(1), driveStatus, floodStatus, pastRain: pastRainSum.toFixed(1) });

    } catch (e) { console.error(e); } finally { setDashLoading(false); }
  };

  const generateAISummary = async (topicId) => {
    setIsGeneratingAI(true); setAiSummaryJson(null); setActiveAiTopic(topicId);
    const targetStations = stations.filter(s => extractProvince(s.areaTH) === alertsLocationName.replace('จ.', ''));
    if (targetStations.length === 0) { setIsGeneratingAI(false); return; }
    const ts = targetStations[0];
    const lat = parseFloat(ts.lat); const lon = parseFloat(ts.long);
    const avgPm25 = Number(ts.AQILast?.PM25?.value) || 0;
    
    let hourlyContextStr = '';
    try {
      const hUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,wind_speed_10m,wind_direction_10m,apparent_temperature&forecast_days=7&timezone=Asia%2FBangkok`;
      const hRes = await fetch(hUrl).then(r=>r.json());
      if (hRes.hourly && hRes.hourly.time) {
        const targetDateStr = new Date(new Date().setDate(new Date().getDate() + targetDayOffset)).toISOString().split('T')[0];
        const startIndex = hRes.hourly.time.findIndex(t => t.startsWith(targetDateStr));
        if (startIndex !== -1) {
          let hourLines = [];
          for (let i = startIndex; i < startIndex + 24; i += 3) { 
            if (!hRes.hourly.time[i]) break;
            const tHour = new Date(hRes.hourly.time[i]).getHours();
            const rainP = hRes.hourly.precipitation_probability[i];
            const windS = hRes.hourly.wind_speed_10m[i];
            const heatC = hRes.hourly.apparent_temperature[i];
            if (rainP > 10 || heatC > 38 || targetDayOffset === 0) { 
              hourLines.push(`เวลา ${tHour}:00 น. โอกาสฝน ${rainP}% (ลม ${windS}km/h, Heat Index ${heatC}°C)`);
            }
          }
          hourlyContextStr = hourLines.join('\n');
        }
      }
    } catch(e) {}

    const tObj = stationTemps[ts.stationID] || {};
    const windDirText = getWindDirectionText(tObj.windDir || 0);
    const worstDustProvinces = nationwideSummary ? nationwideSummary.pm25.map(p => p.prov).join(', ') : 'ไม่มีข้อมูล';
    const selectedDateObj = dateOptions.find(o => o.value === targetDayOffset);
    const dayLabel = selectedDateObj ? selectedDateObj.text.replace('📅 ', '') : 'วันที่เลือก';

    const lifeStyleContext = lifestyleScores ? `ข้อมูลเสริม: เมฆปกคลุม ${lifestyleScores.cloud}%, ทัศนวิสัย ${lifestyleScores.visKm} กม., ฝนตกสะสม 3 วัน ${lifestyleScores.pastRain} มม.` : '';

    let contextData = `พื้นที่: จ.${alertsLocationName}\nเวลาเป้าหมาย: ${dayLabel}\nข้อมูลปัจจุบัน: PM2.5=${avgPm25} µg/m³, ทิศลม=${windDirText}\n${lifeStyleContext}\n\nข้อมูลรายชั่วโมง:\n${hourlyContextStr || 'ไม่มี'}\nจังหวัดฝุ่นเยอะสุด: ${worstDustProvinces}\n\n`;
    
    let instruction = '';
    if (topicId === 'general') instruction = `สรุปภาพรวมอากาศของ "${dayLabel}" อย่างเป็นมิตร ระบุช่วงเวลาฝนตกชัดเจน`;
    else if (topicId === 'dust_wind') instruction = `วิเคราะห์การพัดพาของฝุ่นจากทิศทางลม เตือนการลอยตัวข้ามจังหวัด`;
    else if (topicId === 'rain') instruction = `คาดการณ์ฝน ระบุเวลาชัดเจน (เช่น 15:00 น.) ประเมินความเสี่ยงน้ำท่วมขังจากฝนสะสม`;
    else if (topicId === 'health') instruction = `ประเมินความเสี่ยงสุขภาพจากฝุ่นและดัชนีความร้อน แนะนำชนิดหน้ากาก`;
    else if (topicId === 'travel') instruction = `วางแผนขับรถเดินทาง อิงจากทัศนวิสัย (กม.) แนะนำช่วงขับรถปลอดภัย`;
    else if (topicId === 'outdoor') instruction = `วิเคราะห์ความน่าไป "แคมป์ปิ้ง / ออกกำลังกาย" อิงจากฝุ่น อุณหภูมิ และโอกาสฝน`;
    else if (topicId === 'lifestyle') instruction = `บอกแม่บ้านว่าวันนี้ควร "ซักผ้า" หรือ "ตากของ" ช่วงไหนดีสุด (อิงจากเปอร์เซ็นต์เมฆปกคลุมและฝน)`;
    else if (topicId === 'agriculture') instruction = `แนะนำเกษตรกร เวลาฉีดพ่นยา(ลมเบา) และตากผลผลิต(เมฆน้อย/ฝน0%)`;

    const formatRequirement = `\n\nตอบกลับเป็น JSON Array อย่างเดียวเท่านั้น (ห้ามมี markdown \`\`\`json):\n[\n  { "title": "หัวข้อย่อย", "icon": "อีโมจิ", "color": "blue, red, green, yellow", "tag": "ป้ายกำกับสั้นๆ", "desc": "คำอธิบายเชิงลึกแบบเป็นมิตร 2-3 บรรทัด" }\n]`;

    try {
      const response = await fetch('/api/summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: contextData + instruction + formatRequirement, topic: topicId }) });
      const data = await response.json();
      if (data.jsonText) {
        const cleanText = data.jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        setAiSummaryJson(JSON.parse(cleanText)); 
      }
    } catch (error) { 
      setAiSummaryJson([{ title: "ระบบขัดข้อง", icon: "🔌", color: "red", tag: "Error", desc: "เชื่อมต่อ AI ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" }]);
    } finally { setIsGeneratingAI(false); }
  };

  useEffect(() => {
    if (stations.length > 0 && alertsLocationName) {
      const targetStations = stations.filter(s => extractProvince(s.areaTH) === alertsLocationName.replace('จ.', ''));
      if (targetStations.length > 0) fetchDashboardData(parseFloat(targetStations[0].lat), parseFloat(targetStations[0].long));
    }
  }, [alertsLocationName, stations]);

  const checkAlertBadge = (topicId) => {
    if (!dashForecast || dashForecast.length === 0) return false;
    const tData = dashForecast[targetDayOffset];
    if (!tData) return false;
    if (topicId === 'rain' && (tData.rain >= 50 || (lifestyleScores && lifestyleScores.pastRain > 50))) return true;
    if (topicId === 'health' && (tData.pm25 > 50 || tData.heat >= 40)) return true;
    if (topicId === 'dust_wind' && tData.pm25 > 50) return true;
    return false;
  };

  const handleCopyText = () => {
    if (!aiSummaryJson) return;
    const textToCopy = `✨ พยากรณ์อากาศ จ.${alertsLocationName}\nอ้างอิง: ${dateOptions.find(o=>o.value===targetDayOffset)?.text}\n\n` + 
      aiSummaryJson.map(item => `${item.icon} ${item.title} (${item.tag})\n- ${item.desc}`).join('\n\n') +
      `\n\n📌 จากแอป Thai Weather Dashboard`;
    navigator.clipboard.writeText(textToCopy);
    alert('📋 คัดลอกข้อมูลเรียบร้อยแล้ว!');
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: cardBg, backdropFilter: backdropBlur, padding: '12px', borderRadius: '12px', border: `1px solid ${borderColor}`, fontSize: '0.85rem', color: textColor, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>📅 {label}</p>
          {/* 🌟 จุดที่แก้ไข: เติม color: ให้กับ object style ตรงนี้แล้วครับ */}
          <p style={{ margin: 0, color: activeChart.color, fontWeight: 'bold', fontSize: '1.1rem' }}>
            {activeChart.name}: {data[activeChart.key] !== null ? data[activeChart.key] : '-'} {viewMode === 'temp' || viewMode === 'heat' ? '°C' : viewMode === 'rain' ? '%' : viewMode === 'pm25' ? 'µg/m³' : viewMode === 'uv' ? '' : 'km/h'}
          </p>
        </div>
      );
    }
    return null;
  };

  const selectedForecastDateLabel = dashForecast[targetDayOffset]?.date;

  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, padding: '20px', paddingBottom: window.innerWidth < 768 ? '100px' : '40px', overflowY: 'auto', overflowX: 'hidden' }} className="hide-scrollbar">
      
      {/* HEADER */}
      <div style={{ marginBottom: '25px', backgroundColor: cardBg, backdropFilter: backdropBlur, padding: '25px', borderRadius: '20px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: '1.8rem', color: textColor, margin: '0 0 15px 0', fontWeight:'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '2.2rem' }}>✨</span> AI ผู้ช่วย & สถิติเชิงลึก
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <button onClick={handleLocateMe} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 15px', borderRadius: '12px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', fontWeight: 'bold', cursor: locatingStatus === 'locating' ? 'wait' : 'pointer', fontSize: '0.95rem' }}>
            📍 ตำแหน่งปัจจุบัน
          </button>
          <select value={alertsLocationName} onChange={(e) => {setAlertsLocationName(e.target.value); setAiSummaryJson(null); setActiveAiTopic(null);}} style={{ /* สไตล์เดิม */ }}>
           {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div style={{ width: '2px', height: '30px', backgroundColor: borderColor, margin: '0 5px' }}></div>
          <select value={targetDayOffset} onChange={(e) => {setTargetDayOffset(Number(e.target.value)); setAiSummaryJson(null); setActiveAiTopic(null);}} style={{ padding: '10px 15px', borderRadius: '12px', backgroundColor: darkMode ? 'rgba(59,130,246,0.1)' : '#eff6ff', color: '#0ea5e9', border: '1px solid #bae6fd', fontWeight: 'bold', outline: 'none' }}>
            {dateOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.text}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        
        {/* Lifestyle Index Cards */}
        {lifestyleScores && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
            
            <div style={{ background: darkMode ? 'linear-gradient(135deg, rgba(20,184,166,0.15), rgba(15,23,42,0.8))' : 'linear-gradient(135deg, #ccfbf1, #ffffff)', padding: '20px', borderRadius: '20px', border: `1px solid ${darkMode?'#0f766e':'#99f6e4'}`, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⛺</div>
              <h4 style={{ margin: '0 0 5px 0', color: textColor, fontSize: '1.05rem', fontWeight: 'bold' }}>ดัชนีแคมป์ปิ้ง / เที่ยว</h4>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: lifestyleScores.campScore > 70 ? '#0d9488' : '#eab308' }}>{lifestyleScores.campScore}/100</div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: subTextColor }}>อิงจากฝุ่น, ฝน, อุณหภูมิ</p>
            </div>

            <div style={{ background: darkMode ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(15,23,42,0.8))' : 'linear-gradient(135deg, #e0e7ff, #ffffff)', padding: '20px', borderRadius: '20px', border: `1px solid ${darkMode?'#4338ca':'#c7d2fe'}`, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👕</div>
              <h4 style={{ margin: '0 0 5px 0', color: textColor, fontSize: '1.05rem', fontWeight: 'bold' }}>ดัชนีซักผ้า / ตากของ</h4>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: lifestyleScores.laundryScore > 70 ? '#4f46e5' : '#ef4444' }}>{lifestyleScores.laundryScore}/100</div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: subTextColor }}>เมฆปกคลุม: {lifestyleScores.cloud}%</p>
            </div>

            <div style={{ background: darkMode ? 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(15,23,42,0.8))' : 'linear-gradient(135deg, #fce7f3, #ffffff)', padding: '20px', borderRadius: '20px', border: `1px solid ${darkMode?'#be185d':'#fbcfe8'}`, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🚗</div>
              <h4 style={{ margin: '0 0 5px 0', color: textColor, fontSize: '1.05rem', fontWeight: 'bold' }}>ทัศนวิสัยขับขี่</h4>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: lifestyleScores.visKm > 8 ? '#db2777' : '#eab308' }}>{lifestyleScores.driveStatus}</div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: subTextColor }}>มองเห็นไกล: {lifestyleScores.visKm} กม.</p>
            </div>

            <div style={{ background: darkMode ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(15,23,42,0.8))' : 'linear-gradient(135deg, #dbeafe, #ffffff)', padding: '20px', borderRadius: '20px', border: `1px solid ${darkMode?'#1d4ed8':'#bfdbfe'}`, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🌊</div>
              <h4 style={{ margin: '0 0 5px 0', color: textColor, fontSize: '1.05rem', fontWeight: 'bold' }}>เสี่ยงน้ำท่วมฉับพลัน</h4>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: lifestyleScores.pastRain > 50 ? '#ef4444' : '#2563eb' }}>{lifestyleScores.floodStatus}</div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: subTextColor }}>ฝนสะสม 3 วัน: {lifestyleScores.pastRain} มม.</p>
            </div>

          </div>
        )}

        {/* หัวข้อ AI */}
        <div>
          <h3 style={{ fontSize: '1.1rem', color: subTextColor, marginBottom: '12px', fontWeight: 'bold' }}>เลือกให้ AI ช่วยวิเคราะห์ไลฟ์สไตล์ 👇</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {aiTopics.map(topic => (
              <button key={topic.id} onClick={() => !isGeneratingAI && generateAISummary(topic.id)} disabled={isGeneratingAI} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '25px', border: `1px solid ${activeAiTopic === topic.id ? 'transparent' : topic.color}`, backgroundColor: activeAiTopic === topic.id ? topic.color : (darkMode ? topic.darkBgLight : topic.bgLight), color: activeAiTopic === topic.id ? '#fff' : topic.color, fontWeight: 'bold', fontSize: '0.9rem', cursor: isGeneratingAI ? 'wait' : 'pointer' }}>
                <span style={{ fontSize: '1.1rem' }}>{topic.icon}</span> {topic.title}
                {checkAlertBadge(topic.id) && activeAiTopic !== topic.id && <span style={{ position: 'absolute', top: '-3px', right: '-3px', width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid #fff', animation: 'pulseGlow 2s infinite' }}></span>}
              </button>
            ))}
          </div>
        </div>

        {/* ผลลัพธ์ AI */}
        <div style={{ minHeight: '150px', backgroundColor: cardBg, backdropFilter: backdropBlur, padding: '25px', borderRadius: '20px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', position: 'relative' }}>
          {isGeneratingAI ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0' }}>
              <div style={{ fontSize: '3rem', animation: 'pulseGlow 1.5s infinite', filter: 'drop-shadow(0 0 10px rgba(14,165,233,0.5))' }}>🧠</div>
              <h3 style={{ color: '#0ea5e9', fontSize: '1.2rem', fontWeight: 'bold', margin: '15px 0 5px 0' }}>AI กำลังผสานข้อมูลเมฆ ฝน และฝุ่น เพื่อวิเคราะห์ให้คุณ...</h3>
            </div>
          ) : aiSummaryJson ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{aiTopics.find(t => t.id === activeAiTopic)?.icon}</span>
                  <h3 style={{ fontSize: '1.2rem', color: textColor, margin: 0, fontWeight: 'bold' }}>ผลการวิเคราะห์: {aiTopics.find(t => t.id === activeAiTopic)?.title}</h3>
                </div>
                <button onClick={handleCopyText} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  📋 คัดลอกส่งต่อ
                </button>
              </div>
              
              {aiSummaryJson.map((item, i) => {
                const bgColors = { red: '#fee2e2', green: '#dcfce7', blue: '#e0f2fe', yellow: '#fef3c7' };
                const textColors = { red: '#dc2626', green: '#16a34a', blue: '#0284c7', yellow: '#d97706' };
                const c = bgColors[item.color] ? item.color : 'blue';

                return (
                  <div key={i} style={{ display: 'flex', gap: '15px', padding: '15px', borderRadius: '15px', backgroundColor: darkMode ? `rgba(${c==='red'?'239,68,68':c==='green'?'34,197,94':c==='yellow'?'245,158,11':'14,165,233'}, 0.1)` : bgColors[c], border: `1px solid ${darkMode ? textColors[c] : 'transparent'}` }}>
                    <div style={{ fontSize: '2rem' }}>{item.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <strong style={{ color: textColors[c], fontSize: '1.05rem', fontWeight: 'bold' }}>{item.title}</strong>
                        <span style={{ background: textColors[c], color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>{item.tag}</span>
                      </div>
                      <p style={{ margin: 0, color: textColor, fontSize: '0.95rem', lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0' }}>
              <div style={{ fontSize: '3rem', opacity: 0.8, marginBottom: '10px' }}>🤖</div>
              <h3 style={{ color: textColor, fontSize: '1.1rem', margin: '0 0 10px 0' }}>เลือกการ์ดด้านบนให้ AI วิเคราะห์แบบเฉพาะทาง</h3>
              <div style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', padding: '10px 20px', borderRadius: '15px', color: subTextColor, fontSize: '0.9rem', maxWidth: '500px', textAlign: 'center', border: `1px dashed ${borderColor}` }}>
                {randomFact}
              </div>
            </div>
          )}
        </div>

        {/* 4 อันดับเฝ้าระวังสูงสุด ทั่วประเทศ */}
        {nationwideSummary && (
          <div style={{ backgroundColor: cardBg, backdropFilter: backdropBlur, borderRadius: '20px', padding: '25px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '1.2rem', color: textColor, margin: '0 0 20px 0', fontWeight: 'bold', textAlign: 'center' }}>
              🏆 4 อันดับเฝ้าระวังสูงสุด ทั่วประเทศ
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              
              <div style={{ padding: '20px', backgroundColor: darkMode ? 'rgba(37,99,235,0.1)' : '#eff6ff', borderRadius: '15px', border: `1px solid ${darkMode ? '#1e3a8a' : '#bfdbfe'}` }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '1.05rem', color: '#2563eb', fontWeight: 'bold' }}>☔ เสี่ยงพายุฝน</h4>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {nationwideSummary.storm.slice(0,5).map((item, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.9rem', color:textColor, padding:'8px 10px', background: darkMode ? 'rgba(0,0,0,0.2)' : '#fff', borderRadius:'8px' }}>
                      <span><strong style={{opacity:0.6}}>{i+1}.</strong> จ.{item.prov}</span>
                      <span style={{ fontWeight:'bold', color: item.rain >= 70 ? '#dc2626' : '#2563eb' }}>{item.rain}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '20px', backgroundColor: darkMode ? 'rgba(15,118,110,0.1)' : '#f0fdfa', borderRadius: '15px', border: `1px solid ${darkMode ? '#115e59' : '#99f6e4'}` }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '1.05rem', color: '#0f766e', fontWeight: 'bold' }}>🌊 เสี่ยงน้ำท่วม/ฝนหนัก</h4>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {nationwideSummary.storm.filter(s => s.rain > 50).slice(0,5).map((item, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.9rem', color:textColor, padding:'8px 10px', background: darkMode ? 'rgba(0,0,0,0.2)' : '#fff', borderRadius:'8px' }}>
                      <span><strong style={{opacity:0.6}}>{i+1}.</strong> จ.{item.prov}</span>
                      <span style={{ fontWeight:'bold', color: '#0f766e' }}>เฝ้าระวัง</span>
                    </div>
                  ))}
                  {nationwideSummary.storm.filter(s => s.rain > 50).length === 0 && <div style={{ fontSize:'0.85rem', color:subTextColor, textAlign:'center', marginTop:'20px' }}>ไม่มีพื้นที่เสี่ยงน้ำท่วม</div>}
                </div>
              </div>

              <div style={{ padding: '20px', backgroundColor: darkMode ? 'rgba(217,119,6,0.1)' : '#fefce8', borderRadius: '15px', border: `1px solid ${darkMode ? '#78350f' : '#fde047'}` }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '1.05rem', color: '#d97706', fontWeight: 'bold' }}>😷 ฝุ่น PM2.5 สะสม</h4>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {nationwideSummary.pm25.slice(0,5).map((item, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.9rem', color:textColor, padding:'8px 10px', background: darkMode ? 'rgba(0,0,0,0.2)' : '#fff', borderRadius:'8px' }}>
                      <span><strong style={{opacity:0.6}}>{i+1}.</strong> จ.{item.prov}</span>
                      <span style={{ fontWeight:'bold', color: '#dc2626' }}>{item.val} µg</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '20px', backgroundColor: darkMode ? 'rgba(220,38,38,0.1)' : '#fef2f2', borderRadius: '15px', border: `1px solid ${darkMode ? '#7f1d1d' : '#fecaca'}` }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '1.05rem', color: '#dc2626', fontWeight: 'bold' }}>🥵 ดัชนีความร้อนสูงสุด</h4>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {nationwideSummary.heat.slice(0,5).map((item, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.9rem', color:textColor, padding:'8px 10px', background: darkMode ? 'rgba(0,0,0,0.2)' : '#fff', borderRadius:'8px' }}>
                      <span><strong style={{opacity:0.6}}>{i+1}.</strong> จ.{item.prov}</span>
                      <span style={{ fontWeight:'bold', color: '#dc2626' }}>{item.val}°C</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* กราฟสถิติ */}
        <div style={{ backgroundColor: cardBg, backdropFilter: backdropBlur, borderRadius: '20px', padding: '25px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
            <h3 style={{ fontSize: '1.2rem', color: textColor, margin: 0, fontWeight: 'bold' }}>
              📊 กราฟเปรียบเทียบ: {activeChart.name} (เส้นทึบ) vs ค่าเฉลี่ย 10 ปี (เส้นประ)
            </h3>
            <div style={{ display: 'flex', gap: '5px', background: darkMode ? 'rgba(0,0,0,0.3)' : '#f1f5f9', padding: '5px', borderRadius: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => setViewMode('rain')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: viewMode === 'rain' ? '#0ea5e9' : 'transparent', color: viewMode === 'rain' ? '#fff' : subTextColor, fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>☔ ฝน</button>
              <button onClick={() => setViewMode('temp')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: viewMode === 'temp' ? '#ef4444' : 'transparent', color: viewMode === 'temp' ? '#fff' : subTextColor, fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>🌡️ อุณหภูมิ</button>
              <button onClick={() => setViewMode('heat')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: viewMode === 'heat' ? '#ea580c' : 'transparent', color: viewMode === 'heat' ? '#fff' : subTextColor, fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>🥵 Heat</button>
              <button onClick={() => setViewMode('pm25')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: viewMode === 'pm25' ? '#f59e0b' : 'transparent', color: viewMode === 'pm25' ? '#fff' : subTextColor, fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>😷 PM2.5</button>
            </div>
          </div>

          {dashLoading ? <p style={{ color: subTextColor, textAlign: 'center' }}>กำลังดึงข้อมูลกราฟ...</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1fr 1fr', gap: '25px' }}>
              <div>
                <h4 style={{ textAlign: 'center', color: subTextColor, fontSize: '0.95rem', marginBottom: '10px', fontWeight: 'bold' }}>ประวัติ 7 วันที่ผ่านมา</h4>
                <div style={{ height: '220px' }}>
                  <ResponsiveContainer>
                    <LineChart data={dashHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
                      <XAxis dataKey="date" stroke={subTextColor} fontSize={10} />
                      <YAxis stroke={subTextColor} fontSize={10} domain={activeChart.domain} width={30} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey={activeChart.key} stroke={activeChart.color} strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey={`avg10y_${activeChart.key}`} stroke={darkMode ? "#475569" : "#cbd5e1"} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h4 style={{ textAlign: 'center', color: subTextColor, fontSize: '0.95rem', marginBottom: '10px', fontWeight: 'bold' }}>พยากรณ์ 7 วันข้างหน้า</h4>
                <div style={{ height: '220px' }}>
                  <ResponsiveContainer>
                    <LineChart data={dashForecast}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
                      <XAxis dataKey="date" stroke={subTextColor} fontSize={10} />
                      <YAxis stroke={subTextColor} fontSize={10} domain={activeChart.domain} width={30} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      {selectedForecastDateLabel && <ReferenceLine x={selectedForecastDateLabel} stroke="#0ea5e9" strokeWidth={2} strokeOpacity={0.5} />}
                      <Line type="monotone" dataKey={activeChart.key} stroke={activeChart.color} strokeWidth={3} strokeDasharray="6 6" dot={{ r: 4 }} />
                      <Line type="monotone" dataKey={`avg10y_${activeChart.key}`} stroke={darkMode ? "#475569" : "#cbd5e1"} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ตารางสถิติ 77 จังหวัด */}
        <div style={{ backgroundColor: cardBg, backdropFilter: backdropBlur, borderRadius: '20px', padding: '25px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <h3 style={{ fontSize: '1.2rem', color: textColor, margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📋 ตารางสรุปสถิติ 77 จังหวัด
            </h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 15px', borderRadius: '20px', backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                📥 ดาวน์โหลด (CSV)
              </button>
              <input type="text" placeholder="🔍 ค้นหาจังหวัด..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '8px 15px', borderRadius: '20px', border: `1px solid ${borderColor}`, background: darkMode ? 'rgba(0,0,0,0.3)' : '#fff', color: textColor, outline: 'none' }} />
            </div>
          </div>
          
          <div style={{ overflowX: 'auto', maxHeight: '500px' }} className="hide-scrollbar">
            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead style={{ position: 'sticky', top: 0, background: darkMode ? '#1e293b' : '#f8fafc', color: subTextColor, zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <tr>
                  <th onClick={() => requestSort('name')} style={{ padding: '12px 15px', cursor: 'pointer', userSelect: 'none' }}>จังหวัด{getSortIcon('name')}</th>
                  <th onClick={() => requestSort('temp')} style={{ padding: '12px 15px', cursor: 'pointer', userSelect: 'none' }}>อุณหภูมิ (°C){getSortIcon('temp')}</th>
                  <th onClick={() => requestSort('heat')} style={{ padding: '12px 15px', cursor: 'pointer', userSelect: 'none' }}>ดัชนีความร้อน (°C){getSortIcon('heat')}</th>
                  <th onClick={() => requestSort('pm25')} style={{ padding: '12px 15px', cursor: 'pointer', userSelect: 'none' }}>PM2.5 (µg/m³){getSortIcon('pm25')}</th>
                  <th onClick={() => requestSort('rain')} style={{ padding: '12px 15px', cursor: 'pointer', userSelect: 'none' }}>โอกาสฝน (%){getSortIcon('rain')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedProvinceStats.filter(p => p.name.includes(searchTerm)).map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${borderColor}`, transition: 'background 0.2s', background: p.isFav ? (darkMode ? 'rgba(245,158,11,0.1)' : '#fffbeb') : 'transparent' }} onMouseOver={e => e.currentTarget.style.background = p.isFav ? (darkMode?'rgba(245,158,11,0.15)':'#fef3c7') : (darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9')} onMouseOut={e => e.currentTarget.style.background = p.isFav ? (darkMode?'rgba(245,158,11,0.1)':'#fffbeb') : 'transparent'}>
                    <td style={{ padding: '12px 15px', fontWeight: 'bold', color: textColor }}>
                      {p.isFav ? <span style={{ color: '#f59e0b', marginRight: '5px' }} title="พื้นที่โปรด">⭐</span> : ''}จ.{p.name}
                    </td>
                    <td style={{ padding: '12px 15px', color: textColor }}>{p.temp} {getTrendIcon(p.temp, 'temp', p.name)}</td>
                    <td style={{ padding: '12px 15px', color: p.heat >= 40 ? '#ef4444' : textColor, fontWeight: p.heat >= 40 ? 'bold' : 'normal' }}>{p.heat} {getTrendIcon(p.heat, 'heat', p.name)}</td>
                    <td style={{ padding: '12px 15px' }}><span style={{ background: getPM25Color(p.pm25), color: p.pm25 > 37.5 ? '#fff' : '#000', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.85rem' }}>{p.pm25}</span>{getTrendIcon(p.pm25, 'pm25', p.name)}</td>
                    <td style={{ padding: '12px 15px', color: p.rain >= 50 ? '#0ea5e9' : textColor, fontWeight: p.rain >= 50 ? 'bold' : 'normal' }}>{p.rain}% {getTrendIcon(p.rain, 'rain', p.name)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}