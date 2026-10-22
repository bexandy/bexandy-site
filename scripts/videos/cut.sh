#!/usr/bin/env bash
# Uso: cut.sh cortes.csv
# CSV: archivo,inicio,fin,nombre   (sin cabecera; tiempos en segundos o hh:mm:ss)
set -euo pipefail
csv="${1:?CSV de cortes}"
mkdir -p clips
while IFS=, read -r src ini fin nombre; do
  [ -z "$src" ] && continue
  out="clips/$(echo "$nombre" | tr ' ' '-' | tr -cd '[:alnum:]-_').mp4"
  ffmpeg -hide_banner -loglevel error -y -ss "$ini" -to "$fin" -i "$src" -c:v libx264 -preset fast -crf 20 -c:a aac "$out"
  echo "✓ $out"
done < "$csv"
