export type MascotMood = "idle" | "happy" | "sad";

type MascotProps = {
  mood?: MascotMood;
  size?: number;
  className?: string;
};

/**
 * Tonton — the app's character. Big ears because the whole point is listening
 * to words, and the logo's three amber bars on its belly for the same reason.
 *
 * Inline SVG rather than an image file, so it stays crisp at every size and can
 * change expression instantly with nothing to fetch mid-answer. Only the mouth
 * and brows differ between moods; the body is shared.
 *
 * Motion lives in index.css, keyed off the `tt-*` classes: the body breathes,
 * the ears twitch now and then, a happy Tonton hops and waves, a sad one
 * droops. Nothing here waits on any of it, and prefers-reduced-motion stills
 * all of it.
 */
function Mascot({ mood = "idle", size = 96, className = "" }: MascotProps) {
  const mouth =
    mood === "sad" ? (
      <>
        <path
          d="M91 125.5C95 120.5 105 120.5 109 125.5"
          stroke="#3A1F5C"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M68 63C73 58.5 80 58 85 60.5"
          stroke="#3A2668"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
        />
        <path
          d="M132 63C127 58.5 120 58 115 60.5"
          stroke="#3A2668"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
        />
      </>
    ) : mood === "happy" ? (
      // Open mouth with a tongue, scaled up — the "you got it" face.
      <g transform="translate(100 121) scale(1.35) translate(-100 -121)">
        <path d="M92 116.5C95 113.5 105 113.5 108 116.5C108 125 104.2 127.5 100 127.5C95.8 127.5 92 125 92 116.5Z" fill="#3A1F5C"/>
        <g clipPath="url(#tt-cMouth)">
          <ellipse cx="100" cy="127.5" rx="6.8" ry="4.6" fill="#FB7185"/>
          <ellipse cx="100" cy="115" rx="9.5" ry="3" fill="#1D0F33" opacity="0.5" filter="url(#tt-b1)"/>
        </g>
      </g>
    ) : (
      // Resting face: a closed smile. An open mouth here reads as alarmed,
      // and at 40px the dark oval collapses into a smudge.
      <path
        d="M92.5 116.5C95.5 123 104.5 123 107.5 116.5"
        stroke="#3A1F5C"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
    );

  return (
    <svg
      width={size}
      height={size}
      className={`tt-mascot tt-${mood} ${className}`}
      aria-label="Tonton"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      role="img"
    >
      <defs>
        <radialGradient id="tt-head" gradientUnits="userSpaceOnUse" cx="72" cy="56" r="96">
          <stop offset="0" stopColor="#D2C7FF"/>
          <stop offset="0.34" stopColor="#9C88F9"/>
          <stop offset="0.68" stopColor="#7461EC"/>
          <stop offset="1" stopColor="#48329F"/>
        </radialGradient>
        <radialGradient id="tt-body" gradientUnits="userSpaceOnUse" cx="72" cy="116" r="88">
          <stop offset="0" stopColor="#B7A6FC"/>
          <stop offset="0.42" stopColor="#8271F2"/>
          <stop offset="0.78" stopColor="#5B47CE"/>
          <stop offset="1" stopColor="#3B2894"/>
        </radialGradient>
        <radialGradient id="tt-earL" gradientUnits="userSpaceOnUse" cx="44" cy="26" r="76">
          <stop offset="0" stopColor="#CFC3FF"/>
          <stop offset="0.45" stopColor="#8B79F5"/>
          <stop offset="1" stopColor="#452F9F"/>
        </radialGradient>
        <radialGradient id="tt-earR" gradientUnits="userSpaceOnUse" cx="126" cy="28" r="74">
          <stop offset="0" stopColor="#C2B3FE"/>
          <stop offset="0.45" stopColor="#7F6DF1"/>
          <stop offset="1" stopColor="#3E2A93"/>
        </radialGradient>
        <radialGradient id="tt-canL" gradientUnits="userSpaceOnUse" cx="46" cy="36" r="52">
          <stop offset="0" stopColor="#FDE8A0"/>
          <stop offset="0.42" stopColor="#F9B72C"/>
          <stop offset="1" stopColor="#9C4409"/>
        </radialGradient>
        <radialGradient id="tt-canR" gradientUnits="userSpaceOnUse" cx="148" cy="34" r="54">
          <stop offset="0" stopColor="#FBDC85"/>
          <stop offset="0.42" stopColor="#F3AB20"/>
          <stop offset="1" stopColor="#8E3A07"/>
        </radialGradient>
        <radialGradient id="tt-belly" gradientUnits="userSpaceOnUse" cx="84" cy="134" r="58">
          <stop offset="0" stopColor="#FFFAF0"/>
          <stop offset="0.55" stopColor="#F6E6C9"/>
          <stop offset="1" stopColor="#DCBE96"/>
        </radialGradient>
        <radialGradient id="tt-muzzle" gradientUnits="userSpaceOnUse" cx="88" cy="102" r="42">
          <stop offset="0" stopColor="#FFFCF6"/>
          <stop offset="0.6" stopColor="#F4E7D6"/>
          <stop offset="1" stopColor="#D8BEB4"/>
        </radialGradient>
        <radialGradient id="tt-foot" gradientUnits="userSpaceOnUse" cx="66" cy="162" r="76">
          <stop offset="0" stopColor="#FFF9EC"/>
          <stop offset="0.5" stopColor="#F3E0BF"/>
          <stop offset="1" stopColor="#CFAA7C"/>
        </radialGradient>
        <linearGradient id="tt-armL" gradientUnits="userSpaceOnUse" x1="46" y1="130" x2="76" y2="156">
          <stop offset="0" stopColor="#B3A2FB"/>
          <stop offset="0.5" stopColor="#7C69EF"/>
          <stop offset="1" stopColor="#422D9C"/>
        </linearGradient>
        <linearGradient id="tt-armR" gradientUnits="userSpaceOnUse" x1="140" y1="112" x2="170" y2="140">
          <stop offset="0" stopColor="#AE9DFA"/>
          <stop offset="0.5" stopColor="#7764ED"/>
          <stop offset="1" stopColor="#3E2A95"/>
        </linearGradient>
        <radialGradient id="tt-eyeL" gradientUnits="userSpaceOnUse" cx="73" cy="71" r="36">
          <stop offset="0" stopColor="#FFFFFF"/>
          <stop offset="0.55" stopColor="#FAF7FF"/>
          <stop offset="1" stopColor="#D2C5EC"/>
        </radialGradient>
        <radialGradient id="tt-eyeR" gradientUnits="userSpaceOnUse" cx="113" cy="71" r="36">
          <stop offset="0" stopColor="#FFFFFF"/>
          <stop offset="0.55" stopColor="#FAF7FF"/>
          <stop offset="1" stopColor="#CFC2EA"/>
        </radialGradient>
        <radialGradient id="tt-irisL" gradientUnits="userSpaceOnUse" cx="77" cy="78" r="16">
          <stop offset="0" stopColor="#7C6BF0"/>
          <stop offset="0.5" stopColor="#3B2A9E"/>
          <stop offset="1" stopColor="#1A1046"/>
        </radialGradient>
        <radialGradient id="tt-irisR" gradientUnits="userSpaceOnUse" cx="115" cy="78" r="16">
          <stop offset="0" stopColor="#7263EA"/>
          <stop offset="0.5" stopColor="#372795"/>
          <stop offset="1" stopColor="#170E3F"/>
        </radialGradient>
        <linearGradient id="tt-bar" gradientUnits="userSpaceOnUse" x1="100" y1="156" x2="100" y2="136">
          <stop offset="0" stopColor="#F59E0B"/>
          <stop offset="1" stopColor="#FB923C"/>
        </linearGradient>
        <linearGradient id="tt-rim" gradientUnits="userSpaceOnUse" x1="40" y1="18" x2="158" y2="182">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.62"/>
          <stop offset="0.34" stopColor="#FFFFFF" stopOpacity="0.09"/>
          <stop offset="0.60" stopColor="#1E1147" stopOpacity="0.10"/>
          <stop offset="1" stopColor="#1E1147" stopOpacity="0.58"/>
        </linearGradient>
        <linearGradient id="tt-rimWarm" gradientUnits="userSpaceOnUse" x1="52" y1="152" x2="146" y2="186">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.75"/>
          <stop offset="0.4" stopColor="#FFFFFF" stopOpacity="0.05"/>
          <stop offset="1" stopColor="#7A4A18" stopOpacity="0.50"/>
        </linearGradient>
        <filter id="tt-b1" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="1.2"/></filter>
        <filter id="tt-b2" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="2.2"/></filter>
        <filter id="tt-b4" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4"/></filter>
        <filter id="tt-b6" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="6"/></filter>
        <clipPath id="tt-cHead"><ellipse cx="100" cy="88" rx="50" ry="46"/></clipPath>
        <clipPath id="tt-cBody"><ellipse cx="100" cy="145" rx="42" ry="35"/></clipPath>
        <clipPath id="tt-cBelly"><ellipse cx="100" cy="151" rx="27" ry="19"/></clipPath>
        <clipPath id="tt-cEarL"><path d="M40.8 21.4C52.8 15.8 69.4 25.8 77.8 43.9C86.2 61.9 83.2 81 71.2 86.6C59.2 92.2 42.7 82.2 34.3 64.1C25.9 46.1 28.8 27 40.8 21.4Z"/></clipPath>
        <clipPath id="tt-cEarR"><path d="M159.2 21.4C147.2 15.8 130.6 25.8 122.2 43.9C113.8 61.9 116.8 81 128.8 86.6C140.8 92.2 157.3 82.2 165.7 64.1C174.1 46.1 171.2 27 159.2 21.4Z"/></clipPath>
        <clipPath id="tt-cCanL"><path d="M44.4 32.3C52.4 28.6 63.7 35.7 69.5 48.2C75.3 60.8 73.6 73.9 65.6 77.7C57.6 81.4 46.3 74.3 40.5 61.8C34.7 49.2 36.4 36.1 44.4 32.3Z"/></clipPath>
        <clipPath id="tt-cCanR"><path d="M155.6 32.3C147.6 28.6 136.3 35.7 130.5 48.2C124.7 60.8 126.4 73.9 134.4 77.7C142.4 81.4 153.7 74.3 159.5 61.8C165.3 49.2 163.6 36.1 155.6 32.3Z"/></clipPath>
        <clipPath id="tt-cFootL"><ellipse cx="75" cy="171" rx="19.5" ry="10.5"/></clipPath>
        <clipPath id="tt-cFootR"><ellipse cx="125" cy="171" rx="19.5" ry="10.5"/></clipPath>
        <clipPath id="tt-cEyeL"><ellipse cx="80" cy="80" rx="15.5" ry="17"/></clipPath>
        <clipPath id="tt-cEyeR"><ellipse cx="120" cy="80" rx="15.5" ry="17"/></clipPath>
        <clipPath id="tt-cMouth"><path d="M92 116.5C95 113.5 105 113.5 108 116.5C108 125 104.2 127.5 100 127.5C95.8 127.5 92 125 92 116.5Z"/></clipPath>
      </defs>
      <g>
        <ellipse cx="100" cy="181" rx="50" ry="6.5" fill="#3B2B60" opacity="0.20" filter="url(#tt-b6)"/>
        <ellipse cx="100" cy="181" rx="33" ry="5" fill="#2E2050" opacity="0.26" filter="url(#tt-b4)"/>
        <ellipse cx="75" cy="180.5" rx="17" ry="4.5" fill="#231941" opacity="0.38" filter="url(#tt-b2)"/>
        <ellipse cx="125" cy="180.5" rx="17" ry="4.5" fill="#231941" opacity="0.38" filter="url(#tt-b2)"/>
      </g>
      <g className="tt-ear tt-ear-l">
        <path d="M40.8 21.4C52.8 15.8 69.4 25.8 77.8 43.9C86.2 61.9 83.2 81 71.2 86.6C59.2 92.2 42.7 82.2 34.3 64.1C25.9 46.1 28.8 27 40.8 21.4Z" fill="url(#tt-earL)"/>
        <path d="M44.4 32.3C52.4 28.6 63.7 35.7 69.5 48.2C75.3 60.8 73.6 73.9 65.6 77.7C57.6 81.4 46.3 74.3 40.5 61.8C34.7 49.2 36.4 36.1 44.4 32.3Z" fill="url(#tt-canL)"/>
        <g clipPath="url(#tt-cCanL)">
          <g fill="none" stroke="#FFF6E2" strokeLinecap="round">
            <circle cx="66" cy="78" r="11" strokeWidth="3.6" opacity="0.82"/>
            <circle cx="66" cy="78" r="21" strokeWidth="3.4" opacity="0.68"/>
            <circle cx="66" cy="78" r="31" strokeWidth="3.2" opacity="0.54"/>
            <circle cx="66" cy="78" r="41" strokeWidth="3" opacity="0.40"/>
          </g>
          <ellipse cx="67" cy="79" rx="18" ry="14" fill="#7A3406" opacity="0.55" filter="url(#tt-b6)"/>
        </g>
        <g clipPath="url(#tt-cEarL)">
          <ellipse cx="70" cy="85" rx="26" ry="18" fill="#2A1A66" opacity="0.32" filter="url(#tt-b6)"/>
          <path d="M40.8 21.4C52.8 15.8 69.4 25.8 77.8 43.9C86.2 61.9 83.2 81 71.2 86.6C59.2 92.2 42.7 82.2 34.3 64.1C25.9 46.1 28.8 27 40.8 21.4Z" fill="none" stroke="url(#tt-rim)" strokeWidth="6"/>
        </g>
      </g>
      <g className="tt-ear tt-ear-r">
        <path d="M159.2 21.4C147.2 15.8 130.6 25.8 122.2 43.9C113.8 61.9 116.8 81 128.8 86.6C140.8 92.2 157.3 82.2 165.7 64.1C174.1 46.1 171.2 27 159.2 21.4Z" fill="url(#tt-earR)"/>
        <path d="M155.6 32.3C147.6 28.6 136.3 35.7 130.5 48.2C124.7 60.8 126.4 73.9 134.4 77.7C142.4 81.4 153.7 74.3 159.5 61.8C165.3 49.2 163.6 36.1 155.6 32.3Z" fill="url(#tt-canR)"/>
        <g clipPath="url(#tt-cCanR)">
          <g fill="none" stroke="#FFF6E2" strokeLinecap="round">
            <circle cx="134" cy="78" r="11" strokeWidth="3.6" opacity="0.76"/>
            <circle cx="134" cy="78" r="21" strokeWidth="3.4" opacity="0.62"/>
            <circle cx="134" cy="78" r="31" strokeWidth="3.2" opacity="0.48"/>
            <circle cx="134" cy="78" r="41" strokeWidth="3" opacity="0.36"/>
          </g>
          <ellipse cx="133" cy="79" rx="18" ry="14" fill="#7A3406" opacity="0.6" filter="url(#tt-b6)"/>
        </g>
        <g clipPath="url(#tt-cEarR)">
          <ellipse cx="130" cy="85" rx="26" ry="18" fill="#2A1A66" opacity="0.36" filter="url(#tt-b6)"/>
          <path d="M159.2 21.4C147.2 15.8 130.6 25.8 122.2 43.9C113.8 61.9 116.8 81 128.8 86.6C140.8 92.2 157.3 82.2 165.7 64.1C174.1 46.1 171.2 27 159.2 21.4Z" fill="none" stroke="url(#tt-rim)" strokeWidth="6"/>
        </g>
      </g>
      <g className="tt-body">
        <ellipse cx="100" cy="145" rx="42" ry="35" fill="url(#tt-body)"/>
        <g clipPath="url(#tt-cBody)">
          <ellipse cx="70" cy="140" rx="17" ry="9" transform="rotate(-32 70 140)" fill="#FFFFFF" opacity="0.26" filter="url(#tt-b4)"/>
          <ellipse cx="100" cy="151" rx="27" ry="19" fill="url(#tt-belly)"/>
          <g clipPath="url(#tt-cBelly)">
            <ellipse cx="100" cy="132" rx="26" ry="9" fill="#B9915F" opacity="0.45" filter="url(#tt-b4)"/>
          </g>
          <g fill="url(#tt-bar)" opacity="0.92">
            <rect x="92.6" y="141.5" width="4.4" height="9" rx="2.2"/>
            <rect x="97.8" y="138.5" width="4.4" height="15" rx="2.2"/>
            <rect x="103" y="140.5" width="4.4" height="11" rx="2.2"/>
          </g>
          <ellipse cx="100" cy="130" rx="45" ry="15" fill="#221252" opacity="0.42" filter="url(#tt-b6)"/>
          <ellipse cx="75" cy="164" rx="17" ry="8" fill="#221252" opacity="0.28" filter="url(#tt-b4)"/>
          <ellipse cx="125" cy="164" rx="17" ry="8" fill="#221252" opacity="0.30" filter="url(#tt-b4)"/>
          <ellipse cx="100" cy="145" rx="42" ry="35" fill="none" stroke="url(#tt-rim)" strokeWidth="7"/>
        </g>
      </g>
      <g className="tt-arm-l">
        <path d="M71 130Q58 142 55 157" fill="none" stroke="#2C1C77" strokeWidth="21" strokeLinecap="round" opacity="0.55" transform="translate(2.5,2.5)"/>
        <path d="M71 130Q58 142 55 157" fill="none" stroke="url(#tt-armL)" strokeWidth="19" strokeLinecap="round"/>
        <path d="M69 132Q58.5 142 56 153" fill="none" stroke="#D5C9FF" strokeWidth="5.5" strokeLinecap="round" opacity="0.42" filter="url(#tt-b1)" transform="translate(-3,-2.5)"/>
      </g>
      <g className="tt-arm-r">
        <path d="M133 141Q154 133 164 111" fill="none" stroke="#2C1C77" strokeWidth="20" strokeLinecap="round" opacity="0.55" transform="translate(2.5,2.5)"/>
        <path d="M133 141Q154 133 164 111" fill="none" stroke="url(#tt-armR)" strokeWidth="18" strokeLinecap="round"/>
        <path d="M136 139Q153.5 132 162 114" fill="none" stroke="#D5C9FF" strokeWidth="5" strokeLinecap="round" opacity="0.40" filter="url(#tt-b1)" transform="translate(-2.5,-3)"/>
        <ellipse cx="163" cy="110.5" rx="6" ry="7" transform="rotate(-26 163 110.5)" fill="#FFF3E2" opacity="0.92"/>
        <ellipse cx="161.5" cy="108" rx="3.6" ry="4.2" transform="rotate(-26 161.5 108)" fill="#FFFFFF" opacity="0.5" filter="url(#tt-b1)"/>
      </g>
      <g className="tt-feet">
        <ellipse cx="75" cy="171" rx="19.5" ry="10.5" fill="url(#tt-foot)"/>
        <g clipPath="url(#tt-cFootL)">
          <ellipse cx="71" cy="166" rx="12" ry="5" fill="#FFFFFF" opacity="0.55" filter="url(#tt-b2)"/>
          <ellipse cx="80" cy="181" rx="18" ry="7" fill="#8A5A22" opacity="0.35" filter="url(#tt-b4)"/>
          <path d="M69 164v14M77 165v13" stroke="#B98F55" strokeWidth="1.6" opacity="0.35" strokeLinecap="round"/>
          <ellipse cx="75" cy="171" rx="19.5" ry="10.5" fill="none" stroke="url(#tt-rimWarm)" strokeWidth="5"/>
        </g>
        <ellipse cx="125" cy="171" rx="19.5" ry="10.5" fill="url(#tt-foot)"/>
        <g clipPath="url(#tt-cFootR)">
          <ellipse cx="121" cy="166" rx="12" ry="5" fill="#FFFFFF" opacity="0.45" filter="url(#tt-b2)"/>
          <ellipse cx="130" cy="181" rx="18" ry="7" fill="#8A5A22" opacity="0.4" filter="url(#tt-b4)"/>
          <path d="M119 164v14M127 165v13" stroke="#B98F55" strokeWidth="1.6" opacity="0.35" strokeLinecap="round"/>
          <ellipse cx="125" cy="171" rx="19.5" ry="10.5" fill="none" stroke="url(#tt-rimWarm)" strokeWidth="5"/>
        </g>
      </g>
      <g className="tt-head">
        <ellipse cx="100" cy="88" rx="50" ry="46" fill="url(#tt-head)"/>
        <g clipPath="url(#tt-cHead)">
          <ellipse cx="70" cy="55" rx="25" ry="15" transform="rotate(-28 70 55)" fill="#FFFFFF" opacity="0.30" filter="url(#tt-b6)"/>
          <ellipse cx="64" cy="50" rx="9.5" ry="5.5" transform="rotate(-30 64 50)" fill="#FFFFFF" opacity="0.5" filter="url(#tt-b2)"/>
          <ellipse cx="98" cy="132" rx="34" ry="10" fill="#FFD9A8" opacity="0.20" filter="url(#tt-b6)"/>
          <ellipse cx="146" cy="116" rx="12" ry="14" fill="#231355" opacity="0.24" filter="url(#tt-b4)"/>
          <ellipse cx="100" cy="88" rx="50" ry="46" fill="none" stroke="url(#tt-rim)" strokeWidth="7"/>
        </g>
      </g>
      <g>
        <ellipse cx="63" cy="106" rx="11.5" ry="7" fill="#FB7185" opacity="0.35" filter="url(#tt-b4)"/>
        <ellipse cx="137" cy="106" rx="11.5" ry="7" fill="#FB7185" opacity="0.30" filter="url(#tt-b4)"/>
        <ellipse cx="80" cy="80" rx="15.5" ry="17" fill="url(#tt-eyeL)"/>
        <g clipPath="url(#tt-cEyeL)">
          <ellipse cx="80" cy="58" rx="18" ry="14" fill="#B7A6DE" opacity="0.55" filter="url(#tt-b2)"/>
          <ellipse cx="81.5" cy="83" rx="10.5" ry="11" fill="url(#tt-irisL)"/>
          <ellipse cx="81.5" cy="84" rx="6" ry="6.4" fill="#120A2C"/>
          <ellipse cx="77.5" cy="77.5" rx="4.3" ry="5.1" transform="rotate(-25 77.5 77.5)" fill="#FFFFFF" opacity="0.95"/>
          <circle cx="86" cy="89" r="2.1" fill="#FFFFFF" opacity="0.45"/>
          <ellipse cx="80" cy="80" rx="15.5" ry="17" fill="none" stroke="#3A2A6B" strokeWidth="2.4" opacity="0.22"/>
        </g>
        <ellipse cx="120" cy="80" rx="15.5" ry="17" fill="url(#tt-eyeR)"/>
        <g clipPath="url(#tt-cEyeR)">
          <ellipse cx="120" cy="58" rx="18" ry="14" fill="#B7A6DE" opacity="0.6" filter="url(#tt-b2)"/>
          <ellipse cx="118.5" cy="83" rx="10.5" ry="11" fill="url(#tt-irisR)"/>
          <ellipse cx="118.5" cy="84" rx="6" ry="6.4" fill="#120A2C"/>
          <ellipse cx="114.5" cy="77.5" rx="4.3" ry="5.1" transform="rotate(-25 114.5 77.5)" fill="#FFFFFF" opacity="0.95"/>
          <circle cx="123" cy="89" r="2.1" fill="#FFFFFF" opacity="0.45"/>
          <ellipse cx="120" cy="80" rx="15.5" ry="17" fill="none" stroke="#3A2A6B" strokeWidth="2.4" opacity="0.26"/>
        </g>
        <ellipse cx="100" cy="112" rx="22" ry="15" fill="url(#tt-muzzle)"/>
        <ellipse cx="100" cy="112" rx="22" ry="15" fill="none" stroke="#B58FA8" strokeWidth="1.6" opacity="0.22"/>
        <path d="M92.8 102.5C95.5 100 104.5 100 107.2 102.5C108.2 106.5 104 110.5 100 111.6C96 110.5 91.8 106.5 92.8 102.5Z" fill="#3A2668"/>
        <ellipse cx="96.5" cy="103.5" rx="2.6" ry="1.7" transform="rotate(-22 96.5 103.5)" fill="#FFFFFF" opacity="0.4"/>
        {mouth}
      </g>
    </svg>
  );
}

export default Mascot;
