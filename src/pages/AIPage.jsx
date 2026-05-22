import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CloudRain,
  Database,
  FileText,
  Droplets,
  Gauge,
  MapPin,
  Printer,
  RefreshCw,
  Sparkles,
  ThermometerSun,
  Wind,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { heatMeta, pmMeta, riskMeta, thaiTime, useAIPageData } from '../components/ai/useAIPageData';
import { getUvStatus, startIndexFromNow } from '../components/ai/dataUtils';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const round = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
};

const chartText = {
  fill: 'var(--text-sub)',
  fontSize: 11,
  fontWeight: 700,
};

const areaMetricOptions = [
  { id: 'risk', label: 'เสี่ยงรวม', key: 'riskScore', unit: '', color: '#7c3aed', direction: 'desc' },
  { id: 'rain', label: 'ฝน', key: 'rain', unit: '%', color: '#2563eb', direction: 'desc' },
  { id: 'pm25', label: 'ฝุ่น', key: 'pm25', unit: '', color: '#f97316', direction: 'desc' },
  { id: 'heat', label: 'ร้อน', key: 'feelsLike', unit: '°', color: '#ef4444', direction: 'desc' },
  { id: 'wind', label: 'ลม', key: 'wind', unit: '', color: '#0f766e', direction: 'desc' },
];

function Panel({ children, style }) {
  return (
    <section
      style={{
        background: 'rgba(255,255,255,0.88)',
        border: '1px solid var(--border-color)',
        borderRadius: 18,
        boxShadow: '0 16px 45px rgba(15,23,42,0.06)',
        minWidth: 0,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function PanelHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div style={{ alignItems: 'flex-start', display: 'flex', gap: 12, justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ alignItems: 'flex-start', display: 'flex', gap: 10, minWidth: 0 }}>
        {Icon && (
          <div
            style={{
              alignItems: 'center',
              background: 'rgba(14,165,233,0.1)',
              border: '1px solid rgba(14,165,233,0.2)',
              borderRadius: 12,
              color: '#0284c7',
              display: 'flex',
              height: 38,
              justifyContent: 'center',
              width: 38,
            }}
          >
            <Icon size={19} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 950, lineHeight: 1.25, margin: 0 }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ color: 'var(--text-sub)', fontSize: '0.76rem', lineHeight: 1.45, margin: '4px 0 0' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

function StatCard({ icon, label, value, unit, note, color = '#2563eb', percent, compact }) {
  const CardIcon = icon;
  return (
    <Panel style={{ minHeight: compact ? 118 : 136, padding: compact ? 14 : 16 }}>
      <div style={{ alignItems: 'center', display: 'flex', gap: 10, justifyContent: 'space-between' }}>
        <div style={{ color: 'var(--text-sub)', fontSize: '0.73rem', fontWeight: 900 }}>{label}</div>
        <div
          style={{
            alignItems: 'center',
            background: `${color}14`,
            border: `1px solid ${color}28`,
            borderRadius: 11,
            color,
            display: 'flex',
            height: 34,
            justifyContent: 'center',
            width: 34,
          }}
        >
          <CardIcon size={18} />
        </div>
      </div>
      <div style={{ alignItems: 'baseline', color, display: 'flex', gap: 4, marginTop: 8 }}>
        <span style={{ fontSize: compact ? '1.7rem' : '2.15rem', fontWeight: 950, lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: '0.82rem', fontWeight: 900 }}>{unit}</span>}
      </div>
      {note && <div style={{ color: 'var(--text-sub)', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.35, marginTop: 5 }}>{note}</div>}
      {percent != null && (
        <div style={{ background: 'rgba(148,163,184,0.16)', borderRadius: 999, height: 7, marginTop: 12, overflow: 'hidden' }}>
          <div style={{ background: color, borderRadius: 999, height: '100%', width: `${clamp(percent)}%` }} />
        </div>
      )}
    </Panel>
  );
}

function TooltipBox({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.96)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        boxShadow: '0 12px 30px rgba(15,23,42,0.12)',
        color: 'var(--text-main)',
        minWidth: 136,
        padding: '10px 12px',
      }}
    >
      <div style={{ fontSize: '0.72rem', fontWeight: 950, marginBottom: 6 }}>{label}</div>
      {payload.map((item) => (
        <div key={`${item.name}-${item.dataKey}`} style={{ alignItems: 'center', display: 'flex', gap: 7, fontSize: '0.7rem', fontWeight: 800, marginTop: 3 }}>
          <span style={{ background: item.color, borderRadius: 999, height: 8, width: 8 }} />
          <span style={{ color: 'var(--text-sub)', flex: 1 }}>{item.name}</span>
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function RankList({ title, items = [], unit = '', color = '#2563eb' }) {
  return (
    <Panel style={{ padding: 14 }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ color: 'var(--text-main)', fontSize: '0.83rem', fontWeight: 950 }}>{title}</div>
        <BarChart3 color={color} size={17} />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.slice(0, 5).map((item, index) => (
          <div key={`${title}-${item.name}-${index}`} style={{ alignItems: 'center', display: 'grid', gap: 8, gridTemplateColumns: '26px 1fr auto' }}>
            <div
              style={{
                alignItems: 'center',
                background: `${color}13`,
                borderRadius: 9,
                color,
                display: 'flex',
                fontSize: '0.7rem',
                fontWeight: 950,
                height: 26,
                justifyContent: 'center',
              }}
            >
              {index + 1}
            </div>
            <div style={{ color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 850, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.name}
            </div>
            <div style={{ color, fontSize: '0.78rem', fontWeight: 950 }}>
              {round(item.val ?? item.riskScore)}{unit}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AreaWatchPanel({ activeMetric, isMobile, rows, setActiveMetric }) {
  const activeConfig = areaMetricOptions.find((item) => item.id === activeMetric) || areaMetricOptions[0];
  const topRow = rows[0];

  return (
    <Panel style={{ marginBottom: 12, padding: isMobile ? 14 : 18 }}>
      <PanelHeader
        icon={MapPin}
        title="วิเคราะห์พื้นที่ที่ต้องจับตา"
        subtitle="เลือกมุมมองเพื่อดูจังหวัดเด่นตามความเสี่ยงรวม ฝน ฝุ่น ความร้อน หรือลม"
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {areaMetricOptions.map((option) => {
          const active = option.id === activeMetric;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setActiveMetric(option.id)}
              style={{
                background: active ? option.color : 'var(--bg-secondary)',
                border: `1px solid ${active ? option.color : 'var(--border-color)'}`,
                borderRadius: 999,
                color: active ? '#fff' : 'var(--text-main)',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 900,
                padding: '8px 12px',
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: isMobile ? '1fr' : 'minmax(260px, 0.75fr) minmax(0, 1.25fr)' }}>
        <div style={{ background: `${activeConfig.color}0f`, border: `1px solid ${activeConfig.color}28`, borderRadius: 16, padding: 16 }}>
          <div style={{ color: activeConfig.color, fontSize: '0.76rem', fontWeight: 950 }}>อันดับ 1 ตอนนี้</div>
          <div style={{ color: 'var(--text-main)', fontSize: '1.35rem', fontWeight: 950, lineHeight: 1.25, marginTop: 6 }}>
            {topRow?.name || 'รอข้อมูลสถานี'}
          </div>
          <div style={{ color: activeConfig.color, fontSize: '2rem', fontWeight: 950, lineHeight: 1, marginTop: 10 }}>
            {topRow ? round(topRow[activeConfig.key]) : '-'}{activeConfig.unit}
          </div>
          <div style={{ color: 'var(--text-sub)', fontSize: '0.76rem', fontWeight: 750, lineHeight: 1.55, marginTop: 10 }}>
            {topRow
              ? `ค่าประกอบ: ฝน ${topRow.rain}% · PM ${topRow.pm25} · รู้สึก ${topRow.feelsLike}° · ลม ${topRow.wind} กม./ชม.`
              : 'เมื่อ API สถานีพร้อม หน้านี้จะจัดอันดับพื้นที่ให้อัตโนมัติ'}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          {rows.slice(0, 7).map((row, index) => {
            const rawValue = round(row[activeConfig.key]);
            const width = activeMetric === 'risk' || activeMetric === 'rain'
              ? clamp(rawValue)
              : activeMetric === 'pm25'
                ? clamp((rawValue / 90) * 100)
                : activeMetric === 'heat'
                  ? clamp((rawValue / 45) * 100)
                  : clamp(rawValue * 5);
            return (
              <div key={`${activeMetric}-${row.id || row.name}`} style={{ display: 'grid', gap: 8, gridTemplateColumns: '28px minmax(0, 1fr) 56px', alignItems: 'center' }}>
                <div style={{ color: activeConfig.color, fontSize: '0.78rem', fontWeight: 950, textAlign: 'center' }}>{index + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
                    <span style={{ color: 'var(--text-sub)', fontSize: '0.68rem', fontWeight: 800 }}>{row.riskMeta?.label}</span>
                  </div>
                  <div style={{ background: 'rgba(148,163,184,0.16)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                    <div style={{ background: activeConfig.color, borderRadius: 999, height: '100%', width: `${width}%` }} />
                  </div>
                </div>
                <div style={{ color: activeConfig.color, fontSize: '0.82rem', fontWeight: 950, textAlign: 'right' }}>{rawValue}{activeConfig.unit}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

function SignalGrid({ items = [], isMobile }) {
  return (
    <section style={{ display: 'grid', gap: 12, gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))', marginBottom: 12 }}>
      {items.map((item) => (
        <Panel key={item.label} style={{ padding: 14 }}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ color: item.color, fontSize: '0.74rem', fontWeight: 950 }}>{item.label}</div>
            <div style={{ color: item.color, fontSize: '1.15rem', fontWeight: 950 }}>{item.value}</div>
          </div>
          <div style={{ color: 'var(--text-main)', fontSize: '0.84rem', fontWeight: 900, lineHeight: 1.4, marginTop: 8 }}>{item.title}</div>
          <div style={{ color: 'var(--text-sub)', fontSize: '0.72rem', fontWeight: 750, lineHeight: 1.45, marginTop: 4 }}>{item.detail}</div>
          <div style={{ background: 'rgba(148,163,184,0.16)', borderRadius: 999, height: 7, marginTop: 12, overflow: 'hidden' }}>
            <div style={{ background: item.color, borderRadius: 999, height: '100%', width: `${clamp(item.percent)}%` }} />
          </div>
        </Panel>
      ))}
    </section>
  );
}

function HourTile({ row }) {
  const rainColor = row.rain >= 60 ? '#2563eb' : row.rain >= 35 ? '#0ea5e9' : row.rain >= 15 ? '#f59e0b' : '#16a34a';
  return (
    <div
      style={{
        background: `${rainColor}0f`,
        border: `1px solid ${rainColor}24`,
        borderRadius: 14,
        minHeight: 82,
        padding: 10,
      }}
    >
      <div style={{ color: 'var(--text-main)', fontSize: '0.76rem', fontWeight: 950 }}>{row.time}</div>
      <div style={{ alignItems: 'baseline', color: rainColor, display: 'flex', gap: 3, marginTop: 5 }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 950 }}>{row.rain}</span>
        <span style={{ fontSize: '0.66rem', fontWeight: 900 }}>% ฝน</span>
      </div>
      <div style={{ color: 'var(--text-sub)', fontSize: '0.66rem', fontWeight: 750, lineHeight: 1.35, marginTop: 3 }}>
        {row.temp}°C · PM {row.pm25} · ลม {row.wind}
      </div>
    </div>
  );
}

function getGistdaStats(summary) {
  const labels = {
    burntArea: 'พื้นที่เผาไหม้',
    lowSoilMoisture: 'ดินแห้ง',
    lowVegetationMoisture: 'พืชแห้ง',
    flood: 'น้ำท่วม',
  };

  return Object.entries(summary || {})
    .filter(([, value]) => Array.isArray(value))
    .map(([key, rows]) => {
      const activeRows = rows.filter((row) => Number(row?.value) > 0);
      const total = activeRows.reduce((sum, row) => sum + (Number(row.value) || 0), 0);
      const top = [...activeRows].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))[0];
      return {
        key,
        label: labels[key] || key,
        count: activeRows.length,
        total: Math.round(total),
        topName: top?.province || '-',
        topValue: round(top?.value),
      };
    })
    .filter((item) => item.count > 0)
    .slice(0, 4);
}

const cleanProvinceName = (value = '') => String(value).replace(/^จังหวัด/, '').trim();
const metricAverage = (rows = [], key) => {
  const values = rows.map((row) => Number(row?.[key])).filter(Number.isFinite);
  return values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : 0;
};
const metricSum = (rows = [], key) => Math.round(rows.reduce((sum, row) => sum + (Number(row?.[key]) || 0), 0) * 10) / 10;
const latestSeriesValue = (series = [], offsetFromEnd = 0) => {
  const index = series.length - 1 - offsetFromEnd;
  const value = Number(series[index]);
  return Number.isFinite(value) ? value : null;
};

function buildHistoryAnalytics(historyWeather) {
  const rows = Object.values(historyWeather?.byProvince || {})
    .map((item) => ({
      ...item,
      name: cleanProvinceName(item.province || item.provinceKey),
      rain30d: Number(item.rain30d) || 0,
      rain90d: Number(item.rain90d) || 0,
      rainYtd: Number(item.rainYtd) || 0,
      wetDays30d: Number(item.wetDays30d) || 0,
      dryDays30d: Number(item.dryDays30d) || 0,
      maxDailyRain30d: Number(item.maxDailyRain30d) || 0,
      tempMax30d: Number(item.tempMax30d) || 0,
      tempMin30d: Number(item.tempMin30d) || 0,
      tempAvg30d: Number(item.tempAvg30d) || 0,
      heatMax30d: Number(item.heatMax30d) || 0,
      hotDays30d: Number(item.hotDays30d) || 0,
      heatRiskDays30d: Number(item.heatRiskDays30d) || 0,
      windMax30d: Number(item.windMax30d) || 0,
      windyDays30d: Number(item.windyDays30d) || 0,
    }))
    .filter((row) => row.name);

  const sortBy = (key, direction = 'desc') => [...rows]
    .filter((row) => Number.isFinite(Number(row[key])))
    .sort((a, b) => direction === 'asc' ? Number(a[key]) - Number(b[key]) : Number(b[key]) - Number(a[key]));

  const topRain = sortBy('rain30d')[0];
  const topHeat = sortBy('tempMax30d')[0];
  const topWind = sortBy('windMax30d')[0];
  const driest = sortBy('rain30d', 'asc')[0];
  const mostDryDays = sortBy('dryDays30d')[0];
  const heatRiskCount = rows.filter((row) => row.heatRiskDays30d >= 3).length;
  const heavyRainCount = rows.filter((row) => row.rain30d >= 180 || row.maxDailyRain30d >= 50).length;
  const windyAreaCount = rows.filter((row) => row.windMax30d >= 35 || row.windyDays30d >= 7).length;

  const dates = rows.find((row) => row.dates?.length)?.dates || [];
  const trendRows = dates.slice(-30).map((date, idx, arr) => {
    const offset = arr.length - 1 - idx;
    const rainValues = rows.map((row) => latestSeriesValue(row.rainDaily, offset)).filter(Number.isFinite);
    const tempValues = rows.map((row) => latestSeriesValue(row.tempMaxDaily, offset)).filter(Number.isFinite);
    const windValues = rows.map((row) => latestSeriesValue(row.windMaxDaily, offset)).filter(Number.isFinite);
    return {
      date: new Date(date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }),
      rain: rainValues.length ? Math.round((rainValues.reduce((sum, value) => sum + value, 0) / rainValues.length) * 10) / 10 : 0,
      temp: tempValues.length ? Math.round((tempValues.reduce((sum, value) => sum + value, 0) / tempValues.length) * 10) / 10 : 0,
      wind: windValues.length ? Math.round((windValues.reduce((sum, value) => sum + value, 0) / windValues.length) * 10) / 10 : 0,
    };
  });

  const insights = [
    topRain ? `ฝนสะสม 30 วันสูงสุดอยู่ที่ ${topRain.name} ${topRain.rain30d.toLocaleString('th-TH')} มม. และวันที่ฝนหนักสุดแตะ ${topRain.maxDailyRain30d} มม.` : 'ยังไม่มีข้อมูลฝนย้อนหลังเพียงพอ',
    driest ? `พื้นที่แห้งที่สุดจากฝนสะสม 30 วันคือ ${driest.name} ${driest.rain30d} มม. โดยมีวันแล้ง ${driest.dryDays30d} วัน` : 'ยังไม่มีข้อมูลพื้นที่แห้ง',
    topHeat ? `อุณหภูมิสูงสุดย้อนหลัง 30 วันเด่นที่ ${topHeat.name} ${topHeat.tempMax30d}°C และดัชนีร้อนสูงสุด ${topHeat.heatMax30d}°C` : 'ยังไม่มีข้อมูลอุณหภูมิย้อนหลัง',
    topWind ? `ลมแรงสุดย้อนหลัง 30 วันพบที่ ${topWind.name} ${topWind.windMax30d} กม./ชม. มีวันลมแรง ${topWind.windyDays30d} วัน` : 'ยังไม่มีข้อมูลลมย้อนหลัง',
  ];

  return {
    rows,
    trendRows,
    period: historyWeather?.period,
    source: historyWeather?.source || 'Open-Meteo Historical Weather API (ERA5)',
    updatedAt: historyWeather?.updatedAt,
    cacheStatus: historyWeather?.cacheStatus,
    warning: historyWeather?.warning,
    summary: {
      provinceCount: rows.length,
      avgRain30d: metricAverage(rows, 'rain30d'),
      totalRain30d: metricSum(rows, 'rain30d'),
      avgTempMax30d: metricAverage(rows, 'tempMax30d'),
      avgHeatMax30d: metricAverage(rows, 'heatMax30d'),
      avgWindMax30d: metricAverage(rows, 'windMax30d'),
      avgWetDays30d: metricAverage(rows, 'wetDays30d'),
      heatRiskCount,
      heavyRainCount,
      windyAreaCount,
    },
    rankings: {
      rain: sortBy('rain30d').slice(0, 8),
      dry: sortBy('dryDays30d').slice(0, 8),
      heat: sortBy('tempMax30d').slice(0, 8),
      cool: sortBy('tempMin30d', 'asc').slice(0, 8),
      wind: sortBy('windMax30d').slice(0, 8),
    },
    topRain,
    topHeat,
    topWind,
    driest,
    mostDryDays,
    insights,
  };
}

function HistoryRankTable({ title, rows = [], metricKey, unit, color }) {
  return (
    <Panel style={{ padding: 14 }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ color: 'var(--text-main)', fontSize: '0.83rem', fontWeight: 950 }}>{title}</div>
        <BarChart3 color={color} size={17} />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {rows.slice(0, 5).map((row, index) => (
          <div key={`${title}-${row.name}`} style={{ alignItems: 'center', display: 'grid', gap: 8, gridTemplateColumns: '26px 1fr auto' }}>
            <div style={{ alignItems: 'center', background: `${color}13`, borderRadius: 9, color, display: 'flex', fontSize: '0.7rem', fontWeight: 950, height: 26, justifyContent: 'center' }}>{index + 1}</div>
            <div style={{ color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 850, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</div>
            <div style={{ color, fontSize: '0.78rem', fontWeight: 950 }}>{Number(row[metricKey] || 0).toLocaleString('th-TH')}{unit}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function HistoryReportModal({ analytics, darkMode, onClose }) {
  const generatedAt = new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  const periodText = `${analytics.period?.startDate || '-'} ถึง ${analytics.period?.endDate || '-'}`;
  return (
    <div role="dialog" aria-modal="true" aria-label="รายงานสถิติย้อนหลังจริง" style={{ alignItems: 'center', background: 'rgba(2,6,23,0.72)', backdropFilter: 'blur(8px)', display: 'flex', inset: 0, justifyContent: 'center', padding: 20, position: 'fixed', zIndex: 12000 }} onClick={onClose}>
      <div className="stats-report-print custom-scrollbar" style={{ background: darkMode ? '#0f172a' : '#ffffff', border: `1px solid ${darkMode ? 'rgba(148,163,184,0.28)' : 'rgba(15,23,42,0.12)'}`, borderRadius: 24, boxShadow: '0 30px 90px rgba(0,0,0,0.42)', color: darkMode ? '#e5eefb' : '#0f172a', maxHeight: '92vh', maxWidth: 1100, overflowY: 'auto', width: '100%' }} onClick={(event) => event.stopPropagation()}>
        <div className="stats-report-actions" style={{ alignItems: 'center', borderBottom: `1px solid ${darkMode ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.1)'}`, display: 'flex', justifyContent: 'space-between', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 3, background: darkMode ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)' }}>
          <strong>รายงานสถิติย้อนหลังจริง</strong>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => window.print()} style={{ alignItems: 'center', background: '#2563eb', border: 0, borderRadius: 999, color: '#fff', cursor: 'pointer', display: 'flex', fontWeight: 900, gap: 7, padding: '9px 13px' }}><Printer size={15} /> พิมพ์ / PDF</button>
            <button onClick={onClose} style={{ background: darkMode ? '#111827' : '#fff', border: `1px solid ${darkMode ? 'rgba(148,163,184,0.3)' : 'rgba(15,23,42,0.14)'}`, borderRadius: 999, color: darkMode ? '#e5eefb' : '#0f172a', cursor: 'pointer', fontWeight: 950, height: 38, width: 38 }}>×</button>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ color: '#2563eb', fontSize: '0.78rem', fontWeight: 950 }}>Open-Meteo Historical Weather API (ERA5)</div>
          <h1 style={{ fontSize: '1.8rem', lineHeight: 1.2, margin: '6px 0 8px' }}>รายงานวิเคราะห์สถิติย้อนหลังจริง</h1>
          <div style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '0.82rem', fontWeight: 800 }}>ช่วงข้อมูล {periodText} · สร้างรายงาน {generatedAt} · {analytics.summary.provinceCount} จังหวัด</div>

          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginTop: 18 }}>
            {[
              ['ฝนเฉลี่ย 30 วัน', `${analytics.summary.avgRain30d} มม.`],
              ['อุณหภูมิสูงสุดเฉลี่ย', `${analytics.summary.avgTempMax30d}°C`],
              ['ลมแรงสุดเฉลี่ย', `${analytics.summary.avgWindMax30d} กม./ชม.`],
              ['พื้นที่ฝนหนัก', `${analytics.summary.heavyRainCount} จังหวัด`],
            ].map(([label, value]) => (
              <div key={label} style={{ background: darkMode ? '#111827' : '#f8fafc', border: `1px solid ${darkMode ? 'rgba(148,163,184,0.22)' : 'rgba(15,23,42,0.08)'}`, borderRadius: 16, padding: 14 }}>
                <div style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '0.72rem', fontWeight: 900 }}>{label}</div>
                <div style={{ color: '#2563eb', fontSize: '1.45rem', fontWeight: 950, marginTop: 5 }}>{value}</div>
              </div>
            ))}
          </div>

          <section style={{ marginTop: 18 }}>
            <h2 style={{ fontSize: '1.05rem', margin: '0 0 10px' }}>ข้อสรุปวิเคราะห์</h2>
            <div style={{ display: 'grid', gap: 9 }}>
              {analytics.insights.map((insight) => (
                <div key={insight} style={{ background: darkMode ? '#111827' : '#f8fafc', borderLeft: '4px solid #2563eb', borderRadius: 12, fontSize: '0.86rem', fontWeight: 800, lineHeight: 1.55, padding: '10px 12px' }}>{insight}</div>
              ))}
            </div>
          </section>

          <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 18 }}>
            {[
              ['ฝนสะสม 30 วันสูงสุด', analytics.rankings.rain, 'rain30d', ' มม.'],
              ['พื้นที่แห้งต่อเนื่อง', analytics.rankings.dry, 'dryDays30d', ' วัน'],
              ['อุณหภูมิสูงสุดย้อนหลัง', analytics.rankings.heat, 'tempMax30d', '°C'],
              ['ลมแรงสุดย้อนหลัง', analytics.rankings.wind, 'windMax30d', ' กม./ชม.'],
            ].map(([title, rows, key, unit]) => (
              <div key={title} style={{ background: darkMode ? '#111827' : '#f8fafc', border: `1px solid ${darkMode ? 'rgba(148,163,184,0.22)' : 'rgba(15,23,42,0.08)'}`, borderRadius: 16, padding: 14 }}>
                <h3 style={{ fontSize: '0.92rem', margin: '0 0 10px' }}>{title}</h3>
                {rows.slice(0, 6).map((row, index) => (
                  <div key={`${title}-${row.name}`} style={{ alignItems: 'center', borderTop: index ? `1px solid ${darkMode ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)'}` : 'none', display: 'flex', justifyContent: 'space-between', padding: '7px 0' }}>
                    <span>{index + 1}. {row.name}</span>
                    <strong style={{ color: '#2563eb' }}>{Number(row[key] || 0).toLocaleString('th-TH')}{unit}</strong>
                  </div>
                ))}
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AIPage() {
  const [activeMetric, setActiveMetric] = useState('risk');
  const [historyWeather, setHistoryWeather] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [showHistoryReport, setShowHistoryReport] = useState(false);
  const {
    isMobile,
    weatherData,
    loadingWeather,
    windAnalysis,
    windLoading,
    windError,
    windLastFetch,
    fetchWindAnalysis,
    gistdaSummary,
    lastUpdated,
    tmdAvailable,
    darkMode,
    stationRows,
    rankings,
    national,
  } = useAIPageData();

  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError('');
    fetch('/api/weather-history', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`History API ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setHistoryWeather(data);
      })
      .catch((error) => {
        if (!cancelled) setHistoryError(error.message || 'โหลดข้อมูลย้อนหลังจริงไม่สำเร็จ');
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const areaRankingRows = useMemo(() => {
    const config = areaMetricOptions.find((item) => item.id === activeMetric) || areaMetricOptions[0];
    return [...(stationRows || [])]
      .filter((row) => Number.isFinite(Number(row?.[config.key])))
      .sort((a, b) => (
        config.direction === 'asc'
          ? (Number(a[config.key]) || 0) - (Number(b[config.key]) || 0)
          : (Number(b[config.key]) || 0) - (Number(a[config.key]) || 0)
      ))
      .slice(0, 10);
  }, [activeMetric, stationRows]);

  const dashboardData = useMemo(() => {
    if (!weatherData) return null;

    const { current, hourly, daily } = weatherData;
    const startIdx = startIndexFromNow(hourly?.time);
    const rainProb = round(daily?.precipitation_probability_max?.[0] ?? current?.rainProb);
    const pm25 = round(current?.pm25);
    const temp = round(current?.temp);
    const feelsLike = round(current?.feelsLike ?? current?.temp);
    const uv = round(current?.uv);
    const humidity = round(current?.humidity);
    const wind = round(current?.windSpeed);
    const riskScore = round(
      clamp((feelsLike - 32) * 5.5, 0, 42) +
      clamp(pm25 * 0.72, 0, 38) +
      clamp(rainProb * 0.22, 0, 16) +
      clamp((wind - 12) * 0.9, 0, 10)
    );

    const trendRows = (hourly?.time || [])
      .slice(startIdx, startIdx + 24)
      .filter((_, index) => index % 2 === 0)
      .map((time, index) => {
        const rowIndex = startIdx + index * 2;
        return {
          time: thaiTime(time),
          temp: round(hourly?.temperature_2m?.[rowIndex] ?? current?.temp),
          feels: round(hourly?.apparent_temperature?.[rowIndex] ?? current?.feelsLike),
          rain: round(hourly?.precipitation_probability?.[rowIndex] ?? rainProb),
          pm25: round(hourly?.pm25?.[rowIndex] ?? pm25),
          wind: round(hourly?.wind_speed_10m?.[rowIndex] ?? wind),
          humidity: round(hourly?.relative_humidity_2m?.[rowIndex] ?? humidity),
        };
      });

    const dailyRows = (daily?.time || []).slice(0, 7).map((time, index) => ({
      day: new Date(time).toLocaleDateString('th-TH', { weekday: 'short' }),
      max: round(daily?.temperature_2m_max?.[index]),
      min: round(daily?.temperature_2m_min?.[index]),
      rain: round(daily?.precipitation_probability_max?.[index]),
      uv: round(daily?.uv_index_max?.[index]),
    }));

    return {
      dailyRows,
      feelsLike,
      heat: heatMeta(feelsLike),
      humidity,
      pm25,
      pm: pmMeta(pm25),
      rainProb,
      risk: riskMeta(riskScore),
      riskScore,
      startIdx,
      stationRiskRows: [...(stationRows || [])].sort((a, b) => b.riskScore - a.riskScore).slice(0, 10),
      temp,
      trendRows,
      uv,
      uvStatus: getUvStatus(uv),
      wind,
    };
  }, [stationRows, weatherData]);

  const gistdaStats = useMemo(() => getGistdaStats(gistdaSummary), [gistdaSummary]);
  const historyAnalytics = useMemo(() => buildHistoryAnalytics(historyWeather), [historyWeather]);

  if (loadingWeather || !weatherData || !dashboardData) {
    return (
      <div className="loading-container" style={{ color: 'var(--text-main)' }}>
        <div className="loading-spinner" />
        <div>กำลังจัดชุดสถิติอากาศ...</div>
        <div>รวบรวมข้อมูลฝน ฝุ่น ความร้อน ลม และพื้นที่เสี่ยงให้พร้อมใช้งาน</div>
      </div>
    );
  }

  const {
    dailyRows,
    feelsLike,
    heat,
    humidity,
    pm25,
    pm,
    rainProb,
    risk,
    riskScore,
    stationRiskRows,
    temp,
    trendRows,
    uv,
    uvStatus,
    wind,
  } = dashboardData;

  const updatedText = lastUpdated
    ? new Date(lastUpdated).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  const windText = windLastFetch
    ? windLastFetch.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    : 'รอข้อมูล';
  const grid4 = isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))';
  const grid2 = isMobile ? '1fr' : 'minmax(0, 1.35fr) minmax(320px, 0.65fr)';
  const radarData = [
    { metric: 'ร้อน', value: clamp((feelsLike - 28) * 8) },
    { metric: 'ฝุ่น', value: clamp(pm25 * 1.2) },
    { metric: 'ฝน', value: clamp(rainProb) },
    { metric: 'ลม', value: clamp(wind * 5) },
    { metric: 'UV', value: clamp(uv * 10) },
  ];
  const regionRows = (windAnalysis?.regions || []).slice(0, 6);
  const insightSignals = [
    {
      label: 'พื้นที่เสี่ยง',
      value: `${areaRankingRows[0]?.name || '-'}`,
      title: areaRankingRows[0] ? `${areaRankingRows[0].riskScore}/100 ${areaRankingRows[0].riskMeta?.label}` : 'รอข้อมูลจังหวัด',
      detail: 'จัดอันดับจากร้อน ฝุ่น ฝน และลม เพื่อหาพื้นที่ที่ควรดูต่อก่อน',
      color: risk.color,
      percent: areaRankingRows[0]?.riskScore || 0,
    },
    {
      label: 'ฝนระยะใกล้',
      value: `${rainProb}%`,
      title: rainProb >= 55 ? 'มีแนวโน้มฝนชัดเจน' : rainProb >= 25 ? 'อาจมีฝนบางช่วง' : 'ฝนยังไม่เด่น',
      detail: windAnalysis?.quickSummary || 'ใช้พยากรณ์รายชั่วโมงและข้อมูลลมประกอบ',
      color: rainProb >= 55 ? '#2563eb' : rainProb >= 25 ? '#0ea5e9' : '#16a34a',
      percent: rainProb,
    },
    {
      label: 'คุณภาพอากาศ',
      value: `${pm25}`,
      title: pm.label,
      detail: `ค่าเฉลี่ยประเทศ ${national?.pm25 || pm25} และดูอันดับจังหวัดฝุ่นสูงได้ทันที`,
      color: pm.color,
      percent: clamp((pm25 / 75) * 100),
    },
    {
      label: 'ความร้อน',
      value: `${feelsLike}°`,
      title: heat.label,
      detail: `UV ${uv} · ความชื้น ${humidity}% · ลม ${wind} กม./ชม.`,
      color: heat.color,
      percent: clamp((feelsLike / 45) * 100),
    },
  ];

  return (
    <main
      className="hide-scrollbar fade-in"
      style={{
        background: 'linear-gradient(180deg, rgba(224,242,254,0.75) 0%, var(--bg-app) 34%, var(--bg-app) 100%)',
        color: 'var(--text-main)',
        fontFamily: 'Sarabun, sans-serif',
        minHeight: '100%',
      }}
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .stats-report-print, .stats-report-print * { visibility: visible !important; }
          .stats-report-print {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            left: 0 !important;
            max-height: none !important;
            max-width: none !important;
            overflow: visible !important;
            position: absolute !important;
            top: 0 !important;
            width: 100% !important;
          }
          .stats-report-actions { display: none !important; }
          @page { size: A4 landscape; margin: 10mm; }
        }
      `}</style>
      <div style={{ margin: '0 auto', maxWidth: isMobile ? 960 : 1380, padding: isMobile ? '14px' : '22px' }}>
        <header
          style={{
            alignItems: isMobile ? 'flex-start' : 'center',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 14,
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ alignItems: 'center', color: '#0369a1', display: 'flex', fontSize: '0.74rem', fontWeight: 950, gap: 7, marginBottom: 6 }}>
              <Sparkles size={16} /> วิเคราะห์พื้นที่และสถิติอากาศ
            </div>
            <h1 style={{ color: 'var(--text-main)', fontSize: isMobile ? '1.55rem' : '2.05rem', fontWeight: 950, letterSpacing: 0, lineHeight: 1.15, margin: 0 }}>
              พื้นที่ไหนน่าห่วงตอนนี้
            </h1>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.84rem', fontWeight: 700, lineHeight: 1.45, margin: '7px 0 0', maxWidth: 760 }}>
              รวมอันดับจังหวัด แนวโน้มฝน ฝุ่น ความร้อน ลม และข้อมูลดาวเทียมในหน้าเดียว เพื่อให้เห็นพื้นที่ที่ควรจับตาก่อน
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
            {[
              ['อัปเดต', updatedText, '#0284c7'],
              ['สถานี', `${national?.stationCount || 0} จุด`, '#16a34a'],
              ['TMD', tmdAvailable ? 'พร้อมใช้' : 'สำรอง', tmdAvailable ? '#16a34a' : '#f59e0b'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ background: `${color}10`, border: `1px solid ${color}24`, borderRadius: 999, color, fontSize: '0.72rem', fontWeight: 900, padding: '8px 11px' }}>
                <span style={{ opacity: 0.75 }}>{label}</span> · {value}
              </div>
            ))}
          </div>
        </header>

        <SignalGrid items={insightSignals} isMobile={isMobile} />

        <section style={{ marginBottom: 12 }}>
          <PanelHeader
            icon={Database}
            title="สถิติย้อนหลังจริงและการวิเคราะห์"
            subtitle={
              historyLoading
                ? 'กำลังโหลดข้อมูลย้อนหลังจริงจาก Open-Meteo Archive'
                : historyError
                  ? `โหลดข้อมูลย้อนหลังจริงไม่สำเร็จ: ${historyError}`
                  : `ค่าจริงจาก ${historyAnalytics.period?.startDate || '-'} ถึง ${historyAnalytics.period?.endDate || '-'} · ${historyAnalytics.summary.provinceCount} จังหวัด`
            }
            action={
              <button
                type="button"
                onClick={() => setShowHistoryReport(true)}
                disabled={!historyAnalytics.rows.length}
                title="เปิดรายงานสถิติย้อนหลังจริง"
                style={{
                  alignItems: 'center',
                  background: historyAnalytics.rows.length ? '#2563eb' : 'var(--bg-secondary)',
                  border: `1px solid ${historyAnalytics.rows.length ? '#2563eb' : 'var(--border-color)'}`,
                  borderRadius: 999,
                  color: historyAnalytics.rows.length ? '#fff' : 'var(--text-sub)',
                  cursor: historyAnalytics.rows.length ? 'pointer' : 'default',
                  display: 'flex',
                  fontSize: '0.76rem',
                  fontWeight: 900,
                  gap: 7,
                  padding: '9px 13px',
                }}
              >
                <FileText size={15} /> รายงาน
              </button>
            }
          />

          {historyLoading ? (
            <div style={{ alignItems: 'center', color: 'var(--text-sub)', display: 'flex', fontSize: '0.85rem', fontWeight: 800, gap: 10, minHeight: 160 }}>
              <div className="loading-spinner" style={{ height: 24, width: 24 }} />
              กำลังรวบรวมฝน อุณหภูมิ และลมย้อนหลังจริง
            </div>
          ) : historyAnalytics.rows.length ? (
            <>
              <section style={{ display: 'grid', gap: 12, gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))', marginBottom: 12 }}>
                <StatCard icon={CloudRain} label="ฝนเฉลี่ย 30 วัน" value={historyAnalytics.summary.avgRain30d} unit="มม." note={`${historyAnalytics.summary.heavyRainCount} จังหวัดฝนสะสม/ฝนหนักเด่น`} color="#2563eb" compact percent={clamp((historyAnalytics.summary.avgRain30d / 250) * 100)} />
                <StatCard icon={ThermometerSun} label="ร้อนสุดเฉลี่ย 30 วัน" value={historyAnalytics.summary.avgTempMax30d} unit="°C" note={`${historyAnalytics.summary.heatRiskCount} จังหวัดมีวันดัชนีร้อนสูง`} color="#ef4444" compact percent={clamp((historyAnalytics.summary.avgTempMax30d / 42) * 100)} />
                <StatCard icon={Wind} label="ลมแรงสุดเฉลี่ย" value={historyAnalytics.summary.avgWindMax30d} unit="กม./ชม." note={`${historyAnalytics.summary.windyAreaCount} จังหวัดลมแรงเด่น`} color="#0f766e" compact percent={clamp((historyAnalytics.summary.avgWindMax30d / 55) * 100)} />
                <StatCard icon={Droplets} label="วันที่มีฝนเฉลี่ย" value={historyAnalytics.summary.avgWetDays30d} unit="วัน" note="จำนวนวันที่ฝนอย่างน้อย 1 มม. ในรอบ 30 วัน" color="#14b8a6" compact percent={clamp((historyAnalytics.summary.avgWetDays30d / 30) * 100)} />
              </section>

              <section style={{ display: 'grid', gap: 12, gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.35fr) minmax(320px, 0.65fr)', marginBottom: 12 }}>
                <Panel style={{ background: 'var(--bg-secondary)', boxShadow: 'none', minHeight: 340 }}>
                  <PanelHeader icon={BarChart3} title="แนวโน้มย้อนหลังจริง 30 วัน" subtitle="ค่าเฉลี่ยประเทศของฝนรายวัน อุณหภูมิสูงสุด และลมแรงสุดจาก archive" />
                  <div style={{ height: 270 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historyAnalytics.trendRows} margin={{ bottom: 0, left: -18, right: 12, top: 12 }}>
                        <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={chartText} tickLine={false} axisLine={false} minTickGap={18} />
                        <YAxis tick={chartText} tickLine={false} axisLine={false} />
                        <Tooltip content={<TooltipBox />} />
                        <Line dataKey="rain" name="ฝนเฉลี่ย มม." type="monotone" stroke="#2563eb" strokeWidth={3} dot={false} />
                        <Line dataKey="temp" name="อุณหภูมิสูงสุด °C" type="monotone" stroke="#ef4444" strokeWidth={3} dot={false} />
                        <Line dataKey="wind" name="ลมแรงสุด กม./ชม." type="monotone" stroke="#0f766e" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>

                <Panel style={{ background: 'var(--bg-secondary)', boxShadow: 'none' }}>
                  <PanelHeader icon={Sparkles} title="ข้อสรุปเชิงวิเคราะห์" subtitle="อ่านเร็วจากข้อมูลย้อนหลังจริง ไม่ใช่ค่าพยากรณ์" />
                  <div style={{ display: 'grid', gap: 9 }}>
                    {historyAnalytics.insights.map((insight) => (
                      <div key={insight} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '4px solid #2563eb', borderRadius: 12, color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 800, lineHeight: 1.55, padding: '10px 12px' }}>
                        {insight}
                      </div>
                    ))}
                  </div>
                  {historyAnalytics.warning && (
                    <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, color: '#b45309', fontSize: '0.72rem', fontWeight: 850, lineHeight: 1.45, marginTop: 10, padding: 10 }}>
                      ใช้ cache เก่า: {historyAnalytics.warning}
                    </div>
                  )}
                </Panel>
              </section>

              <section style={{ display: 'grid', gap: 12, gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))' }}>
                <HistoryRankTable title="ฝนสะสมสูงสุด" rows={historyAnalytics.rankings.rain} metricKey="rain30d" unit=" มม." color="#2563eb" />
                <HistoryRankTable title="แห้งต่อเนื่อง" rows={historyAnalytics.rankings.dry} metricKey="dryDays30d" unit=" วัน" color="#f59e0b" />
                <HistoryRankTable title="ร้อนสุดย้อนหลัง" rows={historyAnalytics.rankings.heat} metricKey="tempMax30d" unit="°C" color="#ef4444" />
                <HistoryRankTable title="ลมแรงสุด" rows={historyAnalytics.rankings.wind} metricKey="windMax30d" unit=" กม./ชม." color="#0f766e" />
              </section>
            </>
          ) : (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.24)', borderRadius: 16, color: '#b45309', fontSize: '0.84rem', fontWeight: 850, lineHeight: 1.55, padding: 16 }}>
              ยังไม่มีข้อมูลย้อนหลังจริงสำหรับวิเคราะห์ หาก API archive พร้อมใช้งาน ระบบจะแสดงผลอัตโนมัติ
            </div>
          )}
        </section>

        <section style={{ display: 'grid', gap: 12, gridTemplateColumns: grid4, marginBottom: 12 }}>
          <StatCard icon={ThermometerSun} label="ความร้อนรู้สึกจริง" value={feelsLike} unit="°C" note={heat.label} color={heat.color} percent={clamp((feelsLike / 45) * 100)} />
          <StatCard icon={CloudRain} label="โอกาสฝนสูงสุดวันนี้" value={rainProb} unit="%" note={rainProb >= 55 ? 'มีโอกาสฝนชัดเจน' : rainProb >= 25 ? 'อาจมีฝนบางช่วง' : 'ฝนต่ำ'} color={rainProb >= 55 ? '#2563eb' : rainProb >= 25 ? '#0ea5e9' : '#16a34a'} percent={rainProb} />
          <StatCard icon={Activity} label="PM2.5 ปัจจุบัน" value={pm25} unit="µg/m³" note={pm.label} color={pm.color} percent={clamp((pm25 / 75) * 100)} />
          <StatCard icon={Gauge} label="ดัชนีเสี่ยงรวม" value={riskScore} unit="/100" note={risk.label} color={risk.color} percent={riskScore} />
        </section>

        <section style={{ display: 'grid', gap: 12, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', marginBottom: 12 }}>
          <StatCard icon={Wind} label="ลมเฉลี่ยตำแหน่งนี้" value={wind} unit="กม./ชม." note={`ทั่วประเทศเฉลี่ย ${national?.wind || 0} กม./ชม.`} color="#0f766e" compact percent={clamp(wind * 5)} />
          <StatCard icon={Droplets} label="ความชื้น" value={humidity} unit="%" note={`ทั่วประเทศเฉลี่ย ${national?.humidity || 0}%`} color="#0891b2" compact percent={humidity} />
          <StatCard icon={AlertTriangle} label="UV สูงสุด" value={uv} unit="" note={uvStatus.text} color={uvStatus.color} compact percent={clamp(uv * 10)} />
        </section>

        <AreaWatchPanel activeMetric={activeMetric} isMobile={isMobile} rows={areaRankingRows} setActiveMetric={setActiveMetric} />

        <section style={{ display: 'grid', gap: 12, gridTemplateColumns: grid2, marginBottom: 12 }}>
          <Panel style={{ minHeight: 360 }}>
            <PanelHeader icon={Activity} title="แนวโน้ม 24 ชั่วโมง" subtitle="เส้นอุณหภูมิ ฝุ่น และโอกาสฝนแบบอ่านเร็วตามช่วงเวลา" />
            <div style={{ height: isMobile ? 310 : 285 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendRows} margin={{ bottom: 0, left: -18, right: 12, top: 12 }}>
                  <defs>
                    <linearGradient id="rainFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.26} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" tick={chartText} tickLine={false} axisLine={false} minTickGap={14} />
                  <YAxis tick={chartText} tickLine={false} axisLine={false} />
                  <Tooltip content={<TooltipBox />} />
                  <Area dataKey="rain" name="ฝน %" type="monotone" fill="url(#rainFill)" stroke="#2563eb" strokeWidth={3} />
                  <Line dataKey="temp" name="อุณหภูมิ °C" type="monotone" stroke="#ef4444" strokeWidth={3} dot={false} />
                  <Line dataKey="pm25" name="PM2.5" type="monotone" stroke="#f97316" strokeWidth={3} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel style={{ minHeight: 360 }}>
            <PanelHeader icon={Gauge} title="ดัชนีวันนี้" subtitle="น้ำหนักความเสี่ยงจากร้อน ฝุ่น ฝน ลม และ UV" />
            <div style={{ alignItems: 'center', display: 'grid', gap: 8, justifyItems: 'center' }}>
              <div style={{ height: 230, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="70%">
                    <PolarGrid stroke="var(--border-color)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-main)', fontSize: 11, fontWeight: 900 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="value" fill={risk.color} fillOpacity={0.24} stroke={risk.color} strokeWidth={3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: risk.bg, border: `1px solid ${risk.border}`, borderRadius: 16, color: risk.color, padding: '12px 14px', textAlign: 'center', width: '100%' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 950, lineHeight: 1 }}>{riskScore}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 950 }}>{risk.label}</div>
              </div>
            </div>
          </Panel>
        </section>

        <section style={{ display: 'grid', gap: 12, gridTemplateColumns: grid2, marginBottom: 12 }}>
          <Panel>
            <PanelHeader icon={MapPin} title="จังหวัดที่ต้องจับตา" subtitle="เรียงตามดัชนีเสี่ยงรวมจากร้อน ฝุ่น ฝน และลม" />
            <div style={{ height: 330 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={stationRiskRows} layout="vertical" margin={{ bottom: 0, left: 8, right: 18, top: 6 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border-color)" strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tick={chartText} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" width={86} tick={chartText} tickLine={false} axisLine={false} />
                  <Tooltip content={<TooltipBox />} />
                  <Bar dataKey="riskScore" name="คะแนนเสี่ยง" radius={[0, 10, 10, 0]}>
                    {stationRiskRows.map((row) => (
                      <Cell key={row.id || row.name} fill={row.riskMeta?.color || '#2563eb'} />
                    ))}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel>
            <PanelHeader icon={Database} title="ภาพรวมประเทศ" subtitle="ค่าเฉลี่ยจากสถานีที่มีข้อมูลล่าสุด" />
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                ['อุณหภูมิ', `${national?.temp || temp}°C`, '#ef4444', clamp(((national?.temp || temp) / 42) * 100)],
                ['รู้สึกเหมือน', `${national?.feelsLike || feelsLike}°C`, '#f97316', clamp(((national?.feelsLike || feelsLike) / 45) * 100)],
                ['PM2.5', `${national?.pm25 || pm25}`, '#f59e0b', clamp(((national?.pm25 || pm25) / 75) * 100)],
                ['ฝน', `${national?.rain || rainProb}%`, '#2563eb', national?.rain || rainProb],
                ['ความชื้น', `${national?.humidity || humidity}%`, '#0891b2', national?.humidity || humidity],
              ].map(([label, value, color, percent]) => (
                <div key={label}>
                  <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-sub)', fontSize: '0.74rem', fontWeight: 850 }}>{label}</span>
                    <span style={{ color, fontSize: '0.82rem', fontWeight: 950 }}>{value}</span>
                  </div>
                  <div style={{ background: 'rgba(148,163,184,0.16)', borderRadius: 999, height: 9, overflow: 'hidden' }}>
                    <div style={{ background: color, borderRadius: 999, height: '100%', width: `${clamp(percent)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section style={{ display: 'grid', gap: 12, gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))', marginBottom: 12 }}>
          <RankList title="ร้อนสุด" items={rankings?.heat || []} unit="°" color="#ef4444" />
          <RankList title="ฝุ่นสูงสุด" items={rankings?.pm25 || []} unit="" color="#f97316" />
          <RankList title="ฝนสูงสุด" items={rankings?.rain || []} unit="%" color="#2563eb" />
          <RankList title="อากาศเย็นสุด" items={rankings?.cool || []} unit="°" color="#0891b2" />
        </section>

        <section style={{ display: 'grid', gap: 12, gridTemplateColumns: grid2, marginBottom: 12 }}>
          <Panel>
            <PanelHeader icon={CloudRain} title="พยากรณ์ 7 วัน" subtitle="ดูอุณหภูมิสูงสุด ต่ำสุด โอกาสฝน และ UV ในกราฟเดียว" />
            <div style={{ height: 310 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyRows} margin={{ bottom: 0, left: -18, right: 12, top: 12 }}>
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={chartText} tickLine={false} axisLine={false} />
                  <YAxis tick={chartText} tickLine={false} axisLine={false} />
                  <Tooltip content={<TooltipBox />} />
                  <Line dataKey="max" name="สูงสุด °C" type="monotone" stroke="#ef4444" strokeWidth={3} />
                  <Line dataKey="min" name="ต่ำสุด °C" type="monotone" stroke="#0ea5e9" strokeWidth={3} />
                  <Line dataKey="rain" name="ฝน %" type="monotone" stroke="#2563eb" strokeWidth={3} />
                  <Line dataKey="uv" name="UV" type="monotone" stroke="#f59e0b" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              icon={Wind}
              title="ฝนจากเรดาร์/ลม"
              subtitle={`อัปเดตลมล่าสุด ${windText}`}
              action={
                <button
                  onClick={fetchWindAnalysis}
                  disabled={windLoading}
                  title="รีเฟรชข้อมูลลม"
                  style={{
                    alignItems: 'center',
                    background: windLoading ? 'var(--bg-secondary)' : '#0284c7',
                    border: 'none',
                    borderRadius: 12,
                    color: windLoading ? 'var(--text-sub)' : '#fff',
                    cursor: windLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    height: 36,
                    justifyContent: 'center',
                    width: 36,
                  }}
                >
                  <RefreshCw size={16} style={{ animation: windLoading ? 'spin 1s linear infinite' : 'none' }} />
                </button>
              }
            />
            {windError ? (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 14, color: '#dc2626', fontSize: '0.75rem', fontWeight: 800, lineHeight: 1.5, padding: 12 }}>
                โหลดข้อมูลลมไม่สำเร็จ: {windError}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.18)', borderRadius: 16, padding: 14 }}>
                  <div style={{ color: '#1d4ed8', fontSize: '1.9rem', fontWeight: 950, lineHeight: 1 }}>
                    {windAnalysis?.nationalRainChance ?? rainProb}%
                  </div>
                  <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 950, marginTop: 5 }}>
                    {windAnalysis?.quickSummary || (rainProb >= 55 ? 'มีฝนในพื้นที่เสี่ยงหลายจุด' : 'โอกาสฝนยังไม่สูงมาก')}
                  </div>
                  {windAnalysis?.rainFormingDesc && (
                    <div style={{ color: 'var(--text-sub)', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.45, marginTop: 4 }}>
                      {windAnalysis.rainFormingDesc}
                    </div>
                  )}
                </div>
                {regionRows.map((region) => {
                  const pct = clamp(region.rainChance);
                  const color = pct >= 60 ? '#2563eb' : pct >= 35 ? '#0ea5e9' : '#16a34a';
                  return (
                    <div key={region.name}>
                      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-sub)', fontSize: '0.72rem', fontWeight: 850 }}>{region.name}</span>
                        <span style={{ color, fontSize: '0.76rem', fontWeight: 950 }}>{pct}%</span>
                      </div>
                      <div style={{ background: 'rgba(148,163,184,0.16)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                        <div style={{ background: color, borderRadius: 999, height: '100%', width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </section>

        <Panel style={{ marginBottom: 12 }}>
          <PanelHeader icon={CloudRain} title="ไทม์ไลน์รายชั่วโมง" subtitle="ช่องสีช่วยแยกชั่วโมงที่ฝนมีแนวโน้มสูง อ่านได้เร็วบนมือถือ" />
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(6, minmax(0, 1fr))' }}>
            {trendRows.slice(0, 12).map((row) => <HourTile key={row.time} row={row} />)}
          </div>
        </Panel>

        {gistdaStats.length > 0 && (
          <Panel style={{ marginBottom: 12 }}>
            <PanelHeader icon={Database} title="ข้อมูลดาวเทียม GISTDA" subtitle="สรุปพื้นที่เสี่ยงที่พบค่ามากกว่า 0 เพื่อประกอบการตัดสินใจรายจังหวัด" />
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))' }}>
              {gistdaStats.map((item, index) => {
                const colors = ['#ef4444', '#f97316', '#16a34a', '#2563eb'];
                const color = colors[index % colors.length];
                return (
                  <div key={item.key} style={{ background: `${color}0d`, border: `1px solid ${color}22`, borderRadius: 16, padding: 14 }}>
                    <div style={{ color: 'var(--text-sub)', fontSize: '0.72rem', fontWeight: 900 }}>{item.label}</div>
                    <div style={{ color, fontSize: '1.75rem', fontWeight: 950, lineHeight: 1, marginTop: 7 }}>{item.count}</div>
                    <div style={{ color: 'var(--text-main)', fontSize: '0.76rem', fontWeight: 900, lineHeight: 1.4, marginTop: 7 }}>
                      สูงสุด: {item.topName} ({item.topValue})
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}

        <footer style={{ alignItems: 'center', color: 'var(--text-sub)', display: 'flex', fontSize: '0.74rem', fontWeight: 750, gap: 7, justifyContent: 'center', lineHeight: 1.45, marginTop: 16, textAlign: 'center' }}>
          <MapPin size={14} color="#2563eb" />
          วิเคราะห์จากตำแหน่งปัจจุบันหรือกรุงเทพมหานครเมื่อไม่สามารถเข้าถึง GPS
        </footer>
      </div>

      {showHistoryReport && historyAnalytics.rows.length > 0 && (
        <HistoryReportModal analytics={historyAnalytics} darkMode={darkMode} onClose={() => setShowHistoryReport(false)} />
      )}
    </main>
  );
}
