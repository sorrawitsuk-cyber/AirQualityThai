import React, { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isIOS = typeof navigator !== 'undefined'
    && /iphone|ipad|ipod/i.test(navigator.userAgent)
    && !window.MSStream;

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return undefined;
    if (window.navigator.standalone === true) return undefined;
    if (localStorage.getItem('pwa-install-dismissed') || sessionStorage.getItem('pwa-install-dismissed')) return undefined;

    let revealTimer;
    const reveal = () => {
      window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(() => setShowBanner(true), 45000);
    };

    if (isIOS) {
      reveal();
      return () => window.clearTimeout(revealTimer);
    }

    const handler = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      reveal();
    };
    const installedHandler = () => setShowBanner(false);

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.clearTimeout(revealTimer);
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, [isIOS]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', '1');
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  if (!showBanner || dismissed) return null;

  return (
    <aside
      aria-label="ติดตั้งแอป"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 16,
        bottom: 'calc(82px + env(safe-area-inset-bottom))',
        boxShadow: '0 12px 32px rgba(15,23,42,0.16)',
        left: 16,
        maxWidth: 420,
        padding: 14,
        position: 'fixed',
        right: 16,
        zIndex: 80,
      }}
    >
      <div style={{ alignItems: 'flex-start', display: 'flex', gap: 12 }}>
        <img
          alt="AirQuality Thai"
          src="/icon-192x192.png"
          style={{ borderRadius: 12, height: 42, width: 42 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'var(--text-main)', fontSize: '0.92rem', fontWeight: 900 }}>
            ติดตั้ง AirQuality Thai
          </div>
          <div style={{ color: 'var(--text-sub)', fontSize: '0.76rem', fontWeight: 650, lineHeight: 1.45, marginTop: 3 }}>
            เปิดจากหน้าจอหลักได้เร็วขึ้น พร้อม cache สำหรับดูข้อมูลล่าสุดที่เคยโหลด
          </div>
        </div>
        <button
          aria-label="ปิดคำแนะนำติดตั้ง"
          onClick={handleDismiss}
          type="button"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 999, color: 'var(--text-sub)', cursor: 'pointer', height: 30, width: 30 }}
        >
          ×
        </button>
      </div>

      {isIOS ? (
        <div style={{ color: 'var(--text-sub)', fontSize: '0.74rem', fontWeight: 650, lineHeight: 1.55, marginTop: 10 }}>
          บน iPhone ให้กด Share แล้วเลือก Add to Home Screen
        </div>
      ) : (
        <button
          onClick={handleInstall}
          type="button"
          style={{
            background: '#0284c7',
            border: 0,
            borderRadius: 12,
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 900,
            marginTop: 12,
            padding: '10px 12px',
            width: '100%',
          }}
        >
          ติดตั้งแอป
        </button>
      )}
    </aside>
  );
}
