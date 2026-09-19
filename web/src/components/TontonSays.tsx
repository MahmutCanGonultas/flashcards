import { useEffect, useState } from "react";
import Mascot, { type MascotMood } from "./Mascot";
import { playChirp } from "../lib/sound";

type TontonSaysProps = {
  /** What Tonton has to say, in the order it comes out. */
  lines: string[];
  size?: number;
  className?: string;
  /** "column": his line set as a pull quote with a rule, the printed half's voice. */
  variant?: "bubble" | "column";
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
function TontonSays({ lines, size = 72, className = "", variant = "bubble" }: TontonSaysProps) {
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

  if (variant === "column") {
    return (
      <div className={`flex items-start gap-3.5 ${className}`}>
        <button
          type="button"
          onClick={poke}
          aria-label="Tonton'a dokun"
          data-silent
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tonton/40"
        >
          <Mascot key={pokes} mood={mood} size={size} />
        </button>
        {line && (
          // A tan rule, not his violet: the column is part of the page, he is the guest.
          <blockquote key={index} role="status" className="min-w-0 border-l-2 border-rule pl-3.5 animate-rise-in">
            <p className="text-[17px] font-semibold leading-[1.35] text-ink">{line}</p>
            <cite className="mt-1.5 block text-[10px] font-extrabold uppercase not-italic tracking-[0.18em] text-graphite">— Tonton</cite>
          </blockquote>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-3 ${className}`}>
      <button
        type="button"
        onClick={poke}
        aria-label="Tonton'a dokun"
        data-silent
        className="shrink-0 rounded-full transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tonton/40"
      >
        <Mascot key={pokes} mood={mood} size={size} />
      </button>
      {line && (
        <div
          key={index}
          role="status"
          className="relative mb-3 min-w-0 flex-1 rounded-2xl rounded-bl-md border-l-2 border-tonton bg-paper-lift px-4 py-3 ring-1 ring-rule shadow-bubble paper-grain animate-bubble-in"
        >
          <span
            aria-hidden="true"
            className="absolute -left-1.5 bottom-3 h-3 w-3 rotate-45 rounded-sm bg-paper-lift ring-1 ring-rule [clip-path:polygon(0_0,0_100%,100%_100%)]"
          />
          <p className="text-[15px] font-semibold leading-snug text-ink">{line}</p>
        </div>
      )}
    </div>
  );
}

export default TontonSays;
