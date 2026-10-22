interface Props { current: number | null; style: 'On1' | 'On2'; size?: 'lg' | 'sm' }

/** Barra de 8 tiempos. En salsa se pisa en 1-2-3 y 5-6-7; 4 y 8 son pausas (o tap). */
export default function CountBar({ current, style, size = 'lg' }: Props) {
  const breaks = style === 'On1' ? [1, 5] : [2, 6];
  return (
    <ol className={`grid grid-cols-8 gap-1 ${size === 'lg' ? 'text-2xl md:text-4xl' : 'text-sm'}`} aria-label="Conteo de 8 tiempos">
      {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => {
        const pause = n === 4 || n === 8;
        const active = current === n;
        const brk = breaks.includes(n);
        return (
          <li
            key={n}
            className={`rounded-xl text-center font-bold transition-transform ${size === 'lg' ? 'py-4' : 'py-1'} ${active ? 'scale-105' : ''}`}
            style={{
              background: active ? (brk ? 'var(--color-dance)' : 'var(--color-work)') : 'var(--card)',
              color: active ? 'white' : pause ? 'var(--muted)' : 'var(--fg)',
              border: '1px solid var(--border)',
              opacity: pause && !active ? 0.6 : 1,
            }}
          >
            {n}
          </li>
        );
      })}
    </ol>
  );
}
