// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { WeatherProvider } from './context/WeatherContext';

// นำเข้า Layout และ Pages
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import ForecastPage from './pages/ForecastPage';
import ClimatePage from './pages/ClimatePage';

// นำเข้า CSS เดิมของคุณ (มีพวกคลาสซ่อน Scrollbar, Animation ต่างๆ)
import './App.css';
import 'leaflet/dist/leaflet.css';

export default function App() {
  return (
    // ครอบแอปด้วย WeatherProvider เพื่อให้ทุกหน้าใช้ State (สถานี, อุณหภูมิ, Theme) ร่วมกันได้
    <WeatherProvider>
      <Routes>
        {/* ครอบทุกหน้าด้วย Layout (จะมี Sidebar/Bottom Nav อัตโนมัติ) */}
        <Route path="/" element={<Layout />}>
          
          {/* หน้าแรก (Overview) */}
          <Route index element={<Dashboard />} />
          
          {/* หน้าแผนที่เชิงลึก */}
          <Route path="map" element={<MapPage />} />
          
          {/* หน้า AI พยากรณ์และสถิติ */}
          <Route path="forecast" element={<ForecastPage />} />
          
          {/* หน้าข่าวสารและ ENSO */}
          <Route path="climate" element={<ClimatePage />} />
          
        </Route>
      </Routes>
    </WeatherProvider>
  );
}