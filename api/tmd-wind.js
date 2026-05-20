import { GoogleGenerativeAI } from '@google/generative-ai';
import { Buffer } from 'node:buffer';

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
let _cache = null;
let _cacheAt = 0;

const TMD_URL = 'http://www.marine.tmd.go.th/html/weather0.html';
const MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-1.5-flash'];
const AI_TIMEOUT_MS = 25000;

// Upper air analysis standard times (UTC): 00, 06, 12, 18 + supplemental 03, 09, 15, 21
const SYNOPTIC_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];
const PRESSURE_LEVELS = [925, 850, 700, 500, 300];

function nearestSynopticTime() {
  const utcH = new Date().getUTCHours();
  return SYNOPTIC_HOURS.reduce((prev, h) => (Math.abs(h - utcH) < Math.abs(prev - utcH) ? h : prev));
}

async function withTimeout(promise, ms, label = 'Operation') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try { return await Promise.race([promise, timeout]); }
  finally { clearTimeout(timer); }
}

async function fetchHtml() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(TMD_URL, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AirQualityThai/1.0)' },
    });
    if (!res.ok) throw new Error(`TMD HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function extractImageUrls(html) {
  const BASE = 'http://www.marine.tmd.go.th';
  const rx = /<img[^>]+src=["']([^"']+)["']/gi;
  const results = [];
  let m;
  while ((m = rx.exec(html)) !== null) {
    let src = m[1];
    if (src.startsWith('//')) src = 'http:' + src;
    else if (src.startsWith('/')) src = BASE + src;
    else if (!src.startsWith('http')) src = BASE + '/html/' + src;
    if (/\.(png|jpg|gif|jpeg)$/i.test(src)) results.push(src);
  }
  return results;
}

function filterWindImages(urls) {
  // Prioritize images that look like upper air charts
  const priority = urls.filter(u =>
    PRESSURE_LEVELS.some(l => u.includes(String(l))) ||
    /upper|wind|stream|front|isoba|level/i.test(u)
  );
  return (priority.length ? priority : urls).slice(0, 6);
}

function toProxyPath(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

async function fetchImageBase64(url) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || 'image/png';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return { base64: buf.toString('base64'), mimeType: ct.split(';')[0] };
  } catch {
    return null;
  }
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPrompt(pageText, synopticHour) {
  const thaiHour = (synopticHour + 7) % 24;
  return [
    'คุณเป็นนักอุตุนิยมวิทยาผู้เชี่ยวชาญ วิเคราะห์ข้อมูลลมชั้นบนจากกรมอุตุนิยมวิทยาทางทะเลไทย (TMD Marine)',
    `เวลาอ้างอิง: ${String(synopticHour).padStart(2,'0')}:00 UTC (${String(thaiHour).padStart(2,'0')}:00 น. ไทย)`,
    'ชั้นความกดอากาศที่วิเคราะห์: 925, 850, 700, 500, 300 hPa',
    '',
    'ข้อมูลจากหน้าเว็บ TMD:',
    pageText.slice(0, 2500),
    '',
    'วิเคราะห์รูปแบบลมและโอกาสเกิดฝนในไทยสำหรับประชาชนทั่วไป ตอบเป็น JSON เท่านั้น (ไม่ใส่ markdown) รูปแบบ:',
    JSON.stringify({
      quickSummary: 'สรุป 1 ประโยคสั้นๆ เข้าใจง่าย เช่น "วันนี้ฝนกระจายหลายภาค โดยเฉพาะภาคใต้และภาคตะวันตก"',
      summary: 'สรุปสภาพลมชั้นบนโดยรวม 2-3 ประโยคสำหรับผู้เชี่ยวชาญ',
      synopticHourUTC: synopticHour,
      nationalRainChance: 0,
      rainForming: 'none|possible|forming|active',
      rainFormingDesc: 'อธิบาย 1 ประโยคว่าตอนนี้ฝนกำลังก่อตัวอยู่ไหม',
      peakRainTime: 'morning|afternoon|evening|night|all-day|none',
      peakRainTimeDesc: 'เช่น "ช่วงบ่ายถึงค่ำ 13:00-20:00 น."',
      bangkok: {
        rainChance: 0,
        status: 'สถานะฝน เช่น ท้องฟ้าแจ่มใส / มีโอกาสฝนบางพื้นที่ / ฝนกระจาย',
        action: 'คำแนะนำ 1 ประโยค เช่น "ไม่ต้องพกร่ม" / "แนะนำพกร่ม"',
        detail: 'รายละเอียดเพิ่มเติมสำหรับกรุงเทพฯ และปริมณฑล',
      },
      mainDriver: 'ปัจจัยหลักที่ทำให้เกิดฝน (กระชับ 1 ประโยค)',
      regions: [
        { name: 'ภาคเหนือ', rainChance: 0, windLevel: '850hPa', pattern: 'รูปแบบลมกระชับ', detail: 'รายละเอียดเพิ่มเติม' },
        { name: 'ภาคกลาง', rainChance: 0, windLevel: '850hPa', pattern: '', detail: '' },
        { name: 'ภาคตะวันออกเฉียงเหนือ', rainChance: 0, windLevel: '850hPa', pattern: '', detail: '' },
        { name: 'ภาคตะวันออก', rainChance: 0, windLevel: '850hPa', pattern: '', detail: '' },
        { name: 'ภาคตะวันตก', rainChance: 0, windLevel: '850hPa', pattern: '', detail: '' },
        { name: 'ภาคใต้ฝั่งตะวันออก', rainChance: 0, windLevel: '850hPa', pattern: '', detail: '' },
        { name: 'ภาคใต้ฝั่งตะวันตก', rainChance: 0, windLevel: '850hPa', pattern: '', detail: '' },
      ],
      levelInsights: [
        { level: '925hPa', description: 'รูปแบบลมระดับต่ำ' },
        { level: '850hPa', description: 'รูปแบบลมระดับกลางล่าง (สำคัญสำหรับฝน)' },
        { level: '500hPa', description: 'รูปแบบลมระดับกลาง' },
      ],
      alerts: [],
      confidence: 'low|medium|high',
    }, null, 2),
    '',
    'ถ้าข้อมูลหน้าเว็บไม่ครบ ให้ใช้ความรู้อุตุนิยมวิทยาและฤดูกาลไทยประมาณค่าที่สมเหตุสมผล',
  ].join('\n');
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildFallbackAnalysis(pageText = '', synopticHour = nearestSynopticTime(), imageUrls = []) {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const thaiHour = (synopticHour + 7) % 24;
  const isRainSeason = month >= 5 && month <= 10;
  const isAfternoonOrEvening = thaiHour >= 12 && thaiHour <= 21;
  const text = String(pageText || '');
  const hasMonsoonSignal = /มรสุม|ร่องมรสุม|หย่อมความกด|ฝน|พายุ|คลื่นลม/i.test(text);
  const nationalRainChance = clampPercent((isRainSeason ? 38 : 18) + (isAfternoonOrEvening ? 12 : 0) + (hasMonsoonSignal ? 15 : 0));
  const rainForming = nationalRainChance >= 65 ? 'active' : nationalRainChance >= 45 ? 'forming' : nationalRainChance >= 25 ? 'possible' : 'none';
  const peakRainTime = isAfternoonOrEvening ? 'evening' : (isRainSeason ? 'afternoon' : 'none');
  const regionBias = [
    ['ภาคเหนือ', -8],
    ['ภาคกลาง', -4],
    ['ภาคตะวันออกเฉียงเหนือ', -2],
    ['ภาคตะวันออก', 8],
    ['ภาคตะวันตก', 3],
    ['ภาคใต้ฝั่งตะวันออก', 4],
    ['ภาคใต้ฝั่งตะวันตก', 12],
  ];

  return {
    quickSummary: rainForming === 'none'
      ? 'ยังไม่พบสัญญาณฝนเด่นจากลมชั้นบน แต่ควรติดตามเรดาร์รายพื้นที่'
      : 'มีสัญญาณฝนจากฤดูกาลและข้อมูลลมชั้นบน ควรติดตามเรดาร์ในพื้นที่',
    summary: 'ระบบใช้การประเมินสำรองจากฤดูกาล เวลาอ้างอิง และข้อความจาก TMD Marine เนื่องจาก AI วิเคราะห์ลมไม่พร้อมใช้งานชั่วคราว',
    synopticHourUTC: synopticHour,
    nationalRainChance,
    rainForming,
    rainFormingDesc: rainForming === 'none' ? 'ยังไม่เห็นการก่อตัวเด่นในภาพรวมประเทศ' : 'มีปัจจัยที่เอื้อต่อการก่อตัวของฝนในบางภูมิภาค',
    peakRainTime,
    peakRainTimeDesc: peakRainTime === 'none' ? 'ยังไม่มีช่วงฝนเด่น' : 'ช่วงบ่ายถึงค่ำเป็นช่วงที่ควรติดตามมากที่สุด',
    bangkok: {
      rainChance: clampPercent(nationalRainChance - 5),
      status: nationalRainChance >= 45 ? 'มีโอกาสฝนบางพื้นที่' : 'ฝนยังไม่เด่น',
      action: nationalRainChance >= 45 ? 'แนะนำพกร่มและดูเรดาร์ก่อนออกเดินทาง' : 'เดินทางได้ตามปกติ แต่เช็กเรดาร์ก่อนออกนอกอาคาร',
      detail: 'ค่ากรุงเทพฯ เป็นการประเมินสำรอง ควรใช้คู่กับเรดาร์ล่าสุดบนหน้าแรก',
    },
    mainDriver: hasMonsoonSignal ? 'พบคำสำคัญเกี่ยวกับมรสุม/ฝนในข้อมูล TMD' : 'ใช้ฤดูกาลและเวลาของวันเป็นปัจจัยสำรอง',
    regions: regionBias.map(([name, bias]) => ({
      name,
      rainChance: clampPercent(nationalRainChance + bias),
      windLevel: '850hPa',
      pattern: 'ประเมินสำรอง',
      detail: 'รอการวิเคราะห์ภาพลมชั้นบนแบบ AI',
    })),
    levelInsights: [
      { level: '925hPa', description: 'ข้อมูลสำรองยังไม่แยกชั้นลมระดับต่ำอย่างละเอียด' },
      { level: '850hPa', description: 'ใช้เป็นระดับอ้างอิงหลักสำหรับฝนจากลมมรสุม' },
      { level: '500hPa', description: 'รอข้อมูลภาพวิเคราะห์เพื่อประเมินการยกตัวของอากาศ' },
    ],
    alerts: nationalRainChance >= 60 ? ['ฝนมีโอกาสเด่นในบางพื้นที่ โปรดติดตามเรดาร์และประกาศกรมอุตุฯ'] : [],
    confidence: 'low',
    fallback: true,
    imagePaths: imageUrls.map(toProxyPath),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=1800, stale-while-revalidate=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  if (_cache && Date.now() - _cacheAt < CACHE_TTL) {
    return res.status(200).json(_cache);
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const [html] = await Promise.allSettled([fetchHtml()]);
    const pageText = html.status === 'fulfilled' ? stripHtml(html.value) : 'ไม่สามารถโหลดข้อมูลจาก TMD ได้';

    const imageUrls = html.status === 'fulfilled' ? filterWindImages(extractImageUrls(html.value)) : [];
    const imageFetches = await Promise.all(imageUrls.slice(0, 4).map(fetchImageBase64));
    const imageParts = imageFetches.filter(Boolean).map(d => ({ inlineData: d }));

    const synopticHour = nearestSynopticTime();
    if (!apiKey) {
      _cache = {
        ...buildFallbackAnalysis(pageText, synopticHour, imageUrls),
        model: 'deterministic-fallback',
        imageCount: imageParts.length,
        tmdAvailable: html.status === 'fulfilled',
        cachedAt: new Date().toISOString(),
        nextUpdateAt: new Date(Date.now() + CACHE_TTL).toISOString(),
      };
      _cacheAt = Date.now();
      return res.status(200).json(_cache);
    }

    const prompt = buildPrompt(pageText, synopticHour);

    const client = new GoogleGenerativeAI(apiKey);
    const parts = imageParts.length ? [{ text: prompt }, ...imageParts] : prompt;

    let raw = null;
    let usedModel = null;
    for (const modelId of MODEL_CANDIDATES) {
      try {
        const result = await withTimeout(
          client.getGenerativeModel({ model: modelId }).generateContent(parts),
          AI_TIMEOUT_MS,
          modelId,
        );
        raw = result.response.text().trim();
        usedModel = modelId;
        break;
      } catch (err) {
        console.warn(`[tmd-wind] ${modelId} failed:`, err.message?.slice(0, 120));
      }
    }

    if (!raw) throw new Error('All Gemini models failed');

    let data;
    try {
      const m = raw.match(/\{[\s\S]+\}/);
      data = m ? JSON.parse(m[0]) : { summary: raw, regions: [], nationalRainChance: 0 };
    } catch {
      data = { summary: raw, regions: [], nationalRainChance: 0 };
    }

    _cache = {
      ...data,
      model: usedModel,
      imageCount: imageParts.length,
      imagePaths: imageUrls.map(toProxyPath),
      tmdAvailable: html.status === 'fulfilled',
      cachedAt: new Date().toISOString(),
      nextUpdateAt: new Date(Date.now() + CACHE_TTL).toISOString(),
    };
    _cacheAt = Date.now();

    return res.status(200).json(_cache);
  } catch (err) {
    console.error('[tmd-wind] CRITICAL ERROR:', err);
    if (_cache) {
      return res.status(200).json({
        ..._cache,
        stale: true,
        warning: 'TMD wind analysis refresh failed; returning cached data',
      });
    }
    return res.status(200).json({
      ...buildFallbackAnalysis('', nearestSynopticTime(), []),
      model: 'deterministic-fallback',
      imageCount: 0,
      tmdAvailable: false,
      cachedAt: new Date().toISOString(),
      warning: 'TMD wind analysis is temporarily unavailable',
    });
  }
}
