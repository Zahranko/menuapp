import { createElement, type ComponentType } from "react";
import type { PublicSite, TemplateProps } from "@/lib/types";
import { pageTitle, resolvePage, type Page } from "./_premium/pages";
import FallbackTemplate from "./fallback/Template";
import AgencyTemplate from "./agency/Template";
import ArchStoryTemplate from "./archstory/Template";
import AtlasTemplate from "./atlas/Template";
import AtelierTemplate from "./atelier/Template";
import BentoTemplate from "./bento/Template";
import BistroCardTemplate from "./bistro/Template";
import BloomTemplate from "./bloom/Template";
import ChalkBoardTemplate from "./chalkboard/Template";
import ClinicTemplate from "./clinic/Template";
import EmberTemplate from "./ember/Template";
import GardenTemplate from "./garden/Template";
import HandyTemplate from "./handy/Template";
import LinenListTemplate from "./linen/Template";
import LumenTemplate from "./lumen/Template";
import MaisonTemplate from "./maison/Template";
import MonoGridTemplate from "./monogrid/Template";
import NeonDinerTemplate from "./neondiner/Template";
import NightMarketTemplate from "./nightmarket/Template";
import PizzeriaTemplate from "./pizzeria/Template";
import PocketCatalogTemplate from "./pocket/Template";
import PolaroidTemplate from "./polaroid/Template";
import PulseTemplate from "./pulse/Template";
import SouqTemplate from "./souq/Template";
import SpiceRouteTemplate from "./spiceroute/Template";
import TicketTemplate from "./ticket/Template";
import ZenTemplate from "./zen/Template";

/**
 * Template id → component. Every folder with a manifest.json must be listed here
 * (checked by templates/registry.test.ts). The settings live in the manifest, the look in the component.
 */
export const templates: Record<string, ComponentType<TemplateProps>> = {
  souq: SouqTemplate,
  linen: LinenListTemplate,
  nightmarket: NightMarketTemplate,
  archstory: ArchStoryTemplate,
  pocket: PocketCatalogTemplate,
  chalkboard: ChalkBoardTemplate,
  bento: BentoTemplate,
  neondiner: NeonDinerTemplate,
  zen: ZenTemplate,
  bistro: BistroCardTemplate,
  pizzeria: PizzeriaTemplate,
  ticket: TicketTemplate,
  garden: GardenTemplate,
  monogrid: MonoGridTemplate,
  spiceroute: SpiceRouteTemplate,
  polaroid: PolaroidTemplate,
  atelier: AtelierTemplate,
  clinic: ClinicTemplate,
  agency: AgencyTemplate,
  pulse: PulseTemplate,
  handy: HandyTemplate,
  maison: MaisonTemplate,
  lumen: LumenTemplate,
  atlas: AtlasTemplate,
  ember: EmberTemplate,
  bloom: BloomTemplate,
};

/** Pro templates with more than one page (category, best sellers, gallery, visit). Every other template is one page. */
export const multiPage = new Set<string>(["maison", "lumen", "atlas", "ember", "bloom"]);

/** The page at `path` for this site, or null when there is none (the route answers 404). */
export function pageOf(site: PublicSite, path: string[]): Page | null {
  if (path.length === 0) return { kind: "home" };
  return multiPage.has(site.templateId) ? resolvePage(site, path) : null;
}

/** Browser tab title of a page other than the home page. */
export function titleOf(site: PublicSite, page: Page): string | null {
  return pageTitle(site, page);
}

export function templateFor(id: string): ComponentType<TemplateProps> {
  return templates[id] ?? FallbackTemplate;
}

/** Renders a site with its template's component. */
export function SiteTemplate(props: TemplateProps) {
  return createElement(templateFor(props.site.templateId), props);
}
