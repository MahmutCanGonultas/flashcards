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
  sm: "h-9 w-9",
  md: "h-11 w-11",
};

const iconSizeClasses: Record<NonNullable<SpeakButtonProps["size"]>, string> = {
  sm: "h-[18px] w-[18px]",
  md: "h-5 w-5",
};

/** A tappable speaker icon that reads `text` aloud with the device's own voice. */
function SpeakButton({ text, size = "sm", className = "" }: SpeakButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!speechSupported) return null;

  const handleClick = (event: React.MouseEvent) => {
    // Sits on top of flip/navigate targets in Study and DeckCard — it must
    // never also trigger whatever it's layered over.
    event.stopPropagation();
    event.preventDefault();
    void speak(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Play pronunciation: ${text}`}
      className={`inline-flex shrink-0 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${sizeClasses[size]} ${
        isSpeaking
          ? "bg-violet-600 text-white"
          : "bg-violet-100 text-violet-600 hover:bg-violet-200"
      } ${className}`}
    >
      <SpeakerIcon className={`${iconSizeClasses[size]} ${isSpeaking ? "animate-pulse" : ""}`} />
    </button>
  );
}

export default SpeakButton;
