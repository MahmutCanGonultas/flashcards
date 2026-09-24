/**
 * The one-time question after a finished round, "Her akşam haber vereyim
 * mi?": "Şimdi değil" keeps it quiet for a week. Remembered in this
 * browser only; where storage is blocked (a private tab) the question is
 * simply asked again, and nothing breaks.
 */

export const PROMPT_KEY = "kelimece:reminderPromptAt";
/** Days the question stays quiet after "Şimdi değil". */
export const PROMPT_QUIET_DAYS = 7;

type Store = Pick<Storage, "getItem" | "setItem">;

function browserStore(): Store | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Whether "Şimdi değil" was said within the last week. */
export function promptDismissed(now = Date.now(), store: Store | null = browserStore()): boolean {
  try {
    const at = Number(store?.getItem(PROMPT_KEY) ?? 0);
    return at > 0 && now - at < PROMPT_QUIET_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

export function dismissPrompt(now = Date.now(), store: Store | null = browserStore()): void {
  try {
    store?.setItem(PROMPT_KEY, String(now));
  } catch {
    /* blocked storage: it asks again next time */
  }
}
