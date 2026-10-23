import type { RawAudio } from '../../../../lib/demucs/wav-utils';
import { mixToWav, STEM_LABELS } from './mix';

export type ExportFormat = 'wav' | 'mp3';

/** Codifica una pista a MP3 (256 kbps) con mediabunny; se importa bajo demanda para no cargar el códec hasta que haga falta. */
export async function encodeMp3(raw: RawAudio): Promise<Blob> {
  const [{ AudioSampleSource, Output, BufferTarget, Mp3OutputFormat, AudioSample }, { registerMp3Encoder }] = await Promise.all([
    import('mediabunny'),
    import('@mediabunny/mp3-encoder'),
  ]);
  registerMp3Encoder();
  const [l, r = l] = raw.channelData;
  const n = l.length;
  const planar = new Float32Array(n * 2);
  planar.set(l, 0); planar.set(r, n);
  const source = new AudioSampleSource({ codec: 'mp3', bitrate: 256e3 });
  const output = new Output({ format: new Mp3OutputFormat(), target: new BufferTarget() });
  output.addAudioTrack(source);
  await output.start();
  const sample = new AudioSample({ data: planar, format: 'f32-planar', numberOfChannels: 2, sampleRate: raw.sampleRate, timestamp: 0 });
  try {
    await source.add(sample);
    await output.finalize();
  } finally {
    sample.close();
  }
  return new Blob([output.target.buffer!], { type: 'audio/mpeg' });
}

export async function exportStem(stems: Record<string, RawAudio>, name: string, format: ExportFormat): Promise<Blob> {
  if (format === 'mp3') return encodeMp3(stems[name]);
  return mixToWav({ [name]: stems[name] }, { [name]: 1 });
}

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

export function stemFileName(songName: string, stem: string, format: ExportFormat) {
  return `${slug(songName.replace(/\.[^.]+$/, '')) || 'cancion'}-${slug(STEM_LABELS[stem] ?? stem)}.${format}`;
}

/** Descarga un archivo (PC y Android lo dejan en Descargas; iOS abre la hoja para guardarlo en Archivos). */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || !('canShare' in navigator)) return false;
  try { return navigator.canShare({ files: [new File([new Uint8Array(4)], 'x.wav', { type: 'audio/wav' })] }); } catch { return false; }
}

/** Hoja de compartir del sistema (móvil): permite guardar en Archivos/Galería o enviar por WhatsApp. */
export async function shareFiles(files: File[], title: string): Promise<boolean> {
  try {
    if (!navigator.canShare?.({ files })) return false;
    await navigator.share({ files, title });
    return true;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return true;
    return false;
  }
}

/** Empaqueta varias pistas en un ZIP (sin recomprimir) para guardarlas de una vez. */
export async function zipBlobs(entries: { name: string; blob: Blob }[]): Promise<Blob> {
  const { zipSync } = await import('fflate');
  const data: Record<string, Uint8Array> = {};
  for (const e of entries) data[e.name] = new Uint8Array(await e.blob.arrayBuffer());
  const out = zipSync(data, { level: 0 });
  const copy = new Uint8Array(out.byteLength); copy.set(out);
  return new Blob([copy.buffer], { type: 'application/zip' });
}
