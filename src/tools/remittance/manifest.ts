import type { ToolManifest } from '../types';

export default {
  id: 'remittance',
  name: 'Remittance comparator',
  description: 'Compare provider rates and fees against mid-market',
  category: 'life',
  keywords: ['remittance', 'transfer', 'send money', 'markup', 'fee', 'exchange house', 'wise', 'compare', 'aed inr'],
  network: true,
  component: () => import('./RemittanceTool'),
} satisfies ToolManifest;
