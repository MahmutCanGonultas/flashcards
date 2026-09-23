import { richTokens, type RichKind } from "../lib/rich";

const HIGHLIGHT = "rounded-[5px] px-[2px] font-black [box-decoration-break:clone] [-webkit-box-decoration-break:clone]";

/** Each mark's look; lib/rich.ts says what each one means. */
const CLASS: Record<RichKind, string> = {
  text: "",
  focus: `${HIGHLIGHT} bg-grass-soft text-grass-ink`,
  partner: `${HIGHLIGHT} bg-ocean-soft text-ocean-ink`,
  extra: `${HIGHLIGHT} bg-tangerine-soft text-tangerine-ink`,
  bold: "font-black",
  wrong: "text-berry-ink line-through decoration-2",
};

/** Grammar text with its colour marks drawn in. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {richTokens(text).map((token, i) =>
        token.kind === "text" ? (
          token.text
        ) : (
          <span key={i} className={CLASS[token.kind]}>
            {token.text}
          </span>
        ),
      )}
    </>
  );
}

export default Rich;
