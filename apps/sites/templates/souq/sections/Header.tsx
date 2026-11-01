import { Burger, Close, WhatsApp } from "../../_kit/icons";
import { Drawer } from "../../_kit/Drawer";
import { BrandName, Logo as KitLogo } from "../../_kit/blocks";
import type { SouqContext } from "../context";

export function navLinks(ctx: SouqContext): [string, string][] {
  const links: [string, string][] = [["#menu", ctx.t.menu]];
  if (ctx.on("story") && ctx.text("story.text")) links.push(["#story", ctx.t.story]);
  if (ctx.on("gallery") && ctx.gallery.length) links.push(["#gallery", ctx.t.gallery]);
  if (ctx.on("visit")) links.push(["#visit", ctx.t.visit]);
  return links;
}

export function Logo({ ctx }: { ctx: SouqContext }) {
  return <KitLogo ctx={ctx} sizes="40px" />;
}

export function Header({ ctx }: { ctx: SouqContext }) {
  const links = navLinks(ctx);
  const order = ctx.contact.whatsapp && (
    <a data-k="btn" className={`btn pri navCta`} href={ctx.contact.whatsapp} rel="noopener" target="_blank">
      <WhatsApp />
      {ctx.t.whatsapp}
    </a>
  );
  return (
    <header className="nav" data-section="header">
      <div className="navIn kit-head">
        <a className="brand kit-lockup" href="#top">
          <Logo ctx={ctx} />
          <BrandName ctx={ctx} className="brandName" />
        </a>
        <nav className="links" aria-label={ctx.c.mainNav}>
          {links.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        {order}
        <Drawer openLabel={ctx.t.openMenu} closeLabel={ctx.t.close} buttonClassName="burger" panelClassName="drawer" icon={<Burger />} closeIcon={<Close />}>
          {links.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
          {ctx.contact.whatsapp && (
            <a data-k="btn" className={`btn pri`} href={ctx.contact.whatsapp} rel="noopener" target="_blank">
              <WhatsApp />
              {ctx.t.whatsapp}
            </a>
          )}
        </Drawer>
      </div>
    </header>
  );
}
