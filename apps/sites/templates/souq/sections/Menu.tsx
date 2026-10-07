import { itemCount } from "@/lib/i18n";
import { CategoryTabs } from "../../_kit/CategoryTabs";
import { Search } from "../../_kit/icons";
import { MenuSearch } from "../../_kit/MenuSearch";
import type { SouqContext } from "../context";
import { Thumb, thumbStyle } from "./Thumb";

export function Menu({ ctx }: { ctx: SouqContext }) {
  const { t, c, sections } = ctx;
  return (
    <section className={`block alt`} id="menu" data-section="menu" aria-labelledby="menu-title">
      <div className="wrap">
        <div className={`head headRow`}>
          <div className="headCol">
            <span className="eyebrow">{c.menuEyebrow}</span>
            <h2 id="menu-title">{c.menuTitle}</h2>
          </div>
          {sections.length > 0 && <MenuSearch menuId="menu-list" placeholder={t.search} className="search" icon={<Search />} />}
        </div>
        {sections.length > 1 && (
          <CategoryTabs categories={sections.map(({ anchor, name }) => ({ anchor, name }))} label={c.categories} className="tabs" tabClassName="tab" activeClassName="tabOn" />
        )}
        <div id="menu-list">
          {sections.map((section) => (
            <div key={section.id} className="cat" id={section.anchor} data-menu-cat>
              <h3>
                {section.name}
                <small>{itemCount(section.products.length, ctx.locale)}</small>
              </h3>
              <ul className="items">
                {section.products.map((item) => (
                  <li key={item.id} data-q={item.search}>
                    <button type="button" className={`item ${item.isAvailable ? "" : "itemOut"}`} data-item-id={item.id}>
                      <span className="th" style={thumbStyle(item)}>
                        <Thumb item={item} sizes="78px" />
                      </span>
                      <span>
                        <span className="nm">
                          <b>{item.name}</b>
                          {item.labelText && <span className="tag">{item.labelText}</span>}
                          {!item.isAvailable && <span className={`tag tagOut`}>{t.soldOut}</span>}
                        </span>
                        {item.description && <span className="desc">{item.description}</span>}
                      </span>
                      <span className="pr">{item.priceText}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="empty" data-menu-empty hidden={sections.length > 0}>
            {t.noResults}
          </p>
        </div>
      </div>
    </section>
  );
}
