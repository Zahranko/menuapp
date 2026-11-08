import type { PublicSite } from "@/lib/types";
import "../globals.css";
import "./kit.css";

/**
 * Paints the browser's top bar (the iPhone status bar area) and the page edges in the template's own colors.
 * The colors live in each template's CSS, so they are read from the rendered page: the top bar takes the color
 * at the top of the page, the page background takes the template's main background.
 */
const browserColors = `(function(){
  var clear = function(c){ return !c || c === "transparent" || /rgba\\(.*,\\s*0\\)$/.test(c); };
  var bgOf = function(el){
    for (; el && el !== document.documentElement; el = el.parentElement) {
      var c = getComputedStyle(el).backgroundColor;
      if (!clear(c)) return c;
    }
    return null;
  };
  var paint = function(){
    var page = null;
    for (var el = document.body.firstElementChild; el && !page; el = el.nextElementSibling) {
      var c = getComputedStyle(el).backgroundColor;
      if (!clear(c)) page = c;
    }
    var top = bgOf(document.elementFromPoint(window.innerWidth / 2, 1)) || page;
    if (page) { document.documentElement.style.backgroundColor = page; document.body.style.backgroundColor = page; }
    if (!top) return;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
    meta.content = top;
  };
  paint();
  window.addEventListener("load", paint);
})();`;

/** The document shell for a business site: language and direction come from the business locale. */
export function SiteDocument({ site, children }: { site: PublicSite | null; children: React.ReactNode }) {
  const lang = site?.business.locale === "ar" ? "ar" : "en";
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: browserColors }} />
      </body>
    </html>
  );
}
