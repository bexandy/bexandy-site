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
// Alineación: el audio del usuario puede ser otra masterización (recorte inicial y velocidad distintos).
// Se busca el desplazamiento y el estiramiento lineal de las anotaciones que maximizan las coincidencias.
function align(det, ref) {
  let best = { f: -1, offset: 0, stretch: 1 };
  for (let st = 0.994; st <= 1.0061; st += 0.0005) {
    for (let off = -0.25; off <= 0.2501; off += 0.005) {
      const r2 = ref.map((t) => t * st + off);
      const { f } = fMeasure(det, r2, tol);
      // entre soluciones equivalentes (desplazadas pulsos enteros), preferir el desplazamiento más pequeño
      if (f > best.f + 0.005 || (Math.abs(f - best.f) <= 0.005 && Math.abs(off) < Math.abs(best.offset))) best = { f, offset: off, stretch: st };
    }
  }
  // refinamiento fino del desplazamiento
  for (let off = best.offset - 0.01; off <= best.offset + 0.0101; off += 0.001) {
    const { f } = fMeasure(det, ref.map((t) => t * best.stretch + off), tol);
    if (f > best.f) best = { ...best, f, offset: off };
  }
  return best;
}
const al = align(detBeats, annBeats);
const annBeatsA = annBeats.map((t) => t * al.stretch + al.offset);
const annDownA = annDown.map((t) => t * al.stretch + al.offset);
const beatF = fMeasure(detBeats, annBeatsA, tol);
const downF = fMeasure(detDown, annDownA, tol);
// ¿en qué posición del compás anotado caen nuestros "1"? (para saber si el compás se acertó)
const posHist = { 1: 0, 2: 0, 3: 0, 4: 0 };
const annA = ann.map((a) => ({ t: a.t * al.stretch + al.offset, pos: a.pos }));
for (let i = 0; i < detBeats.length; i++) {
  if (countOf(i) !== 1) continue;
  let best = annA[0]; for (const a of annA) if (Math.abs(a.t - detBeats[i]) < Math.abs(best.t - detBeats[i])) best = a;
  if (Math.abs(best.t - detBeats[i]) <= tol) posHist[best.pos]++;
}
const sinAlinear = fMeasure(detBeats, annBeats, tol).f;
const annBpm = 60 / ((annBeats.at(-1) - annBeats[0]) / (annBeats.length - 1));
console.log(JSON.stringify({ audio, bpmDetectado: +res.bpm.toFixed(1), bpmAnotado: +annBpm.toFixed(1), alineacion: { desplazamientoMs: Math.round(al.offset * 1000), estiramiento: +al.stretch.toFixed(4), fSinAlinear: +sinAlinear.toFixed(3) }, clave: res.clave, confianzaDel1: +res.downbeatConfidence.toFixed(2), pulsos: { f: +beatF.f.toFixed(3), precision: +beatF.p.toFixed(3), recall: +beatF.r.toFixed(3) }, inicioDeCompas: { f: +downF.f.toFixed(3) }, posicionAnotadaDeNuestros1: posHist, tiempoMs: ms }, null, 1));
