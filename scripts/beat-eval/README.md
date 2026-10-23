# Evaluación del detector de pulsos

El [Salsa dataset](https://github.com/AntoninRap/Salsa-dataset) publica solo anotaciones (CSV `tiempo,posición`) de 40 canciones comerciales; el audio hay que tenerlo. Con una canción propia y su CSV:

```bash
node scripts/beat-eval/eval.mjs "~/Música/La Vida Es Un Carnaval.mp3" "Salsa-dataset/Regular tempo/La Vida Es Un Carnaval - Celia Cruz.csv"
```

Reporta F-measure de pulsos e inicio de compás con tolerancia ±70 ms (la del paper), el tempo detectado frente al anotado y la clave estimada. Nota: la carpeta "Half tempo" anota a mitad de tempo (posiciones 1 y 3); compara con la "Regular tempo" cuando exista.
