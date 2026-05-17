import type { ComponentProps } from "react";
import { Container } from "./container";

type Props = ComponentProps<typeof Container>;

/** @deprecated Prefer `Container` — alias kept for existing imports. */
export function PageShell(props: Props) {
  return <Container {...props} />;
}
