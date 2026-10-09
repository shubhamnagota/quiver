import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { clearHandoff, peekHandoff } from '@/lib/handoff';
import { getTool } from '@/tools/registry';

/** Longer inputs stay out of the URL to keep links sane. */
export const MAX_URL_INPUT = 4000;

/**
 * The tool's main input. Starts from pasted input handed off by the palette,
 * else the ?input= param. Non-sensitive tools mirror it back into the URL so a
 * link reproduces the result; sensitive tools never write it there.
 */
export function useToolInput(toolId: string) {
  const tool = getTool(toolId);
  const search = useSearch({ strict: false }) as { input?: string };
  const navigate = useNavigate();
  const [value, setValue] = useState(() => peekHandoff(toolId) ?? search.input ?? '');

  useEffect(() => clearHandoff(toolId), [toolId]);

  useEffect(() => {
    if (tool?.sensitive) return;
    const next = value && value.length <= MAX_URL_INPUT ? value : undefined;
    if (next === search.input) return;
    const t = setTimeout(() => {
      void navigate({ to: '.', search: { input: next } as never, replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [value, tool?.sensitive, search.input, navigate]);

  return [value, setValue] as const;
}
