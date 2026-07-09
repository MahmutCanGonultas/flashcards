import { useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import type { Deck, Card as CardModel } from "../types";
import { themeFor } from "../lib/themes";
import Header from "../components/Header";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import Skeleton from "../components/Skeleton";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import CardItem from "../components/CardItem";
import CardFormModal from "../components/CardFormModal";
import type { CardFormValues } from "../components/CardFormModal";
import DeckFormModal from "../components/DeckFormModal";
import ConfirmDialog from "../components/ConfirmDialog";

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function DeckDetail() {
  // Falls back to "" so every hook below runs in the same order on every
  // render; the missing-param guard runs once the hooks are done.
  const { deckId = "" } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardModel | null>(null);
  const [deletingCard, setDeletingCard] = useState<CardModel | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteDeckOpen, setIsDeleteDeckOpen] = useState(false);

  // No single-deck endpoint exists, so read the decks list and find this one.
  const decksQuery = useQuery({
    queryKey: ["decks"],
    queryFn: () => api.get<{ decks: Deck[] }>("/decks").then((r) => r.decks),
  });

  const cardsQuery = useQuery({
    queryKey: ["cards", deckId],
    queryFn: () =>
      api
        .get<{ cards: CardModel[] }>(`/decks/${deckId}/cards`)
        .then((r) => r.cards),
    enabled: deckId !== "",
  });

  const deck = decksQuery.data?.find((d) => String(d.id) === deckId);

  const createCard = useMutation({
    mutationFn: (values: CardFormValues) =>
      api.post<{ card: CardModel }>(`/decks/${deckId}/cards`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
      queryClient.invalidateQueries({ queryKey: ["dueCards", deckId] });
      setIsAddOpen(false);
    },
  });

  const updateCard = useMutation({
    mutationFn: (input: { cardId: number; values: CardFormValues }) =>
      api.put<{ card: CardModel }>(
        `/decks/${deckId}/cards/${input.cardId}`,
        input.values,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
      setEditingCard(null);
    },
  });

  const deleteCard = useMutation({
    mutationFn: (cardId: number) =>
      api.delete<{ message: string }>(`/decks/${deckId}/cards/${cardId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
      queryClient.invalidateQueries({ queryKey: ["dueCards", deckId] });
      setDeletingCard(null);
    },
  });

  const renameDeck = useMutation({
    mutationFn: (name: string) =>
      api.put<{ deck: Deck }>(`/decks/${deckId}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      setIsRenameOpen(false);
    },
  });

  const deleteDeck = useMutation({
    mutationFn: () => api.delete<{ message: string }>(`/decks/${deckId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      navigate("/decks", { replace: true });
    },
  });

  // Clear stale mutation errors as each modal closes so they never reappear.
  const closeAddCard = () => {
    setIsAddOpen(false);
    createCard.reset();
  };
  const closeEditCard = () => {
    setEditingCard(null);
    updateCard.reset();
  };
  const closeDeleteCard = () => {
    setDeletingCard(null);
    deleteCard.reset();
  };
  const closeRename = () => {
    setIsRenameOpen(false);
    renameDeck.reset();
  };
  const closeDeleteDeck = () => {
    setIsDeleteDeckOpen(false);
    deleteDeck.reset();
  };

  // Every hook has run by now, so this early return is safe.
  if (!deckId) {
    return <Navigate to="/decks" replace />;
  }

  const cardCount = cardsQuery.data?.length ?? 0;
  const cardCountLabel =
    cardCount === 0
      ? "No cards yet"
      : cardCount === 1
        ? "1 card"
        : `${cardCount} cards`;

  return (
    <div className="min-h-screen bg-[#FDF9F3]">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <Link
          to="/decks"
          className="inline-flex items-center gap-1.5 font-medium text-stone-500 hover:text-stone-800 transition"
        >
          <span aria-hidden="true">←</span> All decks
        </Link>

        {decksQuery.isLoading && (
          <div className="mt-6">
            <Skeleton className="h-9 w-64 rounded-2xl" />
            <Skeleton className="h-5 w-28 rounded-full mt-3" />
          </div>
        )}

        {decksQuery.isError && (
          <div className="mt-8">
            <ErrorState
              title="We couldn't load this deck"
              message={errorMessage(decksQuery.error)}
              onRetry={() => {
                void decksQuery.refetch();
              }}
            />
          </div>
        )}

        {decksQuery.isSuccess && !deck && (
          <div className="mt-8">
            <EmptyState
              emoji="🔍"
              title="Deck not found"
              description="This deck doesn't exist anymore, or the link is out of date."
              action={
                <LinkButton to="/decks" variant="primary">
                  Back to my decks
                </LinkButton>
              }
            />
          </div>
        )}

        {deck && (
          <>
            <div className="mt-6">
              <h1 className="text-3xl font-extrabold text-stone-800 tracking-tight flex items-start gap-2">
                <span aria-hidden="true" className="shrink-0">
                  📖
                </span>
                <span className="min-w-0 break-words">{deck.name}</span>
              </h1>
              {cardsQuery.isSuccess ? (
                <p className="text-stone-500 mt-1.5">{cardCountLabel}</p>
              ) : cardsQuery.isLoading ? (
                <Skeleton className="h-5 w-24 rounded-full mt-2.5" />
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <LinkButton to={`/decks/${deckId}/study`} variant="primary">
                Study 🚀
              </LinkButton>
              <Button variant="secondary" onClick={() => setIsAddOpen(true)}>
                + Add card
              </Button>
              <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRenameOpen(true)}
                >
                  Rename
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDeleteDeckOpen(true)}
                >
                  Delete deck
                </Button>
              </div>
            </div>

            <div className="mt-10">
              {cardsQuery.isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[0, 1, 2].map((n) => (
                    <Skeleton key={n} className="h-32 rounded-3xl" />
                  ))}
                </div>
              )}

              {cardsQuery.isError && (
                <ErrorState
                  title="We couldn't load your cards"
                  message={errorMessage(cardsQuery.error)}
                  onRetry={() => {
                    void cardsQuery.refetch();
                  }}
                />
              )}

              {cardsQuery.isSuccess && cardsQuery.data.length === 0 && (
                <EmptyState
                  emoji="🃏"
                  title="No cards yet"
                  description="Add your first card and start building this deck."
                  action={
                    <Button onClick={() => setIsAddOpen(true)}>
                      + Add your first card
                    </Button>
                  }
                />
              )}

              {cardsQuery.isSuccess && cardsQuery.data.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {cardsQuery.data.map((card, index) => (
                    <CardItem
                      key={card.id}
                      card={card}
                      theme={themeFor(index)}
                      onEdit={() => setEditingCard(card)}
                      onDelete={() => setDeletingCard(card)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <CardFormModal
        isOpen={isAddOpen}
        onClose={closeAddCard}
        onSubmit={(values) => createCard.mutate(values)}
        isPending={createCard.isPending}
        error={createCard.error ? errorMessage(createCard.error) : null}
        mode="create"
      />

      <CardFormModal
        isOpen={editingCard !== null}
        onClose={closeEditCard}
        onSubmit={(values) => {
          if (editingCard) {
            updateCard.mutate({ cardId: editingCard.id, values });
          }
        }}
        isPending={updateCard.isPending}
        error={updateCard.error ? errorMessage(updateCard.error) : null}
        mode="edit"
        initialValues={
          editingCard
            ? { front: editingCard.front, back: editingCard.back }
            : undefined
        }
      />

      <ConfirmDialog
        isOpen={deletingCard !== null}
        onClose={closeDeleteCard}
        onConfirm={() => {
          if (deletingCard) deleteCard.mutate(deletingCard.id);
        }}
        title="Delete card?"
        message={
          deletingCard
            ? `"${deletingCard.front}" will be permanently deleted.`
            : ""
        }
        confirmLabel="Delete card"
        isLoading={deleteCard.isPending}
        error={deleteCard.error ? errorMessage(deleteCard.error) : null}
      />

      {deck && (
        <>
          <DeckFormModal
            isOpen={isRenameOpen}
            onClose={closeRename}
            onSubmit={(name) => renameDeck.mutate(name)}
            isPending={renameDeck.isPending}
            error={renameDeck.error ? errorMessage(renameDeck.error) : null}
            mode="edit"
            initialName={deck.name}
          />

          <ConfirmDialog
            isOpen={isDeleteDeckOpen}
            onClose={closeDeleteDeck}
            onConfirm={() => deleteDeck.mutate()}
            title="Delete this deck?"
            message={`"${deck.name}" and all of its cards will be permanently deleted. This can't be undone.`}
            confirmLabel="Delete deck"
            isLoading={deleteDeck.isPending}
            error={deleteDeck.error ? errorMessage(deleteDeck.error) : null}
          />
        </>
      )}
    </div>
  );
}

export default DeckDetail;
