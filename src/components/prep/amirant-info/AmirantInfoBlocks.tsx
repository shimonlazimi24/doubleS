import { Heading, Text } from "@/components/ui";
import type { AmirantInfoBlock } from "@/lib/prep/amirant-general-info-blocks";

export function AmirantInfoBlocks({ blocks }: { blocks: AmirantInfoBlock[] }) {
  return (
    <div className="space-y-ds-6">
      {blocks.map((b, i) => {
        if (b.kind === "h2") {
          return (
            <Heading key={i} level={2} className="scroll-mt-24 border-b border-line/60 pb-ds-2 pt-ds-4 first:pt-0">
              {b.text}
            </Heading>
          );
        }
        if (b.kind === "h3") {
          return (
            <Heading key={i} level={3} className="scroll-mt-20 pt-ds-2">
              {b.text}
            </Heading>
          );
        }
        if (b.kind === "p") {
          return (
            <Text key={i} as="p" variant="bodyLg" className="max-w-readable leading-relaxed text-ink">
              {b.text}
            </Text>
          );
        }
        if (b.kind === "ul") {
          return (
            <ul key={i} className="list-disc space-y-2 pr-6 text-base leading-relaxed text-ink max-w-readable">
              {b.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        if (b.kind === "table") {
          return (
            <div key={i} className="overflow-x-auto rounded-surface border border-line/80 shadow-card">
              <table className="w-full min-w-[20rem] border-collapse text-sm">
                <thead>
                  <tr className="bg-surface-low">
                    {b.headers.map((h) => (
                      <th
                        key={h}
                        className="border-b border-line/80 px-4 py-3 text-start font-semibold text-ink"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((row, ri) => (
                    <tr key={ri} className="odd:bg-paper even:bg-surface-low/50">
                      {row.map((cell, ci) => (
                        <td key={ci} className="border-b border-line/40 px-4 py-2.5 align-top text-ink">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
