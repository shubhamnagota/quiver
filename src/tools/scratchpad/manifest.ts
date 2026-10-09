import type { ToolManifest } from '../types';

export default {
  id: 'scratchpad',
  name: 'Scratchpad',
  description: 'Markdown notes that autosave in this browser',
  category: 'productivity',
  keywords: ['notes', 'scratch', 'markdown', 'pad', 'memo', 'write'],
  sensitive: true,
  component: () => import('./ScratchpadTool'),
} satisfies ToolManifest;
