/**
 * The app's sounds, played through the Web Audio API.
 *
 * The two that matter most — a right answer and a wrong one — are recorded
 * sounds (public/sounds, CC0 from Freesound, credited in the README): a
 * clean rising chime, and a low, soft "bwoom" that goes down and darker,
 * a nudge rather than a buzzer. Everything else is synthesized on the fly
 * in one key (C major): soft triangle tones through a gentle low-pass.
 *
 * Created lazily inside a click/keypress handler, which is exactly the kind
 * of user gesture browsers require before audio can play; the two recorded
 * sounds are fetched and decoded at that moment, so they are ready by the
 * first answer. Until they are, the synthesized versions stand in.
 */
let audioContext: AudioContext | null = null;
let bus: BiquadFilterNode | null = null;

type Sample = "correct" | "wrong";
const SAMPLE_URL: Record<Sample, string> = { correct: "/sounds/correct.wav", wrong: "/sounds/wrong.wav" };
const samples: Partial<Record<Sample, AudioBuffer>> = {};
let samplesRequested = false;

function loadSamples(ctx: AudioContext) {
  if (samplesRequested) return;
  samplesRequested = true;
  for (const name of Object.keys(SAMPLE_URL) as Sample[]) {
    fetch(SAMPLE_URL[name])
      .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(String(response.status)))))
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        samples[name] = buffer;
      })
      .catch(() => {
        // Offline before the first load, or an old browser: the synthesized sound plays instead.
      });
  }
}

/**
 * A recorded sound, straight to the speaker (not through the low-pass: the
 * chime's shimmer is the point). `semitones` shifts its pitch, for a streak.
 * Returns false when it isn't loaded yet, so the caller can fall back.
 */
function playSample(name: Sample, { gain = 0.7, semitones = 0 } = {}): boolean {
  const ctx = getContext();
  const buffer = samples[name];
  if (!ctx || !buffer) return false;
  const source = ctx.createBufferSource();
  const volume = ctx.createGain();
  source.buffer = buffer;
  source.playbackRate.value = Math.pow(2, semitones / 12);
  volume.gain.value = gain;
  source.connect(volume);
  volume.connect(ctx.destination);
  source.start();
  return true;
}

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
    loadSamples(audioContext);
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
 * A right answer: the chime. Pass the streak and it climbs with it — a
 * semitone higher for each answer in a row, up to four — so a hot streak
 * sounds like one. Before the chime has loaded, a synthesized lift that
 * grows with the streak the same way.
 */
export function playCorrect(streak = 1): void {
  if (playSample("correct", { gain: 0.75, semitones: Math.min(Math.max(streak, 1) - 1, 4) })) return;
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

/** A wrong answer: a low, soft "bwoom" going down — a nudge, not a punishment. */
export function playIncorrect(): void {
  if (playSample("wrong", { gain: 0.8 })) return;
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
