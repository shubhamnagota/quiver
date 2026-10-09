import { RefreshCw, WifiOff, X } from 'lucide-react';
import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useOnline } from '@/lib/useOnline';

/** "Ready to work offline" and "Update available" toasts from the service worker. */
export function PwaPrompts() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!offlineReady) return;
    const t = setTimeout(() => setOfflineReady(false), 4000);
    return () => clearTimeout(t);
  }, [offlineReady, setOfflineReady]);

  if (!offlineReady && !needRefresh) return null;
  return (
    <div role="status" className="fixed inset-x-3 bottom-20 z-50 mx-auto flex max-w-md items-center gap-3 rounded-lg border border-border bg-background p-3 text-sm shadow-lg md:bottom-4">
      {needRefresh ? (
        <>
          <span className="flex-1">A new version of Quiver is available.</span>
          <button type="button" onClick={() => void updateServiceWorker(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-primary-foreground">
            <RefreshCw className="size-3.5" /> Reload
          </button>
        </>
      ) : (
        <span className="flex-1">Quiver is ready to work offline.</span>
      )}
      <button type="button" aria-label="Dismiss" onClick={() => { setOfflineReady(false); setNeedRefresh(false); }} className="rounded p-1 text-muted-foreground hover:text-foreground">
        <X className="size-4" />
      </button>
    </div>
  );
}

export function OfflineBadge() {
  const online = useOnline();
  if (online) return null;
  return (
    <span role="status" className="inline-flex items-center gap-1 rounded-full border border-warning/40 px-2 py-0.5 text-xs text-warning">
      <WifiOff className="size-3.5" /> Offline
    </span>
  );
}
