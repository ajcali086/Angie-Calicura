import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { Plate } from "@/components/Plate";
import { doorClass } from "@/components/Door";
import { SnippetCard } from "@/components/SnippetCard";
import { ListenButton } from "@/components/audio/ListenButton";
import { chapterBySlug, plateById, plates } from "@/data/article";
import { blockSentences, spokenBlocks } from "@/data/audio";
import { plateImages } from "@/data/plateImages";

export const Route = createFileRoute("/archive/$id")({
  loader: ({ params }) => {
    if (!plateById(params.id)) throw notFound();
    return { id: params.id };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Plate ${plateById(loaderData?.id ?? "")?.number ?? ""} · Angie` }],
  }),
  component: PlatePage,
});

function PlatePage() {
  const { id } = Route.useLoaderData();
  const plate = plateById(id)!;
  const chapter = chapterBySlug(plate.chapter)!;
  const prev = plates[plate.number - 2];
  const next = plates[plate.number];
  const image = plateImages[plate.id];
  const passage = spokenBlocks().find((b) => b.id === plate.paragraph);

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="kicker">
          Part {chapter.number} · {chapter.title}
        </p>
        <h1 className="mt-2 font-display text-3xl text-paper">
          Plate {plate.number} <span className="text-muted">of {plates.length}</span>
        </h1>
        <div className="mt-6">
          <Plate plate={plate} tone="ink" link={false} large />
        </div>
        <div className="flex flex-wrap gap-x-6">
          <Link
            to="/chapters/$slug"
            params={{ slug: chapter.slug }}
            hash={plate.paragraph}
            className={doorClass}
          >
            Read the passage
          </Link>
          <ListenButton block={plate.paragraph} label="Listen to the passage" />
          <ListenButton block={plate.id} label="Hear the caption" />
        </div>
        {image && passage ? (
          <section className="mt-10 border-t border-rule pt-6">
            <h2 className="kicker">Share as an image</h2>
            <SnippetCard
              key={plate.id}
              kicker={`Part ${chapter.number} · ${chapter.title}`}
              sentences={blockSentences(passage)}
              credit={`Plate ${plate.number}`}
              plateSrc={image.src}
              plateAlt={plate.caption.replace(/\*+/g, "")}
              plateIsPortrait={image.height > image.width}
              shareTitle={`Plate ${plate.number} — Angie`}
              shareText={blockSentences(passage)[0]}
              shareUrl={`/chapters/${chapter.slug}#${plate.paragraph}`}
              className="mt-4 max-w-xs"
            />
          </section>
        ) : null}
        <nav aria-label="Plates" className="mt-8 flex justify-between border-t border-rule pt-4">
          {prev ? (
            <Link to="/archive/$id" params={{ id: prev.id }} className={doorClass}>
              ← Plate {prev.number}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to="/archive/$id" params={{ id: next.id }} className={doorClass}>
              Plate {next.number} →
            </Link>
          ) : null}
        </nav>
      </div>
    </SiteShell>
  );
}
