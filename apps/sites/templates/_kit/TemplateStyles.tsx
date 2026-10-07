import styles from "../styles.generated.json";

/**
 * Loads one template's stylesheet (built by scripts/build-styles.mjs). React puts it in <head> and the page waits for it,
 * so only the template a site uses is downloaded.
 */
export function TemplateStyles({ id }: { id: string }) {
  const href = (styles as Record<string, string>)[id];
  return href ? <link rel="stylesheet" href={href} precedence="template" /> : null;
}
