// Rewrites the README badge row from measured results:
//   coverage/coverage-summary.json  (npm run coverage)
//   .lighthouseci/manifest.json     (npx @lhci/cli autorun)
// Usage: npm run coverage && npx @lhci/cli autorun && npm run badges
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
const color = (n) => (n >= 95 ? 'brightgreen' : n >= 85 ? 'green' : n >= 70 ? 'yellow' : 'red');
const badge = (label, message, c, link) =>
  `[![${label}](https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(message).replace(/-/g, '--')}-${c})](${link})`;

const coverage = readJson('coverage/coverage-summary.json');
const lighthouse = readJson('.lighthouseci/manifest.json');
const badges = [
  '[![CI](https://github.com/shubhamnagota/quiver/actions/workflows/ci.yml/badge.svg)](https://github.com/shubhamnagota/quiver/actions/workflows/ci.yml)',
];
if (lighthouse) {
  const min = (k) => Math.round(Math.min(...lighthouse.map((r) => r.summary[k])) * 100);
  const scores = ['performance', 'accessibility', 'best-practices', 'seo'].map(min);
  badges.push(badge('lighthouse', scores.join(' / '), color(Math.min(...scores)), '#quality'));
}
if (coverage) {
  const pct = Math.round(coverage.total.lines.pct);
  badges.push(badge('coverage', `${pct}%`, color(pct), '#quality'));
}
badges.push(badge('license', 'MIT', 'blue', 'LICENSE'));

const readme = readFileSync('README.md', 'utf8');
const next = readme.replace(/<!-- badges -->[\s\S]*?<!-- \/badges -->/, `<!-- badges -->\n${badges.join('\n')}\n<!-- /badges -->`);
if (next === readme && !readme.includes('<!-- badges -->')) throw new Error('README has no <!-- badges --> markers');
writeFileSync('README.md', next);
console.log(badges.join('\n'));
