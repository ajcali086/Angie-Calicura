import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { article, blockText, chapters, frozenIds, plates } from "../../src/data/article.ts";
import { discrepancies } from "../../src/data/discrepancies.ts";
import { timeline } from "../../src/data/timeline.ts";
import { door } from "../../src/data/article.ts";
import {
  entities,
  evidence,
  heldBack,
  museum,
  questions,
  recordLinks,
  records,
  relationships,
} from "../../src/model/index.ts";
import FROZEN from "../../src/model/frozen.json" with { type: "json" };

/**
 * The museum export (spec §9): the whole model, the story it rests on, the
 * frozen ID map and the media list, as plain JSON in one folder. Nothing in
 * it needs the site's code to be read; `verifyExport` proves that by
 * resolving every reference from the exported files alone.
 */
const repo = new URL("../../", import.meta.url).pathname;

export function exportMuseum(dir: string, opts: { withMedia?: boolean; date?: string } = {}) {
  mkdirSync(dir, { recursive: true });
  const write = (name: string, data: unknown) =>
    writeFileSync(join(dir, name), JSON.stringify(data, null, 2) + "\n");

  const story = {
    title: article.title,
    subtitle: article.subtitle,
    author: article.author,
    source: article.source,
    url: article.url,
    chapters: chapters.map((c) => ({
      slug: c.slug,
      number: c.number,
      title: c.title,
      blocks: c.blocks.map((b) =>
        b.type === "figure"
          ? { type: "figure", plate: b.plate }
          : { type: b.type, id: b.id, text: blockText(b) },
      ),
    })),
    plates: plates.map(({ id, number, caption, chapter, paragraph }) => ({
      id,
      number,
      caption,
      chapter,
      paragraph,
    })),
    timeline: timeline.map((e) => ({
      when: e.when,
      sort: e.sort,
      quote: e.quote,
      ...(e.plate ? { plate: e.plate } : { passage: door(e.quote)?.hash }),
    })),
  };

  const media = records.flatMap((r) =>
    r.media.map((path) => {
      const bytes = readFileSync(join(repo, path));
      if (opts.withMedia) {
        mkdirSync(dirname(join(dir, "media", path)), { recursive: true });
        copyFileSync(join(repo, path), join(dir, "media", path));
      }
      return {
        record: r.id,
        path,
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      };
    }),
  );

  const files = {
    "museum.json": museum,
    "story.json": story,
    "records.json": records,
    "entities.json": { entities, held_back: heldBack },
    "relationships.json": { relationships, record_links: recordLinks },
    "evidence.json": evidence,
    "questions.json": questions.map((q) => {
      const words = discrepancies.find((d) => d.id === q.post_entry);
      return words ? { ...q, post_words: { note: words.note, close: words.close } } : q;
    }),
    "ids.json": {
      passages: frozenIds.blocks,
      plates: frozenIds.plates,
      retired_passages: frozenIds.retired,
      model: FROZEN,
    },
    "media.json": { copied: !!opts.withMedia, files: media },
  };
  for (const [name, data] of Object.entries(files)) write(name, data);
  write("manifest.json", {
    museum: museum.slug,
    schema_version: museum.schema_version,
    exported_on: opts.date ?? new Date().toISOString().slice(0, 10),
    files: Object.keys(files),
    counts: {
      passages: frozenIds.blocks.length,
      plates: plates.length,
      records: records.length,
      entities: entities.length,
      relationships: relationships.length,
      evidence: evidence.length,
      questions: questions.length,
      media: media.length,
    },
  });
  return { dir, files: Object.keys(files).length + 1, media: media.length };
}

/** Reads an export back from its JSON alone and returns every reference that doesn't resolve. */
export function verifyExport(dir: string): string[] {
  const read = (name: string) => JSON.parse(readFileSync(join(dir, name), "utf8"));
  const manifest = read("manifest.json");
  const out: string[] = [];
  for (const f of manifest.files) if (!existsSync(join(dir, f))) out.push(`missing ${f}`);
  const story = read("story.json");
  const records = read("records.json");
  const { entities } = read("entities.json");
  const { relationships, record_links } = read("relationships.json");
  const evidence = read("evidence.json");
  const questions = read("questions.json");
  const ids = read("ids.json");
  const media = read("media.json");

  const passages = new Map<string, string>();
  for (const c of story.chapters) for (const b of c.blocks) if (b.id) passages.set(b.id, b.text);
  const plates = new Map(
    story.plates.map((p: { id: string; caption: string }) => [p.id, p.caption.replace(/\*+/g, "")]),
  );
  const recordIds = new Set(records.map((r: { id: string }) => r.id));
  const entityIds = new Set(entities.map((e: { id: string }) => e.id));
  const evidenceIds = new Set(evidence.map((l: { id: string }) => l.id));
  const miss = (cond: boolean, msg: string) => (cond ? undefined : out.push(msg));

  for (const [id] of ids.passages) miss(passages.has(id), `frozen passage ${id} not in the story`);
  for (const id of passages.keys())
    miss(
      ids.passages.some(([f]: [string]) => f === id),
      `passage ${id} not frozen`,
    );
  for (const p of story.plates) miss(passages.has(p.paragraph), `${p.id} beside ${p.paragraph}`);
  for (const e of story.timeline)
    miss(
      e.plate
        ? plates.has(e.plate)
        : passages.get(e.passage)?.includes(e.quote.replace(/^…|…$/g, "")),
      `timeline ${e.sort}`,
    );
  for (const r of records) if (r.plate) miss(plates.has(r.plate), `${r.id} in ${r.plate}`);
  for (const e of entities)
    for (const a of e.anchors) miss(recordIds.has(a), `${e.slug} anchor ${a}`);
  for (const r of relationships) {
    miss(entityIds.has(r.from) && entityIds.has(r.to), `edge ${r.from} ${r.type} ${r.to}`);
    const p = r.provenance;
    if (p.kind === "derived") miss(recordIds.has(p.record), `edge record ${p.record}`);
    else miss(passages.get(p.passage)?.includes(p.says), `edge passage ${p.passage}`);
  }
  for (const l of record_links)
    miss(entityIds.has(l.entity) && recordIds.has(l.record), `link ${l.entity} ${l.record}`);
  for (const l of evidence) {
    miss(recordIds.has(l.record), `${l.id} record ${l.record}`);
    const c = l.claim;
    if (c.passage)
      miss(passages.get(c.passage)?.includes(c.quote), `${l.id} quote not in ${c.passage}`);
    else if (c.plate)
      miss(
        (plates.get(c.plate) as string | undefined)?.includes(c.quote),
        `${l.id} quote not in ${c.plate}`,
      );
    else miss(!!c.museum && l.holding_museum === c.museum, `${l.id} cross-museum claim`);
  }
  for (const q of questions) {
    for (const s of q.last_known_source)
      miss(passages.has(s) || plates.has(s) || recordIds.has(s), `${q.id} source ${s}`);
    for (const e of q.evidence) miss(evidenceIds.has(e), `${q.id} evidence ${e}`);
    if (q.origin === "post")
      miss(!!q.post_words?.note && !!q.post_words?.close, `${q.id} lacks the post's words`);
  }
  for (const f of media.files) {
    const path = media.copied ? join(dir, "media", f.path) : join(repo, f.path);
    if (!existsSync(path)) {
      out.push(`media ${f.path} missing`);
      continue;
    }
    const sha = createHash("sha256").update(readFileSync(path)).digest("hex");
    miss(sha === f.sha256, `media ${f.path} checksum`);
  }
  return out;
}
