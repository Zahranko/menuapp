import { Instagram } from "../../_kit/icons";
import { Picture } from "../../_kit/Picture";
import type { SouqContext } from "../context";

/** The prototype's mosaic: the first photo is tall, the fourth is wide. */
const SHAPE = ["tall", "", "", "wide", "", ""];

export function Gallery({ ctx }: { ctx: SouqContext }) {
  if (!ctx.gallery.length) return null;
  const { name, instagram } = ctx.site.business;
  return (
    <section className={`block alt`} id="gallery" data-section="gallery" aria-labelledby="gallery-title">
      <div className="wrap">
        <div className={`head headRow`}>
          <div className="headCol">
            <span className="eyebrow">{ctx.c.galleryEyebrow}</span>
            <h2 id="gallery-title">{ctx.c.galleryTitle.replace("{name}", name)}</h2>
          </div>
          {instagram && ctx.contact.instagram && (
            <a className={`btn sec`} href={ctx.contact.instagram} rel="noopener" target="_blank">
              <Instagram />@{instagram.replace(/^@/, "")}
            </a>
          )}
        </div>
        <ul className="gal">
          {ctx.gallery.map((src, i) => (
            <li key={src + i} className={SHAPE[i] || undefined}>
              <Picture src={src} alt={ctx.c.photo.replace("{n}", String(i + 1)).replace("{name}", name)} sizes="(min-width: 760px) 25vw, 50vw" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
