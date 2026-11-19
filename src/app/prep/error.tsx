"use client";

import { useEffect } from "react";
import { Button, ButtonLink, Container, Heading, Text } from "@/components/ui";

/** Shown when a page under /prep throws while rendering, instead of the framework's bare English screen. */
export default function PrepError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console -- surfaced to error monitoring via console capture
    console.error("[prep] render error", error.digest ?? error.message);
  }, [error]);

  return (
    <div dir="rtl" className="min-h-[60vh] bg-canvas">
      <Container max="measure" className="py-16 md:py-24">
        <Heading level={2}>משהו השתבש בטעינת העמוד</Heading>
        <Text as="p" variant="body" className="mt-3 max-w-md text-muted">
          ההתקדמות שלכם שמורה. נסו לטעון שוב; אם זה חוזר, כתבו לנו ל-support@getprepared.academy.
        </Text>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={() => reset()}>
            לנסות שוב
          </Button>
          <ButtonLink href="/prep" variant="ghost">
            לדף הבית
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}
