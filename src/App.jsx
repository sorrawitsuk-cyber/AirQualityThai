import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { WeatherProvider } from './context/WeatherContext';
import LoadingScreen from './components/LoadingScreen';

const CHUNK_RELOAD_KEY = 'air4thai-chunk-reload-attempted';

function isChunkLoadError(error) {
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError|dynamically imported module/i.test(error?.message || String(error || ''));
}

async function recoverFromStaleChunk() {
  if (typeof window === 'undefined') return false;
  if (window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return false;
  window.sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');

  try {
    if ('caches' in window) {
      const names = await window.caches.keys();
      await Promise.all(names.filter((name) => /workbox|precache|local-code|vite|air4thai/i.test(name)).map((name) => window.caches.delete(name)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.update().catch(() => null)));
    }
  } catch {
    // Reload is still the safest recovery path when a mobile browser has stale chunks.
  }

  window.location.reload();
  return true;
}

function lazyWithRetry(loader) {
  return lazy(() => loader().catch(async (error) => {
    if (isChunkLoadError(error) && await recoverFromStaleChunk()) {
      return new Promise(() => {});
    }
    throw error;
  }));
}

const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const MapPage = lazyWithRetry(() => import('./pages/MapPage'));
const AIPage = lazyWithRetry(() => import('./pages/AIPage'));
const NewsPage = lazyWithRetry(() => import('./pages/NewsPage'));

function RouteFallback() {
  return <LoadingScreen title="กำลังเปิดหน้า" subtitle="เตรียมข้อมูลล่าสุดให้พร้อมแสดงผล" />;
}

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Route chunk failed:', error);
    if (isChunkLoadError(error)) recoverFromStaleChunk();
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: '24px', background: 'linear-gradient(135deg, #f8fafc, #e0f2fe)', fontFamily: 'Kanit, sans-serif' }}>
        <div style={{ width: 'min(460px, 100%)', background: '#fff', border: '1px solid rgba(14,165,233,0.22)', borderRadius: '18px', padding: '24px', boxShadow: '0 12px 32px rgba(15,23,42,0.12)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: 950 }}>โหลดหน้าไม่สำเร็จ</h1>
          <p style={{ margin: '10px 0 18px', color: '#475569', lineHeight: 1.65, fontSize: '0.92rem' }}>
            ไฟล์หน้าจอบางส่วนอาจยังโหลดไม่ครบ ลองโหลดใหม่อีกครั้ง
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => window.location.reload()} style={{ border: 0, borderRadius: '999px', background: '#0ea5e9', color: '#fff', padding: '10px 16px', fontWeight: 900, cursor: 'pointer' }}>
              โหลดใหม่
            </button>
            <button type="button" onClick={() => { window.location.href = '/'; }} style={{ border: '1px solid rgba(14,165,233,0.35)', borderRadius: '999px', background: '#fff', color: '#0369a1', padding: '10px 16px', fontWeight: 900, cursor: 'pointer' }}>
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      </div>
    );
  }
}

function LazyRoute({ children }) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  );
}

function App() {
  return (
    <WeatherProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LazyRoute><Dashboard /></LazyRoute>} />
          <Route path="map" element={<LazyRoute><MapPage /></LazyRoute>} />
          <Route path="ai" element={<LazyRoute><AIPage /></LazyRoute>} />
          <Route path="news" element={<LazyRoute><NewsPage /></LazyRoute>} />
        </Route>
      </Routes>
    </WeatherProvider>
  );
}

export default App;
