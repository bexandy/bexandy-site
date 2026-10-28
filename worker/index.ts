/**
 * Worker del sitio. Los assets estáticos los sirve Cloudflare directamente (no pasan por aquí
 * ni consumen cuota): solo /api/* entra al Worker (run_worker_first en wrangler.jsonc).
 *
 * POST /api/marks: recibe la marca del 1 que envía el reproductor (botón "Enviar marca") y la
 * guarda en KV. Pide una clave compartida (secreto MARK_KEY) para que no entre basura.
 * Se recogen en local con `node scripts/beat-eval/pull-marks.mjs`.
 */
interface KVNamespace { put(key: string, value: string, options?: { metadata?: unknown }): Promise<void> }
interface Env { MARKS: KVNamespace; MARK_KEY?: string }

const MAX_BODY = 16 * 1024;
const MARK_FORMAT = 'bexandy-salsa-mark/1';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

// Comparación en tiempo constante para no filtrar la clave por tiempos de respuesta.
function sameKey(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 60);
const finiteList = (v: unknown, max: number) => Array.isArray(v) && v.length <= max && v.every((n) => typeof n === 'number' && Number.isFinite(n));

function validate(m: Record<string, unknown>): string | null {
  if (m.format !== MARK_FORMAT) return 'formato desconocido';
  if (typeof m.song !== 'string' || !m.song || m.song.length > 200) return 'song';
  if (typeof m.size !== 'number' || !Number.isFinite(m.size)) return 'size';
  if (typeof m.oneAt !== 'number' || !Number.isFinite(m.oneAt)) return 'oneAt';
  if (!finiteList(m.ones, 64)) return 'ones';
  if (typeof m.bpm !== 'number' || !Number.isFinite(m.bpm)) return 'bpm';
  if (m.style !== 'On1' && m.style !== 'On2') return 'style';
  if (m.by !== undefined && (typeof m.by !== 'string' || m.by.length > 60)) return 'by';
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/api/marks') return json(404, { error: 'no existe' });
    if (request.method !== 'POST') return json(405, { error: 'solo POST' });
    if (!env.MARK_KEY) return json(503, { error: 'envío no configurado' });
    if (!sameKey(request.headers.get('x-mark-key') ?? '', env.MARK_KEY)) return json(401, { error: 'clave incorrecta' });

    const text = await request.text();
    if (text.length > MAX_BODY) return json(413, { error: 'marca demasiado grande' });
    let m: Record<string, unknown>;
    try { m = JSON.parse(text); } catch { return json(400, { error: 'JSON inválido' }); }
    if (!m || typeof m !== 'object') return json(400, { error: 'JSON inválido' });
    const bad = validate(m);
    if (bad) return json(400, { error: `marca inválida: ${bad}` });

    const receivedAt = new Date().toISOString();
    const id = `${receivedAt.slice(0, 19).replace(/[:T]/g, '-')}_${slug(m.song as string)}_${crypto.randomUUID().slice(0, 8)}`;
    const by = (m.by as string | undefined)?.trim() || 'anónimo';
    await env.MARKS.put(id, JSON.stringify({ ...m, by, receivedAt }), { metadata: { song: m.song, by, receivedAt } });
    return json(201, { id });
  },
};
