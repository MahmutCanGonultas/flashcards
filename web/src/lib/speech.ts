/**
 * Pronunciation via the browser's built-in text-to-speech (Web Speech API).
 * No audio files, no backend, no API key — every evergreen mobile and
 * desktop browser ships a speech engine already.
 */
export const speechSupported =
  typeof window !== "undefined" && "speechSynthesis" in window;

// Chrome, in particular, can silently no-op the very first speak() call if
// the voice list hasn't loaded yet, so the first tap of a session waits for
// the "voiceschanged" event (or a short timeout) before actually speaking.
let voicesReady = false;
function ensureVoicesLoaded(): Promise<void> {
  if (voicesReady || !speechSupported) return Promise.resolve();

  if (window.speechSynthesis.getVoices().length > 0) {
    voicesReady = true;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const finish = () => {
      voicesReady = true;
      window.speechSynthesis.removeEventListener("voiceschanged", finish);
      resolve();
    };
    window.speechSynthesis.addEventListener("voiceschanged", finish);
    setTimeout(finish, 300);
  });
}

type SpeakOptions = {
  lang?: string;
  /** Fires when audio actually starts, so a button can show a "playing" state. */
  onStart?: () => void;
  onEnd?: () => void;
};

export async function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  const { lang = "en-US", onStart, onEnd } = options;
  if (!speechSupported || !text.trim()) return;

  await ensureVoicesLoaded();

  // Cancel whatever's mid-sentence so replaying a word (or flipping to the
  // next card) never queues up and reads two words on top of each other.
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.92;
  if (onStart) utterance.onstart = onStart;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);
}
