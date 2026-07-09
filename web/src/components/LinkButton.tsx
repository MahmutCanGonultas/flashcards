import { Link } from "react-router-dom";
import type { ComponentProps } from "react";
import { buttonClasses } from "../lib/buttonStyles";
import type { ButtonSize, ButtonVariant } from "../lib/buttonStyles";

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

/** A `<Link>` that wears the pressable button styling. */
function LinkButton({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      className={`${buttonClasses(variant, size, fullWidth)} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}

export default LinkButton;
