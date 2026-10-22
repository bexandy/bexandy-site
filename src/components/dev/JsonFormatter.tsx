import { useState } from 'react';

export default function JsonFormatter() {
  const [input, setInput] = useState('{"hola": "mundo", "n": [1, 2, 3]}');
  const [indent, setIndent] = useState(2);
  let output = '';
  let error = '';
  try {
    output = input.trim() ? JSON.stringify(JSON.parse(input), null, indent) : '';
  } catch (e) {
    error = (e as Error).message;
  }
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Entrada</span>
        <textarea className="card p-3 font-mono text-sm min-h-64" value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
      </label>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Salida</span>
          <span className="flex items-center gap-2">
            <label>Sangría <select className="card px-2 py-1" value={indent} onChange={(e) => setIndent(Number(e.target.value))}><option value={2}>2</option><option value={4}>4</option><option value={0}>0</option></select></label>
            <button className="card px-3 py-1" onClick={() => navigator.clipboard.writeText(output)} disabled={!output}>Copiar</button>
          </span>
        </div>
        {error ? <pre className="card p-3 text-sm text-red-600 whitespace-pre-wrap">{error}</pre> : <pre className="card p-3 font-mono text-sm min-h-64 overflow-auto">{output}</pre>}
      </div>
    </div>
  );
}
