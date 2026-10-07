import { revalidateTag } from "next/cache";
import { parseTags, SIGNATURE_HEADER, verify } from "@/lib/revalidate";

/** Called by the API's outbox dispatcher after content or design changes. */
export async function POST(request: Request) {
  const body = await request.text();
  if (!verify(body, request.headers.get(SIGNATURE_HEADER), process.env.REVALIDATE_SECRET)) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }

  const tags = parseTags(body);
  if (!tags) return Response.json({ error: "invalid tags" }, { status: 400 });

  // expire: 0 means the next visitor gets fresh HTML instead of a stale copy.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: tags });
}
