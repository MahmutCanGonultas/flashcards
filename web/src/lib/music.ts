/**
 * A quiet, generated background pad — no audio files, nothing licensed,
 * nothing to download. Four soft chords in a warm major key drift past each
 * other under a low-pass filter, the kind of thing that sits behind a study
 * session without ever asking for attention.
 *
 * Off by default. Starts only from a tap, because browsers require a gesture
 * before audio can play, and pauses while the tab is hidden so it never plays
 * to an empty room.
 */

const STORAGE_KEY = "music-on";

/** Frequencies for a I–vi–IV–V loop in C, voiced low and close. */
const CHORDS: number[][] = [
  [130.81, 196.0, 261.63, 329.63], // C2 G3 C4 E4
  [110.0, 164.81, 261.63, 329.63], // A2 E3 C4 E4  (Am)
  [87.31, 174.61, 220.0, 349.23], // F2 F3 A3 F4
  [98.0, 196.0, 246.94, 293.66], // G2 G3 B3 D4
];

const CHORD_SECONDS = 7;
const CROSSFADE_SECONDS = 2.4;
const MASTER_GAIN = 0.09;

let audioContext: AudioContext | null = null;
let master: GainNode | null = null;
let filter: BiquadFilterNode | null = null;
let timer: number | undefined;
let chordIndex = 0;
let playing = false;
const listeners = new Set<(on: boolean) => void>();

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) {
    audioContext = new Ctor();
    master = audioContext.createGain();
    master.gain.value = 0;
    filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 720;
    filter.Q.value = 0.6;
    filter.connect(master);
    master.connect(audioContext.destination);

    // A slow wobble on the filter so a held chord still moves a little.
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
  }
  return audioContext;
}

/** One chord: detuned pairs of soft oscillators, faded in and out. */
function playChord(ctx: AudioContext, notes: number[], at: number) {
  if (!filter) return;
  const chordGain = ctx.createGain();
  chordGain.gain.setValueAtTime(0, at);
  chordGain.gain.linearRampToValueAtTime(1, at + CROSSFADE_SECONDS);
  chordGain.gain.setValueAtTime(1, at + CHORD_SECONDS);
  chordGain.gain.linearRampToValueAtTime(0, at + CHORD_SECONDS + CROSSFADE_SECONDS);
  chordGain.connect(filter);

  for (const frequency of notes) {
    for (const detune of [-4, 4]) {
      const osc = ctx.createOscillator();
      osc.type = frequency < 150 ? "sine" : "triangle";
      osc.frequency.value = frequency;
      osc.detune.value = detune;
      const voice = ctx.createGain();
      // The bass carries less so the pad stays airy on a phone speaker.
      voice.gain.value = frequency < 150 ? 0.18 : 0.11;
      osc.connect(voice);
      voice.connect(chordGain);
      osc.start(at);
      osc.stop(at + CHORD_SECONDS + CROSSFADE_SECONDS + 0.1);
    }
  }
}

function scheduleNext() {
  const ctx = audioContext;
  if (!ctx || !playing) return;
  playChord(ctx, CHORDS[chordIndex % CHORDS.length], ctx.currentTime + 0.05);
  chordIndex += 1;
  timer = window.setTimeout(scheduleNext, CHORD_SECONDS * 1000);
}

function notify() {
  for (const listener of listeners) listener(playing);
}

export function isMusicOn(): boolean {
  return playing;
}

/** Whether the learner left it on last time — used to offer, never to autoplay. */
export function musicPreferred(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Must be called from inside a user gesture. */
export function startMusic(): void {
  const ctx = getContext();
  if (!ctx || !master || playing) return;
  if (ctx.state === "suspended") void ctx.resume();
  playing = true;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
  master.gain.linearRampToValueAtTime(MASTER_GAIN, ctx.currentTime + 1.5);
  scheduleNext();
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Not persisted; it'll still play this session.
  }
  notify();
}

export function stopMusic(): void {
  const ctx = audioContext;
  playing = false;
  window.clearTimeout(timer);
  if (ctx && master) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, "0");
  } catch {
    // Fine.
  }
  notify();
}

export function toggleMusic(): void {
  if (playing) stopMusic();
  else startMusic();
}

export function subscribeMusic(listener: (on: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Nobody wants a pad playing from a background tab.
if (typeof document !== "undefined") {
  let pausedByTab = false;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && playing) {
      pausedByTab = true;
      stopMusic();
    } else if (!document.hidden && pausedByTab) {
      pausedByTab = false;
      startMusic();
    }
  });
}
