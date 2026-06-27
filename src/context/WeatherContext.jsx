import React, { createContext, useState, useEffect } from 'react';
import { provinces77 } from '../provinces77';

export const WeatherContext = createContext();

const initialStations = provinces77.map((province, index) => ({
  stationID: `PROV_${index}`,
  areaTH: province.n,
  lat: province.lat,
  long: province.lon,
  AQILast: { PM25: { value: 0 } },
}));

export const WeatherProvider = ({ children }) => {
  const [stations, setStations] = useState(initialStations);
  const [stationTemps, setStationTemps] = useState({});
  const [stationYesterday, setStationYesterday] = useState({}); 
  const [stationMaxYesterday, setStationMaxYesterday] = useState({}); 
  const [stationDaily, setStationDaily] = useState({}); 
  const [gistdaSummary, setGistdaSummary] = useState(null);
  const [amphoeData, setAmphoeData] = useState(null); // 🆕 ข้อมูลระดับอำเภอจาก TMD
  const [tmdAvailable, setTmdAvailable] = useState(false); // 🆕 TMD API status
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [weatherMeta, setWeatherMeta] = useState({
    source: 'initial',
    stale: false,
    fallbackSource: null,
  });

  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : false; // Default to Light Mode
  });

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    
    // Toggle the dark-theme class on the body to activate global CSS variables
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

  useEffect(() => {
    let cancelled = false;

    const loadWeatherData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/weather-data');
        if (!response.ok) throw new Error(`Weather API ${response.status}`);
        const data = await response.json();
        if (cancelled) return;

        if (data) {
          setStations(data.stations?.length ? data.stations : initialStations);
          setStationTemps(data.stationTemps || {});
          setStationYesterday(data.stationYesterday || {});
          setStationMaxYesterday(data.stationMaxYesterday || {});
          setStationDaily(data.stationDaily || {});
          setGistdaSummary(data.gistdaSummary || null);
          setAmphoeData(data.amphoeData || null);
          setLastUpdated(data.lastUpdated || null);
          setTmdAvailable(data.tmdAvailable || false);
          setWeatherMeta({
            source: data.source || (data.fallbackSource ? 'fallback' : 'unknown'),
            stale: Boolean(data.stale),
            fallbackSource: data.fallbackSource || null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Weather data load failed:', error.message);
          setStations(initialStations);
          setStationTemps({});
          setStationYesterday({});
          setStationMaxYesterday({});
          setStationDaily({});
          setGistdaSummary(null);
          setAmphoeData(null);
          setLastUpdated(null);
          setTmdAvailable(false);
          setWeatherMeta({
            source: 'unavailable',
            stale: true,
            fallbackSource: 'initial-empty',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadWeatherData();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <WeatherContext.Provider value={{ 
      stations, stationTemps, stationYesterday, stationMaxYesterday, stationDaily, 
      gistdaSummary, amphoeData, tmdAvailable, weatherMeta,
      loading, lastUpdated, 
      darkMode, setDarkMode 
    }}>
      {children}
    </WeatherContext.Provider>
  );
};
