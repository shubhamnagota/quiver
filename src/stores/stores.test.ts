import { useRemittance, MAX_QUOTES } from '@/tools/remittance/store';
import { useFxPrefs } from '@/tools/fx/store';
import { useClock } from './clock';
import { usePalette } from './palette';
import { listenForInstall, usePwa } from './pwa';

describe('clock store', () => {
  it('adds cities once, reorders and removes', () => {
    const s = () => useClock.getState();
    s().add({ zone: 'Europe/London', label: 'London' });
    s().add({ zone: 'Europe/London', label: 'London' });
    expect(s().cities.map((c) => c.label)).toEqual(['Dubai', 'India', 'London']);
    s().move('Europe/London', -1);
    expect(s().cities[1]!.label).toBe('London');
    s().move('Asia/Dubai', -1);
    expect(s().cities[0]!.label).toBe('Dubai');
    s().remove('Europe/London');
    expect(s().cities).toHaveLength(2);
  });
});

describe('remittance store', () => {
  it('caps quotes at four and updates by id', () => {
    const s = () => useRemittance.getState();
    for (let i = 0; i < 5; i++) s().addQuote();
    expect(s().quotes).toHaveLength(MAX_QUOTES);
    const id = s().quotes[0]!.id;
    s().updateQuote(id, { rate: '23.9' });
    expect(s().quotes[0]!.rate).toBe('23.9');
    s().removeQuote(id);
    expect(s().quotes).toHaveLength(MAX_QUOTES - 1);
    s().set({ sendCurrency: 'USD' });
    expect(s().sendCurrency).toBe('USD');
  });
});

describe('fx prefs and palette', () => {
  it('stores currencies and pairs', () => {
    useFxPrefs.getState().setFrom('USD');
    useFxPrefs.getState().setTargets(['INR']);
    useFxPrefs.getState().setPairs([['USD', 'INR']]);
    expect(useFxPrefs.getState()).toMatchObject({ from: 'USD', targets: ['INR'], pairs: [['USD', 'INR']] });
  });

  it('toggles the palette', () => {
    usePalette.getState().toggle();
    expect(usePalette.getState().open).toBe(true);
    usePalette.getState().setOpen(false);
    expect(usePalette.getState().open).toBe(false);
  });
});

describe('pwa install', () => {
  it('captures the install prompt and clears it once accepted', async () => {
    listenForInstall();
    const prompt = vi.fn(async () => {});
    const e = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt, userChoice: Promise.resolve({ outcome: 'accepted' as const }) });
    window.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
    expect(usePwa.getState().installEvent).toBe(e);
    await usePwa.getState().install();
    expect(prompt).toHaveBeenCalled();
    expect(usePwa.getState()).toMatchObject({ installEvent: null, installed: true });
  });
});
