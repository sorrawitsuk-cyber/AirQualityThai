import { provinces77 } from '../src/provinces77.js';

const CACHE_TTL_SECONDS = 6 * 60 * 60;
const CHUNK_SIZE = 20;

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

const buildHistoryPayload = async () => {
  const end = bangkokDate(-1);
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
  responses.forEach(({ offset, data }) => {
    data.forEach((item, index) => {
      const stationID = `PROV_${offset + index}`;
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

      byStation[stationID] = {
        dates,
        rainDaily: rain.map((value) => Math.round((Number(value) || 0) * 10) / 10),
        source: 'openmeteo-archive',
        rain24h: Math.round((rain[rain.length - 1] || 0) * 10) / 10,
        rain7d: sum(last7Rain),
        rain30d: sum(last30Rain),
        rain90d: sum(last90Rain),
        rainYtd: sum(rain),
        wetDays7d: last7Rain.filter((value) => Number(value) >= 1).length,
        wetDays30d: last30Rain.filter((value) => Number(value) >= 1).length,
        maxDailyRain30d: max(last30Rain),
        tempMax30d: max(sliceLast(tempMax, 30)),
        tempMin30d: min(sliceLast(tempMin, 30)),
        heatMax30d: max(sliceLast(heatMax, 30)),
        windMax30d: max(sliceLast(windMax, 30)),
        tempAvg30d: avg(sliceLast(tempMax, 30)),
      };
    });
  });

  return {
    updatedAt: new Date(timestamp).toISOString(),
    period: { startDate, endDate, timezone: 'Asia/Bangkok' },
    source: 'Open-Meteo Historical Weather API (ERA5)',
    byStation,
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=86400`);

  try {
    return res.status(200).json(await buildHistoryPayload());
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to load historical weather data' });
  }
}
