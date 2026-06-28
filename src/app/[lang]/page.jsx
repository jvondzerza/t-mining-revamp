import SiteShell from '../../components/SiteShell'
import { getDict, LOCALES, DEFAULT_LOCALE } from '../../i18n/dictionaries'

const SITE = 'https://jvondzerza.github.io/t-mining-revamp'
const localeUrl = (lang) => `${SITE}/${lang}/`

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export function generateMetadata({ params }) {
  const { lang } = params
  const dict = getDict(lang)

  // hreflang map: every locale + x-default -> default locale
  const languages = Object.fromEntries(LOCALES.map((l) => [l, localeUrl(l)]))
  languages['x-default'] = localeUrl(DEFAULT_LOCALE)

  return {
    title: dict.seo.title,
    description: dict.seo.description,
    alternates: {
      canonical: localeUrl(lang),
      languages,
    },
    openGraph: {
      title: dict.seo.title,
      description: dict.seo.description,
      url: localeUrl(lang),
      siteName: 'T-Mining',
      locale: lang,
      type: 'website',
    },
  }
}

export default function Page({ params }) {
  return <SiteShell lang={params.lang} />
}
