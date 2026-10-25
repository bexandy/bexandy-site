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

/**
 * Puntuación por lag (frames) de un tramo de la envolvente, con preferencia log-gaussiana al tempo de salsa.
 * Peine métrico: el pulso real tiene periodicidad también a la mitad (corcheas) y al doble (dos pulsos). El tresillo
 * de la clave y el tumbao crea un lag espurio a 1,5 pulsos (La Peleona: 157 en vez de 235 bpm) que no tiene nada a la mitad.
 */
function tempoScores(env: Float32Array, fps: number, minLag: number, maxLag: number, prefBpm: number) {
  const n = env.length;
  const lo = Math.max(1, Math.floor(minLag / 2)), hi = Math.min(n - 1, Math.ceil(maxLag * 2) + 1);
  const ac = new Float32Array(hi + 1);
  for (let lag = lo; lag <= hi; lag++) {
    let s = 0;
    for (let i = lag; i < n; i++) s += env[i] * env[i - lag];
    ac[lag] = s / Math.max(1, n - lag);
  }
  const at = (l: number) => { const k = Math.floor(l), a = l - k; return k >= lo && k + 1 <= hi ? ac[k] * (1 - a) + ac[k + 1] * a : 0; };
  const scores = new Float32Array(maxLag - minLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    const s = at(lag) + 0.5 * (at(lag / 2) + at(2 * lag));
    const bpm = (60 * fps) / lag;
    const wgt = Math.exp(-0.5 * Math.pow(Math.log2(bpm / prefBpm) / 0.6, 2));
    scores[lag - minLag] = s * (0.4 + wgt);
  }
  return scores;
}

/** Afina el lag ganador con interpolación parabólica: el período deja de estar cuantizado a frames enteros (a 160 bpm un frame son ~5 bpm). */
function refineLag(scores: Float32Array, k: number) {
  if (k <= 0 || k >= scores.length - 1) return k;
  const y0 = scores[k - 1], y1 = scores[k], y2 = scores[k + 1];
  const den = y0 - 2 * y1 + y2;
  if (Math.abs(den) < 1e-12) return k;
  return k + Math.max(-0.5, Math.min(0.5, (0.5 * (y0 - y2)) / den));
}

/** Tempo global por autocorrelación con preferencia al rango de salsa. Devuelve el período en frames (fraccionario). */
export function estimateTempo(env: Float32Array, fps: number, minBpm = 60, maxBpm = 260, prefBpm = 185) {
  const minLag = Math.floor((60 / maxBpm) * fps);
  const maxLag = Math.ceil((60 / minBpm) * fps);
  const scores = tempoScores(env, fps, minLag, maxLag, prefBpm);
  let k = 0; for (let i = 1; i < scores.length; i++) if (scores[i] > scores[k]) k = i;
  const periodFrames = minLag + refineLag(scores, k);
  return { bpm: (60 * fps) / periodFrames, periodFrames };
}

/**
 * Curva de tempo: período (frames) por frame. Estima el tempo por ventanas de ~12 s y encadena las ventanas por
 * programación dinámica con penalización a los saltos, así sigue canciones que aceleran o grabaciones en directo
 * sin saltar de octava a cada ventana. Con menos de dos ventanas devuelve el tempo global.
 */
export function tempoCurve(env: Float32Array, fps: number, minBpm = 60, maxBpm = 260, prefBpm = 185, beta = 6) {
  const n = env.length;
  const win = Math.round(12 * fps), hop = Math.round(6 * fps);
  const out = new Float32Array(n);
  if (n < 2 * win) { out.fill(estimateTempo(env, fps, minBpm, maxBpm, prefBpm).periodFrames); return out; }
  const minLag = Math.floor((60 / maxBpm) * fps), maxLag = Math.ceil((60 / minBpm) * fps);
  const centers: number[] = [], all: Float32Array[] = [];
  for (let s = 0; s + win <= n; s += hop) {
    const sc = tempoScores(env.subarray(s, s + win), fps, minLag, maxLag, prefBpm);
    let mx = 0; for (let i = 0; i < sc.length; i++) mx = Math.max(mx, sc[i]);
    if (mx > 0) for (let i = 0; i < sc.length; i++) sc[i] /= mx;
    all.push(sc); centers.push(s + win / 2);
  }
  // DP sobre ventanas: estado = lag; coste = -puntuación + beta·ln(lag_i/lag_{i-1})²
  const W = all.length, L = maxLag - minLag + 1;
  let prev = new Float32Array(L); const back: Int32Array[] = [];
  for (let i = 0; i < L; i++) prev[i] = -all[0][i];
  for (let w = 1; w < W; w++) {
    const cur = new Float32Array(L), bk = new Int32Array(L);
    for (let i = 0; i < L; i++) {
      let best = Infinity, bj = i;
      for (let j = 0; j < L; j++) {
        const r = Math.log((i + minLag) / (j + minLag));
        const c = prev[j] + beta * r * r;
        if (c < best) { best = c; bj = j; }
      }
      cur[i] = best - all[w][i]; bk[i] = bj;
    }
    back.push(bk); prev = cur;
  }
  let k = 0; for (let i = 1; i < L; i++) if (prev[i] < prev[k]) k = i;
  const lags = new Array<number>(W);
  for (let w = W - 1; w >= 0; w--) { lags[w] = minLag + refineLag(all[w], k); if (w > 0) k = back[w - 1][k]; }
  // interpolación lineal entre centros de ventana
  for (let t = 0; t < n; t++) {
    if (t <= centers[0]) { out[t] = lags[0]; continue; }
    if (t >= centers[W - 1]) { out[t] = lags[W - 1]; continue; }
    let w = 0; while (centers[w + 1] < t) w++;
    const a = (t - centers[w]) / (centers[w + 1] - centers[w]);
    out[t] = lags[w] * (1 - a) + lags[w + 1] * a;
  }
  return out;
}

/** Colocación de pulsos por programación dinámica (Ellis, 2007). El período puede ser fijo (frames, fraccionario) o una curva por frame. */
// alpha: rigidez frente al período estimado. 680 (Ellis) era demasiado rígido con nuestra envolvente normalizada: no seguía desvíos del 3 % (Rumba Rumberos, 49 % → 99 % de pulsos coherentes con 300).
export function trackBeats(env: Float32Array, fps: number, period: number | Float32Array, alpha = 300) {
  const n = env.length;
  const P = (t: number) => (typeof period === 'number' ? period : period[t]);
  let pmin = Infinity, pmax = 0;
  if (typeof period === 'number') { pmin = pmax = period; } else for (let t = 0; t < n; t++) { pmin = Math.min(pmin, period[t]); pmax = Math.max(pmax, period[t]); }
  const score = new Float32Array(n);
  const back = new Int32Array(n).fill(-1);
  const lo = Math.max(1, Math.round(pmin / 2)), hi = Math.round(pmax * 2);
  for (let t = 0; t < n; t++) {
    let bestS = 0, bestP = -1;
    const pt = P(t);
    for (let p = lo; p <= hi; p++) {
      const prev = t - p;
      if (prev < 0) break;
      const pen = -alpha * Math.pow(Math.log(p / pt), 2);
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
 * Comprobación de octava: en salsa las corcheas ("y") llevan energía (martillo del bongó, maracas, tonos abiertos),
 * pero las semicorcheas casi ninguna. Si los puntos medios entre pulsos están vacíos, el tempo va doblado; si pesan
 * tanto como los pulsos y el tempo es lento, va a la mitad. Devuelve el factor a aplicar al período (1, 2 o 0.5).
 */
export function octaveFactor(env: Float32Array, fps: number, beats: number[], bpm: number) {
  if (beats.length < 16) return 1;
  const at = (t: number) => { const i = Math.round(t * fps); let m = 0; for (let j = Math.max(0, i - 1); j <= Math.min(env.length - 1, i + 1); j++) m = Math.max(m, env[j]); return m; };
  let on = 0, mid = 0;
  for (let i = 0; i + 1 < beats.length; i++) { on += at(beats[i]); mid += at((beats[i] + beats[i + 1]) / 2); }
  const ratio = mid / (on || 1);
  if (bpm > 170 && ratio < 0.15) return 2;
  if (bpm < 110 && ratio > 0.85) return 0.5;
  return 1;
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
  const { bpm } = estimateTempo(env, fps);
  let period = tempoCurve(env, fps);
  let beats = trackBeats(env, fps, period);
  const ivs0 = beats.slice(1).map((b, i) => b - beats[i]).sort((a, b) => a - b);
  const bpm0 = ivs0.length ? 60 / ivs0[Math.floor(ivs0.length / 2)] : bpm;
  const oct = octaveFactor(env, fps, beats, bpm0);
  if (oct !== 1) { period = period.map((p) => p * oct); beats = trackBeats(env, fps, period); }
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
