/**
 * Grammar text with its colours (content/grammar/types.ts):
 *
 *   {am}          the form being taught      green
 *   [I]           what decides it            blue
 *   <every day>   a third part worth seeing  orange
 *   **word**      bold
 *   ~~word~~      a wrong form, struck out   red
 *
 * Marks don't nest. components/Rich.tsx draws them; `plain` strips them,
 * for the voice and for checking an answer.
 */

export type RichKind = "text" | "focus" | "partner" | "extra" | "bold" | "wrong";
export type RichToken = { kind: RichKind; text: string };

const MARK = /\{([^}]+)\}|\[([^\]]+)\]|<([^>]+)>|\*\*([^*]+)\*\*|~~([^~]+)~~/g;
const KINDS: RichKind[] = ["focus", "partner", "extra", "bold", "wrong"];

export function richTokens(text: string): RichToken[] {
  const out: RichToken[] = [];
  let at = 0;
  for (const match of text.matchAll(MARK)) {
    const index = match.index ?? 0;
    if (index > at) out.push({ kind: "text", text: text.slice(at, index) });
    const group = match.slice(1).findIndex((g) => g !== undefined);
    out.push({ kind: KINDS[group], text: match[group + 1] });
    at = index + match[0].length;
  }
  if (at < text.length) out.push({ kind: "text", text: text.slice(at) });
  return out;
}

export function plain(text: string): string {
  return richTokens(text)
    .map((t) => t.text)
    .join("");
}
