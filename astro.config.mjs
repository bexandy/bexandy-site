// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://bexandyrodriguez.com',
  integrations: [react(), mdx(), sitemap()],

  // Fuentes autoalojadas: Astro las descarga en build, las sirve desde /_astro/fonts/ y genera fallbacks con métricas ajustadas.
  fonts: [
    { provider: fontProviders.google(), name: 'Bricolage Grotesque', cssVariable: '--font-bricolage', weights: [500, 700], styles: ['normal'], subsets: ['latin'], fallbacks: ['Arial Narrow', 'sans-serif'] },
    { provider: fontProviders.google(), name: 'Manrope', cssVariable: '--font-manrope', weights: [400, 500, 700], styles: ['normal'], subsets: ['latin'], fallbacks: ['sans-serif'] },
  ],

  vite: {
    plugins: [tailwindcss()],
    worker: { format: 'es' },
    optimizeDeps: { exclude: ['onnxruntime-web'] }
  }
});