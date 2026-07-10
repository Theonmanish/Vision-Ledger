import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App';

const updateSW = registerSW({
  onNeedRefresh() {
    if (window.confirm('A new version of VisionLedger is available. Reload to update?')) {
      void updateSW(true);
    }
  },
  onOfflineReady() {
    console.info('[PWA] App ready for offline use.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
