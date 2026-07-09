import { useState } from "react";
import type { FormEvent } from "react";
import Modal from "./Modal";
import Button from "./Button";
import TextField from "./TextField";
import TextAreaField from "./TextAreaField";

export type CardFormValues = {
  front: string;
  back: string;
};

type CardFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CardFormValues) => void;
  isPending: boolean;
  error: string | null;
  mode: "create" | "edit";
  initialValues?: CardFormValues;
};

type CardFormProps = Omit<CardFormModalProps, "isOpen">;

const emptyValues: CardFormValues = { front: "", back: "" };

/**
 * Only mounted while the modal is open, so `useState` re-seeds the fields on
 * every open without an effect.
 */
function CardForm({
  onClose,
  onSubmit,
  isPending,
  error,
  mode,
  initialValues = emptyValues,
}: CardFormProps) {
  const [front, setFront] = useState(initialValues.front);
  const [back, setBack] = useState(initialValues.back);
  const [errors, setErrors] = useState<Partial<CardFormValues>>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmedFront = front.trim();
    const trimmedBack = back.trim();
    const nextErrors: Partial<CardFormValues> = {};

    if (!trimmedFront) nextErrors.front = "The front can't be empty.";
    if (!trimmedBack) nextErrors.back = "The back can't be empty.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({ front: trimmedFront, back: trimmedBack });
  };

  const isCreate = mode === "create";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <TextField
        label="Front"
        placeholder="ephemeral"
        value={front}
        onChange={(event) => setFront(event.target.value)}
        error={errors.front}
        disabled={isPending}
        autoFocus
      />

      <TextAreaField
        label="Back"
        placeholder="Lasting for a very short time."
        rows={3}
        value={back}
        onChange={(event) => setBack(event.target.value)}
        error={errors.back}
        disabled={isPending}
      />

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-100 px-4 py-3 text-sm font-medium text-rose-700"
        >
          {error}
        </p>
      )}

      <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isPending}
          loadingText={isCreate ? "Adding..." : "Saving..."}
        >
          {isCreate ? "Add card" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function CardFormModal({ isOpen, ...formProps }: CardFormModalProps) {
  const isCreate = formProps.mode === "create";

  return (
    <Modal
      isOpen={isOpen}
      onClose={formProps.onClose}
      title={isCreate ? "Add card" : "Edit card"}
      emoji={isCreate ? "🃏" : "✏️"}
    >
      <CardForm {...formProps} />
    </Modal>
  );
}

export default CardFormModal;
