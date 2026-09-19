import { useId } from "react";
import type { InputHTMLAttributes } from "react";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  error?: string;
};

/** A field cut into the page: the paper itself, a hairline, ink when it has focus. */
const fieldClasses = (hasError: boolean): string =>
  [
    "w-full rounded-xl bg-paper px-4 py-3 text-ink ring-1 placeholder:text-graphite/70",
    "transition focus:bg-paper-lift focus:outline-none focus:ring-2",
    hasError ? "ring-accent focus:ring-accent/40" : "ring-rule focus:ring-ink/40",
  ].join(" ");

/** The label sits above as a kicker, the way every heading on the page does. */
const labelClasses =
  "mb-2 block text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite";

function TextField({ label, error, className = "", ...rest }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${fieldClasses(Boolean(error))} ${className}`}
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

export default TextField;
