import { ButtonLink, Container, Heading, PageLayout, Text } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas text-center">
      <PageLayout pad="xl" className="flex w-full flex-col items-center">
        <Container max="measure" className="flex flex-col items-center gap-ds-6">
          <Heading level={2}>העמוד לא נמצא</Heading>
          <Text as="p" variant="body" className="max-w-sm">
            ייתכן שהקישור שגוי או שהעמוד הוסר.
          </Text>
          <ButtonLink href="/prep" variant="ghost">
            חזרה לדף הבית
          </ButtonLink>
        </Container>
      </PageLayout>
    </div>
  );
}
