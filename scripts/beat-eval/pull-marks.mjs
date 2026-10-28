#!/usr/bin/env node
// Descarga de KV las marcas del 1 enviadas desde el reproductor (botón "Enviar marca" → POST /api/marks)
// y las deja como JSON en scripts/beat-eval/marks/ (una por envío, nombre = id en KV).
// Uso: node scripts/beat-eval/pull-marks.mjs [--import]   (--import llama a import-mark.mjs con las nuevas)
// Requiere wrangler autenticado (OAuth) en esta máquina; usa el binding MARKS de wrangler.jsonc.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const outDir = join(here, 'marks');
mkdirSync(outDir, { recursive: true });
const doImport = process.argv.includes('--import');

const wrangler = (...args) => execFileSync('npx', ['wrangler', ...args], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
const keys = JSON.parse(wrangler('kv', 'key', 'list', '--binding', 'MARKS', '--remote'));
const have = new Set(readdirSync(outDir));
const fresh = [];
for (const k of keys) {
  const name = `${k.name}.json`;
  if (have.has(name)) continue;
  const value = wrangler('kv', 'key', 'get', k.name, '--binding', 'MARKS', '--remote', '--text');
  const m = JSON.parse(value);
  writeFileSync(join(outDir, name), JSON.stringify(m, null, 1) + '\n');
  fresh.push(name);
  console.log(`nueva: ${m.song}  ·  ${m.by}  ·  ${m.receivedAt.slice(0, 16).replace('T', ' ')}  ·  1 en ${m.oneAt}s (${m.style})`);
}
console.log(`${keys.length} marcas en KV, ${fresh.length} nuevas, carpeta ${outDir.replace(process.env.HOME ?? '', '~')}`);
if (doImport && fresh.length) {
  execFileSync(process.execPath, [join(here, 'import-mark.mjs'), ...fresh.map((n) => join(outDir, n))], { stdio: 'inherit' });
}
