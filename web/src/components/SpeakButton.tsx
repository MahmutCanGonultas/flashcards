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
 * A blue speaker key that reads `text` aloud with the device's own voice.
 * Sound has no picture, so each press sends one ring out from the button;
 * the ring is keyed on a counter so a second press replays it.
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
      className={`relative inline-flex shrink-0 items-center justify-center rounded-2xl transition-[transform,box-shadow,background-color] duration-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30 active:translate-y-[2px] ${sizeClasses[size]} ${
        isSpeaking ? "bg-ocean-deep text-white" : "bg-ocean text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.2)] hover:brightness-105"
      } ${className}`}
    >
      {/* The pulse lives on its own layer so it never fights the ring's box-shadow. */}
      {presses > 0 && <span key={presses} aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl animate-ring-pulse" />}
      <SpeakerIcon className={`${iconSizeClasses[size]} ${isSpeaking ? "animate-pulse" : ""}`} />
    </button>
  );
}

export default SpeakButton;
