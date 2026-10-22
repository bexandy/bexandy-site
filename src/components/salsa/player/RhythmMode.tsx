import { useEffect, useRef, useState } from 'react';
import CountBar from './CountBar';
import { CLAVE, scheduleClick } from './audio/click';

/** Metrónomo de salsa sin canción: conteo, clave y campana, a tempo libre. */
export default function RhythmMode() {
  const [bpm, setBpm] = useState(180);
  const [running, setRunning] = useState(false);
  const [clave, setClave] = useState<'off' | '2-3' | '3-2'>('2-3');
  const [style, setStyle] = useState<'On1' | 'On2'>('On1');
  const [count, setCount] = useState<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!running) { if (timer.current) cancelAnimationFrame(timer.current); setCount(null); return; }
    const ctx = ctxRef.current ?? (ctxRef.current = new AudioContext());
    ctx.resume();
    const beatDur = 60 / bpm;
    const sixteenth = beatDur / 4;
    let nextBeat = ctx.currentTime + 0.1;
    let beatIdx = 0; // 0..7
    const visual: { t: number; n: number }[] = [];
    const tick = () => {
      // programar con 150 ms de anticipación
      while (nextBeat < ctx.currentTime + 0.15) {
        const n = beatIdx + 1;
        scheduleClick(ctx, nextBeat, n === 1 || n === 5 ? 'accent' : 'beat', n === 4 || n === 8 ? -8 : 0);
        if (clave !== 'off') {
          for (const s of CLAVE[clave]) {
            const b = Math.floor(s / 4);
            if (b === beatIdx) scheduleClick(ctx, nextBeat + (s % 4) * sixteenth, 'clave');
          }
        }
        visual.push({ t: nextBeat, n });
        nextBeat += beatDur;
        beatIdx = (beatIdx + 1) % 8;
      }
      while (visual.length && visual[0].t <= ctx.currentTime) { setCount(visual[0].n); visual.shift(); }
      timer.current = requestAnimationFrame(tick);
    };
    timer.current = requestAnimationFrame(tick);
    return () => { if (timer.current) cancelAnimationFrame(timer.current); };
  }, [running, bpm, clave]);

  return (
    <div className="flex flex-col gap-4">
      <CountBar current={count} style={style} />
      <div className="flex flex-wrap gap-4 items-end text-sm">
        <button className="card px-5 py-2 font-bold" onClick={() => setRunning((r) => !r)}>{running ? 'Detener' : 'Iniciar'}</button>
        <label className="flex flex-col">Tempo: <strong>{bpm} bpm</strong>
          <input type="range" min={120} max={240} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-56" />
        </label>
        <label className="flex flex-col">Clave
          <select className="card px-2 py-1" value={clave} onChange={(e) => setClave(e.target.value as typeof clave)}>
            <option value="2-3">Son 2-3</option><option value="3-2">Son 3-2</option><option value="off">Sin clave</option>
          </select>
        </label>
        <label className="flex flex-col">Estilo
          <select className="card px-2 py-1" value={style} onChange={(e) => setStyle(e.target.value as typeof style)}>
            <option>On1</option><option>On2</option>
          </select>
        </label>
      </div>
      <p className="text-xs muted">Acento en 1 y 5; 4 y 8 suenan más suaves porque son pausas. La clave marca el patrón de son.</p>
    </div>
  );
}
