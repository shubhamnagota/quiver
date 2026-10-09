import type { ToolManifest } from '../types';
import { looksLikeEmvQr } from './lib';

export default {
  id: 'emv-qr',
  name: 'EMV QR parser',
  description: 'Parse EMV merchant QR payloads, check CRC, generate valid codes',
  category: 'payments',
  keywords: ['emv', 'qr', 'emvco', 'merchant', 'tlv', 'crc', 'crc16', 'payment qr', 'generate'],
  detect: looksLikeEmvQr,
  component: () => import('./EmvQrTool'),
} satisfies ToolManifest;
