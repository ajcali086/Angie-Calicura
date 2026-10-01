import { existsSync } from "node:fs";
import { plates } from "../data/article.ts";
import { PARTS } from "../data/audio.ts";
import { plateImages } from "../data/plateImages.ts";
import { namedInText } from "../data/sources.ts";
import { museum, records } from "./index.ts";
import { SCHEMA_VERSION } from "./types.ts";

/**
 * The step-1 gates (H1 retrofit plan), as named checks. Each returns the
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

export function problems(): string[] {
  return checks.flatMap((c) => c.run().map((p) => `${c.name}: ${p}`));
}
