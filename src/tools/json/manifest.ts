import type { ToolManifest } from '../types';
import { looksLikeJson } from './lib';

export default {
  id: 'json',
  name: 'JSON formatter',
  description: 'Format, validate, minify and query JSON',
  category: 'dev',
  keywords: ['json', 'pretty', 'validate', 'minify', 'jsonpath', 'tree', 'beautify'],
  detect: looksLikeJson,
  component: () => import('./JsonTool'),
} satisfies ToolManifest;
