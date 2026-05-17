import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/design-system/cn";
import { buttonVariantClass, type ButtonVariant } from "@/lib/design-system/button-variants";

type Props = Omit<ComponentProps<typeof Link>, "className"> & {
  variant: ButtonVariant;
  className?: string;
};

export function ButtonLink({ variant, className, ...props }: Props) {
  return <Link className={cn(buttonVariantClass[variant], className)} {...props} />;
}
