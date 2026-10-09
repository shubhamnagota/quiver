import { act, renderHook } from '@testing-library/react';
import { useNow } from './useNow';
import { useOnline } from './useOnline';
import { cn } from './utils';

describe('hooks and utils', () => {
  it('useNow ticks on its interval', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useNow(1000));
    const first = result.current;
    act(() => void vi.advanceTimersByTime(1000));
    expect(result.current).toBeGreaterThan(first);
    vi.useRealTimers();
  });

  it('useOnline follows online/offline events', () => {
    const { result } = renderHook(() => useOnline());
    act(() => void window.dispatchEvent(new Event('offline')));
    expect(result.current).toBe(false);
    act(() => void window.dispatchEvent(new Event('online')));
    expect(result.current).toBe(true);
  });

  it('cn merges conflicting Tailwind classes', () => {
    const hidden = false;
    expect(cn('px-2 py-1.5', hidden && 'hidden', 'py-2.5')).toBe('px-2 py-2.5');
  });
});
