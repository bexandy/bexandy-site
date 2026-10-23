#!/usr/bin/env bash
# Prepara las imágenes del sitio: recorta la marca de agua inferior, limita el tamaño y guarda JPG en src/assets/img.
# Uso: scripts/images/prepare.sh [carpeta_origen]   (por defecto "$HOME/Imágenes/Modelo IA")
set -euo pipefail
SRC="${1:-$HOME/Imágenes/Modelo IA}"
OUT="$(dirname "$0")/../../src/assets/img"
mkdir -p "$OUT"
CROP_PCT=5.5   # porcentaje inferior con la marca de agua
# slug|ruta relativa a SRC|recortar marca (1/0)
LIST=$(cat <<'L'
hero-trabajo|Generate/Cinematic medium shot of @Bexandy seated at a sleek glass desk in a.jpg|1
hero-baile|Generate/Dynamic medium shot of @Bexandy captured in the midst of a fluid.jpg|1
santiago|Generate/Change the background of @image1 to a modern street in Santiago de.jpg|1
sillon|Generate/Three-quarter portrait of @Bexandy centered in a minimalist studio.jpg|1
cafe|Generate/Candid street-style photograph of @Bexandy captured mid-laugh at an.jpg|1
ventana-bn|imagenes/012f97d141d8418f9b309406bd6e79fc.jpg|1
retrato|perfil..jpg|0
L
)
while IFS='|' read -r slug rel crop; do
  in="$SRC/$rel"; out="$OUT/$slug.jpg"
  [ -f "$in" ] || { echo "falta: $in" >&2; continue; }
  if [ "$crop" = "1" ]; then
    h=$(identify -format "%h" "$in"); w=$(identify -format "%w" "$in")
    keep=$(python3 -c "print(int($h*(1-$CROP_PCT/100)))")
    convert "$in" -gravity North -crop "${w}x${keep}+0+0" +repage -resize "x1600>" -strip -quality 85 "$out"
  else
    convert "$in" -resize "1024x1024>" -strip -quality 88 "$out"
  fi
  echo "✓ $slug $(identify -format '%wx%h' "$out")"
done <<< "$LIST"
# OpenGraph 1200x630 desde el hero de trabajo (centrado en la cara, tercio superior)
convert "$OUT/hero-trabajo.jpg" -resize "1200x" -gravity North -crop 1200x630+0+120 +repage -quality 85 "$(dirname "$0")/../../public/og.jpg"
echo "✓ og.jpg $(identify -format '%wx%h' "$(dirname "$0")/../../public/og.jpg")"
