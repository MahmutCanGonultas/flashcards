import { coreMeaning } from "../lib/wordBrowser";

/**
 * "yaklaşmak (yer ya da zaman olarak)": the meaning in full weight, the
 * note after it a step softer, so the eye lands on the meaning first.
 */
function MeaningText({ text, noteClassName = "font-bold text-graphite" }: { text: string; noteClassName?: string }) {
  const core = coreMeaning(text);
  const note = text.slice(core.length).trim();
  return (
    <>
      {core}
      {note && <span className={`text-[0.86em] ${noteClassName}`}> {note}</span>}
    </>
  );
}

export default MeaningText;
