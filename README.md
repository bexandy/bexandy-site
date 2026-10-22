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
- v1 (actual): carga local, velocidad 50–120 % con tono conservado, tempo y pulsos automáticos, "1" marcado con la barra espaciadora o flechas, metrónomo con acento en 1 y 5, bucle A–B, modo ritmo con clave 2-3 / 3-2.
- v1.1: separación de instrumentos con Demucs (ONNX Runtime Web + WebGPU) en un Web Worker.
- v1.2: detección automática de la fase del compás con plantillas de clave.

## Scripts para videos
Ver `scripts/videos/README.md`.
