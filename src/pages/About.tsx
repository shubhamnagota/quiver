import { SocialLinks } from '@/components/Credits';
import { AUTHOR, supportEnabled } from '@/config';
import { Link } from '@tanstack/react-router';

export function About() {
  return (
    <article className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">About Quiver</h1>
      <p>
        Quiver is a private, offline toolbox for fintech engineers: JSON, JWTs, epochs, IBANs, EMV QR codes, FX and
        more, all one keystroke away. Everything runs in your browser. Tokens, payloads and keys never leave this
        device, and the only network calls are public exchange-rate endpoints.
      </p>
      <section>
        <h2 className="mb-2 font-medium">How it's built</h2>
        <p className="text-muted-foreground">
          A static React 19 + TypeScript app built with Vite. Every tool is a lazy-loaded module that registers itself
          through a manifest, so the command palette, sidebar and home screen are generated from one registry.
          Styling is Tailwind CSS; the palette is cmdk; settings persist to localStorage with Zustand.
        </p>
      </section>
      <section>
        <h2 className="mb-2 font-medium">Made by {AUTHOR.name}</h2>
        <p className="mb-3 text-muted-foreground">
          Source on <a href={AUTHOR.repo} target="_blank" rel="noreferrer" className="underline">GitHub</a>.
          {supportEnabled() && (
            <>
              {' '}If it helps you, you can <Link to="/support" className="underline">support Quiver</Link>.
            </>
          )}
        </p>
        <SocialLinks />
      </section>
    </article>
  );
}
