import React, { useState, useEffect, useContext } from 'react';
import { WeatherContext } from '../context/WeatherContext';

// ── WMO Weather Codes (Thai) ──────────────────────
const WMO = {
  0:  { label: 'ท้องฟ้าแจ่มใส',            icon: '☀️' },
  1:  { label: 'ส่วนใหญ่แจ่มใส',           icon: '🌤️' },
  2:  { label: 'มีเมฆบางส่วน',             icon: '⛅' },
  3:  { label: 'มีเมฆมาก',               icon: '☁️' },
  45: { label: 'หมอก',                 icon: '🌫️' },
  48: { label: 'หมอกเยือกแข็ง',            icon: '🌫️' },
  51: { label: 'ฝนปรอยเบา',              icon: '🌦️' },
  53: { label: 'ฝนปรอยปานกลาง',           icon: '🌦️' },
  55: { label: 'ฝนปรอยหนัก',             icon: '🌧️' },
  61: { label: 'ฝนเล็กน้อย',             icon: '🌦️' },
  63: { label: 'ฝนปานกลาง',             icon: '🌧️' },
  65: { label: 'ฝนหนัก',               icon: '🌧️' },
  80: { label: 'ฝนตกเป็นช่วงๆ เบา',       icon: '🌦️' },
  81: { label: 'ฝนตกเป็นช่วงๆ',          icon: '🌧️' },
  82: { label: 'ฝนตกหนักเป็นช่วงๆ',      icon: '⛈️' },
  95: { label: 'พายุฝนฟ้าคะนอง',         icon: '⛈️' },
  96: { label: 'พายุฝนฟ้าคะนอง + ลูกเห็บ', icon: '⛈️' },
  99: { label: 'พายุรุนแรง + ลูกเห็บ',    icon: '⛈️' },
};
const getWMO = (code) => WMO[code] || { label: `สภาพอากาศ (${code})`, icon: '🌡️' };

// ── Disaster types ────────────────────────────────
const DISASTER_TYPES = {
  'Earthquake':       { icon: '🌋', color: '#ef4444' },
  'Flood':            { icon: '🌊', color: '#3b82f6' },
  'Tropical Cyclone': { icon: '🌀', color: '#8b5cf6' },
  'Drought':          { icon: '🏜️', color: '#f59e0b' },
  'Wild Fire':        { icon: '🔥', color: '#f97316' },
  'Tsunami':          { icon: '🌊', color: '#0ea5e9' },
  'Landslide':        { icon: '⛰️', color: '#78716c' },
  'Cold Wave':        { icon: '❄️', color: '#06b6d4' },
  'Heat Wave':        { icon: '🌡️', color: '#f97316' },
  'Storm Surge':      { icon: '🌊', color: '#0ea5e9' },
  'Volcano':          { icon: '🌋', color: '#dc2626' },
  'default':          { icon: '⚠️', color: '#94a3b8' },
};
const getDisasterInfo = (types) => {
  if (!types?.length) return DISASTER_TYPES.default;
  return DISASTER_TYPES[types[0]?.name] || DISASTER_TYPES.default;
};

// ── Thai days / months ────────────────────────────
const THAI_DAYS  = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                     'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

const formatDateThai = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
};
const formatTs = (ts) => {
  if (!ts) return '-';
  const d = new Date(ts);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')} น.`;
};

// ── UV / Mag helpers ──────────────────────────────
const getUV = (uv) => {
  if (uv >= 11) return { text: 'รุนแรงสุดขีด', color: '#9333ea' };
  if (uv >= 8)  return { text: 'รุนแรงมาก',    color: '#ef4444' };
  if (uv >= 6)  return { text: 'สูง',          color: '#f97316' };
  if (uv >= 3)  return { text: 'ปานกลาง',      color: '#f59e0b' };
  return { text: 'ต่ำ', color: '#22c55e' };
};
const getMagColor = (m) => m >= 7 ? '#ef4444' : m >= 6 ? '#f97316' : m >= 5 ? '#f59e0b' : '#22c55e';
const getMagLabel = (m) => m >= 7 ? 'รุนแรงมาก' : m >= 6 ? 'รุนแรง' : m >= 5 ? 'ปานกลาง' : 'เล็กน้อย';
const getStatusBadge = (s) => ({
  ongoing: { text: 'กำลังเกิดขึ้น', color: '#ef4444' },
  alert:   { text: 'แจ้งเตือน',     color: '#f59e0b' },
  past:    { text: 'ผ่านมาแล้ว',    color: '#94a3b8' },
}[s] || { text: s || 'ไม่ระบุ', color: '#94a3b8' });

// ── Auto-generate weather briefing text ───────────
const genBriefing = (daily, idx = 0) => {
  if (!daily) return null;
  const max  = daily.temperature_2m_max?.[idx];
  const min  = daily.temperature_2m_min?.[idx];
  const rain = daily.precipitation_probability_max?.[idx];
  const wmo  = getWMO(daily.weathercode?.[idx]);
  const wind = daily.windspeed_10m_max?.[idx];
  let txt = `${wmo.label}`;
  if (max != null) txt += ` อุณหภูมิสูงสุด ${max}°C ต่ำสุด ${min}°C`;
  if (rain > 0)   txt += ` โอกาสฝน ${rain}%`;
  if (wind > 30)  txt += ` ลมแรง ${wind} กม./ชม.`;
  return txt;
};

const genWeeklyOutlook = (daily) => {
  if (!daily?.weathercode) return null;
  const rainyDays = daily.precipitation_probability_max.filter(p => p >= 50).length;
  const maxTemp   = Math.max(...daily.temperature_2m_max);
  const minTemp   = Math.min(...daily.temperature_2m_min);
  const totalRain = daily.precipitation_sum.reduce((a, b) => a + b, 0).toFixed(1);
  const hasStorm  = daily.weathercode.some(c => c >= 95);
  return { rainyDays, maxTemp, minTemp, totalRain, hasStorm };
};

// ── GDACS event types ─────────────────────────────
const GDACS_EVENT = {
  EQ: { label: 'แผ่นดินไหว', icon: '🌋', color: '#ef4444' },
  FL: { label: 'น้ำท่วม',    icon: '🌊', color: '#3b82f6' },
  TC: { label: 'พายุหมุน',   icon: '🌀', color: '#8b5cf6' },
  WF: { label: 'ไฟป่า',     icon: '🔥', color: '#f97316' },
  VO: { label: 'ภูเขาไฟ',   icon: '🌋', color: '#dc2626' },
  DR: { label: 'ภัยแล้ง',   icon: '🏜️', color: '#f59e0b' },
  TS: { label: 'สึนามิ',    icon: '🌊', color: '#0ea5e9' },
};
const GDACS_ALERT_COLOR = { Red: '#ef4444', Orange: '#f97316', Green: '#22c55e' };
const gdacsEvent = (type) => GDACS_EVENT[type] || { label: type || 'ภัยพิบัติ', icon: '⚠️', color: '#94a3b8' };
const gdacsAlertScore = (lvl) => ({ Red: 3, Orange: 2, Green: 1 }[lvl] || 0);

// ── RSS parsers ───────────────────────────────────
const parseRSS = (xmlText) => {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  return Array.from(doc.querySelectorAll('item')).map(item => {
    const get = (tag) => item.querySelector(tag)?.textContent?.trim() || '';
    const descClean = get('description').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return { title: get('title'), desc: descClean, pubDate: get('pubDate'), link: get('link') };
  });
};

const parseGDACS = (xmlText) => {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  return Array.from(doc.querySelectorAll('item')).map(item => {
    const get  = (tag) => item.querySelector(tag)?.textContent?.trim() || '';
    // getElementsByTagName handles namespace prefixes (gdacs:alertlevel, etc.)
    const getNS = (name) => item.getElementsByTagName(name)[0]?.textContent?.trim() || '';
    return {
      title:      get('title'),
      desc:       get('description').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      pubDate:    get('pubDate'),
      link:       get('link') || get('guid'),
      alertLevel: getNS('gdacs:alertlevel') || getNS('alertlevel'),
      country:    getNS('gdacs:country')    || getNS('country'),
      eventType:  getNS('gdacs:eventtype')  || getNS('eventtype'),
    };
  });
};

const ALLORIGINS = (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

const fetchRSS = async (url, parser = parseRSS) => {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('direct');
    return parser(await r.text());
  } catch {
    const r = await fetch(ALLORIGINS(url));
    if (!r.ok) throw new Error('proxy');
    return parser(await r.text());
  }
};

// ── Refresh intervals ─────────────────────────────
const WEATHER_INTERVAL_MS = 30 * 60 * 1000;  // 30 นาที
const TMD_INTERVAL_MS     = 30 * 60 * 1000;  // 30 นาที
const GDACS_INTERVAL_MS   = 15 * 60 * 1000;  // 15 นาที
const EQ_INTERVAL_MS      = 5  * 60 * 1000;  // 5 นาที
const RELIEF_INTERVAL_MS  = 15 * 60 * 1000;  // 15 นาที

// ── Sub-components ────────────────────────────────
const LoadingBox = ({ subTextColor }) => (
  <div style={{ textAlign: 'center', padding: '40px 20px', color: subTextColor }}>
    <div style={{ fontSize: '2rem', marginBottom: '10px', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>⏳</div>
    <div style={{ fontSize: '0.9rem' }}>กำลังโหลดข้อมูล...</div>
  </div>
);

const ErrorBox = ({ msg }) => (
  <div style={{ background: 'var(--bg-danger)', borderRadius: '12px', padding: '16px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
    <span style={{ fontSize: '1.4rem' }}>⚠️</span>
    <span style={{ fontSize: '0.88rem' }}>{msg}</span>
  </div>
);

const EmptyBox = ({ icon, title, desc, textColor, subTextColor, cardBg, borderColor }) => (
  <div style={{ background: cardBg, borderRadius: '16px', padding: '30px', textAlign: 'center', border: `1px solid ${borderColor}` }}>
    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{icon}</div>
    <div style={{ color: textColor, fontWeight: 'bold', fontSize: '1rem' }}>{title}</div>
    {desc && <div style={{ color: subTextColor, fontSize: '0.82rem', marginTop: '6px', lineHeight: 1.6 }}>{desc}</div>}
  </div>
);

const SectionHeader = ({ title, lastTime, onRefresh, loading, source, textColor, subText, borderColor }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '6px' }}>
    <h3 style={{ margin: 0, fontSize: '1rem', color: textColor, fontWeight: 800 }}>{title}</h3>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {lastTime && (
        <span style={{ fontSize: '0.68rem', color: subText }}>
          อัพเดท {lastTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            background: 'var(--bg-secondary)', border: `1px solid ${borderColor}`,
            borderRadius: '8px', padding: '4px 10px', cursor: 'pointer',
            color: textColor, fontSize: '0.72rem', fontWeight: 'bold',
            opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s',
            fontFamily: 'Sarabun, sans-serif',
          }}
        >
          {loading ? '⏳' : '🔄'} รีเฟรช
        </button>
      )}
      {source && <span style={{ fontSize: '0.68rem', color: subText }}>{source}</span>}
    </div>
  </div>
);

// ══════════════════════════════════════════════════
//  NewsPage — สรุปข่าวอากาศ & ภัยพิบัติ
// ══════════════════════════════════════════════════
export default function NewsPage() {
  const { darkMode } = useContext(WeatherContext);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState('weather');

  // ── Open-Meteo (Bangkok forecast) ───────────────
  const [forecast,       setForecast]       = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [errorWeather,   setErrorWeather]   = useState(null);
  const [lastWeather,    setLastWeather]    = useState(null);

  // ── TMD RSS ───────────────────────────────────────
  const [tmdForecast,   setTmdForecast]   = useState([]);
  const [tmdWarnings,   setTmdWarnings]   = useState([]);
  const [tmdStorm,      setTmdStorm]      = useState([]);
  const [tmdQuake,      setTmdQuake]      = useState([]);
  const [loadingTMD,    setLoadingTMD]    = useState(true);
  const [errorTMD,      setErrorTMD]      = useState(null);
  const [lastTMD,       setLastTMD]       = useState(null);

  // ── GDACS global alerts ───────────────────────────
  const [gdacsAlerts,   setGdacsAlerts]   = useState([]);
  const [loadingGDACS,  setLoadingGDACS]  = useState(true);
  const [errorGDACS,    setErrorGDACS]    = useState(null);
  const [lastGDACS,     setLastGDACS]     = useState(null);

  // ── USGS Earthquakes ─────────────────────────────
  const [earthquakes, setEarthquakes] = useState([]);
  const [loadingEq,   setLoadingEq]   = useState(true);
  const [errorEq,     setErrorEq]     = useState(null);
  const [lastEq,      setLastEq]      = useState(null);

  // ── ReliefWeb Thai ───────────────────────────────
  const [thaiDisasters, setThaiDisasters] = useState([]);
  const [loadingThai,   setLoadingThai]   = useState(true);
  const [errorThai,     setErrorThai]     = useState(null);
  const [lastThai,      setLastThai]      = useState(null);

  // ── ReliefWeb Global ─────────────────────────────
  const [globalDisasters, setGlobalDisasters] = useState([]);
  const [loadingGlobal,   setLoadingGlobal]   = useState(true);
  const [errorGlobal,     setErrorGlobal]     = useState(null);
  const [lastGlobal,      setLastGlobal]      = useState(null);

  // ── theme ────────────────────────────────────────
  const appBg       = 'var(--bg-app)';
  const cardBg      = 'var(--bg-card)';
  const textColor   = 'var(--text-main)';
  const borderColor = 'var(--border-color)';
  const subText     = 'var(--text-sub)';

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Fetch: Open-Meteo (Bangkok) ──────────────────
  const fetchWeather = () => {
    setLoadingWeather(true); setErrorWeather(null);
    fetch(
      'https://api.open-meteo.com/v1/forecast' +
      '?latitude=13.7563&longitude=100.5018' +
      '&daily=weathercode,temperature_2m_max,temperature_2m_min,' +
      'precipitation_sum,precipitation_probability_max,windspeed_10m_max,uv_index_max' +
      '&current_weather=true' +
      '&timezone=Asia%2FBangkok&forecast_days=7'
    )
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setForecast(data); setLastWeather(new Date()); })
      .catch(() => setErrorWeather('ไม่สามารถดึงข้อมูลพยากรณ์อากาศได้ กรุณาลองใหม่ภายหลัง'))
      .finally(() => setLoadingWeather(false));
  };

  // ── Fetch: TMD RSS (4 feeds) ─────────────────────
  const fetchTMD = async () => {
    setLoadingTMD(true); setErrorTMD(null);
    const cutoff = Date.now() - 7 * 86400_000;
    const recent = (items) => items.filter(w => {
      const t = new Date(w.pubDate).getTime();
      return !isNaN(t) && t >= cutoff;
    });
    try {
      const [fcst, warn, storm, quake] = await Promise.all([
        fetchRSS('https://www.tmd.go.th/api/xml/region-daily-forecast?regionid=7'),
        fetchRSS('https://www.tmd.go.th/api/xml/warning-news'),
        fetchRSS('https://www.tmd.go.th/api/xml/storm-tracking'),
        fetchRSS('https://www.tmd.go.th/api/xml/earthquake-report'),
      ]);
      setTmdForecast(fcst);
      setTmdWarnings(recent(warn));
      setTmdStorm(recent(storm).slice(0, 5));
      setTmdQuake(recent(quake).slice(0, 10));
      setLastTMD(new Date());
    } catch {
      setErrorTMD('ไม่สามารถดึงข้อมูล TMD ได้ กรุณาลองใหม่ภายหลัง');
    } finally {
      setLoadingTMD(false);
    }
  };

  // ── Fetch: GDACS global alerts ────────────────────
  const fetchGDACS = async () => {
    setLoadingGDACS(true); setErrorGDACS(null);
    const cutoff = Date.now() - 7 * 86400_000;
    try {
      const items = await fetchRSS('https://www.gdacs.org/xml/rss.xml', parseGDACS);
      const filtered = items
        .filter(it => new Date(it.pubDate).getTime() >= cutoff)
        .sort((a, b) => gdacsAlertScore(b.alertLevel) - gdacsAlertScore(a.alertLevel)
                      || new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 30);
      setGdacsAlerts(filtered);
      setLastGDACS(new Date());
    } catch {
      setErrorGDACS('ไม่สามารถดึงข้อมูล GDACS ได้ กรุณาลองใหม่ภายหลัง');
    } finally {
      setLoadingGDACS(false);
    }
  };

  // ── Fetch: USGS ──────────────────────────────────
  const fetchEarthquakes = () => {
    setLoadingEq(true); setErrorEq(null);
    fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        setEarthquakes((data.features || []).sort((a, b) => b.properties.time - a.properties.time));
        setLastEq(new Date());
      })
      .catch(() => setErrorEq('ไม่สามารถดึงข้อมูลแผ่นดินไหวได้ กรุณาลองใหม่ภายหลัง'))
      .finally(() => setLoadingEq(false));
  };

  // ── Fetch: ReliefWeb Thai ────────────────────────
  const fetchThaiDisasters = () => {
    setLoadingThai(true); setErrorThai(null);
    fetch('https://api.reliefweb.int/v1/disasters?appname=airqualitythai&limit=20&sort[]=date.created:desc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: { include: ['name', 'date', 'country', 'type', 'status'] },
        filter: { field: 'primary_country.iso3', value: 'tha' },
      }),
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setThaiDisasters(data.data || []); setLastThai(new Date()); })
      .catch(() => setErrorThai('ไม่สามารถดึงข้อมูลภัยพิบัติไทยได้ กรุณาลองใหม่ภายหลัง'))
      .finally(() => setLoadingThai(false));
  };

  // ── Fetch: ReliefWeb Global ──────────────────────
  const fetchGlobalDisasters = () => {
    setLoadingGlobal(true); setErrorGlobal(null);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString().split('T')[0];
    fetch('https://api.reliefweb.int/v1/disasters?appname=airqualitythai&limit=30&sort[]=date.created:desc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: { include: ['name', 'date', 'country', 'type', 'status'] },
        filter: { operator: 'AND', conditions: [{ field: 'date.created', value: { from: sevenDaysAgo } }] },
      }),
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setGlobalDisasters(data.data || []); setLastGlobal(new Date()); })
      .catch(() => setErrorGlobal('ไม่สามารถดึงข้อมูลภัยพิบัติโลกได้ กรุณาลองใหม่ภายหลัง'))
      .finally(() => setLoadingGlobal(false));
  };

  // ── Initial fetch + auto-refresh ────────────────
  useEffect(() => {
    fetchWeather();
    const id = setInterval(fetchWeather, WEATHER_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetchTMD();
    const id = setInterval(fetchTMD, TMD_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetchGDACS();
    const id = setInterval(fetchGDACS, GDACS_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetchEarthquakes();
    const id = setInterval(fetchEarthquakes, EQ_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetchThaiDisasters();
    const id = setInterval(fetchThaiDisasters, RELIEF_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetchGlobalDisasters();
    const id = setInterval(fetchGlobalDisasters, RELIEF_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // ── Tab config ───────────────────────────────────
  const tabs = [
    { id: 'weather', label: 'พยากรณ์อากาศ', shortLabel: 'อากาศ',   icon: '☀️' },
    { id: 'thai',    label: 'ภัยพิบัติไทย',  shortLabel: 'ไทย',     icon: '🇹🇭' },
    { id: 'global',  label: 'ภัยพิบัติโลก',  shortLabel: 'โลก',     icon: '🌍' },
  ];

  // ── Derived weather data ─────────────────────────
  const daily   = forecast?.daily;
  const today   = daily ? getWMO(daily.weathercode?.[0]) : null;
  const weekly  = daily ? genWeeklyOutlook(daily) : null;
  const nowDate = new Date();

  // ── Render ───────────────────────────────────────
  return (
    <div
      className="hide-scrollbar"
      style={{
        height: '100%', width: '100%', background: appBg,
        display: 'flex', justifyContent: 'center',
        overflowY: 'auto', fontFamily: 'Sarabun, sans-serif',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        .nhover { transition: transform 0.18s, box-shadow 0.18s; cursor: pointer; }
        .nhover:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.18); }
      `}} />

      <div style={{
        width: '100%', maxWidth: isMobile ? '600px' : '960px',
        display: 'flex', flexDirection: 'column',
        gap: isMobile ? '14px' : '20px',
        padding: isMobile ? '15px' : '28px',
        paddingBottom: '60px',
      }}>

        {/* ══ Hero ══ */}
        <div style={{
          background: 'linear-gradient(135deg, #0369a1 0%, #1d4ed8 55%, #4f46e5 100%)',
          borderRadius: isMobile ? '20px' : '26px',
          padding: isMobile ? '18px' : '26px 28px',
          color: '#fff',
          boxShadow: '0 10px 40px rgba(14,165,233,0.3)',
        }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.35rem' : '1.8rem', fontWeight: 900, lineHeight: 1.3 }}>
            📰 สรุปข่าวอากาศและภัยพิบัติ
          </h1>
          <p style={{ margin: '6px 0 12px', fontSize: isMobile ? '0.8rem' : '0.88rem', opacity: 0.88, lineHeight: 1.6 }}>
            พยากรณ์อากาศประจำวัน · ภัยพิบัติในและต่างประเทศรอบ 7 วัน · ข้อมูลจากแหล่งทางการ
          </p>
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
            {['🌤️ กรมอุตุนิยมวิทยา', '☀️ Open-Meteo', '🚨 GDACS', '🌋 USGS', '🌐 ReliefWeb'].map(t => (
              <span key={t} style={{
                background: 'rgba(255,255,255,0.18)', padding: '2px 10px',
                borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold',
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* ══ Tab Bar ══ */}
        <div style={{
          display: 'flex', gap: '8px',
          background: cardBg, padding: '7px',
          borderRadius: '16px', border: `1px solid ${borderColor}`,
        }}>
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: isMobile ? '9px 4px' : '11px 14px',
                  borderRadius: '11px',
                  background: active ? '#0ea5e9' : 'transparent',
                  color: active ? '#fff' : subText,
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'Sarabun, sans-serif',
                  fontWeight: 'bold',
                  fontSize: isMobile ? '0.74rem' : '0.87rem',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  boxShadow: active ? '0 4px 14px rgba(14,165,233,0.4)' : 'none',
                }}
              >
                <span>{tab.icon}</span>
                <span>{isMobile ? tab.shortLabel : tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════
            TAB 1 — พยากรณ์อากาศ
        ══════════════════════════════ */}
        {activeTab === 'weather' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── TMD Official Forecast Card ── */}
            <div style={{
              background: cardBg, borderRadius: '20px',
              padding: isMobile ? '16px' : '22px',
              border: `1px solid ${borderColor}`,
            }}>
              <SectionHeader
                title="🌤️ พยากรณ์อากาศทางการ — กรมอุตุนิยมวิทยา"
                lastTime={lastTMD}
                onRefresh={fetchTMD}
                loading={loadingTMD}
                source="TMD RSS"
                textColor={textColor} subText={subText} borderColor={borderColor}
              />

              {loadingTMD && <LoadingBox subTextColor={subText} />}
              {errorTMD   && <ErrorBox msg={errorTMD} />}

              {!loadingTMD && !errorTMD && tmdForecast.length === 0 && (
                <EmptyBox
                  icon="📭"
                  title="ไม่พบข้อมูลพยากรณ์จาก TMD"
                  textColor={textColor} subTextColor={subText}
                  cardBg="var(--bg-secondary)" borderColor={borderColor}
                />
              )}

              {!loadingTMD && tmdForecast.map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: 'linear-gradient(135deg,rgba(59,130,246,0.1),rgba(14,165,233,0.07))',
                    borderRadius: '14px', padding: '14px 16px',
                    borderLeft: '4px solid #3b82f6',
                    marginBottom: i < tmdForecast.length - 1 ? '10px' : 0,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: textColor, lineHeight: 1.4 }}>
                      📋 {item.title}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: subText, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {item.pubDate ? new Date(item.pubDate).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  {item.desc && (
                    <div style={{ fontSize: '0.84rem', color: textColor, lineHeight: 1.75 }}>
                      {item.desc}
                    </div>
                  )}
                </div>
              ))}

              {/* TMD Warnings section — show only if any exist */}
              {!loadingTMD && tmdWarnings.length > 0 && (
                <>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#f59e0b', margin: '14px 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ⚠️ ประกาศเตือนภัยจาก TMD (7 วันล่าสุด)
                  </div>
                  {tmdWarnings.map((w, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'rgba(245,158,11,0.08)',
                        borderRadius: '12px', padding: '12px 14px',
                        borderLeft: '4px solid #f59e0b',
                        marginBottom: i < tmdWarnings.length - 1 ? '8px' : 0,
                      }}
                    >
                      <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: textColor, marginBottom: '4px' }}>
                        🚨 {w.title}
                      </div>
                      {w.desc && (
                        <div style={{ fontSize: '0.79rem', color: subText, lineHeight: 1.65 }}>
                          {w.desc.length > 300 ? w.desc.slice(0, 300) + '…' : w.desc}
                        </div>
                      )}
                      <div style={{ fontSize: '0.64rem', color: subText, marginTop: '5px' }}>
                        {w.pubDate ? new Date(w.pubDate).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Storm tracking — show if any recent items */}
              {!loadingTMD && tmdStorm.length > 0 && (
                <>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#8b5cf6', margin: '14px 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🌀 ติดตามพายุและสถานการณ์สำคัญ (TMD)
                  </div>
                  {tmdStorm.map((s, i) => (
                    <div key={i} style={{
                      background: 'rgba(139,92,246,0.08)',
                      borderRadius: '12px', padding: '12px 14px',
                      borderLeft: '4px solid #8b5cf6',
                      marginBottom: i < tmdStorm.length - 1 ? '8px' : 0,
                    }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: textColor, marginBottom: '3px' }}>
                        {s.title}
                      </div>
                      {s.desc && (
                        <div style={{ fontSize: '0.78rem', color: subText, lineHeight: 1.65 }}>
                          {s.desc.length > 250 ? s.desc.slice(0, 250) + '…' : s.desc}
                        </div>
                      )}
                      <div style={{ fontSize: '0.63rem', color: subText, marginTop: '4px' }}>
                        {s.pubDate ? new Date(s.pubDate).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  ))}
                </>
              )}

              <div style={{ textAlign: 'right', marginTop: '12px' }}>
                <a
                  href="https://www.tmd.go.th/forecast/sevenday"
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: '#3b82f6', fontSize: '0.76rem', textDecoration: 'none', fontWeight: 'bold' }}
                >
                  อ่านพยากรณ์เต็มฉบับจาก TMD →
                </a>
              </div>
            </div>

            {/* ── Today Summary Card ── */}
            <div style={{
              background: cardBg, borderRadius: '20px',
              padding: isMobile ? '16px' : '22px',
              border: `1px solid ${borderColor}`,
            }}>
              <SectionHeader
                title="☀️ สรุปอากาศกรุงเทพฯ วันนี้ (Open-Meteo)"
                lastTime={lastWeather}
                onRefresh={fetchWeather}
                loading={loadingWeather}
                source="Open-Meteo"
                textColor={textColor} subText={subText} borderColor={borderColor}
              />

              {loadingWeather && <LoadingBox subTextColor={subText} />}
              {errorWeather   && <ErrorBox msg={errorWeather} />}

              {!loadingWeather && !errorWeather && daily && (() => {
                const wmo     = getWMO(daily.weathercode[0]);
                const maxT    = daily.temperature_2m_max[0];
                const minT    = daily.temperature_2m_min[0];
                const rain    = daily.precipitation_probability_max[0];
                const rainSum = daily.precipitation_sum[0];
                const wind    = daily.windspeed_10m_max[0];
                const uv      = daily.uv_index_max[0];
                const uvInfo  = getUV(uv);
                const briefing = genBriefing(daily, 0);
                return (
                  <div>
                    {/* Briefing text */}
                    <div style={{
                      background: 'linear-gradient(135deg,rgba(14,165,233,0.12),rgba(79,70,229,0.1))',
                      borderRadius: '14px', padding: '14px 16px',
                      marginBottom: '16px',
                      borderLeft: '4px solid #0ea5e9',
                    }}>
                      <div style={{ fontSize: '0.7rem', color: subText, marginBottom: '4px' }}>
                        📡 สรุปพยากรณ์อากาศ ·{' '}
                        {nowDate.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.92rem', color: textColor, fontWeight: 'bold', lineHeight: 1.6 }}>
                        {wmo.icon} {briefing}
                      </div>
                      {rain >= 50 && (
                        <div style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: '5px', fontWeight: 'bold' }}>
                          ⚠️ ควรพกร่มและระวังน้ำท่วมฉับพลันในพื้นที่ลุ่มต่ำ
                        </div>
                      )}
                    </div>

                    {/* Stats grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
                      gap: '10px',
                    }}>
                      {[
                        { icon: '🌡️', label: 'อุณหภูมิสูงสุด', value: `${maxT}°C`, color: '#f97316' },
                        { icon: '🌡️', label: 'อุณหภูมิต่ำสุด', value: `${minT}°C`, color: '#3b82f6' },
                        { icon: '🌧️', label: 'โอกาสฝน',       value: `${rain}%`,  color: rain >= 50 ? '#3b82f6' : subText },
                        { icon: '💧', label: 'ปริมาณฝน',      value: `${rainSum} มม.`, color: '#0ea5e9' },
                        { icon: '💨', label: 'ลมแรงสุด',       value: `${wind} กม./ชม.`, color: wind > 30 ? '#f59e0b' : subText },
                        { icon: '☀️', label: 'UV Index',       value: `${uv} (${uvInfo.text})`, color: uvInfo.color },
                      ].map(stat => (
                        <div key={stat.label} style={{
                          background: 'var(--bg-secondary)',
                          borderRadius: '12px', padding: '12px 14px',
                        }}>
                          <div style={{ fontSize: '0.68rem', color: subText, marginBottom: '3px' }}>
                            {stat.icon} {stat.label}
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: stat.color }}>
                            {stat.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ textAlign: 'right', marginTop: '10px' }}>
                      <a
                        href="https://www.tmd.go.th/"
                        target="_blank" rel="noopener noreferrer"
                        style={{ color: '#0ea5e9', fontSize: '0.76rem', textDecoration: 'none', fontWeight: 'bold' }}
                      >
                        ดูพยากรณ์อย่างเป็นทางการจากกรมอุตุนิยมวิทยา →
                      </a>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ── 7-Day Forecast ── */}
            {!loadingWeather && !errorWeather && daily && (
              <div style={{
                background: cardBg, borderRadius: '20px',
                padding: isMobile ? '16px' : '22px',
                border: `1px solid ${borderColor}`,
              }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '1rem', color: textColor, fontWeight: 800 }}>
                  📅 พยากรณ์อากาศ 7 วัน — กรุงเทพฯ
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(4,1fr)' : 'repeat(7,1fr)',
                  gap: '8px',
                }}>
                  {daily.weathercode.map((code, i) => {
                    const wmo  = getWMO(code);
                    const date = new Date(daily.time[i]);
                    const isToday = i === 0;
                    const rain  = daily.precipitation_probability_max[i];
                    const rainC = rain >= 70 ? '#3b82f6' : rain >= 40 ? '#93c5fd' : subText;
                    return (
                      <div
                        key={i}
                        style={{
                          background: isToday
                            ? 'linear-gradient(135deg,rgba(14,165,233,0.2),rgba(79,70,229,0.15))'
                            : 'var(--bg-secondary)',
                          borderRadius: '14px',
                          padding: '12px 8px',
                          textAlign: 'center',
                          border: isToday ? '1.5px solid #0ea5e9' : `1px solid ${borderColor}`,
                        }}
                      >
                        <div style={{ fontSize: '0.68rem', color: subText, fontWeight: isToday ? 'bold' : 'normal' }}>
                          {isToday ? 'วันนี้' : THAI_DAYS[date.getDay()]}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: subText, marginBottom: '6px' }}>
                          {date.getDate()} {THAI_MONTHS[date.getMonth()]}
                        </div>
                        <div style={{ fontSize: '1.7rem', marginBottom: '5px' }}>{wmo.icon}</div>
                        <div style={{ fontSize: '0.72rem', color: textColor, fontWeight: 'bold' }}>
                          {daily.temperature_2m_max[i]}°
                        </div>
                        <div style={{ fontSize: '0.68rem', color: subText }}>
                          {daily.temperature_2m_min[i]}°
                        </div>
                        {rain > 0 && (
                          <div style={{ fontSize: '0.62rem', color: rainC, marginTop: '4px', fontWeight: 'bold' }}>
                            💧{rain}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Weekly outlook summary */}
                {weekly && (
                  <div style={{
                    marginTop: '14px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '14px', padding: '14px 16px',
                    borderLeft: '4px solid #8b5cf6',
                  }}>
                    <div style={{ fontSize: '0.72rem', color: subText, marginBottom: '5px', fontWeight: 'bold' }}>
                      📊 สรุปแนวโน้มอากาศสัปดาห์นี้
                    </div>
                    <div style={{ fontSize: '0.85rem', color: textColor, lineHeight: 1.75 }}>
                      {weekly.rainyDays > 0
                        ? `คาดว่าจะมีฝนตกประมาณ ${weekly.rainyDays} วันในสัปดาห์นี้ `
                        : 'สัปดาห์นี้ฝนน้อย อากาศค่อนข้างแห้ง '}
                      อุณหภูมิสูงสุดในสัปดาห์ {weekly.maxTemp}°C ต่ำสุด {weekly.minTemp}°C
                      {weekly.totalRain > 0 && ` · ปริมาณฝนสะสมโดยประมาณ ${weekly.totalRain} มม.`}
                      {weekly.hasStorm && (
                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}> · ⚠️ อาจมีพายุฝนฟ้าคะนองบางวัน</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Agency Quick Links ── */}
            <div style={{
              background: cardBg, borderRadius: '18px',
              padding: isMobile ? '14px' : '18px',
              border: `1px solid ${borderColor}`,
            }}>
              <div style={{ fontSize: '0.78rem', color: textColor, fontWeight: 'bold', marginBottom: '10px' }}>
                📌 ดูข่าวอากาศเพิ่มเติมจากหน่วยงานทางการ
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { label: '🌤️ กรมอุตุนิยมวิทยา',   url: 'https://www.tmd.go.th/',                       color: '#3b82f6' },
                  { label: '🏭 กรมควบคุมมลพิษ',      url: 'http://air4thai.com/webV3/#/Home',             color: '#0ea5e9' },
                  { label: '🛰️ GISTDA จุดความร้อน',  url: 'https://fire.gistda.or.th/',                   color: '#f97316' },
                  { label: '🚨 กรมป้องกันภัย (DDPM)', url: 'https://www.disaster.go.th/',                  color: '#ef4444' },
                  { label: '💨 IQAir ไทย',            url: 'https://www.iqair.com/th/thailand',            color: '#10b981' },
                ].map(s => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      background: `${s.color}15`, border: `1px solid ${s.color}40`,
                      borderRadius: '10px', padding: '7px 13px',
                      textDecoration: 'none', color: s.color,
                      fontSize: '0.78rem', fontWeight: 'bold',
                      transition: 'background 0.2s',
                    }}
                  >
                    {s.label} →
                  </a>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════
            TAB 2 — ภัยพิบัติไทย
        ══════════════════════════════ */}
        {activeTab === 'thai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <div style={{
              background: cardBg, borderRadius: '20px',
              padding: isMobile ? '16px' : '22px',
              border: `1px solid ${borderColor}`,
            }}>
              <SectionHeader
                title="🇹🇭 ภัยพิบัติในประเทศไทย (UN ReliefWeb)"
                lastTime={lastThai}
                onRefresh={fetchThaiDisasters}
                loading={loadingThai}
                source="ReliefWeb"
                textColor={textColor} subText={subText} borderColor={borderColor}
              />

              {loadingThai && <LoadingBox subTextColor={subText} />}
              {errorThai   && <ErrorBox msg={errorThai} />}

              {!loadingThai && !errorThai && thaiDisasters.length === 0 && (
                <EmptyBox
                  icon="✅"
                  title="ไม่พบรายงานภัยพิบัติขนาดใหญ่ในประเทศไทย"
                  desc="ไม่มีรายงานใน UN ReliefWeb ขณะนี้"
                  textColor={textColor} subTextColor={subText}
                  cardBg="var(--bg-secondary)" borderColor={borderColor}
                />
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {thaiDisasters.map((d, idx) => {
                  const f  = d.fields;
                  const di = getDisasterInfo(f.type);
                  const sb = getStatusBadge(f.status);
                  return (
                    <div
                      key={d.id || idx}
                      className="nhover"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: '14px', padding: '14px',
                        border: `1px solid ${borderColor}`,
                        borderLeft: `4px solid ${di.color}`,
                        display: 'flex', gap: '12px', alignItems: 'flex-start',
                      }}
                    >
                      <span style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>{di.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 'bold', color: textColor, fontSize: '0.9rem', lineHeight: 1.4 }}>
                          {f.name}
                        </div>
                        <div style={{ color: subText, fontSize: '0.76rem', marginTop: '4px' }}>
                          📍 ประเทศไทย &nbsp;·&nbsp; {formatDateThai(f.date?.created)}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '7px', flexWrap: 'wrap' }}>
                          {(f.type || []).map((t, ti) => {
                            const info = getDisasterInfo([t]);
                            return (
                              <span key={ti} style={{
                                background: `${info.color}20`, color: info.color,
                                padding: '2px 8px', borderRadius: '8px',
                                fontSize: '0.68rem', fontWeight: 'bold',
                              }}>{t.name}</span>
                            );
                          })}
                          <span style={{
                            background: `${sb.color}20`, color: sb.color,
                            padding: '2px 8px', borderRadius: '8px',
                            fontSize: '0.68rem', fontWeight: 'bold',
                          }}>{sb.text}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TMD Earthquake — Thai context */}
            {tmdQuake.length > 0 && (
              <div style={{
                background: cardBg, borderRadius: '20px',
                padding: isMobile ? '16px' : '22px',
                border: `1px solid ${borderColor}`,
              }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: textColor, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🌋 รายงานแผ่นดินไหวในภูมิภาค (TMD)
                  <span style={{ fontSize: '0.65rem', color: subText, fontWeight: 'normal' }}>7 วันล่าสุด</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tmdQuake.map((q, i) => (
                    <div key={i} style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '12px', padding: '12px 14px',
                      borderLeft: '3px solid #ef4444',
                    }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: textColor, marginBottom: '3px' }}>
                        {q.title}
                      </div>
                      {q.desc && (
                        <div style={{ fontSize: '0.77rem', color: subText, lineHeight: 1.6 }}>
                          {q.desc.length > 200 ? q.desc.slice(0, 200) + '…' : q.desc}
                        </div>
                      )}
                      <div style={{ fontSize: '0.63rem', color: subText, marginTop: '4px' }}>
                        {q.pubDate ? new Date(q.pubDate).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'right', marginTop: '10px' }}>
                  <a href="https://www.tmd.go.th/warning-and-events/earthquake" target="_blank" rel="noopener noreferrer"
                    style={{ color: '#ef4444', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 'bold' }}>
                    รายงานแผ่นดินไหวทั้งหมดจาก TMD →
                  </a>
                </div>
              </div>
            )}

            {/* Quick links */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { label: '🚨 กรมป้องกันและบรรเทาสาธารณภัย', url: 'https://www.disaster.go.th/', color: '#ef4444' },
                { label: '🔥 GISTDA Fire Monitor',           url: 'https://fire.gistda.or.th/', color: '#f97316' },
              ].map(l => (
                <a
                  key={l.label}
                  href={l.url}
                  target="_blank" rel="noopener noreferrer"
                  className="nhover"
                  style={{
                    flex: 1, minWidth: '180px',
                    background: `${l.color}10`,
                    border: `1px solid ${l.color}40`,
                    borderRadius: '14px', padding: '14px 16px',
                    textDecoration: 'none', color: l.color,
                    display: 'flex', alignItems: 'center',
                    fontWeight: 'bold', fontSize: '0.85rem',
                  }}
                >
                  {l.label} →
                </a>
              ))}
            </div>

          </div>
        )}

        {/* ══════════════════════════════
            TAB 3 — ภัยพิบัติโลก
        ══════════════════════════════ */}
        {activeTab === 'global' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* ── GDACS Real-time Alerts ── */}
            <div style={{
              background: cardBg, borderRadius: '20px',
              padding: isMobile ? '16px' : '22px',
              border: `1px solid ${borderColor}`,
            }}>
              <SectionHeader
                title="🚨 เตือนภัยล่าสุดรอบโลก (GDACS Real-time)"
                lastTime={lastGDACS}
                onRefresh={fetchGDACS}
                loading={loadingGDACS}
                source="GDACS"
                textColor={textColor} subText={subText} borderColor={borderColor}
              />

              {loadingGDACS && <LoadingBox subTextColor={subText} />}
              {errorGDACS   && <ErrorBox msg={errorGDACS} />}
              {!loadingGDACS && !errorGDACS && gdacsAlerts.length === 0 && (
                <EmptyBox icon="✅" title="ไม่พบเหตุการณ์ภัยพิบัติในรอบ 7 วัน"
                  textColor={textColor} subTextColor={subText}
                  cardBg="var(--bg-secondary)" borderColor={borderColor} />
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {gdacsAlerts.map((alert, i) => {
                  const ev    = gdacsEvent(alert.eventType);
                  const alCol = GDACS_ALERT_COLOR[alert.alertLevel] || '#94a3b8';
                  return (
                    <a
                      key={i}
                      href={alert.link || 'https://www.gdacs.org/'}
                      target="_blank" rel="noopener noreferrer"
                      className="nhover"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: '13px', padding: '12px 13px',
                        border: `1px solid ${borderColor}`,
                        borderLeft: `3px solid ${alCol}`,
                        textDecoration: 'none', color: 'inherit',
                        display: 'flex', gap: '11px', alignItems: 'flex-start',
                      }}
                    >
                      <span style={{ fontSize: '1.8rem', lineHeight: 1, flexShrink: 0 }}>{ev.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 'bold', color: textColor, fontSize: '0.85rem', lineHeight: 1.4 }}>
                          {alert.title}
                        </div>
                        <div style={{ color: subText, fontSize: '0.72rem', marginTop: '3px' }}>
                          {alert.country && `📍 ${alert.country} · `}
                          {alert.pubDate ? new Date(alert.pubDate).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            background: `${ev.color}20`, color: ev.color,
                            padding: '2px 8px', borderRadius: '8px',
                            fontSize: '0.67rem', fontWeight: 'bold',
                          }}>{ev.label}</span>
                          {alert.alertLevel && (
                            <span style={{
                              background: `${alCol}20`, color: alCol,
                              padding: '2px 8px', borderRadius: '8px',
                              fontSize: '0.67rem', fontWeight: 'bold',
                            }}>
                              {alert.alertLevel === 'Red' ? '🔴 แดง (รุนแรง)'
                                : alert.alertLevel === 'Orange' ? '🟠 ส้ม (ปานกลาง)'
                                : '🟢 เขียว (เฝ้าระวัง)'}
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{ color: subText, fontSize: '0.9rem', flexShrink: 0 }}>→</span>
                    </a>
                  );
                })}
              </div>

              {!loadingGDACS && (
                <div style={{ textAlign: 'right', marginTop: '10px' }}>
                  <a href="https://www.gdacs.org/" target="_blank" rel="noopener noreferrer"
                    style={{ color: '#0ea5e9', fontSize: '0.76rem', textDecoration: 'none', fontWeight: 'bold' }}>
                    ดูทั้งหมดบน GDACS →
                  </a>
                </div>
              )}
            </div>

            {/* ── USGS Earthquakes ── */}
            <div style={{
              background: cardBg, borderRadius: '20px',
              padding: isMobile ? '16px' : '22px',
              border: `1px solid ${borderColor}`,
            }}>
              <SectionHeader
                title="🌋 แผ่นดินไหวรุนแรง (7 วัน)"
                lastTime={lastEq}
                onRefresh={fetchEarthquakes}
                loading={loadingEq}
                source="USGS"
                textColor={textColor} subText={subText} borderColor={borderColor}
              />

              {loadingEq && <LoadingBox subTextColor={subText} />}
              {errorEq   && <ErrorBox msg={errorEq} />}
              {!loadingEq && !errorEq && earthquakes.length === 0 && (
                <EmptyBox
                  icon="✅"
                  title="ไม่พบแผ่นดินไหวรุนแรงในรอบ 7 วัน"
                  desc="USGS ไม่รายงานแผ่นดินไหวที่มีนัยสำคัญในช่วงนี้"
                  textColor={textColor} subTextColor={subText}
                  cardBg="var(--bg-secondary)" borderColor={borderColor}
                />
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {earthquakes.map((eq, idx) => {
                  const p = eq.properties;
                  const magColor = getMagColor(p.mag);
                  return (
                    <a
                      key={eq.id || idx}
                      href={p.url}
                      target="_blank" rel="noopener noreferrer"
                      className="nhover"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: '14px', padding: '13px',
                        border: `1px solid ${borderColor}`,
                        textDecoration: 'none', color: 'inherit',
                        display: 'flex', alignItems: 'center', gap: '13px',
                      }}
                    >
                      <div style={{
                        width: '56px', height: '56px', flexShrink: 0,
                        borderRadius: '50%',
                        background: `${magColor}18`,
                        border: `2px solid ${magColor}`,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: magColor, lineHeight: 1 }}>
                          M{p.mag?.toFixed(1)}
                        </div>
                        <div style={{ fontSize: '0.55rem', color: magColor, opacity: 0.9, marginTop: '1px' }}>
                          {getMagLabel(p.mag)}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 'bold', color: textColor, fontSize: '0.87rem', lineHeight: 1.4 }}>
                          {p.place}
                        </div>
                        <div style={{ color: subText, fontSize: '0.73rem', marginTop: '3px' }}>
                          🕐 {formatTs(p.time)}
                          {p.tsunami === 1 && (
                            <span style={{ color: '#3b82f6', fontWeight: 'bold', marginLeft: '10px' }}>
                              🌊 เสี่ยงเกิดสึนามิ
                            </span>
                          )}
                        </div>
                        {p.felt && (
                          <div style={{ color: subText, fontSize: '0.68rem', marginTop: '2px' }}>
                            📢 มีรายงานรู้สึกได้ {p.felt.toLocaleString()} แห่ง
                          </div>
                        )}
                      </div>
                      <span style={{ color: subText, fontSize: '1rem', flexShrink: 0 }}>→</span>
                    </a>
                  );
                })}
              </div>

              {!loadingEq && (
                <div style={{ textAlign: 'right', marginTop: '10px' }}>
                  <a
                    href="https://earthquake.usgs.gov/earthquakes/map/"
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: '#0ea5e9', fontSize: '0.76rem', textDecoration: 'none', fontWeight: 'bold' }}
                  >
                    ดูแผนที่แผ่นดินไหวทั้งหมดบน USGS →
                  </a>
                </div>
              )}
            </div>

            {/* ── ReliefWeb Global ── */}
            <div style={{
              background: cardBg, borderRadius: '20px',
              padding: isMobile ? '16px' : '22px',
              border: `1px solid ${borderColor}`,
            }}>
              <SectionHeader
                title="🌍 ภัยพิบัติทั่วโลก (7 วัน)"
                lastTime={lastGlobal}
                onRefresh={fetchGlobalDisasters}
                loading={loadingGlobal}
                source="UN ReliefWeb"
                textColor={textColor} subText={subText} borderColor={borderColor}
              />

              {loadingGlobal && <LoadingBox subTextColor={subText} />}
              {errorGlobal   && <ErrorBox msg={errorGlobal} />}
              {!loadingGlobal && !errorGlobal && globalDisasters.length === 0 && (
                <EmptyBox
                  icon="✅"
                  title="ไม่พบรายงานภัยพิบัติขนาดใหญ่ใน 7 วันที่ผ่านมา"
                  desc="UN ReliefWeb ไม่มีรายงานภัยพิบัติใหม่ในช่วงนี้"
                  textColor={textColor} subTextColor={subText}
                  cardBg="var(--bg-secondary)" borderColor={borderColor}
                />
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {globalDisasters.map((d, idx) => {
                  const f  = d.fields;
                  const di = getDisasterInfo(f.type);
                  const sb = getStatusBadge(f.status);
                  const countries = (f.country || []).slice(0, 3).map(c => c.name).join(', ');
                  return (
                    <div
                      key={d.id || idx}
                      className="nhover"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: '14px', padding: '13px',
                        border: `1px solid ${borderColor}`,
                        borderLeft: `3px solid ${di.color}`,
                        display: 'flex', gap: '11px', alignItems: 'flex-start',
                      }}
                    >
                      <span style={{ fontSize: '1.9rem', lineHeight: 1, flexShrink: 0 }}>{di.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 'bold', color: textColor, fontSize: '0.89rem', lineHeight: 1.4 }}>
                          {f.name}
                        </div>
                        <div style={{ color: subText, fontSize: '0.73rem', marginTop: '3px' }}>
                          {countries && `📍 ${countries} · `}{formatDateThai(f.date?.created)}
                        </div>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '6px', flexWrap: 'wrap' }}>
                          {(f.type || []).slice(0, 2).map((t, ti) => {
                            const info = getDisasterInfo([t]);
                            return (
                              <span key={ti} style={{
                                background: `${info.color}20`, color: info.color,
                                padding: '2px 8px', borderRadius: '8px',
                                fontSize: '0.67rem', fontWeight: 'bold',
                              }}>{t.name}</span>
                            );
                          })}
                          <span style={{
                            background: `${sb.color}20`, color: sb.color,
                            padding: '2px 8px', borderRadius: '8px',
                            fontSize: '0.67rem', fontWeight: 'bold',
                          }}>{sb.text}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!loadingGlobal && (
                <div style={{ textAlign: 'right', marginTop: '10px' }}>
                  <a
                    href="https://reliefweb.int/disasters"
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: '#0ea5e9', fontSize: '0.76rem', textDecoration: 'none', fontWeight: 'bold' }}
                  >
                    ดูทั้งหมดบน UN ReliefWeb →
                  </a>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ══ Footer ══ */}
        <div style={{
          textAlign: 'center', padding: '18px 0',
          borderTop: `1px solid ${borderColor}`,
          color: subText,
        }}>
          <div style={{ fontSize: '0.76rem' }}>
            ข้อมูลจาก: TMD (RSS) · Open-Meteo · GDACS · USGS · UN ReliefWeb
          </div>
          <div style={{ fontSize: '0.68rem', marginTop: '4px', opacity: 0.7 }}>
            อัปเดตอัตโนมัติ — TMD/Open-Meteo 30 นาที · GDACS/ReliefWeb 15 นาที · USGS 5 นาที
          </div>
        </div>

        <div style={{ height: isMobile ? '80px' : '0px', width: '100%', flexShrink: 0 }} />
      </div>
    </div>
  );
}
