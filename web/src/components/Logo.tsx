type LogoProps = {
  size?: number;
  withText?: boolean;
};

function Logo({ size = 36, withText = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366F1" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
          <radialGradient id="logoHighlight" cx="26%" cy="18%" r="50%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="logoBar" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#F59E0B" />
            <stop offset="1" stopColor="#FB923C" />
          </linearGradient>
          <clipPath id="logoTile">
            <rect width="96" height="96" rx="21" />
          </clipPath>
        </defs>

        <rect width="96" height="96" rx="21" fill="url(#logoBg)" />
        <rect width="96" height="96" rx="21" fill="url(#logoHighlight)" clipPath="url(#logoTile)" />

        <rect
          x="19"
          y="34"
          width="46"
          height="34"
          rx="8"
          fill="#3B0F82"
          opacity="0.35"
          transform="rotate(-8 42 51)"
        />
        <rect
          x="21"
          y="31"
          width="46"
          height="34"
          rx="8"
          fill="#ffffff"
          transform="rotate(5 44 48)"
        />

        <g transform="rotate(5 44 48)">
          <rect x="29" y="43" width="20" height="4" rx="2" fill="#C4B5FD" />
          <rect x="29" y="51" width="13" height="4" rx="2" fill="#DDD6FE" />
        </g>

        {/* Equalizer bars: this card has sound -- tap-to-hear pronunciation is core to the app. */}
        <g>
          <rect x="60" y="16" width="7" height="17" rx="3.5" fill="url(#logoBar)" />
          <rect x="69" y="9" width="7" height="31" rx="3.5" fill="url(#logoBar)" />
          <rect x="78" y="13" width="7" height="23" rx="3.5" fill="url(#logoBar)" />
        </g>
      </svg>

      {withText && (
        <span className="font-extrabold tracking-tight text-lg text-stone-800">
          Kelimece
        </span>
      )}
    </div>
  );
}

export default Logo;
