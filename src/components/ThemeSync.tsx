import { useEffect } from 'react';
import { usePrefs } from '@/stores/prefs';

/** Keeps the <html> dark class in sync with the theme setting and the system preference. */
export function ThemeSync() {
  const theme = usePrefs((s) => s.theme);

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
      // Match the browser UI (address bar, PWA title bar) to the theme.
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#09090b' : '#fcfcfc');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  return null;
}
