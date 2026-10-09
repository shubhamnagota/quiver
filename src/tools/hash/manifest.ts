import type { ToolManifest } from '../types';

export default {
  id: 'hash',
  name: 'Hash and HMAC',
  description: 'MD5, SHA-1/256/512, HMAC and webhook signature checks',
  category: 'dev',
  keywords: ['hash', 'md5', 'sha', 'sha256', 'sha512', 'hmac', 'checksum', 'digest', 'webhook', 'signature'],
  sensitive: true,
  component: () => import('./HashTool'),
} satisfies ToolManifest;
