/**
 * The CMS's generated parts: the named option sets its dropdowns choose
 * from, the served config, and the ID key page.
 *
 * Every reference in the archive is a frozen ID: an entity's eight hex
 * characters, a record's, a passage's, an evidence link's. The files keep
 * them; nobody should have to read them. src/cms/config.yml names a set
 * where a field takes an ID (`options: "@entities"`), and this fills each
 * set from the model, labelled and sorted into groups ("Person · Angelina
 * "Angie" Calicura"), so the dropdown shows names and saves the ID.
 * Generated on every build, so a new entity is in the lists without
 * anyone editing the config.
 */
import { parseDocument } from "yaml";
import { blockText, chapters, plain, plates } from "../../src/data/article.ts";
import { corrections } from "../../src/data/corrections.ts";
import { entities, evidence, records } from "../../src/model/index.ts";
import { entitySection } from "../../src/model/connections.ts";
import type { Entity, MuseumRecord } from "../../src/model/types.ts";

export type Option = { label: string; value: string };

/** The order entities are grouped in, and what each kind is called. */
export const KINDS: [Entity["kind"], string, string][] = [
  ["person", "Person", "People"],
  ["family", "Family", "Families"],
  ["place", "Place", "Places"],
  ["business", "Business", "Businesses"],
  ["organization", "Organization", "Organizations"],
  ["event", "Event", "Events"],
];
const kindLabel = new Map(KINDS.map(([k, one]) => [k, one]));
const kindRank = new Map(KINDS.map(([k], i) => [k, i]));

const clip = (text: string, n = 70) => {
  const t = plain(text).replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};

/** Entities, by kind, then by name. */
export function entityOptions(): Option[] {
  return [...entities]
    .sort(
      (a, b) =>
        (kindRank.get(a.kind) ?? 99) - (kindRank.get(b.kind) ?? 99) ||
        a.label.localeCompare(b.label),
    )
    .map((e) => ({ label: `${kindLabel.get(e.kind) ?? e.kind} · ${e.label}`, value: e.id }));
}

/** Which set a record belongs to, and where it sorts within all records. */
function recordGroup(r: MuseumRecord): { group: string; rank: number } {
  const plate = r.plate ? plates.find((p) => p.id === r.plate) : undefined;
  if (plate) return { group: `Plate ${plate.number}`, rank: plate.number * 100 + (r.part ?? 0) };
  if (r.shown_at) return { group: "In the text", rank: 10_000 };
  if (r.cited) return { group: "Cited", rank: 20_000 };
  if (r.kind === "audio") return { group: "Audio", rank: 30_000 };
  return { group: "Other", rank: 40_000 };
}

/** Records: a plate's in the post's order, then those shown in the text, cited, audio, other. */
export function recordOptions(): Option[] {
  return [...records]
    .map((r) => ({ r, ...recordGroup(r) }))
    .sort((a, b) => a.rank - b.rank || a.r.id.localeCompare(b.r.id))
    .map(({ r, group }) => ({ label: `${group} · ${r.id} — ${clip(r.title, 60)}`, value: r.id }));
}

/** Passages, in reading order, by chapter. */
export function passageOptions(): Option[] {
  return chapters.flatMap((c) =>
    c.blocks.flatMap((b) =>
      b.type === "figure"
        ? []
        : [{ label: `${c.title} · ${b.id} — ${clip(blockText(b))}`, value: b.id }],
    ),
  );
}

/** Plates, by number. */
export function plateOptions(): Option[] {
  return plates.map((p) => ({ label: `Plate ${p.number} — ${clip(p.caption)}`, value: p.id }));
}

/** Evidence links, by ID. */
export function evidenceOptions(): Option[] {
  return evidence.map((l) => ({
    label: `${l.id} · ${l.type} · ${l.record}${l.note ? ` — ${clip(l.note, 50)}` : ""}`,
    value: l.id,
  }));
}

export function correctionOptions(): Option[] {
  return corrections.map((c) => ({
    label: `${c.id} · ${c.target} · ${c.status}`,
    value: c.id,
  }));
}

/**
 * Anything a claim or a name can rest on: passages, then plates, then the
 * records. A plate's record that shares the plate's ID is listed once,
 * under the plate.
 */
export function claimSourceOptions(): Option[] {
  const plateIds = new Set(plates.map((p) => p.id));
  return [
    ...passageOptions().map((o) => ({ ...o, label: `Passage · ${o.label}` })),
    ...plateOptions(),
    ...recordOptions()
      .filter((o) => !plateIds.has(o.value))
      .map((o) => ({ ...o, label: `Record · ${o.label}` })),
  ];
}

/** The named sets src/cms/config.yml may use. */
export function optionSets(): Record<string, Option[]> {
  return {
    "@entities": entityOptions(),
    "@records": recordOptions(),
    "@passages": passageOptions(),
    "@plates": plateOptions(),
    "@passages-and-plates": [...passageOptions(), ...plateOptions()],
    "@claim-sources": claimSourceOptions(),
    "@evidence": evidenceOptions(),
    "@corrections": correctionOptions(),
    // What derived media is made from: the post itself (the narration
    // script's source), or a record (an audio part's script).
    "@derivation-sources": [{ label: "The post · article", value: "article" }, ...recordOptions()],
  };
}

const HEADER = `# Generated by scripts/cms-build.ts from src/cms/config.yml, on every
# dev start and build. Don't edit this file: edit src/cms/config.yml.
`;

/**
 * The served config: src/cms/config.yml with every `options: "@set"`
 * filled in. Throws on a set it doesn't know, so a typo fails the build.
 * The CMS refuses a dropdown with no options, so while a set is empty (no
 * corrections yet) its field is a plain text box, or a list of them, until
 * the set has something in it.
 */
export function buildConfig(source: string): string {
  const doc = parseDocument(source);
  const sets = optionSets();
  const visit = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(visit);
    if (!node || typeof node !== "object") return node;
    const field = node as Record<string, unknown>;
    const set = field.options;
    if (typeof set === "string" && set.startsWith("@")) {
      if (!sets[set]) throw new Error(`src/cms/config.yml: no option set ${set}`);
      if (sets[set].length) return { ...field, options: sets[set] };
      const { options: _options, multiple, widget: _widget, ...rest } = field;
      return multiple
        ? { ...rest, widget: "list", field: { name: "id", label: "ID", widget: "string" } }
        : { ...rest, widget: "string" };
    }
    return Object.fromEntries(Object.entries(field).map(([k, v]) => [k, visit(v)]));
  };
  const filled = visit(doc.toJS({ maxAliasCount: -1 }));
  return HEADER + JSON.stringify(filled, null, 2) + "\n";
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * The ID key: every entity by kind, with its ID and slug, and every
 * relationship and record link in words. For reading the raw files and the
 * CMS's pull requests, where the IDs are all that shows.
 */
export function keyPage(
  relationships: { from: string; type: string; to: string; note?: string }[],
) {
  const byId = new Map(entities.map((e) => [e.id, e]));
  const name = (id: string) => byId.get(id)?.label ?? `(unknown ${id})`;
  const sections = KINDS.flatMap(([kind, , plural]) => {
    const list = entities
      .filter((e) => e.kind === kind)
      .sort((a, b) => a.label.localeCompare(b.label));
    if (!list.length) return [];
    const rows = list
      .map(
        (e) =>
          `<tr id="${e.id}"><td><a href="/${entitySection(e)}/${e.slug}">${esc(e.label)}</a></td><td><code>${e.id}</code></td><td><code>${e.slug}</code></td></tr>`,
      )
      .join("\n");
    return [
      `<h2>${plural} <span>${list.length}</span></h2>\n<table><thead><tr><th>Name</th><th>ID</th><th>Slug</th></tr></thead><tbody>\n${rows}\n</tbody></table>`,
    ];
  });
  const edges = relationships
    .map(
      (r) =>
        `<li><a href="#${r.from}">${esc(name(r.from))}</a> <em>${esc(r.type)}</em> <a href="#${r.to}">${esc(name(r.to))}</a>${r.note ? ` <span>(${esc(r.note)})</span>` : ""} <code>${r.from} → ${r.to}</code></li>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>ID key · Angie</title>
<style>
  :root { color-scheme: light dark; --ink: #1c1917; --muted: #6b6560; --rule: #e7e2dc; --bg: #fbfaf8; --accent: #9a3412; }
  @media (prefers-color-scheme: dark) { :root { --ink: #f2eee9; --muted: #a8a19a; --rule: #34302c; --bg: #161412; --accent: #fb923c; } }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.5 system-ui, sans-serif; }
  main { max-width: 52rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
  h1 { font-size: 1.6rem; margin: 0 0 .25rem; }
  h2 { font-size: 1.05rem; margin: 2rem 0 .5rem; border-bottom: 1px solid var(--rule); padding-bottom: .25rem; }
  h2 span { color: var(--muted); font-weight: normal; }
  p { color: var(--muted); margin: 0 0 1rem; }
  table { width: 100%; border-collapse: collapse; }
  td, th { text-align: left; padding: .3rem .5rem .3rem 0; border-bottom: 1px solid var(--rule); vertical-align: top; }
  th { color: var(--muted); font-weight: normal; font-size: .85rem; }
  code { font-size: .85em; color: var(--muted); }
  td code { white-space: nowrap; } li code { overflow-wrap: anywhere; }
  a { color: var(--accent); }
  ul { padding-left: 1.1rem; } li { margin: .25rem 0; } li span, li code { color: var(--muted); }
  tr:target { background: color-mix(in srgb, var(--accent) 12%, transparent); }
  @media (max-width: 480px) { td:nth-child(3), th:nth-child(3) { display: none; } }
</style>
</head>
<body>
<main>
<h1>ID key</h1>
<p>Every entity the archive names, by kind, with the ID its files use and the slug in its address. Generated from the model on every build. Link to one as <code>/admin/key.html#e8a55e86</code>.</p>
${sections.join("\n")}
<h2>Relationships <span>${relationships.length}</span></h2>
<ul>
${edges}
</ul>
</main>
</body>
</html>
`;
}
