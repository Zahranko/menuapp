import { choice, number } from "@/lib/settings";
import { Arrow, Clock, Pin } from "../../_kit/icons";
import { Picture } from "../../_kit/Picture";
import type { SouqContext } from "../context";
import s from "../souq.module.css";

export function Hero({ ctx }: { ctx: SouqContext }) {
  const split = choice(ctx.site.settings, "hero.layout", ["full", "split"] as const, "full") === "split";
  const picture = ctx.image("hero.image");
  const eyebrow = ctx.text("hero.eyebrow");
  const subtitle = ctx.text("hero.subtitle");
  const { address } = ctx.site.business;
  return (
    <section className={`${s.hero} ${split ? s.split : ""}`} id="top" data-section="hero" aria-labelledby="hero-title">
      <div className={s.heroMedia}>{picture && <Picture src={picture} sizes={split ? "(min-width: 760px) 50vw, 100vw" : "100vw"} priority />}</div>
      <div className={s.heroShade} style={{ opacity: number(ctx.site.settings, "hero.shade", 55) / 100 }} />
      <div className={s.heroIn}>
        {eyebrow && <span className={s.eyebrow}>{eyebrow}</span>}
        <h1 id="hero-title">{ctx.text("hero.title") || ctx.site.business.name}</h1>
        {subtitle && <p>{subtitle}</p>}
        <div className={s.btns}>
          <a className={`${s.btn} ${s.pri}`} href="#menu">
            {ctx.c.viewMenu} <Arrow className={s.flip} />
          </a>
          {ctx.on("visit") && (
            <a className={`${s.btn} ${s.sec}`} href="#visit">
              {ctx.c.findUs}
            </a>
          )}
        </div>
        {(ctx.today || address) && (
          <div className={s.heroMeta}>
            {ctx.today && (
              <span>
                <Clock /> {ctx.today}
              </span>
            )}
            {address && (
              <span>
                <Pin /> {address}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
