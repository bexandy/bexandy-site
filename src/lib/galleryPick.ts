import { gallery as all } from '../data/gallery';
/** Seis imágenes para la portada, una por tema distinto. */
const picks = ['escritorio-codigo', 'santiago-crepusculo', 'moto-desierto', 'beisbol-venezuela', 'salsa-luces', 'retro-neon'];
export const gallery = picks.map((s) => all.find((g) => g.slug === s)!).filter(Boolean);
