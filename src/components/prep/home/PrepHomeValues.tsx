import type { ReactNode } from "react";
import { Card, Container, Heading, Section, Text } from "@/components/ui";

function IconRing({ children }: { children: ReactNode }) {
  return (
    <div className="mb-ds-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-muted text-primary">
      {children}
    </div>
  );
}

function IconVerified() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrend() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M23 6l-9.5 9.5-5-5L1 18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 6h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ITEMS = [
  {
    icon: <IconVerified />,
    title: "אמינות אקדמית",
    body: "תכנים ומסלולים שנבנים סביב ציפיות אמיתיות - בלי תרגילים גנריים שמבזבזים זמן.",
  },
  {
    icon: <IconLayers />,
    title: "מבנה והיררכיה",
    body: "תמיד ברור מה לומדים השבוע, למה זה חשוב, ואיך זה מתחבר לציון או לקבלה.",
  },
  {
    icon: <IconTrend />,
    title: "צמיחה מתמדת",
    body: "מעקב אחר התקדמות, נקודות חוזק ותיקון ממוקד - כדי לשפר בכל שבוע ולא רק לפני המבחן.",
  },
] as const;

export function PrepHomeValues() {
  return (
    <Section tone="surfaceLow" padding="loose">
      <Container>
        <div className="grid grid-cols-1 gap-ds-6 md:grid-cols-3 md:gap-ds-8">
          {ITEMS.map((item) => (
            <Card key={item.title} variant="outline" padding="lg" interactive>
              <IconRing>{item.icon}</IconRing>
              <Heading as="h3" level={4} className="mb-ds-2">
                {item.title}
              </Heading>
              <Text as="p" variant="body">
                {item.body}
              </Text>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
