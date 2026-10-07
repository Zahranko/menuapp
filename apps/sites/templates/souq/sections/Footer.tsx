import { brand } from "@/lib/brand";
import { madeWith } from "@/lib/i18n";
import { Instagram, Mail, WhatsApp } from "../../_kit/icons";
import type { SouqContext } from "../context";
import { Logo, navLinks } from "./Header";

export function Footer({ ctx }: { ctx: SouqContext }) {
  const { business } = ctx.site;
  const { c, t, contact } = ctx;
  const year = ctx.now.getFullYear();
  return (
    <footer className="foot" data-section="footer">
      <div className="wrap">
        <div className="footTop">
          <div>
            <div className="brand">
              <Logo ctx={ctx} />
              <span className="brandName">{business.name}</span>
            </div>
            {ctx.text("hero.subtitle") && <p>{ctx.text("hero.subtitle")}</p>}
            <div className="soc">
              {contact.instagram && (
                <a href={contact.instagram} rel="noopener" target="_blank" aria-label={t.instagram}>
                  <Instagram />
                </a>
              )}
              {contact.whatsapp && (
                <a href={contact.whatsapp} rel="noopener" target="_blank" aria-label={c.whatsapp}>
                  <WhatsApp />
                </a>
              )}
              {contact.email && (
                <a href={contact.email} aria-label={c.email}>
                  <Mail />
                </a>
              )}
            </div>
          </div>
          <div className="cols">
            <div>
              <h2>{c.explore}</h2>
              {navLinks(ctx).map(([href, label]) => (
                <a key={href} href={href}>
                  {label}
                </a>
              ))}
            </div>
            <div>
              <h2>{c.visit}</h2>
              {business.address && <span>{business.address}</span>}
              {ctx.today && <span>{ctx.today}</span>}
              {business.whatsApp && <span dir="ltr">{business.whatsApp}</span>}
            </div>
            {business.email && (
              <div className="newsCol">
                <h2>{c.newsletter}</h2>
                <span className="muted">{c.newsletterText}</span>
                {/* No mailing list service yet: joining opens an email to the business with the visitor's address. */}
                <form className="news" action={`mailto:${business.email}`} method="get">
                  <input type="hidden" name="subject" value={c.newsletter} />
                  <input type="email" name="body" required placeholder={t.yourEmail} aria-label={t.yourEmail} />
                  <button type="submit" className={`btn pri`}>
                    {c.join}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
        <div className="footBot">
          <span>
            © {year} {business.name}. {c.rights}
          </span>
          <a href={`https://${brand.domain}`}>{madeWith(business.locale)}</a>
        </div>
      </div>
    </footer>
  );
}
