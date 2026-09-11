import { useEffect, useState } from "react";
import Mascot, { type MascotMood } from "./Mascot";
import { playChirp } from "../lib/sound";

type TontonSaysProps = {
  /** What Tonton has to say, in the order it comes out. */
  lines: string[];
  size?: number;
  className?: string;
};

/** How long a line stays up before Tonton moves on to the next one. */
const CHATTER_MS = 9000;
/** Every so often Tonton hops for no reason at all. */
const FIDGET_MS = 14000;

/**
 * Tonton with a speech bubble. He works through his lines on his own, hops
 * now and then, and a tap makes him hop, chirp and say the next thing —
 * so the home screen has someone on it rather than a static illustration.
 */
function TontonSays({ lines, size = 72, className = "" }: TontonSaysProps) {
  const [index, setIndex] = useState(0);
  const [mood, setMood] = useState<MascotMood>("idle");
  // Bumped on every poke so the hop replays even mid-hop.
  const [pokes, setPokes] = useState(0);

  const count = lines.length;
  const line = count > 0 ? lines[index % count] : "";

  // Idle chatter: the next line every few seconds, and a little hop now and
  // then. Both are timers, so nothing here sets state during render.
  useEffect(() => {
    if (count < 2) return;
    const chatter = window.setInterval(() => setIndex((i) => i + 1), CHATTER_MS);
    return () => window.clearInterval(chatter);
  }, [count]);

  useEffect(() => {
    const fidget = window.setInterval(() => {
      setMood("happy");
      setPokes((n) => n + 1);
      window.setTimeout(() => setMood("idle"), 900);
    }, FIDGET_MS);
    return () => window.clearInterval(fidget);
  }, []);

  const poke = () => {
    playChirp();
    setMood("happy");
    setPokes((n) => n + 1);
    setIndex((i) => i + 1);
    window.setTimeout(() => setMood("idle"), 900);
  };

  return (
    <div className={`flex items-end gap-3 ${className}`}>
      <button
        type="button"
        onClick={poke}
        aria-label="Poke Tonton"
        data-silent
        className="shrink-0 rounded-full transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
      >
        <Mascot key={pokes} mood={mood} size={size} />
      </button>
      {line && (
        <div
          key={index}
          role="status"
          className="relative mb-3 min-w-0 flex-1 rounded-3xl rounded-bl-md bg-white px-4 py-3 ring-1 ring-stone-200 shadow-[0_4px_14px_-10px_rgba(28,25,23,0.4)] animate-[pop-in_220ms_cubic-bezier(0.34,1.56,0.64,1)]"
        >
          <span
            aria-hidden="true"
            className="absolute -left-1.5 bottom-3 h-3 w-3 rotate-45 rounded-sm bg-white ring-1 ring-stone-200 [clip-path:polygon(0_0,0_100%,100%_100%)]"
          />
          <p className="text-[15px] font-semibold leading-snug text-stone-700">{line}</p>
        </div>
      )}
    </div>
  );
}

export default TontonSays;
