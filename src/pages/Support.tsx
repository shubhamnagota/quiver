import { Coffee, Heart, TriangleAlert } from 'lucide-react';
import { useMemo } from 'react';
import { renderSVG } from 'uqr';
import { CopyButton } from '@/components/CopyButton';
import { SUPPORT, supportEnabled, type CryptoAddress } from '@/config';
import { checkAddress } from '@/lib/cryptoAddress';

const linkClass = 'inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent';

function CryptoCard({ c }: { c: CryptoAddress }) {
  const svg = useMemo(() => renderSVG(c.address, { ecc: 'M', border: 2 }), [c.address]);
  return (
    <section className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="font-medium">{c.asset}</h3>
        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{c.network}</span>
      </div>
      <div
        role="img"
        aria-label={`QR code for the ${c.asset} ${c.network} address`}
        className="mx-auto w-40 rounded-md bg-white p-1.5 [&_svg]:h-auto [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="mt-3 font-mono text-xs break-all">{c.address}</p>
      <div className="mt-3 flex items-start justify-between gap-2">
        <p className="flex gap-1.5 text-xs text-warning">
          <TriangleAlert className="size-3.5 shrink-0" />
          Send only {c.asset} on {c.network}.
        </p>
        <CopyButton value={c.address} className="shrink-0" />
      </div>
    </section>
  );
}

export function Support() {
  // The config test rejects invalid addresses; this guards against a hand-edited build.
  const crypto = SUPPORT.crypto.filter((c) => c.address && checkAddress(c.address).chain === c.chain && checkAddress(c.address).valid);
  const coffee = SUPPORT.coffeeUrl ? (SUPPORT.coffeeUrl.includes('ko-fi') ? 'Ko-fi' : 'Buy Me a Coffee') : '';

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Support Quiver</h1>
        <p className="mt-2 text-muted-foreground">
          Quiver is free, private and has no ads or tracking. If it saves you time, you can help keep it going. Entirely
          optional, and thank you either way.
        </p>
      </div>

      {!supportEnabled() && <p className="text-sm text-muted-foreground">Donations aren't set up yet.</p>}

      {(SUPPORT.githubSponsors || coffee) && (
        <div data-arrow-nav="horizontal" className="flex flex-wrap gap-3">
          {SUPPORT.githubSponsors && (
            <a data-nav-item href={`https://github.com/sponsors/${SUPPORT.githubSponsors}`} target="_blank" rel="noreferrer" className={linkClass}>
              <Heart className="size-4 text-danger" /> Sponsor on GitHub
            </a>
          )}
          {coffee && (
            <a data-nav-item href={SUPPORT.coffeeUrl} target="_blank" rel="noreferrer" className={linkClass}>
              <Coffee className="size-4" /> {coffee}
            </a>
          )}
        </div>
      )}

      {crypto.length > 0 && (
        <div>
          <h2 className="mb-1 font-medium">Crypto</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Scan the QR code or copy the address. Double-check the network in your wallet before sending.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {crypto.map((c) => <CryptoCard key={`${c.asset}-${c.network}`} c={c} />)}
          </div>
        </div>
      )}
    </div>
  );
}
