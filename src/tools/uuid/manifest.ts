import type { ToolManifest } from '../types';
import { isUuid } from './lib';

export default {
  id: 'uuid',
  name: 'UUID generator',
  description: 'Generate v4 UUIDs in bulk',
  category: 'dev',
  keywords: ['guid', 'id', 'random', 'v4'],
  detect: isUuid,
  network: false,
  component: () => import('./UuidTool'),
} satisfies ToolManifest;
