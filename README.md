# Sitio personal: programación y salsa

Sitio estático en **Astro 7 + islas React + Tailwind 4**, desplegado en **Cloudflare Workers (static assets)**.
Dos puertas: trabajo (CV, portafolio, utilidades dev e IA) y baile (reproductor de práctica de salsa, clases en video).

## Requisitos
- Node 24 (ver `.nvmrc`; `nvm use`)

## Comandos
```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # genera dist/
npm run preview
npx astro check    # tipos
npx wrangler deploy  # publica dist/ en Cloudflare (requiere login o CLOUDFLARE_API_TOKEN)
```

## Dónde está cada cosa
| Qué | Dónde |
| --- | --- |
| Nombre, dominio, redes | `src/site.ts` |
| CV (JSON Resume) | `src/data/cv.json` → `/cv` |
| Proyectos del portafolio | `src/content/projects/*.md` |
| Utilidades dev/IA | `src/content/tools/*.md` + componente en `src/components/dev/` |
| Videos de clases | `src/content/videos/*.md` (id de TikTok o YouTube, póster en `src/assets/videos/`) |
| Galería de retratos IA | `scripts/images/gallery.txt` → `src/data/gallery.ts` + `src/assets/gallery/` |
| Tipografías | `astro.config.mjs` (`fonts`: Bricolage Grotesque y Manrope autoalojadas, con fallbacks de métricas ajustadas) |
| Reproductor de salsa | `src/components/salsa/player/` (análisis de tempo en `analysis/`) |
| Cabeceras COOP/COEP para el reproductor | `public/_headers` |
| Despliegue | `wrangler.jsonc`, `.github/workflows/deploy.yml` |

## Reproductor de salsa (estado)
- v1: carga local, velocidad 50–120 % con tono conservado, tempo y pulsos automáticos, "1" marcado con la barra espaciadora o flechas, metrónomo con acento en 1 y 5, bucle A–B, modo ritmo con clave 2-3 / 3-2.
- v1.1 (actual): separación de instrumentos con HT-Demucs (código de demucs-js vendorizado en `src/lib/demucs/`, ONNX Runtime Web, WebGPU o WebAssembly multihilo) en un Web Worker; mezclador por pista con solo/mute/volumen y descarga WAV; reanálisis del tempo con la pista de percusión. El modelo (174 MB) se sirve desde R2 (`cdn.bexandyrodriguez.com/models/htdemucs.onnx`) y se cachea en el navegador. Los binarios de ONNX se copian a `public/ort/` en `prebuild` (no se versionan). Las páginas aisladas (COOP/COEP) exigen que `/_astro/*` y `/ort/*` lleven COEP: ver `public/_headers`.
- v1.2: detección automática de la fase del compás con plantillas de clave.
- v1.3 (25-10-2026): tempo con período fraccionario, curva de tempo por ventanas (sigue aceleraciones y directos), comprobación de octava y seguidor menos rígido. Sobre 11 pistas etiquetadas (7 con conteo hablado alineado automáticamente, 3 de oído, 1 sin conteo) la rejilla de pulsos coincide con el conteo en 10. El "1" sigue sin resolverse por energía: la plantilla de acentos (ahora derivada de 9 pistas) acierta la paridad pero el compás y el 1 frente al 5 quedan cerca del azar; la marca manual y el botón 1 ⇄ 5 son el camino. Detalle en `scripts/beat-eval/`.
- v1.4 (25-10-2026): peine métrico en la puntuación de tempo (lag + ½·lag/2 + ½·lag×2) para no engancharse al tresillo de la clave, que en mambos rápidos (La Peleona, 235 bpm) daba 2/3 del tempo real.

## Rendimiento
Lighthouse móvil (25-10-2026): rendimiento ≥ 97 y CLS 0 en portada, CV, galería, clases, reproductor y portafolio. Claves: fuentes autoalojadas (sin Google Fonts en runtime), imágenes visibles al cargar con `loading="eager"` + `fetchpriority="high"`, galería en cuatro columnas repartidas en build (orden del DOM = orden visible) y hueco reservado (`slot="fallback"`) para la isla del reproductor.

## Scripts para videos
Ver `scripts/videos/README.md`.
