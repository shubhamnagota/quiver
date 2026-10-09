import { Outlet, useNavigate } from '@tanstack/react-router';
import { lazy, Suspense, useEffect, useState } from 'react';
import { handOff } from '@/lib/handoff';
import { isTyping } from '@/lib/keyboard';
import { usePalette } from '@/stores/palette';
import { detectTools } from '@/tools/registry';
import { BottomNav } from './BottomNav';
import { Logo } from './Logo';
import { OfflineBadge, PwaPrompts } from './PwaPrompts';
import { Sidebar } from './Sidebar';
import { ThemeSync } from './ThemeSync';

/** Paste anywhere outside a field: if a tool recognises it, open that tool with the input. */
function usePasteToOpen() {
  const navigate = useNavigate();
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (isTyping(e.target) || usePalette.getState().open) return;
      const text = e.clipboardData?.getData('text/plain') ?? '';
      const [tool] = detectTools(text);
      if (!tool) return;
      e.preventDefault();
      handOff(tool.id, text.trim());
      void navigate({ to: '/t/$toolId', params: { toolId: tool.id }, search: {} });
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [navigate]);
}

const CommandPalette = lazy(() => import('./CommandPalette').then((m) => ({ default: m.CommandPalette })));

/** ⌘K toggles the palette. The palette code loads when the browser is idle, or on first use. */
function usePaletteLoader() {
  const open = usePalette((s) => s.open);
  const [preloaded, setPreloaded] = useState(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        usePalette.getState().toggle();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1500));
    const id = idle(() => setPreloaded(true));
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      (window.cancelIdleCallback ?? clearTimeout)(id as number);
    };
  }, []);
  return open || preloaded;
}

export function AppShell() {
  usePasteToOpen();
  const paletteMounted = usePaletteLoader();
  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only z-50 rounded-md bg-background px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <ThemeSync />
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <Logo />
          <OfflineBadge />
        </header>
        <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 pb-24 md:px-8 md:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <Suspense fallback={null}>{paletteMounted && <CommandPalette />}</Suspense>
      <PwaPrompts />
    </div>
  );
}
