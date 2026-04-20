import rss from '@astrojs/rss';
import { SITE } from '~/consts';
import { getPostsByLocale, postSlug } from '~/i18n/posts';

export async function GET(context) {
	const posts = await getPostsByLocale('en');
	return rss({
		title: SITE.en.title,
		description: SITE.en.description,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: `/en/${postSlug(post)}/`,
		})),
	});
}
