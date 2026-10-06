import { useState } from "react";
import type { FormEvent } from "react";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import Modal from "../components/Modal";
import Sheet from "../components/Sheet";
import TextField from "../components/TextField";
import TontonLine from "../components/TontonLine";
import SpeakButton from "../components/SpeakButton";
import Skeleton from "../components/Skeleton";
import ErrorState from "../components/ErrorState";
import { PlusIcon, SearchIcon, XIcon } from "../components/icons";
import { useAddNotebookWord, useDeleteNotebookWord, useNotebookCards, useNotebookDeck, type NotebookWord } from "../lib/notebook";
import { parseBack } from "../lib/cardBack";
import { fold } from "../lib/wordBrowser";
import { tintStyle } from "../lib/tint";
import { familyStyle } from "../lib/palette";
import { playCorrect, playReveal } from "../lib/sound";
import { primeSpeech } from "../lib/speech";
import type { Card, Deck } from "../types";

const EMPTY: NotebookWord = { front: "", meaning: "", example: "", exampleTr: "", note: "" };

const meaningOf = (card: Card) => parseBack(card.back).text;

/** A sticky note's tilt: a degree or so either way, the same for a word every time. */
const tilt = (id: number) => `rotate(${((id % 5) - 2) * 0.7}deg)`;

/** Writing a word down: the word and what it means, a sentence and a note if you like. */
function AddForm({ deck, onClose }: { deck: Deck; onClose: () => void }) {
  const [word, setWord] = useState<NotebookWord>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const add = useAddNotebookWord(deck);
  const set = (patch: Partial<NotebookWord>) => setWord((w) => ({ ...w, ...patch }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!word.front.trim() || !word.meaning.trim()) {
      setError(!word.front.trim() ? "Kelimeyi yaz." : "Türkçesini yaz.");
      return;
    }
    setError(null);
    add.mutate(word, {
      onSuccess: () => {
        playCorrect(3);
        setSaved(word.front.trim());
        setWord(EMPTY);
      },
      onError: () => setError("Kaydedilemedi. Bağlantını kontrol edip tekrar dene."),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3.5">
      {saved && (
        <p role="status" className="rounded-2xl bg-grass-soft px-3.5 py-2.5 text-[15px] font-black text-grass-ink">
          “{saved}” deftere yazıldı. Bir tane daha?
        </p>
      )}
      <TextField label="İngilizce kelime" value={word.front} onChange={(e) => set({ front: e.target.value })} placeholder="örn. cozy" autoCapitalize="none" autoCorrect="off" />
      <TextField label="Türkçesi" value={word.meaning} onChange={(e) => set({ meaning: e.target.value })} placeholder="rahat, sıcacık" />
      <TextField label="Örnek cümle (isteğe bağlı)" value={word.example} onChange={(e) => set({ example: e.target.value })} placeholder="This café is so cozy." />
      <TextField label="Cümlenin Türkçesi (isteğe bağlı)" value={word.exampleTr} onChange={(e) => set({ exampleTr: e.target.value })} placeholder="Bu kafe çok sıcacık." />
      <TextField label="Notun (isteğe bağlı)" value={word.note} onChange={(e) => set({ note: e.target.value })} placeholder="Nerede duydun?" />
      {error && (
        <p role="alert" className="rounded-2xl bg-berry-soft px-3.5 py-2.5 text-[14px] font-bold text-berry-ink">
          {error}
        </p>
      )}
      <div className="flex gap-2.5 pt-1">
        <button type="button" onClick={onClose} className="flex min-h-[52px] flex-1 items-center justify-center rounded-2xl border-2 border-rule bg-white text-[14px] font-black uppercase tracking-[0.08em] text-graphite shadow-edge press">
          Kapat
        </button>
        <button
          type="submit"
          disabled={add.isPending}
          className="face flex min-h-[52px] flex-[2] items-center justify-center rounded-2xl bg-sunny text-[15px] font-black uppercase tracking-[0.08em] text-ink shadow-button press-3d disabled:opacity-60"
        >
          Deftere yaz
        </button>
      </div>
    </form>
  );
}

/** One word opened: big, with its sound, its meaning, its sentence and the note. */
function WordDetail({ card, deck, onClose }: { card: Card; deck: Deck; onClose: () => void }) {
  const remove = useDeleteNotebookWord(deck);
  const [sure, setSure] = useState(false);
  return (
    <div style={tintStyle(card)}>
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 wrap-break-word text-[34px] font-black leading-tight tint-text">{card.front}</p>
        <SpeakButton text={card.front} size="md" />
      </div>
      <p className="mt-1 text-[20px] font-black text-ink">{meaningOf(card)}</p>
      {card.example_sentence && (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-(--c-soft) px-3.5 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-bold leading-snug text-ink">{card.example_sentence}</p>
            {card.example_tr && <p className="mt-1 text-[14px] font-semibold text-graphite">{card.example_tr}</p>}
          </div>
          <SpeakButton text={card.example_sentence} size="sm" />
        </div>
      )}
      {card.mnemonic && <p className="mt-3 rounded-2xl bg-sunny-soft px-3.5 py-2.5 text-[14px] font-bold text-sunny-ink">📝 {card.mnemonic}</p>}
      <p className="mt-4 text-[12px] font-bold text-hare">Deftere yazıldı: {new Date(card.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}</p>
      <button
        type="button"
        disabled={remove.isPending}
        onClick={() => (sure ? remove.mutate(card.id, { onSuccess: onClose }) : setSure(true))}
        className={`mt-4 flex min-h-11 w-full items-center justify-center rounded-2xl text-[13px] font-black uppercase tracking-[0.08em] ${sure ? "bg-berry text-white" : "border-2 border-rule bg-white text-berry-ink"}`}
      >
        {sure ? "Evet, defterden sil" : "Defterden sil"}
      </button>
    </div>
  );
}

/**
 * Looking through the notebook as cards: shuffled, the word on its colour,
 * a tap for the meaning and the sentence, then the next. Nothing is marked
 * or scheduled; it's only for looking.
 */
function Practice({ cards, onClose }: { cards: Card[]; onClose: () => void }) {
  const [order] = useState(() => [...cards].sort(() => Math.random() - 0.5));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = order[index];
  const done = index >= order.length;
  const next = () => {
    setFlipped(false);
    setIndex((i) => i + 1);
  };
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-3.5">
        <button type="button" aria-label="Kapat" onClick={onClose} className="-m-2 grid h-11 w-11 place-items-center rounded-full p-2 text-hare hover:text-graphite">
          <XIcon className="h-6 w-6" />
        </button>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-rule">
          <div className="h-full rounded-full bg-sunny transition-[width] duration-300" style={{ width: `${(Math.min(index, order.length) / order.length) * 100}%` }} />
        </div>
        <span className="text-[13px] font-black tabular-nums text-graphite">{Math.min(index + 1, order.length)} / {order.length}</span>
      </div>

      {done ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center animate-rise-in">
          <p className="text-[56px]">📒</p>
          <p className="mt-2 text-[28px] font-black text-ink">Defter bitti!</p>
          <p className="mt-1 text-[15px] font-bold text-graphite">{order.length} kelimeye baktın.</p>
          <button type="button" onClick={onClose} className="face mt-6 flex min-h-[56px] w-full max-w-sm items-center justify-center rounded-2xl bg-sunny text-[15px] font-black uppercase tracking-[0.08em] text-ink shadow-button press-3d">
            Deftere dön
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            key={card.id}
            onClick={() => {
              primeSpeech();
              if (!flipped) playReveal();
              setFlipped(true);
            }}
            style={tintStyle(card)}
            className={`@container mt-6 flex flex-1 flex-col items-center justify-center rounded-[28px] px-6 text-center animate-[card-rise_420ms_var(--ease-spring)] ${flipped ? "border-2 border-rule bg-white text-ink shadow-[0_4px_0_0_var(--color-rule)]" : "cover-ground text-white"}`}
          >
            {!flipped ? (
              <>
                <span className="wrap-break-word text-[clamp(34px,14cqw,60px)] font-black leading-[0.95] tracking-[-0.02em] [text-shadow:0_3px_0_rgba(0,0,0,0.14)]">{card.front}</span>
                <span className="mt-6 text-[11px] font-black uppercase tracking-[0.16em] text-white/75">dokun · anlamı</span>
              </>
            ) : (
              <>
                <span className="text-[17px] font-black tint-text">{card.front}</span>
                <span className="mt-2 wrap-break-word text-[32px] font-black leading-[1.1] text-ink">{meaningOf(card)}</span>
                {card.example_sentence && (
                  <span className="mt-5 block rounded-2xl bg-(--c-soft) px-4 py-3 text-left">
                    <span className="block text-[16px] font-bold leading-snug text-ink">{card.example_sentence}</span>
                    {card.example_tr && <span className="mt-1 block text-[14px] font-semibold text-graphite">{card.example_tr}</span>}
                  </span>
                )}
              </>
            )}
          </button>
          <div className="mt-4 flex items-center gap-2.5">
            <SpeakButton text={card.front} size="md" />
            <button
              type="button"
              onClick={() => (flipped ? next() : setFlipped(true))}
              className={`face flex min-h-[56px] flex-1 items-center justify-center rounded-2xl text-[15px] font-black uppercase tracking-[0.08em] text-white shadow-button press-3d ${flipped ? "bg-grass" : "bg-ocean"}`}
            >
              {flipped ? "Sonraki →" : "Çevir"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Defterim — the learner's own corner, apart from the programme: words they
 * met somewhere and wrote down, as coloured sticky notes. Write one down,
 * open one to hear it and see its sentence, or shuffle them and go through
 * them as cards. Nothing here is scheduled or counted.
 */
function Defter() {
  const deckQuery = useNotebookDeck();
  const cardsQuery = useNotebookCards(deckQuery.data);
  const deck = deckQuery.data;
  const cards = cardsQuery.data;
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [practising, setPractising] = useState(false);
  const [query, setQuery] = useState("");

  const sorted = [...(cards ?? [])].sort((a, b) => b.id - a.id);
  const wanted = fold(query.trim());
  const shown = wanted ? sorted.filter((c) => fold(`${c.front} ${meaningOf(c)} ${c.example_sentence ?? ""}`).includes(wanted)) : sorted;
  const open = sorted.find((c) => c.id === openId) ?? null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-5">
        {/* The notebook's cover: yellow, with a spiral along the top. */}
        <section style={familyStyle("sunny")} className="relative overflow-hidden rounded-[24px] bg-sunny px-5 pb-5 pt-7 shadow-[inset_0_-6px_0_0_rgba(0,0,0,0.1)]">
          <div aria-hidden="true" className="absolute inset-x-5 top-2.5 flex justify-between">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className="h-3 w-3 rounded-full bg-white/70 shadow-[inset_0_2px_0_0_rgba(0,0,0,0.12)]" />
            ))}
          </div>
          <h1 className="text-[34px] font-black leading-[1.05] tracking-[-0.02em] text-ink">Defterim ✍️</h1>
          <p className="mt-1 text-[15px] font-bold text-ink/75">Kendi kelimelerin: dizide, sokakta, işte duyduğun ne varsa.</p>
          <p className="mt-3 text-[14px] font-black text-ink/80">{cards ? `${cards.length} kelime` : "…"}</p>
        </section>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => deck && setAdding(true)}
            className="face flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-sunny-deep text-[14px] font-black uppercase tracking-[0.08em] text-white shadow-button press-3d max-[359px]:text-[12px] max-[359px]:tracking-normal"
          >
            <PlusIcon className="h-5 w-5" /> Kelime yaz
          </button>
          <button
            type="button"
            disabled={!cards || cards.length < 2}
            onClick={() => setPractising(true)}
            className="face flex min-h-[56px] items-center justify-center rounded-2xl bg-ocean px-1 text-[14px] font-black uppercase tracking-[0.08em] text-white shadow-button press-3d disabled:bg-rule disabled:text-hare disabled:shadow-none max-[359px]:text-[12px] max-[359px]:tracking-normal"
          >
            Karıştır, çalış
          </button>
        </div>

        {deckQuery.isError || cardsQuery.isError ? (
          <div className="mt-8">
            <ErrorState title="Defter açılamadı" message="Bağlantını kontrol edip tekrar dene." onRetry={() => void cardsQuery.refetch()} />
          </div>
        ) : !cards ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-28 rounded-[18px]" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <TontonLine className="mt-7" size={60}>
            Defterin boş. Bugün duyduğun, aklına takılan ilk kelimeyi yaz; burada hep seni bekler.
          </TontonLine>
        ) : (
          <>
            {cards.length > 8 && (
              <div className="relative mt-5">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-hare" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Defterde ara"
                  aria-label="Defterde ara"
                  className="w-full rounded-2xl border-2 border-rule bg-paper-deep py-3 pl-12 pr-4 text-[16px] font-bold text-ink outline-none focus:border-sunny-deep focus:bg-white"
                />
              </div>
            )}
            <ul className="mt-5 grid grid-cols-2 gap-3">
              {shown.map((card) => (
                <li key={card.id} style={{ transform: tilt(card.id) }}>
                  <button
                    type="button"
                    onClick={() => setOpenId(card.id)}
                    style={tintStyle(card)}
                    className="@container flex min-h-28 w-full flex-col justify-between rounded-[18px] cover-ground p-3.5 text-left text-white transition-transform duration-150 active:scale-[0.97]"
                  >
                    <span className="wrap-break-word text-[clamp(18px,12cqw,24px)] font-black leading-tight [text-shadow:0_2px_0_rgba(0,0,0,0.12)]">{card.front}</span>
                    <span className="mt-2 line-clamp-2 text-[13px] font-bold leading-snug text-white/90">{meaningOf(card)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Deftere yaz" emoji="✍️">
        {adding && deck && <AddForm deck={deck} onClose={() => setAdding(false)} />}
      </Modal>
      <Sheet isOpen={open !== null} onClose={() => setOpenId(null)} title={open?.front ?? ""} style={open ? tintStyle(open) : undefined}>
        {open && deck && <WordDetail card={open} deck={deck} onClose={() => setOpenId(null)} />}
      </Sheet>
      {practising && cards && <Practice cards={cards} onClose={() => setPractising(false)} />}
      <AppTabs />
    </div>
  );
}

export default Defter;
