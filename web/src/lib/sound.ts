/**
 * Short synthesized feedback tones for quiz answers -- generated on the fly
 * with the Web Audio API, so there are no audio files to host or load.
 * Created lazily inside a click/keypress handler, which is exactly the kind
 * of user gesture browsers require before audio can play.
 */
let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext })
    .webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

function tone(
  ctx: AudioContext,
  frequency: number,
  startOffset: number,
  duration: number,
  peakGain: number,
) {
  const startTime = ctx.currentTime + startOffset;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  // Quick fade in, then an exponential decay -- a soft chime, not a beep.
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

/** A quick rising two-note chime. */
export function playCorrect(): void {
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, 587.33, 0, 0.12, 0.12); // D5
  tone(ctx, 880.0, 0.09, 0.2, 0.12); // A5
}

/** A single soft, low tone -- a nudge, not a punishment. */
export function playIncorrect(): void {
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, 233.08, 0, 0.22, 0.1); // A#3
}
