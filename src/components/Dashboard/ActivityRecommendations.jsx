import React from 'react';

function clampScore(value) {
  return Math.max(0, Math.min(10, value));
}

function levelFromScore(score) {
  if (score >= 8.5) return { text: 'ดีมาก', color: '#16a34a', bg: 'rgba(22,163,74,0.12)' };
  if (score >= 7) return { text: 'เหมาะ', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' };
  if (score >= 5) return { text: 'พอใช้', color: '#f59e0b', bg: 'rgba(245,158,11,0.14)' };
  if (score >= 3.5) return { text: 'ควรระวัง', color: '#f97316', bg: 'rgba(249,115,22,0.14)' };
  return { text: 'ควรเลี่ยง', color: '#ef4444', bg: 'rgba(239,68,68,0.14)' };
}

function penaltyText(value, labels) {
  for (const item of labels) {
    if (value >= item.min) return item.text;
  }
  return labels[labels.length - 1]?.text || '';
}

function getActivityMetrics(current = {}) {
  const rainProb = Math.round(current?.rainProb || 0);
  const rain = Number(current?.rain || current?.precipitation || 0);
  const wind = Math.round(current?.windSpeed || 0);
  const heat = Math.round(current?.feelsLike || current?.temp || 0);
  const pm25 = Math.round(current?.pm25 || 0);
  const visibilityKm = Math.max(0, (current?.visibility || 10000) / 1000);

  const heatRisk = heat >= 40 ? 3.2 : heat >= 38 ? 2.4 : heat >= 35 ? 1.5 : heat >= 32 ? 0.7 : 0;
  const rainRisk = rainProb >= 80 ? 4 : rainProb >= 60 ? 3 : rainProb >= 40 ? 2 : rainProb >= 20 ? 1 : 0;
  const pmRisk = pm25 >= 75 ? 4 : pm25 >= 50 ? 3 : pm25 >= 37 ? 2 : pm25 >= 25 ? 1 : 0;
  const windRisk = wind >= 30 ? 3 : wind >= 20 ? 2 : wind >= 14 ? 1 : 0;
  const visibilityRisk = visibilityKm < 2 ? 3 : visibilityKm < 5 ? 1.6 : 0;

  const dryWindow = rainProb >= 45 ? 'เช้าตรู่ 06:00-09:00' : 'ก่อนบ่าย 09:00-15:00';
  const coolWindow = heat >= 35 ? 'เช้า 06:00-08:30 หรือหลัง 18:00' : 'เช้า-เย็น 06:00-10:00';
  const travelWindow = rainProb >= 45 ? 'ก่อนฝน 09:00-13:00' : 'สาย-เย็น 09:00-17:00';
  const drivingWindow = rainProb >= 45 ? 'เลี่ยงชั่วโมงฝนหนัก' : 'ได้ทั้งวัน';

  const makeItem = ({ title, icon, base, score, bestTime, reasons, shortReason }) => {
    const finalScore = clampScore(score);
    const level = levelFromScore(finalScore);
    return {
      title,
      icon,
      score: finalScore,
      bestTime,
      reasons,
      shortReason,
      text: level.text,
      color: level.color,
      bg: level.bg,
      base,
    };
  };

  return [
    makeItem({
      title: 'ออกกำลังกาย',
      icon: '🏃‍♂️',
      base: '#f97316',
      score: 9.2 - heatRisk * 1.2 - pmRisk * 1.05 - rainRisk * 0.8 - windRisk * 0.25,
      bestTime: coolWindow,
      reasons: [
        penaltyText(heat, [
          { min: 40, text: 'ร้อนจัด เสี่ยงล้าเร็ว' },
          { min: 35, text: 'อากาศร้อน ลดความหนัก' },
          { min: 0, text: 'อุณหภูมิพอไหว' },
        ]),
        penaltyText(pm25, [
          { min: 50, text: 'ฝุ่นสูง ควรออกกำลังในอาคาร' },
          { min: 25, text: 'ฝุ่นปานกลาง เลี่ยงหนัก' },
          { min: 0, text: 'ฝุ่นยังรับได้' },
        ]),
      ],
      shortReason: `รู้สึก ${heat}° · PM2.5 ${pm25}`,
    }),
    makeItem({
      title: 'ซักผ้า / ล้างรถ',
      icon: '👕',
      base: '#22c55e',
      score: 9.4 - rainRisk * 1.7 - (rain > 0 ? 2.2 : 0) + (heat >= 32 ? 0.6 : 0) - (wind >= 25 ? 0.7 : 0),
      bestTime: dryWindow,
      reasons: [
        rainProb >= 50 ? 'ฝนมีโอกาสสูง ผ้าแห้งยาก' : rainProb >= 25 ? 'มีโอกาสฝน ควรดูเมฆ' : 'ฝนต่ำ เหมาะตากผ้า',
        heat >= 32 ? 'แดดช่วยให้แห้งไว' : 'แดดไม่แรงมาก',
      ],
      shortReason: `ฝน ${rainProb}% · ลม ${wind} กม./ชม.`,
    }),
    makeItem({
      title: 'รดน้ำต้นไม้',
      icon: '💧',
      base: '#3b82f6',
      score: rainProb >= 70 ? 3 : 8.4 - rainRisk * 0.95 + (heat >= 34 ? 0.7 : 0) - (rain > 0 ? 2 : 0),
      bestTime: rainProb >= 60 ? 'รอดูฝนก่อน' : 'เย็น 17:00-19:00',
      reasons: [
        rainProb >= 60 ? 'ฝนอาจช่วยรดแทน' : 'ดินอาจแห้งช่วงเย็น',
        heat >= 34 ? 'อากาศร้อน น้ำระเหยเร็ว' : 'รดตอนเย็นลดการระเหย',
      ],
      shortReason: `ฝน ${rainProb}% · รู้สึก ${heat}°`,
    }),
    makeItem({
      title: 'ฉีดพ่นยา/ปุ๋ย',
      icon: '🚁',
      base: '#0ea5e9',
      score: 9.1 - windRisk * 1.65 - rainRisk * 1.25 - (rain > 0 ? 2.5 : 0),
      bestTime: wind >= 14 || rainProb >= 40 ? 'เลี่ยงวันนี้' : 'เช้า 06:00-09:00',
      reasons: [
        wind >= 20 ? 'ลมแรง เสี่ยงปลิว' : wind >= 14 ? 'ลมเริ่มแรง ควรระวัง' : 'ลมสงบ ใช้งานได้',
        rainProb >= 40 ? 'ฝนอาจชะล้างน้ำยา' : 'ฝนต่ำกว่าเกณฑ์เสี่ยง',
      ],
      shortReason: `ลม ${wind} กม./ชม. · ฝน ${rainProb}%`,
    }),
    makeItem({
      title: 'ขับขี่เดินทาง',
      icon: '🚘',
      base: '#f59e0b',
      score: 9 - rainRisk * 0.95 - visibilityRisk * 1.15 - windRisk * 0.35,
      bestTime: drivingWindow,
      reasons: [
        rainProb >= 60 ? 'ฝนหนัก ถนนลื่น' : rainProb >= 30 ? 'อาจมีฝนระยะสั้น' : 'ฝนน้อย เดินทางง่าย',
        visibilityKm < 5 ? 'ทัศนวิสัยลดลง' : 'ทัศนวิสัยดี',
      ],
      shortReason: `ฝน ${rainProb}% · มองเห็น ${visibilityKm.toFixed(1)} กม.`,
    }),
    makeItem({
      title: 'เที่ยว / ตั้งแคมป์',
      icon: '⛺',
      base: '#84cc16',
      score: 9 - rainRisk * 1.25 - windRisk * 0.75 - pmRisk * 0.65 - heatRisk * 0.75,
      bestTime: travelWindow,
      reasons: [
        rainProb >= 50 ? 'ฝนรบกวนกิจกรรมกลางแจ้ง' : 'ฝนยังพอวางแผนได้',
        pm25 >= 50 ? 'ฝุ่นสูง วิวไม่ใส' : heat >= 35 ? 'ร้อน ควรพักบ่อย' : 'บรรยากาศค่อนข้างดี',
      ],
      shortReason: `ฝน ${rainProb}% · PM2.5 ${pm25}`,
    }),
  ].sort((a, b) => b.score - a.score);
}

function buildRadarPoints(items, centerX, centerY, radius) {
  return items.map((item, index) => {
    const angle = (-Math.PI / 2) + ((Math.PI * 2 * index) / items.length);
    const normalized = clampScore(item.score) / 10;
    return {
      ...item,
      axisX: centerX + Math.cos(angle) * radius,
      axisY: centerY + Math.sin(angle) * radius,
      pointX: centerX + Math.cos(angle) * radius * normalized,
      pointY: centerY + Math.sin(angle) * radius * normalized,
      labelX: centerX + Math.cos(angle) * (radius + 30),
      labelY: centerY + Math.sin(angle) * (radius + 30),
    };
  });
}

function splitRadarLabel(title) {
  if (title.includes(' / ')) return title.split(' / ');
  if (title.includes('/')) return title.split('/');
  if (title.length <= 12) return [title];
  return [title.slice(0, 10), title.slice(10)];
}

export default function ActivityRecommendations({ current, isMobile, cardBg, borderColor, subTextColor }) {
  const items = getActivityMetrics(current);
  const chartSize = isMobile ? 292 : 300;
  const chartCenter = chartSize / 2;
  const chartRadius = isMobile ? 76 : 90;
  const radarPoints = buildRadarPoints(items, chartCenter, chartCenter, chartRadius);
  const polygonPoints = radarPoints.map((point) => `${point.pointX},${point.pointY}`).join(' ');
  const headline = items[0];

  return (
    <div style={{ background: cardBg, borderRadius: '24px', padding: isMobile ? '16px' : '20px', border: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🎯</span> Radar กิจกรรมวันนี้
          </h3>
          <div style={{ fontSize: '0.74rem', color: subTextColor, marginTop: '4px', lineHeight: 1.5 }}>
            คะแนน 0-10 คิดจากฝน ความร้อน ฝุ่น ลม และทัศนวิสัย ยิ่งเขียวและคะแนนสูงยิ่งเหมาะทำตอนนี้
          </div>
        </div>
        <div style={{ background: headline.bg, border: `1px solid ${headline.color}55`, borderRadius: '16px', padding: '10px 12px', minWidth: isMobile ? '100%' : '170px' }}>
          <div style={{ fontSize: '0.68rem', color: subTextColor, fontWeight: 'bold' }}>เหมาะสุดตอนนี้</div>
          <div style={{ fontSize: '0.92rem', color: headline.color, fontWeight: '900', marginTop: '3px' }}>{headline.icon} {headline.title}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-main)', marginTop: '4px', fontWeight: 800 }}>{headline.score.toFixed(1)} / 10 · {headline.text}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
        <svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`} role="img" aria-label="Radar chart กิจกรรมรายวัน" style={{ overflow: 'visible', maxWidth: '100%' }}>
          {[0.25, 0.5, 0.75, 1].map((scale, ringIndex) => {
            const ringPoints = items.map((_, itemIndex) => {
              const angle = (-Math.PI / 2) + ((Math.PI * 2 * itemIndex) / items.length);
              const x = chartCenter + Math.cos(angle) * chartRadius * scale;
              const y = chartCenter + Math.sin(angle) * chartRadius * scale;
              return `${x},${y}`;
            }).join(' ');
            return <polygon key={ringIndex} points={ringPoints} fill="none" stroke="rgba(148,163,184,0.24)" strokeWidth="1" />;
          })}

          {radarPoints.map((point, index) => (
            <g key={index}>
              <line x1={chartCenter} y1={chartCenter} x2={point.axisX} y2={point.axisY} stroke="rgba(148,163,184,0.22)" strokeWidth="1" />
              <text
                x={point.labelX}
                y={point.labelY}
                textAnchor={Math.abs(point.labelX - chartCenter) < 12 ? 'middle' : point.labelX < chartCenter ? 'end' : 'start'}
                fill="var(--text-main)"
                fontSize={isMobile ? '10' : '11'}
                fontWeight="800"
              >
                {splitRadarLabel(point.title).map((line, lineIndex) => (
                  <tspan key={`${point.title}-${lineIndex}`} x={point.labelX} dy={lineIndex === 0 ? '-0.35em' : '1.05em'}>
                    {line.trim()}
                  </tspan>
                ))}
              </text>
            </g>
          ))}

          <polygon points={polygonPoints} fill="rgba(14,165,233,0.16)" stroke="#0ea5e9" strokeWidth="2.5" />
          {radarPoints.map((point) => (
            <circle key={point.title} cx={point.pointX} cy={point.pointY} r="5" fill={point.color} stroke={cardBg} strokeWidth="2.5" />
          ))}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', color: subTextColor, fontSize: '0.68rem', fontWeight: 800 }}>
        {[
          ['#16a34a', 'ดีมาก 8.5+'],
          ['#22c55e', 'เหมาะ 7+'],
          ['#f59e0b', 'พอใช้ 5+'],
          ['#f97316', 'ระวัง 3.5+'],
          ['#ef4444', 'เลี่ยง'],
        ].map(([color, label]) => (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '999px', background: color }} />
            {label}
          </span>
        ))}
      </div>

      <div style={isMobile ? { display: 'grid', gridTemplateColumns: '1fr', gap: '10px' } : { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
        {items.map((item) => (
          <div
            key={item.title}
            style={{
              background: `linear-gradient(180deg, ${item.bg}, var(--bg-secondary))`,
              border: `1px solid ${item.color}44`,
              borderRadius: '16px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '9px',
              minWidth: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: '900', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.icon} {item.title}
                </div>
                <div style={{ fontSize: '0.68rem', color: subTextColor, marginTop: '3px' }}>{item.shortReason}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '1.15rem', color: item.color, fontWeight: '900', lineHeight: 1 }}>{item.score.toFixed(1)}</div>
                <div style={{ fontSize: '0.6rem', color: subTextColor, marginTop: '2px' }}>จาก 10</div>
              </div>
            </div>

            <div style={{ display: 'inline-flex', alignSelf: 'flex-start', color: item.color, background: item.bg, border: `1px solid ${item.color}33`, borderRadius: '999px', padding: '4px 8px', fontSize: '0.68rem', fontWeight: 900 }}>
              {item.text}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: subTextColor, fontSize: '0.66rem', lineHeight: 1.35 }}>
              {item.reasons.map((reason) => (
                <div key={reason}>• {reason}</div>
              ))}
            </div>

            <div style={{ color: '#0284c7', fontSize: '0.66rem', lineHeight: 1.35, fontWeight: '900', marginTop: 'auto' }}>
              เวลาที่เหมาะ: {item.bestTime}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
