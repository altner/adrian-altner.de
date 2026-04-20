import { type CollectionEntry, getCollection, getEntry } from 'astro:content';
import { type Locale } from '~/consts';
import { isLocale, localizePath } from '~/i18n/ui';

export function entryLocale(entry: { id: string }): Locale {
	const first = entry.id.split('/')[0];
	if (!isLocale(first)) {
		throw new Error(`Content entry "${entry.id}" is not under a locale folder (de/ or en/).`);
	}
	return first;
}

export function entrySlug(entry: { id: string }): string {
	return entry.id.split('/').slice(1).join('/');
}

// Back-compat aliases used across the codebase.
export const postLocale = entryLocale;
export const postSlug = entrySlug;

export async function getPostsByLocale(locale: Locale) {
	const posts = await getCollection('posts', (p) => entryLocale(p) === locale);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getCategoriesByLocale(locale: Locale) {
	const categories = await getCollection('categories', (c) => entryLocale(c) === locale);
	return categories.sort((a, b) => a.data.name.localeCompare(b.data.name));
}

export async function getPostsByCategory(category: CollectionEntry<'categories'>) {
	const locale = entryLocale(category);
	const posts = await getCollection(
		'posts',
		(p) => entryLocale(p) === locale && p.data.category?.id === category.id,
	);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Convert a tag name into a URL-safe slug. */
export function tagSlug(tag: string): string {
	return tag
		.toLowerCase()
		.trim()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/ß/g, 'ss')
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/** Aggregated tag info across posts in one locale. */
export interface TagEntry {
	name: string;
	slug: string;
	count: number;
}

export async function getTagsByLocale(locale: Locale): Promise<TagEntry[]> {
	const posts = await getPostsByLocale(locale);
	const byName = new Map<string, TagEntry>();
	for (const post of posts) {
		for (const raw of post.data.tags ?? []) {
			const name = raw.trim();
			if (!name) continue;
			const existing = byName.get(name);
			if (existing) existing.count++;
			else byName.set(name, { name, slug: tagSlug(name), count: 1 });
		}
	}
	return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Resolve a tag slug for a locale back to its canonical TagEntry. */
export async function findTagBySlug(locale: Locale, slug: string): Promise<TagEntry | undefined> {
	const tags = await getTagsByLocale(locale);
	return tags.find((t) => t.slug === slug);
}

export async function getPostsByTag(locale: Locale, slug: string) {
	const posts = await getPostsByLocale(locale);
	return posts.filter((p) => (p.data.tags ?? []).some((name) => tagSlug(name) === slug));
}

export async function resolveCategory(post: CollectionEntry<'posts'>) {
	if (!post.data.category) return undefined;
	return await getEntry(post.data.category);
}

/** URL segment used for category detail pages per locale. */
export function categorySegment(locale: Locale): string {
	return locale === 'de' ? 'kategorie' : 'category';
}

/** URL segment used for the category listing page per locale. */
export function categoryIndexSegment(locale: Locale): string {
	return locale === 'de' ? 'kategorien' : 'categories';
}

/** URL segment used for the about page per locale. */
export function aboutSegment(locale: Locale): string {
	return locale === 'de' ? 'ueber-mich' : 'about';
}

/** URL segment used for tag detail pages per locale. */
export function tagSegment(locale: Locale): string {
	return locale === 'de' ? 'schlagwort' : 'tag';
}

/** URL segment used for the tag listing page per locale. */
export function tagIndexSegment(locale: Locale): string {
	return locale === 'de' ? 'schlagwoerter' : 'tags';
}

export function categoryHref(category: CollectionEntry<'categories'>): string {
	const locale = entryLocale(category);
	return localizePath(`/${categorySegment(locale)}/${entrySlug(category)}/`, locale);
}

export function postHref(post: CollectionEntry<'posts'>): string {
	const locale = entryLocale(post);
	return localizePath(`/${entrySlug(post)}/`, locale);
}

export function tagHref(locale: Locale, tag: string | TagEntry): string {
	const slug = typeof tag === 'string' ? tagSlug(tag) : tag.slug;
	return localizePath(`/${tagSegment(locale)}/${slug}/`, locale);
}

/** Canonical URL for any translatable entry. */
export function entryHref(entry: CollectionEntry<'posts' | 'categories'>): string {
	return entry.collection === 'categories' ? categoryHref(entry) : postHref(entry);
}

/**
 * Find the translation of an entry in the target locale, matched via the
 * shared `translationKey` frontmatter field. Returns `undefined` when no
 * matching translation exists.
 */
export async function findTranslation(
	entry: CollectionEntry<'posts' | 'categories'>,
	target: Locale,
): Promise<CollectionEntry<'posts' | 'categories'> | undefined> {
	const key = entry.data.translationKey;
	if (!key) return undefined;
	const collection = entry.collection;
	const all = await getCollection(collection, (e) => entryLocale(e) === target);
	return all.find((e) => e.data.translationKey === key);
}
