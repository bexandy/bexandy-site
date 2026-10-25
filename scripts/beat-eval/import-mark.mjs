#!/usr/bin/env node
// Incorpora a labels.json las marcas del 1 exportadas desde el reproductor (botón "Guardar marca" → marca-<canción>.json).
// Uso: node scripts/beat-eval/import-mark.mjs <marca.json> [...] [--file <ruta del audio>]
// Busca el audio por nombre bajo ~/Música (o usa --file); si ya hay etiqueta de esa canción, la sustituye.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const fileArg = args.includes('--file') ? args[args.indexOf('--file') + 1] : null;
const marks = args.filter((a, i) => a.endsWith('.json') && args[i - 1] !== '--file');
if (!marks.length) { console.error('Uso: import-mark.mjs <marca.json> [...] [--file <audio>]'); process.exit(1); }

function findAudio(name, dir = join(homedir(), 'Música')) {
  let out = null;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out = out ?? findAudio(name, p);
    else if (e.name === name) return p;
  }
  return out;
}

const labelsPath = new URL('./labels.json', import.meta.url);
const db = JSON.parse(readFileSync(labelsPath, 'utf8'));
for (const mp of marks) {
  const m = JSON.parse(readFileSync(mp, 'utf8'));
  if (m.format !== 'bexandy-salsa-mark/1') { console.error(`${mp}: formato desconocido`); continue; }
  const audio = fileArg ?? findAudio(m.song);
  if (!audio) { console.error(`${mp}: no encuentro ${m.song} bajo ~/Música (usa --file)`); continue; }
  if (statSync(audio).size !== m.size) console.warn(`${mp}: el tamaño del archivo no coincide con la marca (${statSync(audio).size} ≠ ${m.size})`);
  const file = audio.replace(homedir(), '~');
  const label = {
    song: m.song.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
    file, date: m.date,
    note: `marca del reproductor (detector ${m.detector}, ${m.style}, índice ${m.downbeatIndex}; automático ${m.autoDownbeatIndex} conf ${m.autoConfidence})`,
    bpmRef: m.bpm,
    counts: (m.ones?.length ? m.ones : [m.oneAt]).map((t) => [t, 1]),
  };
  const i = db.labels.findIndex((l) => l.file === file || l.song === label.song);
  if (i >= 0) { db.labels[i] = { ...db.labels[i], ...label }; console.log(`actualizada: ${label.song}`); }
  else { db.labels.push(label); console.log(`añadida: ${label.song}`); }
}
writeFileSync(labelsPath, JSON.stringify(db, null, 1) + '\n');
