import { useState } from "react";

const COLOURS = ["#8B5CF6", "#F59E0B", "#10B981", "#F43F5E", "#0EA5E9", "#FBBF24"];
const PIECES = 36;

type Piece = {
  left: number;
  delay: number;
  duration: number;
  drift: number;
  colour: string;
  size: number;
  round: boolean;
};

function makePieces(): Piece[] {
  return Array.from({ length: PIECES }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 2.2 + Math.random() * 1.6,
    drift: (Math.random() - 0.5) * 160,
    colour: COLOURS[i % COLOURS.length],
    size: 6 + Math.random() * 8,
    round: Math.random() < 0.4,
  }));
}

/**
 * A one-shot shower over the whole screen. Pure CSS, pointer-events off,
 * gone on its own once the last piece lands. Stilled by reduced-motion like
 * everything else.
 */
function Confetti() {
  const [pieces] = useState(makePieces);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="absolute top-0 block animate-[confetti-fall_var(--dur)_cubic-bezier(0.25,0.46,0.45,0.94)_var(--delay)_both]"
          style={
            {
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.round ? piece.size : piece.size * 1.6,
              backgroundColor: piece.colour,
              borderRadius: piece.round ? "9999px" : "2px",
              "--dur": `${piece.duration}s`,
              "--delay": `${piece.delay}s`,
              "--drift": `${piece.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export default Confetti;
