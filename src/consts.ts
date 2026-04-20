export const LOCALES = ['de', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'de';

export const SITE: Record<Locale, { title: string; description: string }> = {
	de: {
		title: 'Adrian Altner',
		description: 'Willkommen auf meiner Website!',
	},
	en: {
		title: 'Adrian Altner',
		description: 'Welcome to my website!',
	},
};
