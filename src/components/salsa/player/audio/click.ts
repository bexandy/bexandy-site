/** Sonidos sintéticos cortos para metrónomo y clave, programados en el reloj del AudioContext. */
export type ClickKind = 'accent' | 'beat' | 'clave' | 'bell';

export function scheduleClick(ctx: AudioContext, when: number, kind: ClickKind, gainDb = 0) {
  const g = ctx.createGain();
  const vol = Math.pow(10, gainDb / 20);
  g.connect(ctx.destination);
  if (kind === 'clave') {
    // golpe de madera: ruido filtrado + tono breve
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2500, when);
    osc.frequency.exponentialRampToValueAtTime(1800, when + 0.03);
    g.gain.setValueAtTime(0.5 * vol, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.06);
    osc.connect(g); osc.start(when); osc.stop(when + 0.07);
    return;
  }
  const osc = ctx.createOscillator();
  osc.type = kind === 'bell' ? 'triangle' : 'sine';
  const f = kind === 'accent' ? 1760 : kind === 'bell' ? 1200 : 1000;
  osc.frequency.setValueAtTime(f, when);
  const peak = (kind === 'accent' ? 0.9 : 0.5) * vol;
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(peak, when + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, when + (kind === 'bell' ? 0.12 : 0.05));
  osc.connect(g); osc.start(when); osc.stop(when + 0.15);
}

/** Patrones de clave de son en semicorcheas sobre un compás de 8 tiempos (16 posiciones por 2 compases de 4/4 = 32 semicorcheas). */
export const CLAVE: Record<'3-2' | '2-3', number[]> = {
  // 3-2: golpes en 1, 2y(+), 4 | 6, 7   (en semicorcheas de 0..31)
  '3-2': [0, 6, 12, 20, 24],
  // 2-3: golpes en 2, 3 | 5, 6y, 8
  '2-3': [4, 8, 16, 22, 28],
};
