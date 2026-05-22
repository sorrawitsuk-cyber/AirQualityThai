import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CloudRain,
  ExternalLink,
  MapPin,
  Newspaper,
  RefreshCw,
  Search,
  ShieldAlert,
  ThermometerSun,
} from 'lucide-react';

const categoryOptions = [
  { id: 'all', label: 'ทั้งหมด', icon: Search, color: '#2563eb' },
  { id: 'warning', label: 'เตือนภัย', icon: ShieldAlert, color: '#ef4444' },
  { id: 'rain', label: 'ฝนหนัก', icon: CloudRain, color: '#2563eb' },
  { id: 'storm', label: 'พายุ/ลมแรง', icon: CloudRain, color: '#1d4ed8' },
  { id: 'flood', label: 'น้ำท่วม', icon: ShieldAlert, color: '#0f766e' },
  { id: 'quake', label: 'แผ่นดินไหว', icon: ShieldAlert, color: '#d97706' },
  { id: 'air', label: 'ฝุ่น/อากาศ', icon: Newspaper, color: '#7c3aed' },
  { id: 'weather', label: 'พยากรณ์', icon: CloudRain, color: '#0ea5e9' },
  { id: 'climate', label: 'ENSO/ภูมิอากาศ', icon: ThermometerSun, color: '#16a34a' },
  { id: 'news', label: 'ข่าวทั่วไป', icon: Newspaper, color: '#475569' },
];

const topicMeta = {
  warning: { label: 'เตือนภัย', icon: '⚠️', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)' },
  news: { label: 'ข่าวสาร', icon: '📰', color: '#475569', gradient: 'linear-gradient(135deg, #475569 0%, #0f172a 100%)' },
  weather: { label: 'สภาพอากาศ', icon: '⛅', color: '#0ea5e9', gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)' },
  storm: { label: 'พายุ', icon: '🌪️', color: '#2563eb', gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' },
  rain: { label: 'ฝนตกหนัก', icon: '🌧️', color: '#2563eb', gradient: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)' },
  flood: { label: 'น้ำท่วม', icon: '🌊', color: '#0f766e', gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0f766e 100%)' },
  quake: { label: 'แผ่นดินไหว', icon: '🌋', color: '#d97706', gradient: 'linear-gradient(135deg, #f97316 0%, #b45309 100%)' },
  fire: { label: 'ไฟป่า', icon: '🔥', color: '#dc2626', gradient: 'linear-gradient(135deg, #f97316 0%, #b91c1c 100%)' },
  climate: { label: 'Climate', icon: '🌍', color: '#16a34a', gradient: 'linear-gradient(135deg, #16a34a 0%, #0f766e 100%)' },
  air: { label: 'คุณภาพอากาศ', icon: '🌫️', color: '#7c3aed', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' },
};

const sourceLinks = {
  'Open-Meteo': 'https://open-meteo.com/',
  'TMD XML': 'https://www.tmd.go.th/',
  'TMD Web (พยากรณ์/เตือนภัย)': 'https://www.tmd.go.th/',
  GDACS: 'https://www.gdacs.org/',
  USGS: 'https://earthquake.usgs.gov/',
  'USGS Regional (SE Asia)': 'https://earthquake.usgs.gov/',
  'ReliefWeb Thailand': 'https://reliefweb.int/country/tha',
  'ReliefWeb Global': 'https://reliefweb.int/',
  'NASA Climate / WMO': 'https://climate.nasa.gov/',
  'NASA EONET': 'https://eonet.gsfc.nasa.gov/',
  'Thai PBS': 'https://www.thaipbs.or.th/',
  'ปภ. (DDPM)': 'https://www.disaster.go.th/',
  'TMD แผ่นดินไหว': 'https://earthquake.tmd.go.th/',
  'NOAA CPC ENSO': 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.html',
  'IRI ENSO Forecast': 'https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/',
};

const agencyCards = [
  { label: 'กรมอุตุนิยมวิทยา', short: 'TMD', key: 'TMD XML', url: 'https://www.tmd.go.th/' },
  { label: 'กรมป้องกันและบรรเทาสาธารณภัย', short: 'DDPM', key: 'ปภ. (DDPM)', url: 'https://www.disaster.go.th/' },
  { label: 'USGS', short: 'USGS', key: 'USGS', url: 'https://earthquake.usgs.gov/' },
  { label: 'NASA EONET', short: 'EONET', key: 'NASA EONET', url: 'https://eonet.gsfc.nasa.gov/' },
];

const defaultAlertPrefs = {
  push: true,
  email: false,
  line: true,
  sms: false,
};

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

const englishProvinceAliases = {
  bangkok: 'กรุงเทพมหานคร',
  krabi: 'กระบี่',
  kanchanaburi: 'กาญจนบุรี',
  kalasin: 'กาฬสินธุ์',
  'kamphaeng phet': 'กำแพงเพชร',
  'khon kaen': 'ขอนแก่น',
  chanthaburi: 'จันทบุรี',
  'chachoengsao': 'ฉะเชิงเทรา',
  'chon buri': 'ชลบุรี',
  chonburi: 'ชลบุรี',
  'chai nat': 'ชัยนาท',
  chainat: 'ชัยนาท',
  chaiyaphum: 'ชัยภูมิ',
  chumphon: 'ชุมพร',
  'chiang rai': 'เชียงราย',
  'chiang mai': 'เชียงใหม่',
  trang: 'ตรัง',
  trat: 'ตราด',
  tak: 'ตาก',
  'nakhon nayok': 'นครนายก',
  'nakhon pathom': 'นครปฐม',
  'nakhon phanom': 'นครพนม',
  'nakhon ratchasima': 'นครราชสีมา',
  'nakhon si thammarat': 'นครศรีธรรมราช',
  'nakhon sawan': 'นครสวรรค์',
  nonthaburi: 'นนทบุรี',
  narathiwat: 'นราธิวาส',
  nan: 'น่าน',
  'bueng kan': 'บึงกาฬ',
  buriram: 'บุรีรัมย์',
  'buri ram': 'บุรีรัมย์',
  'pathum thani': 'ปทุมธานี',
  'prachuap khiri khan': 'ประจวบคีรีขันธ์',
  prachinburi: 'ปราจีนบุรี',
  'prachin buri': 'ปราจีนบุรี',
  pattani: 'ปัตตานี',
  'phra nakhon si ayutthaya': 'พระนครศรีอยุธยา',
  ayutthaya: 'พระนครศรีอยุธยา',
  phayao: 'พะเยา',
  phangnga: 'พังงา',
  'phang nga': 'พังงา',
  phatthalung: 'พัทลุง',
  phichit: 'พิจิตร',
  phitsanulok: 'พิษณุโลก',
  phetchaburi: 'เพชรบุรี',
  phetchabun: 'เพชรบูรณ์',
  phrae: 'แพร่',
  phuket: 'ภูเก็ต',
  'maha sarakham': 'มหาสารคาม',
  mukdahan: 'มุกดาหาร',
  'mae hong son': 'แม่ฮ่องสอน',
  yasothon: 'ยโสธร',
  yala: 'ยะลา',
  'roi et': 'ร้อยเอ็ด',
  ranong: 'ระนอง',
  rayong: 'ระยอง',
  ratchaburi: 'ราชบุรี',
  lopburi: 'ลพบุรี',
  'lop buri': 'ลพบุรี',
  lampang: 'ลำปาง',
  lamphun: 'ลำพูน',
  loei: 'เลย',
  'si sa ket': 'ศรีสะเกษ',
  sisaket: 'ศรีสะเกษ',
  'sakon nakhon': 'สกลนคร',
  songkhla: 'สงขลา',
  satun: 'สตูล',
  'samut prakan': 'สมุทรปราการ',
  'samut songkhram': 'สมุทรสงคราม',
  'samut sakhon': 'สมุทรสาคร',
  'sa kaeo': 'สระแก้ว',
  saraburi: 'สระบุรี',
  'sing buri': 'สิงห์บุรี',
  singburi: 'สิงห์บุรี',
  sukhothai: 'สุโขทัย',
  suphanburi: 'สุพรรณบุรี',
  'suphan buri': 'สุพรรณบุรี',
  'surat thani': 'สุราษฎร์ธานี',
  surin: 'สุรินทร์',
  'nong khai': 'หนองคาย',
  'nong bua lamphu': 'หนองบัวลำภู',
  'ang thong': 'อ่างทอง',
  'amnat charoen': 'อำนาจเจริญ',
  'udon thani': 'อุดรธานี',
  uttaradit: 'อุตรดิตถ์',
  'uthai thani': 'อุทัยธานี',
  'ubon ratchathani': 'อุบลราชธานี',
};

function extractThaiProvinces(text = '', limit = 18) {
  const value = String(text || '');
  const found = [];
  const add = (province) => {
    if (province && !found.includes(province)) found.push(province);
  };

  thaiProvinceNames.forEach((province) => {
    if (value.includes(province) || value.includes(`จังหวัด${province}`)) add(province);
  });

  Object.entries(englishProvinceAliases)
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([englishName, thaiName]) => {
      const pattern = new RegExp(`(^|[^a-z])${englishName.replace(/\s+/g, '\\s+')}(?=[^a-z]|$)`, 'i');
      if (pattern.test(value)) add(thaiName);
    });

  return found.slice(0, limit);
}

const fallbackEnsoOutlook = {
  updatedAt: '26 เม.ย. 2569',
  status: 'ENSO-neutral',
  alert: 'El Niño Watch',
  nino34: '-0.2°C',
  sourceNote: 'อ้างอิง NOAA CPC 9 เม.ย. 2569 และ IRI 20 เม.ย. 2569',
  summary:
    'มหาสมุทรแปซิฟิกเขตร้อนกลับสู่ภาวะเป็นกลางแล้ว แต่สัญญาณใต้ผิวน้ำและลมตะวันตกทำให้โอกาสเกิดเอลนีโญเพิ่มขึ้นชัดเจนตั้งแต่ช่วงกลางปี 2569',
  forecast: [
    { label: 'ตอนนี้', value: 'เป็นกลาง', detail: 'Niño 3.4 ล่าสุดราว -0.2°C', color: '#2563eb' },
    { label: 'เม.ย.-มิ.ย.', value: 'NOAA: เป็นกลาง 80%', detail: 'IRI มองเอลนีโญเริ่มนำ 70%', color: '#0ea5e9' },
    { label: 'พ.ค.-ก.ค.', value: 'เอลนีโญ 61%', detail: 'NOAA ระบุมีแนวโน้มเริ่มก่อตัว', color: '#f97316' },
    { label: 'ปลายปี 2569', value: 'เอลนีโญเด่น', detail: 'IRI ให้โอกาสราว 88-94%', color: '#ef4444' },
  ],
  impacts: [
    {
      title: 'ฝนและฤดูมรสุม',
      detail: 'ช่วงที่เอลนีโญเริ่มก่อตัวมักทำให้ฝนในไทยกระจายตัวไม่สม่ำเสมอ บางพื้นที่อาจมีช่วงฝนทิ้งช่วงยาวขึ้น แต่ยังมีฝนหนักเฉพาะจุดได้จากมรสุมและพายุ จึงต้องดูเรดาร์และประกาศกรมอุตุควบคู่กัน',
      color: '#2563eb',
    },
    {
      title: 'ความร้อนและสุขภาพ',
      detail: 'ถ้าเอลนีโญชัดขึ้นในครึ่งหลังของปี ความเสี่ยงวันที่ร้อนจัดและค่าดัชนีความร้อนสูงจะเพิ่มขึ้น โดยเฉพาะเมืองใหญ่ ภาคกลาง ภาคเหนือ และพื้นที่ในเมืองที่สะสมความร้อนง่าย',
      color: '#ef4444',
    },
    {
      title: 'น้ำต้นทุนและเกษตร',
      detail: 'ฝนที่แปรปรวนอาจกระทบปริมาณน้ำในเขื่อน แหล่งน้ำชุมชน และรอบเพาะปลูก พื้นที่เกษตรควรติดตามฝนสะสมรายสัปดาห์มากกว่าดูฝนรายวันเพียงวันเดียว',
      color: '#0f766e',
    },
    {
      title: 'ฝุ่น PM2.5 และไฟป่า',
      detail: 'หากปลายปีเข้าสู่เอลนีโญและอากาศแห้งขึ้น ฤดูฝุ่นช่วงปลายปีถึงต้นปีถัดไปอาจกดดันมากขึ้น โดยเฉพาะภาคเหนือและพื้นที่ที่มีการเผาในที่โล่ง',
      color: '#f97316',
    },
    {
      title: 'ลานีญายังไม่ใช่ฉากหลัก',
      detail: 'ชุดคาดการณ์ล่าสุดให้โอกาสลานีญาต่ำมาก จึงยังไม่ควรวางแผนโดยคาดว่าจะมีฝนมากจากลานีญา แต่ควรเตรียมรับความผันผวนและความร้อนที่อาจเพิ่มขึ้น',
      color: '#7c3aed',
    },
  ],
};

const Panel = React.forwardRef(({ children, style }, ref) => (
  <section
    ref={ref}
    style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 24,
      boxShadow: '0 18px 42px rgba(15, 23, 42, 0.06)',
      ...style,
    }}
  >
    {children}
  </section>
));

Panel.displayName = 'NewsPanel';

function toThaiDateTime(value) {
  if (!value) return 'ไม่ระบุเวลา';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function toThaiShortDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getSeverityMeta(level = 'normal') {
  if (level === 'high') return { label: 'ระดับสูง', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
  if (level === 'medium') return { label: 'ระดับปานกลาง', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
  return { label: 'ระดับติดตาม', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' };
}

function inferTopic(item) {
  const text = `${item.title || ''} ${item.summary || ''} ${item.category || ''} ${item.eventLabel || ''}`.toLowerCase();
  if (/pm2\.?5|aqi|ฝุ่น|หมอกควัน|dust|haze/.test(text)) return 'air';
  if (/heat|คลื่นความร้อน|อากาศร้อน|อุณหภูมิสูง/.test(text)) return 'warning';
  if (/climate|โลกร้อน|ภูมิอากาศ|el nino|la nina|enso/.test(text)) return 'climate';
  if (/earthquake|แผ่นดินไหว/.test(text) || item.category === 'earthquake') return 'quake';
  if (/flood|น้ำท่วม|น้ำป่า|ท่วมฉับพลัน/.test(text)) return 'flood';
  if (/wildfire|ไฟป่า/.test(text)) return 'fire';
  if (/storm|typhoon|cyclone|พายุ|มรสุม|ลมแรง/.test(text) || item.category === 'storm') return 'storm';
  if (/rain|ฝน|ฝนตกหนัก/.test(text)) return 'rain';
  if (/forecast|พยากรณ์|weather|อากาศ/.test(text) || item.category === 'weather') return 'weather';
  if (['warning', 'thai-disaster', 'global-alert', 'global-disaster'].includes(item.category)) return 'warning';
  return 'news';
}

function deriveArea(item) {
  const text = `${item.title || ''} ${item.summary || ''} ${item.country || ''}`;
  if (item.country) return item.country;
  const thaiMatch = text.match(/(กรุงเทพมหานคร|ภาคเหนือ|ภาคตะวันออกเฉียงเหนือ|ภาคกลาง|ภาคตะวันออก|ภาคใต้|ภาคตะวันตก|อ่าวไทย|ทะเลอันดามัน|จังหวัด[^\s,]+)/);
  if (thaiMatch) return thaiMatch[1];
  const globalMatch = text.match(/(Myanmar|Japan|Laos|Cambodia|Vietnam|China|Philippines|Indonesia|Malaysia|Thailand|เอเชีย)/i);
  if (globalMatch) return globalMatch[1];
  return 'หลายพื้นที่';
}

function getNewsScope(item) {
  const source = `${item.source || ''}`.toLowerCase();
  const text = `${item.title || ''} ${item.summary || ''} ${item.country || ''} ${item.area || ''}`.toLowerCase();
  if (/tmd|open-meteo|กรมอุตุ|thai pbs|ปภ|ddpm|reliefweb thailand|thailand|ประเทศไทย|กรุงเทพ|ภาคเหนือ|ภาคกลาง|ภาคใต้|อ่าวไทย|อันดามัน/.test(`${source} ${text}`)) {
    return 'thai';
  }
  return 'global';
}

function normalizeDedupeText(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\b(24|48|72)\s*(ชั่วโมง|hrs?|hours?)\b/gi, '')
    .replace(/\b(ภาค|จังหวัด|province|region)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeReportText(text = '') {
  return normalizeDedupeText(text)
    .replace(/\b\d{1,2}[:.]\d{2}\b/g, '')
    .replace(/\b\d{1,2}\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*\d{2,4}\b/g, '')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
    .replace(/จังหวัด|จ\.|อำเภอ|อ\.|ตำบล|ต\./g, '')
    .replace(/กรุงเทพมหานคร|ภาคเหนือ|ภาคตะวันออกเฉียงเหนือ|ภาคกลาง|ภาคตะวันออก|ภาคใต้|ภาคตะวันตก|อ่าวไทย|ทะเลอันดามัน/g, '')
    .replace(/\d+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getReportGroupKey(item) {
  const source = normalizeDedupeText(item.source || 'source');
  const type = item.type || 'news';
  const topic = item.topic || 'news';
  const officialSources = /tmd|open meteo|open-meteo|usgs|gdacs|reliefweb|ddpm|ปภ|กรมอุตุ/i;
  const groupableTopic = ['warning', 'weather', 'storm', 'rain', 'flood', 'quake', 'fire', 'air', 'climate'].includes(topic);

  if (officialSources.test(item.source || '') && groupableTopic) {
    return `${source}|${type}|${topic}`;
  }

  const signature = normalizeReportText(`${item.eventLabel || ''} ${item.title || ''}`)
    .split(' ')
    .filter((word) => word.length > 2)
    .slice(0, 8)
    .join(' ');

  return `${source}|${type}|${topic}|${signature || normalizeReportText(item.title).slice(0, 48)}`;
}

function translateDisplayText(text = '') {
  const value = String(text || '').trim();
  if (!/[A-Za-z]/.test(value) || /[\u0E00-\u0E7F]/.test(value)) return value;

  return value
    .replace(/\bSignificant earthquake\b/gi, 'แผ่นดินไหวสำคัญ')
    .replace(/\bEarthquake\b/gi, 'แผ่นดินไหว')
    .replace(/\bTropical Cyclone\b/gi, 'พายุหมุนเขตร้อน')
    .replace(/\bFloods?\b/gi, 'น้ำท่วม')
    .replace(/\bWildfires?\b/gi, 'ไฟป่า')
    .replace(/\bVolcano\b/gi, 'ภูเขาไฟ')
    .replace(/\bDrought\b/gi, 'ภัยแล้ง')
    .replace(/\bLandslide\b/gi, 'ดินถล่ม')
    .replace(/\bHeat Wave\b/gi, 'คลื่นความร้อน')
    .replace(/\bmagnitude\b/gi, 'ขนาด')
    .replace(/\bnear\b/gi, 'ใกล้')
    .replace(/\bof\b/gi, 'ของ')
    .replace(/\bJapan\b/gi, 'ญี่ปุ่น')
    .replace(/\bMyanmar\b/gi, 'เมียนมา')
    .replace(/\bLaos\b/gi, 'ลาว')
    .replace(/\bCambodia\b/gi, 'กัมพูชา')
    .replace(/\bVietnam\b/gi, 'เวียดนาม')
    .replace(/\bChina\b/gi, 'จีน')
    .replace(/\bPhilippines\b/gi, 'ฟิลิปปินส์')
    .replace(/\bIndonesia\b/gi, 'อินโดนีเซีย')
    .replace(/\bMalaysia\b/gi, 'มาเลเซีย')
    .replace(/\bThailand\b/gi, 'ไทย')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanDdpmItem(item) {
  if (item.source !== 'ปภ.') return item;
  const rawTitle = String(item.title || '').trim();
  const stripped = rawTitle.replace(/^\d+\s*[:：-]\s*/, '').trim();
  const isAgencyOnly = /กรมป้องกันและบรรเทาสาธารณภัย|กระทรวงมหาดไทย/.test(stripped) && stripped.length < 90;
  const title = isAgencyOnly ? 'ประกาศจากกรมป้องกันและบรรเทาสาธารณภัย' : (stripped || 'ประกาศจาก ปภ.');
  const summary = item.summary && item.summary !== rawTitle
    ? item.summary
    : 'ปภ. เผยแพร่ประกาศหรือข้อมูลสถานการณ์ล่าสุด ควรเปิดแหล่งข่าวต้นทางเพื่อตรวจสอบรายละเอียดพื้นที่ เวลา และคำแนะนำอย่างเป็นทางการ';

  return { ...item, title, summary, eventLabel: item.eventLabel || 'ปภ. แจ้งเตือน' };
}

function buildTmdBrief(item) {
  if (item.source !== 'TMD') return null;
  const text = `${item.title || ''} ${item.summary || ''} ${item.rawSummary || ''}`;
  const provinces = extractThaiProvinces(text, 14);
  const areas = [...new Set((text.match(/กรุงเทพมหานคร|ภาคเหนือ|ภาคตะวันออกเฉียงเหนือ|ภาคกลาง|ภาคตะวันออก|ภาคใต้|ภาคตะวันตก|อ่าวไทย|ทะเลอันดามัน/g) || []))]
    .slice(0, 6);
  const hazards = [
    /ฝนฟ้าคะนอง/.test(text) && 'ฝนฟ้าคะนอง',
    /ลมกระโชก/.test(text) && 'ลมกระโชกแรง',
    /ฝนตกหนัก|ฝนหนัก/.test(text) && 'ฝนตกหนัก',
    /คลื่นสูง|ทะเลมีคลื่น/.test(text) && 'คลื่นลมแรง',
    /ร้อน|อุณหภูมิสูง/.test(text) && 'อากาศร้อน',
  ].filter(Boolean);
  const advice = /ฝนฟ้าคะนอง|ลมกระโชก|ฝนตกหนัก/.test(text)
    ? 'หลีกเลี่ยงพื้นที่โล่งแจ้ง ตรวจสอบเรดาร์ฝน และเผื่อเวลาเดินทาง'
    : 'ติดตามประกาศฉบับล่าสุดก่อนวางแผนกิจกรรมกลางแจ้ง';

  return {
    areas: areas.length ? areas : [item.area || 'หลายพื้นที่'],
    provinces,
    hazards: hazards.length ? hazards : [item.label || 'สภาพอากาศ'],
    advice,
  };
}

function getGroupTitle(source, topic, count) {
  if (source === 'USGS' && topic === 'quake') {
    return `รายงานแผ่นดินไหวล่าสุดโดย USGS (${count} ครั้ง)`;
  }
  if (source === 'TMD' && topic === 'quake') {
    return `แผ่นดินไหวเฝ้าระวังโดยกรมอุตุฯ (${count} ครั้ง)`;
  }
  if (source === 'TMD' && (topic === 'weather' || topic === 'storm' || topic === 'rain')) {
    return `สรุปพยากรณ์อากาศและฝนฟ้าคะนองโดยกรมอุตุฯ (${count} ภูมิภาค)`;
  }
  if (source === 'ปภ.' || source === 'ปภ. (DDPM)') {
    return `ประกาศแจ้งเตือนและระวังภัยพิบัติโดย ปภ. (${count} ประกาศ)`;
  }
  if (source === 'Open-Meteo' && topic === 'weather') {
    return `คาดการณ์สภาพอากาศล่วงหน้า (${count} วัน)`;
  }
  const topicLabel = topicMeta[topic]?.label || topic;
  return `รายงานรวมจาก ${source}: ${topicLabel} (${count} รายการ)`;
}

function getGroupSummary(source, topic, items) {
  const titles = items.map((item) => {
    let t = item.title;
    if (source === 'USGS' || source === 'TMD') {
      t = t.replace(/Significant earthquake|Earthquake|แผ่นดินไหว/gi, '').trim();
    }
    return t;
  });
  const topicLabel = topicMeta[topic]?.label || 'ข่าวสาร';
  const areas = [...new Set(items.map((item) => item.area).filter(Boolean).filter((area) => area !== 'หลายพื้นที่'))].slice(0, 6);
  const latestDate = toThaiDateTime(items[0]?.publishedAt);
  return `รวมรายงานจาก ${source} ประเภท${topicLabel} ทั้งหมด ${items.length} รายการ อัปเดตล่าสุด ${latestDate}${areas.length ? ` ครอบคลุม ${areas.join(', ')}` : ''}: ${titles.slice(0, 3).join(' | ')}${titles.length > 3 ? ' และอื่นๆ' : ''}`;
}

function groupSimilarNews(items) {
  if (!items || !items.length) return [];

  const groups = new Map();
  const ungrouped = [];

  items.forEach((item) => {
    if (!item) return;
    const key = getReportGroupKey(item);
    const canGroup = key && item.source && item.topic && item.topic !== 'news';
    if (!canGroup) {
      ungrouped.push(item);
      return;
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  const result = [...ungrouped];

  groups.forEach((list, key) => {
    if (list.length === 0) return;
    if (list.length === 1) {
      result.push(list[0]);
      return;
    }
    
    list.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

    const latest = list[0];
    const uniqueAreas = [...new Set(list.map((i) => i.area).filter(Boolean).filter((area) => area !== 'หลายพื้นที่'))];
    const totalSeverity = list.some((i) => i.severity === 'high') ? 'high' : list.some((i) => i.severity === 'medium') ? 'medium' : 'normal';

    result.push({
      ...latest,
      id: `grouped-${key}-${latest.publishedAt || Date.now()}`,
      isGroup: true,
      children: list,
      groupKey: key,
      groupedSources: [...new Set(list.map((i) => i.source).filter(Boolean))],
      title: getGroupTitle(latest.source, latest.topic, list.length),
      summary: getGroupSummary(latest.source, latest.topic, list),
      area: uniqueAreas.length ? uniqueAreas.join(', ') : 'หลายพื้นที่',
      severity: totalSeverity,
      severityMeta: getSeverityMeta(totalSeverity),
    });
  });

  return result.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
}

function NewsInfographic({ item, compact = false }) {
  if (!item.isGroup || !item.children || item.children.length === 0) return null;
  
  const topic = item.topic;
  
  if (topic === 'quake') {
    return (
      <div style={{
        marginTop: 12,
        padding: '12px 14px',
        background: 'var(--bg-secondary)',
        borderRadius: 20,
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📊 แผ่นดินไหวเปรียบเทียบ ({item.children.length} ครั้งล่าสุด)
          </span>
          <span style={{ fontSize: '0.68rem', background: '#d977061a', color: '#d97706', padding: '3px 8px', borderRadius: 8, fontWeight: 900 }}>
            USGS/TMD
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {item.children.map((sub, idx) => {
            const magMatch = sub.title.match(/ขนาด\s*([0-9.]+)/i) || sub.summary.match(/ขนาด\s*([0-9.]+)/i) || sub.title.match(/magnitude\s*([0-9.]+)/i);
            const mag = magMatch ? parseFloat(magMatch[1]) : 0;
            const magColor = mag >= 6 ? '#ef4444' : mag >= 5 ? '#f59e0b' : '#10b981';
            
            return (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 10px',
                background: 'var(--bg-card)',
                borderRadius: 14,
                borderLeft: `4px solid ${magColor}`,
                boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
              }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: `${magColor}15`,
                  color: magColor,
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 950,
                  fontSize: '0.9rem',
                  flexShrink: 0
                }}>
                  {mag || 'M'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: compact ? '0.76rem' : '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>
                    {sub.title.replace(/Significant earthquake|Earthquake|แผ่นดินไหว/gi, '').replace(/ขนาด\s*[0-9.]+/i, '').trim()}
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: '0.68rem', color: 'var(--text-sub)', marginTop: 2 }}>
                    <span>📍 {sub.area}</span>
                    <span>•</span>
                    <span>{toThaiShortDate(sub.publishedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  if (topic === 'weather' || topic === 'storm' || topic === 'rain') {
    return (
      <div style={{
        marginTop: 12,
        padding: '12px 14px',
        background: 'var(--bg-secondary)',
        borderRadius: 20,
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⛅ ข้อมูลพยากรณ์รายพื้นที่ ({item.children.length} การรายงาน)
          </span>
          <span style={{ fontSize: '0.68rem', background: '#0ea5e91a', color: '#0ea5e9', padding: '3px 8px', borderRadius: 8, fontWeight: 900 }}>
            TMD/Open-Meteo
          </span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 8
        }}>
          {item.children.slice(0, 6).map((sub, idx) => (
            <div key={idx} style={{
              padding: '10px 12px',
              background: 'var(--bg-card)',
              borderRadius: 14,
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <span style={{ fontSize: '1.4rem' }}>{sub.icon || '⛅'}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.76rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sub.title.replace(/พยากรณ์อากาศ|พยากรณ์|วัน/gi, '').trim()}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-sub)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sub.summary.replace(/สูงสุด|ต่ำสุด/gi, '').slice(0, 32)}...
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (topic === 'flood' || topic === 'warning' || topic === 'fire') {
    const severityColors = {
      high: '#ef4444',
      medium: '#f59e0b',
      normal: '#10b981'
    };
    
    return (
      <div style={{
        marginTop: 12,
        padding: '12px 14px',
        background: 'var(--bg-secondary)',
        borderRadius: 20,
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🚨 พื้นที่ภัยพิบัติและแจ้งเตือน ({item.children.length} ข้อมูลย่อย)
          </span>
          <span style={{ fontSize: '0.68rem', background: '#ef44441a', color: '#ef4444', padding: '3px 8px', borderRadius: 8, fontWeight: 900 }}>
            ปภ./กรมอุตุฯ
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {item.children.map((sub, idx) => {
            const color = severityColors[sub.severity || 'normal'];
            return (
              <div key={idx} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                background: 'var(--bg-card)',
                borderRadius: 10,
                border: `1px solid ${color}30`,
                fontSize: '0.72rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.01)'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: color, display: 'inline-block' }} />
                <span style={{ fontWeight: 900, color }}>{sub.area || 'เตือนภัย'}</span>
                <span style={{ opacity: 0.6, fontSize: '0.68rem' }}>- {sub.title.slice(0, 20)}...</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
      marginTop: 12,
      padding: '10px 12px',
      background: 'var(--bg-secondary)',
      borderRadius: 16,
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }}>
      <span style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--text-sub)', textTransform: 'uppercase' }}>
        📋 รายการรายงานที่รวบรวม ({item.children.length} รายการ)
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {item.children.map((sub, idx) => (
          <div key={idx} style={{ fontSize: '0.74rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-sub)' }}>
            <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>• {sub.title}</span>
            <span>{toThaiShortDate(sub.publishedAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function normalizeItem(item, forcedType) {
  if (!item?.title) return null;
  const cleanedItem = cleanDdpmItem({
    ...item,
    title: translateDisplayText(item.title),
    summary: translateDisplayText(item.summary || item.description || ''),
  });
  const topic = inferTopic(item);
  const meta = topicMeta[topic] || topicMeta.news;
  const severity = cleanedItem.severity || 'normal';
  const alertLike = ['warning', 'storm', 'earthquake', 'thai-disaster', 'global-alert', 'global-disaster'].includes(cleanedItem.category) || severity !== 'normal';
  const type = forcedType || (alertLike ? 'warning' : 'news');
  const normalized = {
    id: cleanedItem.id || `${cleanedItem.source || 'source'}-${cleanedItem.title}`,
    title: cleanedItem.title,
    summary: cleanedItem.summary || 'ไม่มีรายละเอียดเพิ่มเติม',
    rawSummary: cleanedItem.rawSummary || '',
    source: cleanedItem.source || 'แหล่งข่าว',
    url: cleanedItem.url || cleanedItem.link || '',
    publishedAt: cleanedItem.publishedAt || cleanedItem.time || cleanedItem.date || '',
    severity,
    severityMeta: getSeverityMeta(severity),
    topic,
    type,
    area: deriveArea(cleanedItem),
    visual: cleanedItem.visual || {},
    icon: cleanedItem.visual?.emoji || meta.icon,
    gradient: cleanedItem.visual?.gradient || meta.gradient,
    kicker: cleanedItem.visual?.kicker || meta.label,
    label: meta.label,
    color: meta.color,
    eventLabel: cleanedItem.eventLabel || meta.label,
    priorityScore: cleanedItem.priorityScore || 0,
    scope: getNewsScope(cleanedItem),
  };
  return { ...normalized, tmdBrief: buildTmdBrief(normalized) };
}

function dedupeItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const normalizedTitle = normalizeDedupeText(item.title);
    const dateValue = item.publishedAt ? new Date(item.publishedAt) : null;
    const normalizedDate = dateValue && !Number.isNaN(dateValue.getTime()) ? dateValue.toISOString().slice(0, 10) : '';
    const key = `${item.source}-${item.topic}-${normalizedTitle}-${normalizedDate}-${item.url || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchesCategory(item, activeCategory) {
  if (activeCategory === 'all') return true;
  return item.topic === activeCategory;
}

function includesQuery(item, query) {
  if (!query) return true;
  const haystack = `${item.title} ${item.summary} ${item.source} ${item.area} ${item.label}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function buildWeatherPhenomena(items = []) {
  const text = items.map((item) => `${item.title || ''} ${item.summary || ''} ${item.rawSummary || ''} ${item.label || ''}`).join(' ');
  const checks = [
    {
      title: 'ฝนฟ้าคะนองและลมกระโชกแรง',
      detail: 'พบสัญญาณจากข่าวพยากรณ์รายวัน เหมาะกับการเฝ้าระวังช่วงบ่ายถึงค่ำและการเดินทางกลางแจ้ง',
      color: '#2563eb',
      pattern: /ฝนฟ้าคะนอง|ลมกระโชก|thundershower|gust/i,
    },
    {
      title: 'ฝนตกหนักเฉพาะพื้นที่',
      detail: 'ควรดูจังหวัดที่เกี่ยวข้องและเรดาร์ฝนใกล้เวลาเดินทาง เพราะมักเกิดเป็นหย่อม ไม่เท่ากันทุกพื้นที่',
      color: '#0ea5e9',
      pattern: /ฝนตกหนัก|ฝนหนัก|heavy rain|isolated heavy/i,
    },
    {
      title: 'มรสุมและลมประจำฤดู',
      detail: 'มีผลต่อฝนและคลื่นลมหลายวันต่อเนื่อง โดยเฉพาะภาคใต้ อ่าวไทย และทะเลอันดามัน',
      color: '#0f766e',
      pattern: /มรสุม|monsoon|ลมตะวันตกเฉียงใต้|ลมตะวันออกเฉียงใต้/i,
    },
    {
      title: 'คลื่นลมทะเล',
      detail: 'เหมาะกับการแจ้งเตือนเดินเรือ ท่องเที่ยวทะเล และกิจกรรมชายฝั่ง ถ้ามีคลื่นสูงควรเลี่ยงออกเรือเล็ก',
      color: '#0284c7',
      pattern: /คลื่นสูง|ทะเลมีคลื่น|อ่าวไทย|อันดามัน|wave/i,
    },
    {
      title: 'มวลอากาศเย็นหรือความกดอากาศสูง',
      detail: 'มักเป็นตัวกระตุ้นฝนฟ้าคะนอง ลมกระโชกแรง หรืออากาศแปรปรวนในไทยตอนบน',
      color: '#7c3aed',
      pattern: /ความกดอากาศสูง|มวลอากาศเย็น|ประเทศจีน|high pressure/i,
    },
    {
      title: 'ฝุ่น PM2.5 และหมอกควัน',
      detail: 'ถ้าพบคู่กับอากาศนิ่งหรือช่วงแห้ง ควรเฝ้าระวังคุณภาพอากาศ โดยเฉพาะภาคเหนือและเมืองใหญ่',
      color: '#f97316',
      pattern: /PM2\.5|ฝุ่น|หมอกควัน|haze|dust/i,
    },
    {
      title: 'พายุหมุนเขตร้อน',
      detail: 'เป็นปรากฏการณ์ที่ต้องติดตามเส้นทางและประกาศเตือนแบบต่อเนื่อง เพราะผลกระทบเปลี่ยนเร็ว',
      color: '#ef4444',
      pattern: /พายุ|ดีเปรสชัน|โซนร้อน|ไต้ฝุ่น|cyclone|typhoon|tropical storm/i,
    },
  ];

  return checks.filter((item) => item.pattern.test(text)).slice(0, 5);
}

function buildImpactAreas(items = []) {
  const counts = new Map();
  items.forEach((item) => {
    const provinces = extractThaiProvinces(`${item.title || ''} ${item.summary || ''} ${item.area || ''}`, 8);
    provinces.forEach((province) => counts.set(province, (counts.get(province) || 0) + 1));
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));
}

function openExternal(url) {
  if (!url || typeof window === 'undefined') return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function NewsPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [feed, setFeed] = useState(() => {
    try {
      const cached = window.localStorage.getItem('air4thai-news-feed-cache');
      return cached ? JSON.parse(cached).payload : null;
    } catch {
      return null;
    }
  });
  const [ensoFeed, setEnsoFeed] = useState(() => {
    try {
      const cached = window.localStorage.getItem('air4thai-enso-cache');
      return cached ? JSON.parse(cached).payload : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !window.localStorage.getItem('air4thai-news-feed-cache');
    } catch {
      return true;
    }
  });
  const [error, setError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentHero, setCurrentHero] = useState(0);
  const [alertPrefs, setAlertPrefs] = useState(() => {
    try {
      const saved = window.localStorage.getItem('air4thai-news-alert-prefs');
      return saved ? { ...defaultAlertPrefs, ...JSON.parse(saved) } : defaultAlertPrefs;
    } catch {
      return defaultAlertPrefs;
    }
  });

  const heroRef = useRef(null);
  const detailRef = useRef(null);
  const newsRef = useRef(null);
  const ensoOutlook = ensoFeed || fallbackEnsoOutlook;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
        const response = await fetch(endpoint, {
          signal: controller.signal,
          cache: refreshToken ? 'no-store' : 'default',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
          throw new Error(`โหลดข่าวไม่สำเร็จ (${response.status})`);
        }
        const payload = await response.json();
        if (!active) return;
        setFeed(payload);
        window.localStorage.setItem('air4thai-news-feed-cache', JSON.stringify({ cachedAt: Date.now(), payload }));
      } catch (loadError) {
        if (loadError.name === 'AbortError') return;
        if (!active) return;
        setError(loadError.message || 'ไม่สามารถโหลดข่าวจากแหล่งข้อมูลได้');
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
        const response = await fetch('/api/enso', {
          signal: controller.signal,
          cache: 'default',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) return;
        const payload = await response.json();
        if (!active) return;
        setEnsoFeed(payload);
        window.localStorage.setItem('air4thai-enso-cache', JSON.stringify({ cachedAt: Date.now(), payload }));
      } catch {
        // ENSO has a robust local fallback; keep the page fast and quiet.
      }
    }

    loadEnso();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const normalizedAlerts = useMemo(() => {
    if (!feed) return [];
    const items = dedupeItems(
      [
        ...(feed.thailand?.warnings || []).map((item) => normalizeItem(item, 'warning')),
        ...(feed.thailand?.storms || []).map((item) => normalizeItem(item, 'warning')),
        ...(feed.thailand?.earthquakes || []).map((item) => normalizeItem(item, 'warning')),
        ...(feed.thailand?.disasters || []).map((item) => normalizeItem(item, 'warning')),
        ...(feed.thailand?.ddpm || []).map((item) => normalizeItem(item, 'warning')),
        ...(feed.thailand?.tmdEq || []).map((item) => normalizeItem(item, 'warning')),
        ...(feed.global?.alerts || []).map((item) => normalizeItem(item, 'warning')),
        ...(feed.global?.earthquakes || []).map((item) => normalizeItem(item, 'warning')),
        ...(feed.global?.disasters || []).map((item) => normalizeItem(item, 'warning')),
        ...(feed.global?.eonet || []).map((item) => normalizeItem(item, 'warning')),
      ].filter(Boolean),
    );
    return groupSimilarNews(items).sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
  }, [feed]);

  const normalizedStories = useMemo(() => {
    if (!feed) return [];
    const weatherCards = (feed.weather?.days || []).slice(0, 3).map((day) =>
      normalizeItem({
        title: `พยากรณ์ ${toThaiShortDate(day.time)}`,
        summary: `${day.label} สูงสุด ${day.max}°C ต่ำสุด ${day.min}°C โอกาสฝน ${day.rainChance}%`,
        source: 'Open-Meteo',
        category: 'weather',
        severity: day.rainChance >= 60 ? 'medium' : 'normal',
        publishedAt: day.time,
        url: sourceLinks['Open-Meteo'],
        visual: {
          emoji: day.rainChance >= 50 ? '🌧️' : '⛅',
          gradient: topicMeta.weather.gradient,
          kicker: 'พยากรณ์อากาศ',
        },
      }),
    );

    const items = dedupeItems(
      [
        ...(feed.topStories || []).map((item) => normalizeItem(item)),
        ...(feed.thailand?.thaiPbs || []).map((item) => normalizeItem(item, 'news')),
        ...(feed.thailand?.webSevenday || []).map((item) => normalizeItem(item, 'news')),
        ...(feed.global?.climate || []).map((item) => normalizeItem(item, 'news')),
        ...weatherCards,
      ].filter(Boolean),
    );
    return groupSimilarNews(items).sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  }, [feed]);

  const filteredAlerts = useMemo(
    () => normalizedAlerts.filter((item) => matchesCategory(item, activeCategory) && includesQuery(item, query)),
    [normalizedAlerts, activeCategory, query],
  );

  const filteredStories = useMemo(
    () => normalizedStories.filter((item) => matchesCategory(item, activeCategory) && includesQuery(item, query)),
    [normalizedStories, activeCategory, query],
  );

  const filteredThaiStories = useMemo(
    () => filteredStories.filter((item) => item.scope === 'thai'),
    [filteredStories],
  );

  const filteredGlobalStories = useMemo(
    () => filteredStories.filter((item) => item.scope === 'global'),
    [filteredStories],
  );

  const showClimatePanel = activeCategory === 'all' || activeCategory === 'climate';
  const detectedPhenomena = useMemo(
    () => buildWeatherPhenomena([...filteredAlerts, ...filteredStories]),
    [filteredAlerts, filteredStories],
  );

  const heroItems = useMemo(() => {
    const items = dedupeItems([...filteredAlerts.slice(0, 4), ...filteredStories.slice(0, 4)]);
    return items.slice(0, 4);
  }, [filteredAlerts, filteredStories]);

  const heroItem = heroItems[currentHero] || null;
  const newsStats = useMemo(() => ([
    {
      label: 'ประกาศสำคัญ',
      value: filteredAlerts.filter((item) => item.severity === 'high' || item.severity === 'medium').length,
      detail: filteredAlerts[0]?.title || 'ยังไม่มีประกาศรุนแรงในตัวกรอง',
      icon: '🚨',
      color: '#ef4444',
    },
    {
      label: 'ฝนฟ้าอากาศ',
      value: feed?.weather?.summary || 'กำลังอัปเดต',
      detail: feed?.weather?.days?.[0]
        ? `วันนี้ ${feed.weather.days[0].label} ฝน ${feed.weather.days[0].rainChance}%`
        : 'ดึงพยากรณ์จาก Open-Meteo และ TMD',
      icon: '🌦️',
      color: '#0ea5e9',
    },
    {
      label: 'ENSO',
      value: ensoOutlook.status || 'ENSO',
      detail: `${ensoOutlook.alert || ''} · ${ensoOutlook.nino34 || '-'}`,
      icon: '🌊',
      color: '#16a34a',
    },
  ]), [feed, filteredAlerts, ensoOutlook]);

  const incidentBrief = useMemo(() => {
    const highAlerts = filteredAlerts.filter((item) => item.severity === 'high');
    const mediumAlerts = filteredAlerts.filter((item) => item.severity === 'medium');
    const focusItems = [...highAlerts, ...mediumAlerts, ...filteredAlerts, ...filteredStories].slice(0, 8);
    const topIncident = focusItems[0] || null;
    const impactAreas = buildImpactAreas(focusItems);
    const topicCounts = focusItems.reduce((acc, item) => {
      acc[item.topic] = (acc[item.topic] || 0) + 1;
      return acc;
    }, {});
    const leadingTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const leadingMeta = topicMeta[leadingTopic] || topicMeta.warning;

    return {
      highCount: highAlerts.length,
      mediumCount: mediumAlerts.length,
      impactAreas,
      leadingMeta,
      topIncident,
      watchCount: filteredAlerts.length,
    };
  }, [filteredAlerts, filteredStories]);
  const filteredDigest = useMemo(() => {
    const focusItems = dedupeItems([...filteredAlerts, ...filteredStories]).slice(0, 4);
    const activeLabel = categoryOptions.find((option) => option.id === activeCategory)?.label || 'ข่าว';
    if (!focusItems.length) {
      return {
        headline: `ไม่พบข่าวในประเภท${activeLabel}ตอนนี้`,
        bullets: ['ลองเปลี่ยนประเภทข่าวหรือรีเฟรชข้อมูลเพื่อดึงรายการล่าสุด'],
      };
    }
    return {
      headline: focusItems[0].summary || focusItems[0].title,
      bullets: focusItems.slice(0, 3).map((item) => `${item.title} (${item.source || 'ไม่ระบุแหล่งข่าว'})`),
    };
  }, [activeCategory, filteredAlerts, filteredStories]);

  useEffect(() => {
    if (!heroItems.length) {
      setCurrentHero(0);
      return undefined;
    }
    setCurrentHero((current) => (current >= heroItems.length ? 0 : current));
    const timer = window.setInterval(() => {
      setCurrentHero((current) => (current + 1) % heroItems.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [heroItems]);

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const openDetail = (item) => {
    setSelectedItem(item);
    window.setTimeout(() => scrollTo(detailRef), 60);
  };

  const togglePref = (key) => {
    setAlertPrefs((current) => ({ ...current, [key]: !current[key] }));
  };

  const renderTmdBrief = (item, compact = false) => {
    if (!item?.tmdBrief) return null;
    return (
      <div style={{ marginTop: compact ? 8 : 14, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        {[
          { label: 'ต้องระวัง', value: item.tmdBrief.hazards.join(', '), tone: '#ef4444' },
          {
            label: 'พื้นที่เกี่ยวข้อง',
            value: item.tmdBrief.provinces?.length
              ? `จังหวัด: ${item.tmdBrief.provinces.join(', ')}`
              : item.tmdBrief.areas?.join(', '),
            tone: '#2563eb',
          },
          { label: 'ควรทำ', value: item.tmdBrief.advice, tone: '#16a34a' },
        ].map((block) => (
          <div key={block.label} style={{ border: `1px solid ${block.tone}2f`, background: `${block.tone}0d`, borderRadius: 14, padding: compact ? '8px 10px' : '11px 12px', minWidth: 0 }}>
            <div style={{ color: block.tone, fontSize: '0.68rem', fontWeight: 900 }}>{block.label}</div>
            <div style={{ color: 'var(--text-main)', fontSize: compact ? '0.76rem' : '0.86rem', fontWeight: 850, lineHeight: 1.5, marginTop: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: compact ? 2 : 3, WebkitBoxOrient: 'vertical' }}>
              {block.value}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderNewsList = (items, emptyText) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.length ? (
        items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => openDetail(item)}
            className={`news-card ${item.severity === 'high' ? 'news-card-warning' : ''}`}
            style={{
              borderRadius: 20,
              padding: isMobile ? 14 : 18,
              display: 'grid',
              gridTemplateColumns: isMobile ? '40px minmax(0, 1fr)' : '46px minmax(0, 1fr) 135px 34px',
              gap: isMobile ? 12 : 16,
              alignItems: (item.tmdBrief || item.isGroup) && !isMobile ? 'start' : 'center',
              textAlign: 'left',
              cursor: 'pointer',
              outline: 'none',
              width: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {item.severity === 'high' && (
              <span style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#ef4444' }} />
            )}
            <span style={{ 
              width: isMobile ? 40 : 46, 
              height: isMobile ? 40 : 46, 
              borderRadius: 14, 
              background: `${item.color}14`, 
              color: item.color, 
              display: 'grid', 
              placeItems: 'center', 
              fontSize: '1.25rem', 
              flexShrink: 0,
              boxShadow: `0 4px 10px ${item.color}0a`
            }}>
              {item.icon}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                <span style={{ color: item.color, fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</span>
                <span style={{ color: 'var(--text-sub)', fontSize: '0.72rem', fontWeight: 800 }}>{item.source}</span>
                {item.area && item.area !== 'หลายพื้นที่' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#2563eb10', color: '#2563eb', padding: '2px 8px', borderRadius: 6, fontSize: '0.64rem', fontWeight: 900 }}>
                    <MapPin size={12} />
                    {item.area}
                  </span>
                )}
                {item.severity === 'high' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: 6, fontSize: '0.64rem', fontWeight: 900 }}>
                    <span className="warning-pulse-dot" />
                    ด่วนที่สุด
                  </span>
                )}
                {item.severity === 'medium' && (
                  <span style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', padding: '2px 8px', borderRadius: 6, fontSize: '0.64rem', fontWeight: 900 }}>
                    เฝ้าระวัง
                  </span>
                )}
                {item.isGroup && (
                  <span style={{ background: 'var(--bg-secondary)', color: 'var(--text-sub)', padding: '2px 8px', borderRadius: 6, fontSize: '0.64rem', fontWeight: 900 }}>
                    🗂️ รายงานรวม ({item.children.length})
                  </span>
                )}
              </div>
              <span style={{ 
                display: 'block', 
                color: 'var(--text-main)', 
                fontWeight: 900, 
                fontSize: isMobile ? '0.92rem' : '1.02rem',
                lineHeight: 1.4, 
                whiteSpace: (item.tmdBrief || item.isGroup) ? 'normal' : 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis' 
              }}>{item.title}</span>
              <span style={{ color: 'var(--text-sub)', fontSize: '0.82rem', lineHeight: 1.55, marginTop: 5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {item.summary}
              </span>
              {item.tmdBrief && renderTmdBrief(item, true)}
              {item.isGroup && <NewsInfographic item={item} compact={true} />}
            </div>
            {!isMobile && <span style={{ color: 'var(--text-sub)', fontSize: '0.78rem', fontWeight: 800, paddingTop: (item.tmdBrief || item.isGroup) ? 4 : 0 }}>{toThaiDateTime(item.publishedAt)}</span>}
            {!isMobile && (
              <span style={{ 
                width: 34, 
                height: 34, 
                borderRadius: 999, 
                background: 'var(--bg-secondary)', 
                display: 'grid', 
                placeItems: 'center', 
                color: '#2563eb',
                transition: 'all 0.2s ease',
                border: '1px solid var(--border-color)'
              }}>
                <ChevronRight size={18} />
              </span>
            )}
          </button>
        ))
      ) : (
        <div style={{ color: 'var(--text-sub)', padding: '24px 0', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 20, border: '1px solid var(--border-color)' }}>{emptyText}</div>
      )}
    </div>
  );

  return (
    <main
      style={{
        padding: isMobile ? 14 : 24,
        background: 'var(--bg-app)',
        minHeight: '100%',
        color: 'var(--text-main)',
        fontFamily: 'Sarabun, sans-serif',
      }}
      className="hide-scrollbar"
    >
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) auto', gap: 16, alignItems: 'start', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.5rem' : '2.1rem', fontWeight: 950, letterSpacing: 0 }}>เตือนภัยและข่าวอากาศ</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-sub)', fontSize: '0.94rem', fontWeight: 550 }}>
            เรียงประกาศสำคัญก่อนข่าวทั่วไป พร้อมพื้นที่กระทบ แหล่งข้อมูล และสถานะ ENSO จากข้อมูลจริง
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
          <div
            className="search-container"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: isMobile ? '100%' : 360,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              borderRadius: 18,
              padding: '11px 16px',
            }}
          >
            <Search size={18} color="#64748b" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาข่าวสาร, เตือนภัย, พายุ, ฝนตกหนัก, PM2.5..."
              style={{
                border: 0,
                outline: 'none',
                background: 'transparent',
                width: '100%',
                color: 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.92rem',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setRefreshToken((value) => value + 1)}
            style={{
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              borderRadius: 16,
              padding: '11px 16px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
            }}
          >
            <RefreshCw size={16} className={loading ? 'refresh-spin-active' : ''} />
            รีเฟรชข้อมูล
          </button>
        </div>
      </div>

      <div style={{ color: 'var(--text-sub)', fontSize: '0.74rem', fontWeight: 900, margin: '0 0 8px' }}>
        โหมดแยกประเภทข่าว
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {categoryOptions.map((option) => {
          const Icon = option.icon;
          const active = activeCategory === option.id;
          const count = option.id === 'all'
            ? normalizedAlerts.length + normalizedStories.length
            : [...normalizedAlerts, ...normalizedStories].filter((item) => matchesCategory(item, option.id)).length;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setActiveCategory(option.id)}
              className="filter-pill"
              style={{
                border: `1px solid ${active ? option.color : 'var(--border-color)'}`,
                background: active ? option.color : 'var(--bg-card)',
                color: active ? '#fff' : 'var(--text-main)',
                borderRadius: 999,
                padding: '10px 16px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                fontSize: '0.84rem',
                boxShadow: active ? `0 8px 20px ${option.color}2b` : '0 2px 8px rgba(0,0,0,0.01)'
              }}
            >
              <Icon size={15} />
              {option.label}
              <span style={{ background: active ? 'rgba(255,255,255,0.2)' : `${option.color}12`, color: active ? '#fff' : option.color, borderRadius: 999, fontSize: '0.68rem', fontWeight: 950, minWidth: 22, padding: '2px 7px', textAlign: 'center' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <Panel style={{ maxWidth: 1220, margin: '0 auto 20px', padding: isMobile ? 16 : 20, border: `1px solid ${incidentBrief.leadingMeta.color}22`, background: `linear-gradient(135deg, ${incidentBrief.leadingMeta.color}0d 0%, var(--bg-card) 54%, var(--bg-secondary) 100%)` }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.2fr) minmax(280px, 0.8fr)', gap: 16, alignItems: 'stretch' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${incidentBrief.leadingMeta.color}28`, background: `${incidentBrief.leadingMeta.color}12`, color: incidentBrief.leadingMeta.color, borderRadius: 999, padding: '7px 12px', fontSize: '0.76rem', fontWeight: 950 }}>
              <ShieldAlert size={16} />
              สรุปเตือนภัยก่อนข่าวทั่วไป
            </div>
            <h2 style={{ color: 'var(--text-main)', fontSize: isMobile ? '1.18rem' : '1.45rem', fontWeight: 950, lineHeight: 1.3, margin: '12px 0 0' }}>
              {incidentBrief.topIncident?.title || 'ยังไม่พบประกาศรุนแรงในขณะนี้'}
            </h2>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.86rem', fontWeight: 700, lineHeight: 1.65, margin: '9px 0 0', maxWidth: 760 }}>
              {incidentBrief.topIncident?.summary || 'เมื่อโหลดข้อมูลสำเร็จ หน้านี้จะจัดลำดับประกาศสำคัญ พื้นที่กระทบ และคำแนะนำให้อ่านได้เร็วขึ้น'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {[
                ['รุนแรง', incidentBrief.highCount, '#ef4444'],
                ['เฝ้าระวัง', incidentBrief.mediumCount, '#f59e0b'],
                ['ประกาศทั้งหมด', incidentBrief.watchCount, '#2563eb'],
              ].map(([label, value, color]) => (
                <div key={label} style={{ background: `${color}10`, border: `1px solid ${color}28`, borderRadius: 12, color, fontSize: '0.76rem', fontWeight: 950, padding: '8px 11px' }}>
                  {label}: {value}
                </div>
              ))}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.58)', borderRadius: 18, padding: 14 }}>
            <div style={{ alignItems: 'center', color: 'var(--text-main)', display: 'flex', fontSize: '0.9rem', fontWeight: 950, gap: 8, marginBottom: 10 }}>
              <MapPin size={18} color="#2563eb" />
              พื้นที่ที่ถูกกล่าวถึง
            </div>
            {incidentBrief.impactAreas.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {incidentBrief.impactAreas.map((area) => (
                  <button
                    key={area.name}
                    type="button"
                    onClick={() => setQuery(area.name)}
                    style={{ background: '#2563eb10', border: '1px solid #2563eb24', borderRadius: 999, color: '#2563eb', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 900, padding: '7px 10px' }}
                  >
                    {area.name} · {area.count}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-sub)', fontSize: '0.8rem', fontWeight: 750, lineHeight: 1.5 }}>
                ยังไม่พบชื่อจังหวัดชัดเจนในประกาศล่าสุด ใช้ตัวกรองด้านบนหรือค้นหาจังหวัดได้โดยตรง
              </div>
            )}
          </div>
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 14, maxWidth: 1220, margin: '0 auto 20px' }}>
        {newsStats.map((stat) => (
          <div 
            key={stat.label} 
            style={{ 
              background: 'var(--bg-card)', 
              border: `1px solid ${stat.color}1c`, 
              borderRadius: 22, 
              padding: 16, 
              boxShadow: '0 12px 28px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ 
                width: 42, 
                height: 42, 
                borderRadius: 14, 
                display: 'grid', 
                placeItems: 'center', 
                background: `${stat.color}13`, 
                color: stat.color, 
                fontSize: '1.25rem' 
              }}>{stat.icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: stat.color, fontSize: '0.74rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{stat.label}</div>
                <div style={{ color: 'var(--text-main)', fontWeight: 950, fontSize: '1.05rem', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.value}</div>
              </div>
            </div>
            <div style={{ color: 'var(--text-sub)', fontSize: '0.8rem', lineHeight: 1.5, marginTop: 12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{stat.detail}</div>
          </div>
        ))}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.85fr) 340px', 
        gap: isMobile ? 18 : 28, 
        alignItems: 'start', 
        maxWidth: 1220, 
        margin: '0 auto 24px' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Panel
            ref={heroRef}
            style={{
              padding: 20,
              overflow: 'hidden',
              background: heroItem
                ? `linear-gradient(135deg, ${heroItem.color}14 0%, var(--bg-card) 48%, var(--bg-secondary) 100%)`
                : 'var(--bg-card)',
              color: 'var(--text-main)',
              borderRadius: 24,
              border: '1px solid var(--border-color)',
              position: 'relative'
            }}
          >
            {loading && !feed ? (
              <div style={{ padding: '24px 8px', color: 'var(--text-sub)', fontWeight: 900 }}>กำลังดึงข่าวล่าสุดจากแหล่งข้อมูลจริง...</div>
            ) : error ? (
              <div style={{ padding: '24px 8px', color: 'var(--text-main)' }}>
                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#ef4444' }}>โหลดข่าวไม่สำเร็จ</div>
                <div style={{ opacity: 0.85, marginTop: 6 }}>{error}</div>
              </div>
            ) : heroItem ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18, alignItems: 'stretch' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
                    <div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          background: `${heroItem.color}14`,
                          border: `1px solid ${heroItem.color}26`,
                          color: heroItem.color,
                          borderRadius: 999,
                          padding: '7px 14px',
                          fontWeight: 900,
                          fontSize: '0.78rem',
                        }}
                      >
                        {heroItem.severity === 'high' ? (
                          <span className="warning-pulse-dot" />
                        ) : (
                          <span>{heroItem.icon}</span>
                        )}
                        {heroItem.kicker}
                      </div>
                      <h2 style={{ margin: '14px 0 0', fontSize: isMobile ? '1.35rem' : '1.8rem', lineHeight: 1.25, fontWeight: 950, color: 'var(--text-main)' }}>
                        {heroItem.title}
                      </h2>
                      <p style={{ margin: '12px 0 0', lineHeight: 1.65, maxWidth: 660, color: 'var(--text-sub)', fontSize: '0.88rem' }}>
                        {heroItem.summary}
                      </p>
                    </div>

                    {!isMobile && (
                      <div
                        style={{
                          minWidth: 84,
                          height: 84,
                          borderRadius: 24,
                          background: `${heroItem.color}14`,
                          border: `1px solid ${heroItem.color}26`,
                          color: heroItem.color,
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: '2.4rem',
                          flexShrink: 0,
                          boxShadow: `0 8px 24px ${heroItem.color}0d`
                        }}
                      >
                        {heroItem.icon}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '10px 14px', minWidth: 150 }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-sub)', fontWeight: 800 }}>แหล่งข้อมูล</div>
                      <div style={{ fontWeight: 900, marginTop: 4, fontSize: '0.88rem' }}>{heroItem.source}</div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '10px 14px', minWidth: 150 }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-sub)', fontWeight: 800 }}>อัปเดตล่าสุด</div>
                      <div style={{ fontWeight: 900, marginTop: 4, fontSize: '0.88rem' }}>{toThaiDateTime(heroItem.publishedAt)}</div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '10px 14px', minWidth: 150 }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-sub)', fontWeight: 800 }}>พื้นที่หลัก</div>
                      <div style={{ fontWeight: 900, marginTop: 4, fontSize: '0.88rem' }}>{heroItem.area}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => openDetail(heroItem)}
                      style={{
                        border: 0,
                        background: heroItem.color,
                        color: '#fff',
                        borderRadius: 14,
                        padding: '12px 18px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        boxShadow: `0 6px 16px ${heroItem.color}3d`
                      }}
                    >
                      ดูรายละเอียดเพิ่มเติม
                    </button>
                    <button
                      type="button"
                      onClick={() => (heroItem.url ? openExternal(heroItem.url) : scrollTo(newsRef))}
                      style={{
                        border: `1px solid ${heroItem.color}44`,
                        background: 'transparent',
                        color: heroItem.color,
                        borderRadius: 14,
                        padding: '12px 18px',
                        fontWeight: 900,
                        cursor: 'pointer',
                      }}
                    >
                      {heroItem.url ? 'เปิดแหล่งข่าวต้นทาง' : 'ดูรายการข่าว'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {heroItems.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCurrentHero(index)}
                        aria-label={`slide-${index + 1}`}
                        style={{
                          width: index === currentHero ? 28 : 10,
                          height: 10,
                          borderRadius: 999,
                          border: 0,
                          background: index === currentHero ? heroItem.color : `${heroItem.color}33`,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setCurrentHero((current) => (current - 1 + heroItems.length) % heroItems.length)}
                      style={{ width: 34, height: 34, borderRadius: 999, border: `1px solid ${heroItem.color}2f`, background: `${heroItem.color}12`, color: heroItem.color, display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentHero((current) => (current + 1) % heroItems.length)}
                      style={{ width: 34, height: 34, borderRadius: 999, border: `1px solid ${heroItem.color}2f`, background: `${heroItem.color}12`, color: heroItem.color, display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '24px 8px', color: 'var(--text-sub)' }}>ยังไม่มีข่าวที่ตรงกับตัวกรองตอนนี้</div>
            )}
          </Panel>

          {showClimatePanel && (
            <Panel style={{ padding: 20, background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, var(--bg-card) 44%, rgba(249, 115, 22, 0.08) 100%)', borderRadius: 24, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.05fr) minmax(340px, 0.95fr)', gap: 20, alignItems: 'stretch' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ width: 42, height: 42, borderRadius: 16, background: 'rgba(14, 165, 233, 0.14)', color: '#0284c7', display: 'grid', placeItems: 'center' }}>
                      <ThermometerSun size={21} />
                    </span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 950 }}>ENSO: เอลนีโญ / ลานีญา</h2>
                      <div style={{ color: 'var(--text-sub)', fontSize: '0.76rem', marginTop: 3 }}>{ensoOutlook.sourceNote}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
                    {[
                      ['สถานะตอนนี้', ensoOutlook.status, '#2563eb'],
                      ['ระบบเฝ้าระวัง', ensoOutlook.alert, '#f97316'],
                      ['Niño 3.4', ensoOutlook.nino34, '#0f766e'],
                    ].map(([label, value, color]) => (
                      <div key={label} style={{ border: `1px solid ${color}2f`, background: `${color}0d`, borderRadius: 16, padding: '10px 14px', minWidth: 132 }}>
                        <div style={{ color: 'var(--text-sub)', fontSize: '0.72rem', fontWeight: 800 }}>{label}</div>
                        <div style={{ color, fontWeight: 950, fontSize: '1.02rem', marginTop: 3 }}>{value}</div>
                      </div>
                    ))}
                    {detectedPhenomena.length > 0 && (
                      <div style={{ marginTop: 16, border: '1px solid rgba(14, 165, 233, 0.18)', background: 'rgba(14, 165, 233, 0.06)', borderRadius: 18, padding: 14 }}>
                        <div style={{ fontWeight: 950, marginBottom: 4 }}>ปรากฏการณ์สภาพอากาศที่พบในข่าวตอนนี้</div>
                        <div style={{ color: 'var(--text-sub)', fontSize: '0.76rem', marginBottom: 10 }}>ดึงจากคำสำคัญในประกาศและข่าวล่าสุด เพื่อช่วยแยกว่าควรจับตาเรื่องใด</div>
                        <div style={{ display: 'grid', gap: 8 }}>
                          {detectedPhenomena.map((item) => (
                            <div key={item.title} style={{ display: 'grid', gridTemplateColumns: '10px minmax(0, 1fr)', gap: 10, alignItems: 'start', color: 'var(--text-sub)', lineHeight: 1.55, fontSize: '0.82rem' }}>
                              <span style={{ width: 8, height: 8, borderRadius: 999, background: item.color, marginTop: 8, boxShadow: `0 0 0 4px ${item.color}18` }} />
                              <span>
                                <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.86rem', marginBottom: 2 }}>{item.title}</strong>
                                {item.detail}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <p style={{ color: 'var(--text-sub)', lineHeight: 1.75, margin: '14px 0 0', fontSize: '0.88rem' }}>{ensoOutlook.summary}</p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={() => openExternal(sourceLinks['NOAA CPC ENSO'])}
                      style={{ border: '1px solid rgba(37, 99, 235, 0.28)', background: 'rgba(37, 99, 235, 0.08)', color: '#2563eb', borderRadius: 14, padding: '10px 14px', fontWeight: 900, cursor: 'pointer' }}
                    >
                      NOAA CPC
                    </button>
                    <button
                      type="button"
                      onClick={() => openExternal(sourceLinks['IRI ENSO Forecast'])}
                      style={{ border: '1px solid rgba(249, 115, 22, 0.28)', background: 'rgba(249, 115, 22, 0.08)', color: '#ea580c', borderRadius: 14, padding: '10px 14px', fontWeight: 900, cursor: 'pointer' }}
                    >
                      IRI Forecast
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
                    {ensoOutlook.forecast.map((step) => (
                      <div key={step.label} style={{ border: `1px solid ${step.color}2a`, background: 'var(--bg-card)', borderRadius: 16, padding: '11px 10px', minWidth: 0 }}>
                        <div style={{ color: 'var(--text-sub)', fontSize: '0.7rem', fontWeight: 850 }}>{step.label}</div>
                        <div style={{ color: step.color, fontWeight: 950, marginTop: 4, lineHeight: 1.28 }}>{step.value}</div>
                        <div style={{ color: 'var(--text-sub)', fontSize: '0.72rem', lineHeight: 1.45, marginTop: 5 }}>{step.detail}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.58)', borderRadius: 18, padding: 14 }}>
                    <div style={{ fontWeight: 950, marginBottom: 4 }}>ผลต่อประเทศไทย</div>
                    <div style={{ color: 'var(--text-sub)', fontSize: '0.76rem', marginBottom: 10 }}>สรุปผลกระทบที่ควรติดตามในช่วงหลายเดือนข้างหน้า</div>
                    <div style={{ display: 'grid', gap: 9 }}>
                      {ensoOutlook.impacts.map((item) => (
                        <div key={item.title} style={{ display: 'grid', gridTemplateColumns: '10px minmax(0, 1fr)', gap: 10, alignItems: 'start', color: 'var(--text-sub)', lineHeight: 1.58, fontSize: '0.82rem' }}>
                          <span style={{ width: 8, height: 8, borderRadius: 999, background: item.color, marginTop: 8, boxShadow: `0 0 0 4px ${item.color}18` }} />
                          <span>
                            <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.86rem', marginBottom: 2 }}>{item.title}</strong>
                            {item.detail}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, alignItems: 'start' }}>
            <Panel style={{ padding: 20, borderRadius: 24, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 950 }}>ข่าวไทย</h2>
                  <div style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginTop: 4 }}>ประกาศและข่าวจากแหล่งข้อมูลในประเทศ</div>
                </div>
                <span style={{ color: '#2563eb', fontSize: '0.78rem', fontWeight: 900, background: '#2563eb14', padding: '3px 10px', borderRadius: 8 }}>{filteredThaiStories.length} ข่าว</span>
              </div>
              {renderNewsList(filteredThaiStories.slice(0, 6), 'ยังไม่พบข่าวไทยในตัวกรองนี้')}
            </Panel>

            <Panel style={{ padding: 20, borderRadius: 24, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 950 }}>ข่าวต่างประเทศ</h2>
                  <div style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginTop: 4 }}>ภัยพิบัติ ภูมิอากาศ และเหตุการณ์สำคัญนอกไทย</div>
                </div>
                <span style={{ color: '#0f766e', fontSize: '0.78rem', fontWeight: 900, background: '#0f766e14', padding: '3px 10px', borderRadius: 8 }}>{filteredGlobalStories.length} ข่าว</span>
              </div>
              {renderNewsList(filteredGlobalStories.slice(0, 6), 'ยังไม่พบข่าวต่างประเทศในตัวกรองนี้')}
            </Panel>
          </div>

          <Panel ref={newsRef} style={{ padding: 20, borderRadius: 24, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 950 }}>ฟีดเหตุการณ์และข่าวล่าสุด</h2>
              <button type="button" onClick={() => setActiveCategory('news')} style={{ border: 0, background: 'transparent', color: '#2563eb', fontWeight: 900, cursor: 'pointer', fontSize: '0.86rem' }}>
                ดูทั้งหมด
              </button>
            </div>

            {loading && !feed ? (
              <div style={{ color: 'var(--text-sub)', textAlign: 'center', padding: '24px 0' }}>กำลังดึงเหตุการณ์และข่าวล่าสุด...</div>
            ) : filteredStories.length ? (
              renderNewsList(filteredStories.slice(0, 16), 'ไม่พบข่าวสารในตัวกรองนี้')
            ) : (
              <div style={{ color: 'var(--text-sub)', textAlign: 'center', padding: '24px 0' }}>ไม่พบข่าวสารในตัวกรองนี้</div>
            )}
          </Panel>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
          <Panel style={{ padding: 20, borderRadius: 24, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 950 }}>ศูนย์สถานการณ์วันนี้</h2>
              <button type="button" onClick={() => scrollTo(newsRef)} style={{ border: 0, background: 'transparent', color: '#2563eb', fontWeight: 900, cursor: 'pointer', fontSize: '0.78rem' }}>
                ดูข่าวล่าสุด
              </button>
            </div>

            <div style={{ color: 'var(--text-sub)', fontSize: '0.78rem', marginBottom: 16 }}>
              {feed?.labels?.generatedAt || 'กำลังรอข้อมูลล่าสุด'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 18 }}>
              {[
                { icon: '🚨', value: filteredAlerts.filter((item) => item.severity === 'high').length, label: 'อันตราย', color: '#ef4444' },
                { icon: '⚠️', value: filteredAlerts.filter((item) => item.severity === 'medium').length, label: 'เฝ้าระวัง', color: '#f59e0b' },
                { icon: '📰', value: filteredStories.length, label: 'ข่าวใหม่', color: '#2563eb' },
                { icon: '🌍', value: 'ไทย/โลก', label: 'ขอบเขต', color: '#22c55e' },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 14, padding: '8px 4px' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 950, color: stat.color }}>{stat.icon} {stat.value}</div>
                  <div style={{ color: 'var(--text-sub)', fontSize: '0.66rem', fontWeight: 800, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ borderRadius: 18, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: 14 }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-sub)', fontWeight: 800 }}>สรุปผลกระทบแบบอ่านเร็ว</div>
              <div style={{ marginTop: 6, fontWeight: 950, lineHeight: 1.5, fontSize: '0.88rem', color: 'var(--text-main)' }}>{filteredDigest.headline}</div>
              {filteredDigest.bullets?.length ? (
                <ul style={{ margin: '10px 0 0', paddingLeft: 16, color: 'var(--text-sub)', lineHeight: 1.6, fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredDigest.bullets.slice(0, 3).map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Panel>

          <Panel style={{ padding: 20, borderRadius: 24, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 950 }}>ช่องทางแจ้งเตือนที่สนใจ</h2>
              <Bell size={18} color="#2563eb" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['push', 'แจ้งเตือนบนเว็บไซต์', 'บันทึกความต้องการบนเครื่องนี้', '🔔'],
                ['email', 'อีเมลแจ้งเตือน', 'เตรียมรองรับเมื่อระบบเชื่อมต่อบัญชี', '✉️'],
                ['line', 'LINE / LINE OA', 'เตรียมรองรับการแจ้งเตือนรายจังหวัด', '💬'],
                ['sms', 'SMS เหตุฉุกเฉิน', 'เตรียมรองรับเฉพาะประกาศระดับรุนแรง', '📱'],
              ].map(([key, title, subtitle, icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => togglePref(key)}
                  style={{ width: '100%', border: 0, background: 'transparent', padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                    <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                    <span>
                      <span style={{ display: 'block', fontWeight: 900, fontSize: '0.86rem', color: 'var(--text-main)' }}>{title}</span>
                      <span style={{ display: 'block', color: 'var(--text-sub)', fontSize: '0.74rem', marginTop: 2 }}>{subtitle}</span>
                    </span>
                  </span>
                  <span className={`switch-bg ${alertPrefs[key] ? 'active' : ''}`}>
                    <span className="switch-handle" />
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel style={{ padding: 20, borderRadius: 24, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 950 }}>ลิงก์หน่วยงานหลัก</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              {agencyCards.map((agency) => (
                <button
                  key={agency.key}
                  type="button"
                  onClick={() => openExternal(agency.url)}
                  style={{ 
                    border: '1px solid var(--border-color)', 
                    background: 'var(--bg-card)', 
                    borderRadius: 18, 
                    padding: '12px 14px', 
                    textAlign: 'left', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb55'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(37,99,235,0.08)', display: 'grid', placeItems: 'center', fontWeight: 950, color: '#2563eb', fontSize: '0.86rem' }}>
                    {agency.short}
                  </div>
                  <div style={{ marginTop: 10, fontWeight: 900, lineHeight: 1.35, fontSize: '0.8rem', color: 'var(--text-main)' }}>{agency.label}</div>
                  <div style={{ marginTop: 4, color: 'var(--text-sub)', fontSize: '0.68rem', fontWeight: 800 }}>
                    เว็บไซต์หลัก ↗
                  </div>
                </button>
              ))}
            </div>
          </Panel>
        </aside>
      </div>

      {/* Modern Overlay News Detail Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header with Category Gradient */}
            <div style={{
              background: selectedItem.gradient || 'var(--bg-secondary)',
              padding: '24px',
              color: '#fff',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <span style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'rgba(255, 255, 255, 0.25)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.5rem',
                color: '#fff'
              }}>
                {selectedItem.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', background: 'rgba(255, 255, 255, 0.2)', padding: '3px 8px', borderRadius: 6 }}>
                    {selectedItem.kicker}
                  </span>
                  <span style={{ 
                    background: selectedItem.severity === 'high' ? 'rgba(239, 68, 68, 0.9)' : selectedItem.severity === 'medium' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(16, 185, 129, 0.9)', 
                    color: '#fff', 
                    borderRadius: 6, 
                    padding: '3px 8px', 
                    fontSize: '0.68rem', 
                    fontWeight: 900 
                  }}>
                    {selectedItem.severityMeta.label}
                  </span>
                </div>
                <h3 style={{ margin: '8px 0 0', fontSize: '1.15rem', fontWeight: 900, lineHeight: 1.35 }}>
                  {selectedItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: 0,
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              >
                ×
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="modal-body hide-scrollbar">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '8px 12px', minWidth: 120 }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-sub)' }}>แหล่งข้อมูล</div>
                  <div style={{ fontWeight: 900, fontSize: '0.86rem', marginTop: 2 }}>{selectedItem.source}</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '8px 12px', minWidth: 120 }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-sub)' }}>เวลาที่เผยแพร่</div>
                  <div style={{ fontWeight: 900, fontSize: '0.86rem', marginTop: 2 }}>{toThaiDateTime(selectedItem.publishedAt)}</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '8px 12px', minWidth: 120 }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-sub)' }}>พื้นที่เกี่ยวข้อง</div>
                  <div style={{ fontWeight: 900, fontSize: '0.86rem', marginTop: 2 }}>{selectedItem.area}</div>
                </div>
              </div>
              
              <div style={{ color: 'var(--text-main)', fontSize: '0.98rem', lineHeight: 1.75, whiteSpace: 'pre-line', marginBottom: 20 }}>
                {selectedItem.summary}
              </div>
              
              {selectedItem.isGroup && (
                <div style={{ marginBottom: 20 }}>
                  <NewsInfographic item={selectedItem} compact={false} />
                </div>
              )}
              
              {selectedItem.tmdBrief && renderTmdBrief(selectedItem)}
            </div>
            
            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10
            }}>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                style={{
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  borderRadius: 12,
                  padding: '10px 18px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontSize: '0.86rem'
                }}
              >
                ปิดหน้าต่าง
              </button>
              {selectedItem.url && (
                <button
                  type="button"
                  onClick={() => openExternal(selectedItem.url)}
                  style={{
                    border: 0,
                    background: selectedItem.color,
                    color: '#fff',
                    borderRadius: 12,
                    padding: '10px 18px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
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
