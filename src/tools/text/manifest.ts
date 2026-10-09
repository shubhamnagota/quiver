import type { ToolManifest } from '../types';

export default {
  id: 'text',
  name: 'Text utilities',
  description: 'Change case, count, dedupe, sort, trim and slugify',
  category: 'productivity',
  keywords: ['text', 'case', 'camel', 'snake', 'kebab', 'upper', 'lower', 'count', 'words', 'sort', 'dedupe', 'slug', 'trim'],
  component: () => import('./TextTool'),
} satisfies ToolManifest;
