import Mascot, { type MascotMood } from "./Mascot";
import { useTontonAway } from "../lib/useTontonAway";

type TontonLineProps = {
  children: React.ReactNode;
  mood?: MascotMood;
  size?: number;
  className?: string;
  /**
   * Which paper the bubble is: a lifted sheet (default), the recessed
   * band (a hint or a result), or his own, with his violet rule on the
   * left. The names stayed so the course screens keep working.
   */
  tone?: "white" | "amber" | "violet";
};

const TONES = {
  white: "bg-white border-rule text-ink",
  amber: "bg-sunny-soft border-sunny text-ink",
  violet: "bg-white border-rule text-ink",
};

/**
 * One line from Tonton: a small Tonton beside a speech bubble. Used wherever
 * a screen would otherwise have a bare instruction — a question prompt, a
 * "tap what you hear", a welcome — so it's him asking, not a label.
 */
function TontonLine({ children, mood = "idle", size = 44, className = "", tone = "white" }: TontonLineProps) {
  const away = useTontonAway();
  return (
    <div className={`flex items-end gap-2 transition-opacity duration-300 ${away ? "opacity-0" : ""} ${className}`}>
      <Mascot mood={mood} size={size} className="shrink-0" />
      <div
        className={`relative mb-1 min-w-0 flex-1 rounded-2xl border-2 px-3.5 py-2.5 ${TONES[tone]} animate-[pop-in_200ms_cubic-bezier(0.34,1.56,0.64,1)]`}
      >
        <span
          aria-hidden="true"
          className={`absolute -left-[7px] bottom-3 h-3 w-3 rotate-45 border-b-2 border-l-2 ${TONES[tone].split(" ").slice(0, 2).join(" ")}`}
        />
        <p className="text-[15px] font-bold leading-snug">{children}</p>
      </div>
    </div>
  );
}

export default TontonLine;
