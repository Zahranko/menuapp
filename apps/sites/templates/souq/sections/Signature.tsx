import { featured } from "../../_kit/site-data";
import type { SouqContext } from "../context";
import s from "../souq.module.css";
import { Thumb, thumbStyle } from "./Thumb";

export function Signature({ ctx }: { ctx: SouqContext }) {
  const picks = featured(ctx.sections, 3);
  if (!picks.length) return null;
  return (
    <section className={s.block} id="signature" data-section="signature" aria-labelledby="signature-title">
      <div className={s.wrap}>
        <div className={s.head}>
          <span className={s.eyebrow}>{ctx.c.signatureEyebrow}</span>
          <h2 id="signature-title">{ctx.c.signatureTitle}</h2>
          <p>{ctx.c.signatureText}</p>
        </div>
        <div className={s.sigRow}>
          {picks.map((item, k) => (
            <button key={item.id} type="button" className={s.sig} data-item-id={item.id}>
              <span className={s.sigIm} style={thumbStyle(item)}>
                <span className={s.num}>0{k + 1}</span>
                <Thumb item={item} sizes="(min-width: 760px) 33vw, 80vw" />
              </span>
              <span className={s.sigBd}>
                {item.labelText && <span className={s.tag}>{item.labelText}</span>}
                <span className={s.sigName}>{item.name}</span>
                {item.description && <span className={s.desc}>{item.description}</span>}
                <span className={s.sigFt}>
                  <b>{item.priceText}</b>
                  <span>{ctx.c.viewDetails}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
