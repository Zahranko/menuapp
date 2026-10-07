import Image from "next/image";

const allowedHosts = new Set(
  (process.env.IMAGE_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
);

/** next/image optimizes photos from the storage hosts in IMAGE_HOSTS; SVG presets and other hosts are served as they are. */
function optimizable(src: string): boolean {
  if (src.toLowerCase().split("?")[0].endsWith(".svg")) return false;
  if (src.startsWith("/")) return true;
  try {
    return allowedHosts.has(new URL(src).hostname.toLowerCase());
  } catch {
    return false;
  }
}

type Props = {
  src: string;
  alt?: string;
  /** Sizes hint for responsive images, for example "(min-width: 760px) 50vw, 100vw". */
  sizes: string;
  /** The page's main image (hero): loaded first. */
  priority?: boolean;
  className?: string;
};

/** A picture that fills its positioned parent and is cropped to it. */
export function Picture({ src, alt = "", sizes, priority, className }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!optimizable(src)}
      className={className}
      style={{ objectFit: "cover" }}
    />
  );
}
