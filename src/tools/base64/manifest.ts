import type { ToolManifest } from '../types';
import { looksLikeBase64 } from './lib';

export default {
  id: 'base64',
  name: 'Base64 encode/decode',
  description: 'Text and files, URL-safe variant, auto-detects direction',
  category: 'dev',
  keywords: ['base64', 'b64', 'encode', 'decode', 'url-safe', 'base64url', 'atob', 'btoa'],
  detect: looksLikeBase64,
  component: () => import('./Base64Tool'),
} satisfies ToolManifest;
