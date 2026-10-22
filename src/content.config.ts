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
    youtubeId: z.string(),
    date: z.coerce.date(),
    level: z.enum(['básico', 'intermedio', 'avanzado']),
    style: z.enum(['On1', 'On2', 'cubana', 'shines', 'otro']).default('On1'),
    figures: z.array(z.string()).default([]),
    song: z.string().optional(),
    bpm: z.number().optional(),
    chapters: z.array(z.object({ t: z.number(), label: z.string() })).default([]),
    draft: z.boolean().default(false),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, tools, videos, posts };
