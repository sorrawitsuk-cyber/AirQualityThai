import React, { useState, useEffect, useContext } from 'react';
import { WeatherContext } from '../context/WeatherContext';

// ──────────────────────────────────────────────
// แหล่งข้อมูลอากาศวิชาการไทยที่น่าเชื่อถือ
// ──────────────────────────────────────────────
const THAI_SOURCES = [
  {
    name: 'กรมควบคุมมลพิษ (PCD)',
    nameEn: 'Pollution Control Department',
    icon: '🏭',
    color: '#0ea5e9',
    desc: 'ข้อมูลคุณภาพอากาศแบบเรียลไทม์จากสถานีตรวจวัดทั่วประเทศ ดัชนีคุณภาพอากาศ AQI และค่า PM2.5',
    url: 'http://air4thai.com/webV3/#/Home',
    badge: 'ข้อมูลเรียลไทม์',
    badgeColor: '#22c55e',
  },
  {
    name: 'กรมอุตุนิยมวิทยา (TMD)',
    nameEn: 'Thai Meteorological Department',
    icon: '🌤️',
    color: '#3b82f6',
    desc: 'พยากรณ์อากาศ 7 วัน อุณหภูมิ ลม ฝน ความกดอากาศ และประกาศเตือนภัยจากสภาวะอากาศรุนแรง',
    url: 'https://www.tmd.go.th/',
    badge: 'พยากรณ์อากาศ',
    badgeColor: '#3b82f6',
  },
  {
    name: 'GISTDA — ดาวเทียม THEOS',
    nameEn: 'Geo-Informatics and Space Technology',
    icon: '🛰️',
    color: '#8b5cf6',
    desc: 'ข้อมูลจุดความร้อน พื้นที่เผาไหม้ น้ำท่วม และสถานการณ์ภัยพิบัติจากดาวเทียม THEOS ของไทย',
    url: 'https://fire.gistda.or.th/',
    badge: 'ดาวเทียม',
    badgeColor: '#8b5cf6',
  },
  {
    name: 'กรมป้องกันและบรรเทาสาธารณภัย',
    nameEn: 'Dept. of Disaster Prevention & Mitigation (DDPM)',
    icon: '🚨',
    color: '#ef4444',
    desc: 'สถานการณ์ภัยพิบัติล่าสุด น้ำท่วม ดินถล่ม พายุ คลื่นความร้อน พร้อมประกาศเตือนภัย',
    url: 'https://www.disaster.go.th/',
    badge: 'เตือนภัย',
    badgeColor: '#ef4444',
  },
  {
    name: 'IQAir Thailand',
    nameEn: 'IQAir — Real-time Global AQI',
    icon: '💨',
    color: '#10b981',
    desc: 'คุณภาพอากาศแบบเรียลไทม์จากเครือข่ายสถานีทั่วโลก พร้อมคำแนะนำสุขภาพและการจัดอันดับเมือง',
    url: 'https://www.iqair.com/th/thailand',
    badge: 'ระดับโลก',
    badgeColor: '#10b981',
  },
  {
    name: 'กรมอนามัย — สุขภาพอากาศ',
    nameEn: 'Department of Health, Ministry of Public Health',
    icon: '🏥',
    color: '#f59e0b',
    desc: 'ผลกระทบของ PM2.5 ต่อสุขภาพ คำแนะนำสำหรับกลุ่มเสี่ยง และแนวทางปฏิบัติตนเมื่ออากาศเสีย',
    url: 'https://www.anamai.moph.go.th/',
    badge: 'สุขภาพ',
    badgeColor: '#f59e0b',
  },
  {
    name: 'สถาบันวิจัยดาราศาสตร์แห่งชาติ (NARIT)',
    nameEn: 'National Astronomical Research Institute of Thailand',
    icon: '🔭',
    color: '#6366f1',
    desc: 'ปรากฏการณ์ทางดาราศาสตร์ ดัชนีคุณภาพท้องฟ้าสำหรับดูดาว และการพยากรณ์อากาศเชิงวิทยาศาสตร์',
    url: 'https://www.narit.or.th/',
    badge: 'ดาราศาสตร์',
    badgeColor: '#6366f1',
  },
  {
    name: 'WHO — Air Quality Guidelines',
    nameEn: 'World Health Organization',
    icon: '🌐',
    color: '#06b6d4',
    desc: 'แนวทางคุณภาพอากาศขององค์การอนามัยโลก (AQG 2021) ค่ามาตรฐาน PM2.5 PM10 NO₂ O₃ SO₂',
    url: 'https://www.who.int/health-topics/air-pollution',
    badge: 'WHO Guidelines',
    badgeColor: '#06b6d4',
  },
];

// ──────────────────────────────────────────────
// ตารางประเภทภัยพิบัติ (ReliefWeb / GDACS)
// ──────────────────────────────────────────────
const DISASTER_TYPES = {
  'Earthquake':        { icon: '🌋', color: '#ef4444' },
  'Flood':             { icon: '🌊', color: '#3b82f6' },
  'Tropical Cyclone':  { icon: '🌀', color: '#8b5cf6' },
  'Drought':           { icon: '🏜️', color: '#f59e0b' },
  'Wild Fire':         { icon: '🔥', color: '#f97316' },
  'Tsunami':           { icon: '🌊', color: '#0ea5e9' },
  'Landslide':         { icon: '⛰️', color: '#78716c' },
  'Cold Wave':         { icon: '❄️', color: '#06b6d4' },
  'Heat Wave':         { icon: '🌡️', color: '#f97316' },
  'Storm Surge':       { icon: '🌊', color: '#0ea5e9' },
  'Volcano':           { icon: '🌋', color: '#dc2626' },
  'default':           { icon: '⚠️', color: '#94a3b8' },
};

// ──────────────────────────────────────────────
// Helper functions
// ──────────────────────────────────────────────
const getDisasterInfo = (types) => {
  if (!types || types.length === 0) return DISASTER_TYPES.default;
  return DISASTER_TYPES[types[0]?.name] || DISASTER_TYPES.default;
};

const getMagColor = (mag) => {
  if (mag >= 7.0) return '#ef4444';
  if (mag >= 6.0) return '#f97316';
  if (mag >= 5.0) return '#f59e0b';
  return '#22c55e';
};

const getMagLabel = (mag) => {
  if (mag >= 7.0) return 'รุนแรงมาก';
  if (mag >= 6.0) return 'รุนแรง';
  if (mag >= 5.0) return 'ปานกลาง';
  return 'เล็กน้อย';
};

const getStatusBadge = (status) => {
  const map = {
    ongoing: { text: 'กำลังเกิดขึ้น', color: '#ef4444' },
    alert:   { text: 'แจ้งเตือน',     color: '#f59e0b' },
    past:    { text: 'ผ่านมาแล้ว',    color: '#94a3b8' },
  };
  return map[status] || { text: status || 'ไม่ระบุ', color: '#94a3b8' };
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return dateStr; }
};

const formatTimestamp = (ts) => {
  if (!ts) return '-';
  try {
    return new Date(ts).toLocaleString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
};

// ──────────────────────────────────────────────
// Loading / Error helpers
// ──────────────────────────────────────────────
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

// ══════════════════════════════════════════════
// NewsPage
// ══════════════════════════════════════════════
const EQ_INTERVAL_MS      = 5  * 60 * 1000;  // 5 นาที — USGS อัพเดททุก 1 นาที
const RELIEF_INTERVAL_MS  = 15 * 60 * 1000;  // 15 นาที — ReliefWeb

export default function NewsPage() {
  const { darkMode } = useContext(WeatherContext);

  const [isMobile, setIsMobile]           = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab]         = useState('air');

  // Earthquake (USGS)
  const [earthquakes, setEarthquakes]     = useState([]);
  const [loadingEq,   setLoadingEq]       = useState(true);
  const [errorEq,     setErrorEq]         = useState(null);
  const [lastEq,      setLastEq]          = useState(null);

  // Thai disasters (ReliefWeb)
  const [thaiDisasters,   setThaiDisasters]   = useState([]);
  const [loadingThai,     setLoadingThai]     = useState(true);
  const [errorThai,       setErrorThai]       = useState(null);
  const [lastThai,        setLastThai]        = useState(null);

  // Global disasters (ReliefWeb)
  const [globalDisasters, setGlobalDisasters] = useState([]);
  const [loadingGlobal,   setLoadingGlobal]   = useState(true);
  const [errorGlobal,     setErrorGlobal]     = useState(null);
  const [lastGlobal,      setLastGlobal]      = useState(null);

  // ─── theme aliases ───
  const appBg      = 'var(--bg-app)';
  const cardBg     = 'var(--bg-card)';
  const textColor  = 'var(--text-main)';
  const borderColor= 'var(--border-color)';
  const subText    = 'var(--text-sub)';

  // ─── resize ───
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ─── fetch helpers ───
  const fetchEarthquakes = () => {
    setLoadingEq(true); setErrorEq(null);
    fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        setEarthquakes(
          (data.features || []).sort((a, b) => b.properties.time - a.properties.time)
        );
        setLastEq(new Date());
      })
      .catch(() => setErrorEq('ไม่สามารถดึงข้อมูลแผ่นดินไหวได้ กรุณาลองใหม่ภายหลัง'))
      .finally(() => setLoadingEq(false));
  };

  const fetchThaiDisasters = () => {
    setLoadingThai(true); setErrorThai(null);
    // POST ใช้ JSON body — หลีกเลี่ยงปัญหา URL encoding ของ nested filter
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

  const fetchGlobalDisasters = () => {
    setLoadingGlobal(true); setErrorGlobal(null);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString().split('T')[0];
    // POST body — date range filter ทำงานได้ถูกต้องกว่า GET query string
    fetch('https://api.reliefweb.int/v1/disasters?appname=airqualitythai&limit=30&sort[]=date.created:desc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: { include: ['name', 'date', 'country', 'type', 'status'] },
        filter: {
          operator: 'AND',
          conditions: [
            { field: 'date.created', value: { from: sevenDaysAgo } },
          ],
        },
      }),
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setGlobalDisasters(data.data || []); setLastGlobal(new Date()); })
      .catch(() => setErrorGlobal('ไม่สามารถดึงข้อมูลภัยพิบัติโลกได้ กรุณาลองใหม่ภายหลัง'))
      .finally(() => setLoadingGlobal(false));
  };

  // ─── USGS: fetch + auto-refresh ทุก 5 นาที ───
  useEffect(() => {
    fetchEarthquakes();
    const id = setInterval(fetchEarthquakes, EQ_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // ─── ReliefWeb Thailand: fetch + auto-refresh ทุก 15 นาที ───
  useEffect(() => {
    fetchThaiDisasters();
    const id = setInterval(fetchThaiDisasters, RELIEF_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // ─── ReliefWeb Global: fetch + auto-refresh ทุก 15 นาที ───
  useEffect(() => {
    fetchGlobalDisasters();
    const id = setInterval(fetchGlobalDisasters, RELIEF_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // ─── tabs config ───
  const tabs = [
    { id: 'air',    label: 'แหล่งข้อมูลอากาศ', shortLabel: 'อากาศ',   icon: '💨' },
    { id: 'thai',   label: 'ภัยพิบัติในไทย',   shortLabel: 'ไทย',     icon: '🇹🇭' },
    { id: 'global', label: 'ภัยพิบัติโลก',      shortLabel: 'โลก',     icon: '🌍' },
  ];

  // ──────────────────────────────────────────────
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
        .news-hover {
          transition: transform 0.18s, box-shadow 0.18s;
          cursor: pointer;
        }
        .news-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.18);
        }
      `}} />

      <div style={{
        width: '100%',
        maxWidth: isMobile ? '600px' : '960px',
        display: 'flex', flexDirection: 'column',
        gap: isMobile ? '14px' : '22px',
        padding: isMobile ? '15px' : '30px',
        paddingBottom: '50px',
      }}>

        {/* ══ Hero Header ══ */}
        <div style={{
          background: 'linear-gradient(135deg, #0369a1 0%, #1d4ed8 55%, #4f46e5 100%)',
          borderRadius: isMobile ? '20px' : '28px',
          padding: isMobile ? '20px' : '28px 30px',
          color: '#fff',
          boxShadow: '0 10px 40px rgba(14,165,233,0.3)',
        }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.45rem' : '2rem', fontWeight: 900, lineHeight: 1.3 }}>
            📰 ข่าวสารอากาศและภัยพิบัติ
          </h1>
          <p style={{ margin: '8px 0 14px', fontSize: isMobile ? '0.82rem' : '0.92rem', opacity: 0.88, lineHeight: 1.6 }}>
            รวบรวมจากแหล่งวิชาการไทยที่น่าเชื่อถือ · ปรากฏการณ์ภัยพิบัติในรอบ 7 วัน ทั้งในและต่างประเทศ
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              '🏭 กรมควบคุมมลพิษ',
              '🛰️ GISTDA',
              '🌋 USGS Earthquake',
              '🌐 UN ReliefWeb',
            ].map(tag => (
              <span key={tag} style={{
                background: 'rgba(255,255,255,0.18)',
                padding: '3px 11px', borderRadius: '20px',
                fontSize: '0.72rem', fontWeight: 'bold',
              }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* ══ Tab Bar ══ */}
        <div style={{
          display: 'flex', gap: '8px',
          background: cardBg, padding: '8px',
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
                  padding: isMobile ? '10px 4px' : '12px 16px',
                  borderRadius: '12px',
                  background: active ? '#0ea5e9' : 'transparent',
                  color: active ? '#fff' : subText,
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'Sarabun, sans-serif',
                  fontWeight: 'bold',
                  fontSize: isMobile ? '0.75rem' : '0.88rem',
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
            TAB 1 — แหล่งข้อมูลอากาศ
        ══════════════════════════════ */}
        {activeTab === 'air' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', color: textColor, fontWeight: 800 }}>
                💨 แหล่งข้อมูลคุณภาพอากาศที่น่าเชื่อถือ
              </h2>
              <span style={{ fontSize: '0.75rem', color: subText }}>
                หน่วยงานราชการ · สถาบันวิจัย · องค์กรนานาชาติ
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '12px',
            }}>
              {THAI_SOURCES.map((src, idx) => (
                <a
                  key={idx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-hover"
                  style={{
                    background: cardBg,
                    borderRadius: '18px',
                    padding: '18px',
                    border: `1px solid ${borderColor}`,
                    borderLeft: `4px solid ${src.color}`,
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                  }}
                >
                  {/* Row 1: icon + name + badge */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                      <span style={{ fontSize: '2rem', lineHeight: 1 }}>{src.icon}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', color: textColor, fontSize: '0.9rem', lineHeight: 1.3 }}>
                          {src.name}
                        </div>
                        <div style={{ color: subText, fontSize: '0.68rem', marginTop: '1px' }}>
                          {src.nameEn}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      background: `${src.badgeColor}20`,
                      color: src.badgeColor,
                      padding: '3px 9px', borderRadius: '10px',
                      fontSize: '0.68rem', fontWeight: 'bold', flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}>
                      {src.badge}
                    </span>
                  </div>

                  {/* Row 2: description */}
                  <p style={{ margin: 0, color: subText, fontSize: '0.8rem', lineHeight: 1.65 }}>
                    {src.desc}
                  </p>

                  {/* Row 3: link hint */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    color: src.color, fontSize: '0.76rem', fontWeight: 'bold',
                  }}>
                    เยี่ยมชมเว็บไซต์ <span>→</span>
                  </div>
                </a>
              ))}
            </div>

            {/* Disclaimer card */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '14px', padding: '16px',
              border: `1px solid ${borderColor}`,
            }}>
              <div style={{ fontSize: '0.82rem', color: subText, lineHeight: 1.75 }}>
                <strong style={{ color: textColor }}>📌 หมายเหตุ: </strong>
                แอปนี้ดึงข้อมูลคุณภาพอากาศจาก <strong style={{ color: '#0ea5e9' }}>กรมควบคุมมลพิษ (Air4Thai API)</strong> และ
                ข้อมูลอุตุนิยมวิทยาจาก <strong style={{ color: '#3b82f6' }}>กรมอุตุนิยมวิทยา (TMD)</strong> รวมถึงข้อมูล
                ดาวเทียมจาก <strong style={{ color: '#8b5cf6' }}>GISTDA</strong> สำหรับข้อมูลเชิงลึกและงานวิจัย
                กรุณาเยี่ยมชมแหล่งข้อมูลด้านบนโดยตรง
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════
            TAB 2 — ภัยพิบัติในไทย
        ══════════════════════════════ */}
        {activeTab === 'thai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', color: textColor, fontWeight: 800 }}>
                🇹🇭 ภัยพิบัติในประเทศไทย
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {lastThai && (
                  <span style={{ fontSize: '0.68rem', color: subText }}>
                    อัพเดท {lastThai.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <button
                  onClick={fetchThaiDisasters}
                  disabled={loadingThai}
                  style={{
                    background: 'var(--bg-secondary)', border: `1px solid ${borderColor}`,
                    borderRadius: '8px', padding: '4px 10px', cursor: 'pointer',
                    color: textColor, fontSize: '0.72rem', fontWeight: 'bold',
                    opacity: loadingThai ? 0.5 : 1, transition: 'opacity 0.2s',
                    fontFamily: 'Sarabun, sans-serif',
                  }}
                >
                  {loadingThai ? '⏳' : '🔄'} รีเฟรช
                </button>
                <span style={{ fontSize: '0.68rem', color: subText }}>UN ReliefWeb</span>
              </div>
            </div>

            {loadingThai && <LoadingBox subTextColor={subText} />}
            {errorThai   && <ErrorBox msg={errorThai} />}

            {!loadingThai && !errorThai && thaiDisasters.length === 0 && (
              <EmptyBox
                icon="✅"
                title="ไม่พบรายงานภัยพิบัติขนาดใหญ่"
                desc="ไม่มีรายงานภัยพิบัติในประเทศไทยที่ถูกบันทึกใน UN ReliefWeb ขณะนี้"
                textColor={textColor} subTextColor={subText}
                cardBg={cardBg} borderColor={borderColor}
              />
            )}

            {!loadingThai && thaiDisasters.map((d, idx) => {
              const f = d.fields;
              const di = getDisasterInfo(f.type);
              const sb = getStatusBadge(f.status);
              const countries = (f.country || []).map(c => c.name).join(', ');
              return (
                <div
                  key={d.id || idx}
                  className="news-hover"
                  style={{
                    background: cardBg,
                    borderRadius: '16px', padding: '18px',
                    border: `1px solid ${borderColor}`,
                    borderLeft: `4px solid ${di.color}`,
                    display: 'flex', gap: '14px', alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: '2.2rem', lineHeight: 1, flexShrink: 0 }}>{di.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'bold', color: textColor, fontSize: '0.95rem', lineHeight: 1.4 }}>
                      {f.name}
                    </div>
                    <div style={{ color: subText, fontSize: '0.77rem', marginTop: '4px' }}>
                      📍 {countries || 'ประเทศไทย'} &nbsp;·&nbsp; {formatDate(f.date?.created)}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {(f.type || []).map((t, ti) => {
                        const info = getDisasterInfo([t]);
                        return (
                          <span key={ti} style={{
                            background: `${info.color}20`, color: info.color,
                            padding: '2px 9px', borderRadius: '8px',
                            fontSize: '0.7rem', fontWeight: 'bold',
                          }}>{t.name}</span>
                        );
                      })}
                      <span style={{
                        background: `${sb.color}20`, color: sb.color,
                        padding: '2px 9px', borderRadius: '8px',
                        fontSize: '0.7rem', fontWeight: 'bold',
                      }}>{sb.text}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick links */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
              <a
                href="https://www.disaster.go.th/"
                target="_blank" rel="noopener noreferrer"
                style={{
                  flex: 1, minWidth: '180px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '14px', padding: '14px 16px',
                  textDecoration: 'none', color: '#ef4444',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  fontWeight: 'bold', fontSize: '0.85rem',
                  transition: 'background 0.2s',
                }}
              >
                🚨 กรมป้องกันและบรรเทาสาธารณภัย →
              </a>
              <a
                href="https://fire.gistda.or.th/"
                target="_blank" rel="noopener noreferrer"
                style={{
                  flex: 1, minWidth: '180px',
                  background: 'rgba(249,115,22,0.08)',
                  border: '1px solid rgba(249,115,22,0.3)',
                  borderRadius: '14px', padding: '14px 16px',
                  textDecoration: 'none', color: '#f97316',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  fontWeight: 'bold', fontSize: '0.85rem',
                  transition: 'background 0.2s',
                }}
              >
                🔥 GISTDA Fire Monitor →
              </a>
            </div>

          </div>
        )}

        {/* ══════════════════════════════
            TAB 3 — ภัยพิบัติโลก
        ══════════════════════════════ */}
        {activeTab === 'global' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* ── Earthquakes ── */}
            <div style={{
              background: cardBg,
              borderRadius: '20px', padding: isMobile ? '16px' : '22px',
              border: `1px solid ${borderColor}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: textColor, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🌋 แผ่นดินไหวรุนแรง (7 วัน)
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {lastEq && (
                    <span style={{ fontSize: '0.68rem', color: subText }}>
                      อัพเดท {lastEq.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <button
                    onClick={fetchEarthquakes}
                    disabled={loadingEq}
                    title="รีเฟรชข้อมูลแผ่นดินไหว"
                    style={{
                      background: 'var(--bg-secondary)', border: `1px solid ${borderColor}`,
                      borderRadius: '8px', padding: '4px 10px', cursor: 'pointer',
                      color: textColor, fontSize: '0.72rem', fontWeight: 'bold',
                      opacity: loadingEq ? 0.5 : 1, transition: 'opacity 0.2s',
                      fontFamily: 'Sarabun, sans-serif',
                    }}
                  >
                    {loadingEq ? '⏳' : '🔄'} รีเฟรช
                  </button>
                  <span style={{ fontSize: '0.68rem', color: subText }}>USGS</span>
                </div>
              </div>

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
                  const mag = p.mag;
                  const magColor = getMagColor(mag);
                  return (
                    <a
                      key={eq.id || idx}
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="news-hover"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: '14px', padding: '14px',
                        border: `1px solid ${borderColor}`,
                        textDecoration: 'none', color: 'inherit',
                        display: 'flex', alignItems: 'center', gap: '14px',
                      }}
                    >
                      {/* Magnitude badge */}
                      <div style={{
                        width: '58px', height: '58px', flexShrink: 0,
                        borderRadius: '50%',
                        background: `${magColor}18`,
                        border: `2px solid ${magColor}`,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: magColor, lineHeight: 1 }}>
                          M{mag?.toFixed(1)}
                        </div>
                        <div style={{ fontSize: '0.58rem', color: magColor, opacity: 0.85, marginTop: '1px' }}>
                          {getMagLabel(mag)}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 'bold', color: textColor,
                          fontSize: '0.88rem', lineHeight: 1.4,
                        }}>
                          {p.place}
                        </div>
                        <div style={{ color: subText, fontSize: '0.74rem', marginTop: '4px' }}>
                          🕐 {formatTimestamp(p.time)}
                          {p.tsunami === 1 && (
                            <span style={{ color: '#3b82f6', fontWeight: 'bold', marginLeft: '10px' }}>
                              🌊 เสี่ยงเกิดสึนามิ
                            </span>
                          )}
                        </div>
                        {p.felt && (
                          <div style={{ color: subText, fontSize: '0.7rem', marginTop: '2px' }}>
                            📢 มีรายงานรู้สึกได้ {p.felt.toLocaleString()} แห่ง
                          </div>
                        )}
                      </div>

                      <span style={{ color: subText, fontSize: '1.1rem', flexShrink: 0 }}>→</span>
                    </a>
                  );
                })}
              </div>

              {!loadingEq && (
                <div style={{ textAlign: 'right', marginTop: '12px' }}>
                  <a
                    href="https://earthquake.usgs.gov/earthquakes/map/"
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: '#0ea5e9', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 'bold' }}
                  >
                    ดูแผนที่แผ่นดินไหวทั้งหมดบน USGS →
                  </a>
                </div>
              )}
            </div>

            {/* ── ReliefWeb Global ── */}
            <div style={{
              background: cardBg,
              borderRadius: '20px', padding: isMobile ? '16px' : '22px',
              border: `1px solid ${borderColor}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: textColor, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🌍 ภัยพิบัติทั่วโลก (7 วัน)
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {lastGlobal && (
                    <span style={{ fontSize: '0.68rem', color: subText }}>
                      อัพเดท {lastGlobal.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <button
                    onClick={fetchGlobalDisasters}
                    disabled={loadingGlobal}
                    title="รีเฟรชข้อมูลภัยพิบัติโลก"
                    style={{
                      background: 'var(--bg-secondary)', border: `1px solid ${borderColor}`,
                      borderRadius: '8px', padding: '4px 10px', cursor: 'pointer',
                      color: textColor, fontSize: '0.72rem', fontWeight: 'bold',
                      opacity: loadingGlobal ? 0.5 : 1, transition: 'opacity 0.2s',
                      fontFamily: 'Sarabun, sans-serif',
                    }}
                  >
                    {loadingGlobal ? '⏳' : '🔄'} รีเฟรช
                  </button>
                  <span style={{ fontSize: '0.68rem', color: subText }}>UN ReliefWeb</span>
                </div>
              </div>

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
                  const f = d.fields;
                  const di = getDisasterInfo(f.type);
                  const sb = getStatusBadge(f.status);
                  const countries = (f.country || []).slice(0, 3).map(c => c.name).join(', ');
                  return (
                    <div
                      key={d.id || idx}
                      className="news-hover"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: '14px', padding: '14px',
                        border: `1px solid ${borderColor}`,
                        borderLeft: `3px solid ${di.color}`,
                        display: 'flex', gap: '12px', alignItems: 'flex-start',
                      }}
                    >
                      <span style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>{di.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 'bold', color: textColor, fontSize: '0.9rem', lineHeight: 1.4 }}>
                          {f.name}
                        </div>
                        <div style={{ color: subText, fontSize: '0.74rem', marginTop: '3px' }}>
                          {countries && `📍 ${countries} · `}{formatDate(f.date?.created)}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '7px', flexWrap: 'wrap' }}>
                          {(f.type || []).slice(0, 2).map((t, ti) => {
                            const info = getDisasterInfo([t]);
                            return (
                              <span key={ti} style={{
                                background: `${info.color}20`, color: info.color,
                                padding: '2px 8px', borderRadius: '8px',
                                fontSize: '0.69rem', fontWeight: 'bold',
                              }}>{t.name}</span>
                            );
                          })}
                          <span style={{
                            background: `${sb.color}20`, color: sb.color,
                            padding: '2px 8px', borderRadius: '8px',
                            fontSize: '0.69rem', fontWeight: 'bold',
                          }}>{sb.text}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!loadingGlobal && (
                <div style={{ textAlign: 'right', marginTop: '12px' }}>
                  <a
                    href="https://reliefweb.int/disasters"
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: '#0ea5e9', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 'bold' }}
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
          textAlign: 'center', padding: '20px 0',
          borderTop: `1px solid ${borderColor}`,
          color: subText,
        }}>
          <div style={{ fontSize: '0.78rem' }}>
            ข้อมูลจาก: USGS · UN ReliefWeb · กรมควบคุมมลพิษ · GISTDA · กรมอุตุนิยมวิทยา
          </div>
          <div style={{ fontSize: '0.7rem', marginTop: '4px', opacity: 0.7 }}>
            อัปเดตอัตโนมัติทุกครั้งที่เปิดหน้านี้
          </div>
        </div>

        <div style={{ height: isMobile ? '80px' : '0px', width: '100%', flexShrink: 0 }} />

      </div>
    </div>
  );
}
