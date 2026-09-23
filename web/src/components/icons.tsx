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

export function SpeakerIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 9.5v5h3.2L12 18.3V5.7L7.2 9.5H4Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M16 9.2a4 4 0 0 1 0 5.6M18.6 6.6a7.8 7.8 0 0 1 0 10.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 12.5 10 17.5 19 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LockIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4.5" y="10" width="15" height="10.5" rx="3" fill="currentColor" />
      <path
        d="M8 10V7.5a4 4 0 0 1 8 0V10"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StarIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3.5 14.6 9l6 .85-4.35 4.2 1.05 5.95L12 17.2 6.7 20l1.05-5.95L3.4 9.85 9.4 9 12 3.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FlameIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M13 2.5c.8 3.2-.6 4.9-2 6.4-1.5 1.6-3 3.1-3 6.1a6 6 0 0 0 12 0c0-2.2-.9-3.8-1.9-5.2-.3 1-1 1.7-1.8 2 .3-3.5-1.4-7-3.3-9.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ChevronDownIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5.5 8.5 12 15l6.5-6.5"
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

/** An open book: grammar. */
export function BookIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 5.6c3-1.4 6-1.3 9 .6v13.4c-3-1.9-6-2-9-.6V5.6Z" fill="currentColor" />
      <path d="M21 5.6c-3-1.4-6-1.3-9 .6v13.4c3-1.9 6-2 9-.6V5.6Z" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

export function SearchIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6" stroke="currentColor" strokeWidth="2.6" />
      <path d="m15.2 15.2 4.8 4.8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/** Three stepping stones on a curve: the course path. */
export function PathIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="7" cy="18" r="3.2" fill="currentColor" />
      <circle cx="16.5" cy="12" r="3.2" fill="currentColor" opacity="0.75" />
      <circle cx="8.5" cy="5.5" r="3.2" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function XIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** A lightning bolt: a quick, mixed round. */
export function BoltIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M13.5 2.5 5 13.6h5.6L9.8 21.5l9.2-11.6h-5.8l.3-7.4Z" fill="currentColor" strokeLinejoin="round" />
    </svg>
  );
}

/** A bulb: a tip. */
export function BulbIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2.8a6.6 6.6 0 0 0-3.9 11.9c.7.5 1.1 1.3 1.1 2.1v.6h5.6v-.6c0-.8.4-1.6 1.1-2.1A6.6 6.6 0 0 0 12 2.8Z" fill="currentColor" />
      <path d="M9.6 19.4h4.8M10.4 21.4h3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** A clock face: when it comes back. */
export function ClockIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.6" fill="currentColor" />
      <path d="M12 7.4V12l3 2" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A ring with a dot: a miss counted. */
export function TargetIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="2.6" />
      <circle cx="12" cy="12" r="3.4" fill="currentColor" />
    </svg>
  );
}

/** A plus in a rounded square: add a word. */
export function PlusIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Two chain links: the chunks a word lives in. */
export function LinkIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** A little tree of three: the word's family. */
export function FamilyIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 8v4M12 12H6.5v4M12 12h5.5v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="5.5" r="3" fill="currentColor" />
      <circle cx="6.5" cy="18.5" r="2.6" fill="currentColor" opacity="0.75" />
      <circle cx="17.5" cy="18.5" r="2.6" fill="currentColor" opacity="0.75" />
    </svg>
  );
}

/** A speech bubble: an example sentence. */
export function QuoteIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5v-7Z" fill="currentColor" />
    </svg>
  );
}

/** A triangle with a bang: the one trap. */
export function AlertIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M10.3 4.2a2 2 0 0 1 3.4 0l7.4 12.9a2 2 0 0 1-1.7 3H4.6a2 2 0 0 1-1.7-3l7.4-12.9Z" fill="currentColor" />
      <path d="M12 9v4.6" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.35" fill="white" />
    </svg>
  );
}
