import type { Metadata } from "next";
import { publisherMetadata, PublisherRoute } from "@/components/marketing/community-routes";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return publisherMetadata("ar", (await params).username);
}

export default async function Page({ params }: Props) {
  return <PublisherRoute lang="ar" username={(await params).username} />;
}
