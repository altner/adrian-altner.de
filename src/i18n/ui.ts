import { DEFAULT_LOCALE, type Locale, LOCALES } from '~/consts';

export const ui = {
	de: {
		'nav.home': 'Start',
		'nav.about': 'Über mich',
		'nav.categories': 'Kategorien',
		'nav.tags': 'Schlagwörter',
		'post.lastUpdated': 'Zuletzt aktualisiert am',
		'post.category': 'Kategorie',
		'post.tags': 'Schlagwörter',
		'post.translationAvailable': 'Dieser Beitrag ist auch auf Englisch verfügbar:',
		'post.translationLink': 'Englische Version lesen',
		'categories.title': 'Kategorien',
		'categories.description': 'Alle Kategorien im Überblick.',
		'category.postsIn': 'Beiträge in',
		'category.noPosts': 'Noch keine Beiträge in dieser Kategorie.',
		'tags.title': 'Schlagwörter',
		'tags.description': 'Alle Schlagwörter im Überblick.',
		'tag.postsTagged': 'Beiträge mit',
		'tag.noPosts': 'Noch keine Beiträge mit diesem Stichwort.',
		'lang.de': 'Deutsch',
		'lang.en': 'English',
	},
	en: {
		'nav.home': 'Home',
		'nav.about': 'About',
		'nav.categories': 'Categories',
		'nav.tags': 'Tags',
		'post.lastUpdated': 'Last updated on',
		'post.category': 'Category',
		'post.tags': 'Tags',
		'post.translationAvailable': 'This post is also available in German:',
		'post.translationLink': 'Read the German version',
		'categories.title': 'Categories',
		'categories.description': 'All categories at a glance.',
		'category.postsIn': 'Posts in',
		'category.noPosts': 'No posts in this category yet.',
		'tags.title': 'Tags',
		'tags.description': 'All tags at a glance.',
		'tag.postsTagged': 'Posts tagged',
		'tag.noPosts': 'No posts with this tag yet.',
		'lang.de': 'Deutsch',
		'lang.en': 'English',
	},
} as const satisfies Record<Locale, Record<string, string>>;

export type UIKey = keyof (typeof ui)['de'];

export function t(locale: Locale, key: UIKey): string {
	return ui[locale][key];
}

export function isLocale(value: string | undefined): value is Locale {
	return !!value && (LOCALES as readonly string[]).includes(value);
}

export function getLocaleFromUrl(url: URL): Locale {
	const seg = url.pathname.split('/').filter(Boolean)[0];
	return isLocale(seg) ? seg : DEFAULT_LOCALE;
}

/**
 * Build a URL for a route within a given locale. `path` is the route without
 * any language prefix, e.g. "/" or "/about".
 */
export function localizePath(path: string, locale: Locale): string {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	if (locale === DEFAULT_LOCALE) return normalized;
	if (normalized === '/') return `/${locale}/`;
	return `/${locale}${normalized}`;
}

/**
 * Segments whose URL slug differs per locale. The first segment of any
 * non-prefixed pathname is translated through this map when switching.
 */
const LOCALIZED_SEGMENTS: Record<Locale, Record<string, string>> = {
	de: {
		category: 'kategorie',
		categories: 'kategorien',
		about: 'ueber-mich',
		tag: 'schlagwort',
		tags: 'schlagwoerter',
	},
	en: {
		kategorie: 'category',
		kategorien: 'categories',
		'ueber-mich': 'about',
		schlagwort: 'tag',
		schlagwoerter: 'tags',
	},
};

/**
 * Swap the locale of the current pathname, preserving the rest of the route
 * and translating known per-locale URL segments (e.g. `kategorie` ↔ `category`).
 */
export function switchLocalePath(pathname: string, target: Locale): string {
	const parts = pathname.split('/').filter(Boolean);
	if (parts.length > 0 && isLocale(parts[0])) parts.shift();
	if (parts.length > 0) {
		const translated = LOCALIZED_SEGMENTS[target][parts[0]];
		if (translated) parts[0] = translated;
	}
	const rest = parts.length ? `/${parts.join('/')}` : '/';
	return localizePath(rest === '/' ? '/' : rest, target);
}
