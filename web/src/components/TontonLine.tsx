import Mascot, { type MascotMood } from "./Mascot";

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
  white: "bg-paper-lift ring-rule text-ink",
  amber: "bg-paper-deep ring-rule text-ink",
  violet: "bg-paper-lift ring-rule text-ink border-l-2 border-tonton",
};

/**
 * One line from Tonton: a small Tonton beside a speech bubble. Used wherever
 * a screen would otherwise have a bare instruction — a question prompt, a
 * "tap what you hear", a welcome — so it's him asking, not a label.
 */
function TontonLine({ children, mood = "idle", size = 44, className = "", tone = "white" }: TontonLineProps) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <Mascot mood={mood} size={size} className="shrink-0" />
      <div
        className={`relative mb-1 min-w-0 flex-1 rounded-2xl rounded-bl-sm px-3.5 py-2.5 ring-1 shadow-bubble ${TONES[tone]} animate-[pop-in_200ms_cubic-bezier(0.34,1.56,0.64,1)]`}
      >
        <span
          aria-hidden="true"
          className={`absolute -left-1 bottom-2.5 h-2.5 w-2.5 rotate-45 rounded-[2px] ring-1 ${TONES[tone].split(" ").slice(0, 2).join(" ")} [clip-path:polygon(0_0,0_100%,100%_100%)]`}
        />
        <p className="text-[15px] font-semibold leading-snug">{children}</p>
      </div>
    </div>
  );
}

export default TontonLine;
