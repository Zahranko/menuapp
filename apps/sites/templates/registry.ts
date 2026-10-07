import { createElement, type ComponentType } from "react";
import type { TemplateProps } from "@/lib/types";
import FallbackTemplate from "./fallback/Template";
import AgencyTemplate from "./agency/Template";
import ArchStoryTemplate from "./archstory/Template";
import AtelierTemplate from "./atelier/Template";
import BentoTemplate from "./bento/Template";
import BistroCardTemplate from "./bistro/Template";
import ChalkBoardTemplate from "./chalkboard/Template";
import ClinicTemplate from "./clinic/Template";
import GardenTemplate from "./garden/Template";
import HandyTemplate from "./handy/Template";
import LinenListTemplate from "./linen/Template";
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
};

export function templateFor(id: string): ComponentType<TemplateProps> {
  return templates[id] ?? FallbackTemplate;
}

/** Renders a site with its template's component. */
export function SiteTemplate(props: TemplateProps) {
  return createElement(templateFor(props.site.templateId), props);
}
