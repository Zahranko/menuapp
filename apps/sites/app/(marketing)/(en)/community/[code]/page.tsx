import type { Metadata } from "next";
import { templateMetadata, TemplateRoute } from "@/components/marketing/community-routes";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return templateMetadata("en", (await params).code);
}

export default async function Page({ params }: Props) {
  return <TemplateRoute lang="en" code={(await params).code} />;
}
