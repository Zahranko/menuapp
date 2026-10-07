import { Burger, Close, WhatsApp } from "../../_kit/icons";
import { Drawer } from "../../_kit/Drawer";
import { Picture } from "../../_kit/Picture";
import { initial } from "@/lib/format";
import type { SouqContext } from "../context";

export function navLinks(ctx: SouqContext): [string, string][] {
  const links: [string, string][] = [["#menu", ctx.t.menu]];
  if (ctx.on("story") && ctx.text("story.text")) links.push(["#story", ctx.t.story]);
  if (ctx.on("gallery") && ctx.gallery.length) links.push(["#gallery", ctx.t.gallery]);
  if (ctx.on("visit")) links.push(["#visit", ctx.t.visit]);
  return links;
}

export function Logo({ ctx }: { ctx: SouqContext }) {
  const logo = ctx.image("logo");
  return <span className="logo">{logo ? <Picture src={logo} sizes="40px" /> : initial(ctx.site.business.name)}</span>;
}

export function Header({ ctx }: { ctx: SouqContext }) {
  const links = navLinks(ctx);
  const order = ctx.contact.whatsapp && (
    <a className={`btn pri navCta`} href={ctx.contact.whatsapp} rel="noopener" target="_blank">
      <WhatsApp />
      {ctx.t.whatsapp}
    </a>
  );
  return (
    <header className="nav" data-section="header">
      <div className="navIn">
        <a className="brand" href="#top">
          <Logo ctx={ctx} />
          <span className="brandName">{ctx.site.business.name}</span>
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
            <a className={`btn pri`} href={ctx.contact.whatsapp} rel="noopener" target="_blank">
              <WhatsApp />
              {ctx.t.whatsapp}
            </a>
          )}
        </Drawer>
      </div>
    </header>
  );
}
