import React, { useState } from 'react';

export default function TopStats({ top5Heat, top5Cool, top5PM25, top5Rain, isMobile, cardBg, borderColor, textColor }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ flexShrink: 0 }}>
        <button 
          onClick={() => setExpanded(!expanded)} 
          style={{ 
            width: '100%', background: cardBg, border: `1px solid ${borderColor}`, borderRadius: '16px', 
            padding: '14px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: expanded ? '12px' : '0'
          }}
        >
            <span style={{ fontSize: '1rem', color: textColor, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🏆 สถิติ Top 5 ระดับประเทศ (เรียลไทม์)
            </span>
            <span style={{ fontSize: '1.2rem', color: textColor, transition: 'transform 0.3s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>

        {expanded && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '15px', animation: 'fadeIn 0.3s ease-in-out' }}>
            
            <div style={{ background: cardBg, borderRadius: '20px', padding: '15px', border: `1px solid ${borderColor}`, borderTop: '3px solid #ef4444' }}>
                <div style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 'bold', marginBottom: '10px', paddingBottom: '5px' }}>🔥 ร้อนจัดที่สุด</div>
                {top5Heat.map((st, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                        <span style={{ color: textColor }}>{i+1}. {st.name}</span>
                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{st.val}°</span>
                    </div>
                ))}
            </div>

            <div style={{ background: cardBg, borderRadius: '20px', padding: '15px', border: `1px solid ${borderColor}`, borderTop: '3px solid #3b82f6' }}>
                <div style={{ fontSize: '0.9rem', color: '#3b82f6', fontWeight: 'bold', marginBottom: '10px', paddingBottom: '5px' }}>❄️ เย็นสบายที่สุด</div>
                {top5Cool.map((st, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                        <span style={{ color: textColor }}>{i+1}. {st.name}</span>
                        <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{st.val}°</span>
                    </div>
                ))}
            </div>

            <div style={{ background: cardBg, borderRadius: '20px', padding: '15px', border: `1px solid ${borderColor}`, borderTop: '3px solid #f97316' }}>
                <div style={{ fontSize: '0.9rem', color: '#f97316', fontWeight: 'bold', marginBottom: '10px', paddingBottom: '5px' }}>😷 ฝุ่น PM2.5 สูงสุด</div>
                {top5PM25.map((st, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                        <span style={{ color: textColor }}>{i+1}. {st.name}</span>
                        <span style={{ color: '#f97316', fontWeight: 'bold' }}>{st.val}</span>
                    </div>
                ))}
            </div>

            <div style={{ background: cardBg, borderRadius: '20px', padding: '15px', border: `1px solid ${borderColor}`, borderTop: '3px solid #0ea5e9' }}>
                <div style={{ fontSize: '0.9rem', color: '#0ea5e9', fontWeight: 'bold', marginBottom: '10px', paddingBottom: '5px' }}>☔ โอกาสฝนตกสูงสุด</div>
                {top5Rain.map((st, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                        <span style={{ color: textColor }}>{i+1}. {st.name}</span>
                        <span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>{st.val}%</span>
                    </div>
                ))}
            </div>

          </div>
        )}
    </div>
  );
}
