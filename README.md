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
| Videos de clases | `src/content/videos/*.md` (id de YouTube + capítulos) |
| Reproductor de salsa | `src/components/salsa/player/` (análisis de tempo en `analysis/`) |
| Cabeceras COOP/COEP para el reproductor | `public/_headers` |
| Despliegue | `wrangler.jsonc`, `.github/workflows/deploy.yml` |

## Reproductor de salsa (estado)
- v1: carga local, velocidad 50–120 % con tono conservado, tempo y pulsos automáticos, "1" marcado con la barra espaciadora o flechas, metrónomo con acento en 1 y 5, bucle A–B, modo ritmo con clave 2-3 / 3-2.
- v1.1 (actual): separación de instrumentos con HT-Demucs (código de demucs-js vendorizado en `src/lib/demucs/`, ONNX Runtime Web, WebGPU o WebAssembly multihilo) en un Web Worker; mezclador por pista con solo/mute/volumen y descarga WAV; reanálisis del tempo con la pista de percusión. El modelo (174 MB) se sirve desde R2 (`cdn.bexandyrodriguez.com/models/htdemucs.onnx`) y se cachea en el navegador. Los binarios de ONNX se copian a `public/ort/` en `prebuild` (no se versionan). Las páginas aisladas (COOP/COEP) exigen que `/_astro/*` y `/ort/*` lleven COEP: ver `public/_headers`.
- v1.2: detección automática de la fase del compás con plantillas de clave.

## Scripts para videos
Ver `scripts/videos/README.md`.
