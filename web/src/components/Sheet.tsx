import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";

type SheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Small caps beside the title (a part of speech, say). */
  kicker?: string | null;
  /** The card's tint (`tintStyle(card)`), so the handle takes the word's colour. */
  style?: CSSProperties;
  children: ReactNode;
};

/** How long the paper takes to drop back under the screen. */
const CLOSE_MS = 200;
/** A drag on the handle or title this far down lets go of the sheet. */
const DRAG_CLOSE_PX = 120;

/**
 * A bottom sheet: paper pulled up from under the screen. Scrolls inside
 * itself, closes on the scrim, the ×, Escape or a pull on its handle, and
 * returns focus. Closing plays out first — the panel slides back down,
 * the scrim fades — and only then does the caller hear about it.
 */
function Sheet({ isOpen, ...rest }: SheetProps) {
  // Mounted only while open, so every open starts from a clean slate.
  return isOpen ? <Panel {...rest} /> : null;
}

function Panel({ onClose, title, kicker, style, children }: Omit<SheetProps, "isOpen">) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const closeTimer = useRef(0);
  const dragStart = useRef<{ y: number; id: number } | null>(null);
  const [closing, setClosing] = useState(false);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    closeTimer.current = window.setTimeout(onClose, reduced ? 0 : CLOSE_MS);
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    // Tonton reads this and stays out of the way while the sheet is up.
    document.body.dataset.sheet = "open";
    return () => {
      window.clearTimeout(closeTimer.current);
      document.body.style.overflow = overflow;
      delete document.body.dataset.sheet;
      opener?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  // Drag-to-close, from the handle and title row only: the body scrolls.
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStart.current = { y: event.clientY, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart.current || dragStart.current.id !== event.pointerId) return;
    if (event.clientY - dragStart.current.y >= DRAG_CLOSE_PX) {
      dragStart.current = null;
      requestClose();
    }
  };
  const onPointerEnd = () => {
    dragStart.current = null;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end bg-umber/45 transition-opacity duration-200 ${closing ? "opacity-0" : "animate-[fade-in_200ms_ease-out]"}`}
      onClick={requestClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={style}
        onClick={(event) => event.stopPropagation()}
        className={`max-h-[88dvh] w-full overflow-y-auto overscroll-contain rounded-t-[28px] bg-paper-lift px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] ring-1 ring-rule shadow-sheet paper-grain focus:outline-none ${
          closing ? "animate-sheet-down" : "animate-sheet-up"
        }`}
      >
        <div
          className="sticky top-0 z-10 -mx-6 border-b border-rule bg-paper-lift/95 px-6 pb-2 pt-3 backdrop-blur touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <span aria-hidden="true" className="mx-auto mb-4 block h-1 w-10 rounded-full tint-bar" />
          <div className="flex items-baseline justify-between gap-3">
            <h2 id={titleId} className="min-w-0 wrap-break-word text-[28px] font-black tracking-[-0.02em] text-ink">
              {title}
              {kicker && <span className="ml-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-graphite">{kicker}</span>}
            </h2>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Kapat"
              className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-graphite transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
            >
              ×
            </button>
          </div>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

export default Sheet;
