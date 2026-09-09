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
          <linearGradient id="logoDeckBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366F1" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient
            id="logoDeckFold"
            x1="50"
            y1="18"
            x2="66"
            y2="34"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#4338CA" />
            <stop offset="1" stopColor="#6D28D9" />
          </linearGradient>
        </defs>
        <rect width="96" height="96" rx="24" fill="url(#logoDeckBg)" />
        <rect
          x="30"
          y="28"
          width="44"
          height="58"
          rx="10"
          fill="#ffffff"
          fillOpacity="0.4"
          transform="rotate(9 52 57)"
        />
        <path
          d="M32 18 L50 18 L66 34 L66 66 Q66 76 56 76 L32 76 Q22 76 22 66 L22 28 Q22 18 32 18 Z"
          fill="#ffffff"
        />
        <path d="M50 18 L66 18 L66 34 Z" fill="url(#logoDeckFold)" />
      </svg>

      {withText && (
        <span className="font-extrabold tracking-tight text-lg text-stone-800">
          Flashcards
        </span>
      )}
    </div>
  );
}

export default Logo;
