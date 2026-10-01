# Angie — design pilot

Michael Dykhorst's article for Sheridan Wyoming History, _Angelina "Angie" Colacurcio (Calicura) Amato Alexander: A Life of Hospitality, Enterprise and Reinvention_, set in the architecture of [The Spirit of Martinez](https://github.com/ajcali086/spirit-of-martinez).

Original post: https://www.sheridanwyominghistory.com/post/angelina-angie-colacucio-calicura-amato-alexander-a-life-of-hospitality-enterprise-and-reinven

**Preview only.** Every page carries `noindex, nofollow`. There is no production deployment.

## How it's built

- `source/article.md` is the transcript of the post, and nothing on the site is typed from it by hand. `src/data/article.ts` parses the transcript into chapters, passages, quotes, lists and plates.
- `scripts/embed-article.mjs` copies the transcript into `src/data/article.source.ts`, so the browser and the tests read the same file. Rerun it after editing `source/article.md`.
- The museum's hand is marked: the Sources page, under the article's citation, says the article was edited and formatted for presentation here and links the original, unedited post; the footer says the same in one line. The authorship stays Michael Dykhorst's.
- The one editorial choice is where the chapters break. The three titles are the three stations in the post's own subtitle.
- Timeline events, named sources and the Left Open entries quote the post verbatim. Each links back to where the post says it.
- **Ids are frozen.** Share links, audio cues and every link into the text hang on block ids (`2-p13`) and plate ids (`plate-12`). `src/data/frozen-ids.json` pairs each id with its block's opening words, so inserting a paragraph renumbers nothing. After adding a block or plate, run `scripts/freeze-ids.ts` to give it the next unused id. If a paragraph's opening words are edited, update its opening in the file, not its id. If one is removed, move its id to `retired`. `src/data/ids.test.ts` fails if any first-published id goes missing, is reused, or moves out of order.

## The model (H1)

The museum is being retrofitted onto the shared Story & Record model, one step at a time (the H1 retrofit plan). Step 1 is in:

- `src/model/museum.json`: the museum record (rights, credit, a structured consent basis, `id_freeze_date: 2026-09-30`, `schema_version: 1`).
- `src/model/records.json`: 62 records, one per object. 39 plates make 43 (plate 13 is five photographs; plate 31's print, front and back, is one), plus the 13 records the text cites, the 5 audio parts and the narration script. Each is held or not and `verified`, `unverified` or `not-held`, with its credit, rights holder and capture provenance ("unknown" stated, not smoothed) and dated notes.
- `src/model/validate.ts`: the step's gates. `npm test` runs them, and `npm run build` refuses to start if any fails (`npm run check:model`).

Step 2 is in: `src/model/entities.json` holds 51 entities (23 people, 11 places, 11 businesses, 5 organizations, 1 family). An entity needs both a record that anchors it and a mention in the post. Each alias cites where it's found, and every merge, split or open identity is a dated assertion, drafted for the curator's review. People who share a given name or nickname (two Angelinas, two Sams, three Jacks) carry split assertions, so a later suggestion engine won't propose merging them. Five names the post uses have no record behind them and are held back with the reason, among them "City Marshal Jack Wolfe": in the clipping (plate 21), the account of serving papers is Sheriff Willard Marshall's.

Local IDs stay as frozen (`2-p13`, `plate-13`); the global form adds the museum prefix (`angie/p/2-p13`).

## Pages

| Route                      | What it is                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `/`                        | Title, opening line, the three parts, doors into each room                           |
| `/chapters/$slug`          | The article, in three parts, with its plates inline                                  |
| `/timeline`                | Every date the post gives for Angie's life, by decade                                |
| `/archive`, `/archive/$id` | All 39 plates with the post's captions                                               |
| `/sources`                 | The article, the newspapers in the plates, records named in the text, and the thanks |
| `/left-open`               | The two questions the post itself leaves open                                        |

## Images

36 of the 39 plates have images, web-sized from the original uploads, with plates 12 and 39 from the family's own Kodachrome scans (`src/data/plateImages.ts`). Plate 13 is five photographs of the Ideal Hotel's building, as in the post: the plate shows all five at once (two over three in the article, all five in its archive tile), and its zoom view shows each one whole. Plate 31 is the press print's front and back, side by side; the back carries the handwritten caption the post quotes. Still missing:

- plates 33, 35 and 38, which were lost when the fourth media zip was cut off in upload

Those plates show their caption in a frame marked "Image not yet added".

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
node --experimental-strip-types --import ./scripts/test-register.mjs scripts/freeze-ids.ts  # after adding a block or plate
npm test         # transcript round-trip, links, verbatim quotes, audio cues, cards
npm run typecheck && npm run lint
```

## Title image

The title screen shows plate 39, "Another 1940s photo of Angie from her nephew Andrew Calicura", from the family's own Kodachrome scan, with its caption. `src/data/titleImage.ts` keeps the title screen to the post's plates.
