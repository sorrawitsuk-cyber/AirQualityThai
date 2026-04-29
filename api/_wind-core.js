import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';

export const CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours
const DB_PATH = 'wind_analysis';
const TMD_URL = 'http://www.marine.tmd.go.th/html/weather0.html';
const MODEL = { id: 'gemini-2.0-flash', api: 'v1beta' };
const AI_TIMEOUT_MS = 25000;
const SYNOPTIC_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

// ─── Firebase ────────────────────────────────────────────────────────────────

function getDb() {
  const dbUrl = process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL;
  const config = {
    apiKey:            process.env.FIREBASE_API_KEY            || process.env.VITE_FIREBASE_API_KEY,
    authDomain:        process.env.FIREBASE_AUTH_DOMAIN        || process.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL:       dbUrl,
    projectId:         process.env.FIREBASE_PROJECT_ID         || process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     process.env.FIREBASE_STORAGE_BUCKET     || process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID|| process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.FIREBASE_APP_ID             || process.env.VITE_FIREBASE_APP_ID,
  };
  const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
  return getDatabase(app, dbUrl);
}

export async function readFirebaseCache() {
  try {
    const snap = await withTimeout(get(ref(getDb(), DB_PATH)), 4000);
    if (!snap.exists()) return null;
    const data = snap.val();
    if (data?.cachedAt && Date.now() - new Date(data.cachedAt).getTime() < CACHE_TTL) {
      return data;
    }
    return null; // stale
  } catch (err) {
    console.warn('[wind-core] Firebase read failed:', err.message?.slice(0, 80));
    return null;
  }
}

export async function writeFirebaseCache(data) {
  try {
    await withTimeout(set(ref(getDb(), DB_PATH), data), 5000);
  } catch (err) {
    console.warn('[wind-core] Firebase write failed:', err.message?.slice(0, 80));
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export async function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
  });
  try { return await Promise.race([promise, timeout]); }
  finally { clearTimeout(timer); }
}

function nearestSynopticTime() {
  const utcH = new Date().getUTCHours();
  return SYNOPTIC_HOURS.reduce((prev, h) =>
    Math.abs(h - utcH) < Math.abs(prev - utcH) ? h : prev,
  );
}

async function fetchHtml() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2000);
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

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseImagePaths(html) {
  const matches = [...html.matchAll(/<img[^>]+src=["']([^"'#?]+\.(?:gif|jpg|jpeg|png))[^"']*["']/gi)];
  return [...new Set(
    matches
      .map(m => m[1])
      .filter(src => !src.startsWith('http') || src.includes('marine.tmd.go.th'))
      .map(src => {
        if (src.startsWith('http')) {
          try { return new URL(src).pathname; } catch { return null; }
        }
        return src.startsWith('/') ? src : `/html/${src}`;
      })
      .filter(Boolean),
  )].slice(0, 8);
}

function buildPrompt(pageText, synopticHour) {
  const thaiHour = (synopticHour + 7) % 24;
  return [
    'คุณเป็นนักอุตุนิยมวิทยาผู้เชี่ยวชาญ วิเคราะห์ข้อมูลลมชั้นบนจากกรมอุตุนิยมวิทยาทางทะเลไทย (TMD Marine)',
    `เวลาอ้างอิง: ${String(synopticHour).padStart(2, '0')}:00 UTC (${String(thaiHour).padStart(2, '0')}:00 น. ไทย)`,
    'ชั้นความกดอากาศที่วิเคราะห์: 925, 850, 700, 500, 300 hPa',
    '',
    'ข้อมูลจากหน้าเว็บ TMD:',
    pageText.slice(0, 2500),
    '',
    'วิเคราะห์รูปแบบลมและโอกาสเกิดฝนในไทยสำหรับประชาชนทั่วไป ตอบเป็น JSON เท่านั้น (ไม่ใส่ markdown) รูปแบบ:',
    JSON.stringify({
      quickSummary: 'สรุป 1 ประโยคสั้นๆ เข้าใจง่าย',
      summary: 'สรุปสภาพลมชั้นบนโดยรวม 2-3 ประโยคสำหรับผู้เชี่ยวชาญ',
      synopticHourUTC: synopticHour,
      nationalRainChance: 0,
      rainForming: 'none|possible|forming|active',
      rainFormingDesc: 'อธิบาย 1 ประโยคว่าตอนนี้ฝนกำลังก่อตัวอยู่ไหม',
      peakRainTime: 'morning|afternoon|evening|night|all-day|none',
      peakRainTimeDesc: 'เช่น "ช่วงบ่ายถึงค่ำ 13:00-20:00 น."',
      bangkok: {
        rainChance: 0,
        status: 'สถานะฝน',
        action: 'คำแนะนำ 1 ประโยค',
        detail: 'รายละเอียดสำหรับกรุงเทพฯ และปริมณฑล',
      },
      mainDriver: 'ปัจจัยหลักที่ทำให้เกิดฝน (กระชับ 1 ประโยค)',
      regions: [
        { name: 'ภาคเหนือ', rainChance: 0, windLevel: '850hPa', pattern: '', detail: '' },
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

export function buildFallbackData(synopticHour) {
  const month = new Date().getMonth() + 1;
  const hour  = new Date().getHours();
  const isHotSeason   = month >= 3  && month <= 5;
  const isRainySeason = month >= 5  && month <= 10;
  const isAfternoon   = hour  >= 12 && hour  < 18;
  const isEvening     = hour  >= 18 && hour  < 22;

  let rainForming = 'none', nationalRainChance = 0, peakRainTime = 'none';
  if (isRainySeason) {
    rainForming = 'possible'; nationalRainChance = 35; peakRainTime = 'afternoon';
    if (isAfternoon || isEvening) { rainForming = 'forming'; nationalRainChance = 55; }
  } else if (isHotSeason && (isAfternoon || isEvening)) {
    rainForming = 'possible'; nationalRainChance = 25; peakRainTime = 'afternoon';
  }

  return {
    isFallback: true,
    imagePaths: [],
    quickSummary: isRainySeason ? 'ฤดูฝนเริ่มต้น มีโอกาสเกิดฝนกระจายหลายพื้นที่' : 'ท้องฟ้าส่วนใหญ่แจ่มใส แต่อาจมีฝนบางพื้นที่',
    summary: `ข้อมูลฤดูกาล: ${isRainySeason ? 'ฤดูฝน' : isHotSeason ? 'ฤดูร้อน' : 'ฤดูหนาว'}`,
    synopticHourUTC: synopticHour,
    nationalRainChance,
    rainForming,
    rainFormingDesc: `ตอนนี้ฝน${rainForming === 'active' ? 'ตกอยู่' : rainForming === 'forming' ? 'กำลังก่อตัว' : rainForming === 'possible' ? 'อาจเกิดขึ้น' : 'ไม่น่าจะเกิด'}`,
    peakRainTime,
    peakRainTimeDesc: peakRainTime === 'afternoon' ? '12:00–18:00 น.' : peakRainTime === 'evening' ? '18:00–22:00 น.' : '–',
    bangkok: {
      rainChance: Math.max(0, Math.min(100, nationalRainChance - 15)),
      status: nationalRainChance > 40 ? 'มีโอกาสฝน' : nationalRainChance > 20 ? 'ท้องฟ้าปกติ' : 'ท้องฟ้าแจ่มใส',
      action: nationalRainChance > 40 ? '🌂 แนะนำพกร่ม' : '✅ ไม่ต้องพกร่ม',
      detail: 'จากข้อมูลฤดูกาล (ระบบวิเคราะห์หลักขัดข้อง)',
    },
    mainDriver: isRainySeason ? 'ลมมรสุมตะวันออกเฉียงใต้' : 'ความร้อนจากแรงแสงอาทิตย์',
    regions: [
      { name: 'ภาคเหนือ',              rainChance: Math.max(20, nationalRainChance - 20), windLevel: '850hPa', pattern: 'ลมจากตะวันออก', detail: '' },
      { name: 'ภาคกลาง',               rainChance: Math.max(15, nationalRainChance - 25), windLevel: '850hPa', pattern: 'ลมแปรปรวน', detail: '' },
      { name: 'ภาคตะวันออกเฉียงเหนือ', rainChance: nationalRainChance - 10,              windLevel: '850hPa', pattern: 'ลมจากตะวันออก', detail: '' },
      { name: 'ภาคตะวันออก',           rainChance: nationalRainChance,                    windLevel: '850hPa', pattern: 'ลมจากทะเล', detail: '' },
      { name: 'ภาคตะวันตก',            rainChance: Math.max(nationalRainChance - 5, 15),  windLevel: '850hPa', pattern: 'ลมแปรปรวน', detail: '' },
      { name: 'ภาคใต้ฝั่งตะวันออก',   rainChance: nationalRainChance + 10,               windLevel: '850hPa', pattern: 'ลมจากทะเล', detail: '' },
      { name: 'ภาคใต้ฝั่งตะวันตก',    rainChance: nationalRainChance + 5,                windLevel: '850hPa', pattern: 'ลมจากทะเล', detail: '' },
    ],
    levelInsights: [
      { level: '925hPa', description: 'ลมระดับต่ำ: ทิศทางแปรปรวน' },
      { level: '850hPa', description: 'ลมระดับกลางล่าง: ส่วนใหญ่จากตะวันออก' },
      { level: '500hPa', description: 'ลมระดับกลาง: อ่อนไป ปานกลาง' },
    ],
    alerts: ['ข้อมูลเป็นการประมาณจากรูปแบบฤดูกาล เนื่องจากระบบวิเคราะห์หลักไม่พร้อมใช้งาน'],
    confidence: 'low',
    tmdAvailable: false,
    cachedAt: new Date().toISOString(),
  };
}

// ─── Main Gemini analysis — called only by cron, never by user requests ───────

export async function runWindAnalysis(apiKey) {
  const htmlText = await fetchHtml().catch(() => null);
  const pageText  = htmlText ? stripHtml(htmlText) : 'ไม่สามารถโหลดข้อมูลจาก TMD ได้';
  const imagePaths = htmlText ? parseImagePaths(htmlText) : [];
  const synopticHour = nearestSynopticTime();
  const prompt = buildPrompt(pageText, synopticHour);

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: MODEL.id }, { apiVersion: MODEL.api });

  const result = await withTimeout(
    model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {},
    }),
    AI_TIMEOUT_MS,
  );

  const raw = result.response.text().trim();
  let data;
  try {
    const m = raw.match(/\{[\s\S]+\}/);
    data = m ? JSON.parse(m[0]) : { summary: raw, regions: [], nationalRainChance: 0 };
  } catch {
    data = { summary: raw, regions: [], nationalRainChance: 0 };
  }

  return {
    ...data,
    imagePaths,
    model: MODEL.id,
    tmdAvailable: htmlText !== null,
    cachedAt: new Date().toISOString(),
    nextUpdateAt: new Date(Date.now() + CACHE_TTL).toISOString(),
  };
}
