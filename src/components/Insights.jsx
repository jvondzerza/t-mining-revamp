const POSTS = [
  {
    cat: 'Insight',
    date: 'Jun 2026',
    title: 'Why container release fraud is really a security problem',
    read: '6 min read',
  },
  {
    cat: 'Product',
    date: 'May 2026',
    title: 'Self-sovereign identity arrives at the terminal gate',
    read: '4 min read',
  },
  {
    cat: 'Company',
    date: 'Apr 2026',
    title: 'T-Mining renews ISO 27001:2022 certification',
    read: '3 min read',
  },
]

export default function Insights() {
  return (
    <section className="section insights" id="insights">
      <div className="container">
        <header className="insights__head">
          <div>
            <span className="eyebrow" data-reveal="up">Insights</span>
            <h2 className="section-title" data-reveal="up">
              From the port up.
            </h2>
          </div>
          <a href="#" className="insights__all btn" data-reveal="up">
            All articles <span className="arrow">↗</span>
          </a>
        </header>

        <div className="insights__grid" data-reveal="stagger">
          {POSTS.map((p, i) => (
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
