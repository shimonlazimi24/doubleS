import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, Text } from "@/components/ui";
import { PrepGoogleStart } from "@/components/prep/PrepGoogleStart";

export const metadata: Metadata = {
  title: "מתחברים עם Google",
  robots: { index: false, follow: false },
};

export default function PrepGoogleStartPage() {
  return (
    <div className="min-h-[60vh] bg-canvas">
      <Container max="measure" className="py-16 md:py-24">
        <Suspense fallback={<Text as="p" variant="body" className="text-center">טוען…</Text>}>
          <PrepGoogleStart />
        </Suspense>
      </Container>
    </div>
  );
}
