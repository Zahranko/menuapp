import Image from "next/image";

/** A phone drawn in CSS around a screenshot (780×1688), with the island over the screenshot's empty status bar. */
export function Phone({ src, alt, className, priority = false, sizes }: { src: string; alt: string; className?: string; priority?: boolean; sizes: string }) {
  return (
    <div className={`mk-phone ${className ?? ""}`}>
      <div className="mk-phone-screen">
        <Image src={src} alt={alt} width={780} height={1688} sizes={sizes} priority={priority} />
      </div>
      <span className="mk-phone-island" aria-hidden="true" />
      <span className="mk-phone-btn mk-phone-btn-a" aria-hidden="true" />
      <span className="mk-phone-btn mk-phone-btn-b" aria-hidden="true" />
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
