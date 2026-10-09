# Quiver

**Every tool, one keystroke away.**

Quiver is a private, offline-capable toolbox for fintech engineers: JSON, JWTs, epochs, hashes, IBANs, EMV QR codes, FX and more, all reachable from a ⌘K command palette. It runs entirely in the browser. There is no backend and no account, and tokens, payloads and keys never leave your device.

By [Shubham](https://github.com/shubhamnagota) · MIT licensed

## Features

- **⌘K command palette** with fuzzy search over tool names and keywords; pinned and recent tools come first.
- **Paste to open**: paste a JWT, JSON, epoch or Base64 anywhere (or into the palette) and the right tool opens with it.
- **Quick answers** in the palette: type an epoch to see the date, or `uuid` to copy a fresh one.
- **Shareable links**: tool input lives in the URL, except for sensitive tools (JWT, hashes, scratchpad) unless you choose to share.
- **Pinned and recent tools** on the home screen, persisted locally.
- **Keyboard first**: ⌘K opens the palette, Esc goes back, ⌘C copies a tool's output.
- **Dark and light themes**, following the system by choice.
- **Settings export/import** as JSON; nothing syncs anywhere.

## Tools

| Tool | What it does |
| --- | --- |
| JSON formatter | Pretty-print, minify, validate with line/column errors, tree view, JSONPath queries |
| JWT decoder | Header and payload, exp/iat/nbf in Dubai, IST and UTC, expiry badge, HS256/384/512 verification |
| Base64 | Text and files, URL-safe variant, auto-detects direction, downloads decoded binaries |
| Epoch converter | s/ms/µs/ns auto-detect, Dubai/IST/UTC side by side, relative time, date → epoch |
| Hash and HMAC | MD5, SHA-1/256/384/512, HMAC in hex or base64, webhook signature check |
| UUID generator | Bulk v4 UUIDs |
| Text utilities | Case conversion, counts, dedupe, sort, trim, slugify |
| Scratchpad | Multiple Markdown pads with preview, autosaved in the browser |

More are on the way: payments (EMV QR, IBAN), FX and remittance comparison, and a world clock.

## Getting started

```sh
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck and build static files into `dist/` |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, strict |
| `npm test` | Vitest unit tests |

CI runs lint, typecheck, tests and build on every push and pull request.

## Architecture

Quiver is a static single-page app built with Vite, React 19 and strict TypeScript, routed with TanStack Router and styled with Tailwind CSS. The palette is [cmdk](https://cmdk.paco.me), and settings persist to `localStorage` through Zustand.

Every tool is a self-contained folder under `src/tools/` that exports a manifest. The registry collects manifests with `import.meta.glob`, and the palette, sidebar, home and category pages are generated from it. Each tool's UI is lazy-loaded, so the shell stays small no matter how many tools exist.

```
src/
  components/   app shell: sidebar, bottom nav, command palette
  pages/        home, tool, category, saved, settings, about
  stores/       Zustand stores (preferences, palette)
  tools/
    registry.ts discovers every tools/*/manifest.ts
    types.ts    ToolManifest and categories
    json/       manifest.ts, lib.ts (+ tests), JsonTool.tsx
    …           one folder per tool
```

### Privacy model

Tools process input in the browser only. A tool that makes network calls declares `network: true`; every other tool shows a "Runs locally" badge. Tools marked `sensitive` keep their input out of the URL; sharing a link from one asks first. Markdown in the scratchpad is sanitised with DOMPurify before rendering.

## How to add a tool

1. Create `src/tools/<id>/`.
2. Put the pure logic in `lib.ts` and cover it with `lib.test.ts`.
3. Build the UI as a default-exported component, e.g. `MyTool.tsx`. Use `useToolInput('<id>')` for the main input (it handles paste handoff and URL state) and the shared `Panel`, `Split` and `ActionsBar` components from `src/components/tool/` so every tool looks and behaves the same.
4. Export a manifest from `manifest.ts`:

```ts
import type { ToolManifest } from '../types';

export default {
  id: 'my-tool',
  name: 'My tool',
  description: 'One line shown in the palette and on cards',
  category: 'dev',
  keywords: ['extra', 'search', 'terms'],
  detect: (input) => input.startsWith('my:'), // optional, powers paste-to-open
  component: () => import('./MyTool'),
} satisfies ToolManifest;
```

That's it: the tool appears in the palette, sidebar, home and its category page without touching shell code.

## License

MIT © Shubham
