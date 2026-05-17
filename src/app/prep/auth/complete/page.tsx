import { Suspense } from "react";
import { PrepAuthCompleteClient } from "@/components/prep/PrepAuthCompleteClient";

export default function PrepAuthCompletePage() {
  return (
    <Suspense
      fallback={
        <p className="py-16 text-center text-muted" role="status">
          מאמתים התחברות…
        </p>
      }
    >
      <PrepAuthCompleteClient />
    </Suspense>
  );
}
