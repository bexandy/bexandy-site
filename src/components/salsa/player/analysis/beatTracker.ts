import { fft, hann } from './fft';
import { estimateDownbeat, phraseNovelty, phraseScores, harmonicChangeScores, fuseDownbeat, barAccentScores, CLAVE_TEMPLATES, type ClaveName } from './clavePhase';

export interface BeatAnalysis {
  bpm: number;
  /** tiempos (s) de cada pulso */
  beats: number[];
  /** índice del pulso que se considera "1" del compás de 8 */
  downbeatIndex: number;
  /** 0..1, qué tan clara fue la elección automática del "1" */
  downbeatConfidence: number;
  /** clave detectada por plantillas, si la hubo */
  clave: ClaveName | null;
  /** envolvente de onsets (para depurar / dibujar) */
  envelope: Float32Array;
  fps: number;
}

const WIN = 1024;
const HOP = 512;

/** Mezcla a mono. */
function mono(buffer: AudioBuffer) {
  const n = buffer.length;
  const out = new Float32Array(n);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < n; i++) out[i] += d[i] / buffer.numberOfChannels;
  }
  return out;
}

/** Envolvente de onsets por flujo espectral con compresión logarítmica. */
export function onsetEnvelope(x: Float32Array, sampleRate: number) {
  const frames = Math.max(0, Math.floor((x.length - WIN) / HOP));
  const env = new Float32Array(frames);
  const w = hann(WIN);
  const re = new Float32Array(WIN), im = new Float32Array(WIN);
  const bins = Math.min(WIN / 2, Math.floor((8000 / sampleRate) * WIN)); // hasta 8 kHz
  let prev = new Float32Array(bins);
  for (let f = 0; f < frames; f++) {
    const off = f * HOP;
    for (let i = 0; i < WIN; i++) { re[i] = x[off + i] * w[i]; im[i] = 0; }
    fft(re, im);
    let flux = 0;
    const cur = new Float32Array(bins);
    for (let k = 0; k < bins; k++) {
      const m = Math.log1p(10 * Math.hypot(re[k], im[k]));
      cur[k] = m;
      const d = m - prev[k];
      if (d > 0) flux += d;
    }
    env[f] = flux;
    prev = cur;
  }
  // Restar media local (≈0.5 s) y rectificar
  const fps = sampleRate / HOP;
  const half = Math.round(fps * 0.25);
  const out = new Float32Array(frames);
  let max = 1e-9;
  for (let i = 0; i < frames; i++) {
    let s = 0, c = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(frames - 1, i + half); j++) { s += env[j]; c++; }
    out[i] = Math.max(0, env[i] - s / c);
    if (out[i] > max) max = out[i];
  }
  for (let i = 0; i < frames; i++) out[i] /= max;
  return { env: out, fps };
}

/** Tempo por autocorrelación con preferencia al rango de salsa. */
export function estimateTempo(env: Float32Array, fps: number, minBpm = 60, maxBpm = 260, prefBpm = 185) {
  const minLag = Math.floor((60 / maxBpm) * fps);
  const maxLag = Math.ceil((60 / minBpm) * fps);
  let bestLag = minLag, best = -Infinity;
  const n = env.length;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0;
    for (let i = lag; i < n; i++) s += env[i] * env[i - lag];
    s /= n - lag;
    const bpm = (60 * fps) / lag;
    // preferencia log-gaussiana centrada en prefBpm (ancho ~ una octava)
    const wgt = Math.exp(-0.5 * Math.pow(Math.log2(bpm / prefBpm) / 0.6, 2));
    const score = s * (0.4 + wgt);
    if (score > best) { best = score; bestLag = lag; }
  }
  return { bpm: (60 * fps) / bestLag, periodFrames: bestLag };
}

/** Colocación de pulsos por programación dinámica (Ellis, 2007). */
export function trackBeats(env: Float32Array, fps: number, periodFrames: number, alpha = 680) {
  const n = env.length;
  const score = new Float32Array(n);
  const back = new Int32Array(n).fill(-1);
  const lo = Math.round(periodFrames / 2), hi = Math.round(periodFrames * 2);
  for (let t = 0; t < n; t++) {
    let bestS = 0, bestP = -1;
    for (let p = lo; p <= hi; p++) {
      const prev = t - p;
      if (prev < 0) break;
      const pen = -alpha * Math.pow(Math.log(p / periodFrames), 2);
      const s = score[prev] + pen;
      if (s > bestS) { bestS = s; bestP = prev; }
    }
    score[t] = env[t] + bestS;
    back[t] = bestP;
  }
  // partir desde el mejor de los últimos frames
  let t = n - 1, bestT = t;
  for (let i = Math.max(0, n - hi); i < n; i++) if (score[i] > score[bestT]) bestT = i;
  const beats: number[] = [];
  for (t = bestT; t >= 0; t = back[t]) { beats.push(t / fps); if (back[t] < 0) break; }
  return beats.reverse();
}

/**
 * Heurística de acentos para el compás. En salsa el tiempo 1 es el más débil: la energía está en el 2 (slap de conga),
 * el 4 (tonos abiertos) y, en menor medida, el 3. Perfil medido sobre anotaciones del Salsa dataset.
 */
export function guessDownbeat(env: Float32Array, fps: number, beats: number[]) {
  const at = (t: number) => {
    const i = Math.round(t * fps);
    let m = 0;
    for (let j = Math.max(0, i - 2); j <= Math.min(env.length - 1, i + 2); j++) m = Math.max(m, env[j]);
    return m;
  };
  const w = [0.3, 1, 0.4, 0.8, 0.3, 1, 0.4, 0.8];
  const scores: number[] = new Array(8).fill(0);
  for (let off = 0; off < 8; off++) {
    for (let i = 0; i < beats.length; i++) scores[off] += w[(i - off + 800) % 8] * at(beats[i]);
  }
  let best = 0, second = 0, bestOff = 0;
  scores.forEach((s, off) => { if (s > best) { second = best; best = s; bestOff = off; } else if (s > second) second = s; });
  const mx = best || 1;
  return { downbeatIndex: bestOff, confidence: best > 0 ? Math.max(0, Math.min(1, (best - second) / best * 8)) : 0, scores: scores.map((v: number) => v / mx) };
}

export function analyze(buffer: AudioBuffer): BeatAnalysis {
  const x = mono(buffer);
  const { env, fps } = onsetEnvelope(x, buffer.sampleRate);
  const { bpm, periodFrames } = estimateTempo(env, fps);
  const beats = trackBeats(env, fps, periodFrames);
  // "1": fusión de señales. Clave y acentos discriminan el compás; novedad tímbrica y armonía deciden entre 1 y 5.
  const clave = estimateDownbeat(beats, [{ envelope: env, fps, templates: CLAVE_TEMPLATES, weight: 1 }]);
  const energy = guessDownbeat(env, fps, beats);
  const phrase = phraseScores(phraseNovelty(x, buffer.sampleRate, beats));
  const harmony = harmonicChangeScores(x, buffer.sampleRate, beats);
  const bar = barAccentScores(env, fps, beats);
  const fused = fuseDownbeat([
    { scores: clave.scores, weight: 0.5 },
    { scores: bar, weight: 1.2 },
    { scores: energy.scores, weight: 0.3 },
    { scores: phrase, weight: 0.4 },
    { scores: harmony, weight: 0.4 },
  ]);
  const downbeatIndex = fused.downbeatIndex;
  const confidence = fused.confidence;
  const useClave = clave.confidence >= 0.15;
  // bpm real: mediana de intervalos
  const ivs = beats.slice(1).map((b, i) => b - beats[i]).sort((a, b) => a - b);
  const med = ivs.length ? ivs[Math.floor(ivs.length / 2)] : 60 / bpm;
  return { bpm: 60 / med, beats, downbeatIndex, downbeatConfidence: confidence, clave: useClave ? clave.clave : null, envelope: env, fps };
}
