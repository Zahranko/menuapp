import { madeWith } from "@/lib/i18n";
import { Mail } from "../../_kit/icons";
import type { SouqContext } from "../context";
import { FootName, SocialIcons } from "../../_kit/blocks";
import { socialAccounts } from "../../_kit/options";
import { Logo, navLinks } from "./Header";
import { MadeWithLink } from "@/components/brand/logo-mark";

/** What Souq's footer showed before the owner could choose: Instagram and WhatsApp (also its manifest's default). */
export const SOUQ_SOCIAL = ["instagram", "whatsapp"] as const;

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
              <FootName ctx={ctx} as="span" className="brandName kit-name" />
            </div>
            {ctx.text("hero.subtitle") && <p>{ctx.text("hero.subtitle")}</p>}
            <div className="soc">
              <SocialIcons accounts={socialAccounts(ctx.site, SOUQ_SOCIAL)} />
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
                  <button data-k="btn" type="submit" className={`btn pri`}>
                    {c.join}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
        <div className="footBot">
          <span className="kit-credits-text">
            © {year} {business.name}. {c.rights}
          </span>
          <MadeWithLink label={madeWith(business.locale)} />
        </div>
      </div>
    </footer>
  );
}
