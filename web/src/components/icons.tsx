type IconProps = {
  className?: string;
};

/** A stack of two offset cards — the app's deck glyph. */
export function CardsIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect
        x="3.5"
        y="6.5"
        width="11"
        height="14"
        rx="2.5"
        fill="currentColor"
        opacity="0.45"
        transform="rotate(-8 9 13.5)"
      />
      <rect
        x="9"
        y="3.5"
        width="11.5"
        height="15"
        rx="2.5"
        fill="currentColor"
      />
      <path
        d="M12.4 8.6h4.7M12.4 11.4h3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        className="text-stone-800/25"
        style={{ stroke: "rgba(0,0,0,0.18)" }}
      />
    </svg>
  );
}

export function PencilIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 20h4.2l10-10a2.1 2.1 0 0 0 0-3l-1.2-1.2a2.1 2.1 0 0 0-3 0l-10 10V20Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14.5 6.5 17.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TrashIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 7h14M10 7V5.5A1.5 1.5 0 0 1 11.5 4h1A1.5 1.5 0 0 1 14 5.5V7M6.5 7l.8 11a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.5 11v5M13.5 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowRightIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4.5 12h14m0 0-5-5m5 5-5 5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Decorative fan of cards, tucked into the corner of a deck tile. */
export function CardStackArt({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      <rect
        x="18"
        y="34"
        width="52"
        height="70"
        rx="10"
        fill="currentColor"
        opacity="0.35"
        transform="rotate(-16 44 69)"
      />
      <rect
        x="40"
        y="30"
        width="52"
        height="70"
        rx="10"
        fill="currentColor"
        opacity="0.55"
        transform="rotate(-4 66 65)"
      />
      <rect
        x="62"
        y="36"
        width="52"
        height="70"
        rx="10"
        fill="currentColor"
        opacity="0.75"
        transform="rotate(9 88 71)"
      />
    </svg>
  );
}
