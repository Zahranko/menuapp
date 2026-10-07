import type { SouqContext } from "../context";
import { Thumb, thumbStyle } from "./Thumb";

export function Signature({ ctx }: { ctx: SouqContext }) {
  const picks = ctx.picks;
  if (!picks.length) return null;
  return (
    <section className="block" id="signature" data-section="signature" aria-labelledby="signature-title">
      <div className="wrap">
        <div className="head">
          <span className="eyebrow">{ctx.c.signatureEyebrow}</span>
          <h2 id="signature-title">{ctx.c.signatureTitle}</h2>
          <p>{ctx.c.signatureText}</p>
        </div>
        <div className="sigRow">
          {picks.map((item, k) => (
            <button key={item.id} type="button" className="sig" data-item-id={item.id}>
              <span className="sigIm" style={thumbStyle(item)}>
                <span className="num">0{k + 1}</span>
                <Thumb item={item} sizes="(min-width: 760px) 33vw, 80vw" />
              </span>
              <span className="sigBd">
                {item.labelText && <span className="tag">{item.labelText}</span>}
                <span className="sigName">{item.name}</span>
                {item.description && <span className="desc">{item.description}</span>}
                <span className="sigFt">
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
