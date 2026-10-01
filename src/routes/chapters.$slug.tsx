import { memo, useEffect, useLayoutEffect, useState } from "react";
import { createFileRoute, Link, notFound, useRouterState } from "@tanstack/react-router";
import { Headphones } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { AuthorLink } from "@/components/AuthorLink";
import { PageHero } from "@/components/PageHero";
import { Inline } from "@/components/Inline";
import { Plate } from "@/components/Plate";
import { useAudioControls } from "@/components/audio/AudioProvider";
import { ListenButton } from "@/components/audio/ListenButton";
import { SharePassage } from "@/components/audio/SharePassage";
import { useFollow } from "@/components/audio/useFollow";
import {
  article,
  chapterBySlug,
  chapters,
  plateById,
  plates,
  type Block,
  type Chapter,
} from "@/data/article";
import { blockWindow } from "@/data/audio";
import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/useReveal";

export const Route = createFileRoute("/chapters/$slug")({
  validateSearch: (search: Record<string, unknown>): { listen?: 1 } =>
    search.listen ? { listen: 1 } : {},
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

/** How long the narration spends on a chapter's blocks. */
function listeningTime(chapter: Chapter): number {
  return chapter.blocks.reduce((t, b) => {
    const w = blockWindow(b.type === "figure" ? b.plate : b.id);
    return t + (w ? w.end - w.start : 0);
  }, 0);
}

function ChapterPage() {
  const { slug } = Route.useLoaderData();
  const { listen } = Route.useSearch();
  const hash = useRouterState({ select: (s) => s.location.hash });

  // Land on the linked passage, from a shared link or from the player's part
  // name, even when this chapter is already open.
  useLayoutEffect(() => {
    const id = decodeURIComponent(hash.replace(/^#/, ""));
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [hash, slug]);
  const chapter = chapterBySlug(slug)!;
  const prev = chapters[chapter.number - 2];
  const next = chapters[chapter.number];
  const firstParagraph = chapter.blocks.find((b) => b.type === "p" && !b.text.startsWith("*"));
  const first = chapter.blocks[0];
  const activeBlock = useFollow(slug);
  useReveal(slug);
  const kicker = `Part ${chapter.number} · ${chapter.title}`;

  return (
    <SiteShell>
      <PageHero
        kicker={`Part ${chapter.number} of ${chapters.length}`}
        title={chapter.title}
        titleClassName={chapter.slug === "wyoming-madame" ? "sign-warm-up" : undefined}
        dek={article.subtitle}
        byline={
          <>
            By <AuthorLink />
          </>
        }
        compact
      />
      <div className={`bg-paper chapter-wash-${chapter.number}`}>
        <article className="prose-archive mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="-mt-4 mb-8 flex flex-wrap items-center gap-x-6 border-b border-ink/10 pb-2">
            <ListenButton
              block={first.type === "figure" ? first.plate : first.id}
              label="Listen to this part"
              length={listeningTime(chapter)}
              className="text-brass-dim hover:text-ink"
            />
          </div>
          {listen ? <ListenHere /> : null}
          {chapter.blocks.map((block, i) => {
            const id = block.type === "figure" ? block.plate : block.id;
            return (
              <BlockView
                key={i}
                block={block}
                slug={slug}
                kicker={kicker}
                dropCap={block === firstParagraph}
                reading={activeBlock === id}
              />
            );
          })}
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

/**
 * A shared link opens here with ?listen=1. Browsers won't start audio without
 * a tap, so the page offers the tap: play from the linked passage.
 */
function ListenHere() {
  const hash = useRouterState({ select: (s) => s.location.hash });
  const { playBlock } = useAudioControls();
  const [done, setDone] = useState(false);
  // The server never sees the #passage, so the button appears only once the
  // page is running in the browser; rendering it on the server would not match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const block = decodeURIComponent(hash.replace(/^#/, ""));
  useEffect(() => setDone(false), [block]);
  if (!mounted || done || !block || !blockWindow(block)) return null;
  return (
    <div className="sticky top-20 z-30 mb-6 flex justify-center">
      <button
        type="button"
        onClick={() => {
          playBlock(block);
          setDone(true);
        }}
        className="inline-flex min-h-11 items-center gap-2 bg-ink px-4 font-sans text-[0.72rem] tracking-[0.14em] text-paper uppercase shadow-lg hover:text-brass"
      >
        <Headphones className="size-4" aria-hidden />
        Listen from this passage
      </button>
    </div>
  );
}

/** The plates that sit beside a block, for its Listen and Share row. */
const platesBeside = new Map<string, string[]>();
for (const p of plates)
  platesBeside.set(p.paragraph, [...(platesBeside.get(p.paragraph) ?? []), p.id]);

const BlockView = memo(function BlockView({
  block,
  slug,
  kicker,
  dropCap,
  reading,
}: {
  block: Block;
  slug: string;
  kicker: string;
  dropCap: boolean;
  reading: boolean;
}) {
  if (block.type === "figure") {
    const plate = plateById(block.plate);
    return plate ? (
      <div className="my-10">
        <Plate plate={plate} reading={reading} />
      </div>
    ) : null;
  }
  const beside = platesBeside.get(block.id);
  const row = beside ? (
    <div className="-mt-2 flex flex-wrap gap-x-5">
      <ListenButton block={block.id} label="Listen" className="text-brass-dim hover:text-ink" />
      <SharePassage block={block.id} slug={slug} plate={beside[0]} kicker={kicker} />
    </div>
  ) : null;
  const current = reading && "is-current";

  if (block.type === "quote") {
    return (
      <>
        <blockquote
          id={block.id}
          data-block={block.id}
          data-reveal
          className={cn("quote-pull scroll-mt-24 whitespace-pre-line", current)}
        >
          <Inline text={block.text} />
        </blockquote>
        {row}
      </>
    );
  }
  if (block.type === "list") {
    return (
      <>
        <ul
          id={block.id}
          data-block={block.id}
          data-reveal
          className={cn("scroll-mt-24 list-disc space-y-1 pl-6 marker:text-brass-dim", current)}
        >
          {block.items.map((item) => (
            <li key={item}>
              <Inline text={item} />
            </li>
          ))}
        </ul>
        {row}
      </>
    );
  }
  return (
    <>
      <p
        id={block.id}
        data-block={block.id}
        data-reveal
        className={cn("scroll-mt-24", dropCap && "drop-cap", current)}
      >
        <Inline text={block.text} />
      </p>
      {row}
    </>
  );
});
