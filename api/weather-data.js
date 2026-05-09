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

const buildFallbackWeatherData = async () => {
  const bangkokTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const currentHour = bangkokTime.getHours();
  const timestamp = Date.now();
  const chunkSize = 40;
  let allWData = [];
  let allAData = [];

  for (let i = 0; i < provinces77.length; i += chunkSize) {
    const chunk = provinces77.slice(i, i + chunkSize);
    const lats = chunk.map((p) => p.lat).join(',');
    const lons = chunk.map((p) => p.lon).join(',');

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,apparent_temperature,precipitation_probability,wind_speed_10m,uv_index&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,precipitation_sum,uv_index_max,wind_speed_10m_max&timezone=Asia%2FBangkok&past_days=7&forecast_days=8&_t=${timestamp}`;
    const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}&current=pm2_5&hourly=pm2_5&timezone=Asia%2FBangkok&past_days=7&forecast_days=7&_t=${timestamp}`;

    const [weatherRes, airRes] = await Promise.all([fetch(weatherUrl), fetch(airUrl)]);
    if (!weatherRes.ok || !airRes.ok) {
      throw new Error(`Open-Meteo failed: weather ${weatherRes.status}, air ${airRes.status}`);
    }

    const weatherJson = await weatherRes.json();
    const airJson = await airRes.json();
    allWData = [...allWData, ...(Array.isArray(weatherJson) ? weatherJson : [weatherJson])];
    allAData = [...allAData, ...(Array.isArray(airJson) ? airJson : [airJson])];
  }

  const stations = [];
  const stationTemps = {};
  const stationYesterday = {};
  const stationMaxYesterday = {};
  const stationDaily = {};
  const todayDailyIdx = 7;
  const yesterdayDailyIdx = 6;
  const todayHourlyIdx = 7 * 24 + currentHour;
  const yesterdayHourlyIdx = 6 * 24 + currentHour;

  provinces77.forEach((province, idx) => {
    const weather = allWData[idx] || {};
    const air = allAData[idx] || {};
    const stationID = `PROV_${idx}`;
    const currentPm25 = Math.round(air.current?.pm2_5 || 0);

    stations.push({
      stationID,
      areaTH: province.n,
      lat: province.lat,
      long: province.lon,
      AQILast: { PM25: { value: currentPm25 } },
      dataSource: 'openmeteo',
      tmdCond: null,
    });

    stationTemps[stationID] = {
      temp: Math.round(weather.current?.temperature_2m || 0),
      feelsLike: Math.round(weather.current?.apparent_temperature || 0),
      humidity: Math.round(weather.current?.relative_humidity_2m || 0),
      rainProb: Math.round(weather.hourly?.precipitation_probability?.[todayHourlyIdx] ?? weather.daily?.precipitation_probability_max?.[todayDailyIdx] ?? 0),
      rainMm: Math.round((weather.current?.precipitation || 0) * 10) / 10,
      windSpeed: Math.round(weather.current?.wind_speed_10m || 0),
      windDir: Math.round(weather.current?.wind_direction_10m || 0),
      windDirection: Math.round(weather.current?.wind_direction_10m || 0),
      uv: Math.round(weather.hourly?.uv_index?.[todayHourlyIdx] ?? weather.daily?.uv_index_max?.[todayDailyIdx] ?? 0),
      pressure: null,
      cond: null,
      source: 'openmeteo-live',
    };

    const prevTemp = weather.hourly?.temperature_2m?.[yesterdayHourlyIdx];
    const prevPm25 = air.hourly?.pm2_5?.[yesterdayHourlyIdx];
    const prevUv = weather.hourly?.uv_index?.[yesterdayHourlyIdx];
    const prevRain = weather.hourly?.precipitation_probability?.[yesterdayHourlyIdx];
    const prevWind = weather.hourly?.wind_speed_10m?.[yesterdayHourlyIdx];

    stationYesterday[stationID] = {
      temp: Math.round(prevTemp ?? weather.daily?.temperature_2m_max?.[yesterdayDailyIdx] ?? 0),
      minTemp: Math.round(weather.daily?.temperature_2m_min?.[yesterdayDailyIdx] || 0),
      pm25: Math.round(prevPm25 ?? currentPm25),
      uv: Math.round(prevUv ?? weather.daily?.uv_index_max?.[yesterdayDailyIdx] ?? 0),
      rain: Math.round(prevRain ?? weather.daily?.precipitation_probability_max?.[yesterdayDailyIdx] ?? 0),
      wind: Math.round(prevWind ?? weather.daily?.wind_speed_10m_max?.[yesterdayDailyIdx] ?? 0),
    };

    const yesterdayPm25 = air.hourly?.pm2_5?.slice(yesterdayDailyIdx * 24, yesterdayDailyIdx * 24 + 24).filter((value) => value != null) || [];
    stationMaxYesterday[stationID] = {
      temp: Math.round(weather.daily?.temperature_2m_max?.[yesterdayDailyIdx] || 0),
      pm25: Math.round(yesterdayPm25.length ? Math.max(...yesterdayPm25) : currentPm25),
      uv: Math.round(weather.daily?.uv_index_max?.[yesterdayDailyIdx] || 0),
      rain: Math.round((weather.daily?.precipitation_sum?.[yesterdayDailyIdx] || 0) * 10) / 10,
      wind: Math.round(weather.daily?.wind_speed_10m_max?.[yesterdayDailyIdx] || 0),
    };

    const dailyDates = weather.daily?.time || [];
    const dailyPm25 = dailyDates.map((_, dayIdx) => {
      const values = air.hourly?.pm2_5?.slice(dayIdx * 24, dayIdx * 24 + 24).filter((value) => value != null) || [];
      return Math.round(values.length ? Math.max(...values) : currentPm25);
    });

    stationDaily[stationID] = {
      dates: dailyDates,
      temp: weather.daily?.temperature_2m_max?.map((value) => Math.round(value)) || [],
      heat: weather.daily?.apparent_temperature_max?.map((value) => Math.round(value)) || [],
      pm25: dailyPm25,
      rain: weather.daily?.precipitation_probability_max?.map((value) => Math.round(value)) || [],
      wind: weather.daily?.wind_speed_10m_max?.map((value) => Math.round(value)) || [],
      uv: weather.daily?.uv_index_max?.map((value) => Math.round(value)) || [],
    };
  });

  return {
    lastUpdated: new Date(timestamp).toISOString(),
    tmdAvailable: false,
    fallbackSource: 'openmeteo-live',
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
      : { ...(await buildFallbackWeatherData()), gistdaSummary, amphoeData, source: 'openmeteo-live' };

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to load weather data' });
  }
}
