import { Link } from '@tanstack/react-router';
import { House, Search, Settings, Star } from 'lucide-react';
import { usePalette } from '@/stores/palette';

const itemClass =
  'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground data-[status=active]:text-foreground';

export function BottomNav() {
  const setOpen = usePalette((s) => s.setOpen);

  return (
    <nav
      aria-label="Main"
      data-arrow-nav="horizontal"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <Link data-nav-item to="/" className={itemClass} activeOptions={{ exact: true }}>
        <House className="size-5" /> Home
      </Link>
      <button type="button" data-nav-item onClick={() => setOpen(true)} className={itemClass}>
        <Search className="size-5" /> Search
      </button>
      <Link data-nav-item to="/saved" className={itemClass}>
        <Star className="size-5" /> Saved
      </Link>
      <Link data-nav-item to="/settings" className={itemClass}>
        <Settings className="size-5" /> Settings
      </Link>
    </nav>
  );
}
