import { useT } from '../i18n'

export default function Insights() {
  const t = useT()

  return (
    <section className="section insights" id="insights">
      <div className="container">
        <header className="insights__head">
          <div>
            <span className="eyebrow" data-reveal="up">{t.insights.eyebrow}</span>
            <h2 className="section-title" data-reveal="up">{t.insights.title}</h2>
          </div>
          <a href="#" className="insights__all btn" data-reveal="up">
            {t.insights.all} <span className="arrow">↗</span>
          </a>
        </header>

        <div className="insights__grid" data-reveal="stagger">
          {t.insights.posts.map((p, i) => (
            <article className="post" key={i} data-stagger-item>
              <a href="#" className="post__link">
                <div className="post__meta">
                  <span className="post__cat">{p.cat}</span>
                  <span className="post__date">{p.date}</span>
                </div>
                <h3 className="post__title">{p.title}</h3>
                <div className="post__foot">
                  <span>{p.read}</span>
                  <span className="post__arrow">↗</span>
                </div>
                <span className="post__line" aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
