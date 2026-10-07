import { describe, expect, it } from "vitest";
import { parseTags, sign, verify } from "./revalidate";

const secret = "test-secret-0123456789";
const body = JSON.stringify({ tags: ["site:vanillamenu"] });

describe("revalidate signature", () => {
  it("accepts the API's signature", () => {
    expect(verify(body, sign(body, secret), secret)).toBe(true);
  });

  it("rejects a wrong or missing signature or secret", () => {
    expect(verify(body, sign(body, "other-secret"), secret)).toBe(false);
    expect(verify(body + " ", sign(body, secret), secret)).toBe(false);
    expect(verify(body, null, secret)).toBe(false);
    expect(verify(body, sign(body, secret), undefined)).toBe(false);
    expect(verify(body, "not-hex", secret)).toBe(false);
  });
});

describe("parseTags", () => {
  it("accepts site and host tags", () => {
    expect(parseTags(JSON.stringify({ tags: ["site:abc", "host:shop.example.com"] }))).toEqual(["site:abc", "host:shop.example.com"]);
  });

  it("rejects anything else", () => {
    expect(parseTags("nope")).toBeNull();
    expect(parseTags(JSON.stringify({ tags: [] }))).toBeNull();
    expect(parseTags(JSON.stringify({ tags: ["other:x"] }))).toBeNull();
    expect(parseTags(JSON.stringify({ tags: Array(51).fill("site:abc") }))).toBeNull();
  });
});
