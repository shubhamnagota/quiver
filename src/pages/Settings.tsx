import { Download, Monitor, Moon, Sun, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { SocialLinks } from '@/components/Credits';
import { InstallApp } from '@/components/InstallApp';
import { cn } from '@/lib/utils';
import { usePrefs, type Theme } from '@/stores/prefs';

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
];

const buttonClass =
  'inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent';

export function Settings() {
  const { theme, setTheme, favorites, recents, importPrefs, reset } = usePrefs();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify({ theme, favorites, recents }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiver-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = async (file: File) => {
    try {
      importPrefs(JSON.parse(await file.text()));
      setMessage('Settings imported.');
    } catch {
      setMessage('That file is not a valid Quiver settings file.');
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section>
        <h2 className="mb-3 font-medium">Theme</h2>
        <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-md border border-border p-1">
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={theme === value}
              onClick={() => setTheme(value)}
              className={cn(
                'inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm',
                theme === value ? 'bg-accent text-foreground' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Install</h2>
        <p className="mb-3 text-sm text-muted-foreground">Installed, Quiver opens like an app and works offline.</p>
        <InstallApp />
      </section>

      <section>
        <h2 className="mb-1 font-medium">Your data</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Settings live only in this browser. Export them to move to another device.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportSettings} className={buttonClass}>
            <Download className="size-4" /> Export
          </button>
          <button type="button" onClick={() => fileInput.current?.click()} className={buttonClass}>
            <Upload className="size-4" /> Import
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importSettings(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (confirm('Clear all Quiver data in this browser, including scratchpads?')) {
                reset();
                for (const key of Object.keys(localStorage)) {
                  if (key.startsWith('quiver-')) localStorage.removeItem(key);
                }
                location.reload();
              }
            }}
            className={cn(buttonClass, 'text-red-500')}
          >
            <Trash2 className="size-4" /> Clear local data
          </button>
        </div>
        {message && <p role="status" className="mt-2 text-sm text-muted-foreground">{message}</p>}
      </section>

      <footer className="space-y-2 border-t border-border pt-6 text-xs text-muted-foreground md:hidden">
        <p>Made with ❤️ by Shubham</p>
        <SocialLinks />
      </footer>
    </div>
  );
}
