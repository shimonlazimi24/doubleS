import { ButtonLink, Container, Heading, PageLayout, Text } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas text-center">
      <PageLayout pad="xl" className="flex w-full flex-col items-center">
        <Container max="measure" className="flex flex-col items-center gap-ds-6">
          <Heading level={2}>העמוד לא נמצא</Heading>
          <Text as="p" variant="body" className="max-w-sm text-muted">
            ייתכן שהקישור שגוי או שהעמוד הוסר. הדברים החשובים נמצאים במרחק לחיצה.
          </Text>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/prep" variant="primary">
              לדף הבית
            </ButtonLink>
            <ButtonLink href="/prep/amirant" variant="ghost">
              לקורס האמירנט
            </ButtonLink>
          </div>
        </Container>
      </PageLayout>
    </div>
  );
}
