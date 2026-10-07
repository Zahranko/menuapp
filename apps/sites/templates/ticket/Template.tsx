import type { TemplateProps } from "@/lib/types";
import {
  ContactList,
  Credits,
  HoursList,
  ProductSheet,
  TopBars,
} from "../_kit/blocks";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { WhatsApp } from "../_kit/icons";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";

const copy = {
  en: {
    menu: "Menu",
    where: "Find the truck",
    hours: "Hours",
    contact: "Contact",
    order: "Order ahead on WhatsApp",
    thanks: "Thank you, come again",
    total: "Items on the menu",
    jump: "Menu sections",
  },
  ar: {
    menu: "القائمة",
    where: "أين الشاحنة",
    hours: "ساعات العمل",
    contact: "تواصل",
    order: "اطلب مسبقًا عبر واتساب",
    thanks: "شكرًا لزيارتكم",
    total: "أصناف القائمة",
    jump: "أقسام القائمة",
  },
};

const PALETTES = {
  thermal: {
    bg: "#FFFFFF",
    surf: "#F4F4F1",
    ink: "#1D1D1B",
    muted: "#5D5D58",
    line: "#D6D6D0",
    desk: "#2B2D30",
  },
  kraft: {
    bg: "#FFFDF8",
    surf: "#F3EEE3",
    ink: "#22201C",
    muted: "#625D53",
    line: "#DDD5C6",
    desk: "#B98E5F",
  },
  mint: {
    bg: "#FBFFFD",
    surf: "#EEF6F2",
    ink: "#17231E",
    muted: "#53635B",
    line: "#D2E2DA",
    desk: "#5FA38A",
  },
  night: {
    bg: "#111412",
    surf: "#181C19",
    ink: "#D8F5DF",
    muted: "#93B39B",
    line: "#2C352F",
    desk: "#050605",
  },
};

/** A decorative barcode worked out from the business name, so it is the same on every visit. */
function barcode(name: string) {
  const widths = [...(name + name).slice(0, 34)].flatMap((ch) => [
    (ch.charCodeAt(0) % 3) + 1,
    (ch.charCodeAt(0) % 2) + 1,
  ]);
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  widths.forEach((w, i) => {
    if (i % 2 === 0) bars.push({ x, w });
    x += w + 1;
  });
  return { bars, width: x };
}

function Barcode({ name }: { name: string }) {
  const { bars, width } = barcode(name);
  return (
    <svg
      className="barcode"
      viewBox={`0 0 ${width} 44`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor">
        {bars.map((b) => (
          <rect key={b.x} x={b.x} y="0" width={b.w} height="44" />
        ))}
      </g>
    </svg>
  );
}

/** Template 012 "Ticket": a coffee truck menu printed as a till receipt, with zigzag edges and a barcode. */
export default function TicketTemplate({
  site,
  now,
}: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const stamp = ctx.text("stamp");
  const location = ctx.text("location");
  const count = ctx.sections.reduce((n, s) => n + s.products.length, 0);

  return (
    <div
      data-template="ticket"
      className={cx("t-ticket", fontVariables)}
      style={themeVars(site.settings, ctx.locale, {
        palettes: PALETTES,
        fonts: ["mono", "grotesk", "condensed"],
        defaultAccent: "#D3412F",
      })}
    >
      <TemplateStyles id="ticket" />
      <TopBars ctx={ctx} />
      <div className="desk">
        <div className="receipt">
          <header className="head" data-section="header">
            {stamp && (
              <span className="stamp" aria-hidden="true">
                {stamp}
              </span>
            )}
            <p className="stars" aria-hidden="true">
              * * * * * * * *
            </p>
            <h1>{site.business.name}</h1>
            {ctx.text("hero.title") && (
              <p className="sub">{ctx.text("hero.title")}</p>
            )}
            <p className="addr">{site.business.address}</p>
            {ctx.today && <p className="addr">{ctx.today}</p>}
            {ctx.sections.length > 1 && (
              <nav className="jump" aria-label={c.jump}>
                {ctx.sections.map((s) => (
                  <a key={s.id} href={`#${s.anchor}`}>
                    [{s.name}]
                  </a>
                ))}
              </nav>
            )}
          </header>

          <main>
            <section
              id="menu"
              className="menu"
              data-section="menu"
              aria-label={c.menu}
            >
              {ctx.sections.map((section) => (
                <section
                  key={section.id}
                  id={section.anchor}
                  className="group"
                  aria-labelledby={`${section.anchor}-h`}
                >
                  <h2 id={`${section.anchor}-h`} className="rule">
                    <span>{section.name}</span>
                  </h2>
                  <ul className="plain">
                    {section.products.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={cx("line", !item.isAvailable && "out")}
                          data-item-id={item.id}
                        >
                          <span className="line-top">
                            <span className="qty" aria-hidden="true">
                              1x
                            </span>
                            <span className="line-name">{item.name}</span>
                            <span className="dots" aria-hidden="true" />
                            <span className="line-price">{item.priceText}</span>
                          </span>
                          {(item.description ||
                            item.labelText ||
                            !item.isAvailable) && (
                            <span className="line-desc">
                              {item.labelText && (
                                <span className="tag">[{item.labelText}]</span>
                              )}
                              {!item.isAvailable && (
                                <span className="tag tag-out">
                                  [{ctx.t.soldOut}]
                                </span>
                              )}
                              {item.description}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              <p className="total">
                <span>{c.total}</span>
                <span className="dots" aria-hidden="true" />
                <span>{count}</span>
              </p>
            </section>

            {ctx.on("visit") && (
              <section
                id="visit"
                className="visit"
                data-section="visit"
                aria-labelledby="visit-title"
              >
                <h2 id="visit-title" className="rule">
                  <span>{c.where}</span>
                </h2>
                {location && <p className="today-spot">{location}</p>}
                {hasHours(ctx.hours) && (
                  <>
                    <h3>{c.hours}</h3>
                    <HoursList ctx={ctx} />
                  </>
                )}
                <h3>{c.contact}</h3>
                <ContactList ctx={ctx} />
                {ctx.contact.whatsapp && (
                  <a
                    className="order"
                    href={ctx.contact.whatsapp}
                    rel="noopener"
                    target="_blank"
                  >
                    <WhatsApp /> {c.order}
                  </a>
                )}
              </section>
            )}
          </main>

          <footer className="foot" data-section="footer">
            <p className="thanks">{ctx.text("thanks") || c.thanks}</p>
            <Barcode name={site.business.name} />
            <Credits ctx={ctx} />
          </footer>
        </div>
      </div>
      <ProductSheet ctx={ctx} />
    </div>
  );
}
