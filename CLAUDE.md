# Quiver

Browser-only utilities app. No backend, no accounts; data never leaves the browser.

## Commits

- No Claude attribution in commits: no `Co-Authored-By: Claude` trailer, no session links, no Claude author.

## Commands

- `npm run dev`: start the dev server
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: what CI runs on every PR

## Security

- `csp.ts` defines the Content Security Policy. A new network host must be added to `CONNECT_HOSTS` there, then copied into `public/_headers` and `vercel.json` (the hosting test fails until they match).
- Never add inline scripts or third-party scripts; the only inline script is the theme bootstrap, allowed by hash.

## Adding a tool

Create `src/tools/<id>/` with `manifest.ts` (default export a `ToolManifest`), the component, and pure logic in `lib.ts` with a `lib.test.ts`. The registry picks it up automatically; never edit shell code to add a tool.
