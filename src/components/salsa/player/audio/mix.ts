import type { RawAudio } from '../../../../lib/demucs/wav-utils';

export const STEM_LABELS: Record<string, string> = { drums: 'Percusión', bass: 'Bajo', other: 'Piano, metales y otros', vocals: 'Voz' };

/** Mezcla las pistas con sus ganancias y devuelve un WAV estéreo de 16 bits como Blob. */
export function mixToWav(stems: Record<string, RawAudio>, gains: Record<string, number>): Blob {
  const names = Object.keys(stems);
  const first = stems[names[0]];
  const n = first.channelData[0].length;
  const channels = Math.min(2, Math.max(...names.map((k) => stems[k].channelData.length)));
  const sampleRate = first.sampleRate;
  const out = new Int16Array(n * channels);
  const mixL = new Float32Array(n), mixR = new Float32Array(n);
  for (const name of names) {
    const g = gains[name] ?? 1;
    if (g === 0) continue;
    const [l, r = l] = stems[name].channelData;
    for (let i = 0; i < n; i++) { mixL[i] += l[i] * g; mixR[i] += r[i] * g; }
  }
  for (let i = 0; i < n; i++) {
    const a = Math.max(-1, Math.min(1, mixL[i])), b = Math.max(-1, Math.min(1, mixR[i]));
    out[i * channels] = a < 0 ? a * 0x8000 : a * 0x7fff;
    if (channels === 2) out[i * channels + 1] = b < 0 ? b * 0x8000 : b * 0x7fff;
  }
  const header = new ArrayBuffer(44);
  const v = new DataView(header);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  const dataBytes = out.length * 2;
  str(0, 'RIFF'); v.setUint32(4, 36 + dataBytes, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, channels, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * channels * 2, true); v.setUint16(32, channels * 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, dataBytes, true);
  return new Blob([header, out.buffer], { type: 'audio/wav' });
}

/** Objeto compatible con AudioBuffer para reanalizar una pista con el detector de tempo. */
export function asAudioBufferLike(raw: RawAudio) {
  return {
    length: raw.channelData[0].length,
    sampleRate: raw.sampleRate,
    numberOfChannels: raw.channelData.length,
    getChannelData: (c: number) => raw.channelData[c],
  } as unknown as AudioBuffer;
}
