import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CloudRain,
  Database,
  Gauge,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ThermometerSun,
  Wind,
} from 'lucide-react';
import DataStatusBar from '../components/DataStatusBar';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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

const metricOptions = [
  { id: 'risk', label: 'ความเสี่ยงรวม', key: 'riskScore', color: '#7c3aed', unit: '' },
  { id: 'rain', label: 'ฝน', key: 'rain', color: '#2563eb', unit: '%' },
  { id: 'pm25', label: 'PM2.5', key: 'pm25', color: '#f97316', unit: '' },
  { id: 'heat', label: 'ความร้อน', key: 'feelsLike', color: '#ef4444', unit: '°' },
  { id: 'wind', label: 'ลม', key: 'wind', color: '#0f766e', unit: '' },
];

function GlassPanel({ children, style }) {
  return (
    <section
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 16,
        boxShadow: '0 10px 26px rgba(2,6,23,0.07)',
        minWidth: 0,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function SectionTitle({ icon, title, subtitle, action }) {
  return (
    <div style={{ alignItems: 'flex-start', display: 'flex', gap: 12, justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ alignItems: 'flex-start', display: 'flex', gap: 10, minWidth: 0 }}>
        <div style={{ alignItems: 'center', background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.22)', borderRadius: 12, color: '#0284c7', display: 'flex', height: 38, justifyContent: 'center', width: 38 }}>
          {React.createElement(icon, { size: 19 })}
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 950, lineHeight: 1.25, margin: 0 }}>{title}</h2>
          {subtitle && <p style={{ color: 'var(--text-sub)', fontSize: '0.76rem', fontWeight: 700, lineHeight: 1.45, margin: '4px 0 0' }}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function TooltipBox({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, boxShadow: '0 12px 30px rgba(2,6,23,0.14)', color: 'var(--text-main)', padding: '10px 12px' }}>
      <div style={{ fontSize: '0.74rem', fontWeight: 950, marginBottom: 6 }}>{label}</div>
      {payload.map((item) => (
        <div key={`${item.dataKey}-${item.name}`} style={{ alignItems: 'center', display: 'flex', gap: 7, fontSize: '0.72rem', fontWeight: 850, marginTop: 4 }}>
          <span style={{ background: item.color, borderRadius: 999, height: 8, width: 8 }} />
          <span style={{ color: 'var(--text-sub)' }}>{item.name}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function MetricTile({ color, icon, label, note, percent, unit, value }) {
  return (
    <GlassPanel style={{ minHeight: 132, padding: 16 }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ color: 'var(--text-sub)', fontSize: '0.74rem', fontWeight: 900 }}>{label}</div>
        <div style={{ alignItems: 'center', background: `${color}14`, border: `1px solid ${color}28`, borderRadius: 12, color, display: 'flex', height: 36, justifyContent: 'center', width: 36 }}>
          {React.createElement(icon, { size: 18 })}
        </div>
      </div>
      <div style={{ alignItems: 'baseline', color, display: 'flex', gap: 4, marginTop: 10 }}>
        <span style={{ fontSize: '2rem', fontWeight: 950, lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: '0.82rem', fontWeight: 900 }}>{unit}</span>}
      </div>
      <div style={{ color: 'var(--text-sub)', fontSize: '0.72rem', fontWeight: 750, lineHeight: 1.4, marginTop: 6 }}>{note}</div>
      <div style={{ background: 'rgba(148,163,184,0.16)', borderRadius: 999, height: 7, marginTop: 12, overflow: 'hidden' }}>
        <div style={{ background: color, borderRadius: 999, height: '100%', width: `${clamp(percent)}%` }} />
      </div>
    </GlassPanel>
  );
}

function RankingList({ color, rows, title, unit = '' }) {
  return (
    <GlassPanel style={{ padding: 14 }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 11 }}>
        <h3 style={{ color: 'var(--text-main)', fontSize: '0.88rem', fontWeight: 950, margin: 0 }}>{title}</h3>
        <BarChart3 color={color} size={17} />
      </div>
      <div style={{ display: 'grid', gap: 9 }}>
        {(rows || []).slice(0, 5).map((row, index) => (
          <div key={`${title}-${row.name}-${index}`} style={{ alignItems: 'center', display: 'grid', gap: 8, gridTemplateColumns: '28px minmax(0, 1fr) auto' }}>
            <span style={{ alignItems: 'center', background: `${color}12`, borderRadius: 9, color, display: 'flex', fontSize: '0.72rem', fontWeight: 950, height: 28, justifyContent: 'center' }}>{index + 1}</span>
            <span style={{ color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
            <strong style={{ color, fontSize: '0.8rem' }}>{round(row.val ?? row.riskScore)}{unit}</strong>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function buildGistdaCards(summary) {
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
      const top = [...activeRows].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))[0];
      return {
        key,
        label: labels[key] || key,
        count: activeRows.length,
        topName: top?.province || '-',
        topValue: round(top?.value),
      };
    })
    .filter((item) => item.count > 0)
    .slice(0, 4);
}

function buildFallbackTrendRows(national = {}) {
  const baseTemp = round(national.temp, 32);
  const baseFeels = round(national.feelsLike, baseTemp);
  const baseRain = round(national.rain, 20);
  const basePm25 = round(national.pm25, 18);
  const baseWind = round(national.wind, 8);
  const now = new Date();

  return Array.from({ length: 12 }, (_, index) => {
    const hour = new Date(now.getTime() + index * 2 * 60 * 60 * 1000);
    const dailyWave = Math.sin((index / 11) * Math.PI);
    return {
      time: thaiTime(hour.toISOString()),
      temp: round(baseTemp + dailyWave * 2 - 1),
      feels: round(baseFeels + dailyWave * 2),
      rain: clamp(baseRain + (index % 4 === 0 ? 8 : index % 3 === 0 ? -6 : 0), 0, 100),
      pm25: Math.max(0, round(basePm25 + (index % 5) - 2)),
      wind: Math.max(0, round(baseWind + (index % 3) - 1)),
    };
  });
}

function buildFallbackDailyRows(national = {}) {
  const baseTemp = round(national.temp, 32);
  const baseRain = round(national.rain, 20);
  const now = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getTime() + index * 24 * 60 * 60 * 1000);
    return {
      day: date.toLocaleDateString('th-TH', { weekday: 'short' }),
      max: round(baseTemp + 2 + (index % 3)),
      min: round(baseTemp - 5 + (index % 2)),
      rain: clamp(baseRain + (index % 2 ? 8 : -4), 0, 100),
      uv: index % 2 ? 9 : 7,
    };
  });
}

function getRiskBreakdown({ feelsLike, pm25, rainProb, wind }) {
  return [
    { label: 'ร้อน', value: round(clamp((feelsLike - 32) * 5.5, 0, 42)), color: '#ef4444' },
    { label: 'ฝุ่น', value: round(clamp(pm25 * 0.72, 0, 38)), color: '#f97316' },
    { label: 'ฝน', value: round(clamp(rainProb * 0.22, 0, 16)), color: '#2563eb' },
    { label: 'ลม', value: round(clamp((wind - 12) * 0.9, 0, 10)), color: '#0f766e' },
  ];
}

export default function AIPage() {
  const [activeMetric, setActiveMetric] = useState('risk');
  const {
    darkMode,
    fetchWindAnalysis,
    gistdaSummary,
    isMobile,
    lastUpdated,
    loadingWeather,
    national,
    rankings,
    stationRows,
    tmdAvailable,
    weatherData,
    windAnalysis,
    windError,
    windLastFetch,
    windLoading,
  } = useAIPageData();

  const dashboardData = useMemo(() => {
    if (!weatherData) {
      const temp = round(national?.temp, 32);
      const feelsLike = round(national?.feelsLike, temp);
      const pm25 = round(national?.pm25, 18);
      const rainProb = round(national?.rain, 20);
      const wind = round(national?.wind, 8);
      const humidity = round(national?.humidity, 65);
      const uv = 7;
      const riskBreakdown = getRiskBreakdown({ feelsLike, pm25, rainProb, wind });
      const riskScore = round(riskBreakdown.reduce((sum, item) => sum + item.value, 0));

      return {
        dailyRows: buildFallbackDailyRows(national),
        feelsLike,
        heat: heatMeta(feelsLike),
        humidity,
        pm: pmMeta(pm25),
        pm25,
        rainProb,
        risk: riskMeta(riskScore),
        riskBreakdown,
        riskScore,
        temp,
        trendRows: buildFallbackTrendRows(national),
        uv,
        uvStatus: getUvStatus(uv),
        wind,
        fallback: true,
      };
    }

    const { current, daily, hourly } = weatherData;
    const startIdx = startIndexFromNow(hourly?.time);
    const rainProb = round(daily?.precipitation_probability_max?.[0] ?? current?.rainProb);
    const pm25 = round(current?.pm25);
    const temp = round(current?.temp);
    const feelsLike = round(current?.feelsLike ?? current?.temp);
    const uv = round(current?.uv);
    const humidity = round(current?.humidity);
    const wind = round(current?.windSpeed);
    const riskBreakdown = getRiskBreakdown({ feelsLike, pm25, rainProb, wind });
    const riskScore = round(riskBreakdown.reduce((sum, item) => sum + item.value, 0));

    const trendRows = (hourly?.time || [])
      .slice(startIdx, startIdx + 24)
      .filter((_, index) => index % 2 === 0)
      .map((time, index) => {
        const rowIndex = startIdx + index * 2;
        return {
          time: thaiTime(time),
          temp: round(hourly?.temperature_2m?.[rowIndex] ?? temp),
          feels: round(hourly?.apparent_temperature?.[rowIndex] ?? feelsLike),
          rain: round(hourly?.precipitation_probability?.[rowIndex] ?? rainProb),
          pm25: round(hourly?.pm25?.[rowIndex] ?? pm25),
          wind: round(hourly?.wind_speed_10m?.[rowIndex] ?? wind),
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
      pm: pmMeta(pm25),
      pm25,
      rainProb,
      risk: riskMeta(riskScore),
      riskBreakdown,
      riskScore,
      temp,
      trendRows,
      uv,
      uvStatus: getUvStatus(uv),
      wind,
    };
  }, [national, weatherData]);

  const activeConfig = metricOptions.find((item) => item.id === activeMetric) || metricOptions[0];
  const areaRows = useMemo(() => (
    [...(stationRows || [])]
      .filter((row) => Number.isFinite(Number(row?.[activeConfig.key])))
      .sort((a, b) => (Number(b[activeConfig.key]) || 0) - (Number(a[activeConfig.key]) || 0))
      .slice(0, 10)
  ), [activeConfig.key, stationRows]);

  const gistdaCards = useMemo(() => buildGistdaCards(gistdaSummary), [gistdaSummary]);

  if (loadingWeather && !dashboardData) {
    return (
      <div className="loading-container" style={{ color: 'var(--text-main)' }}>
        <div className="loading-spinner" />
        <div>กำลังจัดชุดสถิติอากาศ...</div>
        <div>รวบรวมข้อมูลฝน ฝุ่น ความร้อน ลม และพื้นที่เสี่ยง</div>
      </div>
    );
  }

  const { dailyRows, feelsLike, heat, humidity, pm, pm25, rainProb, risk, riskBreakdown, riskScore, temp, trendRows, uv, uvStatus, wind } = dashboardData;
  const updatedText = lastUpdated ? new Date(lastUpdated).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  const windText = windLastFetch ? windLastFetch.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'รอข้อมูล';
  const chartText = { fill: 'var(--text-sub)', fontSize: 11, fontWeight: 800 };
  const grid4 = isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))';
  const grid2 = isMobile ? '1fr' : 'minmax(0, 1.35fr) minmax(320px, 0.65fr)';
  const heroBg = darkMode
    ? 'linear-gradient(135deg, #071427 0%, #0d1c38 48%, #123d55 100%)'
    : 'linear-gradient(135deg, #e0f2fe 0%, #ffffff 52%, #dbeafe 100%)';

  return (
    <main className="hide-scrollbar fade-in" style={{ background: 'linear-gradient(180deg, rgba(224,242,254,0.72), var(--bg-app) 32%, var(--bg-app))', color: 'var(--text-main)', fontFamily: 'Sarabun, sans-serif', minHeight: '100%', overflowX: 'hidden' }}>
      <div style={{ margin: '0 auto', maxWidth: isMobile ? 720 : 1440, padding: isMobile ? '14px' : '22px' }}>
        <section style={{ background: heroBg, border: '1px solid var(--border-color)', borderRadius: 20, boxShadow: '0 18px 42px rgba(2,6,23,0.09)', display: 'grid', gap: 18, gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.25fr) minmax(340px, 0.75fr)', marginBottom: 16, overflow: 'hidden', padding: isMobile ? 18 : 24 }}>
          <div>
            <div style={{ alignItems: 'center', color: '#0284c7', display: 'flex', fontSize: '0.76rem', fontWeight: 950, gap: 8, marginBottom: 8 }}>
              <Sparkles size={16} /> Statistics Command Center
            </div>
            <h1 style={{ color: 'var(--text-main)', fontSize: isMobile ? '1.7rem' : '2.35rem', fontWeight: 950, letterSpacing: 0, lineHeight: 1.12, margin: 0 }}>
              แดชบอร์ดสถิติอากาศประเทศไทย
            </h1>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', fontWeight: 750, lineHeight: 1.55, margin: '10px 0 0', maxWidth: 760 }}>
              รวมสถานการณ์ฝน ฝุ่น ความร้อน ลม UV และอันดับจังหวัดที่ต้องจับตาในมุมมองเดียว อัปเดตจากข้อมูลสดและแหล่งข้อมูลภาครัฐที่ระบบเชื่อมต่ออยู่
            </p>
            <DataStatusBar
              compact={isMobile}
              status={dashboardData.fallback || !national?.stationCount ? 'fallback' : 'live'}
              label={dashboardData.fallback || !national?.stationCount ? 'ข้อมูลประเมินสำรอง' : 'ข้อมูลพร้อมใช้'}
              style={{ marginTop: 16 }}
              items={[
                { label: 'อัปเดต', value: updatedText, strong: true },
                { label: 'สถานี', value: `${national?.stationCount || 0} จุด` },
                { label: 'TMD', value: tmdAvailable ? 'พร้อมใช้' : 'สำรอง' },
              ]}
              sources={isMobile ? [] : ['Open-Meteo', 'Air4Thai', 'TMD']}
            />
          </div>

          <div style={{ background: risk.bg, border: `1px solid ${risk.border}`, borderRadius: 18, padding: isMobile ? 14 : 18 }}>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ color: risk.color, fontSize: '0.8rem', fontWeight: 950 }}>ดัชนีความเสี่ยงรวม</div>
                <div style={{ color: risk.color, fontSize: isMobile ? '3.1rem' : '4rem', fontWeight: 950, letterSpacing: 0, lineHeight: 1 }}>{riskScore}</div>
                <div style={{ color: 'var(--text-main)', fontSize: '0.98rem', fontWeight: 950 }}>{risk.label}</div>
              </div>
              <Gauge color={risk.color} size={66} strokeWidth={1.8} />
            </div>
            <div style={{ color: 'var(--text-sub)', fontSize: isMobile ? '0.72rem' : '0.76rem', fontWeight: 650, lineHeight: 1.55, marginTop: 10 }}>
              คำนวณจากความร้อน PM2.5 โอกาสฝน และลม เพื่อช่วยจัดลำดับสิ่งที่ควรรับมือก่อน
            </div>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginTop: 14 }}>
              {riskBreakdown.map((item) => (
                <div key={item.label} style={{ background: `${item.color}12`, border: `1px solid ${item.color}24`, borderRadius: 12, padding: '9px 8px' }}>
                  <div style={{ color: item.color, fontSize: '1.1rem', fontWeight: 950, lineHeight: 1 }}>{item.value}</div>
                  <div style={{ color: 'var(--text-sub)', fontSize: '0.66rem', fontWeight: 850, marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gap: 12, gridTemplateColumns: grid4, marginBottom: 14 }}>
          <MetricTile color={heat.color} icon={ThermometerSun} label="รู้สึกเหมือน" note={heat.label} percent={(feelsLike / 45) * 100} unit="°C" value={feelsLike} />
          <MetricTile color={pm.color} icon={Activity} label="PM2.5" note={pm.label} percent={(pm25 / 75) * 100} value={pm25} />
          <MetricTile color={rainProb >= 50 ? '#2563eb' : '#0f766e'} icon={CloudRain} label="โอกาสฝน" note={windAnalysis?.quickSummary || 'ประเมินจากพยากรณ์รายวันและรายชั่วโมง'} percent={rainProb} unit="%" value={rainProb} />
          <MetricTile color={uvStatus.color} icon={ShieldCheck} label="UV / ความชื้น" note={`UV ${uvStatus.text} · ความชื้น ${humidity}% · ลม ${wind} กม./ชม.`} percent={uv * 10} value={uv} />
        </section>

        <section style={{ display: 'grid', gap: 14, gridTemplateColumns: grid2, marginBottom: 14 }}>
          <GlassPanel style={{ minHeight: 380 }}>
            <SectionTitle icon={AreaChart ? Activity : Activity} title="แนวโน้ม 24 ชั่วโมง" subtitle="เส้นฝน อุณหภูมิ และ PM2.5 สำหรับอ่านทิศทางวันนี้" />
            <div style={{ height: isMobile ? 300 : 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendRows} margin={{ bottom: 0, left: -18, right: 12, top: 12 }}>
                  <defs>
                    <linearGradient id="statsRainFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" tick={chartText} tickLine={false} axisLine={false} minTickGap={14} />
                  <YAxis tick={chartText} tickLine={false} axisLine={false} />
                  <Tooltip content={<TooltipBox />} />
                  <Area dataKey="rain" fill="url(#statsRainFill)" name="ฝน %" stroke="#2563eb" strokeWidth={3} type="monotone" />
                  <Line dataKey="temp" dot={false} name="อุณหภูมิ °C" stroke="#ef4444" strokeWidth={3} type="monotone" />
                  <Line dataKey="pm25" dot={false} name="PM2.5" stroke="#f97316" strokeWidth={3} type="monotone" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>

          <GlassPanel>
            <SectionTitle
              action={(
                <button onClick={fetchWindAnalysis} disabled={windLoading} title="รีเฟรชข้อมูลลม" style={{ alignItems: 'center', background: windLoading ? 'var(--bg-secondary)' : '#0284c7', border: 0, borderRadius: 12, color: windLoading ? 'var(--text-sub)' : '#fff', cursor: windLoading ? 'not-allowed' : 'pointer', display: 'flex', height: 36, justifyContent: 'center', width: 36 }}>
                  <RefreshCw size={16} style={{ animation: windLoading ? 'spin 1s linear infinite' : 'none' }} />
                </button>
              )}
              icon={Wind}
              subtitle={`ข้อมูลลมล่าสุด ${windText}`}
              title="ฝนจากลมและภูมิภาค"
            />
            {windError ? (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 14, color: '#dc2626', fontSize: '0.75rem', fontWeight: 850, lineHeight: 1.5, padding: 12 }}>{windError}</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.18)', borderRadius: 16, padding: 14 }}>
                  <div style={{ color: '#1d4ed8', fontSize: '2rem', fontWeight: 950, lineHeight: 1 }}>{windAnalysis?.nationalRainChance ?? rainProb}%</div>
                  <div style={{ color: 'var(--text-main)', fontSize: '0.86rem', fontWeight: 950, marginTop: 5 }}>{windAnalysis?.quickSummary || 'ใช้พยากรณ์รายชั่วโมงเป็นข้อมูลตั้งต้น'}</div>
                </div>
                {(windAnalysis?.regions || []).slice(0, 6).map((region) => {
                  const pct = clamp(region.rainChance);
                  const color = pct >= 60 ? '#2563eb' : pct >= 35 ? '#0ea5e9' : '#16a34a';
                  return (
                    <div key={region.name}>
                      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ color: 'var(--text-sub)', fontSize: '0.74rem', fontWeight: 850 }}>{region.name}</span>
                        <strong style={{ color, fontSize: '0.78rem' }}>{pct}%</strong>
                      </div>
                      <div style={{ background: 'rgba(148,163,184,0.16)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                        <div style={{ background: color, borderRadius: 999, height: '100%', width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassPanel>
        </section>

        <section style={{ display: 'grid', gap: 14, gridTemplateColumns: grid2, marginBottom: 14 }}>
          <GlassPanel>
            <SectionTitle icon={MapPin} title="อันดับจังหวัดที่ต้องจับตา" subtitle="เลือกมุมมองเพื่อจัดอันดับพื้นที่เด่นในแต่ละประเภท" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {metricOptions.map((option) => {
                const active = option.id === activeMetric;
                return (
                  <button key={option.id} onClick={() => setActiveMetric(option.id)} type="button" style={{ background: active ? option.color : 'var(--bg-secondary)', border: `1px solid ${active ? option.color : 'var(--border-color)'}`, borderRadius: 999, color: active ? '#fff' : 'var(--text-main)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 900, padding: '8px 12px' }}>
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'grid', gap: 9 }}>
              {areaRows.slice(0, 8).map((row, index) => {
                const value = round(row[activeConfig.key]);
                const width = activeMetric === 'pm25' ? (value / 90) * 100 : activeMetric === 'heat' ? (value / 45) * 100 : activeMetric === 'wind' ? value * 5 : value;
                return (
                  <div key={`${activeMetric}-${row.id || row.name}`} style={{ alignItems: 'center', display: 'grid', gap: 9, gridTemplateColumns: '30px minmax(0, 1fr) 58px' }}>
                    <span style={{ color: activeConfig.color, fontSize: '0.78rem', fontWeight: 950, textAlign: 'center' }}>{index + 1}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                        <span style={{ color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
                        <span style={{ color: 'var(--text-sub)', fontSize: '0.68rem', fontWeight: 800 }}>{row.riskMeta?.label}</span>
                      </div>
                      <div style={{ background: 'rgba(148,163,184,0.16)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                        <div style={{ background: activeConfig.color, borderRadius: 999, height: '100%', width: `${clamp(width)}%` }} />
                      </div>
                    </div>
                    <strong style={{ color: activeConfig.color, fontSize: '0.82rem', textAlign: 'right' }}>{value}{activeConfig.unit}</strong>
                  </div>
                );
              })}
            </div>
          </GlassPanel>

          <GlassPanel>
            <SectionTitle icon={AlertTriangle} title="สัญญาณประเทศ" subtitle="ค่าเฉลี่ยจากสถานีที่มีข้อมูลล่าสุด" />
            <div style={{ display: 'grid', gap: 11 }}>
              {[
                ['อุณหภูมิ', `${national?.temp || temp}°C`, '#ef4444', ((national?.temp || temp) / 42) * 100],
                ['รู้สึกเหมือน', `${national?.feelsLike || feelsLike}°C`, '#f97316', ((national?.feelsLike || feelsLike) / 45) * 100],
                ['PM2.5', `${national?.pm25 || pm25}`, '#f59e0b', ((national?.pm25 || pm25) / 75) * 100],
                ['ฝน', `${national?.rain || rainProb}%`, '#2563eb', national?.rain || rainProb],
                ['ลม', `${national?.wind || wind} กม./ชม.`, '#0f766e', (national?.wind || wind) * 5],
              ].map(([label, value, color, percent]) => (
                <div key={label}>
                  <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-sub)', fontSize: '0.74rem', fontWeight: 850 }}>{label}</span>
                    <strong style={{ color, fontSize: '0.82rem' }}>{value}</strong>
                  </div>
                  <div style={{ background: 'rgba(148,163,184,0.16)', borderRadius: 999, height: 9, overflow: 'hidden' }}>
                    <div style={{ background: color, borderRadius: 999, height: '100%', width: `${clamp(percent)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </section>

        <section style={{ display: 'grid', gap: 12, gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))', marginBottom: 14 }}>
          <RankingList color="#ef4444" rows={rankings?.heat || []} title="ร้อนสุด" unit="°" />
          <RankingList color="#f97316" rows={rankings?.pm25 || []} title="ฝุ่นสูงสุด" />
          <RankingList color="#2563eb" rows={rankings?.rain || []} title="ฝนสูงสุด" unit="%" />
          <RankingList color="#0891b2" rows={rankings?.cool || []} title="อากาศเย็นสุด" unit="°" />
        </section>

        <section style={{ display: 'grid', gap: 14, gridTemplateColumns: grid2, marginBottom: 14 }}>
          <GlassPanel>
            <SectionTitle icon={CloudRain} title="พยากรณ์ 7 วัน" subtitle="อุณหภูมิสูงสุด ต่ำสุด ฝน และ UV ในกราฟเดียว" />
            <div style={{ height: 310 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyRows} margin={{ bottom: 0, left: -18, right: 12, top: 12 }}>
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={chartText} tickLine={false} axisLine={false} />
                  <YAxis tick={chartText} tickLine={false} axisLine={false} />
                  <Tooltip content={<TooltipBox />} />
                  <Line dataKey="max" name="สูงสุด °C" stroke="#ef4444" strokeWidth={3} type="monotone" />
                  <Line dataKey="min" name="ต่ำสุด °C" stroke="#0ea5e9" strokeWidth={3} type="monotone" />
                  <Line dataKey="rain" name="ฝน %" stroke="#2563eb" strokeWidth={3} type="monotone" />
                  <Line dataKey="uv" name="UV" stroke="#f59e0b" strokeWidth={3} type="monotone" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>

          <GlassPanel>
            <SectionTitle icon={Database} title="ข้อมูลดาวเทียม GISTDA" subtitle="พื้นที่เสี่ยงที่พบค่าใช้งานล่าสุด" />
            {gistdaCards.length ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {gistdaCards.map((item, index) => {
                  const colors = ['#ef4444', '#f97316', '#16a34a', '#2563eb'];
                  const color = colors[index % colors.length];
                  return (
                    <div key={item.key} style={{ background: `${color}0f`, border: `1px solid ${color}24`, borderRadius: 14, padding: 12 }}>
                      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 950 }}>{item.label}</span>
                        <strong style={{ color, fontSize: '1.35rem', lineHeight: 1 }}>{item.count}</strong>
                      </div>
                      <div style={{ color: 'var(--text-sub)', fontSize: '0.72rem', fontWeight: 800, marginTop: 5 }}>สูงสุด: {item.topName} ({item.topValue})</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 14, color: 'var(--text-sub)', fontSize: '0.8rem', fontWeight: 800, lineHeight: 1.5, padding: 14 }}>
                ยังไม่มีสัญญาณดาวเทียมที่ต้องแสดงในรอบข้อมูลนี้
              </div>
            )}
          </GlassPanel>
        </section>

        <GlassPanel>
          <SectionTitle icon={BarChart3} title="กราฟจังหวัดเสี่ยงรวม" subtitle="มองภาพรวมจังหวัดที่มีคะแนนสูงสุดจากหลายปัจจัย" />
          <div style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(rankings?.risk || []).slice(0, 8)} layout="vertical" margin={{ bottom: 0, left: 8, right: 18, top: 6 }}>
                <CartesianGrid horizontal={false} stroke="var(--border-color)" strokeDasharray="3 3" />
                <XAxis domain={[0, 100]} tick={chartText} tickLine={false} axisLine={false} type="number" />
                <YAxis dataKey="name" tick={chartText} tickLine={false} axisLine={false} type="category" width={92} />
                <Tooltip content={<TooltipBox />} />
                <Bar dataKey="riskScore" name="คะแนนเสี่ยง" radius={[0, 10, 10, 0]}>
                  {(rankings?.risk || []).slice(0, 8).map((row) => (
                    <Cell key={row.id || row.name} fill={row.riskMeta?.color || '#2563eb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      </div>
    </main>
  );
}
