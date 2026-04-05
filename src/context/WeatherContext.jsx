// src/context/WeatherContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const WeatherContext = createContext();

export const WeatherProvider = ({ children }) => {
  // ข้อมูลสำหรับแผนที่และตัวกรอง (Air4Thai)
  const [stations, setStations] = useState([]);
  const [stationTemps, setStationTemps] = useState({});
  
  // ข้อมูลสำหรับ Dashboard (Open-Meteo)
  const [weatherData, setWeatherData] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [lastUpdateText, setLastUpdateText] = useState("");

  // 1. ดึงข้อมูลสถานีทั่วประเทศ (สำหรับ Map และ Dropdown)
  const fetchAir4Thai = async () => {
    try {
      const res = await fetch('https://air4thai.pcd.go.th/services/getNewAQI_JSON.php');
      const data = await res.json();
      setStations(data.stations || []);
      
      const temps = {};
      (data.stations || []).forEach(st => {
        // จำลองข้อมูลสภาพอากาศให้สถานี เพราะ Air4Thai มีแต่ฝุ่น
        temps[st.stationID] = {
          temp: 26 + Math.random() * 8,
          feelsLike: 28 + Math.random() * 10,
          humidity: 40 + Math.random() * 40,
          rainProb: Math.random() * 100,
          windSpeed: Math.random() * 20
        };
      });
      setStationTemps(temps);
    } catch (e) { console.error("Air4Thai Error:", e); }
  };

  // 2. ดึงข้อมูลพิกัดเฉพาะจุด (สำหรับ Dashboard)
  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    try {
      const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,uv_index&hourly=temperature_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Asia%2FBangkok`;
      const aUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,us_aqi&timezone=Asia%2FBangkok`;

      const [wRes, aRes] = await Promise.all([fetch(wUrl), fetch(aUrl)]);
      const wData = await wRes.json();
      const aData = await aRes.json();

      setWeatherData({
        current: {
          temp: wData.current.temperature_2m, feelsLike: wData.current.apparent_temperature,
          humidity: wData.current.relative_humidity_2m, windSpeed: wData.current.wind_speed_10m,
          rain: wData.current.precipitation, uv: wData.current.uv_index,
          pm25: aData.current.pm2_5, aqi: aData.current.us_aqi
        },
        hourly: wData.hourly, daily: wData.daily, coords: { lat, lon }
      });

      const now = new Date();
      setLastUpdateText(`${now.toLocaleDateString('th-TH')} เวลา ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`);
    } catch (error) { console.error("Open-Meteo Error:", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAir4Thai();
  }, []);

  return (
    <WeatherContext.Provider value={{ stations, stationTemps, weatherData, fetchWeatherByCoords, loading, darkMode, setDarkMode, lastUpdateText }}>
      {children}
    </WeatherContext.Provider>
  );
};