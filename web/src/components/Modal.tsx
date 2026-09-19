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
    // The scrim is umber, not black: the page dims like paper in shadow.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-umber/45 p-4 backdrop-blur-sm animate-[fade-in_150ms_ease-out]"
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
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-[28px] bg-paper-lift p-6 ring-1 ring-rule shadow-sheet paper-grain focus:outline-none animate-rise-spring"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-ink"
          >
            {title}
            {emoji && <span aria-hidden="true">{emoji}</span>}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl leading-none text-graphite transition hover:bg-ink/5 hover:text-ink"
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
