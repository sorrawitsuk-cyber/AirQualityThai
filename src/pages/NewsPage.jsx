import React, { useContext, useState, useEffect } from 'react';
import { WeatherContext } from '../context/WeatherContext';
import { NavLink } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function NewsPage() {
  const { darkMode, stations, stationTemps } = useContext(WeatherContext);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cardBg = 'var(--bg-card)';
  const textColor = 'var(--text-main)';
  const borderColor = 'var(--border-color)';
  const subTextColor = 'var(--text-sub)';

  const WarningCard = ({ icon, title, level, area, time, bgColor, borderColor, iconColor, textColor }) => (
    <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minWidth: '280px' }}>
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: iconColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0, boxShadow: `0 4px 12px ${iconColor}66` }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: textColor }}>{title}</div>
          <div style={{ fontSize: '0.8rem', color: textColor, opacity: 0.9, marginTop: '4px' }}>ระดับอันตราย: <strong>{level}</strong></div>
          <div style={{ fontSize: '0.8rem', color: textColor, opacity: 0.8 }}>พื้นที่: {area}</div>
        </div>
      </div>
      <div style={{ fontSize: '0.75rem', color: textColor, opacity: 0.7, borderTop: `1px solid ${borderColor}`, paddingTop: '12px' }}>
        ถึง {time}
      </div>
      <button style={{ width: '100%', padding: '10px', borderRadius: '12px', background: 'var(--bg-card)', color: textColor, border: `1px solid ${borderColor}`, fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>
        ดูรายละเอียด
      </button>
    </div>
  );

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', background: 'var(--bg-app)', minHeight: '100%', color: textColor, fontFamily: 'Sarabun, sans-serif' }} className="hide-scrollbar">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
         <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: '800' }}>ข่าว & เตือนภัย</h1>
            <div style={{ fontSize: '0.85rem', color: subTextColor, marginTop: '4px' }}>ติดตามสถานการณ์สภาพอากาศและประกาศเตือนภัยล่าสุด</div>
         </div>
         <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button style={{ padding: '8px 16px', borderRadius: '20px', background: '#3b82f6', color: '#fff', border: 'none', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>👆</span> ทั้งหมด
            </button>
            <button style={{ padding: '8px 16px', borderRadius: '20px', background: 'var(--bg-secondary)', color: '#ef4444', border: `1px solid #fca5a5`, fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚠️</span> เตือนภัย
            </button>
            <button style={{ padding: '8px 16px', borderRadius: '20px', background: 'var(--bg-secondary)', color: subTextColor, border: `1px solid ${borderColor}`, fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📰</span> ข่าวสาร
            </button>
            <button style={{ padding: '8px 16px', borderRadius: '20px', background: 'var(--bg-secondary)', color: subTextColor, border: `1px solid ${borderColor}`, fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🌧️</span> ฝน / พายุ
            </button>
            <button style={{ padding: '8px 16px', borderRadius: '20px', background: 'var(--bg-secondary)', color: subTextColor, border: `1px solid ${borderColor}`, fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🌫️</span> ฝุ่น / AQI
            </button>
         </div>
      </div>

      {/* Top Warnings */}
      <div style={{ background: cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>คำเตือนที่ต้องเฝ้าระวัง</h2>
            <span style={{ fontSize: '0.8rem', color: '#0ea5e9', cursor: 'pointer', fontWeight: 'bold' }}>ดูคำเตือนทั้งหมด (3) →</span>
         </div>
         <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }} className="hide-scrollbar">
            <WarningCard 
              icon="🥵" title="คลื่นความร้อน" level="สูงมาก" area="ภาคเหนือ ภาคกลาง" time="17 พ.ค. 17:00 น."
              bgColor="#fef2f2" borderColor="#fca5a5" iconColor="#ef4444" textColor="#991b1b"
            />
            <WarningCard 
              icon="🌧️" title="ฝนตกหนัก" level="ปานกลาง" area="ภาคตะวันออก ภาคใต้" time="17 พ.ค. 22:00 น."
              bgColor="#fffbeb" borderColor="#fcd34d" iconColor="#f59e0b" textColor="#92400e"
            />
            <WarningCard 
              icon="💨" title="ลมแรง" level="ปานกลาง" area="ภาคอีสานตอนบน" time="17 พ.ค. 18:00 น."
              bgColor="#fefce8" borderColor="#fde047" iconColor="#eab308" textColor="#854d0e"
            />
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.8fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* ================= LEFT COLUMN ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           
           {/* สถานการณ์เด่นวันนี้ */}
           <div style={{ background: cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h2 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: '800' }}>สถานการณ์เด่นวันนี้</h2>
              
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px' }}>
                 {/* Real Map for Rain Accumulation */}
                 <div style={{ flex: 1.5, borderRadius: '16px', minHeight: '260px', position: 'relative', overflow: 'hidden', border: `1px solid ${borderColor}`, zIndex: 0 }}>
                    <MapContainer center={[13.75, 100.5]} zoom={5} zoomControl={false} style={{ width: '100%', height: '100%', background: darkMode ? '#0f172a' : '#bfe8ff' }}>
                      <TileLayer url={darkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"} />
                      {/* Map Real Rain Data */}
                      {(stations && stations.length > 0) && stations.map((station, i) => {
                         const lat = parseFloat(station.lat);
                         const lon = parseFloat(station.long);
                         if (isNaN(lat) || isNaN(lon) || lat === 0) return null;
                         const tObj = stationTemps ? stationTemps[station.stationID] : null;
                         const rainVal = (tObj?.rainProb || 0) / 2;
                         if (rainVal < 5) return null;
                         let color = '#3b82f6';
                         let radius = 10;
                         if (rainVal > 50) { color = '#7f1d1d'; radius = 45; }
                         else if (rainVal > 20) { color = '#ef4444'; radius = 30; }
                         else if (rainVal > 10) { color = '#f59e0b'; radius = 20; }
                         return <CircleMarker key={i} center={[lat, lon]} radius={radius} fillColor={color} fillOpacity={0.6} color="transparent" />
                      })}
                    </MapContainer>

                    <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(255,255,255,0.9)', padding: '8px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', backdropFilter: 'blur(4px)', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 1000, color: '#1e293b' }}>
                       ฝนสะสม 24 ชั่วโมง<br/><span style={{fontWeight:'normal', color: '#64748b'}}>16 พ.ค. 2567 09:00 น.</span>
                    </div>
                    <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000 }}>
                       <div style={{ background: 'rgba(255,255,255,0.9)', padding: '8px', borderRadius: '12px', fontSize: '0.65rem', backdropFilter: 'blur(4px)', width: '60%', color: '#1e293b' }}>
                          <div style={{marginBottom:'4px', color:'#64748b'}}>ฝนสะสม (มม.)</div>
                          <div style={{width:'100%', height:'8px', background:'linear-gradient(to right, #e0f2fe, #bae6fd, #38bdf8, #0284c7, #1e3a8a, #ef4444, #7f1d1d)', borderRadius:'4px'}}></div>
                          <div style={{display:'flex', justifyContent:'space-between', marginTop:'2px', opacity:0.7}}>
                             <span>0</span><span>20</span><span>50</span><span>100</span><span>200+</span>
                          </div>
                       </div>
                       <button style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.4)' }}>
                          ดูแผนที่เรดาร์ →
                       </button>
                    </div>
                 </div>

                 {/* Highlights */}
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: 'var(--bg-secondary)', border: `1px solid ${borderColor}`, borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px', cursor: 'pointer' }}>
                       <div style={{ fontSize: '1.8rem', color: '#3b82f6', flexShrink: 0 }}>🌧️</div>
                       <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>ฝนตกหนักต่อเนื่อง</div>
                          <div style={{ fontSize: '0.75rem', color: subTextColor, marginTop: '4px', lineHeight: '1.4' }}>ภาคตะวันออกมีฝนตกหนักหลายแห่ง และมีฝนสะสมมากกว่า 90 มม.</div>
                          <div style={{ fontSize: '0.65rem', color: '#3b82f6', marginTop: '8px', fontWeight: 'bold' }}>10 นาทีที่แล้ว ↗</div>
                       </div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', border: `1px solid ${borderColor}`, borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px', cursor: 'pointer' }}>
                       <div style={{ fontSize: '1.8rem', color: '#ef4444', flexShrink: 0 }}>🥵</div>
                       <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>อากาศร้อนจัด</div>
                          <div style={{ fontSize: '0.75rem', color: subTextColor, marginTop: '4px', lineHeight: '1.4' }}>หลายพื้นที่มีอุณหภูมิสูงกว่า 40°C ต่อเนื่องหลายวัน</div>
                          <div style={{ fontSize: '0.65rem', color: '#3b82f6', marginTop: '8px', fontWeight: 'bold' }}>25 นาทีที่แล้ว ↗</div>
                       </div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', border: `1px solid ${borderColor}`, borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px', cursor: 'pointer' }}>
                       <div style={{ fontSize: '1.8rem', color: '#10b981', flexShrink: 0 }}>💨</div>
                       <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>ลมแรงบริเวณอ่าวไทย</div>
                          <div style={{ fontSize: '0.75rem', color: subTextColor, marginTop: '4px', lineHeight: '1.4' }}>คลื่นสูง 2-3 เมตร เรือเล็กควรงดออกจากฝั่ง</div>
                          <div style={{ fontSize: '0.65rem', color: '#3b82f6', marginTop: '8px', fontWeight: 'bold' }}>40 นาทีที่แล้ว ↗</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* ข่าวสารล่าสุด */}
           <div style={{ background: cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                 <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>ข่าวสารล่าสุด</h2>
                 <span style={{ fontSize: '0.8rem', color: '#0ea5e9', cursor: 'pointer', fontWeight: 'bold' }}>ดูข่าวทั้งหมด →</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                 {[
                   { tag: 'เตือนภัย', tagColor: '#ef4444', tagBg: '#fef2f2', title: 'กรมอุตุฯ เตือนทั่วไทยรับมือคลื่นความร้อน 16-17 พ.ค.', desc: 'อุณหภูมิสูงสุดบางพื้นที่แตะ 43°C แนะหลีกเลี่ยงออกนอกบ้านช่วงบ่าย', views: '12K', time: '08:30', imgGradient: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
                   { tag: 'ฝน / พายุ', tagColor: '#3b82f6', tagBg: '#eff6ff', title: 'ภาคตะวันออกมีฝนตกหนักถึงหนักมาก 16-17 พ.ค. นี้', desc: 'เสี่ยงน้ำท่วมฉับพลัน น้ำป่าไหลหลาก ในบางพื้นที่', views: '8.5K', time: '07:15', imgGradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
                   { tag: 'ฝุ่น / AQI', tagColor: '#8b5cf6', tagBg: '#f3e8ff', title: 'สถานการณ์ PM2.5 เช้านี้ เกินมาตรฐาน 18 จังหวัด', desc: 'ภาคเหนือและภาคอีสานยังคงมีค่าเกินมาตรฐาน', views: '6.3K', time: '06:45', imgGradient: 'linear-gradient(135deg, #8b5cf6, #10b981)' },
                   { tag: 'ประกาศ', tagColor: '#0ea5e9', tagBg: '#e0f2fe', title: 'ประกาศกรมอุตุนิยมวิทยา ฉบับที่ 5 (120/2567)', desc: 'เรื่อง ฝนตกหนักบริเวณประเทศไทย (มีผลถึง 18 พ.ค. 67)', views: '4.1K', time: '05:30', imgGradient: 'linear-gradient(135deg, #64748b, #cbd5e1)' },
                 ].map((news, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', borderRadius: '16px', border: `1px solid ${borderColor}`, overflow: 'hidden', cursor: 'pointer' }}>
                       <div style={{ height: '140px', background: news.imgGradient, position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '12px', left: '12px', background: news.tagBg, color: news.tagColor, padding: '4px 10px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                            {news.tag}
                          </div>
                       </div>
                       <div style={{ padding: '16px', background: 'var(--bg-secondary)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: textColor, lineHeight: '1.4', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                               {news.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: subTextColor, lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                               {news.desc}
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.7rem', color: subTextColor }}>
                             <span>16 พ.ค. 2567 {news.time} น.</span>
                             <span style={{display:'flex', alignItems:'center', gap:'4px'}}>👁️ {news.views}</span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           
           {/* เลือกดูพื้นที่ */}
           <div style={{ background: cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                 <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>เลือกดูพื้นที่</h2>
                 <select style={{ padding: '6px 12px', borderRadius: '12px', background: 'var(--bg-secondary)', color: textColor, border: `1px solid ${borderColor}`, fontSize: '0.8rem', fontWeight: 'bold', outline: 'none' }}>
                    <option>ประเทศไทย</option>
                    <option>กรุงเทพมหานคร</option>
                 </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px', textAlign: 'center' }}>
                 <div>
                   <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444' }}>⚠️ 3</div>
                   <div style={{ fontSize: '0.7rem', color: subTextColor }}>อันตราย</div>
                 </div>
                 <div>
                   <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f59e0b' }}>⚠️ 7</div>
                   <div style={{ fontSize: '0.7rem', color: subTextColor }}>เฝ้าระวัง</div>
                 </div>
                 <div>
                   <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3b82f6' }}>📢 12</div>
                   <div style={{ fontSize: '0.7rem', color: subTextColor }}>ประกาศทั่วไป</div>
                 </div>
              </div>

              <div style={{ height: '220px', background: 'var(--bg-secondary)', borderRadius: '16px', border: `1px solid ${borderColor}`, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0 }}>
                 {/* Real Map for Danger Zones */}
                 <MapContainer center={[13.75, 100.5]} zoom={4.5} zoomControl={false} style={{ width: '100%', height: '100%', background: darkMode ? '#0f172a' : '#f1f5f9' }}>
                    <TileLayer url={darkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"} />
                    <CircleMarker center={[18.78, 98.98]} radius={6} fillColor="#ef4444" fillOpacity={1} color="#fff" weight={2} /> {/* Chiang Mai - Danger */}
                    <CircleMarker center={[16.82, 100.26]} radius={6} fillColor="#ef4444" fillOpacity={1} color="#fff" weight={2} /> {/* Phitsanulok - Danger */}
                    <CircleMarker center={[13.75, 100.5]} radius={6} fillColor="#f59e0b" fillOpacity={1} color="#fff" weight={2} /> {/* Bangkok - Watch */}
                    <CircleMarker center={[7.0, 100.47]} radius={6} fillColor="#eab308" fillOpacity={1} color="#fff" weight={2} /> {/* Hat Yai - Announce */}
                 </MapContainer>
                 
                 {/* Legend */}
                 <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(255,255,255,0.9)', padding: '10px 14px', borderRadius: '12px', fontSize: '0.65rem', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1000, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: '#1e293b' }}>
                    <div style={{display:'flex', alignItems:'center', gap:'6px', fontWeight: 'bold'}}><span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#ef4444'}}></span> อันตราย</div>
                    <div style={{display:'flex', alignItems:'center', gap:'6px', fontWeight: 'bold'}}><span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#f59e0b'}}></span> เฝ้าระวัง</div>
                    <div style={{display:'flex', alignItems:'center', gap:'6px', fontWeight: 'bold'}}><span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#eab308'}}></span> ประกาศทั่วไป</div>
                    <div style={{display:'flex', alignItems:'center', gap:'6px', fontWeight: 'bold'}}><span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#22c55e'}}></span> ปกติ</div>
                 </div>
              </div>

              <button style={{ width: '100%', marginTop: '16px', background: 'transparent', color: '#3b82f6', border: 'none', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>
                 ดูแผนที่เตือนภัยทั้งหมด →
              </button>
           </div>

           {/* เตรียมพร้อมรับมือ */}
           <div style={{ background: cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                 <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>เตรียมพร้อมรับมือ</h2>
                 <span style={{ fontSize: '0.75rem', color: '#0ea5e9', cursor: 'pointer' }}>ดูทั้งหมด →</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                 {[
                   { icon: '🥵', text: 'วิธีป้องกันเมื่อเกิดคลื่นความร้อน' },
                   { icon: '☀️', text: 'เตรียมตัวรับมือฝนตกหนัก น้ำท่วมฉับพลัน' },
                   { icon: '😷', text: 'วิธีป้องกันตนเองจากฝุ่น PM2.5' },
                   { icon: '💨', text: 'ข้อควรระวังเมื่อลมแรงและคลื่นสูง' },
                 ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 3 ? `1px solid ${borderColor}` : 'none', cursor: 'pointer' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ fontSize: '1.2rem' }}>{item.icon}</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{item.text}</div>
                       </div>
                       <span style={{ color: subTextColor }}>›</span>
                    </div>
                 ))}
              </div>
           </div>

           {/* ช่องทางติดตามแจ้งเตือน */}
           <div style={{ background: cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                 <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>ช่องทางติดตามแจ้งเตือน</h2>
                 <span style={{ fontSize: '0.75rem', color: '#0ea5e9', cursor: 'pointer' }}>ตั้งค่าเพิ่มเติม →</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                       <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🔔</div>
                       <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Push Notification</div>
                          <div style={{ fontSize: '0.7rem', color: subTextColor }}>รับการแจ้งเตือนผ่านเบราว์เซอร์</div>
                       </div>
                    </div>
                    {/* Toggle Switch (ON) */}
                    <div style={{ width: '40px', height: '24px', background: '#3b82f6', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
                       <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
                    </div>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                       <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dcfce7', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💬</div>
                       <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>LINE Alert</div>
                          <div style={{ fontSize: '0.7rem', color: subTextColor }}>รับการแจ้งเตือนผ่าน LINE</div>
                       </div>
                    </div>
                    {/* Toggle Switch (ON) */}
                    <div style={{ width: '40px', height: '24px', background: '#3b82f6', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
                       <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
                    </div>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                       <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📱</div>
                       <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>SMS Alert</div>
                          <div style={{ fontSize: '0.7rem', color: subTextColor }}>รับการแจ้งเตือนผ่าน SMS</div>
                       </div>
                    </div>
                    {/* Toggle Switch (OFF) */}
                    <div style={{ width: '40px', height: '24px', background: 'var(--bg-secondary)', border: `1px solid ${borderColor}`, borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
                       <div style={{ width: '20px', height: '20px', background: subTextColor, borderRadius: '50%', position: 'absolute', top: '1px', left: '1px', opacity: 0.5 }}></div>
                    </div>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                       <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>✉️</div>
                       <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Email Alert</div>
                          <div style={{ fontSize: '0.7rem', color: subTextColor }}>รับการแจ้งเตือนผ่านอีเมล</div>
                       </div>
                    </div>
                    {/* Toggle Switch (OFF) */}
                    <div style={{ width: '40px', height: '24px', background: 'var(--bg-secondary)', border: `1px solid ${borderColor}`, borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
                       <div style={{ width: '20px', height: '20px', background: subTextColor, borderRadius: '50%', position: 'absolute', top: '1px', left: '1px', opacity: 0.5 }}></div>
                    </div>
                 </div>

              </div>
           </div>

        </div>

      </div>
    </div>
  );
}
