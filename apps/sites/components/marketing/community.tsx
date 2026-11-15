import type { CommunityCard, CommunityDetail, CommunityPage, CommunitySort, PublisherPage } from "@/lib/community";
import { copy, fill, pagePath, type Lang } from "@/lib/marketing/copy";
import { ShareActions } from "./community-share";
import { StoreButtons } from "./store-buttons";

/** Community pages: the gallery at /community, a template's share page at /community/<code>, a publisher at /community/u/<name>. */

export const templatePath = (lang: Lang, code: string) => `${pagePath(lang, "community")}/${code}`;
export const publisherPath = (lang: Lang, username: string) => `${pagePath(lang, "community")}/u/${username}`;
export const previewPath = (code: string, lang: Lang) => `/community-preview/${code}${lang === "ar" ? "/ar" : ""}`;

function uses(n: number, lang: Lang): string {
  const t = copy(lang).community;
  return n === 0 ? t.noUses : n === 1 ? t.oneUse : t.uses.replace("{n}", String(n));
}

function Swatches({ colors }: { colors: string[] }) {
  if (!colors.length) return null;
  return (
    <span className="mk-cm-swatches" aria-hidden="true">
      {colors.map((c) => (
        <span key={c} style={{ background: c }} />
      ))}
    </span>
  );
}

/** A small live preview: the sample site in a phone-shaped frame, loaded when it scrolls near. */
function Preview({ code, name, lang, large = false }: { code: string; name: string; lang: Lang; large?: boolean }) {
  return (
    <div className={`mk-cm-frame${large ? " mk-cm-frame-lg" : ""}`}>
      <iframe src={previewPath(code, lang)} title={copy(lang).community.preview.replace("{name}", name)} loading="lazy" tabIndex={large ? 0 : -1} />
    </div>
  );
}

function Card({ item, lang }: { item: CommunityCard; lang: Lang }) {
  const t = copy(lang).community;
  return (
    <li className="mk-cm-card">
      <Preview code={item.code} name={item.name} lang={lang} />
      <div className="mk-cm-card-body">
        <h2 className="mk-cm-card-title">
          <a href={templatePath(lang, item.code)} className="mk-cm-stretch">
            {item.name}
          </a>
        </h2>
        <p className="mk-cm-meta">
          {t.by}{" "}
          <a href={publisherPath(lang, item.publisher.username)} className="mk-cm-above">
            {item.publisher.displayName}
          </a>
        </p>
        <p className="mk-cm-row">
          <Swatches colors={item.colors} />
          <span>{uses(item.uses, lang)}</span>
          {item.isPro && <span className="mk-cm-pro">{t.pro}</span>}
        </p>
      </div>
    </li>
  );
}

function Grid({ items, lang }: { items: CommunityCard[]; lang: Lang }) {
  return (
    <ul className="mk-cm-grid">
      {items.map((item) => (
        <Card key={item.code} item={item} lang={lang} />
      ))}
    </ul>
  );
}

function galleryHref(lang: Lang, sort: CommunitySort, q: string, page: number) {
  const query = new URLSearchParams();
  if (sort !== "popular") query.set("sort", sort);
  if (q) query.set("q", q);
  if (page > 1) query.set("page", String(page));
  const s = query.toString();
  return `${pagePath(lang, "community")}${s ? `?${s}` : ""}`;
}

/** The gallery: sort tabs, a search box (a plain form, so it works without scripts), the cards and paging. */
export function CommunityGallery({ lang, data, sort, q }: { lang: Lang; data: CommunityPage; sort: CommunitySort; q: string }) {
  const t = copy(lang).community;
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  return (
    <>
      <header className="mk-doc-head">
        <div className="mk-wrap">
          <p className="mk-kicker">{t.kicker}</p>
          <h1 className="mk-display mk-doc-title">{t.title}</h1>
          <p className="mk-cm-intro">{t.intro}</p>
        </div>
      </header>
      <section className="mk-wrap mk-cm-section" aria-label={t.kicker}>
        <div className="mk-cm-tools">
          <nav className="mk-cm-tabs" aria-label={t.kicker}>
            {(["popular", "new"] as const).map((s) => (
              <a key={s} href={galleryHref(lang, s, q, 1)} aria-current={s === sort ? "page" : undefined}>
                {s === "popular" ? t.popular : t.newest}
              </a>
            ))}
          </nav>
          <form className="mk-cm-search" role="search" action={pagePath(lang, "community")}>
            {sort !== "popular" && <input type="hidden" name="sort" value={sort} />}
            <label htmlFor="cm-q" className="mk-sr">
              {t.search}
            </label>
            <input id="cm-q" name="q" type="search" defaultValue={q} placeholder={t.search} maxLength={40} />
            <button type="submit" className="mk-btn mk-btn-dark mk-btn-sm">
              {t.searchButton}
            </button>
          </form>
        </div>
        {data.items.length ? <Grid items={data.items} lang={lang} /> : <p className="mk-cm-empty">{q ? t.emptySearch.replace("{q}", q) : t.empty}</p>}
        {pages > 1 && (
          <nav className="mk-cm-paging" aria-label={t.pageOf.replace("{page}", String(data.page)).replace("{pages}", String(pages))}>
            {data.page > 1 ? <a href={galleryHref(lang, sort, q, data.page - 1)}>{t.previous}</a> : <span />}
            <span>{t.pageOf.replace("{page}", String(data.page)).replace("{pages}", String(pages))}</span>
            {data.page < pages ? <a href={galleryHref(lang, sort, q, data.page + 1)}>{t.next}</a> : <span />}
          </nav>
        )}
        <p className="mk-cm-cta">{fill(t.publishCta, lang)}</p>
      </section>
    </>
  );
}

/** A template's share page: a big live preview, who made it, how to use it in the app, and links to share it. */
export function CommunityTemplatePage({ lang, detail, shareUrl, more }: { lang: Lang; detail: CommunityDetail; shareUrl: string; more: CommunityCard[] }) {
  const t = copy(lang).community;
  const item = detail.template;
  return (
    <>
      <section className="mk-wrap mk-cm-detail">
        <Preview code={item.code} name={item.name} lang={lang} large />
        <div className="mk-cm-detail-copy">
          <p className="mk-kicker">{t.kicker}</p>
          <h1 className="mk-display mk-cm-detail-title">{item.name}</h1>
          {item.description && <p className="mk-cm-intro">{item.description}</p>}
          <p className="mk-cm-meta">
            {t.by}{" "}
            <a href={publisherPath(lang, item.publisher.username)}>
              {item.publisher.displayName} <span dir="ltr">@{item.publisher.username}</span>
            </a>
          </p>
          <p className="mk-cm-row">
            <Swatches colors={item.colors} />
            <span>{uses(item.uses, lang)}</span>
            {item.isPro && <span className="mk-cm-pro">{t.pro}</span>}
          </p>
          <ShareActions url={shareUrl} title={item.name} labels={{ copy: t.copyLink, copied: t.copied, share: t.share }} />
          <div className="mk-cm-use">
            <h2>{t.useTitle}</h2>
            <ol>
              {t.useSteps.map((step, i) => (
                <li key={i}>
                  {fill(step, lang)}
                  {i === 1 && (
                    <span className="mk-cm-code" aria-label={t.code} dir="ltr">
                      {item.code}
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <p className="mk-cm-note">{t.useNote}</p>
            <StoreButtons lang={lang} note={false} />
          </div>
        </div>
      </section>
      {more.length > 0 && (
        <section className="mk-wrap mk-cm-section" aria-labelledby="cm-more">
          <h2 id="cm-more" className="mk-cm-subtitle">
            {t.moreBy.replace("{name}", item.publisher.displayName)}
          </h2>
          <Grid items={more} lang={lang} />
        </section>
      )}
      <p className="mk-wrap mk-cm-back">
        <a href={pagePath(lang, "community")}>{t.backToGallery}</a>
      </p>
    </>
  );
}

/** A publisher's page: name, username, bio and their listed designs. */
export function PublisherView({ lang, page }: { lang: Lang; page: PublisherPage }) {
  const t = copy(lang).community;
  const p = page.publisher;
  return (
    <>
      <header className="mk-doc-head">
        <div className="mk-wrap">
          <p className="mk-kicker">{t.publisherKicker}</p>
          <h1 className="mk-display mk-doc-title">{p.displayName}</h1>
          <p className="mk-cm-handle" dir="ltr">
            @{p.username}
          </p>
          {p.bio && <p className="mk-cm-intro">{p.bio}</p>}
        </div>
      </header>
      <section className="mk-wrap mk-cm-section" aria-labelledby="cm-pub">
        <h2 id="cm-pub" className="mk-cm-subtitle">
          {t.publisherTemplates.replace("{name}", p.displayName)}
        </h2>
        {page.templates.length ? <Grid items={page.templates} lang={lang} /> : <p className="mk-cm-empty">{t.empty}</p>}
      </section>
      <p className="mk-wrap mk-cm-back">
        <a href={pagePath(lang, "community")}>{t.backToGallery}</a>
      </p>
    </>
  );
}
