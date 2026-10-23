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
