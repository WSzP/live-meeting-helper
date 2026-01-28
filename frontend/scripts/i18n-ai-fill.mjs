/**
 * i18n-ai-fill.mjs
 * Fill empty translation placeholders using AI (dev-time only)
 *
 * CAUTION: Run only in development. Do NOT call any API at runtime.
 * Requires: AI_TRANSLATE_ENDPOINT environment variable that accepts POST with JSON body:
 *   { items: [{ key: string, to: string, text: string }] }
 * Returns: [{ key: string, to: string, text: string }]
 *
 * Usage: node --env-file=.env.local scripts/i18n-ai-fill.mjs
 * Or manually set AI_TRANSLATE_ENDPOINT before running
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const locales = ['en', 'hu', 'ro'];
const base = 'en';
const root = path.resolve(__dirname, '../messages');
const endpoint = process.env.AI_TRANSLATE_ENDPOINT;

if (!endpoint) {
  console.log('AI_TRANSLATE_ENDPOINT not set. Skipping AI translation.');
  console.log('To use this script, set AI_TRANSLATE_ENDPOINT in your environment.');
  console.log('Example: AI_TRANSLATE_ENDPOINT=https://api.example.com/translate');
  process.exit(0);
}

async function translateBatch(pairs) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: pairs })
    });
    if (!res.ok) {
      throw new Error(`AI translation failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (err) {
    console.error('Translation error:', err.message);
    return [];
  }
}

function getValueByPath(obj, path) {
  return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
}

function setValueByPath(obj, path, value) {
  const parts = path.split('.');
  let ref = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    ref = ref[parts[i]] ??= {};
  }
  ref[parts.at(-1)] = value;
}

function collectPlaceholders(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...collectPlaceholders(v, key));
    } else if (v === '') {
      out.push(key);
    }
  }
  return out;
}

const baseJson = JSON.parse(fs.readFileSync(path.join(root, `${base}.json`), 'utf8'));

console.log(`\nAI-filling empty translations from base locale: ${base}\n`);

for (const lng of locales.filter((l) => l !== base)) {
  const p = path.join(root, `${lng}.json`);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const emptyKeys = collectPlaceholders(data);

  if (!emptyKeys.length) {
    console.log(`${lng}: no empty placeholders`);
    continue;
  }

  console.log(`${lng}: found ${emptyKeys.length} empty keys, translating...`);

  const pairs = emptyKeys.map((k) => ({
    key: k,
    to: lng,
    text: getValueByPath(baseJson, k)
  }));

  const translated = await translateBatch(pairs);

  if (translated.length === 0) {
    console.log(`${lng}: translation failed, skipping`);
    continue;
  }

  // Apply translations
  for (const item of translated) {
    setValueByPath(data, item.key, item.text);
  }

  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
  console.log(`${lng}: filled ${translated.length} keys`);
}

console.log('\nAI fill complete! Review translations before committing.');
