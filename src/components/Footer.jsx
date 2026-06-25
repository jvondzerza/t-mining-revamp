const COLS = [
  {
    title: 'Solution',
    links: ['Secure Container Release', 'Electronic Delivery Order', 'ID Wallet', 'Why privacy matters'],
  },
  {
    title: 'Company',
    links: ['About T-Mining', 'Insights', 'Careers', 'Contact'],
  },
  {
    title: 'Resources',
    links: ['White papers', 'Blockchain explained', 'Documentation', 'Login'],
  },
]

export default function Footer() {
  const toTop = (e) => {
    e.preventDefault()
    if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.3 })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <a href="#top" className="footer__logo" onClick={toTop} aria-label="T-Mining home">
              <img src="/logos/t-mining-logo.png" alt="T-Mining — Blockchain Logistics" className="footer__logo-img" />
            </a>
            <p className="footer__tag">
              Securing the flow of global trade with decentralized technology.
            </p>
            <span className="footer__iso tag">
              <span className="dot" /> ISO 27001 : 2022 certified
            </span>
          </div>

          <div className="footer__cols">
            {COLS.map((c) => (
              <nav className="footer__col" key={c.title} aria-label={c.title}>
                <h4 className="footer__col-title">{c.title}</h4>
                <ul>
                  {c.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="footer__link">{l}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="footer__address">
          <div>
            <span className="footer__address-label">Headquarters</span>
            <p>
              T-Mining NV · Antwerp, Belgium<br />
              Port of Antwerp-Bruges
            </p>
          </div>
          <a href="#top" className="footer__totop" onClick={toTop}>
            Back to top
            <span aria-hidden="true">↑</span>
          </a>
        </div>

        <div className="footer__bar">
          <span>© {new Date().getFullYear()} T-Mining NV. All rights reserved.</span>
          <span className="footer__credit">
            Concept revamp · built with React, Three.js &amp; GSAP
          </span>
          <div className="footer__legal">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
