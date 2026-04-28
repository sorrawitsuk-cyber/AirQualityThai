import React from 'react';

const num = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px',
      boxShadow: '0 14px 34px rgba(15, 23, 42, 0.14)', color: 'var(--text-main)', padding: '10px 12px',
    }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 900, marginBottom: '6px' }}>{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ alignItems: 'center', color: entry.color, display: 'flex', fontSize: '0.75rem', gap: '7px', marginTop: '4px' }}>
          <span style={{ background: entry.color, borderRadius: 999, height: 8, width: 8 }} />
          <span>{entry.name}: {entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export const SectionTitle = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: '14px' }}>
    <h2 style={{ alignItems: 'center', color: 'var(--text-main)', display: 'flex', fontSize: '1.05rem', fontWeight: 900, gap: '8px', margin: 0 }}>
      <span>{icon}</span>{title}
    </h2>
    {subtitle && <p style={{ color: 'var(--text-sub)', fontSize: '0.78rem', lineHeight: 1.55, margin: '4px 0 0' }}>{subtitle}</p>}
  </div>
);

export const Panel = ({ children, style }) => (
  <section style={{
    background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px',
    boxShadow: '0 12px 34px rgba(15, 23, 42, 0.04)', minWidth: 0, padding: '20px', ...style,
  }}>
    {children}
  </section>
);

export const MetricCard = ({ icon, label, value, detail, meta, accent = '#0ea5e9' }) => (
  <div style={{
    background: `linear-gradient(135deg, ${accent}17, var(--bg-card))`,
    border: `1px solid ${accent}33`, borderRadius: '18px', minWidth: 0, padding: '14px',
  }}>
    <div style={{ alignItems: 'center', color: 'var(--text-sub)', display: 'flex', fontSize: '0.72rem', fontWeight: 800, gap: '7px' }}>
      <span style={{ fontSize: '1.05rem' }}>{icon}</span>{label}
    </div>
    <div style={{ color: accent, fontSize: '1.45rem', fontWeight: 950, lineHeight: 1.1, marginTop: '8px' }}>{value}</div>
    {detail && <div style={{ color: 'var(--text-sub)', fontSize: '0.72rem', lineHeight: 1.45, marginTop: '6px' }}>{detail}</div>}
    {meta && <div style={{ color: meta.color || accent, fontSize: '0.72rem', fontWeight: 900, marginTop: '8px' }}>{meta.label || meta.text || meta}</div>}
  </div>
);

export const RankingMini = ({ title, items, unit, accent }) => (
  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '18px', padding: '14px' }}>
    <div style={{ color: 'var(--text-main)', fontSize: '0.84rem', fontWeight: 900, marginBottom: '10px' }}>{title}</div>
    <div style={{ display: 'grid', gap: '8px' }}>
      {items.slice(0, 4).map((item, index) => (
        <div key={`${item.name}-${index}`} style={{ alignItems: 'center', display: 'grid', gap: '8px', gridTemplateColumns: '30px 1fr auto' }}>
          <span style={{ alignItems: 'center', background: `${accent}18`, borderRadius: 999, color: accent, display: 'flex', fontSize: '0.72rem', fontWeight: 900, height: 26, justifyContent: 'center', width: 26 }}>{index + 1}</span>
          <span style={{ color: 'var(--text-main)', fontSize: '0.76rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
          <span style={{ color: accent, fontSize: '0.78rem', fontWeight: 950 }}>{item.val}{unit}</span>
        </div>
      ))}
    </div>
  </div>
);

export const GistdaBrief = ({ summary, isMobile }) => {
  if (!summary) return null;
  const groups = [
    { title: 'ไฟป่า', icon: '🔥', accent: '#ef4444', items: summary.hotspots || [], unit: 'จุด' },
    { title: 'พื้นที่เผาไหม้', icon: '🛰️', accent: '#f97316', items: summary.burntArea || [], unit: 'ไร่' },
    { title: 'ภัยแล้ง', icon: '🏜️', accent: '#f59e0b', items: summary.lowSoilMoisture || [], unit: '' },
    { title: 'น้ำท่วม', icon: '🌊', accent: '#3b82f6', items: summary.floodArea || [], unit: 'ไร่' },
  ].filter((group) => group.items.length);

  if (!groups.length) return null;
  return (
    <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))', marginTop: '14px' }}>
      {groups.map((group) => {
        const top = group.items[0];
        return (
          <div key={group.title} style={{ background: `${group.accent}0f`, border: `1px solid ${group.accent}2e`, borderRadius: '16px', minWidth: 0, padding: '12px' }}>
            <div style={{ alignItems: 'center', color: group.accent, display: 'flex', fontSize: '0.76rem', fontWeight: 950, gap: '7px' }}><span>{group.icon}</span>{group.title}</div>
            <div style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 950, marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{top?.province || '-'}</div>
            <div style={{ color: 'var(--text-sub)', fontSize: '0.7rem', fontWeight: 800, marginTop: '4px' }}>{num(top?.value).toLocaleString('th-TH')} {group.unit}</div>
          </div>
        );
      })}
    </div>
  );
};

export const OverallScore = ({ score, meta, title, summary, details, isMobile }) => (
  <div style={{
    alignItems: isMobile ? 'stretch' : 'center', background: `linear-gradient(135deg, ${meta.color}18, var(--analysis-score-bg))`,
    border: `1px solid ${meta.color}33`, borderRadius: '22px', display: 'grid', gap: '16px',
    gridTemplateColumns: isMobile ? '1fr' : '150px 1fr', marginTop: '18px', padding: '16px',
  }}>
    <div style={{
      alignItems: 'center', background: meta.bg, border: `1px solid ${meta.border}`,
      borderRadius: '20px', display: 'flex', flexDirection: 'column', minHeight: 120, justifyContent: 'center',
    }}>
      <div style={{ color: meta.color, fontSize: '2.6rem', fontWeight: 950, lineHeight: 1 }}>{score}</div>
      <div style={{ color: 'var(--text-sub)', fontSize: '0.72rem', fontWeight: 800 }}>/ 100</div>
      <div style={{ color: meta.color, fontSize: '0.82rem', fontWeight: 950, marginTop: 4 }}>{meta.label}</div>
    </div>
    <div>
      <div style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 950, marginBottom: '6px' }}>{title}</div>
      <div style={{ color: 'var(--text-sub)', fontSize: '0.82rem', lineHeight: 1.62 }}>{summary}</div>
      <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', marginTop: '12px' }}>
        {details.map((item) => (
          <div key={item.label} style={{ background: 'var(--analysis-glass)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '10px' }}>
            <div style={{ color: item.color, fontSize: '0.76rem', fontWeight: 950 }}>{item.label}</div>
            <div style={{ color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 800, lineHeight: 1.45, marginTop: '4px' }}>{item.text}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const PhaseLabel = ({ children }) => (
  <div style={{ alignItems: 'center', color: '#0ea5e9', display: 'flex', fontSize: '0.76rem', fontWeight: 950, gap: '8px', letterSpacing: 0, margin: '4px 0 10px' }}>
    <span style={{ background: '#0ea5e9', borderRadius: 999, height: 8, width: 8 }} />{children}
  </div>
);

export const InsightBox = ({ color = '#0ea5e9', title, children }) => (
  <div style={{
    background: `${color}10`, border: `1px solid ${color}33`, borderRadius: '16px',
    color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 750, lineHeight: 1.6, marginTop: '12px', padding: '12px',
  }}>
    <strong style={{ color, display: 'block', fontSize: '0.76rem', marginBottom: '3px' }}>{title}</strong>
    {children}
  </div>
);
