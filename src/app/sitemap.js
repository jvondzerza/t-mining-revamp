import { LOCALES } from '../i18n/dictionaries'

const SITE = 'https://jvondzerza.github.io/t-mining-revamp'

export default function sitemap() {
  return LOCALES.map((lang) => ({
    url: `${SITE}/${lang}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: lang === 'en' ? 1 : 0.8,
  }))
}
