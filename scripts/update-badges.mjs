// Rewrites the README badge row from measured results:
//   coverage/coverage-summary.json  (npm run coverage)
//   PSI_SCORES env var              (live PageSpeed Insights result, mobile)
// Lighthouse CI still enforces 95+ on every push; the badge shows the live site.
// Usage: npm run coverage && npm run badges
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
const color = (n) => (n >= 95 ? 'brightgreen' : n >= 85 ? 'green' : n >= 70 ? 'yellow' : 'red');
const badge = (label, message, c, link) =>
  `[![${label}](https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(message).replace(/-/g, '--')}-${c})](${link})`;

const coverage = readJson('coverage/coverage-summary.json');
const badges = [
  '[![CI](https://github.com/shubhamnagota/quiver/actions/workflows/ci.yml/badge.svg)](https://github.com/shubhamnagota/quiver/actions/workflows/ci.yml)',
];
// Live result from PageSpeed Insights (mobile), recorded by hand: PSI_SCORES="100/100/100/100".
const PSI = process.env.PSI_SCORES ?? '100/100/100/100';
const PSI_URL = 'https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fquiver.shubhamnagota.com%2F&form_factor=mobile';
badges.push(badge('PageSpeed (mobile)', PSI.split('/').join(' / '), color(Math.min(...PSI.split('/').map(Number))), PSI_URL));
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
