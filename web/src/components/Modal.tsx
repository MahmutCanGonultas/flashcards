import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  emoji?: string;
  children: ReactNode;
};

function Modal({ isOpen, onClose, title, emoji, children }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Fields with autoFocus have already claimed focus by now; otherwise pull
    // focus off the page behind the dialog so Tab starts inside it.
    if (panel && !panel.contains(document.activeElement)) {
      panel.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      // Keep Tab cycling inside the dialog: it claims to be aria-modal.
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      // The trigger can be gone by now (e.g. the row it lived in was deleted).
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-[fade-in_150ms_ease-out]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        // Body scroll is locked while we're open, so tall content has to scroll
        // in here or a short viewport could hide the buttons.
        className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-3xl p-7 shadow-xl ring-2 ring-stone-100 focus:outline-none animate-[pop-in_180ms_ease-out]"
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <h2
            id={titleId}
            className="text-2xl font-extrabold text-stone-800 tracking-tight flex items-center gap-2"
          >
            {title}
            {emoji && <span aria-hidden="true">{emoji}</span>}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-9 h-9 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition flex items-center justify-center text-xl leading-none"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
