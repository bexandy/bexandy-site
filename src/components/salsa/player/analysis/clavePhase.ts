/**
 * Estimación de la fase del compás de 8 tiempos (dónde cae el "1") por correlación con plantillas de clave.
 * Trabaja sobre una rejilla de semicorcheas derivada de los pulsos detectados: 8 pulsos × 4 = 32 posiciones por ciclo.
 */
export type ClaveName = 'son 3-2' | 'son 2-3' | 'rumba 3-2' | 'rumba 2-3';

/** Posiciones (semicorcheas 0..31) de los golpes de cada clave, con el "1" del bailarín en la posición 0. */
export const CLAVE_TEMPLATES: Record<ClaveName, number[]> = {
  'son 3-2': [0, 6, 12, 20, 24],
  'son 2-3': [4, 8, 16, 22, 28],
  'rumba 3-2': [0, 6, 14, 20, 24],
  'rumba 2-3': [4, 8, 16, 22, 30],
};
/** Tumbao de bajo: anticipa el 1 y el 3 (“y de 8”, “y de 2”): golpes en 2+ y 4 de cada compás. */
export const BASS_TEMPLATE = [6, 12, 22, 28];

export interface PhaseSource {
  envelope: Float32Array;
  fps: number;
  /** plantilla con la que correlacionar esta fuente */
  templates: Partial<Record<ClaveName, number[]>> | { bass: number[] };
  weight: number;
}

export interface PhaseEstimate {
  /** índice de pulso (0..7) que debe considerarse "1" */
  downbeatIndex: number;
  clave: ClaveName | null;
  confidence: number;
  scores: number[];
}

/** Perfil de energía por semicorchea dentro de un ciclo de 32 posiciones, para cada uno de los 8 desplazamientos posibles. */
function cycleProfile(env: Float32Array, fps: number, beats: number[], offset: number): Float32Array {
  const prof = new Float32Array(32);
  const cnt = new Float32Array(32);
  for (let i = 0; i + 1 < beats.length; i++) {
    const pos = (((i - offset) % 8) + 8) % 8;
    const t0 = beats[i], dt = (beats[i + 1] - beats[i]) / 4;
    for (let q = 0; q < 4; q++) {
      const t = t0 + q * dt;
      const c = Math.round(t * fps);
      let m = 0;
      for (let j = Math.max(0, c - 1); j <= Math.min(env.length - 1, c + 1); j++) m = Math.max(m, env[j]);
      prof[pos * 4 + q] += m; cnt[pos * 4 + q]++;
    }
  }
  for (let k = 0; k < 32; k++) prof[k] = cnt[k] ? prof[k] / cnt[k] : 0;
  // normalizar (media 0, norma 1) para que la correlación compare formas
  let mean = 0; for (let k = 0; k < 32; k++) mean += prof[k]; mean /= 32;
  let norm = 0; for (let k = 0; k < 32; k++) { prof[k] -= mean; norm += prof[k] * prof[k]; }
  norm = Math.sqrt(norm) || 1;
  for (let k = 0; k < 32; k++) prof[k] /= norm;
  return prof;
}

function templateVector(positions: number[]): Float32Array {
  const v = new Float32Array(32);
  for (const p of positions) v[p] = 1;
  let mean = 0; for (let k = 0; k < 32; k++) mean += v[k]; mean /= 32;
  let norm = 0; for (let k = 0; k < 32; k++) { v[k] -= mean; norm += v[k] * v[k]; }
  norm = Math.sqrt(norm) || 1;
  for (let k = 0; k < 32; k++) v[k] /= norm;
  return v;
}

const dot = (a: Float32Array, b: Float32Array) => { let s = 0; for (let k = 0; k < 32; k++) s += a[k] * b[k]; return s; };

/**
 * Devuelve el desplazamiento de pulso (0..7) y la clave que mejor explican los acentos.
 * Cada fuente aporta correlaciones ponderadas; la confianza es el margen entre el mejor y el segundo mejor desplazamiento.
 */
export function estimateDownbeat(beats: number[], sources: PhaseSource[]): PhaseEstimate {
  if (beats.length < 16 || sources.length === 0) return { downbeatIndex: 0, clave: null, confidence: 0, scores: [] };
  const claveNames = Object.keys(CLAVE_TEMPLATES) as ClaveName[];
  const bassVec = templateVector(BASS_TEMPLATE);
  const claveVecs = Object.fromEntries(claveNames.map((n) => [n, templateVector(CLAVE_TEMPLATES[n])])) as Record<ClaveName, Float32Array>;
  // puntuación por (offset, clave)
  const table: number[][] = Array.from({ length: 8 }, () => new Array(claveNames.length).fill(0));
  for (const src of sources) {
    for (let off = 0; off < 8; off++) {
      const prof = cycleProfile(src.envelope, src.fps, beats, off);
      if ('bass' in src.templates) {
        const s = dot(prof, bassVec) * src.weight;
        for (let c = 0; c < claveNames.length; c++) table[off][c] += s;
      } else {
        for (let c = 0; c < claveNames.length; c++) {
          const tpl = (src.templates as Partial<Record<ClaveName, number[]>>)[claveNames[c]];
          if (tpl) table[off][c] += dot(prof, claveVecs[claveNames[c]]) * src.weight;
        }
      }
    }
  }
  // mejor clave por offset y ranking de offsets
  const perOffset = table.map((row) => { let bi = 0; for (let c = 1; c < row.length; c++) if (row[c] > row[bi]) bi = c; return { score: row[bi], clave: claveNames[bi] }; });
  let best = 0; for (let o = 1; o < 8; o++) if (perOffset[o].score > perOffset[best].score) best = o;
  const sorted = perOffset.map((p) => p.score).sort((a, b) => b - a);
  const margin = sorted[0] - sorted[1];
  const confidence = Math.max(0, Math.min(1, margin / (Math.abs(sorted[0]) + 1e-6) * 2));
  return { downbeatIndex: best, clave: perOffset[best].clave, confidence, scores: perOffset.map((p) => p.score) };
}

/**
 * Desempate 1 vs 5: la clave fija el inicio de compás (módulo 4) pero no en cuál de los dos compases empieza la frase.
 * Mide la novedad tímbrica alrededor de cada pulso (cuánto cambia el espectro medio de los 4 pulsos previos a los 4 siguientes)
 * y la acumula por posición dentro del ciclo de 8: los cambios de sección y de acorde caen con más frecuencia en el 1.
 */
export function phraseNovelty(x: Float32Array, sampleRate: number, beats: number[]): Float32Array {
  const bands = 8, win = 2048;
  const nb = beats.length;
  const feat = new Float32Array(nb * bands);
  // energía log por banda (escala aproximadamente mel) promediada en cada pulso
  const edges = [0, 100, 200, 400, 800, 1600, 3200, 6400, 12000].map((f) => Math.min(win / 2, Math.round((f / sampleRate) * win)));
  const re = new Float32Array(win), im = new Float32Array(win);
  for (let i = 0; i < nb; i++) {
    const s0 = Math.round(beats[i] * sampleRate), s1 = Math.round((beats[i + 1] ?? beats[i] + 0.3) * sampleRate);
    let frames = 0;
    for (let s = s0; s + win <= Math.min(s1, x.length); s += win, frames++) {
      for (let k = 0; k < win; k++) { re[k] = x[s + k]; im[k] = 0; }
      fftInPlace(re, im);
      for (let b = 0; b < bands; b++) { let e = 0; for (let k = edges[b]; k < edges[b + 1]; k++) e += re[k] * re[k] + im[k] * im[k]; feat[i * bands + b] += Math.log1p(e); }
    }
    if (frames) for (let b = 0; b < bands; b++) feat[i * bands + b] /= frames;
  }
  const nov = new Float32Array(nb);
  for (let i = 4; i + 4 <= nb; i++) {
    let d = 0;
    for (let b = 0; b < bands; b++) {
      let prev = 0, next = 0;
      for (let k = 1; k <= 4; k++) { prev += feat[(i - k) * bands + b]; next += feat[(i + k - 1) * bands + b]; }
      d += Math.abs(next - prev) / 4;
    }
    nov[i] = d;
  }
  return nov;
}

/** Suma la novedad por posición del ciclo de 8 para cada desplazamiento candidato; devuelve puntuaciones normalizadas. */
export function phraseScores(novelty: Float32Array): number[] {
  const acc = new Array(8).fill(0), cnt = new Array(8).fill(0);
  for (let i = 0; i < novelty.length; i++) { acc[i % 8] += novelty[i]; cnt[i % 8]++; }
  const mean = acc.map((a, k) => (cnt[k] ? a / cnt[k] : 0));
  const max = Math.max(...mean) || 1;
  // desplazamiento o => la posición "1" es el pulso con índice ≡ o (mod 8)
  return mean.map((m) => m / max);
}

// FFT local (misma que fft.ts) para no crear dependencia circular
function fftInPlace(re: Float32Array, im: Float32Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) { const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = i + k + len / 2; const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr; } } }
}

/** Índice del pulso más cercano a un instante. */
function nearestBeat(beats: number[], t: number): number {
  let lo = 0, hi = beats.length - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if (beats[m] < t) lo = m + 1; else hi = m; }
  if (lo > 0 && Math.abs(beats[lo - 1] - t) < Math.abs(beats[lo] - t)) return lo - 1;
  return lo;
}

/**
 * Inicios de frase en la pista de voz: subidas de energía tras un silencio de al menos `gap` segundos.
 * Devuelve, por posición del ciclo de 8 (desplazamiento candidato), la fuerza acumulada de los inicios que caen en ese pulso.
 */
export function vocalPhraseScores(vocals: Float32Array, sampleRate: number, beats: number[], gap = 0.5): number[] {
  const hop = Math.round(sampleRate * 0.02); // 20 ms
  const n = Math.floor(vocals.length / hop);
  const rms = new Float32Array(n);
  let max = 1e-9;
  for (let i = 0; i < n; i++) { let s = 0; const o = i * hop; for (let k = 0; k < hop; k++) s += vocals[o + k] * vocals[o + k]; rms[i] = Math.sqrt(s / hop); if (rms[i] > max) max = rms[i]; }
  const thr = max * 0.12;
  const gapFrames = Math.round(gap / 0.02);
  const acc = new Array(8).fill(0);
  let silent = gapFrames; // empezar como si viniera de silencio
  for (let i = 0; i < n; i++) {
    if (rms[i] < thr) { silent++; continue; }
    if (silent >= gapFrames) {
      // fuerza = pico de los 200 ms siguientes, normalizado
      let peak = 0; for (let k = i; k < Math.min(n, i + 10); k++) peak = Math.max(peak, rms[k]);
      const bi = nearestBeat(beats, i * 0.02);
      // tolerancia: solo cuenta si cae cerca de un pulso (≤ 25 % del intervalo)
      const iv = (beats[bi + 1] ?? beats[bi] + 0.3) - (beats[bi - 1] ?? beats[bi] - 0.3);
      if (Math.abs(beats[bi] - i * 0.02) <= iv * 0.125) acc[bi % 8] += peak / max;
    }
    silent = 0;
  }
  const mx = Math.max(...acc) || 1;
  return acc.map((v) => v / mx);
}

/** Croma de 12 clases por pulso (magnitud espectral agrupada por nota), para medir cambios de acorde. */
function beatChroma(x: Float32Array, sampleRate: number, beats: number[]): Float32Array {
  const win = 4096, nb = beats.length;
  const chroma = new Float32Array(nb * 12);
  const re = new Float32Array(win), im = new Float32Array(win);
  const binClass = new Int8Array(win / 2).fill(-1);
  for (let k = 1; k < win / 2; k++) { const f = (k * sampleRate) / win; if (f >= 65 && f <= 4200) binClass[k] = ((Math.round(12 * Math.log2(f / 440)) % 12) + 12 + 9) % 12; }
  for (let i = 0; i < nb; i++) {
    const s0 = Math.round(beats[i] * sampleRate), s1 = Math.round((beats[i + 1] ?? beats[i] + 0.3) * sampleRate);
    for (let s = s0; s + win <= Math.min(s1 + win / 2, x.length); s += win / 2) {
      for (let k = 0; k < win; k++) { re[k] = x[s + k] * (0.5 - 0.5 * Math.cos((2 * Math.PI * k) / win)); im[k] = 0; }
      fftInPlace(re, im);
      for (let k = 1; k < win / 2; k++) { const c = binClass[k]; if (c >= 0) chroma[i * 12 + c] += Math.sqrt(re[k] * re[k] + im[k] * im[k]); }
    }
    let norm = 0; for (let c = 0; c < 12; c++) norm += chroma[i * 12 + c] ** 2; norm = Math.sqrt(norm) || 1;
    for (let c = 0; c < 12; c++) chroma[i * 12 + c] /= norm;
  }
  return chroma;
}

/**
 * Cambios de armonía: distancia coseno entre el croma medio de los 2 pulsos anteriores y los 2 siguientes a cada pulso,
 * acumulada por posición del ciclo. Los cambios de acorde caen con más frecuencia en el 1 que en el 5.
 */
export function harmonicChangeScores(x: Float32Array, sampleRate: number, beats: number[]): number[] {
  const nb = beats.length;
  if (nb < 12) return new Array(8).fill(0);
  const ch = beatChroma(x, sampleRate, beats);
  const acc = new Array(8).fill(0), cnt = new Array(8).fill(0);
  const mean = (a: number, b: number) => { const v = new Float32Array(12); for (let i = a; i < b; i++) for (let c = 0; c < 12; c++) v[c] += ch[i * 12 + c]; return v; };
  for (let i = 2; i + 2 <= nb; i++) {
    const p = mean(i - 2, i), q = mean(i, i + 2);
    let dot = 0, np = 0, nq = 0; for (let c = 0; c < 12; c++) { dot += p[c] * q[c]; np += p[c] * p[c]; nq += q[c] * q[c]; }
    const d = 1 - dot / (Math.sqrt(np * nq) || 1);
    acc[i % 8] += d; cnt[i % 8]++;
  }
  const m = acc.map((a, k) => (cnt[k] ? a / cnt[k] : 0));
  const mx = Math.max(...m) || 1;
  return m.map((v) => v / mx);
}

/**
 * Decide entre un candidato de "1" y su opuesto (+4) combinando señales de frase.
 * Cada señal es un vector de 8 puntuaciones normalizadas; devuelve el índice elegido y el margen (0..1).
 */
export function pickPhraseStart(base: number, signals: { scores: number[]; weight: number }[]): { downbeatIndex: number; margin: number } {
  const alt = (base + 4) % 8;
  let a = 0, b = 0, w = 0;
  for (const s of signals) { if (!s.scores.length) continue; a += s.scores[base] * s.weight; b += s.scores[alt] * s.weight; w += s.weight; }
  if (!w) return { downbeatIndex: base, margin: 0 };
  const margin = Math.abs(a - b) / (Math.max(a, b) || 1);
  return { downbeatIndex: b > a * 1.1 ? alt : base, margin };
}

/**
 * Fusión de todas las señales en una puntuación por desplazamiento (0..7). Cada señal se normaliza a máximo 1 y se pondera.
 * Las señales simétricas (clave, bajo) solo discriminan el compás; las de frase (voz, armonía, novedad) deciden entre 1 y 5.
 */
export function fuseDownbeat(signals: { scores: number[]; weight: number }[]): { downbeatIndex: number; confidence: number; total: number[] } {
  const total = new Array(8).fill(0);
  for (const s of signals) {
    if (!s.scores || s.scores.length !== 8) continue;
    const mx = Math.max(...s.scores.map((v) => Math.abs(v))) || 1;
    for (let o = 0; o < 8; o++) total[o] += (s.scores[o] / mx) * s.weight;
  }
  let best = 0; for (let o = 1; o < 8; o++) if (total[o] > total[best]) best = o;
  const sorted = [...total].sort((a, b) => b - a);
  const confidence = Math.max(0, Math.min(1, ((sorted[0] - sorted[1]) / (Math.abs(sorted[0]) || 1)) * 3));
  return { downbeatIndex: best, confidence, total };
}

/** Acentos de energía por posición: plantilla 1 fuerte, 5 medio, 3 y 7 leves. Devuelve puntuaciones por desplazamiento. */
export function guessEnergyScores(env: Float32Array, fps: number, beats: number[]): number[] {
  const at = (t: number) => { const i = Math.round(t * fps); let m = 0; for (let j = Math.max(0, i - 2); j <= Math.min(env.length - 1, i + 2); j++) m = Math.max(m, env[j]); return m; };
  const w = [1, 0, 0.3, 0, 0.5, 0, 0.3, 0];
  const scores = new Array(8).fill(0);
  for (let off = 0; off < 8; off++) for (let i = 0; i < beats.length; i++) scores[off] += w[(i - off + 800) % 8] * at(beats[i]);
  const mx = Math.max(...scores) || 1;
  return scores.map((v) => v / mx);
}
