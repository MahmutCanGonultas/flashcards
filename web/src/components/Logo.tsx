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
          <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366F1" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <rect width="96" height="96" rx="24" fill="url(#logoGrad)" />
        <rect
          x="34"
          y="24"
          width="40"
          height="56"
          rx="9"
          fill="#ffffff"
          opacity="0.18"
        />
        <rect x="26" y="30" width="40" height="56" rx="9" fill="#ffffff" />
        <path
          d="M49 40 L37 66 L46 66 L41 84 L59 56 L49 56 Z"
          fill="url(#logoGrad)"
        />
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
