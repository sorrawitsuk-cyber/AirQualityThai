import React, { useState } from 'react';

export default function GistdaHotspot({ isMobile, cardBg, borderColor, textColor }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  
  return (
    <div style={{ background: cardBg, borderRadius: isMobile ? '20px' : '25px', padding: isMobile ? '15px' : '20px', border: `1px solid ${borderColor}`, overflow: 'hidden', flexShrink: 0 }}>
        <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: textColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🔥</span> รายงานจุดความร้อน (GISTDA)
        </h3>
        <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
            ข้อมูลจุดความร้อนและสรุปสถานการณ์จากระบบบัญชาการไฟป่า GISTDA (สำนักงานพัฒนาเทคโนโลยีอวกาศและภูมิสารสนเทศ)
        </p>
        <div style={{ width: '100%', height: isMobile ? '400px' : '650px', minHeight: isMobile ? '400px' : '650px', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: `1px solid ${borderColor}` }}>
            {!iframeLoaded && (
                <div style={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                    background: 'var(--bg-secondary, rgba(255,255,255,0.05))', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    borderRadius: '12px', zIndex: 1
                }}>
                    <div style={{ 
                        width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', 
                        borderTopColor: '#ef4444', borderRadius: '50%', 
                        animation: 'spin 1s linear infinite' 
                    }} />
                    <span style={{ color: 'var(--text-sub)', fontSize: '0.85rem', fontWeight: 'bold' }}>กำลังโหลดระบบจุดความร้อน...</span>
                </div>
            )}
            <iframe 
                width="100%" height="100%" 
                src="https://fire.gistda.or.th/dashboard.html" 
                style={{ border: 'none', opacity: iframeLoaded ? 1 : 0, transition: 'opacity 0.5s ease', background: '#fff' }}
                title="GISTDA Fire Dashboard"
                onLoad={() => setIframeLoaded(true)}
            ></iframe>
        </div>
    </div>
  );
}
