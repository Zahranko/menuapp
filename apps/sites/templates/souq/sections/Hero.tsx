import { choice, number } from "@/lib/settings";
import { Arrow, Clock, Pin } from "../../_kit/icons";
import { Picture } from "../../_kit/Picture";
import type { SouqContext } from "../context";

export function Hero({ ctx }: { ctx: SouqContext }) {
  const split = choice(ctx.site.settings, "hero.layout", ["full", "split"] as const, "full") === "split";
  const picture = ctx.image("hero.image");
  const eyebrow = ctx.text("hero.eyebrow");
  const subtitle = ctx.text("hero.subtitle");
  const { address } = ctx.site.business;
  return (
    <section className={`hero ${split ? "split" : ""}`} id="top" data-section="hero" aria-labelledby="hero-title">
      <div className="heroMedia">{picture && <Picture src={picture} sizes={split ? "(min-width: 760px) 50vw, 100vw" : "100vw"} priority />}</div>
      <div className="heroShade" style={{ opacity: number(ctx.site.settings, "hero.shade", 55) / 100 }} />
      <div className="heroIn">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 id="hero-title">{ctx.text("hero.title") || ctx.site.business.name}</h1>
        {subtitle && <p>{subtitle}</p>}
        <div className="btns">
          <a className={`btn pri`} href="#menu">
            {ctx.c.viewMenu} <Arrow className="flip" />
          </a>
          {ctx.on("visit") && (
            <a className={`btn sec`} href="#visit">
              {ctx.c.findUs}
            </a>
          )}
        </div>
        {(ctx.today || address) && (
          <div className="heroMeta">
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
