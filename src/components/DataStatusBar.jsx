import React from 'react';

const toneMap = {
  live: { color: '#16a34a', label: 'ข้อมูลสด' },
  cache: { color: '#f59e0b', label: 'ใช้ข้อมูล cache' },
  fallback: { color: '#f59e0b', label: 'ข้อมูลสำรอง' },
  waiting: { color: '#64748b', label: 'รอข้อมูล' },
  error: { color: '#dc2626', label: 'ข้อมูลไม่พร้อม' },
};

export default function DataStatusBar({
  status = 'live',
  label,
  items = [],
  sources = [],
  compact = false,
  style,
}) {
  const tone = toneMap[status] || toneMap.live;
  const visibleItems = items.filter((item) => item?.value);
  const visibleSources = sources.filter(Boolean);

  return (
    <section
      aria-label="สถานะข้อมูล"
      style={{
        alignItems: 'center',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: compact ? 14 : 16,
        boxShadow: compact ? 'none' : '0 6px 16px rgba(15,23,42,0.045)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: compact ? 8 : 10,
        justifyContent: 'space-between',
        padding: compact ? '9px 11px' : '10px 14px',
        ...style,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8, minWidth: 0 }}>
        <span
          style={{
            alignItems: 'center',
            background: `${tone.color}12`,
            border: `1px solid ${tone.color}28`,
            borderRadius: 999,
            color: tone.color,
            display: 'inline-flex',
            fontSize: compact ? '0.68rem' : '0.72rem',
            fontWeight: 900,
            gap: 6,
            lineHeight: 1,
            padding: compact ? '6px 9px' : '7px 10px',
            whiteSpace: 'nowrap',
          }}
        >
          <span aria-hidden="true" style={{ background: tone.color, borderRadius: 999, height: 7, width: 7 }} />
          {label || tone.label}
        </span>

        {visibleItems.map((item) => (
          <span
            key={item.label}
            style={{
              color: item.strong ? 'var(--text-main)' : 'var(--text-sub)',
              fontSize: compact ? '0.68rem' : '0.74rem',
              fontWeight: item.strong ? 850 : 750,
              minWidth: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}: {item.value}
          </span>
        ))}
      </div>

      {visibleSources.length > 0 && (
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {visibleSources.map((source) => (
            <span
              key={source}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 999,
                color: 'var(--text-main)',
                fontSize: compact ? '0.64rem' : '0.68rem',
                fontWeight: 850,
                padding: compact ? '5px 8px' : '6px 9px',
                whiteSpace: 'nowrap',
              }}
            >
              {source}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
