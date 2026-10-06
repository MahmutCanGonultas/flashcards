import { useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import TontonLine from "../components/TontonLine";
import SpeakButton from "../components/SpeakButton";
import Skeleton from "../components/Skeleton";
import LitWords from "../components/LitWords";
import { familyStyle } from "../lib/palette";
import BackHome from "../components/BackHome";
import { useWeekText, useWeekWords } from "../lib/weekText";
import { markDone } from "../lib/dailyDone";

const draftKey = (week: number) => `kelimece:translation:${week}`;

/** The learner's draft, kept on this device only; storage may be missing (private mode), then it simply isn't kept. */
function readDraft(week: number): string {
  try {
    return localStorage.getItem(draftKey(week)) ?? "";
  } catch {
    return "";
  }
}

function writeDraft(week: number, text: string) {
  try {
    localStorage.setItem(draftKey(week), text);
  } catch {
    /* not kept */
  }
}

/**
 * Saturday's translation: a short Turkish text that needs the week's words.
 * The learner writes the English first, then lays it next to a model,
 * line by line. Different from the model can still be right.
 */
function WeekTranslation() {
  const week = Number(useParams<{ week: string }>().week);
  const text = useWeekText(week);
  const words = useWeekWords(week);
  const [draft, setDraft] = useState(() => readDraft(week));
  const [shown, setShown] = useState(false);
  const translation = text.data?.translation;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-5" style={familyStyle("tangerine")}>
        <BackHome />
        <p className="mt-2 text-[13px] font-black uppercase tracking-[0.12em] text-tangerine-ink">Hafta {week} · Çeviri</p>
        {text.isLoading ? (
          <Skeleton className="mt-3 h-64 w-full rounded-[22px]" />
        ) : !translation ? (
          <TontonLine className="mt-6" size={60} mood="think">
            Bu haftanın çeviri metni henüz hazır değil.
          </TontonLine>
        ) : (
          <>
            <h1 className="mt-1 text-[30px] font-black leading-[1.05] tracking-[-0.02em] text-ink">{translation.title}</h1>
            <TontonLine className="mt-4" size={50}>
              İngilizceye çevir. Kelimesi kelimesine değil: önce ne dediğini düşün, sonra bildiğin kalıplarla kur.
            </TontonLine>

            <div className="card-3d mt-5 rounded-[22px] px-4 py-4">
              <p className="text-[17px] font-bold leading-[1.6] text-ink">{translation.lines.map((line) => line.tr).join(" ")}</p>
            </div>

            {words.length > 0 && (
              <div className="mt-4">
                <p className="text-[12px] font-black uppercase tracking-[0.12em] text-graphite">Bu kelimeleri kullan</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {words.map((word) => (
                    <span key={word} className="rounded-full bg-(--c-soft) px-3 py-1 text-[14px] font-black text-(--c-ink)">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <label htmlFor="translation" className="mt-5 block text-[12px] font-black uppercase tracking-[0.12em] text-graphite">
              Senin çevirin
            </label>
            <textarea
              id="translation"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                writeDraft(week, event.target.value);
              }}
              rows={8}
              autoCapitalize="sentences"
              spellCheck={false}
              placeholder="Today is Saturday…"
              className="mt-2 w-full resize-y rounded-2xl border-2 border-rule bg-paper-deep px-4 py-3.5 text-[17px] font-bold leading-snug text-ink outline-none transition-colors placeholder:font-semibold placeholder:text-hare focus:border-tangerine focus:bg-white"
            />

            {!shown ? (
              <button
                type="button"
                onClick={() => {
                  setShown(true);
                  markDone("translation");
                }}
                className="face mt-4 flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-tangerine text-[15px] font-black uppercase tracking-[0.08em] text-white shadow-button press-3d"
              >
                {draft.trim() ? "Örnek çeviriyle karşılaştır" : "Örnek çeviriyi göster"}
              </button>
            ) : (
              <div className="mt-6 animate-rise-in">
                <p className="text-[12px] font-black uppercase tracking-[0.12em] text-graphite">Örnek çeviri, cümle cümle</p>
                <p className="mt-1 text-[14px] font-semibold leading-snug text-graphite">Seninki farklıysa yanlış olmayabilir; aynı şeyi söylüyor mu, ona bak.</p>
                <ol className="mt-3 space-y-2.5">
                  {translation.lines.map((line, i) => (
                    <li key={i} className="card-3d flex items-start gap-3 rounded-2xl px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold leading-snug text-graphite">{line.tr}</p>
                        <p className="mt-1 text-[17px] font-bold leading-[1.5] text-ink">
                          <LitWords sentence={line.en} words={words} />
                        </p>
                      </div>
                      <SpeakButton text={line.en} size="sm" />
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </main>
      <AppTabs />
    </div>
  );
}

export default WeekTranslation;
