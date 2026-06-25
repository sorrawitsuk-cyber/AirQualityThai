import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CloudLightning,
  CloudRain,
  ExternalLink,
  Flame,
  Globe2,
  MapPin,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  ThermometerSun,
  Waves,
} from 'lucide-react';

const sourceLinks = {
  'Open-Meteo': 'https://open-meteo.com/',
  TMD: 'https://www.tmd.go.th/',
  GDACS: 'https://www.gdacs.org/',
  USGS: 'https://earthquake.usgs.gov/',
  'USGS Regional (SE Asia)': 'https://earthquake.usgs.gov/',
  'ReliefWeb Thailand': 'https://reliefweb.int/country/tha',
  'ReliefWeb Global': 'https://reliefweb.int/',
  'NASA Climate / WMO': 'https://climate.nasa.gov/',
  'NASA EONET': 'https://eonet.gsfc.nasa.gov/',
  'Thai PBS': 'https://www.thaipbs.or.th/',
  'ปภ.': 'https://www.disaster.go.th/',
  'TMD แผ่นดินไหว': 'https://earthquake.tmd.go.th/',
  'NOAA CPC ENSO': 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.html',
  'IRI ENSO Forecast': 'https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/',
};

const fallbackEnso = {
  status: 'ENSO-neutral',
  alert: 'ติดตามสัญญาณแปซิฟิก',
  nino34: '-',
  updatedAt: 'รอข้อมูลล่าสุด',
  summary: 'ระบบจะดึงข้อมูล ENSO จาก API เมื่อพร้อมใช้งาน และใช้การ์ดนี้เป็นภาพรวมภูมิอากาศสำหรับติดตามแนวโน้มฝนและความร้อนของไทย',
  forecast: [
    { label: 'ระยะใกล้', value: 'ติดตาม', detail: 'ดูสัญญาณจาก NOAA และ IRI ร่วมกับประกาศกรมอุตุฯ' },
    { label: 'ผลต่อไทย', value: 'ฝน/ร้อน', detail: 'ใช้ประกอบการอ่านข่าวพายุ ฝนทิ้งช่วง และคลื่นความร้อน' },
  ],
};

const categories = [
  { id: 'all', label: 'ทั้งหมด', icon: Search, color: '#2563eb' },
  { id: 'quake', label: 'แผ่นดินไหว', icon: ShieldAlert, color: '#d97706' },
  { id: 'climate', label: 'ENSO', icon: Waves, color: '#0f766e' },
  { id: 'storm', label: 'พายุ', icon: CloudLightning, color: '#2563eb' },
  { id: 'rain', label: 'ฝน/น้ำ', icon: CloudRain, color: '#0891b2' },
  { id: 'fire', label: 'ไฟป่า', icon: Flame, color: '#dc2626' },
  { id: 'air', label: 'ฝุ่น', icon: ThermometerSun, color: '#7c3aed' },
];

const laneMeta = [
  {
    id: 'quake',
    title: 'Earthquake Watch',
    subtitle: 'แผ่นดินไหวและแรงสั่นสะเทือนในไทย เอเชียตะวันออกเฉียงใต้ และทั่วโลก',
    topics: ['quake'],
    icon: ShieldAlert,
    color: '#d97706',
  },
  {
    id: 'climate',
    title: 'ENSO & Climate Pulse',
    subtitle: 'เอลนีโญ ลานีญา อุณหภูมิมหาสมุทร และสัญญาณภูมิอากาศที่กระทบฤดูกาลไทย',
    topics: ['climate'],
    icon: Waves,
    color: '#0f766e',
  },
  {
    id: 'storm',
    title: 'Storm, Rain & Flood',
    subtitle: 'พายุ มรสุม ฝนหนัก น้ำท่วม และพยากรณ์อากาศที่ต้องวางแผนต่อ',
    topics: ['storm', 'rain', 'flood', 'weather'],
    icon: CloudRain,
    color: '#2563eb',
  },
  {
    id: 'phenomena',
    title: 'Other Natural Phenomena',
    subtitle: 'ไฟป่า ฝุ่น เหตุการณ์ดาวเทียม ภัยพิบัติ และข่าวธรรมชาติอื่นที่ควรตามต่อ',
    topics: ['fire', 'air', 'warning', 'news'],
    icon: Globe2,
    color: '#7c3aed',
  },
];

const thaiProvinceNames = [
  'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท',
  'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม', 'นครราชสีมา',
  'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์',
  'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา', 'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์',
  'แพร่', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง', 'ราชบุรี',
  'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ', 'สมุทรสงคราม', 'สมุทรสาคร',
  'สระแก้ว', 'สระบุรี', 'สิงห์บุรี', 'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย', 'หนองบัวลำภู',
  'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี',
];

const defaultPrefs = { push: true, line: true, email: false };

const asArray = (value) => Array.isArray(value) ? value : [];

function inferTopic(item = {}) {
  const text = `${item.title || ''} ${item.summary || ''} ${item.description || ''} ${item.category || ''}`.toLowerCase();
  if (/earthquake|แผ่นดินไหว/.test(text) || item.category === 'earthquake') return 'quake';
  if (/enso|el nino|la nina|climate|ภูมิอากาศ|เอลนีโญ|ลานีญา/.test(text)) return 'climate';
  if (/storm|typhoon|cyclone|พายุ|มรสุม|ลมแรง/.test(text)) return 'storm';
  if (/flood|น้ำท่วม|ฝน|rain|น้ำป่า/.test(text)) return 'rain';
  if (/wildfire|fire|ไฟป่า/.test(text)) return 'fire';
  if (/pm2\.?5|aqi|ฝุ่น|หมอกควัน|haze|air/.test(text)) return 'air';
  if (/warning|alert|เตือน|ภัย/.test(text)) return 'warning';
  if (/forecast|weather|พยากรณ์|อากาศ/.test(text)) return 'weather';
  return 'news';
}

function severityOf(item = {}) {
  const text = `${item.severity || ''} ${item.title || ''} ${item.summary || ''}`.toLowerCase();
  if (/red|high|severe|danger|รุนแรง|อันตราย|ฉุกเฉิน/.test(text)) return 'high';
  if (/orange|medium|watch|warning|เฝ้าระวัง|เตือน/.test(text)) return 'medium';
  return 'normal';
}

function severityMeta(level) {
  if (level === 'high') return { label: 'สำคัญมาก', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
  if (level === 'medium') return { label: 'เฝ้าระวัง', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
  return { label: 'ติดตาม', color: '#16a34a', bg: 'rgba(22,163,74,0.12)' };
}

function toThaiDate(value) {
  if (!value) return 'ไม่ระบุเวลา';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function itemText(item) {
  return `${item.title || ''} ${item.summary || ''} ${item.description || ''} ${item.area || ''} ${item.country || ''}`;
}

function extractAreas(items = []) {
  const counts = new Map();
  items.forEach((item) => {
    const text = itemText(item);
    thaiProvinceNames.forEach((province) => {
      if (text.includes(province)) counts.set(province, (counts.get(province) || 0) + 1);
    });
    if (item.country) counts.set(item.country, (counts.get(item.country) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));
}

function normalizeItem(item, fallback = {}) {
  if (!item?.title) return null;
  const topic = inferTopic(item);
  const severity = severityOf(item);
  const source = item.source || fallback.source || 'แหล่งข้อมูล';
  const title = String(item.title || '').trim();
  const summary = String(item.summary || item.description || title).trim();
  const area = item.area || item.country || extractAreas([item])[0]?.name || 'หลายพื้นที่';
  return {
    id: item.id || item.url || `${source}-${title}-${item.publishedAt || item.time || ''}`,
    area,
    color: categories.find((cat) => cat.id === topic)?.color || '#475569',
    publishedAt: item.publishedAt || item.time || item.updatedAt || new Date().toISOString(),
    raw: item,
    scope: /thailand|thai|tmd|ปภ|กรมอุตุ|tha/i.test(`${source} ${item.country || ''}`) ? 'thai' : 'global',
    severity,
    source,
    summary,
    title,
    topic,
    url: item.url || sourceLinks[source],
  };
}

function dedupe(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item) return false;
    const key = `${item.source}|${item.title}`.toLowerCase().replace(/\s+/g, ' ').slice(0, 180);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function openExternal(url) {
  if (!url || typeof window === 'undefined') return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function Panel({ children, style }) {
  return (
    <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, boxShadow: '0 10px 26px rgba(2,6,23,0.07)', minWidth: 0, padding: 18, ...style }}>
      {children}
    </section>
  );
}

function EventCard({ item, onOpen }) {
  const meta = severityMeta(item.severity);
  return (
    <button
      className="news-card"
      onClick={() => onOpen(item)}
      type="button"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 14,
        cursor: 'pointer',
        minHeight: 176,
        padding: 14,
        textAlign: 'left',
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: 8, justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ background: meta.bg, borderRadius: 999, color: meta.color, fontSize: '0.7rem', fontWeight: 950, padding: '5px 9px' }}>{meta.label}</span>
        <span style={{ color: 'var(--text-sub)', fontSize: '0.68rem', fontWeight: 800 }}>{toThaiDate(item.publishedAt)}</span>
      </div>
      <h3 style={{ color: 'var(--text-main)', fontSize: '0.96rem', fontWeight: 950, lineHeight: 1.35, margin: 0 }}>{item.title}</h3>
      <p style={{ color: 'var(--text-sub)', display: '-webkit-box', fontSize: '0.78rem', fontWeight: 750, lineHeight: 1.5, margin: '8px 0 0', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3 }}>{item.summary}</p>
      <div style={{ alignItems: 'center', color: item.color, display: 'flex', fontSize: '0.72rem', fontWeight: 900, gap: 6, marginTop: 12 }}>
        <MapPin size={14} /> {item.area}
      </div>
      <div style={{ color: 'var(--text-sub)', fontSize: '0.68rem', fontWeight: 800, marginTop: 8 }}>{item.source}</div>
    </button>
  );
}

function StoryLane({ isMobile, lane, onOpen, rows }) {
  const Icon = lane.icon;
  const lead = rows[0];
  return (
    <Panel style={{ padding: isMobile ? 14 : 18 }}>
      <div style={{ alignItems: 'flex-start', display: 'flex', gap: 12, justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ alignItems: 'flex-start', display: 'flex', gap: 11, minWidth: 0 }}>
          <div style={{ alignItems: 'center', background: `${lane.color}14`, border: `1px solid ${lane.color}28`, borderRadius: 13, color: lane.color, display: 'flex', height: 42, justifyContent: 'center', width: 42 }}>
            <Icon size={21} />
          </div>
          <div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 950, lineHeight: 1.2, margin: 0 }}>{lane.title}</h2>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.76rem', fontWeight: 750, lineHeight: 1.45, margin: '5px 0 0' }}>{lane.subtitle}</p>
          </div>
        </div>
        <span style={{ background: `${lane.color}12`, borderRadius: 999, color: lane.color, flex: '0 0 auto', fontSize: '0.74rem', fontWeight: 950, padding: '6px 10px' }}>{rows.length} เรื่อง</span>
      </div>

      {lead ? (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: isMobile ? '1fr' : 'minmax(240px, 0.85fr) minmax(0, 1.15fr)' }}>
          <button onClick={() => onOpen(lead)} type="button" style={{ background: `linear-gradient(145deg, ${lane.color}1f, var(--bg-secondary))`, border: `1px solid ${lane.color}2a`, borderRadius: 16, cursor: 'pointer', minHeight: 230, padding: 16, textAlign: 'left' }}>
            <div style={{ color: lane.color, fontSize: '0.74rem', fontWeight: 950, marginBottom: 9 }}>เรื่องนำของหมวด</div>
            <h3 style={{ color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 950, lineHeight: 1.3, margin: 0 }}>{lead.title}</h3>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.82rem', fontWeight: 750, lineHeight: 1.55, margin: '10px 0 0' }}>{lead.summary}</p>
            <div style={{ alignItems: 'center', color: lane.color, display: 'flex', fontSize: '0.76rem', fontWeight: 900, gap: 7, marginTop: 14 }}>
              <Radio size={15} /> {lead.source} · {lead.area}
            </div>
          </button>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
            {rows.slice(1, 5).map((item, index) => <EventCard key={`${item.id}-${index}`} item={item} onOpen={onOpen} />)}
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 14, color: 'var(--text-sub)', fontSize: '0.82rem', fontWeight: 800, padding: 16 }}>
          ยังไม่มีเหตุการณ์ในหมวดนี้จากตัวกรองปัจจุบัน
        </div>
      )}
    </Panel>
  );
}

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [alertPrefs, setAlertPrefs] = useState(() => {
    try {
      return { ...defaultPrefs, ...JSON.parse(window.localStorage.getItem('air4thai-news-alert-prefs') || '{}') };
    } catch {
      return defaultPrefs;
    }
  });
  const [ensoFeed, setEnsoFeed] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('air4thai-enso-cache') || '{}')?.payload || null;
    } catch {
      return null;
    }
  });
  const [feed, setFeed] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('air4thai-news-feed-cache') || '{}')?.payload || null;
    } catch {
      return null;
    }
  });
  const [feedCachedAt, setFeedCachedAt] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('air4thai-news-feed-cache') || '{}')?.cachedAt || null;
    } catch {
      return null;
    }
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(!feed);
  const [query, setQuery] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('air4thai-news-alert-prefs', JSON.stringify(alertPrefs));
  }, [alertPrefs]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function loadFeed() {
      setLoading(true);
      setError('');
      try {
        const endpoint = refreshToken ? `/api/news?fresh=${refreshToken}` : '/api/news';
        const response = await fetch(endpoint, { cache: refreshToken ? 'no-store' : 'default', headers: { Accept: 'application/json' }, signal: controller.signal });
        if (!response.ok) throw new Error(`โหลดข่าวไม่สำเร็จ (${response.status})`);
        const payload = await response.json();
        if (!active) return;
        setFeed(payload);
        const cachedAt = Date.now();
        setFeedCachedAt(cachedAt);
        window.localStorage.setItem('air4thai-news-feed-cache', JSON.stringify({ cachedAt, payload }));
      } catch (loadError) {
        if (loadError.name !== 'AbortError' && active) setError(loadError.message || 'ไม่สามารถโหลดข่าวล่าสุดได้');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadFeed();
    return () => {
      active = false;
      controller.abort();
    };
  }, [refreshToken]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function loadEnso() {
      try {
        const response = await fetch('/api/enso', { cache: 'default', headers: { Accept: 'application/json' }, signal: controller.signal });
        if (!response.ok) return;
        const payload = await response.json();
        if (!active) return;
        setEnsoFeed(payload);
        window.localStorage.setItem('air4thai-enso-cache', JSON.stringify({ cachedAt: Date.now(), payload }));
      } catch {
        // ENSO can use a local fallback without blocking the news page.
      }
    }
    loadEnso();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const enso = ensoFeed || fallbackEnso;
  const allItems = useMemo(() => {
    if (!feed) return [];
    const weatherCards = asArray(feed.weather?.days).slice(0, 5).map((day) => normalizeItem({
      title: `พยากรณ์ ${toThaiDate(day.time)}`,
      summary: `${day.label || 'สภาพอากาศ'} สูงสุด ${day.max ?? '-'}°C ต่ำสุด ${day.min ?? '-'}°C โอกาสฝน ${day.rainChance ?? 0}%`,
      source: 'Open-Meteo',
      category: 'weather',
      publishedAt: day.time,
      url: sourceLinks['Open-Meteo'],
    }));
    return dedupe([
      ...asArray(feed.topStories).map((item) => normalizeItem(item)),
      ...asArray(feed.thailand?.warnings).map((item) => normalizeItem(item, { source: 'TMD' })),
      ...asArray(feed.thailand?.storms).map((item) => normalizeItem(item, { source: 'TMD' })),
      ...asArray(feed.thailand?.earthquakes).map((item) => normalizeItem(item, { source: 'TMD แผ่นดินไหว' })),
      ...asArray(feed.thailand?.disasters).map((item) => normalizeItem(item, { source: 'ปภ.' })),
      ...asArray(feed.thailand?.ddpm).map((item) => normalizeItem(item, { source: 'ปภ.' })),
      ...asArray(feed.thailand?.tmdEq).map((item) => normalizeItem(item, { source: 'TMD แผ่นดินไหว' })),
      ...asArray(feed.thailand?.thaiPbs).map((item) => normalizeItem(item, { source: 'Thai PBS' })),
      ...asArray(feed.thailand?.webSevenday).map((item) => normalizeItem(item, { source: 'TMD' })),
      ...asArray(feed.global?.alerts).map((item) => normalizeItem(item, { source: 'GDACS' })),
      ...asArray(feed.global?.earthquakes).map((item) => normalizeItem(item, { source: 'USGS' })),
      ...asArray(feed.global?.disasters).map((item) => normalizeItem(item, { source: 'ReliefWeb Global' })),
      ...asArray(feed.global?.eonet).map((item) => normalizeItem(item, { source: 'NASA EONET' })),
      ...asArray(feed.global?.climate).map((item) => normalizeItem(item, { source: 'NASA Climate / WMO' })),
      ...weatherCards,
      normalizeItem({
        title: `ENSO: ${enso.status || 'ติดตามสัญญาณภูมิอากาศ'}`,
        summary: enso.summary,
        source: 'NOAA CPC ENSO',
        category: 'climate',
        publishedAt: enso.updatedAt,
        url: sourceLinks['NOAA CPC ENSO'],
      }),
    ]).sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  }, [enso, feed]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      const categoryMatch = activeCategory === 'all' || item.topic === activeCategory || (activeCategory === 'rain' && ['rain', 'flood', 'weather'].includes(item.topic));
      const queryMatch = !q || itemText(item).toLowerCase().includes(q) || item.source.toLowerCase().includes(q);
      return categoryMatch && queryMatch;
    });
  }, [activeCategory, allItems, query]);

  const lanes = useMemo(() => laneMeta.map((lane) => ({
    ...lane,
    rows: filteredItems.filter((item) => lane.topics.includes(item.topic)).slice(0, 8),
  })), [filteredItems]);

  const hero = filteredItems.find((item) => item.severity === 'high') || filteredItems[0];
  const areas = useMemo(() => extractAreas(filteredItems), [filteredItems]);
  const highCount = filteredItems.filter((item) => item.severity === 'high').length;
  const watchCount = filteredItems.filter((item) => item.severity === 'medium').length;
  const dataMode = error && feed ? 'ใช้ข้อมูล cache' : feed ? 'ข้อมูลล่าสุด' : 'รอข้อมูล';
  const dataModeColor = error && feed ? '#f59e0b' : feed ? '#16a34a' : '#64748b';
  const dataUpdatedText = feedCachedAt ? toThaiDate(feedCachedAt) : 'ยังไม่มี cache';

  return (
    <main className="hide-scrollbar fade-in" style={{ background: 'linear-gradient(180deg, rgba(224,242,254,0.72), var(--bg-app) 34%, var(--bg-app))', color: 'var(--text-main)', fontFamily: 'Sarabun, sans-serif', minHeight: '100%', overflowX: 'hidden' }}>
      <div style={{ margin: '0 auto', maxWidth: isMobile ? 720 : 1440, padding: isMobile ? '14px' : '22px' }}>
        <section style={{ background: 'linear-gradient(135deg, rgba(219,234,254,0.96), var(--bg-card) 54%, rgba(220,252,231,0.7))', border: '1px solid var(--border-color)', borderRadius: 20, boxShadow: '0 18px 42px rgba(2,6,23,0.09)', display: 'grid', gap: 18, gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.2fr) minmax(340px, 0.8fr)', marginBottom: 16, overflow: 'hidden', padding: isMobile ? 18 : 24 }}>
          <div>
            <div style={{ alignItems: 'center', color: '#0284c7', display: 'flex', fontSize: '0.76rem', fontWeight: 950, gap: 8, marginBottom: 8 }}>
              <Radio size={16} /> Natural Events Storyboard
            </div>
            <h1 style={{ color: 'var(--text-main)', fontSize: isMobile ? '1.75rem' : '2.4rem', fontWeight: 950, letterSpacing: 0, lineHeight: 1.12, margin: 0 }}>
              ข่าวเหตุการณ์ธรรมชาติแบบอ่านเป็นเรื่อง
            </h1>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', fontWeight: 750, lineHeight: 1.55, margin: '10px 0 0', maxWidth: 760 }}>
              แยกเรื่องแผ่นดินไหว ENSO พายุ ฝน น้ำท่วม ไฟป่า ฝุ่น และเหตุการณ์ธรรมชาติอื่นให้เห็นต้นทาง พื้นที่ และระดับที่ควรติดตาม
            </p>

            <div className="search-container" style={{ alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, display: 'flex', gap: 10, marginTop: 16, maxWidth: 720, padding: '10px 12px' }}>
              <Search color="#64748b" size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาเหตุการณ์ พื้นที่ หรือแหล่งข่าว" style={{ background: 'transparent', border: 0, color: 'var(--text-main)', flex: 1, fontSize: '0.9rem', fontWeight: 800, outline: 'none' }} />
              <button onClick={() => setRefreshToken(Date.now())} type="button" style={{ alignItems: 'center', background: '#0284c7', border: 0, borderRadius: 11, color: '#fff', cursor: 'pointer', display: 'flex', height: 36, justifyContent: 'center', width: 36 }} title="รีเฟรชข่าว">
                <RefreshCw className={loading ? 'refresh-spin-active' : ''} size={16} />
              </button>
            </div>
          </div>

          <div style={{ background: hero ? `${hero.color}12` : 'var(--bg-secondary)', border: `1px solid ${hero?.color || '#94a3b8'}28`, borderRadius: 18, padding: 18 }}>
            <div style={{ alignItems: 'center', color: hero?.color || '#0284c7', display: 'flex', fontSize: '0.78rem', fontWeight: 950, gap: 7, marginBottom: 10 }}>
              <ShieldAlert size={16} /> เรื่องที่ควรดูตอนนี้
            </div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 950, lineHeight: 1.32, margin: 0 }}>{hero?.title || 'กำลังรอข่าวล่าสุด'}</h2>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.82rem', fontWeight: 750, lineHeight: 1.55, margin: '10px 0 0' }}>{hero?.summary || 'เมื่อระบบดึงข้อมูลสำเร็จ ข่าวสำคัญจะแสดงในส่วนนี้'}</p>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 15 }}>
              {[
                ['สำคัญมาก', highCount, '#ef4444'],
                ['เฝ้าระวัง', watchCount, '#f59e0b'],
                ['ทั้งหมด', filteredItems.length, '#2563eb'],
              ].map(([label, value, color]) => (
                <div key={label} style={{ background: `${color}10`, border: `1px solid ${color}22`, borderRadius: 12, padding: 10 }}>
                  <div style={{ color, fontSize: '1.45rem', fontWeight: 950, lineHeight: 1 }}>{value}</div>
                  <div style={{ color: 'var(--text-sub)', fontSize: '0.68rem', fontWeight: 850, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {categories.map((category) => {
            const Icon = category.icon;
            const active = category.id === activeCategory;
            return (
              <button key={category.id} onClick={() => setActiveCategory(category.id)} type="button" style={{ alignItems: 'center', background: active ? category.color : 'var(--bg-card)', border: `1px solid ${active ? category.color : 'var(--border-color)'}`, borderRadius: 999, color: active ? '#fff' : 'var(--text-main)', cursor: 'pointer', display: 'flex', fontSize: '0.78rem', fontWeight: 900, gap: 7, padding: '8px 12px' }}>
                <Icon size={15} /> {category.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, color: '#dc2626', fontSize: '0.82rem', fontWeight: 850, lineHeight: 1.5, marginBottom: 14, padding: 14 }}>
            {error}
          </div>
        )}

        <section style={{ alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', marginBottom: 14, padding: '12px 14px' }}>
          <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ alignItems: 'center', background: `${dataModeColor}12`, border: `1px solid ${dataModeColor}24`, borderRadius: 999, color: dataModeColor, display: 'flex', fontSize: '0.74rem', fontWeight: 950, gap: 6, padding: '6px 10px' }}>
              <Radio size={14} /> {dataMode}
            </span>
            <span style={{ color: 'var(--text-sub)', fontSize: '0.74rem', fontWeight: 850 }}>อัปเดต: {dataUpdatedText}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {['TMD', 'USGS', 'NASA EONET', 'NOAA CPC ENSO'].map((source) => (
              <button key={source} onClick={() => openExternal(sourceLinks[source])} type="button" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 999, color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 900, padding: '6px 9px' }}>
                {source}
              </button>
            ))}
          </div>
        </section>

        <section style={{ display: 'grid', gap: 14, gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 320px', alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 14 }}>
            {lanes.map((lane) => <StoryLane key={lane.id} isMobile={isMobile} lane={lane} onOpen={setSelectedItem} rows={lane.rows} />)}
          </div>

          <aside style={{ display: 'grid', gap: 14 }}>
            <Panel>
              <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 950, margin: 0 }}>ENSO Brief</h2>
                <Waves color="#0f766e" size={19} />
              </div>
              <div style={{ color: '#0f766e', fontSize: '1.45rem', fontWeight: 950, lineHeight: 1 }}>{enso.status || 'ENSO'}</div>
              <div style={{ color: 'var(--text-main)', fontSize: '0.86rem', fontWeight: 900, marginTop: 7 }}>{enso.alert || 'ติดตามแนวโน้ม'}</div>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.76rem', fontWeight: 750, lineHeight: 1.5, margin: '8px 0 0' }}>{enso.summary}</p>
              {(enso.forecast || []).slice(0, 3).map((row) => (
                <div key={`${row.label}-${row.value}`} style={{ background: 'rgba(15,118,110,0.08)', border: '1px solid rgba(15,118,110,0.18)', borderRadius: 12, marginTop: 9, padding: 10 }}>
                  <div style={{ color: '#0f766e', fontSize: '0.74rem', fontWeight: 950 }}>{row.label}: {row.value}</div>
                  <div style={{ color: 'var(--text-sub)', fontSize: '0.7rem', fontWeight: 750, lineHeight: 1.45, marginTop: 3 }}>{row.detail}</div>
                </div>
              ))}
            </Panel>

            <Panel>
              <h2 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 950, margin: '0 0 12px' }}>พื้นที่ที่ถูกกล่าวถึง</h2>
              <div style={{ display: 'grid', gap: 8 }}>
                {areas.length ? areas.map((area) => (
                  <div key={area.name} style={{ alignItems: 'center', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{area.name}</span>
                    <span style={{ background: 'rgba(37,99,235,0.12)', borderRadius: 999, color: '#2563eb', fontSize: '0.68rem', fontWeight: 950, padding: '4px 8px' }}>{area.count}</span>
                  </div>
                )) : (
                  <div style={{ color: 'var(--text-sub)', fontSize: '0.78rem', fontWeight: 800 }}>ยังไม่พบพื้นที่เด่นจากตัวกรองนี้</div>
                )}
              </div>
            </Panel>

            <Panel>
              <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 950, margin: 0 }}>ช่องทางแจ้งเตือน</h2>
                <Bell color="#2563eb" size={18} />
              </div>
              {[
                ['push', 'แจ้งเตือนบนเว็บ'],
                ['line', 'LINE / LINE OA'],
                ['email', 'อีเมลแจ้งเตือน'],
              ].map(([key, label]) => (
                <button key={key} onClick={() => setAlertPrefs((prev) => ({ ...prev, [key]: !prev[key] }))} type="button" style={{ alignItems: 'center', background: 'transparent', border: 0, color: 'var(--text-main)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', padding: '9px 0', width: '100%' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 900 }}>{label}</span>
                  <span className={`switch-bg ${alertPrefs[key] ? 'active' : ''}`}><span className="switch-handle" /></span>
                </button>
              ))}
            </Panel>
          </aside>
        </section>
      </div>

      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div style={{ background: `linear-gradient(135deg, ${selectedItem.color}, #0f172a)`, color: '#fff', padding: 22 }}>
              <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, fontSize: '0.74rem', fontWeight: 950, padding: '5px 10px' }}>{severityMeta(selectedItem.severity).label}</span>
                <button onClick={() => setSelectedItem(null)} type="button" style={{ background: 'rgba(255,255,255,0.2)', border: 0, borderRadius: 999, color: '#fff', cursor: 'pointer', fontSize: '1.2rem', height: 34, width: 34 }}>×</button>
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 950, lineHeight: 1.35, margin: '12px 0 0' }}>{selectedItem.title}</h2>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {[selectedItem.source, selectedItem.area, toThaiDate(selectedItem.publishedAt)].map((value) => (
                  <span key={value} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 999, color: 'var(--text-sub)', fontSize: '0.72rem', fontWeight: 850, padding: '6px 10px' }}>{value}</span>
                ))}
              </div>
              <p style={{ color: 'var(--text-main)', fontSize: '0.96rem', fontWeight: 750, lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>{selectedItem.summary}</p>
            </div>
            <div style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 10, justifyContent: 'flex-end', padding: 16 }}>
              <button onClick={() => setSelectedItem(null)} type="button" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 900, padding: '10px 14px' }}>ปิด</button>
              {selectedItem.url && (
                <button onClick={() => openExternal(selectedItem.url)} type="button" style={{ alignItems: 'center', background: selectedItem.color, border: 0, borderRadius: 12, color: '#fff', cursor: 'pointer', display: 'flex', fontSize: '0.84rem', fontWeight: 900, gap: 8, padding: '10px 14px' }}>
                  เปิดต้นทาง <ExternalLink size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
