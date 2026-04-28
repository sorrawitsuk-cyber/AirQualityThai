import React, { useContext, useEffect, useMemo, useState } from 'react';
import { WeatherContext } from '../context/WeatherContext';
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
import { useWeatherData } from '../hooks/useWeatherData';
import ActivityRecommendations from '../components/Dashboard/ActivityRecommendations';
import LoadingScreen from '../components/LoadingScreen';

const num = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const round = (value, fallback = 0) => Math.round(num(value, fallback));

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const stationName = (station) => {
  const raw = station?.areaTH || station?.nameTH || station?.nameEN || station?.stationID || '-';
  return String(raw).replace(/^จ\./, '').replace('จังหวัด', '').trim();
};

const riskMeta = (score) => {
  if (score >= 75) return { label: 'เสี่ยงสูง', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' };
  if (score >= 55) return { label: 'ควรระวัง', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.32)' };
  if (score >= 35) return { label: 'ปานกลาง', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.32)' };
  return { label: 'รับมือได้', color: '#16a34a', bg: 'rgba(22,163,74,0.11)', border: 'rgba(22,163,74,0.28)' };
};

const pmMeta = (pm25) => {
  if (pm25 >= 75) return { label: 'มีผลกระทบสูง', color: '#ef4444' };
  if (pm25 >= 50) return { label: 'เริ่มมีผลกระทบ', color: '#f97316' };
  if (pm25 >= 25) return { label: 'ปานกลาง', color: '#f59e0b' };
  return { label: 'ดี', color: '#16a34a' };
};

const heatMeta = (heat) => {
  if (heat >= 41) return { label: 'อันตรายจากความร้อน', color: '#ef4444' };
  if (heat >= 38) return { label: 'ร้อนจัด ควรพักเป็นช่วง', color: '#f97316' };
  if (heat >= 35) return { label: 'ร้อน ควรดื่มน้ำบ่อย', color: '#f59e0b' };
  return { label: 'รับมือได้', color: '#16a34a' };
};

const thaiTime = (value) => new Date(value).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '14px',
      boxShadow: '0 14px 34px rgba(15, 23, 42, 0.14)',
      color: 'var(--text-main)',
      padding: '10px 12px',
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

const SectionTitle = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: '14px' }}>
    <h2 style={{ alignItems: 'center', color: 'var(--text-main)', display: 'flex', fontSize: '1.05rem', fontWeight: 900, gap: '8px', margin: 0 }}>
      <span>{icon}</span>
      {title}
    </h2>
    {subtitle && <p style={{ color: 'var(--text-sub)', fontSize: '0.78rem', lineHeight: 1.55, margin: '4px 0 0' }}>{subtitle}</p>}
  </div>
);

const Panel = ({ children, style }) => (
  <section style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '24px',
    boxShadow: '0 12px 34px rgba(15, 23, 42, 0.04)',
    minWidth: 0,
    padding: '20px',
    ...style,
  }}>
    {children}
  </section>
);

const MetricCard = ({ icon, label, value, detail, meta, accent = '#0ea5e9' }) => (
  <div style={{
    background: `linear-gradient(135deg, ${accent}17, var(--bg-card))`,
    border: `1px solid ${accent}33`,
    borderRadius: '18px',
    minWidth: 0,
    padding: '14px',
  }}>
    <div style={{ alignItems: 'center', color: 'var(--text-sub)', display: 'flex', fontSize: '0.72rem', fontWeight: 800, gap: '7px' }}>
      <span style={{ fontSize: '1.05rem' }}>{icon}</span>
      {label}
    </div>
    <div style={{ color: accent, fontSize: '1.45rem', fontWeight: 950, lineHeight: 1.1, marginTop: '8px' }}>{value}</div>
    {detail && <div style={{ color: 'var(--text-sub)', fontSize: '0.72rem', lineHeight: 1.45, marginTop: '6px' }}>{detail}</div>}
    {meta && <div style={{ color: meta.color || accent, fontSize: '0.72rem', fontWeight: 900, marginTop: '8px' }}>{meta.label || meta}</div>}
  </div>
);

const RankingMini = ({ title, items, unit, accent }) => (
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

const GistdaBrief = ({ summary, isMobile }) => {
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
          <div key={group.title} style={{
            background: `${group.accent}0f`,
            border: `1px solid ${group.accent}2e`,
            borderRadius: '16px',
            minWidth: 0,
            padding: '12px',
          }}>
            <div style={{ alignItems: 'center', color: group.accent, display: 'flex', fontSize: '0.76rem', fontWeight: 950, gap: '7px' }}>
              <span>{group.icon}</span>
              {group.title}
            </div>
            <div style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 950, marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {top?.province || '-'}
            </div>
            <div style={{ color: 'var(--text-sub)', fontSize: '0.7rem', fontWeight: 800, marginTop: '4px' }}>
              {num(top?.value).toLocaleString('th-TH')} {group.unit}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const OverallScore = ({ score, meta, title, summary, details, isMobile }) => (
  <div style={{
    alignItems: isMobile ? 'stretch' : 'center',
    background: `linear-gradient(135deg, ${meta.color}18, var(--analysis-score-bg))`,
    border: `1px solid ${meta.color}33`,
    borderRadius: '22px',
    display: 'grid',
    gap: '16px',
    gridTemplateColumns: isMobile ? '1fr' : '150px 1fr',
    marginTop: '18px',
    padding: '16px',
  }}>
    <div style={{
      alignItems: 'center',
      background: meta.bg,
      border: `1px solid ${meta.border}`,
      borderRadius: '20px',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 120,
      justifyContent: 'center',
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

const PhaseLabel = ({ children }) => (
  <div style={{
    alignItems: 'center',
    color: '#0ea5e9',
    display: 'flex',
    fontSize: '0.76rem',
    fontWeight: 950,
    gap: '8px',
    letterSpacing: 0,
    margin: '4px 0 10px',
  }}>
    <span style={{ background: '#0ea5e9', borderRadius: 999, height: 8, width: 8 }} />
    {children}
  </div>
);

const InsightBox = ({ color = '#0ea5e9', title, children }) => (
  <div style={{
    background: `${color}10`,
    border: `1px solid ${color}33`,
    borderRadius: '16px',
    color: 'var(--text-main)',
    fontSize: '0.8rem',
    fontWeight: 750,
    lineHeight: 1.6,
    marginTop: '12px',
    padding: '12px',
  }}>
    <strong style={{ color, display: 'block', fontSize: '0.76rem', marginBottom: '3px' }}>{title}</strong>
    {children}
  </div>
);

export default function AIPage() {
  const {
    stations,
    stationTemps,
    stationYesterday,
    stationMaxYesterday,
    stationDaily,
    gistdaSummary,
    lastUpdated,
    tmdAvailable,
  } = useContext(WeatherContext);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [chartMode, setChartMode] = useState('temp');
  const { weatherData, loadingWeather, fetchWeatherByCoords } = useWeatherData();
  const [windAnalysis, setWindAnalysis] = useState(null);
  const [windLoading, setWindLoading] = useState(false);
  const [windError, setWindError] = useState(null);
  const [windLastFetch, setWindLastFetch] = useState(null);
  const [windDetailsOpen, setWindDetailsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (weatherData) return;

    fetchWeatherByCoords(13.75, 100.5);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { maximumAge: 300000, timeout: 2500 }
      );
    }
  }, [fetchWeatherByCoords, weatherData]);

  const fetchWindAnalysis = async () => {
    setWindLoading(true);
    setWindError(null);
    try {
      const res = await fetch('/api/tmd-wind');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setWindAnalysis(data);
      setWindLastFetch(new Date());
    } catch (err) {
      setWindError(err.message);
    } finally {
      setWindLoading(false);
    }
  };

  useEffect(() => {
    fetchWindAnalysis();
    const interval = setInterval(fetchWindAnalysis, 3 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stationRows = useMemo(() => {
    return (stations || []).map((station) => {
      const id = station.stationID;
      const live = stationTemps?.[id] || {};
      const yesterdayMax = stationMaxYesterday?.[id] || {};
      const yesterdayMin = stationYesterday?.[id] || {};
      const daily = stationDaily?.[id] || {};
      const temp = round(live.temp, Number.NaN);
      const feelsLike = round(live.feelsLike ?? live.heatIndex ?? live.temp, temp);
      const pm25 = round(station?.AQILast?.PM25?.value ?? live.pm25, 0);
      const rain = round(live.rainProb ?? live.rainChance ?? live.rain, 0);
      const wind = round(live.windSpeed ?? live.wind, 0);
      const humidity = round(live.humidity ?? live.rh, 0);
      const heatRisk = clamp((feelsLike - 32) * 5.5, 0, 42);
      const pmRisk = clamp(pm25 * 0.72, 0, 38);
      const rainRisk = clamp(rain * 0.22, 0, 16);
      const windRisk = clamp((wind - 12) * 0.9, 0, 10);
      const riskScore = round(heatRisk + pmRisk + rainRisk + windRisk);

      return {
        id,
        name: stationName(station),
        temp,
        feelsLike,
        pm25,
        rain,
        wind,
        humidity,
        yesterdayTemp: round(yesterdayMax.temp ?? yesterdayMin.temp, Number.NaN),
        yesterdayPm25: round(yesterdayMax.pm25 ?? yesterdayMin.pm25, 0),
        dailyMax: round(daily?.temperature_2m_max?.[0] ?? daily?.tempMax?.[0], Number.NaN),
        dailyRain: round(daily?.precipitation_probability_max?.[0] ?? daily?.rainProb?.[0], 0),
        riskScore,
        riskMeta: riskMeta(riskScore),
      };
    }).filter((row) => Number.isFinite(row.temp) || row.pm25 > 0 || row.rain > 0);
  }, [stationDaily, stationMaxYesterday, stationTemps, stationYesterday, stations]);

  const rankings = useMemo(() => {
    const by = (key, direction = 'desc') => [...stationRows]
      .filter((row) => Number.isFinite(row[key]) && row[key] > -50)
      .sort((a, b) => direction === 'asc' ? a[key] - b[key] : b[key] - a[key])
      .slice(0, 5)
      .map((row) => ({ name: row.name, val: row[key] }));

    return {
      heat: by('feelsLike'),
      cool: by('temp', 'asc'),
      pm25: by('pm25'),
      rain: by('rain'),
      risk: [...stationRows].sort((a, b) => b.riskScore - a.riskScore).slice(0, 6),
      yesterdayHeat: [...stationRows].filter((row) => Number.isFinite(row.yesterdayTemp)).sort((a, b) => b.yesterdayTemp - a.yesterdayTemp).slice(0, 5).map((row) => ({ name: row.name, val: row.yesterdayTemp })),
      yesterdayPm25: [...stationRows].filter((row) => row.yesterdayPm25 > 0).sort((a, b) => b.yesterdayPm25 - a.yesterdayPm25).slice(0, 5).map((row) => ({ name: row.name, val: row.yesterdayPm25 })),
    };
  }, [stationRows]);

  const national = useMemo(() => {
    const average = (key) => {
      const values = stationRows.map((row) => row[key]).filter((value) => Number.isFinite(value) && value > -50);
      if (!values.length) return 0;
      return round(values.reduce((sum, value) => sum + value, 0) / values.length);
    };

    return {
      temp: average('temp'),
      feelsLike: average('feelsLike'),
      pm25: average('pm25'),
      rain: average('rain'),
      wind: average('wind'),
      humidity: average('humidity'),
      stationCount: stationRows.length,
      topRisk: rankings.risk?.[0],
    };
  }, [rankings.risk, stationRows]);

  if (loadingWeather || !weatherData) {
    return (
      <LoadingScreen
        title="กำลังเตรียมหน้าวิเคราะห์"
        subtitle="รวมสถิติย้อนหลัง สภาพอากาศตอนนี้ แนวโน้ม และข้อมูลแผนที่"
      />
    );
  }

  const { current, daily, hourly, coords } = weatherData;
  const nowMs = Date.now();
  const startIdx = Math.max(0, hourly?.time?.findIndex((time) => new Date(time).getTime() >= nowMs - 3600000) ?? 0);
  const currentPm = round(current?.pm25, national.pm25);
  const currentFeels = round(current?.feelsLike, national.feelsLike);
  const currentTemp = round(current?.temp, national.temp);
  const currentRain = round(current?.rainProb ?? daily?.precipitation_probability_max?.[0], national.rain);
  const currentWind = round(current?.windSpeed, national.wind);
  const currentHumidity = round(current?.humidity, national.humidity);
  const currentUv = num(current?.uvIndex ?? daily?.uv_index_max?.[0], 0).toFixed(1);
  const currentPressure = round(current?.pressure, 0);
  const visibilityKm = Math.max(0, num(current?.visibility, 10000) / 1000).toFixed(1);

  const hourlyRows = (hourly?.time || [])
    .slice(startIdx, startIdx + 24)
    .filter((_, index) => index % 2 === 0)
    .map((time, index) => {
      const rowIndex = startIdx + index * 2;
      return {
        time: thaiTime(time),
        temp: round(hourly?.temperature_2m?.[rowIndex], currentTemp),
        feels: round(hourly?.apparent_temperature?.[rowIndex], currentFeels),
        rain: round(hourly?.precipitation_probability?.[rowIndex], currentRain),
        pm25: round(hourly?.pm25?.[rowIndex], currentPm),
        wind: round(hourly?.wind_speed_10m?.[rowIndex], currentWind),
        humidity: round(hourly?.relative_humidity_2m?.[rowIndex], currentHumidity),
      };
    });

  const dailyRows = (daily?.time || []).slice(0, 7).map((time, index) => ({
    day: index === 0 ? 'วันนี้' : new Date(time).toLocaleDateString('th-TH', { weekday: 'short' }),
    date: new Date(time).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
    max: round(daily?.temperature_2m_max?.[index], currentTemp),
    min: round(daily?.temperature_2m_min?.[index], currentTemp - 4),
    heat: round(daily?.apparent_temperature_max?.[index], currentFeels),
    rain: round(daily?.precipitation_probability_max?.[index], 0),
    uv: num(daily?.uv_index_max?.[index], 0).toFixed(1),
  }));

  const tomorrow = dailyRows[1] || dailyRows[0];
  const chartKeyMap = {
    temp: { key: 'temp', label: 'อุณหภูมิ', color: '#f97316', unit: '°' },
    rain: { key: 'rain', label: 'โอกาสฝน', color: '#3b82f6', unit: '%' },
    pm25: { key: 'pm25', label: 'PM2.5', color: '#22c55e', unit: '' },
    wind: { key: 'wind', label: 'ลม', color: '#8b5cf6', unit: '' },
  };
  const activeChart = chartKeyMap[chartMode];

  const riskCards = [
    {
      icon: '🥵',
      title: 'ความร้อน',
      value: `${currentFeels}°`,
      meta: heatMeta(currentFeels),
      text: currentFeels >= 38 ? 'ลดกิจกรรมกลางแดดช่วง 11:00-15:00 และดื่มน้ำให้ถี่ขึ้น' : 'ทำกิจกรรมกลางแจ้งได้ แต่ควรพักเป็นช่วง',
      score: clamp((currentFeels - 30) * 7, 10, 92),
    },
    {
      icon: '🌫️',
      title: 'ฝุ่น PM2.5',
      value: currentPm,
      meta: pmMeta(currentPm),
      text: currentPm >= 50 ? 'กลุ่มเสี่ยงควรลดเวลานอกอาคารและพกหน้ากาก' : 'คุณภาพอากาศยังเหมาะกับกิจกรรมทั่วไป',
      score: clamp(currentPm * 1.1, 8, 95),
    },
    {
      icon: '🌧️',
      title: 'ฝน',
      value: `${currentRain}%`,
      meta: currentRain >= 70 ? { label: 'เสี่ยงฝนสูง', color: '#3b82f6' } : currentRain >= 40 ? { label: 'มีโอกาสฝน', color: '#f59e0b' } : { label: 'ฝนน้อย', color: '#16a34a' },
      text: currentRain >= 40 ? 'เตรียมร่มและเลี่ยงเดินทางช่วงเมฆฝนก่อตัว' : 'เดินทางได้ค่อนข้างสะดวก',
      score: clamp(currentRain, 8, 95),
    },
    {
      icon: '💨',
      title: 'ลมและทัศนวิสัย',
      value: `${currentWind} km/h`,
      meta: currentWind >= 30 ? { label: 'ลมแรง', color: '#ef4444' } : currentWind >= 18 ? { label: 'ลมปานกลาง', color: '#f59e0b' } : { label: 'ปกติ', color: '#16a34a' },
      text: `ทัศนวิสัยประมาณ ${visibilityKm} กม. เหมาะกับการเดินทางทั่วไป`,
      score: clamp(currentWind * 2.3, 8, 80),
    },
  ];

  const concernScores = [
    { key: 'heat', label: 'ความร้อน', score: clamp((currentFeels - 30) * 7, 0, 100), color: '#f97316' },
    { key: 'pm25', label: 'ฝุ่น PM2.5', score: clamp(currentPm * 1.25, 0, 100), color: '#22c55e' },
    { key: 'rain', label: 'ฝน', score: clamp(currentRain, 0, 100), color: '#3b82f6' },
    { key: 'uv', label: 'UV', score: clamp(Number(currentUv) * 9, 0, 100), color: '#f59e0b' },
  ].sort((a, b) => b.score - a.score);
  const topConcern = concernScores[0];
  const overallScore = round(clamp(100 - (concernScores.reduce((sum, item) => sum + item.score, 0) / concernScores.length) * 0.82, 8, 96));
  const overallMeta = overallScore >= 78
    ? { label: 'ดี ใช้ชีวิตได้ปกติ', color: '#16a34a', bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.28)' }
    : overallScore >= 60
      ? { label: 'พอใช้ ต้องดูบางช่วง', color: '#f59e0b', bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.3)' }
      : overallScore >= 42
        ? { label: 'ควรระวัง', color: '#f97316', bg: 'rgba(249,115,22,0.13)', border: 'rgba(249,115,22,0.32)' }
        : { label: 'เสี่ยงสูง', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.32)' };
  const peakHeatHour = hourlyRows.reduce((max, row) => (row.feels > max.feels ? row : max), hourlyRows[0] || { time: '-', feels: currentFeels });
  const peakRainHour = hourlyRows.reduce((max, row) => (row.rain > max.rain ? row : max), hourlyRows[0] || { time: '-', rain: currentRain });
  const peakPmHour = hourlyRows.reduce((max, row) => (row.pm25 > max.pm25 ? row : max), hourlyRows[0] || { time: '-', pm25: currentPm });
  const chartInsight = chartMode === 'rain'
    ? `โอกาสฝนสูงสุดอยู่ช่วง ${peakRainHour.time} ประมาณ ${peakRainHour.rain}% ถ้าต้องเดินทางควรเช็กเรดาร์ก่อนออกจากบ้าน`
    : chartMode === 'pm25'
      ? `ค่าฝุ่นสูงสุดในช่วงที่แสดงอยู่ราว ${peakPmHour.pm25} µg/m³ แถวเวลา ${peakPmHour.time} กลุ่มเสี่ยงควรลดกิจกรรมกลางแจ้ง`
      : chartMode === 'wind'
        ? `ลมโดยรวมอยู่ระดับ ${currentWind >= 18 ? 'ปานกลางถึงค่อนข้างแรง' : 'ปกติ'} เหมาะใช้ประกอบการเดินทางและกิจกรรมกลางแจ้ง`
        : `ช่วงที่รู้สึกร้อนที่สุดคือประมาณ ${peakHeatHour.time} ที่ ${peakHeatHour.feels}° ควรหลบแดดหรือพักให้ถี่ขึ้น`;
  const topThreeActions = [
    { label: 'ควรทำตอนนี้', text: overallScore >= 70 ? 'ใช้ชีวิตได้ค่อนข้างปกติ' : `โฟกัสเรื่อง${topConcern.label}ก่อน`, color: overallMeta.color },
    { label: 'ช่วงที่ควรระวัง', text: peakRainHour.rain >= 40 ? `ฝนช่วง ${peakRainHour.time}` : `ร้อนช่วง ${peakHeatHour.time}`, color: peakRainHour.rain >= 40 ? '#3b82f6' : '#f97316' },
    { label: 'พื้นที่น่าจับตา', text: national.topRisk ? `${national.topRisk.name} ${national.topRisk.riskScore}/100` : 'ยังไม่พบจุดเด่น', color: national.topRisk?.riskMeta?.color || '#0ea5e9' },
  ];
  const mapRiskCards = rankings.risk.slice(0, 3).map((row) => ({
    ...row,
    reasons: [
      row.feelsLike >= 38 ? 'ร้อนจัด' : row.feelsLike >= 35 ? 'ร้อน' : 'อุณหภูมิรับมือได้',
      row.pm25 >= 50 ? 'ฝุ่นสูง' : row.pm25 >= 25 ? 'ฝุ่นปานกลาง' : 'ฝุ่นดี',
      row.rain >= 60 ? 'ฝนสูง' : row.rain >= 35 ? 'มีโอกาสฝน' : 'ฝนน้อย',
    ],
  }));
  const compactActivities = [
    {
      icon: '👕',
      title: 'ซักผ้า / ล้างรถ',
      score: currentRain >= 45 ? 5.8 : 8.8,
      text: currentRain >= 45 ? 'พอใช้ ควรดูเมฆฝนก่อน' : 'เหมาะ ช่วงก่อนบ่าย',
      color: currentRain >= 45 ? '#f59e0b' : '#16a34a',
    },
    {
      icon: '🏃',
      title: 'ออกกำลังกาย',
      score: currentFeels >= 38 || currentPm >= 50 ? 4.6 : 7.4,
      text: currentFeels >= 38 ? 'เลี่ยงแดดจัด' : 'เหมาะช่วงเช้า/เย็น',
      color: currentFeels >= 38 || currentPm >= 50 ? '#f97316' : '#16a34a',
    },
    {
      icon: '🚗',
      title: 'เดินทาง',
      score: currentRain >= 60 ? 5.2 : 7.8,
      text: currentRain >= 60 ? 'ระวังฝนและถนนลื่น' : 'เดินทางได้ค่อนข้างดี',
      color: currentRain >= 60 ? '#f59e0b' : '#16a34a',
    },
  ];
  const localCompare = [
    {
      label: 'ความร้อนเทียบพื้นที่อื่น',
      value: `${currentFeels}°`,
      detail: currentFeels >= national.feelsLike + 2 ? `สูงกว่าค่าเฉลี่ย ${currentFeels - national.feelsLike}°` : currentFeels <= national.feelsLike - 2 ? `ต่ำกว่าค่าเฉลี่ย ${national.feelsLike - currentFeels}°` : 'ใกล้ค่าเฉลี่ยประเทศ',
      color: currentFeels >= 38 ? '#ef4444' : currentFeels >= 35 ? '#f97316' : '#16a34a',
    },
    {
      label: 'ฝุ่นเทียบพื้นที่อื่น',
      value: `${currentPm}`,
      detail: currentPm >= national.pm25 + 10 ? `สูงกว่าค่าเฉลี่ย ${currentPm - national.pm25}` : currentPm <= national.pm25 - 10 ? `ต่ำกว่าค่าเฉลี่ย ${national.pm25 - currentPm}` : 'ใกล้ค่าเฉลี่ยประเทศ',
      color: pmMeta(currentPm).color,
    },
    {
      label: 'ฝนใกล้ตัว',
      value: `${currentRain}%`,
      detail: peakRainHour.rain >= 40 ? `พีคช่วง ${peakRainHour.time} (${peakRainHour.rain}%)` : 'ยังไม่มีช่วงฝนเด่น',
      color: currentRain >= 60 ? '#2563eb' : currentRain >= 35 ? '#3b82f6' : '#16a34a',
    },
    {
      label: 'ความสบายในการอยู่กลางแจ้ง',
      value: overallScore >= 70 ? 'ดี' : overallScore >= 55 ? 'พอใช้' : 'ควรระวัง',
      detail: `${topConcern.label} เป็นปัจจัยหลักที่กดคะแนน`,
      color: overallMeta.color,
    },
  ];
  const localRiskTimeline = [
    { label: 'ตอนนี้', text: `${currentTemp}° · ฝน ${currentRain}% · PM2.5 ${currentPm}`, color: overallMeta.color },
    { label: 'ช่วงร้อนสุด', text: `${peakHeatHour.time} · รู้สึก ${peakHeatHour.feels}°`, color: '#f97316' },
    { label: 'ช่วงฝนเด่น', text: `${peakRainHour.time} · ${peakRainHour.rain}%`, color: '#3b82f6' },
    { label: 'ฝุ่นสูงสุด', text: `${peakPmHour.time} · PM2.5 ${peakPmHour.pm25}`, color: pmMeta(peakPmHour.pm25).color },
  ];
  const localActions = [
    Number(currentUv) >= 8 ? 'กันแดดก่อนออกจากอาคาร โดยเฉพาะช่วง 11:00-15:00' : 'UV ไม่สูงมาก แต่ถ้าอยู่นอกอาคารนานยังควรป้องกันผิว',
    currentRain >= 35 || peakRainHour.rain >= 45 ? `พกร่มไว้ก่อน เพราะโอกาสฝนพีคช่วง ${peakRainHour.time}` : 'ยังไม่จำเป็นต้องกังวลฝนมาก แต่ควรดูเรดาร์ก่อนเดินทางไกล',
    currentPm >= 37.5 ? 'ถ้าต้องออกกำลังกายกลางแจ้ง ให้ลดความหนักหรือเลือกพื้นที่โล่งลมผ่าน' : 'PM2.5 ยังพอเหมาะกับกิจกรรมทั่วไป',
    currentFeels >= 38 ? 'เลี่ยงงานหนักกลางแจ้งและพักในที่ร่มเป็นระยะ' : 'ออกนอกอาคารได้ แต่ควรดื่มน้ำให้เพียงพอ',
  ];
  const localPositionText = coords
    ? `พิกัดประมาณ ${Number(coords.lat).toFixed(3)}, ${Number(coords.lon).toFixed(3)}`
    : 'ใช้ตำแหน่งเริ่มต้นของระบบ';

  const mapInsights = [
    national.topRisk
      ? `จากข้อมูลแผนที่ จังหวัดที่ควรจับตาตอนนี้คือ ${national.topRisk.name} คะแนนความเสี่ยง ${national.topRisk.riskScore}/100 โดยมีปัจจัยร่วมจากความร้อน ฝุ่น ฝน และลม`
      : 'ข้อมูลแผนที่ยังไม่พบพื้นที่เสี่ยงเด่นชัดในรอบล่าสุด',
    rankings.pm25?.[0]
      ? `ฝุ่น PM2.5 สูงสุดอยู่ที่ ${rankings.pm25[0].name} ประมาณ ${rankings.pm25[0].val} µg/m³ จึงควรใช้เป็นพื้นที่เฝ้าระวังสุขภาพอันดับแรก`
      : 'ค่าฝุ่น PM2.5 ภาพรวมยังไม่มีจุดสูงผิดปกติจากสถานีที่อ่านได้',
    rankings.rain?.[0]
      ? `โอกาสฝนเด่นสุดอยู่แถว ${rankings.rain[0].name} ประมาณ ${rankings.rain[0].val}% ถ้าต้องเดินทางให้ตรวจเรดาร์ซ้ำก่อนออกจากบ้าน`
      : 'โอกาสฝนจากสถานีภาพรวมยังไม่เด่น แต่ควรดูเรดาร์ประกอบในพื้นที่ใกล้ตัว',
    gistdaSummary
      ? `ข้อมูลภัยพิบัติจาก GISTDA พร้อมใช้งาน สามารถเทียบกับฝุ่น ความร้อน และฝนเพื่อดูความเสี่ยงไฟป่า น้ำท่วม และภัยแล้งร่วมกัน`
      : 'ยังไม่มีชุดข้อมูล GISTDA ล่าสุดในรอบนี้ หน้าแผนที่จะใช้ข้อมูลอากาศและสถานีเป็นหลัก',
  ];

  const primaryAdvice = [
    currentFeels >= 38 ? 'เลี่ยงแดดช่วงเที่ยงถึงบ่าย และวางแผนงานกลางแจ้งเป็นช่วงสั้น' : 'กิจกรรมกลางแจ้งทำได้ดีขึ้นในช่วงเช้าหรือเย็น',
    currentRain >= 40 ? 'พกร่มหรือเสื้อกันฝน โดยเฉพาะช่วงบ่ายถึงเย็น' : 'ฝนไม่ใช่ปัจจัยหลักตอนนี้ แต่ควรดูเรดาร์ก่อนเดินทางไกล',
    currentPm >= 50 ? 'กลุ่มเด็ก ผู้สูงอายุ และผู้มีโรคทางเดินหายใจควรลดกิจกรรมกลางแจ้ง' : 'ฝุ่นยังอยู่ในระดับที่รับมือได้สำหรับคนทั่วไป',
    Number(currentUv) >= 8 ? 'รังสี UV สูง ควรใช้กันแดด หมวก หรือร่มเมื่ออยู่กลางแจ้งนาน' : 'UV ไม่สูงมาก แต่ยังควรป้องกันผิวตามปกติ',
  ];
  const forecastInsight = tomorrow
    ? `พรุ่งนี้คาดว่าอุณหภูมิ ${tomorrow.max}°/${tomorrow.min}° โอกาสฝน ${tomorrow.rain}% และ UV ${tomorrow.uv} ใช้เทียบกับวันนี้เพื่อวางแผนงานกลางแจ้งล่วงหน้า`
    : 'ยังไม่มีข้อมูลพรุ่งนี้เพียงพอสำหรับสรุปแนวโน้ม';

  return (
    <div className="hide-scrollbar" style={{
      background: 'var(--bg-app)',
      color: 'var(--text-main)',
      fontFamily: 'Sarabun, sans-serif',
      minHeight: '100%',
      padding: isMobile ? '14px' : '24px',
    }}>
      <Panel style={{
        background: 'linear-gradient(135deg, rgba(14,165,233,0.16), var(--bg-card) 48%, rgba(34,197,94,0.1))',
        marginBottom: '18px',
        padding: isMobile ? '18px' : '24px',
      }}>
        <div style={{ alignItems: 'flex-start', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#0ea5e9', fontSize: '0.76rem', fontWeight: 900, marginBottom: '6px' }}>ThaiWeather Analytics</div>
            <h1 style={{ color: 'var(--text-main)', fontSize: isMobile ? '1.32rem' : '1.75rem', lineHeight: 1.25, margin: 0 }}>
              ศูนย์วิเคราะห์อากาศเชิงลึก
            </h1>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.86rem', lineHeight: 1.6, margin: '8px 0 0', maxWidth: 760 }}>
              รวมสถิติย้อนหลัง ข้อมูลขณะนี้ แนวโน้มพยากรณ์ กิจกรรมที่เหมาะสม และความเสี่ยงจากหน้าแผนที่ไว้ในมุมมองเดียว
            </p>
          </div>
          <div style={{
            background: 'var(--analysis-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '18px',
            display: 'grid',
            gap: '4px',
            minWidth: isMobile ? '100%' : 230,
            padding: '12px 14px',
          }}>
            <span style={{ color: 'var(--text-sub)', fontSize: '0.72rem', fontWeight: 800 }}>ข้อมูลล่าสุด</span>
            <strong style={{ color: '#0f766e', fontSize: '0.86rem' }}>
              {lastUpdated ? new Date(lastUpdated).toLocaleString('th-TH') : new Date().toLocaleString('th-TH')}
            </strong>
            <span style={{ color: tmdAvailable ? '#16a34a' : '#f97316', fontSize: '0.72rem', fontWeight: 900 }}>
              {tmdAvailable ? 'TMD และสถานีพร้อมใช้งาน' : 'ใช้ข้อมูลสำรองบางส่วน'}
            </span>
          </div>
        </div>
        <OverallScore
          score={overallScore}
          meta={overallMeta}
          title={`คะแนนอากาศวันนี้: ${overallMeta.label}`}
          summary={`ปัจจัยที่ต้องดูเป็นพิเศษคือ ${topConcern.label} ส่วนภาพรวมตอนนี้อุณหภูมิ ${currentTemp}° รู้สึก ${currentFeels}° ฝน ${currentRain}% และ PM2.5 ${currentPm}`}
          details={topThreeActions}
          isMobile={isMobile}
        />
      </Panel>

      <PhaseLabel>ขณะนี้</PhaseLabel>
      <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(8, minmax(0, 1fr))', marginBottom: '18px' }}>
        <MetricCard icon="🌡️" label="อุณหภูมิ" value={`${currentTemp}°`} detail={`รู้สึก ${currentFeels}°`} meta={heatMeta(currentFeels)} accent="#f97316" />
        <MetricCard icon="🌫️" label="PM2.5" value={currentPm} detail="µg/m³" meta={pmMeta(currentPm)} accent="#22c55e" />
        <MetricCard icon="🌧️" label="โอกาสฝน" value={`${currentRain}%`} detail={tomorrow ? `พรุ่งนี้ ${tomorrow.rain}%` : 'แนวโน้ม 24 ชม.'} accent="#3b82f6" />
        <MetricCard icon="💨" label="ลม" value={currentWind} detail="km/h" accent="#8b5cf6" />
        <MetricCard icon="💧" label="ความชื้น" value={`${currentHumidity}%`} detail="ความชื้นสัมพัทธ์" accent="#06b6d4" />
        <MetricCard icon="☀️" label="รังสี UV" value={currentUv} detail={Number(currentUv) >= 8 ? 'สูง ควรป้องกัน' : 'ระดับใช้งานทั่วไป'} accent="#f59e0b" />
        <MetricCard icon="🧭" label="ความกดอากาศ" value={currentPressure || '-'} detail={currentPressure ? 'hPa' : 'ยังไม่มีข้อมูล'} accent="#64748b" />
        <MetricCard icon="👁️" label="ทัศนวิสัย" value={visibilityKm} detail="กม." accent="#14b8a6" />
      </div>

      <Panel style={{ marginBottom: '18px' }}>
        <SectionTitle icon="📍" title="วิเคราะห์ตำแหน่งปัจจุบันอย่างละเอียด" subtitle={`${localPositionText} · เทียบกับค่าเฉลี่ยสถานีและแนวโน้มรายชั่วโมง`} />
        <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: isMobile ? '1fr' : '1.05fr 0.95fr' }}>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{
              background: `linear-gradient(135deg, ${overallMeta.color}14, var(--bg-secondary))`,
              border: `1px solid ${overallMeta.color}30`,
              borderRadius: '18px',
              padding: '14px',
            }}>
              <div style={{ color: overallMeta.color, fontSize: '0.78rem', fontWeight: 950 }}>ภาพรวมเฉพาะจุดนี้</div>
              <div style={{ color: 'var(--text-main)', fontSize: '0.92rem', fontWeight: 850, lineHeight: 1.65, marginTop: '6px' }}>
                ตอนนี้พื้นที่นี้อยู่ระดับ {overallMeta.label} โดยปัจจัยที่กดคะแนนมากสุดคือ {topConcern.label}
                {' '}ถ้าต้องออกจากบ้าน ให้ดูช่วง {peakRainHour.rain >= 40 ? `ฝน ${peakRainHour.time}` : `ร้อน ${peakHeatHour.time}`} เป็นพิเศษ
              </div>
            </div>
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
              {localCompare.map((item) => (
                <div key={item.label} style={{ background: 'var(--bg-secondary)', border: `1px solid ${item.color}30`, borderRadius: '16px', padding: '12px' }}>
                  <div style={{ color: 'var(--text-sub)', fontSize: '0.7rem', fontWeight: 850 }}>{item.label}</div>
                  <div style={{ color: item.color, fontSize: '1.25rem', fontWeight: 950, marginTop: '6px' }}>{item.value}</div>
                  <div style={{ color: 'var(--text-main)', fontSize: '0.74rem', fontWeight: 760, lineHeight: 1.45, marginTop: '4px' }}>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '18px', padding: '14px' }}>
              <div style={{ color: 'var(--text-main)', fontSize: '0.86rem', fontWeight: 950, marginBottom: '10px' }}>ไทม์ไลน์ที่ควรจับตา</div>
              <div style={{ display: 'grid', gap: '9px' }}>
                {localRiskTimeline.map((item) => (
                  <div key={item.label} style={{ alignItems: 'center', display: 'grid', gap: '10px', gridTemplateColumns: '94px 1fr' }}>
                    <span style={{ color: item.color, fontSize: '0.74rem', fontWeight: 950 }}>{item.label}</span>
                    <span style={{ color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 780 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '18px', padding: '14px' }}>
              <div style={{ color: 'var(--text-main)', fontSize: '0.86rem', fontWeight: 950, marginBottom: '10px' }}>คำแนะนำเฉพาะพื้นที่นี้</div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {localActions.map((action, index) => (
                  <div key={action} style={{ alignItems: 'flex-start', display: 'flex', gap: '8px' }}>
                    <span style={{ alignItems: 'center', background: '#0ea5e91a', borderRadius: 999, color: '#0ea5e9', display: 'flex', flex: '0 0 24px', fontSize: '0.68rem', fontWeight: 950, height: 24, justifyContent: 'center' }}>{index + 1}</span>
                    <span style={{ color: 'var(--text-main)', fontSize: '0.76rem', fontWeight: 750, lineHeight: 1.5 }}>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* ─── Upper Air Wind Analysis (TMD + Gemini) ──────────────────── */}
      <PhaseLabel>วิเคราะห์ลมชั้นบนและโอกาสฝน</PhaseLabel>
      <Panel style={{ marginBottom: '18px', padding: isMobile ? '16px' : '20px' }}>
        {/* ── Header row ── */}
        <div style={{ alignItems: 'center', display: 'flex', gap: '10px', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ alignItems: 'center', color: 'var(--text-main)', display: 'flex', fontSize: '0.95rem', fontWeight: 900, gap: '7px' }}>
              🌬️ วิเคราะห์กระแสลมชั้นบนรายภูมิภาค
            </div>
            <div style={{ color: 'var(--text-sub)', fontSize: '0.68rem', marginTop: '3px' }}>
              ข้อมูล TMD Marine · Gemini {windAnalysis?.model || '2.5-flash'} · อัปเดตทุก 3 ชม.
              {windLastFetch && ` · ล่าสุด ${windLastFetch.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`}
            </div>
          </div>
          <button onClick={fetchWindAnalysis} disabled={windLoading} style={{ alignItems: 'center', background: windLoading ? 'var(--bg-secondary)' : 'linear-gradient(135deg,#0ea5e9,#2563eb)', border: 'none', borderRadius: '999px', color: windLoading ? 'var(--text-sub)' : '#fff', cursor: windLoading ? 'not-allowed' : 'pointer', display: 'flex', fontSize: '0.72rem', fontWeight: 900, gap: '5px', padding: '7px 13px' }}>
            {windLoading ? '⏳ วิเคราะห์...' : '🔄 รีเฟรช'}
          </button>
        </div>

        {windError && (
          <div style={{ background: '#ef444415', border: '1px solid #ef444430', borderRadius: '12px', color: '#ef4444', fontSize: '0.76rem', marginBottom: '12px', padding: '10px 12px' }}>
            ⚠️ {windError}
          </div>
        )}

        {windLoading && !windAnalysis && (
          <div style={{ alignItems: 'center', color: 'var(--text-sub)', display: 'flex', fontSize: '0.82rem', gap: '10px', justifyContent: 'center', padding: '28px 0' }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🌀</span>
            กำลังดึงข้อมูลลมชั้นบนและวิเคราะห์ด้วย AI...
          </div>
        )}

        {windAnalysis && (() => {
          const natPct = windAnalysis.nationalRainChance ?? 0;
          const forming = windAnalysis.rainForming || 'none';
          const formingConfig = {
            active:   { color: '#2563eb', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.3)', icon: '🌧️', label: 'ฝนตกอยู่ในหลายพื้นที่' },
            forming:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '⛅', label: 'กำลังก่อตัว' },
            possible: { color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', border: 'rgba(14,165,233,0.25)', icon: '🌤️', label: 'มีโอกาสเกิดฝน' },
            none:     { color: '#16a34a', bg: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.25)', icon: '☀️', label: 'ท้องฟ้าค่อนข้างแจ่มใส' },
          };
          const fc = formingConfig[forming] || formingConfig.none;
          const bkk = windAnalysis.bangkok || {};
          const bkkPct = bkk.rainChance ?? Math.round(natPct * 0.85);
          const bkkColor = bkkPct >= 65 ? '#2563eb' : bkkPct >= 40 ? '#3b82f6' : bkkPct >= 20 ? '#f59e0b' : '#16a34a';

          const rainEmoji = (pct) => pct >= 75 ? '⛈️' : pct >= 55 ? '🌧️' : pct >= 35 ? '🌦️' : pct >= 15 ? '🌤️' : '☀️';
          const rainColor = (pct) => pct >= 70 ? '#1d4ed8' : pct >= 50 ? '#2563eb' : pct >= 35 ? '#3b82f6' : pct >= 20 ? '#f59e0b' : '#16a34a';
          const rainBg = (pct) => pct >= 70 ? 'rgba(29,78,216,0.12)' : pct >= 50 ? 'rgba(37,99,235,0.1)' : pct >= 35 ? 'rgba(59,130,246,0.09)' : pct >= 20 ? 'rgba(245,158,11,0.09)' : 'rgba(22,163,74,0.08)';
          const rainBorder = (pct) => pct >= 70 ? 'rgba(29,78,216,0.28)' : pct >= 50 ? 'rgba(37,99,235,0.22)' : pct >= 35 ? 'rgba(59,130,246,0.2)' : pct >= 20 ? 'rgba(245,158,11,0.22)' : 'rgba(22,163,74,0.2)';

          const peakTimeMap = {
            morning: { label: 'เช้า', range: '06–11 น.', bars: [1,1,0,0,0,0,0,0] },
            afternoon: { label: 'บ่าย', range: '12–17 น.', bars: [0,0,1,1,1,0,0,0] },
            evening: { label: 'เย็น–ค่ำ', range: '17–22 น.', bars: [0,0,0,0,1,1,1,0] },
            night: { label: 'กลางคืน', range: '22–04 น.', bars: [0,0,0,0,0,0,1,1] },
            'all-day': { label: 'ตลอดวัน', range: 'ทั้งวัน', bars: [1,1,1,1,1,1,1,1] },
            none: { label: 'ไม่มีฝน', range: '–', bars: [0,0,0,0,0,0,0,0] },
          };
          const peakKey = windAnalysis.peakRainTime || 'none';
          const peak = peakTimeMap[peakKey] || peakTimeMap.none;
          const timeLabels = ['06', '09', '12', '15', '18', '21', '00', '03'];

          return (
            <>
              {/* ── Quick summary banner ── */}
              <div style={{ background: `linear-gradient(135deg, ${fc.bg}, var(--bg-secondary))`, border: `1px solid ${fc.border}`, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px', padding: '14px 16px' }}>
                <div style={{ fontSize: '2.2rem', flexShrink: 0 }}>{fc.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: fc.color, fontSize: '0.72rem', fontWeight: 950, marginBottom: '2px' }}>ตอนนี้ — {fc.label}</div>
                  <div style={{ color: 'var(--text-main)', fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 900, lineHeight: 1.3 }}>
                    {windAnalysis.quickSummary || windAnalysis.summary?.split(' ').slice(0, 12).join(' ') || '–'}
                  </div>
                  {windAnalysis.rainFormingDesc && (
                    <div style={{ color: 'var(--text-sub)', fontSize: '0.74rem', marginTop: '4px' }}>{windAnalysis.rainFormingDesc}</div>
                  )}
                </div>
                <div style={{ alignItems: 'center', background: `${fc.color}1a`, border: `1.5px solid ${fc.color}40`, borderRadius: '14px', display: 'flex', flexDirection: 'column', flexShrink: 0, justifyContent: 'center', minWidth: '72px', padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ color: fc.color, fontSize: '1.5rem', fontWeight: 950, lineHeight: 1 }}>{natPct}%</div>
                  <div style={{ color: 'var(--text-sub)', fontSize: '0.6rem', fontWeight: 800, marginTop: '2px' }}>ทั่วประเทศ</div>
                </div>
              </div>

              {/* ── Bangkok + Peak time row ── */}
              <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', marginBottom: '14px' }}>
                {/* Bangkok spotlight */}
                <div style={{ background: `linear-gradient(135deg, ${rainBg(bkkPct)}, var(--bg-secondary))`, border: `1px solid ${rainBorder(bkkPct)}`, borderRadius: '16px', padding: '14px' }}>
                  <div style={{ color: 'var(--text-sub)', fontSize: '0.68rem', fontWeight: 800, marginBottom: '8px' }}>🏙️ กรุงเทพฯ และปริมณฑล</div>
                  <div style={{ alignItems: 'flex-end', display: 'flex', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ color: bkkColor, fontSize: '2.4rem', fontWeight: 950, lineHeight: 1 }}>{bkkPct}%</div>
                    <div style={{ marginBottom: '4px' }}>
                      <div style={{ color: bkkColor, fontSize: '0.8rem', fontWeight: 900 }}>{bkk.status || (bkkPct >= 60 ? 'ฝนกระจาย' : bkkPct >= 35 ? 'มีโอกาสฝน' : 'ท้องฟ้าแจ่มใส')}</div>
                      <div style={{ color: 'var(--text-sub)', fontSize: '0.7rem', marginTop: '2px' }}>{bkk.action || (bkkPct >= 35 ? '🌂 แนะนำพกร่ม' : '✅ ไม่ต้องพกร่ม')}</div>
                    </div>
                  </div>
                  {bkk.detail && <div style={{ color: 'var(--text-sub)', fontSize: '0.7rem', lineHeight: 1.5, borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>{bkk.detail}</div>}
                </div>

                {/* Peak rain time bar */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '14px' }}>
                  <div style={{ color: 'var(--text-sub)', fontSize: '0.68rem', fontWeight: 800, marginBottom: '10px' }}>🕐 ช่วงเวลาที่คาดว่าฝนจะตก</div>
                  <div style={{ alignItems: 'flex-end', display: 'flex', gap: '4px', height: '46px', marginBottom: '6px' }}>
                    {timeLabels.map((t, i) => {
                      const active = peak.bars[i];
                      return (
                        <div key={t} style={{ alignItems: 'center', display: 'flex', flex: 1, flexDirection: 'column', gap: '4px' }}>
                          <div style={{ background: active ? '#3b82f6' : 'var(--border-color)', borderRadius: '4px 4px 2px 2px', height: active ? '32px' : '12px', transition: 'height 0.4s, background 0.4s', width: '100%' }} />
                          <div style={{ color: active ? '#3b82f6' : 'var(--text-sub)', fontSize: '0.55rem', fontWeight: active ? 900 : 600 }}>{t}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ color: '#3b82f6', fontSize: '0.78rem', fontWeight: 900 }}>
                    {peak.label} <span style={{ color: 'var(--text-sub)', fontWeight: 700 }}>({windAnalysis.peakRainTimeDesc || peak.range})</span>
                  </div>
                  <div style={{ color: 'var(--text-sub)', fontSize: '0.66rem', marginTop: '4px' }}>
                    {windAnalysis.mainDriver || ''}
                  </div>
                </div>
              </div>

              {/* ── Regional tiles ── */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ color: 'var(--text-sub)', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.05em', marginBottom: '8px', textTransform: 'uppercase' }}>โอกาสฝนรายภาค</div>
                <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}>
                  {(windAnalysis.regions || []).map((r) => {
                    const pct = Math.min(100, Math.max(0, r.rainChance ?? 0));
                    const c = rainColor(pct);
                    const bg = rainBg(pct);
                    const bdr = rainBorder(pct);
                    return (
                      <div key={r.name} style={{ background: bg, border: `1px solid ${bdr}`, borderRadius: '14px', padding: '11px 12px', position: 'relative', overflow: 'hidden' }}>
                        {/* fill bar background */}
                        <div style={{ background: `${c}18`, borderRadius: '0 0 14px 14px', bottom: 0, height: `${pct}%`, left: 0, position: 'absolute', right: 0, transition: 'height 0.7s ease' }} />
                        <div style={{ position: 'relative' }}>
                          <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{rainEmoji(pct)}</div>
                          <div style={{ color: 'var(--text-main)', fontSize: '0.74rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '6px' }}>{r.name}</div>
                          <div style={{ color: c, fontSize: '1.4rem', fontWeight: 950, lineHeight: 1 }}>{pct}<span style={{ fontSize: '0.65rem', fontWeight: 800 }}>%</span></div>
                          <div style={{ background: 'var(--bg-secondary)', borderRadius: '99px', height: '4px', marginTop: '6px', overflow: 'hidden' }}>
                            <div style={{ background: c, borderRadius: '99px', height: '100%', transition: 'width 0.7s ease', width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Alerts (if any) ── */}
              {windAnalysis.alerts?.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', marginBottom: '12px', padding: '10px 13px' }}>
                  <div style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 950, marginBottom: '5px' }}>⚠️ ข้อสังเกตสำคัญ</div>
                  {windAnalysis.alerts.map((a, i) => (
                    <div key={i} style={{ color: 'var(--text-main)', fontSize: '0.76rem', lineHeight: 1.55 }}>• {a}</div>
                  ))}
                </div>
              )}

              {/* ── Expandable technical details ── */}
              <button
                onClick={() => setWindDetailsOpen(o => !o)}
                style={{ alignItems: 'center', background: 'none', border: '1px solid var(--border-color)', borderRadius: '999px', color: 'var(--text-sub)', cursor: 'pointer', display: 'flex', fontSize: '0.72rem', fontWeight: 800, gap: '5px', padding: '6px 14px', width: '100%', justifyContent: 'center', marginBottom: windDetailsOpen ? '12px' : 0 }}
              >
                {windDetailsOpen ? '▲ ซ่อนรายละเอียดทางเทคนิค' : '▼ ดูรายละเอียดลมรายชั้นและปัจจัยเพิ่มเติม'}
              </button>

              {windDetailsOpen && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  {windAnalysis.summary && (
                    <div style={{ background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.18)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.78rem', lineHeight: 1.65, marginBottom: '12px', padding: '12px' }}>
                      <div style={{ color: '#0ea5e9', fontSize: '0.68rem', fontWeight: 900, marginBottom: '5px' }}>🔬 การวิเคราะห์เชิงเทคนิค</div>
                      {windAnalysis.summary}
                    </div>
                  )}
                  {windAnalysis.levelInsights?.length > 0 && (
                    <div style={{ display: 'grid', gap: '7px', gridTemplateColumns: isMobile ? '1fr' : `repeat(${Math.min(3, windAnalysis.levelInsights.length)}, 1fr)`, marginBottom: '12px' }}>
                      {windAnalysis.levelInsights.map((li) => (
                        <div key={li.level} style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: '11px', padding: '9px' }}>
                          <div style={{ color: '#0ea5e9', fontSize: '0.68rem', fontWeight: 950, marginBottom: '3px' }}>{li.level}</div>
                          <div style={{ color: 'var(--text-main)', fontSize: '0.7rem', lineHeight: 1.45 }}>{li.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '11px', padding: '9px' }}>
                      <div style={{ color: 'var(--text-sub)', fontSize: '0.62rem', fontWeight: 800 }}>เวลาอ้างอิง (UTC)</div>
                      <div style={{ color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 900, marginTop: '4px' }}>
                        {windAnalysis.synopticHourUTC != null ? `${String(windAnalysis.synopticHourUTC).padStart(2,'0')}:00 UTC` : '–'}
                      </div>
                      <div style={{ color: 'var(--text-sub)', fontSize: '0.65rem' }}>{windAnalysis.synopticHourUTC != null ? `${String((windAnalysis.synopticHourUTC + 7) % 24).padStart(2,'0')}:00 น. ไทย` : ''}</div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '11px', padding: '9px' }}>
                      <div style={{ color: 'var(--text-sub)', fontSize: '0.62rem', fontWeight: 800 }}>ความน่าเชื่อถือ AI</div>
                      <div style={{ color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 900, marginTop: '4px' }}>
                        {windAnalysis.confidence === 'high' ? '🟢 สูง' : windAnalysis.confidence === 'medium' ? '🟡 ปานกลาง' : '🔴 ต่ำ'}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '11px', padding: '9px' }}>
                      <div style={{ color: 'var(--text-sub)', fontSize: '0.62rem', fontWeight: 800 }}>แหล่งข้อมูล</div>
                      <div style={{ color: windAnalysis.tmdAvailable ? '#22c55e' : '#f97316', fontSize: '0.78rem', fontWeight: 900, marginTop: '4px' }}>
                        {windAnalysis.tmdAvailable ? '✅ TMD Marine' : '⚠️ ประมาณการ'}
                      </div>
                      <div style={{ color: 'var(--text-sub)', fontSize: '0.62rem' }}>{windAnalysis.imageCount > 0 ? `+ ${windAnalysis.imageCount} ภาพ` : 'ข้อความเท่านั้น'}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </Panel>

      <PhaseLabel>แนวโน้มและพยากรณ์</PhaseLabel>
      <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.35fr) minmax(360px, 0.85fr)', marginBottom: '18px' }}>
        <Panel>
          <SectionTitle icon="📈" title="เปรียบเทียบ Time Series" subtitle="ดูแนวโน้มราย 2 ชั่วโมง เพื่อจับจังหวะร้อน ฝน ฝุ่น และลมในวันเดียวกัน" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            {Object.entries(chartKeyMap).map(([key, item]) => (
              <button
                key={key}
                onClick={() => setChartMode(key)}
                style={{
                  background: chartMode === key ? item.color : 'var(--bg-secondary)',
                  border: `1px solid ${chartMode === key ? item.color : 'var(--border-color)'}`,
                  borderRadius: '999px',
                  color: chartMode === key ? '#fff' : 'var(--text-main)',
                  cursor: 'pointer',
                  fontSize: '0.76rem',
                  fontWeight: 900,
                  padding: '8px 12px',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div style={{ height: isMobile ? 250 : 320, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyRows} margin={{ bottom: 0, left: -18, right: 8, top: 12 }}>
                <defs>
                  <linearGradient id="analysisTrend" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor={activeChart.color} stopOpacity={0.34} />
                    <stop offset="95%" stopColor={activeChart.color} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: 'var(--text-sub)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'var(--text-sub)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area dataKey={activeChart.key} fill="url(#analysisTrend)" name={activeChart.label} stroke={activeChart.color} strokeWidth={3} type="monotone" />
                {chartMode === 'temp' && (
                  <Line dataKey="feels" dot={false} name="รู้สึกเหมือน" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} type="monotone" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <InsightBox color={activeChart.color} title="อ่านกราฟให้เร็ว">
            {chartInsight}
          </InsightBox>
        </Panel>

        <Panel>
          <SectionTitle icon="🧾" title="สรุปจากแผนที่" subtitle="แปลงข้อมูลพื้นที่เสี่ยงจากสถานีและหน้าแผนที่เป็นข้อความที่ตัดสินใจได้ทันที" />
          <div style={{ display: 'grid', gap: '10px' }}>
            {mapRiskCards.map((row, index) => (
              <div key={row.id} style={{
                background: row.riskMeta.bg,
                border: `1px solid ${row.riskMeta.border}`,
                borderRadius: '18px',
                padding: '12px',
              }}>
                <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'var(--text-main)', fontSize: '0.88rem', fontWeight: 950 }}>
                      {index + 1}. {row.name}
                    </div>
                    <div style={{ color: 'var(--text-sub)', fontSize: '0.72rem', fontWeight: 750, marginTop: '4px' }}>
                      {row.reasons.join(' · ')}
                    </div>
                  </div>
                  <div style={{ color: row.riskMeta.color, fontSize: '1.1rem', fontWeight: 950, textAlign: 'right' }}>
                    {row.riskScore}<span style={{ fontSize: '0.68rem' }}>/100</span>
                  </div>
                </div>
              </div>
            ))}
            <InsightBox color="#0ea5e9" title="สรุปจากข้อมูลแผนที่">
              {mapInsights[1]} {mapInsights[2]}
            </InsightBox>
          </div>
          <GistdaBrief summary={gistdaSummary} isMobile={isMobile} />
        </Panel>
      </div>

      <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', marginBottom: '18px' }}>
        <Panel>
          <SectionTitle icon="📅" title="แนวโน้ม 7 วัน" subtitle="รวมอุณหภูมิสูงสุด ต่ำสุด ความร้อน ฝน และ UV เพื่อดูภาพรวมทั้งสัปดาห์" />
          <div style={{ height: 280, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRows} margin={{ bottom: 0, left: -18, right: 10, top: 14 }}>
                <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-sub)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'var(--text-sub)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line dataKey="max" name="สูงสุด" stroke="#f97316" strokeWidth={3} type="monotone" />
                <Line dataKey="min" name="ต่ำสุด" stroke="#3b82f6" strokeWidth={3} type="monotone" />
                <Line dataKey="heat" name="ดัชนีความร้อน" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', marginTop: '12px' }}>
            {dailyRows.slice(0, 4).map((day) => (
              <div key={day.date} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '10px' }}>
                <div style={{ color: 'var(--text-main)', fontSize: '0.72rem', fontWeight: 900 }}>{day.day}</div>
                <div style={{ color: 'var(--text-sub)', fontSize: '0.66rem', marginTop: 2 }}>{day.date}</div>
                <div style={{ color: '#f97316', fontSize: '0.92rem', fontWeight: 950, marginTop: 8 }}>{day.max}° / {day.min}°</div>
                <div style={{ color: '#3b82f6', fontSize: '0.7rem', fontWeight: 800, marginTop: 4 }}>ฝน {day.rain}% · UV {day.uv}</div>
              </div>
            ))}
          </div>
          <InsightBox color="#f97316" title="แนวโน้มสำคัญ">
            {forecastInsight}
          </InsightBox>
        </Panel>

        <Panel>
          <SectionTitle icon="⚠️" title="ความเสี่ยงที่ควรรู้" subtitle="จัดกลุ่มความเสี่ยงให้อ่านง่าย พร้อมสิ่งที่ควรทำทันที" />
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
            {riskCards.map((risk) => {
              const meta = riskMeta(risk.score);
              return (
                <div key={risk.title} style={{ background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: '18px', padding: '14px' }}>
                  <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ alignItems: 'center', display: 'flex', gap: '8px', minWidth: 0 }}>
                      <span style={{ fontSize: '1.15rem' }}>{risk.icon}</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{risk.title}</strong>
                    </div>
                    <span style={{ color: risk.meta.color, fontSize: '0.74rem', fontWeight: 950 }}>{risk.meta.label}</span>
                  </div>
                  <div style={{ color: risk.meta.color, fontSize: '1.45rem', fontWeight: 950, marginTop: '10px' }}>{risk.value}</div>
                  <div style={{ color: 'var(--text-sub)', fontSize: '0.74rem', lineHeight: 1.55, marginTop: '6px' }}>{risk.text}</div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', marginBottom: '18px' }}>
        {isMobile ? (
          <Panel>
            <SectionTitle icon="🎯" title="กิจกรรมที่เหมาะตอนนี้" subtitle="สรุป 3 กิจกรรมสำคัญบนมือถือ ส่วน Radar เต็มเหมาะกับจอใหญ่" />
            <div style={{ display: 'grid', gap: '10px' }}>
              {compactActivities.map((item) => (
                <div key={item.title} style={{
                  alignItems: 'center',
                  background: `${item.color}10`,
                  border: `1px solid ${item.color}30`,
                  borderRadius: '16px',
                  display: 'grid',
                  gap: '10px',
                  gridTemplateColumns: '36px 1fr auto',
                  padding: '12px',
                }}>
                  <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'var(--text-main)', fontSize: '0.84rem', fontWeight: 950 }}>{item.title}</div>
                    <div style={{ color: 'var(--text-sub)', fontSize: '0.72rem', fontWeight: 750, marginTop: '3px' }}>{item.text}</div>
                  </div>
                  <div style={{ color: item.color, fontSize: '1rem', fontWeight: 950 }}>{item.score.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </Panel>
        ) : (
          <ActivityRecommendations
            current={{
              ...current,
              temp: currentTemp,
              feelsLike: currentFeels,
              rainProb: currentRain,
              windSpeed: currentWind,
              humidity: currentHumidity,
              pm25: currentPm,
            }}
            isMobile={isMobile}
            cardBg="var(--bg-card)"
            borderColor="var(--border-color)"
            subTextColor="var(--text-sub)"
          />
        )}

        <Panel>
          <SectionTitle icon="🧠" title="คำแนะนำแบบเข้าใจง่าย" subtitle="สรุปสิ่งที่ควรทำจากข้อมูลตอนนี้และแนวโน้มใกล้ตัว" />
          <div style={{ display: 'grid', gap: '10px' }}>
            {primaryAdvice.map((advice, index) => (
              <div key={advice} style={{
                alignItems: 'flex-start',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                display: 'flex',
                gap: '10px',
                padding: '12px',
              }}>
                <span style={{ alignItems: 'center', background: '#0ea5e91f', borderRadius: 999, color: '#0ea5e9', display: 'flex', flex: '0 0 28px', fontSize: '0.78rem', fontWeight: 950, height: 28, justifyContent: 'center' }}>{index + 1}</span>
                <span style={{ color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.58 }}>{advice}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <PhaseLabel>ย้อนหลังและพื้นที่เสี่ยง</PhaseLabel>
      <Panel style={{ marginBottom: '18px' }}>
        <SectionTitle icon="🕘" title="สถิติย้อนหลังเมื่อวาน" subtitle="แยกออกจากข้อมูลปัจจุบัน เพื่อให้เห็นว่าพื้นที่ไหนร้อนหรือฝุ่นเด่นในรอบก่อนหน้า" />
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))' }}>
          <RankingMini title="ร้อนสุดเมื่อวาน" items={rankings.yesterdayHeat.length ? rankings.yesterdayHeat : rankings.heat} unit="°" accent="#ef4444" />
          <RankingMini title="ฝุ่นสูงเมื่อวาน" items={rankings.yesterdayPm25.length ? rankings.yesterdayPm25 : rankings.pm25} unit="" accent="#f97316" />
          <RankingMini title="พื้นที่ฝนเด่นตอนนี้" items={rankings.rain} unit="%" accent="#3b82f6" />
          <RankingMini title="เย็นสุดจากสถานี" items={rankings.cool} unit="°" accent="#06b6d4" />
        </div>
      </Panel>

      <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', marginBottom: '18px' }}>
        <Panel>
          <SectionTitle icon="🏙️" title="จังหวัดที่ควรจับตา" subtitle={`วิเคราะห์จาก ${national.stationCount} สถานี โดยถ่วงน้ำหนักความร้อน ฝุ่น ฝน และลม`} />
          <div style={{ display: 'grid', gap: '10px' }}>
            {rankings.risk.map((row, index) => (
              <div key={row.id} style={{ alignItems: 'center', background: row.riskMeta.bg, border: `1px solid ${row.riskMeta.border}`, borderRadius: '16px', display: 'grid', gap: '10px', gridTemplateColumns: '34px 1fr auto', padding: '12px' }}>
                <span style={{ alignItems: 'center', background: 'var(--analysis-rank-badge)', borderRadius: 999, color: row.riskMeta.color, display: 'flex', fontSize: '0.78rem', fontWeight: 950, height: 30, justifyContent: 'center', width: 30 }}>{index + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: 'var(--text-main)', fontSize: '0.84rem', fontWeight: 950, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</div>
                  <div style={{ color: 'var(--text-sub)', fontSize: '0.7rem', marginTop: 3 }}>ร้อน {row.feelsLike}° · PM2.5 {row.pm25} · ฝน {row.rain}%</div>
                </div>
                <div style={{ color: row.riskMeta.color, fontSize: '0.86rem', fontWeight: 950, textAlign: 'right' }}>{row.riskScore}<span style={{ fontSize: '0.65rem' }}>/100</span></div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionTitle icon="📊" title="ภาพรวมจากสถานีทั้งหมด" subtitle="ตัวเลขเฉลี่ยช่วยให้เทียบพื้นที่เสี่ยงกับภาพรวมระดับประเทศได้ง่ายขึ้น" />
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)' }}>
            <MetricCard icon="🌡️" label="เฉลี่ยอุณหภูมิ" value={`${national.temp}°`} detail={`รู้สึกเฉลี่ย ${national.feelsLike}°`} accent="#f97316" />
            <MetricCard icon="🌫️" label="เฉลี่ย PM2.5" value={national.pm25} detail="จากสถานีที่อ่านได้" accent="#22c55e" />
            <MetricCard icon="🌧️" label="เฉลี่ยโอกาสฝน" value={`${national.rain}%`} detail={`ครอบคลุม ${national.stationCount} สถานี`} accent="#3b82f6" />
            <MetricCard icon="💨" label="เฉลี่ยลม" value={national.wind} detail="km/h" accent="#8b5cf6" />
            <MetricCard icon="💧" label="เฉลี่ยความชื้น" value={`${national.humidity}%`} detail="ความชื้นสัมพัทธ์" accent="#06b6d4" />
            <MetricCard icon="🏙️" label="พื้นที่เสี่ยงสุด" value={national.topRisk?.name || '-'} detail={national.topRisk ? `${national.topRisk.riskScore}/100` : 'ยังไม่พบ'} accent={national.topRisk?.riskMeta?.color || '#0ea5e9'} />
          </div>
        </Panel>
      </div>

      <Panel style={{ marginBottom: '6px' }}>
        <SectionTitle icon="🌧️" title="ฝน 24 ชั่วโมงข้างหน้า" subtitle="ดูช่วงที่ฝนน่าจะเริ่มแรงขึ้นและเทียบกับความชื้นในอากาศ" />
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyRows} margin={{ bottom: 0, left: -18, right: 10, top: 14 }}>
              <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-sub)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'var(--text-sub)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rain" name="โอกาสฝน" radius={[8, 8, 0, 0]}>
                {hourlyRows.map((row) => (
                  <Cell key={row.time} fill={row.rain >= 60 ? '#2563eb' : row.rain >= 35 ? '#60a5fa' : '#bfdbfe'} />
                ))}
              </Bar>
              <Line dataKey="humidity" name="ความชื้น" stroke="#14b8a6" strokeWidth={2} type="monotone" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
