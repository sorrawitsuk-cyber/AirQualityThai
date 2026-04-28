import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const Card = React.forwardRef(({ children, style, id }, ref) => (
  <section ref={ref} id={id} style={{
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 22, boxShadow: '0 18px 50px rgba(15,23,42,0.055)', ...style,
  }}>{children}</section>
));
Card.displayName = 'Card';

export const BigStat = ({ value, label, unit, color = 'var(--text-main)', icon: Icon }) => (
  <div style={{ textAlign: 'center', padding: '18px 8px' }}>
    {Icon && <Icon size={22} color={color} style={{ marginBottom: 6 }} />}
    <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1.1 }}>
      {value}<span style={{ fontSize: '0.9rem', fontWeight: 700, marginLeft: 2 }}>{unit}</span>
    </div>
    <div style={{ color: 'var(--text-sub)', fontSize: '0.76rem', marginTop: 6, fontWeight: 700 }}>{label}</div>
  </div>
);

export const ExpandableDetail = ({ children, label = 'ดูรายละเอียดเพิ่มเติม' }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 14 }}>
      <button type="button" onClick={() => setOpen(!open)} className="ai-expand-btn" style={{
        width: '100%', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
        borderRadius: 14, padding: '12px 16px', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.82rem',
        fontWeight: 800, color: 'var(--text-sub)',
      }}>
        {open ? 'ซ่อนรายละเอียด' : label}
        <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
      </button>
      <div style={{
        maxHeight: open ? 2000 : 0, overflow: 'hidden',
        transition: 'max-height 0.4s ease, opacity 0.3s ease',
        opacity: open ? 1 : 0, marginTop: open ? 14 : 0,
      }}>{children}</div>
    </div>
  );
};

export const StatusBadge = ({ text, color }) => (
  <span style={{
    display: 'inline-block', padding: '4px 12px', borderRadius: 999,
    background: `${color}18`, color, fontSize: '0.74rem', fontWeight: 800,
  }}>{text}</span>
);

export const SectionHeader = ({ title, icon: Icon, eyebrow }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {Icon && <span style={{
        width: 36, height: 36, borderRadius: 13, background: '#eff6ff',
        color: '#2563eb', display: 'grid', placeItems: 'center',
      }}><Icon size={20} strokeWidth={2.4} /></span>}
      <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>{title}</h2>
    </div>
    {eyebrow && <div style={{ color: 'var(--text-sub)', fontSize: '0.78rem', marginTop: 5, marginLeft: 46 }}>{eyebrow}</div>}
  </div>
);

export const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      padding: '10px 12px', borderRadius: 14, boxShadow: '0 16px 30px rgba(15,23,42,0.13)',
    }}>
      <p style={{ margin: '0 0 7px', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.82rem' }}>{label}</p>
      {payload.map((e) => (
        <div key={e.dataKey} style={{ color: e.color, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: e.color }} />
          {e.name}: {e.value}
        </div>
      ))}
    </div>
  );
};
