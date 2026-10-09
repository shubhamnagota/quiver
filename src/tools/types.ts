import type { ComponentType } from 'react';

export const CATEGORIES = {
  dev: { label: 'Dev', description: 'Formatters, decoders and generators' },
  payments: { label: 'Payments', description: 'Cards, IBANs, QR codes and currencies' },
  life: { label: 'Life', description: 'FX, time zones and calculators' },
  productivity: { label: 'Productivity', description: 'Notes, text and files' },
} as const;

export type Category = keyof typeof CATEGORIES;

export interface ToolManifest {
  /** URL slug, unique across tools: /t/:id */
  id: string;
  name: string;
  /** One line shown on cards and in the palette. */
  description: string;
  category: Category;
  /** Extra words the palette matches on. */
  keywords: string[];
  /** Returns true when pasted text looks like this tool's input (paste-to-open). */
  detect?: (input: string) => boolean;
  /** Keep input out of the URL unless the user opts in. */
  sensitive?: boolean;
  /** Whether the tool makes network calls. */
  network?: boolean;
  component: () => Promise<{ default: ComponentType }>;
}
