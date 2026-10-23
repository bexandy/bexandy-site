import { STEM_LABELS } from './audio/mix';

interface Props {
  names: string[];
  gains: Record<string, number>;
  solo: string | null;
  onGain: (name: string, g: number) => void;
  onSolo: (name: string | null) => void;
  onDownload: (name: string) => void;
}

export default function StemMixer({ names, gains, solo, onGain, onSolo, onDownload }: Props) {
  return (
    <div className="grid sm:grid-cols-2 gap-3 text-sm">
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
                <button className="card px-2 py-0.5 text-xs" onClick={() => onDownload(n)} title="Descargar esta pista en WAV">WAV</button>
              </span>
            </div>
            <input type="range" min={0} max={150} value={Math.round(g * 100)} onChange={(e) => onGain(n, Number(e.target.value) / 100)} aria-label={`Volumen de ${STEM_LABELS[n] ?? n}`} />
            <span className="muted text-xs">{Math.round(g * 100)} %</span>
          </div>
        );
      })}
    </div>
  );
}
