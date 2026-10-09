/** Where Quiver is served; used for canonical and share-preview URLs. */
export const SITE_URL = 'https://quiver.shubhamnagota.com';

/** Author links shown in the footer and About page. Empty values are hidden. */
export const AUTHOR = {
  name: 'Shubham',
  github: 'https://github.com/shubhamnagota',
  linkedin: '',
  website: 'https://shubhamnagota.com',
  repo: 'https://github.com/shubhamnagota/quiver',
};

export interface CryptoAddress {
  asset: string;
  network: string;
  /** Leave empty to hide. A test checks every address is valid for its network. */
  address: string;
  /** What checkAddress must report for this network. */
  chain: 'evm' | 'tron' | 'bitcoin';
}

/**
 * Donation methods for /support. Every field is optional: empty values are
 * hidden, and the Support link disappears when nothing is configured.
 */
export const SUPPORT = {
  /** GitHub username with Sponsors enabled, e.g. "shubhamnagota". */
  githubSponsors: '',
  /** Full URL, e.g. https://buymeacoffee.com/<name> or https://ko-fi.com/<name>. */
  coffeeUrl: '',
  crypto: [
    { asset: 'USDT', network: 'TRON (TRC-20)', chain: 'tron', address: '' },
    { asset: 'USDT', network: 'Polygon', chain: 'evm', address: '' },
    { asset: 'ETH', network: 'Ethereum', chain: 'evm', address: '' },
    { asset: 'BTC', network: 'Bitcoin', chain: 'bitcoin', address: '' },
  ] satisfies CryptoAddress[] as CryptoAddress[],
};

export const supportEnabled = () =>
  !!SUPPORT.githubSponsors || !!SUPPORT.coffeeUrl || SUPPORT.crypto.some((c) => c.address);
