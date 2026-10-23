---
title: Mi doble digital
summary: Un modelo de imagen entrenado con mis fotos y una galería de 47 escenas generadas con IA.
date: 2026-03-30
side: work
role: Dataset, entrenamiento, dirección de arte y curaduría
stack: [Artflow, Gemini, Firefly, modelos de difusión, ImageMagick, Astro]
links: { live: /galeria }
cover: cover-doble-digital
featured: false
---
Quería retratos profesionales sin sesión de fotos y, de paso, entender cómo se entrena un modelo con una identidad. El resultado está en la [galería](/galeria).

## Cómo se hizo
1. **Dataset**: 27 fotos propias con distintas luces, ángulos y ropa, sin otras personas en cuadro.
2. **Entrenamiento**: un modelo de identidad en Artflow a partir de ese dataset; pruebas de consistencia del rostro con prompts neutros.
3. **Generación**: unas 200 imágenes con prompts en inglés escritos a mano (escena, encuadre, lente, luz). Algunas variaciones con Gemini y Firefly cambiando solo el fondo.
4. **Curaduría**: una imagen por escena, descartando duplicados y las que no encajan con un sitio profesional; 47 finales en 9 temas.
5. **Publicación**: recorte de la marca de agua con ImageMagick, optimización a WebP responsivo en el build de Astro, visor y filtros sin dependencias.

## Qué aprendí
- La cara es consistente cuando el dataset tiene variedad de luz; con fotos parecidas el modelo repite la misma expresión.
- Los prompts que describen cámara y luz ("35 mm, golden hour, shallow depth of field") dan mejores resultados que los que describen emociones.
- Las manos y los textos siguen siendo el punto débil: las escenas con escudos, letreros o instrumentos necesitan varias iteraciones.
