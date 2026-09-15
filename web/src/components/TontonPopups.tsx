import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { Card, Deck } from "../types";
import { getToken } from "../lib/api";
import { popLines } from "../lib/tonton";
import { playChirp } from "../lib/sound";
import Mascot from "./Mascot";

/** How long Tonton stays, and how long he waits between visits. */
const STAY_MS = 8000;
const FIRST_VISIT_MS = 14000;
const GAP_MIN_MS = 50000;
const GAP_MAX_MS = 130000;
/** He never interrupts a question. */
const QUIET_ROUTES = [/\/study/, /\/flashcards/, /\/placement/, /\/test$/];
const REMEMBER = 12;

/**
 * Tonton wanders onto the screen now and then — slides in at the bottom
 * corner, says one thing, waves, and goes. The lines are drawn from a
 * wide pool mixed with what's actually going on (cards waiting, a word to
 * recall, the streak), and the last dozen are kept out so he doesn't
 * repeat himself. Tap him for the next line; tap the bubble to dismiss.
 */
function TontonPopups() {
  const location = useLocation();
  const queryClient = useQueryClient();
  // A line belongs to the screen it was said on: leave the page and he's
  // gone; he doesn't follow you around.
  const [line, setLine] = useState<{ text: string; at: string } | null>(null);
  const [visits, setVisits] = useState(0);
  const recentRef = useRef<string[]>([]);
  const hideTimer = useRef(0);

  const quiet = !getToken() || location.pathname === "/login" || location.pathname === "/register" || QUIET_ROUTES.some((r) => r.test(location.pathname));

  const pick = () => {
    // Everything he might mention comes from what's already loaded; he
    // never fetches on his own.
    const decks = (queryClient.getQueryData(["decks"]) as Deck[] | undefined) ?? [];
    const personalDeck = decks.find((d) => d.kind === "personal");
    const allCards = queryClient
      .getQueriesData<Card[]>({ queryKey: ["cards"] })
      .flatMap(([, data]) => data ?? []);
    const personal = allCards.filter((c) => personalDeck && c.deck_id === personalDeck.id);
    const cards = allCards.filter((c) => !personalDeck || c.deck_id !== personalDeck.id);
    const streak = (queryClient.getQueryData(["streak"]) as { streak?: number } | undefined)?.streak ?? 0;
    const pool = popLines({ cards, personal, streak }).filter((l) => !recentRef.current.includes(l));
    const next = pool[Math.floor(Math.random() * Math.min(pool.length, 6))] ?? pool[0] ?? "Buradayım. 👋";
    recentRef.current = [next, ...recentRef.current].slice(0, REMEMBER);
    return next;
  };

  // The visits: a first one soon after the app opens, then at irregular gaps.
  useEffect(() => {
    if (quiet) return;
    let timer = 0;
    const schedule = (delay: number) => {
      timer = window.setTimeout(() => {
        setLine({ text: pick(), at: window.location.pathname });
        setVisits((n) => n + 1);
        hideTimer.current = window.setTimeout(() => setLine(null), STAY_MS);
        schedule(GAP_MIN_MS + Math.random() * (GAP_MAX_MS - GAP_MIN_MS));
      }, delay);
    };
    schedule(FIRST_VISIT_MS);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiet]);

  // On a quiet screen he simply isn't rendered; the scheduling effect's
  // cleanup already stopped the timers, so nothing is left running.
  if (!line || quiet || line.at !== location.pathname) return null;

  const another = () => {
    playChirp();
    window.clearTimeout(hideTimer.current);
    setLine({ text: pick(), at: location.pathname });
    setVisits((n) => n + 1);
    hideTimer.current = window.setTimeout(() => setLine(null), STAY_MS);
  };

  return (
    <div
      key={visits}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-start px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] animate-[tonton-in_520ms_cubic-bezier(0.34,1.4,0.64,1)_both]"
    >
      <div className="pointer-events-auto flex max-w-[22rem] items-end gap-2">
        <button
          type="button"
          onClick={another}
          aria-label="Tonton'a dokun (ziyaret)"
          data-silent
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
        >
          <Mascot mood="happy" size={72} />
        </button>
        <button
          type="button"
          onClick={() => setLine(null)}
          aria-label="Kapat"
          className="relative mb-4 min-w-0 rounded-3xl rounded-bl-md bg-white px-4 py-3 text-left ring-1 ring-stone-200 shadow-[0_10px_30px_-12px_rgba(28,25,23,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
        >
          <span
            aria-hidden="true"
            className="absolute -left-1.5 bottom-4 h-3 w-3 rotate-45 rounded-sm bg-white ring-1 ring-stone-200 [clip-path:polygon(0_0,0_100%,100%_100%)]"
          />
          <span className="block text-[15px] font-semibold leading-snug text-stone-700">{line.text}</span>
        </button>
      </div>
    </div>
  );
}

export default TontonPopups;
