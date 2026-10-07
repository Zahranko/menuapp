import { Bean, Clock, Wheat } from "../../_kit/icons";
import type { SouqContext } from "../context";

const ICONS = [Bean, Wheat, Clock];

export function Highlights({ ctx }: { ctx: SouqContext }) {
  const items = [1, 2, 3].map((n) => ({ title: ctx.text(`highlights.${n}.title`), text: ctx.text(`highlights.${n}.text`), Icon: ICONS[n - 1] })).filter((h) => h.title);
  if (!items.length) return null;
  return (
    <div className="hl" data-section="highlights">
      {items.map(({ title, text, Icon }) => (
        <div key={title}>
          <span className="hlIcon">
            <Icon />
          </span>
          <div>
            <h2>{title}</h2>
            {text && <p>{text}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
