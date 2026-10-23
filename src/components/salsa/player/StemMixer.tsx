import { useEffect, useState } from 'react';
import { STEM_LABELS } from './audio/mix';
import { canShareFiles, type ExportFormat } from './audio/export';

interface Props {
  names: string[];
  gains: Record<string, number>;
  solo: string | null;
  busy: string | null;
  onGain: (name: string, g: number) => void;
  onSolo: (name: string | null) => void;
  onSave: (name: string | 'all', format: ExportFormat, mode: 'download' | 'share') => void;
}

export default function StemMixer({ names, gains, solo, busy, onGain, onSolo, onSave }: Props) {
  const [format, setFormat] = useState<ExportFormat>('mp3');
  const [share, setShare] = useState(false);
  useEffect(() => { setShare(canShareFiles()); }, []);
  const disabled = busy !== null;
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="grid sm:grid-cols-2 gap-3">
        {names.map((n) => {
          const g = gains[n] ?? 1;
          const muted = g === 0 || (solo !== null && solo !== n);
          return (
            <div key={n} className="card p-3 flex flex-col gap-2" style={{ opacity: muted ? 0.55 : 1 }}>
              <div className="flex items-center justify-between gap-2">
                <strong className="display">{STEM_LABELS[n] ?? n}</strong>
                <span className="flex gap-1">
                  <button className={`card px-2 py-0.5 text-xs ${solo === n ? 'font-bold' : ''}`} style={solo === n ? { borderColor: 'var(--amber)', color: 'var(--amber)' } : {}} onClick={() => onSolo(solo === n ? null : n)} title="Escuchar solo esta pista">Solo</button>
                  <button className={`card px-2 py-0.5 text-xs ${g === 0 ? 'font-bold' : ''}`} onClick={() => onGain(n, g === 0 ? 1 : 0)} title="Silenciar">{g === 0 ? 'Activar' : 'Mute'}</button>
                </span>
              </div>
              <input type="range" min={0} max={150} value={Math.round(g * 100)} onChange={(e) => onGain(n, Number(e.target.value) / 100)} aria-label={`Volumen de ${STEM_LABELS[n] ?? n}`} />
              <div className="flex items-center justify-between gap-2">
                <span className="muted text-xs">{Math.round(g * 100)} %</span>
                <span className="flex gap-1">
                  <button className="card px-2 py-0.5 text-xs" disabled={disabled} onClick={() => onSave(n, format, 'download')} title="Guardar esta pista en tu equipo">{busy === n ? 'Preparando…' : 'Guardar'}</button>
                  {share && <button className="card px-2 py-0.5 text-xs" disabled={disabled} onClick={() => onSave(n, format, 'share')} title="Compartir o guardar en Archivos">Compartir</button>}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="card p-3 flex flex-wrap items-center gap-3">
        <strong>Guardar pistas</strong>
        <label className="flex items-center gap-2">Formato
          <select className="card px-2 py-1" value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
            <option value="mp3">MP3 (256 kbps, liviano)</option>
            <option value="wav">WAV (sin pérdida, pesado)</option>
          </select>
        </label>
        <button className="btn solid text-xs" disabled={disabled} onClick={() => onSave('all', format, 'download')}>{busy === 'all' ? 'Preparando…' : 'Guardar todas (ZIP)'}</button>
        {share && <button className="btn text-xs" disabled={disabled} onClick={() => onSave('all', format, 'share')}>Compartir todas</button>}
        <span className="muted text-xs w-full">En el computador van a Descargas. En el teléfono, "Compartir" abre la hoja del sistema para guardarlas en Archivos o enviarlas; los audios no aparecen en la galería de fotos, sino en Archivos o en la app de música.</span>
      </div>
    </div>
  );
}
