import { useId } from "react";
import type { TextareaHTMLAttributes } from "react";

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  label: string;
  error?: string;
};

/* Mirrors TextField exactly; kept local so this file exports only its component. */
const fieldClasses = (hasError: boolean): string =>
  [
    "w-full rounded-xl bg-paper px-4 py-3 text-ink ring-1 placeholder:text-graphite/70",
    "transition focus:bg-paper-lift focus:outline-none focus:ring-2",
    hasError ? "ring-accent focus:ring-accent/40" : "ring-rule focus:ring-ink/40",
  ].join(" ");
const labelClasses =
  "mb-2 block text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite";

function TextAreaField({ label, error, className = "", ...rest }: TextAreaFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${fieldClasses(Boolean(error))} resize-none ${className}`}
        {...rest}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm font-medium text-accent">
          {error}
        </p>
      )}
    </div>
  );
}

export default TextAreaField;
