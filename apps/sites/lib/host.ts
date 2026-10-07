import { headers } from "next/headers";
import { mainHosts } from "./routing";

/** The host this request came in on, and whether it is the brand's own domain (not a business's custom domain). */
export async function requestHost(): Promise<{ host: string; main: boolean }> {
  const host = ((await headers()).get("host") ?? "").toLowerCase().split(":")[0];
  return { host, main: mainHosts().has(host) };
}
