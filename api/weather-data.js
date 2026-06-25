import { provinces77 } from '../src/provinces77.js';

const CACHE_TTL_SECONDS = 10 * 60;

const getFirebaseUrl = (path) => {
  const dbUrl = process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL;
  if (!dbUrl) return null;
  const base = dbUrl.replace(/\/$/, '');
  return `${base}/${path}.json`;
};

const fetchJson = async (url, timeoutMs = 10000) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const rounded = (value, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const buildFallbackWeatherData = () => {
  const bangkokTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const currentHour = bangkokTime.getHours();
  const timestamp = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const stations = [];
  const stationTemps = {};
  const stationYesterday = {};
  const stationMaxYesterday = {};
  const stationDaily = {};
  const dates = Array.from({ length: 8 }, (_, idx) => new Date(timestamp + idx * dayMs).toISOString().slice(0, 10));

  provinces77.forEach((province, idx) => {
    const stationID = `PROV_${idx}`;
    const coastalCooling = province.lon > 100.8 ? 1 : 0;
    const northernHeat = province.lat > 16 ? 2 : 0;
    const diurnal = Math.sin(((currentHour - 6) / 24) * Math.PI * 2);
    const baseTemp = clamp(30 + northernHeat - coastalCooling + diurnal * 3, 24, 41);
    const humidity = clamp(68 + Math.round((province.lon - 99) * 3) + (currentHour < 8 ? 6 : 0), 48, 92);
    const rainProb = clamp(Math.round(22 + (humidity - 60) * 0.7 + (province.lat < 10 ? 14 : 0)), 5, 92);
    const windSpeed = clamp(Math.round(8 + Math.abs(province.lon - 100) * 3 + (province.lat < 11 ? 5 : 0)), 4, 36);
    const pm25 = clamp(Math.round(18 + Math.max(0, province.lat - 12) * 1.8 + (100.9 - province.lon) * 2), 7, 58);
    const uv = clamp(Math.round(7 + (province.lat < 12 ? 2 : 0) - (rainProb > 65 ? 2 : 0)), 2, 11);

    stations.push({
      stationID,
      areaTH: province.n,
      lat: province.lat,
      long: province.lon,
      AQILast: { PM25: { value: pm25 } },
      dataSource: 'deterministic-fallback',
      tmdCond: null,
    });

    stationTemps[stationID] = {
      temp: Math.round(baseTemp),
      feelsLike: Math.round(baseTemp + humidity / 22),
      humidity,
      rainProb,
      rainMm: rounded(rainProb / 38, 1),
      windSpeed,
      windDir: Math.round((province.lon * 13 + province.lat * 7) % 360),
      windDirection: Math.round((province.lon * 13 + province.lat * 7) % 360),
      uv,
      pressure: null,
      cond: null,
      source: 'deterministic-fallback',
    };

    stationYesterday[stationID] = {
      temp: Math.round(baseTemp - 1),
      minTemp: Math.round(baseTemp - 6),
      pm25: clamp(pm25 + 2, 5, 80),
      uv,
      rain: clamp(rainProb - 5, 0, 100),
      wind: clamp(windSpeed - 2, 0, 50),
    };

    stationMaxYesterday[stationID] = {
      temp: Math.round(baseTemp + 2),
      pm25: clamp(pm25 + 8, 5, 100),
      uv,
      rain: rounded(rainProb / 20, 1),
      wind: clamp(windSpeed + 5, 0, 60),
    };

    stationDaily[stationID] = {
      dates,
      temp: dates.map((_, dayIdx) => Math.round(baseTemp + Math.sin(dayIdx / 2) * 2)),
      heat: dates.map((_, dayIdx) => Math.round(baseTemp + humidity / 22 + Math.sin(dayIdx / 2) * 2)),
      pm25: dates.map((_, dayIdx) => clamp(pm25 + (dayIdx % 3) * 2, 5, 90)),
      rain: dates.map((_, dayIdx) => clamp(rainProb + (dayIdx % 4) * 4 - 6, 0, 100)),
      wind: dates.map((_, dayIdx) => clamp(windSpeed + (dayIdx % 3) * 2, 0, 60)),
      uv: dates.map((_, dayIdx) => clamp(uv - (dayIdx % 2), 1, 11)),
    };
  });

  return {
    lastUpdated: new Date(timestamp).toISOString(),
    tmdAvailable: false,
    fallbackSource: 'deterministic-fallback',
    stale: true,
    stations,
    stationTemps,
    stationYesterday,
    stationMaxYesterday,
    stationDaily,
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=600`);

  try {
    const [weatherData, gistdaSummary, amphoeData] = await Promise.all([
      getFirebaseUrl('weather_data') ? fetchJson(getFirebaseUrl('weather_data'), 5000).catch(() => null) : null,
      getFirebaseUrl('gistda_disaster') ? fetchJson(getFirebaseUrl('gistda_disaster'), 5000).catch(() => null) : null,
      getFirebaseUrl('weather_data_amphoe') ? fetchJson(getFirebaseUrl('weather_data_amphoe'), 5000).catch(() => null) : null,
    ]);

    const payload = weatherData?.stations?.length
      ? { ...weatherData, gistdaSummary, amphoeData, source: 'firebase' }
      : { ...buildFallbackWeatherData(), gistdaSummary, amphoeData, source: 'deterministic-fallback' };

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to load weather data' });
  }
}
