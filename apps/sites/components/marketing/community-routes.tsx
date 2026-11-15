import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brand } from "@/lib/brand";
import { browseCommunity, getCommunityTemplate, getPublisherPage, type CommunitySort } from "@/lib/community";
import { copy, fill, type Lang } from "@/lib/marketing/copy";
import { marketingMetadata } from "@/lib/marketing/seo";
import { CommunityGallery, CommunityTemplatePage, publisherPath, PublisherView, templatePath } from "./community";
import { MarketingShell } from "./shell";

/** The community routes, shared by the English pages and their Arabic twins under /ar. */

type Search = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const other = (lang: Lang): Lang => (lang === "ar" ? "en" : "ar");

export async function galleryMetadata(lang: Lang, searchParams: Search): Promise<Metadata> {
  const meta = marketingMetadata(lang, "community");
  const params = await searchParams;
  // Search results and later pages are not worth indexing; the first page is.
  return one(params.q) || Number(one(params.page)) > 1 ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export async function GalleryRoute({ lang, searchParams }: { lang: Lang; searchParams: Search }) {
  const params = await searchParams;
  const sort: CommunitySort = one(params.sort) === "new" ? "new" : "popular";
  const q = one(params.q).trim().slice(0, 40);
  const page = Math.min(1000, Math.max(1, Number.parseInt(one(params.page), 10) || 1));
  const data = await browseCommunity(sort, q, page);
  return (
    <MarketingShell lang={lang} page="community">
      <CommunityGallery lang={lang} data={data} sort={sort} q={q} />
    </MarketingShell>
  );
}

const absolute = (path: string) => `https://${brand.domain}${path}`;

export async function templateMetadata(lang: Lang, code: string): Promise<Metadata> {
  const detail = await getCommunityTemplate(code);
  if (!detail) return { title: "Not found", robots: { index: false } };
  const t = copy(lang).community;
  const item = detail.template;
  const title = `${t.shareTitle.replace("{name}", item.name)} · ${lang === "ar" ? brand.brandNameAr : brand.brandName}`;
  const description = item.description || t.shareDescription.replace("{publisher}", item.publisher.displayName);
  const url = templatePath(lang, item.code);
  return {
    metadataBase: new URL(`https://${brand.domain}`),
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages: { en: templatePath("en", item.code), ar: templatePath("ar", item.code) } },
    openGraph: { title, description, url, type: "website", siteName: lang === "ar" ? brand.brandNameAr : brand.brandName },
    twitter: { card: "summary", title, description },
  };
}

export async function TemplateRoute({ lang, code }: { lang: Lang; code: string }) {
  const detail = await getCommunityTemplate(code);
  if (!detail) notFound();
  const item = detail.template;
  const publisher = await getPublisherPage(item.publisher.username);
  const more = (publisher?.templates ?? []).filter((t) => t.code !== item.code).slice(0, 4);
  // The API's link is absolute and follows the sites address; fixtures give a path.
  const shareUrl = item.shareUrl.startsWith("http") ? item.shareUrl : absolute(templatePath("en", item.code));
  return (
    <MarketingShell lang={lang} page="community" switchHref={templatePath(other(lang), item.code)}>
      <CommunityTemplatePage lang={lang} detail={detail} shareUrl={shareUrl} more={more} />
    </MarketingShell>
  );
}

export async function publisherMetadata(lang: Lang, username: string): Promise<Metadata> {
  const page = await getPublisherPage(username);
  if (!page) return { title: "Not found", robots: { index: false } };
  const t = copy(lang).community;
  const p = page.publisher;
  const title = t.publisherTitle.replace("{name}", p.displayName).replace("{username}", p.username);
  const description = p.bio || t.publisherDescription.replace("{name}", p.displayName);
  return {
    metadataBase: new URL(`https://${brand.domain}`),
    title: { absolute: fill(title, lang) },
    description,
    alternates: { canonical: publisherPath(lang, p.username), languages: { en: publisherPath("en", p.username), ar: publisherPath("ar", p.username) } },
  };
}

export async function PublisherRoute({ lang, username }: { lang: Lang; username: string }) {
  const page = await getPublisherPage(username);
  if (!page) notFound();
  return (
    <MarketingShell lang={lang} page="community" switchHref={publisherPath(other(lang), page.publisher.username)}>
      <PublisherView lang={lang} page={page} />
    </MarketingShell>
  );
}
