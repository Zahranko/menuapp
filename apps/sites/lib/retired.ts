import registry from "@/templates/registry.json";

/** Retired template id → the live template its sites now use (templates/retired.json, copied into registry.json). */
export const retiredTemplates: Readonly<Record<string, string>> = Object.fromEntries(
  ((registry as { retired?: { id: string; replacedBy: string }[] }).retired ?? []).map((r) => [r.id, r.replacedBy]),
);

/**
 * The live template id for `id`: the replacement when `id` is a retired template, otherwise `id` itself.
 * The backend moves sites off a retired template when it imports the registry; this covers the time in between.
 */
export function liveTemplateId(id: string): string {
  return retiredTemplates[id] ?? id;
}
