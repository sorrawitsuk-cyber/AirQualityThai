import React, { useState } from 'react';

function getRankBadge(index) {
  if (index === 0) return '#f59e0b';
  if (index === 1) return '#94a3b8';
  if (index === 2) return '#f97316';
  return 'var(--text-sub)';
}

function formatValue(value, suffix = '') {
  if (value === undefined || value === null || value === '') return '-';
  return `${value}${suffix}`;
}

function CompactChip({ icon, label, item, suffix, accentColor, borderColor }) {
  return (
    <div
      style={{
        minWidth: 0,
        border: `1px solid ${accentColor}33`,
        background: `linear-gradient(180deg, ${accentColor}12, var(--bg-secondary))`,
        borderRadius: '16px',
        padding: '11px 12px',
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr) auto',
        alignItems: 'center',
        gap: '9px',
        boxShadow: `inset 0 1px 0 ${accentColor}18`,
      }}
    >
      <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: accentColor, fontSize: '0.68rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </div>
        <div style={{ color: 'var(--text-main)', fontSize: '0.86rem', fontWeight: 900, marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item?.name || 'ยังไม่มีข้อมูล'}
        </div>
      </div>
      <div style={{ color: accentColor, fontSize: '0.95rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
        {formatValue(item?.val, suffix)}
      </div>
    </div>
  );
}

function StatListCard({ title, icon, accentColor, items = [], suffix, cardBg, borderColor, textColor, subTextColor }) {
  return (
    <div
      style={{
        background: cardBg,
        borderRadius: '18px',
        padding: '14px',
        border: `1px solid ${borderColor}`,
        boxShadow: `inset 0 1px 0 ${accentColor}22`,
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: accentColor, fontWeight: 900, fontSize: '0.9rem', marginBottom: '12px' }}>
        <span style={{ fontSize: '1.05rem' }}>{icon}</span>
        <span>{title}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {items.map((st, i) => (
          <div
            key={`${title}-${st.name}-${i}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '30px minmax(0, 1fr) auto',
              alignItems: 'center',
              gap: '9px',
              padding: '9px 10px',
              background: 'var(--bg-secondary)',
              borderRadius: '13px',
              border: `1px solid ${borderColor}`,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: '25px',
                height: '25px',
                borderRadius: '999px',
                background: `${getRankBadge(i)}22`,
                color: getRankBadge(i),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 900,
              }}
            >
              {i + 1}
            </div>
            <div style={{ color: textColor, fontWeight: 800, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {st.name}
            </div>
            <div style={{ color: accentColor, fontWeight: 900, fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
              {formatValue(st.val, suffix)}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ color: subTextColor, fontSize: '0.78rem', padding: '8px 0' }}>
            ยังไม่มีข้อมูลสำหรับหมวดนี้
          </div>
        )}
      </div>
    </div>
  );
}

export default function TopStats({
  top5Heat, top5Cool, top5PM25, top5Rain,
  top5HeatY, top5CoolY, top5PM25Y, top5RainY,
  isMobile, cardBg, borderColor, textColor,
  showYesterday = true,
}) {
  const [expanded, setExpanded] = useState(false);
  const subTextColor = 'var(--text-sub)';

  const realtimeCards = [
    { title: 'ร้อนจัดที่สุด', compactLabel: 'ร้อนสุด', icon: '🔥', accentColor: '#ef4444', items: top5Heat || [], suffix: '°' },
    { title: 'เย็นสบายที่สุด', compactLabel: 'เย็นสุด', icon: '❄️', accentColor: '#3b82f6', items: top5Cool || [], suffix: '°' },
    { title: 'ฝุ่น PM2.5 สูงสุด', compactLabel: 'ฝุ่นสูงสุด', icon: '😷', accentColor: '#f97316', items: top5PM25 || [], suffix: '' },
    { title: 'โอกาสฝนสูงสุด', compactLabel: 'ฝนสูงสุด', icon: '☔', accentColor: '#0ea5e9', items: top5Rain || [], suffix: '%' },
  ];

  const yesterdayCards = [
    { title: 'ร้อนจัดที่สุดเมื่อวาน', icon: '🔥', accentColor: '#ef4444', items: top5HeatY || [], suffix: '°' },
    { title: 'เย็นสบายที่สุดเมื่อวาน', icon: '❄️', accentColor: '#3b82f6', items: top5CoolY || [], suffix: '°' },
    { title: 'ฝุ่น PM2.5 สูงสุดเมื่อวาน', icon: '😷', accentColor: '#f97316', items: top5PM25Y || [], suffix: '' },
    { title: 'โอกาสฝนสูงสุดเมื่อวาน', icon: '☔', accentColor: '#0ea5e9', items: top5RainY || [], suffix: '%' },
  ].filter((card) => showYesterday && Array.isArray(card.items) && card.items.length > 0);

  return (
    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div
        style={{
          background: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: '22px',
          padding: isMobile ? '14px' : '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ color: textColor, fontSize: '0.95rem', fontWeight: 900 }}>
            อันดับอากาศทั่วไทย
          </div>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            style={{
              border: `1px solid ${borderColor}`,
              background: 'var(--bg-secondary)',
              color: '#2563eb',
              borderRadius: '999px',
              padding: '7px 12px',
              fontSize: '0.72rem',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            {expanded ? 'ย่ออันดับ' : 'ดูอันดับทั้งหมด'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
          {realtimeCards.map((card) => (
            <CompactChip
              key={`summary-${card.title}`}
              icon={card.icon}
              label={card.compactLabel}
              item={card.items[0]}
              suffix={card.suffix}
              accentColor={card.accentColor}
              borderColor={borderColor}
            />
          ))}
        </div>
      </div>

      {expanded && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: textColor, fontWeight: 900, fontSize: '0.88rem' }}>
              <span style={{ color: '#22c55e' }}>●</span> เรียลไทม์ตอนนี้
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))', gap: '14px', alignItems: 'start' }}>
              {realtimeCards.map((card) => (
                <StatListCard
                  key={`realtime-${card.title}`}
                  {...card}
                  cardBg={cardBg}
                  borderColor={borderColor}
                  textColor={textColor}
                  subTextColor={subTextColor}
                />
              ))}
            </div>
          </div>

          {yesterdayCards.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: textColor, fontWeight: 900, fontSize: '0.88rem' }}>
                <span style={{ color: '#a855f7' }}>●</span> สถิติสูงสุดของเมื่อวาน
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))', gap: '14px', alignItems: 'start' }}>
                {yesterdayCards.map((card) => (
                  <StatListCard
                    key={`yesterday-${card.title}`}
                    {...card}
                    cardBg={cardBg}
                    borderColor={borderColor}
                    textColor={textColor}
                    subTextColor={subTextColor}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
