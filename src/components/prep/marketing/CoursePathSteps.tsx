import Image from "next/image";
import { cn } from "@/lib/design-system/cn";
import { Reveal } from "./motion/Reveal";

export type PathStep = {
  title: string;
  body: string;
  /** A real screenshot of that stage, under public/. */
  image: { src: string; alt: string; width: number; height: number };
};

/**
 * The stages of the course as alternating rows: a screenshot of the real
 * screen on one side, the step and its text on the other. The step number is
 * part of the heading, not a faded giant numeral.
 */
export function CoursePathSteps({ steps }: { steps: readonly PathStep[] }) {
  return (
    <ol className="space-y-20 md:space-y-28">
      {steps.map((step, i) => {
        const imageFirst = i % 2 === 1;
        return (
          <li key={step.title} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <Reveal from={imageFirst ? "end" : "start"} className={cn("text-right", imageFirst && "md:order-2")}>
              <h3 className="text-[1.6rem] font-extrabold leading-tight text-ink md:text-[1.9rem]">
                <span className="tabular-nums text-primary">{i + 1}.</span> {step.title}
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-muted">{step.body}</p>
            </Reveal>
            <Reveal from={imageFirst ? "start" : "end"} delay={120} as="figure" className={cn("m-0", imageFirst && "md:order-1")}>
              <Image
                src={step.image.src}
                alt={step.image.alt}
                width={step.image.width}
                height={step.image.height}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="h-auto w-full rounded border border-line"
              />
            </Reveal>
          </li>
        );
      })}
    </ol>
  );
}
