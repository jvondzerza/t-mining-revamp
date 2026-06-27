import { useT } from '../i18n'

export default function Footer() {
  const t = useT()

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
            <p className="footer__tag">{t.footer.tag}</p>
            <span className="footer__iso tag">
              <span className="dot" /> {t.footer.iso}
            </span>
          </div>

          <div className="footer__cols">
            {t.footer.cols.map((c) => (
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
            <span className="footer__address-label">{t.footer.hqLabel}</span>
            <p>
              {t.footer.hqLines[0]}<br />
              {t.footer.hqLines[1]}
            </p>
          </div>
          <a href="#top" className="footer__totop" onClick={toTop}>
            {t.footer.backToTop}
            <span aria-hidden="true">↑</span>
          </a>
        </div>

        <div className="footer__bar">
          <span>© {new Date().getFullYear()} T-Mining NV. {t.footer.rights}</span>
          <span className="footer__credit">{t.footer.credit}</span>
          <div className="footer__legal">
            {t.footer.legal.map((l) => (
              <a href="#" key={l}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
