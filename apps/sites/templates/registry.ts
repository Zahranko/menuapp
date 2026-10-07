import { createElement, type ComponentType } from "react";
import type { TemplateProps } from "@/lib/types";
import FallbackTemplate from "./fallback/Template";
import SouqTemplate from "./souq/Template";

/**
 * Template id → component. Every folder with a manifest.json must be listed here
 * (checked by templates/registry.test.ts). The settings live in the manifest, the look in the component.
 */
export const templates: Record<string, ComponentType<TemplateProps>> = {
  souq: SouqTemplate,
};

export function templateFor(id: string): ComponentType<TemplateProps> {
  return templates[id] ?? FallbackTemplate;
}

/** Renders a site with its template's component. */
export function SiteTemplate(props: TemplateProps) {
  return createElement(templateFor(props.site.templateId), props);
}
