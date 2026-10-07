import type { SouqContext } from "../context";

/** Only reviews the owner typed in are shown; the section is hidden when there are none. */
export function Reviews({ ctx }: { ctx: SouqContext }) {
  const reviews = ctx.reviews.slice(0, 3);
  if (!reviews.length) return null;
  return (
    <section className="block" id="reviews" data-section="reviews" aria-labelledby="reviews-title">
      <div className="wrap">
        <div className="head">
          <span className="eyebrow">{ctx.c.reviewsEyebrow}</span>
          <h2 id="reviews-title">{ctx.c.reviewsTitle}</h2>
        </div>
        <div className="revs" tabIndex={0} role="region" aria-labelledby="reviews-title">
          {reviews.map((r, i) => (
            <figure key={i} className="rev">
              <span className="stars" aria-hidden="true">
                ★★★★★
              </span>
              <blockquote>{r.quote}</blockquote>
              {r.name && (
                <figcaption className="who">
                  <i aria-hidden="true">{r.name[0]}</i>
                  {r.name}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
