/**
 * Los 12 shines base del mambo On2 (orden pedagógico de The Mambo Guild), con las huellas
 * de cada tiempo para el diagrama animado de /salsa/syllabus.
 *
 * Coordenadas en unidades del SVG, vistas desde arriba y desde el bailarín: x crece hacia la
 * derecha, y crece hacia atrás (adelante es negativo). Posición neutra: izquierda (-16, 0),
 * derecha (16, 0). `rot` gira el pie en grados (positivo = punta hacia la derecha). `face`
 * gira al bailarín completo (giros). `w` indica qué pie lleva el peso. `act` marca un toque
 * sin peso (tap, flare o kick) del pie indicado. `t` es la descripción del tiempo.
 *
 * Son esquemas para ubicarse, no una notación exacta: cada escuela estiliza distinto.
 */
export type Foot = [x: number, y: number, rot?: number];
export interface Step {
  L: Foot;
  R: Foot;
  w: 'L' | 'R' | 'LR';
  t: string;
  face?: number;
  act?: 'tap' | 'flare' | 'kick';
  actFoot?: 'L' | 'R';
  acc?: boolean;
}
export interface Video { url: string; title: string; by: string }
export interface Shine {
  id: string;
  n: number;
  name: string;
  count: string;
  note: string;
  /** Tiempos que se marcan en ámbar en la tira de conteo (quiebres o acentos). */
  accents: number[];
  /** Tutoriales públicos en YouTube (enlace, no incrustado). */
  videos: Video[];
  steps: Step[];
}

const s = (L: Foot, R: Foot, w: Step['w'], t: string, extra: Partial<Step> = {}): Step => ({ L, R, w, t, ...extra });
const L0: Foot = [-16, 0];
const R0: Foot = [16, 0];

export const shines: Shine[] = [
  {
    id: 'basico', n: 1, name: 'Paso básico', count: 'Quiebre en 2 y 6', accents: [2, 6],
    note: 'Pisar en el sitio, quebrar, volver. Es el marco de todo lo demás.',
    videos: [
      { url: 'https://www.youtube.com/watch?v=io8TB4sbYZw', title: 'Salsa Solo · Basic Step, lección 2 (NY/On2)', by: 'Wietske Welten' },
      { url: 'https://www.youtube.com/watch?v=J58TuAdToKg', title: 'Eddie Torres · Salsa Count (123 567)', by: 'DJDiego' },
    ],
    steps: [
      s([-16, -6], R0, 'L', '1 · izquierda pisa en el sitio'),
      s([-16, -6], [16, 34], 'R', '2 · quiebre: derecha atrás'),
      s(L0, [16, 34], 'L', '3 · izquierda vuelve al sitio'),
      s(L0, [16, 34], 'L', '4 · pausa'),
      s(L0, [16, 4], 'R', '5 · derecha pisa en el sitio'),
      s([-16, -34], [16, 4], 'L', '6 · quiebre: izquierda adelante'),
      s([-16, -34], R0, 'R', '7 · derecha vuelve al sitio'),
      s([-16, -34], R0, 'R', '8 · pausa'),
    ],
  },
  {
    id: 'lateral', n: 2, name: 'Quiebre adelante y atrás, paso lateral', count: '2 y 6', accents: [2, 6],
    note: 'El quiebre puede apuntar a cualquier dirección; aquí, el básico lateral. El paso lateral une combinaciones.',
    videos: [
      { url: 'https://www.youtube.com/watch?v=1kfKsdhTqTo', title: 'Salsa Solo · Front & Back Steps, lección 3 (NY/On2)', by: 'Wietske Welten' },
      { url: 'https://www.youtube.com/watch?v=YT9a9F_B_7Y', title: 'Salsa Solo · Side Step, lección 4 (NY/On2)', by: 'Wietske Welten' },
    ],
    steps: [
      s(L0, R0, 'L', '1 · izquierda en el sitio'),
      s(L0, [50, 0], 'R', '2 · quiebre: derecha al lado'),
      s(L0, [50, 0], 'L', '3 · el peso vuelve a la izquierda'),
      s(L0, [50, 0], 'L', '4 · pausa'),
      s(L0, R0, 'R', '5 · derecha cierra en el sitio'),
      s([-50, 0], R0, 'L', '6 · quiebre: izquierda al lado'),
      s([-50, 0], R0, 'R', '7 · el peso vuelve a la derecha'),
      s([-50, 0], R0, 'R', '8 · pausa'),
    ],
  },
  {
    id: 'chord', n: 3, name: 'Chord step', count: 'Cruces en 1, 3, 5 y 7', accents: [1, 3, 5, 7],
    note: 'Introduce el cruce de pies sobre los tiempos fuertes; los pares abren al lado.',
    videos: [
      { url: 'https://www.youtube.com/watch?v=C4fsMsgVN0w', title: 'Salsa Shines · 12 patrones básicos con cruces (no usa el nombre chord step)', by: '375 Dance Studio' },
    ],
    steps: [
      s([30, -8, 20], R0, 'L', '1 · izquierda cruza por delante'),
      s([30, -8, 20], [56, 0], 'R', '2 · derecha abre al lado'),
      s([70, 8, -10], [56, 0], 'L', '3 · izquierda cruza por detrás'),
      s([70, 8, -10], [96, 0], 'R', '4 · derecha abre al lado'),
      s([70, 8, -10], [56, -8, -20], 'R', '5 · derecha cruza por delante, de vuelta'),
      s([30, 0], [56, -8, -20], 'L', '6 · izquierda abre al lado'),
      s([30, 0], [16, 8, 10], 'R', '7 · derecha cruza por detrás'),
      s(L0, [16, 8, 10], 'L', '8 · izquierda abre, a la posición inicial'),
    ],
  },
  {
    id: 'suzyq', n: 4, name: 'Suzy Q', count: 'Cruce, atrás, cruce', accents: [2, 6],
    note: 'El paso atrás cae en la punta para que el peso quede sobre la pierna de adelante.',
    videos: [
      { url: 'https://www.youtube.com/watch?v=IVR5x2GyAS0', title: 'Salsa Solo · Suzy Q, lección 9 (NY/On2)', by: 'Wietske Welten' },
      { url: 'https://www.youtube.com/watch?v=pEduJAJwLPE', title: 'Footwork Tutorial · Tap-Cross 7, combo de Suzie Q (On1 y On2)', by: 'Marcus Body Coding' },
    ],
    steps: [
      s([26, -6, 20], [-16, -6], 'L', '1 · izquierda cruza por delante'),
      s([26, -6, 20], [34, 10], 'R', '2 · derecha atrás, en la punta'),
      s([44, -6, 20], [34, 10], 'L', '3 · izquierda cruza de nuevo'),
      s([44, -6, 20], [34, 10], 'L', '4 · pausa: la cadera cierra'),
      s([44, -6, 20], [4, -6, -20], 'R', '5 · derecha cruza por delante, hacia la izquierda'),
      s([-10, 10], [4, -6, -20], 'L', '6 · izquierda atrás, en la punta'),
      s([-10, 10], [-20, -6, -20], 'R', '7 · derecha cruza de nuevo'),
      s([-10, 10], [-20, -6, -20], 'R', '8 · pausa: la cadera cierra'),
    ],
  },
  {
    id: 'cross', n: 5, name: 'Cross step', count: 'Suele caer en 3', accents: [2, 6],
    note: 'Un pie cruza por delante del otro en el tercer paso del básico.',
    videos: [
      { url: 'https://www.youtube.com/watch?v=zY_DELXUtFo', title: 'Footwork Tutorial · Cross 1, principiantes (On1 y On2)', by: 'Marcus Body Coding' },
    ],
    steps: [
      s([-16, -6], R0, 'L', '1 · izquierda en el sitio'),
      s([-16, -6], [16, 34], 'R', '2 · quiebre: derecha atrás'),
      s([28, -10, 20], [16, 34], 'L', '3 · izquierda cruza por delante de la derecha'),
      s([28, -10, 20], [16, 34], 'L', '4 · pausa'),
      s([28, -10, 20], [16, 4], 'R', '5 · derecha en el sitio'),
      s([-16, -34], [16, 4], 'L', '6 · quiebre: izquierda adelante'),
      s([-16, -34], [-28, -10, -20], 'R', '7 · derecha cruza por delante de la izquierda'),
      s([-16, -34], [-28, -10, -20], 'R', '8 · pausa'),
    ],
  },
  {
    id: 'tap', n: 6, name: 'Tap', count: 'Tiempos sin pisada', accents: [2, 6],
    note: 'Toque sin cambio de peso en los tiempos de pausa (4 y 8). Adorna sin romper el básico.',
    videos: [
      { url: 'https://www.youtube.com/watch?v=qAACqhOTmdE', title: 'Footwork Tutorial · Tap 3, principiantes (On1 y On2)', by: 'Marcus Body Coding' },
      { url: 'https://www.youtube.com/watch?v=fPST663cSO4', title: "Salsa Timing · Full Count y Step 'n Tap (On2 y On1)", by: 'Wietske Welten' },
    ],
    steps: [
      s([-16, -6], R0, 'L', '1 · izquierda en el sitio'),
      s([-16, -6], [16, 34], 'R', '2 · quiebre: derecha atrás'),
      s(L0, [16, 34], 'L', '3 · izquierda vuelve al sitio'),
      s(L0, [16, 4], 'L', '4 · tap: la derecha toca, sin peso', { act: 'tap', actFoot: 'R' }),
      s(L0, [16, 4], 'R', '5 · derecha pisa'),
      s([-16, -34], [16, 4], 'L', '6 · quiebre: izquierda adelante'),
      s([-16, -34], R0, 'R', '7 · derecha vuelve al sitio'),
      s([-16, -4], R0, 'R', '8 · tap: la izquierda toca, sin peso', { act: 'tap', actFoot: 'L' }),
    ],
  },
  {
    id: 'flare', n: 7, name: 'Flare', count: 'Tiempos sin pisada', accents: [2, 6],
    note: 'Un tap lanzado desde la rodilla, lejos del cuerpo, sin cambio de peso.',
    videos: [
      { url: 'https://www.youtube.com/watch?v=btsIL2Kdfjs', title: 'Footwork Tutorial · Flare 2, intermedio (On1 y On2)', by: 'Marcus Body Coding' },
    ],
    steps: [
      s([-16, -6], R0, 'L', '1 · izquierda en el sitio'),
      s([-16, -6], [16, 34], 'R', '2 · quiebre: derecha atrás'),
      s(L0, [16, 34], 'L', '3 · izquierda vuelve al sitio'),
      s(L0, [48, -8, 40], 'L', '4 · flare: la derecha se lanza al lado, sin peso', { act: 'flare', actFoot: 'R' }),
      s(L0, [16, 4], 'R', '5 · derecha pisa'),
      s([-16, -34], [16, 4], 'L', '6 · quiebre: izquierda adelante'),
      s([-16, -34], R0, 'R', '7 · derecha vuelve al sitio'),
      s([-48, -8, -40], R0, 'R', '8 · flare: la izquierda se lanza al lado, sin peso', { act: 'flare', actFoot: 'L' }),
    ],
  },
  {
    id: 'kick', n: 8, name: 'Kick', count: 'Tiempos sin pisada', accents: [2, 6],
    note: 'Como el flare, pero adelante y vuelve de inmediato.',
    videos: [
      { url: 'https://www.youtube.com/playlist?list=PLYv9BAhKpPH7r9IvgVymT4CgIOONcsRl0', title: 'Lista · Kick Steps, intermedio (On1 y On2)', by: 'Marcus Body Coding' },
    ],
    steps: [
      s([-16, -6], R0, 'L', '1 · izquierda en el sitio'),
      s([-16, -6], [16, 34], 'R', '2 · quiebre: derecha atrás'),
      s(L0, [16, 34], 'L', '3 · izquierda vuelve al sitio'),
      s(L0, [20, -42], 'L', '4 · kick: la derecha patea adelante y vuelve', { act: 'kick', actFoot: 'R' }),
      s(L0, [16, 4], 'R', '5 · derecha pisa'),
      s([-16, -34], [16, 4], 'L', '6 · quiebre: izquierda adelante'),
      s([-16, -34], R0, 'R', '7 · derecha vuelve al sitio'),
      s([-20, -42], R0, 'R', '8 · kick: la izquierda patea adelante y vuelve', { act: 'kick', actFoot: 'L' }),
    ],
  },
  {
    id: 'heel', n: 9, name: 'Heel twist', count: 'Giros de talón en cada tiempo', accents: [2, 6],
    note: 'Reutiliza la mecánica de cadera del Suzy Q: pierna estirada, pie flexionado, los talones giran juntos.',
    videos: [
      { url: 'https://www.youtube.com/watch?v=lK_zd2HR3D4', title: 'Salsa Shine #04 · Heel Twist (On1 y On2)', by: 'Dance Chemistry' },
    ],
    steps: [
      s([-4, 0, 25], [16, 0, 25], 'LR', '1 · talones a la izquierda'),
      s([-16, 0, -25], [4, 0, -25], 'LR', '2 · talones a la derecha'),
      s([-4, 0, 25], [16, 0, 25], 'LR', '3 · talones a la izquierda'),
      s([-10, 0], [10, 0], 'LR', '4 · pausa, pies juntos'),
      s([-16, 0, -25], [4, 0, -25], 'LR', '5 · talones a la derecha'),
      s([-4, 0, 25], [16, 0, 25], 'LR', '6 · talones a la izquierda'),
      s([-16, 0, -25], [4, 0, -25], 'LR', '7 · talones a la derecha'),
      s([-10, 0], [10, 0], 'LR', '8 · pausa, pies juntos'),
    ],
  },
  {
    id: 'swing', n: 10, name: 'Swing step', count: 'Los 8 tiempos; acentos en 5 y 1', accents: [1, 5],
    note: 'Sin tiempos retenidos: abre y cierra en cada tiempo. En 5 y 1 se sube y se abren los brazos.',
    videos: [
      { url: 'https://www.youtube.com/watch?v=Qzw_WABMq-I', title: 'Salsa Shines Series · Swing Variations, episodio 1', by: 'Salsa Classes Online' },
    ],
    steps: [
      s([-32, 0], R0, 'L', '1 · izquierda abre al lado (acento: sube)', { acc: true }),
      s([-32, 0], [-8, 0], 'R', '2 · derecha cierra'),
      s([-56, 0], [-8, 0], 'L', '3 · izquierda abre'),
      s([-56, 0], [-32, 0], 'R', '4 · derecha cierra'),
      s([-56, 0], [-8, 0], 'R', '5 · derecha abre al lado (acento: sube)', { acc: true }),
      s([-32, 0], [-8, 0], 'L', '6 · izquierda cierra'),
      s([-32, 0], R0, 'R', '7 · derecha abre'),
      s([-8, 0], R0, 'L', '8 · izquierda cierra'),
    ],
  },
  {
    id: 'giro-derecha', n: 11, name: 'Giro a la derecha', count: 'Abre en 2, atrás en 3', accents: [2, 6],
    note: 'Se construye sobre el básico: abre en el 2, pivota en el 3 y completa la vuelta en la pausa.',
    videos: [
      { url: 'https://www.youtube.com/watch?v=03m3cnI1g44', title: 'Salsa Solo · Right Turn, lección 5 (NY/On2)', by: 'Wietske Welten' },
    ],
    steps: [
      s([-16, -6], R0, 'L', '1 · izquierda en el sitio', { face: 0 }),
      s([-16, -6], [24, 30], 'R', '2 · derecha atrás, abriendo a la derecha', { face: 25 }),
      s([-16, -28], [24, 30], 'L', '3 · izquierda adelante y pivote', { face: 180 }),
      s([-16, -28], [24, 30], 'L', '4 · completa la vuelta', { face: 360 }),
      s(L0, [16, 4], 'R', '5 · derecha en el sitio', { face: 360 }),
      s([-16, -34], [16, 4], 'L', '6 · quiebre: izquierda adelante', { face: 360 }),
      s([-16, -34], R0, 'R', '7 · derecha vuelve al sitio', { face: 360 }),
      s([-16, -34], R0, 'R', '8 · pausa', { face: 360 }),
    ],
  },
  {
    id: 'giro-izquierda', n: 12, name: 'Giro a la izquierda', count: 'Termina en 5', accents: [2, 6],
    note: 'Prepara hacia la derecha en el 3 y gira a la izquierda; es más lento que el giro a la derecha.',
    videos: [
      { url: 'https://www.youtube.com/watch?v=eJEiEhBtoqk', title: 'Salsa Solo · Left Turn, lección 6 (NY/On2)', by: 'Wietske Welten' },
    ],
    steps: [
      s([-16, -6], R0, 'L', '1 · izquierda en el sitio', { face: 0 }),
      s([-16, -6], [16, 34], 'R', '2 · quiebre: derecha atrás', { face: 0 }),
      s([-16, -10], [16, 34], 'L', '3 · izquierda en el sitio, preparación a la derecha', { face: 30 }),
      s([-16, -10], [16, 34], 'L', '4 · gira a la izquierda', { face: -120 }),
      s(L0, [16, 4], 'R', '5 · la derecha cierra el giro', { face: -360 }),
      s([-16, -34], [16, 4], 'L', '6 · quiebre: izquierda adelante', { face: -360 }),
      s([-16, -34], R0, 'R', '7 · derecha vuelve al sitio', { face: -360 }),
      s([-16, -34], R0, 'R', '8 · pausa', { face: -360 }),
    ],
  },
];
