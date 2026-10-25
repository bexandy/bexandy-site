# Evaluación del detector de pulsos

El [Salsa dataset](https://github.com/AntoninRap/Salsa-dataset) publica solo anotaciones (CSV `tiempo,posición`) de 40 canciones comerciales; el audio hay que tenerlo. Con una canción propia y su CSV:

```bash
node scripts/beat-eval/eval.mjs "~/Música/La Vida Es Un Carnaval.mp3" "Salsa-dataset/Regular tempo/La Vida Es Un Carnaval - Celia Cruz.csv"
```

Reporta F-measure de pulsos e inicio de compás con tolerancia ±70 ms (la del paper), el tempo detectado frente al anotado y la clave estimada. Nota: la carpeta "Half tempo" anota a mitad de tempo (posiciones 1 y 3); compara con la "Regular tempo" cuando exista.

## Etiquetas de oído del 1
`labels.json` guarda, por canción, el índice del pulso (módulo 8) donde el bailarín siente el 1, obtenido con archivos A/B con metrónomo (`~/Música/pruebas-conteo/`). `node scripts/beat-eval/check-labels.mjs` vuelve a analizar cada canción y muestra cada señal y la fusión frente a la etiqueta. Al añadir canciones, repetir la comprobación antes de tocar los pesos de `fuseDownbeat`.

## Pistas con conteo hablado
Las pistas de práctica con voz que cuenta ("uno dos tres, cinco seis siete" o "one two three...") son etiquetas automáticas: se transcribe la voz con vosk (modelos pequeños es + en; mejor sobre la pista de voz separada con Demucs) y cada número se cruza con el pulso detectado más cercano. `labels.json` guarda esos `counts`; `check-labels.mjs` mide la coherencia de la rejilla (porcentaje de números que caen en el mismo desplazamiento) y si el 1 coincide. Resultado al 25-10-2026: rejilla 10/11, el 1 1/11. Hallazgo: el perfil de acentos difiere entre arreglos (Qué Bueno Baila Usted va corrido un pulso respecto a las demás), así que la energía de la mezcla no basta para el 1; faltan señales por instrumento (clave, campana, montuno) o etiquetas del bailarín en muchas más canciones.
