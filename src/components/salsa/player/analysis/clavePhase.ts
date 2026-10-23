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
