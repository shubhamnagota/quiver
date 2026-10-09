import { create } from 'zustand';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaState {
  installEvent: BeforeInstallPromptEvent | null;
  installed: boolean;
  install: () => Promise<void>;
}

const standalone = () =>
  typeof window !== 'undefined' &&
  ((typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) || (navigator as { standalone?: boolean }).standalone === true);

export const usePwa = create<PwaState>()((set, get) => ({
  installEvent: null,
  installed: standalone(),
  install: async () => {
    const e = get().installEvent;
    if (!e) return;
    await e.prompt();
    const { outcome } = await e.userChoice;
    set({ installEvent: null, installed: outcome === 'accepted' });
  },
}));

/** Call once at startup, before React, so the event isn't missed. */
export function listenForInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    usePwa.setState({ installEvent: e as BeforeInstallPromptEvent });
  });
  window.addEventListener('appinstalled', () => usePwa.setState({ installEvent: null, installed: true }));
}

/** iOS Safari has no install prompt; people add to the home screen from the Share menu. */
export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
