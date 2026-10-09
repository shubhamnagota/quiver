# Quiver

**Every tool, one keystroke away.**

Quiver is a private, offline-capable toolbox for fintech engineers: JSON, JWTs, epochs, hashes, IBANs, EMV QR codes, FX and more, all reachable from a ⌘K command palette. It runs entirely in the browser. There is no backend and no account, and tokens, payloads and keys never leave your device.

By [Shubham](https://github.com/shubhamnagota) · MIT licensed

## Features

- **⌘K command palette** with fuzzy search over tool names and keywords; pinned and recent tools come first.
- **Paste to open**: paste a value into the palette and Quiver offers the tool that understands it.
- **Pinned and recent tools** on the home screen, persisted locally.
- **Keyboard first**: ⌘K opens the palette, Esc goes back.
- **Dark and light themes**, following the system by choice.
- **Settings export/import** as JSON; nothing syncs anywhere.

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
    uuid/       manifest.ts, lib.ts (+ tests), UuidTool.tsx
```

### Privacy model

Tools process input in the browser only. A tool that makes network calls declares `network: true`; every other tool shows a "Runs locally" badge. Tools marked `sensitive` will keep their input out of the URL.

## How to add a tool

1. Create `src/tools/<id>/`.
2. Put the pure logic in `lib.ts` and cover it with `lib.test.ts`.
3. Build the UI as a default-exported component, e.g. `MyTool.tsx`.
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
