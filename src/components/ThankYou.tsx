import { Link } from '@tanstack/react-router';
import { Heart, X } from 'lucide-react';
import { supportEnabled } from '@/config';
import { usePrefs } from '@/stores/prefs';

export const THANK_YOU_AFTER = 50;

/** One dismissible thank-you after the 50th tool use, shown once, and only if donations are set up. */
export function ThankYou() {
  const show = usePrefs((s) => s.toolUses >= THANK_YOU_AFTER && !s.thanked);
  const markThanked = usePrefs((s) => s.markThanked);
  if (!show || !supportEnabled()) return null;
  return (
    <div role="status" className="fixed inset-x-3 bottom-36 z-40 mx-auto flex max-w-md items-start gap-3 rounded-lg border border-border bg-background p-3 text-sm shadow-lg md:bottom-20">
      <Heart className="mt-0.5 size-4 shrink-0 text-danger" />
      <p className="flex-1">
        Thanks for using Quiver: that's {THANK_YOU_AFTER} tools opened. If it saves you time, you can{' '}
        <Link to="/support" onClick={markThanked} className="underline underline-offset-2">support it</Link>.
      </p>
      <button type="button" aria-label="Dismiss" onClick={markThanked} className="rounded p-1 text-muted-foreground hover:text-foreground">
        <X className="size-4" />
      </button>
    </div>
  );
}
