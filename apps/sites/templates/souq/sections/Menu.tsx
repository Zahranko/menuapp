import { CategoryTabs } from "../../_kit/CategoryTabs";
import { Search } from "../../_kit/icons";
import { MenuSearch } from "../../_kit/MenuSearch";
import type { SouqContext } from "../context";
import s from "../souq.module.css";
import { Thumb, thumbStyle } from "./Thumb";

export function Menu({ ctx }: { ctx: SouqContext }) {
  const { t, c, sections } = ctx;
  return (
    <section className={`${s.block} ${s.alt}`} id="menu" data-section="menu" aria-labelledby="menu-title">
      <div className={s.wrap}>
        <div className={`${s.head} ${s.headRow}`}>
          <div className={s.headCol}>
            <span className={s.eyebrow}>{c.menuEyebrow}</span>
            <h2 id="menu-title">{c.menuTitle}</h2>
          </div>
          {sections.length > 0 && <MenuSearch menuId="menu-list" placeholder={t.search} className={s.search} icon={<Search />} />}
        </div>
        {sections.length > 1 && (
          <CategoryTabs categories={sections.map(({ anchor, name }) => ({ anchor, name }))} label={c.categories} className={s.tabs} tabClassName={s.tab} activeClassName={s.tabOn} />
        )}
        <div id="menu-list">
          {sections.map((section) => (
            <div key={section.id} className={s.cat} id={section.anchor} data-menu-cat>
              <h3>
                {section.name}
                <small>
                  {section.products.length} {t.items}
                </small>
              </h3>
              <ul className={s.items}>
                {section.products.map((item) => (
                  <li key={item.id} data-q={item.search}>
                    <button type="button" className={`${s.item} ${item.isAvailable ? "" : s.itemOut}`} data-item-id={item.id}>
                      <span className={s.th} style={thumbStyle(item)}>
                        <Thumb item={item} sizes="78px" />
                      </span>
                      <span>
                        <span className={s.nm}>
                          <b>{item.name}</b>
                          {item.labelText && <span className={s.tag}>{item.labelText}</span>}
                          {!item.isAvailable && <span className={`${s.tag} ${s.tagOut}`}>{t.soldOut}</span>}
                        </span>
                        {item.description && <span className={s.desc}>{item.description}</span>}
                      </span>
                      <span className={s.pr}>{item.priceText}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className={s.empty} data-menu-empty hidden={sections.length > 0}>
            {t.noResults}
          </p>
        </div>
      </div>
    </section>
  );
}
