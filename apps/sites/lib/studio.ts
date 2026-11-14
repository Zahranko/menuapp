/*
 * The design studio's link between the owner app and the preview page it shows (only on /s-preview, never on a live site).
 *
 * The app talks to the page through `window.studio` (it calls these from its web view) and the page answers through the
 * app's `StudioBridge` channel (a JavaScript channel the app adds to its web view; JSON strings):
 *   window.studio.pick(true | false)  turn "tap a part to edit it" on or off
 *   window.studio.refresh()           show the latest saved draft in place, keeping the scroll position
 *   → {"type":"ready","version":1}    the page is ready for the calls above
 *   → {"type":"pick","section":"hero","element":"btn"}  the owner tapped a part (element: the data-k inside it, if any)
 *
 * Parts are the elements the kit and the templates already mark with data-section ("header", "hero", "menu", "story", …),
 * and the smaller pieces inside them with data-k ("btn", "photo", …). The same names are the hooks the AI style sheet uses.
 */

export const STUDIO_VERSION = 1;

export type StudioMessage =
  | { type: "ready"; version: number }
  | { type: "pick"; section: string; element: string | null };

/** The part of the page an element belongs to: its nearest data-section, and the nearest data-k between them. */
export function pickTarget(el: Element | null): { node: Element; section: string; element: string | null } | null {
  const section = el?.closest("[data-section]");
  const name = section?.getAttribute("data-section");
  if (!section || !name) return null;
  const piece = el?.closest("[data-k]");
  const element = piece && section.contains(piece) ? piece.getAttribute("data-k") : null;
  return { node: section, section: name, element: element || null };
}

/** Sends a message to the owner app, when the page is inside it. */
export function sendToApp(message: StudioMessage, win: Window = window): void {
  const channel = (win as unknown as { StudioBridge?: { postMessage?: (text: string) => void } }).StudioBridge;
  channel?.postMessage?.(JSON.stringify(message));
}
