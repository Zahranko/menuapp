import { Picture } from "../../_kit/Picture";
import type { SouqContext } from "../context";

export function Story({ ctx }: { ctx: SouqContext }) {
  const body = ctx.text("story.text");
  if (!body) return null;
  const picture = ctx.image("story.image");
  const since = ctx.text("story.since");
  return (
    <section className="block" id="story" data-section="story" aria-labelledby="story-title">
      <div className={`wrap about`}>
        {picture && (
          <div className="aboutMedia">
            <Picture src={picture} sizes="(min-width: 760px) 50vw, 100vw" />
            {since && (
              <div className="since">
                {ctx.c.since}
                <b>{since}</b>
              </div>
            )}
          </div>
        )}
        <div className="aboutTx">
          <span className="eyebrow">{ctx.c.storyEyebrow}</span>
          <h2 id="story-title">{ctx.text("story.title") || ctx.t.story}</h2>
          <p>{body}</p>
        </div>
      </div>
    </section>
  );
}
