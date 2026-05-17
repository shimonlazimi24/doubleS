import type { Metadata } from "next";
import { Container, Heading, PageLayout, Section } from "@/components/ui";
import { PrepSettingsClient } from "@/components/prep/PrepSettingsClient";

export const metadata: Metadata = { title: "הגדרות" };

export default function PrepSettingsPage() {
  return (
    <PageLayout pad="lg">
      <Container max="measure">
        <Heading level={1}>הגדרות</Heading>
      </Container>
      <Section tone="canvas" padding="loose" className="border-t border-line/80 mt-6">
        <Container max="measure">
          <PrepSettingsClient />
        </Container>
      </Section>
    </PageLayout>
  );
}
