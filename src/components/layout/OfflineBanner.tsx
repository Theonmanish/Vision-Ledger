import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export default function OfflineBanner() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-14 z-[100] flex items-center justify-center gap-2 bg-amber-600 px-4 py-2.5 text-sm font-medium text-white safe-x"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>You're offline. Some features may be unavailable.</span>
    </div>
  );
}
