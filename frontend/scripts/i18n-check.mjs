/**
 * i18n-check.mjs
 * Check for missing translation keys across locale files
 * Usage: node scripts/i18n-check.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const locales = ['en', 'hu', 'ro'];
const base = 'en';
const root = path.resolve(__dirname, '../messages');

const json = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

function flatKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return (v && typeof v === 'object' && !Array.isArray(v))
      ? flatKeys(v, key)
      : [key];
  });
}

const basePath = path.join(root, `${base}.json`);
const baseJson = json(basePath);
const baseKeys = new Set(flatKeys(baseJson));

console.log(`\nChecking translations against base locale: ${base}`);
console.log(`Base locale has ${baseKeys.size} keys\n`);

let ok = true;
for (const lng of locales.filter((l) => l !== base)) {
  const p = path.join(root, `${lng}.json`);
  const data = json(p);
  const keys = new Set(flatKeys(data));

  const missing = [...baseKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !baseKeys.has(k));

  if (missing.length) {
    ok = false;
    console.log(`Missing in ${lng}.json:`);
    missing.forEach((k) => console.log(`  - ${k}`));
  }

  if (extra.length) {
    console.log(`\nExtra keys in ${lng}.json (not in base):`);
    extra.forEach((k) => console.log(`  + ${k}`));
  }

  if (!missing.length && !extra.length) {
    console.log(`${lng}.json - OK (${keys.size} keys)`);
  }
  console.log('');
}

if (ok) {
  console.log('All locale files are in sync!');
  process.exit(0);
} else {
  console.log('Some translations are missing. Run "node scripts/i18n-sync.mjs" to add placeholders.');
  process.exit(1);
}
