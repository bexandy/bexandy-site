// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://bexandyrodriguez.com',
  integrations: [react(), mdx(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
    worker: { format: 'es' },
    optimizeDeps: { exclude: ['onnxruntime-web'] }
  }
});