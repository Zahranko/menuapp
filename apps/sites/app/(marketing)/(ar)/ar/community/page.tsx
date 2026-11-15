import type { Metadata } from "next";
import { galleryMetadata, GalleryRoute } from "@/components/marketing/community-routes";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return galleryMetadata("ar", searchParams);
}

export default function Page({ searchParams }: Props) {
  return <GalleryRoute lang="ar" searchParams={searchParams} />;
}
