import { Link } from '@tanstack/react-router';
import { House, Search, Settings, Star } from 'lucide-react';
import { usePalette } from '@/stores/palette';

const itemClass = 'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground';
const activeProps = { className: 'text-foreground' };

export function BottomNav() {
  const setOpen = usePalette((s) => s.setOpen);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <Link to="/" className={itemClass} activeProps={activeProps} activeOptions={{ exact: true }}>
        <House className="size-5" /> Home
      </Link>
      <button type="button" onClick={() => setOpen(true)} className={itemClass}>
        <Search className="size-5" /> Search
      </button>
      <Link to="/saved" className={itemClass} activeProps={activeProps}>
        <Star className="size-5" /> Saved
      </Link>
      <Link to="/settings" className={itemClass} activeProps={activeProps}>
        <Settings className="size-5" /> Settings
      </Link>
    </nav>
  );
}
