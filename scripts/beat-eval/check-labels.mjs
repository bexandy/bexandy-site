#!/usr/bin/env node
// Comprueba el detector contra scripts/beat-eval/labels.json (conteos hablados o etiquetas de oído).
// Uso: node scripts/beat-eval/check-labels.mjs [--signals]   (requiere ffmpeg)
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';

const showSignals = process.argv.includes('--signals');
const { labels } = JSON.parse(readFileSync(new URL('./labels.json', import.meta.url), 'utf8'));
const tmp = mkdtempSync(join(tmpdir(), 'beat-labels-'));
writeFileSync(join(tmp, 'entry.ts'), `export * from '${process.cwd()}/src/components/salsa/player/analysis/beatTracker';\nexport * from '${process.cwd()}/src/components/salsa/player/analysis/clavePhase';\n`);
execFileSync('npx', ['esbuild', join(tmp, 'entry.ts'), '--bundle', '--format=esm', '--platform=node', `--outfile=${join(tmp, 'bt.mjs')}`], { stdio: 'ignore' });
const m = await import(join(tmp, 'bt.mjs'));
const sr = 44100;
let okGrid = 0, okOne = 0, n = 0;
for (const l of labels) {
  const file = l.file.replace(/^~/, homedir());
  const ff = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-ar', String(sr), '-'], { maxBuffer: 1 << 30 });
  if (ff.status !== 0) { console.log(`✗ ${l.song}: no se pudo decodificar ${file}`); continue; }
  const x = new Float32Array(ff.stdout.buffer, ff.stdout.byteOffset, ff.stdout.byteLength / 4);
  const r = m.analyze({ length: x.length, sampleRate: sr, numberOfChannels: 1, getChannelData: () => x });
  const beats = r.beats;
  // cada número cantado → pulso más cercano → posición según el detector → desplazamiento (posición − número) mod 8
  const offs = new Array(8).fill(0); let used = 0;
  for (const [t, num] of l.counts) {
    let lo = 0, hi = beats.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (beats[mid] < t) lo = mid + 1; else hi = mid; }
    const cands = [lo - 1, lo].filter((j) => j >= 0 && j < beats.length); if (!cands.length) continue;
    const j = cands.reduce((a, b) => (Math.abs(beats[a] - t) <= Math.abs(beats[b] - t) ? a : b));
    if (Math.abs(beats[j] - t) > 0.25) continue;
    const pos = (((j - r.downbeatIndex) % 8) + 8) % 8 + 1;
    offs[(((pos - num) % 8) + 8) % 8]++; used++;
  }
  const best = offs.indexOf(Math.max(...offs)); const cons = used ? offs[best] / used : 0;
  const gridOk = cons >= 0.8; const oneOk = gridOk && best === 0;
  n++; okGrid += gridOk; okOne += oneOk;
  const verdict = !used ? 'sin números alineables' : !gridOk ? `rejilla inconsistente (${Math.round(cons * 100)} %)` : best === 0 ? 'el 1 coincide' : best === 4 ? 'marca el 5' : `compás corrido ${best} pulso(s)`;
  console.log(`${oneOk ? '✓' : gridOk ? '△' : '✗'} ${l.song}: ${verdict} · ${r.bpm.toFixed(1)} bpm · conf ${r.downbeatConfidence.toFixed(2)} · ${used}/${l.counts.length} números`);
  if (showSignals) {
    const { env, fps } = m.onsetEnvelope(x, sr);
    const sig = { clave: m.estimateDownbeat(beats, [{ envelope: env, fps, templates: m.CLAVE_TEMPLATES, weight: 1 }]).scores, bar: m.barAccentScores(env, fps, beats), energy: m.guessDownbeat(env, fps, beats).scores, phrase: m.phraseScores(m.phraseNovelty(x, sr, beats)), harmony: m.harmonicChangeScores(x, sr, beats) };
    const trueIdx = ((r.downbeatIndex + best) % 8 + 8) % 8;
    for (const [k, v] of Object.entries(sig)) { const mx = Math.max(...v.map(Math.abs)) || 1; const s = v.map((a) => a / mx); const am = s.indexOf(Math.max(...s)); console.log('   ' + k.padEnd(8) + s.map((a) => a.toFixed(2).padStart(6)).join('') + `  → ${am}${am === trueIdx ? ' ✓' : (am - trueIdx + 8) % 8 === 4 ? ' (5)' : ''}`); }
  }
}
console.log(`\nrejilla correcta ${okGrid}/${n} · el 1 correcto ${okOne}/${n}`);
