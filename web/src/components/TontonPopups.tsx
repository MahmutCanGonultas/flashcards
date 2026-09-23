import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { Card, Deck } from "../types";
import { getToken } from "../lib/api";
import { director, type Entrance, type Pop, type Snapshot } from "../lib/tontonDirector";
import { playChirp } from "../lib/sound";
import type { GrammarProgress } from "../lib/grammar";
import Mascot from "./Mascot";

/** He never chirps at night. */
const chirp = () => {
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 7) return;
  playChirp();
};

/** The entrances, as full class strings so Tailwind can see them. */
const ENTRANCE: Record<Entrance, string> = {
  "slide-up": "animate-[tt-slide-up_520ms_var(--ease-soft)_both]",
  tiptoe: "animate-[tt-tiptoe_900ms_var(--ease-soft)_both]",
  "peek-side": "animate-[tt-peek-side_620ms_var(--ease-soft)_both]",
  pop: "animate-[tt-pop_420ms_var(--ease-spring)_both]",
  drop: "animate-[tt-drop_520ms_var(--ease-soft)_both]",
  fade: "animate-[fade-in_220ms_ease-out_both]",
};
const SINK = "animate-[tt-sink_260ms_ease-in_both]";
const SHRINK = "animate-[tt-shrink_260ms_ease-in_both]";

/** Everything he might mention, from what's already loaded; he never fetches. */
function readSnapshot(queryClient: QueryClient): Snapshot {
  const decks = (queryClient.getQueryData(["decks"]) as Deck[] | undefined) ?? [];
  const personalDeck =
    decks.find((d) => d.kind === "personal") ?? (queryClient.getQueryData(["personalDeck"]) as Deck | undefined);
  const allCards = queryClient.getQueriesData<Card[]>({ queryKey: ["cards"] }).flatMap(([, data]) => data ?? []);
  const personal = allCards.filter((c) => personalDeck && c.deck_id === personalDeck.id);
  const cards = allCards.filter((c) => !personalDeck || c.deck_id !== personalDeck.id);
  const streak = queryClient.getQueryData(["streak"]) as { streak?: number; lastStudyDate?: string | null } | undefined;
  const grammar = queryClient.getQueryData(["grammarProgress"]) as GrammarProgress | undefined;
  return { cards, personal, streak: streak?.streak ?? 0, lastStudyDate: streak?.lastStudyDate ?? null, grammar };
}

/**
 * Tap or hold. A press of 600ms is a hold; the click that follows it is
 * swallowed so a hold never also counts as a tap. Refs only change inside
 * handlers, never during render.
 */
function usePress(onTap: () => void, onHold: () => void) {
  const timer = useRef(0);
  const held = useRef(false);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const cancel = () => window.clearTimeout(timer.current);
  return {
    onPointerDown: () => {
      held.current = false;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        held.current = true;
        onHold();
      }, 600);
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onClick: () => {
      if (held.current) {
        held.current = false;
        return;
      }
      onTap();
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}

/** The bright line along the bubble's foot that shrinks over his stay. */
function Stay({ ms }: { ms: number }) {
  return <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-tonton/70" style={{ animation: `tt-stay ${ms}ms linear both` }} />;
}

function Kicker({ text }: { text?: string }) {
  if (!text) return null;
  return <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-tonton">{text}</span>;
}

/** The visit: bottom-left, Tonton beside a bubble. Tap him for more, tap the bubble to close, hold to hush. */
function Visit({ pop, leaving }: { pop: Pop; leaving: boolean }) {
  const mascot = usePress(() => {
    chirp();
    director.tap();
  }, director.hush);
  const bubble = usePress(director.dismiss, director.hush);
  return (
    <div
      key={pop.visit}
      className={`tonton-pop pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-start px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] ${leaving ? SINK : ENTRANCE[pop.entrance]}`}
    >
      <div className="pointer-events-auto flex max-w-[20rem] items-end gap-2">
        <button
          type="button"
          {...mascot}
          aria-label="Tonton'a dokun (ziyaret)"
          data-silent
          className="shrink-0 select-none rounded-full [-webkit-touch-callout:none] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tonton/40"
        >
          <Mascot key={`${pop.id}${pop.wave ? "-wave" : ""}`} mood={pop.wave ? "happy" : pop.mood} size={72} />
        </button>
        <div className="relative mb-4 min-w-0">
          <span aria-hidden="true" className="absolute -left-[6px] bottom-5 z-10 h-3 w-3 rotate-45 border-b-2 border-l-2 border-rule bg-white" />
          <button
            key={pop.id}
            type="button"
            {...bubble}
            aria-label="Kapat"
            className="tt-bubble relative block w-full select-none overflow-hidden rounded-2xl border-2 border-rule bg-white px-4 py-3 text-left shadow-[0_3px_0_0_var(--color-rule)] animate-bubble-in [animation-delay:180ms] [-webkit-touch-callout:none] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tonton/40"
          >
            <Kicker text={pop.kicker} />
            <span className="block text-[15px] font-bold leading-snug text-ink">{pop.text}</span>
            <Stay ms={pop.stayMs} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The reaction: on the flashcard screen, brief, never over the grade bar.
 * It sits exactly on the Tonton peeking over the pile, so it reads as him
 * reacting: the mood face swaps in where he already is and only the bubble
 * drops in beside him, then shrinks back into him. If he isn't there, the
 * corner under the header.
 */
function Reaction({ pop, leaving }: { pop: Pop; leaving: boolean }) {
  const bubble = usePress(director.dismiss, director.hush);
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const peek = document.querySelector("main svg.tt-mascot");
    const el = root.current;
    if (!peek || !el) return;
    const r = peek.getBoundingClientRect();
    if (r.width === 0) return;
    el.style.top = `${r.top}px`;
    el.style.right = `${window.innerWidth - r.right}px`;
  }, [pop.visit]);
  return (
    <div ref={root} key={pop.visit} className="tonton-react fixed right-4 top-[calc(4rem+env(safe-area-inset-top)+3.25rem)] z-30 h-[52px] w-[52px]">
      <Mascot key={pop.id} mood={pop.mood} size={52} quiet className="absolute inset-0" />
      <div
        className={`absolute bottom-2 right-[calc(100%+6px)] w-max max-w-[15rem] origin-bottom-right ${leaving ? SHRINK : ENTRANCE[pop.entrance]}`}
      >
        <span aria-hidden="true" className="absolute -right-[6px] bottom-4 z-10 h-3 w-3 rotate-45 border-r-2 border-t-2 border-rule bg-white" />
        <button
          key={pop.id}
          type="button"
          {...bubble}
          aria-label="Kapat"
          className="tt-bubble relative block w-full select-none overflow-hidden rounded-2xl border-2 border-rule bg-white px-3.5 py-2.5 text-left shadow-[0_3px_0_0_var(--color-rule)] animate-bubble-in [animation-delay:120ms] [-webkit-touch-callout:none] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tonton/40"
        >
          <Kicker text={pop.kicker} />
          <span className="block text-[14px] font-bold leading-snug text-ink">{pop.text}</span>
          <Stay ms={pop.stayMs} />
        </button>
      </div>
    </div>
  );
}

/**
 * Tonton wanders onto the screen now and then, reacts to a grade on the
 * flashcard screen, and says hello once a day. When and what is the
 * director's call (lib/tontonDirector.ts); this only draws the current
 * pop and hands taps back.
 */
function TontonPopups() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { pop, leaving } = useSyncExternalStore(director.subscribe, director.getView);

  useEffect(() => director.attach(() => readSnapshot(queryClient)), [queryClient]);
  useEffect(() => {
    director.route(location.pathname);
  }, [location.pathname]);

  if (!pop || !getToken()) return null;
  return pop.place === "top" ? <Reaction pop={pop} leaving={leaving} /> : <Visit pop={pop} leaving={leaving} />;
}

export default TontonPopups;
