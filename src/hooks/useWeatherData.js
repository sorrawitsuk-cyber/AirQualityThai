import { useState, useEffect, useCallback } from 'react';

export const useWeatherData = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [locationName, setLocationName] = useState('กำลังระบุตำแหน่ง...');
  const [selectedProv, setSelectedProv] = useState('');
  const [selectedDist, setSelectedDist] = useState('');

  const fetchWeatherByCoords = useCallback(async (lat, lon) => {
    try {
      setLoadingWeather(true);
      const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,visibility&hourly=temperature_2m,precipitation_probability,precipitation,pm2_5&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=Asia%2FBangkok`;
      const aUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5&hourly=pm2_5&timezone=Asia%2FBangkok`;

      const [wRes, aRes] = await Promise.all([fetch(wUrl), fetch(aUrl)]);
      const wData = await wRes.json();
      const aData = await aRes.json();

      if (wRes.ok && aRes.ok) {
        // Find max PM2.5 per day
        const pm25MaxDaily = wData.daily.time.map(dateStr => {
          let maxPm = null;
          if (aData.hourly && aData.hourly.time) {
            aData.hourly.time.forEach((t, i) => {
              if (t.startsWith(dateStr) && aData.hourly.pm2_5[i] != null) {
                if (maxPm === null || aData.hourly.pm2_5[i] > maxPm) {
                  maxPm = aData.hourly.pm2_5[i];
                }
              }
            });
          }
          return maxPm !== null ? Math.round(maxPm) : Math.round(aData.current?.pm2_5 || 0);
        });

        setWeatherData({
          current: {
            temp: wData.current.temperature_2m,
            feelsLike: wData.current.apparent_temperature,
            humidity: wData.current.relative_humidity_2m,
            windSpeed: wData.current.wind_speed_10m,
            windDirection: wData.current.wind_direction_10m,
            pressure: wData.current.surface_pressure,
            visibility: wData.current.visibility,
            uv: wData.daily.uv_index_max[0],
            pm25: Math.round(aData.current.pm2_5),
            sunrise: wData.daily.sunrise[0],
            sunset: wData.daily.sunset[0],
            rainProb: wData.hourly.precipitation_probability[new Date().getHours()],
            precipitation: wData.current.precipitation,
            rain: wData.current.rain
          },
          hourly: {
            time: wData.hourly.time,
            temperature_2m: wData.hourly.temperature_2m,
            precipitation_probability: wData.hourly.precipitation_probability,
            precipitation: wData.hourly.precipitation,
            pm25: aData.hourly.pm2_5
          },
          daily: {
            time: wData.daily.time,
            weathercode: wData.daily.weather_code,
            temperature_2m_max: wData.daily.temperature_2m_max,
            temperature_2m_min: wData.daily.temperature_2m_min,
            apparent_temperature_max: wData.daily.apparent_temperature_max,
            pm25_max: pm25MaxDaily,
            precipitation_probability_max: wData.daily.precipitation_probability_max,
            precipitation_sum: wData.daily.precipitation_sum
          },
          coords: { lat, lon }
        });
      }
    } catch (err) {
      console.error("Fetch local weather failed", err);
    } finally {
      setLoadingWeather(false);
    }
  }, []);

  const fetchLocationName = useCallback(async (lat, lon) => {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=th`);
      const data = await res.json();
      setLocationName(data?.locality || data?.city || 'ตำแหน่งปัจจุบัน');
    } catch (e) {
      setLocationName('ตำแหน่งปัจจุบัน');
    }
  }, []);

  const useDefaultLocation = useCallback(() => {
    fetchWeatherByCoords(13.75, 100.5);
    setLocationName('กรุงเทพมหานคร');
  }, [fetchWeatherByCoords]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
          fetchLocationName(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn("Geolocation error/timeout:", err.message);
          useDefaultLocation();
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    } else {
      useDefaultLocation();
    }
  }, [fetchWeatherByCoords, fetchLocationName, useDefaultLocation]);

  return {
    weatherData,
    loadingWeather,
    locationName,
    setLocationName,
    fetchWeatherByCoords,
    selectedProv,
    setSelectedProv,
    selectedDist,
    setSelectedDist
  };
};
