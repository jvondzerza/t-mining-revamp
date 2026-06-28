const SITE = 'https://jvondzerza.github.io/t-mining-revamp'

export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE}/sitemap.xml`,
  }
}
