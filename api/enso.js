const NOAA_ENSO_URL = 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.html';
const IRI_ENSO_URL = 'https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/';
const CACHE_TTL_SECONDS = 6 * 60 * 60;

const fallbackOutlook = {
  updatedAt: 'เม.ย. 2569',
  status: 'ENSO-neutral',
  alert: 'Final La Niña Advisory / El Niño Watch',
  nino34: '-0.2°C',
  sourceNote: 'NOAA CPC 9 เม.ย. 2569 และ IRI ENSO Quick Look เม.ย. 2569',
  summary: 'แปซิฟิกเขตร้อนอยู่ในภาวะ ENSO-neutral แต่แนวโน้มเอนเอียงไปทาง El Niño ในช่วงกลางปี 2569',
  forecast: [
    { label: 'ตอนนี้', value: 'เป็นกลาง', detail: 'หลังสิ้นสุด La Niña', color: '#2563eb' },
    { label: 'เม.ย.-มิ.ย.', value: 'เป็นกลางเด่น', detail: 'NOAA ให้โอกาสเป็นกลางสูง', color: '#0ea5e9' },
    { label: 'พ.ค.-ก.ค.', value: 'El Niño เริ่มมีโอกาส', detail: 'โอกาสเพิ่มขึ้นช่วงกลางปี', color: '#f97316' },
    { label: 'ปลายปี', value: 'จับตา El Niño', detail: 'อาจกระทบฝนและความร้อนในไทย', color: '#ef4444' },
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

  const alert = pick(noaa, [
    /ENSO Alert System Status:\s*(.*?)(?=\s+Synopsis|\s+Diagnostic Discussion|$)/i,
    /Status:\s*(.*?)(?=\s+Synopsis|$)/i,
  ]) || fallbackOutlook.alert;

  const issued = pick(noaa, [
    /(\d{1,2}\s+[A-Za-z]+\s+20\d{2})\s+ENSO Alert/i,
    /issued\s+(\d{1,2}\s+[A-Za-z]+\s+20\d{2})/i,
  ]) || 'ล่าสุดจาก NOAA CPC';

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
    updatedAt: issued,
    alert,
    nino34,
    sourceNote: `NOAA CPC / IRI อัปเดต ${issued}`,
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
