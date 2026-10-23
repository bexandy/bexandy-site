import { useEffect, useMemo, useRef, useState } from 'react';
import CountBar from './CountBar';
import RhythmMode from './RhythmMode';
import StemMixer from './StemMixer';
import { analyze, onsetEnvelope, type BeatAnalysis } from './analysis/beatTracker';
import { estimateDownbeat, CLAVE_TEMPLATES, BASS_TEMPLATE } from './analysis/clavePhase';
import { scheduleClick } from './audio/click';
import { mixToWav, asAudioBufferLike, STEM_LABELS } from './audio/mix';
import type { RawAudio } from '../../../lib/demucs/wav-utils';
import type { WorkerIn, WorkerOut } from './workers/demucs.worker';

type Tab = 'song' | 'rhythm';
type SepStatus = 'idle' | 'downloading' | 'loading' | 'separating' | 'done' | 'error';

interface SavedGrid { downbeatIndex: number; style: 'On1' | 'On2' }
const storageKey = (f: File) => `salsa-grid:${f.name}:${f.size}`;
const MODEL_URL = 'https://cdn.bexandyrodriguez.com/models/htdemucs.onnx';
const MODEL_MB = 166;

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
  const [userSetDownbeat, setUserSetDownbeat] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // separación de instrumentos
  const [stems, setStems] = useState<Record<string, RawAudio> | null>(null);
  const [gains, setGains] = useState<Record<string, number>>({ drums: 1, bass: 1, other: 1, vocals: 1 });
  const [solo, setSolo] = useState<string | null>(null);
  const [sep, setSep] = useState<{ status: SepStatus; loaded?: number; total?: number; step?: number; steps?: number; provider?: string; message?: string; seconds?: number }>({ status: 'idle' });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rawRef = useRef<RawAudio | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const scheduledUpTo = useRef(-1);
  const pendingSeek = useRef<{ t: number; play: boolean } | null>(null);
  const sepStart = useRef(0);

  const [mobile, setMobile] = useState(false);
  useEffect(() => { setWebgpu('gpu' in navigator); const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean }; deviceMemory?: number }; setMobile(!!nav.userAgentData?.mobile || /Android|iPhone|iPad/i.test(navigator.userAgent) || (nav.deviceMemory ?? 8) < 4); }, []);
  useEffect(() => () => { workerRef.current?.terminate(); }, []);

  async function onFile(f: File) {
    if (url) URL.revokeObjectURL(url);
    workerRef.current?.terminate(); workerRef.current = null;
    setFile(f); setAnalysis(null); setCount(null); setLoop({ a: null, b: null }); setStems(null); setSolo(null);
    setGains({ drums: 1, bass: 1, other: 1, vocals: 1 }); setSep({ status: 'idle' }); setUserSetDownbeat(false);
    const u = URL.createObjectURL(f);
    setUrl(u);
    setAnalyzing(true);
    try {
      const ctx = ctxRef.current ?? (ctxRef.current = new AudioContext({ sampleRate: 44100 }));
      const buf = await ctx.decodeAudioData(await f.arrayBuffer());
      const l = buf.getChannelData(0), r = buf.numberOfChannels > 1 ? buf.getChannelData(1) : l;
      rawRef.current = { channelData: [Float32Array.from(l), Float32Array.from(r)], sampleRate: buf.sampleRate };
      await new Promise((res) => setTimeout(res, 30));
      const a = analyze(buf);
      const saved = localStorage.getItem(storageKey(f));
      if (saved) { const s = JSON.parse(saved) as SavedGrid; setDownbeat(s.downbeatIndex); setStyle(s.style); setUserSetDownbeat(true); }
      else setDownbeat(a.downbeatIndex);
      setAnalysis(a);
    } finally {
      setAnalyzing(false);
    }
  }

  useEffect(() => {
    if (file && analysis) localStorage.setItem(storageKey(file), JSON.stringify({ downbeatIndex: downbeat, style } satisfies SavedGrid));
  }, [file, analysis, downbeat, style]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.playbackRate = rate;
    (a as any).preservesPitch = true;
    (a as any).mozPreservesPitch = true;
  }, [rate, url]);

  // ---------- separación ----------
  function startSeparation() {
    const raw = rawRef.current;
    if (!raw) return;
    sepStart.current = performance.now();
    setSep({ status: 'downloading', loaded: 0, total: 0 });
    const w = workerRef.current ?? (workerRef.current = new Worker(new URL('./workers/demucs.worker.ts', import.meta.url), { type: 'module' }));
    w.onmessage = (e: MessageEvent<WorkerOut>) => {
      const m = e.data;
      if (m.type === 'download') setSep({ status: 'downloading', loaded: m.loaded, total: m.total });
      if (m.type === 'loaded') {
        setSep({ status: 'separating', step: 0, steps: 1, provider: m.provider });
        const copy: RawAudio = { channelData: raw.channelData.map((c) => Float32Array.from(c)), sampleRate: raw.sampleRate };
        w.postMessage({ type: 'split', rawAudio: copy } satisfies WorkerIn, copy.channelData.map((c) => c.buffer));
      }
      if (m.type === 'progress') setSep((s) => ({ ...s, status: 'separating', step: m.step, steps: m.total }));
      if (m.type === 'done') {
        setStems(m.tracks);
        setSep((s) => ({ ...s, status: 'done', seconds: Math.round((performance.now() - sepStart.current) / 1000) }));
      }
      if (m.type === 'error') setSep({ status: 'error', message: m.message });
    };
    w.onerror = (e) => setSep({ status: 'error', message: e.message || 'Error en el worker' });
    const providers = ('gpu' in navigator ? ['webgpu', 'wasm'] : ['wasm']) as WorkerIn extends { providers: infer P } ? P : never;
    w.postMessage({ type: 'load', modelUrl: MODEL_URL, providers } satisfies WorkerIn);
  }

  const effectiveGains = useMemo(() => {
    const g: Record<string, number> = {};
    for (const k of Object.keys(gains)) g[k] = solo ? (solo === k ? gains[k] || 1 : 0) : gains[k];
    return g;
  }, [gains, solo]);

  // Re-mezcla al cambiar pistas o ganancias, conservando posición y reproducción
  useEffect(() => {
    if (!stems) return;
    const t = setTimeout(() => {
      const a = audioRef.current;
      const blob = mixToWav(stems, effectiveGains);
      const next = URL.createObjectURL(blob);
      pendingSeek.current = a ? { t: a.currentTime, play: !a.paused } : null;
      setUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return next; });
    }, 200);
    return () => clearTimeout(t);
  }, [stems, effectiveGains]);

  function onLoadedMetadata() {
    const a = audioRef.current, p = pendingSeek.current;
    if (!a || !p) return;
    pendingSeek.current = null;
    a.currentTime = p.t; a.playbackRate = rate; (a as any).preservesPitch = true;
    scheduledUpTo.current = -1;
    if (p.play) a.play().catch(() => {});
  }

  function downloadStem(name: string) {
    if (!stems) return;
    const blob = mixToWav({ [name]: stems[name] }, { [name]: 1 });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${(file?.name ?? 'pista').replace(/\.[^.]+$/, '')}-${name}.wav`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  function refineWithDrums() {
    if (!stems?.drums) return;
    const a = analyze(asAudioBufferLike(stems.drums));
    const sources = [{ envelope: a.envelope, fps: a.fps, templates: CLAVE_TEMPLATES, weight: 1 }];
    if (stems.bass) {
      const b = onsetEnvelope(stems.bass.channelData[0], stems.bass.sampleRate);
      sources.push({ envelope: b.env, fps: b.fps, templates: { bass: BASS_TEMPLATE } as any, weight: 0.6 });
    }
    const phase = estimateDownbeat(a.beats, sources);
    const merged: BeatAnalysis = { ...a, downbeatIndex: phase.confidence >= 0.15 ? phase.downbeatIndex : a.downbeatIndex, downbeatConfidence: Math.max(phase.confidence, a.downbeatConfidence), clave: phase.confidence >= 0.15 ? phase.clave : a.clave };
    setAnalysis(merged);
    if (!userSetDownbeat || merged.downbeatConfidence > 0.5) { setDownbeat(merged.downbeatIndex); setUserSetDownbeat(false); }
    scheduledUpTo.current = -1;
  }

  // ---------- reloj, conteo y metrónomo ----------
  const beats = analysis?.beats ?? [];
  const countOf = (i: number) => (((i - downbeat) % 8) + 8) % 8 + 1;

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !analysis) return;
    let raf = 0;
    const tick = () => {
      const t = a.currentTime;
      setTime(t);
      if (loop.a !== null && loop.b !== null && t >= loop.b) a.currentTime = loop.a;
      let lo = 0, hi = beats.length - 1, idx = -1;
      while (lo <= hi) { const m = (lo + hi) >> 1; if (beats[m] <= t) { idx = m; lo = m + 1; } else hi = m - 1; }
      setCount(idx >= 0 ? countOf(idx) : null);
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
  }, [analysis, downbeat, metronome, loop, url]);

  function onSeek() { scheduledUpTo.current = -1; }

  function markOne() {
    const a = audioRef.current;
    if (!a || !beats.length) return;
    const t = a.currentTime;
    let best = 0;
    for (let i = 1; i < beats.length; i++) if (Math.abs(beats[i] - t) < Math.abs(beats[best] - t)) best = i;
    setDownbeat(((best % 8) + 8) % 8);
    setUserSetDownbeat(true);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.code === 'Space') { e.preventDefault(); markOne(); }
      if (e.key === 'ArrowLeft') { setDownbeat((d) => (d + 7) % 8); setUserSetDownbeat(true); }
      if (e.key === 'ArrowRight') { setDownbeat((d) => (d + 1) % 8); setUserSetDownbeat(true); }
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

  const sepPct = sep.status === 'downloading' && sep.total ? Math.round((sep.loaded! / sep.total) * 100)
    : sep.status === 'separating' && sep.steps ? Math.round((sep.step! / sep.steps) * 100) : 0;
  const durationMin = rawRef.current ? rawRef.current.channelData[0].length / rawRef.current.sampleRate / 60 : 0;
  const estimate = webgpu ? Math.max(1, Math.round(durationMin / 2)) : Math.max(2, Math.round(durationMin * 2.5));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 text-sm">
        <button className={`card px-4 py-2 ${tab === 'song' ? 'font-bold' : ''}`} onClick={() => setTab('song')}>Con canción</button>
        <button className={`card px-4 py-2 ${tab === 'rhythm' ? 'font-bold' : ''}`} onClick={() => setTab('rhythm')}>Modo ritmo</button>
      </div>

      {tab === 'rhythm' && <RhythmMode />}

      {tab === 'song' && (
        <div className="flex flex-col gap-5">
          <label
            className="card p-6 text-center cursor-pointer border-dashed block"
            style={dragOver ? { borderColor: 'var(--amber)' } : {}}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
          >
            <input type="file" accept="audio/*,video/*,.mp3,.m4a,.wav,.ogg,.flac,.aac,.mp4,.mov,.webm" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            {file ? <span><strong>{file.name}</strong> · {(file.size / 1e6).toFixed(1)} MB. Haz clic o suelta otro archivo para cambiar.</span> : <span>Arrastra o elige una canción o un video (MP3, M4A, WAV, MP4). En el móvil puedes tomarlo de tu galería o de Archivos.</span>}
          </label>

          {url && (
            <audio ref={audioRef} src={url} controls className="w-full" onSeeked={onSeek} onLoadedMetadata={onLoadedMetadata} onPlay={() => ctxRef.current?.resume()} />
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
                  <h3 className="font-semibold">El “1” · confianza {confidenceLabel}{analysis.clave ? ` · clave ${analysis.clave}` : ''}</h3>
                  <button className="card px-3 py-2 font-bold" onClick={markOne} title="Barra espaciadora">Marcar el 1 ahora (espacio)</button>
                  <div className="flex gap-2 items-center">
                    <button className="card px-2 py-1" onClick={() => { setDownbeat((d) => (d + 7) % 8); setUserSetDownbeat(true); }} title="Flecha izquierda">◀ 1 pulso</button>
                    <button className="card px-2 py-1" onClick={() => { setDownbeat((d) => (d + 1) % 8); setUserSetDownbeat(true); }} title="Flecha derecha">1 pulso ▶</button>
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

              <div className="card p-4 text-sm flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">Instrumentos separados</h3>
                  {sep.status === 'idle' && (
                    <button className="btn solid text-xs" onClick={startSeparation}>Separar instrumentos</button>
                  )}
                </div>

                {sep.status === 'idle' && (
                  <p className="muted">
                    Separa percusión, bajo, voz y el resto con Demucs, dentro de tu navegador.
                    {webgpu ? ` Tu navegador tiene WebGPU: unos ${estimate} min para esta canción.` : ` Tu navegador no expone WebGPU: usará WebAssembly, unos ${estimate} min para esta canción.`}
                    {' '}La primera vez descarga el modelo ({MODEL_MB} MB) y lo guarda en el navegador.
                    {mobile && <strong> En teléfonos y tabletas puede quedarse sin memoria o tardar más de 15 minutos: hazlo con wifi y, si falla, usa un computador.</strong>}
                  </p>
                )}
                {(sep.status === 'downloading' || sep.status === 'loading' || sep.status === 'separating') && (
                  <div className="flex flex-col gap-1">
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full transition-[width]" style={{ width: `${sepPct}%`, background: 'var(--amber)' }} />
                    </div>
                    <p className="muted">
                      {sep.status === 'downloading' && (sep.total ? `Descargando el modelo: ${Math.round((sep.loaded ?? 0) / 1e6)} de ${Math.round(sep.total / 1e6)} MB` : 'Descargando el modelo…')}
                      {sep.status === 'separating' && `Separando${sep.provider ? ` con ${sep.provider === 'webgpu' ? 'WebGPU' : 'WebAssembly'}` : ''}: ${sep.step ?? 0} de ${sep.steps ?? '?'} segmentos`}
                    </p>
                  </div>
                )}
                {sep.status === 'error' && (
                  <p style={{ color: 'var(--amber)' }}>No se pudo separar: {sep.message}. <button className="underline" onClick={startSeparation}>Reintentar</button></p>
                )}
                {sep.status === 'done' && stems && (
                  <>
                    <p className="muted">Listo en {sep.seconds} s con {sep.provider === 'webgpu' ? 'WebGPU' : 'WebAssembly'}. Ajusta el volumen de cada pista; la velocidad y el conteo siguen funcionando sobre la mezcla.</p>
                    <StemMixer names={Object.keys(STEM_LABELS).filter((k) => stems[k])} gains={gains} solo={solo} onGain={(n, g) => setGains((x) => ({ ...x, [n]: g }))} onSolo={setSolo} onDownload={downloadStem} />
                    <div className="flex flex-wrap gap-2 items-center">
                      <button className="card px-3 py-1" onClick={refineWithDrums}>Afinar conteo con la percusión</button>
                      <span className="muted text-xs">Vuelve a detectar tempo y pulsos usando solo la pista de percusión.</span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
