import type { SouqContext } from "../context";
import s from "../souq.module.css";

/** Only reviews the owner typed in are shown; the section is hidden when there are none. */
export function Reviews({ ctx }: { ctx: SouqContext }) {
  const reviews = [1, 2, 3].map((n) => ({ quote: ctx.text(`reviews.${n}.quote`), name: ctx.text(`reviews.${n}.name`) })).filter((r) => r.quote);
  if (!reviews.length) return null;
  return (
    <section className={s.block} id="reviews" data-section="reviews" aria-labelledby="reviews-title">
      <div className={s.wrap}>
        <div className={s.head}>
          <span className={s.eyebrow}>{ctx.c.reviewsEyebrow}</span>
          <h2 id="reviews-title">{ctx.c.reviewsTitle}</h2>
        </div>
        <div className={s.revs}>
          {reviews.map((r, i) => (
            <figure key={i} className={s.rev}>
              <span className={s.stars} aria-hidden="true">
                ★★★★★
              </span>
              <blockquote>{r.quote}</blockquote>
              {r.name && (
                <figcaption className={s.who}>
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
