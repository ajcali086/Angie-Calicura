import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/PageHero";
import { Inline } from "@/components/Inline";
import { PassageDoor } from "@/components/Door";
import { article, door, plain } from "@/data/article";
import { namedInText, platesByPublication, thanks } from "@/data/sources";

export const Route = createFileRoute("/sources")({
  head: () => ({ meta: [{ title: "Sources · Angie" }] }),
  component: SourcesPage,
});

function SourcesPage() {
  return (
    <SiteShell>
      <PageHero
        kicker="Sources"
        title="What the post stands on"
        dek="The article itself, the pages it reproduces, the records it names, and the people it thanks."
        compact
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <section>
          <h2 className="kicker border-b border-rule pb-2">The article</h2>
          <p className="mt-4 font-display text-xl leading-snug text-paper">{article.title}</p>
          <p className="mt-2 text-sm text-fog">{article.source}</p>
          <a
            href={article.url}
            className="mt-1 inline-flex min-h-11 items-center text-[0.7rem] tracking-[0.14em] break-all text-brass uppercase hover:text-paper"
          >
            Read the original post
          </a>
        </section>

        <section className="mt-12">
          <h2 className="kicker border-b border-rule pb-2">In the plates</h2>
          {platesByPublication().map((group) => (
            <div key={group.name} className="mt-6">
              <h3 className="font-display text-2xl text-paper">{group.name}</h3>
              <ul className="mt-2">
                {group.plates.map((p) => (
                  <li key={p.id}>
                    <Link
                      to="/archive/$id"
                      params={{ id: p.id }}
                      className="flex min-h-11 items-baseline gap-3 border-b border-rule/40 py-2 text-sm text-fog hover:text-paper"
                    >
                      <span className="w-16 shrink-0 text-[0.68rem] tracking-[0.14em] text-brass uppercase">
                        Plate {p.number}
                      </span>
                      <span className="line-clamp-2">{plain(p.caption)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="kicker border-b border-rule pb-2">Named in the text</h2>
          <ul>
            {namedInText.map((s) => (
              <li key={s.name} className="border-b border-rule/40 py-4">
                <p className="font-display text-xl text-paper">{s.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-fog">
                  “<Inline text={s.quote} />”
                </p>
                <PassageDoor to={door(s.quote)} />
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="kicker border-b border-rule pb-2">Thanks to</h2>
          <ul className="mt-4 space-y-1 font-display text-lg text-fog">
            {thanks.map((t) => (
              <li key={t}>
                <Inline text={t} />
              </li>
            ))}
          </ul>
          <PassageDoor to={door("Thanks to: **Judy Armstrong**")} />
        </section>
      </div>
    </SiteShell>
  );
}
