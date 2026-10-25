import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    side: z.enum(['work', 'dance']).default('work'),
    role: z.string().optional(),
    stack: z.array(z.string()).default([]),
    links: z.object({ live: z.string().optional(), repo: z.string().optional() }).default({}),
    /** nombre de imagen en src/assets/img (sin extensión) */
    cover: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const tools = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/tools' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.enum(['dev', 'ia']).default('dev'),
    /** nombre del componente React en src/components/dev */
    component: z.string(),
    order: z.number().default(100),
    draft: z.boolean().default(false),
  }),
});

const videos = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/videos' }),
  schema: z.object({
    title: z.string(),
    youtubeId: z.string().optional(),
    tiktokId: z.string().optional(),
    /** imagen en src/assets/videos (sin extensión) */
    poster: z.string().optional(),
    date: z.coerce.date(),
    level: z.enum(['básico', 'intermedio', 'avanzado']).default('intermedio'),
    style: z.enum(['On1', 'On2', 'cubana', 'bachata', 'shines', 'otro']).default('On1'),
    /** academia donde se grabó */
    academy: z.enum(['mambomadness', 'lacasadelmambo', 'rumbadecalle', 'otro']).default('otro'),
    likes: z.number().default(0),
    featured: z.boolean().default(false),
    figures: z.array(z.string()).default([]),
    song: z.string().optional(),
    bpm: z.number().optional(),
    chapters: z.array(z.object({ t: z.number(), label: z.string() })).default([]),
    draft: z.boolean().default(false),
  }),
});


export const collections = { projects, tools, videos };
