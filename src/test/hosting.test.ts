import headers from '../../public/_headers?raw';
import vercel from '../../vercel.json';
import { CONNECT_HOSTS, CSP_HEADER, THEME_SCRIPT, THEME_SCRIPT_HASH } from '../../csp';
import { PROVIDERS } from '@/lib/fx/rates';

describe('hosting config', () => {
  it('serves the same CSP header on Cloudflare Pages and Vercel', () => {
    expect(headers).toContain(`Content-Security-Policy: ${CSP_HEADER}\n`);
    const csp = vercel.headers[0]!.headers.find((h) => h.key === 'Content-Security-Policy');
    expect(csp?.value).toBe(CSP_HEADER);
  });

  it('allows the inline theme script by its hash', async () => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(THEME_SCRIPT));
    const b64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
    expect(THEME_SCRIPT_HASH).toBe(`'sha256-${b64}'`);
  });

  it('allows exactly the FX provider hosts in connect-src', () => {
    expect(PROVIDERS.map((p) => new URL(p.url).origin).sort()).toEqual([...CONNECT_HOSTS].sort());
  });
});
