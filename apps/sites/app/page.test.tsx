import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { brand } from "@/lib/brand";
import Home from "./page";

describe("home page", () => {
  it("shows the brand name and tagline", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: brand.brandName })).toBeDefined();
    expect(screen.getByText(brand.tagline)).toBeDefined();
  });
});
