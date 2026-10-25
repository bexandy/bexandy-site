#!/usr/bin/env node
// Comprueba el detector del 1 contra las etiquetas de oído de scripts/beat-eval/labels.json.
// Uso: node scripts/beat-eval/check-labels.mjs   (requiere ffmpeg; imprime cada señal por desplazamiento y el resultado de la fusión)
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';

const { labels } = JSON.parse(readFileSync(new URL('./labels.json', import.meta.url), 'utf8'));
const tmp = mkdtempSync(join(tmpdir(), 'beat-labels-'));
writeFileSync(join(tmp, 'entry.ts'), `export * from '${process.cwd()}/src/components/salsa/player/analysis/beatTracker';\nexport * from '${process.cwd()}/src/components/salsa/player/analysis/clavePhase';\n`);
execFileSync('npx', ['esbuild', join(tmp, 'entry.ts'), '--bundle', '--format=esm', '--platform=node', `--outfile=${join(tmp, 'bt.mjs')}`], { stdio: 'ignore' });
const m = await import(join(tmp, 'bt.mjs'));
const sr = 44100;
let ok = 0;
for (const l of labels) {
  const file = l.file.replace(/^~/, homedir());
  const ff = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-ar', String(sr), '-'], { maxBuffer: 1 << 30 });
  if (ff.status !== 0) { console.log(`✗ ${l.song}: no se pudo decodificar ${file}`); continue; }
  const x = new Float32Array(ff.stdout.buffer, ff.stdout.byteOffset, ff.stdout.byteLength / 4);
  const { env, fps } = m.onsetEnvelope(x, sr);
  const beats = m.trackBeats(env, fps, m.estimateTempo(env, fps).periodFrames);
  const sig = {
    clave: m.estimateDownbeat(beats, [{ envelope: env, fps, templates: m.CLAVE_TEMPLATES, weight: 1 }]).scores,
    bar: m.barAccentScores(env, fps, beats),
    energy: m.guessDownbeat(env, fps, beats).scores,
    phrase: m.phraseScores(m.phraseNovelty(x, sr, beats)),
    harmony: m.harmonicChangeScores(x, sr, beats),
  };
  const res = m.analyze({ length: x.length, sampleRate: sr, numberOfChannels: 1, getChannelData: () => x });
  const hit = res.downbeatIndex === l.downbeatIndex; ok += hit;
  console.log(`\n${hit ? '✓' : '✗'} ${l.song}: detector ${res.downbeatIndex}, etiqueta ${l.downbeatIndex} (conf ${res.downbeatConfidence.toFixed(2)})`);
  for (const [k, v] of Object.entries(sig)) { const mx = Math.max(...v.map(Math.abs)) || 1; const n = v.map((a) => a / mx); console.log('  ' + k.padEnd(8) + n.map((a) => a.toFixed(2).padStart(6)).join('') + '  → ' + n.indexOf(Math.max(...n))); }
}
console.log(`\n${ok}/${labels.length} aciertos`);
