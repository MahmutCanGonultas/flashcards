export type MascotMood = "idle" | "happy" | "sad";

type MascotProps = {
  mood?: MascotMood;
  size?: number;
  className?: string;
};

/**
 * The app's character. Drawn as SVG rather than an image so it stays crisp at
 * every size and can swap expressions without loading anything.
 */
function Mascot({ mood = "idle", size = 96, className = "" }: MascotProps) {
  const eyeCurve =
    mood === "happy"
      ? "M74 92q8 -9 16 0"
      : mood === "sad"
        ? "M74 96q8 7 16 0"
        : null;
  const mouth =
    mood === "happy"
      ? "M84 118q16 18 32 0q-16 8 -32 0Z"
      : mood === "sad"
        ? "M88 124q12 -10 24 0"
        : "M88 118q12 10 24 0";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Mascot"
    >
      <defs>
        <radialGradient id="mascotBody" cx="35%" cy="28%" r="78%">
          <stop offset="0" stopColor="#A78BFA" />
          <stop offset="0.55" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#6D28D9" />
        </radialGradient>
        <radialGradient id="mascotBelly" cx="50%" cy="35%" r="70%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EDE9FE" />
        </radialGradient>
        <radialGradient id="mascotShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#3B0F82" stopOpacity="0.35" />
          <stop offset="1" stopColor="#3B0F82" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="178" rx="52" ry="12" fill="url(#mascotShadow)" />

      <ellipse cx="100" cy="112" rx="62" ry="60" fill="url(#mascotBody)" />
      <ellipse cx="100" cy="124" rx="40" ry="38" fill="url(#mascotBelly)" />

      <ellipse cx="46" cy="66" rx="16" ry="22" fill="#7C3AED" transform="rotate(-24 46 66)" />
      <ellipse cx="154" cy="66" rx="16" ry="22" fill="#7C3AED" transform="rotate(24 154 66)" />

      <ellipse cx="78" cy="96" rx="12" ry="13" fill="#FFFFFF" />
      <ellipse cx="122" cy="96" rx="12" ry="13" fill="#FFFFFF" />
      <circle cx="80" cy="98" r="6" fill="#2E1065" />
      <circle cx="124" cy="98" r="6" fill="#2E1065" />
      <circle cx="77.5" cy="94.5" r="2.4" fill="#FFFFFF" />
      <circle cx="121.5" cy="94.5" r="2.4" fill="#FFFFFF" />

      {eyeCurve && (
        <>
          <path d={eyeCurve} stroke="#2E1065" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path
            d={eyeCurve.replace("M74", "M110")}
            stroke="#2E1065"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}

      <path d={mouth} stroke="#2E1065" strokeWidth="4" strokeLinecap="round" fill="none" />

      <ellipse cx="82" cy="72" rx="18" ry="12" fill="#FFFFFF" opacity="0.18" />
    </svg>
  );
}

export default Mascot;
