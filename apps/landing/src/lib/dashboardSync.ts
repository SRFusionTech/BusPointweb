const DASHBOARD_SYNC_KEY = 'buspoint:dashboard-sync';
const DASHBOARD_SYNC_EVENT = 'buspoint-dashboard-sync';

export function broadcastDashboardSync() {
  if (typeof window === 'undefined') return;

  const value = String(Date.now());
  localStorage.setItem(DASHBOARD_SYNC_KEY, value);
  window.dispatchEvent(new Event(DASHBOARD_SYNC_EVENT));
}

export function onDashboardSync(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === DASHBOARD_SYNC_KEY) {
      callback();
    }
  };

  const handleCustomEvent = () => {
    callback();
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(DASHBOARD_SYNC_EVENT, handleCustomEvent);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(DASHBOARD_SYNC_EVENT, handleCustomEvent);
  };
}
