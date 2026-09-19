import { useSyncExternalStore } from "react";
import { isMusicOn, subscribeMusic, toggleMusic } from "../lib/music";

/** The little note in the header that turns the background pad on and off. */
function MusicToggle() {
  const on = useSyncExternalStore(subscribeMusic, isMusicOn, () => false);

  return (
    <button
      type="button"
      onClick={toggleMusic}
      aria-pressed={on}
      aria-label={on ? "Arka plan müziğini kapat" : "Arka plan müziğini aç"}
      title={on ? "Müzik açık" : "Müzik kapalı"}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-base transition ${
        on
          ? "bg-paper-deep text-ink ring-1 ring-rule"
          : "text-graphite hover:bg-ink/5 hover:text-ink"
      }`}
    >
      {/* Pressed-in on the deeper paper is the whole "on" signal: nothing bobs while the screen is idle. */}
      <span aria-hidden="true">🎵</span>
    </button>
  );
}

export default MusicToggle;
