import { useSyncExternalStore } from "react";
import { director } from "./tontonDirector";

/**
 * There is one Tonton. While he is out on a visit (the bubble at the foot
 * of the screen, or the giant), the Tonton drawn into the page steps out of
 * his spot, so the visit reads as him walking over rather than a second one
 * appearing. From a small visit he starts back as it sinks; the giant has to
 * be off the screen first.
 */
export function useTontonAway(): boolean {
  const view = useSyncExternalStore(director.subscribe, director.getView, director.getView);
  const pop = view.pop;
  if (!pop) return false;
  return pop.place === "big" || (pop.place === "bottom" && !view.leaving);
}
