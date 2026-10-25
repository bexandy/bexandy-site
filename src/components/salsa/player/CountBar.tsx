interface Props { current: number | null; style: 'On1' | 'On2'; size?: 'lg' | 'sm' }

/**
 * Barra de 8 tiempos. En salsa se pisa en 1-2-3 y 5-6-7; 4 y 8 son pausas (o tap).
 * El tiempo activo se enciende en ámbar (1 y 5, o 2 y 6 en On2) o en el color del texto invertido,
 * con halo y un golpe de escala por tiempo (`count-hit` en global.css); las pausas solo se bordean.
 * Los tiempos de quiebre (1-5 u 2-6) van en ámbar también en reposo, para que se vea dónde cae el 1.
 */
export default function CountBar({ current, style, size = 'lg' }: Props) {
  const breaks = style === 'On1' ? [1, 5] : [2, 6];
  return (
    <ol className={`grid grid-cols-8 ${size === 'lg' ? 'gap-1.5 md:gap-2 text-3xl md:text-5xl' : 'gap-1 text-sm'}`} aria-label="Conteo de 8 tiempos">
      {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => {
        const pause = n === 4 || n === 8;
        const active = current === n;
        const brk = breaks.includes(n);
        const tone = !active ? (brk ? 'idle-break' : 'idle') : pause ? 'pause' : brk ? 'break' : 'step';
        return (
          <li
            key={n}
            aria-current={active ? 'step' : undefined}
            data-tone={tone}
            className={`count-cell rounded-xl text-center font-bold display ${size === 'lg' ? 'py-4 md:py-5' : 'py-1'}`}
          >
            {n}
          </li>
        );
      })}
    </ol>
  );
}
