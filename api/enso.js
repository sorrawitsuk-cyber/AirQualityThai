const NOAA_ENSO_URL = 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.html';
const IRI_ENSO_URL = 'https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/';
const CACHE_TTL_SECONDS = 6 * 60 * 60;

const fallbackOutlook = {
  updatedAt: null,
  sourceUpdatedAt: null,
  status: 'ไม่ยืนยันล่าสุด',
  alert: 'รอข้อมูลล่าสุดจาก NOAA/IRI',
  nino34: null,
  sourceNote: 'NOAA CPC / IRI ยังไม่พร้อมใช้งาน',
  summary: 'ไม่สามารถยืนยัน ENSO ล่าสุดจาก NOAA/IRI ได้ในขณะนี้ โปรดใช้เป็นข้อมูลสำรองและตรวจประกาศต้นทางก่อนตัดสินใจ',
  dataConfidence: 'fallback',
  fallback: true,
  forecast: [
    { label: 'ตอนนี้', value: 'รอตรวจสอบ', detail: 'ยังไม่ยืนยันสถานะล่าสุดจาก NOAA/IRI', color: '#64748b' },
    { label: '1-3 เดือน', value: 'รอข้อมูลต้นทาง', detail: 'ระบบจะอัปเดตเมื่ออ่านประกาศล่าสุดได้', color: '#64748b' },
  ],
  impacts: [
    { title: 'ฝนและฤดูมรสุม', detail: 'ฝนอาจกระจายตัวไม่สม่ำเสมอ มีทั้งช่วงฝนทิ้งช่วงและฝนหนักเฉพาะจุด ต้องดูประกาศกรมอุตุฯ ควบคู่', color: '#2563eb' },
    { title: 'ความร้อน', detail: 'หาก El Niño ชัดขึ้น ความเสี่ยงอากาศร้อนจัดและดัชนีความร้อนสูงจะเพิ่มขึ้นในหลายพื้นที่', color: '#ef4444' },
    { title: 'น้ำและเกษตร', detail: 'ควรติดตามฝนสะสมและน้ำต้นทุนรายสัปดาห์ โดยเฉพาะพื้นที่เกษตรที่พึ่งพาฝน', color: '#0f766e' },
  ],
};

function clean(text = '') {
  return String(text)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&deg;/g, '°')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchText(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: 'text/html, text/plain, */*',
        'User-Agent': 'AirQualityThai-ENSO/1.0',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function pick(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function buildOutlook(noaaHtml, iriHtml) {
  const noaa = clean(noaaHtml);
  const iri = clean(iriHtml);
  const combined = `${noaa} ${iri}`;
  if (!noaa && !iri) {
    return { ...fallbackOutlook, fetchedAt: new Date().toISOString() };
  }

  const alert = pick(noaa, [
    /ENSO Alert System Status:\s*(.*?)(?=\s+Synopsis|\s+Diagnostic Discussion|$)/i,
    /Status:\s*(.*?)(?=\s+Synopsis|$)/i,
  ]) || fallbackOutlook.alert;

  const issued = pick(noaa, [
    /(\d{1,2}\s+[A-Za-z]+\s+20\d{2})\s+ENSO Alert/i,
    /issued\s+(\d{1,2}\s+[A-Za-z]+\s+20\d{2})/i,
  ]);
  const sourceUpdatedAt = issued && !Number.isNaN(new Date(issued).getTime())
    ? new Date(issued).toISOString()
    : null;

  const nino34 = pick(combined, [
    /Ni[ñn]o-?3\.4[^-\d+]*([+-]?\d+(?:\.\d+)?\s*°?C)/i,
    /NINO3\.4[^-\d+]*([+-]?\d+(?:\.\d+)?\s*°?C)/i,
  ]) || fallbackOutlook.nino34;

  const neutralChance = pick(combined, [
    /ENSO-neutral[^%]{0,90}\((\d+% chance)\)/i,
    /(\d+%\s+chance)[^.]{0,80}ENSO-neutral/i,
  ]);
  const elNinoChance = pick(combined, [
    /El Ni[ñn]o[^%]{0,90}\((\d+% chance)\)/i,
    /(\d+%\s+chance)[^.]{0,80}El Ni[ñn]o/i,
  ]);

  return {
    ...fallbackOutlook,
    updatedAt: issued || null,
    sourceUpdatedAt,
    alert,
    nino34,
    sourceNote: issued ? `NOAA CPC / IRI อัปเดต ${issued}` : 'NOAA CPC / IRI',
    summary: iri.match(/equatorial Pacific[^.]+\./i)?.[0]
      || noaa.match(/ENSO-neutral[^.]+\./i)?.[0]
      || fallbackOutlook.summary,
    forecast: [
      { label: 'ตอนนี้', value: noaa.includes('ENSO-neutral') || iri.includes('ENSO-neutral') ? 'ENSO-neutral' : fallbackOutlook.status, detail: `Niño 3.4 ${nino34}`, color: '#2563eb' },
      { label: '1-3 เดือน', value: neutralChance || 'ติดตามรายเดือน', detail: 'สัญญาณระยะสั้นจาก NOAA CPC', color: '#0ea5e9' },
      { label: 'กลางปี', value: elNinoChance || 'โอกาส El Niño เพิ่ม', detail: 'เทียบแนวโน้มจาก IRI/CPC', color: '#f97316' },
      { label: 'ปลายปี', value: 'จับตาต่อเนื่อง', detail: 'ผลต่อฝนและความร้อนในไทยอาจชัดขึ้น', color: '#ef4444' },
    ],
    fetchedAt: new Date().toISOString(),
    fallback: false,
    dataConfidence: noaa && iri ? 'live' : 'partial',
    sources: [
      { label: 'NOAA CPC ENSO', url: NOAA_ENSO_URL },
      { label: 'IRI ENSO Forecast', url: IRI_ENSO_URL },
    ],
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=86400`);

  try {
    const [noaaHtml, iriHtml] = await Promise.all([
      fetchText(NOAA_ENSO_URL).catch(() => ''),
      fetchText(IRI_ENSO_URL).catch(() => ''),
    ]);
    return res.status(200).json(buildOutlook(noaaHtml, iriHtml));
  } catch {
    return res.status(200).json({ ...fallbackOutlook, fallback: true, fetchedAt: new Date().toISOString() });
  }
}
