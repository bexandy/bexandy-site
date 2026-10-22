import { useEffect, useMemo, useRef, useState } from 'react';
import CountBar from './CountBar';
import RhythmMode from './RhythmMode';
import { analyze, type BeatAnalysis } from './analysis/beatTracker';
import { scheduleClick } from './audio/click';

type Tab = 'song' | 'rhythm';

interface SavedGrid { downbeatIndex: number; style: 'On1' | 'On2' }
const storageKey = (f: File) => `salsa-grid:${f.name}:${f.size}`;

export default function Player() {
  const [tab, setTab] = useState<Tab>('song');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<BeatAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [rate, setRate] = useState(1);
  const [downbeat, setDownbeat] = useState(0);
  const [style, setStyle] = useState<'On1' | 'On2'>('On1');
  const [metronome, setMetronome] = useState(true);
  const [count, setCount] = useState<number | null>(null);
  const [time, setTime] = useState(0);
  const [loop, setLoop] = useState<{ a: number | null; b: number | null }>({ a: null, b: null });
  const [webgpu, setWebgpu] = useState<boolean | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const scheduledUpTo = useRef(-1);

  useEffect(() => { setWebgpu('gpu' in navigator); }, []);

  // Cargar archivo: URL para reproducir + decodificación para analizar
  async function onFile(f: File) {
    if (url) URL.revokeObjectURL(url);
    setFile(f); setAnalysis(null); setCount(null); setLoop({ a: null, b: null });
    const u = URL.createObjectURL(f);
    setUrl(u);
    setAnalyzing(true);
    try {
      const ctx = ctxRef.current ?? (ctxRef.current = new AudioContext({ sampleRate: 44100 }));
      const buf = await ctx.decodeAudioData(await f.arrayBuffer());
      // ceder el hilo para que la UI pinte antes del análisis
      await new Promise((r) => setTimeout(r, 30));
      const a = analyze(buf);
      const saved = localStorage.getItem(storageKey(f));
      if (saved) {
        const s = JSON.parse(saved) as SavedGrid;
        setDownbeat(s.downbeatIndex); setStyle(s.style);
      } else {
        setDownbeat(a.downbeatIndex);
      }
      setAnalysis(a);
    } finally {
      setAnalyzing(false);
    }
  }

  // Guardar rejilla por canción
  useEffect(() => {
    if (file && analysis) localStorage.setItem(storageKey(file), JSON.stringify({ downbeatIndex: downbeat, style } satisfies SavedGrid));
  }, [file, analysis, downbeat, style]);

  // Velocidad con tono conservado
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.playbackRate = rate;
    (a as any).preservesPitch = true;
    (a as any).mozPreservesPitch = true;
  }, [rate, url]);

  const beats = analysis?.beats ?? [];
  const countOf = (i: number) => (((i - downbeat) % 8) + 8) % 8 + 1;

  // Bucle de animación: conteo visual, bucle A-B y metrónomo programado
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !analysis) return;
    let raf = 0;
    const tick = () => {
      const t = a.currentTime;
      setTime(t);
      if (loop.a !== null && loop.b !== null && t >= loop.b) a.currentTime = loop.a;
      // índice del último pulso <= t
      let lo = 0, hi = beats.length - 1, idx = -1;
      while (lo <= hi) { const m = (lo + hi) >> 1; if (beats[m] <= t) { idx = m; lo = m + 1; } else hi = m - 1; }
      setCount(idx >= 0 ? countOf(idx) : null);
      // metrónomo: programar clics de los pulsos próximos (200 ms de anticipación en tiempo de canción × rate)
      const ctx = ctxRef.current;
      if (metronome && ctx && !a.paused) {
        const horizon = t + 0.2 * a.playbackRate;
        for (let i = Math.max(idx + 1, scheduledUpTo.current + 1); i < beats.length && beats[i] < horizon; i++) {
          const when = ctx.currentTime + (beats[i] - t) / a.playbackRate;
          const n = countOf(i);
          scheduleClick(ctx, when, n === 1 || n === 5 ? 'accent' : 'beat', n === 4 || n === 8 ? -10 : -4);
          scheduledUpTo.current = i;
        }
        if (idx > scheduledUpTo.current) scheduledUpTo.current = idx;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [analysis, downbeat, metronome, loop]);

  // Al saltar en la canción, resetear la programación de clics
  function onSeek() { scheduledUpTo.current = -1; }

  // Marcar el "1": el pulso más cercano al momento actual pasa a ser 1
  function markOne() {
    const a = audioRef.current;
    if (!a || !beats.length) return;
    const t = a.currentTime;
    let best = 0;
    for (let i = 1; i < beats.length; i++) if (Math.abs(beats[i] - t) < Math.abs(beats[best] - t)) best = i;
    setDownbeat(((best % 8) + 8) % 8);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.code === 'Space') { e.preventDefault(); markOne(); }
      if (e.key === 'ArrowLeft') setDownbeat((d) => (d + 7) % 8);
      if (e.key === 'ArrowRight') setDownbeat((d) => (d + 1) % 8);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const confidenceLabel = useMemo(() => {
    if (!analysis) return '';
    const c = analysis.downbeatConfidence;
    return c > 0.6 ? 'alta' : c > 0.3 ? 'media' : 'baja';
  }, [analysis]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 text-sm">
        <button className={`card px-4 py-2 ${tab === 'song' ? 'font-bold' : ''}`} onClick={() => setTab('song')}>Con canción</button>
        <button className={`card px-4 py-2 ${tab === 'rhythm' ? 'font-bold' : ''}`} onClick={() => setTab('rhythm')}>Modo ritmo</button>
      </div>

      {tab === 'rhythm' && <RhythmMode />}

      {tab === 'song' && (
        <div className="flex flex-col gap-5">
          <label className="card p-6 text-center cursor-pointer border-dashed">
            <input type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            {file ? <span><strong>{file.name}</strong> · {(file.size / 1e6).toFixed(1)} MB. Haz clic para cambiar.</span> : <span>Arrastra o elige una canción (MP3, WAV, M4A)</span>}
          </label>

          {url && (
            <audio ref={audioRef} src={url} controls className="w-full" onSeeked={onSeek} onPlay={() => ctxRef.current?.resume()} />
          )}

          {analyzing && <p className="text-sm muted">Analizando tempo y pulsos…</p>}

          {analysis && (
            <>
              <CountBar current={count} style={style} />

              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="card p-4 flex flex-col gap-2">
                  <h3 className="font-semibold">Velocidad · {Math.round(rate * 100)} %</h3>
                  <input type="range" min={50} max={120} value={Math.round(rate * 100)} onChange={(e) => setRate(Number(e.target.value) / 100)} />
                  <div className="flex gap-2">
                    {[70, 85, 100].map((p) => <button key={p} className="card px-2 py-1" onClick={() => setRate(p / 100)}>{p} %</button>)}
                  </div>
                  <p className="muted">Tempo efectivo: {Math.round(analysis.bpm * rate)} bpm (original {Math.round(analysis.bpm)})</p>
                </div>

                <div className="card p-4 flex flex-col gap-2">
                  <h3 className="font-semibold">El “1” · confianza {confidenceLabel}</h3>
                  <button className="card px-3 py-2 font-bold" onClick={markOne} title="Barra espaciadora">Marcar el 1 ahora (espacio)</button>
                  <div className="flex gap-2 items-center">
                    <button className="card px-2 py-1" onClick={() => setDownbeat((d) => (d + 7) % 8)} title="Flecha izquierda">◀ 1 pulso</button>
                    <button className="card px-2 py-1" onClick={() => setDownbeat((d) => (d + 1) % 8)} title="Flecha derecha">1 pulso ▶</button>
                    <select className="card px-2 py-1 ml-auto" value={style} onChange={(e) => setStyle(e.target.value as 'On1' | 'On2')}>
                      <option>On1</option><option>On2</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={metronome} onChange={(e) => setMetronome(e.target.checked)} /> Metrónomo (acento en 1 y 5)</label>
                </div>

                <div className="card p-4 flex flex-col gap-2">
                  <h3 className="font-semibold">Bucle A–B · {mmss(time)}</h3>
                  <div className="flex gap-2">
                    <button className="card px-2 py-1" onClick={() => setLoop((l) => ({ ...l, a: audioRef.current?.currentTime ?? 0 }))}>A = {loop.a !== null ? mmss(loop.a) : '–'}</button>
                    <button className="card px-2 py-1" onClick={() => setLoop((l) => ({ ...l, b: audioRef.current?.currentTime ?? 0 }))}>B = {loop.b !== null ? mmss(loop.b) : '–'}</button>
                    <button className="card px-2 py-1" onClick={() => setLoop({ a: null, b: null })}>Quitar</button>
                  </div>
                  <p className="muted">Repite una sección para practicar una figura.</p>
                </div>
              </div>

              <div className="card p-4 text-sm">
                <h3 className="font-semibold">Instrumentos separados</h3>
                <p className="muted mt-1">
                  {webgpu
                    ? 'Tu navegador soporta WebGPU. La separación en pistas (percusión, bajo, voz, otros) llega en la próxima versión.'
                    : 'Tu navegador no expone WebGPU; la separación de pistas funcionará con WebAssembly, más lenta, cuando esté disponible.'}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
