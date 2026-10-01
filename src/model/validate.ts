import { existsSync } from "node:fs";
import { ARTICLE_SOURCE } from "../data/article.source.ts";
import { frozenIds, plates } from "../data/article.ts";
import { PARTS } from "../data/audio.ts";
import { plateImages } from "../data/plateImages.ts";
import { namedInText } from "../data/sources.ts";
import { entities, heldBack, museum, records } from "./index.ts";
import { SCHEMA_VERSION } from "./types.ts";

/**
 * The H1 gates (retrofit plan steps 1 and 2), as named checks. Each returns the
 * problems it finds; none means the gate passes. Run by src/model/model.test.ts
 * and by scripts/check-model.ts before every build.
 */
const repo = new URL("../../", import.meta.url);
const exists = (path: string) => existsSync(new URL(path, repo));
const iso = /^\d{4}-\d{2}-\d{2}$/;
const fail = (cond: boolean, msg: string) => (cond ? [] : [msg]);

export const checks: { name: string; run: () => string[] }[] = [
  {
    name: "the museum record is complete and on this schema",
    run: () => [
      ...fail(museum.schema_version === SCHEMA_VERSION, `schema_version ${museum.schema_version}`),
      ...fail(iso.test(museum.id_freeze_date), "id_freeze_date is not a date"),
      ...fail(["pilot", "live", "archived"].includes(museum.status), `status ${museum.status}`),
      ...(["rights_holder", "credit_line", "title", "slug"] as const).flatMap((k) =>
        fail(!!museum[k], `museum.${k} is empty`),
      ),
      ...(["quote_text_outside_museum", "plates_to_shared_index"] as const).flatMap((k) =>
        fail(["yes", "no", "undecided"].includes(museum.consent_basis[k]), `consent_basis.${k}`),
      ),
    ],
  },
  {
    name: "record IDs are unique and well formed",
    run: () => {
      const seen = new Set<string>();
      return records.flatMap((r) => {
        const out = fail(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.id), `${r.id}: malformed ID`);
        if (seen.has(r.id)) out.push(`${r.id}: duplicate`);
        seen.add(r.id);
        return out;
      });
    },
  },
  {
    name: "every plate resolves to at least one record, and every record's plate exists",
    run: () => [
      ...plates.flatMap((p) =>
        fail(
          records.some((r) => r.plate === p.id),
          `${p.id}: no record`,
        ),
      ),
      ...records.flatMap((r) =>
        r.plate
          ? fail(
              plates.some((p) => p.id === r.plate),
              `${r.id}: no ${r.plate}`,
            )
          : [],
      ),
    ],
  },
  {
    name: "a plate of one object is titled with the post's caption, verbatim",
    run: () =>
      plates.flatMap((p) => {
        const own = records.filter((r) => r.plate === p.id);
        if (own.length !== 1) return [];
        return fail(own[0].title === p.caption.replace(/\*+/g, ""), `${own[0].id}: title drifted`);
      }),
  },
  {
    name: "held and status agree; held media exist; not-held records name no file",
    run: () =>
      records.flatMap((r) => [
        ...fail(["verified", "unverified", "not-held"].includes(r.status), `${r.id}: status`),
        ...fail(r.held === (r.status !== "not-held"), `${r.id}: held=${r.held}, ${r.status}`),
        ...(r.held
          ? [
              ...fail(r.media.length > 0, `${r.id}: held, no media`),
              ...r.media.flatMap((m) => fail(exists(m), `${r.id}: ${m} missing`)),
            ]
          : fail(r.media.length === 0, `${r.id}: not held but names media`)),
      ]),
  },
  {
    name: "every record states its capture provenance; none is a restoration",
    run: () =>
      records.flatMap((r) => {
        const c = r.capture_provenance as Record<string, string> | undefined;
        const ok =
          !!c &&
          ("unknown" in c
            ? !!c.unknown
            : !!(c.device && c.collection && c.source && iso.test(c.date)));
        return [
          ...fail(ok, `${r.id}: capture provenance`),
          ...fail(r.restoration === null, `${r.id}: restoration`),
        ];
      }),
  },
  {
    name: "notes are dated, and an unverified record says why",
    run: () =>
      records.flatMap((r) => [
        ...r.notes.flatMap((n) => fail(iso.test(n.date) && !!n.note, `${r.id}: undated note`)),
        ...(r.status === "unverified"
          ? fail(r.notes.length > 0, `${r.id}: unverified, no note`)
          : []),
      ]),
  },
  {
    name: "the plate images and the held plate records name the same files",
    run: () => {
      const shown = new Set(
        Object.values(plateImages).flatMap((i) => (i.set ?? [i]).map((s) => `public${s.src}`)),
      );
      const held = new Set(records.filter((r) => r.plate && r.held).flatMap((r) => r.media));
      return [
        ...[...shown].flatMap((f) => fail(held.has(f), `${f}: shown, no held record`)),
        ...[...held].flatMap((f) => fail(shown.has(f), `${f}: held, not shown`)),
      ];
    },
  },
  {
    name: "every record named in the text is a not-held record, and the reverse",
    run: () => {
      const cited = records.filter((r) => r.cited);
      return [
        ...namedInText.flatMap((n) =>
          fail(
            cited.some((r) => r.cited === n.name),
            `${n.name}: no record`,
          ),
        ),
        ...cited.flatMap((r) => [
          ...fail(
            namedInText.some((n) => n.name === r.cited),
            `${r.id}: cites nothing`,
          ),
          ...fail(r.status === "not-held", `${r.id}: cited but ${r.status}`),
        ]),
      ];
    },
  },
  {
    name: "every audio part is a derived-media record of the narration script",
    run: () => [
      ...PARTS.flatMap((p) =>
        fail(
          records.some((r) => r.kind === "derived_media" && r.media.includes(`public${p.src}`)),
          `${p.id}: no record`,
        ),
      ),
      ...records
        .filter((r) => r.derived_from)
        .flatMap((r) =>
          fail(
            r.derived_from === "article" || records.some((x) => x.id === r.derived_from),
            `${r.id}: derived from ${r.derived_from}`,
          ),
        ),
    ],
  },
];

// Step 2: entities and identity decisions.
const recordIds = new Set(records.map((r) => r.id));
const passageIds = new Set(frozenIds.blocks.map(([id]) => id));
const entityIds = new Set(entities.map((e) => e.id));
const resolves = (ref: string) => recordIds.has(ref) || passageIds.has(ref);
const text = ARTICLE_SOURCE.toLowerCase();
/** The ways an entity's name can appear in the post: label, label without its qualifier, aliases. */
const nameForms = (e: (typeof entities)[number]) => {
  const bare = e.label.replace(/\s*\([^)]*\)/g, "").replace(/^The /, "");
  return [e.label, bare, bare.split(",")[0], ...e.aliases.map((a) => a.name)];
};
const TITLES = new Set(["mrs.", "mr.", "miss", "baby", "sheriff", "the"]);
/** Given names and quoted nicknames: what a shared-name suggestion would match on. */
const givenNames = (e: (typeof entities)[number]) => {
  const out = new Set<string>();
  for (const name of [e.label, ...e.aliases.map((a) => a.name)]) {
    const first = name.split(" ")[0].toLowerCase();
    if (!TITLES.has(first) && !/^[a-z]\.$/.test(first)) out.add(first);
    for (const m of name.matchAll(/"([^"]+)"|\(([^)]+)\)/g)) out.add((m[1] ?? m[2]).toLowerCase());
  }
  return out;
};

checks.push(
  {
    name: "entity IDs are eight hex characters, unique; slugs are unique",
    run: () => {
      const ids = new Set<string>(),
        slugs = new Set<string>();
      return entities.flatMap((e) => {
        const out = [
          ...fail(/^[0-9a-f]{8}$/.test(e.id), `${e.slug}: id ${e.id}`),
          ...fail(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.slug), `${e.slug}: slug`),
          ...fail(
            ["person", "place", "organization", "business", "event", "family"].includes(e.kind),
            `${e.slug}: kind`,
          ),
        ];
        if (ids.has(e.id)) out.push(`${e.slug}: duplicate id`);
        if (slugs.has(e.slug)) out.push(`${e.slug}: duplicate slug`);
        ids.add(e.id);
        slugs.add(e.slug);
        return out;
      });
    },
  },
  {
    name: "every entity has at least one anchoring record, and every anchor resolves",
    run: () =>
      entities.flatMap((e) => [
        ...fail(e.anchors.length > 0, `${e.slug}: no anchor`),
        ...e.anchors.flatMap((a) => fail(recordIds.has(a), `${e.slug}: anchor ${a}`)),
      ]),
  },
  {
    name: "every entity is named in the post (text or captions)",
    run: () =>
      entities.flatMap((e) =>
        fail(
          nameForms(e).some((n) => text.includes(n.toLowerCase())),
          `${e.slug}: not in the post`,
        ),
      ),
  },
  {
    name: "every alias has sources, belongs to one entity, and is covered by a merge or open assertion",
    run: () => {
      const owner = new Map<string, string>();
      return entities.flatMap((e) =>
        e.aliases.flatMap((a) => {
          const out = [
            ...fail(a.sources.length > 0, `${e.slug}: ${a.name} has no source`),
            ...a.sources.flatMap((s) => fail(resolves(s), `${e.slug}: ${a.name} source ${s}`)),
            ...fail(
              e.identity_assertions.some((x) => x.action !== "split" && x.names?.includes(a.name)),
              `${e.slug}: ${a.name} has no assertion`,
            ),
          ];
          if (owner.has(a.name)) out.push(`${a.name}: alias of ${owner.get(a.name)} and ${e.slug}`);
          owner.set(a.name, e.slug);
          return out;
        }),
      );
    },
  },
  {
    name: "every identity assertion is dated, attributed, reasoned and sourced",
    run: () =>
      entities.flatMap((e) =>
        e.identity_assertions.flatMap((x, i) => {
          const at = `${e.slug} assertion ${i + 1}`;
          return [
            ...fail(["merge", "split", "open"].includes(x.action), `${at}: action`),
            ...fail(
              iso.test(x.date) && !!x.curator && !!x.rationale,
              `${at}: date, curator or rationale`,
            ),
            ...fail(x.sources.length > 0, `${at}: no sources`),
            ...x.sources.flatMap((s) => fail(resolves(s), `${at}: source ${s}`)),
            ...(x.action === "split"
              ? fail(
                  !!x.with?.length && x.with.every((w) => entityIds.has(w) && w !== e.id),
                  `${at}: split targets`,
                )
              : fail(
                  !!x.names?.length && x.names.every((n) => e.aliases.some((a) => a.name === n)),
                  `${at}: names`,
                )),
          ];
        }),
      ),
  },
  {
    name: "people who share a given name or nickname carry a split assertion",
    run: () => {
      const people = entities.filter((e) => e.kind === "person");
      const split = (a: string, b: string) =>
        entities.some((e) =>
          e.identity_assertions.some(
            (x) =>
              x.action === "split" &&
              ((e.id === a && x.with?.includes(b)) || (e.id === b && x.with?.includes(a))),
          ),
        );
      const out: string[] = [];
      people.forEach((a, i) =>
        people.slice(i + 1).forEach((b) => {
          const shared = [...givenNames(a)].filter((n) => givenNames(b).has(n));
          if (shared.length && !split(a.id, b.id))
            out.push(`${a.slug} / ${b.slug} share "${shared[0]}"`);
        }),
      );
      return out;
    },
  },
  {
    name: "every held-back name says why, with sources, and is not also an entity",
    run: () =>
      heldBack.flatMap((h) => [
        ...fail(!!h.reason && h.sources.length > 0, `${h.label}: reason or sources`),
        ...h.sources.flatMap((s) => fail(resolves(s), `${h.label}: source ${s}`)),
        ...fail(!entities.some((e) => e.label === h.label), `${h.label}: also an entity`),
      ]),
  },
);

export function problems(): string[] {
  return checks.flatMap((c) => c.run().map((p) => `${c.name}: ${p}`));
}
