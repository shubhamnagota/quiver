import type { ToolManifest } from '../types';
import { JWT_RE } from './lib';

export default {
  id: 'jwt',
  name: 'JWT decoder',
  description: 'Decode header and payload, check expiry, verify HS256',
  category: 'dev',
  keywords: ['jwt', 'token', 'bearer', 'jws', 'claims', 'decode', 'hs256'],
  detect: (s) => JWT_RE.test(s.trim()),
  sensitive: true,
  component: () => import('./JwtTool'),
} satisfies ToolManifest;
