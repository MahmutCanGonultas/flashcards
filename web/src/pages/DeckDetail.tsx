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
import Header from "../components/Header";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import Skeleton from "../components/Skeleton";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import CardGroups from "../components/CardGroups";
import LearningPath from "../components/LearningPath";
import PathHeader from "../components/PathHeader";
import { buildPath, pathStats } from "../lib/path";
import CardFormModal from "../components/CardFormModal";
import type { CardFormValues } from "../components/CardFormModal";
import DeckFormModal from "../components/DeckFormModal";
import ConfirmDialog from "../components/ConfirmDialog";

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

/** Shaped like a real CardItem, so the loading grid doesn't jump around once data lands. */
function CardItemSkeleton() {
  return (
    <div className="rounded-3xl bg-white p-6 pl-7 ring-2 ring-stone-100">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="mt-2.5 h-5 w-2/3 rounded-full" />
      <div className="my-4 h-px w-full bg-stone-100" />
      <Skeleton className="h-4 w-full rounded-full" />
      <Skeleton className="mt-2 h-4 w-4/5 rounded-full" />
    </div>
  );
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
  const [showAllCards, setShowAllCards] = useState(false);

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

  // A deck whose cards carry lesson numbers is walked as a path; everything
  // else keeps the plain card list.
  const units = buildPath(cardsQuery.data ?? []);
  const isPath = units.length > 0;
  const stats = pathStats(units);

  return (
    <div className="min-h-screen bg-[#FDF9F3]">
      <Header />

      <main className="max-w-5xl mx-auto px-6 pt-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <Link
          to="/decks"
          className="-m-2 inline-flex items-center gap-1.5 p-2 font-medium text-stone-500 hover:text-stone-800 transition"
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
              {!isPath && cardsQuery.isSuccess ? (
                <p className="text-stone-500 mt-1.5">{cardCountLabel}</p>
              ) : cardsQuery.isLoading ? (
                <Skeleton className="h-5 w-24 rounded-full mt-2.5" />
              ) : null}
            </div>

            {isPath && (
              <PathHeader
                stats={stats}
                onReview={() => navigate(`/decks/${deckId}/study`)}
                onPractice={() => navigate(`/decks/${deckId}/study?mode=all`)}
              />
            )}

            {!isPath && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <LinkButton to={`/decks/${deckId}/study`} variant="primary">
                  Study 🚀
                </LinkButton>
                {cardCount > 0 && (
                  <LinkButton to={`/decks/${deckId}/study?mode=all`} variant="secondary">
                    Review everything 📖
                  </LinkButton>
                )}
                <Button variant="secondary" size="sm" onClick={() => setIsAddOpen(true)}>
                  + Add card
                </Button>
                <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setIsRenameOpen(true)}>
                    Rename
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsDeleteDeckOpen(true)}>
                    Delete deck
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-8">
              {cardsQuery.isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[0, 1, 2].map((n) => (
                    <CardItemSkeleton key={n} />
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

              {cardsQuery.isSuccess && cardsQuery.data.length > 0 && isPath && !showAllCards && (
                <LearningPath deckId={deckId} units={units} />
              )}

              {cardsQuery.isSuccess && cardsQuery.data.length > 0 && (!isPath || showAllCards) && (
                <CardGroups
                  key={deckId}
                  cards={cardsQuery.data}
                  onEdit={setEditingCard}
                  onDelete={setDeletingCard}
                />
              )}
            </div>

            {/* Deck housekeeping lives at the bottom in path mode — the path
                itself is the point of the screen, not the admin controls. */}
            {isPath && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-stone-200/70 pt-6">
                <Button variant="ghost" size="sm" onClick={() => setShowAllCards((v) => !v)}>
                  {showAllCards ? "Hide word list" : "📋 All words"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsAddOpen(true)}>
                  + Add card
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsRenameOpen(true)}>
                  Rename
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsDeleteDeckOpen(true)}>
                  Delete deck
                </Button>
              </div>
            )}
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
