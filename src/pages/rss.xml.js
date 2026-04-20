import rss from '@astrojs/rss';
import { SITE } from '~/consts';
import { getPostsByLocale, postSlug } from '~/i18n/posts';

export async function GET(context) {
	const posts = await getPostsByLocale('de');
	return rss({
		title: SITE.de.title,
		description: SITE.de.description,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: `/${postSlug(post)}/`,
		})),
	});
}
