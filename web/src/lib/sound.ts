/**
 * Synthesized feedback sounds -- generated on the fly with the Web Audio
 * API, so there are no audio files to host, load or license.
 *
 * The palette is small and consistent: soft triangle tones through a gentle
 * low-pass, in one key (C major), so a right answer, a finished lesson and a
 * passed unit sound like three sizes of the same good news. Wrong answers
 * are a nudge, never a buzzer.
 *
 * Created lazily inside a click/keypress handler, which is exactly the kind
 * of user gesture browsers require before audio can play.
 */
let audioContext: AudioContext | null = null;
let bus: BiquadFilterNode | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) {
    audioContext = new Ctor();
    // Everything goes through one filter so the tones stay rounded on a
    // phone speaker, which is unkind to bare oscillators.
    bus = audioContext.createBiquadFilter();
    bus.type = "lowpass";
    bus.frequency.value = 2400;
    bus.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

type Voice = OscillatorType;

function tone(
  ctx: AudioContext,
  frequency: number,
  startOffset: number,
  duration: number,
  peakGain: number,
  voice: Voice = "triangle",
) {
  if (!bus) return;
  const startTime = ctx.currentTime + startOffset;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = voice;
  oscillator.frequency.value = frequency;

  // Quick fade in, then an exponential decay -- a soft chime, not a beep.
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(bus);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

// C major, the same key as the background pad.
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;
const A4 = 440.0;
const F4 = 349.23;
const G4 = 392.0;

/**
 * A right answer: a quick, bright three-note lift. Pass the streak and the
 * lift climbs with it — one extra note per answer in a row, up to a full
 * octave run at five, so a hot streak sounds like one.
 */
export function playCorrect(streak = 1): void {
  const ctx = getContext();
  if (!ctx) return;
  const run = [C5, E5, G5, C6, E5 * 2];
  const notes = Math.min(Math.max(streak, 1) + 2, run.length);
  for (let i = 0; i < notes; i++) {
    const last = i === notes - 1;
    tone(ctx, run[i], i * 0.07, last ? 0.3 : 0.16, last ? 0.11 : 0.1);
  }
}

/** A soft tick under every tap, so the whole app feels physical. */
export function playTap(): void {
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, C6, 0, 0.05, 0.035, "sine");
}

/** A station opening on the map: a short two-note "doors opening" chime. */
export function playStation(): void {
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, G5, 0, 0.1, 0.07);
  tone(ctx, C6, 0.08, 0.22, 0.08);
}

/** Tonton's chirp when you tap him — two quick high notes with a little slide. */
export function playChirp(): void {
  const ctx = getContext();
  if (!ctx || !bus) return;
  const start = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(E5 * 2, start);
  osc.frequency.exponentialRampToValueAtTime(G5 * 2, start + 0.08);
  osc.frequency.exponentialRampToValueAtTime(E5 * 2, start + 0.16);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.07, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
  osc.connect(gain);
  gain.connect(bus);
  osc.start(start);
  osc.stop(start + 0.25);
  tone(ctx, C6 * 2, 0.2, 0.12, 0.05);
}

/** A locked station tapped: one dull low knock. */
export function playLocked(): void {
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, G4 / 2, 0, 0.12, 0.06, "sine");
}

/** A word revealed / a card flipped: a single soft note. */
export function playReveal(): void {
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, E5, 0, 0.14, 0.06, "sine");
}

/** A wrong answer: two soft notes stepping down -- a nudge, not a punishment. */
export function playIncorrect(): void {
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, A4, 0, 0.18, 0.08, "sine");
  tone(ctx, F4, 0.12, 0.3, 0.07, "sine");
}

/** Two tiles matched in the sound check: one small, satisfied tick. */
export function playMatch(): void {
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, G5, 0, 0.09, 0.07);
  tone(ctx, C6, 0.05, 0.14, 0.07);
}

/** A lesson finished: the lift again, held longer, with the octave on top. */
export function playLessonComplete(): void {
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, C5, 0, 0.3, 0.09);
  tone(ctx, E5, 0.1, 0.3, 0.09);
  tone(ctx, G5, 0.2, 0.3, 0.1);
  tone(ctx, C6, 0.32, 0.7, 0.11);
  // A soft chord under the top note so it lands rather than pings.
  tone(ctx, C5, 0.32, 0.7, 0.05, "sine");
  tone(ctx, G4, 0.32, 0.7, 0.04, "sine");
}

/** A unit test passed: the fanfare, twice as wide. */
export function playUnitPassed(): void {
  const ctx = getContext();
  if (!ctx) return;
  const steps = [C5, E5, G5, C6, E5 * 2];
  steps.forEach((frequency, i) => tone(ctx, frequency, i * 0.09, 0.28, 0.09));
  // Final chord, sustained.
  tone(ctx, C5, 0.5, 1.2, 0.06, "sine");
  tone(ctx, E5, 0.5, 1.2, 0.06, "sine");
  tone(ctx, G5, 0.5, 1.2, 0.06, "sine");
  tone(ctx, C6, 0.5, 1.2, 0.08);
}

/** A test not passed: the same two-note nudge, a little lower and slower. */
export function playUnitFailed(): void {
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, G4, 0, 0.3, 0.07, "sine");
  tone(ctx, F4 * 0.943, 0.22, 0.5, 0.06, "sine"); // E4
}
