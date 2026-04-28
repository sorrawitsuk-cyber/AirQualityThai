import React from 'react';

function buildRows(daily) {
  const rowCount = Math.max(
    daily?.time?.length || 0,
    daily?.temperature_2m_max?.length || 0,
    daily?.temperature_2m_min?.length || 0,
    daily?.precipitation_probability_max?.length || 0,
    0
  );

  return Array.from({ length: Math.min(rowCount, 7) }, (_, idx) => {
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + idx);

    return {
      time: daily?.time?.[idx] || fallbackDate.toISOString(),
      weatherCode: daily?.weathercode?.[idx] ?? 0,
      minTemp: Math.round(daily?.temperature_2m_min?.[idx] || 0),
      maxTemp: Math.round(daily?.temperature_2m_max?.[idx] || 0),
      rainProb: daily?.precipitation_probability_max?.[idx] || 0,
      rainSum: daily?.precipitation_sum?.[idx] || 0,
      feelsLikeMax: Math.round(daily?.apparent_temperature_max?.[idx] || daily?.temperature_2m_max?.[idx] || 0),
      pm25Max: Math.round(daily?.pm25_max?.[idx] || daily?.pm25?.[idx] || 0),
    };
  });
}

function weatherIcon(code, rainProb) {
  if (code >= 95) return '⛈️';
  if (code >= 61 || rainProb >= 50) return '🌧️';
  if (rainProb >= 25) return '🌦️';
  if (code >= 45) return '🌫️';
  return '🌤️';
}

export default function DailyForecast({ daily, isMobile, cardBg, borderColor, textColor, subTextColor }) {
  const rows = buildRows(daily);
  const minTemp = Math.min(...rows.map((row) => row.minTemp), 24);
  const maxTemp = Math.max(...rows.map((row) => row.maxTemp), 36);
  const tempRange = Math.max(maxTemp - minTemp, 4);
  const chartWidth = Math.max(rows.length - 1, 1) * 92 + 72;
  const highPoints = rows.map((row, idx) => {
    const x = idx * 92 + 36;
    const y = 18 + ((maxTemp - row.maxTemp) / tempRange) * 72;
    return `${x},${y}`;
  }).join(' ');
  const lowPoints = rows.map((row, idx) => {
    const x = idx * 92 + 36;
    const y = 34 + ((maxTemp - row.minTemp) / tempRange) * 72;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ background: cardBg, borderRadius: isMobile ? '18px' : '22px', padding: isMobile ? '16px' : '20px', border: `1px solid ${borderColor}`, flexShrink: 0, minWidth: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: textColor, fontWeight: 900 }}>📅 พยากรณ์ 7 วัน</h3>
        <div style={{ color: subTextColor, fontSize: '0.68rem', fontWeight: 800 }}>อุณหภูมิ + รู้สึกเหมือน + PM2.5 + ฝน</div>
      </div>

      {rows.length > 0 ? (
        <div className="hide-scrollbar" style={{ overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ minWidth: isMobile ? `${chartWidth}px` : '100%', height: '258px', position: 'relative' }}>
            <svg viewBox={`0 0 ${chartWidth} 132`} preserveAspectRatio="none" style={{ position: 'absolute', top: 34, left: 0, width: '100%', height: 132, overflow: 'visible', pointerEvents: 'none' }}>
              {[28, 64, 100].map((y) => (
                <line key={y} x1="22" x2={chartWidth - 22} y1={y} y2={y} stroke="rgba(148,163,184,0.18)" strokeWidth="1" />
              ))}
              <polyline points={lowPoints} fill="none" stroke="#60a5fa" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={highPoints} fill="none" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {rows.map((row, idx) => {
                const highY = 18 + ((maxTemp - row.maxTemp) / tempRange) * 72;
                const lowY = 34 + ((maxTemp - row.minTemp) / tempRange) * 72;
                const x = idx * 92 + 36;
                return (
                  <g key={`${row.time}-dots`}>
                    <circle cx={x} cy={highY} r="4" fill="#fff" stroke="#fb923c" strokeWidth="2" />
                    <circle cx={x} cy={lowY} r="3.4" fill="#fff" stroke="#60a5fa" strokeWidth="2" />
                  </g>
                );
              })}
            </svg>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${rows.length}, minmax(84px, 1fr))`, height: '100%', minWidth: 'max-content' }}>
              {rows.map((row, idx) => {
                const rainBar = Math.max(8, Math.min(58, row.rainProb * 0.58));
                const pmColor = row.pm25Max > 75 ? '#ef4444' : row.pm25Max > 37.5 ? '#f97316' : row.pm25Max > 25 ? '#eab308' : '#22c55e';
                return (
                  <div key={`${row.time}-${idx}`} style={{ display: 'grid', gridTemplateRows: '26px 34px 84px 34px 54px 42px', justifyItems: 'center', alignItems: 'center', minWidth: '84px' }}>
                    <div style={{ color: idx === 0 ? '#2563eb' : subTextColor, fontSize: '0.68rem', fontWeight: 900 }}>
                      {idx === 0 ? 'วันนี้' : new Date(row.time).toLocaleDateString('th-TH', { weekday: 'short' })}
                    </div>
                    <div style={{ color: subTextColor, fontSize: '0.62rem', fontWeight: 800 }}>
                      {new Date(row.time).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', alignSelf: 'start', paddingTop: '8px' }}>
                      <div style={{ color: '#fb923c', fontSize: '0.75rem', fontWeight: 900 }}>{row.maxTemp}°</div>
                      <div style={{ color: '#60a5fa', fontSize: '0.68rem', fontWeight: 900 }}>{row.minTemp}°</div>
                    </div>
                    <div style={{ fontSize: '1.25rem' }}>{weatherIcon(row.weatherCode, row.rainProb)}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'end', height: '54px', gap: '5px' }}>
                      <div style={{ width: '22px', height: `${rainBar}px`, borderRadius: '7px 7px 3px 3px', background: 'linear-gradient(180deg, #93c5fd, #2563eb)' }} />
                      <span style={{ color: row.rainProb >= 40 ? '#2563eb' : subTextColor, fontSize: '0.64rem', fontWeight: 900 }}>
                        ฝน {row.rainProb}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <div style={{ color: '#f97316', fontSize: '0.62rem', fontWeight: 900 }}>รู้สึก {row.feelsLikeMax}°</div>
                      <div style={{ color: pmColor, fontSize: '0.64rem', fontWeight: 900 }}>PM2.5 {row.pm25Max || '-'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px 0 2px', color: subTextColor, fontSize: '0.85rem' }}>
          ยังไม่มีข้อมูลพยากรณ์รายวันสำหรับตำแหน่งนี้
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: subTextColor, fontSize: '0.67rem', fontWeight: 800, flexWrap: 'wrap', paddingTop: '12px', borderTop: `1px solid ${borderColor}` }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 16, height: 3, borderRadius: 999, background: '#fb923c' }} /> สูงสุด</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 16, height: 3, borderRadius: 999, background: '#60a5fa' }} /> ต่ำสุด</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 10, height: 10, borderRadius: 999, background: '#f97316' }} /> รู้สึกเหมือน</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 10, height: 10, borderRadius: 999, background: '#22c55e' }} /> PM2.5</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 10, height: 14, borderRadius: '4px 4px 2px 2px', background: '#2563eb' }} /> โอกาสฝน</span>
      </div>
    </div>
  );
}
