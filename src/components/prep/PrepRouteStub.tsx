import { ButtonLink, Card, Container, Heading, PageLayout, Text } from "@/components/ui";

type ShellProps = {
  kind: "shell";
  title: string;
  body: string;
  backHref?: string;
  backLabel?: string;
};

type SectionProps = {
  kind: "section";
  title: string;
  body: string;
};

type Props = ShellProps | SectionProps;

/** מסכי טיוטה - מבוססי מערכת העיצוב בלבד. */
export function PrepRouteStub(props: Props) {
  if (props.kind === "section") {
    return (
      <PageLayout pad="lg">
        <Container max="readable">
          <Card variant="outline" padding="lg">
            <Heading level={1}>{props.title}</Heading>
            <Text as="p" variant="bodyLg" className="mt-ds-4">
              {props.body}
            </Text>
          </Card>
        </Container>
      </PageLayout>
    );
  }

  const { title, body, backHref = "/prep", backLabel = "חזרה לדף הבית" } = props;

  return (
    <PageLayout pad="xl">
      <Container max="measure">
        <Text as="p" variant="eyebrow">
          למידה
        </Text>
        <Heading level={1} className="mt-ds-3">
          {title}
        </Heading>
        <Text as="p" variant="bodyLg" className="mt-ds-4 max-w-readable">
          {body}
        </Text>
        <ButtonLink href={backHref} variant="ghost" className="mt-ds-8 inline-flex">
          {backLabel}
        </ButtonLink>
      </Container>
    </PageLayout>
  );
}
