'use client'

import { useEffect } from 'react'
import { ScrollTrigger } from '../lib/gsap'
import { LanguageProvider } from '../i18n'
import useSmoothScroll from '../hooks/useSmoothScroll'
import useReveal from '../hooks/useReveal'
import Preloader from './Preloader'
import Navbar from './Navbar'
import Hero from './Hero'
import Marquee from './Marquee'
import Mission from './Mission'
import Threat from './Threat'
import Solution from './Solution'
import Pillars from './Pillars'
import Network from './Network'
import Technology from './Technology'
import Insights from './Insights'
import CTA from './CTA'
import Footer from './Footer'

// Everything below the SiteShell boundary is a Client Component (this file has
// 'use client'). Next still pre-renders it all to static HTML at build time, so
// the page content is in the source for crawlers — interactivity hydrates after.
function Site({ lang }) {
  useSmoothScroll()
  const revealScope = useReveal()

  // recompute ScrollTrigger positions once the copy has laid out
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [lang])

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <Preloader />
      <Navbar />
      <main ref={revealScope}>
        <Hero />
        <Marquee />
        <Mission />
        <Threat />
        <Solution />
        <Pillars />
        <Network />
        <Technology />
        <Insights />
        <CTA />
      </main>
      <Footer />
    </>
  )
}

export default function SiteShell({ lang }) {
  return (
    <LanguageProvider lang={lang}>
      <Site lang={lang} />
    </LanguageProvider>
  )
}
