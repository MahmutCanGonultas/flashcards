import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Mascot, { type MascotMood } from "../components/Mascot";
import Rich from "../components/Rich";
import Confetti from "../components/Confetti";
import Stars from "../components/Stars";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import { CheckIcon, FlameIcon, XIcon } from "../components/icons";
import { TOPICS, topicOf } from "../content/grammar";
import { levelOf } from "../content/grammar/catalog";
import type { Question } from "../content/grammar/types";
import { starsFor, useGrammarProgress, useSaveGrammarScore } from "../lib/grammar";
import { isRight, mixedQuiz, prepare, rightAnswer, scoreOf, shuffle, solved, type QuizItem } from "../lib/grammarQuiz";
import { familyStyle } from "../lib/palette";
import { playCorrect, playIncorrect, playLessonComplete } from "../lib/sound";
import { speakAuto } from "../lib/speech";
import { useRecordStudyDay } from "../lib/streak";

/**
 * A grammar quiz, the way Duolingo asks: Tonton holds the question in his
 * bubble, the answer goes in below — pick one, type the gap, or build the
 * sentence from tiles — and "Kontrol et" brings up a green or red bar with
 * why. A miss comes back at the end. The score (first answers only) is
 * saved as the topic's best; any quiz counts as a study day.
 */

const MIXED = "karisik";
const PRAISE = ["Harika!", "Süper!", "Aynen öyle!", "Çok iyi!", "Tam isabet!", "Doğru!"];
const KIND_PROMPT: Record<Question["kind"], string> = {
  choice: "Doğru seçeneği seç",
  type: "Boşluğu doldur",
  order: "Cümleyi kur",
};

type Answer = { picked?: number; typed?: string; built?: number[] };
type Checked = { right: boolean; praise: string };

/** The ___ in a prompt as an empty slot, or filled with the answer once checked. */
function Prompt({ text, fill, tone }: { text: string; fill: string | null; tone: "right" | "wrong" | null }) {
  const parts = text.split(/_{2,}/);
  if (parts.length === 1) return <Rich text={text} />;
  return (
    <>
      <Rich text={parts[0]} />
      {fill ? (
        <span className={`mx-0.5 rounded-md px-1.5 font-black ${tone === "wrong" ? "bg-grass-soft text-grass-ink ring-2 ring-grass/60" : "bg-grass-soft text-grass-ink"}`}>{fill}</span>
      ) : (
        <span aria-label="boşluk" className="mx-1 inline-block w-[3.2em] translate-y-[3px] border-b-[3px] border-hare align-baseline" />
      )}
      <Rich text={parts.slice(1).join("___")} />
    </>
  );
}

/** Tonton with the question in his bubble, Duolingo's way of asking. */
function Asker({ mood, children }: { mood: MascotMood; children: ReactNode }) {
  return (
    <div className="flex items-end gap-2.5">
      <Mascot key={mood} mood={mood} size={84} className="shrink-0" />
      <div className="relative mb-4 min-w-0 flex-1 rounded-2xl border-2 border-rule bg-white px-4 py-3">
        <span aria-hidden="true" className="absolute -left-[7px] bottom-5 h-3 w-3 rotate-45 border-b-2 border-l-2 border-rule bg-white" />
        {children}
      </div>
    </div>
  );
}

/** A white 3D key in one of the quiz's states. */
function optionClass(state: "idle" | "picked" | "right" | "wrong" | "dim"): string {
  switch (state) {
    case "picked":
      return "border-ocean bg-ocean-soft text-ocean-ink shadow-[0_2px_0_0_var(--color-ocean)]";
    case "right":
      return "border-grass bg-grass-soft text-grass-ink shadow-[0_2px_0_0_var(--color-grass)] pointer-events-none";
    case "wrong":
      return "border-berry bg-berry-soft text-berry-ink shadow-[0_2px_0_0_var(--color-berry)] pointer-events-none animate-[shake_320ms_ease-in-out]";
    case "dim":
      return "border-rule bg-white text-hare pointer-events-none";
    default:
      return "border-rule bg-white text-ink shadow-edge press hover:bg-paper-deep";
  }
}

function Quiz({ items, title, backTo, topicSlug, tone }: { items: QuizItem[]; title: string; backTo: string; topicSlug: string | null; tone: Parameters<typeof familyStyle>[0] }) {
  const navigate = useNavigate();
  const progress = useGrammarProgress();
  const save = useSaveGrammarScore();
  const recordStudyDay = useRecordStudyDay();
  const [queue, setQueue] = useState(items);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer>({});
  const [checked, setChecked] = useState<Checked | null>(null);
  const [firsts, setFirsts] = useState<Record<string, boolean>>({});
  const [combo, setCombo] = useState(0);
  const [bestBefore] = useState(() => (topicSlug ? progress.data?.[topicSlug]?.best : undefined));
  const recorded = useRef(false);
  const savedRef = useRef(false);
  const checkingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const item = queue[index];
  const finished = index >= queue.length;
  const total = items.length;
  const done = Object.keys(firsts).length;
  const score = scoreOf(Object.values(firsts));

  // The end: save the topic's score once, and play the fanfare.
  useEffect(() => {
    if (!finished || savedRef.current) return;
    savedRef.current = true;
    playLessonComplete();
    if (topicSlug) save.mutate({ topic: topicSlug, score: scoreOf(Object.values(firsts)) });
  }, [finished, topicSlug, save, firsts]);

  const ready = item
    ? item.question.kind === "choice"
      ? answer.picked !== undefined
      : item.question.kind === "type"
        ? (answer.typed ?? "").trim() !== ""
        : (answer.built ?? []).length > 0
    : false;

  const check = useCallback(() => {
    // Enter in the gap both submits the form and reaches the window: answer once.
    if (!item || checked || !ready || checkingRef.current) return;
    checkingRef.current = true;
    const right = isRight(item, { picked: answer.picked, typed: answer.typed, built: (answer.built ?? []).map((i) => item.tiles![i]) });
    setChecked({ right, praise: PRAISE[Math.floor(Math.random() * PRAISE.length)] });
    inputRef.current?.blur();
    if (!recorded.current) {
      recorded.current = true;
      recordStudyDay.mutate();
    }
    if (!(item.key in firsts)) setFirsts((f) => ({ ...f, [item.key]: right }));
    if (right) {
      setCombo((c) => c + 1);
      playCorrect(combo + 1);
    } else {
      setCombo(0);
      playIncorrect();
      // Missed: it comes back once at the end, reshuffled.
      if (!item.retry) {
        const again: QuizItem = {
          ...item,
          key: `${item.key}:again`,
          retry: true,
          order: item.order ? shuffle(item.order) : undefined,
          tiles: item.tiles ? shuffle(item.tiles) : undefined,
        };
        setQueue((q) => [...q, again]);
      }
    }
    speakAuto(solved(item.question));
  }, [item, checked, ready, answer, firsts, combo, recordStudyDay]);

  const next = useCallback(() => {
    checkingRef.current = false;
    setChecked(null);
    setAnswer({});
    setIndex((i) => i + 1);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const typing = (event.target as HTMLElement | null)?.closest?.("input, textarea");
      if (event.key === "Enter") {
        if ((event.target as HTMLElement | null)?.closest?.("button, a")) return;
        // The gap's own form answers its Enter.
        if (typing && !checked) return;
        event.preventDefault();
        if (checked) next();
        else check();
        return;
      }
      if (!typing && !checked && item?.question.kind === "choice" && /^[1-9]$/.test(event.key)) {
        const n = Number(event.key) - 1;
        if (n < item.question.options.length) setAnswer({ picked: n });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [checked, check, next, item]);

  if (finished) {
    const stars = starsFor(score);
    const record = topicSlug !== null && (bestBefore === undefined || score > bestBefore);
    const right = Object.values(firsts).filter(Boolean).length;
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-8 pt-10 text-center">
        {score >= 90 && <Confetti />}
        <Mascot mood="happy" size={132} greet className="mx-auto" />
        <h1 className="mt-4 text-[32px] font-black leading-tight text-sunny-deep">{score === 100 ? "Kusursuz!" : score >= 70 ? "Alıştırma tamam!" : "Bitti, iyi iş!"}</h1>
        <p className="mt-1 text-[17px] font-bold text-graphite">{title}</p>
        {record && (
          <p className="mx-auto mt-3 w-max rounded-full bg-tangerine px-3.5 py-1 text-[13px] font-black uppercase tracking-[0.08em] text-white shadow-button">
            Yeni rekor
          </p>
        )}
        <div className="mt-7 grid grid-cols-3 gap-3">
          {[
            { head: "Puan", body: `%${score}`, cls: "border-sunny", headCls: "bg-sunny", text: "text-sunny-ink" },
            { head: "Doğru", body: `${right}/${total}`, cls: "border-grass", headCls: "bg-grass", text: "text-grass-ink" },
            { head: "Yıldız", body: <Stars count={stars} size="h-5 w-5" />, cls: "border-tangerine", headCls: "bg-tangerine", text: "text-tangerine-ink" },
          ].map((tile, i) => (
            <div key={tile.head} className={`overflow-hidden rounded-2xl border-2 ${tile.cls} animate-rise-spring`} style={{ animationDelay: `${200 + i * 120}ms` }}>
              <p className={`${tile.headCls} py-1 text-[12px] font-black uppercase tracking-[0.1em] text-white`}>{tile.head}</p>
              <div className={`grid min-h-14 place-items-center bg-white text-[22px] font-black ${tile.text}`}>{tile.body}</div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[16px] font-bold leading-snug text-ink">
          {score === 100
            ? "Hepsi ilk seferde doğru. Bu konu artık senin."
            : score >= 70
              ? "Çok iyi. Kaçanları bir daha gördün; yarın bir tur daha, tamamen oturur."
              : "Kuralı bir kez daha oku, sonra yeniden dene. Yanlışlar en çok öğretenler."}
        </p>
        {topicSlug && save.isError && <p className="mt-3 text-[14px] font-bold text-berry-ink">Puan kaydedilemedi; bağlantını kontrol et.</p>}
        <div className="mt-auto space-y-3 pt-8">
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="face flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-grass text-[16px] font-black uppercase tracking-[0.08em] text-white shadow-button press-3d"
          >
            Devam
          </button>
          <button
            type="button"
            onClick={() => {
              savedRef.current = false;
              checkingRef.current = false;
              setChecked(null);
              setAnswer({});
              setQueue(items.map((it) => ({ ...it, order: it.order ? shuffle(it.order) : undefined, tiles: it.tiles ? shuffle(it.tiles) : undefined })));
              setFirsts({});
              setCombo(0);
              setIndex(0);
            }}
            className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border-2 border-rule bg-white text-[15px] font-black uppercase tracking-[0.08em] text-ocean-ink shadow-edge press"
          >
            Bir daha
          </button>
        </div>
      </div>
    );
  }

  if (!item) return null;
  const q = item.question;
  // "Hangi cümle yanlış?": the right pick is the broken sentence, so it is struck out once found.
  const spotting = q.kind === "choice" && /yanlış\?$/i.test(q.prompt.trim());
  const built = answer.built ?? [];
  const fill = checked ? (checked.right ? (q.kind === "type" ? (answer.typed ?? "").trim() : rightAnswer(q)) : rightAnswer(q)) : null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))]" style={familyStyle(tone)}>
      {/* Close, progress, and the run of right answers. */}
      <div className="flex items-center gap-3.5 pt-2">
        <Link to={backTo} aria-label="Çık" className="-m-2 grid h-11 w-11 shrink-0 place-items-center rounded-full p-2 text-hare hover:text-graphite">
          <XIcon className="h-6 w-6" />
        </Link>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-rule" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
          <div className="relative h-full rounded-full bg-grass transition-[width] duration-500 ease-soft" style={{ width: `${Math.max(4, (done / total) * 100)}%` }}>
            <span aria-hidden="true" className="absolute inset-x-2 top-[3px] h-[4px] rounded-full bg-white/30" />
          </div>
        </div>
        <span className={`flex shrink-0 items-center gap-1 text-[15px] font-black tabular-nums ${combo >= 2 ? "text-tangerine" : "text-hare"}`}>
          <FlameIcon className="h-5 w-5" />
          {combo}
        </span>
      </div>

      <main className="flex-1 pb-44 pt-6">
        {item.retry && <p className="mb-2 text-[13px] font-black uppercase tracking-[0.1em] text-tangerine-ink">Önceki hata</p>}
        <h1 className="text-[24px] font-black leading-tight text-ink">{spotting ? "Yanlış cümleyi bul" : KIND_PROMPT[q.kind]}</h1>

        <div className="mt-5" key={item.key}>
          <Asker mood={checked ? (checked.right ? "happy" : "sad") : "think"}>
            {q.kind === "order" ? (
              <p className="text-[18px] font-bold leading-snug text-ink">{q.tr}</p>
            ) : (
              <>
                <p className="text-[19px] font-bold leading-[1.55] text-ink">
                  <Prompt text={q.prompt} fill={fill} tone={checked ? (checked.right ? "right" : "wrong") : null} />
                </p>
                {q.tr && <p className="mt-1.5 text-[14px] font-semibold leading-snug text-graphite">{q.tr}</p>}
              </>
            )}
          </Asker>

          {q.kind === "choice" && (
            <ol className="mt-5 space-y-2.5">
              {(item.order ?? q.options.map((_, i) => i)).map((optionIndex, shown) => {
                const picked = answer.picked === shown;
                const state = checked
                  ? optionIndex === q.answer
                    ? "right"
                    : picked
                      ? "wrong"
                      : "dim"
                  : picked
                    ? "picked"
                    : "idle";
                return (
                  <li key={optionIndex}>
                    <button
                      type="button"
                      aria-pressed={picked}
                      onClick={() => !checked && setAnswer({ picked: shown })}
                      className={`flex min-h-14 w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3 text-left text-[18px] font-extrabold transition-colors ${optionClass(state)}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 text-[13px] font-black ${state === "idle" ? "border-rule text-hare" : "border-current"}`}
                      >
                        {shown + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={spotting && checked && optionIndex === q.answer ? "line-through decoration-[3px]" : ""}>
                          <Rich text={q.options[optionIndex]} />
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          {q.kind === "type" && (
            <form
              className="mt-5"
              onSubmit={(event: FormEvent) => {
                event.preventDefault();
                check();
              }}
            >
              <label htmlFor={`gap-${item.key}`} className="sr-only">
                Boşluğa gelen kelime
              </label>
              <input
                id={`gap-${item.key}`}
                ref={inputRef}
                value={answer.typed ?? ""}
                onChange={(event) => setAnswer({ typed: event.target.value })}
                readOnly={Boolean(checked)}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="done"
                placeholder="Buraya yaz"
                className={`w-full rounded-2xl border-2 px-4 py-3.5 text-[20px] font-extrabold text-ink outline-none transition-colors placeholder:font-bold placeholder:text-hare ${
                  checked ? (checked.right ? "border-grass bg-grass-soft" : "border-berry bg-berry-soft") : "border-rule bg-paper-deep focus:border-ocean focus:bg-white"
                }`}
              />
            </form>
          )}

          {q.kind === "order" && (
            <div className="mt-5">
              {/* The answer line: tiles picked so far, on ruled lines. */}
              <div
                className={`flex min-h-[7.5rem] flex-wrap content-start gap-2 rounded-2xl border-2 border-dashed px-2.5 py-3 [background:repeating-linear-gradient(to_bottom,transparent_0,transparent_54px,var(--color-rule)_54px,var(--color-rule)_56px)] ${
                  checked ? (checked.right ? "border-grass" : "border-berry") : "border-transparent"
                }`}
              >
                {built.map((tileIndex) => (
                  <button
                    key={tileIndex}
                    type="button"
                    onClick={() => !checked && setAnswer({ built: built.filter((t) => t !== tileIndex) })}
                    className="rounded-xl border-2 border-rule bg-white px-3 py-2 text-[17px] font-extrabold text-ink shadow-edge press animate-[pop-in_160ms_var(--ease-spring)]"
                  >
                    {item.tiles![tileIndex]}
                  </button>
                ))}
              </div>
              {/* The bank: every tile; a picked one leaves its grey shape behind. */}
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {item.tiles!.map((tile, tileIndex) => {
                  const used = built.includes(tileIndex);
                  return (
                    <button
                      key={tileIndex}
                      type="button"
                      disabled={used || Boolean(checked)}
                      aria-hidden={used}
                      onClick={() => setAnswer({ built: [...built, tileIndex] })}
                      className={`rounded-xl border-2 px-3 py-2 text-[17px] font-extrabold ${
                        used ? "border-paper-deep bg-paper-deep text-transparent" : "border-rule bg-white text-ink shadow-edge press"
                      }`}
                    >
                      {tile}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* The bottom: Kontrol et, then the verdict bar with why. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-20 border-t-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 ${
          checked ? (checked.right ? "border-transparent bg-grass-soft animate-sheet-up" : "border-transparent bg-berry-soft animate-sheet-up") : "border-rule bg-white"
        }`}
      >
        <div className="mx-auto max-w-2xl px-5">
          {checked && (
            <div className="mb-4 flex items-start gap-3" role="status">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white ${checked.right ? "text-grass" : "text-berry"}`}>
                {checked.right ? <CheckIcon className="h-6 w-6" /> : <XIcon className="h-6 w-6" />}
              </span>
              <div className="min-w-0">
                <p className={`text-[22px] font-black leading-tight ${checked.right ? "text-grass-ink" : "text-berry-ink"}`}>{checked.right ? checked.praise : "Doğru cevap:"}</p>
                {!checked.right && (
                  <p className="mt-0.5 text-[17px] font-black leading-snug text-berry-ink">
                    {solved(q)}
                  </p>
                )}
                <p className={`mt-1 text-[15px] font-bold leading-snug ${checked.right ? "text-grass-ink/90" : "text-berry-ink/90"}`}>
                  <Rich text={q.explain} />
                </p>
              </div>
            </div>
          )}
          {!checked ? (
            <button
              type="button"
              onClick={check}
              disabled={!ready}
              className="face flex min-h-[54px] w-full items-center justify-center rounded-2xl bg-grass text-[16px] font-black uppercase tracking-[0.08em] text-white shadow-button press-3d disabled:bg-rule disabled:text-hare disabled:shadow-none"
            >
              Kontrol et
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              autoFocus
              className={`face flex min-h-[54px] w-full items-center justify-center rounded-2xl text-[16px] font-black uppercase tracking-[0.08em] text-white shadow-button press-3d ${checked.right ? "bg-grass" : "bg-berry"}`}
            >
              {checked.right ? "Devam" : "Anladım"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * /gramer/:slug/alistirma — one topic's questions, or with `karisik` a
 * mixed round drawn from the topics already practised.
 */
function GrammarQuiz() {
  const { slug = "" } = useParams<{ slug: string }>();
  const progress = useGrammarProgress();
  const topic = slug === MIXED ? null : topicOf(slug);
  // Built once per visit: the order must not change under the learner.
  const [items] = useState<QuizItem[] | null>(() => (topic ? prepare(topic.slug, topic.quiz) : null));
  const [mixed, setMixed] = useState<QuizItem[] | null>(null);

  // The mixed round needs the progress to pick from; it's drawn once, when that arrives.
  useEffect(() => {
    if (slug !== MIXED || mixed || progress.isLoading) return;
    const drawn = mixedQuiz(TOPICS, progress.data ?? {}, 10);
    const timer = window.setTimeout(() => setMixed(drawn), 0);
    return () => window.clearTimeout(timer);
  }, [slug, mixed, progress.isLoading, progress.data]);

  if (slug !== MIXED && !topic) {
    return (
      <main className="mx-auto max-w-2xl px-5 pt-10">
        <ErrorState title="Böyle bir konu yok" message="Gramer listesine dönüp bir konu seç." />
        <Link to="/gramer" className="mt-4 inline-block text-[13px] font-black uppercase tracking-[0.08em] text-ocean-ink">
          ← Gramer
        </Link>
      </main>
    );
  }

  if (topic && items) {
    return <Quiz items={items} title={topic.title} backTo={`/gramer/${topic.slug}`} topicSlug={topic.slug} tone={levelOf(topic.level).tone} />;
  }

  if (!mixed) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 px-5 pt-10">
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </main>
    );
  }

  return <Quiz items={mixed} title="Karışık alıştırma" backTo="/gramer" topicSlug={null} tone="tangerine" />;
}

export default GrammarQuiz;
