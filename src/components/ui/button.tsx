import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/design-system/cn";
import { buttonVariantClass, type ButtonVariant } from "@/lib/design-system/button-variants";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: ButtonVariant;
};

export function Button({ variant, className, type = "button", ...props }: Props) {
  return <button type={type} className={cn(buttonVariantClass[variant], className)} {...props} />;
}
