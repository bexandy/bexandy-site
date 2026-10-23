import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/img/*.jpg', { eager: true });

/** Imagen por nombre corto (sin extensión), p. ej. img('hero-baile'). */
export function img(name: string | undefined): ImageMetadata | undefined {
  if (!name) return undefined;
  return files[`/src/assets/img/${name}.jpg`]?.default;
}
