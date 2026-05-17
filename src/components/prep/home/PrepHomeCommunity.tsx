import { Button, ButtonLink, Container, Heading, Input, Section, Text } from "@/components/ui";
import { PREP_BASE } from "@/lib/prep/constants";

const MOCK_STATS = [
  { value: "4,500+", label: "תלמידים פעילים (דמו)" },
  { value: "96%", label: "שביעות רצון (דמו)" },
  { value: "12+", label: "מסלולי עומק" },
  { value: "24/7", label: "גישה לחומרים" },
] as const;

export function PrepHomeCommunity() {
  return (
    <Section tone="ink" padding="loose">
      <Container>
        <div className="grid grid-cols-1 items-start gap-ds-10 lg:grid-cols-2 lg:gap-ds-12">
          <div className="text-start">
            <Heading level={2} className="text-paper">
              הצטרפו לקהילה של
              <br />
              לומדים סקרנים
            </Heading>
            <Text as="p" variant="bodyInverse" className="mt-ds-5 max-w-lg">
              עדכונים על מסלולים, טיפים לתזמון לפני מבחן ותכנים נבחרים — טופס הדגמה בלבד (אין שליחה לשרת).
            </Text>

            <div className="mt-ds-8 flex max-w-lg flex-col gap-ds-2 sm:flex-row sm:flex-row-reverse sm:items-stretch">
              <Button type="button" variant="primary" className="shrink-0 sm:px-ds-5">
                הצטרפות (דמו)
              </Button>
              <Input type="email" variant="onDark" placeholder="כתובת המייל שלך" aria-label="דוא״ל להדגמה" />
            </div>

            <div className="mt-ds-6">
              <ButtonLink
                href={`${PREP_BASE}/pricing`}
                variant="secondary"
                className="border-white/20 bg-white/10 text-paper hover:bg-white/15"
              >
                למחירון
              </ButtonLink>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-ds-3 sm:gap-ds-4">
            {MOCK_STATS.map((item) => (
              <div
                key={item.label}
                className="rounded-surface border border-white/10 bg-white/5 p-ds-5 text-start sm:p-ds-6"
              >
                <p className="font-display text-2xl font-semibold text-paper sm:text-3xl">{item.value}</p>
                <Text as="p" variant="bodyInverseMuted" className="mt-ds-2 text-pretty">
                  {item.label}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
