import { useState } from 'react';

const enc = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const dec = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

function decodeJwt(token: string) {
  const [h, p] = token.split('.');
  if (!h || !p) throw new Error('No parece un JWT (faltan partes separadas por punto).');
  return { header: JSON.parse(dec(h)), payload: JSON.parse(dec(p)) };
}

export default function Base64Tool() {
  const [mode, setMode] = useState<'b64' | 'url' | 'jwt'>('b64');
  const [input, setInput] = useState('');
  let out = '';
  try {
    if (mode === 'b64') out = /^[A-Za-z0-9+/=_-]+$/.test(input.trim()) && input.length % 4 === 0 ? `Decodificado:\n${dec(input.trim())}\n\nCodificado:\n${enc(input)}` : `Codificado:\n${enc(input)}`;
    if (mode === 'url') out = `encodeURIComponent:\n${encodeURIComponent(input)}\n\ndecodeURIComponent:\n${decodeURIComponent(input)}`;
    if (mode === 'jwt' && input.trim()) {
      const { header, payload } = decodeJwt(input.trim());
      const exp = payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'sin exp';
      out = `Header:\n${JSON.stringify(header, null, 2)}\n\nPayload:\n${JSON.stringify(payload, null, 2)}\n\nExpira: ${exp}`;
    }
  } catch (e) {
    out = `Error: ${(e as Error).message}`;
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 text-sm">
        {(['b64', 'url', 'jwt'] as const).map((m) => (
          <button key={m} className={`card px-3 py-1 ${mode === m ? 'font-bold' : ''}`} onClick={() => setMode(m)}>{m === 'b64' ? 'Base64' : m === 'url' ? 'URL' : 'JWT'}</button>
        ))}
      </div>
      <textarea className="card p-3 font-mono text-sm min-h-32" value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'jwt' ? 'Pega un token JWT' : 'Texto a codificar o decodificar'} spellCheck={false} />
      <pre className="card p-3 font-mono text-sm whitespace-pre-wrap min-h-32">{out}</pre>
      {mode === 'jwt' && <p className="text-xs muted">Solo decodifica; no verifica la firma. El token no sale de tu navegador.</p>}
    </div>
  );
}
