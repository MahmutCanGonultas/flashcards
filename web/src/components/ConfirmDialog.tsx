import Modal from "./Modal";
import Button from "./Button";

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  error?: string | null;
};

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  isLoading = false,
  error,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} emoji="🗑️">
      <p className="text-stone-500">{message}</p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-rose-100 px-4 py-3 text-sm font-medium text-rose-700"
        >
          {error}
        </p>
      )}

      <div className="mt-7 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          isLoading={isLoading}
          loadingText="Deleting..."
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
