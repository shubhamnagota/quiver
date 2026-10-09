import type { ToolManifest } from '../types';
import { looksLikeEpoch } from './lib';

export default {
  id: 'epoch',
  name: 'Epoch converter',
  description: 'Unix time in s/ms/µs/ns to Dubai, IST and UTC, and back',
  category: 'dev',
  keywords: ['epoch', 'unix', 'timestamp', 'time', 'date', 'utc', 'ist', 'dubai', 'timezone'],
  detect: looksLikeEpoch,
  component: () => import('./EpochTool'),
} satisfies ToolManifest;
