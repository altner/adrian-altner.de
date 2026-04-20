# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — local dev server at `localhost:4321`
- `npm run build` — production build to `./dist/`
- `npm run preview` — preview production build
- `npm run astro -- --help` — Astro CLI (e.g. `astro check` for type-checking)

Node >= 22.12.0 required.

## Path aliases

[tsconfig.json](tsconfig.json) defines a single `~/*` → `src/*` alias. Prefer it over relative imports (`~/components/Foo.astro` instead of `../../components/Foo.astro`) in `.astro`, `.ts`, `.js`, `.mjs`, and MDX files. Frontmatter `heroImage` paths and inline markdown `![](…)` image refs stay relative — Astro's image resolver expects those relative to the content file.

## Architecture

Astro 6 static site, based on the `blog` starter template. No tests, no linter configured. Site URL: `https://adrian-altner.de`.

### Internationalisation (de default, en secondary)

- Astro i18n is configured in [astro.config.mjs](astro.config.mjs) with `defaultLocale: 'de'`, `locales: ['de', 'en']`, `prefixDefaultLocale: false`. German lives at `/`, English at `/en/`.
- Posts are organised per locale under `src/content/posts/<locale>/…`. Post `id` is `<locale>/<slug>`; helpers in [src/i18n/posts.ts](src/i18n/posts.ts) (`entryLocale`, `entrySlug`, `getPostsByLocale`, `getCategoriesByLocale`, `getPostsByCategory`, `categoryHref`, `categorySegment`) split and filter them. The content schema in [src/content.config.ts](src/content.config.ts) globs `{de,en}/**/*.{md,mdx}`. Collection name is `posts` — access via `getCollection('posts')` / `CollectionEntry<'posts'>`.
- A second collection `categories` lives under `src/content/categories/<locale>/*.md` (schema: `name`, optional `description`, optional `translationKey`). Blog posts reference a category via `category: reference('categories')` in the schema; frontmatter values are fully-qualified entry ids, e.g. `category: de/technik` or `category: en/tech`. Resolve with `getEntry(post.data.category)`.
- **Translation linking**: both collections support an optional `translationKey` string. Entries in different locales that represent the same logical content share one key (e.g. `de/technik` and `en/tech` both set `translationKey: tech`). The language switcher resolves this via `findTranslation(entry, target)` ([src/i18n/posts.ts](src/i18n/posts.ts)) to produce the correct target-locale URL. Pages that render a specific content entry should pass it to `Header` as `entry={…}` (see [src/pages/[...slug].astro](src/pages/[...slug].astro), [CategoryDetailPage](src/components/CategoryDetailPage.astro)); the `BlogPost` layout forwards an `entry` prop. When an entry has no translation, the switcher falls back to the other locale's home rather than producing a 404.
- Category routes are localised in the URL: `/kategorie/<slug>` (de) and `/en/category/<slug>` (en), driven by [src/pages/kategorie/[slug].astro](src/pages/kategorie/[slug].astro) and [src/pages/en/category/[slug].astro](src/pages/en/category/[slug].astro). Both use shared UI components ([CategoryIndexPage](src/components/CategoryIndexPage.astro), [CategoryDetailPage](src/components/CategoryDetailPage.astro)). `categorySegment(locale)` returns the right URL segment.
- Because posts sit two levels deep, hero images and component imports inside MD/MDX use `../../../assets/…` / `../../../components/…` relative paths.
- UI strings and path helpers live in [src/i18n/ui.ts](src/i18n/ui.ts). `t(locale, key)` for translations; `localizePath(path, locale)` prefixes `/en` when needed; `switchLocalePath(pathname, target)` rewrites the current URL to the other locale (used by the header language switcher and hreflang alternates in [BaseHead.astro](src/components/BaseHead.astro)).
- Site titles/descriptions per locale live in [src/consts.ts](src/consts.ts) (`SITE.de`, `SITE.en`). The `SITE[locale]` map is the single source of truth — update when rebranding.
- Pages: German under `src/pages/` (`index.astro`, `about.astro`, `[...slug].astro`, `rss.xml.js`), English mirrors under `src/pages/en/`. The shared home UI lives in [src/components/HomePage.astro](src/components/HomePage.astro); both `index.astro` files are thin wrappers that pass `locale="de"` / `locale="en"`.
- Layouts: [BaseLayout.astro](src/layouts/BaseLayout.astro) is the common skeleton (`<html>` / `<head>` with `BaseHead` / `<body>` with `Header` + `main` + `Footer`). Accepts `title`, `description`, `locale`, optional `image`, optional `entry` (for the language-switch translation lookup), optional `bodyClass`, and a `head` named slot for per-page `<link>`/`<meta>` extras. All page templates compose via this layout — don't re-assemble head/header/footer by hand. [Post.astro](src/layouts/Post.astro) wraps `BaseLayout` to add hero image + title block + category line for single posts. `Header`, `BaseHead`, and `FormattedDate` also accept `locale` directly and fall back to `getLocaleFromUrl(Astro.url)`.
- Separate RSS feeds per locale: `/rss.xml` (de) and `/en/rss.xml`. The sitemap integration is configured with `i18n: { defaultLocale: 'de', locales: { de: 'de-DE', en: 'en-US' } }`.

### Routing and data flow

- [src/pages/[...slug].astro](src/pages/[...slug].astro) and [src/pages/en/[...slug].astro](src/pages/en/[...slug].astro) generate post pages via `getStaticPaths` + `getPostsByLocale(locale)`, rendering through [BlogPost.astro](src/layouts/BlogPost.astro).
- `@astrojs/sitemap` generates the sitemap index; `<link rel="alternate" hreflang="…">` tags are emitted in `BaseHead.astro` for both locales plus `x-default`.
- **Fonts**: Atkinson is loaded as a local font via Astro's `fonts` API in `astro.config.mjs`, exposed as CSS variable `--font-atkinson`. Files in `src/assets/fonts/`.
- **MDX** is enabled via `@astrojs/mdx`; posts can mix Markdown and components.

## Hero image workflow

Per user convention: hero image templates live under `src/assets/heros/*`. Workflow uses Maple Mono font, headless Brave to render, then `sharp` to export JPG at 1020×510.
