"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { pickTarget, sendToApp, STUDIO_VERSION } from "@/lib/studio";

/** Preview pages only: lets the owner app pick a part of the page by tapping it and refresh the page in place (lib/studio.ts). */
export function StudioBridge() {
  const router = useRouter();

  useEffect(() => {
    let outline: HTMLDivElement | null = null;
    let picked: Element | null = null;

    const place = () => {
      if (!outline || !picked) return;
      const r = picked.getBoundingClientRect();
      Object.assign(outline.style, { top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` });
    };

    const onClick = (event: MouseEvent) => {
      const target = pickTarget(event.target as Element | null);
      // While picking, a tap never follows a link or opens a sheet.
      event.preventDefault();
      event.stopPropagation();
      if (!target) return;
      picked = target.node;
      place();
      sendToApp({ type: "pick", section: target.section, element: target.element });
    };

    const pick = (on: boolean) => {
      if (on && !outline) {
        outline = document.createElement("div");
        outline.setAttribute("data-studio-outline", "");
        outline.setAttribute("aria-hidden", "true");
        Object.assign(outline.style, {
          position: "fixed",
          zIndex: "2147483647",
          pointerEvents: "none",
          border: "2px solid #2f80ed",
          borderRadius: "6px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.18)",
          transition: "all 160ms ease",
        });
        document.body.appendChild(outline);
        document.addEventListener("click", onClick, true);
        window.addEventListener("scroll", place, { passive: true });
        window.addEventListener("resize", place);
      } else if (!on && outline) {
        outline.remove();
        outline = null;
        picked = null;
        document.removeEventListener("click", onClick, true);
        window.removeEventListener("scroll", place);
        window.removeEventListener("resize", place);
      }
    };

    const api = { version: STUDIO_VERSION, pick, refresh: () => router.refresh() };
    (window as unknown as { studio?: typeof api }).studio = api;
    sendToApp({ type: "ready", version: STUDIO_VERSION });

    return () => {
      pick(false);
      delete (window as unknown as { studio?: typeof api }).studio;
    };
  }, [router]);

  return null;
}
