#!/usr/bin/env bash
# Uso: transcribe.sh video.mp4 [modelo]   (modelo: tiny|base|small|medium|large; por defecto small)
set -euo pipefail
video="${1:?video}"; model="${2:-small}"
whisper "$video" --language es --model "$model" --output_format srt --output_format txt --output_dir "$(dirname "$video")"
