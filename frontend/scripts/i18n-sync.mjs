/**
 * i18n-sync.mjs
 * Sync translation files by adding empty placeholders for missing keys
 * Usage: node scripts/i18n-sync.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const locales = ['en', 'hu', 'ro'];
const base = 'en';
const root = path.resolve(__dirname, '../messages');

const json = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const basePath = path.join(root, `${base}.json`);
const baseJson = json(basePath);

function ensureKeys(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      target[k] ??= {};
      ensureKeys(target[k], v);
    } else if (!(k in target)) {
      target[k] = '';
    }
  }
}

function countKeys(obj) {
  let count = 0;
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      count += countKeys(v);
    } else {
      count++;
    }
  }
  return count;
}

function countEmpty(obj) {
  let count = 0;
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      count += countEmpty(v);
    } else if (v === '') {
      count++;
    }
  }
  return count;
}

console.log(`\nSyncing translations from base locale: ${base}`);
console.log(`Base locale has ${countKeys(baseJson)} keys\n`);

for (const lng of locales.filter((l) => l !== base)) {
  const p = path.join(root, `${lng}.json`);
  const data = json(p);

  const beforeCount = countKeys(data);
  ensureKeys(data, baseJson);
  const afterCount = countKeys(data);
  const emptyCount = countEmpty(data);

  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');

  const added = afterCount - beforeCount;
  if (added > 0) {
    console.log(`${lng}.json: added ${added} new keys (${emptyCount} empty)`);
  } else {
    console.log(`${lng}.json: already in sync (${emptyCount} empty)`);
  }
}

console.log('\nSync complete!');
