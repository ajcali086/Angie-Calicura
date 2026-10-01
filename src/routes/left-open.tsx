import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/PageHero";
import { Inline } from "@/components/Inline";
import { PassageDoor, PlateDoor } from "@/components/Door";
import { ListenButton } from "@/components/audio/ListenButton";
import { chapters, door, plateById } from "@/data/article";
import { discrepancies } from "@/data/discrepancies";
import { evidenceById, questions, recordById } from "@/model";
import type { EvidenceLink, OpenQuestion } from "@/model/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/left-open")({
  head: () => ({ meta: [{ title: "Left Open · Angie" }] }),
  component: LeftOpenPage,
});

const epigraph = "What survives is a silhouette rather than a full portrait";

/** The chapter a frozen passage ID lives in, for a door to it. */
function passageDoor(id: string) {
  const chapter = chapters.find((c) => c.blocks.some((b) => b.type !== "figure" && b.id === id));
  return chapter && { slug: chapter.slug, hash: id };
}

/** A plate, a record shown in a plate, or a cited record, as a reader names it. */
function recordName(id: string): { label: string; plate?: string } {
  const plate = plateById(id) ?? plateById(recordById(id)?.plate ?? "");
  if (plate) return { label: `Plate ${plate.number}`, plate: plate.id };
  return { label: recordById(id)?.title ?? id };
}

const FIELDS: [keyof OpenQuestion, string][] = [
  ["what_we_know", "What we know"],
  ["what_we_dont", "What we don’t"],
  ["what_might_answer_it", "What might answer it"],
  ["evidence_needed", "Evidence needed"],
];

const TYPE_LABEL: Record<EvidenceLink["type"], string> = {
  supports: "Supports",
  contradicts: "Contradicts",
  qualifies: "Qualifies",
};

function LeftOpenPage() {
  const fromPost = questions.filter((q) => q.origin === "post").length;
  return (
    <SiteShell>
      <PageHero
        kicker="The record"
        title="Left Open"
        dek="Where the record runs out: the questions the post leaves standing, and those its own records raise."
        compact
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <figure className="border-l-2 border-brass pl-5">
          <blockquote className="font-display text-xl leading-relaxed text-fog sm:text-2xl">
            {epigraph}…
          </blockquote>
          <figcaption>
            <PassageDoor to={door(epigraph)} />
          </figcaption>
        </figure>

        <p className="mt-10 text-[0.72rem] tracking-[0.16em] text-muted uppercase">
          {questions.length} questions, left open: {fromPost} the post leaves,{" "}
          {questions.length - fromPost} the records raise.
        </p>

        {questions.map((q) => (
          <Question key={q.id} q={q} />
        ))}
      </div>
    </SiteShell>
  );
}

function Question({ q }: { q: OpenQuestion }) {
  const entry = discrepancies.find((d) => d.id === q.post_entry);
  const links = q.evidence.map(evidenceById).filter((l): l is EvidenceLink => !!l);
  const sources = [...new Set(q.last_known_source)];
  return (
    <section id={q.id} className="scroll-mt-24 border-t border-rule py-8 first-of-type:border-t-0">
      <p className="text-[0.66rem] tracking-[0.16em] text-muted uppercase">
        {q.origin === "post" ? "The post leaves this open" : "The records raise this"} ·{" "}
        {q.status === "open" ? "Open" : "Answered"}
      </p>
      <h2 className="mt-2 font-display text-2xl text-paper">{q.title}</h2>

      {entry ? (
        <>
          <p className="mt-4 border-l border-rule pl-4 text-sm leading-relaxed text-fog">
            <Inline text={entry.note} />
          </p>
          <p className="mt-4 font-display text-lg text-brass italic">{entry.close}</p>
          <div className="mt-1 flex flex-wrap gap-x-6">
            <PassageDoor to={door(entry.close)} />
            <ListenButton block={door(entry.close)?.hash} />
          </div>
        </>
      ) : null}

      <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm leading-relaxed sm:grid-cols-[11rem_1fr]">
        {FIELDS.map(([key, label]) => (
          <div key={key} className="contents">
            <dt className="text-[0.68rem] tracking-[0.14em] text-brass uppercase sm:pt-0.5">
              {label}
            </dt>
            <dd className="text-fog">{q[key] as string}</dd>
          </div>
        ))}
      </dl>

      {links.length ? (
        <div className="mt-5">
          <h3 className="font-sans text-[0.68rem] tracking-[0.14em] text-brass uppercase">
            Evidence
          </h3>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed">
            {links.map((l) => (
              <li key={l.id} className="flex flex-wrap items-baseline gap-x-2">
                <span
                  className={cn(
                    "text-[0.66rem] tracking-[0.14em] uppercase",
                    l.type === "contradicts" ? "text-brass" : "text-muted",
                  )}
                >
                  {TYPE_LABEL[l.type]}
                </span>
                <span className="text-paper">{recordName(l.record).label}</span>
                {l.note ? <span className="text-fog">{l.note}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-x-6">
        {sources.map((s) => {
          const passage = passageDoor(s);
          if (passage) return <PassageDoor key={s} to={passage} />;
          const record = recordName(s);
          return record.plate ? (
            <PlateDoor key={s} id={record.plate} label={`See ${record.label.toLowerCase()}`} />
          ) : null;
        })}
      </div>
    </section>
  );
}
