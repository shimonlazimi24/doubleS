import { Heading, Text } from "@/components/ui";
import type { SyllabusBullet } from "@/lib/prep/amirant-course-syllabus";
import { AMIRANT_COURSE_SYLLABUS_PARTS } from "@/lib/prep/amirant-course-syllabus";

function BulletTree({ bullets, depth = 0 }: { bullets: SyllabusBullet[]; depth?: number }) {
  return (
    <ul className={depth === 0 ? "mt-2 space-y-2 pr-4" : "mt-1 space-y-1 pr-4 border-r border-primary/20"}>
      {bullets.map((b) => (
        <li key={b.id} className="text-sm leading-relaxed text-ink">
          <span className="font-medium">{b.title}</span>
          {b.children && b.children.length > 0 ? <BulletTree bullets={b.children} depth={depth + 1} /> : null}
        </li>
      ))}
    </ul>
  );
}

export function AmirantSyllabusPublic() {
  return (
    <section className="mt-ds-12 border-t border-line/80 pt-ds-10">
      <Heading level={2} className="mb-ds-2">
        סילבוס הקורס (מבנה לימודים)
      </Heading>
      <Text as="p" variant="bodySm" className="mb-ds-8 max-w-readable text-muted">
        המבנה הבא משמש גם לבניית מודולי הדמו באפליקציה (`AMIRANT_COURSE_SYLLABUS_PARTS`): לכל פריט עלה בעץ יש שיעור נפרד בנתיב הלמידה. דרישות טכניות למנוע הסימולציה (אדפטיביות, טיימרים, 16 שאלות וכו׳) אינן חלק מהסילבוס ללומד - הן מפורטות בקוד ב־`AMIRANT_SIMULATION_TECH` ו־`AMIRANT_SIMULATION_BUILDER_SPEC_HE`. תוכן עומק (מדריכים, אודיו, בנק שאלות) יתווסף בהדרגה.
      </Text>
      <div className="space-y-ds-10">
        {AMIRANT_COURSE_SYLLABUS_PARTS.map((part, idx) => (
          <div key={part.id} className="rounded-surface border border-line/60 bg-paper p-ds-6 shadow-card">
            <Heading level={3} className="text-lg">
              {idx + 1}. {part.title}
            </Heading>
            <BulletTree bullets={part.bullets} />
          </div>
        ))}
      </div>
    </section>
  );
}
