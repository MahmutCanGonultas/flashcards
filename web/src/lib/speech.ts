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

/**
 * iOS only lets a page start speech from inside a user gesture, and the first
 * utterance of a session is the one it polices. `speak()` can't do this job
 * itself: it awaits `ensureVoicesLoaded()` first, so by the time it reaches
 * the synth the gesture window has closed.
 *
 * So the very first tap that leads into a session calls this synchronously —
 * a silent, throwaway utterance that opens the door for everything after it.
 */
let primed = false;
export function primeSpeech(): void {
  if (!speechSupported || primed) return;
  primed = true;
  try {
    const opener = new SpeechSynthesisUtterance("a");
    opener.volume = 0;
    opener.rate = 2;
    opener.lang = "en-US";
    window.speechSynthesis.speak(opener);
  } catch {
    // An unsupported or blocked synth just means no audio; never a crash.
  }
  void ensureVoicesLoaded();
}

const MUTE_KEY = "speech-muted";

/**
 * Mute silences the automatic pronunciations only. Tapping a speaker button
 * is an explicit request and always plays — someone who muted the app on a
 * bus still wants sound when they deliberately ask for it.
 */
export function isSpeechMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSpeechMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // Private browsing can refuse writes; the preference just won't persist.
  }
}

type SpeakOptions = {
  lang?: string;
  /** 1 is the engine's normal pace; the default here is a little slower. */
  rate?: number;
  /** Fires when audio actually starts, so a button can show a "playing" state. */
  onStart?: () => void;
  onEnd?: () => void;
};

export async function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  const { lang = "en-US", rate = 0.92, onStart, onEnd } = options;
  if (!speechSupported || !text.trim()) return;

  await ensureVoicesLoaded();

  // Cancel whatever's mid-sentence so replaying a word (or flipping to the
  // next card) never queues up and reads two words on top of each other.
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  if (onStart) utterance.onstart = onStart;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);
}

/** Speaks the automatic pronunciations, unless the learner has muted them. */
export function speakAuto(text: string, options: SpeakOptions = {}): void {
  if (isSpeechMuted()) return;
  void speak(text, options);
}

