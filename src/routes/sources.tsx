import { createFileRoute, Link } from "@tanstack/react-router";
import { EntityLink } from "@/components/EntityPage";
import { entitiesForRecord, records } from "@/model";
import { AuthorLink } from "@/components/AuthorLink";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/PageHero";
import { Inline } from "@/components/Inline";
import { PassageDoor } from "@/components/Door";
import { ListenButton } from "@/components/audio/ListenButton";
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
          <p className="mt-2 text-sm text-fog">
            By <AuthorLink />, for Sheridan Wyoming History
          </p>
          <p
            data-adaptation-note
            className="mt-4 border-l-2 border-brass pl-4 text-sm leading-relaxed text-fog"
          >
            This article has been edited and formatted for presentation in this museum. The original
            version, as published and unedited, is at{" "}
            <a
              href={article.url}
              className="text-brass underline decoration-current/40 underline-offset-4 hover:text-paper hover:decoration-current"
            >
              Sheridan Wyoming History
            </a>
            .
          </p>
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
                <p className="mt-0.5 text-[0.68rem] tracking-[0.14em] text-muted uppercase">
                  Not held: cited by the author; the museum has no copy
                </p>
                <p className="mt-1 text-sm leading-relaxed text-fog">
                  “<Inline text={s.quote} />”
                </p>
                <div className="flex flex-wrap gap-x-6">
                  <PassageDoor to={door(s.quote)} />
                  <ListenButton block={door(s.quote)?.hash} />
                </div>
                <CitedNames name={s.name} />
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

/** The people, places and organizations a cited record names, as doors to their pages. */
function CitedNames({ name }: { name: string }) {
  const record = records.find((r) => r.cited === name);
  const named = record ? entitiesForRecord(record.id) : [];
  if (!named.length) return null;
  return (
    <p className="mt-1 flex flex-wrap gap-x-4 text-sm">
      <span className="text-[0.68rem] tracking-[0.14em] text-muted uppercase">Names</span>
      {named.map((e) => (
        <EntityLink key={e.id} entity={e} />
      ))}
    </p>
  );
}
