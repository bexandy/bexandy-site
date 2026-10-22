# Scripts para los videos de clases

- `cut.sh cortes.csv` corta clips por figura a partir de un CSV `archivo,inicio,fin,nombre` (tiempos en segundos o hh:mm:ss). Salida en `clips/`.
- `transcribe.sh video.mp4` transcribe con Whisper local (requiere `pip install -U openai-whisper` y ffmpeg) y deja `video.srt` y `video.txt`.
- Para Reels/Shorts verticales: `ffmpeg -i clip.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920" -c:a copy clip_vertical.mp4`.
