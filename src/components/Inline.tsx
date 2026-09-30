import { Fragment } from "react";

/**
 * Renders the post's own inline markdown — ***bold italic***, **bold**,
 * *italic* — so the stored text can stay exactly as the transcript has it.
 * Anything that isn't a matched pair of markers is shown as written.
 */
const EMPHASIS = /(\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|\*[^*\s][^*]*?\*)/g;

export function Inline({ text }: { text: string }) {
  const parts = text.split(EMPHASIS);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        if (part.startsWith("***")) {
          return (
            <strong key={i}>
              <em>{part.slice(3, -3)}</em>
            </strong>
          );
        }
        if (part.startsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
        return <em key={i}>{part.slice(1, -1)}</em>;
      })}
    </>
  );
}
