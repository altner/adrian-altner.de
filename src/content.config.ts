import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Shared per-locale layout:
//   src/content/posts/<locale>/…      — posts
//   src/content/categories/<locale>/… — categories
// Entry `id` is always `<locale>/<slug>`. A blog post's `category` references a
// category by that id (e.g. "de/technik" or "en/tech").

// Optional `translationKey`: entries in different locales that represent the
// same logical piece of content share one key. Used to wire up the language
// switcher so it points at the translated URL instead of 404-ing.

const posts = defineCollection({
	loader: glob({ base: './src/content/posts', pattern: '{de,en}/**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			category: z.optional(reference('categories')),
			// Free-form tags (aka Stichwörter). Plain strings kept inline on each
			// post; no separate collection. The tag listing pages aggregate them
			// across posts per locale.
			tags: z.array(z.string()).optional(),
			translationKey: z.string().optional(),
		}),
});

const categories = defineCollection({
	loader: glob({ base: './src/content/categories', pattern: '{de,en}/**/*.md' }),
	schema: z.object({
		name: z.string(),
		description: z.string().optional(),
		translationKey: z.string().optional(),
	}),
});

export const collections = { posts, categories };
