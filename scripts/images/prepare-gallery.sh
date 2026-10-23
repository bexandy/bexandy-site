#!/usr/bin/env bash
# Prepara las imágenes de la galería desde scripts/images/gallery.txt: recorta la marca de agua, limita a 1400 px de alto.
set -euo pipefail
SRC="${1:-$HOME/Imágenes/Modelo IA}"
DIR="$(dirname "$0")"; OUT="$DIR/../../src/assets/gallery"; mkdir -p "$OUT"
grep -v '^#' "$DIR/gallery.txt" | while IFS='|' read -r slug rel theme cap prompt; do
  in="$SRC/$rel"; out="$OUT/$slug.jpg"
  [ -f "$in" ] || { echo "falta: $in" >&2; continue; }
  h=$(identify -format "%h" "$in[0]"); w=$(identify -format "%w" "$in[0]")
  keep=$(python3 -c "print(int($h*(1-5.5/100)))")
  convert "$in[0]" -gravity North -crop "${w}x${keep}+0+0" +repage -resize "x1400>" -strip -quality 84 "$out"
  echo "✓ $slug $(identify -format '%wx%h' "$out")"
done
