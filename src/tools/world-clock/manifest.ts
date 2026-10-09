import type { ToolManifest } from '../types';

export default {
  id: 'world-clock',
  name: 'World clock',
  description: 'Dubai and India by default, add cities, find meeting overlap',
  category: 'life',
  keywords: ['clock', 'time', 'timezone', 'meeting', 'planner', 'overlap', 'dubai', 'india', 'ist', 'gst', 'world'],
  component: () => import('./WorldClockTool'),
} satisfies ToolManifest;
