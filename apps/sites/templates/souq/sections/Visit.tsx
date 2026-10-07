import { hasHours } from "../../_kit/site-data";
import { Mail, Pin, WhatsApp } from "../../_kit/icons";
import { Picture } from "../../_kit/Picture";
import type { SouqContext } from "../context";
import s from "../souq.module.css";

export function Visit({ ctx }: { ctx: SouqContext }) {
  const { business } = ctx.site;
  const { c, t, contact } = ctx;
  return (
    <section className={`${s.block} ${s.alt}`} id="visit" data-section="visit" aria-labelledby="visit-title">
      <div className={s.wrap}>
        <div className={s.head}>
          <span className={s.eyebrow}>{c.visitEyebrow}</span>
          <h2 id="visit-title">{c.visitTitle}</h2>
        </div>
        <div className={s.visit}>
          {contact.maps ? (
            <a className={s.map} href={contact.maps} rel="noopener" target="_blank" aria-label={c.getDirections}>
              <Picture src="/templates/souq/art/map.svg" sizes="(min-width: 760px) 55vw, 100vw" />
            </a>
          ) : (
            <div className={s.map}>
              <Picture src="/templates/souq/art/map.svg" sizes="(min-width: 760px) 55vw, 100vw" />
            </div>
          )}
          <div className={s.info}>
            {hasHours(ctx.hours) && (
              <div className={s.card}>
                <h3>{t.hours}</h3>
                <dl className={s.hours}>
                  {ctx.hours.map((row) => (
                    <div key={row.day} className={row.today ? s.today : undefined}>
                      <dt>
                        {row.name}
                        {row.today && <span className={s.todayTag}>{t.today}</span>}
                      </dt>
                      <dd>{row.time ?? t.closed}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            <div className={s.card}>
              <h3>{t.contact}</h3>
              <ul className={s.contact}>
                {business.address && (
                  <li>
                    <Pin />
                    <p>
                      <span>{c.address}</span>
                      <bdi>{business.address}</bdi>
                    </p>
                  </li>
                )}
                {business.whatsApp && (
                  <li>
                    <WhatsApp />
                    <p>
                      <span>{c.whatsapp}</span>
                      <bdi dir="ltr">{business.whatsApp}</bdi>
                    </p>
                  </li>
                )}
                {business.email && (
                  <li>
                    <Mail />
                    <p>
                      <span>{c.email}</span>
                      <bdi>{business.email}</bdi>
                    </p>
                  </li>
                )}
              </ul>
              {(contact.maps || contact.whatsapp) && (
                <div className={s.btns} style={{ marginTop: 16 }}>
                  {contact.maps && (
                    <a className={`${s.btn} ${s.pri}`} href={contact.maps} rel="noopener" target="_blank">
                      <Pin />
                      {c.getDirections}
                    </a>
                  )}
                  {contact.whatsapp && (
                    <a className={`${s.btn} ${s.dark}`} href={contact.whatsapp} rel="noopener" target="_blank">
                      <WhatsApp />
                      {c.whatsapp}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
