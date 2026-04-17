import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// 🌟 สิ่งที่หายไป! ต้องดึง WeatherProvider มาครอบแอปทั้งหมด
import { WeatherProvider } from './context/WeatherContext';

// นำเข้าไฟล์หน้าต่างๆ
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import AIPage from './pages/AIPage'; // 🌟 เปลี่ยนชื่อ Import ตรงนี้
import NewsPage from './pages/NewsPage';

function App() {
  return (
    // 🌟 เอา WeatherProvider มาครอบ Routes ไว้ ข้อมูลจะได้ส่งถึงทุกหน้า
    <WeatherProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* หน้าหลัก ภาพรวม */}
          <Route index element={<Dashboard />} />
          
          {/* หน้าแผนที่ */}
          <Route path="map" element={<MapPage />} />
          
          {/* หน้า วิเคราะห์ */}
          <Route path="ai" element={<AIPage />} /> {/* 🌟 เปลี่ยน path และ element ตรงนี้ */}
          
          {/* หน้าข่าวสาร */}
          <Route path="news" element={<NewsPage />} />
        </Route>
      </Routes>
    </WeatherProvider>
  );
}

export default App;