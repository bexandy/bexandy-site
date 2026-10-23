// Copia los binarios de ONNX Runtime Web necesarios a public/ort (se ejecuta antes de dev y build).
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
const src = 'node_modules/onnxruntime-web/dist';
const dst = 'public/ort';
mkdirSync(dst, { recursive: true });
for (const f of ['ort-wasm-simd-threaded.asyncify.wasm', 'ort-wasm-simd-threaded.asyncify.mjs', 'ort-wasm-simd-threaded.jsep.wasm', 'ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.wasm', 'ort-wasm-simd-threaded.mjs']) {
  if (existsSync(`${src}/${f}`)) copyFileSync(`${src}/${f}`, `${dst}/${f}`);
  else console.warn(`ort-copy: falta ${f}`);
}
