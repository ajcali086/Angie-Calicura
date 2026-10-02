# Angie — design pilot

Michael Dykhorst's article for Sheridan Wyoming History, _Angelina "Angie" Colacurcio (Calicura) Amato Alexander: A Life of Hospitality, Enterprise and Reinvention_, set in the architecture of [The Spirit of Martinez](https://github.com/ajcali086/spirit-of-martinez).

Original post: https://www.sheridanwyominghistory.com/post/angelina-angie-colacucio-calicura-amato-alexander-a-life-of-hospitality-enterprise-and-reinven

**Preview only.** Every page carries `noindex, nofollow`. There is no production deployment.

## How it's built

- `source/article.md` is the transcript of the post, and nothing on the site is typed from it by hand. It is never edited: the text changes only by correction (see The CMS). `src/data/article.ts` parses the transcript into chapters, passages, quotes, lists and plates.
- `scripts/embed-article.mjs` copies the transcript into `src/data/article.source.ts`, so the browser and the tests read the same file. Rerun it after editing `source/article.md`.
- The museum's hand is marked: the Sources page, under the article's citation, says the article was edited and formatted for presentation here and links the original, unedited post; the footer says the same in one line. The authorship stays Michael Dykhorst's.
- The one editorial choice is where the chapters break. The three titles are the three stations in the post's own subtitle.
- Timeline events, named sources and the Left Open entries quote the post verbatim. Each links back to where the post says it.
- **Ids are frozen.** Share links, audio cues and every link into the text hang on block ids (`2-p13`) and plate ids (`plate-12`). `src/data/frozen-ids.json` pairs each id with its block's opening words, so inserting a paragraph renumbers nothing. After adding a block or plate, run `scripts/freeze-ids.ts` to give it the next unused id. If a paragraph's opening words are edited, update its opening in the file, not its id. If one is removed, move its id to `retired`. `src/data/ids.test.ts` fails if any first-published id goes missing, is reused, or moves out of order.

## The model (H1)

The museum is being retrofitted onto the shared Story & Record model, one step at a time (the H1 retrofit plan). Step 1 is in:

- `src/model/museum.json`: the museum record (rights, credit, a structured consent basis, `id_freeze_date: 2026-09-30`, `schema_version: 1`).
- `src/model/records/`: one file per record (62 at step 1), one per object. 39 plates make 43 (plate 13 is five photographs; plate 31's print, front and back, is one), plus the 13 records the text cites, the 5 audio parts and the narration script. Each is held or not and `verified`, `unverified` or `not-held`, with its credit, rights holder and capture provenance ("unknown" stated, not smoothed) and dated notes.
- `src/model/validate.ts`: the step's gates. `npm test` runs them, and `npm run build` refuses to start if any fails (`npm run check:model`).

Step 2 is in: `src/model/entities/` holds 51 entities, one file each, (23 people, 11 places, 11 businesses, 5 organizations, 1 family). An entity needs both a record that anchors it and a mention in the post. Each alias cites where it's found, and every merge, split or open identity is a dated assertion, drafted for the curator's review. People who share a given name or nickname (two Angelinas, two Sams, three Jacks) carry split assertions, so a later suggestion engine won't propose merging them. Five names the post uses have no record behind them and are held back with the reason (`src/model/held-back.json`), among them "City Marshal Jack Wolfe": in the clipping (plate 21), the account of serving papers is Sheriff Willard Marshall's.

Step 3 is in: `src/model/relationships.json` holds 44 typed edges between entities. 38 are derived from what a record states, each naming its record and whether the caption or the image says it, with the words quoted (caption quotes are checked verbatim). 6 come from the post's prose, each citing its passage, also checked verbatim. 22 record links (`src/model/record-links.json`) say where a record shows an entity (a person in a photograph, a building photographed); every other anchor counts as `documented-in`. Nothing is inferred: no edge rests on plate 8, which doesn't say which Ideal Hotel, and the Tahoe businesses have no location edge because no record or passage places them. `officer-of` (directors, the mayor, commissioners) is a type proposed here, not yet in the spec.

Steps 4 and 5 are in. `src/model/evidence.json` links 54 claims to records, typed: 42 support, 6 contradict, 6 qualify. A claim is a verbatim quote from a passage or a plate's caption, checked against the text, or, once, a claim Spirit of Martinez holds (Virginia Sullivan's birth year), linked without editing it. Where the records contradict the post (171 or 173 North Main, the "City Marshal", Elko, the 1960 move, Tarantino's order), both stand, and every contradiction is carried by an open question. `src/model/questions/` holds nine bounded questions, the post's own two and seven the records raise, and the Left Open page now reads from it: what we know, what we don't, what might answer it, the evidence needed, and the evidence so far.

The model now shows on the site (`src/model/connections.ts`, pure functions over the model):

- **Entity pages** at `/people/<slug>`, `/places/<slug>`, `/businesses/<slug>` and `/organizations/<slug>`: the names an entity goes by, every record that names it (appears in, photographed in, named in), its typed relationships marked as stated by a record or read from the post, the passages that name it in full, its identity decisions with their rationale and status, and the open questions that touch it. No biography; the one-line framing stays empty until the curator writes it.
- **"How this connects"** on plate pages: who is in the picture, what is photographed or named, and up to three nearby plates sharing one of them. A plate that names nothing shows nothing.
- **Status on the page:** an unverified copy (plate 31) carries a marker under its caption, in its zoom view, its archive tile and its share card; plates 33, 35 and 38 say "Not held"; Sources marks the 13 records the post cites as not held and links what each names.

Step 6 closes H1:

- **Narration gate:** the script may differ from the text only by the 19 rules in `NORMALIZATIONS` (`scripts/lib/narration.ts`): numbers spelled out, "Photograph." before captions, listed abbreviations and initialisms, and the "Colacurchio" respelling. Every other difference fails the tests. Limit: a number is checked as present, not for its value.
- **Freeze audit:** every ID the site or the model points at resolves (audio cues, part boundaries, timeline doors, plate paragraphs, the title plate, every model reference). The model's own IDs (62 records, 51 entities, 9 questions, 54 evidence links) are frozen in `src/model/frozen.json` as of 2026-10-01: never dropped, never reused, a withdrawn one retired. After adding to the model, run `scripts/freeze-model.ts`.
- **Export:** `npm run export` writes the museum to `export/angie/` (add `--with-media` to copy the files): the model, the story it rests on, the frozen ID map and a media list with checksums, then re-reads it from those files alone and fails if any reference doesn't resolve.

Local IDs stay as frozen (`2-p13`, `plate-13`); the global form adds the museum prefix (`angie/p/2-p13`).

## Pages

| Route                                                                         | What it is                                                                           |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `/`                                                                           | Title, opening line, the three parts, doors into each room                           |
| `/chapters/$slug`                                                             | The article, in three parts, with its plates inline                                  |
| `/timeline`                                                                   | Every date the post gives for Angie's life, by decade                                |
| `/archive`, `/archive/$id`                                                    | All 39 plates with the post's captions                                               |
| `/sources`                                                                    | The article, the newspapers in the plates, records named in the text, and the thanks |
| `/people/$slug`, `/places/$slug`, `/businesses/$slug`, `/organizations/$slug` | Entity pages, generated from the model                                               |
| `/left-open`                                                                  | Nine open questions: the post's own two, and seven its records raise                 |
| `/admin`                                                                      | The CMS (Sveltia), for the author and the curator                                    |

## Images

38 of the 39 plates have images, web-sized from the original uploads, with plates 12 and 39 from the family's own Kodachrome scans (`src/data/plates/`, one file per plate; sizes are measured from the files by `scripts/measure-images.mjs`). Plate 13 is five photographs of the Ideal Hotel's building, as in the post: the plate shows all five at once (two over three in the article, all five in its archive tile), and its zoom view shows each one whole. Plate 31 is the press print's front and back, side by side; the back carries the handwritten caption the post quotes. Still missing: plate 33, which shows its caption in a frame marked "Image not yet added".

Five more images are the post's own, shown without plate numbers and captioned by its running text (`3-p21`, `3-p22`): Angie's two obituaries (Martinez News-Gazette, December 30, 1986, and Tahoe Daily Tribune, January 2, 1987, each page 2, as the post cites them) and three photographs of her grave marker. Each record carries `shown_at`, the passage that captions it. They are listed under "Shown in the text" in the archive and on the entity pages they name.

## The CMS

`/admin` is a git-backed editor ([Sveltia CMS](https://github.com/sveltia/sveltia-cms), pinned in `public/admin/index.html`, configured in `src/cms/config.yml`). There is no server: it signs in to GitHub with a personal access token, reads the content files, and saves each change as a commit. Vercel rebuilds, and the build's model check refuses anything the museum's rules don't allow. The CMS collects; the pipeline validates.

**IDs read as names.** The files refer to entities, records, passages, plates and evidence links by their frozen IDs (an entity's is eight hex characters, `e8a55e86`). Nobody types or reads those in the CMS: every field that takes one is a dropdown of names, sorted into sets by kind ("Person · Angelina "Angie" Calicura", "Business · Rex Hotel", "Plate 10 · …", "Martinez Girlhood · 1-p6 · …"), and the lists show them the same way, so a relationship reads as a sentence. The file still stores the ID. `src/cms/config.yml` names a set where a field takes an ID (`options: "@entities"`); `scripts/cms-build.ts` fills each set from the model on every dev start and build and writes the served `public/admin/config.yml`, so a new entity is in the lists without anyone editing the config. `scripts/lib/cms.test.ts` checks that every ID the archive stores is offered by its field's dropdown.

**The look.** Stock Sveltia, configured, not forked: the museum's mark (`public/admin/logo.jpg`, squared from the supplied logo) on the sign-in page, the header and the browser tab, and the entry preview set in the site's own type and colours (`public/admin/preview.css`). The editor itself keeps Sveltia's look; changing that would mean a fork, kept for when real use asks for it.

**The ID key** (`/admin/key.html`, generated with the config) lists every entity by kind with its name, ID, slug and page, and every relationship in words: for reading the raw files and the CMS's pull requests, where only the IDs show. `/admin/key.html#e8a55e86` jumps to one.

**What it edits.** One file per entry, so each change is a small commit:

| Collection                                                          | Files                                             | Who                                          |
| ------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------- |
| Corrections                                                         | `src/data/corrections/`                           | Author proposes, curator decides and applies |
| Plates                                                              | `src/data/plates/` (images, alt text, front/back) | Author adds, curator reviews                 |
| Records                                                             | `src/model/records/` (provenance, status)         | Author adds, curator verifies                |
| Entities                                                            | `src/model/entities/` (grouped by kind)           | Author proposes, curator confirms identities |
| Left Open                                                           | `src/model/questions/`                            | Author proposes, curator shapes              |
| Timeline, Sources                                                   | `src/data/timeline/`, `src/data/sources/`         | Author adds, curator verifies                |
| Evidence, Relationships, Shown in, Held back, Discrepancies, Museum | one file each                                     | Curator only                                 |

The post's text is not a collection. A change to it is a **correction**: the passage as it should read, why, who proposed it and when. Only an applied correction changes what readers see; it replaces the passage's text when the article is read, and `source/article.md` keeps the original. The Sources page lists every applied correction with its reason and date. An applied correction carries the narration script's words for its passage (`narration_text`), so the script keeps matching the text; regenerating the audio stays the curator's job, and `npm run check:model` lists the passages whose audio is out of date. A correction that touches one of the post's discrepancies names it, the discrepancy lists it, and one that settles it closes it.

**What the build refuses** (`src/model/validate.ts`):

- an edit to `source/article.md` itself (each block's text is fingerprinted in `src/data/published-text.json`);
- a correction without its passage, text, reason, proposer or date, or decided without a curator and a date;
- an applied correction whose narration doesn't match, or that breaks a quote elsewhere (a timeline event, an evidence link, a discrepancy);
- a correction to a passage a discrepancy turns on that doesn't name it, or a discrepancy out of step with its corrections;
- a frozen ID that goes missing, a rename included (each file is named for its ID, and the check fails if they differ);
- an image without alt text; an evidence link without a curator and date (the CMS fills them in from the signed-in user and today).

**IDs freeze at first publish.** A new ID builds as provisional (the model check lists it). A push to `claude/angie-pilot` runs `.github/workflows/freeze.yml`, which freezes it in `src/model/frozen.json` on the `freeze-ids` branch and opens a pull request (or updates the open one); once the curator merges it, the build refuses to let the ID go missing or be reused. The branch is protected, so the workflow never pushes to it, and it needs Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests".

**Roles are GitHub's to enforce, not the CMS's.** Author collections use the editorial workflow: saving makes a draft, "ready for review" opens a pull request, and "publish" merges it. Curator collections commit straight to the branch. To make that the rule rather than a convention, protect `claude/angie-pilot` in GitHub's branch settings: require a pull request with one approval for everyone but the curator (who may bypass). The author then can't publish, and only the curator's own commits skip review.

**Signing in.** Each person needs a GitHub account with write access to this repository and a fine-grained personal access token for it (Contents and Pull requests: read and write). At `/admin`, choose "Sign In Using Access Token" and paste it. The browser keeps the token; nothing else stores it.

Alt text for the 43 plate images is drafted (`alt_status: draft`) and waits on the curator's review.

## Reading

A scroll meter (a neon hairline across the top of every page) fills as you read down it. A Top button appears once you're well down a page, sits above the player, and hides while the footer is in view. A skip link takes keyboard users past the header. All three are ported from spirit-of-martinez's `ReadingChrome`.

## Light

Light, not motion: the effects animate opacity, glow and colour temperature, each tied to a part of the story, and all of them hold still under `prefers-reduced-motion` (`src/styles.css`, "Light, not motion").

- **Ambient wash:** each part has a faint light behind the page, at 6% or less and static: morning gold for Martinez, the sign's amber for Wyoming, evening blue for Tahoe.
- **The sign:** Part Two's title warms up once, from unlit to an amber glow over 1.2s, then holds. The other titles never move, and nothing on the home page's title screen animates.
- **Reveals:** passages and timeline entries fade in with a 12px rise as they first scroll into view, once (`src/lib/useReveal.ts`, an IntersectionObserver). Plates fade in over 0.4s when their image arrives. At most two of these run at once (`src/lib/motionBudget.ts`); anything more is simply shown.
- **Player:** while playing, a warm ember beside the part's name breathes on a 3s cycle.
- **Home:** the three parts take a warm edge light on hover (pointer devices) or keyboard focus.
- **Still on purpose:** the title-screen photograph, Sources, Left Open, the placeholder plates, share cards and clips, and the navigation. The plate zoom's dark ground fades in; the plate itself doesn't.

## Audio

The article read aloud by a synthetic (text-to-speech) voice, in the five parts listed in `source/audio-part-map.md` (`public/audio/angie-a1.mp3` … `angie-a3b.mp3`, about 52 minutes). These features follow spirit-of-martinez:

- **Labelled as synthetic:** the home page's Listen button says the voice is synthetic and the highlighting is timed by estimate, and both sizes of the player say "Synthetic voice".
- **Player:** docked at the bottom and kept across pages. Play and pause, back and forward 15 seconds, a scrubber, previous and next part, speed, and a Follow switch. It moves on to the next part by itself and remembers where you stopped. While Follow is on, the player shrinks to a slim bar (play, part, progress) and expands when tapped. The part's name is a link to the exact paragraph being read: tapping it opens the chapter there and turns Follow on.
- **Follow-along:** the paragraph being read is highlighted, in step with the audio, and a plate lights up while its caption is read. With Follow on, the page brings each paragraph into view as it begins (a long one from its top) and turns to the next chapter when the narration does. Scrolling by hand turns Follow off and brings back the full player.
- **Listen:** buttons on the home page ("Listen to the article"), at the top of each chapter, beside each timeline, source and Left Open entry, and on plate pages (the passage, or just the caption).
- **Link cards:** "Share this moment" on every paragraph a plate sits beside. It shares an image card (the plate, the passage, a Listen badge), a WAV clip of the passage, and a link that opens the page with a "Listen from this passage" button (`?listen=1#block`). Where a device can't share files, it copies the link.
- **Snippet cards:** each plate page shows the story-sized card for its passage, to share as an image.
- **Zoom:** tap a plate on its own page to see it full size, for reading the small print of a clipping.

**Timing.** The recording was read from `source/narration-script.md`: the article normalized for speech, with numbers written out, "Photograph." before each caption, and abbreviations expanded. It also respells names so the voice says them right: "Colacurchio" is how the script gets "Colacurcio" pronounced. The script is heard, never shown, and a test keeps its respellings out of the page text (`PRONUNCIATIONS` in `scripts/lib/narration.ts`). The script matches the site block for block, with lists read item by item and the thanks read as one line (`scripts/lib/narration.ts`). `scripts/align-audio.ts` times the sentences:

1. It decodes each MP3 in headless Chromium.
2. It finds every pause.
3. It gives each sentence the pause it most plausibly ends on, from its length at the part's speaking rate, preferring longer pauses at paragraph ends.

The result is `src/generated/cues.json`. The page highlights paragraphs, where the timing is surest; sentence times are estimates. `src/data/audio.test.ts` checks the structure: every sentence has exactly one cue, the cues run forward in time, and no sentence of 25 or more printed characters is timed faster than 30 or slower than 6 characters a second. `src/data/narration.test.ts` checks the script against the site (block for block, every caption read as "Photograph. …") and holds the pacing of the spoken text tighter: between 8 and 30 characters a second. Rerun the script if the audio, the script or the transcript changes:

```
node --experimental-strip-types --import ./scripts/test-register.mjs scripts/align-audio.ts
```

## Develop

```
npm install
npm run dev      # http://localhost:8080
node --experimental-strip-types --import ./scripts/test-register.mjs scripts/freeze-ids.ts      # after adding a block or plate
node --experimental-strip-types --import ./scripts/test-register.mjs scripts/snapshot-text.ts   # then fingerprint its text
node --experimental-strip-types --import ./scripts/test-register.mjs scripts/freeze-model.ts    # freeze new model IDs (CI does this on push)
npm run check:model   # the build's gate; lists provisional IDs and stale audio
npm test         # transcript round-trip, links, verbatim quotes, audio cues, cards, corrections, CMS files
npm run typecheck && npm run lint
```

## Title image

The title screen shows plate 39, "Another 1940s photo of Angie from her nephew Andrew Calicura", from the family's own Kodachrome scan, with its caption. `src/data/titleImage.ts` keeps the title screen to the post's plates.
