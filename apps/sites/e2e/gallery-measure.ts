/**
 * Measures every gallery on the page (lists marked data-gallery), in the browser. Shared by e2e/gallery.spec.ts.
 * Returns one problem string per thing that is wrong; an empty list means every gallery shows only its photos and
 * every photo stays inside its tile, its tile inside the gallery and the gallery inside the page.
 */
export function galleryProblems(): string[] {
  const problems: string[] = [];
  const vw = document.documentElement.clientWidth;
  const slack = 1;
  const clips = (el: Element) => {
    const s = getComputedStyle(el);
    return s.overflowX !== "visible" || s.overflowY !== "visible" || s.contain.includes("paint");
  };
  const radius = (el: Element) => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  const inside = (a: DOMRect, b: DOMRect) => a.left >= b.left - slack && a.right <= b.right + slack && a.top >= b.top - slack && a.bottom <= b.bottom + slack;
  const same = (a: DOMRect, b: DOMRect) => Math.abs(a.left - b.left) <= slack && Math.abs(a.top - b.top) <= slack && Math.abs(a.width - b.width) <= slack && Math.abs(a.height - b.height) <= slack;
  const r = (b: DOMRect) => `${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}x${Math.round(b.height)}`;

  const lists = [...document.querySelectorAll<HTMLElement>("[data-gallery]")];
  // As drawn (tilted polaroids included): nothing may leave the page, unless it scrolls inside its own strip.
  lists.forEach((list, g) => {
    const lr = list.getBoundingClientRect();
    if (lr.width === 0) return;
    if (lr.left < -slack || lr.right > vw + slack) problems.push(`gallery ${g} is outside the page: ${r(lr)} (page ${vw})`);
    const scrolls = ["auto", "scroll"].includes(getComputedStyle(list).overflowX);
    if (scrolls) return;
    [...list.querySelectorAll("li, li *")].forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.width > 0 && (b.left < -slack || b.right > vw + slack)) problems.push(`gallery ${g}: ${el.tagName.toLowerCase()}.${el.classList[0] ?? ""} leaves the page: ${r(b)} (page ${vw})`);
    });
  });

  // The layout itself, without the templates' playful tilts and hover zooms.
  const still = document.createElement("style");
  still.textContent = "[data-gallery], [data-gallery] * { rotate: none !important; scale: none !important; translate: none !important; transform: none !important; transition: none !important; animation: none !important; }";
  document.head.append(still);
  lists.forEach((list, g) => {
    const lr = list.getBoundingClientRect();
    if (lr.width === 0) return;
    const text = (list.textContent ?? "").replace(/\s+/g, " ").trim();
    if (text) problems.push(`gallery ${g} shows text: "${text.slice(0, 60)}"`);
    const scrolls = getComputedStyle(list).overflowX === "auto" || getComputedStyle(list).overflowX === "scroll";
    [...list.children].forEach((tile, t) => {
      const tr = tile.getBoundingClientRect();
      if (tr.width < 4 || tr.height < 4) problems.push(`gallery ${g} tile ${t} is empty: ${r(tr)}`);
      if (!scrolls && !inside(tr, lr)) problems.push(`gallery ${g} tile ${t} is outside the gallery: ${r(tr)} vs ${r(lr)}`);
      const imgs = tile.querySelectorAll("img");
      if (imgs.length !== 1) problems.push(`gallery ${g} tile ${t} has ${imgs.length} photos`);
      imgs.forEach((img) => {
        if (!img.alt.trim() && !img.closest("[aria-label]")) problems.push(`gallery ${g} tile ${t} photo has no text for screen readers`);
        const fit = getComputedStyle(img).objectFit;
        if (fit !== "cover") problems.push(`gallery ${g} tile ${t} photo is not cropped (object-fit ${fit})`);
        // The nearest box that clips the photo, inside the tile.
        let clip: Element | null = null;
        for (let el = img.parentElement; el && tile.contains(el); el = el.parentElement) {
          if (clips(el)) {
            clip = el;
            break;
          }
        }
        const ir = img.getBoundingClientRect();
        if (!clip) {
          if (!inside(ir, tr)) problems.push(`gallery ${g} tile ${t} photo overflows its tile: ${r(ir)} vs ${r(tr)}`);
          if (Math.max(radius(tile), ...[...tile.querySelectorAll("*")].filter((e) => e.contains(img)).map(radius)) > radius(img) + 0.5)
            problems.push(`gallery ${g} tile ${t} photo escapes its rounded corners (nothing clips it)`);
          return;
        }
        const cr = clip.getBoundingClientRect();
        if (!inside(cr, tr)) problems.push(`gallery ${g} tile ${t} photo frame overflows its tile: ${r(cr)} vs ${r(tr)}`);
        // Any box the same size as the clipping box that is rounder than it would show the photo's square corners.
        const chain: Element[] = [];
        for (let el: Element | null = clip; el && tile.contains(el); el = el.parentElement) chain.push(el);
        if (tile !== clip) chain.push(tile);
        const rounder = chain.filter((el) => same(el.getBoundingClientRect(), cr)).some((el) => radius(el) > radius(clip!) + 0.5);
        if (rounder) problems.push(`gallery ${g} tile ${t} photo escapes its rounded corners (clip radius ${radius(clip)})`);
      });
    });
  });
  still.remove();
  return problems;
}
