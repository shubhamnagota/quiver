import { Download, Share } from 'lucide-react';
import { isIos, usePwa } from '@/stores/pwa';

/** Install button where the browser offers it, Add to Home Screen steps on iOS, nothing once installed. */
export function InstallApp({ compact = false }: { compact?: boolean }) {
  const { installEvent, installed, install } = usePwa();
  if (installed) return compact ? null : <p className="text-sm text-muted-foreground">Quiver is installed on this device.</p>;
  if (installEvent) {
    return (
      <button type="button" onClick={() => void install()} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
        <Download className="size-4" /> Install Quiver
      </button>
    );
  }
  if (compact) return null;
  if (isIos()) {
    return (
      <p className="text-sm text-muted-foreground">
        To install on iPhone or iPad, tap <Share className="inline size-4 align-text-bottom" aria-label="Share" /> Share in Safari, then <strong>Add to Home Screen</strong>.
      </p>
    );
  }
  return <p className="text-sm text-muted-foreground">Use your browser's menu to install Quiver as an app, if it supports it.</p>;
}
