import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  blockText,
  chapters,
  door,
  frozenIds,
  originalText,
  plates,
  publishedText,
} from "../data/article.ts";
import { correctionFiles, corrections } from "../data/corrections.ts";
import PUBLISHED from "../data/published-text.json" with { type: "json" };
import { matchScript, unregisteredDifferences } from "../../scripts/lib/narration.ts";
import { PARTS } from "../data/audio.ts";
import { timeline, timelineFiles } from "../data/timeline.ts";
import { titleImage } from "../data/titleImage.ts";
import CUES from "../generated/cues.json" with { type: "json" };
import FROZEN from "./frozen.json" with { type: "json" };
import { plateFiles, plateImages } from "../data/plateImages.ts";
import { discrepancies } from "../data/discrepancies.ts";
import { namedInText, sourceFiles } from "../data/sources.ts";
import {
  entities,
  evidence,
  folders,
  heldBack,
  museum,
  questions,
  recordLinks,
  records,
  relationships,
} from "./index.ts";
import { RELATIONSHIP_TYPES, SCHEMA_VERSION } from "./types.ts";

/**
 * The H1 gates (retrofit plan steps 1 to 6), as named checks. Each returns the
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
    name: "each record, entity and question has a file of its own, named for its ID (an entity's for its slug)",
    run: () =>
      (Object.keys(folders) as (keyof typeof folders)[]).flatMap((folder) =>
        Object.entries(folders[folder]).flatMap(([path, entry]) => {
          const e = entry as { id?: string; slug?: string };
          const name = folder === "entities" ? e.slug : e.id;
          return fail(path === `./${folder}/${name}.json`, `${path}: named for ${name}`);
        }),
      ),
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
            cited.some((r) => r.cited === n.id),
            `${n.id}: no record`,
          ),
        ),
        ...cited.flatMap((r) => [
          ...fail(
            namedInText.some((n) => n.id === r.cited),
            `${r.id}: cites nothing`,
          ),
          ...fail(r.status === "not-held", `${r.id}: cited but ${r.status}`),
        ]),
      ];
    },
  },
  {
    name: "a record the post shows in its text names a passage that exists, and no plate",
    run: () =>
      records
        .filter((r) => r.shown_at)
        .flatMap((r) => [
          ...fail(
            chapters.some((c) => c.blocks.some((b) => b.type !== "figure" && b.id === r.shown_at)),
            `${r.id}: shown at ${r.shown_at}`,
          ),
          ...fail(!r.plate, `${r.id}: shown at a passage and in a plate`),
        ]),
  },
  {
    name: "every held record outside the plates is shown in the post's text",
    run: () =>
      records
        .filter((r) => r.held && !r.plate && !r.cited && r.kind !== "derived_media")
        .flatMap((r) => fail(!!r.shown_at, `${r.id}: held, but the post doesn't show it`)),
  },
  {
    name: "a copy of a cited record points at a not-held record the post cites, and is held",
    run: () =>
      records
        .filter((r) => r.copy_of)
        .flatMap((r) => [
          ...fail(
            records.some((c) => c.id === r.copy_of && !!c.cited && c.status === "not-held"),
            `${r.id}: copy of ${r.copy_of}`,
          ),
          ...fail(r.held, `${r.id}: a copy that isn't held`),
        ]),
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
const text = publishedText().toLowerCase();
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

// Step 3: relationships.
const entityById = new Map(entities.map((e) => [e.id, e]));
const anchored = (entityId: string, record: string) =>
  !!entityById.get(entityId)?.anchors.includes(record);
const recordOf = (id: string) => records.find((r) => r.id === id);
/** A record's caption: its plate's, as the post gives it. */
const captionOf = (id: string) => {
  const plate = plates.find((p) => p.id === recordOf(id)?.plate);
  return plate ? plate.caption.replace(/\*+/g, "") : "";
};
const passageText = (id: string) => {
  for (const c of chapters)
    for (const b of c.blocks) if (b.type !== "figure" && b.id === id) return blockText(b);
  return undefined;
};
const name = (id: string) => entityById.get(id)?.slug ?? id;

checks.push(
  {
    name: "every relationship is typed, joins two different entities, and appears once",
    run: () => {
      const seen = new Set<string>();
      return relationships.flatMap((r) => {
        const key = `${r.from} ${r.type} ${r.to}`;
        const out = [
          ...fail((RELATIONSHIP_TYPES as readonly string[]).includes(r.type), `${key}: type`),
          ...fail(entityById.has(r.from) && entityById.has(r.to), `${key}: missing entity`),
          ...fail(r.from !== r.to, `${key}: joins an entity to itself`),
        ];
        if (seen.has(key)) out.push(`${key}: duplicate`);
        seen.add(key);
        return out;
      });
    },
  },
  {
    name: "a derived edge names its record and field, the record anchors both ends, and a caption quote is verbatim",
    run: () =>
      relationships.flatMap((r) => {
        const p = r.provenance;
        if (p.kind !== "derived") return [];
        const at = `${name(r.from)} ${r.type} ${name(r.to)}`;
        return [
          ...fail(!!recordOf(p.record), `${at}: no record ${p.record}`),
          ...fail(
            anchored(r.from, p.record) && anchored(r.to, p.record),
            `${at}: ${p.record} doesn't anchor both`,
          ),
          ...(p.field === "caption"
            ? fail(captionOf(p.record).includes(p.says), `${at}: not in ${p.record}'s caption`)
            : fail(
                !!recordOf(p.record)?.held,
                `${at}: read from an image the museum doesn't hold`,
              )),
        ];
      }),
  },
  {
    name: "a curator edge names a dated curator and a passage, and quotes it verbatim",
    run: () =>
      relationships.flatMap((r) => {
        const p = r.provenance;
        if (p.kind !== "curator") return [];
        const at = `${name(r.from)} ${r.type} ${name(r.to)}`;
        return [
          ...fail(!!p.curator && iso.test(p.date), `${at}: curator or date`),
          ...fail(passageText(p.passage)?.includes(p.says) ?? false, `${at}: not in ${p.passage}`),
        ];
      }),
  },
  {
    name: "a record link is anchored, fits its entity's kind, and a caption quote is verbatim",
    run: () =>
      recordLinks.flatMap((l) => {
        const e = entityById.get(l.entity);
        const at = `${name(l.entity)} ${l.type} ${l.record}`;
        return [
          ...fail(!!e && anchored(l.entity, l.record), `${at}: not anchored`),
          ...fail(
            l.type === "appears-in"
              ? e?.kind === "person" || e?.kind === "family"
              : ["place", "business", "organization"].includes(e?.kind ?? ""),
            `${at}: wrong kind of entity`,
          ),
          ...(l.field === "caption"
            ? fail(captionOf(l.record).includes(l.says), `${at}: not in the caption`)
            : fail(!!recordOf(l.record)?.held, `${at}: image not held`)),
        ];
      }),
  },
  {
    name: "no edge rests on plate 8, which doesn't say which Ideal Hotel",
    run: () =>
      relationships.flatMap((r) =>
        r.provenance.kind === "derived" && r.provenance.record === "plate-08"
          ? [`${name(r.from)} ${r.type} ${name(r.to)} rests on plate 8`]
          : [],
      ),
  },
);

// Steps 4 and 5: evidence links and open questions.
const evidenceIds = new Set(evidence.map((l) => l.id));
const plateIds = new Set(plates.map((p) => p.id));
const plateCaption = (id: string) =>
  plates.find((p) => p.id === id)?.caption.replace(/\*+/g, "") ?? "";

checks.push(
  {
    name: "every evidence link has an ID, a type, a record and a dated curator",
    run: () => {
      const seen = new Set<string>();
      return evidence.flatMap((l) => {
        const out = [
          ...fail(/^ev-\d{3}$/.test(l.id), `${l.id}: malformed ID`),
          ...fail(["supports", "contradicts", "qualifies"].includes(l.type), `${l.id}: type`),
          ...fail(recordIds.has(l.record), `${l.id}: no record ${l.record}`),
          ...fail(!!l.curator && iso.test(l.date), `${l.id}: curator or date`),
          ...(recordOf(l.record)?.status === "not-held"
            ? fail(!!l.note, `${l.id}: not-held record, no note`)
            : []),
        ];
        if (seen.has(l.id)) out.push(`${l.id}: duplicate`);
        seen.add(l.id);
        return out;
      });
    },
  },
  {
    name: "every claim resolves: a frozen passage or plate, quoted verbatim, or another museum's claim, attributed",
    run: () =>
      evidence.flatMap((l) => {
        const c = l.claim as Record<string, string>;
        if ("passage" in c)
          return fail(
            passageText(c.passage)?.includes(c.quote) ?? false,
            `${l.id}: not in ${c.passage}`,
          );
        if ("plate" in c)
          return [
            ...fail(plateIds.has(c.plate), `${l.id}: no ${c.plate}`),
            ...fail(
              plateCaption(c.plate).includes(c.quote),
              `${l.id}: not in ${c.plate}'s caption`,
            ),
          ];
        return fail(
          !!c.museum &&
            c.museum !== museum.slug &&
            l.holding_museum === c.museum &&
            !!c.ref &&
            !!c.anchor &&
            !!c.summary,
          `${l.id}: cross-museum claim not attributed`,
        );
      }),
  },
  {
    name: "every contradiction is carried by an open question, so both sides stand in view",
    run: () =>
      evidence
        .filter((l) => l.type === "contradicts")
        .flatMap((l) =>
          fail(
            questions.some((q) => q.evidence.includes(l.id)),
            `${l.id}: no question carries it`,
          ),
        ),
  },
  {
    name: "every open question is bounded: all fields filled, sources and evidence resolve",
    run: () => {
      const ids = new Set<string>();
      return questions.flatMap((q) => {
        const out = [
          ...fail(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(q.id), `${q.id}: malformed ID`),
          ...fail(["post", "records"].includes(q.origin), `${q.id}: origin`),
          ...fail(["open", "answered"].includes(q.status), `${q.id}: status`),
          ...(
            [
              "title",
              "what_we_know",
              "what_we_dont",
              "what_might_answer_it",
              "evidence_needed",
            ] as const
          ).flatMap((k) => fail(!!q[k], `${q.id}: ${k} empty`)),
          ...fail(q.last_known_source.length > 0, `${q.id}: no last known source`),
          ...q.last_known_source.flatMap((s) =>
            fail(recordIds.has(s) || passageIds.has(s) || plateIds.has(s), `${q.id}: source ${s}`),
          ),
          ...q.evidence.flatMap((e) => fail(evidenceIds.has(e), `${q.id}: evidence ${e}`)),
          ...(q.status === "answered"
            ? fail(q.evidence.length > 0, `${q.id}: answered without evidence`)
            : []),
        ];
        if (ids.has(q.id)) out.push(`${q.id}: duplicate`);
        ids.add(q.id);
        return out;
      });
    },
  },
  {
    name: "the post's own open questions are all here, and only those are marked as the post's",
    run: () => [
      ...discrepancies.flatMap((d) =>
        fail(
          questions.some((q) => q.origin === "post" && q.post_entry === d.id),
          `${d.id}: no question`,
        ),
      ),
      ...questions
        .filter((q) => q.origin === "post")
        .flatMap((q) =>
          fail(
            discrepancies.some((d) => d.id === q.post_entry),
            `${q.id}: no post entry`,
          ),
        ),
    ],
  },
);

// Step 6: the freeze audit. Every ID the site or the model points at
// resolves, and the model's own IDs are frozen: never dropped, never reused.
const frozenPlateIds = new Set(frozenIds.plates.map(([id]) => id));
/** The spoken title and subtitle have fixed IDs of their own, outside the passage freeze. */
const SPOKEN_HEADINGS = new Set(["title", "subtitle"]);
const blockOrPlate = (id: string) =>
  passageIds.has(id) || frozenPlateIds.has(id) || SPOKEN_HEADINGS.has(id);
export const FROZEN_KINDS = [
  "records",
  "entities",
  "questions",
  "evidence",
  "timeline",
  "sources",
  "corrections",
] as const;
type FrozenKind = (typeof FROZEN_KINDS)[number];
type FrozenModel = { frozen_on: string; retired: string[] } & Record<FrozenKind, string[]>;
const frozenModel = FROZEN as FrozenModel;
/** Every ID the model uses, by kind: what scripts/freeze-model.ts freezes. */
export const inUse: Record<FrozenKind, string[]> = {
  records: records.map((r) => r.id),
  entities: entities.map((e) => e.id),
  questions: questions.map((q) => q.id),
  evidence: evidence.map((l) => l.id),
  timeline: timeline.map((t) => t.id),
  sources: namedInText.map((s) => s.id),
  corrections: corrections.map((c) => c.id),
};

/**
 * IDs in use that aren't frozen yet: new entries, frozen at their first
 * publish (the freeze workflow runs scripts/freeze-model.ts after a push to
 * the publishing branch). Reported, not refused, so a new entry made in the
 * CMS can build; a frozen ID that goes missing is refused.
 */
export function provisionalIds(): string[] {
  return FROZEN_KINDS.flatMap((kind) =>
    inUse[kind]
      .filter((id) => !(frozenModel[kind] ?? []).includes(id))
      .map((id) => `${kind} ${id}`),
  );
}

checks.push(
  {
    name: "freeze audit: every audio cue, part boundary, timeline door, plate paragraph and title plate resolves",
    run: () => {
      const cues = CUES as unknown as Record<string, { cues: [string, number, number][] }>;
      return [
        ...Object.entries(cues).flatMap(([part, { cues: list }]) =>
          list
            .filter(([id]) => id !== `${part}-title`)
            .flatMap(([id]) => fail(blockOrPlate(id.replace(/-s\d+$/, "")), `cue ${id}`)),
        ),
        ...PARTS.flatMap((p) =>
          p.lastBlock ? fail(blockOrPlate(p.lastBlock), `${p.id} ends at ${p.lastBlock}`) : [],
        ),
        ...timeline.flatMap((e) =>
          fail(e.plate ? frozenPlateIds.has(e.plate) : !!door(e.quote), `timeline ${e.id}`),
        ),
        ...plates.flatMap((p) =>
          fail(passageIds.has(p.paragraph), `${p.id} sits beside ${p.paragraph}`),
        ),
        ...fail(frozenPlateIds.has(titleImage.plate), `title image ${titleImage.plate}`),
        ...Object.keys(plateImages).flatMap((id) =>
          fail(frozenPlateIds.has(id), `image for ${id}`),
        ),
        ...namedInText.flatMap((n) => fail(!!door(n.quote), `named record ${n.id}`)),
      ];
    },
  },
  {
    name: "the model's IDs are frozen: every frozen ID is in use or retired, none reused, none duplicated",
    run: () =>
      FROZEN_KINDS.flatMap((kind) => [
        ...inUse[kind].flatMap((id, i) =>
          fail(inUse[kind].indexOf(id) === i, `${kind} ${id} is used twice`),
        ),
        ...(frozenModel[kind] ?? []).flatMap((id) =>
          fail(
            inUse[kind].includes(id) || frozenModel.retired.includes(id),
            `${kind} ${id} was frozen and is gone; retire it instead`,
          ),
        ),
        ...inUse[kind].flatMap((id) =>
          fail(!frozenModel.retired.includes(id), `${kind} ${id} is retired`),
        ),
      ]),
  },
);

checks.push(
  {
    name: "timeline events and sources carry well-formed IDs, each in a file named for it; a source with a URL says when it was read",
    run: () => [
      ...Object.entries(timelineFiles).flatMap(([path, t]) =>
        fail(path === `./timeline/${t.id}.json`, `${path}: named for ${t.id}`),
      ),
      ...Object.entries(sourceFiles).flatMap(([path, t]) =>
        fail(path === `./sources/${t.id}.json`, `${path}: named for ${t.id}`),
      ),
      ...timeline.flatMap((t) =>
        fail(/^event-\d{4}(-\d{2}){0,2}(-\d+)?$/.test(t.id), `timeline ${t.id}: malformed ID`),
      ),
      ...namedInText.flatMap((s) => [
        ...fail(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id), `source ${s.id}: malformed ID`),
        ...(s.url
          ? [
              ...fail(/^https?:\/\//.test(s.url), `source ${s.id}: URL ${s.url}`),
              ...fail(
                !!s.accessed && iso.test(s.accessed),
                `source ${s.id}: URL with no accessed date`,
              ),
            ]
          : fail(!s.accessed, `source ${s.id}: accessed date with no URL`)),
      ]),
    ],
  },
  {
    name: "the post's discrepancies are open or closed, never deleted",
    run: () =>
      discrepancies.flatMap((d) => [
        ...fail(["open", "closed"].includes(d.status), `${d.id}: status ${d.status}`),
        // An open one still quotes the published text; a closed one is history.
        ...(d.status === "open"
          ? [
              ...fail(!!door(d.note), `${d.id}: its note is no longer in the post's text`),
              ...fail(!!door(d.close), `${d.id}: its closing line is no longer in the post's text`),
            ]
          : []),
        ...fail(Array.isArray(d.corrections), `${d.id}: no corrections list`),
      ]),
  },
);

checks.push({
  name: "each plate file is named for a plate, and every image in it exists, is measured and has alt text",
  run: () =>
    Object.entries(plateFiles).flatMap(([path, p]) => [
      ...fail(path === `./plates/${p.id}.json`, `${path}: named for ${p.id}`),
      ...fail(
        plates.some((x) => x.id === p.id),
        `${path}: no plate ${p.id}`,
      ),
      ...fail(["draft", "reviewed"].includes(p.alt_status), `${p.id}: alt_status ${p.alt_status}`),
      ...p.images.flatMap((i) => [
        ...fail(exists(`public${i.src}`), `${p.id}: ${i.src} missing`),
        ...fail(
          !!plateImages[p.id] &&
            (plateImages[p.id].set ?? [plateImages[p.id]]).some(
              (m) => m.src === i.src && m.width > 0,
            ),
          `${p.id}: ${i.src} not measured (run npm run measure:images)`,
        ),
        ...fail(i.alt.trim().length > 0, `${p.id}: ${i.src} has no alt text`),
        ...(i.side ? fail(["front", "back"].includes(i.side), `${p.id}: side ${i.side}`) : []),
      ]),
    ]),
});

const fingerprint = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 16);
/**
 * The passages and plate a discrepancy turns on, found in article.md as
 * ingested, so a correction that rewrites the very words it quotes still
 * counts as touching it.
 */
const discrepancyTargets = (d: (typeof discrepancies)[number]) => {
  const inOriginal = (quote: string) => {
    const words = quote.replace(/^…/, "").replace(/…$/, "");
    return [...originalText].find(
      ([id, text]) => !id.startsWith("plate-") && text.includes(words),
    )?.[0];
  };
  return [inOriginal(d.note), inOriginal(d.close), d.plate].filter((x): x is string => !!x);
};

checks.push(
  {
    name: "the published text changes only by correction: article.md still says what it said for every frozen block and caption",
    run: () =>
      Object.entries(PUBLISHED as Record<string, string>).flatMap(([id, hash]) => {
        const text = originalText.get(id);
        if (text === undefined) return [`${id}: gone from article.md`];
        return fail(
          fingerprint(text) === hash,
          `${id}: article.md was edited; propose a correction instead`,
        );
      }),
  },
  {
    name: "each correction is filed under its ID, targets a passage or plate, says what, why, who and when, and is decided by a curator once it leaves the queue",
    run: () => [
      ...Object.entries(correctionFiles).flatMap(([path, c]) =>
        fail(path === `./corrections/${c.id}.json`, `${path}: named for ${c.id}`),
      ),
      ...corrections.flatMap((c) => [
        ...fail(/^c-[a-z0-9]+$/.test(c.id), `${c.id}: malformed ID`),
        ...fail(
          originalText.has(c.target) && !c.target.startsWith("unfrozen-"),
          `${c.id}: no passage or plate ${c.target}`,
        ),
        ...fail(
          ["proposed", "accepted", "applied", "rejected"].includes(c.status),
          `${c.id}: status ${c.status}`,
        ),
        ...fail(!!c.proposed_text?.trim(), `${c.id}: no proposed text`),
        ...fail(!!c.reason?.trim(), `${c.id}: no reason`),
        ...fail(!!c.proposed_by?.trim(), `${c.id}: no proposer`),
        ...fail(iso.test(c.date ?? ""), `${c.id}: date ${c.date}`),
        ...(c.status === "proposed"
          ? []
          : [
              ...fail(!!c.decided_by?.trim(), `${c.id}: ${c.status}, but by nobody`),
              ...fail(iso.test(c.decided_on ?? ""), `${c.id}: ${c.status}, but undated`),
            ]),
      ]),
    ],
  },
  {
    name: "an applied correction keeps the narration in step: the script says the corrected words",
    run: () => {
      const applied = corrections.filter((c) => c.status === "applied");
      if (!applied.length) return [];
      try {
        matchScript();
        const differ = unregisteredDifferences();
        return applied.flatMap((c) =>
          differ.some((d) => d.blocks.includes(c.target))
            ? [
                `${c.id}: the narration script doesn't say the corrected ${c.target}; give its narration_text`,
              ]
            : [],
        );
      } catch (e) {
        return [(e as Error).message];
      }
    },
  },
  {
    name: "a correction that touches one of the post's discrepancies names it, the discrepancy lists it, and one that resolves it closes it",
    run: () => [
      ...corrections.flatMap((c) => {
        const named = discrepancies.find((d) => d.id === c.discrepancy);
        return [
          ...(c.discrepancy ? fail(!!named, `${c.id}: no discrepancy ${c.discrepancy}`) : []),
          ...(c.resolves_discrepancy
            ? fail(!!c.discrepancy, `${c.id}: resolves a discrepancy it doesn't name`)
            : []),
          ...(c.status === "applied"
            ? [
                ...discrepancies.flatMap((d) =>
                  discrepancyTargets(d).includes(c.target)
                    ? fail(
                        c.discrepancy === d.id,
                        `${c.id}: edits ${c.target}, which ${d.id} turns on, without naming it`,
                      )
                    : [],
                ),
                ...(named
                  ? [
                      ...fail(
                        named.corrections.includes(c.id),
                        `${c.id}: ${named.id} doesn't list it`,
                      ),
                      ...(c.resolves_discrepancy
                        ? fail(
                            named.status === "closed",
                            `${c.id}: resolves ${named.id}, which is still open`,
                          )
                        : []),
                    ]
                  : []),
              ]
            : []),
        ];
      }),
      ...discrepancies.flatMap((d) => [
        ...d.corrections.flatMap((id) =>
          fail(
            corrections.some((c) => c.id === id && c.discrepancy === d.id),
            `${d.id}: lists ${id}, which doesn't name it`,
          ),
        ),
        ...(d.status === "closed"
          ? fail(
              corrections.some(
                (c) => c.discrepancy === d.id && c.resolves_discrepancy && c.status === "applied",
              ) || !!d.closed_note?.trim(),
              `${d.id}: closed, but no applied correction resolves it and no closed_note says why`,
            )
          : []),
      ]),
    ],
  },
);

/** Applied corrections whose audio still reads the old words: the curator regenerates it. */
export function audioToRegenerate(): string[] {
  return corrections
    .filter((c) => c.status === "applied" && c.narration_text && !c.audio_regenerated)
    .map((c) => `${c.id} (${c.target})`);
}

export function problems(): string[] {
  return checks.flatMap((c) => c.run().map((p) => `${c.name}: ${p}`));
}
