import { initial } from "@/lib/format";
import { Picture } from "../../_kit/Picture";
import { tintFor, type MenuItem } from "../../_kit/site-data";

/** A product's photo, or a tinted tile with its first letter when it has none. */
export function Thumb({ item, sizes }: { item: MenuItem; sizes: string }) {
  return item.imageUrl ? <Picture src={item.imageUrl} sizes={sizes} /> : <span className="initial">{initial(item.name)}</span>;
}

export const thumbStyle = (item: MenuItem) => ({ background: tintFor(item.name) });
