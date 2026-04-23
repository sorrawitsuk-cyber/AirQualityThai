import React, { useContext, useState, useEffect, useMemo, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { WeatherContext } from '../context/WeatherContext';
import { useWeatherData } from '../hooks/useWeatherData';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ComposedChart } from 'recharts';
import WeatherRadar from '../components/Dashboard/WeatherRadar';
import heroBg from '../assets/hero.png';

export default function Dashboard() {
  const { stations, lastUpdated, darkMode } = useContext(WeatherContext);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { weatherData, loadingWeather, fetchWeatherByCoords } = useWeatherData();

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
      </div>
    );
  }

  const { current, hourly, daily, coords } = weatherData;
  const nowMs = Date.now();
  const startIdx = hourly?.time?.findIndex(t => new Date(t).getTime() >= nowMs - 3600000) || 0;
  
  // 24 Hour Forecast Data
  const forecast24h = (hourly?.time?.slice(startIdx, startIdx + 24).filter((_, i) => i % 2 === 0) || []).map((t, i) => {
    const rIdx = startIdx + (i * 2);
    const rain = hourly?.precipitation_probability?.[rIdx] || 0;
    const hour = new Date(t).getHours();
    const isNight = hour >= 18 || hour < 6;
    let icon = isNight ? '🌙' : '☀️';
    if (rain > 50) icon = '⛈️';
    else if (rain > 20) icon = '🌧️';
    else if (rain > 0) icon = isNight ? '☁️' : '🌥️';

    return {
      time: new Date(t).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(hourly?.temperature_2m?.[rIdx] || 0),
      rain,
      icon,
      isNow: i === 0
    };
  });

  // Daily Period Forecast (Morning, Afternoon, Evening, Night)
  const periodForecast = [
    { label: 'เช้า', icon: '🌤️', temp: '26 - 33°C', desc: 'อากาศร้อน', rain: '10%' },
    { label: 'บ่าย', icon: '🌧️', temp: '30 - 35°C', desc: 'ร้อนจัด มีโอกาสฝน', rain: '60%' },
    { label: 'เย็น', icon: '⛈️', temp: '28 - 29°C', desc: 'ฝนฟ้าคะนอง', rain: '60%' },
    { label: 'กลางคืน', icon: '☁️', temp: '26 - 27°C', desc: 'มีเมฆบางส่วน', rain: '20%' },
  ];

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', background: 'var(--bg-app)', minHeight: '100%', color: textColor, fontFamily: 'Sarabun, sans-serif' }} className="hide-scrollbar">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
         <h1 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📍</span> กรุงเทพมหานคร <span style={{fontSize:'1rem', color:subTextColor, cursor:'pointer'}}>▾</span>
         </h1>
         {!isMobile && (
           <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#ef4444', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚠️</span> คลื่นความร้อน <span style={{fontWeight:'normal', fontSize:'0.7rem', color:'#f87171', marginLeft:'4px'}}>ถึง 17 พ.ค. 17:00 น.</span>
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fbbf24', color: '#d97706', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚡</span> ฝนฟ้าคะนอง <span style={{fontWeight:'normal', fontSize:'0.7rem', color:'#fbbf24', marginLeft:'4px'}}>ถึง 16 พ.ค. 22:00 น.</span>
              </div>
           </div>
         )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: '24px', alignItems: 'start' }}>
        
        {/* ================= LEFT COLUMN ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
           
           {/* Hero Card */}
           <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', padding: '24px', color: '#fff', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(14,165,233,0.9) 0%, rgba(14,165,233,0.4) 50%, rgba(14,165,233,0) 100%)', zIndex: 1 }} />
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                 <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>เขตบางนา, กรุงเทพมหานคร</div>
                 <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px' }}>อัปเดตล่าสุด 16 พ.ค. 2567 09:25 น.</div>
                 <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', marginTop: '8px', backdropFilter: 'blur(4px)' }}>
                    ข้อมูลจากกรมอุตุนิยมวิทยา
                 </div>
              </div>

              <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                 <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                       <div style={{ fontSize: '6rem', fontWeight: '900', lineHeight: 1 }}>32<span style={{ fontSize: '3rem', fontWeight: 'normal', verticalAlign: 'top' }}>°C</span></div>
                       <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' }}>🌤️</div>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '8px' }}>มีเมฆบางส่วน</div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', opacity: 0.9 }}>รู้สึกเหมือน 39°C</div>
                 </div>
              </div>
           </div>

           {/* Metrics Grid */}
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
              <div style={{ background: cardBg, padding: '12px', borderRadius: '16px', border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ fontSize: '1.8rem' }}>🌡️</div>
                 <div>
                   <div style={{ fontSize: '0.7rem', color: subTextColor }}>อุณหภูมิ</div>
                   <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>32°C</div>
                   <div style={{ fontSize: '0.6rem', color: '#ef4444' }}>↑ 2°C จากเมื่อวาน</div>
                 </div>
              </div>
              <div style={{ background: cardBg, padding: '12px', borderRadius: '16px', border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ fontSize: '1.8rem' }}>🥵</div>
                 <div>
                   <div style={{ fontSize: '0.7rem', color: subTextColor }}>รู้สึกเหมือน</div>
                   <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>39°C</div>
                   <div style={{ fontSize: '0.6rem', color: '#ef4444' }}>● ร้อนมาก</div>
                 </div>
              </div>
              <div style={{ background: cardBg, padding: '12px', borderRadius: '16px', border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ fontSize: '1.8rem' }}>🌧️</div>
                 <div>
                   <div style={{ fontSize: '0.7rem', color: subTextColor }}>โอกาสฝน</div>
                   <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#3b82f6' }}>60%</div>
                   <div style={{ fontSize: '0.6rem', color: subTextColor }}>ปานกลาง</div>
                 </div>
              </div>
              <div style={{ background: cardBg, padding: '12px', borderRadius: '16px', border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ fontSize: '1.8rem' }}>💨</div>
                 <div>
                   <div style={{ fontSize: '0.7rem', color: subTextColor }}>ลม</div>
                   <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>15 <span style={{fontSize:'0.7rem'}}>km/h</span></div>
                   <div style={{ fontSize: '0.6rem', color: subTextColor }}>ทิศตะวันตกเฉียงใต้</div>
                 </div>
              </div>
              <div style={{ background: cardBg, padding: '12px', borderRadius: '16px', border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ fontSize: '1.8rem' }}>🌫️</div>
                 <div>
                   <div style={{ fontSize: '0.7rem', color: subTextColor }}>PM2.5</div>
                   <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>28</div>
                   <div style={{ fontSize: '0.6rem', color: '#10b981' }}>● ดี</div>
                 </div>
              </div>
           </div>

           {/* 24 Hour Forecast */}
           <div style={{ background: cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                 <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>พยากรณ์อากาศ 24 ชั่วโมงข้างหน้า</h3>
              </div>
              
              <div style={{ height: '200px', width: '100%', marginLeft: '-15px' }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={forecast24h} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
                       <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: subTextColor }} />
                       <YAxis yAxisId="temp" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: subTextColor }} domain={['dataMin - 2', 'dataMax + 2']} hide />
                       <YAxis yAxisId="rain" orientation="right" axisLine={false} tickLine={false} domain={[0, 100]} hide />
                       
                       <Bar yAxisId="rain" dataKey="rain" fill="#e0f2fe" radius={[4, 4, 0, 0]} barSize={20} />
                       <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#f97316' }} label={{ position: 'top', fill: textColor, fontSize: 12, fontWeight: 'bold', dy: -10 }} />
                    </ComposedChart>
                 </ResponsiveContainer>
              </div>
              
              {/* Custom X-Axis Icons & Rain Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginTop: '4px' }}>
                 {forecast24h.map((d, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: `${100/forecast24h.length}%` }}>
                       <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{d.icon}</div>
                       <div style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 'bold' }}>{d.rain}%</div>
                    </div>
                 ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.75rem' }}>
                 <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{width:'12px', height:'2px', background:'#f97316'}}></span> อุณหภูมิ (°C)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{width:'12px', height:'12px', background:'#e0f2fe', borderRadius:'2px'}}></span> โอกาสฝน (%)</div>
                 </div>
                 <span style={{ color: '#0ea5e9', cursor: 'pointer', fontWeight: 'bold' }}>ดูพยากรณ์รายชั่วโมงเต็ม →</span>
              </div>
           </div>

           {/* Today Overview */}
           <div style={{ background: cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: '800' }}>วันนี้ในภาพรวม</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                 {periodForecast.map((p, i) => (
                    <div key={i} style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px', border: `1px solid ${borderColor}` }}>
                       <div style={{ fontSize: '0.8rem', color: subTextColor, marginBottom: '8px' }}>{p.label}</div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ fontSize: '2rem' }}>{p.icon}</div>
                          <div>
                             <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{p.temp}</div>
                             <div style={{ fontSize: '0.75rem', color: subTextColor }}>{p.desc}</div>
                             <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '2px' }}>ฝน {p.rain}</div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Rankings Row */}
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              
              <div style={{ background: cardBg, borderRadius: '20px', padding: '16px', border: `1px solid ${borderColor}` }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>คุณภาพอากาศ (PM2.5)</div>
                    <span style={{ fontSize: '0.7rem', color: '#0ea5e9', cursor: 'pointer' }}>ดูทั้งหมด →</span>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: subTextColor }}>กรุงเทพฯ</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>28</div>
                      <div style={{ fontSize: '0.6rem', color: '#10b981' }}>● ดี</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: subTextColor }}>เชียงใหม่</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>57</div>
                      <div style={{ fontSize: '0.6rem', color: '#f59e0b' }}>● ปานกลาง</div>
                    </div>
                 </div>
              </div>

              <div style={{ background: cardBg, borderRadius: '20px', padding: '16px', border: `1px solid ${borderColor}` }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>จังหวัดที่ร้อนที่สุดวันนี้</div>
                    <span style={{ fontSize: '0.7rem', color: '#0ea5e9', cursor: 'pointer' }}>ดูทั้งหมด →</span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{display:'flex', alignItems:'center', gap:'6px'}}><span style={{background:'#ef4444', color:'#fff', width:'16px', height:'16px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem'}}>1</span> แม่ฮ่องสอน</span>
                      <span style={{fontWeight:'bold'}}>42.3°C</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{display:'flex', alignItems:'center', gap:'6px'}}><span style={{background:'#f97316', color:'#fff', width:'16px', height:'16px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem'}}>2</span> อุตรดิตถ์</span>
                      <span style={{fontWeight:'bold'}}>41.0°C</span>
                    </div>
                 </div>
              </div>

              <div style={{ background: cardBg, borderRadius: '20px', padding: '16px', border: `1px solid ${borderColor}` }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>ฝนมากที่สุด (24 ชม.)</div>
                    <span style={{ fontSize: '0.7rem', color: '#0ea5e9', cursor: 'pointer' }}>ดูทั้งหมด →</span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{display:'flex', alignItems:'center', gap:'6px'}}><span style={{background:'#3b82f6', color:'#fff', width:'16px', height:'16px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem'}}>1</span> ระนอง</span>
                      <span style={{fontWeight:'bold'}}>125 มม.</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{display:'flex', alignItems:'center', gap:'6px'}}><span style={{background:'#60a5fa', color:'#fff', width:'16px', height:'16px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem'}}>2</span> พังงา</span>
                      <span style={{fontWeight:'bold'}}>98 มม.</span>
                    </div>
                 </div>
              </div>

              <div style={{ background: cardBg, borderRadius: '20px', padding: '16px', border: `1px solid ${borderColor}` }}>
                 <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '12px' }}>ค่าดัชนีต่างๆ วันนี้</div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem' }}>☀️</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>8</div>
                      <div style={{ fontSize: '0.6rem', color: '#ef4444' }}>สูง</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem' }}>💧</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#3b82f6' }}>72%</div>
                      <div style={{ fontSize: '0.6rem', color: subTextColor }}>ค่อนข้างชื้น</div>
                    </div>
                 </div>
              </div>

           </div>

        </div>

        {/* ================= RIGHT COLUMN (SIDEBAR) ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           
            {/* Radar */}
            <div style={{ background: cardBg, borderRadius: '24px', padding: '20px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>เรดาร์ฝน</h3>
                  <NavLink to="/map" style={{ fontSize: '0.75rem', color: '#0ea5e9', textDecoration: 'none', fontWeight: 'bold' }}>ดูแผนที่เต็ม →</NavLink>
               </div>
               <div style={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${borderColor}`, position: 'relative' }}>
                  <iframe 
                     width="100%" height="240" 
                     src={`https://embed.windy.com/embed2.html?lat=${coords?.lat || 13.75}&lon=${coords?.lon || 100.5}&zoom=5&level=surface&overlay=rain&menu=&message=true&marker=true&calendar=now&city=online`} 
                     style={{ border: 'none', display: 'block' }}
                     title="Radar Map"
                  ></iframe>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '12px', gap: '8px' }}>
                 <div style={{ display: 'flex', width: '100%', height: '8px', borderRadius: '4px', overflow: 'hidden', background: 'linear-gradient(to right, #93c5fd, #3b82f6, #2563eb, #1e3a8a, #ef4444, #7f1d1d)' }}></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.7rem', color: subTextColor }}>
                    <span>น้อย</span>
                    <span>มาก</span>
                 </div>
              </div>
           </div>

           {/* Alerts */}
           <div style={{ background: cardBg, borderRadius: '24px', padding: '20px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                 <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>เตือนภัยล่าสุด</h3>
                 <NavLink to="/news" style={{ fontSize: '0.75rem', color: '#0ea5e9', textDecoration: 'none', fontWeight: 'bold' }}>ดูทั้งหมด →</NavLink>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px' }}>
                    <div style={{ fontSize: '2rem', color: '#ef4444' }}>🥵</div>
                    <div style={{ flex: 1 }}>
                       <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#b91c1c' }}>คลื่นความร้อน</div>
                       <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '2px' }}>ระดับเฝ้าระวัง: <strong>สูงมาก</strong></div>
                       <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px' }}>พื้นที่: ภาคกลาง ภาคตะวันออก</div>
                       <div style={{ fontSize: '0.7rem', color: '#991b1b', marginTop: '8px', textAlign: 'right' }}>ถึง 17 พ.ค. 17:00 น.</div>
                    </div>
                 </div>

                 <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px' }}>
                    <div style={{ fontSize: '2rem', color: '#f59e0b' }}>⚡</div>
                    <div style={{ flex: 1 }}>
                       <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#b45309' }}>ฝนฟ้าคะนอง</div>
                       <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '2px' }}>ระดับเฝ้าระวัง: <strong>ปานกลาง</strong></div>
                       <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '2px' }}>พื้นที่: กรุงเทพมหานครและปริมณฑล</div>
                       <div style={{ fontSize: '0.7rem', color: '#92400e', marginTop: '8px', textAlign: 'right' }}>ถึง 16 พ.ค. 22:00 น.</div>
                    </div>
                 </div>
              </div>
           </div>

           {/* News */}
           <div style={{ background: cardBg, borderRadius: '24px', padding: '20px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                 <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>ข่าวและบทความเด่น</h3>
                 <NavLink to="/news" style={{ fontSize: '0.75rem', color: '#0ea5e9', textDecoration: 'none', fontWeight: 'bold' }}>ดูทั้งหมด →</NavLink>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <div style={{ display: 'flex', gap: '12px', cursor: 'pointer' }}>
                    <div style={{ width: '80px', height: '60px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', flexShrink: 0 }}></div>
                    <div>
                       <div style={{ fontSize: '0.85rem', fontWeight: 'bold', lineHeight: '1.3', color: textColor, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                         กรมอุตุฯ เตือน 16-18 พ.ค. ฝนตกหนักหลายพื้นที่
                       </div>
                       <div style={{ fontSize: '0.7rem', color: subTextColor, marginTop: '6px' }}>16 พ.ค. 2567 08:30 น.</div>
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: '12px', cursor: 'pointer' }}>
                    <div style={{ width: '80px', height: '60px', borderRadius: '12px', background: 'linear-gradient(135deg, #f97316, #ef4444)', flexShrink: 0 }}></div>
                    <div>
                       <div style={{ fontSize: '0.85rem', fontWeight: 'bold', lineHeight: '1.3', color: textColor, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                         อากาศร้อนจัดต่อเนื่อง แนะเลี่ยงกิจกรรมกลางแจ้ง
                       </div>
                       <div style={{ fontSize: '0.7rem', color: subTextColor, marginTop: '6px' }}>16 พ.ค. 2567 07:15 น.</div>
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: '12px', cursor: 'pointer' }}>
                    <div style={{ width: '80px', height: '60px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #0ea5e9)', flexShrink: 0 }}></div>
                    <div>
                       <div style={{ fontSize: '0.85rem', fontWeight: 'bold', lineHeight: '1.3', color: textColor, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                         เช็กค่าฝุ่น PM2.5 รายพื้นที่ ประจำวันที่ 16 พ.ค. 2567
                       </div>
                       <div style={{ fontSize: '0.7rem', color: subTextColor, marginTop: '6px' }}>16 พ.ค. 2567 06:45 น.</div>
                    </div>
                 </div>
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}
