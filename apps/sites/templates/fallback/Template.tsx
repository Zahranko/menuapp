import { formatPrice } from "@/lib/format";
import { label, madeWith, strings } from "@/lib/i18n";
import type { TemplateProps } from "@/lib/types";
import styles from "./fallback.module.css";

/** A plain, readable menu used when a site's template has no component (for example a template removed from the app). */
export default function FallbackTemplate({ site }: TemplateProps) {
  const { business } = site;
  const t = strings(business.locale);
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>{business.name}</h1>
        {business.address && <p>{business.address}</p>}
      </header>
      {site.categories.map((category) => (
        <section key={category.id} className={styles.category} aria-labelledby={`c-${category.id}`}>
          <h2 id={`c-${category.id}`}>{category.name}</h2>
          <ul>
            {category.products.map((product) => (
              <li key={product.id} className={product.isAvailable ? undefined : styles.out}>
                <div>
                  <strong>{product.name}</strong>
                  {product.label && <span className={styles.tag}>{label(product.label, business.locale)}</span>}
                  {!product.isAvailable && <span className={styles.tag}>{t.soldOut}</span>}
                  {product.description && <p>{product.description}</p>}
                </div>
                <span className={styles.price}>{formatPrice(product.price, business.currencyCode, business.locale)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <footer className={styles.footer}>{madeWith(business.locale)}</footer>
    </main>
  );
}
