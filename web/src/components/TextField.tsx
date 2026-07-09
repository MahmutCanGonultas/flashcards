import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { fieldClasses } from "../lib/fieldStyles";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  error?: string;
};

function TextField({ label, error, className = "", ...rest }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2"
      >
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
        <p id={errorId} className="mt-1.5 text-sm font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default TextField;
