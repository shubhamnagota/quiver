import indexHtml from '../../index.html?raw';
import { SITE_URL, SUPPORT } from '@/config';
import { checkAddress } from '@/lib/cryptoAddress';

describe('support config', () => {
  it('only lists donation addresses that are valid for their network', () => {
    for (const c of SUPPORT.crypto.filter((x) => x.address)) {
      const r = checkAddress(c.address);
      expect(r, `${c.asset} on ${c.network}: ${c.address}`).toMatchObject({ valid: true, chain: c.chain });
      if (c.chain === 'evm') expect(r.note, `${c.asset} address should use its EIP-55 checksum form`).toBeUndefined();
    }
  });

  it('uses well-formed links', () => {
    if (SUPPORT.coffeeUrl) expect(SUPPORT.coffeeUrl).toMatch(/^https:\/\/(www\.)?(buymeacoffee\.com|ko-fi\.com)\/\w+/);
    if (SUPPORT.githubSponsors) expect(SUPPORT.githubSponsors).toMatch(/^[A-Za-z0-9-]+$/);
    expect(SITE_URL).toMatch(/^https:\/\/[^/]+$/);
  });
});

describe('page metadata', () => {
  it('points canonical and share-preview URLs at SITE_URL', () => {
    expect(indexHtml).toContain(`<link rel="canonical" href="${SITE_URL}/" />`);
    expect(indexHtml).toContain(`<meta property="og:image" content="${SITE_URL}/og.png" />`);
    expect(indexHtml).toContain(`<meta name="twitter:image" content="${SITE_URL}/og.png" />`);
  });
});
