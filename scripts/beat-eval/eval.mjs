#!/usr/bin/env node
// Evalúa el detector de pulsos del reproductor contra anotaciones del Salsa dataset (Rapini & Jordanous, 2024).
// Uso: node scripts/beat-eval/eval.mjs <audio> <anotaciones.csv> [--tolerance 0.07]
// Requiere ffmpeg. El audio lo pone el usuario (las canciones del dataset son comerciales); el CSV es "tiempo,posición(1-4)".
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [audio, csv, ...rest] = process.argv.slice(2);
if (!audio || !csv) { console.error('Uso: eval.mjs <audio> <anotaciones.csv> [--tolerance 0.07]'); process.exit(1); }
const tol = rest.includes('--tolerance') ? Number(rest[rest.indexOf('--tolerance') + 1]) : 0.07;

// 1. Empaquetar el detector (TypeScript) con esbuild a un módulo temporal
const tmp = mkdtempSync(join(tmpdir(), 'beat-eval-'));
const bundle = join(tmp, 'bt.mjs');
execFileSync('npx', ['esbuild', 'src/components/salsa/player/analysis/beatTracker.ts', '--bundle', '--format=esm', '--platform=node', `--outfile=${bundle}`], { stdio: 'ignore' });
const { analyze } = await import(bundle);

// 2. Decodificar el audio a mono 44.1 kHz float32 con ffmpeg
const sr = 44100;
const ff = spawnSync('ffmpeg', ['-v', 'error', '-i', audio, '-f', 'f32le', '-ac', '1', '-ar', String(sr), '-'], { maxBuffer: 1 << 30 });
if (ff.status !== 0) { console.error(ff.stderr.toString()); process.exit(1); }
const data = new Float32Array(ff.stdout.buffer, ff.stdout.byteOffset, ff.stdout.byteLength / 4);
const buffer = { length: data.length, sampleRate: sr, numberOfChannels: 1, getChannelData: () => data };

// 3. Anotaciones: tiempo,posición
const ann = readFileSync(csv, 'utf8').trim().split(/\r?\n/).map((l) => l.split(',')).filter((r) => r.length >= 2 && !isNaN(+r[0])).map((r) => ({ t: +r[0], pos: +r[1] }));
const annBeats = ann.map((a) => a.t);
const annDown = ann.filter((a) => a.pos === 1).map((a) => a.t);

// 4. Detección
const t0 = Date.now();
const res = analyze(buffer);
const ms = Date.now() - t0;
const detBeats = res.beats;
// pulsos 1 y 5 del conteo de 8 = inicio de compás de 4/4
const countOf = (i) => (((i - res.downbeatIndex) % 8) + 8) % 8 + 1;
const detDown = detBeats.filter((_, i) => countOf(i) === 1 || countOf(i) === 5);

function fMeasure(det, ref, tol) {
  const used = new Set(); let tp = 0;
  for (const d of det) { let best = -1, bd = tol; for (let i = 0; i < ref.length; i++) { if (used.has(i)) continue; const dd = Math.abs(ref[i] - d); if (dd <= bd) { bd = dd; best = i; } } if (best >= 0) { used.add(best); tp++; } }
  const p = det.length ? tp / det.length : 0, r = ref.length ? tp / ref.length : 0;
  return { f: p + r ? (2 * p * r) / (p + r) : 0, p, r };
}
// tolerar octava/medio tempo: comparar también contra la referencia a doble densidad
const beatF = fMeasure(detBeats, annBeats, tol);
const downF = fMeasure(detDown, annDown, tol);
const annBpm = 60 / ((annBeats.at(-1) - annBeats[0]) / (annBeats.length - 1));
console.log(JSON.stringify({ audio, bpmDetectado: +res.bpm.toFixed(1), bpmAnotado: +annBpm.toFixed(1), clave: res.clave, confianzaDel1: +res.downbeatConfidence.toFixed(2), pulsos: { f: +beatF.f.toFixed(3), precision: +beatF.p.toFixed(3), recall: +beatF.r.toFixed(3) }, inicioDeCompas: { f: +downF.f.toFixed(3) }, tiempoMs: ms }, null, 1));
