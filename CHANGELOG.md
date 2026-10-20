# Changelog

Notable changes to Quiver, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **Split bills** tool (Life): Splitwise-style groups saved in this browser. Split equally, by exact amounts, by percentage or by shares; record settle-up payments; see the fewest payments needed to settle.
- Split bills keeps balances separate per currency. **Convert** rewrites every bill in one currency at editable mid-market rates, keeps each bill's original amount and rate, and the latest conversion can be undone.
- Split bills extras: categories with spend breakdown, paid and share per person, search and filters by person, category and month, undo after deleting, archiving settled groups, copy a summary for chat, CSV export, and JSON export/import to share a group.

## [0.1.0] - 2026-10-09

First public release.

### Added

- App shell: tool registry, command palette, categories, favourites and recents, light and dark themes, arrow-key navigation.
- Paste-to-open: paste anything and Quiver suggests the tool that understands it.
- Dev tools: JSON formatter, JWT decoder, Base64, epoch converter, hash and HMAC, UUID generator.
- Payments and FX tools: EMV QR parser (also reads QR images on the device, with a Paste button), IBAN validator, FX converter, remittance comparator.
- Life and productivity tools: world clock, text utilities, scratchpad.
- Installable offline PWA with a Content Security Policy.
- Optional donations page and a one-time thank-you.

### Fixed

- The "new version" Reload button now reloads the app.
