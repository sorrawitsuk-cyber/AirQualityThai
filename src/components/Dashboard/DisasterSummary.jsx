import React, { useContext, useState } from 'react';
import { WeatherContext } from '../../context/WeatherContext';

export default function DisasterSummary({ isMobile, cardBg, borderColor, textColor, subTextColor }) {
  const { gistdaSummary } = useContext(WeatherContext);
  const [activeTab, setActiveTab] = useState('fire');

  if (!gistdaSummary) return null;

  const renderTable = (data, title, unit) => (
    <div style={{ flex: 1, minWidth: '250px', background: 'var(--bg-secondary)', padding: '15px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: textColor }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: subTextColor, borderBottom: idx < data.length - 1 ? `1px dashed ${borderColor}` : 'none', paddingBottom: '5px' }}>
            <span>{idx + 1}. {item.province}</span>
            <span style={{ fontWeight: 'bold', color: textColor }}>{item.value.toLocaleString()} {unit}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fade-in" style={{ background: cardBg, borderRadius: '20px', padding: isMobile ? '15px' : '25px', border: `1px solid ${borderColor}`, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', flexShrink: 0 }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: textColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚨 สรุปสถานการณ์ภัยพิบัติ (GISTDA)
        </h3>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
           <button onClick={() => setActiveTab('fire')} style={{ flex: 1, minWidth: '100px', padding: '10px', borderRadius: '10px', background: activeTab === 'fire' ? '#ef4444' : 'var(--bg-secondary)', color: activeTab === 'fire' ? '#fff' : textColor, border: `1px solid ${borderColor}`, cursor: 'pointer', fontWeight: 'bold', transition: '0.2s', boxShadow: activeTab === 'fire' ? '0 4px 10px rgba(239, 68, 68, 0.4)' : 'none' }}>🔥 ไฟป่า</button>
           <button onClick={() => setActiveTab('drought')} style={{ flex: 1, minWidth: '100px', padding: '10px', borderRadius: '10px', background: activeTab === 'drought' ? '#f59e0b' : 'var(--bg-secondary)', color: activeTab === 'drought' ? '#fff' : textColor, border: `1px solid ${borderColor}`, cursor: 'pointer', fontWeight: 'bold', transition: '0.2s', boxShadow: activeTab === 'drought' ? '0 4px 10px rgba(245, 158, 11, 0.4)' : 'none' }}>🏜️ ภัยแล้ง</button>
           <button onClick={() => setActiveTab('flood')} style={{ flex: 1, minWidth: '100px', padding: '10px', borderRadius: '10px', background: activeTab === 'flood' ? '#3b82f6' : 'var(--bg-secondary)', color: activeTab === 'flood' ? '#fff' : textColor, border: `1px solid ${borderColor}`, cursor: 'pointer', fontWeight: 'bold', transition: '0.2s', boxShadow: activeTab === 'flood' ? '0 4px 10px rgba(59, 130, 246, 0.4)' : 'none' }}>🌊 น้ำท่วม</button>
        </div>

        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {activeTab === 'fire' && (
                <>
                    {renderTable(gistdaSummary.hotspots, 'จุดความร้อน 5 จังหวัดสูงสุด (7 วัน)', 'จุด')}
                    {renderTable(gistdaSummary.burntArea, 'พื้นที่เผาไหม้ 5 จังหวัดสูงสุด (10 วัน)', 'ไร่')}
                </>
            )}
            {activeTab === 'drought' && (
                <>
                    {renderTable(gistdaSummary.lowSoilMoisture, '5 จังหวัด ความชื้นในดินต่ำสุด', '(SMAP)')}
                    {renderTable(gistdaSummary.lowVegetationMoisture, '5 จังหวัด ความชื้นพืชพรรณต่ำสุด', '(NDWI)')}
                </>
            )}
            {activeTab === 'flood' && (
                <>
                    {renderTable(gistdaSummary.floodArea, '5 จังหวัดที่น้ำท่วมสูงสุด', 'ไร่')}
                </>
            )}
        </div>
        
        <div style={{ fontSize: '0.75rem', color: subTextColor, marginTop: '20px', textAlign: 'right', borderTop: `1px solid ${borderColor}`, paddingTop: '10px' }}>
           ข้อมูลอ้างอิงและประมวลผลจาก GISTDA (ปรับปรุงเวลา: {new Date(gistdaSummary.lastUpdated).toLocaleTimeString('th-TH')})
        </div>
    </div>
  );
}
