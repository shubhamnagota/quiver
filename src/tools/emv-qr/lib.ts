/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF), as EMVCo QR specifies, over UTF-8 bytes. */
export function crc16(text: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(text)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface Tlv {
  id: string;
  length: number;
  value: string;
  name?: string;
  children?: Tlv[];
}

const ROOT_NAMES: Record<string, string> = {
  '00': 'Payload format indicator',
  '01': 'Point of initiation method',
  '52': 'Merchant category code',
  '53': 'Transaction currency',
  '54': 'Transaction amount',
  '55': 'Tip or convenience indicator',
  '56': 'Value of convenience fee (fixed)',
  '57': 'Value of convenience fee (percentage)',
  '58': 'Country code',
  '59': 'Merchant name',
  '60': 'Merchant city',
  '61': 'Postal code',
  '62': 'Additional data',
  '63': 'CRC',
  '64': 'Merchant information (language template)',
};

const ADDITIONAL_NAMES: Record<string, string> = {
  '01': 'Bill number',
  '02': 'Mobile number',
  '03': 'Store label',
  '04': 'Loyalty number',
  '05': 'Reference label',
  '06': 'Customer label',
  '07': 'Terminal label',
  '08': 'Purpose of transaction',
  '09': 'Additional consumer data request',
};

const LANGUAGE_NAMES: Record<string, string> = {
  '00': 'Language preference',
  '01': 'Merchant name (alternate)',
  '02': 'Merchant city (alternate)',
};

function rootName(id: string): string | undefined {
  const n = Number(id);
  if (n >= 2 && n <= 51) return 'Merchant account information';
  if (n >= 65 && n <= 79) return 'RFU for EMVCo';
  if (n >= 80 && n <= 99) return 'Unreserved template';
  return ROOT_NAMES[id];
}

const isTemplate = (id: string) => {
  const n = Number(id);
  return (n >= 26 && n <= 51) || n === 62 || n === 64 || (n >= 80 && n <= 99);
};

function childName(parent: string, id: string): string | undefined {
  if (parent === '62') return ADDITIONAL_NAMES[id] ?? (Number(id) >= 50 ? 'Payment system specific' : undefined);
  if (parent === '64') return LANGUAGE_NAMES[id];
  if (id === '00') return 'Globally unique identifier';
  return 'Payment network specific';
}

/** Splits TLV fields. Lengths count characters, so multi-byte names work. */
export function parseTlv(data: string, parent?: string): Tlv[] {
  const chars = [...data];
  const out: Tlv[] = [];
  let i = 0;
  while (i < chars.length) {
    const id = chars.slice(i, i + 2).join('');
    const lenText = chars.slice(i + 2, i + 4).join('');
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(lenText)) {
      throw new Error(`Malformed field at character ${i + 1}: expected a 2-digit ID and length`);
    }
    const length = Number(lenText);
    if (i + 4 + length > chars.length) throw new Error(`Field ${id} says length ${length} but the data ends early`);
    const value = chars.slice(i + 4, i + 4 + length).join('');
    const tlv: Tlv = { id, length, value, name: parent ? childName(parent, id) : rootName(id) };
    if (!parent && isTemplate(id)) {
      try {
        tlv.children = parseTlv(value, id);
      } catch {
        // not nested after all; keep the raw value
      }
    }
    out.push(tlv);
    i += 4 + length;
  }
  return out;
}

export interface ParsedQr {
  fields: Tlv[];
  crc: { expected: string; actual?: string; valid: boolean };
}

export function parseEmvQr(input: string): ParsedQr {
  const data = input.trim();
  const fields = parseTlv(data);
  if (fields[0]?.id !== '00') throw new Error('EMV QR payloads start with field 00 (payload format indicator)');
  const crcField = fields.at(-1);
  const crcAt = data.lastIndexOf('6304');
  const expected = crc16(data.slice(0, crcAt + 4));
  const actual = crcField?.id === '63' ? crcField.value.toUpperCase() : undefined;
  return { fields, crc: { expected, actual, valid: actual === expected } };
}

export function looksLikeEmvQr(input: string): boolean {
  const t = input.trim();
  return t.length >= 30 && t.startsWith('000201') && /6304[0-9A-Fa-f]{4}$/.test(t);
}

const tlv = (id: string, value: string) => `${id}${String([...value].length).padStart(2, '0')}${value}`;

export interface QrInput {
  dynamic: boolean;
  accountTag: string;
  guid: string;
  account: string;
  mcc: string;
  currency: string;
  amount: string;
  country: string;
  name: string;
  city: string;
  billNumber: string;
  reference: string;
}

export function validateQrInput(q: QrInput): string[] {
  const errors: string[] = [];
  const n = Number(q.accountTag);
  if (!/^\d{2}$/.test(q.accountTag) || n < 26 || n > 51) errors.push('Account template ID must be 26–51');
  if (!q.guid) errors.push('Globally unique identifier is required');
  if (!/^\d{4}$/.test(q.mcc)) errors.push('Merchant category code must be 4 digits');
  if (!/^\d{3}$/.test(q.currency)) errors.push('Currency must be a 3-digit ISO 4217 numeric code');
  if (q.amount && !/^\d+(\.\d+)?$/.test(q.amount)) errors.push('Amount must be a plain number like 25.00');
  if (!/^[A-Z]{2}$/.test(q.country)) errors.push('Country must be a 2-letter ISO code');
  if (!q.name) errors.push('Merchant name is required');
  if (!q.city) errors.push('Merchant city is required');
  for (const [label, v, max] of [['Merchant name', q.name, 25], ['Merchant city', q.city, 15], ['Account', q.account, 99]] as const) {
    if ([...v].length > max) errors.push(`${label} is limited to ${max} characters`);
  }
  return errors;
}

export function buildEmvQr(q: QrInput): string {
  const account = tlv('00', q.guid) + (q.account ? tlv('01', q.account) : '');
  const additional = (q.billNumber ? tlv('01', q.billNumber) : '') + (q.reference ? tlv('05', q.reference) : '');
  const body =
    tlv('00', '01') +
    tlv('01', q.dynamic ? '12' : '11') +
    tlv(q.accountTag, account) +
    tlv('52', q.mcc) +
    tlv('53', q.currency) +
    (q.amount ? tlv('54', q.amount) : '') +
    tlv('58', q.country) +
    tlv('59', q.name) +
    tlv('60', q.city) +
    (additional ? tlv('62', additional) : '') +
    '6304';
  return body + crc16(body);
}

/** The worked example from the EMVCo Merchant-Presented Mode specification. */
export const SPEC_SAMPLE =
  '00020101021229300012D156000000000510A93FO3230Q31280012D15600000001030812345678520441115802CN5914BEST TRANSPORT6007BEIJING64200002ZH0104最佳运输0202北京540523.7253031565502016233030412340603***0708A60086670902ME91320016A0112233449988770708123456786304A13A';

export const CURRENCY_NUMERIC: Record<string, string> = {
  '784': 'AED', '356': 'INR', '840': 'USD', '978': 'EUR', '826': 'GBP', '682': 'SAR', '634': 'QAR', '414': 'KWD',
  '048': 'BHD', '512': 'OMR', '702': 'SGD', '764': 'THB', '458': 'MYR', '360': 'IDR', '608': 'PHP', '704': 'VND',
  '156': 'CNY', '344': 'HKD', '392': 'JPY', '410': 'KRW', '036': 'AUD', '124': 'CAD', '756': 'CHF', '586': 'PKR',
  '050': 'BDT', '144': 'LKR', '524': 'NPR', '818': 'EGP', '566': 'NGN', '404': 'KES', '710': 'ZAR', '986': 'BRL',
};
