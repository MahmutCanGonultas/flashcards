type LogoProps = {
  size?: number;
  withText?: boolean;
};

/**
 * The mark is Tonton's face, flat and clean so it survives a favicon: big
 * amber-lit ears, big eyes, a small smile, peeking up from the bottom edge
 * of a cream tile. The same drawing is the app icon in public/icons.
 */
function Logo({ size = 36, withText = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="km-head" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#A78BFA" />
            <stop offset="0.55" stopColor="#7C5CE6" />
            <stop offset="1" stopColor="#5B3FCB" />
          </linearGradient>
          <linearGradient id="km-ear" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9C86F6" />
            <stop offset="1" stopColor="#5A3FCA" />
          </linearGradient>
          <linearGradient id="km-canal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FBBF24" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="km-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFBF2" />
            <stop offset="1" stopColor="#F7EBD6" />
          </linearGradient>
          <clipPath id="km-tile">
            <rect width="100" height="100" rx="22" />
          </clipPath>
        </defs>
        <rect width="100" height="100" rx="22" fill="url(#km-bg)" />
        <g clipPath="url(#km-tile)" transform="translate(0 13)">
          <g transform="rotate(-22 30 34)">
            <ellipse cx="30" cy="34" rx="15" ry="22" fill="url(#km-ear)" />
            <ellipse cx="31" cy="37" rx="8.5" ry="13.5" fill="url(#km-canal)" />
            <ellipse cx="31" cy="37" rx="4.5" ry="8" fill="#FDE68A" opacity="0.55" />
          </g>
          <g transform="rotate(22 70 34)">
            <ellipse cx="70" cy="34" rx="15" ry="22" fill="url(#km-ear)" />
            <ellipse cx="69" cy="37" rx="8.5" ry="13.5" fill="url(#km-canal)" />
            <ellipse cx="69" cy="37" rx="4.5" ry="8" fill="#FDE68A" opacity="0.55" />
          </g>
          <circle cx="50" cy="60" r="33" fill="url(#km-head)" />
          <ellipse cx="38" cy="44" rx="14" ry="9" fill="#fff" opacity="0.16" transform="rotate(-25 38 44)" />
          <ellipse cx="50" cy="70" rx="15" ry="10" fill="#F6E9D8" />
          <ellipse cx="38.5" cy="57" rx="8" ry="9.5" fill="#fff" />
          <ellipse cx="61.5" cy="57" rx="8" ry="9.5" fill="#fff" />
          <circle cx="40" cy="58.5" r="5.2" fill="#2B1B5E" />
          <circle cx="63" cy="58.5" r="5.2" fill="#2B1B5E" />
          <circle cx="38" cy="55.5" r="2" fill="#fff" />
          <circle cx="61" cy="55.5" r="2" fill="#fff" />
          <ellipse cx="29" cy="67" rx="5.5" ry="3.2" fill="#F472B6" opacity="0.45" />
          <ellipse cx="71" cy="67" rx="5.5" ry="3.2" fill="#F472B6" opacity="0.45" />
          <ellipse cx="50" cy="66.5" rx="3.2" ry="2.2" fill="#3A1F5C" />
          <path
            d="M44.5 72 Q50 77.5 55.5 72"
            stroke="#3A1F5C"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
      {withText && (
        <span className="text-xl font-extrabold tracking-tight text-stone-800">
          Kelimece
        </span>
      )}
    </div>
  );
}

export default Logo;
