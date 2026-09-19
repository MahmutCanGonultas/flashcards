import type { Card } from "../types";
import type { MascotMood } from "../components/Mascot";
import {
  AFTER_GRADE,
  AUTO_MUTE,
  FIRST_OPEN,
  HUSH,
  IDLE_NUDGE,
  LATE_NIGHT,
  LONG_ABSENCE,
  MILESTONE,
  STREAK_RISK,
  SUMMARY_LATER,
  WORD_PAGE_LINGER,
  dayPart,
  popLines,
  streakLine,
  type PopLine,
} from "./tonton";

/**
 * Tonton's director: decides when he shows up, what he says and when he
 * goes. One module-level state machine, driven by timers and events, so
 * no React state changes inside effects; TontonPopups just subscribes and
 * draws whatever is current.
 *
 *   HIDDEN → SCHEDULED → ENTERING → SHOWING → LEAVING → COOLDOWN
 *
 * One pop at a time app-wide. Everything he might mention comes from what
 * the app has already loaded (the `snapshot` the component lends him); he
 * never fetches on his own.
 */

export type Entrance = "slide-up" | "tiptoe" | "peek-side" | "pop" | "drop" | "fade";
export type PopKind = "first" | "wander" | "risk" | "react" | "nudge" | "summary" | "linger" | "hush" | "mute";
export type Phase = "hidden" | "scheduled" | "entering" | "showing" | "leaving" | "cooldown";

export type Pop = {
  /** Changes with every line, so the bubble re-draws. */
  id: number;
  /** Changes with every arrival, so the entrance re-runs. */
  visit: number;
  kind: PopKind;
  /** Bottom-left, the visit; top-right, the reaction on the flashcard screen. */
  place: "bottom" | "top";
  text: string;
  kicker?: string;
  entrance: Entrance;
  stayMs: number;
  mood: MascotMood;
  /** Last tap of a visit: he waves goodbye instead of another line. */
  wave?: boolean;
};

export type View = { pop: Pop | null; leaving: boolean };

/** What the app knows right now; read only at the moment he speaks. */
export type Snapshot = { cards: Card[]; personal: Card[]; streak: number; lastStudyDate: string | null };

type GradeDetail = { quality: 1 | 3 | 5; front: string; attempt: number; index: number; total: number };
type CardDetail = { front: string; flipped: boolean };

const EXIT_MS = 260;
const MIN_GAP_MS = 18_000;
const RETRY_MS = 5_000;
const REACT_GAP_MS = 25_000;
const NUDGE_MS = 25_000;
const LINGER_MS = 20_000;
const SUMMARY_MS = 6_000;
const FIRST_MS = 2_500;
const HUSH_MS = 2 * 60 * 60_000;
const MUTE_MS = 10 * 60_000;
const QUICK_DISMISS_MS = 1_500;
const MAX_AUTO_POPS = 12;
const REMEMBER = 20;

/** He never interrupts a question. */
const QUIET_ROUTES = [/^\/login/, /^\/register/, /\/placement/, /\/study/, /\/test$/];
const WANDER_ROUTES = [/^\/kartlar$/, /^\/kurs$/, /^\/decks\/\d+$/, /^\/decks\/\d+\/words\/\d+$/];
const WORD_ROUTE = /^\/decks\/\d+\/words\/\d+$/;
const FLASH_ROUTE = /\/flashcards$/;

/* ------------------------------------------------------------ storage -- */

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: he just forgets */
  }
};

function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/* -------------------------------------------------------------- state -- */

let phase: Phase = "hidden";
let view: View = { pop: null, leaving: false };
const listeners = new Set<() => void>();
let snapshot: () => Snapshot = () => ({ cards: [], personal: [], streak: 0, lastStudyDate: null });

let seq = 0;
let visit = 0;
let route = "";
let routeAt = 0;
let busyUntil = 0;
let lastPopAt = 0;
let lastReactAt = 0;
let arrivedAt = 0;
let tapsThisVisit = 0;
let autoPops = 0;
let sessionOpened = false;
let quickDismissals = 0;
let muteUntil = 0;
let hushUntil = Number(read("tt:hushUntil") ?? 0) || 0;
let recent: string[] = (() => {
  try {
    return JSON.parse(read("tt:recent") ?? "[]") as string[];
  } catch {
    return [];
  }
})();

// The flashcard session.
let run = 0;
let misses = 0;
let cardsSincePop = 0;
let currentFront: string | null = null;
let nudgedFront: string | null = null;
let streakAtStart: number | null = null;
let streakSaid = false;
const lingered = new Set<string>();

let wanderTimer = 0;
let stayTimer = 0;
let exitTimer = 0;
let nudgeTimer = 0;
let lingerTimer = 0;
let summaryTimer = 0;
let firstTimer = 0;

const set = (next: View) => {
  view = next;
  listeners.forEach((fn) => fn());
};

const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const hushed = () => Date.now() < hushUntil;
const muted = () => Date.now() < muteUntil;
const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Draws each visit's gap: mostly a minute or two, sometimes soon, sometimes not for a while. */
function drawGap(): number {
  const r = Math.random();
  if (r < 0.15) return rand(20_000, 35_000);
  if (r < 0.8) return rand(45_000, 140_000);
  return rand(150_000, 260_000);
}

/** How he comes in on a visit: usually up from the edge, sometimes sneaking. */
function drawEntrance(): Entrance {
  if (reducedMotion()) return "fade";
  const r = Math.random();
  if (r < 0.45) return "slide-up";
  if (r < 0.7) return "tiptoe";
  if (r < 0.9) return "peek-side";
  return "pop";
}

/** Long enough to read it, never long enough to nag. */
const stayFor = (text: string) => Math.min(9_000, Math.max(5_500, 5_000 + text.length * 45));

function remember(text: string) {
  recent = [text, ...recent.filter((t) => t !== text)].slice(0, REMEMBER);
  write("tt:recent", JSON.stringify(recent));
}

function pickFresh(pool: string[]): string {
  const fresh = pool.filter((t) => !recent.includes(t));
  const from = fresh.length > 0 ? fresh : pool;
  return from[Math.floor(Math.random() * from.length)];
}

/**
 * Reasons to stay away right now. A blocked visit isn't lost; the caller
 * tries again a little later.
 */
function blocked(kind: PopKind): boolean {
  if (typeof document === "undefined") return true;
  if (document.hidden) return true;
  if (document.body.dataset.sheet === "open") return true;
  const active = document.activeElement;
  if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return true;
  if (Date.now() - routeAt < 2_000) return true;
  if (QUIET_ROUTES.some((r) => r.test(route))) return true;
  if (hushed()) return true;
  if (reducedMotion() && kind !== "first" && kind !== "summary") return true;
  return false;
}

/** After 23:30 the first thing he says in a session is about the hour. */
function opener(text: string): string {
  if (sessionOpened) return text;
  sessionOpened = true;
  const now = new Date();
  return now.getHours() === 23 && now.getMinutes() >= 30 ? LATE_NIGHT : text;
}

/* ----------------------------------------------------- showing / leaving -- */

function show(pop: Omit<Pop, "id" | "visit">) {
  window.clearTimeout(stayTimer);
  window.clearTimeout(exitTimer);
  const now = Date.now();
  visit += 1;
  seq += 1;
  arrivedAt = now;
  tapsThisVisit = 0;
  lastPopAt = now;
  busyUntil = now + pop.stayMs + EXIT_MS;
  remember(pop.text);
  phase = "entering";
  set({ pop: { ...pop, id: seq, visit }, leaving: false });
  window.setTimeout(() => {
    if (phase === "entering") phase = "showing";
  }, 600);
  stayTimer = window.setTimeout(leave, pop.stayMs);
}

/** Another line in the same visit: the bubble redraws, he stays put. */
function say(patch: Partial<Pop>) {
  if (!view.pop) return;
  window.clearTimeout(stayTimer);
  seq += 1;
  const pop: Pop = { ...view.pop, ...patch, id: seq };
  busyUntil = Date.now() + pop.stayMs + EXIT_MS;
  remember(pop.text);
  set({ pop, leaving: false });
  stayTimer = window.setTimeout(leave, pop.stayMs);
}

function leave() {
  if (!view.pop || view.leaving) return;
  window.clearTimeout(stayTimer);
  phase = "leaving";
  set({ pop: view.pop, leaving: true });
  exitTimer = window.setTimeout(() => {
    set({ pop: null, leaving: false });
    phase = "cooldown";
    if (WANDER_ROUTES.some((r) => r.test(route))) scheduleWander();
    else phase = "hidden";
  }, EXIT_MS);
}

/* ------------------------------------------------------------ triggers -- */

function scheduleWander(delay = drawGap()) {
  window.clearTimeout(wanderTimer);
  phase = "scheduled";
  wanderTimer = window.setTimeout(tryWander, delay);
}

function tryWander(forced?: Entrance) {
  if (!WANDER_ROUTES.some((r) => r.test(route))) return;
  if (!forced && autoPops >= MAX_AUTO_POPS) return;
  const now = Date.now();
  // Hushed or muted: come back when it lifts, plus a normal gap.
  if (hushed() || muted()) {
    scheduleWander(Math.max(hushUntil, muteUntil) - now + drawGap());
    return;
  }
  if (blocked("wander") || (!forced && (now < busyUntil || now - lastPopAt < MIN_GAP_MS))) {
    scheduleWander(RETRY_MS + rand(0, 4_000));
    return;
  }
  const snap = snapshot();
  const today = localDate();
  const hour = new Date().getHours();
  let line: PopLine;
  let kind: PopKind = "wander";
  if (hour >= 19 && snap.streak >= 2 && snap.lastStudyDate !== today && read("tt:streakRiskDay") !== today) {
    write("tt:streakRiskDay", today);
    line = { text: STREAK_RISK };
    kind = "risk";
  } else {
    const pool = popLines(snap).filter((l) => !recent.includes(l.text));
    line = pool[Math.floor(Math.random() * Math.min(pool.length, 6))] ?? pool[0] ?? { text: "Buradayım." };
  }
  autoPops += 1;
  show({
    kind,
    place: "bottom",
    text: opener(line.text),
    kicker: line.kicker,
    entrance: forced ?? drawEntrance(),
    stayMs: stayFor(line.text),
    mood: "idle",
  });
}

function tryFirst(attempt = 0) {
  if (route !== "/kartlar") return;
  if (blocked("first") || Date.now() < busyUntil) {
    if (attempt < 6) firstTimer = window.setTimeout(() => tryFirst(attempt + 1), 3_000);
    return;
  }
  const snap = snapshot();
  const away = snap.lastStudyDate ? (Date.now() - new Date(snap.lastStudyDate).getTime()) / 86_400_000 : 0;
  const text = away >= 3 ? pickFresh(LONG_ABSENCE) : FIRST_OPEN[dayPart()];
  write("tt:lastHello", localDate());
  show({
    kind: "first",
    place: "bottom",
    text: opener(text),
    entrance: reducedMotion() ? "fade" : "slide-up",
    stayMs: stayFor(text),
    mood: "happy",
  });
}

function tryLinger() {
  if (!WORD_ROUTE.test(route) || lingered.has(route)) return;
  lingered.add(route);
  if (Math.random() >= 0.4) return;
  if (blocked("linger") || Date.now() < busyUntil || autoPops >= MAX_AUTO_POPS) return;
  autoPops += 1;
  window.clearTimeout(wanderTimer);
  show({
    kind: "linger",
    place: "bottom",
    text: opener(WORD_PAGE_LINGER),
    entrance: drawEntrance(),
    stayMs: stayFor(WORD_PAGE_LINGER),
    mood: "idle",
  });
}

function tryNudge() {
  if (!FLASH_ROUTE.test(route) || !currentFront || nudgedFront === currentFront) return;
  if (blocked("nudge") || Date.now() < busyUntil || autoPops >= MAX_AUTO_POPS) return;
  nudgedFront = currentFront;
  autoPops += 1;
  show({
    kind: "nudge",
    place: "top",
    text: IDLE_NUDGE,
    entrance: reducedMotion() ? "fade" : "drop",
    stayMs: 5_000,
    mood: "think",
  });
}

function moodFor(quality: number): MascotMood {
  return quality === 5 ? "happy" : quality === 1 ? "sad" : "idle";
}

function onGrade(detail: GradeDetail) {
  window.clearTimeout(nudgeTimer);
  cardsSincePop += 1;
  const wasRun = run;
  if (detail.quality === 5) run += 1;
  else {
    run = 0;
    if (detail.quality === 1) misses += 1;
  }
  const mood = moodFor(detail.quality);
  window.dispatchEvent(new CustomEvent("tonton:mood", { detail: { mood } }));

  let line: PopLine;
  let milestone = true;
  if (detail.quality === 5 && detail.attempt > 0) line = MILESTONE.returned;
  else if (run === 5) line = MILESTONE.run5;
  else if (run === 3) line = MILESTONE.run3;
  else if (detail.quality === 1 && wasRun >= 3) line = MILESTONE.firstMiss;
  else {
    milestone = false;
    const now = Date.now();
    if (cardsSincePop < 3 || now - lastReactAt < REACT_GAP_MS || Math.random() >= 0.25) return;
    if (detail.quality === 1 && misses % 3 !== 0) return;
    const pool = detail.quality === 5 ? AFTER_GRADE.known : detail.quality === 1 ? AFTER_GRADE.missed : AFTER_GRADE.hard;
    line = { text: pickFresh(pool) };
  }
  if (!FLASH_ROUTE.test(route) || blocked("react")) return;
  // A visit at the bottom (the summary's, say) has the floor.
  if (view.pop && view.pop.place === "bottom" && !view.leaving) return;
  cardsSincePop = 0;
  lastReactAt = Date.now();
  show({
    kind: "react",
    place: "top",
    text: line.text,
    kicker: line.kicker,
    entrance: reducedMotion() ? "fade" : "drop",
    stayMs: milestone ? 1_500 : 1_300,
    mood: line === MILESTONE.firstMiss ? "idle" : milestone ? "happy" : mood,
  });
}

function onCard(detail: CardDetail) {
  window.clearTimeout(nudgeTimer);
  if (view.pop?.place === "top") leave();
  currentFront = detail.front;
  if (streakAtStart === null) streakAtStart = snapshot().streak;
  // The back is showing and nothing happens: one word, and only once per card.
  if (detail.flipped) nudgeTimer = window.setTimeout(tryNudge, NUDGE_MS);
}

function onSummary() {
  window.clearTimeout(nudgeTimer);
  window.clearTimeout(summaryTimer);
  if (view.pop?.place === "top") leave();
  summaryTimer = window.setTimeout(() => {
    const snap = snapshot();
    let text: string;
    if (!streakSaid && streakAtStart !== null && snap.streak > streakAtStart) {
      streakSaid = true;
      text = streakLine(snap.streak);
    } else if (Math.random() < 0.4) {
      text = pickFresh(SUMMARY_LATER);
    } else return;
    if (blocked("summary") || Date.now() < busyUntil || autoPops >= MAX_AUTO_POPS) return;
    autoPops += 1;
    show({
      kind: "summary",
      place: "bottom",
      text: opener(text),
      entrance: reducedMotion() ? "fade" : "pop",
      stayMs: stayFor(text),
      mood: "happy",
    });
  }, SUMMARY_MS);
}

/* ---------------------------------------------------------- the person -- */

/** Tap on Tonton: the next line, twice at most; then he waves and goes. */
function tap() {
  const pop = view.pop;
  if (!pop || view.leaving || pop.place === "top") return;
  if (pop.kind === "hush" || pop.kind === "mute" || tapsThisVisit >= 2) {
    window.clearTimeout(stayTimer);
    set({ pop: { ...pop, wave: true }, leaving: false });
    stayTimer = window.setTimeout(leave, 700);
    return;
  }
  tapsThisVisit += 1;
  const pool = popLines(snapshot()).filter((l) => !recent.includes(l.text));
  const line = pool[Math.floor(Math.random() * Math.min(pool.length, 6))] ?? pool[0];
  if (!line) return;
  say({ text: line.text, kicker: line.kicker, stayMs: stayFor(line.text), wave: false });
}

/** Tap on the bubble. Two quick dismissals in a row and he takes the hint. */
function dismiss() {
  const pop = view.pop;
  if (!pop || view.leaving) return;
  const auto = pop.kind !== "react" && pop.kind !== "hush" && pop.kind !== "mute";
  if (auto && Date.now() - arrivedAt < QUICK_DISMISS_MS) {
    quickDismissals += 1;
    if (quickDismissals >= 2) {
      quickDismissals = 0;
      muteUntil = Date.now() + MUTE_MS;
      say({ kind: "mute", text: AUTO_MUTE, kicker: undefined, stayMs: 1_600 });
      return;
    }
  } else quickDismissals = 0;
  leave();
}

/** Long press: two hours of quiet. */
function hush() {
  const pop = view.pop;
  if (!pop || view.leaving) return;
  hushUntil = Date.now() + HUSH_MS;
  write("tt:hushUntil", String(hushUntil));
  window.clearTimeout(wanderTimer);
  window.clearTimeout(nudgeTimer);
  window.clearTimeout(lingerTimer);
  window.clearTimeout(summaryTimer);
  say({ kind: "hush", text: HUSH, kicker: undefined, stayMs: 2_200, mood: "idle", wave: false });
}

/* -------------------------------------------------------------- wiring -- */

let wired = false;
function wire() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  window.addEventListener("tonton:grade", (e) => onGrade((e as CustomEvent<GradeDetail>).detail));
  window.addEventListener("tonton:card", (e) => onCard((e as CustomEvent<CardDetail>).detail));
  window.addEventListener("tonton:summary", () => onSummary());
  // The reaction bubble goes the moment a hand moves, unless the hand is on it.
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (view.pop?.place !== "top" || view.leaving) return;
      if ((e.target as Element | null)?.closest?.(".tonton-react")) return;
      leave();
    },
    { passive: true, capture: true },
  );
}

/** The route changed: a line belongs to the screen it was said on. */
function setRoute(pathname: string) {
  wire();
  if (pathname === route) return;
  route = pathname;
  routeAt = Date.now();
  window.clearTimeout(wanderTimer);
  window.clearTimeout(firstTimer);
  window.clearTimeout(nudgeTimer);
  window.clearTimeout(lingerTimer);
  if (view.pop && !view.leaving) leave();
  if (FLASH_ROUTE.test(pathname)) {
    run = 0;
    misses = 0;
    cardsSincePop = 0;
    currentFront = null;
    nudgedFront = null;
    streakAtStart = null;
  }
  if (pathname === "/kartlar" && read("tt:lastHello") !== localDate()) {
    firstTimer = window.setTimeout(() => tryFirst(), FIRST_MS);
  }
  if (WANDER_ROUTES.some((r) => r.test(pathname))) scheduleWander();
  else if (!view.pop) phase = "hidden";
  if (WORD_ROUTE.test(pathname)) lingerTimer = window.setTimeout(tryLinger, LINGER_MS);
}

export const director = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getView: () => view,
  /** Lend him a way to read what's loaded. Returns the detach. */
  attach(reader: () => Snapshot) {
    snapshot = reader;
    return () => {
      snapshot = () => ({ cards: [], personal: [], streak: 0, lastStudyDate: null });
    };
  },
  route: setRoute,
  tap,
  dismiss,
  hush,
};

/* --------------------------------------------------------------- DEV -- */

if (import.meta.env.DEV && typeof window !== "undefined") {
  const ENTRANCES: Entrance[] = ["slide-up", "tiptoe", "peek-side", "pop"];
  Object.assign(window, {
    __tonton: {
      /** Force a visit now: an entrance name for a wander, or a trigger's name. */
      pop(kind?: string) {
        if (kind === "first") return tryFirst(6);
        if (kind === "nudge") {
          currentFront ??= "commit";
          return tryNudge();
        }
        if (kind === "linger") {
          lingered.delete(route);
          return tryLinger();
        }
        if (kind === "summary") return onSummary();
        return tryWander((ENTRANCES as string[]).includes(kind ?? "") ? (kind as Entrance) : "slide-up");
      },
      grade(quality: 1 | 3 | 5, attempt = 0) {
        window.dispatchEvent(
          new CustomEvent("tonton:grade", { detail: { quality, front: currentFront ?? "commit", attempt, index: 0, total: 1 } }),
        );
      },
      /** Forget the hush, the mute and today's hello. */
      reset() {
        hushUntil = 0;
        muteUntil = 0;
        autoPops = 0;
        sessionOpened = false;
        try {
          ["tt:hushUntil", "tt:lastHello", "tt:recent", "tt:streakRiskDay"].forEach((k) => localStorage.removeItem(k));
        } catch {
          /* fine */
        }
        recent = [];
      },
      state: () => ({ phase, route, busyUntil, lastPopAt, autoPops, hushUntil, muteUntil, run, misses, cardsSincePop, view }),
    },
  });
}
