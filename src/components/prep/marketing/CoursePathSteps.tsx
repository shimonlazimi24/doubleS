import Image from "next/image";
import { SectionPanel } from "./SectionPanel";

export type PathStep = {
  title: string;
  body: string;
  /** A real screenshot of that stage, under public/. */
  image: { src: string; alt: string };
};

/**
 * The stages of the course in the order a learner meets them, each with a
 * screenshot of the real screen. Numbered because it is a sequence.
 */
export function CoursePathSteps({ steps }: { steps: readonly PathStep[] }) {
  return (
    <ol className="grid gap-6 md:grid-cols-3">
      {steps.map((step, i) => (
        <li key={step.title}>
          <SectionPanel className="flex h-full flex-col">
            <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-line bg-surface-low">
              <Image
                src={step.image.src}
                alt={step.image.alt}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover object-top"
              />
            </div>
            <div className="p-5 text-right md:p-6">
              <p className="text-sm font-semibold text-primary">שלב {i + 1}</p>
              <h3 className="mt-1 text-lg font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.body}</p>
            </div>
          </SectionPanel>
        </li>
      ))}
    </ol>
  );
}
