import { Picture } from "../../_kit/Picture";
import type { SouqContext } from "../context";
import s from "../souq.module.css";

export function Story({ ctx }: { ctx: SouqContext }) {
  const body = ctx.text("story.text");
  if (!body) return null;
  const picture = ctx.image("story.image");
  const since = ctx.text("story.since");
  return (
    <section className={s.block} id="story" data-section="story" aria-labelledby="story-title">
      <div className={`${s.wrap} ${s.about}`}>
        {picture && (
          <div className={s.aboutMedia}>
            <Picture src={picture} sizes="(min-width: 760px) 50vw, 100vw" />
            {since && (
              <div className={s.since}>
                {ctx.c.since}
                <b>{since}</b>
              </div>
            )}
          </div>
        )}
        <div className={s.aboutTx}>
          <span className={s.eyebrow}>{ctx.c.storyEyebrow}</span>
          <h2 id="story-title">{ctx.text("story.title") || ctx.t.story}</h2>
          <p>{body}</p>
        </div>
      </div>
    </section>
  );
}
