import { useSyncExternalStore } from "react";
import { director } from "./tontonDirector";

/**
 * There is one Tonton. While he is out on a visit (the bubble at the foot
 * of the screen), the Tonton drawn into the page steps out of his spot, so
 * the visit reads as him walking over rather than a second one appearing.
 */
export function useTontonAway(): boolean {
  const view = useSyncExternalStore(director.subscribe, director.getView, director.getView);
  return Boolean(view.pop && view.pop.place === "bottom" && !view.leaving);
}
