import React, { useEffect, useState } from 'react';
import { CloudSun, CloudRain, Wind, Dumbbell, CalendarDays } from 'lucide-react';

const SECTIONS = [
  { id: 'overview', label: 'ภาพรวม', icon: CloudSun },
  { id: 'rain', label: 'วิเคราะห์ฝน', icon: CloudRain },
  { id: 'airquality', label: 'คุณภาพอากาศ', icon: Wind },
  { id: 'activities', label: 'กิจกรรม', icon: Dumbbell },
  { id: 'weekly', label: '7 วัน', icon: CalendarDays },
];

export { SECTIONS };

export default function StickyNav() {
  const [active, setActive] = useState('overview');

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-30% 0px -60% 0px' });
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="ai-sticky-nav hide-scrollbar" style={{
      position: 'sticky', top: 'var(--topbar-height, 64px)', zIndex: 40,
      background: 'var(--bg-nav-blur)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '10px 0', marginBottom: 20, display: 'flex', gap: 6,
      overflowX: 'auto', scrollSnapType: 'x mandatory',
    }}>
      {SECTIONS.map((s) => {
        const isActive = active === s.id;
        return (
          <button key={s.id} onClick={() => scrollTo(s.id)} style={{
            border: isActive ? '1.5px solid #2563eb' : '1px solid var(--border-color)',
            background: isActive ? '#2563eb' : 'var(--bg-card)',
            color: isActive ? '#fff' : 'var(--text-sub)',
            borderRadius: 999, padding: '9px 18px', display: 'flex', alignItems: 'center',
            gap: 7, fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer',
            whiteSpace: 'nowrap', scrollSnapAlign: 'start',
            transition: 'all 0.2s ease', flexShrink: 0,
          }}>
            <s.icon size={15} /> {s.label}
          </button>
        );
      })}
    </nav>
  );
}
