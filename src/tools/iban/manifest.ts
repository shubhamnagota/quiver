import type { ToolManifest } from '../types';
import { looksLikeIban } from './lib';

export default {
  id: 'iban',
  name: 'IBAN validator',
  description: 'mod-97 check, country, bank code and formatting',
  category: 'payments',
  keywords: ['iban', 'bank', 'account', 'mod97', 'swift', 'validate', 'bban'],
  detect: looksLikeIban,
  component: () => import('./IbanTool'),
} satisfies ToolManifest;
