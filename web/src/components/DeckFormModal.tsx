import { useState } from "react";
import type { FormEvent } from "react";
import Modal from "./Modal";
import Button from "./Button";
import TextField from "./TextField";

type DeckFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isPending: boolean;
  error: string | null;
  mode: "create" | "edit";
  initialName?: string;
};

type DeckFormProps = Omit<DeckFormModalProps, "isOpen">;

/**
 * Only mounted while the modal is open, so `useState` re-seeds the field on
 * every open without an effect.
 */
function DeckForm({
  onClose,
  onSubmit,
  isPending,
  error,
  mode,
  initialName = "",
}: DeckFormProps) {
  const [name, setName] = useState(initialName);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setValidationError("Give your deck a name.");
      return;
    }

    setValidationError(null);
    onSubmit(trimmed);
  };

  const isCreate = mode === "create";

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextField
        label="Deck name"
        placeholder="Spanish verbs"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={validationError ?? undefined}
        disabled={isPending}
        maxLength={255}
        autoFocus
      />

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-rose-100 px-4 py-3 text-sm font-medium text-rose-700"
        >
          {error}
        </p>
      )}

      <div className="mt-7 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isPending}
          loadingText={isCreate ? "Creating..." : "Saving..."}
        >
          {isCreate ? "Create" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function DeckFormModal({ isOpen, ...formProps }: DeckFormModalProps) {
  const isCreate = formProps.mode === "create";

  return (
    <Modal
      isOpen={isOpen}
      onClose={formProps.onClose}
      title={isCreate ? "New deck" : "Rename deck"}
      emoji={isCreate ? "✨" : "✏️"}
    >
      <DeckForm {...formProps} />
    </Modal>
  );
}

export default DeckFormModal;
