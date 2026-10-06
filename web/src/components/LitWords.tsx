import type { ReactNode } from "react";
import { locateWord } from "../lib/sentence";

/**
 * A sentence with every one of the given words lit up, in whatever form it
 * takes there ("considering" for consider): the week's words stand out in
 * the week's reading.
 */
function LitWords({ sentence, words }: { sentence: string; words: string[] }) {
  const ranges = words
    .map((word) => locateWord(sentence, word))
    .filter((range): range is { start: number; end: number } => range !== null)
    .sort((a, b) => a.start - b.start)
    .filter((range, i, all) => i === 0 || range.start >= all[i - 1].end);
  const parts: ReactNode[] = [];
  let at = 0;
  ranges.forEach((range, i) => {
    if (range.start > at) parts.push(sentence.slice(at, range.start));
    parts.push(
      <span key={i} className="rounded-md bg-(--c-soft) px-1 font-black text-(--c-ink)">
        {sentence.slice(range.start, range.end)}
      </span>,
    );
    at = range.end;
  });
  if (at < sentence.length) parts.push(sentence.slice(at));
  return <>{parts}</>;
}

export default LitWords;
