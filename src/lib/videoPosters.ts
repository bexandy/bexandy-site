import type { ImageMetadata } from 'astro';
const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/videos/*.jpg', { eager: true });
export function poster(name: string | undefined): ImageMetadata | undefined {
  if (!name) return undefined;
  return files[`/src/assets/videos/${name}.jpg`]?.default;
}
