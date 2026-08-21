import { AmirantVideoEmbed } from "@/components/prep/amirant-course/lesson/AmirantVideoEmbed";
import { Container } from "@/components/ui";

/**
 * One of the video slots configured in the admin.
 *
 * Renders nothing at all when the slot is empty — unlike the lesson embed,
 * which shows a "coming soon" strip. A marketing page must not advertise a
 * video that does not exist.
 */
export function SiteVideoSlot({
  src,
  title,
  className,
}: {
  src: string | null | undefined;
  title: string;
  className?: string;
}) {
  if (!src?.trim()) return null;

  return (
    <section className={className} dir="rtl">
      <Container max="shell">
        <AmirantVideoEmbed src={src} title={title} />
      </Container>
    </section>
  );
}
