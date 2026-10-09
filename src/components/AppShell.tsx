import { Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { handOff } from '@/lib/handoff';
import { isTyping } from '@/lib/keyboard';
import { usePalette } from '@/stores/palette';
import { detectTools } from '@/tools/registry';
import { BottomNav } from './BottomNav';
import { CommandPalette } from './CommandPalette';
import { Logo } from './Logo';
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

export function AppShell() {
  usePasteToOpen();
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
