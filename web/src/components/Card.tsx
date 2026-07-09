import type { HTMLAttributes } from "react";
import type { DeckTheme } from "../lib/themes";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  theme?: DeckTheme;
  hoverLift?: boolean;
};

/** The pastel, extra-rounded surface every list item in the app is built on. */
function Card({ theme, hoverLift = false, className = "", children, ...rest }: CardProps) {
  const palette = theme ? `${theme.bg} ${theme.ring}` : "bg-white ring-stone-200";

  return (
    <div
      className={`rounded-3xl ring-2 ${palette} ${
        hoverLift ? "hover:-translate-y-1 transition-transform" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
