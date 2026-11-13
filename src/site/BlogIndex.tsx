import { BLOG_DESCRIPTION, JEV_POST } from './blog-catalog';
import './blog-index.css';

export default function BlogIndex() {
  const { title, description, pathname, image } = JEV_POST;
  return <section className="site-blog-index" aria-labelledby="blog-title">
    <header className="site-blog-intro">
      <h1 id="blog-title">Blog</h1>
      <p>{BLOG_DESCRIPTION}</p>
    </header>
    <article className="site-blog-post">
      <a href={pathname} className="site-blog-feature" aria-labelledby="blog-post-title">
        <div className="site-blog-cover"><img src={image.href} alt="" width={image.width} height={image.height} decoding="async" fetchPriority="high"/></div>
        <div className="site-blog-feature-copy">
          <span className="site-blog-topic">Engineering</span>
          <h2 id="blog-post-title">{title}</h2>
          <p>{description}</p>
          <span className="site-blog-reading">Read the article <span aria-hidden="true">→</span></span>
        </div>
      </a>
    </article>
  </section>;
}
