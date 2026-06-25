import useSmoothScroll from './hooks/useSmoothScroll'
import useReveal from './hooks/useReveal'
import Preloader from './components/Preloader'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Mission from './components/Mission'
import Threat from './components/Threat'
import Solution from './components/Solution'
import Pillars from './components/Pillars'
import Network from './components/Network'
import Technology from './components/Technology'
import Insights from './components/Insights'
import CTA from './components/CTA'
import Footer from './components/Footer'

export default function App() {
  useSmoothScroll()
  const revealScope = useReveal()

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
