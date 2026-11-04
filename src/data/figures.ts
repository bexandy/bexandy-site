/**
 * Vocabulario de figuras para `figures` en las fichas de video (src/content/videos).
 * La clave es el slug que se escribe en el frontmatter; genera /salsa/clases/figura/<slug>.
 * Los shines usan el mismo id que src/data/shines.ts para que el syllabus enlace sus clases.
 * Un slug que no esté aquí sigue funcionando (se muestra tal cual), pero conviene añadirlo.
 */
export type FigureGroup = 'shine' | 'pareja' | 'cubana' | 'ritmo';
export interface Figure { name: string; group: FigureGroup }

export const figures: Record<string, Figure> = {
  // Shines On2 (ids de shines.ts)
  'basico': { name: 'Básico', group: 'shine' },
  'lateral': { name: 'Paso lateral', group: 'shine' },
  'chord': { name: 'Chord step', group: 'shine' },
  'suzyq': { name: 'Suzy Q', group: 'shine' },
  'cross': { name: 'Cross step', group: 'shine' },
  'tap': { name: 'Tap', group: 'shine' },
  'flare': { name: 'Flare', group: 'shine' },
  'kick': { name: 'Kick', group: 'shine' },
  'heel': { name: 'Heel twist', group: 'shine' },
  'swing': { name: 'Swing step', group: 'shine' },
  'giro-derecha': { name: 'Giro a la derecha', group: 'shine' },
  'giro-izquierda': { name: 'Giro a la izquierda', group: 'shine' },
  'shines': { name: 'Shines (combinación)', group: 'shine' },
  // Pareja (línea)
  'cross-body-lead': { name: 'Cross body lead', group: 'pareja' },
  'inside-turn': { name: 'Inside turn', group: 'pareja' },
  'outside-turn': { name: 'Outside turn', group: 'pareja' },
  'open-break': { name: 'Open break', group: 'pareja' },
  'cross-over': { name: 'Cross over', group: 'pareja' },
  'copa': { name: 'Copa', group: 'pareja' },
  'hammerlock': { name: 'Hammerlock', group: 'pareja' },
  'sombrero': { name: 'Sombrero', group: 'pareja' },
  'giro-doble': { name: 'Giro doble', group: 'pareja' },
  'cambio-de-manos': { name: 'Cambio de manos', group: 'pareja' },
  'enrosque': { name: 'Enrosque', group: 'pareja' },
  // Cubana / casino
  'dile-que-no': { name: 'Dile que no', group: 'cubana' },
  'enchufla': { name: 'Enchufla', group: 'cubana' },
  'vacilala': { name: 'Vacílala', group: 'cubana' },
  'setenta': { name: 'Setenta', group: 'cubana' },
  'rueda': { name: 'Rueda de casino', group: 'cubana' },
  // Ritmo / musicalidad
  'guaguanco': { name: 'Guaguancó', group: 'ritmo' },
  'clave': { name: 'Clave', group: 'ritmo' },
  'musicalidad': { name: 'Musicalidad', group: 'ritmo' },
};

export const figureName = (slug: string) => figures[slug]?.name ?? slug;
export const figureHref = (slug: string) => `/salsa/clases/figura/${slug}`;
