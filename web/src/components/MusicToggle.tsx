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
      aria-label={on ? "Turn background music off" : "Turn background music on"}
      title={on ? "Music on" : "Music off"}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-base transition ${
        on
          ? "bg-violet-100 text-violet-700 ring-1 ring-violet-200"
          : "text-stone-400 hover:bg-stone-900/5 hover:text-stone-600"
      }`}
    >
      <span aria-hidden="true" className={on ? "animate-[bob_1.6s_ease-in-out_infinite]" : ""}>
        🎵
      </span>
    </button>
  );
}

export default MusicToggle;
