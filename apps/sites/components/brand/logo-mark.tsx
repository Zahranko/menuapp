import { brand } from "@/lib/brand";

/**
 * The logo mark (brand/favicon.svg), drawn inline from the brand colors: a "k" in paper on a
 * rounded square in the primary color, with the accent dot at the top right.
 * Decorative by default; pass `title` when the mark stands alone and has to be announced.
 * The default size follows the surrounding text, so it sits in a line like a letter.
 * `edge` adds a faint paper outline so the square still reads on dark backgrounds.
 */
export function LogoMark({
  size = "1.15em",
  title,
  className,
  style,
  edge = false,
}: {
  size?: number | string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  edge?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{ flex: "none", ...style }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <rect width="100" height="100" rx="26" fill={brand.colorPrimary} />
      {edge && <rect x="3" y="3" width="94" height="94" rx="23" fill="none" stroke={brand.colorPaper} strokeOpacity="0.5" strokeWidth="6" />}
      <path d="M38 28V72 M64 28 L42 50 L66 72" fill="none" stroke={brand.colorPaper} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="74" cy="30" r="9" fill={brand.colorAccent} />
    </svg>
  );
}

/** The "Made with" credit: the mark, then the localized line, as one link to the brand site.
 * Templates have light and dark footers, so the mark always carries its edge. */
export function MadeWithLink({ label, className }: { label: string; className?: string }) {
  return (
    <a href={`https://${brand.domain}`} className={className} style={{ display: "inline-flex", alignItems: "center", gap: "0.45em" }}>
      <LogoMark size="1.25em" edge />
      <span>{label}</span>
    </a>
  );
}
