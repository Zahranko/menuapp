import Image from "next/image";

/**
 * An iPhone drawn in CSS around a screenshot (780×1688, the top 118px left empty): titanium frame, thin black bezel,
 * the Dynamic Island and a status bar. `tone` is the status bar's text color: "light" on dark screens.
 */
export function Phone({
  src,
  alt,
  className,
  priority = false,
  sizes,
  tone = "dark",
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes: string;
  tone?: "light" | "dark";
}) {
  return (
    <div className={`mk-phone ${className ?? ""}`}>
      <span className="mk-phone-key mk-phone-key-action" aria-hidden="true" />
      <span className="mk-phone-key mk-phone-key-up" aria-hidden="true" />
      <span className="mk-phone-key mk-phone-key-down" aria-hidden="true" />
      <span className="mk-phone-key mk-phone-key-side" aria-hidden="true" />
      <div className="mk-phone-screen">
        <Image src={src} alt={alt} width={780} height={1688} sizes={sizes} priority={priority} />
        <div className={`mk-phone-status mk-phone-status-${tone}`} aria-hidden="true">
          <span className="mk-phone-time">9:41</span>
          <span className="mk-phone-icons" dir="ltr">
            <svg viewBox="0 0 18 12" className="mk-phone-signal">
              <rect x="0" y="8" width="3" height="4" rx="1" />
              <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
              <rect x="10" y="3" width="3" height="9" rx="1" />
              <rect x="15" y="0" width="3" height="12" rx="1" />
            </svg>
            <svg viewBox="0 0 16 12" className="mk-phone-wifi">
              <path d="M8 2.4c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.7 10.7 0 0 0 8 .6 10.7 10.7 0 0 0 .5 3.6l1.2 1.3A9 9 0 0 1 8 2.4zm0 3.6c1.4 0 2.7.5 3.7 1.4l1.2-1.3A7.2 7.2 0 0 0 8 4.2c-1.8 0-3.5.7-4.9 1.9l1.2 1.3C5.3 6.5 6.6 6 8 6zm0 3.4c-.7 0-1.3.3-1.8.7L8 12l1.8-1.9c-.5-.4-1.1-.7-1.8-.7z" />
            </svg>
            <svg viewBox="0 0 27 12" className="mk-phone-battery">
              <rect x="0.5" y="0.5" width="23" height="11" rx="3.4" fill="none" stroke="currentColor" opacity="0.4" />
              <rect x="2" y="2" width="20" height="8" rx="2" />
              <path d="M25 4v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2z" opacity="0.45" />
            </svg>
          </span>
        </div>
        <span className="mk-phone-island" aria-hidden="true" />
      </div>
    </div>
  );
}

/** A decorative QR code: real finder squares, the rest a fixed pseudo-random pattern. */
export function QrArt({ className }: { className?: string }) {
  const n = 21;
  const cells: string[] = [];
  let seed = 7;
  const finder = (x: number, y: number) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      if (!finder(x, y) && seed % 100 < 46) cells.push(`M${x} ${y}h1v1h-1z`);
    }
  }
  const eye = (x: number, y: number) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
  return (
    <svg viewBox="-1 -1 23 23" className={className} aria-hidden="true" focusable="false" shapeRendering="crispEdges">
      <path d={cells.join("")} fill="currentColor" />
      <path d={`${eye(0, 0)}${eye(n - 7, 0)}${eye(0, n - 7)}`} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

export function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d="M5 12.5 10 17.5 19 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d="M12 2c.6 4.8 2.7 7.4 8 8.4v1.2c-5.3 1-7.4 3.6-8 8.4h-.2c-.6-4.8-2.7-7.4-8-8.4v-1.2c5.3-1 7.4-3.6 8-8.4z" fill="currentColor" />
    </svg>
  );
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`mk-arrow ${className ?? ""}`} aria-hidden="true" focusable="false">
      <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
