import { Space_Grotesk, Inter } from 'next/font/google'
import { LOCALES } from '../../i18n/dictionaries'
import '../globals.css'

// Self-hosted by next/font (no render-blocking Google Fonts request). Exposed as
// CSS variables consumed by --font-display / --font-body in index.css.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const BASE_PATH = '/t-mining-revamp'
const SITE = `https://jvondzerza.github.io${BASE_PATH}`

// This is the topmost layout (there is no app/layout.jsx) so it owns <html>/<body>
// and can set <html lang> per locale.
export const metadata = {
  metadataBase: new URL(SITE),
  // Next does not prefix basePath onto metadata icons, so include it explicitly.
  icons: { icon: `${BASE_PATH}/logos/t-mining-mark.png` },
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'T-Mining',
  url: `${SITE}/`,
  logo: `${SITE}/logos/t-mining-logo.png`,
  description:
    'T-Mining builds decentralized networks that make maritime supply chains more secure, sustainable and private.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Antwerp',
    addressCountry: 'BE',
  },
}

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export default function LangLayout({ children, params }) {
  return (
    <html
      lang={params.lang}
      className={`${spaceGrotesk.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* flag JS-on before paint so reveal targets hide pre-animation without a flash */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
