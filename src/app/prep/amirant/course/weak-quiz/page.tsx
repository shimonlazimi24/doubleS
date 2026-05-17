import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { AmirantWeakQuizPageClient } from "@/components/prep/amirant-course/AmirantWeakQuizPageClient";

export const metadata: Metadata = {
  title: "בוחן חולשות | Amirant Preparation",
};

export default function AmirantCourseWeakQuizPage() {
  return (
    <Container max="measureWide">
      <AmirantWeakQuizPageClient />
    </Container>
  );
}
