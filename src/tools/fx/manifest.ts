import type { ToolManifest } from '../types';

export default {
  id: 'fx',
  name: 'FX converter',
  description: 'Convert to many currencies at once with cached mid-market rates',
  category: 'life',
  keywords: ['fx', 'currency', 'exchange', 'rate', 'convert', 'aed', 'inr', 'usd', 'forex', 'money'],
  network: true,
  component: () => import('./FxTool'),
} satisfies ToolManifest;
