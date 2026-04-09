import React, { createContext, useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase'; 

export const WeatherContext = createContext();

export const WeatherProvider = ({ children }) => {
  const [stations, setStations] = useState([]);
  const [stationTemps, setStationTemps] = useState({});
  const [stationYesterday, setStationYesterday] = useState({}); // 🌟 ท่อรับข้อมูลอดีต
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; 
  });

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const weatherRef = ref(db, 'weather_data');

    const unsubscribe = onValue(weatherRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        setStations(data.stations || []);
        setStationTemps(data.stationTemps || {});
        setStationYesterday(data.stationYesterday || {}); // 🌟 รับของเข้า
        setLastUpdated(data.lastUpdated || null);
      } else {
        setStations([]);
        setStationTemps({});
        setStationYesterday({});
      }
      setLoading(false); 
    }, (error) => {
      console.error("Firebase Read Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <WeatherContext.Provider value={{ 
      stations, 
      stationTemps, 
      stationYesterday, // 🌟 ส่งต่อให้ ClimatePage เอาไปใช้
      loading, 
      lastUpdated,
      darkMode,        
      setDarkMode      
    }}>
      {children}
    </WeatherContext.Provider>
  );
};