import { notFound } from "next/navigation";

/** Custom domains that no business uses end up here. */
export default function UnknownSite() {
  notFound();
}
