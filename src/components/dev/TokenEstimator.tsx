import { useState } from 'react';

// Precios por millón de tokens (USD). Edita la tabla; son valores de referencia, verifica en cada proveedor.
const MODELS = [
  { id: 'claude-fable-5-1', name: 'Claude Fable 5.1', inPrice: 15, outPrice: 75 },
  { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', inPrice: 5, outPrice: 25 },
  { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5', inPrice: 3, outPrice: 15 },
  { id: 'claude-haiku-5-5', name: 'Claude Haiku 5.5', inPrice: 1, outPrice: 5 },
];

/** Estimación rápida sin tokenizador: ~4 caracteres por token en inglés, ~3.3 en español. */
function estimateTokens(text: string, lang: 'es' | 'en') {
  const perToken = lang === 'es' ? 3.3 : 4;
  return Math.ceil(text.length / perToken);
}

export default function TokenEstimator() {
  const [text, setText] = useState('');
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [outTokens, setOutTokens] = useState(500);
  const [calls, setCalls] = useState(1000);
  const inTokens = estimateTokens(text, lang);
  return (
    <div className="flex flex-col gap-4">
      <textarea className="card p-3 text-sm min-h-40" value={text} onChange={(e) => setText(e.target.value)} placeholder="Pega aquí tu prompt para estimar tokens de entrada" />
      <div className="flex flex-wrap gap-4 text-sm items-end">
        <label className="flex flex-col">Idioma<select className="card px-2 py-1" value={lang} onChange={(e) => setLang(e.target.value as 'es' | 'en')}><option value="es">Español</option><option value="en">Inglés</option></select></label>
        <label className="flex flex-col">Tokens de salida por llamada<input type="number" className="card px-2 py-1 w-32" value={outTokens} onChange={(e) => setOutTokens(Number(e.target.value))} /></label>
        <label className="flex flex-col">Llamadas por mes<input type="number" className="card px-2 py-1 w-32" value={calls} onChange={(e) => setCalls(Number(e.target.value))} /></label>
        <p className="muted">≈ <strong>{inTokens.toLocaleString()}</strong> tokens de entrada</p>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left muted"><th className="py-1">Modelo</th><th>Entrada $/M</th><th>Salida $/M</th><th>Por llamada</th><th>Por mes</th></tr></thead>
        <tbody>
          {MODELS.map((m) => {
            const perCall = (inTokens * m.inPrice + outTokens * m.outPrice) / 1e6;
            return (
              <tr key={m.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="py-1">{m.name}</td><td>{m.inPrice}</td><td>{m.outPrice}</td>
                <td>${perCall.toFixed(4)}</td><td>${(perCall * calls).toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs muted">Estimación por caracteres, sin tokenizador real; el margen de error es del orden de ±20 %. Los precios son de referencia y deben verificarse en la documentación de cada proveedor.</p>
    </div>
  );
}
