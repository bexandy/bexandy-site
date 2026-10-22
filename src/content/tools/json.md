---
title: Formateador JSON
summary: Valida, indenta y copia JSON sin salir del navegador.
category: dev
component: JsonFormatter
order: 10
---
Pega cualquier JSON. Si es inválido verás el error exacto del parser del navegador; si es válido, lo verás indentado con la sangría que elijas.

**Cómo funciona:** usa `JSON.parse` y `JSON.stringify` nativos. No hay dependencias ni red.
