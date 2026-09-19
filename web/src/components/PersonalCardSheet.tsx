import { useRef, useState } from "react";
import type { FormEvent } from "react";
import Modal from "./Modal";
import Button from "./Button";
import TextField from "./TextField";
import TextAreaField from "./TextAreaField";
import Mascot from "./Mascot";
import { ApiError } from "../lib/api";
import { useCreatePersonalCard, useSuggestCard, useUploadImage, type Suggestion } from "../lib/personal";
import { playCorrect, playReveal } from "../lib/sound";

type PersonalCardSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  deckId: number | undefined;
};

type Draft = {
  front: string;
  meaning: string;
  note: string;
  example: string;
  exampleTr: string;
  example2: string;
  example2Tr: string;
  topic: string;
  emoji: string;
  /** English part of speech from the suggestion, kept in the back's "(pos)" prefix. */
  pos: string;
  imageUrl: string | null;
};

const EMPTY: Draft = {
  front: "",
  meaning: "",
  note: "",
  example: "",
  exampleTr: "",
  example2: "",
  example2Tr: "",
  topic: "",
  emoji: "",
  pos: "",
  imageUrl: null,
};

/**
 * Adding one of your own words. Type the word (and, if you like, what it
 * means to you), tap "Doldur" and the rest is written for you — meaning,
 * examples with Turkish, a topic — then check, add a photo, save. The
 * word is due straight away and will come back inside the course lessons.
 */
function SheetBody({ onClose, deckId }: Omit<PersonalCardSheetProps, "isOpen">) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [filled, setFilled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const suggest = useSuggestCard(deckId);
  const upload = useUploadImage();
  const create = useCreatePersonalCard(deckId);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const fill = () => {
    const word = draft.front.trim();
    if (!word) {
      setError("Önce kelimeyi yaz.");
      return;
    }
    setError(null);
    suggest.mutate(
      { word, note: draft.note.trim() || null },
      {
        onSuccess: (s: Suggestion) => {
          playReveal();
          setFilled(true);
          setDraft((d) => ({
            ...d,
            front: s.front || d.front,
            meaning: d.meaning || s.meaning_tr,
            example: d.example || s.example_en,
            exampleTr: d.exampleTr || s.example_tr,
            example2: d.example2 || s.example2_en,
            example2Tr: d.example2Tr || s.example2_tr,
            topic: d.topic || s.topic_tr || s.topic,
            emoji: d.emoji || s.emoji,
            pos: s.pos || d.pos,
          }));
        },
        onError: (e) => {
          setError(
            e instanceof ApiError && e.status === 503
              ? "Otomatik doldurma şu an kapalı — alanları elle doldurabilirsin."
              : "Doldurulamadı. Alanları elle de yazabilirsin.",
          );
        },
      },
    );
  };

  const pickPhoto = (file: File | null) => {
    if (!file) return;
    upload.mutate(file, {
      onSuccess: (url) => set({ imageUrl: url }),
      onError: () => setError("Fotoğraf yüklenemedi. Daha küçük bir fotoğraf dene."),
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const front = draft.front.trim();
    const meaning = draft.meaning.trim();
    if (!front || !meaning) {
      setError(!front ? "Kelimeyi yaz." : "Türkçesini yaz (ya da Doldur'a bas).");
      return;
    }
    setError(null);
    // The back keeps the seeded convention "(pos) meaning emoji" so the
    // rest of the app reads it like any other card.
    const back = `${draft.pos ? `(${draft.pos.toLowerCase()}) ` : ""}${meaning}${draft.emoji.trim() ? ` ${draft.emoji.trim()}` : ""}`;
    create.mutate(
      {
        front,
        back,
        tag: draft.topic.trim() || null,
        exampleSentence: draft.example.trim() || null,
        exampleTr: draft.exampleTr.trim() || null,
        example2: draft.example2.trim() || null,
        example2Tr: draft.example2Tr.trim() || null,
        mnemonic: draft.note.trim() || null,
        imageUrl: draft.imageUrl,
      },
      {
        onSuccess: () => {
          playCorrect(3);
          setSaved(front);
          setDraft(EMPTY);
          setFilled(false);
        },
        onError: () => setError("Kaydedilemedi. Bağlantını kontrol edip tekrar dene."),
      },
    );
  };

  if (saved) {
    return (
      <div className="text-center animate-[pop-in_220ms_ease-out]">
        <Mascot mood="happy" size={110} className="mx-auto" />
        <p className="mt-3 text-2xl font-extrabold text-ink">"{saved}" cebinde! 🎉</p>
        <p className="mt-1 text-sm text-graphite">
          Hemen sorabilirim, sonra derslerin başında ara ara karşına çıkaracağım.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => setSaved(null)}>Bir tane daha</Button>
          <Button variant="secondary" onClick={onClose}>
            Tamam
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-end gap-2">
        <Mascot mood={suggest.isPending ? "think" : "idle"} size={48} className="shrink-0" />
        <div className="relative min-w-0 flex-1 rounded-2xl rounded-bl-md border-l-2 border-tonton bg-paper-lift px-3.5 py-2.5 text-sm font-semibold text-ink ring-1 ring-rule shadow-bubble">
          {suggest.isPending
            ? "Yazıyorum… ✍️"
            : filled
              ? "Bak bakalım, doğru mu? Düzeltip kaydet."
              : "Kelimeyi yaz, istersen ne demek olduğunu da; gerisini ben doldururum."}
        </div>
      </div>

      <div className="flex items-end gap-2">
        <TextField
          label="İngilizce kelime"
          value={draft.front}
          onChange={(e) => set({ front: e.target.value })}
          placeholder="örn. cozy"
          autoCapitalize="none"
          autoCorrect="off"
          className="flex-1"
        />
        <Button type="button" variant="secondary" className="whitespace-nowrap" onClick={fill} isLoading={suggest.isPending}>
          ✨ Doldur
        </Button>
      </div>

      <TextAreaField
        label="Senin notun (isteğe bağlı)"
        value={draft.note}
        onChange={(e) => set({ note: e.target.value })}
        placeholder="Nerede duydun, sana ne çağrıştırıyor…"
        rows={2}
      />

      <div className="grid grid-cols-[1fr_4rem] gap-2">
        <TextField label="Türkçesi" value={draft.meaning} onChange={(e) => set({ meaning: e.target.value })} placeholder="rahat, sıcak" />
        <TextField label="Emoji" value={draft.emoji} onChange={(e) => set({ emoji: e.target.value })} placeholder="🛋️" />
      </div>

      <TextField label="Konu" value={draft.topic} onChange={(e) => set({ topic: e.target.value })} placeholder="Ev, Duygular…" />

      <div className="rounded-2xl bg-paper-deep/50 p-3 ring-1 ring-rule">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-graphite">Örnek cümle</p>
        <TextField label="İngilizce" value={draft.example} onChange={(e) => set({ example: e.target.value })} placeholder="This room is so cozy." />
        <TextField label="Türkçesi" value={draft.exampleTr} onChange={(e) => set({ exampleTr: e.target.value })} placeholder="Bu oda çok rahat." className="mt-2" />
      </div>
      <div className="rounded-2xl bg-paper-deep/50 p-3 ring-1 ring-rule">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-graphite">İkinci örnek</p>
        <TextField label="İngilizce" value={draft.example2} onChange={(e) => set({ example2: e.target.value })} />
        <TextField label="Türkçesi" value={draft.example2Tr} onChange={(e) => set({ example2Tr: e.target.value })} className="mt-2" />
      </div>

      {/* The photo: the learner's own picture of the word. */}
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
        />
        {draft.imageUrl ? (
          <img src={draft.imageUrl} alt="" className="h-20 w-20 rounded-2xl object-cover ring-1 ring-rule shadow-print" />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-paper-deep text-3xl ring-1 ring-rule">
            🖼️
          </span>
        )}
        <div className="flex flex-col gap-1.5">
          <Button type="button" variant="secondary" size="sm" isLoading={upload.isPending} onClick={() => fileRef.current?.click()}>
            {draft.imageUrl ? "Fotoğrafı değiştir" : "Fotoğraf ekle"}
          </Button>
          {draft.imageUrl && (
            <button type="button" className="text-left text-xs font-bold text-graphite hover:text-accent" onClick={() => set({ imageUrl: null })}>
              Kaldır
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-2xl bg-paper-lift p-3 text-sm font-medium text-accent ring-1 ring-accent/40">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onClose}>
          Vazgeç
        </Button>
        <Button type="submit" isLoading={create.isPending}>
          Kaydet
        </Button>
      </div>
    </form>
  );
}

function PersonalCardSheet({ isOpen, onClose, deckId }: PersonalCardSheetProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kendi kelimen" emoji="✍️">
      {isOpen && <SheetBody onClose={onClose} deckId={deckId} />}
    </Modal>
  );
}

export default PersonalCardSheet;
