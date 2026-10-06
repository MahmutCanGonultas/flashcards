import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import TontonLine from "../components/TontonLine";
import SpeakButton from "../components/SpeakButton";
import Skeleton from "../components/Skeleton";
import LitWords from "../components/LitWords";
import BackHome from "../components/BackHome";
import { familyStyle } from "../lib/palette";
import { useWeekText, useWeekWords } from "../lib/weekText";
import { markDone } from "../lib/dailyDone";

/**
 * Friday's reading: a short text made of the week's words and the ones
 * before, every line within the learner's grammar. Each line can be heard,
 * the whole text too, and the Turkish waits behind one button.
 */
function WeekReading() {
  const week = Number(useParams<{ week: string }>().week);
  const text = useWeekText(week);
  const words = useWeekWords(week);
  const [turkish, setTurkish] = useState(false);
  const navigate = useNavigate();
  const reading = text.data?.reading;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-5" style={familyStyle("ocean")}>
        <BackHome />
        <p className="mt-2 text-[13px] font-black uppercase tracking-[0.12em] text-ocean-ink">Hafta {week} · Okuma</p>
        {text.isLoading ? (
          <Skeleton className="mt-3 h-64 w-full rounded-[22px]" />
        ) : !reading ? (
          <TontonLine className="mt-6" size={60} mood="think">
            Bu haftanın okuma parçası henüz hazır değil.
          </TontonLine>
        ) : (
          <>
            <h1 className="mt-1 text-[30px] font-black leading-[1.05] tracking-[-0.02em] text-ink">{reading.title}</h1>
            <TontonLine className="mt-4" size={50}>
              Önce dinle, sonra her cümleyi kendin sesli oku. Takılırsan Türkçesine bak.
            </TontonLine>
            <div className="mt-5 flex items-center gap-2">
              <SpeakButton text={reading.lines.map((line) => line.en).join(" ")} size="md" />
              <span className="text-[14px] font-black text-graphite">Hepsini dinle</span>
              <button
                type="button"
                onClick={() => setTurkish((on) => !on)}
                className="ml-auto rounded-xl border-2 border-rule bg-white px-3 py-2 text-[12px] font-black uppercase tracking-[0.08em] text-ocean-ink shadow-edge press"
              >
                {turkish ? "Türkçeyi gizle" : "Türkçesini göster"}
              </button>
            </div>
            <ol className="mt-4 space-y-2.5">
              {reading.lines.map((line, i) => (
                <li key={i} className="card-3d flex items-start gap-3 rounded-2xl px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] font-bold leading-[1.5] text-ink">
                      <LitWords sentence={line.en} words={words} />
                    </p>
                    {turkish && <p className="mt-1 text-[14px] font-semibold leading-snug text-graphite">{line.tr}</p>}
                  </div>
                  <SpeakButton text={line.en} size="sm" />
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => {
                markDone("reading");
                navigate("/bugun");
              }}
              className="face mt-6 flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-grass text-[15px] font-black uppercase tracking-[0.08em] text-white shadow-button press-3d"
            >
              Okudum ✓
            </button>
            {words.length > 0 && (
              <div className="mt-6">
                <p className="text-[12px] font-black uppercase tracking-[0.12em] text-graphite">Bu haftanın kelimeleri</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {words.map((word) => (
                    <span key={word} className="rounded-full bg-(--c-soft) px-3 py-1 text-[14px] font-black text-(--c-ink)">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <AppTabs />
    </div>
  );
}

export default WeekReading;
