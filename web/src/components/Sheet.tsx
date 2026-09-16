import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

type SheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Small caps beside the title (a part of speech, say). */
  kicker?: string | null;
  children: ReactNode;
};

/**
 * A bottom sheet: paper pulled up from under the screen. Scrolls inside
 * itself, closes on the scrim, the × or Escape, and returns focus.
 */
function Sheet({ isOpen, onClose, title, kicker, children }: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      openerRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/40 animate-[fade-in_160ms_ease-out]" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[88dvh] w-full overflow-y-auto overscroll-contain rounded-t-[28px] bg-paper px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 ring-1 ring-ink/10 focus:outline-none animate-[slide-up_220ms_ease-out]"
      >
        <span aria-hidden="true" className="mx-auto mb-4 block h-1 w-10 rounded-full bg-ink/15" />
        <div className="flex items-baseline justify-between gap-3">
          <h2 id={titleId} className="min-w-0 break-words text-[28px] font-black tracking-[-0.02em] text-ink">
            {title}
            {kicker && <span className="ml-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-graphite">{kicker}</span>}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-graphite hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
          >
            ×
          </button>
        </div>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}

export default Sheet;
