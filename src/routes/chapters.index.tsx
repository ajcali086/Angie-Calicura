import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { AuthorLink } from "@/components/AuthorLink";
import { PageHero } from "@/components/PageHero";
import { article, chapters, plates } from "@/data/article";

export const Route = createFileRoute("/chapters/")({ component: ChaptersIndex });

function ChaptersIndex() {
  return (
    <SiteShell>
      <PageHero
        kicker="The article"
        title={article.subtitle}
        byline={
          <>
            By <AuthorLink />
          </>
        }
        compact
      />
      <ol className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {chapters.map((c) => {
          const paragraphs = c.blocks.filter((b) => b.type !== "figure").length;
          const plateCount = plates.filter((p) => p.chapter === c.slug).length;
          return (
            <li key={c.slug} className="border-b border-rule">
              <Link
                to="/chapters/$slug"
                params={{ slug: c.slug }}
                className="group flex min-h-20 flex-col gap-1 py-6 sm:flex-row sm:items-baseline sm:gap-8"
              >
                <span className="w-12 shrink-0 font-display text-2xl text-brass">
                  {String(c.number).padStart(2, "0")}
                </span>
                <span className="flex-1">
                  <span className="block font-display text-2xl text-paper group-hover:text-brass">
                    {c.title}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {paragraphs} passages · {plateCount} plates
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </SiteShell>
  );
}
