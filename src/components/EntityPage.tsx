import { Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/PageHero";
import { Inline } from "@/components/Inline";
import { PassageDoor, PlateDoor, doorClass } from "@/components/Door";
import { chapters, plain, plateById } from "@/data/article";
import { plateImages } from "@/data/plateImages";
import { entities, records, relationshipsOf } from "@/model";
import {
  STATUS_LINE,
  anchorsInOrder,
  mediaSrc,
  entitySection,
  mentionsOf,
  questionsAbout,
} from "@/model/connections";
import type { Entity, Relationship } from "@/model/types";
import { cn } from "@/lib/utils";

/**
 * An entity's page: an index of where it appears in the records and the
 * post, generated from the model, never a biography (spec §3). The one line
 * of framing is the curator's, and stays empty until written.
 */

const KIND: Record<Entity["kind"], string> = {
  person: "Person",
  family: "Family",
  place: "Place",
  business: "Business",
  organization: "Organization",
  event: "Event",
};

const LINK_TYPE = {
  "appears-in": "Appears in",
  "photographed-at": "Photographed in",
  "documented-in": "Named in",
} as const;

const PHRASE: Record<Relationship["type"], string> = {
  "family-of": "is family of",
  "employed-at": "worked at",
  "located-at": "is in",
  owns: "owned",
  operated: "ran",
  "officer-of": "was an officer of",
};

const ASSERTION: Record<"merge" | "split" | "open", string> = {
  merge: "Also named",
  split: "Not the same as",
  open: "Unsettled",
};

const byId = new Map(entities.map((e) => [e.id, e]));

/** A door to another entity's page. */
export function EntityLink({ entity, className }: { entity: Entity; className?: string }) {
  const to = `/${entitySection(entity)}/$slug` as
    "/people/$slug" | "/places/$slug" | "/businesses/$slug" | "/organizations/$slug";
  return (
    <Link
      to={to}
      params={{ slug: entity.slug }}
      className={cn(
        "text-paper underline decoration-rule underline-offset-4 hover:text-brass",
        className,
      )}
    >
      {entity.label}
    </Link>
  );
}

/** Where a passage ID or a record ID points, as a door. */
function SourceDoor({ id }: { id: string }) {
  const chapter = chapters.find((c) => c.blocks.some((b) => b.type !== "figure" && b.id === id));
  if (chapter) return <PassageDoor to={{ slug: chapter.slug, hash: id }} label="The post" />;
  const plate = plateById(id) ?? plateById(id.replace(/-\d+$/, ""));
  return plate ? <PlateDoor id={plate.id} label={`Plate ${plate.number}`} /> : null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 first:mt-0">
      <h2 className="kicker border-b border-rule pb-2">{title}</h2>
      {children}
    </section>
  );
}

export function EntityPage({ entity }: { entity: Entity }) {
  const anchors = anchorsInOrder(entity);
  const edges = relationshipsOf(entity.id);
  const mentions = mentionsOf(entity);
  const open = questionsAbout(entity);
  const merged = entity.identity_assertions.filter((a) => a.action !== "split");
  const splits = entity.identity_assertions.filter((a) => a.action === "split");

  return (
    <SiteShell>
      <PageHero
        kicker={KIND[entity.kind]}
        title={entity.label}
        dek={entity.framing?.text}
        compact
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {entity.aliases.length ? (
          <Section title="Also named">
            <ul className="mt-4 space-y-2">
              {entity.aliases.map((a) => (
                <li key={a.name} className="flex flex-wrap items-baseline gap-x-4">
                  <span className="font-display text-lg text-paper">{a.name}</span>
                  {a.sources.map((s) => (
                    <SourceDoor key={s} id={s} />
                  ))}
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <Section title={`In the records · ${anchors.length}`}>
          <ul className="mt-4 divide-y divide-rule/50">
            {anchors.map(({ record, type, rec }) => {
              const plate = rec.plate ? plateById(rec.plate) : undefined;
              const image = rec.plate ? plateImages[rec.plate] : undefined;
              const src = image
                ? (image.set?.find((i) => rec.media.includes(`public${i.src}`)) ?? image).src
                : (mediaSrc(rec) ?? null);
              return (
                <li key={record} className="flex gap-4 py-4">
                  {src ? (
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      className="size-16 shrink-0 object-cover"
                    />
                  ) : (
                    <span
                      className="size-16 shrink-0 border border-dashed border-rule"
                      aria-hidden
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-[0.68rem] tracking-[0.14em] text-brass uppercase">
                      {LINK_TYPE[type]} ·{" "}
                      {plate
                        ? `Plate ${plate.number}`
                        : rec.cited
                          ? "a record the post cites"
                          : "shown in the post's text"}
                    </p>
                    <p className="mt-1 text-sm leading-snug text-fog">
                      {plate ? plain(plate.caption) : rec.title}
                    </p>
                    {rec.status !== "verified" ? (
                      <p data-status={rec.status} className="mt-1 text-[0.75rem] text-muted">
                        {rec.cited
                          ? records.some((c) => c.copy_of === rec.id)
                            ? "Cited by the author; the museum holds copies the post shows."
                            : "Not held: cited by the author; the museum has no copy."
                          : STATUS_LINE[rec.status]}
                      </p>
                    ) : null}
                    {plate ? (
                      <PlateDoor id={plate.id} />
                    ) : !rec.cited && rec.held ? (
                      <Link to="/archive" hash={rec.id} className={doorClass}>
                        See it in the archive
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>

        {edges.length ? (
          <Section title="How this connects">
            <ul className="mt-4 space-y-3 text-sm leading-relaxed">
              {edges.map((r) => {
                const from = byId.get(r.from)!;
                const to = byId.get(r.to)!;
                const p = r.provenance;
                return (
                  <li key={`${r.from}-${r.type}-${r.to}`}>
                    <span className="text-fog">
                      {from.id === entity.id ? (
                        <span className="text-paper">{from.label}</span>
                      ) : (
                        <EntityLink entity={from} />
                      )}{" "}
                      {PHRASE[r.type]}{" "}
                      {to.id === entity.id ? (
                        <span className="text-paper">{to.label}</span>
                      ) : (
                        <EntityLink entity={to} />
                      )}
                      {r.note ? <span className="text-muted"> ({r.note})</span> : null}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-baseline gap-x-3 text-[0.68rem] tracking-[0.12em] text-muted uppercase">
                      {p.kind === "derived"
                        ? "Stated by the record"
                        : "From the post's text, curator's reading"}
                      <SourceDoor id={p.kind === "derived" ? p.record : p.passage} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </Section>
        ) : null}

        {mentions.length ? (
          <Section title={`Where the post names it · ${mentions.length}`}>
            <ul className="mt-4 divide-y divide-rule/50">
              {mentions.map((m) => {
                const text = plain(m.text);
                return (
                  <li key={m.id} className="py-3">
                    <p className="line-clamp-3 font-display text-base leading-relaxed text-fog">
                      <Inline text={text} />
                    </p>
                    <PassageDoor to={{ slug: m.chapter, hash: m.id }} />
                  </li>
                );
              })}
            </ul>
          </Section>
        ) : null}

        {merged.length || splits.length ? (
          <Section title="Identity">
            <ul className="mt-4 space-y-4 text-sm leading-relaxed">
              {[...merged, ...splits].map((a, i) => (
                <li key={i}>
                  <p className="text-[0.68rem] tracking-[0.14em] text-brass uppercase">
                    {ASSERTION[a.action]}
                  </p>
                  <p className="mt-1 text-paper">
                    {a.action === "split"
                      ? a.with?.map((w, j) => (
                          <span key={w}>
                            {j ? ", " : ""}
                            <EntityLink entity={byId.get(w)!} />
                          </span>
                        ))
                      : a.names?.join(" · ")}
                  </p>
                  <p className="mt-1 text-fog">{a.rationale}</p>
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-3 text-[0.68rem] tracking-[0.12em] text-muted uppercase">
                    {a.curator}, {a.date}
                    {a.sources.map((s) => (
                      <SourceDoor key={s} id={s} />
                    ))}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {entity.notes.length ? (
          <Section title="Notes">
            {entity.notes.map((n) => (
              <p key={n.note} className="mt-4 text-sm leading-relaxed text-fog">
                <span className="text-muted">{n.date}</span> {n.note}
              </p>
            ))}
          </Section>
        ) : null}

        {open.length ? (
          <Section title="Left open">
            <ul className="mt-4 flex flex-wrap gap-x-6">
              {open.map((q) => (
                <li key={q.id}>
                  <Link to="/left-open" hash={q.id} className={doorClass}>
                    {q.title}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
      </div>
    </SiteShell>
  );
}
