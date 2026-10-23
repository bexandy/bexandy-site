/// <reference lib="webworker" />
import { separateTracks } from '../../../../lib/demucs/apply';
import { ONNXHTDemucs, type Provider } from '../../../../lib/demucs/onnx-htdemucs';
import type { RawAudio } from '../../../../lib/demucs/wav-utils';

export type WorkerIn =
  | { type: 'load'; modelUrl: string; providers: Provider[] }
  | { type: 'split'; rawAudio: RawAudio };
export type WorkerOut =
  | { type: 'download'; loaded: number; total: number }
  | { type: 'loaded'; provider: Provider; fromCache: boolean }
  | { type: 'progress'; step: number; total: number }
  | { type: 'done'; tracks: Record<string, RawAudio> }
  | { type: 'error'; message: string };

const post = (m: WorkerOut, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(m, transfer);

let model: ONNXHTDemucs | undefined;
let loading: Promise<void> | undefined;

async function fetchWeights(url: string): Promise<{ weights: ArrayBuffer; fromCache: boolean }> {
  const cache = await caches.open('demucs-weights-v1');
  const req = new Request(url, { mode: 'cors' });
  const hit = await cache.match(req);
  if (hit) return { weights: await hit.arrayBuffer(), fromCache: true };
  const res = await fetch(req);
  if (!res.ok || !res.body) throw new Error(`No se pudo descargar el modelo (${res.status})`);
  const total = Number(res.headers.get('content-length') || 0);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value); loaded += value.length;
    post({ type: 'download', loaded, total });
  }
  const weights = new Uint8Array(loaded);
  let off = 0; for (const c of chunks) { weights.set(c, off); off += c.length; }
  try { await cache.put(req, new Response(weights.slice(), { headers: { 'content-type': 'application/octet-stream' } })); } catch {}
  return { weights: weights.buffer, fromCache: false };
}

async function load(modelUrl: string, providers: Provider[]) {
  if (model) return;
  if (!loading) {
    loading = (async () => {
      const { weights, fromCache } = await fetchWeights(modelUrl);
      model = await ONNXHTDemucs.init(weights, providers);
      post({ type: 'loaded', provider: model.provider, fromCache });
    })();
  }
  await loading;
}

self.addEventListener('message', async (e: MessageEvent<WorkerIn>) => {
  try {
    if (e.data.type === 'load') { await load(e.data.modelUrl, e.data.providers); return; }
    if (e.data.type === 'split') {
      if (!model) throw new Error('El modelo no está cargado');
      const tracks = await separateTracks(model, e.data.rawAudio, (step, total) => post({ type: 'progress', step, total }));
      const buffers = [...new Set(Object.values(tracks).flatMap((t) => t.channelData.map((c) => c.buffer)))];
      post({ type: 'done', tracks }, buffers as Transferable[]);
    }
  } catch (err) {
    const chain: string[] = [];
    let e: unknown = err;
    while (e && chain.length < 4) { chain.push(e instanceof Error ? `${e.name}: ${e.message}` : String(e)); e = (e as { cause?: unknown }).cause; }
    console.error('[demucs worker]', err);
    post({ type: 'error', message: chain.join(' ← ') });
    loading = undefined;
  }
});
