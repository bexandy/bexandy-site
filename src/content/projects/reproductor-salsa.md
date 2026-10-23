---
title: Reproductor de práctica de salsa
summary: Separa instrumentos, cambia la velocidad sin alterar el tono y marca los conteos 1-2-3 5-6-7.
date: 2026-10-22
side: dance
role: Diseño, DSP y desarrollo
stack: [React, Web Audio, AudioWorklet, ONNX Runtime Web, WebGPU, Demucs]
links: { live: /salsa/player }
cover: cover-player
featured: true
---
Herramienta para bailarines y profesores. Todo el procesamiento ocurre en el navegador del usuario; ninguna canción se sube a un servidor.

## Estado
- v1: carga local, velocidad con tono conservado, rejilla de conteos con tempo automático y "1" marcado a mano, metrónomo con acento en 1 y 5.
- v1.1: separación de instrumentos con Demucs (ONNX + WebGPU).
- v1.2: detección automática de la fase del compás mediante plantillas de clave.
