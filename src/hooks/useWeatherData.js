import { useState, useCallback, useRef } from 'react';

const DAY_MS = 24 * 60 * 60 * 1000;

function getDailyPm25Max(dates = [], airQualityData = {}) {
  return dates.map((dateStr) => {
    let maxPm = null;

    if (airQualityData.hourly?.time) {
      airQualityData.hourly.time.forEach((timestamp, index) => {
        if (timestamp.startsWith(dateStr) && airQualityData.hourly.pm2_5[index] != null) {
          if (maxPm === null || airQualityData.hourly.pm2_5[index] > maxPm) {
            maxPm = airQualityData.hourly.pm2_5[index];
          }
        }
      });
    }

    return maxPm !== null ? Math.round(maxPm) : Math.round(airQualityData.current?.pm2_5 || 0);
  });
}

function buildFallbackWeatherData(lat, lon) {
  const now = new Date();
  const startHour = new Date(now);
  startHour.setMinutes(0, 0, 0);

  const hourlyTimes = Array.from({ length: 24 * 7 }, (_, index) => (
    new Date(startHour.getTime() + index * 60 * 60 * 1000).toISOString()
  ));
  const dailyTimes = Array.from({ length: 7 }, (_, index) => (
    new Date(now.getTime() + index * DAY_MS).toISOString().slice(0, 10)
  ));
  const minutelyTimes = Array.from({ length: 8 }, (_, index) => (
    new Date(now.getTime() + index * 15 * 60 * 1000).toISOString()
  ));

  const baseTemp = lat > 17 ? 31 : lat < 9 ? 30 : 32;
  const baseRain = lat < 10 ? 45 : lat > 16 ? 28 : 35;
  const hourlyTemp = hourlyTimes.map((_, index) => Math.round(baseTemp + Math.sin((index % 24) / 24 * Math.PI) * 4 - 1));
  const hourlyRain = hourlyTimes.map((_, index) => Math.max(8, Math.min(85, Math.round(baseRain + (index % 6 === 0 ? 12 : 0) - (index % 5 === 0 ? 8 : 0)))));
  const hourlyWind = hourlyTimes.map((_, index) => Math.max(4, Math.round(9 + (index % 4))));
  const hourlyUv = hourlyTimes.map((_, index) => {
    const hour = new Date(hourlyTimes[index]).getHours();
    return hour >= 7 && hour <= 17 ? Math.max(1, Math.round(8 - Math.abs(12 - hour))) : 0;
  });
  const pm25 = lat > 16 ? 22 : 18;
  const currentTemp = hourlyTemp[0];

  return {
    current: {
      temp: currentTemp,
      feelsLike: currentTemp + 2,
      humidity: 68,
      windSpeed: hourlyWind[0],
      windDirection: 180,
      pressure: 1008,
      visibility: 12000,
      uv: hourlyUv[0],
      pm25,
      sunrise: `${dailyTimes[0]}T06:05`,
      sunset: `${dailyTimes[0]}T18:35`,
      rainProb: hourlyRain[0],
      precipitation: 0,
      rain: 0,
      weatherCode: 3,
      isDay: new Date().getHours() >= 6 && new Date().getHours() <= 18,
      fallback: true,
    },
    hourly: {
      time: hourlyTimes,
      temperature_2m: hourlyTemp,
      apparent_temperature: hourlyTemp.map((value) => value + 2),
      precipitation_probability: hourlyRain,
      precipitation: hourlyRain.map((value) => (value >= 55 ? 1.2 : 0)),
      pm25: hourlyTimes.map((_, index) => Math.max(8, pm25 + (index % 5) - 2)),
      wind_speed_10m: hourlyWind,
      relative_humidity_2m: hourlyTimes.map((_, index) => Math.max(45, Math.min(90, 68 + (index % 7) - 3))),
      uv_index: hourlyUv,
    },
    minutely: {
      time: minutelyTimes,
      precipitation_probability: minutelyTimes.map((_, index) => Math.max(0, Math.min(100, baseRain + index * 2))),
      precipitation: minutelyTimes.map(() => 0),
    },
    daily: {
      time: dailyTimes,
      weathercode: dailyTimes.map(() => 3),
      temperature_2m_max: dailyTimes.map((_, index) => baseTemp + 2 + (index % 3)),
      temperature_2m_min: dailyTimes.map((_, index) => baseTemp - 5 + (index % 2)),
      apparent_temperature_max: dailyTimes.map((_, index) => baseTemp + 4 + (index % 3)),
      apparent_temperature_min: dailyTimes.map((_, index) => baseTemp - 3 + (index % 2)),
      pm25_max: dailyTimes.map((_, index) => pm25 + (index % 4)),
      precipitation_probability_max: dailyTimes.map((_, index) => Math.max(5, Math.min(90, baseRain + (index % 2 ? 12 : -4)))),
      precipitation_sum: dailyTimes.map((_, index) => (index % 2 ? 3.5 : 0.6)),
      uv_index_max: dailyTimes.map((_, index) => (index % 2 ? 9 : 7)),
      wind_speed_10m_max: dailyTimes.map((_, index) => 14 + (index % 4)),
      sunrise: dailyTimes.map((date) => `${date}T06:05`),
      sunset: dailyTimes.map((date) => `${date}T18:35`),
    },
    coords: { lat, lon },
    fallback: true,
  };
}

export function useWeatherData() {
  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const requestIdRef = useRef(0);

  const fetchWeatherByCoords = useCallback(async (lat, lon) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    try {
      setLoadingWeather(true);
      const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,visibility,is_day&minutely_15=precipitation,precipitation_probability&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,pm2_5,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,sunrise,sunset,uv_index_max,precipitation_probability_max,wind_speed_10m_max&forecast_days=7&timezone=Asia%2FBangkok`;
      const aUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5&hourly=pm2_5&forecast_days=7&timezone=Asia%2FBangkok`;

      const [wRes, aRes] = await Promise.allSettled([fetch(wUrl), fetch(aUrl)]);
      if (requestId !== requestIdRef.current) return;
      if (wRes.status !== 'fulfilled' || !wRes.value.ok) {
        throw new Error(`Open-Meteo weather ${wRes.status === 'fulfilled' ? wRes.value.status : 'network'}`);
      }

      const wData = await wRes.value.json();
      const aData = aRes.status === 'fulfilled' && aRes.value.ok
        ? await aRes.value.json()
        : { current: { pm2_5: 0 }, hourly: { pm2_5: [] } };
      if (requestId !== requestIdRef.current) return;

      if (wData?.current && wData?.hourly && wData?.daily) {
        const currentTime = wData.current?.time || new Date().toISOString();
        const hourlyTimes = wData.hourly?.time || [];
        const exactHourIndex = hourlyTimes.findIndex((time) => time === currentTime);
        const fallbackHourIndex = hourlyTimes.findIndex((time) => time.slice(0, 13) === currentTime.slice(0, 13));
        const currentHourIndex = exactHourIndex >= 0 ? exactHourIndex : Math.max(0, fallbackHourIndex);
        const isDaytime = Number(wData.current?.is_day ?? 1) === 1;
        const currentUv = isDaytime ? Number(wData.hourly?.uv_index?.[currentHourIndex] || 0) : 0;

        setWeatherData({
          current: {
            temp: wData.current.temperature_2m,
            feelsLike: wData.current.apparent_temperature,
            humidity: wData.current.relative_humidity_2m,
            windSpeed: wData.current.wind_speed_10m,
            windDirection: wData.current.wind_direction_10m,
            pressure: wData.current.surface_pressure,
            visibility: wData.current.visibility,
            uv: Number.isFinite(currentUv) ? Math.round(currentUv * 10) / 10 : 0,
            pm25: aData.current?.pm2_5 || 0,
            sunrise: wData.daily.sunrise[0],
            sunset: wData.daily.sunset[0],
            rainProb: wData.hourly.precipitation_probability[currentHourIndex],
            precipitation: wData.current.precipitation,
            rain: wData.current.rain || 0,
            weatherCode: wData.current.weather_code,
            isDay: isDaytime,
          },
          hourly: {
            time: wData.hourly.time,
            temperature_2m: wData.hourly.temperature_2m,
            apparent_temperature: wData.hourly.apparent_temperature,
            precipitation_probability: wData.hourly.precipitation_probability,
            precipitation: wData.hourly.precipitation,
            pm25: aData.hourly?.pm2_5 || wData.hourly.time.map(() => aData.current?.pm2_5 || 0),
            wind_speed_10m: wData.hourly.wind_speed_10m,
            relative_humidity_2m: wData.hourly.relative_humidity_2m,
            uv_index: wData.hourly.uv_index,
          },
          minutely: {
            time: wData.minutely_15?.time || [],
            precipitation_probability: wData.minutely_15?.precipitation_probability || [],
            precipitation: wData.minutely_15?.precipitation || [],
          },
          daily: {
            time: wData.daily.time,
            weathercode: wData.daily.weather_code,
            temperature_2m_max: wData.daily.temperature_2m_max,
            temperature_2m_min: wData.daily.temperature_2m_min,
            apparent_temperature_max: wData.daily.apparent_temperature_max,
            apparent_temperature_min: wData.daily.apparent_temperature_min,
            pm25_max: getDailyPm25Max(wData.daily.time || [], aData),
            precipitation_probability_max: wData.daily.precipitation_probability_max,
            precipitation_sum: wData.daily.precipitation_sum,
            uv_index_max: wData.daily.uv_index_max,
            wind_speed_10m_max: wData.daily.wind_speed_10m_max,
            sunrise: wData.daily.sunrise,
            sunset: wData.daily.sunset,
          },
          coords: { lat, lon },
          fallback: aRes.status !== 'fulfilled' || !aRes.value.ok,
        });
      }
    } catch (err) {
      console.error('Fetch local weather failed', err);
      if (requestId === requestIdRef.current) {
        setWeatherData(buildFallbackWeatherData(lat, lon));
      }
    } finally {
      if (requestId === requestIdRef.current) setLoadingWeather(false);
    }
  }, []);

  return { weatherData, loadingWeather, fetchWeatherByCoords };
}
