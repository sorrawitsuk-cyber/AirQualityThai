import React, { useContext, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { WeatherContext } from '../context/WeatherContext';
import InstallPrompt from './InstallPrompt';
import UpdateNotification from './UpdateNotification';
import { useGeolocation } from '../hooks/useGeolocation';
import { usePushNotification } from '../hooks/usePushNotification';

const NAV_ITEMS = [
  { path: '/', icon: '🏠', label: 'ภาพรวม' },
  { path: '/map', icon: '🗺️', label: 'แผนที่อากาศ' },
  { path: '/ai', icon: '✨', label: 'วิเคราะห์ AI' },
  { path: '/news', icon: '🔔', label: 'เตือนภัย & ข่าว' },
  { path: null, icon: '📊', label: 'สถิติตรวจวัด', disabled: true },
  { path: null, icon: '📋', label: 'รายงานสภาพอากาศ', disabled: true },
];

export default function Layout() {
  const { darkMode, setDarkMode, lastUpdated, stations } = useContext(WeatherContext);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { location: gpsLocation, loading: gpsLoading, getLocation } = useGeolocation();
  const { permission: notifPermission, requestPermission: requestNotif, isSupported: notifSupported } = usePushNotification();
  const navigate = useNavigate();

  const [userLocation, setUserLocation] = useState(null);
  useEffect(() => {
    if (gpsLocation) setUserLocation(gpsLocation);
  }, [gpsLocation]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cardBg = 'var(--bg-card)';
  const textColor = 'var(--text-main)';
  const borderColor = 'var(--border-color)';
  const subTextColor = 'var(--text-sub)';

  const lastUpdateText = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    : '-';

  const notifBadge = notifSupported && notifPermission !== 'granted';

  /* ── TOP NAVBAR ── */
  const topNavbar = (
    <div style={{
      height: isMobile ? '52px' : '64px',
      background: cardBg,
      borderBottom: `1px solid ${borderColor}`,
      display: 'flex',
      alignItems: 'center',
      padding: isMobile ? '0 16px' : '0 24px',
      gap: '16px',
      flexShrink: 0,
      zIndex: 100,
      boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <img src="/icon-192x192.png" alt="logo" style={{ width: isMobile ? '28px' : '36px', height: isMobile ? '28px' : '36px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(14,165,233,0.3)' }} />
        {!isMobile && (
          <div>
            <div style={{ fontWeight: '800', fontSize: '1rem', color: '#0ea5e9', lineHeight: 1.1 }}>Thai Weather</div>
            <div style={{ fontSize: '0.62rem', color: subTextColor, lineHeight: 1 }}>รู้ฟ้ากันฝน อากาศประเทศไทย</div>
          </div>
        )}
      </div>

      {/* Search + Location — desktop only */}
      {!isMobile && (
        <div style={{ flex: 1, maxWidth: '480px', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', opacity: 0.5 }}>🔍</span>
            <input
              type="text"
              placeholder="ค้นหาเมือง, จังหวัด, สถานที่"
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                background: 'var(--bg-secondary)',
                color: textColor,
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <button
            onClick={getLocation}
            disabled={gpsLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 14px', borderRadius: '12px',
              border: `1px solid ${borderColor}`,
              background: 'var(--bg-secondary)', color: '#0ea5e9',
              fontWeight: 'bold', fontSize: '0.82rem', cursor: 'pointer',
              flexShrink: 0, fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            <span>📍</span> {gpsLoading ? 'กำลังค้นหา...' : 'ใช้ตำแหน่งของฉัน'}
          </button>
        </div>
      )}

      {/* Right icons */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Notification bell */}
        <button
          onClick={notifBadge ? requestNotif : undefined}
          title={notifBadge ? 'เปิดการแจ้งเตือน' : 'การแจ้งเตือน'}
          style={{ position: 'relative', background: 'var(--bg-secondary)', border: `1px solid ${borderColor}`, borderRadius: '10px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.1rem' }}
        >
          🔔
          {notifBadge && (
            <span style={{ position: 'absolute', top: '5px', right: '5px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', border: '1.5px solid var(--bg-card)' }} />
          )}
        </button>

        {/* Bookmark */}
        <button style={{ background: 'var(--bg-secondary)', border: `1px solid ${borderColor}`, borderRadius: '10px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.1rem' }}>
          🔖
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? 'โหมดสว่าง' : 'โหมดมืด'}
          style={{ background: 'var(--bg-secondary)', border: `1px solid ${borderColor}`, borderRadius: '10px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.1rem' }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* Avatar */}
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#fff', fontWeight: 'bold', flexShrink: 0 }}>
          ท
        </div>
      </div>
    </div>
  );

  /* ── DESKTOP SIDEBAR ── */
  const sidebar = (
    <div style={{
      width: '220px',
      background: cardBg,
      borderRight: `1px solid ${borderColor}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 12px',
      flexShrink: 0,
      overflowY: 'auto',
    }}>
      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {NAV_ITEMS.map((item, idx) => {
          if (item.disabled) {
            return (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '11px 16px', borderRadius: '12px',
                opacity: 0.35, cursor: 'not-allowed',
                color: textColor, fontWeight: '600', fontSize: '0.92rem',
              }}>
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                {item.label}
              </div>
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '11px 16px', borderRadius: '12px',
                textDecoration: 'none',
                background: isActive ? '#0ea5e9' : 'transparent',
                color: isActive ? '#ffffff' : textColor,
                fontWeight: '600', fontSize: '0.92rem',
                transition: 'all 0.18s',
              })}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom: location + last updated */}
      <div style={{ marginTop: '20px', padding: '12px', borderRadius: '12px', background: 'var(--bg-secondary)', border: `1px solid ${borderColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#0ea5e9', fontWeight: 'bold', marginBottom: '4px' }}>
          <span>📍</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {gpsLocation ? 'ตำแหน่งปัจจุบัน' : 'กรุงเทพมหานคร'}
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', color: subTextColor }}>
          อัปเดตล่าสุด {lastUpdateText} น.
        </div>
        <button
          onClick={getLocation}
          disabled={gpsLoading}
          style={{
            marginTop: '8px', width: '100%', padding: '7px',
            borderRadius: '8px', border: `1px solid ${borderColor}`,
            background: 'var(--bg-card)', color: '#0ea5e9',
            fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {gpsLoading ? '⏳ กำลังค้นหา...' : '+ เพิ่มพื้นที่'}
        </button>
      </div>
    </div>
  );

  /* ── MOBILE BOTTOM NAV ── */
  const mobileBottomNav = (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px',
      background: cardBg, borderTop: `1px solid ${borderColor}`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      zIndex: 9999, paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
    }}>
      {NAV_ITEMS.filter(i => !i.disabled).map(item => (
        <NavLink key={item.path} to={item.path} end={item.path === '/'} style={({ isActive }) => ({
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', gap: '2px', flex: 1, height: '100%',
          color: isActive ? '#0ea5e9' : subTextColor,
          transform: isActive ? 'translateY(-2px)' : 'none', transition: 'all 0.2s',
        })}>
          {({ isActive }) => (
            <>
              {isActive && <div style={{ position: 'absolute', top: '6px', width: '4px', height: '4px', borderRadius: '50%', background: '#0ea5e9' }} />}
              <span style={{ fontSize: '1.4rem', opacity: isActive ? 1 : 0.55 }}>{item.icon}</span>
              <span style={{ fontSize: '0.58rem', fontWeight: 'bold', opacity: isActive ? 1 : 0.65 }}>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
      {/* GPS + theme on mobile */}
      <div onClick={getLocation} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', flex: 1, height: '100%', color: '#0ea5e9', cursor: 'pointer' }}>
        <span style={{ fontSize: '1.4rem', opacity: gpsLoading ? 0.5 : 0.85 }}>📍</span>
        <span style={{ fontSize: '0.58rem', fontWeight: 'bold', opacity: 0.75 }}>{gpsLoading ? 'ค้นหา...' : 'GPS'}</span>
      </div>
      <div onClick={() => setDarkMode(!darkMode)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', flex: 1, height: '100%', color: subTextColor, cursor: 'pointer' }}>
        <span style={{ fontSize: '1.4rem', opacity: 0.6 }}>{darkMode ? '☀️' : '🌙'}</span>
        <span style={{ fontSize: '0.58rem', fontWeight: 'bold', opacity: 0.7 }}>{darkMode ? 'สว่าง' : 'มืด'}</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-app)', color: textColor, fontFamily: 'Sarabun, sans-serif' }}>
      <UpdateNotification />
      <InstallPrompt />

      {/* Top navbar — always visible */}
      {topNavbar}

      {/* Body row: sidebar + content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {!isMobile && sidebar}

        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          paddingBottom: isMobile ? '80px' : '0',
        }}>
          <Outlet context={{ userLocation }} />
        </div>
      </div>

      {isMobile && mobileBottomNav}
    </div>
  );
}
