import { Outlet } from '@tanstack/react-router';
import { BottomNav } from './BottomNav';
import { CommandPalette } from './CommandPalette';
import { Logo } from './Logo';
import { Sidebar } from './Sidebar';
import { ThemeSync } from './ThemeSync';

export function AppShell() {
  return (
    <div className="flex min-h-dvh">
      <ThemeSync />
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="flex items-center border-b border-border px-4 py-3 md:hidden">
          <Logo />
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 pb-24 md:px-8 md:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <CommandPalette />
    </div>
  );
}
