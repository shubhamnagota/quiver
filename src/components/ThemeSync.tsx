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
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  return null;
}
