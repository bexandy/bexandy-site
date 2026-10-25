#!/usr/bin/env node
// Prueba de oído A/B: genera dos MP3 de la canción con metrónomo (agudo en el 1, medio en el 5, suave en 2-3 y 6-7).
// A acentúa el 1 que elige el detector; B el candidato opuesto (cuatro pulsos después). El bailarín dice en cuál cae su 1.
// Uso: node scripts/beat-eval/render-click.mjs <audio> <slug>   → ~/Música/pruebas-conteo/<slug>-opcion-A.mp3 y -B.mp3
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';

const [audio, slug] = process.argv.slice(2);
if (!audio || !slug) { console.error('Uso: render-click.mjs <audio> <slug>'); process.exit(1); }
const tmp = mkdtempSync(join(tmpdir(), 'beat-click-'));
execFileSync('npx', ['esbuild', 'src/components/salsa/player/analysis/beatTracker.ts', '--bundle', '--format=esm', '--platform=node', `--outfile=${join(tmp, 'bt.mjs')}`], { stdio: 'ignore' });
const { analyze } = await import(join(tmp, 'bt.mjs'));
const sr = 44100;
const ff = spawnSync('ffmpeg', ['-v', 'error', '-i', audio, '-f', 'f32le', '-ac', '1', '-ar', String(sr), '-'], { maxBuffer: 1 << 30 });
if (ff.status !== 0) { console.error(ff.stderr.toString()); process.exit(1); }
const x = new Float32Array(ff.stdout.buffer, ff.stdout.byteOffset, ff.stdout.byteLength / 4);
const r = analyze({ length: x.length, sampleRate: sr, numberOfChannels: 1, getChannelData: () => x });
const outDir = join(homedir(), 'Música', 'pruebas-conteo'); mkdirSync(outDir, { recursive: true });

function render(db, file) {
  const mix = Float32Array.from(x, (v) => v * 0.6);
  const click = (t, freq, amp, dur) => { const s0 = Math.round(t * sr); for (let i = 0; i < dur * sr && s0 + i < mix.length; i++) mix[s0 + i] += amp * Math.sin(2 * Math.PI * freq * i / sr) * Math.exp(-i / (sr * 0.012)); };
  r.beats.forEach((t, i) => { const n = (((i - db) % 8) + 8) % 8 + 1; if (n === 1) click(t, 1800, 0.9, 0.08); else if (n === 5) click(t, 1200, 0.7, 0.08); else if (n !== 4 && n !== 8) click(t, 900, 0.35, 0.05); });
  const pcm = new Int16Array(mix.length); for (let i = 0; i < mix.length; i++) { const v = Math.max(-1, Math.min(1, mix[i])); pcm[i] = v < 0 ? v * 32768 : v * 32767; }
  const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.byteLength, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.byteLength, 40);
  const wav = join(tmp, 'out.wav'); writeFileSync(wav, Buffer.concat([h, Buffer.from(pcm.buffer)]));
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', wav, '-b:a', '160k', file]);
}
const a = r.downbeatIndex, b = (a + 4) % 8;
render(a, join(outDir, `${slug}-opcion-A.mp3`)); render(b, join(outDir, `${slug}-opcion-B.mp3`));
console.log(JSON.stringify({ bpm: +r.bpm.toFixed(1), clave: r.clave, confianza: +r.downbeatConfidence.toFixed(2), A: a, B: b, carpeta: outDir }));
