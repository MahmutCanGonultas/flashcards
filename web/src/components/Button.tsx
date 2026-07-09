import type { ButtonHTMLAttributes } from "react";
import { buttonClasses } from "../lib/buttonStyles";
import type { ButtonSize, ButtonVariant } from "../lib/buttonStyles";
import Spinner from "./Spinner";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
};

function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  loadingText,
  disabled,
  children,
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${buttonClasses(variant, size, fullWidth)} ${className}`}
      {...rest}
    >
      {isLoading && <Spinner />}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}

export default Button;
