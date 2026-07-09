import { useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import { fieldClasses } from "../lib/fieldStyles";

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  label: string;
  error?: string;
};

function TextAreaField({ label, error, className = "", ...rest }: TextAreaFieldProps) {
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
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${fieldClasses(Boolean(error))} resize-none ${className}`}
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

export default TextAreaField;
