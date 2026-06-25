import { provinces77 } from '../src/provinces77.js';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

const CACHE_TTL_SECONDS = 6 * 60 * 60;
const FIREBASE_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const CHUNK_SIZE = 20;
const ARCHIVE_LAG_DAYS = 5;
const FIREBASE_CACHE_PATH = 'weather_history';
let memoryHistoryCache = null;
let memoryHistoryBuildPromise = null;

const getFirebaseUrl = (path) => {
  const dbUrl = process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL;
  if (!dbUrl) return null;
  return `${dbUrl.replace(/\/$/, '')}/${path}.json`;
};

const getFirebaseDb = () => {
  const dbUrl = process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL;
  if (!dbUrl) return null;
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: dbUrl,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
  };
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return getDatabase(app, dbUrl);
};

const fetchJson = async (url, timeoutMs = 15000) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`Open-Meteo Archive HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
};

const readCachedHistory = async () => {
  const url = getFirebaseUrl(FIREBASE_CACHE_PATH);
  if (!url) return memoryHistoryCache;
  try {
    return (await fetchJson(url, 5000)) || memoryHistoryCache;
  } catch {
    return memoryHistoryCache;
  }
};

export const writeCachedHistory = async (payload) => {
  memoryHistoryCache = payload;
  const db = getFirebaseDb();
  if (!db) return false;
  await set(ref(db, FIREBASE_CACHE_PATH), payload);
  return true;
};

const isFreshCache = (payload) => {
  if (!payload?.updatedAt) return false;
  const age = Date.now() - new Date(payload.updatedAt).getTime();
  return Number.isFinite(age) && age >= 0 && age < FIREBASE_CACHE_TTL_MS;
};

const bangkokDate = (offsetDays = 0) => {
  const date = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  date.setDate(date.getDate() + offsetDays);
  return date;
};

const toDateKey = (date) => date.toISOString().slice(0, 10);

const sum = (values = []) => Math.round(values.reduce((total, value) => total + (Number(value) || 0), 0) * 10) / 10;
const max = (values = []) => {
  const clean = values.filter((value) => Number.isFinite(Number(value)));
  return clean.length ? Math.round(Math.max(...clean.map(Number)) * 10) / 10 : null;
};
const min = (values = []) => {
  const clean = values.filter((value) => Number.isFinite(Number(value)));
  return clean.length ? Math.round(Math.min(...clean.map(Number)) * 10) / 10 : null;
};
const avg = (values = []) => {
  const clean = values.filter((value) => Number.isFinite(Number(value)));
  return clean.length ? Math.round((clean.reduce((total, value) => total + Number(value), 0) / clean.length) * 10) / 10 : null;
};

const sliceLast = (values = [], count) => values.slice(Math.max(values.length - count, 0));
const getProvinceKey = (name = '') => String(name).replace(/^จังหวัด/, '').trim();

export const buildHistoryPayload = async () => {
  const end = bangkokDate(-ARCHIVE_LAG_DAYS);
  const endDate = toDateKey(end);
  const yearStart = new Date(end);
  yearStart.setMonth(0, 1);
  const ninetyStart = new Date(end);
  ninetyStart.setDate(ninetyStart.getDate() - 89);
  const startDate = toDateKey(yearStart < ninetyStart ? yearStart : ninetyStart);
  const timestamp = Date.now();

  const chunks = [];
  for (let i = 0; i < provinces77.length; i += CHUNK_SIZE) {
    chunks.push({ offset: i, provinces: provinces77.slice(i, i + CHUNK_SIZE) });
  }

  const responses = await Promise.all(chunks.map(async ({ offset, provinces }) => {
    const latitude = provinces.map((province) => province.lat).join(',');
    const longitude = provinces.map((province) => province.lon).join(',');
    const daily = [
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'precipitation_sum',
      'wind_speed_10m_max',
    ].join(',');
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=${daily}&timezone=Asia%2FBangkok&wind_speed_unit=kmh&_t=${timestamp}`;
    const data = await fetchJson(url);
    return { offset, data: Array.isArray(data) ? data : [data] };
  }));

  const byStation = {};
  const byProvince = {};
  responses.forEach(({ offset, data }) => {
    data.forEach((item, index) => {
      const stationID = `PROV_${offset + index}`;
      const province = provinces77[offset + index];
      const provinceKey = getProvinceKey(province?.n);
      const daily = item.daily || {};
      const dates = daily.time || [];
      const rain = daily.precipitation_sum || [];
      const tempMax = daily.temperature_2m_max || [];
      const tempMin = daily.temperature_2m_min || [];
      const heatMax = daily.apparent_temperature_max || [];
      const windMax = daily.wind_speed_10m_max || [];
      const last7Rain = sliceLast(rain, 7);
      const last30Rain = sliceLast(rain, 30);
      const last90Rain = sliceLast(rain, 90);
      const last30TempMax = sliceLast(tempMax, 30);
      const last30TempMin = sliceLast(tempMin, 30);
      const last30HeatMax = sliceLast(heatMax, 30);
      const last30WindMax = sliceLast(windMax, 30);

      const metrics = {
        province: province?.n || '',
        provinceKey,
        dates,
        rainDaily: rain.map((value) => Math.round((Number(value) || 0) * 10) / 10),
        tempMaxDaily: tempMax.map((value) => Math.round((Number(value) || 0) * 10) / 10),
        tempMinDaily: tempMin.map((value) => Math.round((Number(value) || 0) * 10) / 10),
        heatMaxDaily: heatMax.map((value) => Math.round((Number(value) || 0) * 10) / 10),
        windMaxDaily: windMax.map((value) => Math.round((Number(value) || 0) * 10) / 10),
        source: 'openmeteo-archive',
        rain24h: Math.round((rain[rain.length - 1] || 0) * 10) / 10,
        rain7d: sum(last7Rain),
        rain30d: sum(last30Rain),
        rain90d: sum(last90Rain),
        rainYtd: sum(rain),
        wetDays7d: last7Rain.filter((value) => Number(value) >= 1).length,
        wetDays30d: last30Rain.filter((value) => Number(value) >= 1).length,
        dryDays30d: last30Rain.filter((value) => Number(value) < 1).length,
        maxDailyRain30d: max(last30Rain),
        tempMax30d: max(last30TempMax),
        tempMin30d: min(last30TempMin),
        heatMax30d: max(last30HeatMax),
        windMax30d: max(last30WindMax),
        tempAvg30d: avg(last30TempMax),
        hotDays30d: last30TempMax.filter((value) => Number(value) >= 35).length,
        veryHotDays30d: last30TempMax.filter((value) => Number(value) >= 40).length,
        heatRiskDays30d: last30HeatMax.filter((value) => Number(value) >= 41).length,
        windyDays30d: last30WindMax.filter((value) => Number(value) >= 30).length,
      };

      byStation[stationID] = metrics;
      if (provinceKey) byProvince[provinceKey] = metrics;
    });
  });

  return {
    updatedAt: new Date(timestamp).toISOString(),
    period: { startDate, endDate, timezone: 'Asia/Bangkok', archiveLagDays: ARCHIVE_LAG_DAYS },
    source: 'Open-Meteo Historical Weather API (ERA5)',
    cachedFrom: 'openmeteo-archive',
    byStation,
    byProvince,
  };
};

export const refreshHistoryCache = async () => {
  if (!memoryHistoryBuildPromise) {
    memoryHistoryBuildPromise = buildHistoryPayload()
      .then(async (payload) => {
        await writeCachedHistory(payload).catch(() => false);
        return payload;
      })
      .finally(() => {
        memoryHistoryBuildPromise = null;
      });
  }
  return memoryHistoryBuildPromise;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=86400`);

  try {
    const expected = process.env.CRON_SECRET;
    const allowRefresh = Boolean(expected && req.headers.authorization === `Bearer ${expected}`);
    const cached = await readCachedHistory();
    if (isFreshCache(cached)) {
      return res.status(200).json({ ...cached, cacheStatus: 'fresh' });
    }

    if (!allowRefresh) {
      if (cached?.byStation || cached?.byProvince) {
        return res.status(200).json({ ...cached, cacheStatus: 'stale' });
      }
      return res.status(503).json({ error: 'Historical weather cache is not ready' });
    }

    try {
      const payload = await refreshHistoryCache();
      return res.status(200).json({ ...payload, cacheStatus: 'refreshed' });
    } catch (buildError) {
      if (cached?.byStation || cached?.byProvince) {
        return res.status(200).json({
          ...cached,
          cacheStatus: 'stale',
          warning: buildError.message || 'Using stale rainfall history cache',
        });
      }
      throw buildError;
    }
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to load historical weather data' });
  }
}
