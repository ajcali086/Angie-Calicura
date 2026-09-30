import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/PageHero";
import { Inline } from "@/components/Inline";
import { Plate } from "@/components/Plate";
import { article, chapterBySlug, chapters, plateById, type Block } from "@/data/article";

export const Route = createFileRoute("/chapters/$slug")({
  loader: ({ params }) => {
    const chapter = chapterBySlug(params.slug);
    if (!chapter) throw notFound();
    return { slug: chapter.slug };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${chapterBySlug(loaderData?.slug ?? "")?.title ?? "Chapter"} · Angie` }],
  }),
  component: ChapterPage,
});

function ChapterPage() {
  const { slug } = Route.useLoaderData();
  const chapter = chapterBySlug(slug)!;
  const prev = chapters[chapter.number - 2];
  const next = chapters[chapter.number];
  const firstParagraph = chapter.blocks.find((b) => b.type === "p" && !b.text.startsWith("*"));

  return (
    <SiteShell>
      <PageHero
        kicker={`Part ${chapter.number} of ${chapters.length}`}
        title={chapter.title}
        dek={article.subtitle}
        compact
      />
      <div className="bg-paper">
        <article className="prose-archive mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
          {chapter.blocks.map((block, i) => (
            <BlockView key={i} block={block} dropCap={block === firstParagraph} />
          ))}
        </article>
        <nav
          aria-label="Chapters"
          className="mx-auto flex max-w-2xl flex-wrap justify-between gap-4 border-t border-ink/15 px-4 py-8 sm:px-6"
        >
          {prev ? (
            <Link
              to="/chapters/$slug"
              params={{ slug: prev.slug }}
              className="flex min-h-11 flex-col text-ink"
            >
              <span className="font-sans text-[0.68rem] tracking-[0.16em] text-brass-dim uppercase">
                Previous
              </span>
              <span className="font-display text-xl">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to="/chapters/$slug"
              params={{ slug: next.slug }}
              className="flex min-h-11 flex-col text-right text-ink"
            >
              <span className="font-sans text-[0.68rem] tracking-[0.16em] text-brass-dim uppercase">
                Next
              </span>
              <span className="font-display text-xl">{next.title}</span>
            </Link>
          ) : null}
        </nav>
      </div>
    </SiteShell>
  );
}

function BlockView({ block, dropCap }: { block: Block; dropCap: boolean }) {
  if (block.type === "figure") {
    const plate = plateById(block.plate);
    return plate ? (
      <div className="my-10">
        <Plate plate={plate} />
      </div>
    ) : null;
  }
  if (block.type === "quote") {
    return (
      <blockquote id={block.id} className="quote-pull scroll-mt-24 whitespace-pre-line">
        <Inline text={block.text} />
      </blockquote>
    );
  }
  if (block.type === "list") {
    return (
      <ul id={block.id} className="scroll-mt-24 list-disc space-y-1 pl-6 marker:text-brass-dim">
        {block.items.map((item) => (
          <li key={item}>
            <Inline text={item} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p id={block.id} className={`scroll-mt-24${dropCap ? " drop-cap" : ""}`}>
      <Inline text={block.text} />
    </p>
  );
}
