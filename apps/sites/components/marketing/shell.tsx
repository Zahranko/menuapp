import { LogoMark } from "@/components/brand/logo-mark";
import { brand } from "@/lib/brand";
import { copy, pagePath, type Lang, type MarketingPage } from "@/lib/marketing/copy";

/** Brand colors from brand.json as CSS variables; marketing.css builds every other shade from them. */
const brandVars = {
  "--mk-primary": brand.colorPrimary,
  "--mk-primary-2": brand.colorPrimary2,
  "--mk-accent": brand.colorAccent,
  "--mk-highlight": brand.colorHighlight,
  "--mk-paper": brand.colorPaper,
  "--mk-ink": brand.colorInk,
  "--mk-muted": brand.colorMuted,
  "--mk-line": brand.colorLine,
} as React.CSSProperties;

/** The <html> of the marketing pages: language, direction, brand colors and the fonts of that language. */
export function MarketingDocument({ lang, fontClassName, children }: { lang: Lang; fontClassName: string; children: React.ReactNode }) {
  return (
    <html lang={lang} dir={copy(lang).dir} className={`mk-html ${fontClassName}`} style={brandVars}>
      <body className={`mk mk-${lang}`}>{children}</body>
    </html>
  );
}

const other = (lang: Lang): Lang => (lang === "ar" ? "en" : "ar");

function LangSwitch({ lang, page, className }: { lang: Lang; page: MarketingPage; className?: string }) {
  const t = copy(lang);
  const to = other(lang);
  return (
    <a href={pagePath(to, page)} hrefLang={to} lang={to} className={`mk-lang ${className ?? ""}`} aria-label={t.switchLabel} data-lang-switch>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
      <span>{t.switchTo}</span>
    </a>
  );
}

function Wordmark({ lang }: { lang: Lang }) {
  return (
    <a href={pagePath(lang, "home")} className="mk-wordmark">
      <LogoMark size="1.6em" />
      <span>{lang === "ar" ? brand.brandNameAr : brand.brandName}</span>
    </a>
  );
}

/** Header, main and footer around every marketing page. */
export function MarketingShell({ lang, page, children }: { lang: Lang; page: MarketingPage; children: React.ReactNode }) {
  const t = copy(lang);
  const home = page === "home" ? "" : pagePath(lang, "home");
  const name = lang === "ar" ? brand.brandNameAr : brand.brandName;

  return (
    <>
      <a href="#main" className="mk-skip">
        {t.skip}
      </a>
      <header className="mk-header">
        <div className="mk-header-in">
          <Wordmark lang={lang} />
          <nav className="mk-nav" aria-label={t.nav.main}>
            <a href={`${home}#how`}>{t.nav.how}</a>
            <a href={`${home}#features`}>{t.nav.features}</a>
            <a href={`${home}#plans`}>{t.nav.plans}</a>
          </nav>
          <div className="mk-header-end">
            <LangSwitch lang={lang} page={page} />
            <a href={`${home}#download`} className="mk-btn mk-btn-dark mk-btn-sm">
              {t.nav.getApp}
            </a>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="mk-footer">
        <div className="mk-wrap mk-footer-in">
          <div className="mk-footer-brand">
            <Wordmark lang={lang} />
            <p>{t.footer.tagline}</p>
          </div>
          <nav className="mk-footer-links" aria-label={name}>
            <a href={pagePath(lang, "privacy")} aria-current={page === "privacy" ? "page" : undefined}>
              {t.footer.privacy}
            </a>
            <a href={pagePath(lang, "contact")} aria-current={page === "contact" ? "page" : undefined}>
              {t.footer.contact}
            </a>
            <a href={`mailto:${brand.supportEmail}`} dir="ltr">
              {brand.supportEmail}
            </a>
            <LangSwitch lang={lang} page={page} className="mk-lang-footer" />
          </nav>
          <p className="mk-footer-copy">
            © {new Date().getFullYear()} {name}. {t.footer.rights}
          </p>
        </div>
      </footer>
    </>
  );
}
