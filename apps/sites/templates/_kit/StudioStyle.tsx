import { cleanStudioCss } from "@/lib/studio-css";

/**
 * The AI design studio's style sheet for a Studio site, cleaned and scoped to the site (lib/studio-css.ts). Written as raw
 * text, since entities don't work inside <style>; the cleaner already refused any "<", so it can't end the element.
 */
export function StudioStyle({ css }: { css: unknown }) {
  const clean = cleanStudioCss(css).css;
  return clean ? <style data-studio-css="" dangerouslySetInnerHTML={{ __html: clean }} /> : null;
}
