import React, { useContext, useState, useEffect, useMemo } from 'react';
import { WeatherContext } from '../context/WeatherContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, AreaChart, Area } from 'recharts';
import { useWeatherData } from '../hooks/useWeatherData';
import heroBg from '../assets/hero.png';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ color: entry.color, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color }}></span>
            {entry.name}: {entry.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AIPage() {
  const { stations, darkMode } = useContext(WeatherContext);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { weatherData, loadingWeather, fetchWeatherByCoords } = useWeatherData();
  const [trendTab, setTrendTab] = useState('temp');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!weatherData && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeatherByCoords(13.75, 100.5),
        { timeout: 5000 }
      );
    } else if (!weatherData) {
      fetchWeatherByCoords(13.75, 100.5);
    }
  }, [fetchWeatherByCoords, weatherData]);

  const cardBg = 'var(--bg-card)';
  const textColor = 'var(--text-main)';
  const borderColor = 'var(--border-color)';
  const subTextColor = 'var(--text-sub)';

  if (loadingWeather || !weatherData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: textColor }}>
        <div className="loading-spinner" />
        <div style={{ marginTop: '16px', fontWeight: 'bold' }}>กำลังให้ AI ประมวลผล...</div>
      </div>
    );
  }

  const { current, hourly, daily } = weatherData;
  const nowMs = Date.now();
  const startIdx = hourly?.time?.findIndex(t => new Date(t).getTime() >= nowMs - 3600000) || 0;
  
  // Prepare Trend Data (next 24 hours)
  const trendData = (hourly?.time?.slice(startIdx, startIdx + 24).filter((_, i) => i % 3 === 0) || []).map((t, i) => {
    const rIdx = startIdx + (i * 3);
    return {
      time: new Date(t).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(hourly?.temperature_2m?.[rIdx] || 0),
      rain: hourly?.precipitation_probability?.[rIdx] || 0,
      pm25: Math.round(hourly?.pm25?.[rIdx] || 0),
      wind: Math.round(hourly?.wind_speed_10m?.[rIdx] || 0),
      humidity: hourly?.relative_humidity_2m?.[rIdx] || 0,
    };
  });

  // Prepare 6 Hour Forecast
  const sixHourForecast = (hourly?.time?.slice(startIdx, startIdx + 6) || []).map((t, i) => {
    const rIdx = startIdx + i;
    const rain = hourly?.precipitation_probability?.[rIdx] || 0;
    return {
      time: new Date(t).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      rain,
      icon: rain > 50 ? '⛈️' : rain > 20 ? '🌧️' : '☁️'
    };
  });

  // Prepare Compare Data (today vs yesterday) - mocking yesterday for demo matching image
  const compareData = trendData.map(d => ({
    time: d.time,
    today: d.temp,
    yesterday: d.temp - (Math.random() * 3 - 1) // Slightly lower yesterday
  }));

  const maxTemp = Math.round(daily?.temperature_2m_max?.[0] || 0);
  const rainProb = daily?.precipitation_probability_max?.[0] || 0;
  
  // Metric Card Component
  const MetricBox = ({ icon, value, label, subLabel, color }) => (
    <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '16px', border: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ fontSize: '0.75rem', color: subTextColor }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>{icon}</span> {value}
      </div>
      {subLabel && <div style={{ fontSize: '0.65rem', color: subTextColor }}>{subLabel}</div>}
    </div>
  );

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', background: 'var(--bg-app)', minHeight: '100%', color: textColor, fontFamily: 'Sarabun, sans-serif' }} className="hide-scrollbar">
      {/* Greeting Header */}
      <div style={{ background: cardBg, borderRadius: '24px', padding: isMobile ? '20px' : '24px', display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 'bold', flexShrink: 0, boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)' }}>AI</div>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.3rem', color: '#4f46e5', fontWeight: '800' }}>สวัสดีครับ! ผมคือ Thai Weather AI</h2>
          <p style={{ margin: '4px 0 12px 0', fontSize: '0.9rem', color: subTextColor }}>ผมช่วยวิเคราะห์สภาพอากาศและให้คำแนะนำที่เหมาะกับคุณ</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['สภาพอากาศวันนี้เป็นอย่างไร?', 'พรุ่งนี้ฝนจะตกไหม?', 'เหมาะกับการออกกำลังกายหรือไม่?'].map(q => (
              <button key={q} style={{ background: 'var(--bg-secondary)', border: `1px solid ${borderColor}`, borderRadius: '20px', padding: '6px 14px', fontSize: '0.75rem', color: '#0ea5e9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                <span style={{ opacity: 0.7 }}>🪄</span> {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Columns Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* ================= COLUMN 1 ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* สรุปภาพรวมวันนี้ */}
          <div style={{ background: cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '800' }}>สรุปภาพรวมวันนี้</h3>
            <div style={{ fontSize: '0.8rem', color: subTextColor, marginBottom: '20px' }}>อัปเดตล่าสุด {new Date().toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})} น.</div>
            
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', padding: '20px', color: '#fff', marginBottom: '20px', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(14,165,233,0.9) 0%, rgba(14,165,233,0.6) 100%)', zIndex: 1 }} />
              <div style={{ position: 'relative', zIndex: 2, fontSize: '0.9rem', lineHeight: '1.6', fontWeight: '500', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                วันนี้อากาศร้อนถึงร้อนจัด อุณหภูมิสูงสุด {maxTemp}°C<br/>
                มีโอกาสฝนฟ้าคะนองช่วงบ่ายถึงเย็น ประมาณ {rainProb}%<br/>
                พร้อมลมกระโชกแรงบางพื้นที่<br/>
                คุณภาพอากาศอยู่ในเกณฑ์ดีถึงปานกลาง
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <MetricBox icon="🌡️" label="อุณหภูมิสูงสุด" value={`${maxTemp}°C`} subLabel="↑ 2°C จากเมื่อวาน" color="#ef4444" />
              <MetricBox icon="🥵" label="ความรู้สึกร้อน" value={`${Math.round(current?.feelsLike || 0)}°C`} subLabel="ร้อนจัด" color="#f97316" />
              <MetricBox icon="🌧️" label="โอกาสฝน" value={`${rainProb}%`} subLabel="ช่วงบ่าย-เย็น" color="#3b82f6" />
              <MetricBox icon="💨" label="ลม" value={`${Math.round(current?.windSpeed || 0)} km/h`} subLabel="ทิศตะวันตกเฉียงใต้" color="#22c55e" />
              <MetricBox icon="🌫️" label="PM2.5" value={`${Math.round(current?.pm25 || 0)} µg/m³`} subLabel="ดี" color="#10b981" />
              <MetricBox icon="💧" label="ความชื้น" value={`${current?.humidity || 0}%`} subLabel="ค่อนข้างชื้น" color="#8b5cf6" />
            </div>
          </div>

          {/* กราฟแนวโน้ม */}
          <div style={{ background: cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>กราฟแนวโน้มสภาพอากาศ</h3>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto' }} className="hide-scrollbar">
              {[
                { id: 'temp', label: 'อุณหภูมิ' },
                { id: 'rain', label: 'ฝน' },
                { id: 'pm25', label: 'PM2.5' },
                { id: 'wind', label: 'ลม' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTrendTab(t.id)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
                    background: trendTab === t.id ? '#3b82f6' : 'var(--bg-secondary)',
                    color: trendTab === t.id ? '#fff' : subTextColor,
                    border: `1px solid ${trendTab === t.id ? '#3b82f6' : borderColor}`
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ height: '220px', width: '100%', marginLeft: '-15px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: subTextColor }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: subTextColor }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey={trendTab} name={trendTab.toUpperCase()} stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* กิจกรรม */}
          <div style={{ background: cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
             <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: '800' }}>เหมาะกับกิจกรรมอะไรวันนี้?</h3>
             <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }} className="hide-scrollbar">
                {[
                  { icon: '🏃', label: 'วิ่งออกกำลังกาย', status: 'พอใช้', score: '6/10', color: '#f59e0b' },
                  { icon: '🚲', label: 'ปั่นจักรยาน', status: 'พอใช้', score: '6/10', color: '#f59e0b' },
                  { icon: '🏕️', label: 'ท่องเที่ยว', status: 'ดี', score: '8/10', color: '#10b981' },
                  { icon: '🎣', label: 'ตกปลา', status: 'พอใช้', score: '6/10', color: '#f59e0b' },
                  { icon: '👕', label: 'ซักผ้า', status: 'ไม่แนะนำ', score: '3/10', color: '#ef4444' },
                ].map((act, i) => (
                  <div key={i} style={{ minWidth: '90px', padding: '12px', borderRadius: '16px', background: 'var(--bg-secondary)', border: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                     <span style={{ fontSize: '1.5rem' }}>{act.icon}</span>
                     <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{act.label}</span>
                     <span style={{ fontSize: '0.7rem', color: act.color, fontWeight: '800' }}>{act.status}</span>
                     <span style={{ fontSize: '0.65rem', color: subTextColor }}>{act.score}</span>
                  </div>
                ))}
             </div>
             <div style={{ fontSize: '0.7rem', color: subTextColor, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🤖</span> คะแนนแนะนำจากสภาพอากาศปัจจุบัน
             </div>
          </div>

        </div>

        {/* ================= COLUMN 2 ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* AI วิเคราะห์ */}
          <div style={{ background: cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
             <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <span>🧠</span> AI วิเคราะห์สภาพอากาศ
             </h3>
             <div style={{ fontSize: '0.8rem', color: subTextColor, marginBottom: '16px' }}>ประเมินจากข้อมูลล่าสุด</div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '14px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px', border: `1px solid ${borderColor}` }}>
                   <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#dcfce7', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 'bold' }}>✓</div>
                   <div>
                     <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4f46e5' }}>ช่วงเช้า (06:00 - 11:00)</div>
                     <div style={{ fontSize: '0.8rem', color: textColor, marginTop: '4px', lineHeight: '1.4' }}>อากาศร้อน อุณหภูมิ 28-33°C<br/><span style={{color: subTextColor}}>ท้องฟ้าโปร่งถึงมีเมฆบางส่วน</span></div>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px', border: `1px solid ${borderColor}` }}>
                   <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#dcfce7', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 'bold' }}>✓</div>
                   <div>
                     <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4f46e5' }}>ช่วงบ่าย (12:00 - 16:00)</div>
                     <div style={{ fontSize: '0.8rem', color: textColor, marginTop: '4px', lineHeight: '1.4' }}>มีโอกาสเกิดฝนฟ้าคะนอง 60%<br/><span style={{color: subTextColor}}>อุณหภูมิสูงสุด 34-35°C</span></div>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px', border: `1px solid ${borderColor}` }}>
                   <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#dcfce7', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 'bold' }}>✓</div>
                   <div>
                     <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4f46e5' }}>ช่วงเย็น (17:00 - 22:00)</div>
                     <div style={{ fontSize: '0.8rem', color: textColor, marginTop: '4px', lineHeight: '1.4' }}>มีฝนฟ้าคะนองบางพื้นที่<br/><span style={{color: subTextColor}}>อุณหภูมิ 27-30°C</span></div>
                   </div>
                </div>
             </div>

             <button style={{ width: '100%', padding: '12px', marginTop: '16px', background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>
                ดูการวิเคราะห์แบบละเอียด →
             </button>
          </div>

          {/* เปรียบเทียบกับเมื่อวาน */}
          <div style={{ background: cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
             <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: '800' }}>เปรียบเทียบกับเมื่อวาน</h3>
             
             <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
               <button style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', background: '#3b82f6', color: '#fff', border: 'none' }}>อุณหภูมิ</button>
               <button style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', background: 'var(--bg-secondary)', color: subTextColor, border: `1px solid ${borderColor}` }}>ฝน</button>
               <button style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', background: 'var(--bg-secondary)', color: subTextColor, border: `1px solid ${borderColor}` }}>PM2.5</button>
             </div>

             <div style={{ height: '180px', width: '100%', marginLeft: '-15px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={compareData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: subTextColor }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: subTextColor }} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="today" name="วันนี้" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                    <Line type="monotone" dataKey="yesterday" name="เมื่อวาน" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
             </div>
             <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', fontSize: '0.75rem', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{width: '12px', height: '2px', background: '#ef4444'}}></span> วันนี้</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: subTextColor }}><span style={{width: '12px', height: '2px', background: '#94a3b8', borderTop: '2px dashed #94a3b8'}}></span> เมื่อวาน</div>
             </div>

             <div style={{ display: 'flex', gap: '12px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '12px', marginTop: '16px', border: `1px solid ${borderColor}` }}>
                <span style={{ fontSize: '1.2rem' }}>📈</span>
                <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                  วันนี้ร้อนกว่าเมื่อวาน 1-2°C<br/>และมีโอกาสฝนมากกว่าในช่วงบ่าย
                </div>
             </div>
          </div>

          {/* AI ระยะยาว */}
          <div style={{ background: cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
             <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: '800' }}>AI วิเคราะห์ระยะยาว</h3>
             <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
               <span>🎯</span> แนวโน้ม 7 วันข้างหน้า
             </div>
             <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ flex: 1, fontSize: '0.8rem', lineHeight: '1.5', color: textColor }}>
                   ช่วงวันที่ 17-19 พ.ค. มีโอกาสฝนตกต่อเนื่อง อุณหภูมิจะลดลงเล็กน้อย 1-2°C หลังจากนั้นอากาศจะกลับมาร้อนขึ้นอีกครั้ง
                </div>
                <div style={{ width: '80px', height: '50px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={compareData.slice(0, 7)}>
                      <Line type="monotone" dataKey="today" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
             </div>
             <button style={{ width: '100%', padding: '12px 0 0 0', marginTop: '12px', borderTop: `1px solid ${borderColor}`, background: 'transparent', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', color: '#3b82f6', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                ดูแนวโน้ม 7 วันแบบละเอียด →
             </button>
          </div>

        </div>

        {/* ================= COLUMN 3 ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* ปัจจุบัน */}
          <div style={{ background: cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
             <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '800' }}>สถานการณ์ปัจจุบัน</h3>
             <div style={{ fontSize: '0.8rem', color: subTextColor, marginBottom: '20px' }}>อัปเดตล่าสุด {new Date().toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})} น.</div>
             
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginBottom: '30px' }}>
                 <div style={{ fontSize: '5rem', lineHeight: 1, filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}>🌤️</div>
                 <div>
                     <div style={{ fontSize: '3.5rem', fontWeight: '900', lineHeight: 1, color: textColor }}>{Math.round(current?.temp || 0)}<span style={{ fontSize: '1.8rem', fontWeight: 'normal', verticalAlign: 'top' }}>°C</span></div>
                     <div style={{ fontSize: '1rem', fontWeight: '800', marginTop: '4px' }}>มีเมฆบางส่วน</div>
                     <div style={{ fontSize: '0.85rem', color: subTextColor, marginTop: '2px' }}>รู้สึกเหมือน {Math.round(current?.feelsLike || 0)}°C</div>
                 </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, padding: '20px 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: subTextColor, marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><span>🌧️</span> ฝน</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#3b82f6' }}>{current?.rainProb || 0}%</div>
                </div>
                <div style={{ textAlign: 'center', borderLeft: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}` }}>
                  <div style={{ fontSize: '0.75rem', color: subTextColor, marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><span>💨</span> ลม</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{Math.round(current?.windSpeed || 0)} <span style={{fontSize:'0.7rem'}}>km/h</span></div>
                  <div style={{ fontSize: '0.65rem', color: subTextColor }}>SW</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: subTextColor, marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><span>💧</span> ความชื้น</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#8b5cf6' }}>{current?.humidity || 0}%</div>
                </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: subTextColor, marginBottom: '4px' }}>PM2.5</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#10b981' }}>{Math.round(current?.pm25 || 0)}</div>
                  <div style={{ fontSize: '0.6rem', color: '#10b981' }}>● ดี</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: subTextColor, marginBottom: '4px' }}>ความกดอากาศ</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>1008 <span style={{fontSize:'0.6rem', fontWeight:'normal'}}>hPa</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: subTextColor, marginBottom: '4px' }}>ดัชนี UV</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ef4444' }}>8</div>
                  <div style={{ fontSize: '0.6rem', color: '#ef4444' }}>สูงมาก</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: subTextColor, marginBottom: '4px' }}>ทัศนวิสัย</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>10 <span style={{fontSize:'0.6rem', fontWeight:'normal'}}>km</span></div>
                </div>
             </div>
          </div>

          {/* คาดการณ์ฝน */}
          <div style={{ background: cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>คาดการณ์ฝน 6 ชั่วโมงข้างหน้า</h3>
                <span style={{ fontSize: '0.75rem', color: '#3b82f6', cursor: 'pointer' }}>ดูเพิ่มเติม →</span>
             </div>
             
             <div style={{ height: '100px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sixHourForecast} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: subTextColor }} />
                    <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                    <Bar dataKey="rain" name="โอกาสฝน" radius={[4, 4, 0, 0]}>
                      {sixHourForecast.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.rain > 40 ? '#3b82f6' : '#93c5fd'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                {sixHourForecast.map((d, i) => (
                  <div key={i} style={{ width: `${100/6}%`, textAlign: 'center', fontSize: '0.7rem', color: '#3b82f6', fontWeight: 'bold' }}>{d.rain}%</div>
                ))}
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                {sixHourForecast.map((d, i) => (
                  <div key={i} style={{ width: `${100/6}%`, textAlign: 'center', fontSize: '1.2rem' }}>{d.icon}</div>
                ))}
             </div>
          </div>

          {/* คำแนะนำ */}
          <div style={{ background: cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
             <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: '800' }}>คำแนะนำสำหรับคุณ</h3>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '14px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px', border: `1px solid ${borderColor}` }}>
                   <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>👕</div>
                   <div>
                     <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>การแต่งกาย</div>
                     <div style={{ fontSize: '0.8rem', color: subTextColor, marginTop: '4px', lineHeight: '1.4' }}>สวมเสื้อผ้าที่ระบายอากาศได้ดี พกร่มหรือเสื้อกันฝน</div>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px', border: `1px solid ${borderColor}` }}>
                   <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>🏃</div>
                   <div>
                     <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>กิจกรรมกลางแจ้ง</div>
                     <div style={{ fontSize: '0.8rem', color: subTextColor, marginTop: '4px', lineHeight: '1.4' }}>เหมาะสำหรับกิจกรรมในช่วงเช้า หลีกเลี่ยงช่วงบ่ายที่อาจมีฝน</div>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px', border: `1px solid ${borderColor}` }}>
                   <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>❤️</div>
                   <div>
                     <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>สุขภาพ</div>
                     <div style={{ fontSize: '0.8rem', color: subTextColor, marginTop: '4px', lineHeight: '1.4' }}>ดื่มน้ำให้เพียงพอ ระวังอาการจากความร้อนและรังสี UV</div>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px', border: `1px solid ${borderColor}` }}>
                   <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>🚗</div>
                   <div>
                     <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>การเดินทาง</div>
                     <div style={{ fontSize: '0.8rem', color: subTextColor, marginTop: '4px', lineHeight: '1.4' }}>ระมัดระวังฝนตกหนักและน้ำท่วมขัง ตรวจสอบสภาพการจราจร</div>
                   </div>
                </div>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
