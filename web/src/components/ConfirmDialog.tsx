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
  confirmLabel = "Sil",
  isLoading = false,
  error,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} emoji="🗑️">
      <p className="text-graphite">{message}</p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border-l-2 border-accent bg-accent/8 px-4 py-3 text-sm font-medium text-accent"
        >
          {error}
        </p>
      )}

      <div className="mt-7 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Vazgeç
        </Button>
        {/* Destructive: the ink pill printed in vermilion. The shared "danger"
            variant still wears the old rose, so the fill is overridden here. */}
        <Button
          variant="ink"
          className="bg-accent! hover:bg-accent/90! focus-visible:ring-accent/30!"
          onClick={onConfirm}
          isLoading={isLoading}
          loadingText="Siliniyor..."
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
