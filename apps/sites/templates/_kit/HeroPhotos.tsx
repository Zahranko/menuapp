import type { SiteContext } from "./context";
import { heroOptions, sliderLabels } from "./hero";
import { HeroSlider } from "./HeroSlider";
import { Picture } from "./Picture";

type Props = {
  ctx: SiteContext;
  /** The photos, from heroPhotos(): one shows exactly as before, two or more take turns. */
  photos: string[];
  sizes: string;
  /** Buttons centered at the foot of the photo (a framed photo), or in its corner (text sits on the photo). */
  placement?: "center" | "corner";
};

/**
 * The hero's photo, or its slider once the owner adds more photos. Put it in the template's own positioned photo box:
 * the slider fills it, so the box keeps its size and shape whether there is one photo or six.
 */
export function HeroPhotos({ ctx, photos, sizes, placement = "center" }: Props) {
  if (photos.length === 0) return null;
  if (photos.length === 1) return <Picture src={photos[0]} sizes={sizes} priority />;
  const o = heroOptions(ctx.site.settings);
  return (
    <HeroSlider
      slides={photos.map((src, i) => (
        <Picture key={src} src={src} sizes={sizes} priority={i === 0} />
      ))}
      transition={o.transition}
      autoplay={o.autoplay}
      interval={o.interval}
      dots={o.dots}
      arrows={o.arrows}
      labels={sliderLabels(ctx.locale)}
      rtl={ctx.rtl}
      placement={placement}
    />
  );
}

/**
 * A strip of photos under the opening text, for templates that had no photo at the top. Nothing until the owner adds
 * photos ("hero.slides"), so their sites look as before.
 */
export function HeroBand({ ctx, photos, sizes = "(min-width: 1100px) 1040px, 100vw", className }: { ctx: SiteContext; photos: string[]; sizes?: string; className?: string }) {
  if (photos.length === 0) return null;
  return (
    <div className={className ? `kit-hero-band kit-hero-media ${className}` : "kit-hero-band kit-hero-media"} data-section="hero-photos">
      <HeroPhotos ctx={ctx} photos={photos} sizes={sizes} />
    </div>
  );
}
