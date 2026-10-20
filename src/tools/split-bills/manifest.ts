import type { ToolManifest } from '../types';

export default {
  id: 'split-bills',
  name: 'Split bills',
  description: 'Share expenses in a group and see who owes whom',
  category: 'life',
  keywords: ['splitwise', 'split', 'bill', 'expenses', 'owe', 'iou', 'group', 'trip', 'flatmates', 'roommates', 'settle up', 'share costs'],
  sensitive: true,
  network: true,
  component: () => import('./SplitBillsTool'),
} satisfies ToolManifest;
