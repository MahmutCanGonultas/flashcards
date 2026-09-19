import { useState } from "react";
import { SpeakerIcon } from "./icons";
import { speak, speechSupported } from "../lib/speech";

type SpeakButtonProps = {
  /** The English text to read aloud — usually the card's front. */
  text: string;
  size?: "sm" | "md";
  className?: string;
};

const sizeClasses: Record<NonNullable<SpeakButtonProps["size"]>, string> = {
  sm: "h-10 w-10",
  md: "h-11 w-11",
};

const iconSizeClasses: Record<NonNullable<SpeakButtonProps["size"]>, string> = {
  sm: "h-[18px] w-[18px]",
  md: "h-5 w-5",
};

/**
 * A tappable speaker icon that reads `text` aloud with the device's own
 * voice. Sound has no picture, so each press sends one ring out from the
 * button; the ring is keyed on a counter so a second press replays it.
 */
function SpeakButton({ text, size = "sm", className = "" }: SpeakButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [presses, setPresses] = useState(0);

  if (!speechSupported) return null;

  const handleClick = (event: React.MouseEvent) => {
    // Sits on top of flip/navigate targets in Study and DeckCard — it must
    // never also trigger whatever it's layered over.
    event.stopPropagation();
    event.preventDefault();
    setPresses((n) => n + 1);
    void speak(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Dinle: ${text}`}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${sizeClasses[size]} ${
        isSpeaking ? "bg-ink text-paper-lift" : "bg-paper-lift text-ink ring-1 ring-rule hover:bg-paper-deep/50"
      } ${className}`}
    >
      {/* The pulse lives on its own layer so it never fights the ring's box-shadow. */}
      {presses > 0 && <span key={presses} aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full animate-ring-pulse" />}
      <SpeakerIcon className={`${iconSizeClasses[size]} ${isSpeaking ? "animate-pulse" : ""}`} />
    </button>
  );
}

export default SpeakButton;
