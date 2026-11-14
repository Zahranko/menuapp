import { describe, expect, it, vi } from "vitest";
import { pickTarget, sendToApp } from "./studio";

describe("pickTarget", () => {
  const page = () => {
    document.body.innerHTML = `
      <header data-section="header"><a id="logo" href="/">Logo</a></header>
      <section data-section="hero"><h1 id="title">Hi</h1><a id="cta" data-k="btn" href="#menu"><span id="cta-text">Order</span></a></section>
      <div data-k="photo"><section data-section="story"><p id="story">Text</p></section></div>
      <p id="loose">Outside</p>`;
    return (id: string) => document.getElementById(id);
  };

  it("finds the section a tap is in", () => {
    const $ = page();
    expect(pickTarget($("logo"))).toMatchObject({ section: "header", element: null });
    expect(pickTarget($("title"))).toMatchObject({ section: "hero", element: null });
  });

  it("names the piece inside the section", () => {
    const $ = page();
    const hit = pickTarget($("cta-text"));
    expect(hit).toMatchObject({ section: "hero", element: "btn" });
    expect(hit?.node.getAttribute("data-section")).toBe("hero");
  });

  it("ignores a data-k that wraps the section", () => {
    const $ = page();
    expect(pickTarget($("story"))).toMatchObject({ section: "story", element: null });
  });

  it("finds nothing outside a section", () => {
    const $ = page();
    expect(pickTarget($("loose"))).toBeNull();
    expect(pickTarget(null)).toBeNull();
  });
});

describe("sendToApp", () => {
  it("posts JSON to the app's channel", () => {
    const postMessage = vi.fn();
    sendToApp({ type: "pick", section: "menu", element: null }, { StudioBridge: { postMessage } } as unknown as Window);
    expect(postMessage).toHaveBeenCalledWith('{"type":"pick","section":"menu","element":null}');
  });

  it("does nothing outside the app", () => {
    expect(() => sendToApp({ type: "ready", version: 1 }, {} as Window)).not.toThrow();
  });
});
