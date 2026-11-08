import { copy, type Lang } from "@/lib/marketing/copy";
import { storeLinks, type StoreLinks } from "@/lib/marketing/stores";

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="mk-store-logo">
      <path
        fill="currentColor"
        d="M16.37 1.43c0 1.14-.5 2.27-1.18 3.08-.74.9-1.99 1.57-2.99 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.2-2.98.81-.94 2.15-1.64 3.25-1.68.03.13.06.28.06.43zm4.56 15.71c-.03.07-.46 1.58-1.52 3.12-.94 1.34-1.94 2.71-3.43 2.71-1.52 0-1.9-.88-3.63-.88-1.7 0-2.3.91-3.67.91-1.38 0-2.33-1.26-3.43-2.8-1.28-1.82-2.32-4.63-2.32-7.28 0-4.28 2.8-6.55 5.55-6.55 1.45 0 2.67.95 3.6.95.86 0 2.22-1.01 3.9-1.01.61 0 2.88.06 4.37 2.19-.13.09-2.38 1.37-2.38 4.19 0 3.26 2.85 4.42 2.96 4.45z"
      />
    </svg>
  );
}

function PlayLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="mk-store-logo">
      <path fill="#4285F4" d="M3.6 1.8C3.2 2 3 2.4 3 2.9v18.2c0 .5.2.9.6 1.1L13.4 12z" />
      <path fill="#34A853" d="M3.6 1.8 13.4 12l2.9-3L4.8 1.9c-.4-.3-.9-.3-1.2-.1z" />
      <path fill="#EA4335" d="M3.6 22.2c.3.2.8.2 1.2-.1L16.3 15l-2.9-3z" />
      <path fill="#FBBC04" d="M16.3 9 13.4 12l2.9 3 3.7-2.1c.8-.5.8-1.3 0-1.8z" />
    </svg>
  );
}

type Store = { id: "app-store" | "google-play"; url: string | null; small: string; name: string; logo: React.ReactNode };

/**
 * App Store and Google Play badges. Without a store link (brand.json "appStoreUrl" / "googlePlayUrl", see lib/marketing/stores.ts)
 * a badge is an inert button marked "Soon"; with one it is a plain link to the store.
 */
export function StoreButtons({ lang, links = storeLinks(), note = true }: { lang: Lang; links?: StoreLinks; note?: boolean }) {
  const t = copy(lang).stores;
  const stores: Store[] = [
    { id: "app-store", url: links.appStore, small: t.appStoreSmall, name: t.appStore, logo: <AppleLogo /> },
    { id: "google-play", url: links.googlePlay, small: t.playSmall, name: t.play, logo: <PlayLogo /> },
  ];
  const anyMissing = stores.some((s) => !s.url);

  return (
    <div className="mk-stores">
      <div className="mk-store-row">
        {stores.map((s) => {
          const inner = (
            <>
              {s.logo}
              <span className="mk-store-text">
                <small>{s.small}</small>
                <span lang="en" dir="ltr" className="mk-store-name">
                  {s.name}
                </span>
              </span>
              {!s.url && <span className="mk-store-soon">{t.soonBadge}</span>}
            </>
          );
          return s.url ? (
            <a key={s.id} className="mk-store" href={s.url} data-store={s.id} rel="noopener">
              {inner}
            </a>
          ) : (
            <button key={s.id} type="button" className="mk-store" data-store={s.id} aria-disabled="true">
              {inner}
            </button>
          );
        })}
      </div>
      {note && anyMissing && (
        <p className="mk-store-note">
          {t.soon.split(/(\{appStore\}|\{googlePlay\})/).map((part, i) =>
            part === "{appStore}" ? (
              <bdi key={i}>{t.appStore}</bdi>
            ) : part === "{googlePlay}" ? (
              <bdi key={i}>{t.play}</bdi>
            ) : (
              part
            ),
          )}
        </p>
      )}
    </div>
  );
}
