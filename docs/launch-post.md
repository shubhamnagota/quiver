# Launch post (draft)

A draft for LinkedIn or a short blog post. Edit freely before posting; attach `docs/demo.gif`.

---

Every fintech engineer has the same bookmark folder: jwt.io, an epoch converter, regex101, a Base64 site, three FX sites. Each one is a small habit of pasting production tokens, webhook payloads and keys into someone else's server.

So I built Quiver: a private toolbox where every tool is one keystroke away.

⌘K, paste a JWT, and it opens decoded, with exp and iat shown in Dubai, IST and UTC. Paste an EMV QR payload (or a screenshot of the QR) and you get the field tree and a CRC check. Type "100 aed inr" in the palette and you get the mid-market answer without opening anything.

What makes it different:

- Everything runs in the browser. No backend, no account, no analytics. The only network calls are keyless FX rate lookups.
- It works offline after the first visit and installs as an app on desktop and phone.
- It's built for payments work: EMV QR, IBAN, remittance markup vs mid-market, webhook HMAC checks, AED/INR by default.
- It's keyboard-first: arrows, ⌘K, paste-to-open, Esc to go back.

Under the hood: React 19, TypeScript, Vite, a plugin-style tool registry (adding a tool is one folder), a strict CSP, and Lighthouse checks in CI.

Try it: https://quiver.shubhamnagota.com
Code (MIT): https://github.com/shubhamnagota/quiver

What tool do you keep a bookmark for that should be in here?
