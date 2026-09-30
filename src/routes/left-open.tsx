import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/PageHero";
import { Inline } from "@/components/Inline";
import { PassageDoor, PlateDoor } from "@/components/Door";
import { ListenButton } from "@/components/audio/ListenButton";
import { door } from "@/data/article";
import { discrepancies } from "@/data/discrepancies";

export const Route = createFileRoute("/left-open")({
  head: () => ({ meta: [{ title: "Left Open · Angie" }] }),
  component: LeftOpenPage,
});

const epigraph = "What survives is a silhouette rather than a full portrait";

function LeftOpenPage() {
  return (
    <SiteShell>
      <PageHero
        kicker="The record"
        title="Left Open"
        dek="Where the post says the record runs out, and leaves the question standing."
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
          {discrepancies.length} questions, left open.
        </p>

        {discrepancies.map((d) => (
          <section
            key={d.id}
            id={d.id}
            className="scroll-mt-24 border-t border-rule py-8 first-of-type:border-t-0"
          >
            <h2 className="font-display text-2xl text-paper">{d.title}</h2>
            <p className="mt-4 border-l border-rule pl-4 text-sm leading-relaxed text-fog">
              <Inline text={d.note} />
            </p>
            <p className="mt-4 font-display text-lg text-brass italic">{d.close}</p>
            <div className="mt-1 flex flex-wrap gap-x-6">
              <PassageDoor to={door(d.close)} />
              <ListenButton block={door(d.close)?.hash} />
              {d.plate ? <PlateDoor id={d.plate} /> : null}
            </div>
          </section>
        ))}
      </div>
    </SiteShell>
  );
}
